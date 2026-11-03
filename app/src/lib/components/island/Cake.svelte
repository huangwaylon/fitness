<script lang="ts">
  // The birthday cake (docs/design.md "Birthdays"; birthday.ts): on one of our birthdays NH's birthday cake stands in front
  // of centre stage (world.ts CAKE, the campsite's clearing seen from おく: a world node), its candles lit. A tap (a scene item like the
  // visitors, a 44px reach, while it's on screen) plays a little music box (an original tune, a jingle) and blows the
  // candles out: a puff of smoke, out for the day on this phone. No ベル.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { cue } from '#lib/sound/cues.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { su } from './scene.ts';
  import { CAKE } from './world.ts';
  import { site } from './site.svelte.ts';
  import { useWorld } from './camera.svelte.ts';
  import { blowOut, candlesOut } from './birthday.ts';
  import { MIN_HIT, grow, inside } from './hitbox.ts';

  let { enabled, on }: { enabled: () => boolean; on: boolean } = $props();
  /** Its height (u; the flames below are placed for it). */
  const CAKE_U = 22;
  const w = useWorld();

  const date = $derived(localDateAt(minuteNow().getTime()));
  let out = $state(false);
  $effect(() => void (out = candlesOut(date)));
  let puff = $state(0);

  let el = $state<HTMLElement>();
  /** Its spot (world.ts CAKE, on the island's layout: site.rev). */
  const at = $derived((void site.rev, CAKE));

  /** A tap on the scene (client px): true when the cake took it. */
  export function tap(px: number, py: number): boolean {
    const r = el?.querySelector('.cake')?.getBoundingClientRect();
    if (!on || !r || !enabled() || !w.inView(at[0], at[1])) return false;
    if (!inside(grow(r, MIN_HIT, 6), px, py)) return false;
    cue('birthday-cake');
    if (!out) {
      out = true;
      blowOut(date);
      puff++;
    }
    return true;
  }
</script>

{#if on}
  <span class="party" bind:this={el} data-cake={out ? 'out' : 'lit'} aria-hidden="true" {@attach w.at({ x: at[0], z: at[1], h: CAKE_U + 20, m3: { key: 'deco/birthday-cake' } })}>
    <span class="cake"><OfficialArt key="deco/birthday-cake" size={su(CAKE_U)} /></span>
    {#if !out}
      <!-- the candles' flames, over the five candles of NH's cake -->
      <span class="flames">{#each [-0.32, -0.16, 0, 0.16, 0.32] as dx, i (i)}<i style:--dx={dx} style:--i={i}></i>{/each}</span>
    {/if}
    {#if puff}
      {#key puff}<span class="smoke">{#each [0, 1, 2] as i (i)}<i style:--i={i}></i>{/each}</span>{/key}
    {/if}
  </span>
{/if}

<style>
  /* a world node at its foot (its depth among the island's things) */
  .party { width: 0; height: 0; pointer-events: none; }
  .party > * { position: absolute; left: 0; top: 0; line-height: 0; }
  .cake { translate: -50% -94%; filter: var(--leaf-tint,) drop-shadow(0 2px 1px rgba(80, 50, 40, .3)); animation: cake-in .5s var(--ease-bounce) both; }
  .cake :global(.official) { max-width: none; }
  @keyframes cake-in { from { transform: scale(.4); opacity: 0; } }
  .flames { top: calc(-23 * var(--su)); }
  .flames i {
    position: absolute; left: calc(var(--dx) * 28 * var(--su)); width: calc(2.4 * var(--su)); height: calc(4 * var(--su));
    translate: -50% -100%; border-radius: 50% 50% 45% 45% / 65% 65% 35% 35%;
    background: radial-gradient(circle at 50% 70%, #FFF6C0, #FFB43A 60%, rgba(255, 120, 40, .2));
    box-shadow: 0 0 calc(3 * var(--su)) rgba(255, 190, 80, .9); transform-origin: 50% 100%;
    animation: flicker .5s ease-in-out calc(var(--i) * -.13s) infinite alternate;
  }
  @keyframes flicker { from { transform: scale(1, 1) rotate(-4deg); } to { transform: scale(.85, 1.12) rotate(4deg); } }
  .smoke { top: calc(-24 * var(--su)); }
  .smoke i {
    position: absolute; left: calc((var(--i) - 1) * 6 * var(--su)); width: calc(6 * var(--su)); aspect-ratio: 1; border-radius: 50%;
    background: rgba(240, 240, 240, .8); translate: -50% -50%; animation: smoke 1.2s ease-out calc(var(--i) * .08s) both;
  }
  @keyframes smoke { from { transform: scale(.3); opacity: .9; } to { transform: translateY(calc(-16 * var(--su))) scale(1.6); opacity: 0; } }
</style>
