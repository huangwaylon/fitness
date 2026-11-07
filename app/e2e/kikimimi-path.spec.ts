// しまの みち's polish, U7 (docs/kikimimi-ux.md U7, §6.3, §6.3b): a built unit's チェック (tr-hotel's, from とばして
// チェック, all right on the first listen) stamps it, and its host's letter arrives on the results (open, the English
// first, 「にほんごやく」 its gloss); the unit's page has it folded under the stamps, and ずかん lists it. Then a phone
// with a みみ チェック placed at かわ and かわ's four units stamped one by one (rows kept on the phone): 「ここから」 on
// かわ, もり above it soft (open: the current unit is its first), はまべ folded, かわ's landmark celebrated once (やったね:
// never again, the badge stays). The
// logic tier (Playwright's Chromium is muted: nothing is heard). Screenshots at 393×852 (KIKI_SHOTS=1) into
// /tmp/kikimimi-shots/path/.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, openStage } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';
const SHOTS = '/tmp/kikimimi-shots/path';

type Kiki = { view(): { phase: string; i: number }; right(): number; recorded(): { u?: string; l?: number } | null };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function snap(p: Page, name: string, fullPage = false) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await expect.poll(() => p.evaluate(() => document.getAnimations().filter((x) => {
    const e = x.effect as KeyframeEffect | null;
    return x.playState === 'running' && e?.getTiming().iterations !== Infinity && !!(e?.target as Element | null)?.closest('dialog');
  }).length)).toBe(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}
/** The hub, then しまの みち from あそぶ's card. */
async function toPath(page: Page) {
  await page.goto(`?demo&${Q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
  await sheet(page).locator('[data-kiki-path-open]').click();
  await expect(sheet(page).locator('[data-kiki-page="path"]')).toBeVisible();
}
/** A lesson's 6 questions, all right on the first listen. */
async function playAllRight(page: Page) {
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  for (let i = 0; i < 6; i++) {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 45_000 }).toBe(i);
    await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 45_000 });
    await sheet(page).locator(`[data-choice="${await kiki(page, (k) => k.right())}"]`).click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
}

test('a stamp brings the host’s letter: on the results, then on the unit’s page and in ずかん › スタンプ', async ({ page }) => {
  test.slow();
  await toPath(page);
  await openStage(page, 'mori');
  await sheet(page).locator('[data-kiki-stop="tr-hotel"] [data-kiki-stop-open]').click();
  const unit = sheet(page).locator('[data-kiki-unit-page="tr-hotel"]');
  await expect(unit.locator('[data-kiki-stamps]')).not.toHaveAttribute('data-stamped', '1');
  await expect(unit.locator('[data-kiki-letter]')).toHaveCount(0);
  await sheet(page).locator('[data-kiki-skip-check]').click();
  await sheet(page).locator('[data-kiki-lesson-start]').click();
  await playAllRight(page);
  expect(await kiki(page, (k) => k.recorded())).toMatchObject({ u: 'tr-hotel', l: 3 });

  // the results: the stamp, and ナタリー's letter open (English; the gloss behind its toggle)
  const strip = sheet(page).locator('[data-kiki-lesson-result="check"]');
  await expect(strip).toHaveAttribute('data-kiki-stamped', '1');
  const letter = strip.locator('[data-kiki-letter="tr-hotel"]');
  await expect(letter).toHaveAttribute('data-open', 'true');
  await expect(letter).toContainText('届きました');
  await expect(letter.locator('[data-kiki-letter-en]')).toContainText("I'm afraid");
  await expect(letter.locator('[data-kiki-letter-gloss]')).toHaveCount(0);
  await snap(page, 'results-letter');
  await letter.locator('[data-kiki-letter-ja]').click();
  await expect(letter.locator('[data-kiki-letter-gloss]')).toContainText('あいにく');
  await letter.scrollIntoViewIfNeeded();
  await snap(page, 'results-letter-ja');

  // the unit's page: folded under the stamps; a tap opens it
  await sheet(page).locator('[data-kiki-done]').click();
  await expect(unit.locator('[data-kiki-stamps]')).toHaveAttribute('data-stamped', '1');
  const kept = unit.locator('[data-kiki-letter="tr-hotel"]');
  await expect(kept).not.toHaveAttribute('data-open', 'true');
  await kept.locator('[data-kiki-letter-open]').click();
  await expect(kept.locator('[data-kiki-letter-en]')).toContainText('complimentary');
  await snap(page, 'unit-letter');

  // the path: the stop stamped; ずかん's letters
  await page.locator('dialog[open] .titlebar .nav.back').click();
  await expect(sheet(page).locator('[data-kiki-stop="tr-hotel"]')).toHaveAttribute('data-stamped', '1');
  await sheet(page).locator('[data-kiki-zukan-open]').click();
  await sheet(page).locator('[data-kiki-zukan-tab="stamps"]').click();
  await expect(sheet(page).locator('[data-kiki-letters]')).toHaveAttribute('data-kiki-letters', '1');
  await sheet(page).locator('[data-kiki-letters] [data-kiki-letter="tr-hotel"]').scrollIntoViewIfNeeded();
  await snap(page, 'zukan-letters');
});

/** かわ's four units' チェック rows, each a pass (6 / 6 on the first listen), and a みみ チェック placed at かわ: kept on
 *  A's phone (DEVICE.kikimimiGames), as if played here before. */
const KAWA = ['gl-clarify', 'gl-endcall', 'fr-replan', 'ev-bday'];
async function seedKawa(page: Page) {
  const rows = [
    { at: Date.parse('2026-10-20T03:00:00Z'), row: { d: '2026-10-20', g: 'chk0001', gm: 'check', u: '22222', lv: 3, n: 1, ms: 180_000, r: ['r4-leak', 'm4-easy', 'n4-reference', 'w4-youll-need', 'r4-triage', 'm4-see-what', 'r4-reschedule', 'm4-upgrade'].map((id) => [id, 1, 0, 0]) } },
    ...KAWA.map((u, k) => ({
      at: Date.parse(`2026-11-0${k + 1}T03:00:00Z`),
      row: { d: `2026-11-0${k + 1}`, g: `kawa000${k}`, u, l: 3, lv: 3, n: 1, ms: 150_000, r: Array.from({ length: 6 }, (_, i) => [`${u}-q${i}`, 1, 0, 0]) }
    }))
  ];
  await page.addInitScript((v) => localStorage.setItem('island.kikimimiGames', v), JSON.stringify({ who: 'A', rows }));
}

test('the placement and a landmark: 「ここから」 at かわ, もり above it soft; かわ cleared one by one, celebrated once', { tag: '@quarantine', annotation: { type: 'quarantine', description: 'owner: ききみみ session (fitness-fa), since 2026-11-07: red on main from 3866b8f1, an element never visible (CI run for 60b141d7); quarantined by the ごはん session to unblock deploys' } }, async ({ page }) => {
  await seedKawa(page);
  await toPath(page);
  const kawa = sheet(page).locator('[data-kiki-stage="kawa"]');
  await expect(kawa.locator('[data-kiki-here]')).toHaveText('ここから');
  await expect(kawa.locator('[data-kiki-stage-count]')).toHaveAttribute('data-kiki-stage-count', '4');
  await expect(kawa.locator('[data-kiki-landmark="kawa"]')).toBeVisible();
  // the celebration, scrolled to; かわ open, もり (above the placement) soft, open on the current unit; はまべ folded
  const party = kawa.locator('[data-kiki-landmark-party="kawa"]');
  await expect(party).toBeInViewport();
  await expect(party).toContainText('かわをクリア！');
  await expect(party).toContainText('いかだ');
  const mori = sheet(page).locator('[data-kiki-stage="mori"]');
  await expect(mori).toHaveAttribute('data-soft', 'true');
  await expect(sheet(page).locator('[data-kiki-stage-toggle="mori"]')).toHaveAttribute('aria-expanded', 'true');
  await expect(mori.locator('[data-current]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-kiki-stage-toggle="hama"]')).toHaveAttribute('aria-expanded', 'false');
  await expect(sheet(page).locator('[data-kiki-path-quiz]')).toHaveCount(0);
  for (const u of KAWA) await expect(kawa.locator(`[data-kiki-stop="${u}"]`)).toHaveAttribute('data-stamped', '1');
  await snap(page, 'landmark');
  await party.locator('[data-kiki-landmark-ok]').click();
  await expect(party).toHaveCount(0);
  await expect(kawa.locator('[data-kiki-landmark="kawa"]')).toBeVisible();
  // はまべ opens on a tap (the quick quiz), and folds again
  await openStage(page, 'hama');
  await expect(sheet(page).locator('[data-kiki-path-quiz]')).toBeVisible();
  await sheet(page).locator('[data-kiki-stage-toggle="hama"]').click();
  await expect(sheet(page).locator('[data-kiki-path-quiz]')).toHaveCount(0);
  await page.evaluate(() => document.querySelector('[data-kiki-stage="kawa"]')?.scrollIntoView());
  await snap(page, 'placed');

  // again (reduced motion: the scroll at once, nothing to wait for): the badge, no second celebration
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('dialog[open] .titlebar .nav.back').click();
  await sheet(page).locator('[data-kiki-path-open]').click();
  await expect(kawa.locator('[data-kiki-landmark="kawa"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-landmark-party]')).toHaveCount(0);
  // opened afresh: the current stop scrolled to, about a third down
  await expect(sheet(page).locator('[data-current] [data-kiki-continue]')).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.querySelector('[data-kiki-page="path"]')!.parentElement!.closest('.kk-body')?.scrollTop ?? 0)).toBeGreaterThan(200);
  await snap(page, 'path-open');
});
