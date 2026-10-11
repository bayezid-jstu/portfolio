// Pure helper functions (no DOM access) so they can also be unit-tested in Node.

/** True when a value is a non-empty string (used to hide unconfigured fields). */
export function isConfigured(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

/** Parses 'YYYY-MM-DD' (or 'YYYY-MM') as a UTC date. Returns null when invalid. */
export function parseDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return null;
  const year = +match[1];
  const month = +match[2];
  const day = match[3] ? +match[3] : 1;
  const date = new Date(Date.UTC(year, month - 1, day));
  // reject impossible dates such as 2026-13-45 or 2026-02-31 (JavaScript would roll them over)
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function formatDate(value) {
  const date = parseDate(value);
  if (!date) return '';
  const hasDay = /^\d{4}-\d{2}-\d{2}$/.test(String(value).trim());
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    ...(hasDay ? { day: 'numeric' } : {}),
    timeZone: 'UTC',
  }).format(date);
}

export function readingMinutes(wordCount) {
  return Math.max(1, Math.round(wordCount / 200));
}

export function countWords(text) {
  const words = String(text).trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return words ? words.length : 0;
}

export function initialsFrom(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function plural(count, one, many = one + 's') {
  return `${count} ${count === 1 ? one : many}`;
}

export function byDateDesc(a, b) {
  const da = parseDate(a.date)?.getTime() ?? 0;
  const db = parseDate(b.date)?.getTime() ?? 0;
  return db - da;
}

export function asArray(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (value == null || value === '') return [];
  return [String(value).trim()].filter(Boolean);
}

export function asString(value) {
  if (Array.isArray(value)) return '';
  return value == null ? '' : String(value).trim();
}

/** Compare strings ignoring case and punctuation. */
export function sameText(a, b) {
  return slugify(a) === slugify(b);
}
