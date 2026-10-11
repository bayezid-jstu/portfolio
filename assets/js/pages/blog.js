import { h, clear, announce } from '../lib/dom.js';
import { site } from '../config.js';
import { allTags, matchesQuery, usedCategories } from '../lib/content.js';
import { plural, slugify } from '../lib/format.js';
import { pageHeader, emptyState, sampleNotice } from '../components/ui.js';
import { postRow } from '../components/cards.js';
import { createToolbar, readState, stateToParams } from '../components/toolbar.js';

const DEFAULTS = { q: '', cat: 'all', tag: 'all' };

export async function blogView({ query, content, router }) {
  const { posts } = await content.load();
  const categories = usedCategories(posts, site.blogCategories);
  const tags = allTags(posts);

  const results = h('div');
  const count = h('p', { class: 'result-count', 'aria-live': 'polite' });
  let toolbar;

  function apply(state, silent = false) {
    const filtered = posts
      .filter((p) => state.cat === 'all' || p.category.id === state.cat)
      .filter((p) => state.tag === 'all' || p.tags.some((t) => slugify(t) === state.tag))
      .filter((p) => !state.q || matchesQuery(p, state.q));

    router.replaceQuery('/blog', stateToParams(state, DEFAULTS));

    const filtering = state.q || state.cat !== 'all' || state.tag !== 'all';
    count.textContent = `${plural(filtered.length, 'article')}${filtering ? ' match your filters' : ''}`;
    clear(results);
    if (filtered.length === 0) {
      results.append(emptyState({
        title: posts.length === 0 ? 'No articles yet' : 'No articles match your search',
        text: posts.length === 0
          ? 'Articles will appear here once they are published.'
          : 'Try a different word, or clear the filters to see every article.',
        action: posts.length === 0 ? null : h('button', { type: 'button', class: 'btn btn--quiet', onclick: () => toolbar.reset() }, 'Clear filters'),
      }));
    } else {
      results.append(h('ul', { class: 'post-list' }, filtered.map((p) => postRow(p, { level: 2 }))));
    }
    if (!silent) announce(count.textContent);
  }

  toolbar = createToolbar({
    idPrefix: 'blog',
    searchLabel: 'Search articles',
    searchPlaceholder: 'Search titles, topics and article text',
    categories,
    categoryLabel: 'Filter articles by category',
    select: tags.length
      ? { key: 'tag', label: 'Tag', options: [{ value: 'all', label: 'All tags' }, ...tags.map((t) => ({ value: t.id, label: t.label }))] }
      : null,
    defaults: DEFAULTS,
    state: readState(query, DEFAULTS),
    onChange: apply,
  });

  const node = h('div', { class: 'page' },
    h('div', { class: 'container listing' },
      pageHeader({ title: 'Blog', lead: 'Technical notes, explanations and reflections from my engineering studies.' }),
      posts.some((p) => p.sample) ? sampleNotice('The articles below are samples that show the layout and Markdown features. Replace them with your own in content/blog/.') : null,
      toolbar.element, count, results));

  apply(toolbar.state(), true);

  return { title: 'Blog', description: 'Technical articles and notes on engineering topics.', node };
}
