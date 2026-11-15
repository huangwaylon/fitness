// 設定 → プロフィール (docs/design.md "Profile"): on a phone paired with a record of its own (e2e/record.ts: the
// relay's real code) holding profile rows from before the lock, settings opens on a read-only row a person: a member's
// phone the two members (its own first), the guest's only its own; the record refuses any profile pref from anyone.
// The BMI card (けんこう → からだ) says the average's category by the Asian cut-offs. Made-up values only.
import { expect, test, type Browser, type Locator, PINNED_DATE } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';

type Rec = ReturnType<typeof newRecord>;

/** A fresh phone paired as `who` on `rec`, its せってい open. */
async function settings(browser: Browser, rec: Rec, who: 'A' | 'B' | 'G') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const page = await context.newPage();
  await page.goto('');
  await islandUp(page);
  await fromMenu(page, 'settings');
  const card = page.locator('dialog[open] [data-profile]');
  await expect(card.first()).toBeVisible();
  return { page, card };
}

/** The age on the phones' (pinned) day, as the app counts it. */
function ageNow(birth: string): number {
  const today = PINNED_DATE.slice(0, 10);
  const y = +today.slice(0, 4) - +birth.slice(0, 4);
  return today.slice(5) >= birth.slice(5) ? y : y - 1;
}

/** A phone's profile rows: [who, line]. */
const rows = (card: Locator) => card.evaluateAll((els) => els.map((e) => [e.getAttribute('data-profile'), e.querySelector('dd')?.textContent]));

test('the profile: first in settings, read-only, the members’ to the members and the guest’s to the guest; locked on the record', async ({ browser }) => {
  test.setTimeout(60_000);
  const rec = newRecord();
  rec.kept('A', 'pref', { key: 'sex', value: 'm' });
  rec.kept('A', 'pref', { key: 'birth', value: '1990-05-12' });
  rec.kept('A', 'pref', { key: 'sex', value: 'f', person: 'B' });
  rec.kept('B', 'pref', { key: 'birth', value: '1994-08-20' });
  rec.kept('B', 'pref', { key: 'bmiStd', value: 'who' }); // the old BMI standard's: ignored
  rec.kept('G', 'pref', { key: 'sex', value: 'f' });
  const lineA = `男性・1990/5/12（${ageNow('1990-05-12')}歳）`, lineB = `女性・1994/8/20（${ageNow('1994-08-20')}歳）`;

  const a = await settings(browser, rec, 'A');
  await expect(a.page.locator('dialog[open] [data-settings] > section').first()).toHaveAttribute('data-profile-section', '');
  await expect.poll(() => rows(a.card)).toEqual([['A', lineA], ['B', lineB]]);
  await expect(a.page.locator('dialog[open] [data-profile-section]').locator('input, select, button, [role=radio]')).toHaveCount(0);
  await a.page.context().close();

  // うめ's phone: hers first
  const b = await settings(browser, rec, 'B');
  await expect.poll(() => rows(b.card)).toEqual([['B', lineB], ['A', lineA]]);
  await b.page.context().close();

  // the guest: its own only, 未設定 where nothing was kept
  const g = await settings(browser, rec, 'G');
  await expect.poll(() => rows(g.card)).toEqual([['G', '女性・未設定']]);
  expect(rec.prefs('G').map(([, d]) => d.key)).toEqual(['sex']); // never a member's
  expect(rec.prefs('A').filter(([who]) => who === 'G')).toEqual([]); // nor the guest's to a member
  await g.page.context().close();

  // locked: no one sets or clears it
  for (const [who, data] of [['A', { key: 'sex', value: 'f' }], ['B', { key: 'birth', value: null, person: 'A' }], ['G', { key: 'birth', value: '2001-01-01' }]] as const)
    expect(rec.event(who, 'pref', data)).toEqual({ ok: false, error: 'forbidden', detail: 'profile locked' });
});

test('the BMI card says the average’s category by the Asian cut-offs', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-31T12:10:00+09:00') });
  await page.clock.resume();
  await page.goto('?demo');
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  const sheet = page.locator('dialog[open]');
  await sheet.locator('[data-group=body]').click();
  const cat = sheet.locator('[data-metric=bmi] [data-bmi-cat]');
  // the demo's ウェイ: BMI about 22–24
  await expect(cat).toHaveText(/^(普通体重|過体重)（アジア基準）$/);
  await expect(sheet.locator('[data-metric=weight] [data-bmi-cat], [data-metric=body_fat_pct] [data-bmi-cat]')).toHaveCount(0);
});
