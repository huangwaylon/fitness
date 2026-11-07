// まねっこ シャドーイング (docs/kikimimi-mic.md §2.1, §2.6, §5) in the chromium-mic project: a fake mic fed one of our
// clips once per take (then silence) through a getUserMedia shim, nothing played out loud, no network. The mode is on
// あそぶ's 声に出す shelf only with the mic on; a solo game of 4 lines: the line once (listen only), then 重ねて言う (the
// mic's tap plays the line, the take ends on the silence after it) with the two melody lines and at most two feedback
// lines, もう一度, あとから言う with お手本, 自分の声を聞く, 飛ばす; the end with the lines said; my row minutes only
// (`gm` mane, no answers), every track released, nothing sent. Screenshots (KIKI_SHOTS=1) into
// /tmp/kikimimi-shots/mane/ at 393×852, by day and at night.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/mane';
const DAY = 'date=2026-11-07T10:00&critter=none&visitor=none&kikimimi=fast';
const NIGHT = 'date=2026-11-07T21:30&critter=none&visitor=none&kikimimi=fast';

async function snap(p: Page, name: string) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}

/** The fake mic (as kikimimi-mic-optin.spec.ts's): the clip once into each stream, silence after it; each track kept. */
async function fakeMic(page: Page, on: boolean) {
  await page.context().route('**/__e2e/mic.wav', (route) => route.fulfill({ path: `${import.meta.dirname}/fixtures/mic/ladder-line.wav`, contentType: 'audio/wav' }));
  await page.addInitScript((on) => {
    const w = window as unknown as { __micTracks: MediaStreamTrack[] };
    w.__micTracks = [];
    if (on && !localStorage.getItem('island.mic')) localStorage.setItem('island.mic', JSON.stringify({ on: true, be: 'auto' }));
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
  }, on);
}
const live = (page: Page) => page.evaluate(() => (window as unknown as { __micTracks: MediaStreamTrack[] }).__micTracks.filter((t) => t.readyState === 'live').length);
type Kiki = { view(): { phase: string; i: number; n: number; gm: string | null }; recorded(): { gm?: string; ms: number; r: unknown[] } | null };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function toAsobu(page: Page, q: string) {
  await page.goto(`?demo&${q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
  await expect(sheet(page).locator('[data-kiki-page="asobu"]')).toBeVisible();
}

/** The current line's page, its clip read (the mic ready). */
async function atLine(page: Page, i: number) {
  await expect(sheet(page).locator(`[data-type="mane"][data-kiki-q="${i}"][data-phase="answer"]`)).toBeVisible({ timeout: 20_000 });
  await expect(sheet(page).locator('[data-mane-ready="1"]')).toBeVisible({ timeout: 15_000 });
}
/** A take: the mic tapped, the clip heard, the take over by itself; the try's lines shown. */
async function say(page: Page) {
  const btn = sheet(page).locator('[data-mic-button]');
  await btn.locator('button').click();
  await expect(btn).toHaveAttribute('data-mic-state', 'listening');
  await expect(sheet(page).locator('[data-mane-feedback]')).toBeVisible({ timeout: 20_000 });
}

test('off: no 声に出す shelf while the mic is off', async ({ page }) => {
  await fakeMic(page, false);
  await toAsobu(page, DAY);
  await expect(sheet(page).locator('[data-kiki-group="quick"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-group="koe"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-mode-tile="mane"]')).toHaveCount(0);
});

for (const [when, q] of [['day', DAY], ['night', NIGHT]] as const) {
  test(`a solo game (${when}): listen, say it along, the two lines and a tip, again, after, skip; the end; minutes only`, async ({ page }) => {
    test.slow();
    await fakeMic(page, true);
    const posts: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && posts.push(r.url()));
    await toAsobu(page, q);
    const shelf = sheet(page).locator('[data-kiki-group="koe"]');
    await expect(shelf).toBeVisible();
    await shelf.scrollIntoViewIfNeeded();
    await snap(page, `${when}-1-shelf`);
    await shelf.locator('[data-kiki-mode-tile="mane"]').click();
    await expect(sheet(page).locator('[data-kiki-mode-page="mane"]')).toBeVisible();
    await expect(sheet(page).locator('[data-kiki-invite-all]')).toHaveCount(0); // (solo only)
    await snap(page, `${when}-2-mode`);
    await sheet(page).locator('[data-kiki-start]').click();
    await expect.poll(() => kiki(page, (k) => k.view().gm)).toBe('mane');
    expect(await kiki(page, (k) => k.view().n)).toBe(4);

    // the line once, listen only (no text, no mic)
    await expect(sheet(page).locator('[data-type="mane"][data-phase="play"]')).toBeVisible({ timeout: 15_000 });
    await expect(sheet(page).locator('[data-mic-button]')).toHaveCount(0);
    await expect(sheet(page).locator('[data-kiki-en]')).toHaveCount(0);
    await snap(page, `${when}-3-listen`);

    // then the line, 重ねて言う first; a take that ends by itself
    await atLine(page, 0);
    await expect(sheet(page).locator('[data-kiki-en]')).toBeVisible();
    await expect(sheet(page).locator('[data-mane-pick="shadow"]')).toHaveAttribute('aria-checked', 'true');
    await expect(sheet(page).locator('[data-mane-contour="ref"]')).toBeVisible();
    await snap(page, `${when}-4-ask`);
    await say(page);
    await expect(sheet(page).locator('[data-mane-contour="both"]')).toBeVisible();
    const codes = (await sheet(page).locator('[data-mane-feedback]').getAttribute('data-mane-feedback'))!.split(' ');
    expect(codes.length).toBeGreaterThanOrEqual(1);
    expect(codes.length).toBeLessThanOrEqual(2);
    expect(codes).not.toContain('quiet');
    await expect(sheet(page).locator('[data-mane-react]')).toBeVisible();
    await expect(sheet(page).locator('[data-mane-tries="1"]')).toBeVisible();
    expect(await live(page)).toBe(0);
    await snap(page, `${when}-5-tried`);

    // もう一度, あとから言う: お手本, then the take; 自分の声を聞く
    await sheet(page).locator('[data-mane-again]').click();
    await sheet(page).locator('[data-mane-pick="after"]').click();
    await expect(sheet(page).locator('[data-mane-hear]')).toBeVisible();
    await sheet(page).locator('[data-mane-hear]').click();
    await say(page);
    await expect(sheet(page).locator('[data-mane-tries="2"]')).toBeVisible();
    await sheet(page).locator('[data-mane-mine]').click();
    expect(await live(page)).toBe(0);

    // 次の文へ; the others skipped
    await sheet(page).locator('[data-mane-next]').click();
    for (const i of [1, 2, 3]) {
      await atLine(page, i);
      await expect(sheet(page).locator('[data-mane-pick="after"]')).toHaveAttribute('aria-checked', 'true'); // (kept)
      await sheet(page).locator('[data-mane-skip]').click();
    }

    // the end: the lines said, minutes only
    await expect(sheet(page).locator('[data-mane-results]')).toBeVisible({ timeout: 15_000 });
    await expect(sheet(page).locator('[data-mane-line]')).toHaveCount(4);
    await snap(page, `${when}-6-results`);
    const row = await kiki(page, (k) => k.recorded());
    expect(row).toMatchObject({ gm: 'mane', r: [] });
    expect(row!.ms).toBeGreaterThan(0);
    expect(await live(page)).toBe(0);
    expect(posts).toEqual([]);
  });
}
