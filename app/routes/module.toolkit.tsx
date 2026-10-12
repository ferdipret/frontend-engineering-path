import { useEffect } from "react";
import { useLocation } from "react-router";
import type { Route } from "./+types/module.toolkit";
import { loadModule } from "~/lib/content.server.ts";
import { renderInline, renderMarkdown } from "~/lib/markdown.server.ts";
import { slugify } from "~/lib/stats.ts";
import type { TocHandle } from "~/components/Toc.tsx";

export async function loader({ params }: Route.LoaderArgs) {
  const mod = loadModule(params.slug);
  if (!mod) throw new Response("Not found", { status: 404 });
  return {
    sections: await Promise.all(
      mod.toolkit.map(async (t) => ({ id: slugify(t.title), titleHtml: await renderInline(t.title), html: await renderMarkdown(t.md) })),
    ),
  };
}

export const handle: TocHandle = {
  toc: (data) => ({
    entries: (data as Awaited<ReturnType<typeof loader>>).sections.map((s) => ({ id: s.id, label: s.titleHtml.replace(/<[^>]+>/g, "") })),
  }),
};

export default function Toolkit({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [location.hash]);

  if (!loaderData.sections.length) return <p className="empty">No toolkit written for this module yet.</p>;
  return (
    <>
      {loaderData.sections.map((section) => (
        <section className="md" key={section.id}>
          <h2 id={section.id} dangerouslySetInnerHTML={{ __html: section.titleHtml }} />
          <div dangerouslySetInnerHTML={{ __html: section.html }} />
        </section>
      ))}
    </>
  );
}
