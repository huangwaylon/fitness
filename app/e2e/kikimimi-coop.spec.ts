// ききみみ's co-op lessons, framework 8c (docs/curriculum-units.md §4, §10; docs/kikimimi-framework.md §4): two phones
// over the demo's relay (`?demo` and `?demo&as=B`: sync/live-local.ts), a fixture unit put in on both through the dev
// hook with the same content version. A's shared lobby picks the unit's チェック on しまの みち for everyone, B waits on
// its intro card, they play it, and both are stamped though B gets only 2 right: the team's first listens (`tm`) are 6.
// The same over the dual stack (B on `?wire=quiz`, an 8b phone's sends, A on the default). A content version that
// isn't B's: A's lesson is an update on B's phone, 「アプリを こうしんしてね」, which reloads it. The logic tier.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';

type Kiki = {
  view(): { phase: string; i: number; n: number; o: number[] };
  right(): number;
  unit(unit: unknown, ids: string[], cv?: string): Promise<void>;
  recorded(): { u?: string; l?: number; tm?: number; r: [string, number, number, number][] } | null;
};
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');

const CHECK = ['ml-n-room', 'ml-n-late-checkout', 'r4-leak', 'm4-easy', 'n4-reference', 'w4-youll-need'];
const LESSONS = {
  deai: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'r4-overbooked', 'ml-m-quieter-room', 'r4-anything-else'],
  bamen: ['ml-r-incidentals', 'm4-not-ideal', 'r4-triage', 'm4-see-what', 'w4-cant-uk', 'r4-reschedule'],
  check: CHECK
};
const IDS = Object.values(LESSONS).flat();
/** A unit as its chunk holds it (compile.ts unitChunk), over the bank's level-4 items (kikimimi-units.spec's). */
const UNIT = {
  id: 'tr-coopinn', name: 'ホテルで こまった', stage: 'mori', domain: 'tabi', host: 'diana', scene: 'lobby', sound: 'self-repair', status: 'draft',
  cando: { ja: 'ホテルの スタッフが へやの もんだいへの たいおうを せつめいするのを きいて、できる ことが わかる', short: 'ホテルの もんだいを ききとれる', en: 'I can follow hotel staff…' },
  lessons: { v: 1, ...LESSONS }, home: IDS,
  ph: [{ id: 'ph-co-room', en: 'the room is ready', register: 'service', scene: 'hotel desk', trap: 'ready = もう はいれる', in: ['r4-room-ready'] }]
};

async function phone(ctx: BrowserContext, as: 'A' | 'B', extra = ''): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`?demo&${Q}${as === 'A' ? '' : `&as=${as}`}${extra}`);
  await islandUp(page);
  return page;
}
const addUnit = (p: Page, cv: string) => p.evaluate(([u, ids, cv]) => (window as unknown as { __kiki: Kiki }).__kiki.unit(u, ids as string[], cv as string), [UNIT, IDS, cv] as const);

/** A's lobby shared, B joined from its banner; the fixture unit on both (`cvB`: B's content version). */
async function together(ctx: BrowserContext, o: { wireB?: string; cvB?: string } = {}): Promise<[Page, Page]> {
  const a = await phone(ctx, 'A'), b = await phone(ctx, 'B', o.wireB ? `&wire=${o.wireB}` : '');
  await a.bringToFront();
  await fromMenu(a, 'kikimimi');
  await expect(sheet(a)).toHaveAttribute('data-phase', 'lobby');
  await addUnit(a, 'c0ffee');
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect(sheet(b)).toHaveAttribute('data-phase', 'lobby');
  await addUnit(b, o.cvB ?? 'c0ffee');
  await a.bringToFront();
  await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', 'here');
  return [a, b];
}

/** A picks the unit's チェック for everyone: しまの みち from the lobby's card, the unit's page, とばして チェック. */
async function pickCheck(a: Page) {
  await a.bringToFront();
  await sheet(a).locator('[data-kiki-path-open]').click();
  await sheet(a).locator(`[data-kiki-stop="${UNIT.id}"] [data-kiki-stop-open]`).click();
  await sheet(a).locator('[data-kiki-skip-check]').click();
}

for (const wireB of ['', 'quiz'] as const) {
  test(`co-op lesson: A picks a unit’s チェック for both, B waits on its intro card; B scores 2 but the team’s first listens are 6: both stamped${wireB ? ' (the dual stack: B on ?wire=quiz)' : ''}`, async ({ browser }) => {
    test.slow();
    const ctx = await browser.newContext();
    const [a, b] = await together(ctx, { wireB });
    await pickCheck(a);
    const intro = sheet(a).locator('[data-kiki-intro="check"]');
    await expect(intro).toHaveAttribute('data-kiki-coop', '1');
    await expect(intro.locator('[data-kiki-mission-team]')).toBeVisible();
    await expect(sheet(a).locator('[data-kiki-lesson-start]')).toHaveText('はじめる（2にん）');
    // B: the same lesson's intro card, waiting for A (no start, no back)
    await b.bringToFront();
    await expect(sheet(b).locator('[data-kiki-intro="check"]')).toBeVisible({ timeout: 10_000 });
    await expect(sheet(b).locator('[data-kiki-lesson-start]')).toHaveCount(0);
    await expect(sheet(b).locator('.wait')).toContainText('はじめるのを まっています');
    await a.bringToFront();
    await sheet(a).locator('[data-kiki-lesson-start]').click();
    await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
    // six questions: A all right on the first listen, B right only on the first two
    for (let i = 0; i < 6; i++) {
      for (const p of [a, b]) {
        await p.bringToFront();
        await expect.poll(() => kiki(p, (k) => k.view().i), { timeout: 45_000 }).toBe(i);
        await expect(sheet(p)).toHaveAttribute('data-phase', 'answer', { timeout: 45_000 });
        const right = await kiki(p, (k) => k.right());
        const k = p === b && i >= 2 ? (right + 1) % (await sheet(p).locator('[data-choice]').count()) : right;
        await sheet(p).locator(`[data-choice="${k}"]`).click();
        await expect(sheet(p).locator(`[data-choice="${k}"]`)).toHaveAttribute('aria-pressed', 'true');
      }
      await a.bringToFront();
      await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
      await sheet(a).locator('[data-kiki-next]').click();
    }
    for (const p of [a, b]) {
      await p.bringToFront();
      await expect(sheet(p)).toHaveAttribute('data-phase', 'results', { timeout: 20_000 });
      const rec = await kiki(p, (k) => k.recorded());
      expect(rec).toMatchObject({ u: UNIT.id, l: 3, tm: 6 });
      expect([...rec!.r.map((x) => x[0])].sort()).toEqual([...CHECK].sort());
      // the shared stamp, each phone's own tally beside it
      const strip = sheet(p).locator('[data-kiki-lesson-result="check"]');
      await expect(strip).toHaveAttribute('data-kiki-stamped', '1');
      await expect(strip.locator('[data-kiki-stamp-got]')).toBeVisible();
      await expect(strip.locator('[data-kiki-tally-mine]')).toHaveAttribute('data-kiki-tally-mine', p === a ? '6' : '2');
      await expect(strip.locator('[data-kiki-tally-mine]')).toContainText('チーム 6/6');
      if (process.env.KIKI_SHOTS) await p.screenshot({ path: `/tmp/kikimimi-shots/8c/coop-results-${p === a ? 'A' : 'B'}${wireB ? '-quiz' : ''}.png` });
    }
    await ctx.close();
  });
}

test('a content version that isn’t this phone’s: the lesson is an update on B’s phone, さんか refused; 「こうしんする」 reloads', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const [a, b] = await together(ctx, { cvB: 'bad000' });
  await pickCheck(a);
  await expect(sheet(a).locator('[data-kiki-intro="check"]')).toBeVisible();
  await b.bringToFront();
  const card = sheet(b).locator('[data-kiki-blocked="update"]');
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(sheet(b)).toHaveAttribute('data-phase', 'idle');
  await expect(card.locator('[data-kiki-update-note]')).toHaveText('アプリを こうしんしてね');
  await expect(card.locator('[data-kiki-join]')).toHaveCount(0);
  if (process.env.KIKI_SHOTS) await b.screenshot({ path: '/tmp/kikimimi-shots/8c/update.png' });
  // the update: the app's reload path (no worker in the e2e: at once)
  const loaded = b.waitForEvent('load');
  await card.locator('[data-kiki-update]').click();
  await loaded;
  await islandUp(b);
  await ctx.close();
});
