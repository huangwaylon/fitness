// See https://svelte.dev/docs/kit/types#app.d.ts (static SPA: no server, so no Locals).
import type { Cue } from '$lib/sound/cues.ts';

declare global {
  /** The e2e's hooks (each set by its component while it's up, in dev and the demo; the specs read them through their
   *  own types): unknown here, so the app never reads them. */
  interface Window {
    __board?: unknown;
    __balloon?: unknown;
    __editor?: unknown;
    __fish?: unknown;
    __fx3?: unknown;
    __islandEdit?: unknown;
    __layout?: unknown;
    __museum?: unknown;
    __music?: unknown;
    __preview3d?: unknown;
    __shop?: unknown;
    __tent?: unknown;
    __villagers3?: unknown;
    __world?: unknown;
    __world3d?: unknown;
  }
  /** Sound's test logs (e2e/sound.spec.ts, weather.spec.ts): an array the page put there collects the cues and the
   *  ambient layers sounding. */
  var __cues: Cue[] | undefined;
  /** Each cue placed in the world (another player's doing): [cue, its gain here] (e2e/kk-sync.spec.ts). */
  var __cueGains: [Cue, number][] | undefined;
  var __ambient: string[] | undefined;
}

export {};
