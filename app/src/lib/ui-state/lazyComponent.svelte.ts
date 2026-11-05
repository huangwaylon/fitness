// A component loaded the first time it is wanted, then kept: its chunk stays out of the first load (a visitor, the
// fireworks, an event's decorations only come on their days). The import goes through reload.ts `lazy`, so a chunk a
// deploy removed reloads into the new build; a failed one is asked for again at its next chance (retry.ts), up to
// MAX_TRIES times a page (a chunk that keeps failing was asked for every 30-60 s for good, each time a version check).
import type { Component } from 'svelte';
import { lazy } from './reload.ts';
import { nextChance } from './retry.ts';

/** A lazy component's loads a page at most: the first and its retries. */
export const MAX_TRIES = 5;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyComponent<C extends Component<any, any>>(load: () => Promise<{ default: C }>): { get(want: boolean): C | null } {
  const get = lazy(load);
  let loaded = $state.raw<C | null>(null);
  let asked = false, failures = 0;
  /** A failed load's next chance (retry.ts): whoever asked asks again then (if it still wants it). */
  let again = $state(0);
  return {
    /** The component once loaded (null until then); starts loading it the first time `want` is true, and again after
     *  a failure at its next chance (the next `online`, back to the front, or a backoff). */
    get(want: boolean): C | null {
      void again;
      if (want && !asked) {
        asked = true;
        void get().then(
          (m) => (loaded = m.default),
          () => {
            if (++failures >= MAX_TRIES) return;
            void nextChance(failures - 1).then(() => {
              asked = false;
              again++;
            });
          }
        );
      }
      return loaded;
    }
  };
}
