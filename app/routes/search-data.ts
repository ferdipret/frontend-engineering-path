// Everything the search palette needs, fetched once when it is first opened.
import { loadModules } from "~/lib/content.server.ts";
import { buildDocs } from "~/lib/search-docs.server.ts";

export function loader() {
  const modules = loadModules();
  return Response.json(
    {
      docs: buildDocs(modules),
      modules: modules.map((m) => ({ slug: m.slug, title: m.title, stage: m.stage })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
