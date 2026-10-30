<script module lang="ts">
  export interface Flight {
    id: number;
    /** Where the coins start (stage units). */
    from: [number, number];
    bells: number;
    /** ms before this flight starts (flights queue up so they don't all leave at once). */
    delay: number;
  }
</script>

<script lang="ts">
  // ベル flowing into the jar (ADR 0019 §3, round 11): when new earnings arrive, a small "+150" pops over the fruit
  // that earned them and three coins hop from there into the jar, one after another (NH's bell pickup: a short arc,
  // a little spin, no trail). Each flight calls `onland` once its last coin is in, so the jar can squash and its
  // plate count up in step. In stage units (the stage is the container). Reduced motion: the parent skips this.
  //   <CoinFlow flights={[{ id: 1, from: [120, 180], bells: 150, delay: 0 }]} to={[195, 140]} onland={(id) => …} />
  import { u } from '../island/scene.ts';
  import { formatBells } from '#lib/i18n/index.ts';
  import { coinStep, cue } from '#lib/sound/cues.ts';

  interface Props {
    flights: Flight[];
    /** The jar's mouth (stage units). */
    to: [number, number];
    onland: (id: number) => void;
  }
  let { flights, to, onland }: Props = $props();

  const COINS = 3;
  const STEP = 110;
  const FLY = 720;
</script>

{#each flights as f, i (f.id)}
  <span class="pop" style:left={u(f.from[0])} style:top={u(f.from[1] - 10)} style:animation-delay="{f.delay}ms" aria-hidden="true">
    <b class="money">{formatBells(f.bells, { signed: true })}</b>
  </span>
  {#each Array.from({ length: COINS }) as _, k (k)}
    <span class="cx" aria-hidden="true"
      style:left={u(f.from[0])} style:top={u(f.from[1])}
      style:--dx={u(to[0] - f.from[0])} style:--dy={u(to[1] - f.from[1])}
      style:--hop={u(Math.max(26, (f.from[1] - to[1]) * 0.5 + 26))}
      style:animation-delay="{f.delay + 380 + k * STEP}ms" style:animation-duration="{FLY}ms"
      onanimationend={(e) => {
        if (!e.animationName.endsWith('cf-x')) return; // (the coin's own fall and spin bubble up here too)
        // each coin clinks into the jar, one step up a pentatonic run across the whole batch; only a flight's last coin
        // at full level
        cue('coin-land', { step: coinStep(i * COINS + k), gain: k === COINS - 1 ? 1 : 0.6 });
        if (k === COINS - 1) onland(f.id);
      }}>
      <span class="cy" style:animation-delay="{f.delay + 380 + k * STEP}ms" style:animation-duration="{FLY}ms">
        <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.6" class="rim" /><circle cx="10" cy="10" r="6.4" class="face" /><path d="M6.6 7.4 Q8 5.4 10.6 5.2" class="shine" /></svg>
      </span>
    </span>
  {/each}
{/each}

<style>
  /* above the time-of-day tint (z 80) and the jar (z 81), under the fruit popup (z 95) */
  .cx {
    position: absolute; z-index: 90; width: 0; height: 0; pointer-events: none;
    animation-name: cf-x; animation-timing-function: linear; animation-fill-mode: both;
  }
  .cy {
    position: absolute; left: 0; top: 0; display: block; width: clamp(12px, calc(15 * 100cqw / 390), 18px); translate: -50% -50%;
    animation-name: cf-y; animation-fill-mode: both;
  }
  .cy svg { display: block; width: 100%; height: auto; animation: cf-spin 360ms linear infinite; }
  .rim { fill: var(--jar-coin-rim); }
  .face { fill: var(--jar-coin); }
  .shine { fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; opacity: .85; }
  @keyframes cf-x { from { transform: none; } to { transform: translateX(var(--dx)); } }
  /* up (ease-out) to the top of the arc, then down into the jar (ease-in), shrinking as it drops in */
  @keyframes cf-y {
    0% { transform: translateY(0) scale(.5); opacity: 0; animation-timing-function: cubic-bezier(.2, .7, .4, 1); }
    8% { opacity: 1; }
    40% { transform: translateY(calc(var(--dy) * .4 - var(--hop))) scale(1); animation-timing-function: cubic-bezier(.6, 0, .9, .5); }
    92% { opacity: 1; }
    100% { transform: translateY(var(--dy)) scale(.6); opacity: 0; }
  }
  @keyframes cf-spin { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(.25); } }
  /* "+150" over the fruit that earned it: pops, floats up a little, fades */
  .pop {
    position: absolute; z-index: 91; translate: -50% -100%; pointer-events: none; white-space: nowrap;
    animation: cf-pop 1500ms var(--ease-soft) both;
  }
  .pop b {
    display: block; padding: 1px 7px; border-radius: var(--r-pill); background: var(--plate); color: var(--plate-ink);
    box-shadow: 0 3px 0 var(--plate-lip); font: 700 clamp(13px, calc(13 * 100cqw / 390), 15px)/1.3 var(--font-num);
  }
  @keyframes cf-pop {
    0% { opacity: 0; transform: translateY(6px) scale(.6); } 18% { opacity: 1; transform: none; }
    70% { opacity: 1; transform: translateY(-6px); } 100% { opacity: 0; transform: translateY(-12px); }
  }
</style>
