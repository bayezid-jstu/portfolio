// Loads the Markdown files listed in data/content-index.js, reads their
// front matter and prepares them for listing, searching and display.
// A broken or missing file never breaks the site: it is skipped and reported
// in `warnings`.

import { parseFrontmatter } from './frontmatter.js';
import { renderMarkdown, safeUrl } from './markdown.js';
import { asArray, asString, byDateDesc, countWords, parseDate, readingMinutes, slugify, sameText } from './format.js';

const humanize = (slug) => slug.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

async function fetchText(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function normaliseCategory(value, categories, fallback) {
  const text = asString(value);
  if (!text) return { id: fallback.id, label: fallback.label };
  const hit = categories.find((c) => sameText(c.id, text) || sameText(c.label, text));
  return hit ? { id: hit.id, label: hit.label } : { id: slugify(text), label: text };
}

function parseLinks(value) {
  return asArray(value)
    .map((entry) => {
      const [label, ...rest] = entry.split('|');
      const url = rest.join('|').trim();
      if (!url) return null;
      const safe = safeUrl(url);
      return safe ? { label: label.trim() || safe, url: safe } : null;
    })
    .filter(Boolean);
}

function summaryFrom(plain) {
  const text = plain.replace(/\s+/g, ' ').trim();
  return text.length > 170 ? `${text.slice(0, 167).trimEnd()}…` : text;
}

function buildItem(kind, file, source, categories, fallbackCategory, warnings) {
  const { data, body } = parseFrontmatter(source);
  const route = kind === 'post' ? 'blog' : 'projects';
  const slug = slugify(asString(data.slug) || file.replace(/\.md$/i, ''));
  const title = asString(data.title) || humanize(slug);
  if (!asString(data.title)) warnings.push(`${file}: no "title" in the front matter, using "${title}".`);

  const dateText = asString(data.date);
  if (dateText && !parseDate(dateText)) warnings.push(`${file}: date "${dateText}" should look like 2026-03-14.`);
  const updatedText = asString(data.updated);

  const rendered = renderMarkdown(body, { anchorBase: `#/${route}/${slug}` });
  const wordCount = countWords(rendered.plainText);
  const category = normaliseCategory(data.category, categories, fallbackCategory);
  const tags = asArray(data.tags);
  const tech = asArray(data.tech);
  const summary = asString(data.summary) || summaryFrom(rendered.plainText);

  const item = {
    kind,
    file,
    slug,
    href: `#/${route}/${slug}`,
    title,
    summary,
    date: parseDate(dateText) ? dateText : '',
    updated: parseDate(updatedText) ? updatedText : '',
    category,
    tags,
    tech,
    status: asString(data.status),
    featured: data.featured === true,
    sample: data.sample === true,
    cover: asString(data.cover),
    coverAlt: asString(data.coverAlt) || (asString(data.cover) ? `Cover image for ${title}` : ''),
    coverWidth: Number(data.coverWidth) || 1280,
    coverHeight: Number(data.coverHeight) || 800,
    links: parseLinks(data.links),
    html: rendered.html,
    headings: rendered.headings,
    wordCount,
    readingMinutes: readingMinutes(wordCount),
    draft: data.draft === true,
  };
  item.searchText = [title, summary, category.label, ...tags, ...tech, item.status, rendered.plainText]
    .join(' ')
    .toLowerCase();
  return item;
}

export function createContentStore({ postFiles = [], projectFiles = [], projectCategories = [], blogCategories = [], fetcher = fetchText, base = 'content' }) {
  let pending = null;

  async function loadGroup(kind, files, folder, categories, fallbackCategory, warnings) {
    const results = await Promise.allSettled(files.map((file) => fetcher(`${base}/${folder}/${file}`)));
    const items = [];
    results.forEach((result, index) => {
      const file = files[index];
      if (result.status === 'rejected') {
        warnings.push(`Could not load ${base}/${folder}/${file} (${result.reason?.message ?? 'error'}). Check the file name in data/content-index.js.`);
        return;
      }
      try {
        const item = buildItem(kind, file, result.value, categories, fallbackCategory, warnings);
        if (!item.draft) items.push(item);
      } catch (error) {
        warnings.push(`Could not read ${file}: ${error.message}`);
      }
    });
    // two files with the same slug would clash: keep the first
    const seen = new Set();
    return items
      .filter((item) => {
        if (seen.has(item.slug)) { warnings.push(`${item.file}: slug "${item.slug}" is already used by another file and was skipped.`); return false; }
        seen.add(item.slug);
        return true;
      })
      .sort(byDateDesc);
  }

  function load() {
    if (!pending) {
      pending = (async () => {
        const warnings = [];
        const [posts, projects] = await Promise.all([
          loadGroup('post', postFiles, 'blog', blogCategories, { id: 'general', label: 'General' }, warnings),
          loadGroup('project', projectFiles, 'projects', projectCategories, { id: 'other', label: 'Other' }, warnings),
        ]);
        return { posts, projects, warnings };
      })().catch((error) => { pending = null; throw error; });
    }
    return pending;
  }

  return { load };
}

/* ---------------------------------------------------------- relationships */

const overlap = (a, b) => a.filter((t) => b.some((u) => sameText(t, u))).length;

/** Items from `pool` that share tags/technologies with `item`, best match first. */
export function relatedItems(item, pool, limit = 3) {
  const keys = [...item.tags, ...item.tech];
  return pool
    .filter((other) => other.slug !== item.slug || other.kind !== item.kind)
    .map((other) => ({
      other,
      score: overlap(keys, [...other.tags, ...other.tech]) * 2 + (other.category.id === item.category.id ? 1 : 0),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || byDateDesc(a.other, b.other))
    .slice(0, limit)
    .map((r) => r.other);
}

export function neighbours(item, list) {
  const index = list.findIndex((x) => x.slug === item.slug);
  return { newer: index > 0 ? list[index - 1] : null, older: index > -1 && index < list.length - 1 ? list[index + 1] : null };
}

/** All search terms must appear in the item's text. */
export function matchesQuery(item, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every((term) => item.searchText.includes(term));
}

/** Categories actually used by items, in the order given by the config. */
export function usedCategories(items, configured) {
  const used = new Map();
  items.forEach((item) => used.set(item.category.id, item.category.label));
  const ordered = configured.filter((c) => used.has(c.id)).map((c) => ({ id: c.id, label: c.label }));
  used.forEach((label, id) => { if (!ordered.some((c) => c.id === id)) ordered.push({ id, label }); });
  return ordered;
}

export function allTags(items) {
  const map = new Map();
  items.forEach((item) => item.tags.forEach((t) => map.set(slugify(t), t)));
  return [...map.entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
}
