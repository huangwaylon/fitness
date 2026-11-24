// Pairing (routes/pair): the key field takes hex only, and a key that can't be right yet says what a key is, as the
// check has it (32+ characters, 0-9 and a-f), and where it comes from (the link fills it in); 接続 waits till then.
// No relay: never sent.
import { expect, test } from './fixtures.ts';

test.use({ viewport: { width: 393, height: 852 } });

test('the key\'s rule as the check has it; 接続 not yet till then', async ({ page }) => {
  await page.goto('pair?date=2026-11-12T12:00');
  const key = page.locator('#code'), msg = page.locator('#pair-msg'), go = page.locator('form button[type=submit]');
  await key.fill('abcxyz12');
  await expect(key).toHaveValue('abc12'); // not hex: dropped
  await expect(msg).toHaveText('32文字以上（0〜9とa〜f）のキーです。届いたリンクを開くと自動で入ります');
  await expect(go).toHaveAttribute('aria-disabled', 'true');
  await key.fill('0123456789abcdef0123456789abcdef');
  await expect(msg).toHaveText('');
  await expect(go).toHaveAttribute('aria-disabled', 'false');
  await expect(go).toHaveCSS('outline-style', 'none');
});
