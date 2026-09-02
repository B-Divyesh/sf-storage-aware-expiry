import './styles.css';

type Location = 'pantry' | 'fridge' | 'freezer';
type Filter = 'all' | Location;

interface Item {
  id: string;
  name: string;
  quantity: string;
  location: Location;
  storedOn: string;
  frozenOn?: string;
  plannedDate: string;
  note: string;
  createdAt: string;
  consumedAt?: string;
}

interface Presets { pantry: number; fridge: number; freezer: number }

const DEFAULT_PRESETS: Presets = { pantry: 30, fridge: 5, freezer: 90 };
const DB_NAME = 'storage-aware-expiry-real-v1';
const DEMO_KEY = 'demo:storage-aware-expiry:v1';
const LICENSE_KEY = 'sb_license:storage-aware-expiry';
const LICENSE_CACHE_KEY = 'sb_license_verdict:storage-aware-expiry';
const app = document.querySelector<HTMLDivElement>('#app')!;

let items: Item[] = [];
let presets: Presets = { ...DEFAULT_PRESETS };
let filter: Filter = 'all';
let editId: string | null = null;
let lastConsumed: Item | null = null;
let demoMode = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
let paid = false;

function isDemoUrl(url = new URL(location.href)) {
  return url.pathname === '/demo' || url.searchParams.get('demo') === '1';
}

function syncDemoMode() {
  demoMode = isDemoUrl();
  // A demo is deliberately not entitled by, or connected to, browser license state.
  if (demoMode) paid = false;
}

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);
const formatDate = (date: string) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
const uid = () => crypto.randomUUID();

function sampleItems(): Item[] {
  const now = today();
  return [
    { id: 'sample-spinach', name: 'Baby spinach', quantity: 'Half bag', location: 'fridge', storedOn: addDays(now, -3), plannedDate: addDays(now, 1), note: 'Use for lunch', createdAt: now },
    { id: 'sample-soup', name: 'Lentil soup', quantity: '2 portions', location: 'freezer', storedOn: addDays(now, -34), frozenOn: addDays(now, -34), plannedDate: addDays(now, 3), note: 'Blue-lid box', createdAt: now },
    { id: 'sample-yogurt', name: 'Plain yogurt', quantity: '1 tub', location: 'fridge', storedOn: addDays(now, -5), plannedDate: now, note: '', createdAt: now },
    { id: 'sample-berries', name: 'Summer berries', quantity: '1 container', location: 'freezer', storedOn: addDays(now, -61), frozenOn: addDays(now, -61), plannedDate: addDays(now, 18), note: 'For porridge', createdAt: now },
    { id: 'sample-rice', name: 'Brown rice', quantity: '1 jar', location: 'pantry', storedOn: addDays(now, -12), plannedDate: addDays(now, 40), note: '', createdAt: now }
  ];
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGetAll(): Promise<Item[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('items').objectStore('items').getAll();
    request.onsuccess = () => resolve(request.result as Item[]);
    request.onerror = () => reject(request.error);
  });
}

async function idbGetPresets(): Promise<Presets> {
  const db = await openDatabase();
  return new Promise((resolve) => {
    const request = db.transaction('settings').objectStore('settings').get('presets');
    request.onsuccess = () => resolve(request.result?.value ?? { ...DEFAULT_PRESETS });
    request.onerror = () => resolve({ ...DEFAULT_PRESETS });
  });
}

async function idbPut(storeName: 'items' | 'settings', value: Item | { key: string; value: Presets }) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function idbDelete(id: string) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('items', 'readwrite');
    transaction.objectStore('items').delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function saveDemo() {
  sessionStorage.setItem(DEMO_KEY, JSON.stringify({ items, presets }));
}

async function saveItem(item: Item) {
  const index = items.findIndex(current => current.id === item.id);
  if (index >= 0) items[index] = item; else items.push(item);
  if (demoMode) saveDemo(); else await idbPut('items', item);
}

async function removeItem(id: string) {
  items = items.filter(item => item.id !== id);
  if (demoMode) saveDemo(); else await idbDelete(id);
}

async function savePresets() {
  if (demoMode) saveDemo(); else await idbPut('settings', { key: 'presets', value: presets });
}

async function loadData() {
  if (demoMode) {
    const stored = sessionStorage.getItem(DEMO_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { items: Item[]; presets: Presets };
        items = parsed.items;
        presets = parsed.presets;
        return;
      } catch { sessionStorage.removeItem(DEMO_KEY); }
    }
    items = sampleItems();
    presets = { ...DEFAULT_PRESETS };
    saveDemo();
    return;
  }
  try {
    [items, presets] = await Promise.all([idbGetAll(), idbGetPresets()]);
  } catch {
    showToast('Stored items could not be opened. Reload the page and try again.');
  }
}

function checkLicenseFromUrl() {
  // This guard must precede every localStorage operation. Demo mode is an
  // isolated sample, including its entitlement state and return URL tokens.
  if (demoMode) {
    paid = false;
    return;
  }
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (token) {
    localStorage.setItem(LICENSE_KEY, token);
    url.searchParams.delete('license');
    history.replaceState({}, '', url.pathname + url.search + url.hash);
  }
  const cached = localStorage.getItem(LICENSE_CACHE_KEY);
  if (cached) {
    try {
      const verdict = JSON.parse(cached) as { valid: boolean; checkedAt: number };
      paid = verdict.valid;
    } catch { localStorage.removeItem(LICENSE_CACHE_KEY); }
  }
}

async function verifyLicense(force = false) {
  // Do not even read real entitlement storage while the demo banner is shown.
  if (demoMode) {
    paid = false;
    return;
  }
  const token = localStorage.getItem(LICENSE_KEY);
  if (!token) return;
  const cachedRaw = localStorage.getItem(LICENSE_CACHE_KEY);
  if (!force && cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw) as { valid: boolean; checkedAt: number };
      if (Date.now() - cached.checkedAt < 86400000) return;
    } catch { /* verify below */ }
  }
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/storage-aware-expiry/verify?license=${encodeURIComponent(token)}`);
    const result = await response.json() as { valid: boolean };
    paid = result.valid === true;
    localStorage.setItem(LICENSE_CACHE_KEY, JSON.stringify({ valid: paid, checkedAt: Date.now() }));
    if (!paid) showToast('This license is no longer active. The free plan still works.');
    render();
  } catch {
    showToast('The license could not be checked. Your last verified access is unchanged.');
  }
}

const pageTitles: Record<string, string> = {
  '/': 'Storage-Aware Expiry — Plan what to use first',
  '/demo': 'Demo — Storage-Aware Expiry',
  '/settings': 'Settings — Storage-Aware Expiry',
  '/privacy': 'Privacy — Storage-Aware Expiry',
  '/terms': 'Terms — Storage-Aware Expiry'
};

const siteUrl = 'https://storage-aware-expiry.sociobot.in';
const routeMetadata: Record<string, { title: string; description: string }> = {
  '/': { title: pageTitles['/'], description: 'Plan pantry, fridge, and freezer dates. See what to use first, print labels, and keep every item on your device.' },
  '/demo': { title: pageTitles['/demo'], description: 'Try five sample pantry, fridge, and freezer items. Demo changes are separate from your saved items.' },
  '/settings': { title: pageTitles['/settings'], description: 'Set storage date presets and export or import your household item list.' },
  '/privacy': { title: pageTitles['/privacy'], description: 'Read how Storage-Aware Expiry stores household items in your browser.' },
  '/terms': { title: pageTitles['/terms'], description: 'Read the terms and food-safety limits for Storage-Aware Expiry.' },
  '/404': { title: 'Page not found — Storage-Aware Expiry', description: 'The requested Storage-Aware Expiry page was not found.' }
};

function setMeta(selector: string, value: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', value);
}

function setRouteMetadata(path: string) {
  const key = path.startsWith('/print/') || path === '/print-all' ? '/print' : (routeMetadata[path] ? path : '/404');
  const metadata = key === '/print'
    ? { title: 'Print labels — Storage-Aware Expiry', description: 'Print a planned-date label for a stored household item.' }
    : routeMetadata[key];
  const canonicalPath = key === '/404' ? '/404' : path;
  document.title = metadata.title;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `${siteUrl}${canonicalPath === '/' ? '/' : canonicalPath}`);
  setMeta('meta[name="description"]', metadata.description);
  setMeta('meta[property="og:title"]', metadata.title);
  setMeta('meta[property="og:description"]', metadata.description);
  setMeta('meta[property="og:url"]', `${siteUrl}${canonicalPath === '/' ? '/' : canonicalPath}`);
  setMeta('meta[name="twitter:title"]', metadata.title);
  setMeta('meta[name="twitter:description"]', metadata.description);
}

function header() {
  return `<a class="skip-link" href="#main">Skip to main content</a>
    ${demoMode ? `<div class="demo-banner" role="status"><span>Demo — sample data, nothing is saved</span><button class="small" id="reset-demo">Reset demo</button><a class="button small" href="/" data-start-real>Start for real</a></div>` : ''}
    <header class="site-header"><div class="header-inner">
      <a class="wordmark" href="/" data-link><span class="wordmark-mark" aria-hidden="true"></span><span>Storage-Aware Expiry</span></a>
      <button class="menu-button small" id="menu-button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav class="site-nav" id="site-nav" aria-label="Main navigation">
        <a href="/demo" data-link>Demo</a><a href="${demoMode ? '/demo' : '/#inventory'}" data-link>Use-first list</a><a href="/settings${demoMode ? '?demo=1' : ''}" data-link>Settings</a><a href="/privacy${demoMode ? '?demo=1' : ''}" data-link>Privacy</a>
      </nav>
    </div></header>`;
}

function footer() {
  return `<footer class="site-footer"><div class="footer-inner">
    <div class="footer-copy"><strong>Storage-Aware Expiry</strong><p>Plan pantry, fridge, and freezer dates. Dates are reminders, not food-safety advice.</p><p>Original generated artwork is disclosed in the design notes.</p></div>
    <div class="footer-links"><a href="/privacy${demoMode ? '?demo=1' : ''}" data-link>Privacy</a><a href="/terms${demoMode ? '?demo=1' : ''}" data-link>Terms</a><a href="https://hello.sociobot.in" rel="external">Built by Param Factory (external site)</a><span class="build-id">v1.0.2</span></div>
  </div></footer>`;
}

function dueText(item: Item) {
  const difference = daysBetween(today(), item.plannedDate);
  if (difference < 0) return { label: `${Math.abs(difference)} day${difference === -1 ? '' : 's'} past`, overdue: true };
  if (difference === 0) return { label: 'Due today', overdue: false };
  if (difference === 1) return { label: 'Use tomorrow', overdue: false };
  return { label: `Use in ${difference} days`, overdue: false };
}

function datePreview(locationValue: Location, baseDate: string) {
  return addDays(baseDate, presets[locationValue]);
}

function itemForm() {
  const item = editId ? items.find(entry => entry.id === editId) : undefined;
  const locationValue = item?.location ?? 'freezer';
  const stored = item?.storedOn ?? today();
  const planned = datePreview(locationValue, stored);
  return `<form class="item-form" id="item-form" novalidate>
    <div class="field wide"><label for="item-name">Item name</label><input id="item-name" name="name" maxlength="80" required autocomplete="off" value="${escapeHtml(item?.name ?? '')}"></div>
    <div class="field"><label for="quantity">Quantity <span class="optional">(optional)</span></label><input id="quantity" name="quantity" maxlength="40" value="${escapeHtml(item?.quantity ?? '')}"></div>
    <div class="field"><label for="location">Storage place</label><select id="location" name="location"><option value="pantry" ${locationValue === 'pantry' ? 'selected' : ''}>Pantry</option><option value="fridge" ${locationValue === 'fridge' ? 'selected' : ''}>Fridge</option><option value="freezer" ${locationValue === 'freezer' ? 'selected' : ''}>Freezer</option></select></div>
    <div class="field"><label for="stored-on">${locationValue === 'freezer' ? 'Frozen on' : 'Stored on'}</label><input id="stored-on" name="storedOn" type="date" required value="${stored}"></div>
    <div class="field"><label for="planned-date">Planned date</label><input id="planned-date" name="plannedDate" type="date" required value="${item?.plannedDate ?? planned}"></div>
    <div class="field wide"><label for="note">Note <span class="optional">(optional)</span></label><input id="note" name="note" maxlength="100" value="${escapeHtml(item?.note ?? '')}" placeholder="Container, meal, or reminder"></div>
    <p class="date-preview" id="date-preview">The ${locationValue} preset suggests ${formatDate(planned)}. You can change this date.</p>
    <p class="form-error" id="form-error" aria-live="assertive" hidden></p>
    <div class="form-actions"><button class="primary" type="submit">${item ? 'Save item changes' : 'Add item to the list'}</button>${item ? `<button type="button" id="cancel-edit">Cancel editing</button><button type="button" class="danger remove-item" data-id="${item.id}">Remove this item</button>` : ''}</div>
  </form>`;
}

function queueHtml(limit?: number) {
  const active = items.filter(item => !item.consumedAt).sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
  const visible = active.filter(item => filter === 'all' || item.location === filter);
  const shown = limit ? visible.slice(0, limit) : visible;
  const list = shown.map(item => {
    const due = dueText(item);
    const storedLabel = item.location === 'freezer' ? 'Frozen' : 'Stored';
    return `<li class="item-ticket" data-location="${item.location}" data-item-id="${item.id}"><span class="location-band" aria-hidden="true"></span>
      <div class="ticket-main"><div class="ticket-top"><h3>${escapeHtml(item.name)}</h3><span class="location-word">${item.location}</span></div>
      <p class="ticket-meta"><span>${escapeHtml(item.quantity || 'Quantity not set')}</span><span>${storedLabel} ${formatDate(item.frozenOn || item.storedOn)}</span><span>Planned for ${formatDate(item.plannedDate)}</span>${item.note ? `<span>${escapeHtml(item.note)}</span>` : ''}</p></div>
      <div class="ticket-actions"><span class="due-reading ${due.overdue ? 'overdue' : ''}">${due.label}</span><div class="action-row"><button class="small use-item" data-id="${item.id}" aria-label="Mark ${escapeHtml(item.name)} used">Mark used</button><button class="small ghost edit-item" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.name)}">Edit item</button><a class="button small ghost" href="/print/${item.id}${demoMode ? '?demo=1' : ''}" data-link aria-label="Print label for ${escapeHtml(item.name)}">Print label</a></div></div>
    </li>`;
  }).join('');
  return `${limit ? '' : `<div class="queue-toolbar"><div class="filter-group" aria-label="Filter by storage place">${(['all', 'pantry', 'fridge', 'freezer'] as Filter[]).map(value => `<button class="small filter-button" data-filter="${value}" aria-pressed="${filter === value}">${value[0].toUpperCase() + value.slice(1)}</button>`).join('')}</div><span>${visible.length} shown</span></div>`}
    ${shown.length ? `<ol class="item-list">${list}</ol>` : `<div class="empty-state"><div class="empty-dial" aria-hidden="true"></div><h3>${active.length ? `No ${filter} items` : 'Your use-first list is empty'}</h3><p>${active.length ? 'Choose another storage place or add an item here.' : 'Add one stored item. Its planned date will appear here in use-first order.'}</p><button class="primary" id="focus-add">Add your first item</button></div>`}`;
}

function appPanel() {
  const active = items.filter(item => !item.consumedAt);
  const used = items.filter(item => item.consumedAt).length;
  return `<div class="panel-grid"><section class="control-panel" aria-labelledby="queue-title"><div class="panel-header"><h2 id="queue-title">Use-first list</h2><span class="count-readout">${String(active.length).padStart(2, '0')} ACTIVE</span></div>${itemForm()}${queueHtml()}</section>
    <aside class="side-rail" aria-label="Inventory guidance"><section class="rail-card"><h2>Date presets</h2><p>New dates start from these settings. Every date stays editable.</p><div class="storage-scale"><div class="scale-row"><span>Pantry</span><i class="scale-line"></i><span>${presets.pantry}d</span></div><div class="scale-row"><span>Fridge</span><i class="scale-line"></i><span>${presets.fridge}d</span></div><div class="scale-row"><span>Freezer</span><i class="scale-line"></i><span>${presets.freezer}d</span></div></div><p><a href="/settings${demoMode ? '?demo=1' : ''}" data-link>Change date presets</a></p></section>
    <section class="rail-card"><h2>Household record</h2><p><strong>${used}</strong> item${used === 1 ? '' : 's'} marked used on this device.</p><p>Plan dates for quality and rotation. Check official guidance when safety is uncertain.</p></section></aside></div>`;
}

function demoPanel() {
  const active = items.filter(item => !item.consumedAt);
  return `<div class="panel-grid demo-panel"><section class="control-panel" aria-labelledby="demo-queue-title"><div class="panel-header"><h2 id="demo-queue-title">Use-first preview</h2><span class="count-readout">${String(active.length).padStart(2, '0')} ACTIVE</span></div><div class="demo-preview">${queueHtml()}</div><div class="demo-full-list"><h2>Add another item</h2>${itemForm()}</div></section>
    <aside class="side-rail" aria-label="Inventory guidance"><section class="rail-card"><h2>Date presets</h2><p>New dates start from these settings. Every date stays editable.</p><div class="storage-scale"><div class="scale-row"><span>Pantry</span><i class="scale-line"></i><span>${presets.pantry}d</span></div><div class="scale-row"><span>Fridge</span><i class="scale-line"></i><span>${presets.fridge}d</span></div><div class="scale-row"><span>Freezer</span><i class="scale-line"></i><span>${presets.freezer}d</span></div></div><p><a href="/settings?demo=1" data-link>Change date presets</a></p></section></aside></div>`;
}

function homePage() {
  if (demoMode) return `<main id="main"><section class="app-section shell demo-app"><div class="section-heading"><p class="eyebrow">Sample household · five items</p><h1>Use what needs attention first</h1><p>See planned dates and actions before adding anything. Your changes stay inside this temporary demo.</p></div>${demoPanel()}</section></main>`;
  return `<main id="main"><section class="hero shell"><div><p class="eyebrow">A small household date planner</p><h1>Use stored food before you forget it</h1><p class="lede">For households that freeze and store food without tracking every grocery purchase.</p><div class="hero-actions"><a class="button primary" href="/demo" data-link>Try it with sample data</a><span class="next-step">See five items in use-first order. No setup.</span><a class="button" href="#inventory">Add your first item</a></div><ul class="plain-facts"><li>Data stays on this device</li><li>Works offline after one visit</li><li>Free for 20 active items</li></ul></div>
    <figure class="hero-visual"><picture><source srcset="/assets/storage-panel-640.webp 640w, /assets/storage-panel-960.webp 960w" sizes="(max-width: 800px) 100vw, 46vw" type="image/webp"><img src="/assets/storage-panel-960.webp" width="960" height="640" alt="A pantry jar, fridge tin, and freezer box sit above three brass date dials." fetchpriority="high" decoding="async"></picture></figure></section>
    <section class="app-section shell" id="inventory"><div class="section-heading"><p class="eyebrow">Your local inventory</p><h2>Add only what is easy to forget</h2><p>Choose where it lives. The date preset changes with the storage place.</p></div>${appPanel()}</section>
    <section class="steps"><div class="shell"><div class="section-heading"><h2>How it works</h2></div><div class="steps-grid"><article class="step"><h3>Add a stored item</h3><p>Name the item and choose pantry, fridge, or freezer. Quantity is optional.</p></article><article class="step"><h3>Review the planned date</h3><p>The storage preset suggests a date. Change it whenever your own guidance differs.</p></article><article class="step"><h3>Use the earliest planned item first</h3><p>The earliest planned date stays first. Mark the item used when it leaves storage.</p></article></div></div></section>
    <section class="limits"><div class="shell"><div class="section-heading"><h2>What this tool handles</h2></div><div class="limits-grid"><div><h3>Included tools</h3><ul><li>Optional quantities and notes</li><li>Storage-specific date presets</li><li>JSON and CSV export</li><li>Browser-printed freezer labels</li></ul></div><div class="safety-note"><h3>What it does not decide</h3><p>This tool does not say whether food is safe. It does not scan barcodes, track nutrition, or follow every purchase.</p></div></div></div></section>
    ${pricingSection()}</main>`;
}

function pricingSection() {
  return `<section class="pricing" id="pricing"><div class="shell"><div class="price-panel"><div><p class="eyebrow">Free plan</p><h2>Use the free planner for up to 20 items</h2><p>Date presets, exports, and single labels are free. Household license checkout is currently unavailable.</p><p><a href="/terms" data-link>Read terms</a></p></div><div>${paid ? '<p><strong>Existing household license active</strong></p>' : '<p class="price">Free <small>20 active items</small></p>'}</div></div></div></section>`;
}

function settingsPage() {
  const licenseControls = demoMode
    ? ''
    : `<section class="settings-box"><h2>Household license</h2><p>${paid ? 'Your existing household license is active on this browser.' : 'The free plan holds 20 active items. Household license checkout is currently unavailable.'}</p><form class="license-form" id="license-form"><label class="sr-only" for="license-token">Existing license token</label><input id="license-token" name="license" autocomplete="off" placeholder="Paste an existing license token"><button type="submit">Check existing license</button></form><p id="license-status" aria-live="polite"></p>${paid ? `<div class="data-actions"><a class="button primary" href="/print-all" data-link>Print all active labels</a><button id="remove-license" class="danger">Remove license from this browser</button></div>` : ''}</section>`;
  return `<main id="main" class="settings-page"><p class="eyebrow">Local controls</p><h1>Set your storage date defaults</h1><p class="lede">These dates are planning reminders. Choose values that match your household guidance.</p>
    <form class="settings-box" id="preset-form"><h2>Date presets</h2><div class="preset-grid"><div class="field"><label for="preset-pantry">Pantry days</label><input type="number" id="preset-pantry" name="pantry" min="1" max="3650" value="${presets.pantry}" required></div><div class="field"><label for="preset-fridge">Fridge days</label><input type="number" id="preset-fridge" name="fridge" min="1" max="3650" value="${presets.fridge}" required></div><div class="field"><label for="preset-freezer">Freezer days</label><input type="number" id="preset-freezer" name="freezer" min="1" max="3650" value="${presets.freezer}" required></div></div><p id="preset-error" class="form-error" aria-live="assertive" hidden></p><div class="form-actions"><button class="primary" type="submit">Save date presets</button><button type="button" id="reset-presets">Restore default presets</button></div></form>
    <section class="settings-box"><h2>Own your data</h2><p>Export a backup or move your items to another browser. Imports replace items with matching IDs.</p><div class="data-actions"><button id="export-json">Export JSON backup</button><button id="export-csv">Export list as CSV</button><label class="button" for="import-json">Import JSON backup</label><input id="import-json" type="file" accept="application/json,.json" hidden></div><p id="import-status" aria-live="polite"></p></section>
    ${licenseControls}
  </main>`;
}

function legalPage(kind: 'privacy' | 'terms') {
  if (kind === 'privacy') return `<main id="main" class="legal-page"><p class="eyebrow">Last updated 2 September 2026</p><h1>Your inventory stays in this browser</h1><div class="prose"><h2>What is stored</h2><p>Items, dates, notes, presets, and completion history stay in this browser. Demo changes use a separate temporary browser key.</p><h2>What leaves the device</h2><p>The inventory app sends no item data to us. Checking an existing license contacts Sociobot. The request contains the license token, not your inventory.</p><h2>Your choices</h2><p>Use Settings to export your data. Clear this site's browser data to erase local records. Starting for real does not copy demo items.</p><h2>Contact</h2><p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a> with privacy questions.</p></div></main>`;
  return `<main id="main" class="legal-page"><p class="eyebrow">Last updated 2 September 2026</p><h1>Terms for using this date planner</h1><div class="prose"><h2>Planning dates</h2><p>Dates are personal planning reminders. They are not food-safety advice or a finding that food is safe to eat.</p><h2>Free use</h2><p>The free plan supports 20 active items, date presets, exports, and single-label printing.</p><h2>Household licenses</h2><p>Household license checkout is currently unavailable. Existing licenses may continue to unlock their saved features.</p><h2>Your data</h2><p>You are responsible for backups and your device. Export tools are available in Settings.</p><h2>Liability</h2><p>The software is provided as-is under the MIT License. Use official food-safety advice when you are uncertain.</p></div></main>`;
}

function printPage(id: string) {
  const item = items.find(entry => entry.id === id && !entry.consumedAt);
  if (!item) return `<main id="main" class="print-page"><h1>This item was not found</h1><p>It may have been marked used or removed.</p><a class="button" href="${demoMode ? '/demo' : '/'}" data-link>Return to the use-first list</a></main>`;
  return `<main id="main" class="print-page"><h1>Print a label for ${escapeHtml(item.name)}</h1><p>Use your browser print dialog. Choose the label size your printer supports.</p><div class="print-controls"><button class="primary" id="print-label">Print this label</button><a class="button" href="${demoMode ? '/demo' : '/'}" data-link>Return to the list</a></div><section class="print-label" aria-label="Printable freezer label"><span class="label-location">${item.location}</span><h2>${escapeHtml(item.name)}</h2><div class="label-date"><span>${item.location === 'freezer' ? 'Frozen' : 'Stored'} ${formatDate(item.frozenOn || item.storedOn)}</span><span>Planned for ${formatDate(item.plannedDate)}</span></div></section></main>`;
}

function printAllPage() {
  if (!paid) return `<main id="main" class="print-page"><h1>An existing household license is needed</h1><p>Batch printing is for existing household licenses. Checkout is currently unavailable.</p><a class="button" href="/settings" data-link>Return to settings</a></main>`;
  const active = items.filter(item => !item.consumedAt).sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
  return `<main id="main" class="print-page"><h1>Print all active labels</h1><p>${active.length} label${active.length === 1 ? '' : 's'} will print in use-first order.</p><div class="print-controls"><button class="primary" id="print-label">Print all labels</button><a class="button" href="/settings" data-link>Return to settings</a></div>${active.map(item => `<section class="print-label" aria-label="Printable label for ${escapeHtml(item.name)}"><span class="label-location">${item.location}</span><h2>${escapeHtml(item.name)}</h2><div class="label-date"><span>${item.location === 'freezer' ? 'Frozen' : 'Stored'} ${formatDate(item.frozenOn || item.storedOn)}</span><span>Planned for ${formatDate(item.plannedDate)}</span></div></section>`).join('')}</main>`;
}

function render() {
  const path = location.pathname;
  syncDemoMode();
  setRouteMetadata(path);
  let content: string;
  if (path === '/' || path === '/demo') content = homePage();
  else if (path === '/settings') content = settingsPage();
  else if (path === '/privacy') content = legalPage('privacy');
  else if (path === '/terms') content = legalPage('terms');
  else if (path === '/print-all') content = printAllPage();
  else if (path.startsWith('/print/')) content = printPage(decodeURIComponent(path.slice(7)));
  else content = `<main id="main" class="legal-page"><h1>Page not found</h1><p>The page was not found. Your stored items are unchanged.</p><a class="button" href="/" data-link>Return to the use-first list</a></main>`;
  app.innerHTML = `${header()}<div id="connection-status" aria-live="polite"></div>${content}${footer()}<div id="route-status" class="sr-only" aria-live="polite"></div><dialog id="confirm-dialog"><div class="dialog-inner"><h2>Remove this item?</h2><p id="dialog-copy"></p><div class="dialog-actions"><button id="cancel-remove">Keep item</button><button id="confirm-remove" class="danger">Remove item</button></div></div></dialog>`;
  bindEvents();
  updateConnectionStatus();
  const routeStatus = document.querySelector('#route-status');
  if (routeStatus) routeStatus.textContent = document.querySelector('h1')?.textContent ?? document.title;
}

function showToast(message: string, action?: { label: string; run: () => void }) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  const text = document.createElement('span');
  text.textContent = message;
  toast.append(text);
  if (action) {
    const button = document.createElement('button');
    button.className = 'small';
    button.textContent = action.label;
    button.addEventListener('click', () => { action.run(); toast.remove(); });
    toast.append(button);
  }
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 7000);
}

function updateConnectionStatus() {
  const target = document.querySelector('#connection-status');
  if (target) target.innerHTML = navigator.onLine ? '' : '<p class="offline-notice">Offline — saved items and date tools still work.</p>';
}

async function handleItemSubmit(event: SubmitEvent) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const data = new FormData(form);
  const name = String(data.get('name') ?? '').trim();
  const locationValue = String(data.get('location')) as Location;
  const storedOn = String(data.get('storedOn'));
  const plannedDate = String(data.get('plannedDate'));
  const error = form.querySelector<HTMLElement>('#form-error')!;
  if (!name || !storedOn || !plannedDate) {
    error.textContent = 'Name and both dates are required. Fill them in and save again.';
    error.hidden = false;
    return;
  }
  const activeCount = items.filter(item => !item.consumedAt && item.id !== editId).length;
  if (!editId && !paid && !demoMode && activeCount >= 20) {
    error.textContent = 'The free plan holds 20 active items. Mark one used to add another.';
    error.hidden = false;
    return;
  }
  const current = editId ? items.find(item => item.id === editId) : undefined;
  const item: Item = {
    id: current?.id ?? uid(), name, quantity: String(data.get('quantity') ?? '').trim(), location: locationValue,
    storedOn, frozenOn: locationValue === 'freezer' ? storedOn : undefined, plannedDate,
    note: String(data.get('note') ?? '').trim(), createdAt: current?.createdAt ?? new Date().toISOString()
  };
  if (submit) { submit.disabled = true; submit.textContent = current ? 'Saving changes…' : 'Adding item…'; }
  await saveItem(item);
  editId = null;
  render();
  document.querySelector('#queue-title')?.scrollIntoView({ block: 'start' });
  showToast(current ? `${name} was updated.` : `${name} was added to the use-first list.`);
}

function bindEvents() {
  document.querySelector('#menu-button')?.addEventListener('click', event => {
    const button = event.currentTarget as HTMLButtonElement;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    document.querySelector('#site-nav')?.classList.toggle('open', !expanded);
  });
  document.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach(link => link.addEventListener('click', async event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || link.target) return;
    const next = new URL(link.href);
    if (next.origin !== location.origin) return;
    event.preventDefault();
    history.pushState({}, '', next.pathname + next.search + next.hash);
    const wasDemo = demoMode;
    const willDemo = isDemoUrl(next);
    demoMode = willDemo;
    if (demoMode) paid = false;
    if (wasDemo !== willDemo) await loadData();
    render();
    window.scrollTo(0, next.hash ? document.querySelector(next.hash)?.getBoundingClientRect().top ?? 0 : 0);
    const heading = document.querySelector<HTMLElement>('h1');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }));
  document.querySelector('[data-start-real]')?.addEventListener('click', () => sessionStorage.removeItem(DEMO_KEY));
  document.querySelector('#reset-demo')?.addEventListener('click', () => { sessionStorage.removeItem(DEMO_KEY); items = sampleItems(); presets = { ...DEFAULT_PRESETS }; saveDemo(); render(); showToast('The sample list was reset.'); });
  document.querySelector<HTMLFormElement>('#item-form')?.addEventListener('submit', handleItemSubmit);
  const locationSelect = document.querySelector<HTMLSelectElement>('#location');
  const storedInput = document.querySelector<HTMLInputElement>('#stored-on');
  const plannedInput = document.querySelector<HTMLInputElement>('#planned-date');
  const updatePreview = () => {
    if (!locationSelect || !storedInput || !plannedInput || !storedInput.value) return;
    const originalLocation = editId ? items.find(item => item.id === editId)?.location : undefined;
    if (originalLocation && originalLocation !== locationSelect.value) storedInput.value = today();
    const suggestion = datePreview(locationSelect.value as Location, storedInput.value);
    plannedInput.value = suggestion;
    const label = document.querySelector<HTMLLabelElement>('label[for="stored-on"]');
    if (label) label.textContent = locationSelect.value === 'freezer' ? 'Frozen on' : 'Stored on';
    const preview = document.querySelector('#date-preview');
    if (preview) preview.textContent = `The ${locationSelect.value} preset suggests ${formatDate(suggestion)}. You can change this date.`;
  };
  locationSelect?.addEventListener('change', updatePreview);
  storedInput?.addEventListener('change', updatePreview);
  document.querySelector('#cancel-edit')?.addEventListener('click', () => { editId = null; render(); });
  document.querySelector('#focus-add')?.addEventListener('click', () => document.querySelector<HTMLInputElement>('#item-name')?.focus());
  document.querySelectorAll<HTMLButtonElement>('.filter-button').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter as Filter; render(); document.querySelector('#queue-title')?.scrollIntoView(); }));
  document.querySelectorAll<HTMLButtonElement>('.edit-item').forEach(button => button.addEventListener('click', () => { editId = button.dataset.id!; render(); document.querySelector<HTMLInputElement>('#item-name')?.focus(); }));
  document.querySelectorAll<HTMLButtonElement>('.use-item').forEach(button => button.addEventListener('click', async () => {
    const item = items.find(entry => entry.id === button.dataset.id);
    if (!item) return;
    item.consumedAt = new Date().toISOString();
    lastConsumed = { ...item };
    await saveItem(item);
    render();
    showToast(`${item.name} was marked used.`, { label: 'Undo', run: async () => { if (!lastConsumed) return; delete lastConsumed.consumedAt; await saveItem(lastConsumed); lastConsumed = null; render(); } });
  }));
  document.querySelectorAll<HTMLButtonElement>('.remove-item').forEach(button => button.addEventListener('click', () => openRemoveDialog(button.dataset.id!)));
  document.querySelector('#cancel-remove')?.addEventListener('click', () => (document.querySelector<HTMLDialogElement>('#confirm-dialog'))?.close());
  document.querySelector('#print-label')?.addEventListener('click', () => window.print());
  document.querySelector<HTMLFormElement>('#preset-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const next = { pantry: Number(data.get('pantry')), fridge: Number(data.get('fridge')), freezer: Number(data.get('freezer')) };
    const invalid = Object.values(next).some(value => !Number.isInteger(value) || value < 1 || value > 3650);
    const error = document.querySelector<HTMLElement>('#preset-error')!;
    if (invalid) { error.textContent = 'Each preset must be a whole number from 1 to 3650 days.'; error.hidden = false; return; }
    presets = next; await savePresets(); render(); showToast('Date presets were saved. Existing item dates did not change.');
  });
  document.querySelector('#reset-presets')?.addEventListener('click', async () => { presets = { ...DEFAULT_PRESETS }; await savePresets(); render(); showToast('Default date presets were restored.'); });
  document.querySelector('#export-json')?.addEventListener('click', () => download('storage-aware-expiry-backup.json', JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), presets, items }, null, 2), 'application/json'));
  document.querySelector('#export-csv')?.addEventListener('click', () => {
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [['name', 'quantity', 'location', 'stored_on', 'frozen_on', 'planned_date', 'note', 'used_on'], ...items.map(item => [item.name, item.quantity, item.location, item.storedOn, item.frozenOn ?? '', item.plannedDate, item.note, item.consumedAt ?? ''])];
    download('storage-aware-expiry.csv', rows.map(row => row.map(quote).join(',')).join('\n'), 'text/csv');
  });
  document.querySelector<HTMLInputElement>('#import-json')?.addEventListener('change', importBackup);
  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    if (demoMode) return;
    const token = String(new FormData(event.currentTarget as HTMLFormElement).get('license') ?? '').trim();
    const status = document.querySelector<HTMLElement>('#license-status')!;
    if (!token) { status.textContent = 'Paste an existing license token to check it.'; return; }
    localStorage.setItem(LICENSE_KEY, token);
    localStorage.removeItem(LICENSE_CACHE_KEY);
    status.textContent = 'Checking your existing license…';
    await verifyLicense(true);
    status.textContent = paid ? 'This existing license is active.' : 'This license is not active. The free plan still works.';
  });
  document.querySelector('#remove-license')?.addEventListener('click', () => { localStorage.removeItem(LICENSE_KEY); localStorage.removeItem(LICENSE_CACHE_KEY); paid = false; render(); showToast('The license was removed from this browser.'); });
}

function openRemoveDialog(id: string) {
  const item = items.find(entry => entry.id === id);
  const dialog = document.querySelector<HTMLDialogElement>('#confirm-dialog');
  if (!item || !dialog) return;
  dialog.querySelector('#dialog-copy')!.textContent = `${item.name} will be removed from this device.`;
  dialog.querySelector('#confirm-remove')!.addEventListener('click', async () => { await removeItem(id); dialog.close(); render(); showToast(`${item.name} was removed.`); }, { once: true });
  dialog.showModal();
  dialog.querySelector<HTMLButtonElement>('#cancel-remove')?.focus();
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

async function importBackup(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  const status = document.querySelector<HTMLElement>('#import-status')!;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text()) as { version: number; items: Item[]; presets?: Presets };
    if (parsed.version !== 1 || !Array.isArray(parsed.items) || parsed.items.some(item => !item.id || !item.name || !['pantry', 'fridge', 'freezer'].includes(item.location) || !item.plannedDate)) throw new Error('invalid');
    for (const item of parsed.items) await saveItem(item);
    if (parsed.presets) { presets = parsed.presets; await savePresets(); }
    status.textContent = `${parsed.items.length} items were imported.`;
  } catch {
    status.textContent = 'This backup could not be imported. Choose a JSON backup exported by this app.';
  }
  input.value = '';
}

window.addEventListener('popstate', async () => { syncDemoMode(); await loadData(); render(); const heading = document.querySelector<HTMLElement>('h1'); if (heading) { heading.tabIndex = -1; heading.focus(); } });
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

async function start() {
  checkLicenseFromUrl();
  await loadData();
  render();
  void verifyLicense();
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showToast('An app update is ready.', { label: 'Use update', run: () => { worker.postMessage('SKIP_WAITING'); location.reload(); } }); });
      });
    } catch { /* The app remains usable when service workers are unavailable. */ }
  }
}

void start();
