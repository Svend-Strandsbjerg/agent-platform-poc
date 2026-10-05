import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchHealth, refreshHealth } from '../src/client/health.js';

const reply = (body: string, status = 200): typeof fetch => async () => new Response(body, { status });

test('frontend requests the health endpoint and recognizes a healthy response', async () => {
  const fetcher: typeof fetch = async (url, options) => {
    assert.equal(url, '/api/health');
    assert.equal(options?.cache, 'no-store');
    assert.ok(options?.signal);
    return new Response('{"status":"healthy"}');
  };
  assert.equal(await fetchHealth(fetcher), 'healthy');
});
test('frontend handles failed responses, malformed JSON, and unexpected payloads', async () => {
  for (const fetcher of [reply('{}', 503), reply('not json'), reply('null'), reply('{}'), reply('{"status":"unknown"}')]) {
    assert.equal(await fetchHealth(fetcher), 'unavailable');
  }
});
test('frontend handles network errors and timeouts', async () => {
  for (const error of [new TypeError('network failed'), new DOMException('timeout', 'TimeoutError')]) {
    assert.equal(await fetchHealth(async () => { throw error; }), 'unavailable');
  }
});
test('refresh displays loading, failure, and recovery while controlling the button', async () => {
  const status = { dataset: {}, textContent: '' } as unknown as HTMLElement;
  const button = { disabled: false } as HTMLButtonElement;
  let resolve!: (response: Response) => void;
  const pending = refreshHealth(status, button, () => new Promise<Response>(r => { resolve = r; }));
  assert.equal(button.disabled, true);
  assert.equal(status.textContent, 'Checking backend…');
  resolve(new Response('{}', { status: 503 }));
  await pending;
  assert.equal(status.dataset.state, 'unavailable');
  assert.equal(status.textContent, 'Backend unavailable. Try again.');
  assert.equal(button.disabled, false);
  await refreshHealth(status, button, reply('{"status":"healthy"}'));
  assert.equal(status.textContent, 'Backend is healthy');
  assert.equal(status.dataset.state, 'healthy');
  assert.equal(button.disabled, false);
});
