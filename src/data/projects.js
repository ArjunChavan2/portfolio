// Portfolio-only detail layered on top of the synced resume entries in resume.json.
// Keyed by the resume title so a re-sync never orphans a project; anything not
// listed here still renders, just without media or a summary.
import resume from './resume.json';
import { asset } from '../site';

const DETAILS = {
  'A* Path Planner and Robotics Runtime': {
    slug: 'astar-path-planner',
    category: 'Robotics',
    summary:
      'A ROS-style robotics runtime written from scratch: publish/subscribe topics and services served over a TCP and JSON gateway, '
      + 'with an A* planner over occupancy grids on top. The planner\'s open set is a hand-written binary min-heap.',
    media: { type: 'demo', demo: 'astar' },
    links: [{ label: 'Source on GitHub', href: 'https://github.com/ArjunChavan2/A-Star-Path-Planning' }],
    featured: true,
  },
  'Underwater Inspection ROV': {
    slug: 'underwater-rov',
    category: 'Embedded',
    summary:
      'A four-thruster remotely operated vehicle built by a four-person team. I wrote the C++ Arduino control system that turns '
      + 'pilot input into surge, heave, and yaw, including a latching cruise control for long transits.',
    media: { type: 'video', src: asset('media/rov-showcase.mp4'), poster: asset('media/rov-poster.jpg'), caption: 'Pool test of the ROV under live pilot control.' },
    links: [],
    featured: true,
  },
  'Gamified Financial Dashboard': {
    slug: 'financial-dashboard',
    category: 'Full stack',
    summary:
      'A personal finance app built at CMU TartanHacks that turns budgeting into a game: an AI-driven virtual pet, real-time quests, '
      + 'and insights generated from Capital One account data. Won 1st Place in the Visa Track.',
    badge: '1st Place · Visa Track',
    highlight: { value: '1st Place', label: 'Visa Track, CMU TartanHacks' },
    links: [{ label: 'Source on GitHub', href: 'https://github.com/codylejang/Scotty-Market' }],
    featured: true,
  },
  'ICU Mortality Prediction': {
    slug: 'icu-mortality-prediction',
    category: 'Machine learning',
    summary:
      'A logistic regression model predicting in-hospital mortality from ICU records for 10,000 patients, with feature engineering '
      + 'over time-series vitals and threshold tuning for the imbalanced outcome.',
    highlight: { value: '0.858', label: 'AUROC, stratified 5-fold cross-validation' },
    links: [],
  },
  'Memory-Mapped FPGA Peripheral Interface': {
    slug: 'fpga-peripheral-interface',
    category: 'Hardware',
    summary:
      'An ARM Cortex-M4 microcontroller driving LEDs and reading buttons on a Tang Nano FPGA through a 16-bit memory-mapped parallel bus, '
      + 'with address decoding written in Verilog and the control logic in C.',
    highlight: { value: '16-bit', label: 'Memory-mapped parallel bus, ARM to FPGA' },
    links: [],
  },
  'Facial Emotion Recognition': {
    slug: 'facial-emotion-recognition',
    category: 'Machine learning',
    summary:
      'A real-time emotion classifier that locates facial landmarks with OpenCV and classifies expressions with a deep neural network in TensorFlow.',
    highlight: { value: 'Real-time', label: 'Emotion classification from facial landmarks' },
    links: [],
  },
  'BillLess, AI Medical Bill Auditor': {
    slug: 'billless',
    category: 'Full stack',
    summary:
      'A healthcare web app built at MHacks 2026 that audits itemized medical bills against the insurer\'s explanation of benefits, '
      + 'flagging duplicate charges, amounts above the EOB balance, and charges with no record.',
    highlight: { value: '3 checks', label: 'Duplicates, over-balance, and unrecorded charges' },
    links: [{ label: 'Source on GitHub', href: 'https://github.com/ArjunChavan2/MHACKS_2026' }],
  },
  'Four-Function Calculator': {
    slug: 'four-function-calculator',
    category: 'Hardware',
    summary:
      'A four-function arithmetic unit in Verilog for an FPGA, using Booth multiplication and repeated-subtraction division, verified against a testbench suite.',
    highlight: { value: 'Booth', label: 'Multiplication in Verilog RTL' },
    links: [],
  },
  'Assignment Calendar': {
    slug: 'assignment-calendar',
    category: 'Full stack',
    summary:
      'A single calendar of assignment deadlines pulled from multiple course websites, so nothing slips between course pages.',
    highlight: { value: 'One view', label: 'Deadlines from every course site' },
    links: [{ label: 'Source on GitHub', href: 'https://github.com/ArjunChavan2/assignment-calendar' }],
  },
};

// Site-only projects that aren't on the resume, in the same shape as the synced entries.
const SITE_ONLY = [
  {
    title: 'Assignment Calendar',
    org: 'Web Scraping, Calendar API',
    date: '2025',
    bullets: [
      'Built an assignment calendar that consolidates deadlines from multiple course websites into a single unified view',
      'Delivered a technical presentation on the project',
    ],
    skills: ['Full Stack', 'Web Scraping', 'Calendar API'],
  },
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// org reads "Python, TCP, JSON, EECS 367": tech stack first, context (course, event, team) last.
const CONTEXT = /EECS|TartanHacks|MHacks|Team|Project$/;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// Newest first, by the end of the date range ("Jan 2025 – Apr 2025" sorts as Apr 2025).
function recency(date) {
  const parts = [...date.toLowerCase().matchAll(/(?:([a-z]{3})[a-z]*\s+)?(\d{4})/g)];
  if (!parts.length) return 0;
  const [, mon, year] = parts[parts.length - 1];
  return Number(year) * 12 + (mon ? MONTHS.indexOf(mon) : 0);
}

export const projects = [...resume.projects, ...SITE_ONLY].map((p) => {
  const d = DETAILS[p.title] || {};
  const stack = p.org.split(', ');
  return {
    ...p,
    slug: d.slug || slugify(p.title),
    category: d.category || 'Project',
    summary: d.summary || p.bullets[0],
    stack: stack.filter((s) => !CONTEXT.test(s)),
    context: stack.filter((s) => CONTEXT.test(s)).join(' · '),
    media: d.media || null,
    links: d.links || [],
    badge: d.badge || null,
    highlight: d.highlight || null,
    featured: Boolean(d.featured),
  };
}).sort((a, b) => recency(b.date) - recency(a.date));

export const projectBySlug = (slug) => projects.find((p) => p.slug === slug);
