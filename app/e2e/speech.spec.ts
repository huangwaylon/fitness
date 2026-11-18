// The speech test (docs/speech-test.md): reached from English Study's すごろく tab (the new game's screen), its sentences
// stepped through to 自由に話す and round, ‹ back to the tab. The mic and the relay aren't driven here: the demo has no
// key, so 録音 is off with its note. The logic tier.
import { expect, test } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

test('the speech test: from すごろく, its sentences, back to the tab', async ({ page }) => {
  await page.goto('?demo');
  await islandUp(page);
  await fromMenu(page, 'english');
  await page.locator('dialog[open] [data-en-tab="game"]').click();
  await page.locator('[data-sugoroku] [data-sg-new]').click();
  await page.locator('[data-sugoroku] [data-sg-speech]').click();

  const sp = page.locator('[data-speech]');
  await expect(sp).toBeVisible();
  await expect(page).toHaveURL(/\/speech\?demo/);
  await expect(sp.locator('[data-speech-at]')).toHaveAttribute('data-speech-at', '0');
  await expect(sp.locator('[data-speech-mic]')).toHaveAttribute('aria-disabled', 'true');
  await sp.getByRole('button', { name: '前の文' }).click();
  await expect(sp.locator('[data-speech-at]')).toHaveAttribute('data-speech-at', 'free');
  await sp.getByRole('button', { name: '次の文' }).click();
  await expect(sp.locator('[data-speech-at]')).toHaveAttribute('data-speech-at', '0');

  await sp.getByRole('button', { name: '戻る' }).click();
  await expect(page.locator('[data-sugoroku]')).toBeVisible();
});
