// Readers for the three kinds of content file. See AUTHORING.md for the formats.
// Structure (modules, sections, skills, guide entries, questions) comes from the markdown AST;
// the markdown inside each piece is kept as source text and rendered later.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Blockquote, Heading, ListItem, Node, Root, RootContent } from "mdast";
import { gfmToMarkdown } from "mdast-util-gfm";
import { toMarkdown } from "mdast-util-to-markdown";
import { toString as mdastToString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import { parseMarkdown } from "./markdown.server.ts";

export const ROOT = process.cwd();
const PATH_DIR = join(ROOT, "path");
const GUIDE_DIR = join(ROOT, "guides");
const QUIZ_DIR = join(ROOT, "quizzes");

export type Item = { type: "item"; id: string; key: string; text: string; guide: string };
export type Block = Item | { type: "bullet"; text: string } | { type: "text"; text: string };
export type Section = { title: string; blocks: Block[] };
export type ToolkitSection = { title: string; md: string };
export type QuizOption = { text: string; correct: boolean };
export type Question = { prompt: string; options: QuizOption[]; answer: string };
export type Module = {
  slug: string;
  title: string;
  stage: string;
  summary: string;
  sections: Section[];
  toolkit: ToolkitSection[];
  quiz: Question[];
};
export type Guide = { toolkit: ToolkitSection[]; skills: Record<string, string>; skillTitles: Record<string, string> };

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// The part of a checklist item before " - " is the skill's name and identity.
export const skillName = (text: string) => text.split(" - ")[0] ?? text;

// Repeated names within one file get -2, -3… so ids stay unique.
function uniquer() {
  const seen = new Map<string, number>();
  return (key: string) => {
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    return n > 1 ? `${key}-${n}` : key;
  };
}

/** The source text of a node, so inline markdown survives. */
const source = (src: string, node: Node) => src.slice(node.position!.start.offset, node.position!.end.offset);

/** The source text inside a node, without its own marker (the "## " of a heading, the "- " of an item). */
function inner(src: string, node: Heading | ListItem): string {
  const first = node.children[0];
  const last = node.children[node.children.length - 1];
  if (!first || !last) return "";
  // A task item's paragraph starts with its checkbox marker; the marker isn't content.
  if (node.type === "listItem") return source(src, first).replace(/^\[[ xX]\]\s*/, "").trim();
  return src.slice(first.position!.start.offset, last.position!.end.offset).trim();
}

/** Nodes back to markdown, for pieces we can't slice from the source (blockquote contents). */
const markdown = (nodes: RootContent[]) => toMarkdown({ type: "root", children: nodes }, { extensions: [gfmToMarkdown()] }).trim();

// Deliberately not a type guard: a false result must not rule out other heading depths.
const isHeading = (node: Node, depth: number) => node.type === "heading" && (node as Heading).depth === depth;
const isTask = (item: ListItem) => item.checked === true || item.checked === false;

/** path/<slug>.md: a title, a stage and summary blockquote, "## " sections holding task-list skills. */
export function parseModule(file: string): Module {
  const slug = file.replace(/\.md$/, "");
  const src = readFileSync(join(PATH_DIR, file), "utf8");
  const mod: Module = { slug, title: slug, stage: "Other", summary: "", sections: [], toolkit: [], quiz: [] };
  const unique = uniquer();
  let section: Section | null = null;
  const current = () => {
    if (!section) mod.sections.push((section = { title: "", blocks: [] }));
    return section;
  };

  for (const node of parseMarkdown(src).children) {
    if (isHeading(node, 1)) {
      mod.title = mdastToString(node);
    } else if (node.type === "blockquote" && !mod.sections.length) {
      // "> Stage: …" on the first line, the summary on the rest.
      const lines = source(src, node)
        .split(/\r?\n/)
        .map((l) => l.replace(/^>\s?/, "").trim())
        .filter(Boolean);
      for (const line of lines) {
        const stage = line.match(/^Stage: (.+)/);
        if (stage) mod.stage = stage[1]!;
        else mod.summary += (mod.summary ? " " : "") + line;
      }
    } else if (isHeading(node, 2)) {
      mod.sections.push((section = { title: inner(src, node as Heading), blocks: [] }));
    } else if (node.type === "list") {
      for (const item of node.children) {
        const text = inner(src, item);
        if (isTask(item)) {
          const key = unique(slugify(skillName(text)));
          current().blocks.push({ type: "item", id: `${slug}/${key}`, key, text, guide: "" });
        } else current().blocks.push({ type: "bullet", text });
      }
    } else {
      current().blocks.push({ type: "text", text: source(src, node).trim() });
    }
  }
  return mod;
}

/** guides/<slug>.md: "## Toolkit" and "## Skills", each holding "### " entries whose bodies are markdown. */
export function parseGuide(slug: string): Guide | null {
  const file = join(GUIDE_DIR, `${slug}.md`);
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  const guide: Guide = { toolkit: [], skills: {}, skillTitles: {} };
  const unique = uniquer();
  let mode: "toolkit" | "skills" | null = null;
  // Kept in an object so the closure below and the loop see the same value.
  const state: { entry: { title: string; start: number; end: number } | null } = { entry: null };
  const close = () => {
    const entry = state.entry;
    if (!entry) return;
    const md = src.slice(entry.start, entry.end).trim();
    if (mode === "toolkit") guide.toolkit.push({ title: entry.title, md });
    else {
      const key = unique(slugify(entry.title));
      guide.skills[key] = md;
      guide.skillTitles[key] = entry.title;
    }
    state.entry = null;
  };

  for (const node of parseMarkdown(src).children) {
    if (isHeading(node, 2)) {
      close();
      const name = mdastToString(node).trim().toLowerCase();
      mode = name === "toolkit" ? "toolkit" : name === "skills" ? "skills" : null;
    } else if (isHeading(node, 3) && mode) {
      close();
      state.entry = { title: inner(src, node as Heading), start: node.position!.end.offset!, end: node.position!.end.offset! };
    } else if (state.entry) {
      state.entry.end = node.position!.end.offset!;
    }
  }
  close();
  return guide;
}

/** quizzes/<slug>.md: each "### " heading starts a question; a task list holds the options and a blockquote the answer. */
export function parseQuiz(slug: string): Question[] | null {
  const file = join(QUIZ_DIR, `${slug}.md`);
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  const questions: Question[] = [];
  let q: Question | null = null;
  let answered = false;

  for (const node of parseMarkdown(src).children) {
    if (isHeading(node, 3)) {
      q = { prompt: inner(src, node as Heading).replace(/^\d+[.)]\s*/, ""), options: [], answer: "" };
      questions.push(q);
      answered = false;
    } else if (!q || node.type === "heading") {
      continue;
    } else if (node.type === "list" && node.children.every(isTask)) {
      q.options = node.children.map((item) => ({ text: inner(src, item), correct: item.checked === true }));
    } else if (node.type === "blockquote") {
      q.answer += (q.answer ? "\n\n" : "") + markdown((node as Blockquote).children);
      answered = true;
    } else if (answered) {
      // Anything after the explanation has started belongs to it.
      q.answer += `\n\n${source(src, node).trim()}`;
    } else {
      q.prompt += `\n\n${source(src, node).trim()}`;
    }
  }
  return questions;
}

/** Every link URL in a piece of markdown. */
export function linksIn(md: string): string[] {
  const urls: string[] = [];
  visit(parseMarkdown(md), "link", (node) => {
    urls.push(node.url);
  });
  return urls;
}

/** Whether a piece of markdown contains a heading (code blocks don't count). */
export function hasHeading(md: string): boolean {
  let found = false;
  visit(parseMarkdown(md) as Root, "heading", () => {
    found = true;
  });
  return found;
}

export const moduleFiles = () =>
  readdirSync(PATH_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

export const itemsOf = (mod: Module): Item[] =>
  mod.sections.flatMap((s) => s.blocks.filter((b): b is Item => b.type === "item"));

// Parsing every file takes tens of milliseconds, so the result is kept until any content file changes.
let cache: { signature: string; modules: Module[] } | null = null;

function signature(): string {
  const parts: string[] = [];
  for (const dir of [PATH_DIR, GUIDE_DIR, QUIZ_DIR]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) parts.push(f, String(statSync(join(dir, f)).mtimeMs));
  }
  return parts.join("|");
}

export function loadModules(): Module[] {
  const sig = signature();
  if (cache && cache.signature === sig) return cache.modules;
  const modules = parseAll();
  cache = { signature: sig, modules };
  return modules;
}

function parseAll(): Module[] {
  return moduleFiles().map((file) => {
    const mod = parseModule(file);
    const guide = parseGuide(mod.slug);
    mod.toolkit = guide?.toolkit ?? [];
    for (const item of itemsOf(mod)) item.guide = guide?.skills[item.key] ?? "";
    mod.quiz = parseQuiz(mod.slug) ?? [];
    return mod;
  });
}

export function loadModule(slug: string): Module | null {
  if (!/^[\w-]+$/.test(slug) || !existsSync(join(PATH_DIR, `${slug}.md`))) return null;
  return loadModules().find((m) => m.slug === slug) ?? null;
}
