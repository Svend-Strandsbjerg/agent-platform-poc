import { expect, test } from '@playwright/test';

test('refresh fetches new metadata, disables while loading, and enables after success', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Refresh metadata', exact: true });
  await expect(page.locator('#metadata-details')).toBeVisible();
  await expect(button).toBeEnabled();
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  let requests = 0;
  await page.route('**/api/meta', async route => {
    expect(route.request().method()).toBe('GET');
    requests++;
    await pending;
    await route.fulfill({ json: { name: `Updated app ${requests}`, version: '4.5.6', environment: 'production' } });
  });
  await button.click();
  await expect(button).toBeDisabled();
  await expect(page.locator('#metadata-status')).toHaveText('Loading application metadata…');
  await expect(page.locator('#metadata-details')).toBeHidden();
  release();
  await expect(page.locator('#metadata-name')).toHaveText('Updated app 1');
  await expect(page.locator('#metadata-version')).toHaveText('4.5.6');
  await expect(page.locator('#metadata-environment')).toHaveText('production');
  await expect(page.locator('#metadata-details')).toBeVisible();
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator('#metadata-name')).toHaveText('Updated app 2');
  await expect(button).toBeEnabled();
  expect(requests).toBe(2);
  expect(errors).toEqual([]);
});

for (const failure of ['http', 'network', 'invalid'] as const) {
  test(`failed ${failure} refresh hides stale metadata and preserves Health and Readiness`, async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#metadata-details')).toBeVisible();
    await page.route('**/api/meta', route => failure === 'network' ? route.abort()
      : route.fulfill({ status: failure === 'http' ? 503 : 200, json: {} }));
    await page.getByRole('button', { name: 'Refresh metadata', exact: true }).click();
    await expect(page.locator('#metadata-status')).toHaveText('Application metadata could not be loaded. Reload the page to try again.');
    await expect(page.locator('#metadata-details')).toBeHidden();
    await page.locator('#refresh').click();
    await page.locator('#refresh-readiness').click();
    await expect(page.locator('#health-status')).toHaveText('Backend is healthy');
    await expect(page.locator('#readiness-status')).toHaveText('Backend is ready');
  });
}
