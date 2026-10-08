import { esc, inline, render as md } from './markdown.js';
import { buildIndex, search } from './search.js';

let modules = [];
let done = {};
let quizResults = {};
let index = null;
// In-progress quiz attempts, kept while the page is open: slug -> { answers, revealed, saved }
const attempts = new Map();

const $nav = document.getElementById('nav');
const $main = document.getElementById('main');
const THEMES = { '': 'Default (follows system)', paper: 'Paper', terminal: 'Terminal', studio: 'Studio', blueprint: 'Blueprint' };
const currentTheme = () => document.documentElement.dataset.theme || '';

const slugify = (s) => s.toLowerCase().replace(/[`*_]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const itemsOf = (mod) => mod.sections.flatMap((s) => s.blocks.filter((b) => b.type === 'item'));
const stats = (mods) => {
  const items = mods.flatMap(itemsOf);
  const n = items.filter((i) => done[i.id]).length;
  return { n, total: items.length, pct: items.length ? Math.round((n / items.length) * 100) : 0 };
};
const stages = () => {
  const out = [];
  for (const mod of modules) {
    let stage = out.find((s) => s.name === mod.stage);
    if (!stage) out.push((stage = { name: mod.stage, modules: [] }));
    stage.modules.push(mod);
  }
  return out;
};
const pct = (r) => Math.round((r.score / r.total) * 100);
const bar = (p) => `<div class="bar" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p}%"></span></div>`;

// #/<module>            skills tab
// #/<module>/<skill>    skills tab, with that skill opened
// #/<module>/toolkit[/<section>]
// #/<module>/quiz[/<number>]
function route() {
  const [slug, second, third] = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
  const tab = second === 'toolkit' || second === 'quiz' ? second : 'skills';
  return { slug, tab, anchor: tab === 'skills' ? second : third };
}

/* Sidebar and dashboard */

function modLink(mod, current, withQuiz) {
  const s = stats([mod]);
  const complete = s.total > 0 && s.n === s.total;
  const best = withQuiz && quizResults[mod.slug]?.best;
  return `<a class="mod-link${complete ? ' complete' : ''}" href="#/${mod.slug}"${mod.slug === current ? ' aria-current="page"' : ''}>
    <span>${esc(mod.title)}</span>
    <span class="count">${best ? `<span class="quiz-score">Test ${pct(best)}%</span>` : ''}${s.n}/${s.total}</span></a>`;
}

function renderNav() {
  const all = stats(modules);
  const current = route().slug;
  $nav.innerHTML = `
    <a class="brand" href="#/">FE Path</a>
    <button class="search-open" type="button" data-action="search"><span>Search…</span><kbd>Ctrl K</kbd></button>
    <div class="overall">${all.n} of ${all.total} skills · ${all.pct}%${bar(all.pct)}</div>
    ${stages().map((st) => `
      <div class="stage-label">${esc(st.name)}</div>
      ${st.modules.map((m) => modLink(m, current)).join('')}`).join('')}
    <label class="theme-pick">Theme<select id="theme">${Object.entries(THEMES).map(([k, v]) => `<option value="${k}"${k === currentTheme() ? ' selected' : ''}>${v}</option>`).join('')}</select></label>`;
}

function renderDashboard() {
  const all = stats(modules);
  const next = modules.find((m) => { const s = stats([m]); return s.n < s.total; });
  $main.innerHTML = `
    <h1>Frontend Engineer Path</h1>
    <p class="summary">From how the web works to leading frontend architecture. Open a skill to read its guide, check it off when you can do it without looking anything up, and take each module's practice test.</p>
    <div class="head-progress" id="head-progress">${bar(all.pct)}<span>${all.n}/${all.total} · ${all.pct}%</span></div>
    ${next ? `<a class="next-up" href="#/${next.slug}"><small>${all.n ? 'Continue' : 'Start here'}</small>${esc(next.title)}</a>` : ''}
    ${stages().map((st) => {
      const s = stats(st.modules);
      return `<section class="stage-card">
        <h2>${esc(st.name)}</h2>
        <div class="head-progress">${bar(s.pct)}<span>${s.n}/${s.total}</span></div>
        ${st.modules.map((m) => modLink(m, null, true)).join('')}
      </section>`;
    }).join('')}`;
}

/* Module page */

function headProgress(mod) {
  const s = stats([mod]);
  return `${bar(s.pct)}<span>${s.n}/${s.total} · ${s.pct}%</span>`;
}

function skillsTab(mod) {
  const blocksHTML = (blocks) => {
    let html = '';
    let inList = false;
    for (const b of blocks) {
      if (b.type === 'bullet') {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${inline(b.text)}</li>`;
        continue;
      }
      if (inList) { html += '</ul>'; inList = false; }
      if (b.type === 'text') {
        html += `<p>${inline(b.text)}</p>`;
        continue;
      }
      const [what, ...rest] = b.text.split(' — ');
      const why = rest.join(' — ');
      html += `<div class="item${done[b.id] ? ' done' : ''}" id="item-${b.key}" data-key="${b.key}">
        <div class="item-row">
          <input type="checkbox" data-id="${esc(b.id)}" aria-label="Mark ${esc(what.replace(/`/g, ''))} as done"${done[b.id] ? ' checked' : ''}>
          <button class="item-head" type="button" aria-expanded="false"${b.guide ? '' : ' disabled'}>
            <span><span class="what">${inline(what)}</span>${why ? ` <span class="why">— ${inline(why)}</span>` : ''}</span>
            ${b.guide ? '<span class="chev" aria-hidden="true">›</span>' : ''}
          </button>
        </div>
        <div class="detail md" hidden></div>
      </div>`;
    }
    return html + (inList ? '</ul>' : '');
  };
  const hasGuides = itemsOf(mod).some((i) => i.guide);
  return `
    ${hasGuides ? '<div class="toolbar"><button class="btn" type="button" data-action="expand-all">Expand all</button><button class="btn" type="button" data-action="collapse-all">Collapse all</button></div>' : ''}
    ${mod.sections.map((s) => `<section class="md">${s.title ? `<h2>${inline(s.title)}</h2>` : ''}${blocksHTML(s.blocks)}</section>`).join('')}`;
}

function toolkitTab(mod) {
  if (!mod.toolkit.length) return '<p class="empty">No toolkit written for this module yet.</p>';
  return mod.toolkit.map((t) => `<section class="md"><h2 id="tk-${slugify(t.title)}">${inline(t.title)}</h2>${md(t.md)}</section>`).join('');
}

function setOpen(el, open) {
  const detail = el.querySelector('.detail');
  const head = el.querySelector('.item-head');
  if (head.disabled) return;
  if (open && !detail.dataset.ready) {
    const mod = modules.find((m) => m.slug === route().slug);
    detail.innerHTML = md(itemsOf(mod).find((i) => i.key === el.dataset.key).guide);
    detail.dataset.ready = '1';
  }
  el.classList.toggle('open', open);
  detail.hidden = !open;
  head.setAttribute('aria-expanded', String(open));
}

/* Practice test */

const attemptFor = (slug) => {
  if (!attempts.has(slug)) attempts.set(slug, { answers: {}, revealed: new Set(), saved: false });
  return attempts.get(slug);
};

function questionHTML(mod, i) {
  const q = mod.quiz[i];
  const st = attemptFor(mod.slug);
  const chosen = st.answers[i];
  const answered = chosen !== undefined;
  let body;
  if (q.options.length) {
    const right = answered && q.options[chosen].correct;
    body = `<div class="options">${q.options.map((o, j) => {
      const state = !answered ? '' : o.correct ? ' correct' : j === chosen ? ' wrong' : '';
      return `<button class="opt${state}" type="button" data-q="${i}" data-o="${j}"${answered ? ' disabled' : ''}>${inline(o.text)}</button>`;
    }).join('')}</div>
    ${answered ? `<div class="verdict ${right ? 'good' : 'bad'}">${right ? 'Correct' : 'Not quite'}</div><div class="explain md">${md(q.answer)}</div>` : ''}`;
  } else {
    body = st.revealed.has(i)
      ? `<div class="explain md"><h4>Model answer</h4>${md(q.answer)}</div>`
      : `<button class="btn" type="button" data-reveal="${i}">Show model answer</button>`;
  }
  return `<article class="question" id="q-${i + 1}">
    <div class="num">Question ${i + 1}${q.options.length ? '' : ' · open'}</div>
    <div class="md">${md(q.prompt)}</div>
    ${body}
  </article>`;
}

function quizBarHTML(mod) {
  const st = attemptFor(mod.slug);
  const mc = mod.quiz.map((q, i) => ({ q, i })).filter(({ q }) => q.options.length);
  const answered = mc.filter(({ i }) => st.answers[i] !== undefined);
  const correct = answered.filter(({ q, i }) => q.options[st.answers[i]].correct).length;
  const r = quizResults[mod.slug];
  const history = r ? `Best ${pct(r.best)}% · last ${pct(r.last)}% · ${r.attempts} attempt${r.attempts === 1 ? '' : 's'}` : 'No attempts saved yet';
  const status = answered.length === mc.length
    ? `<strong>Final score: ${correct}/${mc.length} (${Math.round((correct / mc.length) * 100)}%)</strong> · saved`
    : `<strong>${correct} correct</strong> · ${answered.length}/${mc.length} answered`;
  return `<span>${status}</span><span class="history">${history}</span>
    <button class="btn" type="button" data-action="retake">${answered.length ? 'Start over' : 'Reset'}</button>`;
}

function quizTab(mod) {
  if (!mod.quiz.length) return '<p class="empty">No practice test written for this module yet.</p>';
  return `<div class="quiz-bar" id="quiz-bar">${quizBarHTML(mod)}</div>
    <p class="summary" style="margin-top:14px">Multiple-choice questions are scored and the result is saved when you finish them all. Open questions show a model answer to compare against your own.</p>
    ${mod.quiz.map((_, i) => questionHTML(mod, i)).join('')}`;
}

async function answer(mod, i, o) {
  const st = attemptFor(mod.slug);
  st.answers[i] = o;
  document.getElementById(`q-${i + 1}`).outerHTML = questionHTML(mod, i);
  const mc = mod.quiz.map((q, n) => ({ q, n })).filter(({ q }) => q.options.length);
  if (!st.saved && mc.every(({ n }) => st.answers[n] !== undefined)) {
    st.saved = true;
    const score = mc.filter(({ q, n }) => q.options[st.answers[n]].correct).length;
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: mod.slug, score, total: mc.length }),
      });
      if (!res.ok) throw new Error(await res.text());
      quizResults[mod.slug] = await res.json();
    } catch (err) {
      st.saved = false;
      alert(`Couldn't save the result: ${err.message}`);
    }
  }
  const $bar = document.getElementById('quiz-bar');
  if ($bar) $bar.innerHTML = quizBarHTML(mod);
}

function renderModule(mod, r) {
  const i = modules.indexOf(mod);
  const prev = modules[i - 1];
  const next = modules[i + 1];
  const best = quizResults[mod.slug]?.best;
  const tab = (name, label, extra = '') =>
    `<a href="#/${mod.slug}${name === 'skills' ? '' : `/${name}`}"${r.tab === name ? ' aria-current="page"' : ''}>${label}${extra ? `<small>${extra}</small>` : ''}</a>`;
  $main.innerHTML = `
    <div class="eyebrow">${esc(mod.stage)}</div>
    <h1>${esc(mod.title)}</h1>
    <p class="summary">${inline(mod.summary)}</p>
    <div class="head-progress" id="head-progress">${headProgress(mod)}</div>
    <div class="tabs">
      ${tab('skills', 'Skills', String(itemsOf(mod).length))}
      ${tab('toolkit', 'Toolkit')}
      ${tab('quiz', 'Practice test', best ? `best ${pct(best)}%` : mod.quiz.length ? `${mod.quiz.length} questions` : '')}
    </div>
    ${r.tab === 'toolkit' ? toolkitTab(mod) : r.tab === 'quiz' ? quizTab(mod) : skillsTab(mod)}
    <div class="pager">
      <span>${prev ? `<a href="#/${prev.slug}">← ${esc(prev.title)}</a>` : ''}</span>
      <span>${next ? `<a href="#/${next.slug}">${esc(next.title)} →</a>` : ''}</span>
    </div>`;
}

function render() {
  const r = route();
  renderNav();
  const mod = modules.find((m) => m.slug === r.slug);
  if (mod) renderModule(mod, r);
  else renderDashboard();
  document.title = mod ? `${mod.title} · FE Path` : 'FE Path';

  let target = null;
  if (mod && r.anchor) {
    if (r.tab === 'skills') {
      target = document.getElementById(`item-${r.anchor}`);
      if (target) {
        setOpen(target, true);
        target.classList.add('flash');
      }
    } else {
      target = document.getElementById(r.tab === 'toolkit' ? `tk-${r.anchor}` : `q-${r.anchor}`);
    }
  }
  if (target) target.scrollIntoView({ block: 'start' });
  else window.scrollTo(0, 0);
}

/* Events */

$main.addEventListener('change', async (e) => {
  const box = e.target.closest('input[data-id]');
  if (!box) return;
  const id = box.dataset.id;
  const apply = (value) => {
    if (value) done[id] = new Date().toISOString();
    else delete done[id];
    box.checked = value;
    box.closest('.item').classList.toggle('done', value);
    renderNav();
    const mod = modules.find((m) => m.slug === route().slug);
    if (mod) document.getElementById('head-progress').innerHTML = headProgress(mod);
  };
  const value = box.checked;
  apply(value);
  try {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done: value }),
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    apply(!value);
    alert(`Couldn't save: ${err.message}`);
  }
});

$main.addEventListener('click', (e) => {
  const mod = modules.find((m) => m.slug === route().slug);
  const head = e.target.closest('.item-head');
  if (head) {
    const item = head.closest('.item');
    return setOpen(item, !item.classList.contains('open'));
  }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'expand-all' || action === 'collapse-all') {
    return $main.querySelectorAll('.item').forEach((el) => setOpen(el, action === 'expand-all'));
  }
  if (action === 'retake') {
    attempts.delete(mod.slug);
    render();
    return;
  }
  const opt = e.target.closest('.opt');
  if (opt) return answer(mod, Number(opt.dataset.q), Number(opt.dataset.o));
  const reveal = e.target.closest('[data-reveal]');
  if (reveal) {
    const i = Number(reveal.dataset.reveal);
    attemptFor(mod.slug).revealed.add(i);
    document.getElementById(`q-${i + 1}`).outerHTML = questionHTML(mod, i);
  }
});

window.addEventListener('hashchange', render);

/* Search palette */

const $search = document.getElementById('search');
const $input = document.getElementById('search-input');
const $results = document.getElementById('search-results');
const $chips = document.getElementById('search-chips');
const TYPE_LABEL = { skill: 'Skill', module: 'Module', toolkit: 'Toolkit', quiz: 'Test', link: 'Link' };
const EXAMPLES = ['event loop', 'a11y focus', 'cache-control', 'is:todo in:css', 'type:quiz closure', 'type:link MDN grid', '"stacking context"'];
const MAX_RESULTS = 60;
let shown = [];
let selected = 0;
let typeFilter = 'all';

function highlight(text, terms) {
  const usable = terms.filter((t) => t.length > 1).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!usable.length) return esc(text);
  return text
    .split(new RegExp(`(${usable.join('|')})`, 'ig'))
    .map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part)))
    .join('');
}

// The description if it has a match (or there is no body), otherwise the body text around the first match.
function snippet(doc, terms) {
  const lowered = terms.map((t) => t.toLowerCase());
  const hit = (text) => lowered.map((t) => text.toLowerCase().indexOf(t)).filter((n) => n >= 0).sort((a, b) => a - b)[0];
  if (doc.desc && (hit(doc.desc) !== undefined || !doc.body)) return doc.desc;
  const at = hit(doc.body);
  if (at === undefined) return doc.desc || doc.body.slice(0, 160);
  const start = Math.max(0, at - 70);
  return (start ? '…' : '') + doc.body.slice(start, at + 130) + (at + 130 < doc.body.length ? '…' : '');
}

function renderResults() {
  const query = $input.value.trim();
  if (!query) {
    shown = [];
    $chips.innerHTML = '';
    $results.innerHTML = `<div class="search-hint"><p>Search every skill, guide, toolkit, practice question, and resource link. Typos and shorthand like <code>a11y</code> or <code>perf</code> are understood.</p>
      <p>Try: ${EXAMPLES.map((x) => `<button class="chip" type="button" data-example="${esc(x)}">${esc(x)}</button>`).join(' ')}</p></div>`;
    return;
  }
  const { results, terms } = search(index, query, done);
  const counts = {};
  for (const { doc } of results) counts[doc.type] = (counts[doc.type] || 0) + 1;
  if (typeFilter !== 'all' && !counts[typeFilter]) typeFilter = 'all';

  $chips.innerHTML = results.length
    ? [['all', `All ${results.length}`], ...Object.keys(TYPE_LABEL).filter((t) => counts[t]).map((t) => [t, `${TYPE_LABEL[t]} ${counts[t]}`])]
        .map(([t, label]) => `<button class="chip" type="button" data-type="${t}" aria-pressed="${t === typeFilter}">${label}</button>`)
        .join('')
    : '';

  shown = results.filter(({ doc }) => typeFilter === 'all' || doc.type === typeFilter).slice(0, MAX_RESULTS).map((r) => r.doc);
  selected = Math.min(selected, Math.max(0, shown.length - 1));
  $results.innerHTML = shown.length
    ? shown.map((doc, i) => `<div class="result" role="option" id="result-${i}" data-i="${i}" aria-selected="${i === selected}">
        <span class="badge">${TYPE_LABEL[doc.type]}</span>
        <div>
          <div class="title">${highlight(doc.title, terms)}${doc.type === 'skill' && done[doc.id] ? '<span class="tick" title="Done">✓</span>' : ''}${doc.type === 'link' ? ' ↗' : ''}</div>
          <div class="ctx">${esc(doc.ctx)}</div>
          <div class="snippet">${highlight(snippet(doc, terms), terms)}</div>
        </div>
      </div>`).join('')
    : `<div class="search-hint"><p>Nothing matches <strong>${esc(query)}</strong>.</p><p>Try fewer words, or remove a filter.</p></div>`;
  $input.setAttribute('aria-activedescendant', shown.length ? `result-${selected}` : '');
}

function select(i) {
  if (!shown.length) return;
  selected = (i + shown.length) % shown.length;
  $results.querySelectorAll('.result').forEach((el, n) => el.setAttribute('aria-selected', String(n === selected)));
  $results.children[selected].scrollIntoView({ block: 'nearest' });
  $input.setAttribute('aria-activedescendant', `result-${selected}`);
}

function openResult(doc) {
  if (!doc) return;
  $search.close();
  if (doc.type === 'link') return window.open(doc.href, '_blank', 'noopener');
  if (location.hash === doc.href) render();
  else location.hash = doc.href;
}

function openSearch() {
  if (!index || $search.open) return;
  $search.showModal();
  $input.select();
  renderResults();
}

$input.addEventListener('input', () => { selected = 0; renderResults(); });
$input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); select(selected + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); select(selected - 1); }
  else if (e.key === 'Enter') { e.preventDefault(); openResult(shown[selected]); }
});
$search.addEventListener('click', (e) => {
  if (e.target === $search) return $search.close(); // backdrop
  const example = e.target.closest('[data-example]');
  const chip = e.target.closest('[data-type]');
  const result = e.target.closest('.result');
  if (example) { $input.value = example.dataset.example; selected = 0; renderResults(); $input.focus(); }
  else if (chip) { typeFilter = chip.dataset.type; selected = 0; renderResults(); $input.focus(); }
  else if (result) openResult(shown[Number(result.dataset.i)]);
});
$nav.addEventListener('change', (e) => {
  if (e.target.id !== 'theme') return;
  const theme = e.target.value;
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  try { theme ? localStorage.setItem('fe-path-theme', theme) : localStorage.removeItem('fe-path-theme'); } catch {}
});
$nav.addEventListener('click', (e) => {
  if (e.target.closest('[data-action="search"]')) openSearch();
});
document.addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if ((e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
    e.preventDefault();
    openSearch();
  }
});

/* Boot */

fetch('/api/path')
  .then((r) => r.json())
  .then((data) => {
    ({ modules, done, quizResults } = data);
    index = buildIndex(modules);
    render();
  })
  .catch((err) => { $main.innerHTML = `<p class="error">Failed to load: ${esc(err.message)}</p>`; });
