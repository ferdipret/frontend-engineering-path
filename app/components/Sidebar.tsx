import { NavLink } from "react-router";
import { ProgressBar } from "./ProgressBar.tsx";
import { byStage, sum, type ModuleSummary } from "~/lib/stats.ts";

export function ModuleLink({ mod, withQuiz = false }: { mod: ModuleSummary; withQuiz?: boolean }) {
  const complete = mod.total > 0 && mod.done === mod.total;
  return (
    <NavLink className={`mod-link${complete ? " complete" : ""}`} to={`/${mod.slug}`}>
      <span>{mod.title}</span>
      <span className="count">
        {withQuiz && mod.quizBest !== null && <span className="quiz-score">Test {mod.quizBest}%</span>}
        {mod.done}/{mod.total}
      </span>
    </NavLink>
  );
}

export function Sidebar({ modules }: { modules: ModuleSummary[] }) {
  const all = sum(modules);
  return (
    <nav id="nav" aria-label="Modules">
      <div className="overall">
        {all.done} of {all.total} skills · {all.pct}%
        <ProgressBar value={all.pct} />
      </div>
      {byStage(modules).map((stage) => (
        <div key={stage.name}>
          <div className="stage-label">{stage.name}</div>
          {stage.modules.map((mod) => (
            <ModuleLink key={mod.slug} mod={mod} />
          ))}
        </div>
      ))}
    </nav>
  );
}
