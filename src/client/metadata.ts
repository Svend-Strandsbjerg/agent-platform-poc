export interface Metadata {
  name: string;
  version: string;
  environment: string;
}

export async function fetchMetadata(fetcher: typeof fetch = fetch): Promise<Metadata | null> {
  try {
    const response = await fetcher('/api/meta', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (typeof body !== 'object' || body === null
      || !('name' in body) || typeof body.name !== 'string'
      || !('version' in body) || typeof body.version !== 'string'
      || !('environment' in body) || typeof body.environment !== 'string') return null;
    return { name: body.name, version: body.version, environment: body.environment };
  } catch {
    return null;
  }
}

export async function loadMetadata(
  status: HTMLElement, details: HTMLElement, name: HTMLElement,
  version: HTMLElement, environment: HTMLElement, fetcher: typeof fetch = fetch,
) {
  status.textContent = 'Loading application metadata…';
  details.hidden = true;
  const metadata = await fetchMetadata(fetcher);
  if (!metadata) {
    status.textContent = 'Application metadata could not be loaded. Reload the page to try again.';
    return;
  }
  name.textContent = metadata.name;
  version.textContent = metadata.version;
  environment.textContent = metadata.environment;
  details.hidden = false;
  status.textContent = 'Application metadata loaded.';
}
