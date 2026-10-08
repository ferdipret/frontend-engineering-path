// Progress and quiz results live in SQLite under ./data. Content stays in markdown.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./content.server.ts";

export type QuizResult = { module: string; score: number; total: number; taken_at: string };
export type QuizSummary = { attempts: number; best: QuizResult; last: QuizResult };

const DATA_DIR = join(ROOT, "data");
mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(join(DATA_DIR, "progress.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS progress (
    item_id TEXT PRIMARY KEY,
    done_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    taken_at TEXT NOT NULL
  );
`);

const selectProgress = db.prepare("SELECT item_id, done_at FROM progress");
const insertProgress = db.prepare("INSERT OR IGNORE INTO progress (item_id, done_at) VALUES (?, ?)");
const deleteProgress = db.prepare("DELETE FROM progress WHERE item_id = ?");
const selectQuizResults = db.prepare("SELECT module, score, total, taken_at FROM quiz_results ORDER BY id");
const insertQuizResult = db.prepare("INSERT INTO quiz_results (module, score, total, taken_at) VALUES (?, ?, ?, ?)");

/** Item id -> ISO timestamp for every completed skill. */
export function getProgress(): Record<string, string> {
  const rows = selectProgress.all() as { item_id: string; done_at: string }[];
  return Object.fromEntries(rows.map((r) => [r.item_id, r.done_at]));
}

export function setProgress(id: string, done: boolean) {
  if (done) insertProgress.run(id, new Date().toISOString());
  else deleteProgress.run(id);
}

/** Per module: number of attempts, the latest result, and the best by percentage. */
export function getQuizResults(): Record<string, QuizSummary> {
  const out: Record<string, QuizSummary> = {};
  for (const r of selectQuizResults.all() as QuizResult[]) {
    const entry = out[r.module];
    if (!entry) {
      out[r.module] = { attempts: 1, best: r, last: r };
      continue;
    }
    entry.attempts++;
    entry.last = r;
    if (r.score / r.total > entry.best.score / entry.best.total) entry.best = r;
  }
  return out;
}

export function addQuizResult(module: string, score: number, total: number) {
  insertQuizResult.run(module, score, total, new Date().toISOString());
}
