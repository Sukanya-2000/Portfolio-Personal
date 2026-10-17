import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Check, Copy, Github, Linkedin, Mail, MapPin, Phone, Terminal } from 'lucide-react';
import { profile } from '../config';
import { ContactForm } from '../components/ContactForm';
import { External } from '../components/External';
export function ContactPage() {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  async function copyEmail() {
    try { await navigator.clipboard.writeText(profile.email); setCopyState('copied'); }
    catch { setCopyState('error'); }
  }
  return <section className="contact-page section" aria-labelledby="contact-title"><a href="/" className="contact-back"><ArrowLeft size={14}/> Back to portfolio</a>
    <div className="contact-page-grid"><motion.div className="contact-story" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
      <p className="eyebrow"><span className="small-line"/> LET&apos;S CONNECT</p><h1 id="contact-title">Have an interesting<br/>opportunity?<br/><em>Let&apos;s talk.</em></h1>
      <p className="contact-description">I&apos;m always interested in discussing challenging engineering problems, backend architecture, scalable applications, and opportunities to build impactful products. Whether you&apos;re hiring, collaborating, or exploring an idea, I&apos;d love to hear from you.</p>
      <div className="contact-identity"><span className="identity-mark">sb.</span><div><strong>{profile.name}</strong><span><MapPin size={13}/>{profile.location}</span></div></div>
      <div className="contact-methods"><div className="contact-method"><Mail size={19}/><a href={`mailto:${profile.email}`}><span>EMAIL</span><strong>{profile.email}</strong></a><button type="button" className="icon copy-email" aria-label="Copy email address" onClick={copyEmail}>{copyState === 'copied' ? <Check size={16}/> : <Copy size={16}/>}</button></div>
      <p className="copy-feedback" role="status">{copyState === 'copied' ? 'Email address copied.' : copyState === 'error' ? 'Copy unavailable. Select the email address to copy it manually.' : ''}</p>
      <div className="contact-method"><Phone size={19}/><a href={`tel:${profile.phone}`}><span>PHONE</span><strong>{profile.phoneDisplay}</strong></a><ArrowUpRight size={16}/></div></div>
      <div className="contact-socials"><External url={profile.linkedin}><Linkedin size={17}/> LinkedIn <ArrowUpRight size={14}/></External><External url={profile.github}><Github size={17}/> GitHub <ArrowUpRight size={14}/></External></div>
      {profile.availability !== 'not-specified' && <p className="configured-availability">{profile.availability === 'available' ? 'Available for opportunities' : 'Not currently available for employment'}</p>}
      <div className="connection-accent" aria-hidden="true"><Terminal size={16}/><span>idea</span><i/><span>conversation</span><i/><span className="lime">what&apos;s next</span></div>
    </motion.div><motion.div className="contact-form-shell" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: .1 }}><ContactForm/><div className="direct-email-note">Prefer your own email app? <a href={`mailto:${profile.email}`}>Email me directly <ArrowUpRight size={13}/></a></div></motion.div></div>
    <div className="contact-page-bottom"><span>BACKEND ENGINEERING · DISTRIBUTED SYSTEMS · FULL-STACK DEVELOPMENT</span><span>Good products start with a conversation.</span></div></section>;
}
