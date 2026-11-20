// The rooms in the specs: a room's engine drawing (the tent's, the homes', the shop's and the museum's test hooks:
// window.__tent / __shop / __museum, each with stats().frames), and the way into the tent and the homes.
import { expect, type Page } from './fixtures.ts';
import { tapOn } from './island.ts';

export type Room = 'tent' | 'shop' | 'museum';

/** The room's engine up and past `frames` frames (0: its first). */
export const roomUp = (page: Page, room: Room, { frames = 0, timeout = 30_000 }: { frames?: number; timeout?: number } = {}) =>
  page.waitForFunction(([h, n]) => ((window as unknown as Record<string, { stats(): { frames: number } | undefined } | undefined>)[h]?.stats()?.frames ?? 0) > n, [`__${room}`, frames] as const, { timeout });

/** The tent's scene at rest (window.__tent.still()). */
export const tentStill = (page: Page, timeout?: number) =>
  page.waitForFunction(() => (window as unknown as { __tent: { still(): boolean } }).__tent.still(), null, timeout ? { timeout } : {});

/** The tent's door on the island, tapped. */
export const tapTent = (page: Page) => tapOn(page, 'building', 'campsite');

/** `home`'s room (A: the tent) opened straight from its URL as `as`, at `at` (the demo, no WebGL preview), drawn. */
export async function openRoom(page: Page, as: 'A' | 'B' | 'G', home: 'A' | 'B' | 'G', at = '2026-11-04T12:00') {
  await page.goto(`tent/?demo&date=${at}&preview=0&as=${as}${home !== 'A' ? `&home=${home}` : ''}`);
  await roomUp(page, 'tent');
  await expect(page.locator(`[data-room-home="${home}"]`)).toBeVisible();
}
