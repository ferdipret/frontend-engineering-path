import { Link, useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";
import { ModuleLink } from "~/components/Sidebar.tsx";
import { ProgressBar } from "~/components/ProgressBar.tsx";
import { byStage, sum } from "~/lib/stats.ts";

export default function Dashboard() {
  const data = useRouteLoaderData<typeof rootLoader>("root");
  const modules = data?.modules ?? [];
  const all = sum(modules);
  const next = modules.find((m) => m.done < m.total);
  return (
    <>
      <section className="hero">
        <h1>Frontend Engineer Path</h1>
        <p>
          From how the web works to leading frontend architecture. Open a skill to read its guide, check it off when you can do it
          without looking anything up, and take each module's practice test.
        </p>
        <ProgressBar value={all.pct} />
        <p style={{ marginTop: 8, fontSize: 12 }}>
          {all.done} of {all.total} skills · {all.pct}%
        </p>
      </section>
      {next && (
        <Link className="next-up" to={`/${next.slug}`}>
          <small>{all.done ? "Continue" : "Start here"}</small>
          {next.title}
        </Link>
      )}
      {byStage(modules).map((stage) => {
        const s = sum(stage.modules);
        return (
          <section className="stage-card" key={stage.name}>
            <h2>{stage.name}</h2>
            <div className="head-progress">
              <ProgressBar value={s.pct} />
              <span>
                {s.done}/{s.total}
              </span>
            </div>
            {stage.modules.map((mod) => (
              <ModuleLink key={mod.slug} mod={mod} withQuiz />
            ))}
          </section>
        );
      })}
    </>
  );
}
