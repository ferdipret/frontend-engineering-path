// Markdown rendering: remark parses, rehype renders, shiki highlights code.
// Rendered HTML is cached by source text, since the same guide entries are rendered on every request.
import rehypeShiki from "@shikijs/rehype";
import type { Root } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import type { ShikiTransformer } from "shiki";
import { unified } from "unified";

// Labels each code block with its language so the stylesheet can show it.
const languageLabel: ShikiTransformer = {
  pre(node) {
    node.properties["data-lang"] = this.options.lang;
  },
};

const parser = unified().use(remarkParse).use(remarkGfm);

const renderer = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeExternalLinks, { target: "_blank", rel: ["noopener"] })
  .use(rehypeShiki, {
    // Both palettes are emitted as CSS variables; the stylesheet picks one per theme.
    themes: { light: "github-light-default", dark: "github-dark-default" },
    defaultColor: false,
    fallbackLanguage: "text",
    transformers: [languageLabel],
  })
  .use(rehypeStringify);

const cache = new Map<string, Promise<string>>();

/** Parses markdown into an mdast tree. */
export const parseMarkdown = (md: string): Root => parser.parse(md);

/** Renders markdown to HTML. */
export function renderMarkdown(md: string): Promise<string> {
  let html = cache.get(md);
  if (!html) {
    html = renderer.process(md).then(String);
    cache.set(md, html);
  }
  return html;
}

/** Renders a single line of markdown without the wrapping paragraph. */
export async function renderInline(md: string): Promise<string> {
  const html = (await renderMarkdown(md)).trim();
  return html.replace(/^<p>([\s\S]*)<\/p>$/, "$1");
}

/** Markdown reduced to its text, for search indexing and snippets. */
export const toPlainText = (md: string) => mdastToString(parseMarkdown(md)).replace(/\s+/g, " ").trim();
