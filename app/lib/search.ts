// Client-side search over everything: modules, skills, guide text, toolkits, quiz questions, and links.
// Ranking is field-weighted; terms match by exact word, stem, prefix, infix, alias, and (as a
// fallback for typos) edit distance. Filters: is:done|todo, type:skill|module|toolkit|quiz|link, in:<module>.

export type DocType = "module" | "skill" | "toolkit" | "quiz" | "link";
type Field = "title" | "desc" | "ctx" | "body";

/** A searchable document. Built on the server; `lower` and `titleStems` are added when indexing. */
export type Doc = {
  type: DocType;
  title: string;
  desc: string;
  ctx: string;
  body: string;
  href: string;
  mod: string;
  id?: string;
  from?: string;
};

type IndexedDoc = Doc & { lower: Record<Field, string>; titleStems: string[] };

export type SearchIndex = {
  docs: IndexedDoc[];
  postings: Map<string, Map<number, number>>;
  vocab: { w: string; stem: string }[];
  modules: { slug: string; title: string; stage: string }[];
  cache: Map<string, Map<number, number>>;
};

export type SearchResult = { doc: Doc; score: number };

const FIELD_WEIGHT: Record<Field, number> = { title: 12, desc: 5, ctx: 3, body: 1 };
const FIELDS = Object.keys(FIELD_WEIGHT) as Field[];
const TYPE_BOOST: Record<DocType, number> = { module: 1.2, skill: 1, toolkit: 0.9, quiz: 0.7, link: 0.6 };
const TYPE_ALIASES: Record<string, DocType> = {
  skills: "skill",
  modules: "module",
  tools: "toolkit",
  test: "quiz",
  tests: "quiz",
  question: "quiz",
  links: "link",
  resource: "link",
  resources: "link",
  docs: "link",
};

// Shorthand people type, mapped to what the content says.
const ALIASES: Record<string, string[]> = {
  a11y: ["accessibility"],
  i18n: ["internationalization"],
  l10n: ["localization"],
  js: ["javascript"],
  ts: ["typescript"],
  perf: ["performance"],
  auth: ["authentication", "authorization"],
  deps: ["dependencies"],
  env: ["environment"],
  regex: ["regular expressions"],
  sw: ["service worker"],
  ws: ["websockets"],
  rwd: ["responsive"],
  dnd: ["drag and drop"],
  rsc: ["server components"],
  ssr: ["server-side rendering"],
  csr: ["client-side rendering"],
  ssg: ["static generation"],
  cwv: ["core web vitals"],
  e2e: ["end-to-end"],
  gc: ["garbage collection"],
  hmr: ["hot module replacement"],
  vdom: ["virtual dom"],
  sr: ["screen reader"],
  pr: ["pull request"],
  mfe: ["micro-frontends"],
  sop: ["same-origin policy"],
  tdd: ["red-green-refactor"],
};

const STOPWORDS = new Set("a an and are as at be by can do does for from how i in is it my of on or the to vs what when which why with".split(" "));

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Folds British and American spellings onto one key. Applied to both the index and the query,
// so it only has to be consistent, not linguistically right.
const norm = (w: string) =>
  w
    .replace(/is(e|ed|es|ing|er|ers|ation|ations)$/, "iz$1")
    .replace(/ys(e|ed|es|ing)$/, "yz$1")
    .replace(/^(.{3,})our(s|ed|ing)?$/, "$1or$2")
    .replace(/^centre/, "center")
    .replace(/^licence/, "license");

const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "").replace(/e$/, "") : w);
const words = (s: string) => (fold(s).match(/[a-z0-9]+/g) ?? []).map(norm);

// Edit distance, giving up once it exceeds max.
function within(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (row[j]! < best) best = row[j]!;
    }
    if (best > max) return false;
    prev = row;
  }
  return prev[b.length]! <= max;
}

export function buildIndex(docs: Doc[], modules: SearchIndex["modules"]): SearchIndex {
  const postings = new Map<string, Map<number, number>>();
  const indexed = docs.map((doc, i) => {
    const lower = {} as Record<Field, string>;
    for (const field of FIELDS) {
      lower[field] = fold(doc[field]);
      for (const w of words(doc[field])) {
        let posting = postings.get(w);
        if (!posting) postings.set(w, (posting = new Map()));
        if ((posting.get(i) ?? 0) < FIELD_WEIGHT[field]) posting.set(i, FIELD_WEIGHT[field]);
      }
    }
    const titleStems = words(doc.title).filter((w) => !STOPWORDS.has(w)).map(stem);
    return { ...doc, lower, titleStems };
  });
  const vocab = [...postings.keys()].map((w) => ({ w, stem: stem(w) }));
  return { docs: indexed, postings, vocab, modules, cache: new Map() };
}

// Score every doc for one query term. Returns Map(doc index -> score).
function termScores(index: SearchIndex, term: string): Map<number, number> {
  const cached = index.cache.get(term);
  if (cached) return cached;
  const scores = new Map<number, number>();
  const bump = (i: number, score: number) => {
    if ((scores.get(i) ?? 0) < score) scores.set(i, score);
  };
  const viaWord = (w: string, quality: number) => {
    for (const [i, weight] of index.postings.get(w) ?? []) bump(i, weight * quality);
  };
  const viaPhrase = (phrase: string, quality: number) => {
    index.docs.forEach((doc, i) => {
      for (const field of FIELDS) {
        if (doc.lower[field].includes(phrase)) {
          bump(i, FIELD_WEIGHT[field] * quality);
          break;
        }
      }
    });
  };
  const viaVocab = (raw: string, scale: number) => {
    const t = norm(raw);
    const s = stem(t);
    let strong = false;
    for (const v of index.vocab) {
      let q = 0;
      if (v.w === t) q = 1;
      else if (s.length >= 3 && v.stem === s) q = 0.8;
      else if (t.length >= 2 && v.w.startsWith(t)) q = 0.7;
      else if (t.length >= 3 && v.w.includes(t)) q = 0.45;
      if (!q) continue;
      if (q >= 0.7) strong = true;
      viaWord(v.w, q * scale);
    }
    // Typo tolerance only kicks in when nothing matched properly.
    if (!strong && t.length >= 4) {
      const max = t.length >= 8 ? 2 : 1;
      for (const v of index.vocab) {
        if (v.w[0] === t[0] && within(t, v.w, max)) viaWord(v.w, 0.35 * scale);
      }
    }
  };

  const folded = fold(term);
  if (/^[a-z0-9]+$/.test(folded)) {
    viaVocab(folded, 1);
    for (const alt of ALIASES[folded] ?? []) {
      if (/^[a-z0-9]+$/.test(alt)) viaVocab(alt, 0.9);
      else viaPhrase(alt, 0.85);
    }
  } else {
    // Punctuated terms (aria-live, :has(), font-display) and quoted phrases match literally.
    viaPhrase(folded, 0.9);
  }
  index.cache.set(term, scores);
  return scores;
}

export function parseQuery(query: string) {
  const terms: string[] = [];
  const filters: { is?: string; type?: string; in?: string } = {};
  for (const [, phrase, token] of query.matchAll(/"([^"]+)"?|(\S+)/g)) {
    const m = token?.match(/^(is|type|in):(.+)$/i);
    if (m) filters[m[1]!.toLowerCase() as "is" | "type" | "in"] = fold(m[2]!);
    else terms.push((phrase ?? token ?? "").trim());
  }
  if (filters.type) filters.type = TYPE_ALIASES[filters.type] ?? filters.type;
  return { terms: terms.filter(Boolean), filters };
}

/** Ranked results for the query. `done` is the map of completed skill ids. */
export function search(index: SearchIndex, query: string, done: Record<string, string>) {
  const { terms, filters } = parseQuery(query);
  if (!terms.length && !Object.keys(filters).length) return { results: [] as SearchResult[], terms };

  const allowed = (doc: IndexedDoc) => {
    if (filters.type && doc.type !== filters.type) return false;
    if (filters.is) {
      if (doc.type !== "skill") return false;
      const wantDone = filters.is === "done";
      if (!wantDone && filters.is !== "todo") return false;
      if (!!done[doc.id!] !== wantDone) return false;
    }
    if (filters.in) {
      const mod = index.modules.find((m) => m.slug === doc.mod);
      if (!mod || !fold(`${mod.slug} ${mod.title} ${mod.stage}`).includes(filters.in)) return false;
    }
    return true;
  };

  const results: SearchResult[] = [];
  if (!terms.length) {
    index.docs.forEach((doc) => allowed(doc) && results.push({ doc, score: 0 }));
    return { results, terms };
  }

  // Filler words are dropped from longer queries so "how to test a service worker" works.
  const meaningful = terms.filter((t) => !STOPWORDS.has(fold(t)));
  const used = meaningful.length ? meaningful : terms;
  const perTerm = used.map((t) => termScores(index, t));
  const phrase = fold(terms.join(" "));
  const queryStems = new Set(used.flatMap(words).map(stem));
  // Queries of three or more terms may miss one; shorter ones must match every term.
  const required = used.length >= 3 ? used.length - 1 : used.length;
  const candidates = new Set(perTerm.flatMap((scores) => [...scores.keys()]));
  for (const i of candidates) {
    const doc = index.docs[i]!;
    if (!allowed(doc)) continue;
    let score = 0;
    let matched = 0;
    for (const scores of perTerm) {
      const s = scores.get(i);
      if (s) {
        score += s;
        matched++;
      }
    }
    if (matched < required) continue;
    score *= (matched / used.length) ** 2;
    const title = doc.lower.title;
    if (title === phrase) score += 20;
    else if (title.startsWith(phrase)) score += 8;
    else if (title.includes(phrase)) score += 5;
    // A short title made up entirely of query words is very likely what was meant.
    else if (doc.titleStems.length && doc.titleStems.every((s) => queryStems.has(s))) score += 8;
    results.push({ doc, score: score * TYPE_BOOST[doc.type] });
  }
  results.sort((a, b) => b.score - a.score);
  return { results, terms: used };
}
