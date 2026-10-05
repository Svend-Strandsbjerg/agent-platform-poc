import { refreshHealth } from './health.js';

const status = document.querySelector<HTMLElement>('#health-status')!;
const button = document.querySelector<HTMLButtonElement>('#refresh')!;
button.addEventListener('click', () => void refreshHealth(status, button));
void refreshHealth(status, button);
