/**
 * iPhone WebKit: a fresh open, a reload after the service worker takes control,
 * and a cached shell that points at a script which no longer exists.
 * The last case is what left an updated iPhone on a blank page.
 */
import { webkit, devices } from 'playwright-core';

export async function checkIphone(pageUrl) {
  const url = pageUrl ?? process.env.SANITY_URL ?? 'http://127.0.0.1:43123/spell-garden/';
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'allow' });
  const page = await context.newPage();
  const failed = [];
  page.on('pageerror', (error) => failed.push(error.message));
  page.on('requestfailed', (request) => failed.push(`${request.failure()?.errorText} ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`HTTP ${response.status()} ${response.url()}`);
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('[data-testid="map-shop"]', { timeout: 20000 });
    const fresh = await page.locator('#root').innerText();
    if (!fresh.includes('Spell Garden')) throw new Error(`fresh open was blank: ${fresh.slice(0, 80)}`);

    await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 90000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('[data-testid="map-shop"]', { timeout: 20000 });

    await page.evaluate(async () => {
      const html = `<!doctype html><html><head><meta name="spell-garden-version" content="stale"></head><body><div id="root"></div><script type="module" src="/spell-garden/assets/missing-chunk.js"></script></body></html>`;
      const keys = await caches.keys();
      if (!keys.length) throw new Error('no cache');
      const cache = await caches.open(keys[0]);
      const headers = { headers: { 'Content-Type': 'text/html' } };
      await cache.put('/spell-garden/index.html', new Response(html, headers));
      await cache.put('./index.html', new Response(html, headers));
    });
    failed.length = 0;
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('[data-testid="map-shop"]', { timeout: 20000 });
    const after = await page.evaluate(() => ({
      text: (document.getElementById('root')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      version: document.querySelector('meta[name="spell-garden-version"]')?.getAttribute('content') ?? '',
    }));
    if (!after.text.includes('Spell Garden') || after.version === 'stale') {
      throw new Error(`stale shell stuck: ${JSON.stringify(after)} ${failed.slice(0, 4).join(' | ')}`);
    }
    if (failed.some((line) => line.includes('missing-chunk'))) {
      throw new Error(`missing script was requested: ${failed.join(' | ')}`);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('webkit-iphone.mjs')) {
  checkIphone(process.env.SANITY_URL).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
