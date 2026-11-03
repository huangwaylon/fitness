// Shaking a tree (docs/design.md "Shaking a tree"): one tap still opens the popup; a quick run of taps shakes the tree.
// A shake may drop a branch (a tap picks it up), a bagworm or a spider dangling on its thread (a tap nets it) or, rarely,
// a wasp nest: its wasps charge the villager on that side; a tap on them in time nets one (NH's catch line), else they
// sting (a fright, a sweat drop and NH's swollen eye on the villager's own eye). `?shake=nest|branch|bagworm|spider`
// forces the next shake's drop. Nothing changes ベル.
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { is3d, quiet } from './island.ts';
import { swollenEye, type HeadBox } from '../src/lib/villagers/heads.ts';
import { LOOKS_RIGHT } from '../src/lib/villagers/facing.ts';
import { ROSTER, type RosterId } from '../src/lib/villagers/roster.ts';

const HEADS = JSON.parse(readFileSync(new URL('../src/lib/villagers/heads.json', import.meta.url), 'utf8')) as Record<string, HeadBox>;

test.use({ viewport: { width: 390, height: 844 } });

const hudJar = (page: Page) => page.getByRole('button', { name: /^ごほうび · ふたりのベル / });
async function open(page: Page, q = '') {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await expect(hudJar(page)).toBeVisible({ timeout: 15_000 }); // (its first paint: now and then over 5 s under CI's load)
  await is3d(page); // (the 3D island up and its canopies where they'll stay: a while in software GL)
  await quiet(page); // the opening beats are over
}
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);
/** A point of the left tree's canopy the finger reaches (its middle, else the nearest part the popup leaves open). */
const canopyAt = (page: Page) =>
  page.locator('button.canopy').first().evaluate((el) => {
    const b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    for (let d = 0; d < b.height / 2; d += 4)
      for (const [dx, dy] of [[0, d], [0, -d], [d, 0], [-d, 0], [d, d], [-d, d]])
        if (document.elementFromPoint(cx + dx, cy + dy)?.closest('button.canopy') === el) return { x: cx + dx, y: cy + dy };
    return { x: cx, y: cy };
  });
async function shake(page: Page) {
  for (let i = 0; i < 3; i++) {
    const c = await canopyAt(page);
    await page.mouse.click(c.x, c.y);
    await page.waitForTimeout(120);
  }
}

test('one tap opens the popup and drops nothing; two close it; the third quick tap shakes the tree', async ({ page }) => {
  await open(page, '&shake=nest');
  let c = await canopyAt(page);
  await page.mouse.click(c.x, c.y);
  await expect(page.locator('.detail')).toBeVisible();
  await page.waitForTimeout(1300); // a run has to be quick: this starts over
  c = await canopyAt(page);
  await page.mouse.click(c.x, c.y);
  await expect(page.locator('.detail')).toHaveCount(0);
  await expect(page.locator('[data-nest]')).toHaveCount(0);
  await shake(page);
  await expect(page.locator('.detail')).toHaveCount(0); // the shake closes it
  await expect(page.locator('[data-nest]')).toHaveCount(1);
  expect(await cues(page)).toContain('tree-shake');
});

test('a nest falls; its wasps charge my villager; a tap in time nets one: NH’s line, no sting, no ベル', async ({ page }) => {
  await open(page, '&shake=nest');
  const bells = await hudJar(page).getAttribute('aria-label');
  await shake(page);
  await expect(page.locator('[data-nest]')).toHaveCount(1);
  const swarm = page.locator('button[data-swarm]');
  await expect(swarm).toBeVisible({ timeout: 2000 });
  await expect(swarm).toHaveAttribute('data-sfx', 'self');
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-nest', 'scene-buzz']));
  const b = (await swarm.boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('[data-fx="catch"]')).toContainText('ハチを つかまえた！', { timeout: 3000 });
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-net', 'scene-catch']));
  await expect(swarm).toHaveCount(0);
  await page.waitForTimeout(1800);
  await expect(page.locator('[data-stung]')).toHaveCount(0);
  await expect(page.locator('[data-nest]')).toHaveCount(0); // the nest goes once the wasps are out
  await expect(hudJar(page)).toHaveAttribute('aria-label', bells!);
  // the shared day keeps the nest (one per tree an hour, on both phones): my tree's
  const day = JSON.parse((await page.evaluate(() => localStorage.getItem('island-demo.world.A')))!) as { events: { kind: string; tree?: string; drop?: string }[] };
  expect(day.events).toContainEqual(expect.objectContaining({ kind: 'shake', tree: 'goal-A', drop: 'nest' }));
});

/** My villager's swollen eye against where heads.json puts this render's eye (mirrored with the villager's facing), as
 *  fractions of its drawn figure: { dx, dy } off, and the lump's width. */
const swellOn = (page: Page, id: string) =>
  page.locator('[data-actor="mine"]').evaluate((actor, [want, looksRight]) => {
    const lump = actor.querySelector('[data-swollen]'), body = actor.querySelector('.body');
    if (!lump || !body) return null;
    const art = body.getBoundingClientRect(), l = lump.getBoundingClientRect();
    const facing = Number(getComputedStyle(actor.querySelector('.villager')!).getPropertyValue('--facing')) || 1;
    const x = (l.left + l.width / 2 - art.left) / art.width, y = (l.top + l.height / 2 - art.top) / art.height;
    return { dx: (facing < 0 ? 1 - x : x) - want.x, dy: y - want.y, w: l.width / art.width, looksRight };
  }, [swollenEye(HEADS[id], LOOKS_RIGHT.has(id as RosterId)), LOOKS_RIGHT.has(id as RosterId)] as const);

test('too late: the wasps sting the villager on that side (a fright, a sweat drop, the swollen eye) and fly off', async ({ page }) => {
  await open(page, '&shake=nest');
  await shake(page);
  await expect(page.locator('button[data-swarm]')).toBeVisible({ timeout: 2000 });
  // the left tree's wasps go for the villager on the left, at its face where it stands
  await expect(page.locator('[data-actor="mine"][data-stung]')).toHaveCount(1, { timeout: 2500 });
  const v = (await page.locator('[data-actor="mine"] .vil').boundingBox())!, w = (await page.locator('button[data-swarm]').boundingBox())!;
  expect(Math.abs(w.x + w.width / 2 - (v.x + v.width / 2))).toBeLessThan(v.width);
  expect(await cues(page)).toContain('scene-sting');
  await expect(page.locator('button[data-swarm]')).toHaveCount(0, { timeout: 2000 });
  // NH's swollen eye on Goldie's own eye (drawn looking right: her right one), and it stays after the fright
  await expect(page.locator('[data-actor="mine"] [data-swollen]')).toHaveCount(1);
  await page.waitForTimeout(3000);
  await expect(page.locator('[data-actor="mine"] [data-stung]')).toHaveCount(0);
  const at = (await swellOn(page, 'goldie'))!;
  expect(Math.abs(at.dx)).toBeLessThan(0.02);
  expect(Math.abs(at.dy)).toBeLessThan(0.02);
  await expect(page.locator('[data-actor="partner"] [data-swollen]')).toHaveCount(0);
});

test('the swollen eye sits on the eye whatever the face: tall ears, wide heads, specials, glasses, masks, profiles', async ({ page }) => {
  test.setTimeout(90_000);
  await open(page, '&shake=nest');
  await shake(page);
  await expect(page.locator('[data-actor="mine"] [data-swollen]')).toHaveCount(1, { timeout: 4000 });
  // my villager changes while the eye is still swollen (60 s): it moves to each render's eye
  const sheet = page.locator('dialog[open]');
  await hudJar(page).click();
  await sheet.locator('.tab[data-tab=settings]').click();
  await sheet.locator('[data-push=villager]').click();
  const search = sheet.getByRole('searchbox');
  for (const id of ['raymond', 'ankha', 'dotty', 'tucker', 'blathers', 'tank', 'kk-slider', 'tom-nook', 'wisp', 'agent-s', 'daisy-mae', 'bunnie', 'hamlet', 'gulliver'] as const) {
    await search.fill(ROSTER[id].nameEn);
    await sheet.getByRole('radio', { name: ROSTER[id].nameJa, exact: true }).click();
    // (data-src: on the 3D island the 2D render waits undownloaded, characters/artGate.ts)
    await expect(page.locator(`[data-actor="mine"] img[data-src*="/villagers/${id}.webp"]`)).toHaveCount(1);
    await expect.poll(async () => Math.abs((await swellOn(page, id))?.dx ?? 1), { message: id }).toBeLessThan(0.02);
    const at = (await swellOn(page, id))!;
    expect(Math.abs(at.dy), id).toBeLessThan(0.02);
    expect(at.w, id).toBeGreaterThanOrEqual(0.09);
    expect(at.w, id).toBeLessThanOrEqual(0.27);
  }
});

test('a shaken branch lies beside the trunk until a tap picks it up', async ({ page }) => {
  await open(page, '&shake=branch');
  await shake(page);
  const twig = page.locator('button[data-branch]');
  await expect(twig).toHaveCount(1);
  await expect(twig).toHaveAttribute('aria-label', '木のえだを ひろう');
  await page.waitForTimeout(700);
  await twig.click();
  await expect(twig).toHaveCount(0);
  expect(await cues(page)).toContain('scene-twig');
  await expect(page.locator('.detail')).toHaveCount(0);
});

test('a shake drops a bagworm on its thread beside the trunk; a tap nets it (NH’s line, a ずかん find, no ベル)', async ({ page }) => {
  await open(page, '&shake=bagworm');
  const bells = await hudJar(page).getAttribute('aria-label');
  await shake(page);
  await expect(page.locator('[data-dangle="bagworm"]')).toBeAttached();
  const btn = page.locator('button[data-dangler="bagworm"]');
  await expect(btn).toHaveAttribute('data-sfx', 'self');
  await expect(btn).toHaveAttribute('aria-label', 'むしを つかまえる');
  await page.waitForTimeout(700); // down its thread
  // its tap target is its own: clear of the canopy and the fruit row
  const b = (await btn.boundingBox())!;
  const under = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('data-dangler'), { x: b.x + b.width / 2, y: b.y + b.height / 2 });
  expect(under).toBe('bagworm');
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('[data-fx="catch"]')).toContainText('ミノムシを つかまえた！', { timeout: 3000 });
  await expect(page.locator('[data-dangle]')).toHaveCount(0);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-net', 'scene-catch']));
  await expect(hudJar(page)).toHaveAttribute('aria-label', bells!);
});

test('at night a spider can dangle instead; left alone it climbs back up into the tree', async ({ page }) => {
  test.setTimeout(40_000);
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.clock.install({ time: new Date('2026-11-04T22:00:00+09:00') });
  await page.clock.resume();
  await page.goto('?demo&date=2026-11-04T22:00&shake=spider');
  await expect(hudJar(page)).toBeVisible();
  await is3d(page);
  await page.waitForTimeout(2600);
  await shake(page);
  await expect(page.locator('[data-dangle="spider"]')).toBeAttached();
  await page.clock.fastForward(11_500); // left alone (the page's clock, run on at once: its timers, not its every frame)
  await expect(page.locator('[data-dangle]')).toHaveCount(0);
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
});

/** A point low on a tap area (its base, `fy` of the way down) the finger reaches: nothing in front of it there. */
const baseOf = (page: Page, sel: string, fy = 0.85) =>
  page.locator(sel).first().evaluate((el, fy) => {
    const b = el.getBoundingClientRect(), cx = b.left + b.width / 2;
    for (let y = b.top + b.height * fy; y > b.top; y -= 3)
      for (const dx of [0, -6, 6, -12, 12])
        if (document.elementFromPoint(cx + dx, y) === el) return { x: cx + dx, y, w: b.width };
    return null;
  }, fy);

test('a goal tree’s trunk and base answer a tap as its leaves do: the popup opens, a quick run shakes it', async ({ page }) => {
  await open(page, '&shake=branch');
  const p = (await baseOf(page, '[data-tree-node="A"] .trunk-btn'))!;
  expect(p).not.toBeNull();
  expect(p.w).toBeGreaterThanOrEqual(44);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('.detail')).toBeVisible();
  await page.waitForTimeout(1300);
  for (let i = 0; i < 3; i++) {
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(120);
  }
  await expect(page.locator('.detail')).toHaveCount(0);
  await expect(page.locator('button[data-branch]')).toHaveCount(1, { timeout: 3000 });
});

test('a plain tree’s trunk and base shake it on three quick taps (≥ 44px wide); one only rustles', async ({ page }) => {
  await open(page, '&shake=branch');
  await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(380));
  await page.waitForTimeout(500);
  const sel = '[data-tree="oak-m1"][data-tree-part="trunk"]';
  const p = (await baseOf(page, sel))!;
  expect(p).not.toBeNull();
  expect(p.w).toBeGreaterThanOrEqual(44);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(1400);
  await expect(page.locator('button[data-branch]')).toHaveCount(0);
  const home = await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
  for (let i = 0; i < 3; i++) {
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(120);
  }
  await expect(page.locator('button[data-branch="oak-m1"]')).toHaveCount(1, { timeout: 3000 });
  // a tap on the tree is no walk
  expect(await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine())).toEqual(home);
  await expect(page.locator('.tap-ring')).toHaveCount(0);
});
