import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../analytics.js', import.meta.url), 'utf8');

function browser(hostname) {
  const handlers = {};
  const elements = [];
  const requests = [];
  const document = {
    referrer: 'https://search.example/path?email=private@example.com',
    addEventListener: (event, handler) => { handlers[event] = handler; },
    querySelector: () => null,
    body: {append: element => elements.push(element)},
    createElement: tag => {
      const element = {tag, children: [], hidden: false, setAttribute() {},
        addEventListener(event, handler) { this[`on${event}`] = handler; },
        append(...children) { this.children.push(...children); }};
      elements.push(element);
      return element;
    },
    getElementsByTagName: () => [{parentNode: {insertBefore: element => elements.push(element)}}]
  };
  const location = {hostname, pathname: '/', search: '?email=private@example.com'};
  const window = {location};
  const context = {window, document, location, URL, AbortSignal, localStorage: {getItem: () => null, setItem() {}},
    fetch: async url => { requests.push(url); return {ok: true, json: async () => ({enabled: true, token: 'phc_publictest'})}; }};
  vm.runInNewContext(source, context);
  return {handlers, elements, requests, window};
}

test('preview never requests analytics configuration or initializes SDK', () => {
  const page = browser('preview.blackstar-1fa.pages.dev');
  assert.deepEqual(page.requests, []);
  assert.equal(page.window.posthog, undefined);
  assert.equal(page.handlers.DOMContentLoaded, undefined);
});

test('affirmative consent gates loading and outgoing properties exclude personal data', async () => {
  const page = browser('blackstarentertainment.org');
  assert.equal(page.window.posthog, undefined);
  page.handlers.DOMContentLoaded();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(page.requests, ['/api/analytics-config']);
  assert.equal(page.window.posthog, undefined);
  const allow = page.elements.find(element => element.textContent === 'Allow analytics');
  allow.onclick();
  assert.ok(page.window.posthog);
  const config = page.window.posthog._i[0][1];
  assert.equal(config.api_host, 'https://us.i.posthog.com');
  assert.equal(config.autocapture, false);
  assert.equal(config.capture_pageview, false);
  assert.equal(config.disable_session_recording, true);
  const event = {event: '$pageview', properties: {$current_url: 'https://blackstarentertainment.org/?email=private@example.com',
    $referrer: 'https://search.example/path?secret=1', email: 'private@example.com', $device_type: 'Mobile'}};
  const clean = config.before_send(event);
  assert.equal(clean.properties.route, '/');
  assert.equal(clean.properties.referrer_domain, 'search.example');
  assert.equal(clean.properties.$device_type, 'Mobile');
  assert.doesNotMatch(JSON.stringify(clean), /private@example.com|secret=1|\$current_url|\$referrer/);
  assert.equal(config.before_send({event: '$autocapture', properties: {}}), null);
});
