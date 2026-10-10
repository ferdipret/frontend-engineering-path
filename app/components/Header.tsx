import { NavLink, useFetcher } from "react-router";
import type { Theme } from "~/lib/theme.server.ts";

const THEME_LABELS: Record<Theme, string> = {
  "": "Default",
  paper: "Paper",
  terminal: "Terminal",
  studio: "Studio",
  blueprint: "Blueprint",
};

export function Header({ theme, onSearch }: { theme: Theme; onSearch: () => void }) {
  const fetcher = useFetcher();
  return (
    <header className="topbar">
      <NavLink className="brand" to="/">
        <span className="mark" aria-hidden="true">
          F
        </span>
        FE Path
      </NavLink>
      <nav className="topnav" aria-label="Primary">
        <NavLink className="pill" to="/" end>
          Path
        </NavLink>
      </nav>
      <span className="spacer" />
      <button className="search-open" type="button" onClick={onSearch}>
        <span>Search</span>
        <kbd>Ctrl K</kbd>
      </button>
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
    </header>
  );
}
