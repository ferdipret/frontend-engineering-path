import { Link, NavLink, Outlet } from "react-router";
import type { Route } from "./+types/module";
import { ProgressBar } from "~/components/ProgressBar.tsx";
import { itemsOf, loadModules } from "~/lib/content.server.ts";
import { getProgress, getQuizResults } from "~/lib/db.server.ts";
import { inline } from "~/lib/markdown.ts";
import { pct } from "~/lib/stats.ts";

export function loader({ params }: Route.LoaderArgs) {
  const modules = loadModules();
  const i = modules.findIndex((m) => m.slug === params.slug);
  const mod = modules[i];
  if (!mod) throw new Response("Not found", { status: 404 });
  const done = getProgress();
  const items = itemsOf(mod);
  const best = getQuizResults()[mod.slug]?.best;
  const neighbour = (m: typeof mod | undefined) => (m ? { slug: m.slug, title: m.title } : null);
  return {
    slug: mod.slug,
    title: mod.title,
    stage: mod.stage,
    summaryHtml: inline(mod.summary),
    total: items.length,
    done: items.filter((item) => done[item.id]).length,
    questions: mod.quiz.length,
    quizBest: best ? pct(best.score, best.total) : null,
    prev: neighbour(modules[i - 1]),
    next: neighbour(modules[i + 1]),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [{ title: loaderData ? `${loaderData.title} · FE Path` : "FE Path" }];

export default function ModuleLayout({ loaderData: mod }: Route.ComponentProps) {
  const progress = pct(mod.done, mod.total);
  return (
    <>
      <div className="eyebrow">{mod.stage}</div>
      <h1>{mod.title}</h1>
      <p className="summary" dangerouslySetInnerHTML={{ __html: mod.summaryHtml }} />
      <div className="head-progress">
        <ProgressBar value={progress} />
        <span>
          {mod.done}/{mod.total} · {progress}%
        </span>
      </div>
      <div className="tabs">
        <NavLink to={`/${mod.slug}`} end>
          Skills<small>{mod.total}</small>
        </NavLink>
        <NavLink to={`/${mod.slug}/toolkit`}>Toolkit</NavLink>
        <NavLink to={`/${mod.slug}/quiz`}>
          Practice test
          {mod.quizBest !== null ? <small>best {mod.quizBest}%</small> : mod.questions ? <small>{mod.questions} questions</small> : null}
        </NavLink>
      </div>
      <Outlet />
      <div className="pager">
        <span>{mod.prev && <Link to={`/${mod.prev.slug}`}>← {mod.prev.title}</Link>}</span>
        <span>{mod.next && <Link to={`/${mod.next.slug}`}>{mod.next.title} →</Link>}</span>
      </div>
    </>
  );
}
