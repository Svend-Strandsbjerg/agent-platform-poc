import { expect, test } from '@playwright/test';

test('loads healthy and ready statuses and retries both checks', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', error => browserErrors.push(error.message));

  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Agent Platform · Status');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const health = page.locator('#health-status');
  const readiness = page.locator('#readiness-status');
  const retryHealth = page.getByRole('button', { name: 'Check again', exact: true });
  const retryReadiness = page.getByRole('button', { name: 'Check readiness again', exact: true });

  await expect(health).toHaveText('Backend is healthy');
  await expect(readiness).toHaveText('Backend is ready');
  await expect(retryHealth).toBeVisible();
  await expect(retryReadiness).toBeVisible();
  await expect(retryHealth).toBeEnabled();
  await expect(retryReadiness).toBeEnabled();

  for (const [button, path, status] of [
    [retryHealth, '/api/health', 'healthy'],
    [retryReadiness, '/api/ready', 'ready'],
  ] as const) {
    const checkResponse = page.waitForResponse(response =>
      new URL(response.url()).pathname === path && response.request().method() === 'GET');
    await button.click();
    const result = await checkResponse;
    expect(result.status()).toBe(200);
    expect(await result.json()).toEqual({ status });
    await expect(health).toHaveText('Backend is healthy');
    await expect(readiness).toHaveText('Backend is ready');
    await expect(retryHealth).toBeEnabled();
    await expect(retryReadiness).toBeEnabled();
  }

  expect(browserErrors).toEqual([]);
});
