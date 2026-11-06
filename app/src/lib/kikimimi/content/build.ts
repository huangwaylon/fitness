// ききみみ クイズ's row builders: what every content file (bank4.ts, bank5.ts, dialogues.ts, ladders.ts, content/*)
// turns its rows into items with. Each object's keys keep one order (the compiled levels and the golden decks are byte
// for byte what they were).
import type { RosterId } from '#lib/villagers/roster.ts';
import { accentOf, type Item, type ItemType, type Level, type Line, type SoundMark, type Tags } from '../bank.ts';
import { castFor } from '../cast.ts';

/** A `mean` item's question while it plays. */
export const MEAN_ASK = 'つまり、どういうこと？';
/** A `next` item's question while it plays. */
export const NEXT_ASK = 'つぎの ひとことは？';

/** An item's tags, the empty lists left out. */
export const tg = (seed: number, register: Tags['register'], pragmatic: Tags['pragmatic'], conditions?: Tags['conditions'], features?: Tags['features']): Tags =>
  ({ seed, register, pragmatic, ...(conditions?.length && { conditions }), ...(features?.length && { features }) });

/** A swallowed g (tryin(g)). */
export const g = (at: string): SoundMark => ['drop', at, 'g'];

/** A dialogue's line as authored: who, what's shown, its Japanese, what's spoken, its sound marks. */
export type L = readonly [who: RosterId, en: string, ja: string, tts?: string, marks?: readonly SoundMark[]];

/** A dialogue's line with its speaker's cast voice. */
export const line = ([who, en, ja, tts, marks]: L): Line => ({ who, cast: castFor(who), en, ja, ...(tts && { tts }), ...(marks && { marks }) });

/** A one-voice item's fixed part (the right choice first); its extras (tts, focus, ask, scene…) follow it. */
export function single(lv: Level, type: ItemType, id: string, speaker: RosterId, en: string, ja: string, note: string, choices: readonly string[], tags: Tags): Item {
  const cast = castFor(speaker);
  return { id, lv, type, en, ja, speaker, voice: accentOf(cast), cast, choices, answer: 0, note, tags };
}

/** A dialogue row's fields. */
export interface DialogueRow {
  id: string;
  type: Extract<ItemType, 'gist' | 'next'>;
  /** The right one first. */
  choices: readonly string[];
  ja: string;
  note: string;
  focus: string;
  ask?: string;
  tags: Tags;
}

/** A dialogue's fixed part: its lines joined, the first speaker's voice; its extras (scene, channel…) follow it. */
export function dialogueOf(lv: Level, r: DialogueRow, lines: readonly Line[], tags = r.tags): Item {
  return {
    id: r.id, lv, type: r.type, en: lines.map((l) => l.en).join(' '), ja: r.ja, speaker: lines[0].who, voice: accentOf(lines[0].cast),
    cast: lines[0].cast, choices: r.choices, answer: 0, focus: r.focus, ask: r.ask ?? NEXT_ASK, note: r.note, tags, lines
  };
}
