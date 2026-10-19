/**
 * Every activity type must fit the visible screen: no page scroll, and every
 * control inside the viewport. Viewports match an 11" iPad with Safari chrome,
 * a taller iPad, portrait, and a phone.
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

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
const shotDir = process.env.FIT_SHOTS ?? '/opt/cursor/artifacts/fit';
mkdirSync(shotDir, { recursive: true });

const VIEWPORTS = [
  { name: '1180x720', width: 1180, height: 720 },
  { name: '1180x820', width: 1180, height: 820 },
  { name: '820x1100', width: 820, height: 1100 },
  { name: '768x950', width: 768, height: 950 },
  { name: '390x700', width: 390, height: 700 },
];

const ACTIVITIES = [
  { template: 'ten-frame', id: 'mt_OvyoRo47K-' },
  { template: 'number-line', id: 'mt_QaYfeVL-0C' },
  { template: 'base-ten', id: 'mt_x8TshvbbQT' },
  { template: 'base-ten', id: 'mt_UQnAFPs83F', label: 'base-ten bundle' },
  { template: 'sharing', id: 'mt_kDMKJ5Ztt6' },
  { template: 'array', id: 'mt_VKW8lOcFaw' },
  { template: 'fraction', id: 'mt_IHipFGTFEY' },
  { template: 'coins', id: 'mt_iQYPw8bMfN' },
  { template: 'clock', id: 'mt_0XxyaQLRhn' },
  { template: 'balance', id: 'mt_ezc2m_0dzN' },
  { template: 'measure', id: 'mt_svFa6_mjO_' },
  { template: 'shapes', id: 'mt_hyvHv2BCwb' },
  { template: 'symmetry', id: 'mt_hR2Y7NhMSY' },
  { template: 'pattern', id: 'mt_YFS7JFk64p' },
  { template: 'sort', id: 'mt__h7hvT4tEb' },
  { template: 'bar-model', id: 'mt_yJmvUCCym7' },
  { template: 'graph', id: 'mt_I5j1ZWo2cn' },
  { template: 'coordinate', id: 'mt_hVpGOEz2kG' },
  { template: 'angle', id: 'mt_Y9XKzLrUAZ' },
  { template: 'chance', id: 'mt_xSgAgg9Ej_' },
  { template: 'fallback', id: 'mt_oIzycTBeE4' },
];

const TEMPLATES = [...new Set(ACTIVITIES.map((activity) => activity.template))];

function practiceUrl(id) {
  const url = new URL(base);
  url.searchParams.set('practice', id);
  return url.toString();
}

async function fitProblems(page) {
  return page.evaluate(() => {
    const problems = [];
    const height = window.innerHeight;
    const width = window.innerWidth;
    const scrolling = document.scrollingElement;
    if (scrolling && scrolling.scrollHeight > height + 1) {
      problems.push(`page scrolls ${scrolling.scrollHeight}>${height}`);
    }
    for (const node of document.querySelectorAll('.board, .play, .quest')) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.scrollHeight > node.clientHeight + 2) {
        problems.push(`inner scroll .${node.className.toString().split(' ')[0]} ${node.scrollHeight}>${node.clientHeight}`);
      }
    }
    const nodes = document.querySelectorAll('button, a, [role="button"], .piece, .wedge, .cell, .hand, [data-dropzone], .note');
    for (const node of nodes) {
      if (!(node instanceof Element)) continue;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (style.pointerEvents === 'none' && !node.classList.contains('note')) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 2 && rect.height < 2) continue;
      const name = (node.getAttribute('data-testid') || node.getAttribute('aria-label') || node.className || '')
        .toString()
        .trim()
        .slice(0, 42);
      if (rect.top < -1 || rect.left < -1 || rect.bottom > height + 1 || rect.right > width + 1) {
        problems.push(`offscreen ${name} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
      if (node.classList.contains('piece')) {
        const long = Math.max(rect.width, rect.height);
        const short = Math.min(rect.width, rect.height);
        if (long < 30 || short < 14) problems.push(`tiny piece ${name} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    }
    return problems;
  });
}

async function main() {
  const browser = await chromium.launch({
    executablePath: chromePath(),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({
    viewport: { width: 1180, height: 720 },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  });
  await page.addInitScript((templates) => {
    const progress = {
      format: 'prague.wizard-math.progress.v1',
      taxonomy: 'marble-skill-taxonomy-v1',
      learnerName: 'Aida',
      placement: { done: true, correct: 4, asked: 5, frontierAge: 8, completedAt: 1 },
      topics: {},
      sessions: [],
      seenTemplates: templates,
      rewards: [],
      crystals: 18,
      purse: { pink: 3, yellow: 1, blue: 1, gold: 0 },
      wardrobe: { owned: [], equipped: {} },
      visitedPlaces: [],
      storyOffers: [],
      storiesHeard: [],
      storyFavourites: [],
      adventures: [],
      talks: [],
      quests: [],
      updatedAt: 1,
    };
    localStorage.setItem('prague.wizard-math.progress.v1', JSON.stringify(progress));
  }, TEMPLATES);

  const only = process.env.FIT_ONLY;
  const activities = only ? ACTIVITIES.filter((activity) => (activity.label ?? activity.template) === only || activity.template === only) : ACTIVITIES;
  const failures = [];
  for (const activity of activities) {
    const label = activity.label ?? activity.template;
    await page.goto(practiceUrl(activity.id));
    await page.waitForSelector(`[data-testid="activity"][data-topic="${activity.id}"]`, { timeout: 15000 });
    const actual = await page.locator('[data-testid="activity"]').getAttribute('data-template');
    if (actual !== activity.template) {
      failures.push(`${label}: opened ${actual}`);
      console.log(`FAIL ${label} — opened ${actual}`);
      continue;
    }
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(60);
      const clean = await fitProblems(page);
      if (label === 'base-ten' && (viewport.name === '1180x720' || viewport.name === '820x1100')) {
        await page.screenshot({ path: join(shotDir, `base-ten-${viewport.name}.png`) });
      }
      if (clean.length) {
        await page.screenshot({ path: join(shotDir, `fail-${label}-${viewport.name}.png`) });
        failures.push(`${label} ${viewport.name}: ${clean.slice(0, 4).join('; ')}`);
        console.log(`FAIL ${label} ${viewport.name} — ${clean.slice(0, 4).join('; ')}`);
      } else {
        console.log(`PASS ${label} ${viewport.name}`);
      }
    }
    await page.locator('[data-testid="hint"]').click();
    await page.waitForSelector('.note');
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(40);
      const withNote = await fitProblems(page);
      if (label === 'base-ten' && viewport.name === '1180x720') {
        await page.screenshot({ path: join(shotDir, 'base-ten-1180x720-note.png') });
      }
      if (withNote.length) {
        await page.screenshot({ path: join(shotDir, `fail-${label}-${viewport.name}-note.png`) });
        failures.push(`${label} ${viewport.name} note: ${withNote.slice(0, 4).join('; ')}`);
        console.log(`FAIL ${label} ${viewport.name} note — ${withNote.slice(0, 4).join('; ')}`);
      } else {
        console.log(`PASS ${label} ${viewport.name} note`);
      }
    }
  }

  await browser.close();
  console.log(`\n${failures.length} failed`);
  if (failures.length) {
    for (const failure of failures) console.log(`- ${failure}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
