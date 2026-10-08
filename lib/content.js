// Parsers for the three kinds of markdown content. See AUTHORING.md for the formats.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PATH_DIR = join(ROOT, 'path');
const GUIDE_DIR = join(ROOT, 'guides');
const QUIZ_DIR = join(ROOT, 'quizzes');

export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// The part of a checklist item before " — " is the skill's name and identity.
export const skillName = (text) => text.split(' — ')[0];

// Repeated names within one file get -2, -3… so ids stay unique.
function uniquer() {
  const seen = new Map();
  return (key) => {
    const n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    return n > 1 ? `${key}-${n}` : key;
  };
}

const readLines = (file) => readFileSync(file, 'utf8').split(/\r?\n/);
const isFence = (line) => /^\s*(```|~~~)/.test(line);

export function parseModule(file) {
  const slug = file.replace(/\.md$/, '');
  const mod = { slug, title: slug, stage: 'Other', summary: '', sections: [] };
  const unique = uniquer();
  let section = null;
  const ensureSection = () => {
    if (!section) {
      section = { title: '', blocks: [] };
      mod.sections.push(section);
    }
    return section;
  };

  for (const raw of readLines(join(PATH_DIR, file))) {
    const line = raw.trim();
    let m;
    if (!line) continue;
    if ((m = line.match(/^# (.+)/))) {
      mod.title = m[1];
    } else if ((m = line.match(/^> Stage: (.+)/))) {
      mod.stage = m[1];
    } else if ((m = line.match(/^> ?(.*)/))) {
      mod.summary += (mod.summary ? ' ' : '') + m[1];
    } else if ((m = line.match(/^## (.+)/))) {
      section = { title: m[1], blocks: [] };
      mod.sections.push(section);
    } else if ((m = line.match(/^[-*] \[[ xX]\] (.+)/))) {
      const key = unique(slugify(skillName(m[1])));
      ensureSection().blocks.push({ type: 'item', id: `${slug}/${key}`, key, text: m[1] });
    } else if ((m = line.match(/^[-*] (.+)/))) {
      ensureSection().blocks.push({ type: 'bullet', text: m[1] });
    } else {
      ensureSection().blocks.push({ type: 'text', text: line });
    }
  }
  return mod;
}

// guides/<slug>.md: "## Toolkit" and "## Skills", each holding "### " entries.
// Skill entries are keyed by the slug of their heading, which must equal a checklist skill name.
export function parseGuide(slug) {
  const file = join(GUIDE_DIR, `${slug}.md`);
  if (!existsSync(file)) return null;
  const guide = { toolkit: [], skills: {}, skillTitles: {} };
  const unique = uniquer();
  let mode = null;
  let entry = null;
  let fenced = false;
  const close = () => {
    if (!entry) return;
    const md = entry.lines.join('\n').trim();
    if (entry.key) guide.skills[entry.key] = md;
    else guide.toolkit.push({ title: entry.title, md });
    entry = null;
  };

  for (const line of readLines(file)) {
    if (isFence(line)) fenced = !fenced;
    let m;
    if (!fenced && (m = line.match(/^## (.+)/))) {
      close();
      const name = m[1].trim().toLowerCase();
      mode = name === 'toolkit' ? 'toolkit' : name === 'skills' ? 'skills' : null;
    } else if (!fenced && mode && (m = line.match(/^### (.+)/))) {
      close();
      entry = { title: m[1].trim(), lines: [] };
      if (mode === 'skills') {
        entry.key = unique(slugify(entry.title));
        guide.skillTitles[entry.key] = entry.title;
      }
    } else if (entry) {
      entry.lines.push(line);
    }
  }
  close();
  return guide;
}

// quizzes/<slug>.md: each "### " heading starts a question. Task-list lines are options
// (exactly one "[x]"), blockquote lines are the explanation or model answer.
export function parseQuiz(slug) {
  const file = join(QUIZ_DIR, `${slug}.md`);
  if (!existsSync(file)) return null;
  const questions = [];
  let q = null;
  let fenced = false;

  for (const line of readLines(file)) {
    if (isFence(line)) fenced = !fenced;
    let m;
    if (!fenced && (m = line.match(/^### (?:\d+[.)]\s*)?(.+)/))) {
      q = { prompt: [m[1].trim()], options: [], answer: [] };
      questions.push(q);
    } else if (!q || (!fenced && /^#{1,2} /.test(line))) {
      continue;
    } else if (!fenced && (m = line.match(/^[-*] \[([ xX])\] (.+)/))) {
      q.options.push({ text: m[2].trim(), correct: m[1] !== ' ' });
    } else if (!fenced && (m = line.match(/^> ?(.*)/))) {
      q.answer.push(m[1]);
    } else {
      // Fenced code after the explanation has started belongs to the explanation.
      (q.answer.length ? q.answer : q.prompt).push(line);
    }
  }
  return questions.map((x) => ({
    prompt: x.prompt.join('\n').trim(),
    options: x.options,
    answer: x.answer.join('\n').trim(),
  }));
}

export const moduleFiles = () =>
  readdirSync(PATH_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

export const itemsOf = (mod) => mod.sections.flatMap((s) => s.blocks.filter((b) => b.type === 'item'));

export function loadModules() {
  return moduleFiles().map((file) => {
    const mod = parseModule(file);
    const guide = parseGuide(mod.slug);
    mod.toolkit = guide?.toolkit ?? [];
    for (const item of itemsOf(mod)) item.guide = guide?.skills[item.key] ?? '';
    mod.quiz = parseQuiz(mod.slug) ?? [];
    return mod;
  });
}
