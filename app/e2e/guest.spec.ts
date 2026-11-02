// The guest (docs/design.md "The guest", docs/backend.md#the-guest): a third person's phone, `?demo&as=G`, beside the
// members' `?demo` (A) and `?demo&as=B`; the demo's relay is the tabs' BroadcastChannel (sync/live-local.ts) and its
// record their shared localStorage, as two phones and a guest's have the relay and the record. The guest's phone shows
// the members' activity and ベル but never a からだ figure, and nothing it may not do (a buy, an erase, a goal, the
// island's もようがえ, つうしん); its catches go into the shared ずかん under its own name; its tent pieces reach
// both members; and its villager is on the members' islands only while its app is open, moving only when it's moved.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const VIEW = { width: 393, height: 659 };
test.use({ viewport: VIEW });
const DATE = '2026-07-04T12:00';
const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
type W = { who(w: string): [number, number] | null; state(): { villagers: Record<string, { walking: boolean }> } };
const who = (p: Page, w: string) => p.evaluate((w) => (window as unknown as { __world: W }).__world.who(w), w);
const walking = (p: Page, w: string) => p.evaluate((w) => (window as unknown as { __world: W }).__world.state().villagers[w]?.walking ?? null, w);

async function open(ctx: BrowserContext, as: 'A' | 'B' | 'G', more = '') {
  const page = await ctx.newPage();
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none${as === 'A' ? '' : `&as=${as}`}${more}`);
  await expect(ribbon(page)).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  return page;
}

test('the guest’s phone: the members’ activity and ベル, never a からだ figure, and nothing only a member does', async ({ page }) => {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none&as=G`);
  await expect(ribbon(page)).toBeVisible();
  const panel = page.locator('dialog[open]');
  // けんこう (the dumbbell's popup): かつどう only (no からだ switch, no weight or body card), both members' activity
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  const whoSel = panel.locator('select[data-pick=who]');
  await expect(whoSel).toBeVisible();
  await expect(whoSel.locator('option')).toHaveText(['ウェイ', 'うめ']); // the two members, no guest option
  await expect(panel.locator('select[data-pick=period]')).toBeVisible();
  await expect(panel.locator('[data-group]')).toHaveCount(0);
  await expect(panel.locator('.card').first()).toBeVisible();
  for (const text of ['からだ', '体重', '体脂肪率', 'BMI', '除脂肪体重', 'kg']) await expect(panel, text).not.toContainText(text);
  await whoSel.selectOption('B');
  await expect(panel.locator('.mc[data-metric=steps]')).toHaveAttribute('data-person', 'B');
  await expect(panel).not.toContainText('体重');
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  // きろく: the ベル ledger and the goals, read-only (no ✎, no weight or body fat goal)
  await ribbon(page).click();
  await expect(panel.locator('.tab[data-tab=kiroku]')).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.locator('.goals')).toBeVisible();
  await expect(panel.locator('.goals .pen-btn')).toHaveCount(0);
  await expect(panel.locator('[data-focus="weight-goal"], [data-focus="fat-goal"]')).toHaveCount(0);
  for (const text of ['体重', '体脂肪率', 'kg', '%']) await expect(panel, text).not.toContainText(text);
  // せってい: the villager, the sound and the language; no もようがえ or つうしん (and no つうち: gone for everyone)
  await panel.locator('.tab[data-tab=settings]').click();
  await expect(panel.locator('[data-guest-note]')).toBeVisible();
  await expect(panel.locator('[data-push="villager"]')).toBeVisible();
  await expect(panel.locator('[data-decor-start]')).toHaveCount(0);
  await expect(panel.locator('#sec-notify, #sec-sync')).toHaveCount(0);
  await expect(panel.locator('#sec-lang')).toBeVisible();
  await page.keyboard.press('Escape');
  // ごほうび: the jar's balance and the buys, view-only (no shop, no erase)
  await ribbon(page).click();
  await panel.locator('.tab[data-tab=rewards]').click();
  await expect(panel.locator('[data-guest-jar]')).toBeVisible();
  await expect(panel.locator('.hero .total')).toBeVisible();
  await expect(panel.locator('[data-item]')).toHaveCount(0);
  await expect(panel.locator('[data-spend] .x')).toHaveCount(0);
});

test('a guest’s catch is in the members’ ずかん at once, credited to the guest', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: VIEW });
  const a = await open(ctx, 'A');
  const g = await ctx.newPage();
  await g.goto(`?demo&date=${DATE}&critter=common-butterfly&visitor=none&as=G`);
  await expect(ribbon(g)).toBeVisible();
  // the butterfly flown in: on screen, and over the island's ground rather than mid-way in from the edge
  const bfl = g.locator('[data-critter="common-butterfly"]');
  await expect.poll(async () => {
    const b = await bfl.boundingBox();
    return !!b && b.x > 20 && b.y > 80 && b.x + b.width < VIEW.width - 20 && b.y + b.height < VIEW.height - 80;
  }, { timeout: 8000, intervals: [100] }).toBe(true);
  const bf = (await bfl.boundingBox())!;
  await g.mouse.click(bf.x + bf.width / 2, bf.y + bf.height / 2);
  await expect(g.locator('[data-fx="catch"]')).toBeAttached();
  // A's ずかん: the butterfly, first found by the guest (おきゃくさん), its count under the guest's own name
  await a.bringToFront();
  await ribbon(a).click();
  await a.locator('dialog[open] .tab[data-tab=kiroku]').click();
  await expect(a.locator('[data-zukan="bug"]')).toContainText('1 / ', { timeout: 5000 });
  await a.locator('[data-zukan="bug"]').click();
  await expect(a.locator('[data-zukan-first="G"]')).toContainText('1');
  await a.locator('button.tile[data-entry="common-butterfly"]').click();
  const detail = a.locator('[data-zukan-detail="common-butterfly"]');
  await expect(detail).toContainText('7/4 おきゃくさんが 見つけた');
  await expect(detail.locator('[data-zukan-person="G"]')).toContainText('おきゃくさん ×1', { timeout: 5000 });
  // and after a reload, as it was: the record's rows say who found it
  await a.reload();
  await expect(ribbon(a)).toBeVisible();
  await ribbon(a).click();
  await a.locator('dialog[open] .tab[data-tab=kiroku]').click();
  await a.locator('[data-zukan="bug"]').click();
  await a.locator('button.tile[data-entry="common-butterfly"]').click();
  await expect(a.locator('[data-zukan-detail="common-butterfly"]')).toContainText('7/4 おきゃくさんが 見つけた');
  await ctx.close();
});

test('a piece the guest puts in the tent is in both members’ tents', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: VIEW });
  const tent = async (as: 'A' | 'B' | 'G') => {
    const p = await ctx.newPage();
    await p.goto(`tent?demo&date=${DATE}${as === 'A' ? '' : `&as=${as}`}`);
    await p.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
    return p;
  };
  type T = { px(x: number, z: number): [number, number]; pieces(): { item: string; who: string }[]; who(w: string): unknown };
  const pieces = (p: Page) => p.evaluate(() => (window as unknown as { __tent: T }).__tent.pieces().map((x) => `${x.item}:${x.who}`));
  const a = await tent('A');
  await a.evaluate(() => localStorage.removeItem('island-demo.tent'));
  const b = await tent('B');
  const g = await tent('G');
  await g.bringToFront();
  await g.locator('[data-tent-edit-open]').click();
  await g.locator('[data-tent-item="f4081"]').click();
  const [x, y] = await g.evaluate(() => (window as unknown as { __tent: T }).__tent.px(-20, -25));
  await g.mouse.click(x, y);
  await g.locator('[data-act="place"]').click();
  await expect.poll(() => pieces(g), { timeout: 4000 }).toEqual(['f4081:G']);
  for (const p of [a, b]) await expect.poll(() => pieces(p), { timeout: 5000 }).toEqual(['f4081:G']);
  // and the guest's villager is in there with them (each phone draws all three)
  for (const p of [a, b]) await expect.poll(() => p.evaluate(() => !!(window as unknown as { __tent: T }).__tent.who('G')), { timeout: 5000 }).toBe(true);
  await ctx.close();
});

test('the members see the guest’s villager while its app is open, never after; it stays put unless moved', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: VIEW });
  const a = await open(ctx, 'A');
  const b = await open(ctx, 'B');
  expect(await who(a, 'G')).toBeNull();
  expect(await who(b, 'G')).toBeNull();
  const g = await open(ctx, 'G');
  // it comes ashore and walks up to its spot by the campsite: on both members' islands
  for (const p of [a, b]) await expect.poll(() => who(p, 'G'), { timeout: 6000 }).not.toBeNull();
  await expect.poll(() => walking(g, 'G'), { timeout: 20_000 }).toBe(false);
  for (const p of [a, b]) await expect.poll(() => walking(p, 'G'), { timeout: 6000 }).toBe(false);
  const there = await who(g, 'G');
  for (const p of [a, b]) await expect.poll(async () => {
    const at = await who(p, 'G');
    return at && there ? Math.hypot(at[0] - there[0], at[1] - there[1]) : 999;
  }, { timeout: 4000 }).toBeLessThan(2);
  // idle: nobody's life moves it, on its own phone or theirs (a fixed wait: proving that nothing happens, two of ambient
  // life's 10 s slots)
  await g.waitForTimeout(11_000);
  for (const p of [g, a, b]) {
    const at = await who(p, 'G');
    expect(at && there ? Math.hypot(at[0] - there[0], at[1] - there[1]) : 999).toBeLessThan(2);
  }
  // the guest closes its app: gone from both islands
  await g.close();
  for (const p of [a, b]) await expect.poll(() => who(p, 'G'), { timeout: 15_000 }).toBeNull();
  await ctx.close();
});
