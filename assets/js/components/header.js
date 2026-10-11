import { h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { initialsFrom } from '../lib/format.js';
import { currentTheme, toggleTheme, onThemeChange } from '../lib/theme.js';
import { navigation, profile } from '../config.js';

function isActive(href, path) {
  const target = href.replace(/^#/, '') || '/';
  if (target === '/') return path === '/';
  return path === target || path.startsWith(`${target}/`);
}

export function renderHeader(container) {
  const navLinks = [];
  const makeLink = (item) => {
    const a = h('a', { class: 'nav-link', href: item.href }, item.label);
    navLinks.push({ a, item });
    return a;
  };

  const desktopNav = h('nav', { class: 'site-nav', 'aria-label': 'Main' },
    h('ul', null, navigation.filter((n) => n.header).map((n) => h('li', null, makeLink(n)))));

  const mobileNav = h('nav', { class: 'mobile-nav', id: 'mobile-nav', 'aria-label': 'Mobile', hidden: true },
    h('ul', null, navigation.map((n) => h('li', null, makeLink(n)))));

  /* --- theme toggle: a toggle button whose pressed state means "dark theme on" --- */
  const themeButton = h('button', {
    type: 'button',
    class: 'icon-btn theme-toggle',
    'aria-label': 'Dark theme',
    'aria-pressed': String(currentTheme() === 'dark'),
    title: 'Toggle dark theme',
  }, icon('sun', { className: 'icon-sun' }), icon('moon', { className: 'icon-moon' }));
  themeButton.addEventListener('click', () => { toggleTheme(); });
  onThemeChange((theme) => themeButton.setAttribute('aria-pressed', String(theme === 'dark')));

  /* --- mobile menu --- */
  const menuButton = h('button', {
    type: 'button',
    class: 'icon-btn menu-toggle',
    'aria-label': 'Open menu',
    'aria-expanded': 'false',
    'aria-controls': 'mobile-nav',
  }, icon('menu', { className: 'icon-open' }));

  const brand = h('a', { class: 'brand', href: '#/' },
    h('span', { class: 'brand__mark', 'aria-hidden': 'true' }, initialsFrom(profile.name)),
    h('span', { class: 'brand__name' }, profile.name));

  const header = h('header', { class: 'site-header' },
    h('div', { class: 'container site-header__inner' },
      brand, desktopNav,
      h('div', { class: 'header-actions' }, themeButton, menuButton)),
    mobileNav);

  container.replaceChildren(header);

  const inertTargets = () => [document.getElementById('main-content'), document.getElementById('site-footer'), document.querySelector('.skip-link')].filter(Boolean);
  let open = false;

  function setMenu(next, { restoreFocus = true } = {}) {
    if (next === open) return;
    open = next;
    mobileNav.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuButton.replaceChildren(icon(open ? 'x' : 'menu'));
    document.documentElement.classList.toggle('menu-open', open);
    inertTargets().forEach((el) => { el.inert = open; });
    if (!open && restoreFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => setMenu(!open));

  header.addEventListener('keydown', (event) => {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); setMenu(false); return; }
    if (event.key !== 'Tab') return;
    const focusable = [brand, themeButton, menuButton, ...mobileNav.querySelectorAll('a')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  // leaving the "mobile" width closes the menu so the page is never stuck locked
  try {
    const wide = window.matchMedia('(min-width: 60rem)');
    const onChange = () => { if (wide.matches) setMenu(false, { restoreFocus: false }); };
    if (wide.addEventListener) wide.addEventListener('change', onChange);
    else if (wide.addListener) wide.addListener(onChange);
  } catch { /* ignore */ }

  return {
    setActive(path) {
      navLinks.forEach(({ a, item }) => {
        if (isActive(item.href, path)) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    },
    closeMenu() { setMenu(false, { restoreFocus: false }); },
  };
}
