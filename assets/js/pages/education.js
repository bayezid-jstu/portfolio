import { h } from '../lib/dom.js';
import { education, site } from '../config.js';
import { formatDate, isConfigured } from '../lib/format.js';
import { badge, emptyState, pageHeader, sampleNotice, tagList, textLink } from '../components/ui.js';

const when = (value) => (/^\d{4}-\d{2}(-\d{2})?$/.test(String(value)) ? formatDate(value) : String(value ?? ''));

function entry({ title, meta, description, tags, url, placeholder }) {
  return h('li', { class: 'entry' },
    h('h3', null, title, placeholder && site.showSampleNotices ? ' ' : null, placeholder && site.showSampleNotices ? badge('Placeholder', 'sample') : null),
    meta ? h('div', { class: 'entry__meta' }, meta) : null,
    description ? h('p', null, description) : null,
    tags && tags.length ? tagList(tags, { label: 'Relevant coursework' }) : null,
    isConfigured(url) ? h('p', null, textLink({ href: url, label: 'Read more', iconName: 'external-link' })) : null);
}

const joinMeta = (...parts) => parts.filter((p) => p !== undefined && p !== null && String(p).trim() !== '').join(', ');

/** Each section: [heading, list of entries]. Empty lists are skipped. */
function sections() {
  return [
    ['Education', education.institutions.map((e) => entry({
      title: e.program, meta: joinMeta(e.institution, e.period), description: e.description, tags: e.coursework, placeholder: e.placeholder,
    }))],
    ['Academic projects', education.academicProjects.map((e) => entry({ title: e.title, meta: joinMeta(e.period), description: e.description, url: e.url }))],
    ['Certifications', education.certifications.map((e) => entry({ title: e.title, meta: joinMeta(e.issuer, e.date && when(e.date)), description: e.description, url: e.url }))],
    ['Awards', education.awards.map((e) => entry({ title: e.title, meta: joinMeta(e.issuer, e.date && when(e.date)), description: e.description, url: e.url }))],
    ['Competitions', education.competitions.map((e) => entry({ title: e.title, meta: joinMeta(e.result, e.date && when(e.date)), description: e.description, url: e.url }))],
    ['Publications', education.publications.map((e) => entry({ title: e.title, meta: joinMeta(e.venue, e.date && when(e.date)), description: e.description, url: e.url }))],
    ['Workshops and activities', education.workshops.map((e) => entry({ title: e.title, meta: joinMeta(e.role, e.date && when(e.date)), description: e.description, url: e.url }))],
  ].filter(([, items]) => items.length > 0);
}

export async function educationView() {
  const parts = sections();
  const hasPlaceholder = education.institutions.some((e) => e.placeholder);

  const node = h('div', { class: 'page' },
    h('div', { class: 'container listing' },
      pageHeader({ title: 'Education and achievements', lead: 'Where I study, what I have completed, and what I am working towards.' }),
      hasPlaceholder ? sampleNotice('This page shows placeholder entries. Replace them in data/education.js. Sections without entries are hidden automatically.') : null,
      parts.length
        ? parts.map(([heading, items], i) => h('section', { class: 'edu-section', 'aria-labelledby': `edu-${i}` },
          h('h2', { id: `edu-${i}` }, heading),
          h('ul', { class: 'timeline' }, items)))
        : emptyState({ title: 'Nothing listed yet', text: 'Education and achievements will appear here once they are added to data/education.js.' })));

  return { title: 'Education and achievements', description: 'Education, certifications, awards, competitions, publications and activities.', node };
}
