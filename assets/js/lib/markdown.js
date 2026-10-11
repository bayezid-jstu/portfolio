// A small, safe Markdown renderer written for this site.
//
// Safety: raw HTML in Markdown is NEVER passed through. Everything is escaped,
// and only the HTML tags generated below can appear in the output. Links and
// images only allow http(s), mailto, tel, relative paths and #anchors.
//
// Supported: headings, paragraphs, **bold**, *italic*, ~~strike~~, `code`,
// [links](url), ![images](url "caption"){800x500}, lists (nested, task lists),
// > quotes, tables, --- rules, ```fenced code``` with highlighting,
// $inline maths$ and $$display maths$$.

import { highlight, normalizeLanguage } from './highlight.js';
import { texToMathML } from './math.js';
import { slugify } from './format.js';

export const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Returns a safe URL string, or null if the URL uses a blocked scheme. */
export function safeUrl(url) {
  const u = String(url).trim().replace(/[\u0000-\u001f\u007f]/g, '');
  if (u === '') return null;
  const scheme = u.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme[1].toLowerCase())) return null;
  return u;
}

function isExternal(href) {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return typeof location === 'undefined' || new URL(href).host !== location.host;
  } catch {
    return true;
  }
}

function renderLink(innerHtml, href, title) {
  const url = safeUrl(href);
  if (!url) return innerHtml;
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  if (isExternal(url)) {
    return `<a href="${escapeHtml(url)}"${titleAttr} target="_blank" rel="noopener noreferrer">${innerHtml}<span class="sr-only"> (opens in a new tab)</span></a>`;
  }
  return `<a href="${escapeHtml(url)}"${titleAttr}>${innerHtml}</a>`;
}

/* ------------------------------------------------------------------ inline */

function applyEmphasis(text) {
  return text
    .replace(/\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w*])\*(?=[^\s*])([\s\S]*?[^\s*])\*(?![\w*])/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
    .replace(/(^|[^\w])_(?=[^\s_])([\s\S]*?[^\s_])_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>')
    .replace(/ {2,}\n/g, '<br>\n');
}

export function renderInline(input) {
  const stash = [];
  const hold = (html) => {
    stash.push(html);
    return `\u0000${stash.length - 1}\u0000`;
  };

  let text = String(input).replace(/\u0000/g, '');

  // backslash escapes (\* \_ \$ ...) and `code spans`, handled in ONE left-to-right pass so that
  // a backslash inside a code span stays literal and an escaped backtick does not start a span
  text = text.replace(/\\([\\`*_{}\[\]()#+\-.!|~$<>])|(`+)([\s\S]*?[^`])\2(?!`)/g, (_, escaped, __, code) =>
    (escaped !== undefined ? hold(escapeHtml(escaped)) : hold(`<code>${escapeHtml(code.trim())}</code>`)));

  // inline maths: $...$ (no space just inside the dollars, so "$5 and $6" is left alone)
  text = text.replace(/(^|[^\\$\w])\$(?!\s)([^$\n]*?[^\s$\\])\$(?![\w$])/g, (_, before, tex) => before + hold(texToMathML(tex, false)));

  // images and links
  text = text.replace(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/g, (_, alt, src) => {
    const url = safeUrl(src);
    if (!url) return hold(escapeHtml(alt));
    return hold(`<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`);
  });
  text = text.replace(/\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/g, (_, label, href, title) =>
    hold(renderLink(applyEmphasis(escapeHtml(label)), href, title)));

  // <https://autolinks> and bare https:// URLs
  text = text.replace(/<((?:https?:\/\/|mailto:)[^\s<>]+)>/g, (_, url) => hold(renderLink(escapeHtml(url), url)));
  text = text.replace(/(^|[\s(])(https?:\/\/[^\s<>)]+[^\s<>).,;:!?])/g, (_, before, url) => before + hold(renderLink(escapeHtml(url), url)));

  text = applyEmphasis(escapeHtml(text));

  // put protected pieces back (they can be nested, e.g. code inside a link label)
  const restore = /\u0000(\d+)\u0000/g;
  for (let pass = 0; pass < 4 && restore.test(text); pass++) {
    restore.lastIndex = 0;
    text = text.replace(restore, (_, n) => stash[Number(n)] ?? '');
    restore.lastIndex = 0;
  }
  return text;
}

/* ------------------------------------------------------------------ blocks */

const RESERVED_IDS = new Set(['app', 'main-content', 'announcer', 'site-header', 'site-footer']);

function uniqueId(base, ctx) {
  let id = RESERVED_IDS.has(base) ? `${base}-section` : base;
  const count = ctx.ids.get(id) ?? 0;
  ctx.ids.set(id, count + 1);
  if (count > 0) id = `${id}-${count + 1}`;
  return id;
}

function plainFromInline(html) {
  return html.replace(/<span class="sr-only">[^<]*<\/span>/g, '').replace(/<math[\s\S]*?<\/math>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function renderCode(code, langRaw, title) {
  const lang = normalizeLanguage(langRaw);
  const label = title || (langRaw ? String(langRaw) : 'text');
  const body = highlight(code, langRaw);
  return (
    `<div class="code-block" data-lang="${escapeHtml(lang)}">` +
    `<div class="code-block__head"><span>${escapeHtml(label)}</span>` +
    `<button type="button" class="code-copy" aria-label="Copy code to clipboard">Copy</button></div>` +
    `<pre tabindex="0" aria-label="${escapeHtml(label)} code"><code class="language-${escapeHtml(lang)}">${body}</code></pre></div>`
  );
}

const LIST_ITEM = /^( *)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const HEADING = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)\s*(.*)$/;
const HR = /^ {0,3}([-*_])( *\1){2,} *$/;
const TABLE_DELIM = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;

const indentOf = (line) => line.match(/^ */)[0].length;

function splitRow(line) {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
  const cells = [];
  let current = '';
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '\\' && row[i + 1] === '|') { current += '|'; i++; }
    else if (row[i] === '|') { cells.push(current.trim()); current = ''; }
    else current += row[i];
  }
  cells.push(current.trim());
  return cells;
}

function startsBlock(lines, i) {
  const line = lines[i];
  return (
    HEADING.test(line) || FENCE.test(line) || HR.test(line) || /^ {0,3}>/.test(line) ||
    LIST_ITEM.test(line) || /^\s*\$\$/.test(line) || isTableStart(lines, i)
  );
}

function isTableStart(lines, i) {
  return (
    i + 1 < lines.length &&
    lines[i].includes('|') &&
    TABLE_DELIM.test(lines[i + 1]) &&
    lines[i + 1].includes('-') &&
    (lines[i + 1].includes('|') || lines[i].trim().startsWith('|'))
  );
}

function renderTable(lines, start, ctx) {
  const header = splitRow(lines[start]);
  const aligns = splitRow(lines[start + 1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'al-c' : c.endsWith(':') ? 'al-r' : ''));
  let i = start + 2;
  const rows = [];
  while (i < lines.length && lines[i].trim() !== '' && lines[i].includes('|')) {
    rows.push(splitRow(lines[i]));
    i++;
  }
  const cell = (tag, text, idx) => {
    const cls = aligns[idx] ? ` class="${aligns[idx]}"` : '';
    const scope = tag === 'th' ? ' scope="col"' : '';
    return `<${tag}${scope}${cls}>${renderInline(text ?? '')}</${tag}>`;
  };
  const head = `<thead><tr>${header.map((c, idx) => cell('th', c, idx)).join('')}</tr></thead>`;
  const body = `<tbody>${rows.map((r) => `<tr>${header.map((_, idx) => cell('td', r[idx], idx)).join('')}</tr>`).join('')}</tbody>`;
  ctx.plain.push(header.join(' '), ...rows.map((r) => r.join(' ')));
  return {
    html: `<div class="table-wrap" role="region" aria-label="Table, scrollable" tabindex="0"><table>${head}${body}</table></div>`,
    next: i,
  };
}

function renderList(lines, start, ctx) {
  const first = lines[start].match(LIST_ITEM);
  const baseIndent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const items = [];
  let i = start;
  let loose = false;

  while (i < lines.length) {
    if (lines[i].trim() === '') {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const next = j < lines.length ? lines[j].match(LIST_ITEM) : null;
      if (next && next[1].length === baseIndent && /\d/.test(next[2]) === ordered) {
        loose = true;
        i = j;
      } else {
        break;
      }
    }
    const m = lines[i].match(LIST_ITEM);
    if (!m || m[1].length !== baseIndent || /\d/.test(m[2]) !== ordered) break;
    const contentIndent = m[1].length + m[2].length + 1;
    const itemLines = [m[3]];
    i++;
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === '') {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        if (j < lines.length && indentOf(lines[j]) > baseIndent) {
          itemLines.push('');
          loose = true;
          i++;
          continue;
        }
        break;
      }
      if (indentOf(l) > baseIndent) {
        itemLines.push(l.slice(Math.min(indentOf(l), contentIndent)));
        i++;
        continue;
      }
      break;
    }
    items.push(itemLines);
  }

  const hasTasks = items.some((lns) => /^\[[ xX]\]\s/.test(lns[0]));
  const html = items
    .map((lns) => {
      let task = null;
      const t = lns[0].match(/^\[([ xX])\]\s+(.*)$/);
      if (t) {
        task = t[1].toLowerCase() === 'x';
        lns = [t[2], ...lns.slice(1)];
      }
      let inner = parseBlocks(lns, ctx);
      if (!loose) inner = inner.replace(/^<p>([\s\S]*?)<\/p>/, '$1');
      if (task === null) return `<li>${inner}</li>`;
      const box = `<input type="checkbox" disabled${task ? ' checked' : ''} aria-label="${task ? 'Done' : 'Not done'}">`;
      return `<li class="task-item">${box}<span>${inner}</span></li>`;
    })
    .join('');

  const tag = ordered ? 'ol' : 'ul';
  const startAttr = ordered && Number.parseInt(first[2], 10) !== 1 ? ` start="${Number.parseInt(first[2], 10)}"` : '';
  const cls = hasTasks ? ' class="task-list"' : '';
  return { html: `<${tag}${startAttr}${cls}>${html}</${tag}>`, next: i };
}

function parseBlocks(lines, ctx) {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }

    // fenced code
    let m = line.match(FENCE);
    if (m) {
      const fence = m[1];
      const closer = new RegExp(`^ {0,3}${fence[0] === '`' ? '`' : '~'}{${fence.length},}\\s*$`);
      const buf = [];
      i++;
      while (i < lines.length && !closer.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      out.push(renderCode(buf.join('\n'), m[2], m[3].trim()));
      ctx.plain.push(buf.join(' '));
      continue;
    }

    // display maths
    if (/^\s*\$\$/.test(line)) {
      const first = line.trim().slice(2);
      const buf = [];
      if (first.includes('$$')) {
        buf.push(first.slice(0, first.indexOf('$$')));
        i++;
      } else {
        if (first.trim()) buf.push(first);
        i++;
        while (i < lines.length && !lines[i].includes('$$')) { buf.push(lines[i]); i++; }
        if (i < lines.length) { buf.push(lines[i].slice(0, lines[i].indexOf('$$'))); i++; }
      }
      out.push(`<div class="math-block">${texToMathML(buf.join('\n').trim(), true)}</div>`);
      continue;
    }

    // heading
    m = line.match(HEADING);
    if (m) {
      const level = Math.min(6, Math.max(2, m[1].length)); // page title is the h1
      const html = renderInline(m[2]);
      const text = plainFromInline(html);
      const id = uniqueId(slugify(text), ctx);
      ctx.headings.push({ level, id, text });
      ctx.plain.push(text);
      const anchor = ctx.anchorBase
        ? `<a class="anchor" href="${escapeHtml(ctx.anchorBase)}#${id}" aria-label="Link to section: ${escapeHtml(text)}">#</a>`
        : '';
      out.push(`<h${level} id="${id}">${html}${anchor}</h${level}>`);
      i++;
      continue;
    }

    if (HR.test(line)) { out.push('<hr>'); i++; continue; }

    // blockquote
    if (/^ {0,3}>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^ {0,3}>/.test(lines[i])) {
        buf.push(lines[i].replace(/^ {0,3}> ?/, ''));
        i++;
      }
      out.push(`<blockquote>${parseBlocks(buf, ctx)}</blockquote>`);
      continue;
    }

    // table
    if (isTableStart(lines, i)) {
      const t = renderTable(lines, i, ctx);
      out.push(t.html);
      i = t.next;
      continue;
    }

    // list
    if (LIST_ITEM.test(line) && !HR.test(line)) {
      const l = renderList(lines, i, ctx);
      out.push(l.html);
      i = l.next;
      continue;
    }

    // image on its own line -> figure
    m = line.trim().match(/^!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)(?:\{(\d+)x(\d+)\})?$/);
    if (m) {
      const url = safeUrl(m[2]);
      if (url) {
        const size = m[4] ? ` width="${m[4]}" height="${m[5]}"` : '';
        const caption = m[3] ? `<figcaption>${renderInline(m[3])}</figcaption>` : '';
        out.push(`<figure class="figure"><img src="${escapeHtml(url)}" alt="${escapeHtml(m[1])}"${size} loading="lazy" decoding="async">${caption}</figure>`);
        ctx.plain.push(m[1], m[3] ?? '');
        i++;
        continue;
      }
    }

    // paragraph
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !startsBlock(lines, i)) { buf.push(lines[i]); i++; }
    const html = renderInline(buf.join('\n'));
    out.push(`<p>${html}</p>`);
    ctx.plain.push(plainFromInline(html));
  }

  return out.join('\n');
}

/**
 * renderMarkdown(source, { anchorBase: '#/blog/my-post' })
 * -> { html, headings: [{ level, id, text }], plainText }
 */
export function renderMarkdown(source, options = {}) {
  const ctx = { headings: [], ids: new Map(), plain: [], anchorBase: options.anchorBase ?? '' };
  const lines = String(source).replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  const html = parseBlocks(lines, ctx);
  return { html, headings: ctx.headings, plainText: ctx.plain.join(' ') };
}
