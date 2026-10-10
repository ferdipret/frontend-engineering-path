// Small helpers shared by the sidebar, dashboard and module pages.

export type ModuleSummary = {
  slug: string;
  title: string;
  stage: string;
  total: number;
  done: number;
  questions: number;
  quizBest: number | null;
};

export const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

export function sum(modules: ModuleSummary[]) {
  const total = modules.reduce((a, m) => a + m.total, 0);
  const done = modules.reduce((a, m) => a + m.done, 0);
  return { total, done, pct: pct(done, total) };
}

export function byStage(modules: ModuleSummary[]) {
  const out: { name: string; modules: ModuleSummary[] }[] = [];
  for (const mod of modules) {
    let stage = out.find((s) => s.name === mod.stage);
    if (!stage) out.push((stage = { name: mod.stage, modules: [] }));
    stage.modules.push(mod);
  }
  return out;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Splits a checklist item into its name and explanation. */
export function splitItem(text: string): { what: string; why: string } {
  const [what = "", ...rest] = text.split(" — ");
  return { what, why: rest.join(" — ") };
}
