// What waits for a chunk (pool.ts) in a ききみみ game (game.svelte.ts): what's heard and my own taps run in order, each
// once the chunks the deck it touches needs are loaded.
import { load, loaded, type Unit } from '#lib/kikimimi/pool.ts';

export class ChunkQueue {
  /** What's waiting, in order; null when nothing is. */
  #queue: Promise<void> | null = null;
  readonly #gone: () => boolean;
  readonly #later: () => void;

  /** `gone`: the game's over (what waits is dropped); `later`: after a step that had to wait (the view refreshed). */
  constructor(gone: () => boolean, later: () => void) {
    this.#gone = gone;
    this.#later = later;
  }

  /**
   * `f` once the chunks `need()` names are loaded, after whatever waits already: at once when nothing does (the usual
   * case: the lobby's level is in before the sheet opens), else in order once loaded, then `later`. `need` is asked at
   * its turn (a configure after another's level). A chunk that won't load drops `f` (offline with the chunk never
   * fetched: the host's re-sent `open` tries again).
   */
  then(need: () => readonly Unit[], f: () => void): void {
    const step = (later: boolean): Promise<void> | void => {
      if (this.#gone()) return;
      const missing = need().filter((u) => !loaded(u));
      if (missing.length) return load(...missing).then(() => step(true));
      f();
      if (later) this.#later();
    };
    if (!this.#queue) {
      const p = step(false);
      if (p) this.#settle(p);
    } else this.#settle(this.#queue.then(() => step(true)));
  }

  #settle(p: Promise<void>): void {
    const q: Promise<void> = p.catch((e) => console.warn('kikimimi: a chunk didn’t load', e)).then(() => {
      if (this.#queue === q) this.#queue = null;
    });
    this.#queue = q;
  }
}
