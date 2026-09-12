import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet, onRequestPost} from '../../functions/api/contact.js';

const host = 'https://blackstarentertainment.org';
const id = '65f1df0a-f074-4d69-9897-2c37b9f61e5f';
const valid = {submissionId: id, name: 'Alex Rivera', email: 'alex@example.com', service: 'web',
  budget: '$1,000–$3,000', timeline: 'Within 1–3 months', message: 'A useful project brief.',
  website: '', challengeToken: 'verified-token'};

function environment() {
  const records = new Map();
  return {CONTACT_ENABLED: 'true', RESEND_API_KEY: 'test-only-key', TURNSTILE_SECRET_KEY: 'test-secret',
    TURNSTILE_SITE_KEY: 'test-site', CONTACT_RATE_SALT: 'test-only-salt',
    CONTACT_RATE_KV: {get: async key => records.get(key), put: async (key, value) => records.set(key, value)}};
}
function context(data = valid, env = environment(), origin = host, url = `${host}/api/contact`) {
  return {env, request: new Request(url, {method: 'POST', headers: {
    Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.7'}, body: JSON.stringify(data)})};
}
function mockProvider({challenge = true, provider = true} = {}) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({url, options});
    if (url.includes('siteverify')) return {ok: true, json: async () => ({success: challenge, hostname: 'blackstarentertainment.org', action: 'contact'})};
    return {ok: provider, json: async () => ({data: [{id: 'owner-id'}, {id: 'visitor-id'}]})};
  };
  return {calls, restore: () => {globalThis.fetch = original;}};
}

test('readiness is enabled only on the verified production host', async () => {
  const env = environment();
  const active = onRequestGet({env, request: new Request(`${host}/api/contact`)});
  assert.deepEqual(await active.json(), {enabled: true, siteKey: 'test-site'});
  const preview = onRequestGet({env, request: new Request('https://preview.blackstar-1fa.pages.dev/api/contact')});
  assert.deepEqual(await preview.json(), {enabled: false});
  env.CONTACT_ENABLED = 'false';
  assert.deepEqual(await onRequestGet({env, request: new Request(`${host}/api/contact`)}).json(), {enabled: false});
});

test('one accepted batch addresses the owner and sends a separate professional acknowledgment', async () => {
  const mock = mockProvider();
  try {
    const response = await onRequestPost(context());
    assert.equal(response.status, 202);
    assert.deepEqual(await response.json(), {ok: true});
    assert.equal(mock.calls.length, 2);
    assert.equal(mock.calls[1].options.headers['Idempotency-Key'], `blackstar-contact/${id}`);
    const [owner, visitor] = JSON.parse(mock.calls[1].options.body);
    assert.deepEqual(owner.to, ['inquiries.blackstarent@gmail.com']);
    assert.equal(owner.reply_to, 'alex@example.com');
    assert.match(owner.text, /A useful project brief/);
    assert.deepEqual(visitor.to, ['alex@example.com']);
    assert.equal(visitor.reply_to, 'inquiries.blackstarent@gmail.com');
    assert.match(visitor.text, /reply personally/);
    assert.doesNotMatch(visitor.text, /A useful project brief/);
  } finally { mock.restore(); }
});

test('malformed data, honeypot, and wrong origin never contact Resend', async () => {
  const mock = mockProvider();
  try {
    for (const data of [{...valid, website: 'bot.example'}, {...valid, email: 'bad\nBcc: somebody@example.com'},
      {...valid, service: 'toString'},
      {...valid, extra: 'not allowed'}, {...valid, message: '  '}]) {
      assert.equal((await onRequestPost(context(data))).status, 400);
    }
    assert.equal((await onRequestPost(context(valid, environment(), 'https://other.example'))).status, 403);
    assert.equal(mock.calls.length, 0);
  } finally { mock.restore(); }
});

test('failed verification blocks both messages', async () => {
  const mock = mockProvider({challenge: false});
  try {
    assert.equal((await onRequestPost(context())).status, 403);
    assert.equal(mock.calls.length, 1);
  } finally { mock.restore(); }
});

test('visitor name is escaped in acknowledgment HTML', async () => {
  const mock = mockProvider();
  try {
    assert.equal((await onRequestPost(context({...valid, name: '<Alex> Rivera'}))).status, 202);
    const visitor = JSON.parse(mock.calls[1].options.body)[1];
    assert.match(visitor.html, /Hi &lt;Alex&gt;/);
    assert.doesNotMatch(visitor.html, /Hi <Alex>/);
  } finally { mock.restore(); }
});

test('provider failure is not shown as a submitted inquiry', async () => {
  const mock = mockProvider({provider: false});
  try {
    assert.equal((await onRequestPost(context())).status, 502);
  } finally { mock.restore(); }
});

test('rate limit stops further batches in the same window', async () => {
  const mock = mockProvider();
  const env = environment();
  try {
    for (let attempt = 0; attempt < 5; attempt++) assert.equal((await onRequestPost(context({...valid, submissionId: crypto.randomUUID()}, env))).status, 202);
    const limited = await onRequestPost(context({...valid, submissionId: crypto.randomUUID()}, env));
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get('Retry-After'), '600');
    assert.equal(mock.calls.filter(call => call.url.includes('resend')).length, 5);
  } finally { mock.restore(); }
});

test('missing runtime bindings fail closed', async () => {
  const env = environment();
  delete env.RESEND_API_KEY;
  assert.equal((await onRequestPost(context(valid, env))).status, 503);
});
