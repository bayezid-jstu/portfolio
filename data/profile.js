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
  name: 'Md. Ashraf Siddikey Bayezid',
  headline: 'Engineering Student | Aspiring Engineer | Technical Enthusiast',
  discipline: 'Electrical and Electronic Engineering', 
  institution: 'Jamalpur Science & Technology University', 
  location: 'Jamalpur, Bangladesh', // e.g. 'City, Country'          (leave '' to hide)

  // One or two sentences shown on the home page.
  intro:
    'I am an Electrical and Electronic Engineering (EEE) student with a strong interest in electrical machines, electronics, and practical engineering applications. I enjoy exploring how things work, designing DIY projects, and using technology and programming to solve real-world problems. I am eager to gain hands-on experience, explore research opportunities, and collaborate with others on innovative engineering projects that turn ideas into reality.',

  // Longer biography for the About page. Each string is one paragraph.
  biography: [
    'My journey into engineering began with a simple curiosity about how things work and how ideas can be transformed into real-world solutions. As an EEE student, I became fascinated by electrical machines, electronics, and the science behind everyday technology. Today, I’m exploring practical engineering projects, learning new technical skills, and building a foundation to turn my curiosity into meaningful innovations.',
    'My academic focus is on electrical and electronic engineering, particularly electrical machines, circuit fundamentals, and practical applications of engineering principles. I enjoy solving problems that require logical thinking, understanding how systems work, and turning theoretical concepts into functional solutions. Moving forward, I aim to deepen my technical expertise, develop innovative projects, and pursue opportunities in research, internships, and collaborative engineering work that challenge me to grow as an engineer.',
  ],

  // --- Photo ----------------------------------------------------------------
  // Put your photo in assets/images/ and write its path, e.g. 'assets/images/photo.jpg'.
  // Leave '' to show a neat monogram placeholder instead.
  photo: 'assets/images/IMG_20261010_001047.png',
  photoAlt: 'Ashraf Siddikey',

  // --- Contact & links ------------------------------------------------------
  // Leave email '' until you want it public. When empty, the contact form
  // is hidden and no email is shown anywhere.
  email: 'siddikeyashraf10@gmail.com',

  // Add or remove links freely. 'icon' can be: github, linkedin, mail, link.
  // Links with an empty url are not shown.
  links: [
    { label: 'GitHub', url: 'https://bayezid-jstu.github.io/portfolio/', icon: 'github' }, // e.g. 'https://github.com/your-username'
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
