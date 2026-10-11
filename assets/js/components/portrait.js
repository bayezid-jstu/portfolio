import { h, svgEl } from '../lib/dom.js';
import { initialsFrom, isConfigured } from '../lib/format.js';
import { profile } from '../config.js';

/** Your photo (profile.photo) or a monogram placeholder with the same proportions (4:5). */
export function portrait() {
  if (isConfigured(profile.photo)) {
    const img = h('img', {
      class: 'portrait',
      src: profile.photo,
      alt: profile.photoAlt || `Portrait of ${profile.name}`,
      width: 640,
      height: 800,
      decoding: 'async',
    });
    img.addEventListener('error', () => img.replaceWith(monogram()), { once: true });
    return img;
  }
  return monogram();
}

function monogram() {
  const initials = initialsFrom(profile.name);
  const lines = [];
  for (let x = 40; x < 320; x += 40) lines.push(svgEl('line', { x1: x, y1: 0, x2: x, y2: 400, stroke: 'var(--border)', 'stroke-width': 1 }));
  for (let y = 40; y < 400; y += 40) lines.push(svgEl('line', { x1: 0, y1: y, x2: 320, y2: y, stroke: 'var(--border)', 'stroke-width': 1 }));
  return svgEl('svg', {
    class: 'portrait',
    viewBox: '0 0 320 400',
    role: 'img',
    'aria-label': `Placeholder portrait for ${profile.name}`,
  },
  svgEl('rect', { width: 320, height: 400, fill: 'var(--surface-2)' }),
  ...lines,
  svgEl('rect', { x: 100, y: 140, width: 120, height: 120, rx: 4, fill: 'var(--bg)', stroke: 'var(--accent)', 'stroke-width': 2 }),
  svgEl('text', {
    x: 160, y: 200, 'text-anchor': 'middle', 'dominant-baseline': 'central',
    fill: 'var(--accent)', 'font-size': 44, 'font-weight': 700, 'font-family': 'var(--font-sans)',
  }, initials));
}
