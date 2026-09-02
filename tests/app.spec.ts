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
  await soup.first().getByRole('link', { name: 'Print label for Lentil soup' }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-label')).toBeVisible();
  await expect(page.locator('.print-label')).toContainText('Lentil soup');
  await expect(page.locator('.print-label')).toContainText('Planned for');
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
  await ticket.getByRole('button', { name: 'Edit Tomato sauce' }).click();
  await page.locator('#quantity').fill('2 jars');
  await page.locator('#location').selectOption('freezer');
  await expect(page.locator('#stored-on')).toHaveValue(futureDate(0));
  await expect(page.locator('#planned-date')).toHaveValue(futureDate(90));
  await page.getByRole('button', { name: 'Save item changes' }).click();
  await expect(page.locator('.item-ticket', { hasText: 'Tomato sauce' })).toContainText('2 jars');
  await page.locator('.item-ticket', { hasText: 'Tomato sauce' }).getByRole('button', { name: 'Mark Tomato sauce used' }).click();
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

test('@claim:demo-isolation resets sample items without touching real inventory or license state', async ({ page }) => {
  const realLicense = 'real-license-fixture';
  const realVerdict = JSON.stringify({ valid: true, checkedAt: 123456789 });
  await page.addInitScript(({ licenseKey, cacheKey, license, verdict }) => {
    localStorage.setItem(licenseKey, license);
    localStorage.setItem(cacheKey, verdict);
  }, { licenseKey: 'sb_license:storage-aware-expiry', cacheKey: 'sb_license_verdict:storage-aware-expiry', license: realLicense, verdict: realVerdict });
  await page.goto('/demo');
  await expect(page.getByText('Your existing household license is active on this browser.')).toHaveCount(0);
  await expect(page.locator('#license-token')).toHaveCount(0);
  await expect(page.evaluate(() => ({
    license: localStorage.getItem('sb_license:storage-aware-expiry'),
    verdict: localStorage.getItem('sb_license_verdict:storage-aware-expiry')
  }))).resolves.toEqual({ license: realLicense, verdict: realVerdict });
  await page.goto('/settings?demo=1');
  await expect(page.getByText('Household license')).toHaveCount(0);
  await expect(page.evaluate(() => ({
    license: localStorage.getItem('sb_license:storage-aware-expiry'),
    verdict: localStorage.getItem('sb_license_verdict:storage-aware-expiry')
  }))).resolves.toEqual({ license: realLicense, verdict: realVerdict });
  await page.goto('/demo?license=demo-write-token');
  await expect(page.getByText('Your existing household license is active on this browser.')).toHaveCount(0);
  await expect(page.evaluate(() => ({
    license: localStorage.getItem('sb_license:storage-aware-expiry'),
    verdict: localStorage.getItem('sb_license_verdict:storage-aware-expiry')
  }))).resolves.toEqual({ license: realLicense, verdict: realVerdict });
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
  await page.locator('#preset-pantry').fill('14');
  await page.getByRole('button', { name: 'Save date presets' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON backup' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('storage-aware-expiry-backup.json');
  const stream = await download.createReadStream();
  let raw = '';
  for await (const chunk of stream!) raw += chunk.toString();
  const backup = JSON.parse(raw) as { version: number; presets: { pantry: number; fridge: number; freezer: number }; items: Array<{ name: string }> };
  expect(backup.version).toBe(1);
  expect(backup.presets).toEqual({ pantry: 14, fridge: 5, freezer: 90 });
  expect(backup.items).toHaveLength(5);
  expect(backup.items.map(item => item.name)).toEqual(expect.arrayContaining(['Baby spinach', 'Lentil soup', 'Plain yogurt', 'Summer berries', 'Brown rice']));
  await page.evaluate(() => sessionStorage.removeItem('demo:storage-aware-expiry:v1'));
  await page.reload();
  await page.locator('#import-json').setInputFiles({ name: 'storage-aware-expiry-backup.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
  await expect(page.locator('#import-status')).toContainText('5 items were imported');
  await page.goto('/demo');
  await expect(page.locator('#preset-pantry')).toHaveCount(0);
  await expect(page.locator('.item-ticket')).toHaveCount(5);
  await expect(page.getByText('Lentil soup').first()).toBeVisible();
  await page.goto('/settings?demo=1');
  await expect(page.locator('#preset-pantry')).toHaveValue('14');
});

test('@claim:real-persistence keeps a saved item after reload and in a second page', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#item-name').fill('Reloaded chili');
  await page.getByRole('button', { name: 'Add item to the list' }).click();
  await page.reload();
  await expect(page.locator('.item-ticket', { hasText: 'Reloaded chili' })).toBeVisible();
  const secondPage = await context.newPage();
  await secondPage.goto('http://127.0.0.1:4173/');
  await expect(secondPage.locator('.item-ticket', { hasText: 'Reloaded chili' })).toBeVisible();
  await context.close();
});

test('@claim:license-verification checks only the pasted token with Sociobot and reports valid or invalid results', async ({ page }) => {
  const requests: Array<{ url: URL; body: string | null }> = [];
  let valid = true;
  await page.route('https://api.sociobot.in/api/v1/products/storage-aware-expiry/verify?**', async route => {
    requests.push({ url: new URL(route.request().url()), body: route.request().postData() });
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ valid, reason: valid ? 'ok' : 'invalid' }) });
  });
  await page.goto('/settings');
  await page.locator('#license-token').fill('valid-fixture-token');
  await page.getByRole('button', { name: 'Check existing license' }).click();
  await expect(page.getByText('Your existing household license is active on this browser.')).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].url.searchParams.get('license')).toBe('valid-fixture-token');
  expect([...requests[0].url.searchParams.keys()]).toEqual(['license']);
  expect(requests[0].body).toBeNull();
  valid = false;
  await page.locator('#license-token').fill('invalid-fixture-token');
  await page.getByRole('button', { name: 'Check existing license' }).click();
  await expect(page.getByText('The free plan holds 20 active items. Household license checkout is currently unavailable.')).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1].url.searchParams.get('license')).toBe('invalid-fixture-token');
});

test('@claim:editable-optional-fields saves a manual planned date and blank optional fields', async ({ page }) => {
  const frozenOn = futureDate(-7);
  const planned = futureDate(16);
  await page.goto('/demo');
  await page.locator('#item-name').fill('Unseasoned stock');
  await page.locator('#quantity').fill('');
  await page.locator('#location').selectOption('freezer');
  await page.locator('#stored-on').fill(frozenOn);
  await page.locator('#planned-date').fill(planned);
  await page.locator('#note').fill('');
  await page.getByRole('button', { name: 'Add item to the list' }).click();
  await page.reload();
  const ticket = page.locator('.item-ticket', { hasText: 'Unseasoned stock' });
  await expect(ticket).toContainText('Quantity not set');
  await ticket.getByRole('button', { name: 'Edit Unseasoned stock' }).click();
  await expect(page.locator('#stored-on')).toHaveValue(frozenOn);
  await expect(page.locator('#planned-date')).toHaveValue(planned);
  await expect(page.locator('#quantity')).toHaveValue('');
  await expect(page.locator('#note')).toHaveValue('');
});

test('@claim:limited-scope states that this planner does not scan, track nutrition, or follow purchases', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('It does not scan barcodes, track nutrition, or follow every purchase.')).toBeVisible();
});

test('regression: demo shows a sample item inside the first 390px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  await expect(page.locator('.item-ticket').first()).toBeVisible();
  const visible = await page.locator('.item-ticket').evaluateAll(items => items.slice(0, 3).some(item => {
    const rect = item.getBoundingClientRect();
    return rect.top < innerHeight && rect.bottom > 0;
  }));
  expect(visible).toBe(true);
  await expect(page.locator('.item-ticket').first()).toContainText('Planned for');
  await expect(page.locator('.item-ticket').first().getByRole('button', { name: /Mark .* used/ })).toBeVisible();
  await expect(page.locator('.item-ticket').first().getByRole('button', { name: /Edit / })).toBeVisible();
  await expect(page.locator('.item-ticket').first().getByRole('link', { name: /Print label for/ })).toBeVisible();
});

test('regression: every application route has route-specific metadata and the static 404 policy', async ({ page, request }) => {
  const routes = [
    ['/', 'Storage-Aware Expiry — Plan what to use first'], ['/demo', 'Demo — Storage-Aware Expiry'], ['/settings', 'Settings — Storage-Aware Expiry'],
    ['/privacy', 'Privacy — Storage-Aware Expiry'], ['/terms', 'Terms — Storage-Aware Expiry'], ['/print/sample-soup?demo=1', 'Print labels — Storage-Aware Expiry'], ['/not-a-real-page', 'Page not found — Storage-Aware Expiry']
  ];
  for (const [route, title] of routes) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(canonical).toBe(ogUrl);
    const expectedPath = route.startsWith('/not-a-real-page') ? '/404' : route.split('?')[0];
    expect(ogUrl).toContain(expectedPath === '/' ? 'sociobot.in/' : expectedPath);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  }
  const static404 = await request.get('/404.html');
  expect(static404.ok()).toBe(true);
  expect(await static404.text()).toContain('<h1>Page not found</h1>');
  const config = JSON.parse(await readFile(join(process.cwd(), 'dist/staticwebapp.config.json'), 'utf8')) as { responseOverrides: Record<string, { rewrite: string }>; navigationFallback?: unknown; routes: Array<{ route: string; rewrite?: string }> };
  expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
  expect(config.navigationFallback).toBeUndefined();
  for (const route of ['/demo', '/settings', '/privacy', '/terms', '/print-all', '/print/*']) {
    expect(config.routes).toContainEqual({ route, rewrite: '/index.html' });
  }
});

test('regression: every public footer points to the live Param Factory storefront', async ({ page, request }) => {
  const storefront = 'https://hello-factory.sociobot.in/';
  const publicRoutes = ['/', '/demo', '/settings', '/privacy', '/terms', '/print/sample-soup?demo=1'];
  const crawledLinks = new Set<string>();

  for (const route of publicRoutes) {
    await page.goto(route);
    const footerLink = page.getByRole('link', { name: 'Built by Param Factory (external site)' });
    await expect(footerLink).toHaveAttribute('href', storefront);
    await expect(page.locator('a[href*="hello.sociobot.in"]')).toHaveCount(0);
    for (const href of await page.locator('a[href]').evaluateAll(links => [...new Set(links.map(link => (link as HTMLAnchorElement).href))])) {
      if (/^https?:\/\//.test(href)) crawledLinks.add(href);
    }
  }

  const static404 = await request.get('/404.html');
  expect(static404.ok()).toBe(true);
  const static404Html = await static404.text();
  expect(static404Html).toContain(`href="${storefront}"`);
  expect(static404Html).not.toContain('hello.sociobot.in');

  // This reproduces the verifier's link crawl: every rendered HTTP(S) link
  // must resolve successfully, not merely appear in the markup. Mail links
  // are intentionally excluded because they do not have an HTTP response.
  for (const href of crawledLinks) {
    const response = await request.get(href, { maxRedirects: 5, timeout: 15_000 });
    expect(response.ok(), href).toBe(true);
  }
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
