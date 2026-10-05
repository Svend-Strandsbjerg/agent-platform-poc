import { refreshReadiness } from './readiness.js';
import { refreshHealth } from './health.js';

const status = document.querySelector<HTMLElement>('#health-status')!;
const button = document.querySelector<HTMLButtonElement>('#refresh')!;
button.addEventListener('click', () => void refreshHealth(status, button));
void refreshHealth(status, button);

const readiness = document.querySelector<HTMLElement>('#readiness-status')!;
const readinessButton = document.querySelector<HTMLButtonElement>('#refresh-readiness')!;
readinessButton.addEventListener('click', () => void refreshReadiness(readiness, readinessButton));
void refreshReadiness(readiness, readinessButton);
