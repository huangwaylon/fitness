// ききみみ's units, U2-U3 (docs/curriculum-units.md §3, §4, §10): the lobby's test entry (`?units`, before しまの みち)
// lists a fixture unit put in through the dev hook (the bank's items, never shipped: wave 1 is written in parallel),
// its チェック opens on the "phone errand" mission card, is played solo (6 questions, all right on the first listen),
// and its row carries the unit and the lesson; the results give the stamp with my own tally, and the list shows the
// stamp and the dot afterwards. The logic tier (no clip has to sound).
import { expect, test, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast&units';

type Kiki = {
  view(): { phase: string; i: number; n: number };
  right(): number;
  items(): string[];
  unit(unit: unknown, ids: string[]): Promise<void>;
  lesson(): { u: string; lesson: string } | null;
  recorded(): { u?: string; l?: number; tm?: number; lv: number; r: unknown[] } | null;
};
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');

const LESSONS = {
  deai: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'r4-overbooked', 'ml-m-quieter-room', 'r4-anything-else'],
  bamen: ['ml-r-incidentals', 'm4-not-ideal', 'r4-triage', 'm4-see-what', 'w4-cant-uk', 'r4-reschedule'],
  check: ['ml-n-room', 'ml-n-late-checkout', 'r4-leak', 'm4-easy', 'n4-reference', 'w4-youll-need']
};
/** A unit as its chunk holds it (compile.ts unitChunk), over the bank's level-4 items. */
const UNIT = {
  id: 'tr-testinn', name: 'ホテルで こまった', stage: 'mori', domain: 'tabi', host: 'diana', scene: 'lobby', sound: 'self-repair', status: 'draft',
  cando: { ja: 'ホテルの スタッフが へやの もんだいへの たいおうを せつめいするのを ロビーの ざつおんの なかで きいて、できる ことと ついかの りょうきんが わかる', en: 'I can follow hotel staff…' },
  lessons: { v: 1, ...LESSONS }, home: Object.values(LESSONS).flat(), ph: [{ id: 'ph-ti-room', en: 'room', register: 'service', scene: 'hotel desk', trap: '-', in: ['r4-room-ready'] }]
};

test('a unit’s チェック played solo from the lobby’s test list: the mission card, 6 questions, the stamp from its row', async ({ page }) => {
  test.slow();
  await page.goto(`?demo&${Q}`);
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await page.evaluate(([u, ids]) => (window as unknown as { __kiki: Kiki }).__kiki.unit(u, ids as string[]), [UNIT, Object.values(LESSONS).flat()] as const);
  const row = sheet(page).locator('[data-kiki-unit="tr-testinn"]');
  await expect(row).toBeVisible();
  await expect(row.locator('[data-dot]')).toHaveCount(3);
  await expect(row).not.toHaveAttribute('data-stamped', '1');

  // the チェック: the phone errand's mission card, then its 6 questions (held out of であい and ばめん)
  await row.locator('[data-kiki-lesson="check"]').click();
  const intro = sheet(page).locator('[data-kiki-intro="check"]');
  await expect(intro).toBeVisible();
  await expect(intro.locator('[data-kiki-mission]')).toContainText('でんわ');
  await sheet(page).locator('[data-kiki-lesson-start]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  const items = await kiki(page, (k) => k.items());
  expect(items).toHaveLength(6);
  expect([...items].sort()).toEqual([...LESSONS.check].sort());
  for (let i = 0; i < 6; i++) {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 15_000 }).toBe(i);
    await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 15_000 });
    const right = await kiki(page, (k) => k.right());
    await sheet(page).locator(`[data-choice="${right}"]`).click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');

  // the row: the unit and the lesson (l 3), the stage's level, solo (no tm); the stamp and my own tally
  const rec = await kiki(page, (k) => k.recorded());
  expect(rec).toMatchObject({ u: 'tr-testinn', l: 3, lv: 4 });
  expect(rec!.tm).toBeUndefined();
  expect(rec!.r).toHaveLength(6);
  const strip = sheet(page).locator('[data-kiki-lesson-result="check"]');
  await expect(strip).toHaveAttribute('data-kiki-stamped', '1');
  await expect(strip.locator('[data-kiki-stamp-got]')).toBeVisible();
  await expect(strip.locator('[data-kiki-tally-mine]')).toHaveAttribute('data-kiki-tally-mine', '6');

  // done, and back: the list has the stamp and the チェック's dot (from the rows, never stored)
  await sheet(page).locator('[data-kiki-done]').click();
  await expect(sheet(page)).toHaveCount(0);
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await expect(row).toHaveAttribute('data-stamped', '1');
  await expect(row.locator('[data-dot="check"]')).toHaveClass(/done/);
  await expect(row.locator('[data-kiki-tally-mine]')).toHaveAttribute('data-kiki-tally-mine', '6');
});

test('a lesson’s intro card: its name, the can-do, back to the lobby; its reveal folds the note under くわしく', async ({ page }) => {
  test.slow();
  await page.goto(`?demo&${Q}`);
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await page.evaluate(([u, ids]) => (window as unknown as { __kiki: Kiki }).__kiki.unit(u, ids as string[]), [UNIT, Object.values(LESSONS).flat()] as const);
  const row = sheet(page).locator('[data-kiki-unit="tr-testinn"]');
  await row.locator('[data-kiki-lesson="deai"]').click();
  const intro = sheet(page).locator('[data-kiki-intro="deai"]');
  await expect(intro).toContainText('であい');
  await expect(intro).toContainText('わかる');
  await expect(intro.locator('[data-kiki-mission]')).toHaveCount(0);
  await sheet(page).locator('[data-kiki-lesson-back]').click();
  await expect(sheet(page).locator('[data-kiki-lobby]')).toBeVisible();
  await row.locator('[data-kiki-lesson="deai"]').click();
  await sheet(page).locator('[data-kiki-lesson-start]').click();
  // であい opens on its model dialogue (a gist): its transcript folded under くわしく at the reveal
  // (the dialogue's lines play out at their length first)
  await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 45_000 });
  expect((await kiki(page, (k) => k.items()))[0]).toBe('d4-hotel-suite');
  await sheet(page).locator(`[data-choice="${await kiki(page, (k) => k.right())}"]`).click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  const more = sheet(page).locator('details[data-kiki-more]');
  await expect(more.first()).toBeVisible();
  await expect(more.first()).not.toHaveAttribute('open', '');
  await more.first().locator('summary').click();
  await expect(more.first()).toHaveAttribute('open', '');
});
