// ============================================================================
// SKILLS (edit this file to change the Skills page and the CV)
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
    items: [
      { name: 'MATLAB', level: 'Coursework', note: 'Used for mathematical modeling and engineering calculations.' },
      { name: 'C / C++', level: 'Coursework', note: 'Used for foundational programming and microcontroller logic.' },
      { name: 'Python', level: 'Used in projects', note: 'Used for data analysis and general scripting.' },
    ],
  },
  {
    group: 'Engineering software',
    description: 'Circuit and engineering calculation tools.',
    items: [
      { name: 'LTspice / Proteus', level: 'Coursework', note: 'Used for circuit simulation and schematic capture.' },
    ],
  },
  {
    group: 'Laboratory and practical skills',
    description: 'Hands-on work with real hardware and measurement equipment.',
    items: [
      { name: 'Oscilloscope and Multimeter', level: 'Coursework', note: 'Used in electrical labs for signal and component testing.' },
      { name: 'Breadboard Prototyping & Soldering', level: 'Coursework', note: 'Building and testing physical electronic circuits.' },
    ],
  },
  {
    group: 'Documentation and communication',
    description: 'Explaining technical work clearly.',
    items: [
      { name: 'LaTeX & CircuiTikZ', level: 'Regular use', note: 'Used for formatting lab reports, equations, and circuit diagrams.' },
      { name: 'Git and GitHub', level: 'Used in projects', note: 'Used for version control and hosting web projects.' },
    ],
  },
];
