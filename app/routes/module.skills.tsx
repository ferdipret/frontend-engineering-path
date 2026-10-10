import { useEffect, useState } from "react";
import { data, useFetcher, useLocation } from "react-router";
import type { Route } from "./+types/module.skills";
import { itemsOf, loadModule } from "~/lib/content.server.ts";
import { getProgress, setProgress } from "~/lib/db.server.ts";
import { inline, render } from "~/lib/markdown.ts";
import { splitItem } from "~/lib/stats.ts";

type SkillRow = { kind: "item"; id: string; key: string; whatHtml: string; whyHtml: string; guideHtml: string; done: boolean };
type Row = SkillRow | { kind: "bullet"; html: string } | { kind: "text"; html: string };

export function loader({ params }: Route.LoaderArgs) {
  const mod = loadModule(params.slug);
  if (!mod) throw new Response("Not found", { status: 404 });
  const done = getProgress();
  const sections = mod.sections.map((section) => ({
    title: section.title,
    rows: section.blocks.map((block): Row => {
      if (block.type !== "item") return { kind: block.type, html: inline(block.text) };
      const { what, why } = splitItem(block.text);
      return {
        kind: "item",
        id: block.id,
        key: block.key,
        whatHtml: inline(what),
        whyHtml: inline(why),
        guideHtml: block.guide ? render(block.guide) : "",
        done: Boolean(done[block.id]),
      };
    }),
  }));
  return { sections, hasGuides: itemsOf(mod).some((i) => i.guide) };
}

export async function action({ request, params }: Route.ActionArgs) {
  const form = await request.formData();
  const id = String(form.get("id"));
  const done = form.get("done") === "true";
  const mod = loadModule(params.slug);
  if (!mod || !itemsOf(mod).some((item) => item.id === id)) throw data({ error: "unknown skill" }, { status: 400 });
  setProgress(id, done);
  return { id, done };
}

export default function Skills({ loaderData }: Route.ComponentProps) {
  const { sections, hasGuides } = loaderData;
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const location = useLocation();

  // A hash like #the-cascade (from search or a shared link) opens that skill and scrolls to it.
  useEffect(() => {
    const key = location.hash.slice(1);
    if (!key) return;
    setOpen((prev) => new Set(prev).add(key));
    const el = document.getElementById(`item-${key}`);
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.classList.add("flash");
    }
  }, [location.hash]);

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const allKeys = sections.flatMap((s) => s.rows.filter((r): r is SkillRow => r.kind === "item").map((r) => r.key));

  return (
    <>
      {hasGuides && (
        <div className="toolbar">
          <button className="btn" type="button" onClick={() => setOpen(new Set(allKeys))}>
            Expand all
          </button>
          <button className="btn" type="button" onClick={() => setOpen(new Set())}>
            Collapse all
          </button>
        </div>
      )}
      {sections.map((section, i) => (
        <section className="md" key={i}>
          {section.title && <h2 dangerouslySetInnerHTML={{ __html: inline(section.title) }} />}
          <Rows rows={section.rows} open={open} onToggle={toggle} />
        </section>
      ))}
    </>
  );
}

// Consecutive bullets become one list; items and paragraphs stand on their own.
function Rows({ rows, open, onToggle }: { rows: Row[]; open: Set<string>; onToggle: (key: string) => void }) {
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    out.push(
      <ul key={`ul-${out.length}`}>
        {bullets.map((html, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
      </ul>,
    );
    bullets = [];
  };
  rows.forEach((row, i) => {
    if (row.kind === "bullet") {
      bullets.push(row.html);
      return;
    }
    flush();
    if (row.kind === "text") out.push(<p key={i} dangerouslySetInnerHTML={{ __html: row.html }} />);
    else out.push(<SkillItem key={row.id} item={row} open={open.has(row.key)} onToggle={() => onToggle(row.key)} />);
  });
  flush();
  return <>{out}</>;
}

function SkillItem({ item, open, onToggle }: { item: SkillRow; open: boolean; onToggle: () => void }) {
  const fetcher = useFetcher<typeof action>();
  // Show the pending state while the save is in flight.
  const done = fetcher.formData ? fetcher.formData.get("done") === "true" : item.done;
  const hasGuide = Boolean(item.guideHtml);
  return (
    <div className={`item${done ? " done" : ""}${open ? " open" : ""}`} id={`item-${item.key}`}>
      <div className="item-row">
        <input
          type="checkbox"
          checked={done}
          aria-label={`Mark ${item.whatHtml.replace(/<[^>]+>/g, "")} as done`}
          onChange={(e) => fetcher.submit({ id: item.id, done: String(e.currentTarget.checked) }, { method: "post" })}
        />
        <button className="item-head" type="button" aria-expanded={open} disabled={!hasGuide} onClick={onToggle}>
          <span>
            <span className="what" dangerouslySetInnerHTML={{ __html: item.whatHtml }} />
            {item.whyHtml && (
              <>
                {" "}
                <span className="why" dangerouslySetInnerHTML={{ __html: `- ${item.whyHtml}` }} />
              </>
            )}
          </span>
          {hasGuide && (
            <span className="chev" aria-hidden="true">
              ›
            </span>
          )}
        </button>
      </div>
      {open && hasGuide && <div className="detail md" dangerouslySetInnerHTML={{ __html: item.guideHtml }} />}
    </div>
  );
}
