import { NavLink, Outlet, Link } from 'react-router-dom';
import resume from '../data/resume.json';
import { RESUME_PDF, contact } from '../site';

const TABS = [
  { to: '/', label: 'Home', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/experience', label: 'Experience' },
  { to: '/contact', label: 'Contact' },
];

const YEAR = new Date().getFullYear();

export default function Layout() {
  return (
    <div className="shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">{resume.name}</Link>
          <nav className="tabs" aria-label="Primary">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
                {t.label}
              </NavLink>
            ))}
          </nav>
          <a className="btn btn-secondary btn-sm header-cta" href={RESUME_PDF} target="_blank" rel="noreferrer">
            Résumé
          </a>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>© {YEAR} {resume.name}</p>
          <ul className="footer-links">
            <li><a href={`mailto:${contact.email}`}>Email</a></li>
            <li><a href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
            <li><a href={contact.github} target="_blank" rel="noreferrer">GitHub</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
