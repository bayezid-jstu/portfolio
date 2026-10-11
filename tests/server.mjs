// Tiny static file server for previewing and testing the site.
//
//   node tests/server.mjs                  -> http://localhost:8080/
//   node tests/server.mjs 8080 /my-repo/   -> http://localhost:8080/my-repo/
//
// The second form behaves like GitHub Pages for a project site: the site lives
// under /my-repo/ and any other address returns 404.html with a 404 status.
// Needs only Node.js 18+, no packages.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.csv': 'text/csv; charset=utf-8',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

export function startServer({ port = 8080, base = '/', root = process.env.SITE_ROOT || defaultRoot } = {}) {
  const prefix = ('/' + base.replace(/^\/+|\/+$/g, '') + '/').replace('//', '/');

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);

    const send = (status, file) => {
      const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(file).pipe(res);
    };
    const notFound = () => send(404, path.join(root, '404.html'));

    if (prefix !== '/' && pathname === prefix.slice(0, -1)) {
      res.writeHead(301, { Location: prefix });
      res.end();
      return;
    }
    if (!pathname.startsWith(prefix)) { notFound(); return; }
    pathname = pathname.slice(prefix.length - 1);

    let file = path.join(root, pathname);
    if (!file.startsWith(root)) { notFound(); return; }
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.statSync(file).isFile()) throw new Error('not a file');
    } catch {
      notFound();
      return;
    }
    send(200, file);
  });

  return new Promise((resolve) => server.listen(port, () => resolve({ server, url: `http://localhost:${port}${prefix}` })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2]) || 8080;
  const base = process.argv[3] || '/';
  startServer({ port, base }).then(({ url }) => console.log(`Preview running at ${url}  (press Ctrl+C to stop)`));
}
