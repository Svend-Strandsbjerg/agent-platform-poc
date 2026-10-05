export type HealthState = 'healthy' | 'unavailable';

export async function fetchHealth(fetcher: typeof fetch = fetch): Promise<HealthState> {
  try {
    const response = await fetcher('/api/health', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return 'unavailable';
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null && 'status' in body && body.status === 'healthy'
      ? 'healthy' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function refreshHealth(status: HTMLElement, button: HTMLButtonElement, fetcher: typeof fetch = fetch) {
  button.disabled = true;
  status.dataset.state = 'checking';
  status.textContent = 'Checking backend…';
  const health = await fetchHealth(fetcher);
  status.dataset.state = health;
  status.textContent = health === 'healthy' ? 'Backend is healthy' : 'Backend unavailable. Try again.';
  button.disabled = false;
}
