/**
 * Standalone home-screen update: serve v(n), then v(n+1) behind a sticky cache
 * like GitHub Pages, and confirm the banner reloads into the new spell
 * without dropping Aida's progress.
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const root = process.cwd();
const dirN = join(root, 'node_modules/.cache/spell-update-n');
const dirN1 = join(root, 'node_modules/.cache/spell-update-n1');
const port = 43130;

function chromePath() {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv && !fromEnv.includes('*') && existsSync(fromEnv)) return fromEnv;
  for (const candidate of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (existsSync(candidate)) return candidate;
  }
  for (const base of [join(homedir(), '.cache', 'ms-playwright'), join(root, 'node_modules', 'playwright-core', '.local-browsers')]) {
    if (!existsSync(base)) continue;
    for (const dir of readdirSync(base)) {
      const file = join(base, dir, 'chrome-linux64', 'chrome');
      if (dir.startsWith('chromium') && existsSync(file)) return file;
    }
  }
  throw new Error('Chrome was not found.');
}

function build(version, outDir) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const env = { ...process.env, SPELL_VERSION: version, SPELL_BUILD_DATE: '2026-10-19', BASE_PATH: './' };
  const result = spawnSync('npx', ['vite', 'build', '--outDir', outDir], {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`build ${version} failed`);
  const stamped = JSON.parse(readFileSync(join(outDir, 'version.json'), 'utf8'));
  if (stamped.version !== version) throw new Error(`version.json is ${stamped.version}`);
  const worker = readFileSync(join(outDir, 'sw.js'), 'utf8');
  if (!worker.includes('SKIP_WAITING') || !worker.includes(`spell-garden-v${version}`)) throw new Error(`sw.js for ${version} is not ready`);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
};

const misses = [];
let generation = 'n';
const cdn = new Map();

function fileFor(pathname) {
  const folder = generation === 'n' ? dirN : dirN1;
  const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const file = resolve(folder, rel);
  if (!file.startsWith(resolve(folder))) return null;
  if (!existsSync(file) || !statSync(file).isFile()) return null;
  return file;
}

function startServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const key = `${url.pathname}${url.search}`;
    const cached = cdn.get(key);
    if (cached) {
      res.writeHead(200, { 'Content-Type': cached.type, 'Cache-Control': 'max-age=600' });
      res.end(cached.body);
      return;
    }
    const file = fileFor(url.pathname);
    if (!file) {
      const detail = `${generation} ${key}`;
      misses.push(detail);
      res.writeHead(404, { 'Cache-Control': 'no-cache' });
      res.end('missing');
      return;
    }
    const body = readFileSync(file);
    const type = types[extname(file)] ?? 'application/octet-stream';
    cdn.set(key, { body, type });
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'max-age=600' });
    res.end(body);
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function greetArrivals(page) {
  for (let step = 0; step < 12; step += 1) {
    const hello = page.locator('[data-testid="pet-hello"]');
    if ((await hello.count()) === 0 || !(await hello.isVisible())) return;
    await hello.click();
  }
}

const progress = {
  format: 'prague.wizard-math.progress.v1',
  taxonomy: 'marble-skill-taxonomy-v1',
  learnerName: 'Aida',
  placement: { done: true, correct: 4, asked: 5, frontierAge: 8, completedAt: 1 },
  topics: {},
  sessions: [],
  seenTemplates: [],
  rewards: [],
  crystals: 17,
  purse: { pink: 2, yellow: 1, blue: 1, gold: 0 },
  wardrobe: { owned: [], equipped: {} },
  visitedPlaces: ['lantern-grove'],
  storyOffers: [],
  storiesHeard: [],
  storyFavourites: [],
  adventures: [],
  talks: [],
  quests: [],
  updatedAt: 1,
};

build('9.0.0', dirN);
build('9.0.1', dirN1);
const server = await startServer();

const profile = mkdtempSync(join(tmpdir(), 'spell-home-'));
const context = await chromium.launchPersistentContext(profile, {
  executablePath: chromePath(),
  viewport: { width: 1180, height: 820 },
  hasTouch: true,
  serviceWorkers: 'allow',
  args: ['--no-sandbox', '--disable-dev-shm-usage', `--app=http://127.0.0.1:${port}/`, '--window-size=1180,820'],
});
await context.addInitScript((saved) => {
  if (sessionStorage.getItem('spell-update-seeded') === '1') return;
  sessionStorage.setItem('spell-update-seeded', '1');
  localStorage.setItem('prague.wizard-math.progress.v1', JSON.stringify(saved));
  localStorage.setItem('spell-garden.seenVersion', '9.0.0');
}, progress);
const page = context.pages()[0] ?? (await context.newPage());
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
await page.reload();

try {
  await page.goto(`http://127.0.0.1:${port}/`);
  const standalone = await page.evaluate(() => window.matchMedia('(display-mode: standalone)').matches);
  if (!standalone) throw new Error('the page is not in standalone mode');
  await page.waitForSelector('[data-testid="map-shop"]');
  await greetArrivals(page);
  const first = await page.locator('meta[name="spell-garden-version"]').getAttribute('content');
  if (first !== '9.0.0') throw new Error(`opened ${first}`);
  // An async waitForFunction predicate returns a Promise, which is always truthy, so it does not wait.
  await page.evaluate(
    () =>
      Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('the first spell did not install')), 25000)),
      ]),
  );
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('spell-garden-colouring', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('artworks')) db.createObjectStore('artworks', { keyPath: 'sheetId' });
      };
      request.onsuccess = () => {
        const tx = request.result.transaction('artworks', 'readwrite');
        tx.objectStore('artworks').put({ sheetId: 'cauldron', strokes: ['kept'] });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  });

  await page.locator('[data-testid="parent-link"]').click();
  await page.waitForSelector('[data-testid="gate-answer"]');
  generation = 'n1';
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const started = Date.now();
        const look = () => {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg?.waiting) resolve(true);
            else if (Date.now() - started > 20000) reject(new Error('the new spell did not install'));
            else setTimeout(look, 100);
          }, reject);
        };
        look();
      }),
  );
  if ((await page.locator('[data-testid="update-banner"]').count()) !== 0) {
    throw new Error('the update banner appeared during a grown-ups screen');
  }
  await page.locator('[data-testid="garden-map"]').click();
  await greetArrivals(page);
  await page.waitForSelector('[data-testid="update-banner"]');
  const banner = (await page.locator('[data-testid="update-banner"]').innerText()).replace(/\s+/g, ' ');
  if (!banner.includes('A new spell is ready!') || !banner.includes('Update')) throw new Error(banner);
  mkdirSync('/opt/cursor/artifacts/update', { recursive: true });
  await page.screenshot({ path: '/opt/cursor/artifacts/update/banner-ipad.png' });
  const box = await page.locator('[data-testid="update-apply"]').boundingBox();
  if (!box || box.height < 60 || box.width < 140) throw new Error(`Update tap target ${box?.width}x${box?.height}`);

  await page.locator('[data-testid="update-apply"]').click();
  await page.waitForFunction(() => document.querySelector('meta[name="spell-garden-version"]')?.getAttribute('content') === '9.0.1');
  await page.waitForSelector('[data-testid="map-shop"]');
  await greetArrivals(page);
  if ((await page.locator('[data-testid="update-banner"]').count()) !== 0) throw new Error('the banner stayed after the update');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('prague.wizard-math.progress.v1') ?? '{}'));
  if (saved.crystals !== 17 || saved.learnerName !== 'Aida' || !saved.visitedPlaces?.includes('lantern-grove')) {
    throw new Error(`progress changed: ${JSON.stringify(saved).slice(0, 240)}`);
  }
  const art = await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('spell-garden-colouring', 1);
      request.onsuccess = () => {
        const tx = request.result.transaction('artworks', 'readonly');
        const get = tx.objectStore('artworks').get('cauldron');
        get.onsuccess = () => resolve(get.result ?? null);
        get.onerror = () => reject(get.error);
      };
      request.onerror = () => reject(request.error);
    });
  });
  if (!art || art.strokes?.[0] !== 'kept') throw new Error(`colouring was lost: ${JSON.stringify(art)}`);
  await greetArrivals(page);
  const news = page.locator('[data-testid="garden-news"]');
  if (await news.count()) {
    if (!(await news.innerText()).includes('New in the garden!')) throw new Error('the update note lost its hello');
    await page.locator('[data-testid="garden-news-close"]').click();
  }
  await page.locator('[data-testid="parent-link"]').click();
  await page.locator('[data-testid="gate-answer"]').fill('83');
  await page.locator('[data-testid="gate-submit"]').click();
  await page.waitForSelector('[data-testid="app-version"]');
  const stamp = (await page.locator('[data-testid="app-version"]').innerText()).trim();
  if (!stamp.startsWith('Version 9.0.1 (')) throw new Error(stamp);
  if ((await page.locator('[data-testid="check-updates"]').count()) !== 1) throw new Error('Check for updates is missing');
  console.log(`standalone update ${first} -> 9.0.1 (${stamp})`);
} catch (error) {
  console.error(String(error));
  if (errors.length) console.error(errors.slice(0, 8).join('\n'));
  if (misses.length) console.error(misses.slice(0, 12).join('\n'));
  throw error;
} finally {
  await context.close();
  rmSync(profile, { recursive: true, force: true });
  await new Promise((resolve) => server.close(resolve));
}
