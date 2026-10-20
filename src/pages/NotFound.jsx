import '../styles/notfound.css';
import { Link, useLocation } from 'react-router-dom';
import AuroraBackground from '../components/AuroraBackground';

const DESTINATIONS = [
  { to: '/', label: 'Home', note: 'Who I am, what I work on, and featured projects' },
  { to: '/projects', label: 'Projects', note: 'Every project, with write-ups and demos' },
  { to: '/contact', label: 'Contact', note: 'Email, LinkedIn, GitHub, or a quick message' },
];

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <section className="page-notfound">
      <AuroraBackground />
      <div className="container nf-inner">
        <p className="nf-code">Error 404</p>
        <h1>There's no page at this address.</h1>
        <p className="lede">
          Nothing lives at <code className="nf-path">{pathname}</code>. The link may be out of date,
          or the address may have a typo. These pages do exist:
        </p>
        <ul className="nf-links">
          {DESTINATIONS.map((d) => (
            <li key={d.to}>
              <Link to={d.to} className="nf-link">
                <span className="nf-link-label">{d.label}</span>
                <span className="nf-link-note">{d.note}</span>
                <span className="nf-link-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
