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

/**
 * The tap walk (sound.md §13 "Every tap", the log): 効果音 on, every screen, each tap's cues read from the cue
 * function's test hook (`window.__cues`). Each step expects exactly its cue: one sound per tap, never two.
 * `WALK_LOG=path` writes the log as a markdown table.
 */
/** The island's own sounds (world cues and reactions), which may follow a tap that closes a sheet. */
const ISLAND = /^(fruit-land|coin-land|bells-arrive|tree-shake|emote-|announce|trouble|villager-tap|host-tap|jar-tap)/;

test('the tap walk: each tap plays its one cue', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    localStorage.setItem('island.sound', JSON.stringify({ music: false, sfx: true, voice: false, volume: 0.8 }));
    (window as unknown as { __cues: string[] }).__cues = [];
  });
  await page.goto('?demo&date=2026-11-04T12:00');
  const dlg = page.locator('dialog[open]');
  const log: [string, string, string][] = [];
  const take = () => page.evaluate(() => (window as unknown as { __cues: string[] }).__cues.splice(0));
  async function step(screen: string, name: string, act: () => Promise<unknown>, want?: string[]) {
    await take();
    await act();
    await page.waitForTimeout(260);
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
  const yes = btn('はい');
  const cta = page.locator('.below > .btn');
  await expect(cta.or(yes).first()).toBeVisible();
  for (let i = 0; i < 5 && !(await cta.isVisible()); i++) {
    if (await yes.isVisible()) await step('島', 'しずえ: はい (choice)', () => yes.tap(), ['choice-pick']);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1500); // the opening beats
  await step('島', 'check-in CTA', () => cta.tap(), ['open']);
  await step('チェックイン', '昨日', () => btn('昨日', dlg).or(btn(/^昨日 ·/, dlg)).first().tap(), ['tick']);
  await step('チェックイン', '昨日 again (already shown)', () => btn('昨日', dlg).or(btn(/^昨日 ·/, dlg)).first().tap(), []);
  await step('チェックイン', '今日', () => btn('今日', dlg).tap(), ['tick']);
  const sw = dlg.getByRole('switch').first();
  const on = (await sw.getAttribute('aria-checked')) === 'true';
  await step('チェックイン', `habit switch ${on ? 'off' : 'on'}`, () => sw.tap(), [on ? 'toggle-off' : 'checkin-saved']);
  await step('チェックイン', `habit switch ${on ? 'on' : 'off'}`, () => sw.tap(), [on ? 'checkin-saved' : 'toggle-off']);
  await step('チェックイン', 'ぜんぶできた！', () => btn('ぜんぶできた！', dlg).tap(), ['checkin-saved']);
  await step('チェックイン', 'ぜんぶそろいました (aria-disabled)', () => btn('ぜんぶそろいました', dlg).tap({ force: true }), ['boop']);
  await step('チェックイン', '保存', () => btn('保存', dlg).tap(), ['confirm']);
  await expect(dlg).toHaveCount(0);
  await page.waitForTimeout(400);
  await step('島', 'tree canopy', () => page.locator('button.canopy').first().tap(), ['tree-shake']);
  await step('島', 'tree canopy again (closes)', () => page.locator('button.canopy').first().tap(), ['tick']);
  await step('島', 'partner villager', () => page.locator('.if-scene button.vil').nth(1).tap());
  await expect(dlg).toHaveCount(1);
  await step('なかま', 'fruit ring', () => dlg.locator('button.fr').nth(1).tap(), ['tick']);
  await step('なかま', 'grabber', () => dlg.locator('.grabber').tap(), ['back']);
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

  // しまフォン
  const phone = btn('しまフォンを開く');
  await step('しまフォン', 'NookPhone button', () => phone.tap(), ['phone-open']);
  await step('しまフォン', 'きろく tile', () => page.locator('.app[data-app=kiroku]').tap(), ['phone-app']);
  await expect(dlg.locator('.pill').first()).toBeVisible();
  await step('きろく', 'ベル tab', () => dlg.locator('.pill').nth(1).tap(), ['tick']);
  await step('きろく', 'ベル tab again', () => dlg.locator('.pill').nth(1).tap(), []);
  await step('きろく', 'からだ tab', () => dlg.locator('.pill').nth(0).tap(), ['tick']);
  await step('きろく', 'weight card', () => btn(/の体重のながれ/, dlg).first().tap(), ['page']);
  await step('きろく', 'back (‹)', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('きろく', 'week card', () => btn(/^今週/, dlg).tap(), ['page']);
  const future = dlg.locator('button.day[aria-disabled="true"]');
  if (await future.count()) await step('きろく', 'a future day (aria-disabled)', () => future.first().tap({ force: true }), ['boop']);
  await step('きろく', 'day', () => btn(/^月/, dlg).tap(), ['page']);
  await step('きろく', '✎ steps', () => btn(/^歩数/, dlg).tap(), ['page']);
  const pad = dlg.locator('.atm');
  await step('きろく', 'keypad 1', () => btn('1', pad).tap(), ['key']);
  await step('きろく', 'keypad ⌫', () => btn('ひとつ消す', pad).or(pad.locator('.key.fn').first()).first().tap(), ['key-fn']);
  await step('きろく', 'keypad 2', () => btn('2', pad).tap(), ['key']);
  await step('きろく', 'keypad C', () => pad.locator('.key.fn').nth(1).tap(), ['key-fn']);
  await step('きろく', 'けってい with nothing typed (aria-disabled)', () => btn('けってい', dlg).tap({ force: true }), ['boop']);
  await step('きろく', 'やめる (choice)', () => btn('やめる', dlg).tap(), ['back']);
  await step('きろく', '✎ steps again', () => btn(/^歩数/, dlg).tap(), ['page']);
  for (const k of '4321') await btn(k, pad).tap();
  await step('きろく', 'けってい', () => btn('けってい', dlg).tap(), ['choice-pick']);
  const undo = btn('もとに戻す');
  await step('きろく', 'もとに戻す (banner)', () => undo.tap(), ['undo']);
  await step('きろく', 'back (‹) to the week', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('きろく', 'back (‹) to the list', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('きろく', 'back (‹) to home', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('しまフォン', 'あそびかた tile', () => page.locator('.app[data-app=help]').tap(), ['phone-app']);
  await step('しまフォン', 'back', () => dlg.locator('.titlebar .back').tap(), ['back']);
  await step('しまフォン', '通信 tile', () => page.locator('.app[data-app=sync]').tap(), ['phone-app']);
  await step('通信', 'いま同期', () => dlg.locator('.btn').tap(), ['sync']);
  await step('通信', 'いま同期 while syncing (aria-disabled)', () => dlg.locator('.btn[aria-disabled="true"]').tap({ force: true, timeout: 300 }).catch(() => {}));
  await dlg.locator('.titlebar .back').tap();
  await step('しまフォン', 'ことば tile', () => page.locator('.app[data-app=lang]').tap(), ['phone-app']);
  await step('ことば', '日本語 (already chosen)', () => dlg.getByRole('radio', { name: '日本語' }).tap(), []);
  await dlg.locator('.titlebar .back').tap();
  await step('しまフォン', 'じゅうにん tile', () => page.locator('.app[data-app=villager]').tap(), ['phone-app']);
  await step('じゅうにん', 'search field', () => dlg.getByRole('searchbox').tap(), []);
  await step('じゅうにん', 'pick a villager', () => dlg.locator('.rv[aria-checked="false"]').first().tap(), ['tick']);
  await dlg.locator('.titlebar .back').tap();
  await step('しまフォン', 'サウンド tile', () => page.locator('.app[data-app=sound]').tap(), ['phone-app']);
  await step('サウンド', 'おしゃべり on', () => dlg.getByRole('switch', { name: /^おしゃべり/ }).tap(), ['toggle-on']);
  await step('サウンド', 'おしゃべり off', () => dlg.getByRole('switch', { name: /^おしゃべり/ }).tap(), ['toggle-off']);
  await step('サウンド', '音量 slider (change)', () => dlg.locator('input[type=range]').fill('6'), ['tick']);
  await step('しまフォン', 'close (×)', () => dlg.locator('.titlebar .close').tap(), ['phone-close']);
  await expect(dlg).toHaveCount(0);
  await step('島', 'ribbon (→ きろく ベル)', () => btn(/^きょう [\d,]+\sベル$/).tap(), ['phone-open']);
  await step('しまフォン', 'grabber', () => dlg.locator('.grabber').tap(), ['phone-close']);
  await expect(dlg).toHaveCount(0);
  await page.waitForTimeout(400);

  // ふたりの壺
  await step('島', 'jar', () => page.locator('.if-scene .jar').tap(), ['jar-tap']);
  await expect(page.locator('.jar-screen')).toBeVisible();
  await page.waitForTimeout(600);
  const pot = page.locator('[data-pot=treat]');
  const cant = pot.locator('button.item[aria-disabled="true"]');
  if (await cant.count()) await step('壺', 'a treat it can\'t afford', () => cant.first().tap({ force: true }), ['boop']);
  await step('壺', 'a treat', () => pot.locator('button.item:not([aria-disabled="true"])').first().tap(), ['open']);
  await step('壺', '買う！', () => btn('買う！', dlg).tap(), ['buy']);
  await step('壺', 'もとに戻す', () => undo.tap(), ['undo']);
  await page.waitForTimeout(400);
  await step('壺', '✎ へんしゅう', () => btn(/へんしゅう/, pot).tap(), ['open']);
  await step('へんしゅう', 'save, nothing changed (aria-disabled)', () => btn('保存', dlg).tap({ force: true }), ['boop']);
  await step('へんしゅう', '＋ add', () => btn(/おやつを追加/, dlg).tap(), ['open']);
  await step('へんしゅう', 'name field', () => dlg.locator('input.lbl').last().tap(), []);
  await step('へんしゅう', '× remove', () => dlg.locator('button.rm').last().tap(), ['remove']);
  await step('へんしゅう', 'やめる', () => btn('やめる', dlg).tap(), ['back']);
  await expect(dlg).toHaveCount(0);
  const trip = page.locator('[data-pot=trip] .go');
  if (await trip.count()) {
    await step('壺', '行く！', () => trip.first().tap(), ['open']);
    await step('壺', 'backdrop', () => page.touchscreen.tap(10, 20), ['back']);
  }
  await step('壺', '◀ 島へ', () => page.locator('a.back').tap(), ['back']);
  await expect(page.locator('.if-scene')).toBeVisible();

  if (process.env.WALK_LOG) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(process.env.WALK_LOG, ['| Screen | Tap | Cue(s) |', '|---|---|---|', ...log.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n');
  }
});
