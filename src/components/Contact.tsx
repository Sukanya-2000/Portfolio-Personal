import { ArrowUpRight, Mail } from 'lucide-react';
import { profile } from '../config';
export function Contact() {
  return <section id="contact" className="section contact-home"><div><p className="eyebrow">06 / LET’S BUILD SOMETHING</p><h2>A good conversation.<br/><em>A great starting point.</em></h2><p>Have a challenging problem or an interesting opportunity? Let’s talk.</p></div><div className="contact-home-actions"><a href="/contact" className="button primary">Contact Me <ArrowUpRight size={18}/></a><a href={`mailto:${profile.email}`} className="text-link"><Mail size={16}/> Email me directly</a></div></section>;
}
