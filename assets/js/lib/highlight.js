// Small, dependency-free syntax highlighter. It escapes all code first, so
// the output is always safe to insert as HTML.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const words = (s) => new Set(s.split(/\s+/).filter(Boolean));

const JS_KW = words(`async await break case catch class const continue debugger default delete do else export extends
  finally for from function if import in instanceof let new of return static super switch this throw try typeof var void
  while with yield true false null undefined interface type enum implements readonly public private protected as`);
const PY_KW = words(`and as assert async await break class continue def del elif else except finally for from global if
  import in is lambda nonlocal not or pass raise return try while with yield True False None`);
const C_KW = words(`auto break case catch class const constexpr continue default delete do else enum extern for goto if
  inline namespace new operator private protected public register return sizeof static struct switch template this throw
  try typedef union using virtual volatile while true false nullptr NULL HIGH LOW INPUT OUTPUT INPUT_PULLUP`);
const C_TYPES = words(`int long short char float double void bool byte boolean unsigned signed size_t uint8_t uint16_t
  uint32_t int8_t int16_t int32_t String string word`);
const MATLAB_KW = words(`break case catch classdef continue else elseif end for function global if otherwise parfor
  persistent return switch try while true false`);
const BASH_KW = words(`if then else elif fi for while do done case esac function in echo cd ls mkdir rm cp mv cat git npm
  python python3 node export source`);
const JSON_KW = words('true false null');

const LANGUAGES = {
  js: { kw: JS_KW, line: '//', block: ['/*', '*/'], strings: ['`', '"', "'"], fnCall: true },
  py: { kw: PY_KW, line: '#', strings: ['"""', "'''", '"', "'"], fnCall: true },
  c: { kw: C_KW, types: C_TYPES, line: '//', block: ['/*', '*/'], strings: ['"', "'"], preproc: true, fnCall: true },
  matlab: { kw: MATLAB_KW, line: '%', strings: ["'", '"'], fnCall: true },
  bash: { kw: BASH_KW, line: '#', strings: ['"', "'"] },
  json: { kw: JSON_KW, strings: ['"'] },
  css: { kw: new Set(), block: ['/*', '*/'], strings: ['"', "'"], css: true },
  html: { markup: true },
  text: {},
};

const ALIASES = {
  javascript: 'js', jsx: 'js', mjs: 'js', ts: 'js', typescript: 'js', tsx: 'js',
  python: 'py', python3: 'py',
  cpp: 'c', 'c++': 'c', cc: 'c', h: 'c', arduino: 'c', ino: 'c', java: 'c', 'c#': 'c', cs: 'c',
  m: 'matlab', octave: 'matlab',
  sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash',
  xml: 'html', svg: 'html',
  plain: 'text', txt: 'text', '': 'text',
};

const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildRegex(def) {
  const END = '(?![\\s\\S])'; // true end of input (with the m flag, $ would mean end of line)
  const parts = [];
  if (def.block) parts.push(`(?<comment>${reEscape(def.block[0])}[\\s\\S]*?(?:${reEscape(def.block[1])}|${END}))`);
  if (def.line) parts.push(`(?<comment2>${reEscape(def.line)}[^\\n]*)`);
  if (def.preproc) parts.push('(?<preproc>^[ \\t]*#[ \\t]*[A-Za-z]+)');
  if (def.strings?.length) {
    const alts = def.strings.map((q) => {
      const e = reEscape(q);
      if (q.length === 3) return `${e}[\\s\\S]*?(?:${e}|${END})`;
      const notNewline = q === '`' ? '' : '\\n';
      return `${e}(?:\\\\[\\s\\S]|[^\\\\${notNewline}${e}])*(?:${e}|$)`;
    });
    parts.push(`(?<string>${alts.join('|')})`);
  }
  parts.push('(?<number>\\b(?:0[xX][0-9a-fA-F_]+|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b)');
  parts.push('(?<word>[A-Za-z_$][\\w$]*)');
  return new RegExp(parts.join('|'), 'gm');
}

function highlightMarkup(code) {
  let out = '';
  let last = 0;
  const re = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g;
  let m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    if (m[0].startsWith('<!--')) {
      out += `<span class="tok-comment">${esc(m[0])}</span>`;
    } else {
      const tag = m[0].match(/^(<\/?)([A-Za-z][\w:-]*)([\s\S]*?)(\/?>)$/);
      if (!tag) {
        out += esc(m[0]);
      } else {
        const attrs = esc(tag[3]).replace(/("[^"]*"|'[^']*')/g, '<span class="tok-string">$1</span>');
        out += `${esc(tag[1])}<span class="tok-keyword">${esc(tag[2])}</span>${attrs}${esc(tag[4])}`;
      }
    }
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}

export function normalizeLanguage(lang) {
  const key = String(lang || '').toLowerCase();
  const resolved = ALIASES[key] ?? key;
  return LANGUAGES[resolved] ? resolved : 'text';
}

export function highlight(code, lang) {
  const key = normalizeLanguage(lang);
  const def = LANGUAGES[key];
  if (def.markup) return highlightMarkup(code);
  if (key === 'text') return esc(code);

  const re = def.re || (def.re = buildRegex(def));
  re.lastIndex = 0;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(code))) {
    if (m[0] === '') { re.lastIndex++; continue; }
    out += esc(code.slice(last, m.index));
    const g = m.groups;
    const text = esc(m[0]);
    if (g.comment !== undefined || g.comment2 !== undefined) {
      out += `<span class="tok-comment">${text}</span>`;
    } else if (g.preproc !== undefined) {
      out += `<span class="tok-keyword">${text}</span>`;
    } else if (g.string !== undefined) {
      out += `<span class="tok-string">${text}</span>`;
    } else if (g.number !== undefined) {
      out += `<span class="tok-number">${text}</span>`;
    } else if (g.word !== undefined) {
      const w = m[0];
      if (def.kw.has(w)) out += `<span class="tok-keyword">${text}</span>`;
      else if (def.types?.has(w)) out += `<span class="tok-type">${text}</span>`;
      else if (def.fnCall && code[m.index + w.length] === '(') out += `<span class="tok-fn">${text}</span>`;
      else out += text;
    } else {
      out += text;
    }
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}
