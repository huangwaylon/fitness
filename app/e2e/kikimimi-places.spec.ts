// The ばしょ row of a lane's game (docs/kikimimi.md "Places"): every place can be tapped, none sunk, and since
// 2026-11-13 every game has content at every place, so none borrows (no 「準備中」 line: catalog.ts nearOf, its vitest,
// covers the borrowing); ことば タイル at ほし and はまべ deals that place's own sentences, the reveal's count of my words
// without a given one; しずえの ニュース and まるごと 聞く show the row. The logic tier (Playwright's Chromium is muted).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToPhase, runToSee } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });

const LEVELS = join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels');
const LISTEN = (JSON.parse(readFileSync(join(LEVELS, 'index.json'), 'utf8')) as { listen: Record<string, [string, number, string]> }).listen;
/** The clips of a stage's listened tile files, as this build ships them. */
const clipsAt = (stage: number) => new Set(Object.entries(LISTEN).filter(([, [gm, st, s]]) => gm === 'tile' && st === stage && s === 'listened')
  .flatMap(([u]) => (JSON.parse(readFileSync(join(LEVELS, 'parts', `${u}.json`), 'utf8')) as { listen: { items: { clip: string }[] } }).listen.items.map((it) => it.clip)));

type Kiki = { view(): { gm: string | null; lv: number }; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function toMode(p: Page, group: string, id: string) {
  await sheet(p).locator('[data-kiki-tile="asobu"]').click();
  await sheet(p).locator(`[data-kiki-group="${group}"] [data-kiki-mode-tile="${id}"]`).click();
  await expect(sheet(p).locator(`[data-kiki-mode-page="${id}"]`)).toBeVisible();
}
const place = (p: Page, id: string) => sheet(p).locator(`[data-kiki-places] [data-stage="${id}"]`);

async function open(p: Page, group: string, id: string) {
  await p.clock.install();
  await p.goto('?demo&date=2026-11-07T10:00&kikimimi=fast');
  await islandUp(p);
  await fromMenu(p, 'kikimimi');
  await atHub(p);
  await toMode(p, group, id);
}

const PLACE_IDS = ['hama', 'kawa', 'mori', 'yama', 'hoshi'];

for (const [group, id] of [['quick', 'tile'], ['long', 'news'], ['long', 'long']] as const) {
  test(`${id}: every place can be tapped, each its own (no 準備中 line)`, async ({ page }) => {
    await open(page, group, id);
    await expect(sheet(page).locator('[data-kiki-places] [data-stage]')).toHaveCount(5);
    await expect(sheet(page).locator('[data-kiki-places] [aria-disabled="true"]')).toHaveCount(0);
    for (const pl of PLACE_IDS) {
      await place(page, pl).click();
      await expect(place(page, pl)).toHaveAttribute('aria-checked', 'true');
      await expect(sheet(page).locator('[data-kiki-place-near]')).toHaveCount(0);
    }
  });
}

test('ほし deals ほし’s own sentences', async ({ page }) => {
  await open(page, 'quick', 'tile');
  await place(page, 'hoshi').click();
  await expect.poll(() => kiki(page, (k) => k.view().lv)).toBe(7);
  await sheet(page).locator('[data-kiki-start]').click();
  await runToSee(page, sheet(page).locator('[data-kiki-tile-pool]'));
  expect(await kiki(page, (k) => k.view().gm)).toBe('tile');
  const hoshi = clipsAt(5);
  expect((await kiki(page, (k) => k.items())).every((c) => hoshi.has(c))).toBe(true);
});

test('はまべ deals はまべ’s own sentences; the reveal counts my own slots only', async ({ page }) => {
  await open(page, 'quick', 'tile');
  await place(page, 'hama').click();
  await sheet(page).locator('[data-kiki-start]').click();
  await runToSee(page, sheet(page).locator('[data-kiki-tile-pool]'));
  const hama = clipsAt(1);
  expect((await kiki(page, (k) => k.items())).every((c) => hama.has(c))).toBe(true);
  // one tile placed, time up: the reveal counts my own slots (a given one not mine)
  const mine = await sheet(page).locator('button[data-slot]:not([data-given])').count();
  await sheet(page).locator('[data-tile]:not([data-used])').first().click();
  await runToPhase(page, 'reveal');
  await expect(sheet(page).locator('[data-kiki-tile-words]')).toHaveText(new RegExp(` / ${mine} 語$`));
});
