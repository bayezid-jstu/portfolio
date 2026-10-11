import { h } from '../lib/dom.js';
import { icon, hasIcon } from '../lib/icons.js';
import { isConfigured } from '../lib/format.js';
import { profile, site } from '../config.js';
import { session } from '../lib/storage.js';

export const getSiteName = () => (isConfigured(site.siteName) ? site.siteName : profile.name);

export const isExternalUrl = (url) => /^https?:\/\//i.test(url);

/** Attributes + hidden text so external links open safely and are announced. */
function externalParts(url) {
  return isExternalUrl(url)
    ? { attrs: { target: '_blank', rel: 'noopener noreferrer' }, extra: h('span', { class: 'sr-only' }, ' (opens in a new tab)') }
    : { attrs: {}, extra: null };
}

export function linkIconName(url, fallback = 'external-link') {
  if (url.startsWith('#')) return 'arrow-right';
  if (/github\.com/i.test(url)) return 'github';
  if (/linkedin\.com/i.test(url)) return 'linkedin';
  if (/\.pdf($|[?#])/i.test(url)) return 'file-text';
  if (/^mailto:/i.test(url)) return 'mail';
  return fallback;
}

/** <a class="btn ..."> with optional icon; handles external-link safety. */
export function buttonLink({ href, label, variant = 'primary', iconName, download = false, iconAfter = false, className = '' }) {
  const { attrs, extra } = externalParts(href);
  const cls = `btn${variant === 'secondary' ? ' btn--secondary' : variant === 'quiet' ? ' btn--quiet' : ''}${className ? ` ${className}` : ''}`;
  const ic = iconName && hasIcon(iconName) ? icon(iconName, { size: 18 }) : null;
  return h('a', { class: cls, href, download: download ? '' : false, ...attrs }, !iconAfter && ic, label, iconAfter && ic, extra);
}

export function textLink({ href, label, iconName = 'arrow-right' }) {
  const { attrs, extra } = externalParts(href);
  return h('a', { class: 'text-link', href, ...attrs }, label, iconName ? icon(iconName, { size: 18 }) : null, extra);
}

export function sectionHead(title, { href, linkLabel, id } = {}) {
  return h('div', { class: 'section-head' },
    h('h2', { id }, title),
    href ? textLink({ href, label: linkLabel ?? 'View all' }) : null);
}

export function badge(text, variant = '') {
  return h('span', { class: `badge${variant ? ` badge--${variant}` : ''}` }, text);
}

export function tagList(items, { label } = {}) {
  if (!items || items.length === 0) return null;
  return h('ul', { class: 'tag-list', 'aria-label': label }, items.map((t) => h('li', { class: 'tag' }, t)));
}

export function breadcrumbs(items) {
  return h('nav', { class: 'breadcrumbs', 'aria-label': 'Breadcrumb' },
    h('ol', null, items.map((item, i) => {
      const last = i === items.length - 1;
      return h('li', null, last || !item.href
        ? h('span', { 'aria-current': last ? 'page' : false, title: item.label }, item.label)
        : h('a', { href: item.href }, item.label));
    })));
}

export function pageHeader({ title, lead, children }) {
  return h('header', { class: 'page-header' },
    h('h1', { tabindex: '-1' }, title),
    lead ? h('p', { class: 'lead' }, lead) : null,
    children);
}

export function emptyState({ title, text, action }) {
  return h('div', { class: 'empty-state', role: 'status' },
    h('h2', null, title),
    text ? h('p', null, text) : null,
    action ?? null);
}

/** A dashed notice that explains sample content. Returns null once the owner turns notices off. */
export function sampleNotice(text) {
  if (!site.showSampleNotices) return null;
  return h('div', { class: 'notice', role: 'note' }, icon('info', { size: 18 }), h('p', null, text));
}

/** Slim banner at the top of every page while sample content is still present. */
export function sampleBanner() {
  if (!site.showSampleNotices) return null;
  if (session.read('banner-dismissed') === '1') return null;
  const banner = h('div', { class: 'notice notice--banner', role: 'note' },
    icon('info', { size: 18 }),
    h('p', null, 'Template preview with sample content. Edit the data/ and content/ folders to make it yours.'),
    h('button', {
      type: 'button',
      class: 'notice__close',
      'aria-label': 'Dismiss this notice',
      onclick: () => { session.write('banner-dismissed', '1'); banner.remove(); },
    }, 'Dismiss'));
  return banner;
}

export function metaItem(iconName, text, label) {
  if (!text) return null;
  return h('span', { title: label }, icon(iconName, { size: 16 }), h('span', null, text));
}

export function linkButtons(links) {
  if (!links || links.length === 0) return null;
  return h('div', { class: 'btn-row' }, links.map((l, i) =>
    buttonLink({ href: l.url, label: l.label, variant: i === 0 ? 'primary' : 'quiet', iconName: linkIconName(l.url) })));
}
