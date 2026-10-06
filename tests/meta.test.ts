import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';

const metadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const app = createApp();
let base: string;
before(async () => {
  await new Promise<void>(resolve => app.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(app.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve, reject) => app.close(error => error ? reject(error) : resolve())));

test('GET /api/meta returns package metadata and the configured or default environment', async t => {
  const originalEnvironment = process.env.NODE_ENV;
  try {
    for (const environment of [undefined, 'development', 'production', 'test']) {
      await t.test(`NODE_ENV=${environment ?? '(unset)'}`, async () => {
        if (environment === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = environment;

        const response = await fetch(`${base}/api/meta`);
        assert.equal(response.status, 200);
        assert.match(response.headers.get('content-type')!, /application\/json/);
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.equal(metadata.name, 'agent-platform-poc');
        assert.deepEqual(await response.json(), {
          name: metadata.name,
          version: metadata.version,
          environment: environment ?? 'development',
        });
      });
    }
  } finally {
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
  }
});

test('metadata rejects unsupported methods', async () => {
  const response = await fetch(`${base}/api/meta`, { method: 'POST' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});
