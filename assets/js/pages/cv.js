import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { isConfigured, formatDate } from '../lib/format.js';
import { profile, skills, education } from '../config.js';
import { buttonLink, pageHeader } from '../components/ui.js';
import { configuredLinks } from '../components/footer.js';

const when = (value) => (/^\d{4}-\d{2}(-\d{2})?$/.test(String(value)) ? formatDate(value) : String(value ?? ''));

/** True only if the file exists and is really a PDF (a missing file must not show a broken button). */
async function pdfExists(path) {
  if (!isConfigured(path)) return false;
  try {
    const response = await fetch(path, { method: 'HEAD', cache: 'no-cache' });
    const type = response.headers.get('content-type') || '';
    return response.ok && /pdf|octet-stream/i.test(type);
  } catch {
    return false;
  }
}

function cvSection(title, children) {
  const items = children.filter(Boolean);
  if (items.length === 0) return null;
  return h('section', null, h('h2', null, title), items);
}

const item = (title, meta, description) => h('div', { class: 'cv-item' },
  h('h3', null, title),
  meta ? h('p', { class: 'entry__meta' }, meta) : null,
  description ? h('p', null, description) : null);

export async function cvView({ content }) {
  const { projects } = await content.load();
  const shownProjects = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)].slice(0, 5);
  const links = configuredLinks();

  const contact = [
    isConfigured(profile.location) ? h('li', null, profile.location) : null,
    ...links.map((l) => h('li', null, h('a', { href: l.url, ...(/^https?:/i.test(l.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, l.url.replace(/^mailto:/, '').replace(/^https?:\/\//, '')))),
  ].filter(Boolean);

  const joinMeta = (...parts) => parts.filter((p) => p && String(p).trim()).join(', ');

  const cv = h('article', { class: 'cv', 'aria-label': `CV of ${profile.name}` },
    h('p', { class: 'cv__name' }, profile.name),
    h('p', { class: 'cv__headline' }, profile.headline),
    contact.length ? h('ul', { class: 'cv__contact' }, contact) : null,
    profile.intro ? h('p', null, profile.intro) : null,

    cvSection('Education', education.institutions.map((e) =>
      item(e.program, joinMeta(e.institution, e.period), e.description || (e.coursework?.length ? `Relevant coursework: ${e.coursework.join(', ')}.` : '')))),

    cvSection('Skills', [
      skills.filter((g) => g.items.length).length
        ? h('dl', { class: 'cv-skills' }, skills.filter((g) => g.items.length).flatMap((g) => [h('dt', null, g.group), h('dd', null, g.items.map((i) => i.name).join(', '))]))
        : null,
    ]),

    cvSection('Projects', shownProjects.map((p) => item(p.title, joinMeta(p.category.label, p.date && when(p.date), p.tech.slice(0, 5).join(', ')), p.summary))),

    cvSection('Certifications, awards and activities', [
      ...education.certifications.map((e) => item(e.title, joinMeta(e.issuer, e.date && when(e.date)), e.description)),
      ...education.awards.map((e) => item(e.title, joinMeta(e.issuer, e.date && when(e.date)), e.description)),
      ...education.competitions.map((e) => item(e.title, joinMeta(e.result, e.date && when(e.date)), e.description)),
      ...education.publications.map((e) => item(e.title, joinMeta(e.venue, e.date && when(e.date)), e.description)),
      ...education.workshops.map((e) => item(e.title, joinMeta(e.role, e.date && when(e.date)), e.description)),
    ]));

  const actions = h('div', { class: 'btn-row' });
  const note = h('p', { class: 'cv-note', role: 'status' });
  const printButton = h('button', { type: 'button', class: 'btn btn--quiet', onclick: () => window.print() }, icon('printer', { size: 18 }), 'Print or save as PDF');
  actions.append(printButton);

  pdfExists(profile.cvPdf).then((exists) => {
    if (exists) {
      actions.prepend(buttonLink({ href: profile.cvPdf, label: 'Download CV (PDF)', iconName: 'download', download: true }));
    } else {
      note.textContent = 'A ready-made PDF is not available yet. Use "Print or save as PDF" to save this page as one.';
    }
  });

  const node = h('div', { class: 'page' },
    h('div', { class: 'container listing' },
      h('div', { class: 'no-print' }, pageHeader({ title: 'Curriculum vitae', lead: 'A short overview of my education, skills and projects.' })),
      h('div', { class: 'cv-toolbar no-print' }, actions, note),
      cv));

  return { title: 'CV', description: `Curriculum vitae of ${profile.name}: education, skills, projects and achievements.`, node };
}
