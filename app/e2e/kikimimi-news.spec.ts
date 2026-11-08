// しずえの ニュース (docs/curriculum-wave2.md §2.5): the mode shows once a news file is `listened` (news-a and news-b, shipped
// listened since audio batch A3), on あそぶ's じっくり shelf, its page without places; a solo game on the day's bulletin with
// today's weather pinned (a timeline planted in the phone's cache as the relay leaves it: dry, then rain from 15:00, a
// high of 17 °C on the `?date=` day): しずえ at her desk reads it (the 放送中 lamp, its stories), then the gist right,
// a story replayed, the detail wrong, 「傘は いる？」 right (rain later: いる); the last reveal's whole bulletin, the
// results' review and my row (gm news, the choices as authored). Then two phones in co-op over the demo's relay: both
// answer every question, the team's are those both got. The lines play their voiced length (A3), silent:
// Playwright's Chromium is muted; on the page's clock, stepped through (kikimimi-nav.ts runUntil). Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/news/, by day and at night.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToQuestion, runToSee } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/news';
const DAY_AT = '2026-11-07T10:00';
const DAY = `date=${DAY_AT}&critter=none&visitor=none&kikimimi=fast`;
const NIGHT = 'date=2026-11-07T21:30&critter=none&visitor=none&kikimimi=fast';
const H = 3600_000;

type Ask = { choices: string[]; answer: number };
/** The bulletins as compiled: each one's right gist and detail. */
const ITEMS = ['news-a', 'news-b'].flatMap((u) => (JSON.parse(readFileSync(join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels', 'parts', `${u}.json`), 'utf8')) as {
  listen: { items: { id: string; kind: string; gist?: Ask; detail?: Ask; segments?: { lines: unknown[] }[] }[] };
}).listen.items);
const BY_ID = new Map(ITEMS.filter((it) => it.kind === 'news').map((it) => [it.id, it]));
/** A card's right choice (its id: the bulletin's, `-d` the detail's, `-kasa` the umbrella's: rain later, いる). */
function rightOf(id: string): string {
  if (id.endsWith('-kasa')) return 'Yes, take one.';
  const b = BY_ID.get(id.replace(/-d$/, ''))!, q = id.endsWith('-d') ? b.detail! : b.gist!;
  return q.choices[q.answer];
}

/** Today's weather in the phone's cache, as the relay leaves it (live-protocol.ts Wx): the `?date=` day's hours from
 *  12 before, dry till 15:00 then rain, its high 17 °C, fetched at that hour. */
async function weather(ctx: BrowserContext, at = DAY_AT) {
  const now = Date.parse(`${at}:00+09:00`), h0 = Math.floor(now / H) - 12;
  const s = Array.from({ length: 48 }, (_, i) => ((h0 + i + 9) % 24 >= 15 ? 'r' : 'c')).join('');
  const wx = { h0, s, hi: [Math.floor((now + 9 * H) / 86_400_000), 17], at: now, src: 'om', rev: 1 };
  await ctx.addInitScript((w) => localStorage.setItem('island.wx', JSON.stringify(w)), wx);
}

type Kiki = { view(): { phase: string; i: number; gm: string | null }; items(): string[]; recorded(): { gm?: string; r: [string, number, number, number][] } | null };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function snap(p: Page, name: string, fullPage = false) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}

/** A phone on the context's clock (installed once, before its first page: both tabs step together). */
async function phone(ctx: BrowserContext, q: string, as: 'A' | 'B' = 'A'): Promise<Page> {
  if (!ctx.pages().length) await ctx.clock.install();
  const page = await ctx.newPage();
  await page.goto(`?demo&${q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  return page;
}
/** From the hub: あそぶ › じっくり › しずえの ニュース's page. */
async function toNews(p: Page) {
  await fromMenu(p, 'kikimimi');
  await atHub(p);
  await sheet(p).locator('[data-kiki-tile="asobu"]').click();
  await sheet(p).locator('[data-kiki-group="long"] [data-kiki-mode-tile="news"]').click();
  await expect(sheet(p).locator('[data-kiki-mode-page="news"]')).toBeVisible();
}

/** Question i, once its choices open: the right one (or `wrong`, another), tapped. */
async function answer(p: Page, i: number, wrong = false) {
  await runToQuestion(p, i);
  const chips = sheet(p).locator('.choices [data-choice]');
  await runToSee(p, sheet(p).locator('.choices [data-choice][aria-disabled="false"]'));
  const want = rightOf((await kiki(p, (k) => k.items()))[i]);
  const texts = await chips.evaluateAll((bs) => bs.map((b) => b.querySelector('.tx')!.textContent!.trim()));
  const k = wrong ? texts.findIndex((x) => x !== want) : texts.indexOf(want);
  expect(k).toBeGreaterThanOrEqual(0);
  await chips.nth(k).click();
}

test('solo: the mode once listened, the day’s bulletin at しずえ’s desk with today’s weather, three questions, the results and my row', async ({ context }) => {
  await weather(context);
  const page = await phone(context, DAY);
  await toNews(page);
  await snap(page, 'mode');
  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => kiki(page, (k) => k.view().gm)).toBe('news');
  const ids = await kiki(page, (k) => k.items());
  expect(ids).toEqual([ids[0], `${ids[0]}-d`, `${ids[0]}-kasa`]);
  // the bulletin plays: the desk, its stories (the weather's last), nothing to answer
  const desk = sheet(page).locator('[data-kiki-frame="news"]');
  await runToSee(page, desk);
  await expect(desk.locator('[data-seg]')).toHaveCount(3);
  await expect(desk.locator('[data-seg="2"]')).toHaveAttribute('data-topic', 'weather');
  await expect(sheet(page).locator('[data-kiki-news-wait]')).toBeVisible();
  await runToSee(page, sheet(page).locator('[data-kiki-frame="news"][data-live="true"]'));
  await snap(page, 'listen');
  // the gist, right; a story again
  await answer(page, 0);
  await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-why]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-cja]').first()).toBeVisible();
  await snap(page, 'reveal-gist', true);
  await desk.locator('[data-seg="1"]').click();
  await sheet(page).locator('[data-kiki-next]').click();
  // the detail, wrong
  await runToSee(page, sheet(page).locator('[data-kiki-news-ask="detail"]'));
  await snap(page, 'detail');
  await answer(page, 1, true);
  await expect(sheet(page).locator('[data-kiki-verdict="wrong"]')).toBeVisible();
  await sheet(page).locator('[data-kiki-next]').click();
  // 「傘は いる？」: rain later today, いる; the last reveal's note and the whole bulletin (its lines, the weather's, the sign-off)
  await runToSee(page, sheet(page).locator('[data-kiki-news-ask="kasa"]'));
  await snap(page, 'kasa');
  await answer(page, 2);
  await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
  const lines = BY_ID.get(ids[0])!.segments!.flatMap((s) => s.lines).length;
  await expect(sheet(page).locator('[data-kiki-transcript] [data-line]')).toHaveCount(lines + 3);
  await expect(sheet(page).locator('[data-kiki-transcript]')).toContainText('Look for a high of 17 degrees.');
  await expect(sheet(page).locator('[data-kiki-transcript]')).toContainText('rain moves in later in the day');
  await snap(page, 'reveal-kasa', true);
  await sheet(page).locator('[data-kiki-next]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results', { timeout: 10_000 });
  await expect(sheet(page).locator('[data-kiki-tally]')).toHaveText('2 / 3 問正解');
  await expect(sheet(page).locator('[data-review]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-kiki-news-mine]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-news-script] [data-kiki-transcript]')).toBeVisible();
  await snap(page, 'results', true);
  const row = await kiki(page, (k) => k.recorded());
  expect(row?.gm).toBe('news');
  expect(row!.r.map(([id, ok]) => [id, ok])).toEqual([[ids[0], 1], [ids[1], 0], [ids[2], 1]]);
});

test('night: the desk and a reveal in the night palette', async ({ context }) => {
  test.skip(!process.env.KIKI_SHOTS, 'screenshots only');
  await weather(context, '2026-11-07T21:30');
  const page = await phone(context, NIGHT);
  await toNews(page);
  await sheet(page).locator('[data-kiki-start]').click();
  await runToSee(page, sheet(page).locator('[data-kiki-news-wait]'));
  await snap(page, 'night-listen');
  await answer(page, 0, true);
  await snap(page, 'night-reveal', true);
});

test('co-op on two phones: both answer every question; the team’s are the ones both got', async ({ browser }) => {
  test.setTimeout(60_000); // two phones (the plays stepped through)
  const ctx = await browser.newContext();
  await weather(ctx);
  const a = await phone(ctx, DAY, 'A'), b = await phone(ctx, DAY, 'B');
  await a.bringToFront();
  await toNews(a);
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect.poll(() => kiki(b, (k) => k && k.view().gm), { timeout: 15_000 }).toBe('news');
  await a.bringToFront();
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('始める（2人）', { timeout: 10_000 });
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
  expect(await kiki(a, (k) => k.items())).toEqual(await kiki(b, (k) => k.items()));
  // B wrong on the detail: the team gets 2 of 3
  for (let i = 0; i < 3; i++) {
    for (const [p, who] of [[a, 'A'], [b, 'B']] as const) {
      await p.bringToFront();
      await answer(p, i, who === 'B' && i === 1);
    }
    await a.bringToFront();
    await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
    if (i === 1) await snap(a, 'coop-reveal');
    await b.bringToFront();
    await sheet(b).locator('[data-kiki-ready]').click();
    await a.bringToFront();
    await sheet(a).locator('[data-kiki-next]').click();
  }
  await expect(sheet(a)).toHaveAttribute('data-phase', 'results');
  await expect(sheet(a).locator('[data-kiki-team]')).toHaveAttribute('data-kiki-team', '2');
  await expect(sheet(a).locator('[data-kiki-tally]')).toHaveText('自分は 3 / 3');
  await snap(a, 'coop-results', true);
  await b.bringToFront();
  await expect(sheet(b)).toHaveAttribute('data-phase', 'results', { timeout: 10_000 });
  await expect(sheet(b).locator('[data-kiki-tally]')).toHaveText('自分は 2 / 3');
  await ctx.close();
});
