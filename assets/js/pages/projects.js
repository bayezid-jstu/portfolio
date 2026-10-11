import { h, clear, announce } from '../lib/dom.js';
import { site } from '../config.js';
import { matchesQuery, usedCategories } from '../lib/content.js';
import { parseDate, plural } from '../lib/format.js';
import { pageHeader, emptyState, sampleNotice } from '../components/ui.js';
import { projectCard } from '../components/cards.js';
import { createToolbar, readState, stateToParams } from '../components/toolbar.js';

const DEFAULTS = { q: '', cat: 'all', sort: 'newest' };

const SORTS = {
  newest: (a, b) => (parseDate(b.date)?.getTime() ?? 0) - (parseDate(a.date)?.getTime() ?? 0),
  oldest: (a, b) => (parseDate(a.date)?.getTime() ?? 0) - (parseDate(b.date)?.getTime() ?? 0),
  title: (a, b) => a.title.localeCompare(b.title),
};

export async function projectsView({ query, content, router }) {
  const { projects } = await content.load();
  const categories = usedCategories(projects, site.projectCategories);

  const results = h('div');
  const count = h('p', { class: 'result-count', 'aria-live': 'polite' });
  let toolbar;

  function apply(state, silent = false) {
    const filtered = projects
      .filter((p) => state.cat === 'all' || p.category.id === state.cat)
      .filter((p) => !state.q || matchesQuery(p, state.q))
      .sort(SORTS[state.sort] ?? SORTS.newest);

    router.replaceQuery('/projects', stateToParams(state, DEFAULTS));

    const filtering = state.q || state.cat !== 'all';
    count.textContent = `${plural(filtered.length, 'project')}${filtering ? ' match your filters' : ''}`;
    clear(results);
    if (filtered.length === 0) {
      results.append(emptyState({
        title: projects.length === 0 ? 'No projects yet' : 'No projects match your search',
        text: projects.length === 0
          ? 'Projects will appear here once they are added to the site.'
          : 'Try a different word, or clear the filters to see every project.',
        action: projects.length === 0 ? null : h('button', { type: 'button', class: 'btn btn--quiet', onclick: () => toolbar.reset() }, 'Clear filters'),
      }));
    } else {
      results.append(h('ul', { class: 'grid grid--3' }, filtered.map((p) => projectCard(p, { level: 2 }))));
    }
    if (!silent) announce(count.textContent);
  }

  const state = readState(query, DEFAULTS);
  toolbar = createToolbar({
    idPrefix: 'projects',
    searchLabel: 'Search projects',
    searchPlaceholder: 'Search by title, topic or technology',
    categories,
    categoryLabel: 'Filter projects by category',
    select: {
      key: 'sort',
      label: 'Sort by',
      options: [
        { value: 'newest', label: 'Newest first' },
        { value: 'oldest', label: 'Oldest first' },
        { value: 'title', label: 'Title (A to Z)' },
      ],
    },
    defaults: DEFAULTS,
    state,
    onChange: apply,
  });

  const node = h('div', { class: 'page' },
    h('div', { class: 'container listing' },
      pageHeader({ title: 'Projects', lead: 'Engineering work, coursework and experiments, with the thinking behind each one.' }),
      projects.some((p) => p.sample) ? sampleNotice('The projects below are sample entries that show the layout. Replace them with your own in content/projects/.') : null,
      toolbar.element, count, results));

  apply(toolbar.state(), true);

  return { title: 'Projects', description: 'Engineering projects: summaries, methods, tools and results.', node };
}
