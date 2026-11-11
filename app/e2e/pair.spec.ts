// Pairing (routes/pair): the key field takes hex only, and a key that can't be right yet says what a key is, as the
// check has it (32+ characters, 0-9 and a-f), and where it comes from (the link fills it in); 接続 waits till then, a
// dashed, empty button at night (the sunk navy read as a slab to press: review 11/10 r3 N5). No relay: never sent.
import { expect, test } from './fixtures.ts';

test.use({ viewport: { width: 393, height: 852 } });

for (const [tod, at] of [['day', '2026-11-12T12:00'], ['night', '2026-11-12T21:30']] as const) {
  test(`the key's rule as the check has it; 接続 not yet till then (${tod})`, async ({ page }) => {
    await page.goto(`pair?date=${at}`);
    const key = page.locator('#code'), msg = page.locator('#pair-msg'), go = page.locator('form button[type=submit]');
    await key.fill('abcxyz12');
    await expect(key).toHaveValue('abc12'); // not hex: dropped
    await expect(msg).toHaveText('32文字以上（0〜9とa〜f）のキーです。届いたリンクを開くと自動で入ります');
    await expect(go).toHaveAttribute('aria-disabled', 'true');
    if (tod === 'night') await expect(go).toHaveCSS('outline-style', 'dashed');
    await key.fill('0123456789abcdef0123456789abcdef');
    await expect(msg).toHaveText('');
    await expect(go).toHaveAttribute('aria-disabled', 'false');
    await expect(go).toHaveCSS('outline-style', 'none');
  });
}
