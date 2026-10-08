// Checks guides and quizzes against the checklist, and optionally that every link resolves.
//   node scripts/validate.ts                 all modules, structure only
//   node scripts/validate.ts 03-css 04-javascript --links
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, itemsOf, moduleFiles, parseGuide, parseModule, parseQuiz, skillName } from "../app/lib/content.server.ts";

const args = process.argv.slice(2);
const checkLinks = args.includes("--links");
const wanted = args.filter((a) => !a.startsWith("--")).map((a) => a.replace(/\.md$/, ""));

const MIN_QUESTIONS = 18;
const MIN_MULTIPLE_CHOICE = 12;
const MIN_OPEN = 4;
const MIN_SKILL_WORDS = 90;
const TOOLKIT_SECTIONS = ["DevTools and tooling", "Testing and verifying your work", "Tricks and gotchas", "Official references"];

const LINK = /\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
const wordCount = (md: string) => md.split(/\s+/).filter(Boolean).length;

let errors = 0;
let warnings = 0;
const error = (slug: string, msg: string) => {
  errors++;
  console.log(`  ERROR  ${slug}: ${msg}`);
};
const warn = (slug: string, msg: string) => {
  warnings++;
  console.log(`  warn   ${slug}: ${msg}`);
};

const files = moduleFiles().filter((f) => !wanted.length || wanted.includes(f.replace(/\.md$/, "")));
if (!files.length) {
  console.log("No matching modules.");
  process.exit(1);
}

const urls = new Map<string, Set<string>>(); // url -> files that use it

for (const file of files) {
  const mod = parseModule(file);
  const slug = mod.slug;
  const items = itemsOf(mod);
  console.log(`${slug} (${items.length} skills)`);

  const guide = parseGuide(slug);
  if (!guide) {
    error(slug, "guides file is missing");
  } else {
    for (const title of TOOLKIT_SECTIONS) {
      const section = guide.toolkit.find((t) => t.title.toLowerCase() === title.toLowerCase());
      if (!section) error(slug, `toolkit section "### ${title}" is missing`);
      else if (wordCount(section.md) < 40) error(slug, `toolkit section "${title}" is too thin`);
    }
    const keys = new Set(items.map((i) => i.key));
    for (const item of items) {
      const md = guide.skills[item.key];
      const name = skillName(item.text);
      if (md === undefined) {
        error(slug, `no guide entry for skill "### ${name}"`);
        continue;
      }
      if (wordCount(md) < MIN_SKILL_WORDS) error(slug, `guide entry "${name}" is under ${MIN_SKILL_WORDS} words`);
      if (!md.match(LINK)) error(slug, `guide entry "${name}" has no resource link`);
      if (/^#{1,6} /m.test(md.replace(/```[\s\S]*?```/g, ""))) error(slug, `guide entry "${name}" contains a heading`);
    }
    for (const key of Object.keys(guide.skills)) {
      if (!keys.has(key)) error(slug, `guide entry "### ${guide.skillTitles[key]}" does not match any checklist skill`);
    }
  }

  const quiz = parseQuiz(slug);
  if (!quiz) {
    error(slug, "quizzes file is missing");
  } else {
    const mc = quiz.filter((q) => q.options.length);
    const open = quiz.filter((q) => !q.options.length);
    if (quiz.length < MIN_QUESTIONS) error(slug, `quiz has ${quiz.length} questions, need at least ${MIN_QUESTIONS}`);
    if (mc.length < MIN_MULTIPLE_CHOICE) error(slug, `quiz has ${mc.length} multiple-choice questions, need at least ${MIN_MULTIPLE_CHOICE}`);
    if (open.length < MIN_OPEN) error(slug, `quiz has ${open.length} open questions, need at least ${MIN_OPEN}`);
    quiz.forEach((q, i) => {
      const label = `question ${i + 1}`;
      if (!q.answer) error(slug, `${label} has no "> " explanation or model answer`);
      if (!q.options.length) return;
      if (q.options.length < 3) error(slug, `${label} has fewer than 3 options`);
      const correct = q.options.filter((o) => o.correct).length;
      if (correct !== 1) error(slug, `${label} has ${correct} options marked [x], need exactly 1`);
    });
    const positions = mc.map((q) => q.options.findIndex((o) => o.correct));
    if (mc.length >= 8 && new Set(positions).size < 3) warn(slug, "correct answers sit in too few positions; shuffle them");
  }

  for (const dir of ["path", "guides", "quizzes"]) {
    const rel = `${dir}/${slug}.md`;
    if (!existsSync(join(ROOT, rel))) continue;
    for (const m of readFileSync(join(ROOT, rel), "utf8").matchAll(LINK)) {
      const url = m[1]!;
      if (!urls.has(url)) urls.set(url, new Set());
      urls.get(url)!.add(rel);
    }
  }
}

// Some sites only answer browser-like requests; others (w3.org) reject a browser User-Agent
// that doesn't come from a browser. Try both before giving up.
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
  "Accept-Language": "en",
};
const PLAIN_HEADERS = { "User-Agent": "fe-path-link-check/1.0" };

async function probe(url: string): Promise<number | string> {
  const attempt = async (headers: Record<string, string> = BROWSER_HEADERS) => {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000), headers });
    await res.body?.cancel();
    return res.status;
  };
  try {
    const status = await attempt();
    if ([401, 403, 429].includes(status)) return await attempt(PLAIN_HEADERS);
    return status >= 500 ? await attempt() : status;
  } catch (err) {
    try {
      return await attempt();
    } catch {
      const e = err as { cause?: { code?: string }; name?: string };
      return e.cause?.code ?? e.name ?? "error";
    }
  }
}

if (checkLinks) {
  const list = [...urls.keys()];
  console.log(`\nChecking ${list.length} links…`);
  // One request at a time per host, with a pause between them, so large runs don't trip rate limits.
  const byHost = new Map<string, string[]>();
  for (const url of list) {
    const host = new URL(url).host;
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host)!.push(url);
  }
  const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const hosts = [...byHost.values()];
  let next = 0;
  await Promise.all(
    Array.from({ length: 12 }, async () => {
      while (next < hosts.length) {
        for (const url of hosts[next++]!) {
          let status = await probe(url);
          if (status === 429) {
            await pause(20000);
            status = await probe(url);
          }
          await pause(150);
          if (status === 200) continue;
          const where = [...urls.get(url)!].join(", ");
          // Sites that block scripted requests can't be judged from here; a browser may still load them.
          const blocked = [401, 403, 429, 999].includes(status as number) || status === "TimeoutError";
          if (blocked) warn(where, `could not verify (${status}) ${url}`);
          else error(where, `broken link (${status}) ${url}`);
        }
      }
    }),
  );
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
