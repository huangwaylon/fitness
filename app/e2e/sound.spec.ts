// Sound in the built app (docs/design/sound.md §11 "The first tap", §13 "Every tap"), in Chrome with an instrumented
// media element and AudioContext.
import { expect, test, type Page } from '@playwright/test';

type Play = { music: boolean; gesture: boolean; ok: boolean };
type Probe = { plays: Play[]; decks: HTMLMediaElement[]; contexts: number; music: Set<string> };

/**
 * A strict, WebKit-like media policy on top of Chrome's: `play()` is refused (NotAllowedError) unless it is called
 * inside an activation (pointerup by touch, touchend, click, keydown) or the element already played inside one;
 * `perSrc`: already played inside one *with this source* (the strictest reading: a silent clip's unlock doesn't carry
 * over to the music file). `noClick`: clicks never reach the page, as on iOS when a tap lands on plain scenery.
 */
async function instrument(page: Page, o: { sound: Record<string, unknown>; noClick?: boolean; perSrc?: boolean }) {
  await page.addInitScript(({ sound, noClick, perSrc }) => {
    localStorage.setItem('island.sound', JSON.stringify(sound));
    const probe: Probe = { plays: [], decks: [], contexts: 0, music: new Set() };
    (window as unknown as { __probe: Probe }).__probe = probe;
    // blob URLs of music files (not the engine's silent WAV)
    const url = URL.createObjectURL;
    URL.createObjectURL = (b: Blob | MediaSource) => {
      const u = url(b);
      if (b instanceof Blob && b.type !== 'audio/wav') probe.music.add(u);
      return u;
    };
    // first, so the gesture listeners below never see a click either
    if (noClick) window.addEventListener('click', (e) => e.stopImmediatePropagation(), { capture: true });
    let gesture = false;
    const on = (e: Event) => {
      if (e.type === 'pointerup' && (e as PointerEvent).pointerType === 'mouse') return;
      gesture = true;
    };
    const off = () => queueMicrotask(() => (gesture = false));
    for (const g of ['pointerup', 'touchend', 'click', 'keydown']) {
      window.addEventListener(g, on, { capture: true });
      window.addEventListener(g, off);
    }
    const unlocked = new Set<string>();
    const ids = new WeakMap<HTMLMediaElement, number>();
    let n = 0;
    const keyOf = (el: HTMLMediaElement) => {
      if (!ids.has(el)) ids.set(el, ++n);
      return `${ids.get(el)}${perSrc ? el.src : ''}`;
    };
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (!probe.decks.includes(this)) probe.decks.push(this);
      const ok = gesture || unlocked.has(keyOf(this));
      probe.plays.push({ music: probe.music.has(this.src), gesture, ok });
      if (!ok) return Promise.reject(new DOMException('not allowed', 'NotAllowedError'));
      unlocked.add(keyOf(this));
      return play.call(this);
    };
    const AC = window.AudioContext;
    window.AudioContext = class extends AC {
      constructor(o?: AudioContextOptions) {
        super(o);
        probe.contexts++;
      }
    };
  }, o);
}

const probe = (page: Page) => page.evaluate(() => {
  const p = (window as unknown as { __probe: Probe }).__probe;
  return { plays: p.plays, contexts: p.contexts, playing: p.decks.filter((d) => !d.paused && p.music.has(d.currentSrc)).length };
});

/** Open sea, under the horizon: plain scenery, no control under the finger. */
const sea = (page: Page) =>
  page.locator('.if-scene .stage').evaluate((st) => {
    const cs = getComputedStyle(st);
    const r = st.getBoundingClientRect();
    return { x: r.left + r.width * 0.7, y: r.top + parseFloat(cs.getPropertyValue('--if-hy')) - parseFloat(cs.getPropertyValue('--if-st')) + 14 };
  });

test.describe('the first tap starts the music', () => {
  for (const [wait, perSrc] of [[1800, false], [0, false], [1800, true]] as const) {
    test(`a tap on plain scenery, no click (iOS), ${wait ? 'hour prefetched' : 'straight after launch'}${perSrc ? ', strict per-source policy' : ''}`, async ({ page }) => {
      await instrument(page, { sound: { music: true, sfx: false, voice: false, volume: 0.8 }, noClick: true, perSrc });
      await page.goto('?demo&date=2026-11-04T12:00');
      await expect(page.locator('.if-scene .stage')).toBeVisible();
      await page.waitForTimeout(wait);
      expect((await probe(page)).contexts).toBe(0); // nothing before the tap
      const { x, y } = await sea(page);
      await page.touchscreen.tap(x, y);
      await expect.poll(async () => (await probe(page)).playing, { timeout: wait ? 1000 : 4000 }).toBe(1);
      const p = await probe(page);
      if (process.env.DEBUG_SOUND) console.log(JSON.stringify(p.plays));
      expect(p.contexts).toBe(1);
      expect(p.plays.filter((x) => x.music).every((x) => x.ok)).toBe(true); // never refused
      // prefetched: the hour itself started inside the tap
      if (wait) expect(p.plays.some((x) => x.music && x.gesture && x.ok)).toBe(true);
    });
  }
});

test('strict per-source policy, tapped before the file is in: a refused start is retried by the next plain tap', async ({ page }) => {
  await instrument(page, { sound: { music: true, sfx: false, voice: false, volume: 0.8 }, noClick: true, perSrc: true });
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(page.locator('.if-scene .stage')).toBeVisible();
  const { x, y } = await sea(page);
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(1500);
  if ((await probe(page)).playing === 0) await page.touchscreen.tap(x, y);
  await expect.poll(async () => (await probe(page)).playing, { timeout: 1000 }).toBe(1);
});

test('sound off: no AudioContext, no media element, however much is tapped', async ({ page }) => {
  await instrument(page, { sound: { music: false, sfx: false, voice: false, volume: 0.8 } });
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(page.locator('.if-scene .stage')).toBeVisible();
  const { x, y } = await sea(page);
  await page.touchscreen.tap(x, y);
  await page.locator('.phone-btn').click();
  await page.locator('.app[data-app="kiroku"]').click();
  await page.locator('.titlebar .back').click();
  await page.locator('.titlebar .close').click();
  await page.waitForTimeout(500);
  const p = await probe(page);
  expect(p.contexts).toBe(0);
  expect(p.plays).toEqual([]);
});
