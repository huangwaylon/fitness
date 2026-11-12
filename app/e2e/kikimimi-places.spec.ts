// The ばしょ row of a lane's game (docs/kikimimi.md "Places"): every place can be tapped, none sunk; a place with no
// content of its own plays the nearest place's, one line saying whose and harder or easier (catalog.ts nearOf), the
// wire keeping the picked level. ことば タイル (かわ もり やま): ほし plays やま's made harder, はまべ かわ's made easier (my
// first slot placed for me, the reveal's count of my words without it); しずえの ニュース shows the row (やま only); まるごと 聞く at はまべ lists ほし's pieces. The
// logic tier (Playwright's Chromium is muted).
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

test('every place can be tapped; ほし with no content plays やま’s made harder, and says so', async ({ page }) => {
  await open(page, 'quick', 'tile');
  await expect(sheet(page).locator('[data-kiki-places] [aria-disabled="true"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-place-near]')).toHaveCount(0);
  await place(page, 'hoshi').click();
  await expect(place(page, 'hoshi')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-kiki-place-near="yama"]')).toHaveText('ほしの問題は準備中です。やまの問題を難しめに出します。');
  await expect(sheet(page).locator('[data-kiki-omakase-hint]')).toHaveCount(0);
  await expect.poll(() => kiki(page, (k) => k.view().lv)).toBe(7);
  await sheet(page).locator('[data-kiki-start]').click();
  await runToSee(page, sheet(page).locator('[data-kiki-tile-pool]'));
  expect(await kiki(page, (k) => k.view().gm)).toBe('tile');
  const yama = clipsAt(4);
  expect((await kiki(page, (k) => k.items())).every((c) => yama.has(c))).toBe(true);
  await expect(sheet(page).locator('[data-slot][data-given]')).toHaveCount(0);
});

test('はまべ with no content plays かわ’s made easier: my first slot placed for me, not counted as mine', async ({ page }) => {
  await open(page, 'quick', 'tile');
  await place(page, 'hama').click();
  await expect(sheet(page).locator('[data-kiki-place-near="kawa"]')).toHaveText('はまべの問題は準備中です。かわの問題をやさしめに出します。');
  await sheet(page).locator('[data-kiki-start]').click();
  await runToSee(page, sheet(page).locator('[data-kiki-tile-pool]'));
  const kawa = clipsAt(2);
  expect((await kiki(page, (k) => k.items())).every((c) => kawa.has(c))).toBe(true);
  await expect(sheet(page).locator('[data-slot][data-given]')).toHaveCount(1);
  // one tile placed, time up: the reveal counts my own slots only
  const mine = await sheet(page).locator('button[data-slot]').count();
  await sheet(page).locator('[data-tile]:not([data-used])').first().click();
  await runToPhase(page, 'reveal');
  await expect(sheet(page).locator('[data-kiki-tile-words]')).toHaveText(new RegExp(` / ${mine} 語$`));
});

test('しずえの ニュース has the row (やま’s, もり easier)', async ({ page }) => {
  await open(page, 'long', 'news');
  await expect(sheet(page).locator('[data-kiki-places] [data-stage]')).toHaveCount(5);
  await expect(place(page, 'yama')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-kiki-place-near]')).toHaveCount(0);
  await place(page, 'mori').click();
  await expect(sheet(page).locator('[data-kiki-place-near="yama"]')).toHaveText('もりの問題は準備中です。やまの問題をやさしめに出します。');
});

test('まるごと 聞く at はまべ lists ほし’s pieces, made easier', async ({ page }) => {
  await open(page, 'long', 'long');
  await place(page, 'hama').click();
  await expect(sheet(page).locator('[data-kiki-place-near="hoshi"]')).toHaveText('はまべの問題は準備中です。ほしの問題をやさしめに出します。');
  await expect(sheet(page).locator('[data-kiki-long-pieces] [data-kiki-long-piece]').first()).toBeVisible();
});
