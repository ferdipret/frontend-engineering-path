import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { buildIndex, search, type Doc, type DocType, type SearchIndex } from "~/lib/search.ts";

const TYPE_LABEL: Record<DocType, string> = { skill: "Skill", module: "Module", toolkit: "Toolkit", quiz: "Test", link: "Link" };
const EXAMPLES = ["event loop", "a11y focus", "cache-control", "is:todo in:css", "type:quiz closure", "type:link MDN grid", '"stacking context"'];
const MAX_RESULTS = 60;

type SearchData = { docs: Doc[]; modules: SearchIndex["modules"] };

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const usable = terms.filter((t) => t.length > 1).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!usable.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${usable.join("|")})`, "ig"));
  return <>{parts.map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}</>;
}

// The description if it has a match (or there is no body), otherwise the body text around the first match.
function snippet(doc: Doc, terms: string[]) {
  const lowered = terms.map((t) => t.toLowerCase());
  const hit = (text: string) =>
    lowered
      .map((t) => text.toLowerCase().indexOf(t))
      .filter((n) => n >= 0)
      .sort((a, b) => a - b)[0];
  if (doc.desc && (hit(doc.desc) !== undefined || !doc.body)) return doc.desc;
  const at = hit(doc.body);
  if (at === undefined) return doc.desc || doc.body.slice(0, 160);
  const start = Math.max(0, at - 70);
  return (start ? "…" : "") + doc.body.slice(start, at + 130) + (at + 130 < doc.body.length ? "…" : "");
}

export function SearchPalette({ open, onClose, doneIds }: { open: boolean; onClose: () => void; doneIds: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocType | "all">("all");
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();

  // The index is built from a JSON resource the first time the palette opens.
  useEffect(() => {
    if (!open || index) return;
    fetch("/search.json")
      .then((r) => r.json())
      .then((data: SearchData) => setIndex(buildIndex(data.docs, data.modules)))
      .catch(() => {});
  }, [open, index]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      input.current?.select();
    } else if (!open && el.open) el.close();
  }, [open]);

  const done = Object.fromEntries(doneIds.map((id) => [id, "1"]));
  const trimmed = query.trim();
  const { results, terms } = index && trimmed ? search(index, trimmed, done) : { results: [], terms: [] };
  const counts: Partial<Record<DocType, number>> = {};
  for (const { doc } of results) counts[doc.type] = (counts[doc.type] ?? 0) + 1;
  const activeFilter = typeFilter !== "all" && !counts[typeFilter] ? "all" : typeFilter;
  const shown = results.filter(({ doc }) => activeFilter === "all" || doc.type === activeFilter).slice(0, MAX_RESULTS);
  const current = Math.min(selected, Math.max(0, shown.length - 1));

  const openDoc = (doc: Doc | undefined) => {
    if (!doc) return;
    onClose();
    if (doc.type === "link") window.open(doc.href, "_blank", "noopener");
    else navigate(doc.href);
  };

  useEffect(() => {
    document.getElementById(`result-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  return (
    <dialog
      id="search"
      ref={dialog}
      aria-label="Search"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="search-box">
        <input
          ref={input}
          id="search-input"
          type="search"
          placeholder={index ? "Search skills, guides, tests, and links…" : "Loading search…"}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded="true"
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={shown.length ? `result-${current}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected((s) => (shown.length ? (s + 1) % shown.length : 0));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected((s) => (shown.length ? (s - 1 + shown.length) % shown.length : 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              openDoc(shown[current]?.doc);
            }
          }}
        />
        <kbd>Esc</kbd>
      </div>
      {results.length > 0 && (
        <div className="search-chips">
          {(["all", ...(Object.keys(TYPE_LABEL) as DocType[]).filter((t) => counts[t])] as (DocType | "all")[]).map((t) => (
            <button key={t} className="chip" type="button" aria-pressed={t === activeFilter} onClick={() => setTypeFilter(t)}>
              {t === "all" ? `All ${results.length}` : `${TYPE_LABEL[t]} ${counts[t]}`}
            </button>
          ))}
        </div>
      )}
      <div id="search-results" className="search-results" role="listbox" aria-label="Results">
        {!trimmed ? (
          <div className="search-hint">
            <p>
              Search every skill, guide, toolkit, practice question, and resource link. Typos and shorthand like <code>a11y</code> or{" "}
              <code>perf</code> are understood.
            </p>
            <p>
              Try:{" "}
              {EXAMPLES.map((x) => (
                <button key={x} className="chip" type="button" onClick={() => setQuery(x)}>
                  {x}
                </button>
              ))}
            </p>
          </div>
        ) : shown.length ? (
          shown.map(({ doc }, i) => (
            <div
              key={doc.href + doc.title}
              className="result"
              role="option"
              id={`result-${i}`}
              aria-selected={i === current}
              onClick={() => openDoc(doc)}
              onMouseMove={() => setSelected(i)}
            >
              <span className="badge">{TYPE_LABEL[doc.type]}</span>
              <div>
                <div className="title">
                  <Highlight text={doc.title} terms={terms} />
                  {doc.type === "skill" && doc.id && done[doc.id] && (
                    <span className="tick" title="Done">
                      ✓
                    </span>
                  )}
                  {doc.type === "link" && " ↗"}
                </div>
                <div className="ctx">{doc.ctx}</div>
                <div className="snippet">
                  <Highlight text={snippet(doc, terms)} terms={terms} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="search-hint">
            <p>
              Nothing matches <strong>{trimmed}</strong>.
            </p>
            <p>Try fewer words, or remove a filter.</p>
          </div>
        )}
      </div>
      <div className="search-foot">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> move
        </span>
        <span>
          <kbd>Enter</kbd> open
        </span>
        <span>
          Filters: <code>is:todo</code> <code>is:done</code> <code>type:quiz</code> <code>in:css</code> <code>"exact phrase"</code>
        </span>
      </div>
    </dialog>
  );
}
