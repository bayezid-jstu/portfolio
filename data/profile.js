// ============================================================================
// YOUR PROFILE (edit this file to change your name, bio, links and interests)
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
  location: 'Jamalpur, Bangladesh',

  // One or two sentences shown on the home page.
  intro:
    'I am an Electrical and Electronic Engineering (EEE) student with a strong interest in electrical machines, electronics, and practical engineering applications. I enjoy exploring how things work, designing DIY projects, and using technology and programming to solve real-world problems. I am eager to gain hands-on experience, explore research opportunities, and collaborate with others on innovative engineering projects that turn ideas into reality.',

  // Longer biography for the About page. Each string is one paragraph.
  biography: [
    'My journey into engineering began with a simple curiosity about how things work and how ideas can be transformed into real-world solutions. As an EEE student, I became fascinated by electrical machines, electronics, and the science behind everyday technology. Today, I’m exploring practical engineering projects, learning new technical skills, and building a foundation to turn my curiosity into meaningful innovations.',
    'My academic focus is on electrical and electronic engineering, particularly electrical machines, circuit fundamentals, and practical applications of engineering principles. I enjoy solving problems that require logical thinking, understanding how systems work, and turning theoretical concepts into functional solutions. Moving forward, I aim to deepen my technical expertise, develop innovative projects, and pursue opportunities in research, internships, and collaborative engineering work that challenge me to grow as an engineer.',
  ],

  // --- Photo ----------------------------------------------------------------
  photo: 'assets/images/IMG_20261010_001047.png',
  photoAlt: 'Md. Ashraf Siddikey Bayezid',

  // --- Contact & links ------------------------------------------------------
  email: 'siddikeyashraf10@gmail.com',

  // Links with an empty url are not shown on the page.
  links: [
    { label: 'GitHub', url: 'https://github.com/bayezid-jstu', icon: 'github' },
    { label: 'LinkedIn', url: '', icon: 'linkedin' },
  ],

  // --- CV -------------------------------------------------------------------
  cvPdf: '',

  // --- Optional contact form ------------------------------------------------
  formAction: '',

  // --- Home page ------------------------------------------------------------
  interests: [
    { name: 'Embedded systems' },
    { name: 'Signals and circuits' },
    { name: 'Data analysis' },
    { name: 'Renewable energy' },
  ],

  // --- About page -----------------------------------------------------------
  currentlyLearning: ['Signals and Circuits', 'Electrical Machines'],
  goals: ['To turn theoretical knowledge into practical engineering solutions'],
  professionalInterests: ['Renewable Energy Sources', 'Power Systems'],
};

// CRITICAL: Keep this as 'Your Name' so the template knows you've updated your profile name above.
export const PLACEHOLDER_NAME = 'Your Name';
