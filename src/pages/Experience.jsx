import resume from '../data/resume.json';
import { RESUME_PDF } from '../site';

export default function Experience() {
  const ed = resume.education;
  return (
    <section className="section page-top">
      <div className="container narrow">
        <header className="page-head">
          <p className="kicker">Experience</p>
          <h1>Experience and education</h1>
          <p className="lede">
            The full one-page version is available as a <a href={RESUME_PDF} target="_blank" rel="noreferrer">PDF résumé</a>.
          </p>
        </header>

        <ol className="timeline">
          {resume.experience.map((e) => (
            <li key={e.title + e.org} className="timeline-item">
              <div className="timeline-head">
                <div>
                  <h2>{e.title}</h2>
                  <p className="muted">{e.org}</p>
                </div>
                <span className="date">{e.date}</span>
              </div>
              <ul className="highlights">
                {e.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </li>
          ))}
        </ol>

        <section className="project-section">
          <h2 className="section-title">Education</h2>
          <div className="timeline-head">
            <div>
              <h3>{ed.school}</h3>
              <p className="muted">{ed.degree} · {ed.location}</p>
            </div>
            <span className="date">{ed.date}</span>
          </div>
          <p className="coursework"><strong>Coursework.</strong> {ed.coursework}</p>
        </section>

        <section className="project-section">
          <h2 className="section-title">Skills</h2>
          <div className="skills">
            {resume.skills.map((g) => (
              <div key={g.label} className="skill-group">
                <h3>{g.label}</h3>
                <ul className="tags">
                  {g.items.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
