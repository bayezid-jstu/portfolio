// Unit tests: run with  node tests/unit.mjs   (Node.js 18+, no packages needed)
// They check the Markdown renderer (including safety), equations, front matter,
// the code highlighter, formatting helpers, chart maths, colour contrast and
// that every file and link used by the site really exists.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (p) => import(pathToFileURL(path.join(root, p)).href);

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (error) { failures.push(`${name}\n      ${error.message}`); }
}
const eq = (actual, expected, label = '') => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label} expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
};
const ok = (cond, label) => { if (!cond) throw new Error(label || 'assertion failed'); };
const has = (text, part, label) => ok(text.includes(part), `${label || 'output'} should contain ${JSON.stringify(part)}\n      got: ${text.slice(0, 300)}`);
const lacks = (text, part, label) => ok(!text.includes(part), `${label || 'output'} must NOT contain ${JSON.stringify(part)}`);

const { renderMarkdown, safeUrl, renderInline } = await load('assets/js/lib/markdown.js');
const { parseFrontmatter } = await load('assets/js/lib/frontmatter.js');
const { texToMathML } = await load('assets/js/lib/math.js');
const { highlight } = await load('assets/js/lib/highlight.js');
const fmt = await load('assets/js/lib/format.js');
const { niceTicks, logTicks, formatTick, formatValue } = await load('assets/js/lib/charts.js').catch(() => ({}));
const { matchRoute, parseHash } = await load('assets/js/lib/router.js');

/* ---------------- Markdown ---------------- */
test('markdown: headings get ids and h1 becomes h2', () => {
  const r = renderMarkdown('# Top\n\n## Second\n\n### Third');
  has(r.html, '<h2 id="top">Top</h2>');
  has(r.html, '<h2 id="second">');
  has(r.html, '<h3 id="third">');
  eq(r.headings.map((h) => h.level), [2, 2, 3]);
});
test('markdown: duplicate headings get unique ids', () => {
  const r = renderMarkdown('## Same\n\n## Same');
  eq(r.headings.map((h) => h.id), ['same', 'same-2']);
});
test('markdown: raw HTML is escaped, never executed', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>').html;
  lacks(html, '<script');
  lacks(html, '<img src=x');
  has(html, '&lt;script&gt;');
});
test('markdown: dangerous link and image schemes are removed', () => {
  const html = renderMarkdown('[x](javascript:alert(1)) [y](JaVaScRiPt:alert(1)) ![z](data:text/html;base64,AAAA) [v](vbscript:x)').html;
  lacks(html.toLowerCase(), 'href="javascript');
  lacks(html.toLowerCase(), 'vbscript:');
  lacks(html, 'src="data:');
});
test('markdown: safeUrl allows normal destinations', () => {
  eq(safeUrl('https://example.com/a?b=1'), 'https://example.com/a?b=1');
  eq(safeUrl('files/cv.pdf'), 'files/cv.pdf');
  eq(safeUrl('#/projects'), '#/projects');
  eq(safeUrl('mailto:me@example.com'), 'mailto:me@example.com');
  eq(safeUrl('javascript:alert(1)'), null);
  eq(safeUrl(' java\nscript:alert(1)'), null);
});
test('markdown: external links open safely in a new tab', () => {
  const html = renderMarkdown('[site](https://example.com)').html;
  has(html, 'target="_blank"');
  has(html, 'rel="noopener noreferrer"');
});
test('markdown: attribute injection through link text/title is escaped', () => {
  const html = renderMarkdown('[a](https://e.com "x\\" onmouseover=\\"alert(1)")').html;
  ok(!/<[^>]*onmouseover=/.test(html), 'no tag may carry an onmouseover attribute: ' + html);
});
test('markdown: emphasis, code and code containing markdown characters', () => {
  const html = renderInline('**b** *i* ~~s~~ `a*b*c <x>`');
  has(html, '<strong>b</strong>');
  has(html, '<em>i</em>');
  has(html, '<del>s</del>');
  has(html, '<code>a*b*c &lt;x&gt;</code>');
});
test('markdown: backslashes inside code spans stay literal; escaped backticks do not open a span', () => {
  has(renderInline('Write `\\$` now'), '<code>\\$</code>');
  lacks(renderInline('a \\`not code\\` b'), '<code>');
  has(renderInline('``a ` b``'), '<code>a ` b</code>');
});
test('markdown: code inside a link label survives', () => {
  has(renderInline('[`code` link](https://e.com)'), '<code>code</code>');
});
test('markdown: lists, nesting and tasks', () => {
  const html = renderMarkdown('- a\n- b\n  - c\n\n1. x\n2. y\n\n- [x] done\n- [ ] todo').html;
  has(html, '<ul>');
  has(html, '<ol>');
  has(html, '<li>c</li>');
  has(html, 'type="checkbox" disabled checked');
  has(html, 'type="checkbox" disabled aria-label="Not done"');
});
test('markdown: tables are wrapped for scrolling and support alignment', () => {
  const html = renderMarkdown('| A | B |\n|:--|--:|\n| 1 | 2 |').html;
  has(html, 'class="table-wrap"');
  has(html, '<th scope="col">A</th>');
  has(html, 'class="al-r"');
});
test('markdown: fenced code is highlighted and escaped', () => {
  const html = renderMarkdown('```python\nx = "<b>"  # note\n```').html;
  has(html, 'class="code-block"');
  has(html, 'tok-comment');
  has(html, '&lt;b&gt;');
  lacks(html, '<b>');
});
test('markdown: figure with caption and size', () => {
  const html = renderMarkdown('![Alt text](a/b.svg "A *caption*"){800x500}').html;
  has(html, '<figure class="figure">');
  has(html, 'width="800" height="500"');
  has(html, '<figcaption>A <em>caption</em></figcaption>');
});
test('markdown: dollar amounts are not treated as maths, escaped dollars work', () => {
  const html = renderInline('It costs $5 and $6, or \\$x\\$.');
  lacks(html, '<math');
});
test('markdown: inline and display maths produce MathML', () => {
  const html = renderMarkdown('Inline $x^2$ here.\n\n$$\n\\frac{a}{b}\n$$').html;
  has(html, '<math>');
  has(html, '<math display="block">');
  has(html, '<mfrac>');
});
test('markdown: heading anchors use the page address', () => {
  const html = renderMarkdown('## Hello world', { anchorBase: '#/blog/post' }).html;
  has(html, 'href="#/blog/post#hello-world"');
});

/* ---------------- Maths ---------------- */
test('math: fractions, roots, scripts and Greek', () => {
  const m = texToMathML('\\tau = RC, \\sqrt{x^2+1}, V_{out}, e^{-t/\\tau}');
  has(m, '<mi>τ</mi>');
  has(m, '<msqrt>');
  has(m, '<msub>');
  has(m, '<msup>');
});
test('math: sums use under/over limits', () => {
  has(texToMathML('\\sum_{k=0}^{N-1} x_k', true), '<munderover>');
});
test('math: unknown commands do not throw', () => {
  const m = texToMathML('\\notacommand{1}');
  has(m, 'math-error');
});
test('math: malicious text is escaped', () => {
  const m = texToMathML('<script>alert(1)</script> \\text{<b>}');
  lacks(m, '<script');
  lacks(m, '<b>');
});
test('math: \\left and \\right build stretchy fences', () => {
  has(texToMathML('\\left( \\frac{1}{2} \\right)'), 'stretchy="true"');
});

/* ---------------- Front matter ---------------- */
test('frontmatter: scalars, booleans, lists and block lists', () => {
  const { data, body } = parseFrontmatter('---\ntitle: "Hello: world"\ndate: 2026-01-02\nfeatured: true\ntags: [a, "b c", d]\nlinks:\n  - Code | https://x.y\n  - PDF | files/a.pdf\n---\nBody text');
  eq(data.title, 'Hello: world');
  eq(data.date, '2026-01-02');
  eq(data.featured, true);
  eq(data.tags, ['a', 'b c', 'd']);
  eq(data.links, ['Code | https://x.y', 'PDF | files/a.pdf']);
  eq(body, 'Body text');
});
test('frontmatter: file without front matter still works', () => {
  const { data, body, hasFrontmatter } = parseFrontmatter('Just text');
  eq(data, {}); eq(body, 'Just text'); eq(hasFrontmatter, false);
});
test('frontmatter: Windows line endings and BOM', () => {
  const { data } = parseFrontmatter('\uFEFF---\r\ntitle: A\r\ntags: [x]\r\n---\r\nB');
  eq(data.title, 'A'); eq(data.tags, ['x']);
});

/* ---------------- Highlighter ---------------- */
test('highlight: languages and aliases', () => {
  has(highlight('def f():\n    return 1', 'python'), 'tok-keyword');
  has(highlight('const a = 1; // hi', 'ts'), 'tok-comment');
  has(highlight('int x = 5; // hi', 'arduino'), 'tok-type');
  has(highlight('{"a": [1, true]}', 'json'), 'tok-number');
  has(highlight('<a href="x">t</a>', 'html'), 'tok-string');
});
test('highlight: unknown language is escaped plain text', () => {
  eq(highlight('a < b && c', 'klingon'), 'a &lt; b &amp;&amp; c');
});
test('highlight: multi-line strings and block comments do not end early', () => {
  has(highlight('x = """a\nb"""\ny = 1', 'python'), '<span class="tok-string">"""a\nb"""</span>');
  has(highlight('/* a\nb */ int z;', 'c'), '<span class="tok-comment">/* a\nb */</span>');
});

/* ---------------- Formatting helpers ---------------- */
test('format: dates', () => {
  eq(fmt.formatDate('2026-03-14'), '14 Mar 2026');
  eq(fmt.formatDate('2026-03'), 'Mar 2026');
  eq(fmt.formatDate('nonsense'), '');
  eq(fmt.parseDate('2026-13-45') === null, true);
  eq(fmt.parseDate('2026-02-31') === null, true);
  eq(fmt.parseDate('2024-02-29') !== null, true);
});
test('format: slugs, initials, reading time, words', () => {
  eq(fmt.slugify('Hello, World! & Co'), 'hello-world-and-co');
  eq(fmt.slugify('Café Électrique'), 'cafe-electrique');
  eq(fmt.initialsFrom('Ada Lovelace'), 'AL');
  eq(fmt.initialsFrom('Plato'), 'PL');
  eq(fmt.readingMinutes(0), 1);
  eq(fmt.readingMinutes(1000), 5);
  eq(fmt.countWords('One two, three-four five.'), 4);
});
test('format: isConfigured hides blank values', () => {
  eq(fmt.isConfigured(''), false); eq(fmt.isConfigured('   '), false); eq(fmt.isConfigured('x'), true); eq(fmt.isConfigured(undefined), false);
});

/* ---------------- Router ---------------- */
test('router: hash parsing', () => {
  const p = parseHash('#/blog/my-post?cat=a&q=b%20c#section');
  eq(p.path, '/blog/my-post'); eq(p.query.get('q'), 'b c'); eq(p.anchor, 'section');
  eq(parseHash('#main-content'), null);
  eq(parseHash(''), null);
  eq(parseHash('#/projects/').path, '/projects');
});
test('router: route matching', () => {
  eq(matchRoute('/projects/:slug', '/projects/abc'), { slug: 'abc' });
  eq(matchRoute('/projects', '/projects/abc'), null);
  eq(matchRoute('/', '/'), {});
});

/* ---------------- Charts maths ---------------- */
if (niceTicks) {
  test('charts: nice ticks cover the data', () => {
    const t = niceTicks(0, 97, 5);
    ok(t[0] <= 0 && t[t.length - 1] >= 97, 'ticks must cover range');
    ok(t.length >= 3 && t.length <= 9, 'sensible tick count');
    const n = niceTicks(-36, 0, 5);
    ok(n[0] <= -36 && n[n.length - 1] >= 0, 'negative range');
    eq(niceTicks(5, 5, 3).length >= 2, true);
  });
  test('charts: log ticks are powers of ten', () => {
    eq(logTicks(10, 100000), [10, 100, 1000, 10000, 100000]);
    eq(logTicks(0.05, 12), [0.01, 0.1, 1, 10, 100]);
  });
  test('charts: number formatting', () => {
    eq(formatTick(1000), '1k'); eq(formatTick(100000), '100k'); eq(formatTick(-20), '−20'); eq(formatTick(0.25), '0.25');
    eq(formatValue(1591.549), '1,591.5');
  });
}

/* ---------------- Colour contrast (WCAG) ---------------- */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const tokens = fs.readFileSync(path.join(root, 'assets/css/tokens.css'), 'utf8');
const block = (re) => Object.fromEntries([...tokens.match(re)[0].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
const light = block(/:root \{[\s\S]*?\n\}/);
const dark = block(/:root\[data-theme="dark"\] \{[\s\S]*?\n\}/);
for (const [name, c] of [['light', light], ['dark', dark]]) {
  const pairs = [
    ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text-muted', 'bg', 4.5], ['text-muted', 'surface', 4.5],
    ['accent', 'bg', 4.5], ['accent', 'surface', 4.5], ['on-accent', 'accent', 4.5], ['accent-hover', 'bg', 4.5],
    ['text', 'code-bg', 4.5], ['tok-comment', 'code-bg', 4.5], ['tok-keyword', 'code-bg', 4.5], ['tok-string', 'code-bg', 4.5],
    ['tok-number', 'code-bg', 4.5], ['tok-fn', 'code-bg', 4.5], ['tok-type', 'code-bg', 4.5],
    ['notice-text', 'notice-bg', 4.5], ['accent', 'accent-soft', 4.5],
    ['chart-1', 'surface', 3], ['chart-2', 'surface', 3], ['chart-3', 'surface', 3], ['border-strong', 'bg', 1.5],
  ];
  for (const [fg, bg, min] of pairs) {
    test(`contrast (${name}): ${fg} on ${bg} >= ${min}`, () => {
      const ratio = contrast(c[fg], c[bg]);
      ok(ratio >= min, `ratio ${ratio.toFixed(2)} is below ${min} (${c[fg]} on ${c[bg]})`);
    });
  }
}

/* ---------------- Files and content integrity ---------------- */
const exists = (p) => fs.existsSync(path.join(root, p));
const { posts, projects } = await load('data/content-index.js');
const { site } = await load('data/site.js');
const { profile } = await load('data/profile.js');
const { datasets } = await load('data/datasets.js');
const { navigation } = await load('data/navigation.js');

test('required deployment files exist', () => {
  for (const f of ['index.html', '404.html', '.nojekyll', 'robots.txt', 'sitemap.xml', 'site.webmanifest', '.github/workflows/deploy-pages.yml',
    'assets/images/favicon.svg', 'assets/images/og-image.png', 'assets/images/icons/apple-touch-icon.png', 'assets/images/icons/icon-192.png', 'assets/images/icons/icon-512.png']) {
    ok(exists(f), `${f} is missing`);
  }
});
test('index.html uses only relative asset paths (works under any repository name)', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('#') && !u.startsWith('https://USERNAME.github.io'));
  for (const r of refs) ok(!r.startsWith('/') && !/^https?:/.test(r), `absolute path found: ${r}`);
  for (const r of refs) ok(exists(r), `referenced file missing: ${r}`);
});
test('no JS or CSS file uses an absolute site path', () => {
  const walk = (d) => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk('assets').filter((f) => /\.(js|css)$/.test(f))) {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    ok(!/(?:src|href|url\()\s*[=(]?\s*['"]\/(?!\/)/.test(text.replace(/\/\*[\s\S]*?\*\//g, '')), `${f} has a root-absolute URL`);
    ok(!/localhost|127\.0\.0\.1/.test(text), `${f} mentions localhost`);
  }
});
test('every listed post and project file exists and has the required front matter', () => {
  for (const [folder, list] of [['blog', posts], ['projects', projects]]) {
    for (const file of list) {
      ok(exists(`content/${folder}/${file}`), `content/${folder}/${file} is missing`);
      const { data } = parseFrontmatter(fs.readFileSync(path.join(root, 'content', folder, file), 'utf8'));
      ok(data.title, `${file}: missing title`);
      ok(fmt.parseDate(data.date), `${file}: missing or invalid date`);
      ok(data.summary, `${file}: missing summary`);
      if (data.cover) ok(exists(data.cover), `${file}: cover image ${data.cover} is missing`);
    }
  }
});
test('no content file is left out of the index', () => {
  for (const [folder, list] of [['blog', posts], ['projects', projects]]) {
    const onDisk = fs.readdirSync(path.join(root, 'content', folder)).filter((f) => f.endsWith('.md'));
    for (const f of onDisk) ok(list.includes(f), `content/${folder}/${f} exists but is not listed in data/content-index.js`);
  }
});
test('all images and downloads referenced by Markdown exist', () => {
  for (const [folder, list] of [['blog', posts], ['projects', projects]]) {
    for (const file of list) {
      const text = fs.readFileSync(path.join(root, 'content', folder, file), 'utf8')
        .replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, ''); // ignore examples inside code
      for (const m of text.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)/g)) {
        if (!/^https?:/.test(m[1])) ok(exists(m[1]), `${file}: image ${m[1]} is missing`);
      }
    }
  }
});
test('every category used by a post/project is configured', () => {
  for (const [folder, list, cats] of [['blog', posts, site.blogCategories], ['projects', projects, site.projectCategories]]) {
    for (const file of list) {
      const { data } = parseFrontmatter(fs.readFileSync(path.join(root, 'content', folder, file), 'utf8'));
      ok(cats.some((c) => c.id === data.category || fmt.sameText(c.label, String(data.category))), `${file}: category "${data.category}" is not in data/site.js`);
    }
  }
});
test('internal #/ links in content point to real pages', () => {
  const slugs = {
    blog: new Set(posts.map((f) => f.replace(/\.md$/, ''))),
    projects: new Set(projects.map((f) => f.replace(/\.md$/, ''))),
  };
  const pages = new Set(['', 'about', 'projects', 'blog', 'data', 'skills', 'education', 'cv', 'contact']);
  const check = (href, where) => {
    const m = href.match(/^#\/([^/?#]*)(?:\/([^?#]+))?/);
    if (!m) return;
    if (m[2]) ok(slugs[m[1]]?.has(m[2]), `${where}: link ${href} points to a missing page`);
    else ok(pages.has(m[1]), `${where}: link ${href} points to a missing page`);
  };
  for (const [folder, list] of [['blog', posts], ['projects', projects]]) {
    for (const file of list) {
      const text = fs.readFileSync(path.join(root, 'content', folder, file), 'utf8');
      for (const m of text.matchAll(/\]\((#\/[^)\s]*)\)/g)) check(m[1], file);
      for (const m of text.matchAll(/\|\s*(#\/[^\s]+)\s*$/gm)) check(m[1], file);
    }
  }
  for (const n of navigation) check(n.href, 'navigation');
});
test('datasets are well-formed and honestly labelled', () => {
  const ids = new Set();
  for (const d of datasets) {
    ok(!ids.has(d.id), `duplicate dataset id ${d.id}`); ids.add(d.id);
    ok(['illustrative', 'measured'].includes(d.kind), `${d.id}: kind must be illustrative or measured`);
    const xs = d.chart.type === 'bar' ? d.chart.x.categories : d.chart.x.values;
    for (const s of d.chart.series) eq(s.values.length, xs.length, `${d.id}: series length`);
    eq(d.rows.length, xs.length, `${d.id}: table rows`);
    if (d.csv) ok(exists(d.csv), `${d.id}: ${d.csv} is missing`);
    if (d.kind === 'illustrative') ok(d.limitations?.length, `${d.id}: illustrative data needs a limitations note`);
  }
});
test('csv downloads match the datasets', () => {
  const csv = fs.readFileSync(path.join(root, 'files/sample-rc-lowpass-response.csv'), 'utf8').trim().split('\n');
  const rc = datasets.find((d) => d.id === 'rc-lowpass-response');
  eq(csv.length, rc.rows.length + 1);
  eq(csv[1].split(',').map(Number), [rc.rows[0].f, rc.rows[0].gain, rc.rows[0].phase]);
});
test('personal details are not published by default', () => {
  eq(profile.email, ''); eq(profile.formAction, '');
  for (const l of profile.links) eq(l.url, '', `link ${l.label} should be empty by default`);
});
test('manifest icons exist and JSON is valid', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'site.webmanifest'), 'utf8'));
  for (const icon of manifest.icons) ok(exists(icon.src), `${icon.src} is missing`);
});
test('workflow uses Pages permissions and the official actions', () => {
  const y = fs.readFileSync(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8');
  for (const part of ['pages: write', 'id-token: write', 'actions/configure-pages@', 'actions/upload-pages-artifact@', 'actions/deploy-pages@', 'actions/checkout@']) has(y, part, 'workflow');
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach((f) => console.log(` - ${f}`));
  process.exit(1);
}
