import { useState } from 'react';
import { contact } from '../site';

const EMPTY_FORM = { name: '', company: '', message: '' };

// No backend on GitHub Pages: the form composes an email in the visitor's own mail app.
function mailtoHref({ name, company, message }) {
  const from = company ? `${name} (${company})` : name;
  const subject = `Portfolio inquiry from ${from}`;
  const body = `${message}\n\n${name}${company ? `\n${company}` : ''}`;
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [opened, setOpened] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function submit(e) {
    e.preventDefault();
    window.location.href = mailtoHref(form);
    setOpened(true);
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          <span>Name</span>
          <input required value={form.name} onChange={update('name')} autoComplete="name" />
        </label>
        <label>
          <span>Company or school <span className="optional">(optional)</span></span>
          <input value={form.company} onChange={update('company')} autoComplete="organization" />
        </label>
      </div>
      <label>
        <span>Message</span>
        <textarea required rows={6} value={form.message} onChange={update('message')} />
      </label>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">Compose email</button>
        <p className="form-note">
          {opened
            ? <>Your email app should have opened. If it didn't, write to <a href={`mailto:${contact.email}`}>{contact.email}</a>.</>
            : 'Opens your email app with this message addressed to me.'}
        </p>
      </div>
    </form>
  );
}
