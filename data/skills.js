// ============================================================================
// SKILLS  (edit this file to change the Skills page and the CV)
//
// Instead of percentage bars (which suggest precision nobody can measure),
// each skill has a plain-language "level" that you can back up with a project:
//   'Learning'          I am studying it now
//   'Coursework'        I have used it in classes or labs
//   'Used in projects'  I have used it in a project I can show
//   'Regular use'       I use it often and am comfortable without help
//
// The entries below are SAMPLES. Replace them with your own and delete the rest.
// ============================================================================

export const skillLevels = [
  { level: 'Learning', meaning: 'I am studying it now.' },
  { level: 'Coursework', meaning: 'I have used it in classes or labs.' },
  { level: 'Used in projects', meaning: 'I have used it in a project I can show.' },
  { level: 'Regular use', meaning: 'I use it often and am comfortable without help.' },
];

export const skills = [
  {
    group: 'Programming languages',
    description: 'Languages for scripting, analysis and embedded work.',
    sample: true,
    items: [
      { name: 'Python', level: 'Used in projects', note: 'Sample entry: replace with what you actually use it for.' },
      { name: 'C / C++', level: 'Coursework', note: 'Sample entry.' },
      { name: 'MATLAB', level: 'Learning', note: 'Sample entry.' },
    ],
  },
  {
    group: 'Engineering software',
    description: 'CAD, circuit and engineering calculation tools.',
    sample: true,
    items: [
      { name: 'Circuit simulator', level: 'Coursework', note: 'Replace with the tool you use (for example LTspice, Multisim, Proteus).' },
      { name: 'CAD package', level: 'Learning', note: 'Replace with your CAD tool.' },
    ],
  },
  {
    group: 'Design and simulation',
    description: 'Modelling a system before building it.',
    sample: true,
    items: [
      { name: 'Block-diagram simulation', level: 'Learning', note: 'Sample entry.' },
    ],
  },
  {
    group: 'Laboratory and practical skills',
    description: 'Hands-on work with real hardware.',
    sample: true,
    items: [
      { name: 'Oscilloscope and multimeter', level: 'Coursework', note: 'Sample entry.' },
      { name: 'Soldering', level: 'Learning', note: 'Sample entry.' },
    ],
  },
  {
    group: 'Data analysis',
    description: 'Cleaning, analysing and presenting data.',
    sample: true,
    items: [
      { name: 'Spreadsheets', level: 'Regular use', note: 'Sample entry.' },
      { name: 'Plotting and statistics', level: 'Used in projects', note: 'Sample entry.' },
    ],
  },
  {
    group: 'Documentation and communication',
    description: 'Explaining technical work clearly.',
    sample: true,
    items: [
      { name: 'Technical writing', level: 'Coursework', note: 'Sample entry.' },
      { name: 'Git and GitHub', level: 'Learning', note: 'Sample entry.' },
    ],
  },
];
