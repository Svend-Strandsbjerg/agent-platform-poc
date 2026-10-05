import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';

const app = createApp();
let base: string;
before(async () => {
  await new Promise<void>(resolve => app.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(app.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve, reject) => app.close(error => error ? reject(error) : resolve())));

test('GET /api/health returns healthy JSON without caching', async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type')!, /application\/json/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { status: 'healthy' });
});
test('serves the frontend page and stylesheet', async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /id="health-status"/);
  assert.match(html, /id="readiness-status"/);
  assert.match(html, /id="refresh-readiness"/);
  const style = await fetch(`${base}/styles.css`);
  assert.equal(style.status, 200);
  assert.match(style.headers.get('content-type')!, /text\/css/);
});
test('unknown routes and private files return 404', async () => {
  for (const path of ['/missing', '/package.json', '/.git', '/api/unknown']) {
    assert.equal((await fetch(base + path)).status, 404);
  }
});
test('unsupported methods return 405 with Allow header', async () => {
  const response = await fetch(`${base}/api/health`, { method: 'POST' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});

test('GET /api/ready returns ready JSON without caching', async () => {
  const response = await fetch(`${base}/api/ready`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type')!, /application\/json/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { status: 'ready' });
});
test('readiness rejects unsupported methods', async () => {
  const response = await fetch(`${base}/api/ready`, { method: 'POST' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});
