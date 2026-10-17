import 'dotenv/config';
import { createApp } from './app.js';
const port = Number(process.env.PORT || 3001);
createApp().listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Portfolio server: http://127.0.0.1:${port}`))
  .on('error', () => { console.error('Unable to start server. Check HOST, PORT, and whether the port is already in use.'); process.exit(1); });
