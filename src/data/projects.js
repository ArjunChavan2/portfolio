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
    media: {
      type: 'demo',
      demo: 'astar',
      blurb:
        'A browser reimplementation of the planner. Change the map, then compare how many cells A* expands '
        + 'against uninformed Dijkstra search for the same shortest path.',
    },
    links: [{ label: 'Source on GitHub', href: 'https://github.com/ArjunChavan2/A-Star-Path-Planning' }],
    featured: true,
  },
  'Forward Kinematics for URDF Robots': {
    slug: 'forward-kinematics',
    category: 'Robotics',
    summary:
      'Forward kinematics for any URDF robot, with the parser and the transform math written from scratch. It runs as pub/sub nodes '
      + 'on the same TCP and JSON gateway as the A* runtime, publishing every link pose at 10 Hz, and a browser viewer draws the robot '
      + 'live from that stream.',
    highlight: { value: '10 Hz', label: 'Link transforms published over TCP and JSON' },
    media: {
      type: 'demo',
      demo: 'fk',
      blurb:
        'The robot, its joint limits, and every link pose below come from the project itself: the demo robot\'s '
        + 'URDF is parsed in the browser, and the transform and forward-kinematics code is a port of the '
        + 'Python in the repo. Play a choreography, or take a slider and pose it yourself.',
    },
    howItWorks: [
      'Parse: the URDF reader takes apart links, joints, origins, and axes, and rejects a malformed robot description instead of publishing a wrong robot.',
      'Solve: the transform module composes rotations and translations, and the solver walks the joint tree to place every link in the robot frame.',
      'Serve: a parameter server holds the robot description, one node turns joint states into transforms at 10 Hz, and another combines those with the global pose into world coordinates.',
      'Gateway: a single asyncio process serves every topic and service over a rosbridge-style TCP and JSON protocol, reused from the A* project.',
      'Watch: a browser viewer draws each link from the world transforms with a slider per joint, and steps a demo dual-arm robot through saved choreographies.',
      'Choreograph: a MediaPipe tool reads a dance video and solves it into keyframes against the arm geometry of the robot, with the waist taken from shoulders against hips.',
      'Test: unit tests per module plus wire-level integration tests that talk to the running gateway over a raw socket.',
    ],
    tech: [
      { name: 'Python + asyncio', use: 'URDF parser, transform math, and the node processes' },
      { name: 'TCP + JSON gateway', use: 'Pub/sub topics and services, rosbridge-style' },
      { name: 'MediaPipe', use: 'Pose tracking for the video-to-choreography tool' },
      { name: 'pytest', use: 'Per-module unit tests and wire-level integration tests' },
    ],
    links: [],
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
    media: { type: 'video', src: asset('media/financial-dashboard.mp4'), poster: asset('media/financial-dashboard-poster.jpg'), caption: 'A quest completes and Scotty\'s happiness climbs, recreated from the app\'s own screens and sprites.' },
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
    media: { type: 'video', src: asset('media/icu-mortality-prediction.mp4'), poster: asset('media/icu-mortality-prediction-poster.jpg'), caption: 'From 40 raw features to 253 engineered ones, with the ROC plot from the project.' },
    links: [],
  },
  'Memory-Mapped FPGA Peripheral Interface': {
    slug: 'fpga-peripheral-interface',
    category: 'Hardware',
    summary:
      'An ARM Cortex-M4 microcontroller driving LEDs and reading buttons on a Tang Nano FPGA through a 16-bit memory-mapped parallel bus, '
      + 'with address decoding written in Verilog and the control logic in C.',
    highlight: { value: '16-bit', label: 'Memory-mapped parallel bus, ARM to FPGA' },
    media: { type: 'video', src: asset('media/fpga-peripheral-interface.mp4'), poster: asset('media/fpga-peripheral-interface-poster.jpg'), caption: 'The bus, the C that reads the buttons through it, and the LEDs it drives.' },
    links: [],
  },
  'Facial Emotion Recognition': {
    slug: 'facial-emotion-recognition',
    category: 'Machine learning',
    summary:
      'A real-time emotion classifier that locates facial landmarks with OpenCV and classifies expressions with a deep neural network in TensorFlow.',
    highlight: { value: 'Real-time', label: 'Emotion classification from facial landmarks' },
    media: { type: 'video', src: asset('media/facial-emotion-recognition.mp4'), poster: asset('media/facial-emotion-recognition-poster.jpg'), caption: 'An illustrated landmark face; the 60% validated accuracy is the project\'s result.' },
    links: [],
  },
  'BillLess, AI Medical Bill Auditor': {
    slug: 'billless',
    category: 'Full stack',
    summary:
      'A patient-side agent built at MHacks 2026 that handles a medical bill from start to finish. If the patient has no explanation of '
      + 'benefits, it first drafts a letter asking the insurer for one. Then it audits the bill against records from every provider with '
      + 'rules that cite every line, asks the patient for approval over iMessage, disputes the charges by letter or by a phone call the '
      + 'patient controls, verifies the corrected bill, and appeals denials with evidence.',
    highlight: { value: '3 checks', label: 'Duplicates, over-balance, and unrecorded charges' },
    media: { type: 'video', src: asset('media/billless.mp4'), poster: asset('media/billless-poster.jpg'), caption: 'One case start to finish on the project\'s synthetic demo patient: EOB request, cited findings, iMessage approval, a patient-controlled call, and a denial appeal.' },
    howItWorks: [
      'Get documents: if the patient has no EOB, BillLess drafts a letter asking the insurer for it; if they only have a balance statement, it asks the provider for the itemized bill.',
      'Read: Grok or Gemini reads the bill and EOB, and the patient confirms every field before anything is checked.',
      'Records: FinchNode pulls the patient\'s records from every provider they have seen (two clinics in the demo).',
      'Audit: TypeScript rules flag duplicate charges, amounts above the EOB balance, and charges with no matching record, each citing its bill line, EOB line, or record. The AI never writes a finding.',
      'Approve: Billy, the agent, texts the patient over iMessage with choices and answers "why was this flagged?" from the citations. Nothing is sent without approval.',
      'Dispute: a cited dispute letter or email to the billing office, or a call from an ElevenLabs voice agent over Twilio. On a call, offers appear as choices on the patient\'s screen, no answer means no, and the agent never commits to a payment.',
      'Verify: savings count only with a revised statement or written proof; questioned, offered, and confirmed amounts are tracked separately.',
      'Appeal: for a denial, the insurer\'s criteria are matched to records from every provider and the appeal cites each one, or a doctor request is drafted when evidence is missing.',
    ],
    tech: [
      { name: 'Next.js + TypeScript', use: 'App Router web app, deployed on Vercel' },
      { name: 'FinchNode API', use: 'Patient records from multiple providers, used as evidence' },
      { name: 'Grok + Gemini', use: 'Read bills, EOBs, and denial letters; draft letters around coded findings' },
      { name: 'Neon Postgres + Drizzle', use: 'Cases, documents, findings, approvals, and call history' },
      { name: 'Photon Spectrum', use: 'Two-way iMessage approvals and case updates' },
      { name: 'ElevenLabs', use: 'Billy, the conversational voice agent on billing calls' },
      { name: 'Twilio', use: 'Phone line for the voice agent' },
      { name: 'Vitest', use: 'Tests for the deterministic audit rules' },
    ],
    links: [{ label: 'Source on GitHub', href: 'https://github.com/ArjunChavan2/MHACKS_2026' }],
  },
  'Four-Function Calculator': {
    slug: 'four-function-calculator',
    category: 'Hardware',
    summary:
      'A four-function arithmetic unit in Verilog for an FPGA, using Booth multiplication and repeated-subtraction division, verified against a testbench suite.',
    highlight: { value: 'Booth', label: 'Multiplication in Verilog RTL' },
    media: { type: 'video', src: asset('media/four-function-calculator.mp4'), poster: asset('media/four-function-calculator-poster.jpg'), caption: 'A worked Booth multiplication and the controller\'s state names from the Verilog.' },
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
    howItWorks: d.howItWorks || [],
    tech: d.tech || [],
    links: d.links || [],
    badge: d.badge || null,
    highlight: d.highlight || null,
    featured: Boolean(d.featured),
  };
}).sort((a, b) => recency(b.date) - recency(a.date));

export const projectBySlug = (slug) => projects.find((p) => p.slug === slug);
