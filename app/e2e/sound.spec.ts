// Sound in the built app (docs/design.md "Engine lifecycle", "Taps"), in Chrome with an instrumented
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
      await instrument(page, { sound: { music: true, sfx: false, volume: 0.8 }, noClick: true, perSrc });
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
  await instrument(page, { sound: { music: true, sfx: false, volume: 0.8 }, noClick: true, perSrc: true });
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(page.locator('.if-scene .stage')).toBeVisible();
  const { x, y } = await sea(page);
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(1500);
  if ((await probe(page)).playing === 0) await page.touchscreen.tap(x, y);
  await expect.poll(async () => (await probe(page)).playing, { timeout: 1000 }).toBe(1);
});

test('sound off: no AudioContext, no media element, however much is tapped', async ({ page }) => {
  await instrument(page, { sound: { music: false, sfx: false, volume: 0.8 } });
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(page.locator('.if-scene .stage')).toBeVisible();
  const { x, y } = await sea(page);
  await page.touchscreen.tap(x, y);
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await page.locator('.tab[data-tab=settings]').click();
  await page.locator('[data-push=help]').click();
  await page.locator('.titlebar .back').click();
  await page.locator('.titlebar .close').click();
  await page.waitForTimeout(500);
  const p = await probe(page);
  expect(p.contexts).toBe(0);
  expect(p.plays).toEqual([]);
});

/**
 * The tap walk (design.md "Taps", the log): 効果音 on, every screen, each tap's cues read from the cue
 * function's test hook (`window.__cues`). Each step expects exactly its cue: one sound per tap, never two.
 * `WALK_LOG=path` writes the log as a markdown table.
 */
/** The island's own sounds (world cues and reactions), which may follow a tap that closes a sheet. */
const ISLAND = /^(fruit-land|coin-land|bells-arrive|tree-shake|emote-|announce|trouble|villager-tap|host-tap|jar-tap)/;

test('the tap walk: each tap plays its one cue', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    localStorage.setItem('island.sound', JSON.stringify({ music: false, sfx: true, volume: 0.8 }));
    (window as unknown as { __cues: string[] }).__cues = [];
  });
  await page.goto('?demo&date=2026-11-04T12:00');
  const dlg = page.locator('dialog[open]');
  const log: [string, string, string][] = [];
  const take = () => page.evaluate(() => (window as unknown as { __cues: string[] }).__cues.splice(0));
  async function step(screen: string, name: string, act: () => Promise<unknown>, want?: string[]) {
    await take();
    await act();
    // wait for the tap's own cue (no fixed sleep); a tap that should be silent gets a short settle
    if (want?.length) {
      await expect.poll(() => page.evaluate((n) => (window as unknown as { __cues: string[] }).__cues.slice(0, n), want.length), { timeout: 3000 }).toEqual(want);
    } else await page.waitForTimeout(260);
    // and for a sheet that is sliding in or out to settle, so the next tap lands where its button ends up
    await page.waitForFunction(() => document.getAnimations().every((a) => {
      const el = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return !el?.closest('dialog') || a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity;
    }));
    const got = await take();
    log.push([screen, name, got.join(' + ') || '(silent)']);
    if (!want) return;
    // the tap's own cue, once; anything after it is the island answering (fruit landing, coins, an emote), never a
    // second UI sound
    expect(got.slice(0, want.length), `${screen} · ${name}`).toEqual(want);
    expect(got.slice(want.length).filter((c) => !ISLAND.test(c)), `${screen} · ${name}: extra`).toEqual([]);
  }
  const btn = (name: string | RegExp, scope = page.locator('body')) => scope.getByRole('button', { name, exact: typeof name === 'string' });

  // 島
  await expect(btn(/^きょう [\d,]+\sベル$/)).toBeVisible();
  await page.waitForTimeout(1500); // the opening beats
  await step('島', 'tree canopy', () => page.locator('button.canopy').first().tap(), ['tree-shake']);
  await expect(page.locator('.detail')).toHaveCount(1);
  await step('島', 'the tree popup (closes)', () => page.locator('.detail .plate').tap(), ['tick']);
  await step('島', 'partner villager', () => page.locator('.if-scene button.vil').nth(1).tap());
  await expect(dlg).toHaveCount(1);
  await step('なかま', '✕', () => dlg.locator('.navbar .close').tap(), ['back']);
  await expect(dlg).toHaveCount(0);
  await page.waitForTimeout(400);
  await page.locator('.if-scene button.vil').nth(1).tap();
  await expect(dlg).toHaveCount(1);
  await page.waitForTimeout(300);
  await step('なかま', 'Esc', () => page.keyboard.press('Escape'), ['back']);
  await page.waitForTimeout(400);
  await page.locator('.if-scene button.vil').nth(1).tap();
  await expect(dlg).toHaveCount(1);
  await step('なかま', 'ハイタッチ', () => btn(/ハイタッチ/, dlg).tap());
  await page.waitForTimeout(2000);

  // the island panel (tap the ribbon)
  await step('島', 'ribbon (→ the panel)', () => btn(/^きょう [\d,]+\sベル$/).tap(), ['phone-open']);
  await step('きろく', 'weight card', () => btn(/の体重のながれ/, dlg).first().tap(), ['page']);
  await step('きろく', 'back (‹)', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('きろく', 'week card', () => btn(/^今週/, dlg).tap(), ['page']);
  const future = dlg.locator('button.day[aria-disabled="true"]');
  if (await future.count()) await step('きろく', 'a future day (aria-disabled)', () => future.first().tap({ force: true }), ['boop']);
  await step('きろく', 'day', () => btn(/\(月\)$/, dlg).tap(), ['page']);
  await step('きろく', 'back (‹) to the week', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('きろく', 'back (‹) to the panel', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('きろく', '✎ Move goal', () => btn(/ムーブ（1日） ✎$/, dlg).tap(), ['page']);
  await step('きろく', 'Move goal field', () => dlg.getByRole('textbox').tap(), []);
  await step('きろく', 'やめる (Move goal)', () => btn('やめる', dlg).tap(), ['back']);
  await step('パネル', 'せってい tab', () => dlg.locator('.tab[data-tab=settings]').tap(), ['tick']);
  await step('パネル', 'せってい tab again', () => dlg.locator('.tab[data-tab=settings]').tap(), []);
  await step('むらびと', 'かえる', () => dlg.locator('[data-push=villager]').tap(), ['page']);
  await step('むらびと', 'search field', () => dlg.getByRole('searchbox').tap(), []);
  await step('むらびと', 'pick a villager', () => dlg.locator('.rv[aria-checked="false"]').first().tap(), ['tick']);
  await step('むらびと', 'back (‹)', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('サウンド', '音量 slider (change)', () => dlg.locator('input[type=range]').fill('6'), ['tick']);
  await step('ことば', '日本語 (already chosen)', () => dlg.getByRole('radio', { name: '日本語' }).tap(), []);
  await step('つうしん', 'いま つうしん', () => dlg.locator('.prows .btn').tap(), ['sync']);
  await step('つうしん', 'いま つうしん while syncing (aria-disabled)', () => dlg.locator('.prows .btn[aria-disabled="true"]').tap({ force: true, timeout: 300 }).catch(() => {}));
  await step('あそびかた', 'くわしく', () => dlg.locator('[data-push=help]').tap(), ['page']);
  await step('あそびかた', 'back (‹)', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('パネル', 'きろく tab', () => dlg.locator('.tab[data-tab=kiroku]').tap(), ['tick']);
  await step('パネル', 'close (×)', () => dlg.locator('.titlebar .close').tap(), ['phone-close']);
  await expect(dlg).toHaveCount(0);
  await page.waitForTimeout(400);

  // ごほうび
  await step('島', 'jar', () => page.locator('.if-scene .jar').tap(), ['jar-tap']);
  await expect(page.locator('.jar-screen')).toBeVisible();
  await page.waitForTimeout(600);
  const treats = page.locator('.treats');
  const cant = treats.locator('button.item[aria-disabled="true"]');
  if (await cant.count()) await step('ごほうび', 'a treat it can\'t afford', () => cant.first().tap({ force: true }), ['boop']);
  await step('ごほうび', 'a treat', () => treats.locator('button.item:not([aria-disabled="true"])').first().tap(), ['open']);
  await step('ごほうび', '買う！', () => btn('買う！', dlg).tap(), ['buy']);
  const undo = btn('とりけす');
  await step('ごほうび', 'とりけす', () => undo.tap(), ['undo']);
  await page.waitForTimeout(400);
  await step('ごほうび', 'a treat, then やめる', () => treats.locator('button.item:not([aria-disabled="true"])').first().tap(), ['open']);
  await step('ごほうび', 'やめる (buy confirm)', () => btn('やめる', dlg).tap(), ['back']);
  await expect(dlg).toHaveCount(0);
  await page.waitForTimeout(400);
  await step('ごほうび', '✎ メニューを かえる', () => btn('メニューを かえる', treats).tap(), ['open']);
  await step('へんしゅう', 'save, nothing changed (aria-disabled)', () => btn('保存', dlg).tap({ force: true }), ['boop']);
  await step('へんしゅう', '＋ add', () => btn(/ふやす/, dlg).tap(), ['open']);
  await step('へんしゅう', 'name field', () => dlg.locator('input.lbl').last().tap(), []);
  await step('へんしゅう', '× remove', () => dlg.locator('button.rm').last().tap(), ['remove']);
  await step('へんしゅう', 'やめる', () => btn('やめる', dlg).tap(), ['back']);
  await expect(dlg).toHaveCount(0);
  await step('ごほうび', '◀ 島へ', () => page.locator('a.back').tap(), ['back']);
  await expect(page.locator('.if-scene')).toBeVisible();

  if (process.env.WALK_LOG) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(process.env.WALK_LOG, ['| Screen | Tap | Cue(s) |', '|---|---|---|', ...log.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n');
  }
});
