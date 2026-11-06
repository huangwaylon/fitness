// The games a phone knows (docs/kikimimi-framework.md §2): a session looks a heard `open`'s game up here. Every game so
// far (the quiz, スピード はしご, a unit's lesson) rides the sheet's chunk with the bank, so the list is plain; a later
// game with its own chunk loads before its deck (framework §3.2 "Content before the deck").
import type { Defs } from './session.ts';
import type { GameDef } from './types.ts';

/** A session's game lookup over these games. */
export function registry(defs: readonly GameDef<unknown>[]): Defs {
  const by = new Map(defs.map((d) => [d.id, d]));
  return (gm) => by.get(gm);
}
