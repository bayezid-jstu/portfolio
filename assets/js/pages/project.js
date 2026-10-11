import { h } from '../lib/dom.js';
import { formatDate } from '../lib/format.js';
import { relatedItems, neighbours } from '../lib/content.js';
import { site } from '../config.js';
import { breadcrumbs, linkButtons, sampleNotice, tagList, buttonLink } from '../components/ui.js';
import { coverImage, projectCard, postRow } from '../components/cards.js';
import { prose, tableOfContents } from '../components/prose.js';
import { notFoundView } from './not-found.js';

export async function projectView({ params, content }) {
  const { projects, posts } = await content.load();
  const project = projects.find((p) => p.slug === params.slug);
  if (!project) {
    return notFoundView({
      title: 'Project not found',
      text: 'That project does not exist (or has been renamed).',
      backHref: '#/projects',
      backLabel: 'Browse all projects',
    });
  }

  const { newer, older } = neighbours(project, projects);
  const relatedProjects = relatedItems(project, projects.filter((p) => p.slug !== project.slug), 3);
  const relatedPosts = relatedItems(project, posts, 3);
  const toc = tableOfContents(project.headings, project.href, { min: 3 });

  const facts = [
    ['Category', project.category.label],
    project.status ? ['Status', project.status] : null,
    project.date ? ['Date', formatDate(project.date)] : null,
    project.tech.length ? ['Tools and technologies', project.tech.join(', ')] : null,
  ].filter(Boolean);

  const cover = coverImage(project, { eager: true });

  const body = project.html.trim()
    ? prose(project.html)
    : h('p', { class: 'muted' }, 'A detailed write-up for this project has not been added yet.');

  const node = h('div', { class: 'page' },
    h('div', { class: 'container' },
      h('header', { class: 'project-head' },
        breadcrumbs([{ label: 'Projects', href: '#/projects' }, { label: project.title }]),
        h('h1', { tabindex: '-1' }, project.title),
        h('p', { class: 'lead' }, project.summary),
        h('dl', { class: 'title-block' }, facts.map(([k, v]) => h('div', null, h('dt', null, k), h('dd', null, v)))),
        project.tags.length ? h('div', { class: 'mt-4' }, tagList(project.tags, { label: 'Tags' })) : null,
        linkButtons(project.links),
        site.showSampleNotices && project.sample
          ? h('div', { class: 'mt-5' }, sampleNotice('Sample project: this write-up shows the case-study layout. Replace it with your own work.'))
          : null),
      cover ? h('figure', { class: 'project-cover' }, cover) : null,
      h('div', { class: 'layout-aside' },
        h('div', null, body),
        toc ? h('aside', { 'aria-label': 'Table of contents' }, toc) : null),

      (newer || older)
        ? h('nav', { class: 'prev-next', 'aria-label': 'More projects' },
          older ? h('a', { href: older.href, class: 'prev' }, h('small', null, 'Previous project'), h('span', null, older.title)) : null,
          newer ? h('a', { href: newer.href, class: 'next' }, h('small', null, 'Next project'), h('span', null, newer.title)) : null)
        : null,

      relatedProjects.length
        ? h('section', { class: 'related', 'aria-labelledby': 'related-projects' },
          h('h2', { id: 'related-projects' }, 'Related projects'),
          h('ul', { class: 'grid grid--3' }, relatedProjects.map((p) => projectCard(p))))
        : null,

      relatedPosts.length
        ? h('section', { class: 'related', 'aria-labelledby': 'related-posts' },
          h('h2', { id: 'related-posts' }, 'Related articles'),
          h('ul', { class: 'post-list' }, relatedPosts.map((p) => postRow(p))))
        : null,

      h('p', { class: 'mt-7' }, buttonLink({ href: '#/projects', label: 'All projects', variant: 'quiet', iconName: 'arrow-left' }))));

  return { title: project.title, description: project.summary, node };
}
