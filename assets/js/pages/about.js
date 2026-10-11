import { h } from '../lib/dom.js';
import { icon, hasIcon } from '../lib/icons.js';
import { isConfigured } from '../lib/format.js';
import { profile, skills } from '../config.js';
import { buttonLink, pageHeader, sampleNotice } from '../components/ui.js';
import { portrait } from '../components/portrait.js';
import { configuredLinks } from '../components/footer.js';

const list = (items) => (items.length ? h('ul', null, items.map((i) => h('li', null, i))) : null);

function section(title, ...children) {
  const content = children.filter(Boolean);
  if (content.length === 0) return null;
  return h('section', { class: 'about-section' }, h('h2', null, title), content);
}

export async function aboutView() {
  const facts = [];
  if (isConfigured(profile.discipline)) facts.push(['Discipline', profile.discipline]);
  if (isConfigured(profile.institution)) facts.push(['Institution', profile.institution]);
  if (isConfigured(profile.location)) facts.push(['Location', profile.location]);

  const links = configuredLinks();

  const aside = h('aside', { class: 'about-aside', 'aria-label': 'Profile summary' },
    portrait(),
    facts.length ? h('dl', { class: 'title-block' }, facts.map(([k, v]) => h('div', null, h('dt', null, k), h('dd', null, v)))) : null,
    links.length
      ? h('ul', { class: 'link-list', 'aria-label': 'Links' }, links.map((l) => h('li', null,
        h('a', { href: l.url, ...(/^https?:/i.test(l.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {}) },
          icon(hasIcon(l.icon) ? l.icon : 'link', { size: 18 }), l.label,
          /^https?:/i.test(l.url) ? h('span', { class: 'sr-only' }, ' (opens in a new tab)') : null))))
      : null);

  const skillGroups = skills.filter((g) => g.items.length > 0);

  const main = h('div', null,
    section('Introduction', ...profile.biography.map((p) => h('p', null, p))),
    section('Academic background',
      isConfigured(profile.discipline) ? h('p', null, `Discipline: ${profile.discipline}.`) : null,
      isConfigured(profile.institution) ? h('p', null, `Institution: ${profile.institution}.`) : null,
      h('p', null, h('a', { href: '#/education' }, 'See education and achievements'))),
    section('Areas of technical interest',
      profile.interests.length ? list(profile.interests.map((i) => (i.description ? `${i.name}: ${i.description}` : i.name))) : null),
    section('Skills and tools',
      skillGroups.length
        ? h('p', null, skillGroups.map((g) => g.group).join(', '), '. ', h('a', { href: '#/skills' }, 'See the full skills page'))
        : null),
    section('Currently learning', list(profile.currentlyLearning)),
    section('Academic and personal goals', list(profile.goals)),
    section('Professional interests', list(profile.professionalInterests)),
    section('CV',
      h('p', null, 'A full overview of my education, skills and projects.'),
      h('div', { class: 'btn-row' }, buttonLink({ href: '#/cv', label: 'View my CV', iconName: 'file-text' }))));

  return {
    title: 'About',
    description: `About ${profile.name}: ${profile.discipline}. ${profile.intro}`.slice(0, 300),
    node: h('div', { class: 'page' },
      h('div', { class: 'container' },
        pageHeader({ title: 'About me', lead: profile.headline }),
        sampleNotice('This page still has placeholder text. Edit data/profile.js to replace it with your own.'),
        h('div', { class: 'about-grid' }, aside, main))),
  };
}

