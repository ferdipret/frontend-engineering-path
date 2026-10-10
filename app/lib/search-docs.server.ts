// Turns the parsed modules into flat search documents for the client-side index.
import type { Doc } from "./search.ts";
import type { Module } from "./content.server.ts";
import { plain } from "./markdown.ts";
import { slugify, splitItem } from "./stats.ts";

const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const untick = (s: string) => s.replace(/`/g, "");

export function buildDocs(modules: Module[]): Doc[] {
  const docs: Doc[] = [];
  const seenLinks = new Set<string>();
  const addLinks = (md: string, mod: Module, from: string, where: string) => {
    for (const [, label = "", url = ""] of md.matchAll(LINK)) {
      if (seenLinks.has(url)) continue;
      seenLinks.add(url);
      docs.push({
        type: "link",
        title: untick(label),
        desc: url.replace(/^https?:\/\/(www\.)?/, ""),
        ctx: where,
        body: "",
        href: url,
        from,
        mod: mod.slug,
      });
    }
  };

  for (const mod of modules) {
    docs.push({ type: "module", title: mod.title, desc: mod.summary, ctx: mod.stage, body: "", href: `/${mod.slug}`, mod: mod.slug });
    for (const section of mod.sections) {
      for (const block of section.blocks) {
        if (block.type !== "item") {
          addLinks(block.text, mod, `/${mod.slug}`, mod.title);
          continue;
        }
        const { what, why } = splitItem(block.text);
        docs.push({
          type: "skill",
          id: block.id,
          title: untick(what),
          desc: untick(why),
          ctx: `${mod.title} › ${section.title}`,
          body: plain(block.guide),
          href: `/${mod.slug}#${block.key}`,
          mod: mod.slug,
        });
        addLinks(block.guide, mod, `/${mod.slug}#${block.key}`, `${mod.title} › ${untick(what)}`);
      }
    }
    for (const section of mod.toolkit) {
      const href = `/${mod.slug}/toolkit#${slugify(section.title)}`;
      docs.push({ type: "toolkit", title: section.title, desc: "", ctx: `${mod.title} › Toolkit`, body: plain(section.md), href, mod: mod.slug });
      addLinks(section.md, mod, href, `${mod.title} › Toolkit`);
    }
    mod.quiz.forEach((q, i) => {
      const [first = "", ...rest] = q.prompt.split("\n");
      docs.push({
        type: "quiz",
        title: untick(first),
        desc: "",
        ctx: `${mod.title} › Practice test · Q${i + 1}`,
        body: plain(rest.join("\n")),
        href: `/${mod.slug}/quiz#q-${i + 1}`,
        mod: mod.slug,
      });
    });
  }
  return docs;
}
