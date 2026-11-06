// ききみみ クイズ: the content sprint's sets (2026-11-06; docs/kikimimi.md "Levels 6 and 7"), folded into the bank
// (bank.ts BANK): もり's two (level 4, beside bank4.ts and dialogues.ts), やま's two (level 6) and ほし (level 7). Each set
// writes its items' staging in place (`scene`, `channel`, `marks`: staging.ts's rules, its PLACES and MARKS are the
// older banks'); here each live item heard in a noisy scene (a café, a street, a platform or an airport gate) gets
// that scene's bed, light (+15 dB: docs/kikimimi.md "Conditions"), as staging.ts NOISE does for bank4.ts. `word` items
// stay clean (their contrasts are fine detail).
import type { Bed, Item, SceneId } from '../bank.ts';
import * as moriLife from './mori-life.ts';
import * as moriWork from './mori-work.ts';
import * as yamaA from './yama-a.ts';
import * as yamaB from './yama-b.ts';
import * as hoshi from './hoshi.ts';

/** Each set's single items and dialogues, by name (content/sets.test.ts checks each set's own rules). */
export const SETS: Readonly<Record<string, { items: readonly Item[]; dialogues: readonly Item[]; family?: Readonly<Record<string, string>> }>> = {
  'mori-life': { items: moriLife.ITEMS, dialogues: moriLife.DIALOGUES, family: moriLife.FAMILY },
  'mori-work': { items: moriWork.ITEMS, dialogues: moriWork.DIALOGUES },
  'yama-a': { items: yamaA.ITEMS, dialogues: yamaA.DIALOGUES },
  'yama-b': { items: yamaB.ITEMS, dialogues: yamaB.DIALOGUES, family: yamaB.FAMILY },
  hoshi: { items: hoshi.ITEMS, dialogues: hoshi.DIALOGUES, family: hoshi.FAMILY }
};

/** A scene's noise bed. */
const BED: Partial<Record<SceneId, Bed>> = { cafe: 'cafe', street: 'street', platform: 'station', gate: 'station' };
const CHANNEL_CONDS = ['phone', 'voicemail', 'pa', 'video'] as const;

/** A live item in a noisy scene with its bed (light), unless it has a condition of its own or is a `word` item. */
function withBed(it: Item): Item {
  const bed = it.scene && BED[it.scene];
  const live = (it.channel ?? 'live') === 'live' && !it.tags?.conditions?.some((c) => (CHANNEL_CONDS as readonly string[]).includes(c));
  return !bed || !live || it.cond || it.type === 'word' ? it : { ...it, cond: { kind: bed, level: 'light' } };
}

/** Every item of the sets, in the sets' order, each with its bed. */
export const CONTENT: readonly Item[] = Object.values(SETS).flatMap((s) => [...s.items, ...s.dialogues]).map(withBed);
