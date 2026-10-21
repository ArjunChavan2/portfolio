import '../styles/contact.css';
import ContactForm from '../components/ContactForm';
import AuroraBackground from '../components/AuroraBackground';
import { contact } from '../site';

const bare = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const METHODS = [
  { label: 'Email', value: contact.email, href: `mailto:${contact.email}`, note: 'Best for interviews and scheduling' },
  { label: 'LinkedIn', value: bare(contact.linkedin), href: contact.linkedin, note: 'Connect or send a message', external: true },
  { label: 'GitHub', value: bare(contact.github), href: contact.github, note: 'Code for the projects on this site', external: true },
];

export default function Contact() {
  return (
    <div className="page-contact">
      <section className="contact-hero">
        <AuroraBackground />
        <div className="container">
          <h1>Let's talk about your team.</h1>
          <p className="lede">
            I'm looking for software engineering internships and new-grad roles.
            Write to me directly, or use the form to start an email.
          </p>
        </div>
      </section>

      <section className="contact-body">
        <div className="container contact-layout">
          <div className="contact-direct">
            <h2>Reach me directly</h2>
            <ul className="contact-methods">
              {METHODS.map((m) => (
                <li key={m.label}>
                  <a
                    className="contact-method"
                    href={m.href}
                    {...(m.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  >
                    <span className="contact-method-label">{m.label}</span>
                    <span className="contact-method-main">
                      <span className="contact-method-value">{m.value}</span>
                      <span className="contact-method-note">{m.note}</span>
                    </span>
                    <span className="contact-method-arrow" aria-hidden="true">{m.external ? '↗' : '→'}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="contact-compose">
            <h2>Or start an email here</h2>
            <p className="contact-compose-intro">
              Nothing is sent from this site. The button opens your email app with your message
              addressed to me, so you can review it and press send.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
