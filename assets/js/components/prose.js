import { h, announce } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { copyText } from '../lib/clipboard.js';

/** Rendered Markdown. The HTML comes from our own safe renderer (raw HTML is escaped). */
export function prose(html) {
  const root = h('div', { class: 'prose' });
  root.innerHTML = html;
  enhanceProse(root);
  return root;
}

export function enhanceProse(root) {
  // copy buttons on code blocks
  root.querySelectorAll('.code-copy').forEach((button) => {
    const render = (label, name) => button.replaceChildren(icon(name, { size: 16 }), label);
    render('Copy', 'copy');
    let timer;
    button.addEventListener('click', async () => {
      const code = button.closest('.code-block')?.querySelector('code')?.textContent ?? '';
      const ok = await copyText(code);
      render(ok ? 'Copied' : 'Press Ctrl+C', ok ? 'check' : 'copy');
      announce(ok ? 'Code copied to clipboard' : 'Could not copy automatically');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => render('Copy', 'copy'), 2000);
    });
  });

  // images that fail to load: show the description instead of a broken icon
  root.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      const note = h('span', { class: 'muted' }, `[Image not found: ${img.getAttribute('alt') || img.getAttribute('src')}]`);
      img.replaceWith(note);
    }, { once: true });
  });
}

/**
 * tableOfContents(headings, base) -> <details> (or null when there are fewer than `min` headings)
 * `base` is the page's own address, e.g. '#/blog/my-post'
 */
export function tableOfContents(headings, base, { min = 3, open = false } = {}) {
  const items = headings.filter((x) => x.level <= 3);
  if (items.length < min) return null;

  const links = items.map((item) => h('li', { class: item.level === 3 ? 'toc-sub' : '' },
    h('a', { href: `${base}#${item.id}`, 'data-id': item.id }, item.text)));

  const toc = h('details', { class: 'toc' },
    h('summary', null, 'On this page'),
    h('ol', null, links));

  // On wide screens the table of contents is a permanent sidebar (always open);
  // on phones and tablets it is collapsed until the reader opens it.
  try {
    const wide = window.matchMedia('(min-width: 75rem)');
    toc.open = open || wide.matches;
    const sync = (event) => {
      if (!toc.isConnected) { wide.removeEventListener?.('change', sync); return; }
      toc.open = event.matches;
    };
    if (wide.addEventListener) wide.addEventListener('change', sync);
  } catch { toc.open = open; }

  // highlight the section being read
  if ('IntersectionObserver' in window) {
    const anchors = new Map(items.map((item) => [item.id, toc.querySelector(`a[data-id="${CSS.escape(item.id)}"]`)]));
    const observer = new IntersectionObserver((entries) => {
      if (!toc.isConnected) { observer.disconnect(); return; }
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      anchors.forEach((a) => a?.classList.remove('is-active'));
      anchors.get(visible.target.id)?.classList.add('is-active');
    }, { rootMargin: '-72px 0px -65% 0px' });
    // observe after the page is in the document
    queueMicrotask(() => requestAnimationFrame(() => {
      items.forEach((item) => { const el = document.getElementById(item.id); if (el) observer.observe(el); });
    }));
  }
  return toc;
}
