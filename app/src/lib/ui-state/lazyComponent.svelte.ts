// A component loaded the first time it is wanted, then kept: its chunk stays out of the first load (a visitor, the
// fireworks, an event's decorations only come on their days). The import goes through reload.ts `lazy`, so a chunk a
// deploy removed reloads into the new build.
import type { Component } from 'svelte';
import { lazy } from './reload.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyComponent<C extends Component<any, any>>(load: () => Promise<{ default: C }>): { get(want: boolean): C | null } {
  const get = lazy(load);
  let loaded = $state.raw<C | null>(null);
  let asked = false;
  return {
    /** The component once loaded (null until then); starts loading it the first time `want` is true. */
    get(want: boolean): C | null {
      if (want && !asked) {
        asked = true;
        void get().then((m) => (loaded = m.default), () => (asked = false));
      }
      return loaded;
    }
  };
}
