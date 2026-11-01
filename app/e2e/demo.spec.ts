// Demo smoke test: buy, undo, the harvest recap, きろく (read-only, the goals), on `?demo` (no backend, no key).
import { expect, test, type Page } from '@playwright/test';

const sheet = (page: Page) => page.locator('dialog[open]');

/** The island is up: today's ベル ribbon shows (the app asks no questions, so nothing to answer first). */
async function islandReady(page: Page) {
  await expect(page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
}

/** Tap today's ベル ribbon: the island panel slides down (on the きろく tab, or the last tab this session). */
async function openPanel(page: Page) {
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await expect(sheet(page).locator('.panel-body')).toBeVisible();
}
/** The panel on its きろく tab (it opens on けんこう). */
async function openKiroku(page: Page) {
  await openPanel(page);
  await sheet(page).locator('.tab[data-tab=kiroku]').click();
  await expect(sheet(page).locator('.kiroku')).toBeVisible();
}
/** The panel on its せってい tab (むらびと, サウンド, ことば, つうしん, あそびかた). */
async function openSettings(page: Page) {
  await openPanel(page);
  await sheet(page).locator('.tab[data-tab=settings]').click();
  await expect(sheet(page).locator('.tab[data-tab=settings]')).toHaveAttribute('aria-pressed', 'true');
}

test('buy: a reward comes back with とりけす', async ({ page }) => {
  await page.goto('jar?demo');
  const shop = page.locator('.shop');
  const balance = async () => Number((await page.locator('.hero .total').innerText()).replace(/\D/g, ''));
  const before = await balance();
  await shop.locator('button[data-item="dinner"]').click();
  await expect(sheet(page).locator('.price')).toContainText('15');
  await sheet(page).getByRole('button', { name: '買う！' }).click();
  await expect(page.getByText(/外食を 買いました！ −15\sベル/)).toBeVisible();
  await expect.poll(balance).toBe(before - 15);
  await page.getByRole('button', { name: 'とりけす' }).click();
  await expect.poll(balance).toBe(before);
  // やめる closes the confirm without spending
  await shop.locator('button[data-item="snack"]').click();
  await sheet(page).getByRole('button', { name: 'やめる' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect.poll(balance).toBe(before);
});

test('wallet: one balance (the HUD jar’s) and exactly two rewards with their art: おやつ 8, 外食 15', async ({ page }) => {
  await page.goto('?demo');
  const plate = await page.locator('.hud-jar > b').innerText();
  await page.locator('.hud-jar').click();
  await expect(page.locator('.jar-screen')).toBeVisible();
  await expect(page.locator('.hero .total')).toContainText(plate.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  const shop = page.locator('.shop');
  await expect(shop.locator('button.item')).toHaveCount(2);
  await expect(shop.locator('.nm')).toHaveText(['おやつ', '外食']);
  await expect(shop.locator('.pr')).toHaveText([/^8\sベル$/, /^15\sベル$/]);
  await expect(shop.locator('.ex').first()).toContainText('たこやき');
  await expect(shop.locator('.ex').last()).toContainText('マーラータン');
  for (const id of ['snack', 'dinner']) await expect(shop.locator(`button[data-item=${id}] img`)).toHaveAttribute('src', new RegExp(`items/${id}\\.webp`));
});

test('harvest: a recap of the week: each of us, ふたりで ぜんぶ, the total; the coins land in the jar', async ({ page }) => {
  await page.goto('?demo=harvest');
  const tally = page.locator('.overlay .tally');
  await expect(tally.locator('.trow:not(.duo)')).toHaveCount(2);
  for (const row of await tally.locator('.trow:not(.duo) .plus').all()) await expect(row).toHaveText(/^\+\d+\sベル$/);
  await expect(tally.locator('.duo')).toContainText('ふたりで ぜんぶ');
  await expect(tally.locator('.duo .hint')).toHaveText(/^\d+日 · 1日 \+2\sベル$/);
  await expect(tally.locator('.total')).toContainText('今週の ベル');
  await expect(tally.getByText(/バッジ|ボーナス/)).toHaveCount(0);
  await page.getByRole('button', { name: '受け取る！' }).click();
  await expect(page.getByText('おさいふに 入りました！')).toBeVisible();
  await page.getByRole('button', { name: '島へもどる' }).click();
  await expect(page.getByRole('button', { name: '受け取る！' })).toHaveCount(0);
});

test('きろく: per day each of us four goals and ふたりで ぜんぶ; a day is read-only: values, ✓ and +1', async ({ page }) => {
  await page.goto('?demo');
  await openKiroku(page);
  const day = sheet(page).locator('li.day:not(.head)').first();
  await expect(day.locator('.marks')).toHaveCount(2);
  await expect(day.locator('.marks').first().locator('.m')).toHaveCount(4);
  await expect(day.locator('.tot')).toHaveText(/^\+\d+\sベル$|^0\sベル$/);
  await sheet(page).getByRole('button', { name: /\(月\)/ }).first().click();
  await expect(sheet(page).locator('.pc')).toHaveCount(2);
  for (const p of ['A', 'B']) await expect(sheet(page).locator(`.pc[data-person=${p}] .row`)).toHaveCount(4);
  await expect(sheet(page).locator('.duo')).toContainText('ふたりで ぜんぶ');
  await expect(sheet(page).locator('.pen-btn, .atm, input, .log')).toHaveCount(0);
});

test('けんこう: body weight (from Health, no logging by hand); its goal is set in きろく', async ({ page }) => {
  await page.goto('?demo');
  const ribbon = page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
  await expect(ribbon).toBeVisible();
  const bells = await ribbon.getAttribute('aria-label');
  await openKiroku(page);
  await sheet(page).locator('.tab[data-tab=health]').click();
  const card = sheet(page).locator('.wc');
  await expect(card.getByRole('heading', { name: '体重' })).toBeVisible();
  await expect(card.getByRole('img', { name: /^ウェイの体重 / })).toHaveCount(1); // this phone's person's (the tab shows one person)
  await expect(card.locator('.pen-btn, input, .acts')).toHaveCount(0); // nothing to log or fix by hand
  // the goal is set in きろく's 目標 card (one place for both goals) and drawn on the weight chart
  await sheet(page).locator('.tab[data-tab=kiroku]').click();
  await sheet(page).getByRole('button', { name: '体重 ✎' }).click();
  const input = sheet(page).getByRole('textbox');
  await expect(input).toHaveAttribute('inputmode', 'decimal');
  await input.fill('300.5');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.fill('65');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(sheet(page).locator('.goals')).toContainText('65.0 kg');
  await sheet(page).locator('.tab[data-tab=health]').click();
  await expect(sheet(page).locator('.wc[data-person=A]')).toContainText('目標 65.0');
  // weight never earns: today's ベル didn't move
  await page.keyboard.press('Escape');
  await expect(ribbon).toHaveAttribute('aria-label', bells!);
});

test('tree popup: the four goals (steps first), today’s amount / the goal with ✓ once met (a がんばり chip at 1.5×, no numbers on the rows), the day\'s ledger and today’s ふたりで ぜんぶ', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-30T12:10:00+09:00') });
  await page.clock.resume();
  await page.goto('?demo');
  await islandReady(page);
  await page.locator('button.canopy').nth(0).click();
  const pop = page.locator('.detail');
  await expect(pop.locator('.plate')).toHaveText('ウェイ');
  // it opens upwards: above its tree's trunk, under the ribbon (measured once its pop-in has finished and the camera has
  // eased up the island to make room for it on a short screen)
  await pop.evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished)));
  await page.waitForTimeout(700);
  const [p, c, r] = await Promise.all([pop, page.locator('button.canopy').nth(0), page.locator('.ribbon')].map((l) => l.boundingBox()));
  expect(p!.y + p!.height).toBeLessThan(c!.y + c!.height);
  expect(p!.y).toBeGreaterThan(r!.y + r!.height);
  const rows = pop.locator('.row');
  await expect(rows).toHaveCount(4);
  await expect(rows.locator('.lbl')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']); // steps first, then Apple's ring order
  const units = [/歩$/, /kcal$/, /分$/, /分$/];
  for (let i = 0; i < 4; i++) {
    const row = rows.nth(i);
    // today's amount against the goal, met or not; ✓ before it once met
    await expect(row.locator('.amt')).toHaveText(new RegExp(`^[\\d,]+ / [\\d,]+ ?${units[i].source}`));
    await expect(row.locator('.amt svg.ok')).toHaveCount(await row.locator('.amt.met').count());
    // no ベル on a row; a chip only at 1.5× (e2e/stretch.spec.ts has the rule's edges and the cap)
    await expect(row.locator('b')).toHaveCount(0);
    await expect(row.locator('.chip')).toHaveCount(await row.getAttribute('data-stretched') ? 1 : 0);
  }
  // the ledger: goals, this person's total (がんばり only when reached)
  await expect(pop.locator('.sum [data-v=goals]')).toHaveText(/^\+[0-4]$/);
  await expect(pop.locator('.sum .k.tot')).toHaveText('ウェイの きょう');
  await expect(pop.locator('.sum [data-v=total]')).toHaveText(/^\+?\d\sベル$/);
  await expect(pop.locator('.duo')).toHaveText(/^\s*ふたりで ぜんぶ まで：あと [1-8]つ$|^\s*ふたりで ぜんぶ！\s*\+2\s*ふたりに$/);
  // its last line: when this person's data last arrived (one home: the tree popup)
  await expect(pop.locator('.sync')).toHaveText(/^\d{2}:\d{2} に とどいた$|^きのう \d{2}:\d{2}$|^\d+\/\d+$|^まだ とどいていません$/);
  // each tree's four fruits (in the canopy, or fallen once met: e2e/trees.spec.ts)
  await expect(page.locator('.if-scene [data-fruit]')).toHaveCount(8);
});

test('partner: a tap is a high-five, no card: mine walks up beside them, both hop, it is sent once', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  const vil = page.locator('.if-scene button.vil').nth(1);
  await expect(vil).toBeEnabled(); // after the opening beats
  await expect(vil).toHaveAttribute('aria-label', 'うめと ハイタッチ');
  const sent = () => page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'highfive').length);
  const before = await sent();
  const apart = async () => {
    const [m, p] = await Promise.all(['mine', 'partner'].map((id) => page.locator(`[data-actor="${id}"] .vil`).boundingBox()));
    return Math.abs(m!.x - p!.x);
  };
  const home = await apart(); // at home, 130u apart
  await vil.click();
  await vil.click(); // a second tap while it's under way adds nothing
  await expect(page.locator('dialog[open]')).toHaveCount(0); // no card
  // both hop face to face with the sparkles, and it's sent
  for (const id of ['mine', 'partner']) await expect(page.locator(`[data-actor="${id}"] .fx.sparkles`).first()).toBeAttached({ timeout: 6000 });
  await expect(page.getByText('うめさんに ハイタッチ！')).toBeVisible();
  expect(await apart()).toBeLessThan(home * 0.6); // mine walked up beside them (a step: 40u)
  await expect.poll(sent).toBe(before + 1);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('きろく: the Move goal, a numeric field ≥ 16px, 100–2,000 kcal, from today on; either person’s', async ({ page }) => {
  await page.goto('?demo');
  await openKiroku(page);
  const goals = sheet(page).locator('.goals');
  await expect(goals).toContainText('600 kcal');
  await goals.getByRole('button', { name: /ムーブ（1日） ✎$/ }).click();
  const input = sheet(page).getByRole('textbox');
  await expect(input).toHaveAttribute('inputmode', 'numeric');
  expect(await input.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
  await input.fill('50');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.fill('2000');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(page.getByText('ムーブの目標を かえました')).toBeVisible();
  await expect(goals).toContainText('2,000 kcal');
  // today's tree popup reads the new goal: no day reaches 2,000 kcal, so no ✓
  await page.keyboard.press('Escape');
  await page.locator('button.canopy').nth(0).click();
  await expect(page.locator('.detail .row[data-row=pear] .amt')).toHaveText(/^[\d,]+ \/ 2,000 kcal$/);
  await expect(page.locator('.detail .row[data-row=pear] .amt svg')).toHaveCount(0);
  // the partner's goals: the second avatar pill switches the card, and ✎ sets the partner's goal
  await page.keyboard.press('Escape');
  await openKiroku(page); // the ribbon opens on けんこう
  const other = goals.locator('button.pp').nth(1);
  const partner = (await other.textContent())!.trim();
  await other.click();
  await expect(other).toHaveAttribute('aria-pressed', 'true');
  await goals.getByRole('button', { name: /ムーブ（1日） ✎$/ }).click();
  await expect(sheet(page)).toContainText(partner);
  await sheet(page).getByRole('textbox').fill('520');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(goals).toContainText('520 kcal');
  await goals.locator('button.pp').nth(0).click();
  await expect(goals).toContainText('2,000 kcal');
});

test('tree popups: one at a time, they stay open, and a tap on the tree, the other tree or elsewhere toggles them', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  const canopies = page.locator('button.canopy');
  const popups = page.locator('.detail');
  await canopies.nth(0).click();
  await expect(popups).toHaveCount(1);
  await expect(canopies.nth(0)).toHaveAttribute('aria-expanded', 'true');
  await page.waitForTimeout(3200); // no auto-close: it stays past 3 s
  await expect(popups).toHaveCount(1);
  await canopies.nth(1).click(); // the other tree: it moves there
  await expect(popups).toHaveCount(1);
  await expect(canopies.nth(0)).toHaveAttribute('aria-expanded', 'false');
  await expect(canopies.nth(1)).toHaveAttribute('aria-expanded', 'true');
  // the same tree: it closes (its lower canopy: on a short screen the popup is pushed down over the top of it)
  await canopies.nth(1).click({ position: { x: (await canopies.nth(1).boundingBox())!.width / 2, y: (await canopies.nth(1).boundingBox())!.height - 8 } });
  await expect(popups).toHaveCount(0);
  await canopies.nth(0).click();
  await page.mouse.click(20, 300); // the sky: it closes
  await expect(popups).toHaveCount(0);
  await canopies.nth(0).click();
  await page.keyboard.press('Escape');
  await expect(popups).toHaveCount(0);
});

test('a tap on an open tree popup closes it and reaches nothing under it (the other tree)', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  await page.locator('button.canopy').first().click();
  const popup = page.locator('.detail');
  await expect(popup).toHaveCount(1);
  // where it stands once the camera has eased up the island to make room for it (a short screen)
  await page.waitForTimeout(1000);
  const box = (await popup.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(popup).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/jar/);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('navigation: every sheet and level has a visible ✕ (top-right) or ‹ (top-left) that works; no grabber', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  await expect(page.locator('.if-scene button.vil').nth(1)).toBeEnabled();
  const box = async (sel: ReturnType<Page['locator']>) => (await sel.boundingBox())!;
  const vw = page.viewportSize()!.width;
  // the panel: two tabs and ✕ at its top level, ‹ + ✕ one level in (a day, the picker, the guide), ‹ goes back
  await openPanel(page);
  const bar = sheet(page).locator('.titlebar');
  const tabs = sheet(page).locator('.tabs');
  await expect(sheet(page).locator('.tabs .tab')).toHaveText(['けんこう', 'きろく', 'せってい']); // けんこう first
  await expect(sheet(page).locator('.tab[data-tab=health]')).toHaveAttribute('aria-pressed', 'true'); // and the panel opens on it
  await expect(bar.locator('.close')).toBeVisible();
  await expect(bar.locator('.back')).toHaveCount(0);
  await sheet(page).locator('.tab[data-tab=settings]').click();
  for (const push of ['villager', 'help']) {
    await sheet(page).locator(`[data-push=${push}]`).click();
    await expect(bar.locator('.back')).toBeVisible();
    const b = await box(bar.locator('.back'));
    expect(b.width).toBeGreaterThanOrEqual(44);
    await bar.locator('.back').click();
    await expect(sheet(page).locator(`[data-push=${push}]`)).toBeVisible();
  }
  // きろく: a day, then ‹ back to the tab's top, with the tabs again
  await sheet(page).locator('.tab[data-tab=kiroku]').click();
  await sheet(page).locator('button.dbtn').first().click();
  await expect(tabs).toHaveCount(0); // a level in: only that screen
  await expect(sheet(page).locator('.pc')).toHaveCount(2);
  await bar.locator('.back').click();
  await expect(tabs).toBeVisible();
  await expect(bar.locator('.back')).toHaveCount(0);
  await bar.locator('.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // the wallet: ‹ 島へ top-left; the buy confirm has ✕
  await page.locator('.hud-jar').click();
  await expect(page.locator('.jar-screen a.back')).toBeVisible();
  await page.locator('.shop button.item:not([aria-disabled="true"])').first().click();
  const close = sheet(page).locator('.navbar .close');
  await expect(close).toBeVisible();
  const c = await box(close);
  expect(c.width).toBeGreaterThanOrEqual(44);
  expect(c.x + c.width).toBeGreaterThan(vw - 40);
  await close.click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.locator('.jar-screen a.back').click();
  await expect(page.locator('.if-scene')).toBeVisible();
});

test('サウンド: all off by default; toggles persist on this phone; ミュージック: the opening, then the hour', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const audio: string[] = [];
  page.on('request', (r) => r.url().includes('/audio/') && audio.push(new URL(r.url()).pathname));
  await page.goto('?demo');
  await openSettings(page);
  const row = (name: string) => sheet(page).getByRole('switch', { name: new RegExp(`^${name}`) });
  for (const n of ['ミュージック', '効果音']) await expect(row(n)).toHaveAttribute('aria-checked', 'false');
  await expect(row('おしゃべり')).toHaveCount(0); // the villagers don't speak: no voice setting
  expect(audio).toEqual([]); // nothing is fetched while everything is off
  await row('効果音').click();
  await expect(row('効果音')).toHaveAttribute('aria-checked', 'true');
  await row('ミュージック').click();
  await expect(row('ミュージック')).toHaveAttribute('aria-checked', 'true');
  // the opening theme plays while the panel is up (NH's title screen); closing the panel hands over to the hour
  await expect(sheet(page).getByText('いまは オープニングテーマ')).toBeVisible();
  await expect.poll(() => audio).toContain('/fitness/audio/music/opening.m4a');
  await sheet(page).getByRole('slider', { name: '音量' }).fill('4');
  await sheet(page).locator('.titlebar .close').click();
  // the hour's track (or, on an event day, its track: events.ts)
  await expect.poll(() => audio.some((p) => /\/audio\/music\/(hour-\d\d|halloween|turkey-day|happy-new-year|new-year-0am|new-year-2am|new-years-day)\.m4a$/.test(p))).toBe(true);
  await page.reload();
  await openSettings(page);
  await expect(row('効果音')).toHaveAttribute('aria-checked', 'true');
  await expect(row('ミュージック')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).getByRole('slider', { name: '音量' })).toHaveValue('4');
  expect(errors).toEqual([]);
});

test('focus ring: none on the panel’s くわしく after tap → ‹ back; the keyboard still shows it', async ({ page }) => {
  await page.goto('?demo');
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).tap();
  await sheet(page).locator('.tab[data-tab=settings]').tap();
  const tile = sheet(page).locator('[data-push=help]');
  await tile.tap();
  await sheet(page).locator('.titlebar .back').tap();
  await expect(tile).toBeFocused();
  // WebKit shows :focus-visible on a programmatic focus after a touch; the pointer modality hides it (ui/modality.ts)
  await expect(page.locator('html')).toHaveAttribute('data-input', 'pointer');
  const ring = () => tile.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(await ring()).toBe('none');
  // keyboard: Tab onto the next control and back: the ring shows
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(tile).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-input', 'keyboard');
  expect(await ring()).not.toBe('none');
});

test('むらびと: the panel shows my villager; かえる → とくべつ (たぬきち, しずえ…) first, then むらびと; picking しずえ makes たぬきち the host', async ({ page }) => {
  await page.goto('?demo');
  await openSettings(page);
  await sheet(page).locator('[data-push=villager]').click();
  const dlg = sheet(page);
  await expect(dlg.locator('.grp')).toHaveText(['とくべつ', 'むらびと']);
  await expect(dlg.getByRole('radio').first()).toHaveAccessibleName('たぬきち');
  await dlg.getByRole('searchbox').fill('とたけけ');
  await expect(dlg.locator('.grp')).toHaveText(['とくべつ']);
  await expect(dlg.getByRole('radio')).toHaveCount(1);
  await dlg.getByRole('searchbox').fill('しずえ');
  await dlg.getByRole('radio', { name: 'しずえ' }).click();
  await expect(dlg.locator('.vk')).toHaveText('とくべつ');
  await page.goto('?demo=harvest');
  await expect(page.locator('.bubble .who').first()).toHaveText('たぬきち');
});

test('404 at 320: the page fits the screen (ja breaks only at its spaces) and no harvest covers it', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('nope?demo=harvest');
  await expect(page.getByRole('heading', { name: /このページは 見つかりませんでした/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.locator('.overlay')).toHaveCount(0);
});

test('with the undo banner up, a sheet’s footer (買う！) rises above it: a tap on 買う！ reaches 買う！', async ({ page }) => {
  await page.goto('jar?demo');
  await page.locator('.shop button.item:not([aria-disabled="true"])').first().click();
  await sheet(page).getByRole('button', { name: '買う！' }).click();
  await expect(page.getByRole('button', { name: 'とりけす' })).toBeVisible();
  await page.locator('.shop button.item:not([aria-disabled="true"])').first().click();
  const buy = sheet(page).getByRole('button', { name: '買う！' });
  await expect(buy).toBeVisible();
  await sheet(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished)));
  const hit = await buy.evaluate((b) => { const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!top && b.contains(top); });
  expect(hit).toBe(true);
});

test('the panel opens on けんこう from the ribbon every time, whichever tab it closed on', async ({ page }) => {
  await page.goto('?demo');
  await openSettings(page);
  await expect(sheet(page).locator('#sec-sound')).toBeVisible();
  await sheet(page).locator('.titlebar .close').click();
  await openPanel(page);
  await expect(sheet(page).locator('.tab[data-tab=health]')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await openPanel(page);
  await expect(sheet(page).locator('.tab[data-tab=health]')).toHaveAttribute('aria-pressed', 'true');
});

test('きろく opens light: the newest three weeks of ベル; 「まえの週も 見る」 adds older ones', async ({ page }) => {
  await page.goto('?demo');
  await openKiroku(page);
  const weeks = sheet(page).locator('section.week');
  await expect(weeks).toHaveCount(3);
  // earnings only: the demo buys every week, and none of it shows here (the buys live on ごほうび)
  await expect(weeks.first()).not.toContainText(/おやつ|外食|とりけす/);
  await sheet(page).getByRole('button', { name: 'まえの週も 見る' }).first().click();
  await expect.poll(() => weeks.count()).toBeGreaterThan(3);
});

test('the panel: its tabs show whole (lip included, nothing paints over it) and it reaches the screen’s bottom', async ({ page }) => {
  await page.goto('?demo');
  await openPanel(page);
  for (const tab of ['kiroku', 'health', 'settings']) {
    await sheet(page).locator(`.tab[data-tab=${tab}]`).click();
    const m = await sheet(page).evaluate((d) => {
      const row = d.querySelector('.tabs')!.getBoundingClientRect();
      const tabs = [...d.querySelectorAll('.tab')].map((t) => {
        const r = t.getBoundingClientRect(); const lip = r.bottom + 4; // the 4px lip under the pill
        const over = document.elementFromPoint(r.left + r.width / 2, lip - 1.5);
        return { inRow: lip <= row.bottom + 0.5, clean: !!over && (t.contains(over) || over === t.parentElement) };
      });
      return { tabs, gap: innerHeight - d.getBoundingClientRect().bottom };
    });
    for (const x of m.tabs) expect(x).toEqual({ inRow: true, clean: true });
    expect(Math.abs(m.gap)).toBeLessThanOrEqual(1);
  }
});

test('the jar sits beside today’s ribbon: one row centred as a group, both ≥ 44px and apart, on screen at 320–390, day and night', async ({ page }) => {
  for (const [w, h] of [[320, 568], [375, 667], [390, 844]]) {
    for (const at of ['2026-10-28T12:00', '2026-10-28T22:00']) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`?demo&date=${at}`);
      await islandReady(page);
      const ribbon = (await page.locator('.ribbon').boundingBox())!;
      const jar = (await page.locator('.hud-jar').boundingBox())!;
      expect(ribbon.height).toBeGreaterThanOrEqual(44);
      expect(jar.height).toBeGreaterThanOrEqual(44);
      expect(jar.width).toBeGreaterThanOrEqual(44);
      // one row: the same top and height
      expect(Math.abs(jar.y - ribbon.y)).toBeLessThan(1);
      // the ribbon's right tail (16px) sits in the gap, clear of the jar
      expect(jar.x - (ribbon.x + ribbon.width)).toBeGreaterThanOrEqual(18);
      // centred as a group (the left tail counted in), inside the screen with room to spare
      const left = ribbon.x - 16, right = jar.x + jar.width;
      expect(left).toBeGreaterThanOrEqual(8);
      expect(right).toBeLessThanOrEqual(w - 8);
      expect(Math.abs((left + right) / 2 - w / 2)).toBeLessThan(2);
      // the jar's lid rises out of the pill
      const glass = (await page.locator('.hud-jar .jarart').boundingBox())!;
      expect(glass.y).toBeLessThan(jar.y);
    }
  }
  // the two taps stay apart: the ribbon opens the panel, the jar goes to ごほうび
  await openPanel(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.locator('.hud-jar').click();
  await expect(page.locator('.jar-screen')).toBeVisible();
});
