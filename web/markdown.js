// A small renderer for the markdown subset described in AUTHORING.md.
// Everything is HTML-escaped first, so content can mention tags freely.

export const esc = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function inline(s) {
  // Code spans are lifted out first so their contents aren't treated as emphasis or links.
  const codes = [];
  const out = esc(s)
    .replace(/`([^`]+)`/g, (_, code) => `\u0000${codes.push(code) - 1}\u0000`)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

const FENCE = /^\s*(`{3,}|~{3,})(.*)$/;
const BULLET = /^\s*[-*] (.*)$/;
const NUMBERED = /^\s*\d+[.)] (.*)$/;
const QUOTE = /^> ?(.*)$/;
const HEADING = /^#{1,6} (.*)$/;
const TABLE_RULE = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

const startsBlock = (line) =>
  FENCE.test(line) || BULLET.test(line) || NUMBERED.test(line) || QUOTE.test(line) || HEADING.test(line);

// Splits a table row on pipes that aren't inside code spans or escaped.
function cells(row) {
  const out = [];
  let cell = '';
  let inCode = false;
  const body = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '\\' && body[i + 1] === '|') { cell += '|'; i++; }
    else if (ch === '`') { inCode = !inCode; cell += ch; }
    else if (ch === '|' && !inCode) { out.push(cell.trim()); cell = ''; }
    else cell += ch;
  }
  out.push(cell.trim());
  return out;
}

function list(lines, i, pattern, tag) {
  const items = [];
  while (i < lines.length) {
    const m = lines[i].match(pattern);
    if (m) items.push(m[1]);
    // An indented line continues the previous item.
    else if (items.length && /^\s+\S/.test(lines[i]) && !FENCE.test(lines[i])) items[items.length - 1] += ` ${lines[i].trim()}`;
    else break;
    i++;
  }
  return [`<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${tag}>`, i];
}

export function render(src) {
  const lines = src.split('\n');
  let html = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    let m;
    if (!line.trim()) {
      i++;
    } else if ((m = line.match(FENCE))) {
      const [, marker, lang] = m;
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker)) code.push(lines[i++]);
      i++;
      html += `<pre${lang.trim() ? ` data-lang="${esc(lang.trim())}"` : ''}><code>${esc(code.join('\n'))}</code></pre>`;
    } else if ((m = line.match(HEADING))) {
      html += `<h4>${inline(m[1])}</h4>`;
      i++;
    } else if (line.trim().startsWith('|') && TABLE_RULE.test(lines[i + 1] ?? '')) {
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]));
      html += `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table></div>`;
    } else if (QUOTE.test(line)) {
      const quoted = [];
      while (i < lines.length && (m = lines[i].match(QUOTE))) { quoted.push(m[1]); i++; }
      html += `<blockquote>${render(quoted.join('\n'))}</blockquote>`;
    } else if (BULLET.test(line)) {
      [m, i] = list(lines, i, BULLET, 'ul');
      html += m;
    } else if (NUMBERED.test(line)) {
      [m, i] = list(lines, i, NUMBERED, 'ol');
      html += m;
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) para.push(lines[i++].trim());
      html += `<p>${inline(para.join(' '))}</p>`;
    }
  }
  return html;
}

// Markdown reduced to plain text, for search indexing and snippets.
export const plain = (md) =>
  md
    .replace(/^\s*(```|~~~).*$/gm, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*|`|^\s*[>#|]+\s?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
