# Agent Platform POC

A small Node.js + TypeScript application. One HTTP server serves a static frontend
and `GET /api/health`, which returns `200` with `{ "status": "healthy" }`.
The page checks the backend on load and offers a **Check again** button. Failed
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

Tests cover the real HTTP health endpoint, static page serving, unknown routes,
unsupported methods, and frontend health loading, error, and recovery logic.
Tests use an ephemeral local port and do not require a running application.

## Layout

- `src/app.ts`: HTTP handler and explicit public asset routes.
- `src/server.ts`: server entry point.
- `src/client/`: browser TypeScript and health state logic.
- `public/`: HTML and CSS.
- `tests/`: Node test runner tests, executed through `tsx`.

This is an intentionally minimal proof of concept. The health endpoint reports
that the server is responding; it does not check external services.
