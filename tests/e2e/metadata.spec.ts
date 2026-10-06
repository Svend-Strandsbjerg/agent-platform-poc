import { expect, test } from '@playwright/test';

test('metadata shows loading then renders API values while health and readiness work', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/meta', async route => {
    expect(route.request().method()).toBe('GET');
    await pending;
    await route.fulfill({ json: { name: 'Example application', version: '9.8.7', environment: 'staging' } });
  });
  await page.goto('/');
  await expect(page.locator('#metadata-status')).toHaveText('Loading application metadata…');
  await expect(page.locator('#metadata-details')).toBeHidden();
  await expect(page.locator('#health-status')).toHaveText('Backend is healthy');
  await expect(page.locator('#readiness-status')).toHaveText('Backend is ready');
  release();
  await expect(page.locator('#metadata-details')).toBeVisible();
  await expect(page.locator('#metadata-name')).toHaveText('Example application');
  await expect(page.locator('#metadata-version')).toHaveText('9.8.7');
  await expect(page.locator('#metadata-environment')).toHaveText('staging');
});

for (const failure of ['http', 'network', 'invalid'] as const) {
  test(`metadata shows an error for ${failure} failure without disrupting status retries`, async ({ page }) => {
    await page.route('**/api/meta', route => failure === 'network' ? route.abort()
      : route.fulfill({ status: failure === 'http' ? 503 : 200, json: {} }));
    await page.goto('/');
    await expect(page.locator('#metadata-status')).toHaveText('Application metadata could not be loaded. Select Refresh metadata to try again.');
    await expect(page.locator('#metadata-details')).toBeHidden();
    await page.locator('#refresh').click();
    await page.locator('#refresh-readiness').click();
    await expect(page.locator('#health-status')).toHaveText('Backend is healthy');
    await expect(page.locator('#readiness-status')).toHaveText('Backend is ready');
  });
}

test('renders metadata obtained from the real endpoint', async ({ page }) => {
  const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/meta');
  await page.goto('/');
  const response = await responsePromise;
  expect(response.request().method()).toBe('GET');
  expect(response.status()).toBe(200);
  const metadata = await response.json();
  await expect(page.locator('#metadata-name')).toHaveText(metadata.name);
  await expect(page.locator('#metadata-version')).toHaveText(metadata.version);
  await expect(page.locator('#metadata-environment')).toHaveText(metadata.environment);
  await expect(page.locator('#metadata-details')).toBeVisible();
});
