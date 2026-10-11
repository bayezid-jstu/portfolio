import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { formatDate } from '../lib/format.js';
import { relatedItems, neighbours } from '../lib/content.js';
import { site, profile, PLACEHOLDER_NAME } from '../config.js';
import { breadcrumbs, sampleNotice, tagList, buttonLink } from '../components/ui.js';
import { coverImage, postRow, projectCard } from '../components/cards.js';
import { prose, tableOfContents } from '../components/prose.js';
import { setStructuredData } from '../lib/seo.js';
import { notFoundView } from './not-found.js';

export async function postView({ params, content }) {
  const { posts, projects } = await content.load();
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) {
    return notFoundView({
      title: 'Article not found',
      text: 'That article does not exist (or has been renamed). It may have been moved or unpublished.',
      backHref: '#/blog',
      backLabel: 'Browse all articles',
    });
  }

  const { newer, older } = neighbours(post, posts);
  const relatedPosts = relatedItems(post, posts.filter((p) => p.slug !== post.slug), 3);
  const relatedProjects = relatedItems(post, projects, 2);
  const toc = tableOfContents(post.headings, post.href, { min: 3 });
  const cover = coverImage(post, { eager: true });

  const meta = h('div', { class: 'post-row__meta' },
    post.date ? h('span', null, icon('calendar', { size: 16 }), h('time', { datetime: post.date }, `Published ${formatDate(post.date)}`)) : null,
    post.updated ? h('span', null, icon('calendar', { size: 16 }), h('time', { datetime: post.updated }, `Updated ${formatDate(post.updated)}`)) : null,
    h('span', null, icon('clock', { size: 16 }), `${post.readingMinutes} min read`),
    h('span', null, icon('tag', { size: 16 }), post.category.label));

  const node = h('div', { class: 'page' },
    h('div', { class: 'container' },
      h('header', { class: 'project-head' },
        breadcrumbs([{ label: 'Blog', href: '#/blog' }, { label: post.title }]),
        h('h1', { tabindex: '-1' }, post.title),
        h('p', { class: 'lead' }, post.summary),
        meta,
        post.tags.length ? h('div', { class: 'mt-4' }, tagList(post.tags, { label: 'Tags' })) : null,
        site.showSampleNotices && post.sample
          ? h('div', { class: 'mt-5' }, sampleNotice('Sample article: it shows what a post can contain. Replace it with your own writing.'))
          : null),
      cover ? h('figure', { class: 'project-cover' }, cover) : null,
      h('div', { class: 'layout-aside' },
        h('article', null, post.html.trim() ? prose(post.html) : h('p', { class: 'muted' }, 'This article has no content yet.')),
        toc ? h('aside', { 'aria-label': 'Table of contents' }, toc) : null),

      (newer || older)
        ? h('nav', { class: 'prev-next', 'aria-label': 'More articles' },
          older ? h('a', { href: older.href, class: 'prev' }, h('small', null, 'Older article'), h('span', null, older.title)) : null,
          newer ? h('a', { href: newer.href, class: 'next' }, h('small', null, 'Newer article'), h('span', null, newer.title)) : null)
        : null,

      relatedPosts.length
        ? h('section', { class: 'related', 'aria-labelledby': 'related-posts' },
          h('h2', { id: 'related-posts' }, 'Related articles'),
          h('ul', { class: 'post-list' }, relatedPosts.map((p) => postRow(p))))
        : null,

      relatedProjects.length
        ? h('section', { class: 'related', 'aria-labelledby': 'related-projects' },
          h('h2', { id: 'related-projects' }, 'Related projects'),
          h('ul', { class: 'grid grid--2' }, relatedProjects.map((p) => projectCard(p))))
        : null,

      h('p', { class: 'mt-7' }, buttonLink({ href: '#/blog', label: 'All articles', variant: 'quiet', iconName: 'arrow-left' }))));

  // structured data only for real (non-sample) articles written under a real name
  if (!post.sample && profile.name !== PLACEHOLDER_NAME) {
    setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.summary,
      ...(post.date ? { datePublished: post.date } : {}),
      ...(post.updated ? { dateModified: post.updated } : {}),
      author: { '@type': 'Person', name: profile.name },
    });
  } else {
    setStructuredData(null);
  }

  return { title: post.title, description: post.summary, node };
}
