import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchMetadata, loadMetadata } from '../src/client/metadata.js';

const metadata = { name: 'example-app', version: '2.3.4', environment: 'staging' };
const reply = (body: string, status = 200): typeof fetch => async () => new Response(body, { status });

test('metadata requests GET /api/meta without caching and validates its response', async () => {
  assert.deepEqual(await fetchMetadata(async (url, options) => {
    assert.equal(url, '/api/meta');
    assert.equal(options?.cache, 'no-store');
    assert.ok(options?.signal);
    return new Response(JSON.stringify(metadata));
  }), metadata);
});

test('metadata handles HTTP errors, malformed payloads, network errors and timeouts', async () => {
  for (const fetcher of [
    reply('{}', 503), reply('invalid JSON'), reply('null'), reply('{}'),
    reply(JSON.stringify({ ...metadata, version: 123 })),
    reply(JSON.stringify({ name: 'app', version: '1' })),
    async () => { throw new TypeError('network failed'); },
    async () => { throw new DOMException('timeout', 'TimeoutError'); },
  ]) assert.equal(await fetchMetadata(fetcher), null);
});

test('metadata renders loading, API values, and a clear error without showing stale details', async () => {
  const element = () => ({ textContent: '', hidden: false }) as HTMLElement;
  const status = element(), details = element(), name = element(), version = element(), environment = element();
  const button = { disabled: false } as HTMLButtonElement;
  let resolve!: (response: Response) => void;
  const pending = loadMetadata(status, details, name, version, environment, button,
    () => new Promise<Response>(r => { resolve = r; }));
  assert.equal(status.textContent, 'Loading application metadata…');
  assert.equal(details.hidden, true);
  assert.equal(button.disabled, true);
  resolve(new Response(JSON.stringify(metadata)));
  await pending;
  assert.equal(name.textContent, metadata.name);
  assert.equal(version.textContent, metadata.version);
  assert.equal(environment.textContent, metadata.environment);
  assert.equal(details.hidden, false);
  assert.equal(status.textContent, 'Application metadata loaded.');
  assert.equal(button.disabled, false);
  const updated = { name: 'updated-app', version: '3.0.0', environment: 'production' };
  await loadMetadata(status, details, name, version, environment, button, reply(JSON.stringify(updated)));
  assert.equal(name.textContent, updated.name);
  assert.equal(version.textContent, updated.version);
  assert.equal(environment.textContent, updated.environment);
  assert.equal(button.disabled, false);
  await loadMetadata(status, details, name, version, environment, button, reply('{}', 503));
  assert.equal(details.hidden, true);
  assert.equal(status.textContent, 'Application metadata could not be loaded. Select Refresh metadata to try again.');
  assert.equal(button.disabled, false);
  const recovered = { name: 'recovered-app', version: '4.0.0', environment: 'recovery' };
  const retry = loadMetadata(status, details, name, version, environment, button,
    () => new Promise<Response>(r => { resolve = r; }));
  assert.equal(button.disabled, true);
  assert.equal(details.hidden, true);
  assert.equal(status.textContent, 'Loading application metadata…');
  resolve(new Response(JSON.stringify(recovered)));
  await retry;
  assert.equal(button.disabled, false);
  assert.equal(details.hidden, false);
  assert.equal(status.textContent, 'Application metadata loaded.');
  assert.equal(name.textContent, recovered.name);
  assert.equal(version.textContent, recovered.version);
  assert.equal(environment.textContent, recovered.environment);
});
