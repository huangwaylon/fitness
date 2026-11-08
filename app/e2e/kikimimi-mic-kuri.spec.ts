// くりかえし チャレンジ (docs/kikimimi-mic.md §2.2, M4) in the chromium-mic project: a fake mic fed one of our clips once
// per take (then silence) through a getUserMedia shim, the stub recogniser (`e2e.stt`: what it "hears" set before each
// take from the sentence as compiled), nothing played out loud, no network. With the mic off the 声に出す shelf has no
// tile. On: its page, then a solo run: the clip once and the beat, the mic, a sentence said whole (one rung up, every word
// lit), one heard again first (no climb), a take with nothing heard (the reason in Japanese, then said again: half of
// it, the misses named), a second miss in a row ends the run; the results (how far, only for me) and my row: minutes
// only. The track is released after each take; nothing is POSTed. Screenshots (KIKI_SHOTS=1) into
// /tmp/kikimimi-shots/kuri/ at 393×852.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Locator, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToSee } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/kuri';
const Q = '?demo&date=2026-11-04T12:00&kikimimi=fast';

/** Every level's sentences as compiled, by id. */
const PARTS = join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels', 'parts');
const EN = new Map(readdirSync(PARTS).filter((f) => /^lv\d/.test(f)).flatMap((f) =>
  (JSON.parse(readFileSync(join(PARTS, f), 'utf8')) as { items: { id: string; en: string }[] }).items.map((it) => [it.id, it.en] as const)));

type Kiki = { view(): { phase: string; i: number; gm: string | null }; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function shot(p: Page, name: string, at?: Locator) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  if (at) await at.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}

/** The fake mic: the clip once into a MediaStream, silence after it; each track kept in `__micTracks`. The clip:
 *  short-line.wav (kikimimi-mic-pair.spec's fakeMic says why). */
async function fakeMic(page: Page) {
  await page.context().route('**/__e2e/mic.wav', (route) => route.fulfill({ path: `${import.meta.dirname}/fixtures/mic/short-line.wav`, contentType: 'audio/wav' }));
  await page.addInitScript(() => {
    const w = window as unknown as { __micTracks: MediaStreamTrack[] };
    w.__micTracks = [];
    navigator.mediaDevices.getUserMedia = async () => {
      const ctx = new AudioContext();
      await ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = await ctx.decodeAudioData(await (await fetch('/__e2e/mic.wav')).arrayBuffer());
      const out = ctx.createMediaStreamDestination();
      src.connect(out);
      src.start();
      w.__micTracks.push(...out.stream.getTracks());
      return out.stream;
    };
  });
}
const live = (page: Page) => page.evaluate(() => (window as unknown as { __micTracks: MediaStreamTrack[] }).__micTracks.filter((t) => t.readyState === 'live').length);

/** The phone's mic on (as せってい › マイク leaves it) and the stub recogniser in. */
async function micOn(page: Page, on = true) {
  await page.addInitScript((on) => {
    if (on) localStorage.setItem('island.mic', JSON.stringify({ on: true, be: 'auto' }));
    localStorage.setItem('e2e.stt', JSON.stringify(['']));
  }, on);
}

async function toAsobu(page: Page) {
  await page.clock.install(); // (the clips stepped through: kikimimi-nav.ts runUntil; a take on the clock as it flows)
  await page.goto(Q);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
}

/** The sentence playing now, as compiled. */
const sentence = async (p: Page) => EN.get(await kiki(p, (k) => k.items()[k.view().i]))!;
/** What the stub hears on the next take. */
const willHear = (p: Page, line: string | { miss: string }) => p.evaluate((l) => localStorage.setItem('e2e.stt', JSON.stringify([l])), line);

/** The round's turn: the mic shown (the clip and the beat stepped through). */
async function myTurn(p: Page) {
  await runToSee(p, sheet(p).locator('[data-kuri-mic="idle"]'));
}
/** A take: a tap, the clip into the mic, the silence after it ends it. */
async function talk(p: Page) {
  const mic = sheet(p).locator('[data-kuri-mic]');
  await mic.locator('button').click();
  await expect(mic).toHaveAttribute('data-kuri-mic', 'listening');
  // (heard: the round answers and the mic goes; a miss: it waits again)
  await expect(sheet(p).locator('[data-kuri-mic="listening"], [data-kuri-mic="checking"]')).toHaveCount(0, { timeout: 20_000 });
}

test('くりかえし チャレンジ: hidden with the mic off', async ({ page }) => {
  await micOn(page, false);
  await toAsobu(page);
  await expect(sheet(page).locator('[data-kiki-mode-tile="tile"], [data-kiki-mode-tile="quiz"]').first()).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-mode-tile="kuri"]')).toHaveCount(0);
});

test('くりかえし チャレンジ: a solo run, said, heard again, nothing heard, two misses, the results and a minutes-only row', async ({ page }) => {
  test.setTimeout(90_000); // (its takes of the stand-in mic's clip in real time: ~30 s here; the clips stepped through)
  const posts: string[] = [];
  page.on('request', (r) => r.method() === 'POST' && posts.push(r.url()));
  await micOn(page);
  await fakeMic(page);
  await toAsobu(page);

  // the 声に出す shelf: its tile, its page
  const tile = sheet(page).locator('[data-kiki-mode-tile="kuri"]');
  await expect(tile).toBeVisible();
  await shot(page, '1-shelf', tile);
  await tile.click();
  await expect(sheet(page).locator('[data-kiki-mode-page="kuri"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-invite-all]')).toHaveCount(0);
  await shot(page, '2-page');
  await sheet(page).locator('[data-kiki-start]').click();

  // 1: the clip once, then the beat; said whole: a rung up, every word lit
  await runToSee(page, sheet(page).locator('[data-kuri-once]'));
  await expect(sheet(page).locator('[data-kuri-rung]')).toHaveAttribute('data-kuri-rung', '0');
  await shot(page, '3-listen');
  await myTurn(page);
  await shot(page, '4-turn');
  const first = await sentence(page);
  await willHear(page, first);
  await talk(page);
  await expect(sheet(page).locator('[data-kuri-line]')).toHaveAttribute('data-kuri-line', 'up');
  await expect(sheet(page).locator('[data-kuri-said] .w[data-got="false"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kuri-missed]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kuri-said] .ja')).not.toBeEmpty();
  expect(await live(page)).toBe(0);
  await shot(page, '5-reveal-up');
  await sheet(page).locator('[data-kiki-next]').click();

  // 2: heard again first, then said whole: no climb
  await myTurn(page);
  await expect(sheet(page).locator('[data-kuri-rung]')).toHaveAttribute('data-kuri-rung', '1');
  await sheet(page).locator('[data-kuri-again]').click();
  await expect(sheet(page).locator('[data-kuri-replayed]')).toBeVisible();
  const second = await sentence(page);
  await willHear(page, second);
  await talk(page);
  await expect(sheet(page).locator('[data-kuri-line]')).toHaveAttribute('data-kuri-line', 'replayed');
  await sheet(page).locator('[data-kiki-next]').click();

  // 3: nothing heard: why, in Japanese, and the mic again (or skip); then half of it: a miss, the misses named
  await myTurn(page);
  await expect(sheet(page).locator('[data-kuri-rung]')).toHaveAttribute('data-kuri-rung', '1');
  await willHear(page, { miss: 'none' });
  await talk(page);
  await expect(sheet(page).locator('[data-kuri-miss="none"]')).toContainText('声が聞こえませんでした');
  await expect(sheet(page).locator('[data-kuri-skip]')).toBeVisible();
  await expect(sheet(page).locator('[data-kuri-mic]')).toContainText('もう一度話す');
  await shot(page, '6-miss');
  const third = (await sentence(page)).split(/\s+/);
  await willHear(page, third.slice(0, 2).join(' '));
  await talk(page);
  await expect(sheet(page).locator('[data-kuri-line]')).toHaveAttribute('data-kuri-line', 'stay');
  await expect(sheet(page).locator('[data-kuri-missed]')).toBeVisible();
  await expect(sheet(page).locator('[data-kuri-said] .w[data-got="false"]').first()).toBeVisible();
  await expect(sheet(page).locator('[data-kuri-heard]')).toContainText(third[0]);
  await shot(page, '7-reveal-miss', sheet(page).locator('[data-kuri-said]'));
  await sheet(page).locator('[data-kiki-next]').click();

  // 4: a second miss in a row ends the run
  await myTurn(page);
  await willHear(page, 'um');
  await talk(page);
  await expect(sheet(page).locator('[data-kuri-line]')).toHaveAttribute('data-kuri-line', 'end');
  await sheet(page).locator('[data-kiki-next]').click();

  // the results: how far, only for me; the sentences; my row minutes only
  const results = sheet(page).locator('[data-kuri-results]');
  await expect(results).toBeVisible();
  await expect(results.locator('[data-kuri-reached]')).toHaveAttribute('data-kuri-reached', String(Math.max(first.split(/\s+/).length, second.split(/\s+/).length)));
  await expect(results).toContainText('あなたにだけ見えます');
  await expect(results.locator('[data-kuri-row]')).toHaveCount(4);
  await expect(results.locator('[data-kuri-row][data-mark="ok"]')).toHaveCount(2);
  await shot(page, '8-results');
  const rows = await page.evaluate(() => (JSON.parse(localStorage.getItem('island.kikimimiGames') ?? '{"rows":[]}') as { rows: { row: Record<string, unknown> }[] }).rows.map((r) => r.row));
  const mine = rows.filter((r) => r.gm === 'kuri');
  expect(mine).toHaveLength(1);
  expect(mine[0].r).toEqual([]);
  expect(Object.keys(mine[0]).sort()).toEqual(['d', 'g', 'gm', 'lv', 'ms', 'n', 'r']);
  expect(await live(page)).toBe(0);
  expect(posts).toEqual([]);
});
