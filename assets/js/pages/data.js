import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { datasets } from '../config.js';
import { createChart } from '../lib/charts.js';
import { badge, buttonLink, emptyState, pageHeader, textLink } from '../components/ui.js';

function kindBadge(kind) {
  return kind === 'measured'
    ? badge('Measured data')
    : badge('Illustrative: calculated, not measured', 'sample');
}

function dataTable(dataset) {
  const head = h('tr', null, dataset.columns.map((c) => h('th', { scope: 'col', class: c.align === 'right' ? 'al-r' : '' }, c.label)));
  const rows = dataset.rows.map((row) => h('tr', null, dataset.columns.map((c) =>
    h('td', { class: c.align === 'right' ? 'al-r' : '' }, row[c.key] ?? '–'))));
  return h('div', { class: 'table-wrap', role: 'region', 'aria-label': `${dataset.title}, data table`, tabindex: '0' },
    h('table', null, h('thead', null, head), h('tbody', null, rows)));
}

const bullets = (items) => (items && items.length ? h('ul', null, items.map((i) => h('li', null, i))) : null);

function datasetSection(dataset) {
  const headingId = `ds-${dataset.id}`;
  const sources = dataset.sources ?? [];

  return h('section', { class: 'dataset', 'aria-labelledby': headingId },
    h('div', { class: 'dataset__head' },
      h('h2', { id: headingId }, dataset.title),
      kindBadge(dataset.kind)),
    dataset.description ? h('p', { class: 'lead' }, dataset.description) : null,
    h('div', { class: 'dataset__grid' },
      h('div', null,
        createChart(dataset.chart),
        h('details', { class: 'data-details' },
          h('summary', null, 'View the data as a table'),
          dataTable(dataset)),
        dataset.csv
          ? h('div', { class: 'dataset__downloads' },
            buttonLink({ href: dataset.csv, label: 'Download CSV', variant: 'quiet', iconName: 'download', download: true }))
          : null),
      h('div', null,
        dataset.findings?.length ? h('div', { class: 'dataset__block' }, h('h3', null, 'Key findings'), bullets(dataset.findings)) : null,
        dataset.methodology?.length ? h('div', { class: 'dataset__block' }, h('h3', null, 'Methodology'), bullets(dataset.methodology)) : null,
        dataset.limitations?.length ? h('div', { class: 'dataset__block' }, h('h3', null, 'Limitations'), bullets(dataset.limitations)) : null,
        h('div', { class: 'dataset__block' }, h('h3', null, 'Sources'),
          sources.length
            ? h('ul', null, sources.map((s) => h('li', null, textLink({ href: s.url, label: s.label, iconName: 'external-link' }))))
            : h('p', { class: 'muted' }, 'No external sources listed for this dataset.')))));
}

export async function dataView() {
  const hasIllustrative = datasets.some((d) => d.kind !== 'measured');

  const node = h('div', { class: 'page' },
    h('div', { class: 'container listing' },
      pageHeader({
        title: 'Data and research',
        lead: 'Charts, tables and the reasoning behind them. Each dataset says whether it is measured or only illustrative.',
      }),
      hasIllustrative
        ? h('div', { class: 'notice notice--info', role: 'note' }, icon('info', { size: 18 }),
          h('p', null, 'Datasets marked "Illustrative" are calculated from textbook formulas to demonstrate the layout. They are not measurements or research findings.'))
        : null,
      datasets.length
        ? datasets.map(datasetSection)
        : emptyState({ title: 'No datasets yet', text: 'Datasets will appear here once they are added to data/datasets.js.' })));

  return { title: 'Data and research', description: 'Responsive charts, data tables, methodology and downloadable datasets.', node };
}
