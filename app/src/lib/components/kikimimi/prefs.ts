// ききみみ クイズ's lobby settings remembered on this phone (docs/kikimimi.md "Storage"): the level last played and こたえる
// じかん last set, the next lobby's. Full or private storage: level 1 and 30 s.
import type { Level } from '#lib/kikimimi/bank.ts';
import { LEVELS } from '#lib/kikimimi/deck.ts';
import { TIMERS, type QuizTimer } from '#lib/kikimimi/seed.ts';
import { DEVICE, localKV } from '#lib/sync/storage.ts';

function keep(key: string, value: number): void {
  try {
    localKV()?.setItem(key, String(value));
  } catch {
    /* full or private: the default next time */
  }
}

/** The level last played on this phone (the next lobby's; level 1 by default). */
export const lastLv = (): Level => {
  const n = Number(localKV()?.getItem(DEVICE.kikimimiLv));
  return LEVELS.find((lv) => lv === n) ?? 1;
};
export const keepLv = (lv: Level): void => keep(DEVICE.kikimimiLv, lv);

/** こたえる じかん last set on this phone (the next lobby's; 30 s by default). */
export const lastTimer = (): QuizTimer => {
  const raw = localKV()?.getItem(DEVICE.kikimimiTimer);
  return TIMERS.find((x) => raw !== null && raw !== undefined && x === Number(raw)) ?? 30;
};
export const keepTimer = (timer: QuizTimer): void => keep(DEVICE.kikimimiTimer, timer);
