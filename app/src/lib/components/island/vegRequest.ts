// おねがい (docs/farming.md): a visitor wants a vegetable. The day's guest asks when their role is a chat or a
// cheer (visitorRoles.ts: about every other day), Franklin on Turkey Day instead (the guest doesn't then): at most one
// ask a day per person, its crop seeded by the date and the person (the same on every phone), one gift piece in
// GIFT_ONE_IN (Franklin's always). No timer: once the asker's hours or the day end, it's gone. The hand-over is a
// `sell` of the one vegetable at its price (by the visitor), the piece a find: no new rule for the record. Pure.
import { CROPS, type Crop } from '#lib/contract/farm.ts';
import { HOLIDAYS } from '#lib/time/holidays.ts';
import type { Who } from '#lib/types.ts';
import { ISLAND_SEED, dayRand } from './daySeed.ts';
import { ROLES, guestHere, guestOn, isGuest } from './visitorRoles.ts';
import type { VisitorId } from './visitors.ts';

const turkeyDay = (date: string): boolean => HOLIDAYS['turkey-day'].on(date);

/** Whether `id` asks for a vegetable on `date`: Franklin on Turkey Day, else a chat or cheer guest (never Pavé: she
 *  dances). */
export function asks(id: VisitorId, date: string): boolean {
  if (turkeyDay(date)) return id === 'franklin';
  return isGuest(id) && id !== 'pave' && (ROLES[id].kind === 'chat' || ROLES[id].kind === 'cheer');
}

/** One ask in this many brings a garden piece too (Franklin's every time). */
export const GIFT_ONE_IN = 3;

export interface VegRequest { crop: Crop; by: VisitorId; gift: boolean }

/** The day's asker by the schedule (no dev hooks): Franklin on Turkey Day, else the day's guest. */
export const askerOn = (date: string, seed = ISLAND_SEED): VisitorId => (turkeyDay(date) ? 'franklin' : guestOn(date, seed));

/** `who`'s ask on `date` (`by`: who stands there, the schedule's by default), or null: they don't ask. */
export function requestOn(date: string, who: Who, seed = ISLAND_SEED, by: VisitorId = askerOn(date, seed)): VegRequest | null {
  if (!asks(by, date)) return null;
  const r = dayRand(date, `veg-ask:${who}`, seed);
  const crop = CROPS[Math.floor(r() * CROPS.length)];
  return { crop, by, gift: by === 'franklin' || r() < 1 / GIFT_ONE_IN };
}

/** Whether the asker is on the island at this Tokyo hour (Franklin from 09:00; a guest their hours). */
export const askerHere = (by: VisitorId, hour: number, weekday: number): boolean =>
  by === 'franklin' ? hour >= HOLIDAYS['turkey-day'].from : isGuest(by) && guestHere(by, hour, weekday);

/** The garden pieces an ask's gift comes from (catalog.json ids the tent can place). */
export const GARDEN: readonly string[] = ['garden-chair', 'garden-table', 'garden-lantern', 'garden-faucet', 'hose-reel', 'garden-gnome',
  'wheat-field', 'fence', 'picnic-basket', 'potted-starter-plants', 'wall-planter'];

/** The piece `who` gets for the day's ask: a garden piece of `pool` the island hadn't found by the day's start, else
 *  any of `pool` it hadn't, the same on every phone; null: nothing left. */
export function vegGift(date: string, who: Who, pool: readonly string[], found: ReadonlySet<string>, seed = ISLAND_SEED): string | null {
  const left = pool.filter((p) => !found.has(p)), garden = GARDEN.filter((p) => left.includes(p)), from = garden.length ? garden : left;
  return from.length ? from[Math.floor(dayRand(date, `veg-gift:${who}`, seed)() * from.length)] : null;
}
