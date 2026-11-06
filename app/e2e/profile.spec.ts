// せってい → プロフィール (docs/design.md "Profile"): on a phone paired with a record of its own (e2e/record.ts: the
// relay's real code), a member sets their own and the partner's sex, birthday and BMI standard; the partner's phone,
// opening later, has them; the guest's phone shows only its own profile, and the record never sends it a member's.
// The BMI card (けんこう → からだ) says the average's category by the standard. Made-up values only.
import { expect, test, type Browser, type Page, PINNED_DATE } from './fixtures.ts';
import { fromMenu, hudMenu } from './hud.ts';
import { newRecord } from './record.ts';

type Rec = ReturnType<typeof newRecord>;

/** A fresh phone paired as `who` on `rec`, its せってい open. */
async function settings(browser: Browser, rec: Rec, who: 'A' | 'B' | 'G') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const page = await context.newPage();
  await page.goto('?critter=none&visitor=none');
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'settings');
  const card = page.locator('dialog[open] [data-profile]');
  await expect(card).toBeVisible();
  return { page, card };
}

/** The age on the phones' (pinned) day, as the app counts it. */
function ageNow(birth: string): number {
  const today = PINNED_DATE.slice(0, 10);
  const y = +today.slice(0, 4) - +birth.slice(0, 4);
  return today.slice(5) >= birth.slice(5) ? y : y - 1;
}

const checked = (page: Page, attr: string) => page.locator(`dialog[open] [data-profile] [${attr}][aria-checked=true]`);

test('a member sets both profiles; the partner’s phone has them; the guest sees only its own', async ({ browser }) => {
  test.setTimeout(60_000);
  const rec = newRecord();
  const a = await settings(browser, rec, 'A');
  await expect(a.card).toHaveAttribute('data-profile', 'A');
  await expect(checked(a.page, 'data-sex')).toHaveAttribute('data-sex', 'none'); // ひみつ until set
  await expect(checked(a.page, 'data-bmi-std')).toHaveAttribute('data-bmi-std', 'asia'); // the default
  await a.card.locator('[data-sex=m]').click();
  await a.card.locator('[data-birth]').fill('1990-05-12');
  await expect(a.card.locator('[data-profile-age]')).toHaveText(`${ageNow('1990-05-12')}さい`);
  // うめ's, from ウェイ's phone (either member sets either's)
  await a.card.locator('select[data-pick=who]').selectOption('B');
  await expect(a.card).toHaveAttribute('data-profile', 'B');
  await expect(a.card.locator('[data-birth]')).toHaveValue('');
  await a.card.locator('[data-sex=f]').click();
  await a.card.locator('[data-bmi-std=who]').click();
  await a.card.locator('[data-birth]').fill('1994-08-20');
  await expect.poll(() => rec.sent.filter((e) => e.type === 'pref').map((e) => [e.ok, e.data.person, e.data.key, e.data.value])).toEqual([
    [true, 'A', 'sex', 'm'], [true, 'A', 'birth', '1990-05-12'], [true, 'B', 'sex', 'f'], [true, 'B', 'bmiStd', 'who'], [true, 'B', 'birth', '1994-08-20']
  ]);
  await a.page.context().close();

  // うめ's phone, opening later: hers first, as set; then ウェイ's
  const b = await settings(browser, rec, 'B');
  await expect(b.card).toHaveAttribute('data-profile', 'B');
  await expect(checked(b.page, 'data-sex')).toHaveAttribute('data-sex', 'f');
  await expect(checked(b.page, 'data-bmi-std')).toHaveAttribute('data-bmi-std', 'who');
  await expect(b.card.locator('[data-birth]')).toHaveValue('1994-08-20');
  await b.card.locator('select[data-pick=who]').selectOption('A');
  await expect(checked(b.page, 'data-sex')).toHaveAttribute('data-sex', 'm');
  await expect(b.card.locator('[data-birth]')).toHaveValue('1990-05-12');
  await b.page.context().close();

  // the guest: its own profile only (no dropdown, no BMI standard), nothing of the members' set there
  const g = await settings(browser, rec, 'G');
  await expect(g.card).toHaveAttribute('data-profile', 'G');
  await expect(g.card.locator('select, [data-bmi-std]')).toHaveCount(0);
  await expect(checked(g.page, 'data-sex')).toHaveAttribute('data-sex', 'none');
  await expect(g.card.locator('[data-birth]')).toHaveValue('');
  await g.card.locator('[data-sex=f]').click();
  await expect.poll(() => rec.prefs('G').map(([who, d]) => [who, d.key, d.value])).toEqual([['G', 'sex', 'f']]); // never a member's
  expect(rec.prefs('A').filter(([who]) => who === 'G')).toEqual([]); // nor the guest's to a member
  await g.page.context().close();
});

test('the BMI card says the average’s category by the person’s standard', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-31T12:10:00+09:00') });
  await page.clock.resume();
  await page.goto('?demo');
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  const sheet = page.locator('dialog[open]');
  await sheet.locator('[data-group=body]').click();
  const cat = sheet.locator('[data-metric=bmi] [data-bmi-cat]');
  // the demo's ウェイ: BMI about 22–24, アジア (the default)
  await expect(cat).toHaveAttribute('data-bmi-std', 'asia');
  await expect(cat).toHaveText(/^(普通体重|過体重)（アジア基準）$/);
  await expect(sheet.locator('[data-metric=weight] [data-bmi-cat], [data-metric=body_fat_pct] [data-bmi-cat]')).toHaveCount(0);
});
