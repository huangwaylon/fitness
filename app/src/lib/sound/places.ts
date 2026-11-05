// Place music (docs/design.md#place-music): as in NH, a building's room plays its own track in place of the island's
// hour (or event) music, and leaving hands it back. Pure: the ids, which track a room plays, and the doorway's settle
// (a room's track changes once the player has stayed through its door a moment). sound.svelte.ts setPlace() plays it;
// what wins over what is choose.ts pickMusic.
import type { MusicTrack } from './hourly.ts';

/** The rooms with music, the tracks under static/audio/manifest.json `places.<id>` (loops, the hours' shape): the
 *  museum's hall and wings, the shop. */
export const PLACE_IDS = ['museum-hall', 'museum-fish', 'museum-bugs', 'shop'] as const;
export type PlaceId = (typeof PLACE_IDS)[number];

/** The museum's rooms (museum/plan.ts Wing): its hall, its bug wing, its aquarium. NH's fossil and art wings aren't built. */
export const MUSEUM_MUSIC: Readonly<Record<'hall' | 'bug' | 'fish', PlaceId>> = { hall: 'museum-hall', bug: 'museum-bugs', fish: 'museum-fish' };

/** The file a place plays, or null: no file, so the island's music goes on. */
export function placeTrack(id: PlaceId | null, files: Partial<Record<PlaceId, MusicTrack>>): ({ id: PlaceId } & MusicTrack) | null {
  const t = id && files[id];
  return t ? { id: id!, ...t } : null;
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
