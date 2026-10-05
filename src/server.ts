import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('PORT must be an integer between 0 and 65535');
}
const host = process.env.HOST ?? '127.0.0.1';
createApp().listen(port, host, () => {
  console.log(`Application running at http://${host}:${port}`);
});
