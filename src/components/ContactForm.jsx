import { useId, useRef, useState } from 'react';
import { contact } from '../site';

const EMPTY_FORM = { name: '', company: '', message: '' };

// No backend on GitHub Pages: the form composes an email in the visitor's own mail app.
function mailtoHref({ name, company, message }) {
  const from = company ? `${name} (${company})` : name;
  const subject = `Portfolio inquiry from ${from}`;
  const body = `${message}\n\n${name}${company ? `\n${company}` : ''}`;
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function validate({ name, message }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Add your name so I know who the email is from.';
  if (!message.trim()) errors.message = 'Write a short message. A sentence or two about the role is plenty.';
  return errors;
}

export default function ContactForm() {
  const id = useId();
  const refs = { name: useRef(null), message: useRef(null) };
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [opened, setOpened] = useState(false);

  const update = (field) => (e) => {
    const next = { ...form, [field]: e.target.value };
    setForm(next);
    // Clear an error as soon as the field becomes valid; never add new ones while typing.
    if (errors[field] && !validate(next)[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  function submit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    const first = ['name', 'message'].find((f) => found[f]);
    if (first) {
      setOpened(false);
      refs[first].current?.focus();
      return;
    }
    window.location.href = mailtoHref(form);
    setOpened(true);
  }

  const fieldProps = (field) => ({
    id: `${id}-${field}`,
    ref: refs[field],
    value: form[field],
    onChange: update(field),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${id}-${field}-error` : undefined,
  });

  const error = (field) => errors[field] && (
    <p className="cform-error" id={`${id}-${field}-error`}>{errors[field]}</p>
  );

  return (
    <form className="cform" onSubmit={submit} noValidate>
      <div className="cform-row">
        <div className="cform-field">
          <label htmlFor={`${id}-name`}>Your name</label>
          <input {...fieldProps('name')} autoComplete="name" />
          {error('name')}
        </div>
        <div className="cform-field">
          <label htmlFor={`${id}-company`}>
            Company or school <span className="cform-optional">optional</span>
          </label>
          <input id={`${id}-company`} value={form.company} onChange={update('company')} autoComplete="organization" />
        </div>
      </div>
      <div className="cform-field">
        <label htmlFor={`${id}-message`}>Message</label>
        <textarea {...fieldProps('message')} rows={6} placeholder="What's the role, and what would you like to talk about?" />
        {error('message')}
      </div>
      <div className="cform-actions">
        <button className="btn btn-primary" type="submit">Open in my email app</button>
        <p className="cform-note" role="status">
          {opened
            ? <>Your email app should have opened with the draft. If it didn't, write to <a href={`mailto:${contact.email}`}>{contact.email}</a>.</>
            : <>Addressed to {contact.email}</>}
        </p>
      </div>
    </form>
  );
}
