import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.env.APP_URL ?? 'http://127.0.0.1:43123/';
const shots = '/opt/cursor/artifacts/screenshots';
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const context = await browser.newContext({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
  userAgent:
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
await context.addInitScript(() => {
  const wrap = () => {
    const synth = window.speechSynthesis;
    if (!synth || synth.__pragueWrapped) return Boolean(synth?.__pragueWrapped);
    const original = typeof synth.speak === 'function' ? synth.speak.bind(synth) : () => {};
    synth.speak = (utterance) => {
      window.__speakCalls = (window.__speakCalls ?? 0) + 1;
      try {
        return original(utterance);
      } catch {
        return undefined;
      }
    };
    synth.__pragueWrapped = true;
    return true;
  };
  wrap();
  document.addEventListener('DOMContentLoaded', wrap);
});

const page = await context.newPage();
page.setDefaultTimeout(15000);
const dragTemplates = new Set();
const templates = [];

function shot(name) {
  return page.screenshot({ path: `${shots}/${name}.png` });
}

async function skipDemo() {
  const demo = page.locator('[data-testid="skip-demo"]');
  if (await demo.isVisible().catch(() => false)) {
    await demo.click();
    await page.locator('[data-testid="activity"]').waitFor();
  }
}

async function readItem() {
  await skipDemo();
  await page.waitForFunction(() => window.__prague?.item);
  return page.evaluate(() => window.__prague.item);
}

async function dragPiece(pieceId, zoneId) {
  const piece = page.locator(`[data-testid="piece:${pieceId}"]`);
  const zone = page.locator(`[data-testid="zone:${zoneId}"]`);
  await piece.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await zone.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
  const from = await piece.boundingBox();
  const to = await zone.boundingBox();
  if (!from || !to) throw new Error(`missing box ${pieceId} -> ${zoneId}`);
  const sx = from.x + from.width / 2;
  const sy = from.y + from.height / 2;
  const tx = to.x + to.width / 2;
  const ty = to.y + Math.min(to.height / 2, 36);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 24, sy + 12, { steps: 4 });
  await page.mouse.move(tx, ty, { steps: 16 });
  await page.mouse.up();
  const landed = async () => page.evaluate(({ id, zone }) => window.__prague.getState().at[id] === zone, { id: pieceId, zone: zoneId });
  await page.waitForTimeout(40);
  if (!(await landed())) {
    await piece.click({ force: true });
    await zone.click({ force: true });
    await page.waitForTimeout(40);
  }
  if (!(await landed())) throw new Error(`drag failed ${pieceId} -> ${zoneId}`);
}

async function turnHand(testId, degrees) {
  const face = page.locator('[data-testid="clock-face"], [data-testid="angle-face"]').first();
  const hand = page.locator(`[data-testid="${testId}"]`);
  const box = await face.boundingBox();
  const handBox = await hand.boundingBox();
  if (!box || !handBox) throw new Error(`missing ${testId}`);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const rad = (degrees * Math.PI) / 180;
  const radius = box.width * 0.32;
  const tx = cx + radius * Math.sin(rad);
  const ty = cy - radius * Math.cos(rad);
  await page.mouse.move(handBox.x + handBox.width / 2, handBox.y + handBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(tx, ty, { steps: 12 });
  await page.mouse.up();
}

async function solve(item) {
  for (const action of item.solution) {
    if (action.op === 'move') {
      const already = await page.evaluate((id) => window.__prague.getState().at[id], action.pieceId);
      if (already === action.zoneId) continue;
      await dragPiece(action.pieceId, action.zoneId);
    } else if (action.op === 'bundle') {
      await page.locator('[data-testid="bundle"]').click();
    } else if (action.op === 'tap') {
      await page.locator(`[data-testid="tap:${action.id}"]`).click();
    } else if (action.op === 'clock') {
      await turnHand('hand-minute', action.minute * 6);
      await turnHand('hand-hour', (action.hour % 12) * 30);
    } else if (action.op === 'angle') {
      await turnHand('angle-wand', action.degrees);
    }
  }
  await page.locator('[data-testid="cast"]').click();
  const note = page.locator('.note');
  await note.waitFor();
  const text = await note.innerText();
  if (!/spell worked|kind, careful|settled into place/i.test(text)) {
    const state = await page.evaluate(() => window.__prague.getState());
    throw new Error(`cast failed on ${item.template} ${item.topicName}: ${text}\n${JSON.stringify(state)}`);
  }
}

async function playOne(label) {
  const item = await readItem();
  templates.push(item.template);
  if (['ten-frame', 'number-line', 'base-ten', 'sharing', 'array', 'coins', 'clock', 'balance', 'measure', 'pattern', 'sort', 'bar-model', 'graph', 'coordinate', 'angle', 'chance'].includes(item.template)) {
    dragTemplates.add(item.template);
  }
  if (label) await shot(label);
  if (item.template === 'number-line' && item.hints?.[2]?.includes('Count up from')) {
    for (let i = 0; i < 3; i++) await page.locator('[data-testid="hint"]').click();
  }
  await solve(item);
  return item;
}

try {
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('[data-testid="start"]').waitFor();
  await shot('home-map');

  await page.locator('[data-testid="start"]').click();
  await page.locator('[data-testid="begin-placement"]').click();

  await playOne('activity-ten-frame');
  await page.locator('[data-testid="next"]').click();
  await playOne(null);
  await page.locator('[data-testid="next"]').click();
  await playOne('activity-number-line');
  await page.locator('[data-testid="next"]').click();
  await playOne('activity-sharing');
  await page.locator('[data-testid="next"]').click();
  await playOne(null);
  await page.locator('[data-testid="next"]').click();

  await page.locator('[data-testid="start-chapter"]').click();
  await page.locator('[data-testid="begin-puzzles"]').click();
  for (let i = 0; i < 6; i++) {
    await playOne(i === 0 ? 'activity-chapter' : null);
    await page.locator('[data-testid="next"]').click();
  }

  await page.locator('[data-testid="reward"]').waitFor();
  await shot('reward');
  await page.locator('[data-testid="reward-home"]').click();
  await page.locator('[data-testid="parent-link"]').click();
  await page.locator('[data-testid="gate-answer"]').fill('83');
  await page.locator('[data-testid="gate-submit"]').click();
  await page.locator('[data-testid="new-mastery"]').waitFor();
  const success = await page.locator('[data-testid="new-mastery"]').innerText();
  await shot('parent-journal');

  const speech = await page.evaluate(() => ({
    calls: window.__speakCalls ?? 0,
    log: window.__speechLog ?? [],
  }));
  if (speech.calls < 1) throw new Error('speechSynthesis.speak was not called');
  if (!speech.log.some((line) => line.includes('Count up from 4 to 6'))) {
    throw new Error(`missing count-up hint in speech log: ${speech.log.slice(0, 8).join(' | ')}`);
  }
  if (dragTemplates.size < 4) throw new Error(`only ${dragTemplates.size} drag templates: ${[...dragTemplates].join(', ')}`);
  if (!/correct/.test(success)) throw new Error(success);

  console.log(JSON.stringify({ templates, dragTemplates: [...dragTemplates], speakCalls: speech.calls, mastery: success }, null, 2));
} catch (error) {
  await page.screenshot({ path: `${shots}/failure.png` }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
