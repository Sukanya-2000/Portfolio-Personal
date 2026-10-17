import { useId, useRef, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { ArrowUpRight, CheckCircle2, LoaderCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { contactLimits, contactSuccess, emptyContact, sendContact, validateContact } from '../lib/contactValidation';
import type { ContactErrors, ContactValues } from '../lib/contactValidation';

export function ContactForm() {
  const id = useId();
  const [values, setValues] = useState<ContactValues>({ ...emptyContact });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');
  const pending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const nextErrors = validateContact(values); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setState('idle'); setFeedback('Please correct the highlighted fields.');
      formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus(); return;
    }
    pending.current = true; setState('loading'); setFeedback('');
    const website = new FormData(event.currentTarget).get('website');
    try {
      await sendContact(values, typeof website === 'string' ? website : '');
      setState('success'); setFeedback(contactSuccess); setValues({ ...emptyContact }); formRef.current?.reset();
    } catch (error) { setState('error'); setFeedback(error instanceof Error ? error.message : 'Unable to send your message. Please try again.'); }
    finally { pending.current = false; }
  }
  const field = (key: keyof ContactValues, label: string, placeholder: string) => {
    const props = {
      id: `${id}-${key}`, name: key, required: true, maxLength: contactLimits[key], value: values[key], placeholder, disabled: state === 'loading',
      'aria-invalid': Boolean(errors[key]), 'aria-describedby': `${id}-${key}-error${key === 'message' ? ` ${id}-message-hint` : ''}`,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const next = { ...values, [key]: event.target.value }; setValues(next);
        if (errors[key]) setErrors(previous => ({ ...previous, [key]: validateContact(next)[key] }));
        if (state === 'success' || state === 'error') { setState('idle'); setFeedback(''); }
      },
      onBlur: () => setErrors(previous => ({ ...previous, [key]: validateContact(values)[key] })),
    };
    return <div className="contact-field"><label htmlFor={props.id}>{label} <span aria-hidden="true">*</span></label>
      {key === 'message' ? <textarea {...props} rows={5} minLength={10}/> : <input {...props} type={key === 'email' ? 'email' : 'text'} autoComplete={key === 'name' ? 'name' : key === 'email' ? 'email' : 'off'}/>}
      {key === 'message' && <span id={`${id}-message-hint`} className="field-hint">10–5,000 characters <span>{values.message.length.toLocaleString()} / 5,000</span></span>}
      <span className="field-error" id={`${id}-${key}-error`} aria-live="polite">{errors[key]}</span></div>;
  };
  return <form ref={formRef} noValidate onSubmit={submit} className="contact-form" aria-label="Send Sukanya a message" aria-busy={state === 'loading'}>
    <div className="form-heading"><span className="form-step">01 / START A CONVERSATION</span><h2>Tell me what you have in mind<span className="lime">.</span></h2><p>Share a little about yourself and what you’re working on.</p></div>
    <div className="form-row">{field('name', 'Full name', 'Your full name')}{field('email', 'Email address', 'you@company.com')}</div>
    {field('subject', 'Subject', 'An opportunity, a collaboration, an idea…')}
    {field('message', 'Message', 'Tell me about the challenge, your team, or what you’d like to build together.')}
    <div className="honeypot" aria-hidden="true"><label htmlFor={`${id}-website`}>Leave this field empty</label><input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off"/></div>
    <button className="button primary send-button" disabled={state === 'loading' || state === 'success'} type="submit">{state === 'loading' ? <>Sending message <LoaderCircle className="loading-spinner" size={18}/></> : state === 'success' ? <>Message submitted <CheckCircle2 size={18}/></> : <>Send Message <ArrowUpRight size={18}/></>}</button>
    <div className={`feedback ${state}`} role={state === 'error' || Object.values(errors).some(Boolean) ? 'alert' : 'status'}>{feedback}</div>
    {state === 'error' && <button type="submit" className="retry-button"><RotateCcw size={14}/> Retry message</button>}
    {state === 'success' && <button type="button" className="retry-button" onClick={() => { setState('idle'); setFeedback(''); }}>Write another message <ArrowUpRight size={14}/></button>}
    <p className="form-privacy"><ShieldCheck size={14}/> Your details are used only to reply to your message.</p>
  </form>;
}
