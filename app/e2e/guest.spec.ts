// The guest (docs/design.md "The guest", docs/backend.md#the-guest): a third person's phone, `?demo&as=G`, beside the
// members' `?demo` (A) and `?demo&as=B`; the demo's relay is the tabs' BroadcastChannel (sync/live-local.ts) and its
// record their shared localStorage, as two phones and a guest's have the relay and the record. The guest's phone shows
// the members' activity and ベル but never a からだ figure, and nothing of the economy or the members' goals (a buy, an
// erase, a goal); on the island it does what a member does (もようがえ, つうしん, the weather: 2026-11-06); its
// catches go into the shared ずかん under its own name; its tent pieces reach both members; and its villager is on the
// members' islands only while its app is open, moving only when it's moved.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, hudBells, openRewards } from './hud.ts';

const VIEW = { width: 393, height: 659 };
test.use({ viewport: VIEW });
const DATE = '2026-07-04T12:00';
type W = { who(w: string): [number, number] | null; state(): { villagers: Record<string, { walking: boolean }> } };
const who = (p: Page, w: string) => p.evaluate((w) => (window as unknown as { __world: W }).__world.who(w), w);
const walking = (p: Page, w: string) => p.evaluate((w) => (window as unknown as { __world: W }).__world.state().villagers[w]?.walking ?? null, w);

async function open(ctx: BrowserContext, as: 'A' | 'B' | 'G', more = '') {
  const page = await ctx.newPage();
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none${as === 'A' ? '' : `&as=${as}`}${more}`);
  await islandUp(page);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  return page;
}

test('the guest’s phone: the members’ activity and ベル, never a からだ figure, no ベル buy or goal; the island’s settings as a member’s', async ({ page }) => {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none&as=G`);
  await islandUp(page);
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
  // each card's goal, the shown person's: read-only (no chip to tap), no weight or body fat goal
  await expect(panel.locator('.mc[data-metric=move] header [data-goal]')).toHaveText(/^目標 [\d,]+\skcal\s以上$/);
  await expect(panel.locator('.mc span[data-goal]')).toHaveCount(4);
  await expect(panel.locator('button[data-goal], [data-goal=weight-goal], [data-goal=body_fat_pct-goal], [data-goal=bmi-goal], [data-goal=lean_kg-goal]')).toHaveCount(0);
  await whoSel.selectOption('B');
  await expect(panel.locator('.mc[data-metric=steps]')).toHaveAttribute('data-person', 'B');
  await expect(panel.locator('.mc span[data-goal]')).toHaveCount(4);
  await expect(panel.locator('button[data-goal]')).toHaveCount(0);
  await expect(panel).not.toContainText('体重');
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  // the ベル ledger, in ごほうび (the menu's ベル row): the goals are けんこう's, the ずかん the menu's
  await openRewards(page);
  await expect(panel.locator('[data-ledger] section.week').first()).toBeAttached();
  await expect(panel.locator('[data-tab], [data-zukan]')).toHaveCount(0);
  await expect(panel.locator('.goals, .pen-btn')).toHaveCount(0);
  for (const text of ['体重', '体脂肪率', 'kg', '%']) await expect(panel, text).not.toContainText(text);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  // せってい (the HUD menu's): the villager, the sound, the language, the weather, つうしん and もようがえ as a member's
  // (no つうち: gone for everyone)
  await fromMenu(page, 'settings');
  await expect(panel.locator('[data-guest-note]')).toBeVisible();
  await expect(panel.locator('[data-push="look"]')).toBeVisible();
  await expect(panel.locator('[data-decor-start]')).toBeVisible();
  await expect(panel.locator('#sec-sync')).toBeVisible();
  await expect(panel.locator('#sec-notify')).toHaveCount(0);
  await expect(panel.locator('#sec-lang')).toBeVisible();
  await expect(panel.locator('[data-wx-mode="game"]')).not.toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  // ごほうび, from the menu's ベル row (the shared balance): its balance and the buys, view-only (no shop, no erase)
  const row = hudBells(page);
  const bells = Number(await row.getAttribute('data-bells'));
  expect(bells).toBeGreaterThan(0);
  await expect(row.locator('.num')).toHaveText(bells.toLocaleString('en-US'));
  await openRewards(page);
  await expect(panel.locator('[data-guest-jar]')).toBeVisible();
  await expect.poll(async () => Number((await panel.locator('.hero .total').innerText()).replace(/\D/g, ''))).toBe(bells);
  await expect(panel.locator('[data-item]')).toHaveCount(0);
  await panel.locator('[data-hist-toggle]').click();
  await expect(panel.locator('[data-spend]').first()).toBeVisible();
  await expect(panel.locator('[data-spend] .x')).toHaveCount(0);
  await expect(panel.locator('.hero .today')).toBeVisible();
});

test('the guest’s ごほうび shows today’s ベル under the balance: the members’ jar’s (both of them, ふたりでぜんぶ in), as a member’s phone has it', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: VIEW });
  const at = '&date=2026-10-28T22:00&critter=none&visitor=none';
  const member = await ctx.newPage();
  await member.goto(`?demo${at}`);
  await islandUp(member);
  const today = Number(await hudBells(member).getAttribute('data-today'));
  expect(today).toBeGreaterThan(0);
  const g = await ctx.newPage();
  await g.goto(`?demo${at}&as=G`);
  await islandUp(g);
  await expect(hudBells(g)).toHaveAttribute('data-today', String(today));
  await expect(hudBells(g)).toHaveAttribute('aria-label', new RegExp(` · きょう ${today}\\sベル$`));
  await openRewards(g);
  const panel = g.locator('dialog[open]');
  await expect(panel.locator('[data-guest-jar]')).toBeVisible();
  await expect(panel.locator('.hero .today')).toHaveText(new RegExp(`^\\s*今日のベル\\s*\\+${today}\\s*ベル\\s*$`));
  await ctx.close();
});

test('a guest’s catch is in the members’ ずかん at once, credited to the guest', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a wait sized for the game at full speed (an animation, a spawn, a sync within its seconds); software GL slows the game itself' } }, async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: VIEW });
  const a = await open(ctx, 'A');
  const g = await ctx.newPage();
  await g.goto(`?demo&date=${DATE}&critter=common-butterfly&visitor=none&as=G`);
  await islandUp(g);
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
  await fromMenu(a, 'zukan');
  await expect(a.locator('[data-zukan="bug"]')).toContainText('1 / ', { timeout: 5000 });
  await a.locator('[data-zukan="bug"]').click();
  await expect(a.locator('[data-zukan-first="G"]')).toContainText('1');
  await a.locator('button.tile[data-entry="common-butterfly"]').click();
  const detail = a.locator('[data-zukan-detail="common-butterfly"]');
  await expect(detail).toContainText('7/4 おきゃくさんが見つけた');
  await expect(detail.locator('[data-zukan-person="G"]')).toContainText('おきゃくさん ×1', { timeout: 5000 });
  // and after a reload, as it was: the record's rows say who found it
  await a.reload();
  await islandUp(a);
  await fromMenu(a, 'zukan');
  await a.locator('[data-zukan="bug"]').click();
  await a.locator('button.tile[data-entry="common-butterfly"]').click();
  await expect(a.locator('[data-zukan-detail="common-butterfly"]')).toContainText('7/4 おきゃくさんが見つけた');
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
