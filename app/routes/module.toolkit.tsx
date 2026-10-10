import { useEffect } from "react";
import { useLocation } from "react-router";
import type { Route } from "./+types/module.toolkit";
import { loadModule } from "~/lib/content.server.ts";
import { inline, render } from "~/lib/markdown.ts";
import { slugify } from "~/lib/stats.ts";

export function loader({ params }: Route.LoaderArgs) {
  const mod = loadModule(params.slug);
  if (!mod) throw new Response("Not found", { status: 404 });
  return {
    sections: mod.toolkit.map((t) => ({ id: slugify(t.title), titleHtml: inline(t.title), html: render(t.md) })),
  };
}

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
