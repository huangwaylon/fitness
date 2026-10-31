// Who to draw, in the first load: the roster ids (the villager head icons in the art manifest: scripts/fetch-assets.ts
// fetches exactly the roster, roster.test.ts checks they match), which way each render faces, and the defaults.
// The names, species and colours (villagers/roster.ts) load with the picker.
// Selection: prefs `villager` (roster id) → per-person default. Unknown ids fall back to the default.
import { artKeys } from '#lib/art.ts';
import { LOOKS_RIGHT, NO_MIRROR } from './facing.ts';
import type { RosterId } from './roster.ts';

export interface Look {
  id: RosterId;
  /** The render looks toward the viewer's right as drawn (most NH renders are near-frontal and count as left). */
  looksRight: boolean;
  /** Never mirror: text/numbers on the outfit or a one-sided design (Raymond's odd eyes). Leans in instead. */
  noMirror: boolean;
}

const IDS: ReadonlySet<string> = new Set(artKeys().flatMap((k) => /^villagers\/([a-z0-9-]+)-icon$/.exec(k)?.[1] ?? []));

/** Defaults until the users pick: A = Goldie (dog), B = Anchovy (bird). */
const DEFAULT_VILLAGER: Record<'A' | 'B', RosterId> = { A: 'goldie', B: 'anchovy' };

export function isRosterId(s: unknown): s is RosterId {
  return typeof s === 'string' && IDS.has(s);
}

/** Resolve who to draw: a roster `villager` id wins; anything else → the per-person default. */
export function resolveLook(opts: { villager?: string | null; person?: 'A' | 'B' }): Look {
  const id = isRosterId(opts.villager) ? opts.villager : DEFAULT_VILLAGER[opts.person ?? 'A'];
  return { id, looksRight: LOOKS_RIGHT.has(id), noMirror: NO_MIRROR.has(id) };
}

/** The island host: しずえ, or たぬきち once a player picked しずえ as their villager (never two Isabelles on screen). */
export function hostOf(picks: readonly (string | null | undefined)[]): 'isabelle' | 'tom-nook' {
  return picks.includes('isabelle') ? 'tom-nook' : 'isabelle';
}
