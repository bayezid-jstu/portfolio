import { h } from '../lib/dom.js';
import { isConfigured } from '../lib/format.js';
import { profile, site, education, PLACEHOLDER_NAME } from '../config.js';
import { buttonLink, sectionHead } from '../components/ui.js';
import { portrait } from '../components/portrait.js';
import { projectCard, postRow } from '../components/cards.js';
import { setStructuredData } from '../lib/seo.js';

export async function homeView({ content }) {
  const { projects, posts } = await content.load();

  const featured = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)].slice(0, site.homeFeaturedProjects);
  const recent = posts.slice(0, site.homeRecentPosts);

  const facts = [];
  if (isConfigured(profile.discipline)) facts.push(['Studying', profile.discipline]);
  if (isConfigured(profile.institution)) facts.push(['Institution', profile.institution]);
  if (isConfigured(profile.location)) facts.push(['Location', profile.location]);

  const hero = h('section', { class: 'container hero', 'aria-labelledby': 'page-title' },
    h('div', { class: 'hero__text' },
      h('h1', { id: 'page-title', tabindex: '-1' }, profile.name),
      h('p', { class: 'hero__headline' }, profile.headline),
      h('p', { class: 'hero__intro' }, profile.intro),
      h('div', { class: 'btn-row' },
        buttonLink({ href: '#/projects', label: 'View projects', iconName: 'arrow-right', iconAfter: true }),
        buttonLink({ href: '#/about', label: 'About me', variant: 'secondary' }),
        buttonLink({ href: '#/cv', label: 'CV', variant: 'quiet', iconName: 'file-text' })),
      facts.length
        ? h('dl', { class: 'title-block hero__facts' }, facts.map(([k, v]) => h('div', null, h('dt', null, k), h('dd', null, v))))
        : null),
    h('div', { class: 'hero__portrait' }, portrait()));

  const sections = [hero];

  if (featured.length) {
    sections.push(h('section', { class: 'container section', 'aria-labelledby': 'featured-title' },
      sectionHead('Featured projects', { href: '#/projects', linkLabel: 'All projects', id: 'featured-title' }),
      h('ul', { class: 'grid grid--3' }, featured.map((p) => projectCard(p)))));
  }

  if (profile.interests.length) {
    sections.push(h('section', { class: 'container section', 'aria-labelledby': 'interests-title' },
      sectionHead('Technical interests', { id: 'interests-title' }),
      h('ul', { class: 'interest-list' }, profile.interests.map((i) =>
        h('li', null, h('strong', null, i.name), i.description ? h('span', null, i.description) : null)))));
  }

  if (recent.length) {
    sections.push(h('section', { class: 'container section', 'aria-labelledby': 'articles-title' },
      sectionHead('Recent articles', { href: '#/blog', linkLabel: 'All articles', id: 'articles-title' }),
      h('ul', { class: 'post-list' }, recent.map((p) => postRow(p)))));
  }

  /* highlights come only from what exists in data/education.js */
  const real = education.institutions.filter((x) => !x.placeholder);
  const placeholders = education.institutions.filter((x) => x.placeholder);
  const eduShown = real.length ? real : placeholders;
  const achievements = [...education.awards, ...education.certifications, ...education.competitions].slice(0, 4);
  if (eduShown.length || achievements.length) {
    sections.push(h('section', { class: 'container section', 'aria-labelledby': 'highlights-title' },
      sectionHead('Academic highlights', { href: '#/education', linkLabel: 'Education and achievements', id: 'highlights-title' }),
      h('div', { class: 'highlights' },
        eduShown.length
          ? h('div', { class: 'highlight' }, h('h3', null, 'Education'),
            h('ul', null, eduShown.map((e) => h('li', null, `${e.program}, ${e.institution}${e.period ? ` (${e.period})` : ''}`))))
          : null,
        achievements.length
          ? h('div', { class: 'highlight' }, h('h3', null, 'Achievements'),
            h('ul', null, achievements.map((a) => h('li', null, `${a.title}${a.issuer ? `, ${a.issuer}` : ''}${a.result ? `, ${a.result}` : ''}`))))
          : null)));
  }

  /* structured data only once the owner replaced the placeholder name */
  if (profile.name !== PLACEHOLDER_NAME) {
    const sameAs = profile.links.filter((l) => isConfigured(l.url)).map((l) => l.url);
    setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.name,
      jobTitle: profile.headline,
      ...(sameAs.length ? { sameAs } : {}),
    });
  } else {
    setStructuredData(null);
  }

  return {
    title: '',
    description: `${profile.name}: ${profile.headline}. ${profile.intro}`.slice(0, 300),
    node: h('div', { class: 'page' }, sections),
  };
}
