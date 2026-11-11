// The rooms in the specs: a room's engine drawing (the tent's, the homes', the shop's and the museum's test hooks:
// window.__tent / __shop / __museum, each with stats().frames).
import type { Page } from './fixtures.ts';

export type Room = 'tent' | 'shop' | 'museum';

/** The room's engine up and past `frames` frames (0: its first). */
export const roomUp = (page: Page, room: Room, { frames = 0, timeout = 30_000 }: { frames?: number; timeout?: number } = {}) =>
  page.waitForFunction(([h, n]) => ((window as unknown as Record<string, { stats(): { frames: number } | undefined } | undefined>)[h]?.stats()?.frames ?? 0) > n, [`__${room}`, frames] as const, { timeout });
