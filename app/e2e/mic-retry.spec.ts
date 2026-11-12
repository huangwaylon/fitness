// A refused mic's way back (lib/mic/retry.ts, docs/kikimimi-mic.md "A refused mic"), in Chromium and WebKit: a
// getUserMedia shim refuses while the test says so, else hands back an empty stream; nothing captured or played.
// 設定's switch and the probe's permission step each offer 「もう一度試す」, which reloads the app back to that step,
// where the next tap asks afresh.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet } from './kikimimi-nav.ts';

/** The shim: getUserMedia counted, refused while the binding says so, else an empty stream. On the prototype: WebKit
 *  may collect navigator.mediaDevices' wrapper, and a property set on it with it. */
function install() {
  const w = window as unknown as { __asks: number; __micRefused: () => Promise<boolean> };
  w.__asks = 0;
  MediaDevices.prototype.getUserMedia = async () => {
    w.__asks++;
    if (await w.__micRefused()) throw new DOMException('refused', 'NotAllowedError');
    return new MediaStream();
  };
}

/** The shim on every load; `refuse(on)` sets whether it refuses. */
async function shim(page: Page) {
  let refusing = false;
  await page.exposeFunction('__micRefused', () => refusing);
  await page.addInitScript(install);
  return (on: boolean) => void (refusing = on);
}

async function toSettings(page: Page) {
  await page.goto('?demo&date=2026-11-04T12:00&kikimimi=fast');
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await page.locator('dialog[open] [data-kiki-gear]').click();
}

/** 「もう一度試す」 (the refusal lifted, as after allowing it in Settings): the app reloads back to the step. The sheet
 *  opened without a tap, so its voice may wait on 「タップして続ける」 (always on a phone): a tap on the hint, whatever
 *  is on top (the veil, or the hint: any tap wakes the voice), and the veil gone. */
async function retry(page: Page, refuse: (on: boolean) => void) {
  refuse(false);
  const loaded = page.waitForEvent('load');
  await sheet(page).locator('[data-mic-retry]').first().click();
  await loaded;
  await islandUp(page);
  const hint = sheet(page).locator('[data-mic-retried]');
  await expect(hint).toBeVisible();
  const box = (await hint.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('[data-kiki-resume]')).toHaveCount(0);
}

const asks = (page: Page) => page.evaluate(() => (window as unknown as { __asks: number }).__asks);

test("設定's switch refused: 「もう一度試す」 reloads back to it, and the next tap asks afresh", async ({ page }) => {
  const refuse = await shim(page);
  refuse(true);
  await toSettings(page);
  const optin = sheet(page).locator('[data-mic-optin]');
  await optin.locator('[data-mic-switch]').click();
  await expect(optin.locator('[data-mic-refused]')).toHaveAttribute('data-mic-refused', 'denied');
  await expect(optin.locator('[data-mic-refused]')).toContainText('もう一度試す');

  await retry(page, refuse);
  // back in ききみみ's 設定, the note let go, nothing asked by itself
  const back = sheet(page).locator('[data-mic-optin]');
  await expect(back.locator('[data-mic-retried]')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('island.micRetry'))).toBeNull();
  expect(await asks(page)).toBe(0);
  await back.locator('[data-mic-switch]').click();
  await expect(back.locator('[data-mic-switch]')).toHaveAttribute('aria-checked', 'true');
  expect(await asks(page)).toBe(1);
  await expect(back.locator('[data-mic-refused]')).toHaveCount(0);
});

test("the probe's permission refused: 「もう一度試す」 reloads back to that step", async ({ page }) => {
  const refuse = await shim(page);
  refuse(true);
  await toSettings(page);
  await sheet(page).locator('[data-kiki-set-mic]').click();
  const probe = sheet(page).locator('[data-mic-probe]');
  await probe.locator('[data-mic-start]').click();
  await expect(probe.locator('[data-mic-env]')).toBeVisible();
  await probe.locator('[data-mic-next]').click();
  await probe.locator('[data-mic-allow]').click();
  await expect(probe.locator('[data-mic-perm]')).not.toHaveAttribute('data-mic-perm', 'granted');

  await retry(page, refuse);
  const back = sheet(page).locator('[data-mic-probe]');
  await expect(back).toHaveAttribute('data-mic-phase', 'perm');
  await expect(back.locator('[data-mic-retried]')).toBeVisible();
  await back.locator('[data-mic-allow]').click();
  await expect(back.locator('[data-mic-perm]')).toHaveAttribute('data-mic-perm', 'granted');
  await expect(back.locator('[data-mic-retry]')).toHaveCount(0);
});

test('a stale note is let go: the app opens as usual', async ({ page }) => {
  await shim(page);
  await page.addInitScript(() => sessionStorage.setItem('island.micRetry', JSON.stringify({ step: 'optin', at: Date.now() - 10 * 60_000 })));
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandUp(page);
  await expect(page.locator('dialog[open] [data-mic-optin]')).toHaveCount(0);
});
