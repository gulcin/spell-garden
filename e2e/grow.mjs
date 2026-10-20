/**
 * Pet growth, on top of a full pass through the garden.
 * Solves every activity template, the crystal shop, the wardrobe, the witch's house,
 * the crystal cave, and the story adventure on iPad landscape, iPad portrait, and iPhone.
 * A walking baby dragon grows from little to grown. No console errors, no scrolling.
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

function chromePath() {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
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
  throw new Error('Chrome was not found.');
}

const base = process.env.SANITY_URL ?? 'http://127.0.0.1:43123/spell-garden/';
const shotDir = '/opt/cursor/artifacts/pet-growth';
mkdirSync(shotDir, { recursive: true });

const VIEWPORTS = [
  { name: 'ipad-landscape', width: 1194, height: 834 },
  { name: 'ipad-portrait', width: 834, height: 1194 },
  { name: 'iphone', width: 390, height: 844 },
];

const TEMPLATES = [
  ['ten-frame', 'mt_OvyoRo47K-'],
  ['number-line', 'mt_QaYfeVL-0C'],
  ['base-ten', 'mt_UQnAFPs83F'],
  ['sharing', 'mt_kDMKJ5Ztt6'],
  ['array', 'mt_VKW8lOcFaw'],
  ['fraction', 'mt_IHipFGTFEY'],
  ['coins', 'mt_iQYPw8bMfN'],
  ['clock', 'mt_0XxyaQLRhn'],
  ['balance', 'mt_ezc2m_0dzN'],
  ['measure', 'mt_svFa6_mjO_'],
  ['shapes', 'mt_hyvHv2BCwb'],
  ['symmetry', 'mt_hR2Y7NhMSY'],
  ['pattern', 'mt_YFS7JFk64p'],
  ['sort', 'mt__h7hvT4tEb'],
  ['bar-model', 'mt_yJmvUCCym7'],
  ['graph', 'mt_I5j1ZWo2cn'],
  ['coordinate', 'mt_hVpGOEz2kG'],
  ['angle', 'mt_Y9XKzLrUAZ'],
  ['chance', 'mt_xSgAgg9Ej_'],
  ['fallback', 'mt_oIzycTBeE4'],
];

const report = [];
function record(item, status, detail = '') {
  report.push({ item, status, detail });
  console.log(`${status === 'pass' ? 'PASS' : 'FAIL'} ${item}${detail ? ` — ${detail}` : ''}`);
}

function installSeed(page) {
  const progress = {
    format: 'prague.wizard-math.progress.v1',
    schema: 1,
    taxonomy: 'marble-skill-taxonomy-v1',
    learnerName: 'Aida',
    placement: { done: true, correct: 4, asked: 5, frontierAge: 8, completedAt: 1 },
    topics: {},
    sessions: [],
    seenTemplates: TEMPLATES.map(([template]) => template),
    rewards: [],
    crystals: 420,
    purse: { pink: 0, yellow: 0, blue: 2, gold: 20 },
    wardrobe: { owned: ['robe-rose'], equipped: { dress: 'robe-rose' } },
    visitedPlaces: ['crystal-shop', 'witch-house', 'pet-shop'],
    storyOffers: ['crystal-cave', 'lantern-grove', 'crystal-shop', 'witch-house', 'pet-shop'],
    storiesHeard: [],
    storyFavourites: [],
    adventures: [],
    talks: [],
    quests: [],
    house: {
      owned: ['moss-rug', 'sprout-pot', 'wall-lantern', 'cat-bed'],
      wallpaper: 'blossom',
      placed: [
        { id: 'p-moss-rug', itemId: 'moss-rug', x: 36, y: 84, flip: false, z: 1 },
        { id: 'p-sprout-pot', itemId: 'sprout-pot', x: 18, y: 76, flip: false, z: 2 },
        { id: 'p-wall-lantern', itemId: 'wall-lantern', x: 22, y: 28, flip: false, z: 3 },
      ],
    },
    pets: {
      owned: [{ id: 'baby-dragon', name: 'Pip', at: 1, how: 'bought', solved: 0 }],
      companionId: 'baby-dragon',
      home: [],
      seen: [],
    },
    updatedAt: 1,
  };
  return page.addInitScript((saved) => {
    if (!localStorage.getItem('prague.wizard-math.progress.v1')) {
      localStorage.setItem('prague.wizard-math.progress.v1', JSON.stringify(saved));
    }
    if (!localStorage.getItem('spell-garden.seenVersion')) localStorage.setItem('spell-garden.seenVersion', '1.5.0');
  }, progress);
}

async function layout(page) {
  return page.evaluate(() => {
    const problems = [];
    const px = (value) => Number.parseFloat(value);
    const body = px(getComputedStyle(document.body).fontSize);
    if (body < 15 || body > 20) problems.push(`body font ${body}`);
    for (const node of document.querySelectorAll('h1')) {
      const size = px(getComputedStyle(node).fontSize);
      if (size < 18 || size > 34) problems.push(`h1 ${size}`);
    }
    for (const node of document.querySelectorAll('button, a.btn')) {
      if (node.classList.contains('heart')) continue;
      const size = px(getComputedStyle(node).fontSize);
      if (size < 14 || size > 22) problems.push(`button ${size} ${(node.textContent || '').trim().slice(0, 24)}`);
    }
    const root = document.querySelector('.app');
    if (root && root.scrollHeight > root.clientHeight + 2) problems.push(`app scrolls ${root.scrollHeight}>${root.clientHeight}`);
    const scrolling = document.scrollingElement;
    if (scrolling && scrolling.scrollHeight > scrolling.clientHeight + 2) problems.push(`page scrolls ${scrolling.scrollHeight}>${scrolling.clientHeight}`);
    for (const node of document.querySelectorAll('.quest, .shop, .home, .story-reader, .witch-house, .wardrobe')) {
      if (node.scrollHeight > node.clientHeight + 2) problems.push(`inner scroll ${node.scrollHeight}>${node.clientHeight}`);
    }
    if (document.querySelectorAll('[data-testid="tell-us"]').length !== 1) problems.push('tell us missing');
    return problems;
  });
}

async function loadedDetail(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((img) => !(img.complete && img.naturalWidth > 0))
      .map((img) => `${(img.currentSrc || img.src || 'img').split('/').pop()} natural=${img.naturalWidth}`)
      .slice(0, 6)
      .join('; '),
  );
}

/** Every picture on the open screen has actually decoded. A 404 check is not enough. */
async function assertPictures(page, label) {
  try {
    await page.waitForFunction(
      () => {
        const imgs = [...document.querySelectorAll('img')];
        return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);
      },
      { timeout: 8000 },
    );
    record(`${label} pictures`, 'pass');
    return true;
  } catch {
    record(`${label} pictures`, 'fail', (await loadedDetail(page)) || 'no images');
    return false;
  }
}

/** Pet cards after a stage change. The walking dragon can be cached from the map while the shelf is still blank. */
async function assertPetCards(page, label) {
  try {
    await page.waitForFunction(
      () => {
        const imgs = [...document.querySelectorAll('.pet-shop .shop-card img')];
        return imgs.length >= 4 && imgs.every((img) => img.complete && img.naturalWidth > 0 && img.clientWidth > 0);
      },
      { timeout: 8000 },
    );
    record(`${label} pet pictures`, 'pass');
    return true;
  } catch {
    const detail = await page.evaluate(() =>
      [...document.querySelectorAll('.pet-shop .shop-card img')]
        .map((img) => {
          const pet = img.closest('[data-pet]')?.getAttribute('data-pet') || 'pet';
          return `${pet} natural=${img.naturalWidth} client=${img.clientWidth}`;
        })
        .join('; '),
    );
    record(`${label} pet pictures`, 'fail', detail.slice(0, 320) || 'no pet cards');
    return false;
  }
}

async function shot(page, name) {
  await assertPictures(page, name);
  await page.screenshot({ path: `${shotDir}/${name}.png` });
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
  const activityLabel = await page.evaluate(() => {
    const activity = document.querySelector('[data-testid="activity"]');
    return `activity ${activity?.getAttribute('data-template') || 'board'} ${window.innerWidth}x${window.innerHeight}`;
  });
  await assertPictures(page, activityLabel);
  const before = await page.locator('[data-testid="crystal-count"]').first().innerText();
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
      if (attempt === 1) throw new Error(`spell fizzled: ${note.slice(0, 80)}`);
    }
  }
  const after = await page.locator('[data-testid="crystal-count"]').first().innerText();
  if (Number.parseInt(after, 10) <= Number.parseInt(before, 10)) throw new Error(`crystals ${before} -> ${after}`);
  return note;
}

async function dragonSolved(page) {
  return page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('prague.wizard-math.progress.v1') ?? '{}');
    const pet = saved.pets?.owned?.find((row) => row.id === 'baby-dragon');
    return typeof pet?.solved === 'number' ? pet.solved : 0;
  });
}

async function openPractice(page, id) {
  await page.evaluate((topicId) => {
    const state = { spellGarden: 'practice', practiceId: topicId };
    history.pushState(state, '', `${location.pathname}${location.search}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  }, id);
  await page.waitForSelector(`[data-testid="activity"][data-topic="${id}"]`);
}

async function greet(page) {
  for (let step = 0; step < 8; step += 1) {
    const hello = page.locator('[data-testid="pet-hello"]');
    if ((await hello.count()) === 0 || !(await hello.isVisible())) return;
    await hello.click();
  }
}

async function home(page) {
  await greet(page);
  const map = page.locator('[data-testid="map-pets"]');
  if ((await map.count()) && (await map.isVisible())) return;
  await page.goto(base);
  await page.waitForSelector('[data-testid="map-pets"]');
  await greet(page);
}

async function openPets(page) {
  await home(page);
  await page.locator('[data-testid="map-pets"]').click();
  await page.waitForSelector('[data-testid="pet-shop"]');
  await page.locator('[data-testid="pet-group-imaginary"]').click();
  await page.waitForSelector('[data-testid="pet-stage-baby-dragon"]');
}

async function checkFit(page, label) {
  const problems = await layout(page);
  if (problems.length) record(label, 'fail', problems.slice(0, 4).join('; '));
  else record(label, 'pass');
  return problems.length === 0;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: chromePath(),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: VIEWPORTS[0], deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
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
  await page.waitForSelector('[data-testid="map-companion"]');

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(80);
    await checkFit(page, `little map ${viewport.name}`);
    await shot(page, `little-map-${viewport.name}`);
    await openPets(page);
    const stage = await page.locator('[data-testid="pet-stage-baby-dragon"]').getAttribute('data-stage');
    const src = await page.locator('[data-pet="baby-dragon"] img').first().getAttribute('src');
    const caption = await page.locator('[data-testid="pet-stage-baby-dragon"]').innerText();
    if (stage !== '0' || !src?.endsWith('/baby-dragon.webp') || !/Little/.test(caption)) {
      record(`little shop ${viewport.name}`, 'fail', `stage ${stage} ${src} ${caption}`);
    } else record(`little shop ${viewport.name}`, 'pass', caption);
    await assertPetCards(page, `little shop ${viewport.name}`);
    await checkFit(page, `little shop fit ${viewport.name}`);
    await shot(page, `little-shop-${viewport.name}`);
    await home(page);
  }

  async function shootHouse(label) {
    const expected = label === 'little' ? '0' : label === 'growing' ? '1' : '2';
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await home(page);
      await page.locator('[data-testid="map-house"]').click();
      await page.waitForSelector('[data-testid="witch-house"]');
      const stage = await page.locator('.house-companion').getAttribute('data-stage');
      if (stage !== expected) record(`${label} house stage ${viewport.name}`, 'fail', `stage ${stage}`);
      else record(`${label} house stage ${viewport.name}`, 'pass');
      await checkFit(page, `${label} house fit ${viewport.name}`);
      await shot(page, `${label}-house-${viewport.name}`);
    }
  }
  await shootHouse('little');
  await page.setViewportSize(VIEWPORTS[0]);

  await page.setViewportSize(VIEWPORTS[0]);
  const beforeMiss = await dragonSolved(page);
  await openPractice(page, TEMPLATES[0][1]);
  await page.locator('[data-testid="cast"]').click();
  await page.waitForSelector('.note');
  const missed = await page.locator('.note').innerText();
  if (!/fizzled softly/i.test(missed)) record('a miss stays kind', 'fail', missed.slice(0, 80));
  else record('a miss stays kind', 'pass');
  if ((await dragonSolved(page)) !== beforeMiss) record('a miss does not grow', 'fail', String(await dragonSolved(page)));
  else record('a miss does not grow', 'pass');
  const firstNote = await solveBoard(page);
  if (/growing|grew up/i.test(firstNote)) record('first spell stays little', 'fail', firstNote);
  else record('first spell stays little', 'pass');
  await page.locator('[data-testid="next"]').click();
  await page.waitForSelector('[data-testid="spell-beds"]');
  record('activity ten-frame ipad-landscape', 'pass');

  await openPractice(page, TEMPLATES[1][1]);
  const beforeSkip = await dragonSolved(page);
  await page.locator('[data-testid="skip"]').click();
  await page.waitForSelector('[data-testid="spell-beds"]');
  if ((await dragonSolved(page)) !== beforeSkip) record('a hop does not grow', 'fail');
  else record('a hop does not grow', 'pass');
  await openPractice(page, TEMPLATES[1][1]);
  await solveBoard(page);
  await page.locator('[data-testid="next"]').click();
  await page.waitForSelector('[data-testid="spell-beds"]');
  record('activity number-line ipad-landscape', 'pass');

  let grew = false;
  let grown = false;
  for (const [template, id] of TEMPLATES.slice(2)) {
    await openPractice(page, id);
    const got = await page.locator('[data-testid="activity"]').getAttribute('data-template');
    if (got !== template) throw new Error(`${id} is ${got}, expected ${template}`);
    await checkFit(page, `activity fit ${template} ipad-landscape`);
    const note = await solveBoard(page);
    const solved = await dragonSolved(page);
    if (solved === 4) {
      grew = /is growing/.test(note);
      record('growing speech', grew ? 'pass' : 'fail', note.slice(0, 120));
      await shot(page, 'growing-note-ipad-landscape');
    }
    if (solved === 10) {
      grown = /grew up/.test(note);
      record('grown speech', grown ? 'pass' : 'fail', note.slice(0, 120));
      await shot(page, 'grown-note-ipad-landscape');
    }
    await page.locator('[data-testid="next"]').click();
    await page.waitForSelector('[data-testid="spell-beds"]');
    record(`activity ${template} ipad-landscape`, 'pass', `solved ${solved}`);
    if (solved === 4 || solved === 10) {
      const label = solved === 4 ? 'growing' : 'grown';
      const file = solved === 4 ? 'baby-dragon-grow.webp' : 'baby-dragon-grown.webp';
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await home(page);
        await checkFit(page, `${label} map ${viewport.name}`);
        await shot(page, `${label}-map-${viewport.name}`);
        await openPets(page);
        const cardStage = await page.locator('[data-testid="pet-stage-baby-dragon"]').getAttribute('data-stage');
        const cardSrc = await page.locator('[data-pet="baby-dragon"] img').first().getAttribute('src');
        const hint = await page.locator('[data-testid="pet-stage-baby-dragon"]').innerText();
        if (cardStage !== String(solved === 4 ? 1 : 2) || !cardSrc?.includes(file)) {
          record(`${label} shop ${viewport.name}`, 'fail', `stage ${cardStage} ${cardSrc}`);
        } else if (solved === 4 && !/more spells to grow/.test(hint)) {
          record(`${label} shop ${viewport.name}`, 'fail', hint);
        } else if (solved === 10 && !/^Grown$/.test(hint.trim())) {
          record(`${label} shop ${viewport.name}`, 'fail', hint);
        } else record(`${label} shop ${viewport.name}`, 'pass', hint.replace(/\s+/g, ' '));
        await assertPetCards(page, `${label} shop ${viewport.name}`);
        await checkFit(page, `${label} shop fit ${viewport.name}`);
        await shot(page, `${label}-shop-${viewport.name}`);
      }
      await shootHouse(label);
      await page.setViewportSize(VIEWPORTS[0]);
    }
  }
  if (!grew || !grown) record('dragon grew on the walk', 'fail', `growing ${grew} grown ${grown} solved ${await dragonSolved(page)}`);
  else record('dragon grew on the walk', 'pass', `solved ${await dragonSolved(page)}`);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    if (viewport.name !== 'ipad-landscape') {
      for (const [template, id] of TEMPLATES) {
        try {
          await openPractice(page, id);
          const got = await page.locator('[data-testid="activity"]').getAttribute('data-template');
          if (got !== template) throw new Error(`${id} is ${got}, expected ${template}`);
          await checkFit(page, `activity fit ${template} ${viewport.name}`);
          await solveBoard(page);
          await page.locator('[data-testid="next"]').click();
          await page.waitForSelector('[data-testid="spell-beds"]');
          record(`activity ${template} ${viewport.name}`, 'pass');
        } catch (error) {
          record(`activity ${template} ${viewport.name}`, 'fail', error instanceof Error ? error.message : 'error');
          await home(page);
        }
      }
    }

    await home(page);
    await page.locator('[data-testid="map-shop"]').click();
    await page.waitForSelector('[data-testid="crystal-shop"]');
    await page.locator('[data-testid="shelf-hat"]').click();
    const buy = page.locator('[data-testid="buy-hat-mushroom"]');
    if (await buy.count()) await buy.click();
    await checkFit(page, `crystal shop ${viewport.name}`);
    await shot(page, `shop-${viewport.name}`);
    await page.locator('[data-testid="open-wardrobe"]').click();
    await page.waitForSelector('[data-testid="wardrobe"]');
    await page.locator('[data-testid="wardrobe-shelf-hat"]').click();
    const hat = page.locator('[data-testid="wear-hat-mushroom"] .wear-state');
    if ((await hat.innerText()) !== 'Take it off') {
      await page.locator('[data-testid="wear-hat-mushroom"]').click();
      await page.waitForFunction(
        () => document.querySelector('[data-testid="wear-hat-mushroom"] .wear-state')?.textContent === 'Take it off',
      );
    }
    const worn = await hat.innerText();
    if (worn !== 'Take it off') record(`wardrobe ${viewport.name}`, 'fail', worn);
    else record(`wardrobe ${viewport.name}`, 'pass');
    await checkFit(page, `wardrobe fit ${viewport.name}`);
    await shot(page, `wardrobe-${viewport.name}`);

    await home(page);
    await page.locator('[data-testid="map-house"]').click();
    await page.waitForSelector('[data-testid="witch-house"]');
    if (await page.locator('[data-testid="home-pet-baby-dragon"]').count()) {
      await page.locator('[data-testid="home-pet-baby-dragon"]').click();
    }
    await page.locator('[data-testid="rest-pet-baby-dragon"]').click();
    await page.waitForSelector('[data-testid="home-pet-baby-dragon"]');
    const houseStage = await page.locator('[data-pet="baby-dragon"]').first().getAttribute('data-stage');
    if (houseStage !== '2') record(`house ${viewport.name}`, 'fail', `stage ${houseStage}`);
    else record(`house ${viewport.name}`, 'pass');
    await checkFit(page, `house fit ${viewport.name}`);
    await shot(page, `house-${viewport.name}`);

    await home(page);
    await page.locator('[data-testid="map-stop-crystal-cave"]').click();
    await page.waitForSelector('[data-testid="begin-puzzles"]');
    await page.locator('[data-testid="begin-puzzles"]').click();
    await page.waitForSelector('[data-testid="activity"]');
    for (let step = 0; step < 8; step += 1) {
      if (await page.locator('[data-testid="story-reader"]').count()) break;
      if (await page.locator('[data-testid="reward"]').count()) break;
      if ((await page.locator('[data-testid="activity"]').count()) === 0) break;
      await solveBoard(page);
      if (await page.locator('[data-testid="story-reader"]').count()) break;
      if (await page.locator('[data-testid="next"]').count()) await page.locator('[data-testid="next"]').click();
    }
    if ((await page.locator('[data-testid="story-reader"]').count()) === 0) {
      record(`cave story ${viewport.name}`, 'fail', 'story did not open');
    } else {
      const storyText = await page.locator('[data-testid="story-reader"]').innerText();
      const storyLine = storyText.replace(/\s+/g, ' ').slice(0, 200);
      if (/baby dragon/i.test(storyText)) record(`grown story ${viewport.name}`, 'fail', storyLine);
      else if (!/the dragon|your grown dragon/i.test(storyText)) record(`grown story ${viewport.name}`, 'fail', storyLine);
      else record(`grown story ${viewport.name}`, 'pass');
      await checkFit(page, `story fit ${viewport.name}`);
      await shot(page, `story-${viewport.name}`);
      for (let pageNo = 0; pageNo < 8; pageNo += 1) {
        if ((await page.locator('[data-testid="story-reader"]').count()) === 0) break;
        await page.locator('[data-testid="story-next"]').click();
        await page.waitForTimeout(200);
      }
      if (await page.locator('[data-testid="story-reader"]').count()) {
        record(`cave story ${viewport.name}`, 'fail', 'story did not finish');
      } else record(`cave story ${viewport.name}`, 'pass');
    }
    await page.waitForSelector('[data-testid="reward"]', { timeout: 8000 });
    record(`crystal cave ${viewport.name}`, 'pass');
    await shot(page, `cave-reward-${viewport.name}`);
    await page.locator('[data-testid="reward-home"]').click();
    await home(page);
    for (let helloStep = 0; helloStep < 8; helloStep += 1) {
      const hello = page.locator('[data-testid="pet-hello"]');
      if ((await hello.count()) === 0 || !(await hello.isVisible())) break;
      await hello.click();
    }

    await page.locator('[data-testid="story-shelf-link"]').click();
    await page.waitForSelector('[data-testid="shelf-book-crystal-cave"]');
    await page.locator('[data-testid="shelf-book-crystal-cave"]').click();
    await page.waitForSelector('[data-testid="story-page"]');
    await assertPictures(page, `story shelf ${viewport.name}`);
    await checkFit(page, `story shelf ${viewport.name}`);
    await page.locator('[data-testid="story-close"]').click();
    await home(page);
  }

  if (errors.length) record('console errors', 'fail', [...new Set(errors)].slice(0, 4).join(' | '));
  else record('console errors', 'pass');
  if (missing.length) record('404s', 'fail', [...new Set(missing)].slice(0, 5).join(' | '));
  else record('404s', 'pass');

  await browser.close();
  const failed = report.filter((row) => row.status === 'fail');
  console.log(`\n${report.length - failed.length} passed, ${failed.length} failed`);
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
