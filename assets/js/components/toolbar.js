import { h, debounce } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

/** Reads ?q=...&cat=... from the address into a state object (with defaults). */
export function readState(query, defaults) {
  const state = { ...defaults };
  Object.keys(defaults).forEach((key) => {
    const value = query.get(key);
    if (value !== null && value !== '') state[key] = value;
  });
  return state;
}

/** Only non-default values are written back, keeping addresses short. */
export function stateToParams(state, defaults) {
  const params = new URLSearchParams();
  Object.keys(defaults).forEach((key) => {
    if (state[key] && state[key] !== defaults[key]) params.set(key, state[key]);
  });
  return params;
}

/**
 * createToolbar({
 *   idPrefix, searchLabel, searchPlaceholder,
 *   categories: [{ id, label }], categoryLabel,
 *   select: { key: 'sort' | 'tag', label, options: [{ value, label }] },
 *   defaults, state, onChange(state)
 * })
 */
export function createToolbar({ idPrefix, searchLabel, searchPlaceholder, categories, categoryLabel = 'Category', select, defaults, state, onChange }) {
  const current = { ...state };
  const fire = () => onChange({ ...current });

  /* search */
  const input = h('input', {
    class: 'input',
    type: 'search',
    id: `${idPrefix}-search`,
    name: 'q',
    value: current.q,
    placeholder: searchPlaceholder,
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    enterkeyhint: 'search',
  });
  input.addEventListener('input', debounce(() => { current.q = input.value.trim(); fire(); }, 160));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && input.value) { input.value = ''; current.q = ''; fire(); }
  });

  const searchField = h('div', { class: 'field' },
    h('label', { for: `${idPrefix}-search` }, searchLabel),
    h('div', { class: 'search' }, icon('search', { size: 18 }), input));

  /* optional select (sort order or tag) */
  let selectEl = null;
  let selectField = null;
  if (select) {
    selectEl = h('select', { class: 'select', id: `${idPrefix}-${select.key}`, name: select.key },
      select.options.map((o) => h('option', { value: o.value }, o.label)));
    selectEl.value = current[select.key];
    if (selectEl.value !== current[select.key]) { current[select.key] = defaults[select.key]; selectEl.value = defaults[select.key]; }
    selectEl.addEventListener('change', () => { current[select.key] = selectEl.value; fire(); });
    selectField = h('div', { class: 'field' }, h('label', { for: selectEl.id }, select.label), selectEl);
  }

  /* category chips */
  const chips = new Map();
  const group = h('fieldset', { class: 'filter-group' }, h('legend', { class: 'sr-only' }, categoryLabel));
  [{ id: 'all', label: 'All' }, ...categories].forEach((category) => {
    const button = h('button', {
      type: 'button',
      class: 'filter-chip',
      'aria-pressed': String(current.cat === category.id),
    }, category.label);
    button.addEventListener('click', () => {
      current.cat = category.id;
      syncChips();
      fire();
    });
    chips.set(category.id, button);
    group.append(button);
  });
  if (!chips.has(current.cat)) current.cat = 'all';

  function syncChips() {
    chips.forEach((button, id) => button.setAttribute('aria-pressed', String(id === current.cat)));
  }
  syncChips();

  const element = h('div', { class: 'toolbar', role: 'search' },
    h('div', { class: `toolbar__row${selectField ? ' toolbar__row--split' : ''}` }, searchField, selectField),
    categories.length > 0 ? group : null);

  return {
    element,
    state: () => ({ ...current }),
    reset() {
      Object.assign(current, defaults);
      input.value = '';
      if (selectEl) selectEl.value = current[select.key];
      syncChips();
      fire();
    },
  };
}
