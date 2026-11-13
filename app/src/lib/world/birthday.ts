// Birthdays on the island (docs/design.md "Birthdays"), after NH: on one of our birthdays (config/rules.ts PEOPLE, 'MM-DD',
// null = off) a cake stands by the centre stage, both villagers wear party hats, confetti bursts the first time the
// island opens that day, しずえ wishes a happy birthday, a tap on the cake plays a little music box and blows out its
// candles, and a party popper goes off when the birthday person meets a goal. An NH villager's own birthday (the roster's,
// villagers/birthdays.ts) puts a hat on that villager and a birthday line in its chats. Pure. No ベル.
import { PEOPLE } from '#lib/config/rules.ts';
import type { PersonId } from '#lib/types.ts';
import { SCENE } from '#lib/sync/storage.ts';
import { dayRecord } from './dayRecord.ts';

const leap = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Whether a birthday ('MM-DD') falls on a date (YYYY-MM-DD): Feb 29 is kept on Feb 28 in other years. */
export function isBirthday(md: string | null | undefined, date: string): boolean {
  if (!md) return false;
  const today = date.slice(5);
  if (md === '02-29' && !leap(Number(date.slice(0, 4)))) return today === '02-28';
  return today === md;
}

/** Whose birthday it is on a date (A, B, both or none), from the people config. */
export const birthdaysOn = (date: string, people: Record<PersonId, { birthday: string | null }> = PEOPLE): PersonId[] =>
  (['A', 'B'] as const).filter((p) => isBirthday(people[p].birthday, date));

/** Whose birthday the scene shows on a date: the seasonal preview's `event` (`birthday-A|B`) or the real ones. */
export const birthdaysShown = (date: string, event: string | null): PersonId[] =>
  event === 'birthday-A' ? ['A'] : event === 'birthday-B' ? ['B'] : birthdaysOn(date);

/** The party hat each person's villager wears (NH's birthday hats: mine pink, the partner's blue). */
export const HATS = { mine: 'deco/birthday-hat-pink', partner: 'deco/birthday-hat-blue' } as const;

const day = dayRecord(SCENE.birthday, { confetti: false, candles: false });
/** The birthday's confetti on this phone: true the first time (it then won't burst again that day). */
export function firstConfetti(date: string): boolean {
  if (day.read(date).confetti) return false;
  day.patch(date, { confetti: true });
  return true;
}
/** The cake's candles are out on this phone today. */
export const candlesOut = (date: string): boolean => day.read(date).candles;
export const blowOut = (date: string): void => day.patch(date, { candles: true });
