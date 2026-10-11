import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { formatDate } from '../lib/format.js';
import { badge, tagList } from './ui.js';
import { site } from '../config.js';

export function coverImage(item, { eager = false } = {}) {
  if (!item.cover) return null;
  const img = h('img', {
    src: item.cover,
    alt: item.coverAlt,
    width: item.coverWidth,
    height: item.coverHeight,
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
  });
  img.addEventListener('error', () => img.remove(), { once: true });
  return img;
}

/** `level` is the heading level of the card title: 2 on pages where the cards sit directly under the h1, otherwise 3. */
export function projectCard(project, { level = 3 } = {}) {
  const showSample = site.showSampleNotices && project.sample;
  const meta = h('div', { class: 'card__meta' },
    h('span', null, project.category.label),
    project.status ? h('span', null, project.status) : null,
    project.date ? h('span', null, formatDate(project.date)) : null,
    showSample ? badge('Sample', 'sample') : null,
    project.featured ? badge('Featured') : null);

  const techShown = project.tech.slice(0, 4);
  const extra = project.tech.length - techShown.length;

  return h('li', { class: 'card' },
    h('div', { class: 'card__media' }, coverImage(project)),
    h('div', { class: 'card__body' },
      meta,
      h(`h${level}`, { class: 'card__title' }, h('a', { href: project.href }, project.title)),
      h('p', { class: 'card__summary' }, project.summary),
      tagList(extra > 0 ? [...techShown, `+${extra} more`] : techShown, { label: 'Technologies' })));
}

export function postRow(post, { level = 3 } = {}) {
  const showSample = site.showSampleNotices && post.sample;
  return h('li', { class: 'post-row' },
    h(`h${level}`, { class: 'post-row__title' }, h('a', { href: post.href }, post.title)),
    h('p', { class: 'post-row__summary' }, post.summary),
    h('div', { class: 'post-row__meta' },
      post.date ? h('span', null, icon('calendar', { size: 16 }), formatDate(post.date)) : null,
      h('span', null, icon('clock', { size: 16 }), `${post.readingMinutes} min read`),
      h('span', null, icon('tag', { size: 16 }), post.category.label),
      showSample ? badge('Sample', 'sample') : null),
    tagList(post.tags, { label: 'Tags' }));
}
