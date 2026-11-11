<script lang="ts">
  // A plot tap's word (docs/farming.md "Playing"): a small cream tag over the plot, 「トマトを うえた」 「みずやり」
  // 「ニンジン・あと 2にち」, never my villager's balloon (which stood over the field being tapped). Placed once where the
  // tap saw the plot (no following: the camera stays put under a tap), gone in 1.2 s, at once on the next pop, and faded
  // by a drag (the camera moving off it). Touch goes through it.
  //   <FarmPop />   (in .if-scene, outside the scroller)
  import { farmUi } from './farmUi.svelte.ts';

  /** The tag's half width, clamped into the screen (measured once a pop). */
  let el: HTMLElement | undefined = $state();
  let shift = $state(0);
  let gone = $state(false);
  const pop = $derived(farmUi.pop);

  $effect(() => {
    if (!pop || !el) return;
    gone = false;
    const w = el.offsetWidth, room = el.parentElement?.clientWidth ?? innerWidth, pad = 8;
    shift = Math.min(0, room - pad - (pop.x + w / 2)) + Math.max(0, pad - (pop.x - w / 2));
    // a drag (the camera moving) fades it: a touch that travels
    let from: [number, number] | null = null;
    const down = (e: PointerEvent) => (from = [e.clientX, e.clientY]);
    const move = (e: PointerEvent) => {
      if (from && Math.hypot(e.clientX - from[0], e.clientY - from[1]) > 8) gone = true;
    };
    const up = () => (from = null);
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerup', up, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', up, true);
    };
  });

  function done(n: number) {
    if (farmUi.pop?.n === n) farmUi.pop = null;
  }
</script>

{#if pop}
  {#key pop.n}
    <p class="farm-pop" class:gone bind:this={el} data-farm-pop role="status" style:left="{pop.x + shift}px" style:top="{pop.y}px"
      onanimationend={() => done(pop.n)}>{pop.text}</p>
  {/key}
{/if}

<style>
  .farm-pop {
    position: absolute; z-index: 2; margin: 0; padding: 6px 12px; translate: -50% calc(-100% - 6px); pointer-events: none;
    border-radius: var(--r-pill); background: var(--c-cream); color: var(--c-ink); white-space: nowrap;
    box-shadow: 0 2px 0 var(--c-lip), 0 4px 10px rgb(60 40 20 / .16);
    font: 700 var(--fs-s)/1.2 var(--font-ui); word-break: keep-all;
    animation: farm-pop 1.2s ease both;
  }
  .farm-pop.gone { animation: farm-pop-out 150ms linear both; }
  @keyframes farm-pop-out { to { opacity: 0; } }
  @keyframes farm-pop {
    0% { opacity: 0; transform: translateY(4px); }
    12%, 80% { opacity: 1; transform: none; }
    100% { opacity: 0; transform: translateY(-4px); }
  }
  @media (prefers-reduced-motion: reduce) {
    @keyframes farm-pop { 0%, 100% { opacity: 0; } 8%, 85% { opacity: 1; } }
  }
</style>
