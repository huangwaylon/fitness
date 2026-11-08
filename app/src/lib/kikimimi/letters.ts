// The villagers' letters (docs/kikimimi.md "Stamps, letters and landmarks", "No かいがら", "Stamps, letters and landmarks"): a unit stamped by me brings a
// short English letter from its host villager (40-60 words, using one or two of the unit's phrases, a Japanese gloss
// behind a toggle). Text only: no audio, no かいがら. The letters are the units' `letter` (app/content/units/*.yaml),
// compiled into one small chunk (compile.ts: parts/letters.json, pool.ts loadLetters). Pure: who has which letter is a
// fold over my unit states (stamps.ts), never stored; the partner's stamp alone brings none.
import type { LocalDate } from '../types.ts';
import type { UnitState } from './stamps.ts';

/** A letter as written (the unit's `letter`): the English and its gloss. */
export interface LetterText {
  en: string;
  ja: string;
}

/** A letter I have: its unit, the villager who sent it and the day it came (the unit's first stamp). */
export interface Letter extends LetterText {
  unit: string;
  name: string;
  host: string;
  day: LocalDate;
}

/** A letter's English in words (the schema's 40-60). */
export const letterWords = (en: string): number => en.trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

/** The letters I have: one for each unit I've stamped whose letter is written, newest first (the path's order on the
 *  same day). `units` the path's units (pathUnits), `texts` the letters chunk (undefined: not loaded yet, none). */
export function lettersOf(
  units: readonly { id: string; name: string; host: string }[],
  states: ReadonlyMap<string, UnitState>,
  texts: Readonly<Record<string, LetterText>> | undefined
): Letter[] {
  if (!texts) return [];
  const out: Letter[] = [];
  for (const u of units) {
    const day = states.get(u.id)?.stamped, text = texts[u.id];
    if (day && text) out.push({ unit: u.id, name: u.name, host: u.host, day, en: text.en, ja: text.ja });
  }
  return out.sort((a, b) => (a.day === b.day ? 0 : a.day < b.day ? 1 : -1));
}
