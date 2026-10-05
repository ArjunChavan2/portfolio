import ContactForm from '../components/ContactForm';
import { contact } from '../site';

export default function Contact() {
  return (
    <section className="section page-top">
      <div className="container contact-grid">
        <header className="page-head">
          <p className="kicker">Contact</p>
          <h1>Let's talk</h1>
          <p className="lede">
            I'm looking for software engineering internships and new-grad roles. Send a note here or reach me directly.
          </p>
          <ul className="contact-list">
            <li><span>Email</span><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
            <li><span>LinkedIn</span><a href={contact.linkedin} target="_blank" rel="noreferrer">{contact.linkedin.replace('https://', '')}</a></li>
            <li><span>GitHub</span><a href={contact.github} target="_blank" rel="noreferrer">{contact.github.replace('https://', '')}</a></li>
          </ul>
        </header>
        <div className="panel">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
