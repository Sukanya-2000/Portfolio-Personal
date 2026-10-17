import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { ContactPage } = await vite.ssrLoadModule('/src/pages/ContactPage.tsx');
  const html = renderToStaticMarkup(createElement(ContactPage));
  for (const href of ['mailto:bhattacharyyasukanya5@gmail.com', 'tel:+919836232939', 'https://www.linkedin.com/in/sukanya-bhattacharyya333/', 'https://github.com/Sukanya-2000']) assert.ok(html.includes(`href="${href}"`), `Contact action exists: ${href}`);
  assert.equal((html.match(/rel="noopener noreferrer"/g) || []).length, 2);
  for (const name of ['name', 'email', 'subject', 'message']) {
    const field = html.match(new RegExp(`<(?:input|textarea)[^>]*name="${name}"[^>]*>`))?.[0];
    assert.ok(field, `Field exists: ${name}`);
    assert.match(field, /required=""/);
    assert.match(field, /aria-describedby=/);
    assert.match(field, /aria-invalid="false"/);
    const id = field.match(/id="([^"]+)"/)[1];
    assert.ok(html.includes(`for="${id}"`), `Field is explicitly labeled: ${name}`);
  }
  assert.match(html, /aria-label="Copy email address"/);
  assert.match(html, /Send Message/);
  assert.match(html, /tabindex="-1"/);
  assert.ok(!html.includes('Available for opportunities'));
  console.log('Contact markup checks passed: real contact actions, safe external links, four labeled required fields, error associations, copy control, honeypot, and unspecified availability. This is a rendering check, not browser visual QA.');
} finally { await vite.close(); }
