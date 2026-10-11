import { h } from '../lib/dom.js';
import { icon, hasIcon } from '../lib/icons.js';
import { isConfigured } from '../lib/format.js';
import { navigation, profile } from '../config.js';

export function configuredLinks() {
  const links = profile.links.filter((l) => isConfigured(l.url));
  if (isConfigured(profile.email)) links.unshift({ label: 'Email', url: `mailto:${profile.email}`, icon: 'mail' });
  return links;
}

export function renderFooter(container) {
  const links = configuredLinks();
  const year = new Date().getFullYear();

  const footer = h('footer', { class: 'site-footer' },
    h('div', { class: 'container site-footer__inner' },
      h('div', null,
        h('nav', { class: 'footer-nav', 'aria-label': 'Footer' },
          h('ul', null, navigation.map((n) => h('li', null, h('a', { href: n.href }, n.label))))),
        h('p', null, `© ${year} ${profile.name}`)),
      links.length
        ? h('ul', { class: 'footer-links', 'aria-label': 'Professional links' },
          links.map((l) => h('li', null,
            h('a', {
              href: l.url,
              ...(/^https?:/i.test(l.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
            },
            icon(hasIcon(l.icon) ? l.icon : 'link', { size: 18 }), l.label,
            /^https?:/i.test(l.url) ? h('span', { class: 'sr-only' }, ' (opens in a new tab)') : null))))
        : null));

  container.replaceChildren(footer);
}
