import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createContactHandler } from './contact.js';
import { createChatHandler } from './chat.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function createApp(contactOptions, chatOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'], connectSrc: ["'self'"], fontSrc: ["'self'"],
    objectSrc: ["'none'"], upgradeInsecureRequests: null,
  } } }));
  app.use(express.json({ limit: '16kb' }));
  app.post('/api/contact', createContactHandler(contactOptions));
  app.post('/api/chat', createChatHandler(chatOptions));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found' }));
  app.get(['/contact', '/contact/'], async (_req, res) => {
    const title = 'Contact | Sukanya Bhattacharyya';
    const description = 'Connect with Sukanya Bhattacharyya about backend engineering, scalable applications, collaborations, and product opportunities.';
    const html = (await readFile(path.join(root, 'dist/index.html'), 'utf8'))
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*/, `$1${description}`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${description}`);
    res.type('html').send(html);
  });
  app.use(express.static(path.join(root, 'dist')));
  app.get('/', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
  app.use((req, res) => {
    if (req.accepts('html') && !path.extname(req.path)) return res.status(404).sendFile(path.join(root, 'dist/index.html'));
    res.status(404).send('404 — Page not found. Return to /');
  });
  app.use((err, _req, res, _next) => res.status(err.status || 500).json({ error: err.status === 413 ? 'Message too large.' : 'Invalid request.' }));
  return app;
}
