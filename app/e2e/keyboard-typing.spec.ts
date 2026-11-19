// Typing with the keyboard up (iOS's, simulated: e2e/keyboard.ts) in English Study and 英語すごろく: the field being
// typed in and its button (答える, これでOK) lie in the visible part above the keyboard (withKeyboardInset lifts the
// sheet or screen when its scroller can't bring them up: a lesson's title bar, video and controls fill most of it).
// At the Playwright phones' 393×659 and at 375×667, in WebKit with taps too (`--project webkit`).
//   SHOTS=<dir> npm run e2e -- keyboard-typing      also writes the screens with the keyboard up to <dir>/kbd-*.png
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { fakeYoutube } from './youtube.ts';
import { KEYBOARD_PX, aboveKeyboard, fakeKeyboard, keyboard } from './keyboard.ts';
import { RELAY } from './relay.ts';
import { waitress } from '../src/lib/english/clips/waitress.ts';
import { CLIPS } from '../src/lib/english/clips/index.ts';
import { planOf } from '../src/lib/english/plan.ts';
import { PINNED_DATE } from './fixtures.ts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PLAN = planOf(CLIPS);
/** The clips planned before the waitress's, skipped for today so hers is today's. */
const AHEAD = PLAN.slice(0, PLAN.findIndex((c) => c.id === waitress.id)).map((c) => c.id);
/** A game at A's 絵 stone (e2e/sugoroku-speak.spec.ts). */
const AT_PICTURE: unknown = JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures/sugoroku-picture.json'), 'utf8'));

test.use({ hasTouch: true });

/** Both boxes wholly in the visible part above the keyboard. */
async function expectAbove(page: Page, ...sels: string[]) {
  for (const sel of sels) await expect.poll(async () => (await aboveKeyboard(page, sel)).ok, { message: sel }).toBe(true);
}

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/kbd-${name}-${page.viewportSize()!.height}.png` });
};

for (const size of [{ width: 393, height: 659 }, { width: 375, height: 667 }]) {
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: size });

    test('English Study: a dictation’s field and 答える above the keyboard, back in place once it’s down', async ({ page }) => {
      await fakeKeyboard(page);
      await fakeYoutube(page);
      await page.addInitScript(([ids, on]) => {
        const day = Object.fromEntries(ids.map((id) => [id, on]));
        localStorage.setItem('island.english.skip', JSON.stringify({ A: day, B: day, G: day }));
      }, [AHEAD, PINNED_DATE.slice(0, 10)] as const);
      await page.goto('?demo');
      await islandUp(page);
      await fromMenu(page, 'english');
      const lesson = page.locator('dialog[open] [data-en-lesson]');
      await page.locator('dialog[open] [data-en-start]').tap();
      await expect(lesson.locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'ready');
      await lesson.locator('[data-en-to-q]').tap();
      // on to a dictation (the draw's order is the play's)
      for (let i = 0; !(await lesson.locator('[data-en-dict]').count()); i++) {
        expect(i).toBeLessThan(20);
        await lesson.locator('[data-en-next]').tap();
      }
      const field = lesson.locator('[data-en-dict]');
      await field.tap();
      await expect(field).toBeFocused();
      await keyboard(page, KEYBOARD_PX);
      await expectAbove(page, 'dialog[open] [data-en-dict]', 'dialog[open] [data-en-dict-go]');
      await page.keyboard.type('more coffee');
      await expect(field).toHaveValue('more coffee');
      await expectAbove(page, 'dialog[open] [data-en-dict]', 'dialog[open] [data-en-dict-go]');
      await shot(page, 'english');
      // 前へ / 次へ hidden while it's up (the room above it the question's)
      await expect(lesson.locator('[data-en-next]')).toBeHidden();
      // 答える tapped with the keyboard still up: the answer shown, the field let go (iOS then drops its keyboard)
      await lesson.locator('[data-en-dict-go]').tap();
      await expect(lesson.locator('[data-en-reveal]')).toBeVisible();
      await expect(field).not.toBeFocused();
      // the keyboard down: the sheet back in place (its title bar at the top), 前へ / 次へ back
      await keyboard(page, 0);
      await expect.poll(() => page.locator('dialog[open]').evaluate((d) => Math.round(d.getBoundingClientRect().top))).toBe(0);
      await expect(lesson.locator('[data-en-next]')).toBeVisible();
      // again by Return: the field focused, the keyboard up, Return answers and lets go
      await field.tap();
      await keyboard(page, KEYBOARD_PX);
      await page.keyboard.type(' please');
      await expect(field).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(field).not.toBeFocused();
    });

    test('すごろく: 文を打つ’s field and これでOK above the keyboard', async ({ page }) => {
      await fakeKeyboard(page);
      await page.addInitScript((game) => {
        localStorage.setItem('island.key', 'ab'.repeat(16));
        localStorage.setItem('island.sugoroku', JSON.stringify(game));
      }, AT_PICTURE);
      await page.routeWebSocket(/\/room/, () => {});
      await page.route(`${RELAY}/**`, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }));
      await page.goto('sugoroku?m=local&demo&speak=1');
      const s = page.locator('[data-sugoroku]');
      await expect(s.locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', 'picture');
      await s.locator('[data-sg-choice="apple"]').tap();
      await s.locator('[data-sg-type]').tap();
      await expect(s.locator('[data-sg-said]')).toBeFocused();
      await keyboard(page, KEYBOARD_PX);
      await expectAbove(page, '[data-sg-said]', '[data-sg-ok]');
      await page.keyboard.type('I eat a red apple.');
      await expectAbove(page, '[data-sg-said]', '[data-sg-ok]');
      await shot(page, 'sugoroku');
      await keyboard(page, 0);
      await expect.poll(() => page.locator('.screen').evaluate((d) => Math.round(d.getBoundingClientRect().top))).toBe(0);
    });
  });
}
