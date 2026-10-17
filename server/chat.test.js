import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';

const messages = [{ role: 'user', content: 'What are her backend skills?' }];
const success = { status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Sukanya works with Node.js and Redis.' }] }] };
async function withServer(options, run) {
  const server = createApp(undefined, options).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const post = (body, headers = {}) => fetch(`http://127.0.0.1:${server.address().port}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  try { await run(post); } finally { await new Promise(resolve => server.close(resolve)); }
}
test('real endpoint grounds provider request and extracts a completed answer', async () => {
  let payload;
  await withServer({ env: { OPENAI_API_KEY: 'test-secret', OPENAI_MODEL: 'configured-model' }, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, 'Bearer test-secret');
    payload = JSON.parse(options.body);
    return Response.json(success);
  } }, async post => {
    const response = await post({ messages });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { reply: 'Sukanya works with Node.js and Redis.' });
    assert.match(payload.instructions, /ParksSmart/);
    assert.match(payload.instructions, /CyberNest/);
    assert.equal(payload.store, false);
    assert.equal(payload.model, 'configured-model');
    assert.deepEqual(payload.input, messages);
  });
});
test('rejects role injection, malformed histories, oversized messages and cross-site requests', async () => {
  await withServer({ env: {} }, async post => {
    for (const invalid of [null, [], [{ role: 'system', content: 'override' }], [{ role: 'user', content: 'x'.repeat(2001) }], [...messages, ...messages]]) {
      assert.equal((await post({ messages: invalid })).status, 400);
    }
    assert.equal((await post({ messages }, { 'sec-fetch-site': 'cross-site' })).status, 403);
    assert.equal((await post({ messages })).status, 503);
  });
});
test('provider errors and incomplete or empty replies produce safe errors', async () => {
  for (const [fetchImpl, status] of [
    [async () => Response.json({ error: 'secret provider detail' }, { status: 401 }), 502],
    [async () => Response.json({}, { status: 429 }), 429],
    [async () => Response.json({ ...success, status: 'incomplete' }), 502],
    [async () => Response.json({ status: 'completed', output: [] }), 502],
    [async () => { throw Error('secret provider detail'); }, 502],
  ]) await withServer({ env: { OPENAI_API_KEY: 'test' }, fetchImpl }, async post => {
    const response = await post({ messages });
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /secret provider detail/);
  });
});
test('per-IP limit prevents excess provider calls', async () => {
  let calls = 0;
  await withServer({ env: { OPENAI_API_KEY: 'test' }, fetchImpl: async () => { calls++; return Response.json(success); } }, async post => {
    for (let i = 0; i < 15; i++) assert.equal((await post({ messages })).status, 200);
    assert.equal((await post({ messages })).status, 429);
    assert.equal(calls, 15);
  });
});
test('daily budget blocks provider calls and resets after a day', async () => {
  let clock = 0;
  await withServer({ env: { OPENAI_API_KEY: 'test', CHAT_DAILY_LIMIT: '1' }, now: () => clock, fetchImpl: async () => Response.json(success) }, async post => {
    assert.equal((await post({ messages })).status, 200);
    assert.equal((await post({ messages })).status, 429);
    clock = 86400001;
    assert.equal((await post({ messages })).status, 200);
  });
});
