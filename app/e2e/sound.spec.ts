// Sound in the built app (docs/design.md "Engine lifecycle", "Taps"), in Chrome with an instrumented
// media element and AudioContext.
import { expect, test, type Page } from '@playwright/test';
import { quiet } from './island.ts';
import { fromMenu } from './hud.ts';

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
  await fromMenu(page, 'settings', 'tap');
  await page.locator('[data-push=look]').click();
  await page.locator('[data-push=villager]').click();
  await page.locator('.titlebar .back').click();
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
  // (a walker's footsteps are the island's own, whenever they fall: never a tap's)
  const take = () => page.evaluate(() => (window as unknown as { __cues: string[] }).__cues.splice(0).filter((c) => !c.startsWith('footstep-')));
  async function step(screen: string, name: string, act: () => Promise<unknown>, want?: string[]) {
    await take();
    await act();
    // wait for the tap's own cue (no fixed sleep); a tap that should be silent gets a short settle
    if (want?.length) {
      await expect.poll(() => page.evaluate((n) => (window as unknown as { __cues: string[] }).__cues.filter((c) => !c.startsWith('footstep-')).slice(0, n), want.length), { timeout: 3000 }).toEqual(want);
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
  await expect(page.locator('[data-hud-menu]')).toBeVisible();
  await quiet(page); // the opening beats are over
  await step('島', 'tree canopy', () => page.locator('button.canopy').first().tap(), ['tree-shake']);
  await expect(page.locator('.detail')).toHaveCount(1);
  await step('島', 'the tree popup (closes)', () => page.locator('.detail .plate').tap(), ['tick']);
  await page.waitForTimeout(800); // the camera back from making room for the popup
  // まえ again (a locator's tap may scroll the island's sticky stage), and the partner home from any outing
  await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(0));
  await expect(page.locator('.if-scene button.vil').nth(1)).toBeVisible({ timeout: 15_000 });
  await step('島', 'partner villager (→ the high-five)', () => page.locator('.if-scene button.vil').nth(1).tap(), ['villager-tap']);
  await expect(dlg).toHaveCount(0); // no card
  // in place: the hop's joyful sound comes with the tap (the step's log has it after the tap's own cue)
  expect(log.at(-1)?.[2]).toContain('emote-joy');
  await page.waitForTimeout(2000);

  // the island panel, ごほうび (the HUD menu's ベル row: the villagers glance up at it)
  const leaf = page.locator('[data-hud-menu]');
  await step('島', 'menu (unfold)', () => leaf.tap(), ['toggle-on']);
  await step('島', 'ベル (→ the panel)', () => page.locator('[data-hud-bells]').tap(), ['jar-tap', 'panel-open']);
  await step('ごほうび', 'ⓘ (a reward\'s examples)', () => dlg.locator('[data-info=snack]').tap(), ['tick']);
  await step('ごほうび', 'ⓘ again (folds them)', () => dlg.locator('[data-info=snack]').tap(), ['tick']);
  await step('ごほうび', 'a ledger day', () => dlg.locator('button.dbtn').first().tap(), ['page']);
  await step('ごほうび', 'back (‹) to the wallet', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('ごほうび', 'かいもの きろく (unfold)', () => dlg.locator('[data-hist-toggle]').tap(), ['toggle-on']);
  await step('ごほうび', 'かいもの きろく (fold)', () => dlg.locator('[data-hist-toggle]').tap(), ['toggle-off']);
  await dlg.locator('.panel-body').evaluate((el) => el.scrollTo({ top: 0 }));
  const shop = dlg.locator('.shop');
  const cant = shop.locator('button.item[aria-disabled="true"]');
  if (await cant.count()) await step('ごほうび', 'a reward it can\'t afford', () => cant.first().tap({ force: true }), ['boop']);
  await step('ごほうび', 'a reward', () => shop.locator('button.item:not([aria-disabled="true"])').first().tap(), ['open']);
  await step('ごほうび', '買う！', () => btn('買う！', dlg).tap(), ['buy']);
  const undo = btn('とりけす');
  await step('ごほうび', 'とりけす', () => undo.tap(), ['undo']);
  await page.waitForTimeout(400);
  await step('ごほうび', 'a reward, then やめる', () => shop.locator('button.item:not([aria-disabled="true"])').first().tap(), ['open']);
  await step('ごほうび', 'やめる (buy confirm)', () => btn('やめる', dlg).tap(), ['back']);
  await expect(dlg).toHaveCount(1); // the panel stays

  await step('パネル', 'close (×)', () => dlg.locator('.titlebar .close').tap(), ['panel-close']);
  await expect(dlg).toHaveCount(0);
  await page.waitForTimeout(400);

  // the HUD menu (NH's leaf): ずかん and せってい drop out of it; each pill: the villagers glance up, then its sheet
  await step('島', 'menu (unfold)', () => leaf.tap(), ['toggle-on']);
  await step('島', 'menu (fold)', () => leaf.tap(), ['toggle-off']);
  await step('島', 'menu (unfold) again', () => leaf.tap(), ['toggle-on']);
  await step('島', 'ずかん (→ the sheet)', () => page.locator('[data-hud-zukan]').tap(), ['jar-tap', 'panel-open']);
  await step('ずかん', 'a kind', () => dlg.locator('[data-zukan="shell"]').tap(), ['page']);
  await step('ずかん', 'back (‹)', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('ずかん', 'close (×)', () => dlg.locator('.titlebar .close').tap(), ['panel-close']);
  await expect(dlg).toHaveCount(0);
  await page.waitForTimeout(400);
  await step('島', 'menu (unfold)', () => leaf.tap(), ['toggle-on']);
  await step('島', 'せってい (→ the sheet)', () => page.locator('[data-hud-settings]').tap(), ['jar-tap', 'panel-open']);
  await step('すがた', 'かえる', () => dlg.locator('[data-push=look]').tap(), ['page']);
  await step('すがた', 'a category', () => dlg.locator('[data-cat=bottoms]').tap(), ['tick']);
  await step('すがた', 'むらびとの すがたに する', () => dlg.locator('[data-push=villager]').tap(), ['page']);
  await step('むらびと', 'search field', () => dlg.getByRole('searchbox').tap(), []);
  await step('むらびと', 'pick a villager', () => dlg.locator('.rv[aria-checked="false"]').first().tap(), ['tick']);
  await step('むらびと', 'back (‹)', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('すがた', 'back (‹)', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('サウンド', '音量 slider (change)', () => dlg.locator('input[type=range]').fill('6'), ['tick']);
  await step('ことば', '日本語 (already chosen)', () => dlg.getByRole('radio', { name: '日本語' }).tap(), []);
  await step('つうしん', 'いま つうしん', () => dlg.locator('.prows .btn').tap(), ['sync']);
  await step('つうしん', 'いま つうしん while syncing (aria-disabled)', () => dlg.locator('.prows .btn[aria-disabled="true"]').tap({ force: true, timeout: 300 }).catch(() => {}));
  await step('せってい', 'close (×)', () => dlg.locator('.titlebar .close').tap(), ['panel-close']);
  await expect(dlg).toHaveCount(0);
  await page.waitForTimeout(400);

  // the ベル row again: the panel at the wallet's top again (not where it closed)
  await step('島', 'menu (unfold) for ベル', () => leaf.tap(), ['toggle-on']);
  await step('島', 'ベル again (→ ごほうび)', () => page.locator('[data-hud-bells]').tap(), ['jar-tap', 'panel-open']);
  await expect(dlg.locator('[data-wallet]')).toBeVisible();
  await step('パネル', 'close (×)', () => dlg.locator('.titlebar .close').tap(), ['panel-close']);
  await expect(dlg).toHaveCount(0);
  await page.waitForTimeout(400);

  // けんこう (the HUD's dumbbell): the villagers glance up at it, then the popup
  await step('島', 'dumbbell (→ けんこう)', () => page.locator('.hud-health').tap(), ['jar-tap', 'panel-open']);
  const period = dlg.locator('select[data-pick=period]'), who = dlg.locator('select[data-pick=who]');
  await step('けんこう', '1年', () => period.selectOption('year'), ['tick']);
  await step('けんこう', '1年 again', () => period.selectOption('year'), []);
  await step('けんこう', '1か月', () => period.selectOption('month'), ['tick']);
  await step('けんこう', 'からだ', () => dlg.locator('[data-group=body]').tap(), ['tick']);
  await step('けんこう', 'からだ again', () => dlg.locator('[data-group=body]').tap(), []);
  await step('けんこう', 'かつどう', () => dlg.locator('[data-group=activity]').tap(), ['tick']);
  await step('けんこう', 'うめ', () => who.selectOption('B'), ['tick']);
  await step('けんこう', 'うめ again', () => who.selectOption('B'), []);
  await step('けんこう', '‹', () => dlg.locator('[data-nav=back]').tap(), ['tick']);
  await step('けんこう', 'きょう', () => dlg.locator('[data-nav=today]').tap(), ['tick']);
  await step('けんこう', 'きょう again (aria-disabled)', () => dlg.locator('[data-nav=today]').tap({ force: true }), ['boop']);
  await step('けんこう', '› at today (aria-disabled)', () => dlg.locator('[data-nav=on]').tap({ force: true }), ['boop']);
  await step('けんこう', 'back to ウェイ', () => who.selectOption('A'), ['tick']);
  // a goal, at its card's upper right
  await step('けんこう', 'the Move goal', () => dlg.locator('button[data-goal=move-goal]').tap(), ['page']);
  await step('けんこう', 'Move goal field', () => dlg.getByRole('textbox').tap(), []);
  await step('けんこう', '＋ (Move goal)', () => dlg.locator('[data-goal-step="1"]').tap(), ['tick']);
  await step('けんこう', 'やめる (Move goal)', () => btn('やめる', dlg).tap(), ['back']);
  await step('けんこう', 'the steps goal', () => dlg.locator('button[data-goal=steps-goal]').tap(), ['page']);
  await step('けんこう', 'the steps goal again (closes it)', () => dlg.locator('button[data-goal=steps-goal]').tap(), ['back']);
  await step('けんこう', 'close (×)', () => dlg.locator('.titlebar .close').tap(), ['panel-close']);
  await expect(dlg).toHaveCount(0);
  await expect(page.locator('.if-scene')).toBeVisible();

  if (process.env.WALK_LOG) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(process.env.WALK_LOG, ['| Screen | Tap | Cue(s) |', '|---|---|---|', ...log.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n');
  }
});
