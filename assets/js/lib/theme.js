// Theme handling. The very first paint is handled by a tiny inline script in
// index.html (so there is no flash of the wrong theme); this module keeps
// the choice in sync afterwards.

import { local } from './storage.js';

const KEY = 'theme';
const COLORS = { light: '#f7f7f4', dark: '#111418' };
const listeners = new Set();

function systemTheme() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[theme]);
  listeners.forEach((fn) => fn(theme));
}

export function initTheme() {
  const stored = local.read(KEY);
  apply(stored === 'dark' || stored === 'light' ? stored : systemTheme());

  // Follow the operating system until the visitor makes an explicit choice.
  try {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const saved = local.read(KEY);
      if (saved !== 'dark' && saved !== 'light') apply(systemTheme());
    };
    if (query.addEventListener) query.addEventListener('change', onChange);
    else if (query.addListener) query.addListener(onChange);
  } catch { /* ignore */ }
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  local.write(KEY, next);
  apply(next);
  return next;
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
