// The shared music (docs/sound-sync.md; the user: "the music should be synced across players: anyone can request and
// stop KK music"): a song on the island's stage plays on every phone from the same point (the relay's clock), whoever
// asked; anyone stops it for everyone; a phone opening mid-song comes in where the song is; one that can't hear it
// (ミュージック off) still sees it, with 🔇. The demo's players are tabs of one browser (sync/live-local.ts plays the
// room). Never listened to: the music deck's key and position come from window.__music (in the demo).
import { expect, test, type Page } from '@playwright/test';
import { hudMenu } from './hud.ts';

type Now = { key: string | null; pos: number | null };
type H = { __music: { now(): Now; request(src: string, song: string, o?: { ms?: number; pc?: string }): void; hush(src: string): void } };
const h = <R,>(page: Page, fn: (h: H) => R) => page.evaluate(`(${fn.toString()})(window)`) as Promise<R>;
const Q = 'date=2026-11-04T15:00&critter=none&visitor=none';
const SONG = 'kk-march';

/** A phone of the demo (`as`: B, G), ミュージック on or off, its audio unlocked by a tap. */
async function open(page: Page, as: string, music = true) {
  await page.addInitScript((m) => localStorage.setItem('island.sound', JSON.stringify({ music: m, sfx: false, volume: 0.8 })), music);
  await page.goto(`?demo${as ? `&as=${as}` : ''}&${Q}`);
  await expect(hudMenu(page)).toBeVisible();
  // a tap high on the sky: unlocks audio, takes nothing
  await page.mouse.click(196, 90);
}

/** The deck's position on each page sampled together, each moved to one instant (the pages share a clock). */
async function positions(...pages: Page[]): Promise<(number | null)[]> {
  const got = await Promise.all(pages.map((p) => p.evaluate(() => ({ ...(window as unknown as H).__music.now(), t: Date.now() }))));
  const t0 = got[0].t;
  return got.map((g) => (g.pos === null || !g.key?.startsWith(`st/isl/${SONG}/`) ? null : g.pos + (t0 - g.t) / 1000));
}

const playing = (page: Page) => h(page, (w) => w.__music.now().key);

test('K.K. for everyone: A asks, B hears it from the same point; G opening mid-song comes in there; B stops it for all', { tag: '@logic' }, async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a, '');
  await open(b, 'B');
  await h(a, (w) => w.__music.request('isl', 'kk-march'));
  // B: his caption and the song on its deck
  await expect(b.locator('[data-fx="kk-caption"]')).toContainText('♪ けけマーチ');
  await expect(b.locator('[data-kk].show')).toHaveCount(1);
  await expect.poll(() => positions(a, b).then((p) => p.every((x) => x !== null && x > 0.5)), { timeout: 15_000 }).toBe(true);
  await a.waitForTimeout(1500);
  const [pa, pb] = await positions(a, b);
  expect(Math.abs(pa! - pb!), `A ${pa} B ${pb}`).toBeLessThan(0.5);
  // G opens 4 s on: it starts where the song is, not at its beginning
  await a.waitForTimeout(4000);
  const g = await ctx.newPage();
  await open(g, 'G');
  await expect(g.locator('[data-kk].show')).toHaveCount(1);
  await expect.poll(() => positions(a, g).then(([x, y]) => x !== null && y !== null && y > 4), { timeout: 15_000 }).toBe(true);
  const [qa, qg] = await positions(a, g);
  expect(Math.abs(qa! - qg!), `A ${qa} G ${qg}`).toBeLessThan(0.5);
  // B stops it: on every phone the island's music again, the caption gone, his sign-off
  await h(b, (w) => w.__music.hush('isl'));
  for (const p of [a, b, g]) {
    await expect.poll(() => playing(p)).not.toMatch(/^st\//);
    await expect(p.locator('[data-fx="kk-caption"]')).toHaveCount(0);
    await expect(p.locator('[data-kk].show')).toHaveCount(0);
  }
  await ctx.close();
});

test('with ミュージック off B sees K.K. play (his caption with 🔇) and hears nothing', { tag: '@logic' }, async ({ browser }) => {
  const ctx = await browser.newContext();
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a, '');
  await open(b, 'B', false);
  await h(a, (w) => w.__music.request('isl', 'kk-march'));
  const cap = b.locator('[data-fx="kk-caption"]');
  await expect(cap).toContainText('♪ けけマーチ 🔇');
  await expect(cap).toHaveAttribute('data-unheard', 'true');
  await expect(b.locator('[data-kk].show')).toHaveCount(1);
  expect(await playing(b)).toBeNull();
  await expect.poll(() => playing(a)).toMatch(/^st\/isl\/kk-march\//);
  await ctx.close();
});
