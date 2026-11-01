<script lang="ts">
  // The birthday cake (docs/design.md "Birthdays"; birthday.ts): on one of our birthdays NH's birthday cake stands in front
  // of the centre stage (else behind it, by the hedge; measured clear of every control and the visitor, else not shown),
  // its candles lit. A tap (a scene item like the visitors, a 44px reach) plays a little music box (an original tune, a
  // jingle) and blows the candles out: a puff of smoke, out for the day on this phone. No ベル.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { cue } from '#lib/sound/cues.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { CENTRE_STAGE, su } from './scene.ts';
  import { blowOut, candlesOut } from './birthday.ts';

  let { scene, enabled, on }: { scene?: HTMLElement; enabled: () => boolean; on: boolean } = $props();
  /** Its height (u) and where it may stand (its foot): in front of the centre stage, else behind it by the hedge. */
  const CAKE_U = 22;
  const SPOTS: readonly (readonly [number, number])[] = [[CENTRE_STAGE.x, CENTRE_STAGE.base + 30], [CENTRE_STAGE.x - 22, CENTRE_STAGE.base - 70]];

  const date = $derived(localDateAt(minuteNow().getTime()));
  let out = $state(false);
  $effect(() => void (out = candlesOut(date)));
  let puff = $state(0);

  let el = $state<HTMLElement>();
  let spot = $state<readonly [number, number] | null>(null);
  $effect(() => {
    if (!on) return void (spot = null);
    const measure = () => {
      const g = stageGeo(scene);
      if (!g) return;
      const keep = guardsU(g, -5 * g.k);
      // and the visitor standing on the centre stage
      for (const v of scene?.querySelectorAll('[data-visitor] .art') ?? []) {
        const r = v.getBoundingClientRect();
        keep.push({ x0: (r.left - g.r.left) * g.k, x1: (r.right - g.r.left) * g.k, y0: (r.top - g.r.top) * g.k, y1: (r.bottom - g.r.top) * g.k });
      }
      spot = SPOTS.find(([x, y]) => clearAt(keep, x, y - CAKE_U / 2, CAKE_U * 0.6, CAKE_U / 2)) ?? null;
    };
    const id = setTimeout(measure, 400);
    addEventListener('resize', measure);
    return () => (clearTimeout(id), removeEventListener('resize', measure));
  });

  /** A tap on the scene (client px): true when the cake took it. */
  export function tap(px: number, py: number): boolean {
    const r = el?.querySelector('.cake')?.getBoundingClientRect();
    if (!on || !spot || !r || !enabled()) return false;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (Math.abs(px - cx) > Math.max(22, r.width / 2 + 6) || Math.abs(py - cy) > Math.max(22, r.height / 2 + 6)) return false;
    cue('birthday-cake');
    if (!out) {
      out = true;
      blowOut(date);
      puff++;
    }
    return true;
  }
</script>

{#if on && spot}
  <span class="party" bind:this={el} data-cake={out ? 'out' : 'lit'} style:translate="{su(spot[0])} {su(spot[1])}" aria-hidden="true">
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
  /* on the lawn, among the props (behind the trees' canopies and everyone in front of it) */
  .party { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 46; pointer-events: none; --su: calc(100cqw / 390); }
  .party > * { position: absolute; left: 0; top: 0; line-height: 0; }
  .cake { translate: -50% -94%; filter: drop-shadow(0 2px 1px rgba(80, 50, 40, .3)); animation: cake-in .5s var(--ease-bounce) both; }
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
