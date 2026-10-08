// Local tracker for the frontend path.
// Markdown in ./path, ./guides and ./quizzes is the content; SQLite in ./data holds progress and quiz results.
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { ROOT, itemsOf, loadModules } from './lib/content.js';

const WEB_DIR = join(ROOT, 'web');
const DATA_DIR = join(ROOT, 'data');
const PORT = Number(process.env.PORT) || 4321;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(join(DATA_DIR, 'progress.db'));
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
const selectProgress = db.prepare('SELECT item_id, done_at FROM progress');
const insertProgress = db.prepare('INSERT OR IGNORE INTO progress (item_id, done_at) VALUES (?, ?)');
const deleteProgress = db.prepare('DELETE FROM progress WHERE item_id = ?');
const selectQuizResults = db.prepare('SELECT module, score, total, taken_at FROM quiz_results ORDER BY id');
const insertQuizResult = db.prepare('INSERT INTO quiz_results (module, score, total, taken_at) VALUES (?, ?, ?, ?)');

function loadPath() {
  const modules = loadModules();
  const done = Object.fromEntries(selectProgress.all().map((r) => [r.item_id, r.done_at]));
  // Per module: number of attempts, the latest result, and the best by percentage.
  const quizResults = {};
  for (const r of selectQuizResults.all()) {
    const entry = (quizResults[r.module] ??= { attempts: 0, best: null, last: null });
    entry.attempts++;
    entry.last = r;
    if (!entry.best || r.score / r.total > entry.best.score / entry.best.total) entry.best = r;
  }
  return { modules, done, quizResults };
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e5) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function serveStatic(res, pathname) {
  const name = pathname === '/' ? 'index.html' : pathname.slice(1);
  // Only flat file names from ./web are served.
  if (!/^[\w.-]+$/.test(name) || !MIME[extname(name)] || !existsSync(join(WEB_DIR, name))) return false;
  res.writeHead(200, { 'Content-Type': `${MIME[extname(name)]}; charset=utf-8`, 'Cache-Control': 'no-store' });
  res.end(readFileSync(join(WEB_DIR, name)));
  return true;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/api/path') {
      json(res, 200, loadPath());
    } else if (req.method === 'POST' && url.pathname === '/api/progress') {
      const { id, done } = JSON.parse(await readBody(req));
      const known = loadModules().some((mod) => itemsOf(mod).some((item) => item.id === id));
      if (!known || typeof done !== 'boolean') return json(res, 400, { error: 'unknown item or bad payload' });
      if (done) insertProgress.run(id, new Date().toISOString());
      else deleteProgress.run(id);
      json(res, 200, { id, done });
    } else if (req.method === 'POST' && url.pathname === '/api/quiz') {
      const { module, score, total } = JSON.parse(await readBody(req));
      const known = loadModules().some((mod) => mod.slug === module);
      const valid = Number.isInteger(score) && Number.isInteger(total) && total > 0 && score >= 0 && score <= total;
      if (!known || !valid) return json(res, 400, { error: 'unknown module or bad payload' });
      insertQuizResult.run(module, score, total, new Date().toISOString());
      json(res, 200, loadPath().quizResults[module]);
    } else if (req.method !== 'GET' || !serveStatic(res, url.pathname)) {
      json(res, 404, { error: 'not found' });
    }
  } catch (err) {
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`FE Path running at http://localhost:${PORT}`);
});
