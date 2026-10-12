// Gera docs/index.html a partir de docs/livro-regras-universal.md.
// Conversor mínimo: só o subconjunto de Markdown usado no livro.
// ponytail: parser de brinquedo — se o doc ganhar sintaxe nova, estenda aqui.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'docs/livro-regras-universal.md');
const OUT = resolve(root, 'docs/index.html');
const md = readFileSync(SRC, 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = (s) => s.replace(/[`*]/g, '');

function inline(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return t;
}

function slugger() {
  const seen = {};
  return (t) => {
    let s = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sec';
    if (seen[s] != null) s = `${s}-${++seen[s]}`; else seen[s] = 0;
    return s;
  };
}

function renderTable(rows) {
  const cells = (r) => r.replace(/\\\|/g, '\u0000').replace(/^\||\|$/g, '')
    .split('|').map((c) => c.replace(/\u0000/g, '|').trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  let out = '<table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
  for (const r of body) out += '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>';
  return out + '</tbody></table>';
}

const lines = md.split('\n');
const slug = slugger();
const body = [];
const toc = [];
const isItem = (l) => /^\s*[-*]\s+/.test(l);
const isNum = (l) => /^\s*\d+\.\s+/.test(l);
const isBlock = (l) => /^\s*$/.test(l) || /^[|>#]/.test(l) || /^```/.test(l) || /^---+\s*$/.test(l) || isItem(l) || isNum(l);

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  if (/^```/.test(line)) {
    const lang = line.slice(3).trim();
    const buf = [];
    for (i++; i < lines.length && !/^```/.test(lines[i]); i++) buf.push(lines[i]);
    i++;
    body.push(`<pre><code${lang ? ` class="lang-${lang}"` : ''}>${esc(buf.join('\n'))}</code></pre>`);
    continue;
  }

  const h = /^(#{1,3})\s+(.*)$/.exec(line);
  if (h) {
    const level = h[1].length;
    const text = h[2].trim();
    const id = slug(text);
    body.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
    if (level >= 2) toc.push({ level, text, id });
    i++;
    continue;
  }

  if (/^---+\s*$/.test(line)) { body.push('<hr>'); i++; continue; }

  if (/^\|/.test(line)) {
    const rows = [];
    while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
    body.push(renderTable(rows));
    continue;
  }

  if (/^>\s?/.test(line)) {
    const buf = [];
    while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
    body.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
    continue;
  }

  if (isItem(line) || isNum(line)) {
    const tag = isItem(line) ? 'ul' : 'ol';
    const marker = isItem(line) ? /^\s*[-*]\s+/ : /^\s*\d+\.\s+/;
    const items = [];
    while (i < lines.length) {
      if (marker.test(lines[i])) items.push(lines[i++].replace(marker, ''));
      else if (/^\s+\S/.test(lines[i]) && items.length && !/^[|>#`]/.test(lines[i].trim())) {
        items[items.length - 1] += ' ' + lines[i++].trim();
      } else break;
    }
    body.push(`<${tag}>` + items.map((b) => `<li>${inline(b)}</li>`).join('') + `</${tag}>`);
    continue;
  }

  if (isBlock(line)) { i++; continue; }

  const buf = [];
  while (i < lines.length && !isBlock(lines[i])) buf.push(lines[i++]);
  body.push(`<p>${inline(buf.join(' '))}</p>`);
}

const title = (lines.find((l) => /^#\s+/.test(l)) || '# WAI').replace(/^#\s+/, '');
const groups = [];
for (const t of toc) {
  if (t.level === 2) groups.push({ ...t, children: [] });
  else if (groups.length) groups[groups.length - 1].children.push(t);
}
const navList = groups.map((g) =>
  `<li><a href="#${g.id}">${esc(plain(g.text))}</a>${
    g.children.length ? `<ul>${g.children.map((c) => `<li><a href="#${c.id}">${esc(plain(c.text))}</a></li>`).join('')}</ul>` : ''
  }</li>`).join('');

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="Livro de regras do motor universal WAI GAME System (Wide Adventure Interface).">
<link rel="alternate" type="text/markdown" href="livro-regras-universal.md">
<style>
:root{--bg:#0d1117;--panel:#161b22;--text:#e6edf3;--muted:#8b949e;--accent:#e3b341;--line:#30363d;--code:#1f242c}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text)}
a{color:var(--accent)}
.layout{display:grid;grid-template-columns:290px 1fr;max-width:1200px;margin:0 auto}
nav{position:sticky;top:0;height:100vh;overflow:auto;padding:24px 16px;border-right:1px solid var(--line);background:var(--panel)}
nav .brand{font-weight:700;font-size:1.05rem}
nav .sub{color:var(--muted);font-size:.78rem;margin:2px 0 16px}
nav ul{list-style:none;margin:0;padding:0}
nav ul ul{padding-left:14px}
nav li{margin:2px 0}
nav a{display:block;padding:3px 6px;border-radius:6px;color:var(--text);text-decoration:none;font-size:.87rem}
nav a:hover{background:#21262d;color:var(--accent)}
main{padding:40px 48px;min-width:0}
article h1{font-size:2rem;margin-top:0}
article h2{margin-top:2.2em;padding-bottom:.3em;border-bottom:1px solid var(--line)}
article h3{margin-top:1.6em}
code{background:var(--code);padding:.15em .4em;border-radius:5px;font-size:.9em}
pre{background:var(--code);padding:16px;border-radius:10px;overflow:auto;border:1px solid var(--line)}
pre code{background:none;padding:0}
blockquote{margin:1.2em 0;padding:.6em 1em;border-left:3px solid var(--accent);background:var(--panel);border-radius:0 8px 8px 0;color:var(--muted)}
blockquote strong{color:var(--text)}
table{border-collapse:collapse;width:100%;margin:1.2em 0;font-size:.92rem;display:block;overflow:auto}
th,td{border:1px solid var(--line);padding:8px 12px;text-align:left;vertical-align:top}
th{background:var(--panel)}
hr{border:0;border-top:1px solid var(--line);margin:2.5em 0}
@media(max-width:820px){.layout{grid-template-columns:1fr}nav{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}main{padding:24px}}
</style>
</head>
<body>
<div class="layout">
<nav>
  <div class="brand">WAI GAME System</div>
  <div class="sub">Wide Adventure Interface</div>
  <ul>${navList}</ul>
</nav>
<main><article>
${body.join('\n')}
</article></main>
</div>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`docs/index.html gerado (${html.length} bytes, ${toc.length} seções)`);
