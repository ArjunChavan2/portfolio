import '../styles/experience.css';
import { Link } from 'react-router-dom';
import resume from '../data/resume.json';
import BlurText from '../components/BlurText';
import AuroraBackground from '../components/AuroraBackground';
import { RESUME_PDF } from '../site';

const isCurrent = (date) => /present/i.test(date);

// "Altheros Capital, Ann Arbor, MI" -> { name: "Altheros Capital", place: "Ann Arbor, MI" }
function splitOrg(org) {
  const [name, ...rest] = org.split(',').map((s) => s.trim());
  return { name, place: rest.join(', ') };
}

// The coursework string from the resume reads like
// "A, B, C; D, E, and F (In Progress)". Split it into groups so completed and
// in-progress courses can be listed separately. Falls back to one group.
function parseCoursework(text) {
  if (!text) return [];
  return text
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const inProgress = /\(in progress\)\s*$/i.test(part);
      const clean = part.replace(/\(in progress\)\s*$/i, '').trim();
      const items = clean.split(/,\s*(?:and\s+)?/).map((s) => s.trim()).filter(Boolean);
      return { label: inProgress ? 'In progress' : 'Completed', items };
    });
}

export default function Experience() {
  const ed = resume.education;
  const roles = resume.experience;
  const courses = parseCoursework(ed.coursework);

  // Skills that also appear on a role above get emphasis in the skills list.
  const usedOnRoles = new Set(
    roles.flatMap((r) => r.skills || []).map((s) => s.toLowerCase()),
  );

  return (
    <div className="page-experience">
      <section className="xp-hero">
        <AuroraBackground />
        <div className="container">
          <h1><BlurText text="Experience and education" /></h1>
          <p className="lede">
            Every role in detail, from current work back to research, plus coursework and
            the tools I use. The one-page version is available as a{' '}
            <a href={RESUME_PDF} target="_blank" rel="noreferrer">PDF resume</a>.
          </p>
        </div>
      </section>

      <section className="xp-section" aria-labelledby="xp-roles">
        <div className="container">
          <div className="section-head">
            <h2 id="xp-roles">Roles</h2>
            <a href={RESUME_PDF} className="text-link" target="_blank" rel="noreferrer">Resume PDF →</a>
          </div>

          <ol className="xp-timeline">
            {roles.map((e) => {
              const org = splitOrg(e.org);
              const now = isCurrent(e.date);
              return (
                <li key={e.title + e.org} className={`xp-role${now ? ' is-current' : ''}`}>
                  <div className="xp-when">
                    <span className="date">{e.date}</span>
                    {now && <span className="role-now">Current</span>}
                  </div>
                  <div className="xp-rail" aria-hidden="true"><span className="xp-dot" /></div>
                  <div className="xp-body">
                    <h3>{e.title}</h3>
                    <p className="xp-org">
                      <span>{org.name}</span>
                      {org.place && <span className="xp-place">{org.place}</span>}
                    </p>
                    <ul className="xp-bullets">
                      {e.bullets.map((b) => <li key={b}>{b}</li>)}
                    </ul>
                    {e.skills?.length > 0 && (
                      <p className="xp-used">
                        <span className="xp-used-label">Worked with</span>
                        {e.skills.join(', ')}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="xp-section section-subtle" aria-labelledby="xp-edu">
        <div className="container">
          <div className="section-head">
            <h2 id="xp-edu">Education</h2>
          </div>
          <div className="xp-edu">
            <div className="xp-when">
              <span className="date">{ed.date}</span>
            </div>
            <div className="xp-edu-main">
              <h3>{ed.school}</h3>
              <p className="xp-org">
                <span>{ed.degree}</span>
                {ed.location && <span className="xp-place">{ed.location}</span>}
              </p>
            </div>
          </div>
          {courses.length > 0 && (
            <div className="xp-courses">
              <h3 className="xp-sub">Coursework</h3>
              <dl>
                {courses.map((g) => (
                  <div key={g.label} className="xp-course-group">
                    <dt>{g.label}</dt>
                    <dd>
                      <ul>
                        {g.items.map((c) => <li key={c}>{c}</li>)}
                      </ul>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>

      <section className="xp-section" aria-labelledby="xp-skills">
        <div className="container">
          <div className="section-head">
            <h2 id="xp-skills">Skills</h2>
            <p className="xp-key"><strong>Bold</strong> items were used in a role above.</p>
          </div>
          <ul className="xp-skills">
            {resume.skills.map((g) => (
              <li key={g.label} className="xp-skill-row">
                <h3>{g.label}</h3>
                <ul className="xp-skill-items">
                  {g.items.map((s) => {
                    const used = usedOnRoles.has(s.toLowerCase());
                    return (
                      <li key={s} className={used ? 'is-used' : undefined}>{s}</li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="xp-section xp-last">
        <div className="container">
          <div className="closing">
            <AuroraBackground />
            <h2>Need the one-page version?</h2>
            <p>The PDF has the same roles and skills on a single page, ready to share.</p>
            <div className="closing-actions">
              <a href={RESUME_PDF} className="btn btn-primary" target="_blank" rel="noreferrer">Download resume</a>
              <Link to="/contact" className="btn btn-secondary">Get in touch</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
