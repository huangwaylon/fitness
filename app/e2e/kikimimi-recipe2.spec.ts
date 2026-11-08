// Recipe 2 (docs/curriculum-units.md §16; docs/curriculum-wave2.md §3.1, W2-9): a fixture unit on recipe 2 (put in
// through the dev hook with its kinds' files, never shipped). Its チェック, its call's file `listened` (s2-call-a, as
// shipped), is the call on the phone with its memo (2 rounds) then 4 of its quiz items: all right, the stamp, my row a
// lesson's with the call's rounds in it, the call's rows in the review with its transcript. With its call in a file
// served as a draft (s2-call-c, listened since A4, set back to draft in the served index) the チェック is recipe 1's, its
// 6 quiz items. Its おと plays ことば タイル
// on the derived tiles (s2-tile-bank, listened in the build). The logic tier (the voiced call plays its length,
// silent: Playwright's Chromium is muted).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { openStage, runToQuestion, runToSee } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';

const parts = join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels', 'parts');
/** s2-call-a as compiled: each memo row's right chip, by call. */
const CALLS = JSON.parse(readFileSync(join(parts, 's2-call-a.json'), 'utf8')) as { listen: { items: { id: string; memo: { slots: { options: string[]; answer: number }[] }[] }[] } };
const RIGHT = new Map(CALLS.listen.items.map((it) => [it.id, it.memo.flatMap((m) => m.slots).map((s) => s.options[s.answer])]));
/** s2-tile-bank as compiled: each sentence's words by the clip it plays. */
const TILES = JSON.parse(readFileSync(join(parts, 's2-tile-bank.json'), 'utf8')) as { listen: { items: { id: string; clip: string; tiles: string[] }[] } };
const WORDS = new Map(TILES.listen.items.map((it) => [it.clip, it.tiles]));

type Kiki = {
  view(): { phase: string; i: number; gm: string | null };
  right(): number;
  items(): string[];
  unit(unit: unknown, ids: string[], cv?: string, kinds?: unknown): Promise<void>;
  recorded(): { gm?: string; u?: string; l?: number; r: [string, number, number, number][] } | null;
};
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');

const CALL = 'call-hotel-extra-night';
const LESSONS = {
  deai: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'r4-overbooked', 'ml-m-quieter-room', 'r4-anything-else'],
  bamen: ['ml-r-incidentals', 'm4-not-ideal', 'r4-triage', 'm4-see-what', 'w4-cant-uk', 'r4-reschedule'],
  check: ['ml-n-room', 'ml-n-late-checkout', 'r4-leak', 'm4-easy', 'n4-reference', 'w4-youll-need'],
  oto: ['w4-shouldve', 'w4-wouldnt-have', 'w4-wanna', 'w4-gotta', 'w4-didja', 'w4-them']
};
/** A call in a file served as a draft (wave 2's s2-call-c): its チェック falls back to recipe 1. */
const DRAFT = { call: 'call-wedding-weekend', file: 's2-call-c' };
/** The built index with s2-call-c a draft again (the fixture: it ships listened since A4): the chunk that holds the
 *  index (build-pages/, as served), its line set back as it's served. */
const LINE = /("s2-call-c":\[[`"']call[`"'],3,[`"'])listened/g;
const CHUNKS = join(import.meta.dirname, '..', 'build-pages', '_app', 'immutable', 'chunks');
/** (read when a test runs: `playwright test --list` loads this file before any build exists) */
const indexChunk = () => readdirSync(CHUNKS).find((f) => f.endsWith('.js') && /"s2-call-c":\[[`"']call/.test(readFileSync(join(CHUNKS, f), 'utf8')));
async function asDraft(ctx: BrowserContext) {
  const INDEX_CHUNK = indexChunk();
  expect(INDEX_CHUNK, 'the built index').toBeTruthy();
  await ctx.route(`**/_app/immutable/chunks/${INDEX_CHUNK}`, async (route) => {
    const res = await route.fetch();
    const headers = Object.fromEntries(Object.entries(res.headers()).filter(([k]) => k !== 'content-encoding' && k !== 'content-length'));
    await route.fulfill({ status: res.status(), headers, body: (await res.text()).replace(LINE, '$1draft') });
  });
}
const TILE_IDS = ['tile-m4-be-good', 'tile-m4-put-through', 'tile-w4-shouldve', 'tile-w4-wouldnt-have', 'tile-w4-wanna', 'tile-w4-gotta'];
/** A recipe-2 unit as its chunk holds it (compile.ts unitChunk), over the bank's level-4 items, its チェック on `call`. */
const unitOf = (call: string) => ({
  id: 'tr-recipe', name: 'ホテルで こまった', stage: 'mori', domain: 'tabi', host: 'diana', scene: 'lobby', sound: 'self-repair', status: 'draft',
  cando: { ja: 'ホテルの スタッフが へやの もんだいへの たいおうを せつめいするのを ロビーの ざつおんの なかで きいて、できる ことと ついかの りょうきんが わかる', short: 'ホテルの もんだいを ききとれる', en: 'I can follow hotel staff…' },
  lessons: { v: 2, ...LESSONS, tiles: TILE_IDS, call: [call] }, home: Object.values(LESSONS).flat(),
  ph: [{ id: 'ph-tr-room', en: 'the room is ready', register: 'service', scene: 'hotel desk', trap: 'ready = もう はいれる', in: ['r4-room-ready'] }]
});

/** The hub, the fixture put in (its チェック on `call` in `file`), its unit page from しまの みち. */
async function toUnit(page: Page, { call, file } = { call: CALL, file: 's2-call-a' }) {
  /** its recipe-2 lessons' files (the index's units[<id>].kinds) */
  const files = { oto: ['s2-tile-bank'], check: [file] };
  await page.goto(`?demo&${Q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await page.evaluate(([u, ids, kinds]) => (window as unknown as { __kiki: Kiki }).__kiki.unit(u, ids as string[], undefined, kinds), [unitOf(call), Object.values(LESSONS).flat(), files] as const);
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
  await sheet(page).locator('[data-kiki-path-open]').click();
  await openStage(page, 'mori');
  await sheet(page).locator('[data-kiki-stop="tr-recipe"] [data-kiki-stop-open]').click();
  await expect(sheet(page).locator('[data-kiki-unit-page="tr-recipe"]')).toBeVisible();
}
/** とばして チェック, started. */
async function startCheck(page: Page) {
  await sheet(page).locator('[data-kiki-skip-check]').click();
  await expect(sheet(page).locator('[data-kiki-intro="check"] [data-kiki-mission]')).toBeVisible();
  await sheet(page).locator('[data-kiki-lesson-start]').click();
}
/** The memo's rows filled with their right chips, sent once the call allows. */
async function memo(p: Page) {
  await runToSee(p, sheet(p).locator('[data-kiki-memo] [data-own]'));
  const right = RIGHT.get(CALL)!, rows = sheet(p).locator('[data-kiki-memo] [data-own]');
  for (let j = 0; j < (await rows.count()); j++) {
    const row = rows.nth(j), want = right[Number(await row.getAttribute('data-n'))];
    const texts = await row.locator('[data-chip]').evaluateAll((bs) => bs.map((b) => b.textContent!.trim()));
    const chip = row.locator(`[data-chip="${texts.indexOf(want)}"]`);
    if ((await chip.getAttribute('aria-pressed')) !== 'true') await chip.click();
  }
  // (once the call has ended)
  await runToSee(p, sheet(p).locator('[data-kiki-call-done][aria-disabled="false"]'));
  await sheet(p).locator('[data-kiki-call-done]').click();
  await expect(sheet(p)).toHaveAttribute('data-phase', 'reveal');
  await expect(sheet(p).locator('[data-kiki-verdict="right"]')).toBeVisible();
}

test('recipe 2’s チェック, its call listened: the call and its memo, then 4 quiz items; the stamp, my row, the review', async ({ page }) => {
  await page.clock.install(); // (the call plays its voiced length: stepped through, kikimimi-nav.ts runUntil)
  await toUnit(page);
  await startCheck(page);
  const items = await kiki(page, (k) => k.items());
  expect(items.slice(0, 2)).toEqual([CALL, `${CALL}-memo`]);
  expect(items).toHaveLength(6);
  for (const id of items.slice(2)) expect(LESSONS.check).toContain(id);

  // the call on the phone (the lesson's game, the call's page), its memo; round 2 from memory
  await runToSee(page, sheet(page).locator('[data-kiki-frame="phone"]'));
  await memo(page);
  await sheet(page).locator('[data-kiki-next]').click();
  await runToQuestion(page, 1);
  await expect(sheet(page).locator('[data-kiki-call-ended="1"]')).toBeVisible();
  await memo(page);
  await sheet(page).locator('[data-kiki-next]').click();
  // then the quiz's page for its 4 items
  for (let i = 2; i < 6; i++) {
    await runToQuestion(page, i, 'answer');
    await sheet(page).locator(`[data-choice="${await kiki(page, (k) => k.right())}"]`).click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');

  // the stamp (6 of 6 on the first listen), my row a lesson's with the call's two rounds in it
  const strip = sheet(page).locator('[data-kiki-lesson-result="check"]');
  await expect(strip).toHaveAttribute('data-kiki-stamped', '1');
  await expect(strip.locator('[data-kiki-tally-mine]')).toHaveAttribute('data-kiki-tally-mine', '6');
  const rec = await kiki(page, (k) => k.recorded());
  expect(rec).toMatchObject({ u: 'tr-recipe', l: 3 });
  expect(rec!.gm).toBeUndefined();
  expect(rec!.r.map((x) => x[0]).slice(0, 2)).toEqual([CALL, CALL]);
  expect(rec!.r.map((x) => x[1])).toEqual([1, 1, 1, 1, 1, 1]);
  // the review: the call's two rounds, the first opened on its transcript
  await expect(sheet(page).locator('[data-kiki-card="call"]')).toHaveCount(2);
  await sheet(page).locator('[data-kiki-card="call"] [data-kiki-row="0"]').click();
  await expect(sheet(page).locator(`[data-kiki-call-log="${CALL}"]`)).toBeVisible();
});

test('recipe 2 falls back to recipe 1 while the call is a draft; its おと plays the listened tiles', async ({ page, context }) => {
  await page.clock.install(); // (the plays stepped through)
  await asDraft(context);
  await toUnit(page, DRAFT);
  await startCheck(page);
  expect([...(await kiki(page, (k) => k.items()))].sort()).toEqual([...LESSONS.check].sort());

  // おと: from the unit page again (a fresh load), its extra lesson, ことば タイル on the derived tiles
  await toUnit(page);
  await sheet(page).locator('[data-kiki-unit-lesson="oto"]').click();
  await sheet(page).locator('[data-kiki-lesson-start]').click();
  const items = await kiki(page, (k) => k.items());
  expect(items).toHaveLength(6);
  for (const id of items) expect(WORDS.has(id)).toBe(true);
  // round 1 on the tiles' page: the sentence built from the board, できた, right
  await runToSee(page, sheet(page).locator('[data-kiki-tile-pool]'));
  const words = WORDS.get(items[0])!;
  const open = await sheet(page).locator('button[data-slot]').evaluateAll((bs) => bs.filter((b) => !b.hasAttribute('data-filled')).map((b) => Number(b.getAttribute('data-slot'))));
  for (const j of open) await sheet(page).locator(`[data-tile][data-word="${words[j].replace(/"/g, '\\"')}"]:not([data-used])`).first().click();
  await sheet(page).locator('[data-kiki-tile-done]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
});
