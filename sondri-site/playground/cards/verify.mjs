// Run from the repo: npx -y --package=puppeteer -c 'node sondri-site/playground/cards/verify.mjs'
// Puppeteer and Chromium live in the npx cache; no project dependencies are installed.
import { mkdir, readFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, delimiter } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

async function loadPuppeteer() {
  try { return (await import('puppeteer')).default; }
  catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    // npx adds its ephemeral node_modules/.bin to PATH, not Node's import search path.
    for (const bin of (process.env.PATH || '').split(delimiter)) {
      try {
        await access(join(bin, 'puppeteer'));
        const require = createRequire(join(dirname(bin), 'puppeteer-loader.cjs'));
        return (await import(pathToFileURL(require.resolve('puppeteer')).href)).default;
      } catch { /* Continue to the next PATH entry. */ }
    }
    throw new Error("Run with: npx -y --package=puppeteer -c 'node sondri-site/playground/cards/verify.mjs'");
  }
}
const puppeteer = await loadPuppeteer();
const here = dirname(fileURLToPath(import.meta.url));
const output = '/Users/I852000/crew/mate/leads/sondri/screens-2026-09-21';
const manifest = JSON.parse(await readFile(join(here, 'index.json'), 'utf8'));
const issues = [];
const failures = [];
const external = [];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const browser = await puppeteer.launch({ headless: true });
await mkdir(output, { recursive: true });
function watch(page) {
  page.on('console', message => {
    if (['error', 'warning', 'warn'].includes(message.type())) issues.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', error => issues.push(`pageerror: ${error.message}`));
  page.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
}
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage();
    watch(page);
    await page.setViewport({ width, height: width === 1440 ? 1200 : 1400, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(join(here, 'demo.html')).href, { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelectorAll('section[data-inited="1"]').length === 9);
    await wait(3100);
    await page.screenshot({ path: join(output, `playground-a-grid-${width}.png`), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `${width}px page overflows horizontally`);
    for (const card of manifest) {
      const element = await page.$(`#${card.id}-root`);
      await element.scrollIntoView();
      await wait(width === 390 ? 3100 : 160);
      const status = await element.evaluate(root => {
        const bounds = root.getBoundingClientRect();
        const stage = root.querySelector(`.${root.id.slice(0, 3)}-stage`);
        const caption = root.querySelector(`.${root.id.slice(0, 3)}-caption`);
        const captionBounds = caption.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height, inited: root.dataset.inited === '1', stageHeight: stage.getBoundingClientRect().height, captionFits: captionBounds.left >= bounds.left && caption.scrollWidth <= caption.clientWidth };
      });
      assert.ok(status.captionFits, `${card.id} caption overflows`);
      assert.ok(status.inited && status.width >= 300 && status.stageHeight > 100, `${card.id} render failed`);
      console.log(`${width}px · ${card.id} ${card.title} · ${status.width.toFixed(1)}×${status.height.toFixed(1)} · inited=${status.inited}`);
      const path = join(output, `playground-a-${card.id.slice(1)}-${width}.png`);
      const before = await element.screenshot({ path });
      await wait(360);
      const after = await element.screenshot();
      if (Buffer.from(before).equals(Buffer.from(after))) failures.push(`${width}px ${card.id}: no visible animation over 360ms`);
    }
    if (width === 1440) {
      await page.evaluate(() => scrollTo(0, 0));
      const graph = await page.$('#c02-root');
      const box = await graph.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await wait(700);
      await graph.screenshot({ path: join(output, 'playground-a-02-1440-hover.png') });
      await page.mouse.move(0, 0);
      // Observe complete cycles together: every card fits into the desktop viewport.
      const observed = new Map(manifest.map(card => [card.id, new Set()]));
      for (let sample = 0; sample < 92; sample++) {
        const states = await page.evaluate(() => Array.from(document.querySelectorAll('section')).map(root => ({ id: root.id.slice(0, 3), text: root.innerText })));
        states.forEach(state => observed.get(state.id).add(state.text));
        await wait(300);
      }
      const chatStates = [...observed.get('c03')].join('\n');
      for (const tool of ['lookup_order', 'check_refund', 'find_slot']) assert.ok(chatStates.includes(tool), `Chat never reached ${tool}`);
      for (const id of ['c03', 'c05', 'c06', 'c07', 'c09']) {
        assert.ok(observed.get(id).size > 3, `${id} did not advance through its cycle`);
      }
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await wait(500);
      const reducedBefore = await page.screenshot({ path: join(output, 'playground-a-grid-reduced.png'), fullPage: true });
      await wait(700);
      const reducedAfter = await page.screenshot({ fullPage: true });
      assert.ok(Buffer.from(reducedBefore).equals(Buffer.from(reducedAfter)), 'Reduced-motion page is still moving');
      const endStates = await page.evaluate(() => ({ queue: document.querySelector('.c07-count').textContent, clauses: Array.from(document.querySelectorAll('.c09-value')).map(el => el.textContent) }));
      assert.deepEqual(endStates, { queue: '0', clauses: ['14', '11', '3'] });
      console.log('Reduced motion: static pixels; queue 0; clauses 14 / OK 11 / risk 3.');
    }
    await page.close();
  }
  // Exercise the actual integration contract: innerHTML followed by script execution.
  const inserted = await browser.newPage();
  watch(inserted);
  await inserted.setViewport({ width: 390, height: 700 });
  for (const card of manifest) {
    const fragment = await readFile(join(here, card.file), 'utf8');
    await inserted.goto('about:blank');
    await inserted.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await inserted.evaluate(html => {
      document.body.innerHTML = html;
      const source = document.querySelector('section script').textContent;
      for (let copy = 0; copy < 2; copy++) {
        const script = document.createElement('script');
        script.textContent = source;
        document.body.append(script);
      }
    }, fragment);
    await wait(120);
    assert.equal(await inserted.$eval(`#${card.id}-root`, el => el.dataset.inited), '1');
  }
  await inserted.close();
  console.log('All nine fragments initialise alone via innerHTML in reduced motion; executing scripts twice is safe.');
  // A card can hold a completed state for 1–2s, so a short still sample is informational.
  for (const note of failures) console.log(`Animation sample: ${note} (cycle/hold inspected separately)`);
  assert.equal(external.length, 0, 'Cards made external requests');
} finally {
  await browser.close();
  issues.forEach(issue => console.error(issue));
  console.log(`Console errors/warnings + pageerrors: ${issues.length}`);
  console.log(`External requests: ${external.length}`);
  console.log(`Screenshots: ${output}`);
}
assert.equal(issues.length, 0, 'Browser reported errors or warnings');
