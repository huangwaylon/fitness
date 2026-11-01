<script lang="ts">
  // Halloween on the island (docs/design.md "Halloween"; events.ts): on Oct 31 a few of NH's orange pumpkins sit on the
  // lawn; from 17:00 they are spooky lanterns (NH's jack-o'-lanterns), lit above the night tint with a soft flicker,
  // and a light purple and orange wash lies over the island. Decoration only: no taps, never over a control (each spot
  // is measured clear of them on this screen; a covered spot isn't shown). Jack is a visitor (Visitor.svelte).
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { HALLOWEEN_SPOTS, PUMPKIN_U, su } from './scene.ts';

  let { scene, night }: { scene?: HTMLElement; night: boolean } = $props();

  /** The spots clear of every control on this screen (measured once laid out, again on a resize). */
  let spots = $state<(readonly [number, number])[]>([]);
  $effect(() => {
    const measure = () => {
      const g = stageGeo(scene);
      if (!g) return;
      const keep = guardsU(g, 2);
      spots = HALLOWEEN_SPOTS.filter(([x, y]) => clearAt(keep, x, y - PUMPKIN_U / 2, PUMPKIN_U / 2, PUMPKIN_U / 2));
    };
    const id = setTimeout(measure, 300);
    addEventListener('resize', measure);
    return () => (clearTimeout(id), removeEventListener('resize', measure));
  });
</script>

<div class="halloween" class:night data-halloween={night ? 'night' : 'day'} aria-hidden="true">
  {#if night}<div class="wash"></div>{/if}
  {#each spots as [x, y], i (`${x},${y}`)}
    <span class="pumpkin" data-pumpkin style:translate="{su(x)} {su(y)}" style:--i={i}>
      {#if night}<span class="glow"></span>{/if}
      <span class="art"><OfficialArt key={night ? 'deco/spooky-lantern' : 'deco/pumpkin'} size={su(PUMPKIN_U)} /></span>
    </span>
  {/each}
</div>

<style>
  .halloween { position: absolute; inset: 0; pointer-events: none; --su: calc(100cqw / 390); }
  /* by day the pumpkins sit among the props (behind the trees' canopies, the jar and the villagers); lit at night they
     rise above the time-of-day tint, like the jar and the fireflies */
  .pumpkin { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 31; }
  .night .pumpkin { z-index: calc(var(--z-tint) + 1); }
  .art { position: absolute; left: 0; top: 0; line-height: 0; translate: -50% -94%; filter: drop-shadow(0 1.5px 1px rgba(80, 50, 20, .35)); }
  .art :global(.official) { max-width: none; }
  .night .art { animation: flicker 2.6s ease-in-out calc(var(--i) * -.9s) infinite; }
  /* the candle inside: a warm round glow that breathes unevenly */
  .glow {
    position: absolute; left: 0; top: 0; width: calc(60 * var(--su)); aspect-ratio: 1; translate: -50% -62%; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 190, 90, .55), rgba(255, 140, 50, .22) 55%, transparent);
    animation: glow 1.9s ease-in-out calc(var(--i) * -.7s) infinite alternate;
  }
  @keyframes glow { 0% { opacity: .75; transform: scale(.94); } 35% { opacity: 1; } 60% { opacity: .82; transform: scale(1.04); } 100% { opacity: .95; transform: scale(.98); } }
  @keyframes flicker { 0%, 100% { opacity: 1; } 45% { opacity: .9; } 52% { opacity: 1; } 70% { opacity: .94; } }
  /* the evening's wash: purple from above to a warm orange low down, over land, sea and sky, under the tint's z */
  .wash {
    position: absolute; top: -100vh; bottom: -100vh; left: -100vw; right: -100vw; z-index: var(--z-tint);
    background: linear-gradient(to bottom, rgba(120, 70, 190, .22), rgba(150, 80, 170, .14) 55%, rgba(255, 140, 60, .12));
    mix-blend-mode: soft-light;
  }
</style>
