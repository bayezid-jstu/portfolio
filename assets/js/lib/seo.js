// Updates <title>, description, Open Graph and canonical tags when the page
// changes. (Search engines that run JavaScript will see these updates.)

function setMeta(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el && value) el.setAttribute(attr, value);
}

export function setPageMeta({ title, description, siteName }) {
  const fullTitle = title ? `${title} – ${siteName}` : siteName;
  document.title = fullTitle;
  setMeta('meta[name="description"]', 'content', description);
  setMeta('meta[property="og:title"]', 'content', fullTitle);
  setMeta('meta[property="og:description"]', 'content', description);
  setMeta('meta[name="twitter:title"]', 'content', fullTitle);
  setMeta('meta[name="twitter:description"]', 'content', description);

  // canonical = the address the visitor is really on (works for any repo name or domain)
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.append(canonical);
  }
  canonical.setAttribute('href', `${location.origin}${location.pathname}`);
}

/** Replaces the JSON-LD block. Pass null to remove it. Only call with accurate data. */
export function setStructuredData(data) {
  const id = 'structured-data';
  document.getElementById(id)?.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(data);
  document.head.append(script);
}
