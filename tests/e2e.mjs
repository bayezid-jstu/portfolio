// End-to-end browser tests.
//
// Optional (the site itself needs no tools). To run them you need Node.js 18+
// and Playwright:   npm install --no-save playwright && npx playwright install chromium
// Then:             node tests/e2e.mjs
//
// The tests start a local server that behaves like GitHub Pages for a project
// site (the site lives under /my-portfolio/), then drive a real browser at
// phone, tablet and desktop sizes.

import { createRequire } from 'node:module';
import { startServer } from './server.mjs';

const require = createRequire(process.env.PLAYWRIGHT_MODULE_PATH ? `${process.env.PLAYWRIGHT_MODULE_PATH}/` : import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = '/my-portfolio/';
const { server, url } = await startServer({ port: Number(process.env.PORT) || 8130, base: BASE });
const origin = new URL(url).origin;
const browser = await chromium.launch();

const ROUTES = [
  ['', 'Your Name'], ['#/about', 'About me'], ['#/projects', 'Projects'], ['#/projects/rc-low-pass-filter', 'RC low-pass filter analysis'],
  ['#/projects/sensor-data-logger', 'Sensor data logger'], ['#/projects/csv-analysis-notebook', 'Smoothing a CSV signal with Python'],
  ['#/blog', 'Blog'], ['#/blog/welcome-and-how-to-write-posts', 'Welcome, and how to write a post'], ['#/blog/rc-time-constant', 'Understanding the RC time constant'],
  ['#/blog/reading-a-datasheet', 'A checklist for reading a datasheet'], ['#/data', 'Data and research'], ['#/skills', 'Skills'],
  ['#/education', 'Education and achievements'], ['#/cv', 'Curriculum vitae'], ['#/contact', 'Contact'],
  ['#/projects/not-a-project', 'Project not found'], ['#/blog/not-a-post', 'Article not found'], ['#/totally/unknown', 'Page not found'],
];

const VIEWPORTS = {
  'Android phone (Pixel 5)': devices['Pixel 5'],
  'iPhone 13': devices['iPhone 13'],
  'small phone 320px': { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  'tablet 768px': { viewport: { width: 768, height: 1024 }, hasTouch: true },
  'laptop 1366px': { viewport: { width: 1366, height: 768 } },
  'wide desktop 1920px': { viewport: { width: 1920, height: 1080 } },
};

let passed = 0;
const failures = [];
async function test(name, fn) {
  try { await fn(); passed++; process.stdout.write('.'); } catch (error) { failures.push(`${name}\n      ${String(error.message).split('\n').slice(0, 6).join('\n      ')}`); process.stdout.write('F'); }
}
const ok = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
const eq = (a, b, msg = '') => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

/** Opens a page and records anything that should never happen. */
async function open(contextOptions = {}, { allow = [] } = {}) {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], ...contextOptions });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !allow.some((a) => m.text().includes(a))) problems.push(`console ${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400 && !allow.some((a) => r.url().includes(a))) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  return { page, context, problems };
}

async function goto(page, hash = '') {
  await page.goto(url + hash);
  await page.waitForSelector('#app h1, #app .not-found');
  await page.waitForTimeout(250);
}

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/* ======================================================================
   1. Every page, on every device size
   ====================================================================== */
for (const [device, options] of Object.entries(VIEWPORTS)) {
  await test(`[${device}] every page loads, has one h1, no console errors, no sideways scrolling`, async () => {
    const { page, context, problems } = await open(options);
    const bad = [];
    for (const [hash, heading] of ROUTES) {
      await goto(page, hash);
      const h1s = await page.locator('main h1').allTextContents();
      if (h1s.length !== 1 || !h1s[0].includes(heading)) bad.push(`${hash || '#/'}: h1 = ${JSON.stringify(h1s)}, expected "${heading}"`);
      const extra = await overflow(page);
      if (extra > 0) bad.push(`${hash || '#/'}: page scrolls sideways by ${extra}px`);
    }
    await context.close();
    ok(bad.length === 0, bad.join('\n'));
    ok(problems.length === 0, [...new Set(problems)].join('\n'));
  });
}

/* ======================================================================
   2. Hosting under a repository path, 404 behaviour, file access
   ====================================================================== */
await test('site works under the /my-portfolio/ path and every asset loads', async () => {
  const { page, context, problems } = await open();
  const seen = new Set();
  page.on('response', (r) => seen.add(new URL(r.url()).pathname));
  await goto(page, '#/projects');
  await goto(page, '#/blog/rc-time-constant');
  await goto(page, '#/data');
  await context.close();
  ok([...seen].every((p) => p.startsWith(BASE)), `a request left the repository path: ${[...seen].filter((p) => !p.startsWith(BASE))}`);
  ok(seen.has(`${BASE}assets/js/main.js`) && seen.has(`${BASE}content/blog/rc-time-constant.md`), 'expected assets were not requested');
  eq(problems, []);
});

await test('also works at the root of a user site (https://USER.github.io/) and with a different repository name', async () => {
  for (const base of ['/', '/another-repo-name/']) {
    const { server: s2, url: u2 } = await startServer({ port: Number(process.env.PORT || 8130) + (base === '/' ? 1 : 2), base });
    const { page, context, problems } = await open();
    for (const hash of ['', '#/projects', '#/blog/rc-time-constant', '#/data', '#/cv']) {
      await page.goto(u2 + hash);
      await page.waitForSelector('#app h1');
      await page.waitForTimeout(200);
    }
    const broken = await page.$$eval('img', (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).length);
    await context.close();
    s2.close();
    eq(problems, [], `base ${base}`);
    eq(broken, 0, `broken images under ${base}`);
  }
});

await test('unknown addresses return the branded 404 page with working links', async () => {
  const { page, context } = await open({}, { allow: ['/my-portfolio/nope'] });
  // the page is told where the site lives (the owner sets SITE_BASE, or it is detected on github.io)
  await page.route('**/nope/**', async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('var SITE_BASE = null;', `var SITE_BASE = '${BASE}';`) });
  });
  const response = await page.goto(`${origin}${BASE}nope/deeper/page`);
  eq(response.status(), 404, 'status');
  eq(await page.locator('h1').textContent(), 'Page not found');
  ok(await page.locator('#home-link').isVisible(), 'home link visible');
  const href = (id) => page.locator(id).evaluate((a) => { const u = new URL(a.href); return u.pathname + u.hash; });
  eq(await href('#home-link'), BASE, 'home link target');
  eq(await href('#projects-link'), `${BASE}#/projects`, 'projects link');
  eq(await href('#blog-link'), `${BASE}#/blog`, 'blog link');
  eq(await overflow(page), 0, 'overflow');
  await page.setViewportSize({ width: 320, height: 600 });
  eq(await overflow(page), 0, 'overflow at 320px');
  await Promise.all([page.waitForNavigation(), page.click('#home-link')]);
  await page.waitForSelector('#app h1');
  eq(await page.locator('main h1').textContent(), 'Your Name');
  await context.close();
});

await test('404 page: base-folder detection for GitHub project sites, user sites and other hosts', async () => {
  const { page, context } = await open({}, { allow: ['/my-portfolio/nope'] });
  await page.goto(`${origin}${BASE}nope/x`);
  const detect = (h, p) => page.evaluate(([host, path]) => window.__detectBase(host, path), [h, p]);
  eq(await detect('ada.github.io', '/portfolio/missing/page'), '/portfolio/', 'project site');
  eq(await detect('ada.github.io', '/portfolio/missing'), '/portfolio/');
  eq(await detect('ada.github.io', '/'), '/', 'user site root');
  eq(await detect('example.com', '/anything/here'), '/', 'custom domain');
  await context.close();
});

await test('a URL outside the repository path is a 404 (like real GitHub Pages)', async () => {
  const { page, context } = await open({}, { allow: ['/'] });
  const response = await page.goto(`${origin}/something-else/`);
  eq(response.status(), 404);
  await context.close();
});

await test('page refresh and direct links keep the visitor on the same page', async () => {
  const { page, context, problems } = await open();
  await goto(page, '#/blog/rc-time-constant');
  await page.reload();
  await page.waitForSelector('#app h1');
  eq(await page.locator('main h1').textContent(), 'Understanding the RC time constant');
  await goto(page, '#/projects?cat=electronics&sort=title');
  await page.reload();
  await page.waitForSelector('#app h1');
  eq(await page.locator('#projects-search').count(), 1);
  eq(await page.locator('.filter-chip[aria-pressed="true"]').textContent(), 'Electronics');
  await context.close();
  eq(problems, []);
});

await test('downloads and images load: CSV files, cover images, figures, icons', async () => {
  const { page, context, problems } = await open();
  for (const f of ['files/sample-rc-lowpass-response.csv', 'files/sample-adc-resolution.csv', 'site.webmanifest', 'robots.txt', 'sitemap.xml', 'assets/images/og-image.png', 'assets/images/icons/apple-touch-icon.png']) {
    const r = await page.request.get(`${url}${f}`);
    ok(r.ok(), `${f} -> ${r.status()}`);
  }
  await goto(page, '#/projects');
  await page.waitForTimeout(300);
  const broken = await page.$$eval('main img', (imgs) => imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src));
  eq(broken, [], 'broken images');
  await goto(page, '#/blog/rc-time-constant');
  await page.locator('figure img').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  ok(await page.locator('figure img').evaluate((i) => i.naturalWidth > 0), 'figure image loaded');
  await context.close();
  eq(problems, []);
});

/* ======================================================================
   3. Theme
   ====================================================================== */
await test('theme: first visit follows the operating system, toggle works and is remembered', async () => {
  const dark = await open({ colorScheme: 'dark' });
  await goto(dark.page);
  eq(await dark.page.evaluate(() => document.documentElement.dataset.theme), 'dark', 'OS dark preference');
  const toggle = dark.page.locator('.theme-toggle');
  eq(await toggle.getAttribute('aria-pressed'), 'true');
  await toggle.click();
  eq(await dark.page.evaluate(() => document.documentElement.dataset.theme), 'light');
  eq(await toggle.getAttribute('aria-pressed'), 'false');
  await dark.page.reload();
  await dark.page.waitForSelector('#app h1');
  eq(await dark.page.evaluate(() => document.documentElement.dataset.theme), 'light', 'choice persisted over OS preference');
  await dark.context.close();

  const light = await open({ colorScheme: 'light' });
  await goto(light.page);
  eq(await light.page.evaluate(() => document.documentElement.dataset.theme), 'light');
  await light.page.locator('.theme-toggle').click();
  await light.page.reload();
  await light.page.waitForSelector('#app h1');
  eq(await light.page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  const bg = await light.page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  eq(bg, 'rgb(17, 20, 24)', 'dark background applied');
  await light.context.close();
});

await test('theme: correct theme is applied before the first paint (no flash)', async () => {
  const { page, context } = await open({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    window.__themeAtDomReady = null;
    document.addEventListener('DOMContentLoaded', () => { window.__themeAtDomReady = document.documentElement.dataset.theme; });
  });
  await page.goto(url);
  await page.waitForSelector('#app h1');
  eq(await page.evaluate(() => window.__themeAtDomReady), 'dark');
  await context.close();
});

await test('theme: works when storage is blocked (private browsing)', async () => {
  const { page, context } = await open({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('blocked'); } });
  });
  await goto(page);
  await page.locator('.theme-toggle').click();
  eq(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
  await context.close();
});

/* ======================================================================
   4. Mobile menu and header
   ====================================================================== */
await test('mobile menu: opens, traps focus, closes with Escape, navigates, locks scrolling', async () => {
  const { page, context, problems } = await open(devices['Pixel 5']);
  await goto(page);
  const button = page.locator('.menu-toggle');
  ok(await button.isVisible(), 'menu button visible on phone');
  ok(!(await page.locator('.site-nav').isVisible()), 'desktop nav hidden on phone');
  eq(await button.getAttribute('aria-expanded'), 'false');
  await button.click();
  eq(await button.getAttribute('aria-expanded'), 'true');
  ok(await page.locator('#mobile-nav').isVisible(), 'panel visible');
  ok(await page.evaluate(() => document.documentElement.classList.contains('menu-open')), 'page scroll locked');
  ok(await page.evaluate(() => document.getElementById('main-content').inert), 'page behind the menu is inert');
  await page.keyboard.press('Escape');
  eq(await button.getAttribute('aria-expanded'), 'false');
  ok(!(await page.locator('#mobile-nav').isVisible()), 'panel closed');
  eq(await page.evaluate(() => document.activeElement.className.includes('menu-toggle')), true, 'focus returned to the menu button');
  await button.click();
  await page.locator('#mobile-nav a', { hasText: 'Projects' }).click();
  await page.waitForSelector('#projects-search');
  ok(!(await page.locator('#mobile-nav').isVisible()), 'menu closes after navigation');
  ok(!(await page.evaluate(() => document.documentElement.classList.contains('menu-open'))), 'scroll unlocked');
  eq(await page.locator('#mobile-nav a[aria-current="page"]').textContent(), 'Projects', 'current page marked');
  // tab wraps inside the open menu
  await button.click();
  for (let i = 0; i < 14; i++) await page.keyboard.press('Tab');
  ok(await page.evaluate(() => !!document.activeElement.closest('.site-header')), 'focus stayed in the header while the menu was open');
  await context.close();
  eq(problems, []);
});

await test('menu closes when the window becomes wide (rotate / resize)', async () => {
  const { page, context } = await open({ viewport: { width: 500, height: 800 } });
  await goto(page);
  await page.locator('.menu-toggle').click();
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.waitForTimeout(200);
  ok(!(await page.evaluate(() => document.documentElement.classList.contains('menu-open'))), 'scroll lock removed');
  ok(await page.locator('.site-nav').isVisible(), 'desktop nav visible');
  eq(await page.evaluate(() => document.getElementById('main-content').inert), false, 'main no longer inert');
  await context.close();
});

await test('desktop header: active page is marked and all links work', async () => {
  const { page, context, problems } = await open({ viewport: { width: 1280, height: 800 } });
  await goto(page);
  const links = await page.locator('.site-nav a').evaluateAll((as) => as.map((a) => [a.textContent, a.getAttribute('href')]));
  eq(links.length, 8);
  for (const [label, href] of links) {
    await page.locator('.site-nav a', { hasText: new RegExp(`^${label}$`) }).click();
    await page.waitForSelector('#app h1');
    await page.waitForTimeout(120);
    eq(await page.locator('.site-nav a[aria-current="page"]').textContent(), label, `active link for ${href}`);
  }
  await context.close();
  eq(problems, []);
});

await test('touch targets in the header and filters are at least 44px on phones', async () => {
  const { page, context } = await open(devices['iPhone 13']);
  await goto(page, '#/projects');
  const sizes = await page.evaluate(() => [...document.querySelectorAll('.icon-btn, .brand, .filter-chip, .input, .select, .btn')]
    .filter((el) => el.offsetParent !== null).map((el) => { const r = el.getBoundingClientRect(); return [el.className.split(' ')[0], Math.round(r.height), Math.round(r.width)]; }));
  const small = sizes.filter(([, h, w]) => h < 44 || w < 44);
  eq(small, [], 'too small');
  await context.close();
});

/* ======================================================================
   5. Projects: search, filter, sort, empty state
   ====================================================================== */
await test('projects: search, category filter, sort, URL state and empty state', async () => {
  const { page, context, problems } = await open({ viewport: { width: 1280, height: 900 } });
  await goto(page, '#/projects');
  eq(await page.locator('.grid .card').count(), 3);
  eq((await page.locator('.result-count').textContent()).trim(), '3 projects');

  await page.fill('#projects-search', 'python');
  await page.waitForTimeout(400);
  eq(await page.locator('.grid .card').count(), 1);
  ok((await page.locator('.card__title').first().textContent()).includes('Smoothing'), 'search finds the Python project');
  ok(page.url().includes('q=python'), 'query stored in the address');

  await page.fill('#projects-search', 'zzz-no-match');
  await page.waitForTimeout(400);
  ok(await page.locator('.empty-state').isVisible(), 'empty state shown');
  await page.click('.empty-state button');
  await page.waitForTimeout(300);
  eq(await page.locator('.grid .card').count(), 3, 'clear filters restores everything');
  eq(await page.inputValue('#projects-search'), '');

  await page.click('.filter-chip:has-text("Electronics")');
  eq(await page.locator('.grid .card').count(), 1);
  await page.click('.filter-chip:has-text("All")');
  await page.selectOption('#projects-sort', 'title');
  eq(await page.locator('.card__title').allTextContents(), ['RC low-pass filter analysis', 'Sensor data logger', 'Smoothing a CSV signal with Python']);
  await page.selectOption('#projects-sort', 'oldest');
  eq((await page.locator('.card__title').first().textContent()), 'Smoothing a CSV signal with Python');

  await page.fill('#projects-search', 'microcontroller adc');
  await page.waitForTimeout(400);
  eq(await page.locator('.grid .card').count(), 1, 'multi-word search finds the matching project');
  await page.fill('#projects-search', 'microcontroller python');
  await page.waitForTimeout(400);
  eq(await page.locator('.grid .card').count(), 0, 'multi-word search requires all words');

  // Escape clears the search box
  await page.press('#projects-search', 'Escape');
  await page.waitForTimeout(300);
  eq(await page.inputValue('#projects-search'), '');

  // opening a card goes to the detail page
  await page.locator('.card__title a', { hasText: 'RC low-pass' }).click();
  await page.waitForSelector('.project-head');
  eq(await page.locator('main h1').textContent(), 'RC low-pass filter analysis');
  await page.goBack();
  await page.waitForSelector('#projects-search');
  await context.close();
  eq(problems, []);
});

/* ======================================================================
   6. Project detail
   ====================================================================== */
await test('project detail: case-study sections, title block, only sections with content, related items', async () => {
  const { page, context, problems } = await open({ viewport: { width: 1440, height: 900 } });
  await goto(page, '#/projects/rc-low-pass-filter');
  const headings = await page.locator('.prose h2').allTextContents();
  const clean = headings.map((t) => t.replace(/#$/, '').trim());
  ok(clean.includes('Problem statement') && clean.includes('Calculations'), `headings: ${clean}`);
  ok(!clean.includes('Results') && !clean.includes('References'), 'sections without content are not invented');
  ok(await page.locator('.title-block').isVisible(), 'title block');
  ok((await page.locator('math').count()) >= 4, 'equations rendered as MathML');
  ok(await page.locator('.table-wrap').isVisible(), 'table');
  ok(await page.locator('.breadcrumbs').isVisible(), 'breadcrumbs');
  ok((await page.locator('.related').count()) >= 1, 'related items');
  ok(await page.locator('.toc').isVisible(), 'table of contents');
  // external link safety
  const bad = await page.$$eval('a[target="_blank"]', (as) => as.filter((a) => !/noopener/.test(a.rel)).length);
  eq(bad, 0, 'target=_blank links without noopener');
  // TOC link scrolls to the section and keeps the page
  await page.locator('.toc a', { hasText: 'Calculations' }).click();
  await page.waitForTimeout(400);
  ok(page.url().includes('#/projects/rc-low-pass-filter#'), 'address keeps the page and adds the section');
  const top = await page.evaluate(() => document.getElementById('calculations').getBoundingClientRect().top);
  ok(top >= 0 && top < 300, `section scrolled into view (top=${top})`);
  eq(await page.locator('main h1').textContent(), 'RC low-pass filter analysis', 'did not navigate away');
  await context.close();
  eq(problems, []);
});

/* ======================================================================
   7. Blog
   ====================================================================== */
await test('blog: list, full-text search, tag and category filters, empty state', async () => {
  const { page, context, problems } = await open({ viewport: { width: 1280, height: 900 } });
  await goto(page, '#/blog');
  eq(await page.locator('.post-row').count(), 3);
  await page.fill('#blog-search', 'absolute maximum');
  await page.waitForTimeout(400);
  eq(await page.locator('.post-row').count(), 1, 'full-text search reaches the article body');
  eq(await page.locator('.post-row__title').textContent(), 'A checklist for reading a datasheet');
  await page.fill('#blog-search', '');
  await page.waitForTimeout(300);
  await page.selectOption('#blog-tag', 'transients');
  eq(await page.locator('.post-row').count(), 1);
  await page.selectOption('#blog-tag', 'all');
  await page.click('.filter-chip:has-text("Electronics")');
  eq(await page.locator('.post-row').count(), 1);
  await page.fill('#blog-search', 'nothing matches this');
  await page.waitForTimeout(400);
  ok(await page.locator('.empty-state').isVisible());
  ok((await page.locator('.empty-state').textContent()).includes('No articles match'));
  await context.close();
  eq(problems, []);
});

await test('article: metadata, table of contents, equations, code copy, prev/next, related', async () => {
  const { page, context, problems } = await open({ viewport: { width: 1440, height: 900 } });
  await goto(page, '#/blog/rc-time-constant');
  ok((await page.locator('.project-head .post-row__meta').textContent()).includes('min read'), 'reading time');
  ok((await page.locator('.project-head .post-row__meta time').first().getAttribute('datetime')) === '2026-09-27', 'publication date');
  ok(await page.locator('.toc').isVisible(), 'TOC');
  ok((await page.locator('math[display="block"]').count()) >= 3, 'display equations');
  ok(await page.locator('figure.figure figcaption').isVisible(), 'figure caption');
  // copy button
  await page.locator('.code-copy').first().scrollIntoViewIfNeeded();
  await page.locator('.code-copy').first().click();
  await page.waitForTimeout(200);
  ok((await page.locator('.code-copy').first().textContent()).includes('Copied'), 'copy feedback');
  ok((await page.evaluate(() => navigator.clipboard.readText())).includes('tau = R * C'), 'code was copied');
  // prev / next
  ok((await page.locator('.prev-next a').count()) >= 1, 'prev/next');
  await page.locator('.prev-next a').first().click();
  await page.waitForTimeout(300);
  ok(page.url().includes('#/blog/'), 'neighbour navigation');
  await context.close();
  eq(problems, []);
});

await test('missing article / project / route show a helpful page (not a blank screen)', async () => {
  const { page, context, problems } = await open();
  for (const [hash, text] of [['#/blog/gone', 'Article not found'], ['#/projects/gone', 'Project not found'], ['#/nonsense', 'Page not found']]) {
    await goto(page, hash);
    eq(await page.locator('main h1').textContent(), text);
    ok(await page.locator('.not-found .btn').first().isVisible(), 'a way back is offered');
  }
  await context.close();
  eq(problems, []);
});

/* ======================================================================
   8. Data page and charts
   ====================================================================== */
await test('data: charts render, are labelled, keyboard accessible and responsive', async () => {
  const { page, context, problems } = await open({ viewport: { width: 1280, height: 900 } });
  await goto(page, '#/data');
  await page.waitForSelector('.chart svg path.chart-line');
  eq(await page.locator('.chart').count(), 3);
  ok((await page.locator('.dataset__head .badge').first().textContent()).includes('Illustrative'), 'sample data is labelled');
  ok(await page.locator('.chart figcaption').first().isVisible(), 'text summary');
  const label = await page.locator('.chart-frame').first().getAttribute('aria-label');
  ok(/arrow keys/.test(label), 'keyboard instructions');
  // keyboard reading
  await page.locator('.chart-frame').first().focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  ok(await page.locator('.chart-tooltip').first().isVisible(), 'tooltip visible via keyboard');
  const readout = await page.locator('.chart-frame .sr-only').first().textContent();
  ok(/Frequency: 20 Hz/.test(readout) && /Gain: 0 dB/.test(readout), `screen-reader readout: ${readout}`);
  await page.keyboard.press('End');
  ok(/100,000 Hz/.test(await page.locator('.chart-frame .sr-only').first().textContent()), 'End key');
  await page.keyboard.press('Escape');
  ok(!(await page.locator('.chart-tooltip').first().isVisible()), 'Escape hides the tooltip');
  // pointer reading
  const box = await page.locator('.chart-frame').first().boundingBox();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.4);
  ok(await page.locator('.chart-tooltip').first().isVisible(), 'tooltip visible on hover');
  // table + download
  await page.locator('details.data-details summary').first().click();
  ok(await page.locator('details.data-details table').first().isVisible(), 'table opens');
  eq(await page.locator('details.data-details tbody tr').first().locator('td').count(), 3);
  const csv = await page.locator('a[download]').first().getAttribute('href');
  ok((await page.request.get(url + csv)).ok(), 'csv link works');
  // responsive: chart width follows the container
  const w1 = await page.locator('.chart svg').first().evaluate((s) => s.getBoundingClientRect().width);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(500);
  const w2 = await page.locator('.chart svg').first().evaluate((s) => s.getBoundingClientRect().width);
  ok(w2 < w1 && w2 <= 360, `chart resized (${Math.round(w1)} -> ${Math.round(w2)})`);
  eq(await overflow(page), 0, 'no sideways scroll on narrow screen');
  const viewBox = await page.locator('.chart svg').first().getAttribute('viewBox');
  ok(Number(viewBox.split(' ')[2]) <= 360, `chart redrawn for width: ${viewBox}`);
  await context.close();
  eq(problems, []);
});

await test('data: bar and log-scale charts have correct labels and bars', async () => {
  const { page, context } = await open({ viewport: { width: 1000, height: 900 } });
  await goto(page, '#/data');
  await page.waitForSelector('.chart rect.chart-bar');
  eq(await page.locator('.chart rect.chart-bar').count(), 5, 'five bars');
  const bars = await page.$$eval('.chart rect.chart-bar', (r) => r.map((x) => Number(x.getAttribute('height'))));
  ok(bars.every((b, i) => i === 0 || b > bars[i - 1]), `bars grow with resolution: ${bars}`);
  const logTicks = await page.locator('.chart').nth(2).locator('text.chart-tick').allTextContents();
  ok(logTicks.includes('0.01') && logTicks.includes('10'), `log axis labels: ${logTicks}`);
  await context.close();
});

/* ======================================================================
   9. Remaining pages
   ====================================================================== */
await test('CV page: falls back gracefully when no PDF exists; print button works', async () => {
  const { page, context, problems } = await open();
  await goto(page, '#/cv');
  ok(await page.locator('.cv-note').isVisible(), 'fallback note');
  ok(!(await page.locator('a[download]').count()), 'no broken download button');
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click('button:has-text("Print or save as PDF")');
  eq(await page.evaluate(() => window.__printed), 1);
  await context.close();
  eq(problems, []);
});

await test('CV page: shows a download button when the PDF really exists', async () => {
  const { page, context } = await open();
  await page.route('**/files/cv.pdf', (route) => route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4' }));
  await page.addInitScript(() => {});
  // temporarily point the profile at the PDF by intercepting the data module
  await page.route('**/data/profile.js', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace("cvPdf: ''", "cvPdf: 'files/cv.pdf'");
    await route.fulfill({ response, body });
  });
  await goto(page, '#/cv');
  await page.waitForSelector('a[download]');
  eq((await page.locator('a[download]').getAttribute('href')), 'files/cv.pdf');
  await context.close();
});

await test('contact page: no private details by default; form works in email-app mode when configured', async () => {
  const a = await open();
  await goto(a.page, '#/contact');
  eq(await a.page.locator('form').count(), 0, 'no form without an email address');
  ok((await a.page.locator('.contact-card').first().textContent()).includes('have not been added'), 'honest message');
  eq(await a.page.locator('a[href^="mailto:"]').count(), 0, 'no mailto link');
  await a.context.close();

  const b = await open();
  await b.page.route('**/data/profile.js', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace("email: ''", "email: 'hello@example.com'").replace("url: '', icon: 'github'", "url: 'https://github.com/example', icon: 'github'");
    await route.fulfill({ response, body });
  });
  await goto(b.page, '#/contact');
  ok(await b.page.locator('form').isVisible(), 'form visible');
  ok((await b.page.locator('.contact-card').nth(1).textContent()).includes('Nothing is sent from this website'), 'form is honest about how it works');
  await b.page.fill('#contact-name', 'Test');
  await b.page.fill('#contact-subject', 'Hello');
  await b.page.fill('#contact-message', 'A message');
  await b.page.evaluate(() => { window.__nav = null; });
  const [req] = await Promise.all([
    b.page.waitForEvent('request', { predicate: (r) => r.url().startsWith('mailto:'), timeout: 1500 }).catch(() => null),
    b.page.click('button[type="submit"]'),
  ]);
  void req;
  await b.page.waitForTimeout(300);
  ok((await b.page.locator('.form-status').textContent()).includes('email app'), 'status message after submit');
  const link = await b.page.locator('a[href^="mailto:hello@example.com"]').count();
  ok(link >= 1, 'email link shown once configured');
  ok((await b.page.locator('a[href="https://github.com/example"][rel~="noopener"]').count()) >= 1, 'external link has noopener');
  await b.context.close();
});

await test('skills, education and home hide empty sections instead of showing blanks', async () => {
  const { page, context } = await open();
  await goto(page, '#/education');
  const headings = await page.locator('.edu-section h2').allTextContents();
  eq(headings, ['Education'], 'only sections with entries are shown');
  await goto(page, '#/skills');
  ok((await page.locator('.skill-group').count()) >= 5, 'skill groups');
  ok(!(await page.locator('.skill__level').allTextContents()).some((t) => /%/.test(t)), 'no percentage bars');
  await context.close();
});

/* ======================================================================
   10. Accessibility basics
   ====================================================================== */
await test('accessibility: landmarks, names, alt text, unique ids, heading order on every page', async () => {
  const { page, context } = await open({ viewport: { width: 1280, height: 900 } });
  const bad = [];
  for (const [hash] of ROUTES) {
    await goto(page, hash);
    const report = await page.evaluate(() => {
      const out = [];
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dup.length) out.push(`duplicate ids: ${[...new Set(dup)]}`);
      if (document.querySelectorAll('main').length !== 1) out.push('need exactly one <main>');
      if (!document.querySelector('header nav[aria-label]')) out.push('header nav missing');
      if (document.documentElement.lang !== 'en') out.push('html lang');
      document.querySelectorAll('img').forEach((i) => { if (!i.hasAttribute('alt')) out.push(`img without alt: ${i.src}`); });
      document.querySelectorAll('button, a[href]').forEach((el) => {
        const name = (el.getAttribute('aria-label') || el.textContent || '').trim();
        if (!name && !el.querySelector('img[alt]')) out.push(`unnamed ${el.tagName.toLowerCase()}: ${el.outerHTML.slice(0, 80)}`);
      });
      document.querySelectorAll('input:not([type=hidden]), select, textarea').forEach((el) => {
        if (!el.labels?.length && !el.getAttribute('aria-label')) out.push(`unlabelled field: ${el.id || el.name}`);
      });
      let last = 1;
      document.querySelectorAll('main h1, main h2, main h3, main h4').forEach((h) => {
        const lvl = Number(h.tagName[1]);
        if (lvl > last + 1) out.push(`heading jumps from h${last} to h${lvl}: "${h.textContent.trim().slice(0, 40)}"`);
        last = lvl;
      });
      document.querySelectorAll('[aria-labelledby]').forEach((el) => { if (!document.getElementById(el.getAttribute('aria-labelledby'))) out.push(`aria-labelledby target missing: ${el.getAttribute('aria-labelledby')}`); });
      document.querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])').forEach((el) => out.push('positive tabindex'));
      return out;
    });
    report.forEach((r) => bad.push(`${hash || '#/'}: ${r}`));
  }
  await context.close();
  ok(bad.length === 0, bad.join('\n'));
});

await test('accessibility: keyboard - skip link, visible focus ring, tab order starts in the page', async () => {
  const { page, context } = await open({ viewport: { width: 1280, height: 900 } });
  await goto(page, '#/projects');
  await page.keyboard.press('Tab');
  eq(await page.evaluate(() => document.activeElement.className), 'skip-link');
  ok(await page.locator('.skip-link').isVisible(), 'skip link appears on focus');
  await page.keyboard.press('Enter');
  eq(await page.evaluate(() => document.activeElement.id), 'main-content');
  eq(await page.evaluate(() => location.hash), '#/projects', 'skip link left the address alone');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return [s.outlineStyle, parseFloat(s.outlineWidth)]; });
  eq(outline[0], 'solid');
  ok(outline[1] >= 2, 'focus ring is at least 2px');
  await context.close();
});

await test('accessibility: focus moves to the new page heading after navigation', async () => {
  const { page, context } = await open({ viewport: { width: 1280, height: 900 } });
  await goto(page);
  await page.locator('.site-nav a', { hasText: 'Skills' }).click();
  await page.waitForSelector('main h1');
  await page.waitForTimeout(200);
  eq(await page.evaluate(() => document.activeElement.tagName), 'H1');
  eq(await page.title(), 'Skills – Your Name', 'document title updated');
  await context.close();
});

await test('page titles and meta descriptions are unique per page', async () => {
  const { page, context } = await open();
  const titles = new Set();
  for (const [hash] of ROUTES.slice(0, 15)) {
    await goto(page, hash);
    const t = await page.title();
    ok(!titles.has(t), `duplicate title ${t}`);
    titles.add(t);
    ok((await page.locator('meta[name="description"]').getAttribute('content')).length > 20, `description for ${hash}`);
  }
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  ok(canonical.startsWith(origin + BASE), `canonical follows the real address: ${canonical}`);
  await context.close();
});

await test('reduced motion: animations are effectively disabled', async () => {
  const { page, context } = await open({ reducedMotion: 'reduce' });
  await goto(page);
  const d = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.page')).animationDuration));
  ok(d < 0.01, `animation duration ${d}s`);
  await context.close();
});

await test('print: header, footer and controls are hidden; CV remains', async () => {
  const { page, context } = await open({ viewport: { width: 1000, height: 900 } });
  await goto(page, '#/cv');
  await page.emulateMedia({ media: 'print' });
  ok(!(await page.locator('.site-header').isVisible()), 'header hidden');
  ok(!(await page.locator('.site-footer').isVisible()), 'footer hidden');
  ok(!(await page.locator('.cv-toolbar').isVisible()), 'toolbar hidden');
  ok(await page.locator('.cv').isVisible(), 'CV visible');
  await context.close();
});

/* ======================================================================
   11. Resilience
   ====================================================================== */
await test('a missing or broken content file does not break the site', async () => {
  const { page, context } = await open({}, { allow: ['reading-a-datasheet', 'Could not load', 'Content problems', 'Failed to load resource'] });
  await page.route('**/content/blog/reading-a-datasheet.md', (r) => r.fulfill({ status: 404, body: 'nope' }));
  await goto(page, '#/blog');
  eq(await page.locator('.post-row').count(), 2, 'other posts still listed');
  ok(await page.locator('[role="alert"]').isVisible(), 'owner is told about the problem');
  await goto(page, '#/blog/reading-a-datasheet');
  eq(await page.locator('main h1').textContent(), 'Article not found');
  await context.close();
});

await test('a malformed article (no front matter, odd Markdown) still renders safely', async () => {
  const { page, context } = await open({}, { allow: ['Content problems'] });
  await page.route('**/content/blog/reading-a-datasheet.md', (r) => r.fulfill({ status: 200, contentType: 'text/markdown', body: 'No front matter here\n\n<script>window.__pwned = 1</script>\n\n[x](javascript:window.__pwned=1)\n\n$$ \\unknown{ $$\n\n```\nunclosed code' }));
  await goto(page, '#/blog/reading-a-datasheet');
  eq(await page.evaluate(() => window.__pwned), undefined, 'no script ran');
  await page.locator('.prose a').first().click({ trial: true }).catch(() => {});
  ok((await page.locator('.prose').count()) >= 1, 'content shown');
  await context.close();
});

await test('opening index.html from a folder (file://) shows a helpful message', async () => {
  const { page, context } = await open({}, { allow: ['file://', 'CORS', 'Failed to load', 'net::ERR', 'Access to script'] });
  await page.goto(`file://${new URL('../index.html', import.meta.url).pathname}`);
  await page.waitForTimeout(500);
  ok((await page.locator('#app').textContent()).includes('could not start'), 'friendly message');
  ok((await page.locator('#app').textContent()).includes('local web server'), 'tells the owner what to do');
  await context.close();
});

await test('slow network: pages still load (throttled)', async () => {
  const { page, context, problems } = await open(devices['Pixel 5']);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 });
  const t0 = Date.now();
  await page.goto(url + '#/blog/rc-time-constant');
  await page.waitForSelector('#app h1', { timeout: 20000 });
  const seconds = (Date.now() - t0) / 1000;
  ok(seconds < 10, `took ${seconds.toFixed(1)}s on a slow connection`);
  await context.close();
  eq(problems, []);
});

await test('payload size: the first page load stays small', async () => {
  const { page, context } = await open();
  let bytes = 0;
  page.on('response', async (r) => { try { bytes += (await r.body()).length; } catch { /* ignore */ } });
  await goto(page);
  await page.waitForTimeout(400);
  await context.close();
  ok(bytes < 650 * 1024, `first load transferred ${(bytes / 1024).toFixed(0)} KB`);
});

/* ---------------------------------------------------------------------- */
await browser.close();
server.close();
console.log(`\n\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach((f) => console.log(` - ${f}`));
  process.exit(1);
}
