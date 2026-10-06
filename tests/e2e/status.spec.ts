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

test('successful checks show readable timestamps and refresh independently', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-06T10:00:00Z'));
  await page.goto('/');
  const healthTime = page.locator('#health-last-checked');
  const readinessTime = page.locator('#readiness-last-checked');
  for (const timestamp of [healthTime, readinessTime]) {
    await expect(timestamp).toBeVisible();
    await expect(timestamp).toHaveAttribute('datetime', '2026-10-06T10:00:00.000Z');
    const readable = await page.evaluate(() => new Date().toLocaleString());
    await expect(timestamp).toHaveText(`Last checked: ${readable}`);
  }
  const initialReadiness = await readinessTime.textContent();
  const initialHealth = await healthTime.textContent();
  await page.clock.setFixedTime(new Date('2026-10-06T10:01:00Z'));
  await page.locator('#refresh').click();
  await expect(healthTime).toHaveAttribute('datetime', '2026-10-06T10:01:00.000Z');
  await expect(healthTime).not.toHaveText(initialHealth!);
  await expect(readinessTime).toHaveAttribute('datetime', '2026-10-06T10:00:00.000Z');
  await expect(readinessTime).toHaveText(initialReadiness!);
  const updatedHealth = await healthTime.textContent();
  await page.clock.setFixedTime(new Date('2026-10-06T10:02:00Z'));
  await page.locator('#refresh-readiness').click();
  await expect(readinessTime).toHaveAttribute('datetime', '2026-10-06T10:02:00.000Z');
  await expect(readinessTime).not.toHaveText(initialReadiness!);
  await expect(healthTime).toHaveAttribute('datetime', '2026-10-06T10:01:00.000Z');
  await expect(healthTime).toHaveText(updatedHealth!);
});

test('failed initial checks hide timestamps and retries recover independently', async ({ page }) => {
  await page.route('**/api/health', route => route.fulfill({ status: 503, body: '{}' }));
  await page.route('**/api/ready', route => route.fulfill({ status: 503, body: '{}' }));
  await page.goto('/');
  await expect(page.locator('#health-status')).toHaveText('Backend unavailable. Try again.');
  await expect(page.locator('#readiness-status')).toHaveText('Readiness unavailable. Try again.');
  await expect(page.locator('#health-last-checked')).toBeHidden();
  await expect(page.locator('#readiness-last-checked')).toBeHidden();
  await page.unroute('**/api/health');
  await page.locator('#refresh').click();
  await expect(page.locator('#health-last-checked')).toBeVisible();
  await expect(page.locator('#readiness-last-checked')).toBeHidden();
  await page.unroute('**/api/ready');
  await page.locator('#refresh-readiness').click();
  await expect(page.locator('#readiness-last-checked')).toBeVisible();
});
