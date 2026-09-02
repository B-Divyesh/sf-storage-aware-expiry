import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

function futureDate(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

test('@claim:location-defaults changes the suggested date by storage place', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#location').selectOption('fridge');
  await expect(page.locator('#planned-date')).toHaveValue(futureDate(5));
  await page.locator('#location').selectOption('freezer');
  await expect(page.locator('#planned-date')).toHaveValue(futureDate(90));
});

test('@claim:use-first-order puts the earliest planned date first', async ({ page }) => {
  await page.goto('/demo');
  const names = page.locator('.item-ticket h3');
  await expect(names.first()).toHaveText('Plain yogurt');
  await expect(names.nth(1)).toHaveText('Baby spinach');
});

test('@claim:csv-export exports all sample records', async ({ page }) => {
  await page.goto('/settings?demo=1');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export list as CSV' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let content = '';
  for await (const chunk of stream!) content += chunk.toString();
  expect(download.suggestedFilename()).toBe('storage-aware-expiry.csv');
  expect(content.split('\n')).toHaveLength(6);
  expect(content).toContain('"Lentil soup"');
});

test('@claim:print-label creates a printable freezer label', async ({ page }) => {
  await page.goto('/demo');
  const soup = page.locator('.item-ticket', { hasText: 'Lentil soup' });
  await soup.getByRole('link', { name: 'Print' }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-label')).toBeVisible();
  await expect(page.locator('.print-label')).toContainText('Lentil soup');
  await expect(page.locator('.print-label')).toContainText('Use by');
});

test('@claim:local-only sends no inventory data off origin', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', request => origins.add(new URL(request.url()).origin));
  await page.goto('/demo');
  await page.locator('#item-name').fill('Leftover dal');
  await page.getByRole('button', { name: 'Add item to the list' }).click();
  await expect(page.getByText('Leftover dal').first()).toBeVisible();
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:offline-reload works offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Use what needs attention first');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Baby spinach').first()).toBeVisible();
  await expect(page.getByText(/Offline — saved items/)).toBeVisible();
  await context.close();
});

test('@claim:free-limit stops a twenty-first active item', async ({ page }) => {
  await page.goto('/');
  for (let index = 1; index <= 20; index += 1) {
    await page.locator('#item-name').fill(`Stored item ${index}`);
    await page.getByRole('button', { name: 'Add item to the list' }).click();
    await expect(page.locator('.item-ticket')).toHaveCount(index);
  }
  await page.locator('#item-name').fill('Stored item 21');
  await page.getByRole('button', { name: 'Add item to the list' }).click();
  await expect(page.locator('#form-error')).toContainText('20 active items');
  await expect(page.locator('.item-ticket')).toHaveCount(20);
});

test('@claim:paid-license adds batch printing and removes the active-item limit', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:storage-aware-expiry', 'test-license');
    localStorage.setItem('sb_license_verdict:storage-aware-expiry', JSON.stringify({ valid: true, checkedAt: Date.now() }));
  });
  await page.goto('/');
  for (let index = 1; index <= 21; index += 1) {
    await page.locator('#item-name').fill(`Licensed item ${index}`);
    await page.getByRole('button', { name: 'Add item to the list' }).click();
    await expect(page.locator('.item-ticket')).toHaveCount(index);
  }
  await expect(page.locator('.item-ticket')).toHaveCount(21);
  await page.goto('/settings');
  await expect(page.getByRole('link', { name: 'Print all active labels' })).toBeVisible();
  await page.getByRole('link', { name: 'Print all active labels' }).click();
  await expect(page.locator('.print-label')).toHaveCount(21);
});

test('@claim:checkout-unavailable regression: unavailable checkout is not advertised or linked', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Household license checkout is currently unavailable.')).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /buy a household license/i })).toHaveCount(0);
});

test('@claim:item-workflow adds, edits, completes, and restores an item', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#item-name').fill('Tomato sauce');
  await page.locator('#quantity').fill('1 jar');
  await page.locator('#location').selectOption('pantry');
  await page.getByRole('button', { name: 'Add item to the list' }).click();
  const ticket = page.locator('.item-ticket', { hasText: 'Tomato sauce' });
  await expect(ticket).toBeVisible();
  await ticket.getByRole('button', { name: 'Edit' }).click();
  await page.locator('#quantity').fill('2 jars');
  await page.locator('#location').selectOption('freezer');
  await expect(page.locator('#stored-on')).toHaveValue(futureDate(0));
  await expect(page.locator('#planned-date')).toHaveValue(futureDate(90));
  await page.getByRole('button', { name: 'Save item changes' }).click();
  await expect(page.locator('.item-ticket', { hasText: 'Tomato sauce' })).toContainText('2 jars');
  await page.locator('.item-ticket', { hasText: 'Tomato sauce' }).getByRole('button', { name: 'Mark used' }).click();
  await expect(page.locator('.item-ticket', { hasText: 'Tomato sauce' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.item-ticket', { hasText: 'Tomato sauce' })).toBeVisible();
});

test('pages have one h1, keyboard focus, and no serious axe findings', async ({ page }) => {
  for (const path of ['/', '/demo', '/settings', '/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    const serious = results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''));
    expect(serious, `${path}: ${serious.map(item => item.id).join(', ')}`).toEqual([]);
  }
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
});

test('@claim:demo-isolation resets sample items and does not enter real data', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#item-name').fill('Temporary item');
  await page.getByRole('button', { name: 'Add item to the list' }).click();
  await expect(page.locator('.item-ticket')).toHaveCount(6);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.item-ticket')).toHaveCount(5);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.locator('.item-ticket')).toHaveCount(0);
});

test('load produces no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/demo');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('@claim:json-backup exports and imports a JSON backup', async ({ page }) => {
  await page.goto('/settings?demo=1');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON backup' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('storage-aware-expiry-backup.json');
  const backup = {
    version: 1,
    presets: { pantry: 14, fridge: 4, freezer: 120 },
    items: [{ id: 'imported', name: 'Coconut curry', quantity: '2 portions', location: 'freezer', storedOn: futureDate(0), frozenOn: futureDate(0), plannedDate: futureDate(120), note: 'Imported', createdAt: new Date().toISOString() }]
  };
  await page.locator('#import-json').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.locator('#import-status')).toContainText('1 items were imported');
  await page.goto('/demo');
  await expect(page.getByText('Coconut curry').first()).toBeVisible();
});

test('@claim:preset-settings saves user date presets', async ({ page }) => {
  await page.goto('/settings?demo=1');
  await page.locator('#preset-freezer').fill('120');
  await page.getByRole('button', { name: 'Save date presets' }).click();
  await page.goto('/demo');
  await expect(page.locator('#planned-date')).toHaveValue(futureDate(120));
});

test('dark theme and 390px layout pass accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/demo');
  const results = await new AxeBuilder({ page: page as never }).analyze();
  const serious = results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''));
  expect(serious).toEqual([]);
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
  await expect(page.locator('#item-name')).toBeVisible();
});

test('regression: every visible mobile target is at least 44px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/demo', '/settings?demo=1', '/privacy', '/terms']) {
    await page.goto(path);
    const undersized = await page.locator('a[href], button, input:not([type="hidden"]), select, textarea').evaluateAll(elements => elements
      .filter(element => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
      })
      .map(element => {
        const rect = element.getBoundingClientRect();
        return { label: (element.textContent || element.getAttribute('aria-label') || element.id).trim(), width: rect.width, height: rect.height };
      })
      .filter(target => target.width < 44 || target.height < 44));
    expect(undersized, `${path}: ${JSON.stringify(undersized)}`).toEqual([]);
  }
});

test('regression: production assets are fingerprinted and configured for immutable caching', async () => {
  const root = process.cwd();
  const [index, worker, config] = await Promise.all([
    readFile(join(root, 'dist/index.html'), 'utf8'),
    readFile(join(root, 'dist/sw.js'), 'utf8'),
    readFile(join(root, 'dist/staticwebapp.config.json'), 'utf8')
  ]);
  expect(index).toMatch(/assets\/index-[a-zA-Z0-9_-]+\.js/);
  expect(index).toMatch(/assets\/index-[a-zA-Z0-9_-]+\.css/);
  expect(worker).not.toContain('/assets/app.js');
  expect(worker).not.toContain('/assets/app.css');
  expect(worker).toMatch(/assets\/index-[a-zA-Z0-9_-]+\.js/);
  expect(config).toContain('public, max-age=31536000, immutable');
  expect(config).toContain('"route": "/sw.js"');
});
