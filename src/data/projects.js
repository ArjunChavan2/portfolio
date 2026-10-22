// Portfolio-only detail layered on top of the synced resume entries in resume.json.
// Keyed by the resume title so a re-sync never orphans a project; anything not
// listed here still renders, just without media or a summary.
import resume from './resume.json';
// Short URL slugs by title, in JSON so scripts/spa-routes.mjs can read them without Vite.
import SLUGS from './slugs.json';
import { asset } from '../site';
import { endMonth } from '../dates';

const DETAILS = {
  'A* Path Planner and Robotics Runtime': {
    category: 'Robotics',
    summary:
      "Robot middleware first, then the planner on top: a **ROS-style robotics runtime** written from scratch, with pub/sub topics and services over a TCP and JSON gateway, driving an **A* planner** on occupancy grids. Its open set is a hand-written **binary min-heap**.",
    media: {
      type: 'demo',
      demo: 'astar',
      blurb:
        'A browser reimplementation of the planner. Change the map, then compare how many cells A* expands '
        + 'against uninformed Dijkstra search for the same shortest path.',
    },
    links: [{ label: 'Source on GitHub', href: 'https://github.com/ArjunChavan2/A-Star-Path-Planning' }],
  },
  'Forward Kinematics for URDF Robots': {
    category: 'Robotics',
    summary:
      "URDF in, moving robot out. A from-scratch **URDF parser** and **forward kinematics** solver place every link, pub/sub nodes stream the poses to a live viewer, and a **MediaPipe** tool turns dance video into choreography. The demo below runs a port of the code on the project's 26-joint dual-arm robot.",
    highlight: { value: 'URDF → motion', label: 'Description file in, moving robot out: parser, kinematics, pub/sub, live viewer' },
    media: {
      type: 'demo',
      demo: 'fk',
      poster: asset('media/forward-kinematics-poster.jpg'),
      preview: asset('media/forward-kinematics-preview.mp4'),
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
    // Draws How it works as a flow: stages keyed by their howItWorks label, each with the tech it runs on.
    // Steps left out of `flow` sit beside it, captioned by `side`.
    pipeline: {
      flow: ['Parse', 'Solve', 'Serve', 'Gateway', 'Watch'],
      side: { Choreograph: 'Feeds the viewer', Test: 'Covers every stage' },
      tech: {
        Parse: 'Python', Solve: 'Python', Serve: 'asyncio', Gateway: 'TCP + JSON',
        Watch: 'Browser', Choreograph: 'MediaPipe', Test: 'pytest',
      },
    },
    links: [],
    featured: true,
  },
  'Underwater Inspection ROV': {
    category: 'Embedded',
    summary:
      "Building a four-thruster ROV from scratch and steering it underwater. On a four-person team, I wrote the **C++ Arduino control system** that turns pilot input into **surge, heave, and yaw**, including a latching **cruise control** for long transits.",
    media: { type: 'video', src: asset('media/rov-showcase.mp4'), poster: asset('media/rov-poster.jpg'), caption: 'Pool test of the ROV under live pilot control.' },
    links: [],
    featured: true,
  },
  'Gamified Financial Dashboard': {
    category: 'Full stack',
    summary:
      "**1st Place, Visa Track** at CMU TartanHacks. A personal finance app that turns budgeting into a game: an **AI-driven virtual pet**, real-time quests, and insights generated from **Capital One** account data.",
    badge: '1st Place · Visa Track',
    highlight: { value: '1st Place', label: 'Visa Track, CMU TartanHacks' },
    media: { type: 'video', src: asset('media/financial-dashboard.mp4'), poster: asset('media/financial-dashboard-poster.jpg'), caption: 'A quest completes and Scotty\'s happiness climbs, recreated from the app\'s own screens and sprites.' },
    links: [{ label: 'Source on GitHub', href: 'https://github.com/codylejang/Scotty-Market' }],
    featured: true,
  },
  'ICU Mortality Prediction': {
    category: 'Machine learning',
    summary:
      "**0.858 AUROC** predicting in-hospital mortality for 10,000 ICU patients. A **logistic regression** model on 253 features engineered from raw **time-series vitals**, with threshold tuning for the imbalanced outcome.",
    highlight: { value: '0.858', label: 'AUROC, stratified 5-fold cross-validation' },
    media: { type: 'video', src: asset('media/icu-mortality-prediction.mp4'), poster: asset('media/icu-mortality-prediction-poster.jpg'), caption: 'From 40 raw features to 253 engineered ones, with the ROC plot from the project.' },
    links: [],
  },
  'Memory-Mapped FPGA Peripheral Interface': {
    category: 'Hardware',
    summary:
      "An **ARM Cortex-M4** talking to an FPGA over a **16-bit memory-mapped bus**: address decoding in **Verilog**, control logic in C, buttons read and LEDs driven on a Tang Nano.",
    highlight: { value: '16-bit', label: 'Memory-mapped parallel bus, ARM to FPGA' },
    media: { type: 'video', src: asset('media/fpga-peripheral-interface.mp4'), poster: asset('media/fpga-peripheral-interface-poster.jpg'), caption: 'The bus, the C that reads the buttons through it, and the LEDs it drives.' },
    links: [],
  },
  'Facial Emotion Recognition': {
    category: 'Machine learning',
    summary:
      "Reads emotion off a face in **real time**: **OpenCV** locates the facial landmarks and a **TensorFlow** deep neural network classifies the expression.",
    highlight: { value: 'Real-time', label: 'Emotion classification from facial landmarks' },
    media: { type: 'video', src: asset('media/facial-emotion-recognition.mp4'), poster: asset('media/facial-emotion-recognition-poster.jpg'), caption: 'An illustrated landmark face; the 60% validated accuracy is the project\'s result.' },
    links: [],
  },
  'BillLess, AI Medical Bill Auditor': {
    category: 'Full stack',
    summary:
      "An **AI agent** that takes a medical bill from start to finish, built at MHacks 2026. It audits every charge with **rule-based findings that cite each line**, gets the patient's approval over iMessage, disputes by letter or a **voice-agent phone call** the patient controls, and appeals denials with evidence.",
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
    category: 'Hardware',
    summary:
      "Arithmetic in hardware: a four-function unit in **Verilog** for an FPGA, with **Booth multiplication** and repeated-subtraction division, verified against a **testbench** suite.",
    highlight: { value: 'Booth', label: 'Multiplication in Verilog RTL' },
    media: { type: 'video', src: asset('media/four-function-calculator.mp4'), poster: asset('media/four-function-calculator-poster.jpg'), caption: 'A worked Booth multiplication and the controller\'s state names from the Verilog.' },
    links: [],
  },
  'Assignment Calendar': {
    category: 'Full stack',
    summary:
      "Every course deadline in **one calendar**: a **web scraper** pulls assignments from multiple course websites so nothing slips between course pages.",
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

export const projects = [...resume.projects, ...SITE_ONLY].map((p) => {
  const d = DETAILS[p.title] || {};
  const stack = p.org.split(', ');
  return {
    ...p,
    slug: SLUGS[p.title] || slugify(p.title),
    category: d.category || 'Project',
    summary: d.summary || p.bullets[0],
    stack: stack.filter((s) => !CONTEXT.test(s)),
    context: stack.filter((s) => CONTEXT.test(s)).join(' · '),
    media: d.media || null,
    howItWorks: d.howItWorks || [],
    tech: d.tech || [],
    pipeline: d.pipeline || null,
    links: d.links || [],
    badge: d.badge || null,
    highlight: d.highlight || null,
    featured: Boolean(d.featured),
  };
}).sort((a, b) => (endMonth(b.date) - endMonth(a.date)) || 0); // newest first; two Present dates tie, not NaN

export const projectBySlug = (slug) => projects.find((p) => p.slug === slug);
