// くまのもり (docs/design.md "Kuma no mori"): the forest island's own screen. The demo's players are tabs of one browser
// (`?demo` and `?demo&as=B`) on a BroadcastChannel; A's tab hosts (the bears, the claims, the clock). Both say they're
// ready → a shared countdown → the round. A bear that sees A close by roars, catches it (down, half its basket
// dropped), and B holding the act button by A helps it up. The way in: せってい's くまのもり row.
import { expect, test, type Page } from '@playwright/test';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 390, height: 844 } });

type F = {
  me(): { x: number; z: number; st: string };
  bears(): { x: number; z: number; f: number; st: string }[];
  phase(): string;
  put(x: number, z: number): void;
  wake(): void;
};
const f = <T,>(page: Page, fn: (h: F, a: unknown) => T, a?: unknown) => page.evaluate(([src, a]) => new Function('h', 'a', `return (${src})(h, a)`)((window as unknown as { __forest: F }).__forest, a), [fn.toString(), a] as const) as Promise<T>;

async function lobby(page: Page, as = '') {
  await page.goto(`expedition?demo${as}`);
  await expect(page.locator('.lobby')).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __forest?: unknown }).__forest);
}

test('two players ready up, fly in together; a bear catches A and B helps A up', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const A = await ctx.newPage(), B = await ctx.newPage();
  await lobby(A);
  await lobby(B, '&as=B');
  // each lobby lists both
  await expect(A.locator('.who li')).toHaveCount(2);
  await expect(B.locator('.who li')).toHaveCount(2);
  await B.locator('.go').click();
  await A.locator('.go').click();
  // the shared countdown, then the round on both
  await expect.poll(() => f(A, (h) => h.phase()), { timeout: 8000 }).toBe('play');
  await expect.poll(() => f(B, (h) => h.phase()), { timeout: 8000 }).toBe('play');
  await expect(A.locator('.hud .clock')).toBeVisible();
  // a bear awake, A right in front of it: seen, roared at, caught
  await f(A, (h) => h.wake());
  await expect.poll(() => f(A, (h) => h.bears()[0].st)).not.toBe('sleep');
  const b = (await f(A, (h) => h.bears()))[0];
  await f(A, (h, b) => {
    const { x, z, f: yaw } = b as { x: number; z: number; f: number };
    h.put(x + Math.sin(yaw) * 1.6, z + Math.cos(yaw) * 1.6);
  }, b);
  await expect.poll(() => f(A, (h) => h.me().st), { timeout: 6000 }).toBe('down');
  await expect(A.locator('.downcard')).toBeVisible();
  // B sees A down (its chip), goes to A, holds act: A is up again
  await expect(B.locator('.chip')).toContainText('💫');
  const a = await f(A, (h) => h.me());
  await f(B, (h, a) => h.put((a as { x: number }).x + 0.8, (a as { z: number }).z), a);
  await expect(B.locator('.act')).toHaveClass(/on/);
  // (held: the help takes 2.5 s)
  await B.locator('.act').hover();
  await B.mouse.down();
  await expect.poll(() => f(A, (h) => h.me().st), { timeout: 6000 }).toBe('ok');
  await B.mouse.up();
  await ctx.close();
});

test('せってい has the way into the forest', async ({ page }) => {
  await page.goto('?demo');
  await fromMenu(page, 'settings');
  const go = page.locator('[data-forest]');
  await go.scrollIntoViewIfNeeded();
  await go.click();
  await expect(page).toHaveURL(/\/expedition/);
  await expect(page.locator('.lobby')).toBeVisible();
});
