export type ReadinessState = 'ready' | 'unavailable';

export async function fetchReadiness(fetcher: typeof fetch = fetch): Promise<ReadinessState> {
  try {
    const response = await fetcher('/api/ready', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return 'unavailable';
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null && 'status' in body && body.status === 'ready'
      ? 'ready' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function refreshReadiness(status: HTMLElement, button: HTMLButtonElement, lastChecked: HTMLTimeElement, fetcher: typeof fetch = fetch) {
  button.disabled = true;
  status.dataset.state = 'checking';
  status.textContent = 'Checking readiness…';
  const readiness = await fetchReadiness(fetcher);
  status.dataset.state = readiness;
  status.textContent = readiness === 'ready' ? 'Backend is ready' : 'Readiness unavailable. Try again.';
  if (readiness === 'ready') {
    const checkedAt = new Date();
    lastChecked.dateTime = checkedAt.toISOString();
    lastChecked.textContent = `Last checked: ${checkedAt.toLocaleString()}`;
    lastChecked.hidden = false;
  }
  button.disabled = false;
}
