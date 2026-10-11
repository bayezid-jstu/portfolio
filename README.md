# Engineering portfolio website

A fast, accessible portfolio, blog and data site for an engineering student. It is built to be hosted **for free on GitHub Pages** and to look right on **phones (Android and iOS), tablets and computers**.

It is plain HTML, CSS and JavaScript. There is **no build step, no Node.js to install, no database and no paid service**. You edit text files and upload them.

> **Why not React/Vite?** The brief asked for React, TypeScript, Vite and Tailwind. This project deliberately does not use them: the build environment had no access to the npm package registry, so a React/Vite project could not have been installed, built or tested. Rather than hand over code that was never run, this version uses only what every browser already supports, and every feature was tested in a real browser (see "What was tested"). It also means nothing can break at build time on GitHub.

---

## 1. Quick start (about 15 minutes)

1. **Make a GitHub account** at <https://github.com> if you do not have one.
2. **Create a repository:** click **+** (top right) then **New repository**. Choose a name, for example `portfolio`. Keep it **Public** (free GitHub Pages needs a public repository on a free account). Click **Create repository**.
3. **Upload the files:** on the new empty repository page click **uploading an existing file**. Open the unzipped project folder on your computer, select **everything inside it** (including hidden items such as `.github` and `.nojekyll`) and drag it into the browser. Wait for the upload to finish, then click **Commit changes**.
   - Tip: on Windows turn on *View, Show, Hidden items*; on macOS press **Cmd + Shift + .** in Finder to show hidden files.
4. **Turn on Pages:** open the repository's **Settings**, then **Pages** (left menu). Under **Build and deployment** set **Source** to **GitHub Actions**.
5. **Wait about one minute,** then open the **Actions** tab. When the "Deploy to GitHub Pages" run shows a green tick, your site is live at
   `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`

If anything in step 3 or 5 does not work, read **Troubleshooting** below, or use the alternative in section 2.

Then make it yours (section 4) and finish with **"Update the site address"** (section 3).

---

## 2. Deployment options

You need only **one** of these.

### Option A: GitHub Actions (recommended)

What the quick start above uses. Every time you change a file on the `main` branch, GitHub republishes the site automatically. The workflow is in `.github/workflows/deploy-pages.yml`. It only copies the website files, then uses the official GitHub Pages actions.

- **Setting:** Settings, Pages, Source: **GitHub Actions**.
- **If `.github` did not upload** (some browsers skip hidden folders): in the repository click **Add file, Create new file**, type `.github/workflows/deploy-pages.yml` as the name (typing the slashes creates the folders) and paste the contents of that file from this project. Or use Option B.
- **Re-run manually:** Actions tab, "Deploy to GitHub Pages", **Run workflow**.

### Option B: Deploy from a branch (no Actions)

- Settings, Pages, **Source: Deploy from a branch**, Branch: `main`, folder `/ (root)`, **Save**.
- **Delete the `.github` folder** from the repository (otherwise the workflow runs and shows a red cross because Pages is not set to Actions).
- **The file `.nojekyll` must exist at the top level of the repository** (it is an empty file). Without it GitHub's Jekyll tool would try to process your Markdown files and **your articles and projects would disappear**. If it is missing: Add file, Create new file, name it `.nojekyll`, commit.

### Command-line / GitHub Desktop (optional)

```bash
git init
git add .
git commit -m "First version"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/REPOSITORY-NAME.git
git push -u origin main
```

### Which address will my site have?

| Repository name | Address |
|---|---|
| `portfolio` (any name) | `https://YOUR-USERNAME.github.io/portfolio/` |
| `YOUR-USERNAME.github.io` | `https://YOUR-USERNAME.github.io/` (a "user site") |

**You never need to configure a base path.** All file paths in this project are relative and all pages use `#/` addresses, so the same files work under `/portfolio/`, at the root of a user site, and on a custom domain. A custom domain is optional and never required.

---

## 3. Update the site address (after your first deployment)

Search engines and link previews (WhatsApp, LinkedIn, Slack, X) need the real address. Replace `https://USERNAME.github.io/REPOSITORY/` with your real address in these three files:

| File | What to change |
|---|---|
| `index.html` | the two lines `og:url` and `og:image` (near the top) |
| `sitemap.xml` | the `<loc>` line |
| `robots.txt` | remove the `#` in front of the `Sitemap:` line and fix the address |

Also set the `<title>` and the two `og:title` / `twitter:title` lines in `index.html` to include your own name. Everything else (page titles, canonical address) updates itself.

**Custom 404 page:** open `404.html`. On a normal project site nothing is needed. If your site is a **user site** (`USERNAME.github.io`), change `var SITE_BASE = null;` to `var SITE_BASE = '/';`.

---

## 4. Making the site yours: what to edit

You only ever edit files in **`data/`**, **`content/`**, **`files/`** and **`assets/images/`**. Open them in any text editor (VS Code, Notepad, or GitHub's own pencil icon, **Edit this file**). Keep quotes and commas exactly as they are.

| I want to change... | Edit this file |
|---|---|
| Name, headline, intro, biography, photo, email, links, interests, goals | `data/profile.js` |
| Menu items | `data/navigation.js` |
| Project and blog categories, remove the "Sample" labels | `data/site.js` |
| Skills | `data/skills.js` |
| Education, certifications, awards, competitions, publications | `data/education.js` |
| Charts, tables and datasets | `data/datasets.js` |
| Which blog posts and projects exist | `data/content-index.js` (plus the files in `content/`) |
| Colours, fonts, spacing | `assets/css/tokens.css` |

### Step 1: replace the sample content

1. Edit `data/profile.js` (name, headline, intro, biography). Leave a value as `''` to hide it.
2. When you are finished, open `data/site.js` and set `showSampleNotices: false`. This removes the yellow notices and "Sample" badges.
3. Delete the sample posts/projects (or replace them, see below) and remove their names from `data/content-index.js`.

### Change your personal information

Open `data/profile.js` and edit the text between quotes: `name`, `headline`, `discipline`, `institution`, `intro`, `biography`.

### Add your photo

Put the image in `assets/images/` (for example `photo.jpg`; a portrait with a 4:5 shape, around 640 x 800 pixels, under 200 KB) and set `photo: 'assets/images/photo.jpg'` in `data/profile.js`. Update `photoAlt` too.

### Update social links and email

In `data/profile.js` fill in the `url` of GitHub, LinkedIn and others. Add more by copying a line. Links with an empty `url` are not shown. **Your email is only shown if you fill in `email`.**

### Add a project

1. Copy `content/projects/rc-low-pass-filter.md` to a new file, for example `content/projects/my-project.md`.
2. Edit the **front matter** (the block between the two `---` lines):

   ```text
   ---
   title: My robot arm controller
   summary: One or two sentences for the project list.
   category: electronics          # an id from data/site.js, e.g. electronics, software, data
   tech: [Arduino, PID control, C++]
   tags: [control, robotics]
   status: In progress            # or Completed, Planned...
   date: 2026-09-01               # year-month-day
   featured: true                 # show on the home page
   cover: assets/images/projects/arm.jpg
   coverAlt: Photo of the robot arm on my desk
   links:
     - Source code | https://github.com/you/arm-controller
     - Report (PDF) | files/arm-report.pdf
   ---
   ```
3. Write the case study below the front matter using headings such as `## Problem statement`, `## Objectives`, `## Background and theory`, `## Design and methodology`, `## Tools and components`, `## Implementation`, `## Calculations`, `## Results`, `## Limitations and lessons learned`, `## References`. **Only write the sections you have content for;** the page shows exactly what you wrote, nothing is invented.
4. Add the file name to `projects` in `data/content-index.js`:

   ```js
   export const projects = ['my-project.md', 'rc-low-pass-filter.md'];
   ```

Remove `sample: true` (or leave it out) in your own files.

### Add a project cover image

Save the image in `assets/images/projects/` (16:10 landscape such as 1280 x 800 pixels, JPG/PNG/WebP/SVG, ideally under 200 KB) and write its path in `cover:`. Always write `coverAlt` (a short description). For other shapes add `coverWidth: 1200` and `coverHeight: 900`.

### Add a blog post

1. Create `content/blog/my-post.md`:

   ```text
   ---
   title: What I learned about op-amps
   date: 2026-10-01
   updated: 2026-10-05            # optional
   summary: One sentence shown in the list and in search results.
   category: electronics          # id from data/site.js
   tags: [op-amps, analog]
   cover: assets/images/blog/opamp.jpg    # optional
   coverAlt: Description of the cover  # optional
   ---

   ## First section

   Your text...
   ```
2. Add `'my-post.md'` to `posts` in `data/content-index.js`.
3. Add `draft: true` to the front matter to hide an unfinished post.

**Markdown you can use:** `## headings`, `**bold**`, `*italic*`, `` `code` ``, `[link](https://...)`, lists, `- [x]` checklists, `> quotes`, tables, fenced code blocks (` ```python `), images `![alt text](path "caption"){800x500}` (the numbers are width and height and prevent layout jumps), and equations `$x^2$` or `$$\frac{a}{b}$$`. Write `\$` for a literal dollar sign. Raw HTML is intentionally ignored for safety. The sample article **"Welcome, and how to write a post"** shows every feature.

**Equations:** supported LaTeX includes fractions, roots, sub/superscripts, Greek letters, sums, integrals, `\text{}`, `\mathrm{}`, `\left( \right)`, common operators and spacing. Equations are drawn by your visitor's browser (MathML), so nothing extra is downloaded. Unknown commands appear as text instead of breaking the page.

### Categories and tags

Categories are listed in `data/site.js` (`projectCategories`, `blogCategories`): add `{ id: 'robotics', label: 'Robotics' }` and use `category: robotics` in your files. A category you use in a file but did not list still works; it just appears after the listed ones. Tags are free text in the front matter; related articles and projects are suggested automatically from shared tags and technologies.

### Add a chart and dataset

Open `data/datasets.js`. At the bottom there is a commented **template** for measured data: copy it, remove the `//` marks and fill it in.

- `kind: 'measured'` only for real measurements. `kind: 'illustrative'` for calculated or made-up demonstrations. The page labels each one clearly. **Never mark sample numbers as measured.**
- `chart.type` is `'line'` or `'bar'`. For a log axis add `scale: 'log'` to `x` or `y`.
- Put a CSV file in `files/` and set `csv: 'files/my-data.csv'` to offer a download.
- Write `findings`, `methodology`, `limitations` and `sources`. They appear next to the chart.

### Replace the CV

1. Put your PDF in `files/` (for example `files/cv.pdf`).
2. In `data/profile.js` set `cvPdf: 'files/cv.pdf'`.

The CV page then shows a **Download CV (PDF)** button. Until then it offers **Print or save as PDF**, which makes a PDF from the CV page itself. Fill in `data/education.js` and `data/skills.js` so the page has content.

### Add or remove a menu item

Edit `data/navigation.js`. Each line is a page; delete a line to remove it. Set `header: false` to keep it out of the top bar (it stays in the phone menu and the footer).

### Change the theme colours

Open `assets/css/tokens.css`. The accent colour is `--accent` (once for the light theme at the top, once in the `[data-theme="dark"]` block). Keep text and background contrast high: `node tests/unit.mjs` checks the contrast ratios for you.

### Skills, education

Skills use plain-language levels (*Learning, Coursework, Used in projects, Regular use*) instead of percentage bars. In `data/education.js` every list is optional; an empty list hides its section.

---

## 5. Preview on your computer

The site must be served by a web server (opening `index.html` by double-click will not work, browsers block that for security; the page will tell you so). Use any one of these:

- **VS Code:** install the **Live Server** extension, right-click `index.html`, **Open with Live Server**.
- **Python** (already installed on most computers): in the project folder run `python3 -m http.server 8080` (Windows: `python -m http.server 8080`) and open <http://localhost:8080>.
- **Node.js:** `node tests/server.mjs 8080`. To try it under a repository path exactly like GitHub does: `node tests/server.mjs 8080 /portfolio/` then open <http://localhost:8080/portfolio/>.

After editing a file, refresh the page (Ctrl+F5 / Cmd+Shift+R for a hard refresh).

---

## 6. Contact form

GitHub Pages is static and cannot receive form submissions, so this site never pretends to. In `data/profile.js`:

- **`email: ''` and `formAction: ''`** (default): the Contact page shows no form and no email.
- **Only `email` filled:** the form opens the visitor's email app with the message filled in, addressed to you. The page says plainly that nothing is sent from the website. There is also a "Copy address" button for people without an email app.
- **`formAction` filled:** the form posts to a free form service so messages arrive in your inbox. Create a free form at a service such as **Formspree** or **Web3Forms**, and paste the address it gives you (for example `https://formspree.io/f/xxxxxxxx`) into `formAction`. The form fields are named `name`, `email`, `subject` and `message`. Read the service's privacy terms first, since visitors' messages go to that company. This option is untested here because it needs an account.

---

## 7. Privacy and security

- Nothing is tracked. No analytics, cookies or third-party scripts. The only browser storage is your theme choice (and dismissing the sample banner for one visit).
- No secrets are needed and none should ever be committed. Remember **everything in a public repository is public** (including `files/`, and the history of past commits).
- Markdown cannot inject HTML or scripts: raw HTML is escaped, and only `http`, `https`, `mailto`, `tel`, relative and `#` links are allowed. External links open with `rel="noopener noreferrer"`.
- Email addresses and social links are published only when you fill them in.

---

## 8. Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| **Blank page or "The site could not start"** | You opened `index.html` directly from the folder. Use a local server (section 5) or the published address. Online: open the browser console (F12) for the error message. |
| **404 on the GitHub address** | Pages is not enabled yet, or the first deployment is still running (Actions tab). Settings, Pages must show a "Your site is live" box. Make sure `index.html` is in the **top level** of the repository, not inside a subfolder (if you uploaded the folder itself rather than its contents, move the files up). |
| **Red cross in the Actions tab: "Pages not configured" / "Get Pages site failed"** | Settings, Pages, Source must be **GitHub Actions** (Option A). If you chose Option B, delete the `.github` folder. |
| **No styling / missing images** | File names are **case sensitive** on GitHub (`Photo.JPG` is not `photo.jpg`). Check spelling, and that paths are like `assets/images/photo.jpg` with no leading `/`. |
| **A post or project is missing** | Is its file name in `data/content-index.js`? Is the file really in the right folder? The sample banner shows a "Content check" message and the browser console lists exactly which file has a problem. A `draft: true` post is hidden. |
| **My change is not showing** | Wait for the Actions run to finish (about a minute), then hard-refresh (Ctrl+F5). GitHub's cache can keep old files for up to ten minutes. |
| **Articles vanished after using Option B** | The `.nojekyll` file is missing (section 2, Option B). |
| **An equation shows red text** | That LaTeX command is not supported. The unsupported command name is shown; use a simpler form. |
| **Chart looks wrong** | Check that every `values` list has exactly as many numbers as the x list. `node tests/unit.mjs` checks this. |
| **The 404 page's "home" link goes to the wrong place** | See "Custom 404 page" in section 3. |

---

## 9. Project structure

```text
index.html              the single page that loads everything
404.html                branded "not found" page (self-contained)
site.webmanifest        app name and icons
robots.txt, sitemap.xml search-engine files (update the address, section 3)
.nojekyll               tells GitHub not to run Jekyll (keep it!)
.github/workflows/      automatic deployment to GitHub Pages
data/                   YOU EDIT: profile, navigation, skills, education, datasets, content list
content/blog/           YOU EDIT: one Markdown file per article
content/projects/       YOU EDIT: one Markdown file per project
files/                  YOU EDIT: CV PDF, CSV downloads, reports
assets/images/          YOU EDIT: photo, cover images, icons
assets/css/             tokens.css (colours, sizes), base, components, pages, print
assets/js/lib/          Markdown, equations, code highlighter, charts, router, theme, ...
assets/js/components/   header, footer, cards, toolbar, ...
assets/js/pages/        one file per page
tests/                  unit tests, browser tests, local preview server
package.json            handy shortcuts (npm run preview, npm test); no dependencies
```

**Dependencies and lockfile:** there are no runtime dependencies, so there is nothing to install and no lockfile is needed. (Only the optional browser tests use Playwright, installed on demand.)

---

## 10. Tests

```bash
node tests/unit.mjs                  # 91 checks: Markdown safety, equations, content files, colour contrast ...
npm install --no-save playwright && npx playwright install chromium
node tests/e2e.mjs                   # 42 browser checks on phone, tablet and desktop sizes
```

### What was tested before delivery

Run in headless **Chromium** (the engine behind Chrome, Edge and Android browsers), with the site served under a repository path (`/my-portfolio/`) like GitHub does for project sites:

- Every page loaded at Pixel 5 (Android), iPhone 13, 320 px phone, 768 px tablet, 1366 px laptop and 1920 px desktop sizes: exactly one `h1`, **no console errors or warnings, no failed requests, no sideways scrolling**.
- Subpath hosting, refresh and deep links, the 404 page (status 404, working links), downloads, images, icons.
- Theme: OS preference on first visit, toggle, persistence, no flash, works with storage blocked.
- Phone menu (open, close, Escape, focus handling, page lock), desktop navigation and active state, 44 px touch targets.
- Project and blog search, filters, sorting, URL state, empty states, table of contents, copy-code button, previous/next, related items.
- Charts: keyboard reading, hover, labels, log axis, bars, redraw on resize.
- Contact page defaults, CV fallback, print layout, reduced motion, broken or malicious content files, `file://` message, throttled slow network, first-load size.
- Unit tests for Markdown/equation safety (script injection, `javascript:` links), dates, colour contrast (WCAG AA), file and link integrity.

### Not tested (please check yourself)

- **Safari / iOS WebKit and Firefox:** no such browser was available. The site uses standard features (MathML, CSS grid, `dvh` with fallbacks, `inert`, ES modules) supported by current iOS 16+ / Android Chrome, but please open your published site on a real iPhone and Android phone once.
- **The real GitHub Actions deployment and GitHub Pages:** I had no access to GitHub. The workflow follows GitHub's documented pattern, but its first run on your repository is the real test.
- Screen readers (NVDA, VoiceOver, TalkBack): only automated accessibility checks were run.
- The optional external form service.

---

## 11. Known limitations (honest notes)

- **Page addresses contain `#/`** (for example `.../#/blog/my-post`). This is what lets every page work on a static host without server settings. Search engines index the home page well but treat the inner pages less well than separate files would be. For a student portfolio this is normally fine; link to your pages directly when applying.
- **Link previews** (WhatsApp, LinkedIn, ...) show the same title, description and image for every page, because those services do not run JavaScript.
- **No online editor or CMS.** You edit text files (GitHub's web editor works).
- **Equations** use a built-in converter for common LaTeX; very advanced LaTeX (matrices, aligned environments) is not supported.
- **Browser support:** current and recent versions of Chrome, Edge, Safari (iOS 14 and newer) and Firefox. Very old phones show a simpler layout or the "site could not start" message.
- **Fonts** are each device's own system font (San Francisco on iPhone, Roboto on Android, Segoe UI on Windows). This is deliberate: instant loading, no layout shift, no external requests.
