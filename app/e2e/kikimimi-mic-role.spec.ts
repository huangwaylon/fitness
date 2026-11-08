// ふたりで ロールプレイ (docs/kikimimi-mic.md §2.5, M7) in the chromium-mic project: two phones (A and B) in one context
// over the demo's relay, each with a fake mic (one of our clips once per take, then silence, through a getUserMedia
// shim) and the stub recogniser (`e2e.stt`: what it "hears" set before each take from the line as compiled), nothing
// played out loud, no network. A picks ロールプレイ in the みんなで picker (it's on no shelf), its lobby (the scene, the two
// role cards) and invites. B's さんか asks first: with the mic off it says so and doesn't join; on, 「マイクを使います」
// and 参加する joins (the consent). Then the scene's turns in order on the phone of the role whose line it is: the line
// in Japanese, its key phrases lit as they're heard (one turn said in two takes, one without the mic); the partner's
// phone sees only the ✓ chips at the reveal, never what was heard; the turns move on by themselves. The results on both:
// the team's phrases, the list, お手本; the rows minutes only; every track released; nothing POSTed. Screenshots
// (KIKI_SHOTS=1) into /tmp/kikimimi-shots/role/ at 393×852.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Locator, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToQuestion, toTile } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/role';
const Q = 'date=2026-11-07T10:00&critter=none&visitor=none&kikimimi=fast';

/** A unit's dialogues' lines as compiled, by item id (the source chunk, not the build). */
const linesOf = (unit: string): Map<string, string[]> => {
  const part = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels', 'parts', `u-${unit}.json`), 'utf8')) as { items: { id: string; lines?: { en: string }[] }[] };
  return new Map(part.items.flatMap((it) => (it.lines ? [[it.id, it.lines.map((l) => l.en)] as const] : [])));
};

async function shot(p: Page, name: string, at?: Locator) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  if (at) await at.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}

/** A phone: the mic on (as せってい › マイク leaves it), the stub recogniser, the fake mic (its tracks kept). */
async function phone(ctx: BrowserContext, as: 'A' | 'B'): Promise<Page> {
  // (on the context's clock, installed before its first page: both tabs step together through the lines' plays,
  // kikimimi-nav.ts runUntil; a take on the clock as it flows, the stand-in mic's audio in real time)
  if (!ctx.pages().length) await ctx.clock.install();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    if (!localStorage.getItem('e2e.stt')) {
      localStorage.setItem('island.mic', JSON.stringify({ on: true, be: 'auto' }));
      localStorage.setItem('e2e.stt', JSON.stringify(['']));
    }
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
  await page.goto(`?demo&${Q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  return page;
}
const live = (p: Page) => p.evaluate(() => (window as unknown as { __micTracks: MediaStreamTrack[] }).__micTracks.filter((t) => t.readyState === 'live').length);
const setMic = (p: Page, on: boolean) => p.evaluate((on) => localStorage.setItem('island.mic', JSON.stringify({ on, be: 'auto' })), on);
/** What the stub hears on the next take. */
const willHear = (p: Page, line: string | { miss: string }) => p.evaluate((l) => localStorage.setItem('e2e.stt', JSON.stringify([l])), line);

/** A take: a tap, the clip into the mic, the silence after it ends it. */
async function talk(p: Page) {
  const mic = sheet(p).locator('[data-role-mic]');
  await expect(mic).toHaveAttribute('data-role-mic', 'idle', { timeout: 20_000 });
  await mic.locator('button').click();
  await expect(mic).toHaveAttribute('data-role-mic', 'listening');
  await expect(sheet(p).locator('[data-role-mic="listening"], [data-role-mic="checking"]')).toHaveCount(0, { timeout: 20_000 });
}

/** The turn now on either phone: its dialogue, line and the phone whose turn it is. */
async function turnNow(a: Page, b: Page, k: number): Promise<{ id: string; line: number; me: Page; other: Page }> {
  const speak = (p: Page) => sheet(p).locator('[data-role-me="speak"][data-role-turn]');
  for (const p of [a, b]) await runToQuestion(p, k, 'answer');
  await expect.poll(async () => (await speak(a).count()) + (await speak(b).count()), { timeout: 20_000 }).toBe(1);
  const me = (await speak(a).count()) ? a : b, other = me === a ? b : a;
  const [id, line] = (await speak(me).getAttribute('data-role-turn'))!.split(':');
  await expect(sheet(me).locator('[data-role-progress]')).toBeVisible();
  expect(Number(line), `turn ${k}`).toBeGreaterThanOrEqual(0);
  return { id, line: Number(line), me, other };
}

test('ロールプレイ: in the みんなで picker only; さんか asks for the mic; a scene on two phones, the ✓ chips, the team’s phrases, お手本', async ({ browser }) => {
  test.setTimeout(150_000); // (seven takes of the stand-in mic's clip in real time: ~60 s here; the lines stepped through)
  const ctx = await browser.newContext();
  await ctx.route('**/__e2e/mic.wav', (route) => route.fulfill({ path: `${import.meta.dirname}/fixtures/mic/ladder-line.wav`, contentType: 'audio/wav' }));
  const posts: string[] = [];
  ctx.on('request', (r) => r.method() === 'POST' && posts.push(r.url()));
  const LINES = linesOf('fr-replan');
  const a = await phone(ctx, 'A'), b = await phone(ctx, 'B');

  // A: not on the あそぶ shelves; in the みんなで picker, its lobby
  await a.bringToFront();
  await fromMenu(a, 'kikimimi');
  await atHub(a);
  await sheet(a).locator('[data-kiki-tile="asobu"]').click();
  await expect(sheet(a).locator('[data-kiki-mode-tile="kuri"]')).toBeVisible();
  await expect(sheet(a).locator('[data-kiki-mode-tile="role"]')).toHaveCount(0);
  await a.locator('dialog[open] .navbar .back').click();
  await toTile(a, 'together');
  await sheet(a).locator('[data-kiki-mode="role"]').click();
  const lobby = sheet(a).locator('[data-role-lobby]');
  await expect(lobby).toBeVisible({ timeout: 15_000 });
  await sheet(a).locator('[data-role-scene="0"]').click();
  await expect(lobby).toHaveAttribute('data-role-lobby', '0');
  await expect(lobby.locator('[data-role-rc="0"][data-mine]')).toContainText('予定を確かめる人');
  await expect(lobby.locator('[data-role-rc="1"] [data-role-key="ph-push-back"]')).toContainText('push it back');
  await shot(a, '1-lobby');
  await sheet(a).locator('[data-kiki-invite-all]').click();
  await expect(sheet(a).locator('[data-role-need-two]')).toBeVisible();
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveCount(0);

  // B: the mic off, さんか says so and doesn't join
  await b.bringToFront();
  await setMic(b, false);
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await banner.getByRole('button', { name: 'さんか' }).click();
  const ask = b.locator('dialog[open] [data-kiki-mic-join]');
  await expect(ask).toHaveAttribute('data-kiki-mic-join', 'off', { timeout: 15_000 });
  await expect(ask).toContainText('マイクがオフです');
  await shot(b, '2-join-off');
  await ask.locator('[data-kiki-mic-join-no]').click();
  await expect(ask).toHaveCount(0);
  await expect(sheet(b).locator('[data-kiki-invite]')).toContainText('マイクを使います');
  await expect.poll(() => b.evaluate(() => (window as unknown as { __kiki?: { view(): { phase: string } } }).__kiki?.view().phase)).toBe('idle');
  // on: the hub's card asks, 参加する joins
  await setMic(b, true);
  await sheet(b).locator('[data-kiki-join]').click();
  await expect(ask).toHaveAttribute('data-kiki-mic-join', 'ask');
  await expect(ask).toContainText('あなたの声は相手のスマホには送られません');
  await shot(b, '3-join-ask');
  await ask.locator('[data-kiki-mic-join-yes]').click();
  await expect(sheet(b).locator('[data-role-lobby]')).toBeVisible({ timeout: 15_000 });
  await expect(sheet(b).locator('[data-role-rc="1"][data-mine]')).toBeVisible();
  await shot(b, '4-lobby-guest');

  await a.bringToFront();
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('始める（2人）', { timeout: 10_000 });
  await sheet(a).locator('[data-kiki-start]').click();

  // the turns: 9, each on the phone of its role (A: maple, then gulliver; B: dom, then tammy)
  for (let k = 0; k < 9; k++) {
    const t = await turnNow(a, b, k);
    await t.me.bringToFront();
    const en = LINES.get(t.id)![t.line];
    const keys = sheet(t.me).locator('[data-role-turn] [data-role-key]');
    await expect(sheet(t.me).locator('[data-role-ja]')).not.toBeEmpty({ timeout: 15_000 });
    if (k === 0) {
      expect([t.me, t.id, t.line]).toEqual([a, 'dk-dinner-move', 0]);
      await expect(sheet(t.other).locator('[data-role-me="listen"] [data-role-listen]')).toBeVisible();
      await shot(a, '5-turn-speak');
      await shot(b, '6-turn-listen');
    }
    const n = await keys.count();
    if (k === 1) {
      // B's line in two takes: half first (one phrase lit), then the rest; what came through shows on B only
      expect(t.me).toBe(b);
      expect(n).toBe(2);
      await willHear(b, "something's come up at work");
      await talk(b);
      await expect(sheet(b).locator('[data-role-turn] [data-role-key][data-lit="true"]')).toHaveCount(1);
      await expect(sheet(b).locator('[data-role-heard]')).toContainText('come up');
      await shot(b, '7-half', sheet(b).locator('[data-role-heard]'));
      await willHear(b, 'could we push it back to Thursday');
      await talk(b);
    } else if (k === 2) {
      // no phrase in it: said without the mic
      await expect(keys).toHaveCount(0);
      await sheet(t.me).locator('[data-role-nomic]').click();
    } else {
      await willHear(t.me, en);
      await talk(t.me);
    }
    if (k !== 2) {
      await expect(sheet(t.me).locator('[data-role-turn] [data-role-key][data-lit="true"]')).toHaveCount(n);
      await sheet(t.me).locator('[data-role-send]').click();
    }
    // the reveal on the partner's phone: the ✓ chips and the line, never what was heard
    await t.other.bringToFront();
    const reveal = sheet(t.other).locator(`[data-role-turn="${t.id}:${t.line}"] [data-role-reveal]`);
    await expect(reveal).toBeVisible({ timeout: 15_000 });
    await expect(sheet(t.other).locator('[data-role-turn] [data-role-key][data-lit="true"]')).toHaveCount(n);
    await expect(sheet(t.other).locator('[data-role-heard]')).toHaveCount(0);
    if (k === 1) await shot(t.other, '8-reveal', reveal);
    expect(await live(t.me)).toBe(0);
  }

  // the results on both: the team's phrases, the list, お手本
  for (const p of [a, b]) {
    await p.bringToFront();
    const results = sheet(p).locator('[data-role-results]');
    await expect(results).toBeVisible({ timeout: 20_000 });
    const team = results.locator('[data-role-team]');
    await expect(team).toHaveAttribute('data-role-team', (await team.getAttribute('data-role-of'))!);
    await expect(results.locator('[data-role-said][data-ok="true"]')).toHaveCount(Number(await team.getAttribute('data-role-of')));
    await expect(results.locator('[data-role-model]')).toHaveCount(2);
    await expect(results.locator('[data-kiki-transcript]')).toHaveCount(2);
  }
  await shot(a, '9-results');
  await shot(a, '10-model', sheet(a).locator('[data-role-model="0"]'));

  // the rows: minutes only; the tracks let go; nothing sent
  const rows = await a.evaluate(() => (JSON.parse(localStorage.getItem('island.kikimimiGames') ?? '{"rows":[]}') as { rows: { row: Record<string, unknown> }[] }).rows.map((r) => r.row));
  const mine = rows.filter((r) => r.gm === 'role');
  expect(mine.length).toBeGreaterThan(0);
  for (const r of mine) {
    expect(r.r).toEqual([]);
    expect(Object.keys(r).sort()).toEqual(['d', 'g', 'gm', 'lv', 'ms', 'n', 'r']);
  }
  expect(await live(a)).toBe(0);
  expect(await live(b)).toBe(0);
  expect(posts).toEqual([]);
  await ctx.close();
});
