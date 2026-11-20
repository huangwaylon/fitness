// いつもの's own update said once (Food.svelte, fresh.ts repeatPlan): the new repeat's row says 「11/20から新しい値で
// 記録します」 (its first day) on the day it was made, on this phone, till tapped. Kept in DEVICE.foodRepAuto.
import type { LocalDate } from '#lib/types.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';

type Notes = Record<string, [LocalDate, LocalDate]>;

const read = (): Notes => {
  const n = readJson<unknown>(localKV(), DEVICE.foodRepAuto);
  return n && typeof n === 'object' && !Array.isArray(n) ? (n as Notes) : {};
};
/** The notes of `today` only (an older one's day is over). */
const todays = (n: Notes, today: LocalDate): Notes =>
  Object.fromEntries(Object.entries(n).filter(([, v]) => Array.isArray(v) && v[0] === today && typeof v[1] === 'string'));

/** Repeat `id` was made by itself today, its first day `from`. */
export function noteAuto(id: string, today: LocalDate, from: LocalDate): void {
  writeJson(localKV(), DEVICE.foodRepAuto, { ...todays(read(), today), [id]: [today, from] });
}

/** The first day to say for repeat `id` (made by itself today), or null. */
export function autoNote(id: string, today: LocalDate): LocalDate | null {
  return todays(read(), today)[id]?.[1] ?? null;
}

/** Repeat `id`'s note tapped away. */
export function dismissNote(id: string, today: LocalDate): void {
  const { [id]: _gone, ...rest } = todays(read(), today);
  writeJson(localKV(), DEVICE.foodRepAuto, rest);
}
