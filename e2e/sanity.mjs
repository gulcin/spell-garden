/**
 * End-to-end sanity for every place, skill, shop outfit, house piece, story, and note.
 * Fails the process (and CI) when a screen scrolls, a font is oversized, or a puzzle does not pay off.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright-core';

function chromePath() {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv && !fromEnv.includes('*') && existsSync(fromEnv)) return fromEnv;
  for (const candidate of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (existsSync(candidate)) return candidate;
  }
  for (const root of [join(homedir(), '.cache', 'ms-playwright'), join(process.cwd(), 'node_modules', 'playwright-core', '.local-browsers')]) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root)) {
      const file = join(root, dir, 'chrome-linux64', 'chrome');
      if (dir.startsWith('chromium') && existsSync(file)) return file;
    }
  }
  throw new Error('Chrome was not found. Install Google Chrome or run npx playwright install chromium.');
}

const base = process.env.SANITY_URL ?? 'http://127.0.0.1:43123/';
function shotDirectory() {
  if (process.env.SANITY_SHOTS) return process.env.SANITY_SHOTS;
  const preferred = '/opt/cursor/artifacts/sanity';
  try {
    mkdirSync(preferred, { recursive: true });
    return preferred;
  } catch {
    return join(tmpdir(), 'spell-garden-sanity');
  }
}
const shotDir = shotDirectory();
mkdirSync(shotDir, { recursive: true });

const VIEWPORTS = [
  { name: 'ipad11-portrait', width: 834, height: 1194 },
  { name: 'ipad11-landscape', width: 1194, height: 834 },
  { name: 'ipad13-portrait', width: 1024, height: 1366 },
  { name: 'ipad13-landscape', width: 1366, height: 1024 },
  { name: 'iphone', width: 390, height: 844 },
];

const PLACES = [
  'lantern-grove',
  'potion-cottage',
  'crystal-cave',
  'observatory',
  'lily-pond',
  'greenhouse',
  'wizard-tower',
  'mushroom-ring',
];

const TEMPLATES = [
  'ten-frame',
  'number-line',
  'base-ten',
  'sharing',
  'array',
  'fraction',
  'coins',
  'clock',
  'balance',
  'measure',
  'shapes',
  'symmetry',
  'pattern',
  'sort',
  'bar-model',
  'graph',
  'coordinate',
  'angle',
  'chance',
  'fallback',
];

const maths = JSON.parse(readFileSync(new URL('../src/curriculum/maths.json', import.meta.url), 'utf8'));
const topics = maths.topics;
const scope = process.env.SANITY_SCOPE ?? 'all';
const report = [];

function record(item, status, detail = '') {
  report.push({ item, status, detail });
  const mark = status === 'pass' ? 'PASS' : status === 'fixed' ? 'FIXED' : 'FAIL';
  console.log(`${mark} ${item}${detail ? ` — ${detail}` : ''}`);
}

function installSeed(page) {
  return page.addInitScript(
    ({ templates, places }) => {
      const progress = {
        format: 'prague.wizard-math.progress.v1',
        taxonomy: 'marble-skill-taxonomy-v1',
        learnerName: 'Aida',
        placement: { done: true, correct: 4, asked: 5, frontierAge: 8, completedAt: 1 },
        topics: {},
        sessions: [],
        seenTemplates: templates,
        rewards: [],
        crystals: 280,
        purse: { pink: 0, yellow: 0, blue: 0, gold: 14 },
        wardrobe: { owned: [], equipped: {} },
        visitedPlaces: [],
        storyOffers: places,
        storiesHeard: [],
        storyFavourites: [],
        adventures: [],
        talks: [],
        quests: [],
        updatedAt: 1,
      };
      localStorage.setItem('prague.wizard-math.progress.v1', JSON.stringify(progress));
      localStorage.removeItem('prague.wizard-math.reports.v1');
    },
    { templates: TEMPLATES, places: [...PLACES, 'crystal-shop', 'colouring-nook', 'witch-house'] },
  );
}

async function layout(page) {
  return page.evaluate(() => {
    const problems = [];
    const px = (value) => Number.parseFloat(value);
    const body = px(getComputedStyle(document.body).fontSize);
    if (body < 15 || body > 20) problems.push(`body font ${body}`);
    const adjust = String(
      getComputedStyle(document.documentElement).webkitTextSizeAdjust ||
        getComputedStyle(document.documentElement).getPropertyValue('-webkit-text-size-adjust') ||
        '',
    ).trim();
    if (adjust && adjust !== '100%' && adjust !== '100') problems.push(`text-size-adjust ${adjust}`);
    for (const node of document.querySelectorAll('h1')) {
      const size = px(getComputedStyle(node).fontSize);
      if (size < 18 || size > 34) problems.push(`h1 ${size} ${node.textContent?.slice(0, 24)}`);
    }
    for (const node of document.querySelectorAll('button, a.btn')) {
      const size = px(getComputedStyle(node).fontSize);
      if (size < 14 || size > 22) problems.push(`button ${size} ${(node.textContent || '').trim().slice(0, 24)}`);
    }
    const root = document.querySelector('.app');
    if (root && root.scrollHeight > root.clientHeight + 2) problems.push(`app scrolls ${root.scrollHeight}>${root.clientHeight}`);
    const scrolling = document.scrollingElement;
    if (scrolling && scrolling.scrollHeight > scrolling.clientHeight + 2) problems.push(`page scrolls ${scrolling.scrollHeight}>${scrolling.clientHeight}`);
    for (const node of document.querySelectorAll('.board, .play, .quest, .garden, .shop, .home, .journal, .colour-app, .story-reader, .witch-house, .tell-sheet, .wardrobe, [data-testid="wardrobe-grid"]')) {
      if (node.scrollHeight > node.clientHeight + 2) problems.push(`inner scroll .${node.className.toString().split(' ')[0]} ${node.scrollHeight}>${node.clientHeight}`);
    }
    for (const node of document.querySelectorAll('h1, h2, p, button, .spell-row, .prompt')) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.scrollWidth > node.clientWidth + 8 && getComputedStyle(node).overflowX !== 'visible') {
        problems.push(`clipped ${node.textContent?.trim().slice(0, 32)}`);
      }
    }
    const text = document.body.innerText;
    if (/\bLocked\b/.test(text) && document.querySelector('[data-testid=spell-beds]')) problems.push('spell beds show Locked');
    if (/ages \d/.test(text) && document.querySelector('[data-testid=spell-beds]')) problems.push('spell beds show ages');
    for (const node of document.querySelectorAll('button:not([disabled]), a.btn')) {
      const rect = node.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      // Furniture in the room is a layered picture, so one piece may sit over another.
      if (node.classList.contains('house-piece')) continue;
      if (rect.top < -1 || rect.left < -1 || rect.bottom > window.innerHeight + 1 || rect.right > window.innerWidth + 1) {
        problems.push(`offscreen ${(node.getAttribute('data-testid') || node.textContent || '').trim().slice(0, 32)}`);
        continue;
      }
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 18));
      if (hit && hit !== node && !node.contains(hit) && !hit.contains(node)) {
        problems.push(`covered ${(node.getAttribute('data-testid') || node.textContent || '').trim().slice(0, 32)}`);
      }
    }
    return problems;
  });
}

async function wardrobeProblems(page) {
  const layoutProblems = await layout(page);
  const tileProblems = await page.evaluate(() => {
    const problems = [];
    const cards = [...document.querySelectorAll('[data-testid^="wear-"]')];
    if (cards.length === 0) problems.push('empty shelf');
    for (const card of cards) {
      const box = card.getBoundingClientRect();
      const name = card.querySelector('.wear-name');
      const state = card.querySelector('.wear-state');
      const nameText = name?.textContent?.trim() ?? '';
      const stateText = state?.textContent?.trim() ?? '';
      if (!nameText) problems.push(`missing name ${card.getAttribute('data-testid')}`);
      if (stateText !== 'Put it on' && stateText !== 'Take it off') problems.push(`state ${card.getAttribute('data-testid')} ${stateText}`);
      for (const node of [name, state]) {
        if (!(node instanceof HTMLElement)) continue;
        const rect = node.getBoundingClientRect();
        if (rect.top < box.top - 1 || rect.bottom > box.bottom + 1 || rect.left < box.left - 1 || rect.right > box.right + 1) {
          problems.push(`outside ${nameText}`);
        }
        if (node.scrollHeight > node.clientHeight + 2 || node.scrollWidth > node.clientWidth + 2) problems.push(`clipped ${node.textContent}`);
        if (rect.height < 8 || rect.width < 8) problems.push(`tiny ${node.textContent}`);
      }
      if (box.top < -1 || box.bottom > window.innerHeight + 1) problems.push(`offscreen ${nameText}`);
    }
    return problems;
  });
  return [...layoutProblems, ...tileProblems];
}

async function trayWords(page) {
  return page.evaluate(() => {
    const prompt = document.querySelector('h2.prompt')?.textContent?.trim() ?? '';
    const srcs = [...document.querySelectorAll('[data-testid^="piece:"] img')].map((img) => img.getAttribute('src') || '');
    const problems = [];
    const named = [
      [/flat|hundred/i, 'block-flat', 'flat'],
      [/\brods?\b/i, 'block-rod', 'rod'],
      [/\bcubes?\b/i, 'block-unit', 'cube'],
    ];
    for (const [pattern, file, label] of named) {
      if (pattern.test(prompt) && !srcs.some((src) => src.includes(file))) problems.push(`${label} named but missing (${prompt})`);
    }
    if (!prompt) problems.push('missing prompt');
    return { prompt, problems };
  });
}

async function shot(page, name) {
  const file = `${shotDir}/${name}.png`;
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.screenshot({ path: file });
      return file;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : '';
      if (!/EAGAIN|resource temporarily unavailable/i.test(message) || attempt === 2) throw error;
      await page.waitForTimeout(200 * (attempt + 1));
    }
  }
  throw lastError;
}

let touchSession = null;
async function touchDrag(page, from, to) {
  if (!touchSession) touchSession = await page.context().newCDPSession(page);
  await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y, id: 1 }] });
  const steps = 12;
  for (let step = 1; step <= steps; step += 1) {
    await touchSession.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x + ((to.x - from.x) * step) / steps, y: from.y + ((to.y - from.y) * step) / steps, id: 1 }],
    });
  }
  await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function drag(page, pieceId, zoneId) {
  const boxes = await page.evaluate(
    ({ pieceId, zoneId }) => {
      const piece = document.querySelector(`[data-testid="piece:${pieceId}"]`);
      const zone = document.querySelector(`[data-testid="zone:${zoneId}"]`);
      if (!(piece instanceof HTMLElement) || !(zone instanceof HTMLElement)) return null;
      const from = piece.getBoundingClientRect();
      const to = zone.getBoundingClientRect();
      if (from.width < 1 || to.width < 1) return null;
      return {
        from: { x: from.x + from.width / 2, y: from.y + from.height / 2 },
        to: { x: to.x + to.width / 2, y: to.y + to.height - Math.min(36, to.height / 4) },
      };
    },
    { pieceId, zoneId },
  );
  if (!boxes) throw new Error(`cannot drag ${pieceId} to ${zoneId}`);
  await touchDrag(page, boxes.from, boxes.to);
}

async function twist(page, faceId, handId, degrees) {
  const point = await page.evaluate(
    ({ faceId, handId, degrees }) => {
      const face = document.querySelector(`[data-testid="${faceId}"]`);
      const hand = document.querySelector(`[data-testid="${handId}"]`);
      if (!(face instanceof HTMLElement) || !(hand instanceof HTMLElement)) return null;
      const rect = face.getBoundingClientRect();
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      const matrix = new DOMMatrix(getComputedStyle(hand).transform);
      let current = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
      if (!Number.isFinite(current)) current = 0;
      if (current < 0) current += 360;
      const at = (deg, radius) => {
        const rad = (deg * Math.PI) / 180;
        return { x: cx + Math.sin(rad) * radius, y: cy - Math.cos(rad) * radius };
      };
      const onHand = (spot) => {
        const el = document.elementFromPoint(spot.x, spot.y);
        return el instanceof Element && (el === hand || hand.contains(el));
      };
      const scales = handId === 'hand-hour' ? [0.1, 0.14, 0.18] : [0.3, 0.36, 0.24, 0.16];
      let start = null;
      for (const scale of scales) {
        const spot = at(current, rect.width * scale);
        if (onHand(spot)) {
          start = spot;
          break;
        }
      }
      if (!start) return { miss: true };
      const end = at(degrees, rect.width * 0.36);
      return { x: end.x, y: end.y, startX: start.x, startY: start.y };
    },
    { faceId, handId, degrees },
  );
  if (!point || point.miss) throw new Error(`cannot grasp ${handId}`);
  await touchDrag(page, { x: point.startX, y: point.startY }, { x: point.x, y: point.y });
}

async function missThenHint(page) {
  await page.locator('[data-testid="cast"]').click();
  const missed = await page.locator('.note').innerText();
  if (!/fizzled softly/i.test(missed)) throw new Error(`harsh miss: ${missed.slice(0, 80)}`);
  if (/scary|monster|ghost|blood/i.test(missed)) throw new Error(`scary miss: ${missed.slice(0, 80)}`);
  await page.locator('[data-testid="hint"]').click();
  const hint = await page.locator('.note').innerText();
  if (!hint.trim() || /fizzled/i.test(hint)) throw new Error(`hint missing: ${hint.slice(0, 80)}`);
  if ((await page.locator('[data-testid="cast"]').count()) === 0) throw new Error('dead end after a miss');
  if ((await page.locator('[data-testid="skip"]').count()) === 0) throw new Error('skip missing after a miss');
}

async function applySolution(page) {
  const solution = await page.evaluate(() => window.__prague?.item?.solution ?? []);
  for (const action of solution) {
    if (action.op === 'tap') await page.locator(`[data-testid="tap:${action.id}"]`).click();
    else if (action.op === 'bundle') await page.locator('[data-testid="bundle"]').click();
    else if (action.op === 'move') await drag(page, action.pieceId, action.zoneId);
    else if (action.op === 'clock') {
      await twist(page, 'clock-face', 'hand-hour', (action.hour % 12) * 30);
      await twist(page, 'clock-face', 'hand-minute', action.minute * 6);
    } else if (action.op === 'angle') await twist(page, 'angle-face', 'angle-wand', action.degrees);
  }
}

async function solveBoard(page) {
  await page.waitForSelector('[data-testid="activity"]');
  const before = await page.locator('[data-testid="crystal-count"]').innerText();
  let note = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await applySolution(page);
    await page.locator('[data-testid="cast"]').click();
    try {
      await page.waitForSelector('.note.good', { timeout: 2500 });
      note = await page.locator('.note.good').innerText();
      break;
    } catch {
      note = await page.locator('.note').innerText().catch(() => '');
      if (attempt === 1) {
        const detail = await page.evaluate(() => {
          const item = window.__prague?.item;
          const state = window.__prague?.getState?.();
          const clock = state?.clock;
          const where = item.template === 'clock' && clock ? `clock ${clock.hour}:${clock.minute}` : `angle ${state?.angle}`;
          return item ? `${item.template} ${where}: ${item.prompt}` : '';
        });
        throw new Error(`spell fizzled (${detail}): ${note.slice(0, 80)}`);
      }
    }
  }
  const after = await page.locator('[data-testid="crystal-count"]').innerText();
  if (!/crystal|spell worked|glows|settled/i.test(note)) throw new Error(`reward note missing: ${note}`);
  if (Number.parseInt(after, 10) <= Number.parseInt(before, 10)) throw new Error(`crystals ${before} -> ${after}`);
}

async function clickPaged(page, testId) {
  for (let step = 0; step < 16; step += 1) {
    const target = page.locator(`[data-testid="${testId}"]`);
    if (await target.count()) {
      await target.click();
      return;
    }
    const next = page.locator('[data-testid="shop-next"]');
    if ((await next.count()) === 0 || (await next.isDisabled())) break;
    await next.click();
  }
  throw new Error(`missing ${testId}`);
}

async function answerNeighbour(page, personId) {
  await page.locator(`[data-testid="talk-${personId}"]`).click();
  await page.waitForSelector('[data-testid="talk"]');
  await page.locator('[data-testid="reply-ask"]').click();
  const answerIds = await page.locator('[data-testid^="reply-answer-"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid')));
  for (const id of answerIds) {
    if (!id) continue;
    const choice = page.locator(`[data-testid="${id}"]`);
    if ((await choice.count()) === 0) continue;
    await choice.click();
    if ((await page.locator('[data-testid^="reply-answer-"]').count()) === 0) break;
  }
  if ((await page.locator('[data-testid="reply-quest"]').count()) > 0) await page.locator('[data-testid="reply-quest"]').click();
  if ((await page.locator('[data-testid="reply-accept"]').count()) > 0) await page.locator('[data-testid="reply-accept"]').click();
  const line = await page.locator('[data-testid="talk-line"]').innerText();
  if (!line.trim()) throw new Error(`empty talk with ${personId}`);
  await page.locator('[data-testid="talk-close"]').click();
  return line;
}

async function greetArrivals(page) {
  for (let step = 0; step < 12; step += 1) {
    const hello = page.locator('[data-testid="pet-hello"]');
    if ((await hello.count()) === 0 || !(await hello.isVisible())) return;
    await hello.click();
  }
}

async function shopShelf(page) {
  return page.evaluate(() => {
    const issues = [];
    const grid = document.querySelector('.shop:not(.pet-shop) .shop-grid');
    const buy = document.querySelector('.shop:not(.pet-shop) .shop-grid button');
    const gridBox = grid?.getBoundingClientRect();
    const buyBox = buy?.getBoundingClientRect();
    if (!grid || !gridBox || gridBox.height < 80) issues.push(`grid ${Math.round(gridBox?.height ?? 0)}`);
    const text = buy?.textContent?.trim() ?? '';
    if (!text) issues.push('buy blank');
    if (!buy || !buyBox || buyBox.height < 8) issues.push('buy missing');
    else if (buyBox.bottom > window.innerHeight + 1 || buyBox.top < 0) issues.push('buy offscreen');
    else {
      const hit = document.elementFromPoint(buyBox.left + buyBox.width / 2, buyBox.top + Math.min(buyBox.height / 2, 18));
      if (hit && hit !== buy && !buy.contains(hit) && !hit.contains(buy)) issues.push('buy covered');
    }
    return issues;
  });
}

const SHOP_VIEWS = [
  { name: 'ipad-portrait', width: 834, height: 1194 },
  { name: 'ipad-landscape', width: 1194, height: 834 },
  { name: 'iphone', width: 390, height: 844 },
  { name: 'iphone-short', width: 390, height: 700 },
];

async function assertShopShelf(page, label) {
  for (const viewport of SHOP_VIEWS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(60);
    const problems = [...(await layout(page)), ...(await shopShelf(page))];
    if (problems.length) record(`${label} ${viewport.name}`, 'still broken', problems.slice(0, 6).join('; '));
    else record(`${label} ${viewport.name}`, 'pass');
  }
  await page.setViewportSize({ width: 834, height: 1194 });
}

async function checkLegacyShop(pageUrl) {
  const legacy = {
    format: 'prague.wizard-math.progress.v1',
    taxonomy: 'marble-skill-taxonomy-v1',
    learnerName: 'Aida',
    placement: { done: true, correct: 4, asked: 5, frontierAge: 8, completedAt: 1 },
    topics: {},
    sessions: [
      {
        id: 's',
        startedAt: 1,
        endedAt: 2,
        chapterTitle: 'A quiet chapter',
        topicIds: [],
        correct: 3,
        incorrect: 0,
        skips: 0,
        rewardId: 'moth',
      },
    ],
    seenTemplates: [],
    rewards: ['moth'],
    crystals: 26,
    wardrobe: {
      owned: ['robe-moon', 'robe-rose', 'extra-kitten', 'hat-night', 'robe-vanished'],
      equipped: { dress: 'robe-moon', hat: 'hat-night', familiar: 'no-such-friend' },
    },
    visitedPlaces: ['lantern-grove', 'crystal-shop'],
    storyOffers: ['crystal-shop'],
    updatedAt: 1,
  };
  const engines = [
    ['chromium', () => chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox', '--disable-dev-shm-usage'] })],
    ['webkit', () => webkit.launch({ headless: true })],
  ];
  for (const [name, launch] of engines) {
    const browser = await launch();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.addInitScript((saved) => {
      localStorage.setItem('prague.wizard-math.progress.v1', JSON.stringify(saved));
    }, legacy);
    try {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForSelector('[data-testid="map-shop"]', { timeout: 20000 });
      await greetArrivals(page);
      await page.locator('[data-testid="map-shop"]').click();
      await page.waitForSelector('[data-testid="crystal-shop"]');
      if ((await page.locator('[data-testid="screen-oops"]').count()) > 0) {
        record(`legacy shop ${name}`, 'still broken', 'oops screen');
        continue;
      }
      const before = Number(await page.locator('[data-testid="crystal-count"]').innerText());
      await page.locator('[data-testid="shelf-hat"]').click();
      const ownedHat = (await page.locator('[data-testid="item-hat-night"] button').last().innerText()).trim();
      if (!ownedHat.includes('Take it off') && !ownedHat.includes('Put it on')) {
        record(`legacy shop ${name}`, 'still broken', ownedHat);
        continue;
      }
      await clickPaged(page, 'buy-hat-mushroom');
      const after = Number(await page.locator('[data-testid="crystal-count"]').innerText());
      if (before - after !== 12) {
        record(`legacy shop ${name}`, 'still broken', `crystals ${before} -> ${after}`);
        continue;
      }
      await page.locator('[data-testid="open-wardrobe"]').click();
      await page.waitForSelector('[data-testid="wardrobe"]');
      await page.locator('[data-testid="wardrobe-shelf-hat"]').click();
      await page.waitForSelector('[data-testid="wear-hat-mushroom"]');
      await page.locator('[data-testid="back-to-shop"]').click();
      await page.waitForSelector('[data-testid="crystal-shop"]');
      await page.setViewportSize({ width: 1194, height: 834 });
      await page.waitForTimeout(60);
      const shelf = await shopShelf(page);
      const noisy = pageErrors.filter((line) => !line.includes('InvalidStateError') && !line.includes('audio'));
      if (shelf.length || noisy.length) record(`legacy shop ${name}`, 'still broken', [...shelf, ...noisy].slice(0, 4).join('; '));
      else record(`legacy shop ${name}`, 'pass', `crystals ${before} -> ${after}`);
      await page.locator('[data-testid="garden-map"]').click();
      await page.waitForSelector('[data-testid="map-shop"]');
    } catch (error) {
      record(`legacy shop ${name}`, 'still broken', error instanceof Error ? error.message : 'error');
    } finally {
      await browser.close();
    }
  }
}

async function fits(page, label, musicId) {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(80);
    const problems = await layout(page);
    if (musicId) {
      const music = await page.evaluate(() => document.documentElement.dataset.music ?? '');
      if (music !== musicId) problems.push(`music ${music}`);
    }
    if (problems.length) record(`${label} ${viewport.name}`, 'still broken', problems.slice(0, 4).join('; '));
    else record(`${label} ${viewport.name}`, 'pass');
  }
}

async function openPlace(page, id) {
  await greetArrivals(page);
  const named = page.locator(`[data-testid="map-stop-${id}"]`);
  const target = (await named.count()) ? named : page.locator('[data-testid="map-stop-current"]');
  await target.click({ force: true });
  await page.waitForSelector('[data-testid="begin-puzzles"]');
}

async function openPractice(page, id) {
  await page.evaluate((topicId) => {
    const state = { spellGarden: 'practice', practiceId: topicId };
    history.pushState(state, '', `${location.pathname}${location.search}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  }, id);
  await page.waitForSelector(`[data-testid="activity"][data-topic="${id}"]`);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: chromePath(),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({
    viewport: { width: 834, height: 1194 },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  });
  const errors = [];
  const missing = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('response', (response) => {
    if (response.status() === 404 && !response.url().includes('favicon')) missing.push(response.url());
  });
  await installSeed(page);
  await page.goto(base);
  await page.waitForSelector('[data-testid="map-shop"]');

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const problems = await layout(page);
    await shot(page, `map-${viewport.name}`);
    if (problems.length) record(`map ${viewport.name}`, 'still broken', problems.slice(0, 4).join('; '));
    else record(`map ${viewport.name}`, 'pass');
  }
  await page.setViewportSize({ width: 834, height: 1194 });

  await page.evaluate(() => localStorage.setItem('spell-garden.seenVersion', '1.0.0'));
  await page.reload();
  await page.waitForSelector('[data-testid="garden-news"]');
  const news = await page.locator('[data-testid="garden-news"]').innerText();
  if (!news.includes('New in the garden!') || news.includes('version.json')) record('garden news', 'still broken', news.slice(0, 180));
  else record('garden news', 'pass');
  await page.locator('[data-testid="garden-news-close"]').click();
  await page.waitForSelector('[data-testid="garden-news"]', { state: 'detached' });

  await page.locator('[data-testid="tell-us"]').click();
  await page.waitForSelector('[data-testid="tell-sheet"]');
  await page.locator('[data-testid="tell-broken"]').click();
  await page.locator('[data-testid="tell-text"]').fill('The robe was sitting on the old one.');
  await page.locator('[data-testid="tell-keep"]').click();
  await page.waitForSelector('[data-testid="tell-kept"]');
  const href = await page.locator('[data-testid="tell-send"]').getAttribute('href');
  const decoded = decodeURIComponent(href ?? '');
  if (!decoded.startsWith('mailto:gulcin.yildirim@clickhouse.com?')) record('Tell us mailto', 'still broken', href ?? '');
  else if (!decoded.includes('Spell Garden report –') || !decoded.includes('Type: bug') || !decoded.includes('Version:')) {
    record('Tell us mailto', 'still broken', decoded.slice(0, 180));
  } else record('Tell us mailto', 'pass');
  await shot(page, 'tell-kept');
  await page.locator('[data-testid="tell-close"]').click();

  await page.locator('[data-testid="parent-link"]').click();
  await page.locator('[data-testid="gate-answer"]').fill('83');
  await page.locator('[data-testid="gate-submit"]').click();
  await page.waitForSelector('[data-testid="report-list"]');
  const notes = await page.locator('[data-testid="report-list"]').innerText();
  if (!notes.includes('The robe was sitting')) record('grown-ups notes', 'still broken', notes.slice(0, 160));
  else record('grown-ups notes', 'pass');
  const stamp = await page.locator('[data-testid="app-version"]').innerText();
  if (!stamp.includes('Version 1.5.0 (')) record('grown-ups version', 'still broken', stamp);
  else record('grown-ups version', 'pass', stamp.trim());
  await page.locator('[data-testid="whats-new"]').click();
  await page.waitForSelector('[data-testid="whats-new-screen"]');
  const notesScreen = await page.locator('[data-testid="whats-new-screen"]').innerText();
  if (!notesScreen.includes('1.0.0') || !notesScreen.includes('crystal shop') || !notesScreen.includes('home pill')) {
    record('whats new', 'still broken', notesScreen.slice(0, 180));
  } else record('whats new', 'pass');
  await page.locator('[data-testid="whats-new-back"]').click();
  await page.waitForSelector('[data-testid="report-list"]');
  if ((await page.locator('[data-testid="music-toggle"]').getAttribute('aria-pressed')) !== 'true') record('music toggle', 'still broken');
  else record('music toggle', 'pass');
  if ((await page.locator('[data-testid="sound-toggle"]').getAttribute('aria-pressed')) !== 'true') record('sound toggle', 'still broken');
  else record('sound toggle', 'pass');
  const placeMusic = await page.evaluate(() => document.documentElement.dataset.music ?? '');
  if (placeMusic !== 'map') record('place music', 'still broken', placeMusic);
  else record('place music', 'pass');
  await page.locator('[data-testid="check-updates"]').click();
  await page.waitForSelector('[data-testid="update-status"]');
  record('check for updates', 'pass');
  await shot(page, 'grown-ups');
  await page.locator('[data-testid="garden-map"]').click();
  await page.waitForSelector('[data-testid="map-shop"]');

  await page.locator('[data-testid="map-shop"]').click();
  await page.waitForSelector('[data-testid="crystal-shop"]');
  await assertShopShelf(page, 'crystal shop');
  for (const id of ['robe-moon', 'hat-night', 'extra-crown', 'broom-twig']) {
    await page.locator(`[data-testid="shelf-${id.startsWith('robe') ? 'dress' : id.startsWith('hat') ? 'hat' : id.startsWith('extra') ? 'extra' : 'broom'}"]`).click();
    await page.locator(`[data-testid="buy-${id}"]`).click();
    const wear = page.locator(`[data-testid="item-${id}"] button`).last();
    if ((await wear.innerText()).includes('Wear this')) await wear.click();
  }
  const clover = await answerNeighbour(page, 'clover');
  record('talk clover', 'pass', clover.slice(0, 60));
  await page.locator('[data-testid="open-wardrobe"]').click();
  await page.waitForSelector('[data-testid="wardrobe"]');
  const look = await page.locator('.mirror-figure .look').getAttribute('src');
  if (!look?.includes('look-robe-moon')) record('dress-up robe', 'still broken', look ?? 'no look');
  else record('dress-up robe', 'pass', look);
  await shot(page, 'wardrobe-moon');
  await page.locator('[data-testid="back-to-shop"]').click();
  await page.waitForSelector('[data-testid="crystal-shop"]');
  const rest = [
    ['dress', 'robe-rose'],
    ['dress', 'robe-moss'],
    ['dress', 'robe-midnight'],
    ['hat', 'hat-mushroom'],
    ['hat', 'hat-crescent'],
    ['hat', 'hat-tall'],
    ['extra', 'extra-necklace'],
    ['extra', 'extra-bag'],
    ['extra', 'extra-wand'],
    ['friend', 'extra-kitten'],
    ['broom', 'broom-blossom'],
    ['broom', 'broom-star'],
    ['broom', 'broom-night'],
  ];
  for (const [shelf, id] of rest) {
    await page.locator(`[data-testid="shelf-${shelf}"]`).click();
    await clickPaged(page, `buy-${id}`);
  }
  await page.locator('[data-testid="open-wardrobe"]').click();
  await page.waitForSelector('[data-testid="wardrobe"]');
  await page.locator('[data-testid="wardrobe-shelf-dress"]').click();
  await page.locator('[data-testid="wear-robe-rose"]').click();
  const roseState = await page.locator('[data-testid="wear-robe-rose"] .wear-state').innerText();
  if (roseState !== 'Take it off') record('dress-up rose', 'still broken', roseState);
  else record('dress-up rose', 'pass');
  const wardrobeViews = [
    { name: 'ipad-portrait', width: 834, height: 1194 },
    { name: 'ipad-landscape', width: 1194, height: 834 },
    { name: 'ipad-tight', width: 1180, height: 720 },
    { name: 'iphone', width: 390, height: 844 },
    { name: 'iphone-short', width: 390, height: 700 },
  ];
  const shelves = ['dress', 'hat', 'extra', 'broom', 'friend'];
  for (const viewport of wardrobeViews) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const shelf of shelves) {
      await page.locator(`[data-testid="wardrobe-shelf-${shelf}"]`).click();
      const problems = await wardrobeProblems(page);
      if (viewport.name === 'ipad-landscape' && shelf === 'dress') await shot(page, 'wardrobe-rose');
      if (problems.length) record(`wardrobe ${viewport.name} ${shelf}`, 'still broken', problems.slice(0, 6).join('; '));
      else record(`wardrobe ${viewport.name} ${shelf}`, 'pass');
    }
  }
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.locator('[data-testid="garden-map"]').click();

  await page.locator('[data-testid="map-shop"]').click();
  await page.locator('[data-testid="shelf-home"]').click();
  await clickPaged(page, 'buy-fern-pot');
  await page.locator('[data-testid="item-fern-pot"] button', { hasText: 'Put in the house' }).click();
  await page.waitForSelector('[data-testid="witch-house"]');
  const holly = await answerNeighbour(page, 'holly');
  record('talk holly', 'pass', holly.slice(0, 60));
  await page.locator('[data-testid="tray-fern-pot"]').click();
  await page.waitForSelector('[data-testid="piece-fern-pot"]');
  record('witch house place fern', 'pass');
  await shot(page, 'witch-house');
  await page.locator('[data-testid="garden-map"]').click();

  await page.locator('[data-testid="map-pets"]').click({ force: true });
  await page.waitForSelector('[data-testid="pet-shop"]');
  const petGroups = [];
  for (const id of ['cats', 'dogs', 'creatures', 'imaginary', 'fairies']) {
    const tab = page.locator(`[data-testid="pet-group-${id}"]`);
    await tab.click();
    petGroups.push((await tab.innerText()).trim());
  }
  if (petGroups.join(',') !== 'Cats,Dogs,Creatures,Imaginary,Fairies') record('pet groups', 'still broken', petGroups.join(','));
  else record('pet groups', 'pass');
  await page.locator('[data-testid="pet-group-cats"]').click();
  await page.locator('[data-testid="buy-pet-cloud-cat"]').click();
  await page.locator('[data-testid="pet-name-cloud-cat"]').fill('Pip');
  await page.locator('[data-testid="walk-pet-cloud-cat"]').click();
  const named = await page.locator('[data-testid="pet-name-cloud-cat"]').inputValue();
  const walking = await page.locator('[data-testid="walk-pet-cloud-cat"]').innerText();
  if (named !== 'Pip' || !walking.includes('Walking')) record('pet buy and name', 'still broken', `${named} ${walking}`);
  else record('pet buy and name', 'pass');
  await page.setViewportSize({ width: 1194, height: 834 });
  await shot(page, 'pet-shop-ipad-landscape');
  await fits(page, 'pet shop', 'pet-shop');
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.locator('[data-testid="garden-map"]').click();
  await page.waitForSelector('[data-testid="map-companion"]');
  record('pet companion', 'pass');
  await page.locator('[data-testid="map-house"]').click({ force: true });
  await page.locator('[data-testid="rest-pet-cloud-cat"]').click();
  await page.waitForSelector('[data-testid="home-pet-cloud-cat"]');
  record('pet in the house', 'pass');
  await page.setViewportSize({ width: 1194, height: 834 });
  await shot(page, 'house-rest-ipad-landscape');
  await fits(page, 'witch house', 'witch-house');
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.locator('[data-testid="garden-map"]').click();

  await page.locator('[data-testid="map-colour"]').click();
  const smudge = await answerNeighbour(page, 'smudge');
  record('talk smudge', 'pass', smudge.slice(0, 60));
  await page.locator('[data-testid="sheet-cauldron"]').click();
  await page.locator('[data-testid="colour-finish"]').click();
  await page.waitForSelector('.note.good');
  record('colouring finish', 'pass');
  await shot(page, 'colouring');
  await page.locator('[data-testid="garden-map"]').click();

  await page.locator('[data-testid="story-shelf-link"]').click();
  await page.locator('[data-testid="shelf-book-lantern-grove"]').click();
  await page.waitForSelector('[data-testid="story-page"]');
  await page.locator('[data-testid="story-next"]').click();
  record('storybook', 'pass');
  await shot(page, 'storybook');
  await page.locator('[data-testid="story-close"]').click();
  await page.locator('[data-testid="garden-map"]').click();

  const neighbours = [
    ['lantern-grove', 'bram'],
    ['potion-cottage', 'nanna'],
    ['crystal-cave', 'cobble'],
    ['observatory', 'wisp'],
    ['lily-pond', 'pebble'],
    ['greenhouse', 'posy'],
    ['wizard-tower', 'teacup'],
    ['mushroom-ring', 'pip'],
  ];
  let hinted = false;
  let skipped = false;
  for (const [placeId, personId] of neighbours) {
    try {
      await openPlace(page, placeId);
      const line = await answerNeighbour(page, personId);
      await page.locator('[data-testid="begin-puzzles"]').click();
      await page.waitForSelector('[data-testid="activity"]');
      if (!hinted) {
        await page.locator('[data-testid="hint"]').click();
        const hint = await page.locator('.note').innerText();
        if (!hint.trim()) throw new Error('empty hint');
        hinted = true;
        record('hint', 'pass');
      }
      for (let step = 0; step < 8; step += 1) {
        if (await page.locator('[data-testid="reward"]').count()) break;
        if ((await page.locator('[data-testid="activity"]').count()) === 0) break;
        if (!skipped && (await page.locator('[data-testid="skip"]').count())) {
          await page.locator('[data-testid="skip"]').click();
          skipped = true;
          record('skip', 'pass');
          await page.waitForTimeout(200);
          continue;
        }
        if ((await page.locator('[data-testid="activity"]').count()) === 0) break;
        await solveBoard(page);
        if (await page.locator('[data-testid="story-reader"]').count()) break;
        if (await page.locator('[data-testid="next"]').count()) await page.locator('[data-testid="next"]').click();
      }
      if (await page.locator('[data-testid="story-reader"]').count()) {
        for (let pageNo = 0; pageNo < 6; pageNo += 1) {
          const next = page.locator('[data-testid="story-next"]');
          if ((await next.count()) > 0 && (await next.isEnabled())) await next.click();
          else break;
        }
        await page.locator('[data-testid="story-close"]').click();
      }
      await page.waitForSelector('[data-testid="reward"]', { timeout: 8000 });
      record(`chapter ${placeId}`, 'pass', line.slice(0, 80));
      await shot(page, `chapter-${placeId}`);
      await page.locator('[data-testid="reward-home"]').click();
      await page.waitForSelector('[data-testid="map-shop"]');
      await greetArrivals(page);
    } catch (error) {
      await shot(page, `fail-chapter-${placeId}`);
      record(`chapter ${placeId}`, 'still broken', error instanceof Error ? error.message.split('\n')[0] : 'error');
      if (await page.locator('[data-testid="garden-map"]').count()) await page.locator('[data-testid="garden-map"]').click();
      else await page.goto(base);
      await page.waitForSelector('[data-testid="map-shop"]');
    }
  }

  await page.locator('[data-testid="garden-link"]').click();
  await page.getByRole('button', { name: 'Geometry', exact: true }).click();
  const beds = await page.locator('[data-testid="spell-beds"]').innerText();
  if (/Locked|ages \d/.test(beds)) record('shapes skill list copy', 'still broken', beds.slice(0, 180));
  else record('shapes skill list copy', 'pass');
  await page.setViewportSize({ width: 390, height: 844 });
  const phoneProblems = await layout(page);
  await shot(page, 'shapes-iphone');
  if (phoneProblems.length) record('shapes skill list iphone', 'still broken', phoneProblems.slice(0, 5).join('; '));
  else record('shapes skill list iphone', 'pass');
  await page.setViewportSize({ width: 834, height: 1194 });
  const spell = page.locator('.spell-row').first();
  const spellId = (await spell.getAttribute('data-testid'))?.replace('spell-', '');
  await spell.click();
  await solveBoard(page);
  record(`shapes spell ${spellId}`, 'pass');
  await page.locator('[data-testid="next"]').click();
  await page.waitForSelector('[data-testid="spell-beds"]');
  await page.locator('[data-testid="garden-map"]').click();

  const build =
    topics.find((topic) => topic.name === 'The two digits of a two-digit number') ??
    topics.find((topic) => topic.domain === 'Number Representation & Place Value' && !/decimal/i.test(topic.name));
  if (build) {
    await openPractice(page, build.id);
    await page.setViewportSize({ width: 1194, height: 834 });
    const tray = await trayWords(page);
    if (tray.problems.length) record('base-ten tray words', 'still broken', tray.problems.join('; '));
    else record('base-ten tray words', 'pass', tray.prompt);
    const squashed = await layout(page);
    await shot(page, 'base-ten-ipad-landscape');
    if (squashed.length) record(`base-ten ${build.name}`, 'still broken', squashed.slice(0, 4).join('; '));
    else {
      await solveBoard(page);
      record(`base-ten ${build.name}`, 'pass');
    }
    await page.setViewportSize({ width: 834, height: 1194 });
    await page.locator('[data-testid="garden-map"]').click();
  }

  const wanted = scope === 'smoke' ? topics.filter((topic, index, all) => all.findIndex((item) => item.name && true) === index).slice(0, 0) : topics;
  const skillTopics =
    scope === 'smoke'
      ? TEMPLATES.map((template) => topics.find(() => true)).filter(Boolean)
      : topics;
  const uniqueSmoke = [];
  if (scope === 'smoke') {
    const seen = new Set();
    for (const topic of topics) {
      const key = topic.domain;
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueSmoke.push(topic);
      if (uniqueSmoke.length >= 12) break;
    }
  }
  const list = scope === 'smoke' ? uniqueSmoke : skillTopics;
  for (const topic of list) {
    try {
      await openPractice(page, topic.id);
      let problems = [];
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const found = await layout(page);
        if (found.length) problems.push(`${viewport.name}: ${found.slice(0, 2).join('; ')}`);
      }
      await page.setViewportSize({ width: 834, height: 1194 });
      if (problems.length) {
        await shot(page, `fail-${topic.id}`);
        record(topic.name, 'still broken', problems[0]);
        continue;
      }
      await missThenHint(page);
      await solveBoard(page);
      await page.locator('[data-testid="next"]').click();
      await page.waitForSelector('[data-testid="spell-beds"]');
      await openPractice(page, topic.id);
      await page.locator('[data-testid="skip"]').click();
      await page.waitForSelector('[data-testid="spell-beds"]');
      record(topic.name, 'pass');
    } catch (error) {
      await shot(page, `fail-${topic.id}`);
      record(topic.name, 'still broken', error instanceof Error ? error.message : 'error');
    }
  }

  await checkLegacyShop(base);
  if (errors.length) record('console errors', 'still broken', errors.slice(0, 3).join(' | '));
  else record('console errors', 'pass');
  if (missing.length) record('404s', 'still broken', [...new Set(missing)].slice(0, 5).join(' | '));
  else record('404s', 'pass');

  try {
    const { checkIphone } = await import('./webkit-iphone.mjs');
    await checkIphone(process.env.SANITY_URL ?? 'http://127.0.0.1:43123/');
    record('webkit iphone', 'pass');
  } catch (error) {
    record('webkit iphone', 'still broken', error instanceof Error ? error.message : 'error');
  }

  writeFileSync(`${shotDir}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  const broken = report.filter((row) => row.status === 'still broken');
  console.log(`\n${report.length - broken.length} passed, ${broken.length} broken`);
  if (broken.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
