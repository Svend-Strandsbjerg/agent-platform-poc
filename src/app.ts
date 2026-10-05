import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const assets = new Map([
  ['/', { file: new URL('../public/index.html', import.meta.url), type: 'text/html; charset=utf-8' }],
  ['/styles.css', { file: new URL('../public/styles.css', import.meta.url), type: 'text/css; charset=utf-8' }],
  ['/client/main.js', { file: new URL('./client/main.js', import.meta.url), type: 'text/javascript; charset=utf-8' }],
  ['/client/health.js', { file: new URL('./client/health.js', import.meta.url), type: 'text/javascript; charset=utf-8' }],
]);

export function createApp() {
  return createServer(async (request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (request.method !== 'GET') {
      response.writeHead(405, { Allow: 'GET' }).end('Method not allowed');
      return;
    }
    if (path === '/api/health') {
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ status: 'healthy' }));
      return;
    }
    const asset = assets.get(path);
    if (!asset) {
      response.writeHead(404).end('Not found');
      return;
    }
    try {
      const body = await readFile(asset.file);
      response.writeHead(200, { 'Content-Type': asset.type }).end(body);
    } catch {
      response.writeHead(500).end('Unable to load application asset');
    }
  });
}
