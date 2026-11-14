<script lang="ts">
  // A plot tap's word (docs/farming.md "Playing"): a small cream tag over the plot, 「みずやり・あした 3こ」
  // 「ニンジン・あした 3こ」, never my villager's balloon (which stood over the field being tapped). Placed once
  // where the tap saw the plot (no following: the camera stays put under a tap), gone in 1.2 s, at once on the next pop,
  // and faded by a drag (the camera moving off it). Touch goes through the word. On my own growing plant it carries ほる,
  // its own 44 pt button raised over the word (a miss lands on the word, never the field), kept 3 s, the clock held while
  // a finger is on it; its tap digs the plant up (SceneTaps: its start back, with 取り消す).
  //   <FarmPop />   (in .if-scene, outside the scroller)
  import { farmUi } from './farmUi.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  /** The tag's half width, clamped into the screen (measured once a pop). */
  let el: HTMLElement | undefined = $state();
  let digEl: HTMLElement | undefined = $state();
  let shift = $state(0);
  let gone = $state(false);
  /** A finger on ほる: its clock waits. */
  let held = $state(false);
  const pop = $derived(farmUi.pop);

  $effect(() => {
    if (!pop || !el) return;
    gone = false;
    held = false;
    const w = el.offsetWidth, room = el.parentElement?.clientWidth ?? innerWidth, pad = 8;
    shift = Math.min(0, room - pad - (pop.x + w / 2)) + Math.max(0, pad - (pop.x - w / 2));
    // a drag (the camera moving) fades it: a touch that travels
    let from: [number, number] | null = null;
    const down = (e: PointerEvent) => {
      from = [e.clientX, e.clientY];
      held = !!digEl && e.target instanceof Node && digEl.contains(e.target);
    };
    const move = (e: PointerEvent) => {
      if (from && Math.hypot(e.clientX - from[0], e.clientY - from[1]) > 8) gone = true;
    };
    const up = () => {
      from = null;
      held = false;
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true);
    };
  });

  function done(e: AnimationEvent, n: number) {
    if (e.target === e.currentTarget && farmUi.pop?.n === n) farmUi.pop = null;
  }
  function dig(n: number) {
    const go = farmUi.pop?.n === n ? farmUi.pop.dig : undefined;
    farmUi.pop = null;
    go?.();
  }
</script>

{#if pop}
  {#key pop.n}
    <div class="farm-pop" class:gone class:long={!!pop.dig} class:held bind:this={el} style:left="{pop.x + shift}px" style:top="{pop.y}px"
      onanimationend={(e) => done(e, pop.n)}>
      {#if pop.dig}
        <button type="button" class="btn small paper dig" data-farm-dig data-sfx="self" bind:this={digEl} onclick={() => dig(pop.n)}>{t('world.farm.dig')}</button>
      {/if}
      <p class="word" data-farm-pop role="status">{pop.text}</p>
    </div>
  {/key}
{/if}

<style>
  .farm-pop {
    position: absolute; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 10px;
    translate: -50% calc(-100% - 6px); pointer-events: none;
    animation: farm-pop 1.2s ease both;
  }
  .farm-pop.long { animation-name: farm-pop-long; animation-duration: 3s; }
  .farm-pop.held { animation-play-state: paused; }
  .farm-pop.gone { animation: farm-pop-out 150ms linear both; }
  .word {
    margin: 0; padding: 6px 12px;
    border-radius: var(--r-pill); background: var(--c-cream); color: var(--c-ink); white-space: nowrap;
    box-shadow: 0 2px 0 var(--c-lip), 0 4px 10px rgb(60 40 20 / .16);
    font: 700 var(--fs-s)/1.2 var(--font-ui); word-break: keep-all;
  }
  /* ほる: the quiet secondary (.btn.small.paper: cream, its edge), 44 pt to the thumb, over the word; never the loud
     yellow: it takes a plant away */
  .dig {
    min-width: var(--hit, 44px); height: var(--hit, 44px); margin: 0; border-radius: var(--r-pill); pointer-events: auto;
    white-space: nowrap; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .dig:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  @keyframes farm-pop-out { to { opacity: 0; } }
  @keyframes farm-pop {
    0% { opacity: 0; transform: translateY(4px); }
    12%, 80% { opacity: 1; transform: none; }
    100% { opacity: 0; transform: translateY(-4px); }
  }
  @keyframes farm-pop-long {
    0% { opacity: 0; transform: translateY(4px); }
    5%, 92% { opacity: 1; transform: none; }
    100% { opacity: 0; transform: translateY(-4px); }
  }
  @media (prefers-reduced-motion: reduce) {
    @keyframes farm-pop { 0%, 100% { opacity: 0; } 8%, 85% { opacity: 1; } }
    @keyframes farm-pop-long { 0%, 100% { opacity: 0; } 4%, 94% { opacity: 1; } }
  }
</style>
