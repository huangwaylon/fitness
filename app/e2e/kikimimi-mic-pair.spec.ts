// はつおん ききわけ (docs/kikimimi-mic.md §2.4, §2.6, §5) in the chromium-mic project: the stand-in mic (one of our clips
// once per take, then silence, through a getUserMedia shim), the stub recogniser (`e2e.stt`, set before each take: it
// "hears" the word given), nothing played out loud, no network. Off: no 声に出す shelf. Solo, 8 cards: both words play
// first; then the word to say and the mic: a wrong word heard is the joke (「え、 …？！」) with the tip and a second try,
// the right one answers (通じた！, 解説, the mouth tips and lines); a take that can't be told says 「聞いて選んでね」 and the
// pictures take my pick; nothing heard says so; 飛ばす; the end with the cards (▶︎ each word) and 「通じた k / 8」; my row
// minutes only, every track released, nothing sent. Co-op あてっこ on two phones over the demo's relay: the round's
// speaker (by turns) sees the word and taps 言えた, the other taps the picture heard; 通じた or what it sounded like; no
// recogniser and no mic at all (B consents at さんか). Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/pair/ at 393×852, by day and night.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToQuestion, runToSee } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/pair';
const DAY = 'date=2026-11-07T10:00&kikimimi=fast';
const NIGHT = 'date=2026-11-07T21:30&kikimimi=fast';

async function snap(p: Page, name: string) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}

/** The mic on or off, the stand-in mic (as kikimimi-mic-mane.spec.ts's: the clip once into each stream, each track
 *  kept) and the stub recogniser. The clip: fixtures/mic/short-line.wav, 0.8 s of ladder-line.wav's speech (`ffmpeg -ss
 *  1.05 -t 0.8`; a take ends 1 s after it, not 5.5 s): the stub decides what's heard, the VAD only needs speech; the
 *  whole line's path is mane's and the probe's. */
async function fakeMic(ctx: BrowserContext, on: boolean) {
  await ctx.route('**/__e2e/mic.wav', (route) => route.fulfill({ path: `${import.meta.dirname}/fixtures/mic/short-line.wav`, contentType: 'audio/wav' }));
  await ctx.addInitScript((on) => {
    const w = window as unknown as { __micTracks: MediaStreamTrack[] };
    w.__micTracks = [];
    if (on && !localStorage.getItem('island.mic')) localStorage.setItem('island.mic', JSON.stringify({ on: true, be: 'auto' }));
    if (!localStorage.getItem('e2e.stt')) localStorage.setItem('e2e.stt', JSON.stringify(['']));
    navigator.mediaDevices.getUserMedia = async () => {
      const ac = new AudioContext();
      await ac.resume();
      const src = ac.createBufferSource();
      src.buffer = await ac.decodeAudioData(await (await fetch('/__e2e/mic.wav')).arrayBuffer());
      const out = ac.createMediaStreamDestination();
      src.connect(out);
      src.start();
      w.__micTracks.push(...out.stream.getTracks());
      return out.stream;
    };
  }, on);
}
const tracks = (p: Page) => p.evaluate(() => (window as unknown as { __micTracks: MediaStreamTrack[] }).__micTracks.map((t) => t.readyState));
/** What the stub hears at the next take. */
const willHear = (p: Page, line: string | { miss: string }) => p.evaluate((l) => localStorage.setItem('e2e.stt', JSON.stringify([l])), line);
type Kiki = { view(): { phase: string; i: number; n: number; gm: string | null; roles: Record<string, number> }; items(): string[]; recorded(): { gm?: string; ms: number; r: unknown[] } | null };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

/** A phone on the context's clock (installed once, before its first page: both tabs step together). */
async function phone(ctx: BrowserContext, q: string, as: 'A' | 'B' = 'A'): Promise<Page> {
  if (!ctx.pages().length) await ctx.clock.install();
  const page = await ctx.newPage();
  await page.goto(`?demo&${q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  return page;
}
async function toAsobu(p: Page) {
  await fromMenu(p, 'kikimimi');
  await atHub(p);
  await sheet(p).locator('[data-kiki-tile="asobu"]').click();
  await expect(sheet(p).locator('[data-kiki-page="asobu"]')).toBeVisible();
}
async function toPair(p: Page) {
  await toAsobu(p);
  await sheet(p).locator('[data-kiki-group="koe"] [data-kiki-mode-tile="pair"]').click();
  await expect(sheet(p).locator('[data-kiki-mode-page="pair"]')).toBeVisible();
}

/** Card i's answer window (both words played: the page's clock stepped through them, kikimimi-nav.ts runUntil; a take
 *  is on the clock as it flows, the stand-in mic's audio in real time). */
async function atCard(p: Page, i: number) {
  await runToQuestion(p, i);
  await runToSee(p, sheet(p).locator(`[data-type="pair"][data-kiki-q="${i}"][data-phase="answer"]`));
}
/** The word to say on this phone's card (its picture's index and its English), and the other one's. */
async function words(p: Page): Promise<{ say: number; it: string; other: string }> {
  const target = sheet(p).locator('[data-pair-target="1"]');
  const say = Number(await target.getAttribute('data-pair-word'));
  const it = (await target.locator('.en').textContent())!.trim();
  const other = (await sheet(p).locator(`[data-pair-word="${1 - say}"] .en`).textContent())!.trim();
  return { say, it, other };
}
/** A take: the mic tapped, the stand-in's clip heard, the take over by itself on the silence after it; the stub's word
 *  recognised. */
async function say(p: Page, heard: string | { miss: string }) {
  await willHear(p, heard);
  const btn = sheet(p).locator('[data-mic-button]');
  await btn.locator('button').click();
  await expect(btn).toHaveAttribute('data-mic-state', 'listening');
  // (over by itself: the button idle again, or gone with the answer)
  await expect(sheet(p).locator('[data-mic-button][data-mic-state="listening"]')).toHaveCount(0, { timeout: 20_000 });
}

test('off: no 声に出す shelf, no はつおん while the mic is off', async ({ page, context }) => {
  await fakeMic(context, false);
  await page.goto(`?demo&${DAY}`);
  await islandUp(page);
  await toAsobu(page);
  await expect(sheet(page).locator('[data-kiki-group="quick"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-mode-tile="pair"]')).toHaveCount(0);
});

for (const [when, q] of [['day', DAY], ['night', NIGHT]] as const) {
  test(`solo (${when}): hear both, say one; the joke and a second try, 通じた！; 聞いて選んでね; nothing heard; 飛ばす; the end`, async ({ page, context }) => {
    // (the night's: its screenshots, the same game as the day's, as kikimimi-call's and -tachi's night tests)
    test.skip(when === 'night' && !process.env.KIKI_SHOTS, 'screenshots only');
    test.slow(); // (four takes of the stand-in mic's 0.8 s clip, in real time: ~12 s here)
    await fakeMic(context, true);
    const posts: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && posts.push(r.url()));
    await page.clock.install();
    await page.goto(`?demo&${q}`);
    await islandUp(page);
    await toAsobu(page);
    const shelf = sheet(page).locator('[data-kiki-group="koe"]');
    await shelf.scrollIntoViewIfNeeded();
    await expect(shelf.locator('[data-kiki-mode-tile="pair"]')).toBeVisible();
    await snap(page, `${when}-1-shelf`);
    await shelf.locator('[data-kiki-mode-tile="pair"]').click();
    await expect(sheet(page).locator('[data-kiki-mode-page="pair"]')).toBeVisible();
    await snap(page, `${when}-2-mode`);
    await sheet(page).locator('[data-kiki-start]').click();
    await expect.poll(() => kiki(page, (k) => k.view().gm)).toBe('pair');
    expect(await kiki(page, (k) => k.view().n)).toBe(8);

    // both words first, no mic yet
    await runToSee(page, sheet(page).locator('[data-type="pair"][data-phase="play"]'));
    await expect(sheet(page).locator('[data-pair-listen]')).toBeVisible();
    await expect(sheet(page).locator('[data-mic-button]')).toHaveCount(0);
    await snap(page, `${when}-3-hear`);

    // card 1: the other word heard (the joke, the tip, try 1), then the word (通じた！)
    await atCard(page, 0);
    await expect(sheet(page).locator('[data-pair-ready="1"]')).toBeVisible({ timeout: 15_000 });
    const w0 = await words(page);
    await expect(sheet(page).locator('[data-pair-ask]')).toContainText(w0.it);
    await snap(page, `${when}-4-ask`);
    await say(page, w0.other);
    await expect(sheet(page).locator('[data-pair-react]')).toContainText('え、');
    await expect(sheet(page).locator(`[data-pair-word="${1 - w0.say}"]`)).toHaveAttribute('data-pair-heard', '1');
    await expect(sheet(page).locator('[data-pair-tip]')).toBeVisible();
    await expect(sheet(page).locator('[data-pair-tries="1"]')).toBeVisible();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'answer');
    await snap(page, `${when}-5-joke`);
    await say(page, `${w0.it[0].toUpperCase()}${w0.it.slice(1)}.`);
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator('[data-pair-verdict]')).toHaveAttribute('data-pair-verdict', 'right');
    await expect(sheet(page).locator('[data-pair-react]')).toContainText('つうじた');
    await expect(sheet(page).locator('[data-kiki-why]')).toBeVisible();
    await expect(sheet(page).locator('[data-pair-how]')).toHaveCount(2);
    expect((await tracks(page)).filter((s) => s === 'live')).toEqual([]);
    await snap(page, `${when}-6-reveal`);
    await sheet(page).locator('[data-kiki-next]').click();

    // card 2: can't be told (neither word): 聞いて選んでね, my own pick
    await atCard(page, 1);
    const w1 = await words(page);
    await say(page, 'Nice.');
    await expect(sheet(page).locator('[data-pair-hint]')).toContainText('聞いて選んでね');
    await expect(sheet(page).locator('[data-pair-pics]')).toHaveAttribute('data-pair-pics', 'pick');
    await snap(page, `${when}-7-unsure`);
    await sheet(page).locator(`[data-pair-pick="${w1.say}"]`).click();
    await expect(sheet(page).locator('[data-pair-verdict]')).toHaveAttribute('data-pair-verdict', 'right');
    await sheet(page).locator('[data-kiki-next]').click();

    // card 3: nothing heard (not a try), then 飛ばす; the rest skipped
    await atCard(page, 2);
    await say(page, { miss: 'none' });
    await expect(sheet(page).locator('[data-pair-hint]')).toContainText('声が聞こえませんでした');
    await expect(sheet(page).locator('[data-pair-tries]')).toHaveCount(0);
    await sheet(page).locator('[data-pair-skip]').click();
    await expect(sheet(page).locator('[data-pair-verdict]')).toHaveAttribute('data-pair-verdict', 'skip');
    await sheet(page).locator('[data-kiki-next]').click();
    for (let i = 3; i < 8; i++) {
      await atCard(page, i);
      await sheet(page).locator('[data-pair-skip]').click();
      await sheet(page).locator('[data-kiki-next]').click();
    }

    // the end: the cards, 通じた 2 / 8, minutes only, nothing sent, every track let go
    await expect(sheet(page).locator('[data-pair-results]')).toBeVisible({ timeout: 15_000 });
    await expect(sheet(page).locator('[data-pair-card]')).toHaveCount(8);
    await expect(sheet(page).locator('[data-pair-score]')).toHaveAttribute('data-pair-score', '2');
    await snap(page, `${when}-8-results`);
    const row = await kiki(page, (k) => k.recorded());
    expect(row).toMatchObject({ gm: 'pair', r: [] });
    expect(row!.ms).toBeGreaterThan(0);
    expect((await tracks(page)).filter((s) => s === 'live')).toEqual([]);
    expect(posts).toEqual([]);
  });
}

test('あてっこ on two phones: the speaker by turns sees the word and says it, the other taps the picture; no recogniser, no mic', async ({ browser }) => {
  test.setTimeout(60_000); // two phones, eight cards (their words stepped through)
  const ctx = await browser.newContext();
  await fakeMic(ctx, true);
  const posts: string[] = [];
  ctx.on('request', (r) => r.method() === 'POST' && posts.push(r.url()));
  const a = await phone(ctx, DAY, 'A'), b = await phone(ctx, DAY, 'B');
  await a.bringToFront();
  await toPair(a);
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  // a mic game: joining is consenting (「マイクを使います」, 参加する)
  const ask = b.locator('dialog[open] [data-kiki-mic-join]');
  await expect(ask).toHaveAttribute('data-kiki-mic-join', 'ask', { timeout: 15_000 });
  await ask.locator('[data-kiki-mic-join-yes]').click();
  await expect.poll(() => kiki(b, (k) => k && k.view().gm), { timeout: 15_000 }).toBe('pair');
  await a.bringToFront();
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('始める（2人）', { timeout: 10_000 });
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
  expect(await kiki(a, (k) => k.items())).toEqual(await kiki(b, (k) => k.items()));
  expect(await kiki(a, (k) => k.view().roles)).toEqual({ A: 0, B: 1 });

  for (let i = 0; i < 8; i++) {
    const [speaker, listener] = i % 2 ? [b, a] : [a, b];
    for (const p of [a, b]) await atCard(p, i);
    await speaker.bringToFront();
    const w = await words(speaker);
    await expect(sheet(speaker).locator('[data-pair-say]')).toHaveText(w.it);
    await expect(sheet(listener).locator('[data-pair-target="1"]')).toHaveCount(0);
    await expect(sheet(listener).locator('[data-pair-say]')).toHaveCount(0);
    await expect(sheet(listener).locator('[data-pair-pics]')).toHaveAttribute('data-pair-pics', 'pick');
    if (i === 0) await snap(speaker, 'coop-1-speaker');
    await sheet(speaker).locator('[data-pair-said]').click();
    await listener.bringToFront();
    if (i === 0) await snap(listener, 'coop-2-listener');
    // card 2 misheard: the other picture
    await sheet(listener).locator(`[data-pair-pick="${i === 1 ? 1 - w.say : w.say}"]`).click();
    for (const p of [a, b]) {
      await expect(sheet(p).locator('[data-pair-verdict]')).toHaveAttribute('data-pair-verdict', i === 1 ? 'wrong' : 'right', { timeout: 15_000 });
      await expect(sheet(p).locator(`[data-pair-target="1"][data-pair-word="${w.say}"]`)).toHaveCount(1);
    }
    if (i === 1) await snap(a, 'coop-3-wrong');
    await a.bringToFront();
    await sheet(a).locator('[data-kiki-next]').click();
  }
  for (const p of [a, b]) {
    await expect(sheet(p).locator('[data-pair-results]')).toBeVisible({ timeout: 15_000 });
    await expect(sheet(p).locator('[data-pair-score]')).toHaveAttribute('data-pair-score', '7');
    expect(await tracks(p)).toEqual([]);
  }
  await snap(b, 'coop-4-results');
  expect(posts).toEqual([]);
  await ctx.close();
});
