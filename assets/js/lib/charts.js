// Small chart library written for this site (no external dependency).
// - Responsive: redraws at the container width, so it fits phones and desktops.
// - Accessible: keyboard arrow keys read each value, series differ by dash
//   pattern (not colour alone), and a text summary is always shown.
// - Supports linear and logarithmic axes.

import { h, svgEl } from './dom.js';

/* ------------------------------------------------------------------ maths */

function niceNumber(range, round) {
  const exp = Math.floor(Math.log10(range));
  const f = range / 10 ** exp;
  let nf;
  if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * 10 ** exp;
}

/** Evenly spaced "nice" tick values covering [min, max]. */
export function niceTicks(min, max, count = 5) {
  if (!(max > min)) {
    const d = Math.abs(min) || 1;
    min -= d / 2;
    max += d / 2;
  }
  const range = niceNumber(max - min, false);
  const step = niceNumber(range / Math.max(1, count - 1), true);
  const start = Math.floor(min / step + 1e-9) * step;
  const end = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  for (let v = start; v <= end + step * 1e-9; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}

/** Powers of ten covering [min, max] (both must be > 0). */
export function logTicks(min, max) {
  const lo = Math.floor(Math.log10(min) + 1e-9);
  let hi = Math.ceil(Math.log10(max) - 1e-9);
  if (hi <= lo) hi = lo + 1;
  const ticks = [];
  for (let e = lo; e <= hi; e++) ticks.push(Number(`1e${e}`));
  return ticks;
}

export function formatTick(v) {
  if (v === 0) return '0';
  const abs = Math.abs(v);
  let out;
  if (abs >= 1e6) out = `${Number((v / 1e6).toPrecision(3))}M`;
  else if (abs >= 1e3) out = `${Number((v / 1e3).toPrecision(3))}k`;
  else if (abs < 0.001) out = v.toExponential(0).replace('e', '×10^');
  else out = String(Number(v.toPrecision(4)));
  return out.replace('-', '−');
}

export function formatValue(v) {
  if (!Number.isFinite(v)) return '–';
  const abs = Math.abs(v);
  const text = abs !== 0 && (abs < 0.001 || abs >= 1e9)
    ? v.toExponential(3)
    : Number(v.toPrecision(5)).toLocaleString('en', { maximumFractionDigits: 6 });
  return text.replace('-', '−');
}

const withUnit = (label, unit) => (unit ? `${label} (${unit})` : label);

/* ------------------------------------------------------------------ chart */

/**
 * createChart({
 *   type: 'line' | 'bar', title, summary,
 *   x: { label, unit, scale: 'linear' | 'log', values: [...]  (line)  |  categories: [...] (bar) },
 *   y: { label, unit, scale: 'linear' | 'log', min?, max? },
 *   series: [{ name, values: [...] }]
 * }) -> <figure> element
 */
export function createChart(spec) {
  const isBar = spec.type === 'bar';
  const series = spec.series.slice(0, 3);
  const xs = isBar ? spec.x.categories : spec.x.values;
  const count = xs.length;
  const xLog = !isBar && spec.x.scale === 'log';
  const yLog = spec.y.scale === 'log';

  const plot = h('div', { class: 'chart-plot' });
  const svgHost = h('div', { class: 'chart-svg' });
  const tooltip = h('div', { class: 'chart-tooltip', hidden: true, 'aria-hidden': 'true' });
  const readout = h('div', { class: 'sr-only', 'aria-live': 'polite' });
  plot.append(svgHost, tooltip);

  const frame = h('div', {
    class: 'chart-frame',
    tabindex: '0',
    role: 'group',
    'aria-label': `${spec.title}. Interactive chart. Use the left and right arrow keys to read each value.`,
  }, plot, readout);

  const figure = h('figure', { class: 'chart' }, frame);

  if (series.length > 1) {
    const legend = h('ul', { class: 'chart-legend', 'aria-label': 'Legend' });
    series.forEach((s, i) => {
      const sample = svgEl('svg', { viewBox: '0 0 36 8', 'aria-hidden': 'true' },
        svgEl('line', { x1: 0, y1: 4, x2: 36, y2: 4, class: `chart-line s${i}` }));
      legend.append(h('li', null, sample, s.name));
    });
    figure.append(legend);
  }

  let width = 0;
  let active = null;
  let points = [];
  let layout = null;

  const finite = (v) => typeof v === 'number' && Number.isFinite(v) && (!yLog || v > 0);

  function draw() {
    width = Math.max(260, Math.floor(svgHost.clientWidth || frame.clientWidth || 600));
    const height = width < 480 ? Math.round(Math.max(250, width * 0.82)) : Math.round(Math.min(400, Math.max(280, width * 0.48)));

    /* y domain */
    const all = series.flatMap((s) => s.values.filter(finite));
    let yMin = spec.y.min ?? Math.min(...all);
    let yMax = spec.y.max ?? Math.max(...all);
    let yTicks;
    if (yLog) {
      yTicks = logTicks(spec.y.min ?? yMin, spec.y.max ?? yMax);
    } else {
      if (spec.y.min === undefined && yMin >= 0 && (isBar || yMin < yMax * 0.5)) yMin = 0;
      yTicks = niceTicks(yMin, yMax, Math.max(3, Math.floor(height / 60)));
    }
    const y0 = yTicks[0];
    const y1 = yTicks[yTicks.length - 1];
    const toY = (v) => (yLog ? Math.log10(v) : v);

    /* margins depend on the widest y label */
    const widest = Math.max(...yTicks.map((t) => formatTick(t).length));
    const m = { top: 14, right: 18, bottom: 54, left: Math.round(widest * 7 + 46) };
    const plotW = width - m.left - m.right;
    const plotH = height - m.top - m.bottom;

    const sy = (v) => m.top + plotH - ((toY(v) - toY(y0)) / (toY(y1) - toY(y0))) * plotH;

    /* x scale */
    let xTicks = [];
    let sx;
    let band = 0;
    if (isBar) {
      band = plotW / count;
      sx = (i) => m.left + band * (i + 0.5);
    } else {
      const xv = xs.filter((v) => Number.isFinite(v) && (!xLog || v > 0));
      const xMin = Math.min(...xv);
      const xMax = Math.max(...xv);
      xTicks = xLog ? logTicks(xMin, xMax) : niceTicks(xMin, xMax, Math.max(2, Math.floor(plotW / 80)));
      const tx = (v) => (xLog ? Math.log10(v) : v);
      const x0 = xTicks[0];
      const x1 = xTicks[xTicks.length - 1];
      sx = (v) => m.left + ((tx(v) - tx(x0)) / (tx(x1) - tx(x0))) * plotW;
      const maxXTicks = Math.max(2, Math.floor(plotW / 62));
      if (xTicks.length > maxXTicks) {
        const stepN = Math.ceil(xTicks.length / maxXTicks);
        xTicks = xTicks.filter((_, i) => i % stepN === 0);
      }
    }

    const svg = svgEl('svg', {
      viewBox: `0 0 ${width} ${height}`,
      width,
      height,
      'aria-hidden': 'true',
      focusable: 'false',
    });

    /* grid + y axis labels */
    yTicks.forEach((t) => {
      const y = sy(t);
      svg.append(svgEl('line', { class: 'chart-grid', x1: m.left, x2: m.left + plotW, y1: y, y2: y }));
      svg.append(svgEl('text', { class: 'chart-tick', x: m.left - 8, y, 'text-anchor': 'end', 'dominant-baseline': 'middle' }, formatTick(t)));
    });

    /* x grid + labels */
    if (isBar) {
      let every = 1;
      const labelLen = Math.max(...xs.map((c) => String(c).length));
      while (band * every < labelLen * 7 + 8 && every < count) every++;
      xs.forEach((c, i) => {
        if (i % every !== 0) return;
        svg.append(svgEl('text', { class: 'chart-tick', x: sx(i), y: m.top + plotH + 18, 'text-anchor': 'middle' }, String(c)));
      });
    } else {
      xTicks.forEach((t) => {
        const x = sx(t);
        svg.append(svgEl('line', { class: 'chart-grid', x1: x, x2: x, y1: m.top, y2: m.top + plotH }));
        svg.append(svgEl('text', { class: 'chart-tick', x, y: m.top + plotH + 18, 'text-anchor': 'middle' }, formatTick(t)));
      });
    }

    /* axes */
    svg.append(svgEl('line', { class: 'chart-axis', x1: m.left, x2: m.left, y1: m.top, y2: m.top + plotH }));
    svg.append(svgEl('line', { class: 'chart-axis', x1: m.left, x2: m.left + plotW, y1: m.top + plotH, y2: m.top + plotH }));

    /* axis titles */
    svg.append(svgEl('text', { class: 'chart-title', x: m.left + plotW / 2, y: height - 6, 'text-anchor': 'middle' }, withUnit(spec.x.label, spec.x.unit)));
    const yTitleX = 14;
    const yTitleY = m.top + plotH / 2;
    svg.append(svgEl('text', {
      class: 'chart-title', x: yTitleX, y: yTitleY, 'text-anchor': 'middle',
      transform: `rotate(-90 ${yTitleX} ${yTitleY})`,
    }, withUnit(spec.y.label, spec.y.unit)));

    /* data */
    points = xs.map((xv, i) => ({ i, x: isBar ? sx(i) : sx(xv) }));
    const baseY = sy(yLog ? y0 : Math.max(y0, Math.min(0, y1)));
    const dotRadius = count <= 40 ? 3.5 : 0;
    const barGroupW = Math.min(band * 0.7, 56);
    const barW = barGroupW / series.length;

    series.forEach((s, si) => {
      if (isBar) {
        s.values.forEach((v, i) => {
          if (!finite(v)) return;
          const x = sx(i) - barGroupW / 2 + barW * si;
          const y = sy(v);
          svg.append(svgEl('rect', {
            class: `chart-bar s${si}`,
            'data-i': i,
            x,
            y: Math.min(y, baseY),
            width: Math.max(2, barW - 2),
            height: Math.max(1, Math.abs(baseY - y)),
            opacity: 0.88,
          }));
        });
      } else {
        let d = '';
        let pen = false;
        s.values.forEach((v, i) => {
          if (!finite(v) || !Number.isFinite(xs[i])) { pen = false; return; }
          d += `${pen ? 'L' : 'M'}${points[i].x.toFixed(1)} ${sy(v).toFixed(1)}`;
          pen = true;
        });
        svg.append(svgEl('path', { class: `chart-line s${si}`, d }));
        if (dotRadius) {
          s.values.forEach((v, i) => {
            if (!finite(v) || !Number.isFinite(xs[i])) return;
            svg.append(svgEl('circle', { class: `chart-dot s${si}`, cx: points[i].x, cy: sy(v), r: dotRadius }));
          });
        }
      }
    });

    /* cursor + hit area */
    const cursor = svgEl('line', { class: 'chart-cursor', y1: m.top, y2: m.top + plotH, hidden: true });
    const rings = series.map((_, si) => svgEl('circle', { class: `chart-focus-ring s${si}`, r: 6.5, hidden: true }));
    svg.append(cursor, ...rings);
    const hit = svgEl('rect', { x: m.left, y: m.top, width: plotW, height: plotH, fill: 'transparent' });
    svg.append(hit);

    layout = { m, plotW, plotH, sy, cursor, rings, svg, band };
    svgHost.replaceChildren(svg);

    const indexFromPointer = (event) => {
      const rect = svg.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * width;
      if (isBar) return Math.min(count - 1, Math.max(0, Math.floor((px - m.left) / band)));
      let best = 0;
      let bestDist = Infinity;
      points.forEach((p, i) => {
        if (!Number.isFinite(xs[i])) return;
        const dist = Math.abs(p.x - px);
        if (dist < bestDist) { best = i; bestDist = dist; }
      });
      return best;
    };

    hit.addEventListener('pointermove', (event) => show(indexFromPointer(event)));
    hit.addEventListener('pointerdown', (event) => show(indexFromPointer(event)));
    hit.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') show(null); });

    show(active, false);
  }

  function show(i, fromKeyboard = false) {
    active = i;
    if (!layout) return;
    const { m, plotH, sy, cursor, rings, svg } = layout;
    svg.querySelectorAll('.chart-bar').forEach((bar) => {
      bar.setAttribute('opacity', i !== null && Number(bar.getAttribute('data-i')) === i ? '1' : '0.88');
    });

    if (i === null || !points[i]) {
      cursor.setAttribute('hidden', '');
      rings.forEach((r) => r.setAttribute('hidden', ''));
      tooltip.hidden = true;
      return;
    }

    const px = points[i].x;
    if (isBar) cursor.setAttribute('hidden', '');
    else {
      cursor.removeAttribute('hidden');
      cursor.setAttribute('x1', px);
      cursor.setAttribute('x2', px);
    }
    rings.forEach((r, si) => {
      const v = series[si].values[i];
      if (isBar || !finite(v)) { r.setAttribute('hidden', ''); return; }
      r.removeAttribute('hidden');
      r.setAttribute('cx', px);
      r.setAttribute('cy', sy(v));
    });

    const xLabel = isBar ? String(xs[i]) : `${spec.x.label}: ${formatValue(xs[i])}${spec.x.unit ? ` ${spec.x.unit}` : ''}`;
    tooltip.replaceChildren(
      h('strong', null, xLabel),
      ...series.map((s) => h('span', { style: 'display:block' },
        `${series.length > 1 || s.name ? `${s.name}: ` : ''}${formatValue(s.values[i])}${spec.y.unit ? ` ${spec.y.unit}` : ''}`)),
    );
    tooltip.hidden = false;
    const tw = tooltip.offsetWidth;
    const left = Math.min(Math.max(px + 12, 4), width - tw - 4);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${m.top + 4}px`;

    if (fromKeyboard) {
      readout.textContent = `${xLabel}. ${series.map((s) => `${s.name}: ${formatValue(s.values[i])}${spec.y.unit ? ` ${spec.y.unit}` : ''}`).join('. ')}`;
    }
  }

  frame.addEventListener('keydown', (event) => {
    const last = count - 1;
    let next = active;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': next = active === null ? 0 : Math.min(last, active + 1); break;
      case 'ArrowLeft':
      case 'ArrowUp': next = active === null ? last : Math.max(0, active - 1); break;
      case 'Home': next = 0; break;
      case 'End': next = last; break;
      case 'Escape': show(null, true); return;
      default: return;
    }
    event.preventDefault();
    show(next, true);
  });

  frame.addEventListener('blur', () => show(null));

  /* redraw when the width changes (rotation, window resize, sidebar etc.) */
  const onResize = () => {
    if (!frame.isConnected) { observer?.disconnect(); window.removeEventListener('resize', onResize); return; }
    const w = Math.floor(svgHost.clientWidth);
    if (w && Math.abs(w - width) > 1) draw();
  };
  let observer = null;
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(onResize);
    observer.observe(frame);
  } else {
    window.addEventListener('resize', onResize);
  }

  /* first draw once the element is in the page and has a width */
  requestAnimationFrame(() => { draw(); });

  if (spec.summary) figure.append(h('figcaption', null, h('strong', null, `${spec.title}. `), spec.summary));
  else figure.append(h('figcaption', null, spec.title));

  return figure;
}
