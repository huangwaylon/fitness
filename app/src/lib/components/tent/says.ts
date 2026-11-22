// What my villager says at a room's piece outdoors too (the world's copy, the rooms' strings): a clock's line
// (toggles.ts clockLine: the Tokyo time on the scene clock, `?date` too), a toss's, a look into a shed. Its own module
// so the island loads it, and the rooms' strings, only when such a piece outdoors is tapped.
import '#lib/i18n/rooms.ts';
import { t } from '#lib/i18n/index.ts';
import { jst } from '#lib/time/clock.ts';
import { clockLine } from './toggles.ts';

export const tossLine = (n: number): string => t(`tent.toss.${n % 3}`);
export const peekLine = (inside: string, n: number): string => t(`tent.peek.${inside}.${n % 3}`);

export function timeLine(): string {
  const { hour, minute } = jst(), l = clockLine(hour, minute);
  return t(`tent.clock.${l.key}`, { h: l.h, m: l.m, mm: l.mm });
}
