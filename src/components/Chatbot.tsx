import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, X, Send, RotateCcw, Sparkles } from 'lucide-react';
import '../chat.css';

type Message = { role: 'user' | 'assistant'; content: string };
const suggestions = ['What does Sukanya specialize in?', 'Tell me about her projects', 'How can I contact her?'];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: 'nearest' }); }, [open, messages, pending, error]);
  function close() { setOpen(false); launcher.current?.focus(); }
  async function send(text: string) {
    if (busy.current || !text.trim() || text.length > 2000) return;
    busy.current = true;
    setPending(true);
    setError('');
    const history: Message[] = [...messages, { role: 'user', content: text.trim() }];
    setMessages(history);
    setInput('');
    controller.current = new AbortController();
    const timeout = window.setTimeout(() => controller.current?.abort(), 30000);
    try {
      // Keep five complete turns and the current question, within the server's payload budget.
      let recent = history.slice(-11);
      while (recent.reduce((n, m) => n + m.content.length, 0) > 10000 && recent.length > 1) recent = recent.slice(2);
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: controller.current.signal, body: JSON.stringify({ messages: recent }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The assistant is unavailable. Please try again.');
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('No answer received. Please try again.');
      setMessages([...history, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(history.slice(0, -1));
      setInput(text);
      setError(err instanceof Error && err.name !== 'AbortError' ? err.message : 'The request timed out. Please try again.');
    } finally { window.clearTimeout(timeout); busy.current = false; setPending(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void send(input); }
  return <div className="portfolio-chat">
    {open && <section id="portfolio-chat-panel" className="chat-panel" role="region" aria-labelledby="chat-title" onKeyDown={e => { if (e.key === 'Escape') close(); }}>
      <div className="chat-heading"><div className="chat-avatar"><Sparkles size={20}/></div><div><h2 id="chat-title">Ask about Sukanya</h2><p>AI portfolio assistant</p></div><button type="button" aria-label="Start new conversation" disabled={pending || !messages.length} onClick={() => { setMessages([]); setError(''); setInput(''); inputRef.current?.focus(); }}><RotateCcw size={17}/></button><button type="button" aria-label="Close chat" onClick={close}><X size={20}/></button></div>
      <div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation">
        <div className="chat-message assistant">Hi! I’m Sukanya’s AI assistant. Ask me about her work, skills, or experience.</div>
        {!messages.length && <div className="chat-suggestions">{suggestions.map(text => <button key={text} disabled={pending} onClick={() => void send(text)}>{text}</button>)}</div>}
        {messages.map((message, i) => <div key={i} className={`chat-message ${message.role}`}><span className="sr-only">{message.role === 'user' ? 'You: ' : 'Assistant: '}</span>{message.content}</div>)}
        {pending && <p className="chat-thinking" role="status">Thinking…</p>}<div ref={end}/>
      </div>
      {error && <p className="chat-error" role="alert">{error} <a href="/contact">Contact Sukanya</a></p>}
      <form className="chat-form" onSubmit={submit}><label className="sr-only" htmlFor="chat-input">Your question</label><textarea id="chat-input" ref={inputRef} value={input} maxLength={2000} rows={2} placeholder="Ask about projects, skills…" disabled={pending} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (!pending) void send(input); } }}/><button type="submit" disabled={pending || !input.trim()} aria-label="Send question"><Send size={18}/></button></form>
      <p className="chat-disclosure">AI can make mistakes. Messages are sent to OpenAI.<br/>Avoid sharing sensitive information. <a href="/contact">Contact directly ↗</a></p>
    </section>}
    <button ref={launcher} type="button" className="chat-launcher" aria-expanded={open} aria-controls={open ? 'portfolio-chat-panel' : undefined} onClick={() => open ? close() : setOpen(true)}>{open ? <X size={21}/> : <MessageCircle size={21}/>}<span>{open ? 'Close chat' : 'Ask AI'}</span></button>
  </div>;
}
