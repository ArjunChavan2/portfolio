import resume from './data/resume.json';

// Public files live under the Vite base (/portfolio/ on GitHub Pages).
export const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

export const RESUME_PDF = asset('resume.pdf');
export const HEADSHOT = asset('media/headshot.jpg');

const find = (needle) => resume.links.find((l) => l.includes(needle));

export const contact = {
  email: find('@'),
  linkedin: `https://${find('linkedin')}`,
  github: `https://${find('github')}`,
  leetcode: `https://${find('leetcode')}`,
};

export const currentRole = resume.experience[0];
export const currentOrg = currentRole.org.split(',')[0];
