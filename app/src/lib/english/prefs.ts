// English Study's choices on this phone (docs/english.md "The page"): むずかしめの質問を増やす (⚙; off by default: it
// only lets the native tier into a first play, draw.ts), 場面のあらすじ's line and 字幕の大きさ (字幕's sheet;
// shown, and 大, by default), and the clips 別の動画にする passed over, each for SKIP_DAYS
// (today's clip skips them; never a lock: the library still opens them).
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { perPlayer } from './per-player.ts';
import { daysBetween } from '#lib/time/dates.ts';
import type { LocalDate, Who } from '#lib/types.ts';

export const harderOn = (): boolean => readJson<boolean>(localKV(), DEVICE.englishHard) === true;
export const setHarder = (on: boolean): void => void writeJson(localKV(), DEVICE.englishHard, on);
/** 場面のあらすじ's strip under the player (the lesson's あらすじ chip; shown by default). */
export const scenesOn = (): boolean => readJson<boolean>(localKV(), DEVICE.englishScenes) !== false;
export const setScenes = (on: boolean): void => void writeJson(localKV(), DEVICE.englishScenes, on);
/** 字幕の大きさ 小 / 中 / 大 / 特大: YouTube's captions fontSize (−1 … 3 accepted; 0 its default). */
export const CC_SIZES = [-1, 0, 1, 2] as const;
export type CcSize = (typeof CC_SIZES)[number];
/** 字幕の大きさ (YouTube's captions fontSize; 大 by default: the user found YouTube's own small). */
export function ccSizeOf(): CcSize {
  const n = readJson<number>(localKV(), DEVICE.englishCcSize);
  return (CC_SIZES as readonly unknown[]).includes(n) ? (n as CcSize) : 1;
}
export const setCcSize = (n: CcSize): void => void writeJson(localKV(), DEVICE.englishCcSize, n);

/** How long a skip lasts, days. */
export const SKIP_DAYS = 14;
/** The most kept a player (the oldest go). */
const SKIP_MAX = 50;
type Skips = Record<string, LocalDate>;

/** The skips still on `today` (`all`: clip → the day it was skipped). */
export const liveSkips = (all: Skips, today: LocalDate): Set<string> =>
  new Set(Object.keys(all).filter((id) => { const n = daysBetween(all[id], today); return n >= 0 && n < SKIP_DAYS; }));

/** `all` with `clip` skipped on `today`: the lapsed dropped, the newest SKIP_MAX kept. */
export function withSkip(all: Skips, clip: string, today: LocalDate): Skips {
  const live = liveSkips(all, today);
  const kept = Object.entries(all).filter(([id]) => live.has(id) && id !== clip).sort((a, b) => (a[1] < b[1] ? 1 : -1)).slice(0, SKIP_MAX - 1);
  return Object.fromEntries([[clip, today], ...kept]);
}

const skips = perPlayer<Skips>(DEVICE.englishSkip);
export const skipsOf = (who: Who, today: LocalDate): Set<string> => liveSkips(skips.get(who) ?? {}, today);
export const skip = (who: Who, clip: string, today: LocalDate): void => skips.set(who, withSkip(skips.get(who) ?? {}, clip, today));
