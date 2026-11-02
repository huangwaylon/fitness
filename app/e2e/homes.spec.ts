// The homes (docs/island-layout.md "Homes"): うめ's house and the guest's are rooms like the tent's (the same room, its
// own pieces: `sc` u and v), each arranged by its owner alone (the tent's by all three), anyone may come in; and each
// owner changes their home's look (いえを かえる: NH's houses, the tents), which every phone's island holds live. The demo's
// players are tabs of one browser (`?demo&as=B`), as two phones over the relay.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none&preview=0';
type T = { stats(): { frames: number }; pieces(): { id: string; item: string }[]; fill(codes: string[]): number; starter(): string[] };
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;

async function openRoom(page: Page, as: 'A' | 'B' | 'G', home: 'A' | 'B' | 'G') {
  await page.goto(`tent/${Q}&as=${as}${home !== 'A' ? `&home=${home}` : ''}`);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await expect(page.locator(`[data-room-home="${home}"]`)).toBeVisible();
}

test('うめ’s house is hers to arrange: her piece stays in her room, not the tent’s; the guest comes in, sees it, can’t arrange it', async ({ context }) => {
  const b = await context.newPage();
  await openRoom(b, 'B', 'B');
  await expect(b.locator('[data-home="B"]')).toContainText('の いえ');
  await expect(b.locator('[data-tent-edit-open]')).toBeVisible();
  const n = await tent(b, (t) => t.fill([t.starter()[0]]));
  expect(n).toBe(1);
  const mine = await tent(b, (t) => t.pieces());
  // kept: her room opened again has it
  await b.reload();
  await b.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await expect.poll(() => tent(b, (t) => t.pieces().map((p) => p.id))).toEqual(mine.map((p) => p.id));
  // the tent's room is another room
  const a = await context.newPage();
  await openRoom(a, 'A', 'A');
  expect(await tent(a, (t) => t.pieces().map((p) => p.id))).not.toContain(mine[0].id);
  // the guest in うめ's house: the piece is there, nothing to arrange or switch
  const g = await context.newPage();
  await openRoom(g, 'G', 'B');
  await expect.poll(() => tent(g, (t) => t.pieces().map((p) => p.id))).toContain(mine[0].id);
  await expect(g.locator('[data-tent-edit-open]')).toHaveCount(0);
  await expect(g.locator('[data-tent-lights]')).toHaveCount(0);
  await expect(g.locator('[data-home-look]')).toHaveCount(0);
});

test('いえを かえる: うめ picks a Japanese house for hers; the other phone’s island holds the new look live; the guest’s own is the guest’s', async ({ context }) => {
  const phone = await context.newPage();
  await phone.goto(`${Q}&as=A`);
  await phone.waitForFunction(() => (window as unknown as { __layout?: unknown }).__layout);
  const look = (w: 'A' | 'B' | 'G') => phone.evaluate((w) => (window as unknown as { __layout: { home(w: string): { m: string; w?: string } } }).__layout.home(w), w);
  expect((await look('B')).m).toBe('house');
  const b = await context.newPage();
  await openRoom(b, 'B', 'B');
  await b.locator('[data-home-look]').click();
  await expect(b.locator('[data-home-picker="B"]')).toBeVisible();
  // nothing changed yet: これにする waits
  await expect(b.locator('[data-home-choose]')).toHaveAttribute('aria-disabled', 'true');
  await b.locator('[data-shape="NC"]').click();
  await b.locator('[data-home-choose]').click();
  await expect(b.locator('[data-home-picker]')).toHaveCount(0);
  await phone.bringToFront();
  await expect.poll(() => look('B').then((s) => s.w ?? '')).toMatch(/^NC/);
  // the guest changes its own house to a tent; うめ's stays hers
  const g = await context.newPage();
  await openRoom(g, 'G', 'G');
  await g.locator('[data-home-look]').click();
  await g.locator('[data-model="tent-n"]').click();
  await g.locator('[data-home-choose]').click();
  await phone.bringToFront();
  await expect.poll(() => look('G').then((s) => s.m)).toBe('tent-n');
  expect((await look('B')).w).toMatch(/^NC/);
});
