// The visitors' life (docs/design.md "Visitors: life"): every visitor breathes and shifts (its idle rig's transform
// changes over time), Gulliver sleeps face down until the fifth nudge, the ones who roam stroll and come back to their
// spot before a line (the balloon anchors to them there), they arrive and leave, and a villager comes over to say hello.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });
const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
async function tapOn(page: Page, sel: string, fy = 0.5) {
  const r = (await page.locator(sel).boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height * fy);
}
/** The idle rig's live transform (its breath, weight shift and signature loop) and the body's motion. */
const rig = (page: Page, id: string) =>
  page.locator(`[data-visitor="${id}"] .idle`).evaluate((e) => {
    const s = getComputedStyle(e);
    return `${s.scale}|${s.rotate}|${s.translate}|${s.transform}|${s.opacity}`;
  });
const NIGHT = new Set(['wisp', 'celeste', 'kk-slider', 'jack']);

for (const id of ['kk-slider', 'daisy-mae', 'wisp', 'gulliver', 'jack', 'celeste', 'franklin', 'jingle', 'pave', 'zipper', 'reese'])
  test(`${id}: alive on centre stage (breathing, its own loop, a shadow that breathes with it)`, async ({ page }) => {
    await page.goto(`?demo&date=2026-11-04T${NIGHT.has(id) ? '21' : '12'}:00&visitor=${id}&critter=none`);
    await expect(ribbon(page)).toBeVisible();
    const v = page.locator(`[data-visitor="${id}"]`);
    await expect(v).toHaveAttribute('data-phase', 'here', { timeout: 3000 });
    await expect(v.locator('.idle')).toHaveCount(1);
    const anim = await v.locator('.idle').evaluate((e) => getComputedStyle(e).animationName);
    expect(anim).toMatch(/breathe|snore/);
    expect(await v.locator('.shade').evaluate((e) => getComputedStyle(e).animationName)).not.toBe('none');
    const a = await rig(page, id);
    await page.waitForTimeout(650);
    const b = await rig(page, id);
    expect(b).not.toBe(a);
    if (id === 'gulliver') await expect(v).toHaveAttribute('data-asleep', 'lie');
  });

test('Gulliver sleeps face down until the fifth nudge (NH), then stands and introduces himself', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=gulliver&critter=none');
  await expect(ribbon(page)).toBeVisible();
  const g = page.locator('[data-visitor="gulliver"]');
  await expect(g).toHaveAttribute('data-asleep', 'lie');
  await expect(g.locator('.fxa.zzz')).toHaveCount(1);
  await tapOn(page, '[data-visitor="gulliver"] .art');
  await page.waitForTimeout(1100); // my villager walks over
  for (let i = 1; i < 5; i++) {
    if (i > 1) await tapOn(page, '[data-visitor="gulliver"] .art');
    await expect(g.locator('[data-mumble]')).toBeVisible();
    await expect(g).toHaveAttribute('data-asleep', 'lie');
    await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
    await page.waitForTimeout(250);
  }
  await tapOn(page, '[data-visitor="gulliver"] .art');
  await expect(g).not.toHaveAttribute('data-asleep', /./);
  await expect(g.locator('.fxa.zzz')).toHaveCount(0);
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box.locator('.who')).toHaveText('ジョニー');
  await expect(box).toHaveAttribute('data-pages', '2');
});

test('a stroll, and back on her spot before a line: the balloon anchors next to her', async ({ page }) => {
  await page.goto('?demo&date=2026-11-01T08:00&critter=none&stroll'); // Sunday morning: Daisy Mae
  await expect(ribbon(page)).toBeVisible();
  const v = page.locator('[data-visitor="daisy-mae"]');
  const home = await v.evaluate((e) => getComputedStyle(e).translate);
  // off on a stroll and standing somewhere else
  await expect.poll(() => v.evaluate((e) => getComputedStyle(e).translate), { timeout: 8000 }).not.toBe(home);
  await expect(v).not.toHaveClass(/walking/, { timeout: 4000 });
  // a tap on her where she stands now: she walks back, turns to my villager, then speaks
  await tapOn(page, '[data-visitor="daisy-mae"] .art');
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box.locator('.who')).toHaveText('ウリ', { timeout: 4000 });
  expect(await v.evaluate((e) => getComputedStyle(e).translate)).toBe(home);
  const a = (await v.locator('.art').boundingBox())!, b = (await box.boundingBox())!;
  // by her: over her column, above (or below) her, as close as the controls around centre stage allow (placement.ts)
  expect(b.x < a.x + a.width && a.x < b.x + b.width).toBe(true);
  expect(Math.min(Math.abs(b.y + b.height - a.y), Math.abs(b.y - (a.y + a.height)))).toBeLessThan(200);
});

test('arriving: up from the shore on foot (?arrive); leaving when the visit ends (?leave)', async ({ page }) => {
  await page.goto('?demo&date=2026-11-01T08:00&critter=none&arrive&leave=7000');
  const v = page.locator('[data-visitor="daisy-mae"]');
  await expect(v).toHaveAttribute('data-phase', 'arrive');
  await expect(v).toHaveClass(/walking/);
  await expect(v).toHaveAttribute('data-phase', 'here', { timeout: 6000 });
  await expect(v).toHaveAttribute('data-phase', 'leave', { timeout: 6000 });
  await expect(v).toHaveClass(/walking/);
  await expect(page.locator('[data-visitor]')).toHaveCount(0, { timeout: 8000 });
});

for (const [id, way] of [['wisp', 'float'], ['celeste', 'fly'], ['jack', 'spook'], ['kk-slider', 'appear']] as const)
  test(`${id} arrives and leaves by ${way}`, async ({ page }) => {
    await page.goto(`?demo&date=2026-11-04T21:00&visitor=${id}&critter=none&arrive&leave=4000`);
    const v = page.locator(`[data-visitor="${id}"]`);
    await expect(v).toHaveAttribute('data-way', way);
    await expect(v).toHaveAttribute('data-phase', 'arrive');
    await expect(v).toHaveAttribute('data-phase', 'here', { timeout: 4000 });
    await expect(v).toHaveAttribute('data-phase', 'leave', { timeout: 4000 });
    await expect(page.locator('[data-visitor]')).toHaveCount(0, { timeout: 4000 });
  });

test('a villager comes over to say hello: they face each other, the visitor answers with an emote', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=jingle&critter=none&meet');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('[data-actor="partner"].walking')).toBeAttached({ timeout: 6000 });
  await expect(page.locator('[data-visitor="jingle"] .emote')).toBeAttached({ timeout: 6000 });
  // close by, not on them: the partner's feet a step from the visitor's, the visitor's middle still theirs
  await expect(page.locator('[data-actor="partner"].walking')).toHaveCount(0);
  const r = await page.evaluate(() => {
    const p = document.querySelector('[data-actor="partner"] .vil')!.getBoundingClientRect(), v = document.querySelector('[data-visitor] .art')!.getBoundingClientRect();
    const mid = [(v.left + v.right) / 2, (v.top + v.bottom) / 2] as const;
    return { d: Math.hypot((p.left + p.right) / 2 - mid[0], p.bottom - v.bottom), over: document.elementsFromPoint(mid[0], mid[1]).some((e) => e.closest('[data-actor]')) };
  });
  expect(r.d).toBeLessThan(130);
  expect(r.over).toBe(false);
});

test('Celeste points at a falling star', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T21:00&visitor=celeste&critter=none');
  const v = page.locator('[data-visitor="celeste"]');
  await expect(v).toHaveAttribute('data-phase', 'here', { timeout: 3000 });
  await page.evaluate(() => document.querySelector('.if-scene')!.dispatchEvent(new CustomEvent('island:star', { detail: { x: 40 } })));
  await expect(v.locator('.body')).toHaveAttribute('data-act', 'point');
  await expect(v.locator('.emote')).toBeAttached();
});
