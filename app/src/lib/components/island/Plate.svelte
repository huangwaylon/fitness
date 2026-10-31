<script lang="ts">
  // The catch plate (docs/design.md "Scene interactions"): NH's caption on a plate like the jar's (cream pill, 4px lip,
  // the plate's ink) with an official icon at its start that pops up out of the catch. Measured hidden, then placed as
  // close above (else below) the source as it can, centred on it, inside the scene's safe area and clear of every
  // control and popup (placement.ts); with no room anywhere it's skipped. Gone after 2.6 s (or `ms`).
  //   <Plate {scene} x={u} y={u} art="critters/sea-bass" text="…" ondone={…} />   (x, y: the source, stage units)
  // Used by the critters' catches and the beach finds; the parent keys it per catch and sits it in a layer at --z-taps.
  import { onMount, tick } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { place, stageGeo } from './placement.ts';

  interface Props {
    scene?: HTMLElement;
    /** The source (stage units). */
    x: number;
    y: number;
    art: string;
    text: string;
    ms?: number;
    ondone: () => void;
  }
  let { scene, x, y, art, text, ms = 2600, ondone }: Props = $props();
  // the source is fixed for the plate's life (the parent keys a new one per catch)
  // svelte-ignore state_referenced_locally
  let at = $state({ x, y, dx: 0, dy: 0, placed: false });
  let el = $state<HTMLElement>();
  const U = (n: number) => `calc(${n.toFixed(1)} * var(--su))`;

  onMount(() => {
    const done = setTimeout(ondone, ms);
    void tick().then(() => {
      const g = stageGeo(scene), plate = el?.querySelector('.catch-plate')?.getBoundingClientRect();
      if (!g || !plate || !scene) return;
      const p = place(scene, plate.width, plate.height + 4, g.r.left + x / g.k, g.r.top + y / g.k); // + the plate's lip
      if (!p) return ondone();
      const cx = (p.x - g.r.left) * g.k, cy = (p.y - g.r.top) * g.k;
      at = { x: cx, y: cy, dx: x - cx, dy: y - cy, placed: true };
    });
    return () => clearTimeout(done);
  });
</script>

<span class="mover catch" class:placed={at.placed} data-fx="catch" bind:this={el} style:--ms="{ms}ms"
  style:translate="{U(at.x)} {U(at.y)}" style:--dx={U(at.dx)} style:--dy={U(at.dy)}>
  <span class="catch-plate">
    <span class="catch-icon"><OfficialArt key={art} size="clamp(30px, calc(34 * var(--su)), 40px)" eager /></span>
    <span class="catch-say">{text}</span>
  </span>
</span>

<style>
  .mover { position: absolute; left: 0; top: 0; width: 0; height: 0; }
  .mover > * { position: absolute; }
  /* measured hidden, then placed */
  .catch:not(.placed), .catch:not(.placed) * { visibility: hidden; animation: none !important; }
  .catch { animation: fade-out var(--ms) linear both; }
  @keyframes fade-out { 85% { opacity: 1; } 100% { opacity: 0; } }
  .catch-plate {
    left: 0; top: 0; translate: -50% -50%; display: flex; align-items: center; gap: 6px;
    width: max-content; max-width: min(272px, calc(100vw - 24px)); padding: 3px 12px 3px 4px; border-radius: var(--r-pill);
    background: var(--plate); color: var(--plate-ink); box-shadow: 0 var(--lip-h) 0 var(--plate-lip);
    font: 700 clamp(13px, calc(14 * var(--su)), 15px) / 1.3 var(--font-ui); text-wrap: balance;
    animation: say .25s ease-out both;
  }
  @keyframes say { from { opacity: 0; transform: translateY(4px) scale(.96); } }
  .catch-icon { flex: none; line-height: 0; animation: lift .55s cubic-bezier(.3, 1.5, .5, 1) both; }
  .catch-icon :global(.official) { max-width: none; filter: drop-shadow(0 1.5px 1.5px rgba(60, 40, 20, .3)); }
  /* the icon starts at the source (the plate's centre + --dx/--dy) and pops over to its place */
  @keyframes lift { from { transform: translate(var(--dx), var(--dy)) scale(.4); opacity: 0; } 25% { opacity: 1; } }
  @keyframes fade-in { from { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) {
    .catch, .catch * { animation-name: fade-in !important; transform: none !important; }
  }
</style>
