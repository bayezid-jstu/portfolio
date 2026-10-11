// ============================================================================
// CONTENT INDEX  (tells the site which Markdown files to load)
//
// To add a blog post:   1. create content/blog/my-post.md
//                       2. add 'my-post.md' to the posts list below
// To add a project:     1. create content/projects/my-project.md
//                       2. add 'my-project.md' to the projects list below
//
// Why is this list needed? GitHub Pages is a static host: the browser cannot
// "look inside" a folder, so the site needs to be told which files exist.
// The order does not matter: items are sorted by their date.
// ============================================================================

export const posts = [
  'welcome-and-how-to-write-posts.md',
  'rc-time-constant.md',
  'reading-a-datasheet.md',
];

export const projects = [
  'rc-low-pass-filter.md',
  'sensor-data-logger.md',
  'csv-analysis-notebook.md',
];
