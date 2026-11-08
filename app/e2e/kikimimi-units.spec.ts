// ききみみ's units on しまの みち, U4 (docs/curriculum-units.md §13; docs/kikimimi-ux.md §6.3, §6.3b): a fixture unit
// put in through the dev hook (the bank's items, never shipped) shows on the path from the lobby's card, the can-do's
// one line its subtitle; its page has the one line (the template's sentence under 「くわしく」) and the three core lessons; であい played solo moves its dot (the unit page's and the path's); the チェック
// from 「とばして チェック」 opens on the phone errand's mission card and, all right on the first listen, stamps the unit:
// the results' strip, the unit page and the path's stop. The logic tier (no clip has to sound).
// KIKI_SHOTS=1 writes the 393×852 screenshot pass into /tmp/kikimimi-shots/u4/.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { openStage, runToQuestion } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&kikimimi=fast';
const SHOTS = process.env.KIKI_SHOTS ? '/tmp/kikimimi-shots/u4' : null;

type Kiki = {
  view(): { phase: string; i: number; n: number };
  right(): number;
  items(): string[];
  unit(unit: unknown, ids: string[]): Promise<void>;
  recorded(): { u?: string; l?: number; tm?: number; lv: number; r: unknown[] } | null;
};
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');
async function snap(p: Page, name: string, fullPage = false) {
  if (!SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}

const LESSONS = {
  deai: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'r4-overbooked', 'ml-m-quieter-room', 'r4-anything-else'],
  bamen: ['ml-r-incidentals', 'm4-not-ideal', 'r4-triage', 'm4-see-what', 'w4-cant-uk', 'r4-reschedule'],
  check: ['ml-n-room', 'ml-n-late-checkout', 'r4-leak', 'm4-easy', 'n4-reference', 'w4-youll-need']
};
/** A unit as its chunk holds it (compile.ts unitChunk), over the bank's level-4 items. */
const UNIT = {
  id: 'tr-testinn', name: 'ホテルで こまった', stage: 'mori', domain: 'tabi', host: 'diana', scene: 'lobby', sound: 'self-repair', status: 'draft',
  cando: { ja: 'ホテルの スタッフが へやの もんだいへの たいおうを せつめいするのを ロビーの ざつおんの なかで きいて、できる ことと ついかの りょうきんが わかる', short: 'ホテルの もんだいを ききとれる', en: 'I can follow hotel staff…' },
  lessons: { v: 1, ...LESSONS }, home: Object.values(LESSONS).flat(),
  ph: [
    { id: 'ph-ti-room', en: 'the room is ready', ja: 'お部屋の準備ができました', register: 'service', scene: 'hotel desk', trap: 'ready = もう はいれる', in: ['r4-room-ready'] },
    { id: 'ph-ti-upgrade', en: 'an upgrade', register: 'service', scene: 'hotel desk', trap: 'むりょうとは かぎらない', in: ['m4-upgrade'] }
  ]
};

/** The hub, the fixture unit put in, しまの みち opened from あそぶ's card. */
async function toPath(page: Page) {
  await page.clock.install(); // (the lessons' plays stepped through: kikimimi-nav.ts runUntil)
  await page.goto(`?demo&${Q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await page.evaluate(([u, ids]) => (window as unknown as { __kiki: Kiki }).__kiki.unit(u, ids as string[]), [UNIT, Object.values(LESSONS).flat()] as const);
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
  await sheet(page).locator('[data-kiki-path-open]').click();
  await expect(sheet(page).locator('[data-kiki-page="path"]')).toBeVisible();
  await openStage(page, 'mori');
}
/** A lesson's 6 questions, all right on the first listen (a dialogue plays out at its length first). */
async function playAllRight(page: Page) {
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  for (let i = 0; i < 6; i++) {
    await runToQuestion(page, i, 'answer');
    await sheet(page).locator(`[data-choice="${await kiki(page, (k) => k.right())}"]`).click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
}

test('しまの みち: a unit’s stop, its page, であい played solo moves its dot; the filter collapses other domains', async ({ page }) => {
  await toPath(page);
  const stop = sheet(page).locator('[data-kiki-stop="tr-testinn"]');
  await expect(stop).toBeVisible();
  await expect(stop.locator('[data-dot]')).toHaveCount(3);
  await expect(stop.locator('[data-kiki-stop-short]')).toHaveText(UNIT.cando.short);
  await expect(sheet(page).locator('[data-kiki-stage="mori"]').locator('[data-kiki-stop="tr-testinn"]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-current]')).toHaveCount(1);
  await snap(page, 'path');
  await snap(page, 'path-full', true);
  // a domain chip: other domains collapse to a dot (the stage keeps its shape); ぜんぶ brings them back
  await sheet(page).locator('[data-kiki-chip="shigoto"]').click();
  await expect(stop).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-stop-hidden="tr-testinn"]')).toHaveCount(1);
  await sheet(page).locator('[data-kiki-chip="all"]').click();
  await expect(stop).toBeVisible();

  // its page: the can-do's one line (the sentence folded under くわしく), the three core lessons, であい the next
  await stop.locator('[data-kiki-stop-open]').click();
  const unit = sheet(page).locator('[data-kiki-unit-page="tr-testinn"]');
  await expect(unit).toBeVisible();
  await expect(unit.locator('[data-kiki-short]')).toHaveText(UNIT.cando.short);
  await expect(unit.locator('[data-kiki-short]')).toBeVisible();
  await expect(unit.locator('[data-kiki-cando]')).toBeHidden();
  await snap(page, 'unit-short');
  await unit.getByText('詳しく', { exact: true }).click();
  await expect(unit.locator('[data-kiki-cando]')).toBeVisible();
  await expect(unit.locator('[data-kiki-cando]')).toContainText('わかる');
  await expect(unit.locator('[data-kiki-unit-lesson]')).toHaveCount(3);
  await expect(unit.locator('.lesson.next')).toHaveAttribute('data-kiki-unit-lesson', 'deai');
  await expect(sheet(page).locator('[data-kiki-skip-check]')).toBeVisible();
  await snap(page, 'unit');

  // であい: its intro card, back (the unit page again), then played
  await unit.locator('[data-kiki-unit-lesson="deai"]').click();
  await expect(sheet(page).locator('[data-kiki-intro="deai"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-intro-goal]')).toContainText(UNIT.cando.short);
  await snap(page, 'lesson-intro');
  await sheet(page).locator('[data-kiki-lesson-back]').click();
  await expect(unit).toBeVisible();
  await unit.locator('[data-kiki-unit-lesson="deai"]').click();
  await sheet(page).locator('[data-kiki-lesson-start]').click();
  await playAllRight(page);
  expect(await kiki(page, (k) => k.recorded())).toMatchObject({ u: 'tr-testinn', l: 1 });
  const strip = sheet(page).locator('[data-kiki-lesson-result="deai"]');
  await expect(strip.locator('[data-dot="deai"]')).toHaveClass(/done/);
  await expect(strip.locator('[data-kiki-next-lesson="bamen"]')).toBeVisible();

  // おわる: back on the unit's page, であい done, ばめん next; ‹ to the path: the stop's dot
  await sheet(page).locator('[data-kiki-done]').click();
  await expect(unit).toBeVisible();
  await expect(unit.locator('[data-kiki-unit-lesson="deai"]')).toHaveAttribute('data-done', 'true');
  await expect(unit.locator('.lesson.next')).toHaveAttribute('data-kiki-unit-lesson', 'bamen');
  await page.locator('dialog[open] .titlebar .nav.back').click();
  await expect(stop.locator('[data-dot="deai"]')).toHaveClass(/done/);
  // played last and unstamped: the current unit, with つづける on ばめん
  await expect(stop).toHaveAttribute('data-current', 'true');
});

test('とばして チェック: the mission card, the stamp on the results, the unit page and the path; the ずかん', async ({ page }) => {
  await toPath(page);
  await sheet(page).locator('[data-kiki-stop="tr-testinn"] [data-kiki-stop-open]').click();
  const unit = sheet(page).locator('[data-kiki-unit-page="tr-testinn"]');
  await expect(unit.locator('[data-kiki-stamps]')).not.toHaveAttribute('data-stamped', '1');
  await sheet(page).locator('[data-kiki-skip-check]').click();
  const intro = sheet(page).locator('[data-kiki-intro="check"]');
  await expect(intro.locator('[data-kiki-mission]')).toContainText('でんわ');
  await snap(page, 'mission');
  await sheet(page).locator('[data-kiki-lesson-start]').click();
  const items = await kiki(page, (k) => k.items());
  expect([...items].sort()).toEqual([...LESSONS.check].sort());
  await playAllRight(page);

  const rec = await kiki(page, (k) => k.recorded());
  expect(rec).toMatchObject({ u: 'tr-testinn', l: 3, lv: 4 });
  expect(rec!.tm).toBeUndefined();
  const strip = sheet(page).locator('[data-kiki-lesson-result="check"]');
  await expect(strip).toHaveAttribute('data-kiki-stamped', '1');
  await expect(strip.locator('[data-kiki-stamp-got]')).toBeVisible();
  await expect(strip.locator('[data-kiki-tally-mine]')).toHaveAttribute('data-kiki-tally-mine', '6');
  await snap(page, 'results-stamp');

  // back: the unit page's stamp, then the path's stop
  await sheet(page).locator('[data-kiki-done]').click();
  await expect(unit.locator('[data-kiki-stamps]')).toHaveAttribute('data-stamped', '1');
  await expect(sheet(page).locator('[data-kiki-skip-check]')).toHaveCount(0);
  await snap(page, 'unit-stamped');
  // the phrases: the ずかん on this unit's
  await unit.locator('[data-kiki-unit-phrases]').click();
  await expect(sheet(page).locator('[data-kiki-zukan="tr-testinn"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-phrase]')).toHaveCount(2);
  await sheet(page).locator('[data-kiki-phrase="ph-ti-room"]').click();
  await expect(sheet(page).locator('[data-kiki-phrase-entry="ph-ti-room"]')).toContainText('ready');
  await snap(page, 'zukan');
  await page.locator('dialog[open] .titlebar .nav.back').click();
  await page.locator('dialog[open] .titlebar .nav.back').click();
  const stop = sheet(page).locator('[data-kiki-stop="tr-testinn"]');
  await expect(stop).toHaveAttribute('data-stamped', '1');
  await expect(stop.locator('[data-dot="check"]')).toHaveClass(/done/);
  await expect(sheet(page).locator('[data-kiki-stage="mori"] [data-kiki-stage-count]')).toHaveAttribute('data-kiki-stage-count', '1');
  await stop.scrollIntoViewIfNeeded();
  await snap(page, 'path-stamped');
});

test('a built unit’s page counts all its key phrases: tr-hotel’s 「捕まえた 0 / 9」 (the fixture above, with the same name, has 2)', async ({ page }) => {
  const ph = (JSON.parse(readFileSync(join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels', 'parts', 'u-tr-hotel.json'), 'utf8')) as { unit: { ph: unknown[] } }).unit.ph;
  expect(ph.length).toBeGreaterThan(2);
  await page.goto(`?demo&${Q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
  await sheet(page).locator('[data-kiki-path-open]').click();
  await openStage(page, 'mori');
  await sheet(page).locator('[data-kiki-stop="tr-hotel"] [data-kiki-stop-open]').click();
  const phrases = sheet(page).locator('[data-kiki-unit-page="tr-hotel"] [data-kiki-unit-phrases]');
  await expect(phrases).toHaveAttribute('data-kiki-unit-phrases', '0');
  await expect(phrases).toContainText(`0 / ${ph.length}`);
  // the ずかん on this unit's: every one of them a card
  await phrases.click();
  await expect(sheet(page).locator('[data-kiki-zukan="tr-hotel"] [data-kiki-phrase]')).toHaveCount(ph.length);
});
