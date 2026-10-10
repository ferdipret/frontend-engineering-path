import { NavLink, useFetcher } from "react-router";
import { ProgressBar } from "./ProgressBar.tsx";
import { byStage, sum, type ModuleSummary } from "~/lib/stats.ts";
import type { Theme } from "~/lib/theme.server.ts";

const THEME_LABELS: Record<Theme, string> = {
  "": "Default (follows system)",
  paper: "Paper",
  terminal: "Terminal",
  studio: "Studio",
  blueprint: "Blueprint",
};

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

export function Sidebar({ modules, theme, onSearch }: { modules: ModuleSummary[]; theme: Theme; onSearch: () => void }) {
  const all = sum(modules);
  const fetcher = useFetcher();
  return (
    <nav id="nav" aria-label="Modules">
      <NavLink className="brand" to="/" end>
        FE Path
      </NavLink>
      <button className="search-open" type="button" onClick={onSearch}>
        <span>Search…</span>
        <kbd>Ctrl K</kbd>
      </button>
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
      <fetcher.Form method="post" action="/theme">
        <label className="theme-pick">
          Theme
          <select
            name="theme"
            defaultValue={theme}
            onChange={(e) => {
              // Apply immediately; the cookie keeps it for the next load.
              const value = e.currentTarget.value;
              if (value) document.documentElement.dataset.theme = value;
              else delete document.documentElement.dataset.theme;
              fetcher.submit(e.currentTarget.form);
            }}
          >
            {(Object.keys(THEME_LABELS) as Theme[]).map((key) => (
              <option key={key} value={key}>
                {THEME_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </fetcher.Form>
    </nav>
  );
}
