// The overlap checker (e2e/overlap.ts): (1) it finds each kind of fault on a
// page built for it, and stays quiet on the deliberate patterns (a card's stretched hit, a pill's rounded corners, a
// FAB over a list that scrolls on, an ellipsis); (2) the guard: the island's HUD, the menu and the sheets a person opens
// most, at an iPhone 15 / 16's 393×852 with its safe areas and at 393×659 (Safari's toolbar showing), clean. Taps in
// WebKit. The map screens join once they're migrated (the helper's header says how).
import { expect, test } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, openKenkou, unfoldMenu } from './hud.ts';
import { IPHONE, SAFARI_BAR, describe, insets, noOverlaps, overlaps, settle } from './overlap.ts';

test.describe('the checker', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('finds each fault', async ({ page }) => {
    await page.setContent(`<meta name="viewport" content="width=device-width"><body style="margin:0;font:16px sans-serif">
      <button style="position:absolute;left:20px;top:100px;width:120px;height:44px">under</button>
      <div style="position:absolute;left:60px;top:90px;width:120px;height:60px;background:#eee">lid</div>
      <div style="position:absolute;left:200px;top:100px;width:90px;height:30px;overflow:hidden;white-space:nowrap">a long line of text cut off</div>
      <div style="position:fixed;left:20px;top:300px;width:150px;height:40px;background:#fee">toast</div>
      <div style="position:fixed;left:100px;top:320px;width:150px;height:40px;background:#efe">legend</div>
      <button style="position:absolute;left:20px;top:420px;width:30px;height:30px;padding:0">s</button>
      <button style="position:absolute;left:20px;top:830px;width:200px;height:20px">home bar</button>
      <p style="position:absolute;left:20px;top:500px;margin:0">covered note</p>
      <span style="position:absolute;left:10px;top:495px;width:200px;height:30px;background:#ccc"></span>
    </body>`);
    const is = await overlaps(page, { insets: IPHONE });
    const has = (check: string, text: string) => expect(is.some((i) => i.check === check && i.text.startsWith(text)), `${check} ${text}\n${describe(is)}`).toBe(true);
    has('hit', 'under');
    has('clip', 'a long line');
    has('layers', 'toast');
    has('target', 's');
    has('safe', 'home bar');
    has('covered', 'covered note');
  });

  test('quiet on the deliberate patterns', async ({ page }) => {
    await page.setContent(`<meta name="viewport" content="width=device-width"><body style="margin:0;font:16px sans-serif">
      <div style="position:relative;margin:80px 20px;width:300px;height:120px;border-radius:20px;background:#eee">
        <h4 style="margin:0;padding:12px">a card's title</h4>
        <button aria-label="open" style="position:absolute;inset:0;z-index:1;background:none;border:0;border-radius:inherit"></button>
      </div>
      <button style="display:block;margin:20px;width:160px;height:44px;border-radius:22px;border:0">a pill</button>
      <div style="margin:20px;width:120px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">an ellipsis meant here</div>
      <div id="list" style="position:absolute;left:0;right:0;top:400px;height:300px;overflow:auto">
        ${Array.from({ length: 20 }, (_, i) => `<button style="display:block;width:100%;height:48px">row ${i}</button>`).join('')}
      </div>
      <button style="position:absolute;right:16px;top:640px;width:48px;height:48px;border-radius:24px">＋</button>
    </body>`);
    expect(await overlaps(page, { insets: IPHONE }), describe(await overlaps(page, { insets: IPHONE }))).toEqual([]);
    // at the list's end its last rows must clear the FAB: here they don't, and it says so
    await page.locator('#list').evaluate((l) => (l.scrollTop = l.scrollHeight));
    expect((await overlaps(page, { insets: IPHONE })).some((i) => i.check === 'hit' && i.other?.includes('button'))).toBe(true);
  });
});

// (each group its own boot: one test for all ran past the 30 s)
// (and a level each where a fix landed: 結婚式's ＋ form and its 設定's categories, the closet's colour row)
const GROUPS = [['hud'], ['bells', 'travel', 'wedding'], ['hiking', 'todo', 'settings'], ['health', 'food'], ['wedding form', 'wedding categories'], ['closet'], ['trail', 'trail layers']] as const;
for (const [h, ins] of [[852, IPHONE], [659, SAFARI_BAR]] as const) {
  test.describe(`the guard at 393×${h}`, () => {
    test.use({ viewport: { width: 393, height: h } });
    for (const group of GROUPS)
      test(group.join(' · '), async ({ page }, info) => {
        const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
        await insets(page, ins);
        await page.goto('?demo&date=2026-11-04T12:00&critter=none&visitor=none');
        await islandUp(page);
        const clean = async () => {
          await settle(page);
          await noOverlaps(page, { insets: ins });
        };
        for (const s of group) {
          if (s === 'hud') {
            await clean();
            await unfoldMenu(page, how);
            await clean();
          } else if (s === 'wedding form') {
            await fromMenu(page, 'wedding', how);
            await page.locator('dialog[open] [data-wed-add]')[how]();
            await expect(page.locator('dialog[open] [data-wed-cat-pick]').first()).toBeVisible();
            await clean();
            await page.keyboard.press('Escape');
            await expect(page.locator('dialog[open]')).toHaveCount(1);
          } else if (s === 'wedding categories') {
            await page.locator('dialog[open] [data-wed-tab=settings]')[how]();
            await expect(page.locator('dialog[open] [data-wed-cat-remove]').first()).toBeVisible();
            await clean();
          } else if (s === 'closet') {
            await fromMenu(page, 'settings', how);
            await page.locator('dialog[open] [data-push=look]')[how]();
            await page.locator('dialog[open] [data-look-tab=wear]')[how]();
            await expect(page.locator('dialog[open] [data-hue]').first()).toBeVisible();
            await clean();
          } else if (s === 'trail') {
            // a Japan trail (its OSM layer in the panel): the map's controls, the peek, the line key
            await fromMenu(page, 'hiking', how);
            await page.locator('dialog[open] [data-trail="kinpu-odarumi"]')[how]();
            await expect(page.locator('dialog[open] [data-trail-view] [data-elev]')).toBeVisible();
            await expect(page.locator('dialog[open] [data-trail-view] [data-map-layers]')).toBeVisible();
            await clean();
          } else if (s === 'trail layers') {
            await page.locator('dialog[open] [data-trail-view] [data-map-layers]')[how]();
            await expect(page.locator('dialog[open] [data-trail-view] [data-map-layer]').first()).toBeVisible();
            await clean();
          } else if (s === 'health') {
            await openKenkou(page, s, how);
            await clean();
          } else if (s === 'food') {
            // (the same sheet's other tab)
            await page.locator('dialog[open] [data-kenkou-tab=food]')[how]();
            await expect(page.locator('dialog[open] [data-food-summary]')).toBeVisible();
            await clean();
          } else {
            await fromMenu(page, s, how);
            await clean();
            await page.keyboard.press('Escape');
            await expect(page.locator('dialog[open]')).toHaveCount(0);
          }
        }
      });
  });
}
