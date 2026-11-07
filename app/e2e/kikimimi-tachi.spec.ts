// たちぎき (docs/curriculum-wave2.md §2.2): the mode shows once a tachi file is `listened` (s2-tachi-a and -b, shipped
// listened after A1 and the listening check), on あそぶ's まちで・でんわで shelf and its page at もり; a solo game: the conversation
// first (three seats, nothing to answer), then the opinions round (a face on each claim, できた), who changed their mind
// (a face) and the plan (a choice); a line replayed alone; the last round's reveal with the whole transcript in three
// seats; one round wrong, the results' review and my row (gm tachi, a row a round). Then two phones in co-op 「たんとう」
// over the demo's relay: each has a speaker of their own and a shared one (easy: the shared one placed), places their
// own face; the team's rounds are the ones both got. Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/tachi/, by day
// and at night. The logic tier (Playwright's Chromium is muted; a conversation still takes its 30-50 s).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/tachi';
const DAY = 'date=2026-11-07T10:00&critter=none&visitor=none&kikimimi=fast';
const NIGHT = 'date=2026-11-07T21:30&critter=none&visitor=none&kikimimi=fast';

type Yaml = { id: string; lines: { who: string }[]; rounds: ({ type: 'opinions'; answer: string[] } | { type: 'changed'; answer: string } | { type: 'plan'; answer: number })[] };
const LEVELS = join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels');
/** もり's (stage 3) listened tachi files, as this build ships them (s2-tachi-a, -b and, since A4, -c). */
const FILES = Object.entries((JSON.parse(readFileSync(join(LEVELS, 'index.json'), 'utf8')) as { listen: Record<string, [string, number, string]> }).listen)
  .filter(([, [gm, stage, status]]) => gm === 'tachi' && stage === 3 && status === 'listened').map(([u]) => u);
/** Their conversations as compiled, by id. */
const PARTS = FILES.flatMap((u) => (JSON.parse(readFileSync(join(LEVELS, 'parts', `${u}.json`), 'utf8')) as { listen: { items: Yaml[] } }).listen.items);
const BY_ID = new Map(PARTS.map((it) => [it.id, it]));
/** A round's right answer: opinions each claim's face (by first line), changed a face, plan a choice. */
function answerOf(id: string, k: number): number | number[] {
  const it = BY_ID.get(id)!, who = [...new Set(it.lines.map((l) => l.who))], r = it.rounds[k];
  return r.type === 'opinions' ? r.answer.map((w) => who.indexOf(w)) : r.type === 'changed' ? who.indexOf(r.answer) : r.answer;
}

type Kiki = { view(): { phase: string; i: number; gm: string | null; roles: Record<string, number> }; items(): string[]; recorded(): { gm?: string; r: [string, number, number, number][] } | null };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function snap(p: Page, name: string, fullPage = false) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}

async function phone(ctx: BrowserContext, q: string, as: 'A' | 'B' = 'A'): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`?demo&${q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  return page;
}
/** From the hub: あそぶ › たちぎき's page. */
async function toTachi(p: Page) {
  await fromMenu(p, 'kikimimi');
  await atHub(p);
  await sheet(p).locator('[data-kiki-tile="asobu"]').click();
  await sheet(p).locator('[data-kiki-mode-tile="tachi"]').click();
  await expect(sheet(p).locator('[data-kiki-mode-page="tachi"]')).toBeVisible();
}

/** The round now: its conversation and its place in it. */
async function round(p: Page): Promise<{ id: string; k: number; i: number }> {
  const [i, ids] = await Promise.all([kiki(p, (k) => k.view().i), kiki(p, (k) => k.items())]);
  return { id: ids[i], k: i % 3, i };
}

/** My answer to the round now: right, or (`wrong`) another face or choice. Opinions: my faces (`faces`; solo all three),
 *  each on its claim (the given one left), then できた. */
async function answer(p: Page, o: { wrong?: boolean; faces?: number[] } = {}) {
  const { id, k } = await round(p);
  const want = answerOf(id, k);
  if (Array.isArray(want)) {
    await expect(sheet(p).locator('[data-kiki-tachi-claims]')).toBeVisible({ timeout: 90_000 });
    const faces = o.faces ?? [0, 1, 2];
    for (const f of faces) {
      // (wrong: the first two faces swapped; co-op mine on my partner's claim)
      const j = want.indexOf(f), at = o.wrong && f !== 2 ? want.indexOf(1 - f) : j;
      if (await sheet(p).locator(`[data-claim="${j}"][data-given]`).count()) continue;
      await sheet(p).locator(`[data-claim="${at}"] [data-face="${f}"]`).click();
    }
    await expect(sheet(p).locator('[data-kiki-tachi-done]')).toHaveAttribute('aria-disabled', 'false');
    await sheet(p).locator('[data-kiki-tachi-done]').click();
  } else if (k === 1) {
    await sheet(p).locator(`[data-kiki-tachi-changed] [data-choice="${o.wrong ? (want + 1) % 3 : want}"]`).click();
  } else {
    await sheet(p).locator(`.choices [data-choice="${o.wrong ? (want + 1) % 3 : want}"]`).click();
  }
}

test('solo: the mode once listened, the conversation first, then whose view, who changed, the plan; a line again; the transcript; my row', async ({ context }) => {
  test.setTimeout(240_000); // two real conversations (30–50 s each) play through: past test.slow()'s 90 s on CI's 3 workers
  const page = await phone(context, DAY);
  await toTachi(page);
  await snap(page, 'mode');
  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => kiki(page, (k) => k.view().gm)).toBe('tachi');
  // the conversation first: three seats, nothing to answer
  await expect(sheet(page).locator('[data-kiki-tachi-wait]')).toBeVisible({ timeout: 15_000 });
  await expect(sheet(page).locator('[data-kiki-tachi-seats] [data-face]')).toHaveCount(3);
  await expect(sheet(page).locator('[data-kiki-tachi-claims]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-ctx]')).toBeVisible();
  await snap(page, 'listen');
  // round 1: a face on a claim, moved, taken off; then all three; できた
  await expect(sheet(page).locator('[data-kiki-tachi-claims]')).toBeVisible({ timeout: 90_000 });
  await expect(sheet(page).locator('[data-kiki-tachi-done]')).toHaveAttribute('aria-disabled', 'true');
  const open = sheet(page).locator('[data-claim]:not([data-given])');
  await open.nth(0).locator('[data-face="0"]').click();
  await open.nth(1).locator('[data-face="0"]').click();
  await expect(open.nth(0).locator('[data-face="0"]')).not.toHaveAttribute('data-on');
  await expect(open.nth(1).locator('[data-face="0"]')).toHaveAttribute('data-on', 'true');
  await open.nth(1).locator('[data-face="0"]').click();
  await expect(open.locator('[data-on]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-tachi-lines] [data-line]').first()).toBeVisible();
  await snap(page, 'opinions');
  await answer(page);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-why]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-transcript]')).toHaveCount(0); // (not till the conversation's last round)
  await snap(page, 'reveal-opinions');
  // a line again, alone
  await sheet(page).locator('[data-kiki-tachi-lines] [data-line="2"]').click();
  await sheet(page).locator('[data-kiki-next]').click();
  // round 2 wrong, then the plan right: the transcript in three seats
  await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 20_000 }).toBe(1);
  await expect(sheet(page).locator('[data-kiki-tachi-changed]')).toBeVisible();
  await snap(page, 'changed');
  await answer(page, { wrong: true });
  await expect(sheet(page).locator('[data-kiki-verdict="wrong"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-tachi-changed] [data-mark="right"]')).toHaveCount(1);
  await snap(page, 'reveal-changed');
  await sheet(page).locator('[data-kiki-next]').click();
  await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 20_000 }).toBe(2);
  await snap(page, 'plan');
  await answer(page);
  await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-transcript] [data-seat="centre"]').first()).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-transcript] [data-seat]')).toHaveCount(BY_ID.get((await round(page)).id)!.lines.length);
  await snap(page, 'reveal-plan', true);
  await sheet(page).locator('[data-kiki-next]').click();
  // the second conversation, right
  for (let i = 3; i < 6; i++) {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 20_000 }).toBe(i);
    await answer(page);
    await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  await expect(sheet(page).locator('[data-kiki-tally]')).toHaveText('5 / 6 問正解');
  await expect(sheet(page).locator('[data-review]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-kiki-tachi-mine]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-kiki-detail] [data-kiki-transcript]')).toBeVisible();
  await snap(page, 'results', true);
  // my row: the game, a row a round (the conversation's id and the round's), the miss
  const row = await kiki(page, (k) => k.recorded());
  expect(row?.gm).toBe('tachi');
  expect(row!.r.map(([, ok]) => ok)).toEqual([1, 0, 1, 1, 1, 1]);
  const ids = await kiki(page, (k) => k.items());
  expect(row!.r.map(([id]) => id)).toEqual(ids.map((id, i) => `${id}-${['op', 'ch', 'pl'][i % 3]}`));
});

test('night: the claims and a reveal in the night palette', async ({ context }) => {
  test.skip(!process.env.KIKI_SHOTS, 'screenshots only');
  test.setTimeout(240_000); // two real conversations (30–50 s each) play through: past test.slow()'s 90 s on CI's 3 workers
  const page = await phone(context, NIGHT);
  await toTachi(page);
  await sheet(page).locator('[data-kiki-start]').click();
  await expect(sheet(page).locator('[data-kiki-tachi-wait]')).toBeVisible({ timeout: 15_000 });
  await snap(page, 'night-listen');
  await expect(sheet(page).locator('[data-kiki-tachi-claims]')).toBeVisible({ timeout: 90_000 });
  await snap(page, 'night-opinions');
  await answer(page, { wrong: true });
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await snap(page, 'night-reveal');
  await sheet(page).locator('[data-kiki-next]').click();
  await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 20_000 }).toBe(1);
  await answer(page);
  await sheet(page).locator('[data-kiki-next]').click();
  await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 20_000 }).toBe(2);
  await answer(page);
  await expect(sheet(page).locator('[data-kiki-transcript]')).toBeVisible();
  await snap(page, 'night-transcript', true);
});

test('co-op on two phones 「たんとう」: a speaker each and a shared one, each places their own; the team’s rounds are those both got', async ({ browser }) => {
  test.setTimeout(240_000);
  const ctx = await browser.newContext();
  const a = await phone(ctx, DAY, 'A'), b = await phone(ctx, DAY, 'B');
  await a.bringToFront();
  await toTachi(a);
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect.poll(() => kiki(b, (k) => k && k.view().gm), { timeout: 15_000 }).toBe('tachi');
  await a.bringToFront();
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('始める（2人）', { timeout: 10_000 });
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
  expect(await kiki(a, (k) => k.items())).toEqual(await kiki(b, (k) => k.items()));

  // B's own face on the wrong claim in the second conversation's opinions: the team gets 5 of 6
  for (let i = 0; i < 6; i++) {
    for (const [p, who] of [[a, 'A'], [b, 'B']] as const) {
      await p.bringToFront();
      await expect.poll(() => kiki(p, (k) => k.view().i), { timeout: 20_000 }).toBe(i);
      const role = who === 'A' ? 0 : 1;
      if (i === 0) {
        expect(await kiki(p, (k) => k.view().roles)).toEqual({ A: 0, B: 1 });
        await expect(sheet(p).locator(`[data-kiki-tachi-seats] [data-face="${role}"]`)).toHaveAttribute('data-part', 'mine');
        await expect(sheet(p).locator('[data-kiki-tachi-seats] [data-face="2"]')).toHaveAttribute('data-part', 'shared');
        await expect(sheet(p).locator('[data-kiki-tachi-claims]')).toBeVisible({ timeout: 90_000 });
        if (who === 'B') await snap(p, 'coop-opinions');
      }
      await answer(p, { faces: [role, 2], wrong: who === 'B' && i === 3 });
    }
    await a.bringToFront();
    await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
    if (i === 3) await snap(a, 'coop-reveal');
    await b.bringToFront();
    await sheet(b).locator('[data-kiki-ready]').click();
    await a.bringToFront();
    await sheet(a).locator('[data-kiki-next]').click();
  }
  await expect(sheet(a)).toHaveAttribute('data-phase', 'results');
  await expect(sheet(a).locator('[data-kiki-team]')).toHaveAttribute('data-kiki-team', '5');
  await expect(sheet(a).locator('[data-kiki-tally]')).toHaveText('自分は 6 / 6');
  await snap(a, 'coop-results', true);
  await b.bringToFront();
  await expect(sheet(b)).toHaveAttribute('data-phase', 'results', { timeout: 10_000 });
  await expect(sheet(b).locator('[data-kiki-tally]')).toHaveText('自分は 5 / 6');
  await ctx.close();
});
