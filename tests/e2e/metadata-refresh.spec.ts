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
  test(`failed ${failure} refresh allows retry with new metadata and preserves Health and Readiness`, async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#metadata-details')).toBeVisible();
    let requests = 0;
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/meta', async route => {
      expect(route.request().method()).toBe('GET');
      requests++;
      if (requests === 1) {
        if (failure === 'network') await route.abort();
        else await route.fulfill({ status: failure === 'http' ? 503 : 200, json: {} });
        return;
      }
      await pending;
      await route.fulfill({ json: { name: 'Recovered app', version: '7.8.9', environment: 'recovery' } });
    });
    const button = page.getByRole('button', { name: 'Refresh metadata', exact: true });
    await button.click();
    await expect(page.locator('#metadata-status')).toHaveText('Application metadata could not be loaded. Select Refresh metadata to try again.');
    await expect(page.locator('#metadata-details')).toBeHidden();
    await expect(button).toBeEnabled();
    await button.click();
    await expect(button).toBeDisabled();
    await expect(page.locator('#metadata-status')).toHaveText('Loading application metadata…');
    await expect(page.locator('#metadata-details')).toBeHidden();
    release();
    await expect(page.locator('#metadata-name')).toHaveText('Recovered app');
    await expect(page.locator('#metadata-version')).toHaveText('7.8.9');
    await expect(page.locator('#metadata-environment')).toHaveText('recovery');
    await expect(page.locator('#metadata-details')).toBeVisible();
    await expect(page.locator('#metadata-status')).toHaveText('Application metadata loaded.');
    await expect(button).toBeEnabled();
    expect(requests).toBe(2);
    await page.locator('#refresh').click();
    await page.locator('#refresh-readiness').click();
    await expect(page.locator('#health-status')).toHaveText('Backend is healthy');
    await expect(page.locator('#readiness-status')).toHaveText('Backend is ready');
  });
}
