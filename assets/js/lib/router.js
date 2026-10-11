// Hash router: addresses look like  https://user.github.io/repo/#/projects/my-project
//
// Why hash routing? GitHub Pages is a static host. With "#/" addresses every
// page can be opened directly, refreshed and bookmarked under ANY repository
// path, with no server configuration and no broken links.
//
// A second "#" inside the address (#/blog/post#section) scrolls to a heading.

export function parseHash(hash = location.hash) {
  let raw = String(hash).replace(/^#/, '');
  if (!raw.startsWith('/')) return null;

  let anchor = '';
  const hashIndex = raw.indexOf('#');
  if (hashIndex >= 0) {
    anchor = raw.slice(hashIndex + 1);
    raw = raw.slice(0, hashIndex);
  }
  let queryString = '';
  const queryIndex = raw.indexOf('?');
  if (queryIndex >= 0) {
    queryString = raw.slice(queryIndex + 1);
    raw = raw.slice(0, queryIndex);
  }
  try { anchor = decodeURIComponent(anchor); } catch { /* keep raw */ }
  let path = raw.replace(/\/+$/, '') || '/';
  try { path = decodeURI(path); } catch { /* keep raw */ }
  return { path, query: new URLSearchParams(queryString), anchor };
}

/** Matches '/projects/:slug' style patterns. Returns params or null. */
export function matchRoute(pattern, path) {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = b[i];
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

/**
 * createRouter({ routes: [{ path, view }], notFound, mount, onNavigate })
 * view(ctx) -> { title, description, node } (may be async)
 */
export function createRouter({ routes, notFound, mount, onNavigate, onError }) {
  let currentKey = null;
  let token = 0;
  let first = true;

  function scrollToAnchor(anchor) {
    if (!anchor) return false;
    const el = document.getElementById(anchor);
    if (!el) return false;
    el.scrollIntoView({ block: 'start' });
    return true;
  }

  async function render() {
    let parsed = parseHash();
    if (!parsed) {
      // "#main-content" or an unknown hash: only the very first load shows Home
      if (!first && location.hash) return;
      parsed = { path: '/', query: new URLSearchParams(), anchor: '' };
    }

    const key = `${parsed.path}?${parsed.query.toString()}`;
    if (key === currentKey) {
      scrollToAnchor(parsed.anchor);
      return;
    }

    const myToken = ++token;
    let view = null;
    let params = {};
    for (const route of routes) {
      const hit = matchRoute(route.path, parsed.path);
      if (hit) { view = route.view; params = hit; break; }
    }

    let result;
    try {
      result = await (view ?? notFound)({ path: parsed.path, params, query: parsed.query, anchor: parsed.anchor });
    } catch (error) {
      if (myToken !== token) return;
      result = onError(error);
    }
    if (myToken !== token) return; // a newer navigation started meanwhile

    currentKey = key;
    mount(result.node);
    onNavigate({ ...result, path: parsed.path, first });

    if (!scrollToAnchor(parsed.anchor)) window.scrollTo(0, 0);
    first = false;
  }

  return {
    start() {
      window.addEventListener('hashchange', render);
      return render();
    },
    /** Keep the router's idea of the current URL in sync after an in-page filter change. */
    replaceQuery(path, params) {
      const qs = params.toString();
      const hash = `#${path}${qs ? `?${qs}` : ''}`;
      history.replaceState(null, '', hash);
      currentKey = `${path}?${qs}`;
    },
  };
}
