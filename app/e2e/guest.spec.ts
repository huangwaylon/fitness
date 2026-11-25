// The guest (docs/design.md "The guest", docs/backend.md#the-guest): a third person's phone, `?demo&as=G`, beside the
// members' `?demo` (A) and `?demo&as=B`; the demo's relay is the tabs' BroadcastChannel (sync/live-local.ts) and its
// record their shared localStorage, as two phones and a guest's have the relay and the record. The guest's phone is a
// member's (2026-11-24) but never a からだ figure; its own wallet is 0 (no Health data), so no reward is in reach; it sees the members'
// goals read-only (each sets only their own), and on the island does what a member does (the editor, the weather); its
// catches go into the shared ずかん under its own name; its tent pieces reach both members; and its villager is always
// on the members' islands, asleep while its app is closed (as everyone's: presence-sleep.spec).
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { roomUp } from './rooms.ts';
import { islandUp } from './island.ts';
import { fromMenu, hudBells, openKenkou, openRewards, unfoldMenu } from './hud.ts';

const VIEW = { width: 393, height: 659 };
test.use({ viewport: VIEW });
const DATE = '2026-07-04T12:00';
type W = { who(w: string): [number, number] | null; state(): { villagers: Record<string, { walking: boolean; asleep: boolean }> } };
const who = (p: Page, w: string) => p.evaluate((w) => (window as unknown as { __world: W }).__world.who(w), w);
const asleep = (p: Page, w: string) => p.evaluate((w) => (window as unknown as { __world: W }).__world.state().villagers[w]?.asleep ?? null, w);

async function open(ctx: BrowserContext, as: 'A' | 'B' | 'G', more = '') {
  const page = await ctx.newPage();
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none${as === 'A' ? '' : `&as=${as}`}${more}`);
  await islandUp(page);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  return page;
}

test('the guest’s phone: the members’ activity, their goals (read-only) and ベル, never a からだ figure, its own wallet 0; the island’s settings as a member’s', async ({ page }) => {
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
  // each card's goal, the shown person's: read-only (each sets only their own: no chip to tap), no weight or body fat goal
  await expect(panel.locator('.mc[data-metric=move] header [data-goal]')).toHaveText(/^目標 [\d,]+\skcal\s以上$/);
  await expect(panel.locator('.mc span[data-goal]')).toHaveCount(4);
  await expect(panel.locator('button[data-goal]')).toHaveCount(0);
  await expect(panel.locator('[data-goal=weight-goal], [data-goal=body_fat_pct-goal], [data-goal=bmi-goal], [data-goal=lean_kg-goal]')).toHaveCount(0);
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
  // 設定 (the HUD menu's): the villager, the sound, the language and the weather as a member's (no つうち, no
  // 模様替え: gone for everyone)
  await fromMenu(page, 'settings');
  await expect(panel.locator('[data-push="look"]')).toBeVisible();
  await expect(panel.locator('#sec-notify')).toHaveCount(0);
  await expect(panel.locator('#sec-lang')).toBeVisible();
  await expect(panel.locator('[data-wx-mode="game"]')).not.toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  // the menu's ベル row: its own wallet, as a member's row is theirs: 0 (the user, 2026-11-25); ごほうび, from it: the
  // members' balances and the buys, as a member's; the rewards out of reach, a buy erasable as by anyone
  await unfoldMenu(page);
  const row = hudBells(page);
  await expect(row).toHaveAttribute('data-bells', '0');
  await expect(row).toHaveAttribute('data-today', '0');
  await openRewards(page);
  const purses = panel.locator('.hero .purse');
  await expect(purses).toHaveCount(2);
  await expect.poll(async () => (await purses.evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.balance)))).every((b) => b > 0)).toBe(true);
  await expect(panel.locator('[data-item]')).toHaveCount(2);
  for (const item of await panel.locator('[data-item]').all()) await expect(item).toHaveAttribute('aria-disabled', 'true');
  await panel.locator('[data-hist-toggle]').click();
  await expect(panel.locator('[data-spend]').first()).toBeVisible();
  await expect(panel.locator('[data-spend] .x').first()).toBeVisible();
  await expect(panel.locator('.hero .purse:first-child .today')).toBeVisible();
});

// The guest's 健康 and ごはん leave no hole (health plan C7): no かつどう / からだ to pick, so the period sits at the
// range row's end (no row of its own); in the title bar its pill is its avatar alone (every name's is), the page switch
// centred.
// Everyone's island opens at the front, the guest's too (the user, 2026-11-25: the guest's phone as a member's).
test('the guest’s island opens at the front, as a member’s', async ({ page }) => {
  type Wd = { cam(): number; stops(): [number, number] };
  const view = () => page.evaluate(() => {
    const w = (window as unknown as { __world: Wd }).__world;
    return { cam: w.cam(), front: w.stops()[0] };
  });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`?demo&date=${DATE}&visitor=none&as=G`);
  await islandUp(page);
  const g = await view();
  expect(g.cam).toBe(g.front);
});

// The guest's phone shows what a member's does (the user, 2026-11-25): the same menu tiles, the same 設定 sections, the
// same けんこう tabs; the one thing it lacks is からだ (no switch, no body card).
test('the guest sees a member’s HUD and menus, but for からだ', async ({ browser }) => {
  const seen = async (as: 'A' | 'G') => {
    const ctx = await browser.newContext({ viewport: VIEW });
    const page = await open(ctx, as);
    await unfoldMenu(page);
    const pills = await page.locator('[data-menu-tile]').evaluateAll((bs) => bs.map((b) => b.getAttribute('data-menu-tile')));
    const hud = await page.locator('.ribbon-wrap button:visible').evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-label') === null ? b.className.split(' ')[0] : b.getAttribute('aria-label')).filter((l) => !/ベル/.test(l ?? '')));
    await fromMenu(page, 'settings');
    const sections = await page.locator('dialog[open] [data-settings] h3').allTextContents();
    await page.keyboard.press('Escape');
    await openKenkou(page, 'health');
    const tabs = await page.locator('dialog[open] [data-kenkou-tab]').allTextContents();
    const body = await page.locator('dialog[open] [data-group]').count();
    await ctx.close();
    return { pills, hud, sections, tabs, body };
  };
  const a = await seen('A'), g = await seen('G');
  expect(g.pills).toEqual(a.pills);
  expect(g.hud).toEqual(a.hud);
  expect(g.sections).toEqual(a.sections);
  expect(g.tabs).toEqual(a.tabs);
  // からだ: the member's かつどう | からだ switch, none on the guest's
  expect(a.body).toBeGreaterThan(0);
  expect(g.body).toBe(0);
});

// The Sunday harvest's recap on the guest's phone as on a member's: its 受け取る its own (the week closes with both
// members'), the end card its own empty wallet.
test('the guest’s harvest recap: the week’s tally, 受け取る, back to the island', async ({ page }) => {
  await page.goto(`?demo=harvest&date=${DATE}&critter=none&visitor=none&as=G`);
  const tally = page.locator('.overlay .tally');
  await expect(tally.locator('.trow:not(.duo)')).toHaveCount(2);
  await page.getByRole('button', { name: '受け取る！' }).tap();
  await expect(page.locator('.overlay .card.done')).toBeVisible();
  await page.getByRole('button', { name: '島へ戻る' }).tap();
  await expect(page.locator('.overlay')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '受け取る！' })).toHaveCount(0);
});

test('the guest’s 健康: the period on the range row; ごはん: its pill the avatar alone, the switch centred', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none&as=G`);
  await expect(page.getByRole('button', { name: 'けんこう', exact: true })).toBeVisible({ timeout: 15_000 });
  await openKenkou(page, 'health');
  const h = page.locator('dialog[open] [data-health-sheet]');
  await expect(h.locator('.nav [data-pick=period]')).toBeVisible();
  await expect(h.locator('.sel')).toHaveCount(0);
  await page.locator('dialog[open] [data-kenkou-tab=food]').click();
  const pill = page.locator('dialog[open] .titlebar .dd.who');
  await expect(pill).toHaveClass(/\bonly\b/);
  expect((await pill.boundingBox())!.width).toBeLessThanOrEqual(72);
  const t = (await page.locator('dialog[open] .titlebar nav').boundingBox())!;
  expect(Math.abs(t.x + t.width / 2 - 393 / 2)).toBeLessThan(3);
  await expect(pill.locator('select option:checked')).toHaveText('ゲスト'); // (its name in the picker)
});

test('the guest’s ベル row its own, empty; its ごほうび each member’s today as a member’s phone has it', async ({ browser }) => {
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
  await openRewards(g);
  const panel = g.locator('dialog[open]');
  await expect(panel.locator('.hero .purse:first-child .today')).toHaveText(new RegExp(`^\\s*今日\\s*\\+${today}\\s*ベル\\s*$`));
  const both = (await panel.locator('.hero .purse .today').evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.today)))).reduce((a, b) => a + b, 0);
  expect(both).toBeGreaterThan(today);
  await g.keyboard.press('Escape');
  await expect(hudBells(g)).toHaveAttribute('data-today', '0');
  await ctx.close();
});

test('a guest’s catch is in the members’ ずかん at once, credited to the guest', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a wait sized for the game at full speed (an animation, a spawn, a sync within its seconds); software GL slows the game itself' } }, async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: VIEW });
  const a = await open(ctx, 'A');
  const g = await ctx.newPage();
  await g.goto(`?demo&date=${DATE}&critter=common-butterfly&visitor=none&as=G`);
  await islandUp(g);
  // the butterfly landed on a flower (still there: a flying one is somewhere else by the time a tap lands), tapped
  // where its 3D model is (taps go by the model's spot, not the sprite's box), in one step in the page
  // (each try reports what it saw, the last one the failure's message: the butterfly's critter rows (sat or flying),
  // the model point tapped and what takes a tap there at that moment (an overlay's claim, the island's pick, the
  // element on top), so a miss reads as never sat, no model point, or a tap that went to something else)
  await expect(async () => {
    const t = await g.evaluate(() => {
      type W3 = { modelAt(id: string, lift?: number): [number, number] | null; critters(): { id: string; sat: boolean }[]; claim(x: number, y: number): unknown; pick(x: number, y: number): unknown };
      const w = (window as unknown as { __world3d: W3 }).__world3d;
      const critters = w.critters().filter((c) => c.id === 'common-butterfly');
      let at: [number, number] | null = null;
      if (critters.some((c) => c.sat)) for (let n = 0; n < 60 && !at; n++) at = w.modelAt(`bug-${n}`);
      const el = at && document.elementFromPoint(at[0], at[1]);
      return { critters, at, claim: at && w.claim(at[0], at[1]), pick: at && w.pick(at[0], at[1]), el: el ? `${el.tagName.toLowerCase()}.${el.className}` : null };
    });
    if (t.at) await g.mouse.click(t.at[0], t.at[1]);
    expect(await g.locator('[data-fx="catch"]').count(), `the butterfly netted: ${JSON.stringify(t)}`).toBeGreaterThan(0);
  }).toPass({ timeout: 20_000 });
  // A's ずかん: the butterfly, first found by the guest (ゲスト), its count under the guest's own name
  await a.bringToFront();
  await fromMenu(a, 'zukan');
  await expect(a.locator('[data-zukan="bug"]')).toContainText('1 / ', { timeout: 5000 });
  await a.locator('[data-zukan="bug"]').click();
  await expect(a.locator('[data-zukan-first="G"]')).toContainText('1');
  await a.locator('button.tile[data-entry="common-butterfly"]').click();
  const detail = a.locator('[data-zukan-detail="common-butterfly"]');
  await expect(detail).toContainText('7/4 ゲストが見つけた');
  await expect(detail.locator('[data-zukan-person="G"]')).toContainText('ゲスト ×1', { timeout: 5000 });
  // and after a reload, as it was: the record's rows say who found it
  await a.reload();
  await islandUp(a);
  await fromMenu(a, 'zukan');
  await a.locator('[data-zukan="bug"]').click();
  await a.locator('button.tile[data-entry="common-butterfly"]').click();
  await expect(a.locator('[data-zukan-detail="common-butterfly"]')).toContainText('7/4 ゲストが見つけた');
  await ctx.close();
});

test('a piece the guest puts in the tent is in both members’ tents', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: VIEW });
  const tent = async (as: 'A' | 'B' | 'G') => {
    const p = await ctx.newPage();
    await p.goto(`tent?demo&date=${DATE}${as === 'A' ? '' : `&as=${as}`}`);
    await roomUp(p, 'tent');
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

test.describe(() => {
  test.use({ ambient: 'on' }); // (idle life about it, which must leave it put: ambient life, e2e/fixtures.ts)
  test('the guest’s villager is always on the members’ islands: asleep while its app is closed, awake while open; it stays put unless moved', async ({ browser }) => {
    test.setTimeout(60_000);
    const ctx = await browser.newContext({ viewport: VIEW });
    // (the grace short: ui-state/cast.ts setSpans)
    const a = await open(ctx, 'A', '&grace=2000');
    const b = await open(ctx, 'B', '&grace=2000');
    // its app closed: there, at its spot, asleep (the members' apps open: theirs awake)
    for (const p of [a, b]) {
      await expect.poll(() => who(p, 'G')).not.toBeNull();
      await expect.poll(() => asleep(p, 'G')).toBe(true);
      expect(await asleep(p, p === a ? 'A' : 'B')).toBe(false);
    }
    const spot = await who(a, 'G');
    if (process.env.SHOTS) await a.screenshot({ path: `${process.env.SHOTS}/guest-asleep.png` });
    const g = await open(ctx, 'G');
    // its app open: awake on both members' islands, where it was (no walk ashore), as on its own phone
    for (const p of [a, b]) await expect.poll(() => asleep(p, 'G'), { timeout: 6000 }).toBe(false);
    expect(await asleep(g, 'G')).toBe(false);
    const there = await who(g, 'G');
    const near = (at: [number, number] | null, to: [number, number] | null) => (at && to ? Math.hypot(at[0] - to[0], at[1] - to[1]) : 999);
    expect(near(there, spot)).toBeLessThan(2);
    for (const p of [a, b]) await expect.poll(async () => near(await who(p, 'G'), there), { timeout: 4000 }).toBeLessThan(2);
    // idle, its app open: nobody's life moves it, on its own phone or theirs, as a member's online villager (a fixed
    // wait: proving that nothing happens, two of ambient life's 10 s slots)
    await g.waitForTimeout(11_000);
    for (const p of [g, a, b]) expect(near(await who(p, 'G'), there)).toBeLessThan(2);
    // the guest closes its app: still there on both islands, awake for the grace, then asleep where it stood
    await g.close();
    expect(await asleep(a, 'G')).toBe(false);
    for (const p of [a, b]) {
      await expect.poll(() => asleep(p, 'G'), { timeout: 8000 }).toBe(true);
      expect(near(await who(p, 'G'), there)).toBeLessThan(2);
    }
    await ctx.close();
  });
});
