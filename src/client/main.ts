import { loadMetadata } from './metadata.js';
import { refreshReadiness } from './readiness.js';
import { refreshHealth } from './health.js';

const status = document.querySelector<HTMLElement>('#health-status')!;
const button = document.querySelector<HTMLButtonElement>('#refresh')!;
const healthLastChecked = document.querySelector<HTMLTimeElement>('#health-last-checked')!;
button.addEventListener('click', () => void refreshHealth(status, button, healthLastChecked));
void refreshHealth(status, button, healthLastChecked);

const readiness = document.querySelector<HTMLElement>('#readiness-status')!;
const readinessButton = document.querySelector<HTMLButtonElement>('#refresh-readiness')!;
const readinessLastChecked = document.querySelector<HTMLTimeElement>('#readiness-last-checked')!;
readinessButton.addEventListener('click', () => void refreshReadiness(readiness, readinessButton, readinessLastChecked));
void refreshReadiness(readiness, readinessButton, readinessLastChecked);


void loadMetadata(
  document.querySelector<HTMLElement>('#metadata-status')!,
  document.querySelector<HTMLElement>('#metadata-details')!,
  document.querySelector<HTMLElement>('#metadata-name')!,
  document.querySelector<HTMLElement>('#metadata-version')!,
  document.querySelector<HTMLElement>('#metadata-environment')!,
);
