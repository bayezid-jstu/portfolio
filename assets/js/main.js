import { h, announce } from './lib/dom.js';
import { initTheme } from './lib/theme.js';
import { createRouter } from './lib/router.js';
import { createContentStore } from './lib/content.js';
import { setPageMeta, setStructuredData } from './lib/seo.js';
import { site, profile, postFiles, projectFiles } from './config.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { sampleBanner, getSiteName, buttonLink } from './components/ui.js';
import { icon } from './lib/icons.js';

import { homeView } from './pages/home.js';
import { aboutView } from './pages/about.js';
import { projectsView } from './pages/projects.js';
import { projectView } from './pages/project.js';
import { blogView } from './pages/blog.js';
import { postView } from './pages/post.js';
import { dataView } from './pages/data.js';
import { skillsView } from './pages/skills.js';
import { educationView } from './pages/education.js';
import { cvView } from './pages/cv.js';
import { contactView } from './pages/contact.js';
import { notFoundView } from './pages/not-found.js';

initTheme();

const app = document.getElementById('app');
const header = renderHeader(document.getElementById('site-header'));
renderFooter(document.getElementById('site-footer'));

const bannerHost = document.getElementById('site-banner');
const banner = sampleBanner();
if (banner && bannerHost) bannerHost.append(banner);

const content = createContentStore({
  postFiles,
  projectFiles,
  projectCategories: site.projectCategories,
  blogCategories: site.blogCategories,
});

let router;

// every page gets the shared services; structured data is reset per page
const page = (view) => (ctx) => {
  setStructuredData(null);
  return view({ ...ctx, content, router });
};

function errorView(error) {
  console.error(error);
  return {
    title: 'Something went wrong',
    description: 'This page could not be loaded.',
    node: h('div', { class: 'page' },
      h('div', { class: 'container' },
        h('section', { class: 'not-found' },
          h('h1', { tabindex: '-1' }, 'Something went wrong'),
          h('p', null, 'This page could not be loaded. Check your internet connection and try again.'),
          h('div', { class: 'btn-row' },
            h('button', { type: 'button', class: 'btn', onclick: () => location.reload() }, icon('arrow-right', { size: 18 }), 'Try again'),
            buttonLink({ href: '#/', label: 'Home page', variant: 'quiet' }))))),
  };
}

router = createRouter({
  routes: [
    { path: '/', view: page(homeView) },
    { path: '/about', view: page(aboutView) },
    { path: '/projects', view: page(projectsView) },
    { path: '/projects/:slug', view: page(projectView) },
    { path: '/blog', view: page(blogView) },
    { path: '/blog/:slug', view: page(postView) },
    { path: '/data', view: page(dataView) },
    { path: '/skills', view: page(skillsView) },
    { path: '/education', view: page(educationView) },
    { path: '/cv', view: page(cvView) },
    { path: '/contact', view: page(contactView) },
  ],
  notFound: page(() => notFoundView()),
  onError: errorView,
  mount(node) {
    app.replaceChildren(node);
    app.removeAttribute('aria-busy');
  },
  onNavigate({ title, description, path, first }) {
    setPageMeta({ title, description, siteName: getSiteName() });
    header.setActive(path);
    header.closeMenu();
    if (!first) {
      app.querySelector('h1')?.focus({ preventScroll: true });
      announce(title || getSiteName());
    }
  },
});

router.start();

// Tell the owner (not visitors) when a content file has a problem.
content.load().then(({ warnings }) => {
  if (warnings.length === 0) return;
  console.warn(`[${profile.name}] Content problems found:\n- ${warnings.join('\n- ')}`);
  if (site.showSampleNotices && bannerHost) {
    bannerHost.append(h('div', { class: 'notice notice--banner', role: 'alert' },
      icon('alert-triangle', { size: 18 }),
      h('p', null, `Content check: ${warnings.length === 1 ? warnings[0] : `${warnings.length} problems found. Open the browser console (F12) for details.`}`)));
  }
}).catch(() => { /* the page itself shows an error view */ });

// "Skip to main content" without touching the address bar (which is the router's)
document.querySelector('.skip-link')?.addEventListener('click', (event) => {
  event.preventDefault();
  const main = document.getElementById('main-content');
  main?.focus({ preventScroll: true });
  main?.scrollIntoView();
});
