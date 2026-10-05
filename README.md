# Agent Platform POC

A small Node.js + TypeScript application. One HTTP server serves a static frontend
and `GET /api/health`, which returns `200` with `{ "status": "healthy" }`.
`GET /api/ready` returns `200` with `{ "status": "ready" }`.
The page displays health and readiness independently, checks both on load and offers a retry button for each status. Failed
requests, invalid responses, and requests taking over five seconds show an
unavailable status.

## Setup and development

Requires Node.js 22 or later and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. TypeScript changes compile automatically and restart
the server; refresh the browser to see frontend edits. HTML and CSS are served
directly from `public/`.

## Build and run

```sh
npm run build
npm start
```

Run commands from the repository root. Keep `public/` alongside the compiled
`dist/` directory. The server defaults to `127.0.0.1:3000`; override with `HOST`
and `PORT`, for example `HOST=0.0.0.0 PORT=8080 npm start`.

## Tests

```sh
npm test
```

Tests cover the real HTTP health and readiness endpoints, static page serving, unknown routes,
unsupported methods, and frontend health and readiness loading, error, and recovery logic.
Tests use an ephemeral local port and do not require a running application.

## Layout

- `src/app.ts`: HTTP handler and explicit public asset routes.
- `src/server.ts`: server entry point.
- `src/client/`: browser TypeScript and health state logic.
- `public/`: HTML and CSS.
- `tests/`: Node test runner tests, executed through `tsx`.

This is an intentionally minimal proof of concept. The health endpoint reports
that the server is responding; it does not check external services.

## Browser E2E tests

Use the Chromium browser cache provided by the Paperclip runtime:

```sh
npm ci
npm run build
npm run test:e2e
```

Playwright starts the built application on `127.0.0.1:3101` and stops it after
running headless Chromium with one worker. Keep that port free. The E2E script
sets both proxy exclusion variables to only `127.0.0.1,localhost` so local
server readiness checks work in proxied environments; external hosts still use
the configured proxy. The browser test
loads the real page, checks health and readiness, retries each API check, and
rejects browser console errors and uncaught exceptions. Existing Node tests
remain available through `npm test`.

The E2E script sets `PLAYWRIGHT_BROWSERS_PATH=/srv/agent-platform/playwright-browsers`.
This persistent shared cache survives `npm ci`; no `playwright install` step is
required. Do not download or install Chromium into the task workspace. If the
shared browser is unavailable, or network policy or missing system libraries
block execution, report the missing browser, blocked hostname, or library to
the runtime operator without changing isolation settings.

Failures retain traces, screenshots, and video in `test-results/`. Open the
HTML report with `npx playwright show-report` or a trace with
`npx playwright show-trace <path-to-trace.zip>`.
