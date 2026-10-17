# Sukanya Bhattacharyya — developer portfolio

## AI assistant

The floating Ask AI widget on the home and contact pages calls `/api/chat` using the OpenAI Responses API. Set `OPENAI_API_KEY` in `.env` or hosting secrets and restart the server. Never use a VITE-prefixed secret. `OPENAI_MODEL` defaults to `gpt-4.1-mini`; the chosen model needs API billing and access in your OpenAI project.

The server grounds answers in `src/config.ts`, `src/data/projects.ts` and `src/data/career.ts`. Include these files in production alongside the server. The assistant is instructed to acknowledge missing information and refer opportunities to `/contact`; generated answers can still contain mistakes. See the [OpenAI text generation documentation](https://developers.openai.com/api/docs/guides/text).

Conversations stay in React memory and clear on reload, navigation or New conversation. Recent turns go to OpenAI with `store: false`; this app does not persist or log chat content. Provider abuse-monitoring retention policies still apply. The UI discloses the provider and renders answers as plain text.

Limits: 2,000 characters per message, five previous turns, 10,000 history characters, 15 requests per IP per 15 minutes, three concurrent requests, 600 output tokens and a 25-second provider timeout. `CHAT_DAILY_LIMIT` defaults to 200 upstream attempts per process per rolling 24 hours. Limits reset on restart; use a shared limiter for multiple instances and provider project spending controls. Configure Express trust proxy for the exact trusted deployment topology before relying on visitor IPs. This is a public endpoint; cross-site browser checks are not authentication.

Run `npm test` for mocked HTTP integration tests covering grounding, provider payload, validation, safe failures and request budgets. Live model access requires a real key and live request; mock tests do not verify it.

React 19, TypeScript, Vite, Tailwind, Motion, Lucide, and Express/Nodemailer.

## Run

Requires Node 22.18+ or Node 24+ and npm (use `npm.cmd` on Windows if PowerShell blocks npm). Tests use Node's built-in TypeScript stripping for client validation helpers.

```sh
npm install
cp .env.example .env
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies `/api` to port 3001.

On this Windows machine the npm registry requires the system certificate store. With Node 24, run `$env:NODE_OPTIONS='--use-system-ca'` in PowerShell before npm commands if you encounter `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Keep certificate verification enabled.

```sh
npm run lint
npm test
npm run build
npm start
```

With `npm run dev` running, `node scripts/smoke.mjs` checks the development page, built production page/assets, security headers, 404, and proxied API validation/honeypot handling. Run `npm run build` first. It does not send a real email.

Production serves the frontend and API at http://127.0.0.1:3001.

## Contact page

Visit `/contact` (locally http://127.0.0.1:5173/contact). This project has no router dependency: normal links navigate between `/`, homepage anchors, and `/contact`. The production Express server serves that route directly, includes contact-specific SEO/Open Graph metadata, and serves the shared styled fallback with HTTP 404 for unknown page paths. Keep all these routes pointed at the Node server when deploying. Existing homepage project interactions, theme persistence, and resume behavior are retained.

`src/pages/ContactPage.tsx` contains the contact information and layout. `src/components/ContactForm.tsx` provides inline validation, pending/success/error states, a retry action, and an immediate duplicate-submit guard. `src/lib/contactValidation.ts` contains testable client validation and submission helpers; `src/contact.css` adds responsive page styling. Real GitHub and LinkedIn URLs are configured in `src/config.ts` and shared across the portfolio. Clipboard copying needs HTTPS or localhost; failures show instructions for manual copying.

`server/app.js` configures the routes, security middleware, and API; `server/index.js` starts the process. Tests cover client validation and pending/accepted/error submission behavior, plus the real HTTP endpoint with a mock transport. No credentials are needed to run these tests. Mock email acceptance is not evidence of real inbox delivery.

`node scripts/contact-markup.mjs` renders the contact page on the server and checks real contact actions, safe external links, explicit form labels/error associations, copy control, and unspecified availability. This checks markup, not visual layout or clipboard interaction in a browser. Full browser visual verification requires a connected browser.

## Finish configuration

- `src/config.ts`: real social URLs, phone, availability, resume path. Missing links are hidden; availability defaults to unspecified.
- Place the actual PDF at `public/resume/Sukanya_Bhattacharyya_Resume.pdf`. Download and view actions enable only when a PDF signature is detected. No fake resume is included.
- `src/data/projects.ts`: verified content, technologies, featured status, demo/repository URLs and screenshot paths. Missing URLs are empty. All current visuals are labeled concept illustrations.
- Place screenshots in `public/images/projects/`, then add paths like `/images/projects/payhours-1.webp` to the project's images array. Multiple paths enable the gallery. Prefer local optimized WebP files.
- `src/data/career.ts`: metrics, career, skills and conceptual architecture.
- Set SMTP credentials in `.env` locally and hosting secret settings in production. Never use VITE-prefixed secrets.
- Add a canonical production URL and Open Graph image once known.

## Email

Configure SMTP_HOST, SMTP_PORT (587 by default), SMTP_SECURE (true typically for 465), SMTP_USER, SMTP_PASS, CONTACT_FROM_EMAIL (verified sender) and optional CONTACT_TO_EMAIL. Recipient defaults to bhattacharyyasukanya5@gmail.com. Visitor address is reply-to, never sender. The client cannot choose a recipient.

Missing configuration returns HTTP 503; provider errors or recipient rejection return 502. Success appears only after SMTP accepts the recipient and the API returns `accepted: true`. Honeypot requests return HTTP 202 with `accepted: false` and send no email; the frontend never treats those as success. Mock transport tests cover validation, header injection, fixed recipient, reply-to, timestamp, honeypot, rate limiting and provider failures. Actual inbox delivery requires valid SMTP credentials and a real test submission.

Five attempts per IP per 15 minutes, server validation, 16 KB JSON body limit and a honeypot protect the endpoint. Limits are in memory: use a shared Redis limiter for multiple instances. Behind a reverse proxy, configure Express trust proxy for the exact trusted topology before relying on individual visitor IPs. Do not trust arbitrary forwarding headers.

## Deploy

Use a Node host with outbound SMTP support. Build: `npm ci && npm run build`. Start: `npm start`. Set `HOST=0.0.0.0`, provider PORT, and SMTP secrets. Configure HTTPS and a reverse proxy routing frontend and API to the same process. Helmet adds security headers and a production CSP. Vite is development-only. Static-only hosting cannot serve the contact API.

No public deployment or live email verification is implied by local build success. `.env` is ignored; `.env.example` contains settings only.
