// Reads the block at the top of a Markdown file:
//
//   ---
//   title: My article
//   tags: [circuits, notes]
//   links:
//     - Source code | https://github.com/...
//   ---
//
// Supported: "key: value" lines, inline lists [a, b], and "- item" lists.
// Comments start with # at the beginning of a line. Keep each value on one line.

function unquote(value) {
  const v = value.trim();
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return v;
}

function parseScalar(raw) {
  const v = raw.trim();
  if (v === '') return '';
  const quoted = (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"));
  if (quoted) return unquote(v);
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(v) && !/^0\d/.test(v)) return Number(v);
  return v;
}

function splitInlineList(inner) {
  const items = [];
  let current = '';
  let quote = null;
  for (const ch of inner) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
    } else if (ch === ',') {
      items.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim() !== '') items.push(current);
  return items.map(parseScalar).filter((item) => item !== '');
}

function parseValue(raw) {
  const v = raw.trim();
  if (v.startsWith('[') && v.endsWith(']')) return splitInlineList(v.slice(1, -1));
  return parseScalar(v);
}

export function parseYamlLite(text) {
  const data = {};
  let listKey = null;
  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && listKey) {
      if (!Array.isArray(data[listKey])) data[listKey] = [];
      data[listKey].push(parseScalar(item[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (pair) {
      const [, key, rest] = pair;
      if (rest.trim() === '') {
        data[key] = [];
        listKey = key;
      } else {
        data[key] = parseValue(rest);
        listKey = null;
      }
    }
  }
  return data;
}

export function parseFrontmatter(source) {
  const text = String(source).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = text.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!match) return { data: {}, body: text, hasFrontmatter: false };
  return { data: parseYamlLite(match[1]), body: text.slice(match[0].length), hasFrontmatter: true };
}
