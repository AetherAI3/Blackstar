import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet} from '../../functions/api/analytics-config.js';

test('the public token is available only on the production apex', async () => {
  const env = {POSTHOG_PROJECT_TOKEN: 'phc_testpublictoken'};
  const production = await onRequestGet({request: new Request('https://blackstarentertainment.org/api/analytics-config'), env});
  assert.deepEqual(await production.json(), {enabled: true, token: 'phc_testpublictoken'});
  assert.equal(production.headers.get('Cache-Control'), 'no-store');
  const preview = await onRequestGet({request: new Request('https://preview.blackstar-1fa.pages.dev/api/analytics-config'), env});
  assert.deepEqual(await preview.json(), {enabled: false});
  const personal = await onRequestGet({request: new Request('https://blackstarentertainment.org/api/analytics-config'), env: {POSTHOG_PROJECT_TOKEN: 'phx_personal-key'}});
  assert.deepEqual(await personal.json(), {enabled: false});
});
