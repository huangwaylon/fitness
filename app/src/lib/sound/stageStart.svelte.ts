// A song starting on the island's stage (docs/sound-sync.md), seen once a start on each phone: the tape deck's stretch
// (TapeDeck.svelte), the cake's candles (Cake.svelte). A phone that sees it as it starts plays its moment (and, unable to
// hear the song, its little tune instead); one opening later only sees it playing.
//   onStageStart(song, 'stretch', (fresh) => …, on?)     from a component's script (an $effect)
import { untrack } from 'svelte';
import { cue, type Cue } from './cues.ts';
import { hearsMusic } from './sound.svelte.ts';
import { live } from './stage.svelte.ts';

/** A start seen within this long of its record's `at` is fresh (ms): seen as it starts. */
const FRESH_MS = 1000;

/** `fn` once for each start of `song` on the island's stage (my tap or another's) while `on()` holds, `fresh` within
 *  FRESH_MS of it; a fresh start this phone can't hear (ミュージック off, no tap yet) plays cue `unheard` first. */
export function onStageStart(song: string, unheard: Cue, fn: (fresh: boolean) => void, on: () => boolean = () => true): void {
  let seen = 0;
  $effect(() => {
    const s = live('isl');
    if (!on() || s?.song !== song || s.at === seen) return;
    untrack(() => {
      seen = s.at;
      const fresh = s.elapsedMs <= FRESH_MS;
      if (fresh && !hearsMusic()) cue(unheard);
      fn(fresh);
    });
  });
}
