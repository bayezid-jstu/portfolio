// ============================================================================
// YOUR PROFILE  (edit this file to change your name, bio, links and interests)
//
// Rules of thumb:
//  - Text goes between quotes: 'like this'.
//  - Keep the commas at the end of each line.
//  - Leave a value as '' (empty quotes) to hide it. Nothing is shown for empty
//    fields, so you never publish "placeholder" contact details by accident.
// ============================================================================

export const profile = {
  // --- Identity -------------------------------------------------------------
  name: 'Your Name',
  headline: 'Engineering Student | Aspiring Engineer | Technical Enthusiast',
  discipline: 'Your engineering discipline', // e.g. 'Electrical and Electronic Engineering'
  institution: '', // e.g. 'University of Example'  (leave '' to hide)
  location: '', // e.g. 'City, Country'          (leave '' to hide)

  // One or two sentences shown on the home page.
  intro:
    'Write two or three sentences here: what you study, what you enjoy building, and what you are looking for (internships, research, collaboration).',

  // Longer biography for the About page. Each string is one paragraph.
  biography: [
    'Replace this with a short story of how you became interested in engineering and what you are working on now.',
    'Add a second paragraph about your academic focus, the kinds of problems you like to solve, and where you want to go next.',
  ],

  // --- Photo ----------------------------------------------------------------
  // Put your photo in assets/images/ and write its path, e.g. 'assets/images/photo.jpg'.
  // Leave '' to show a neat monogram placeholder instead.
  photo: '',
  photoAlt: 'Portrait of Your Name',

  // --- Contact & links ------------------------------------------------------
  // Leave email '' until you want it public. When empty, the contact form
  // is hidden and no email is shown anywhere.
  email: '',

  // Add or remove links freely. 'icon' can be: github, linkedin, mail, link.
  // Links with an empty url are not shown.
  links: [
    { label: 'GitHub', url: '', icon: 'github' }, // e.g. 'https://github.com/your-username'
    { label: 'LinkedIn', url: '', icon: 'linkedin' }, // e.g. 'https://www.linkedin.com/in/your-name/'
    // { label: 'Google Scholar', url: 'https://scholar.google.com/...', icon: 'link' },
  ],

  // --- CV -------------------------------------------------------------------
  // 1. Put your CV PDF in the files/ folder (for example files/cv.pdf).
  // 2. Write its path below: cvPdf: 'files/cv.pdf'
  // While this is '' the CV page offers "Print or save as PDF" instead.
  cvPdf: '',

  // --- Optional contact form ------------------------------------------------
  // GitHub Pages cannot receive form submissions by itself.
  //  - Leave formAction '' : the form opens the visitor's email app (needs `email` above).
  //  - Or paste the URL from a free form service (for example Formspree or
  //    Web3Forms) to receive messages in your inbox. See README, "Contact form".
  formAction: '',

  // --- Home page ------------------------------------------------------------
  interests: [
    { name: 'Embedded systems', description: 'Replace with a topic you genuinely care about and one line on why.' },
    { name: 'Signals and circuits', description: 'Edit, add or remove these entries (keep 4 to 6 for a tidy layout).' },
    { name: 'Data analysis', description: 'Each entry has a name and a short description.' },
    { name: 'Renewable energy', description: 'Set interests: [] (an empty list) to hide this section.' },
  ],

  // --- About page -----------------------------------------------------------
  currentlyLearning: ['Replace with something you are learning right now'],
  goals: ['Replace with an academic goal', 'Replace with a personal or professional goal'],
  professionalInterests: ['Replace with the kind of roles or research you are interested in'],
};

// Used to decide whether structured data (for search engines) is accurate.
export const PLACEHOLDER_NAME = 'Your Name';
