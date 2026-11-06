// ききみみ クイズ's lobby settings remembered on this phone (docs/kikimimi.md "Storage"): the level last played and こたえる
// じかん last set, the next lobby's. Full or private storage: level 1 and 30 s. And せってい's, the first run's welcome
// seen, a mode's ばしょ picked over おまかせ, the path's landmarks celebrated.
import type { Level } from '#lib/kikimimi/bank.ts';
import { LEVELS } from '#lib/kikimimi/deck.ts';
import { TIMERS, type QuizTimer } from '#lib/kikimimi/seed.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import type { ModeId } from '#lib/kikimimi/catalog.ts';
import type { Who } from '#lib/types.ts';

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

/** The weekly target in days (せってい's こんしゅうの めあて; 3 by default). */
export const WEEK_GOALS = [3, 5, 7] as const;
export type WeekGoal = (typeof WEEK_GOALS)[number];
export const weekGoal = (): WeekGoal => WEEK_GOALS.find((x) => x === Number(localKV()?.getItem(DEVICE.kikiWeekGoal))) ?? 3;
export const keepWeekGoal = (x: WeekGoal): void => keep(DEVICE.kikiWeekGoal, x);

/** 「おとを 1だいに まとめる」 for a new lobby on this phone (off by default). */
export const sameDefault = (): boolean => localKV()?.getItem(DEVICE.kikiSame) === '1';
export const keepSame = (on: boolean): void => keep(DEVICE.kikiSame, on ? 1 : 0);

/** When the Japanese shows (a reveal, the review): always, only for a miss, never. */
export const JA_MODES = ['always', 'missed', 'never'] as const;
export type JaMode = (typeof JA_MODES)[number];
export function jaMode(): JaMode {
  const raw = localKV()?.getItem(DEVICE.kikiJa);
  return JA_MODES.find((x) => x === raw) ?? 'always';
}
export function keepJa(m: JaMode): void {
  try {
    localKV()?.setItem(DEVICE.kikiJa, m);
  } catch {
    /* full or private: always next time */
  }
}

/** The first-run welcome (docs/kikimimi-ux.md §6.12) seen or put off by `who` on this phone. */
export const onboarded = (who: Who): boolean => readJson<Record<string, unknown>>(localKV(), DEVICE.kikiOnboarded)?.[who] === 1;
export function keepOnboarded(who: Who): void {
  const v = readJson<Record<string, unknown>>(localKV(), DEVICE.kikiOnboarded);
  writeJson(localKV(), DEVICE.kikiOnboarded, { ...(v && typeof v === 'object' ? v : {}), [who]: 1 });
}

/** The stages whose landmark celebration `who` has seen on this phone (しまの みち; the badge needs no flag). */
export function landmarksSeen(who: Who): string[] {
  const v = readJson<Record<string, unknown>>(localKV(), DEVICE.kikiLandmarks)?.[who];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
export function keepLandmarkSeen(who: Who, stage: string): void {
  const v = readJson<Record<string, unknown>>(localKV(), DEVICE.kikiLandmarks);
  writeJson(localKV(), DEVICE.kikiLandmarks, { ...(v && typeof v === 'object' ? v : {}), [who]: [...new Set([...landmarksSeen(who), stage])] });
}

/** A ばしょ picked over おまかせ on a mode's page (null: おまかせ). */
export function stagePick(m: ModeId): number | null {
  const n = readJson<Record<string, unknown>>(localKV(), DEVICE.kikiStage)?.[m];
  return typeof n === 'number' && LEVELS.includes(n as Level) ? n : null;
}
/** Keep a mode's ばしょ (null: back to おまかせ). */
export function keepStagePick(m: ModeId, lv: number | null): void {
  const v = readJson<Record<string, unknown>>(localKV(), DEVICE.kikiStage);
  const next: Record<string, unknown> = { ...(v && typeof v === 'object' ? v : {}) };
  if (lv === null) delete next[m];
  else next[m] = lv;
  writeJson(localKV(), DEVICE.kikiStage, next);
}
