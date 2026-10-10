import { useEffect, useState } from "react";
import { useLocation, useMatches, useNavigate } from "react-router";

export type TocEntry = { id: string; label: string };
export type Toc = { entries: TocEntry[]; compact?: boolean };
/** Route modules export `handle.toc` to describe the headings on their page. */
export type TocHandle = { toc: (loaderData: unknown) => Toc };

const hasToc = (handle: unknown): handle is TocHandle => typeof (handle as TocHandle | undefined)?.toc === "function";

export function OnThisPage() {
  const matches = useMatches();
  const match = [...matches].reverse().find((m) => hasToc(m.handle));
  const toc = match ? (match.handle as TocHandle).toc(match.loaderData) : null;
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);

  // The last heading that has scrolled past the top of the viewport is the current one.
  useEffect(() => {
    if (!toc) return;
    const ids = toc.entries.map((e) => e.id);
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.3) current = id;
      }
      setActive(current ?? ids[0] ?? null);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [toc?.entries.map((e) => e.id).join("|"), location.pathname]);

  if (!toc?.entries.length) return <aside className="toc" aria-hidden="true" />;
  return (
    <aside className={`toc${toc.compact ? " compact" : ""}`} aria-label="On this page">
      <div className="toc-title">On this page</div>
      <ul>
        {toc.entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={active === entry.id ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate({ hash: entry.id }, { preventScrollReset: true });
                document.getElementById(entry.id)?.scrollIntoView({ block: "start" });
              }}
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
