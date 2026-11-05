// Place music (docs/design.md#place-music): as in NH, a building's room plays its own track in place of the island's
// hour (or event) music, and leaving hands back to it with the hour's crossfade. Pure: the ids, which track a room
// plays, the order the music's sources win in, and the doorway's settle (a room's track changes once the player has
// stayed through its door a moment). sound.svelte.ts setPlace() plays it.
import type { MusicTrack } from './hourly.ts';

/** The tracks under static/audio/manifest.json `places.<id>` (loops, the hours' shape). */
export type PlaceId =
  | 'museum-hall' | 'museum-fish' | 'museum-bugs' | 'museum-fossils' | 'museum-art'
  | 'shop' | 'shop-big' | 'shop-closing' | 'able-sisters'
  | 'resident-services' | 'resident-tent' | 'redd' | 'dreaming';
export const PLACE_IDS: readonly PlaceId[] = [
  'museum-hall', 'museum-fish', 'museum-bugs', 'museum-fossils', 'museum-art',
  'shop', 'shop-big', 'shop-closing', 'able-sisters',
  'resident-services', 'resident-tent', 'redd', 'dreaming'
];

/** The museum's rooms (museum/plan.ts Wing): its hall, its bug wing, its aquarium. NH's fossil and art wings aren't built. */
export const MUSEUM_MUSIC: Readonly<Record<'hall' | 'bug' | 'fish', PlaceId>> = { hall: 'museum-hall', bug: 'museum-bugs', fish: 'museum-fish' };

/** A variant without its own file plays its room's main track (the big shop's the shop's, a wing's the hall's). */
const FALLBACK: Partial<Record<PlaceId, PlaceId>> = {
  'shop-big': 'shop',
  'shop-closing': 'shop',
  'museum-fossils': 'museum-hall',
  'museum-art': 'museum-hall'
};

/** The file a place plays (its fallback's when it has none), or null: no file, so the island's music goes on. */
export function placeTrack(id: PlaceId | null, files: Partial<Record<PlaceId, MusicTrack>>): ({ id: PlaceId } & MusicTrack) | null {
  for (let p = id; p; p = FALLBACK[p] ?? null) {
    const t = files[p];
    if (t) return { id: p, ...t };
  }
  return null;
}

/** What sounds, by priority (the first there): the opening theme (NH's title screen, while it plays), a cut-in (the
 *  wasps, a K.K. song: over everything, indoors too), the room's track (indoors NH plays the building's music even on
 *  an event day), then the island's (the event's track on its day, else the hour's: sound.svelte.ts musicAt). */
export function pickMusic<T>(o: { opening?: T | null; cutIn?: T | null; place?: T | null; island?: T | null }): T | null {
  return o.opening ?? o.cutIn ?? o.place ?? o.island ?? null;
}

/** How long a room's new track waits for the player to stay in it (a step back out through the doorway in this time
 *  changes nothing): NH changes the museum's music as one walks between its rooms, never at the threshold's flicker. */
export const PLACE_SETTLE_MS = 600;

type Timers = { set: (f: () => void, ms: number) => unknown; clear: (id: unknown) => void };
const TIMERS: Timers = { set: (f, ms) => setTimeout(f, ms), clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>) };

/** A value that only passes on once it has held for `ms`: `to(v)` as often as it's read (a frame), `apply` runs once
 *  per settled change; `now(v)` passes at once (the room opening). `stop()` drops what's pending. */
export class Settle<T> {
  #cur: T | undefined;
  #want: T | undefined;
  #id: unknown = null;
  #apply: (v: T) => void;
  #ms: number;
  #timers: Timers;
  constructor(apply: (v: T) => void, ms = PLACE_SETTLE_MS, timers: Timers = TIMERS) {
    this.#apply = apply;
    this.#ms = ms;
    this.#timers = timers;
  }

  now(v: T): void {
    this.stop();
    this.#cur = this.#want = v;
    this.#apply(v);
  }

  to(v: T): void {
    if (v === this.#want) return;
    this.stop();
    this.#want = v;
    if (v === this.#cur) return;
    this.#id = this.#timers.set(() => {
      this.#id = null;
      this.#cur = v;
      this.#apply(v);
    }, this.#ms);
  }

  stop(): void {
    if (this.#id !== null) this.#timers.clear(this.#id);
    this.#id = null;
    this.#want = this.#cur;
  }
}
