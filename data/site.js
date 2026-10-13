// ============================================================================
// SITE SETTINGS  (edit this file to change site-wide options)
// ============================================================================

export const site = {
  // Shown in the browser tab after each page title, e.g. "Projects – Your Name".
  // Leave empty to use your name from data/profile.js.
  siteName: '',

  // Short description used by search engines and link previews.
  description: 'Portfolio, projects, technical notes and data by an engineering student.',

  // While this is true, a thin banner and "Sample" badges tell visitors that
  // placeholder content is still on the site.
  // >>> Set to false when you have replaced the sample content with your own. <<<
  showSampleNotices: false,

  // Categories for projects. "id" is what you write in a project file
  // (category: electronics). Add, rename or delete freely.
  projectCategories: [
    { id: 'electronics', label: 'Electronics' },
    { id: 'electrical', label: 'Electrical engineering' },
    { id: 'mechanical', label: 'Mechanical engineering' },
    { id: 'software', label: 'Software and programming' },
    { id: 'data', label: 'Data analysis' },
    { id: 'research', label: 'Research' },
    { id: 'coursework', label: 'Academic coursework' },
    { id: 'experiments', label: 'Personal experiments' },
  ],

  // Categories for blog posts.
  blogCategories: [
    { id: 'fundamentals', label: 'Engineering fundamentals' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'machines', label: 'Electrical machines' },
    { id: 'programming', label: 'Programming' },
    { id: 'mathematics', label: 'Mathematics' },
    { id: 'research', label: 'Research notes' },
    { id: 'documentation', label: 'Project documentation' },
    { id: 'reflections', label: 'Learning reflections' },
  ],

  // How many items to show on the home page.
  homeFeaturedProjects: 3,
  homeRecentPosts: 3,
};
