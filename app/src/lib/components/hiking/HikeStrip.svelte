<script lang="ts">
  // Hike mode's peek (docs/hiking.md "In-hike map"): the strip (歩いた · のこり · のぼり · {山頂/ゴール}到着 H:MMごろ,
  // Fredoka 22 on the solid cream, ink at every hour: the cream stays cream by night) and its row, the wake switch
  // (画面をつけたままにする, where the phone has a wake lock) and 終了. Their taps never drag the sheet.
  import StatStrip from '../ui/StatStrip.svelte';
  import type { Live } from './map/live.svelte.ts';
  import type { Prepared } from '#lib/hiking/track.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';
  import { units } from '../travel/units.ts';

  let { live, prep }: { live: Live; prep: Prepared | null } = $props();
  const L = $derived(i18n.locale);
  const fill = (s: string, k: string, v: string | number) => s.replace(`{${k}}`, String(v));
  /** A distance on the strip: km (mi) to a tenth. */
  const dist = (m: number) => (units.current === 'mi' ? { value: (m / 1609.344).toFixed(1), unit: 'mi' } : { value: (m / 1000).toFixed(1), unit: 'km' });
  const height = (m: number) => (units.current === 'mi' ? { value: Math.round(m * 3.28084).toLocaleString('en-US'), unit: 'ft' } : { value: Math.round(m).toLocaleString('en-US'), unit: 'm' });
  const clock = (t: number) => {
    const d = new Date(t);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const items = $derived.by(() => {
    const st = live.strip, none = { value: '—' };
    const goal = pick(st?.goal === 'summit' ? S.hikeSummit : S.hikeGoal, L);
    return [
      { label: pick(S.hikeWalked, L), ...(st ? dist(st.walked) : none) },
      { label: pick(S.hikeLeft, L), ...(st ? dist(st.left) : prep ? dist(prep.total) : none) },
      { label: pick(S.hikeUp, L), ...(st ? height(st.up) : none) },
      { label: fill(pick(S.hikeArrive, L), 'goal', goal), ...(st?.eta ? { value: clock(st.eta), unit: pick(S.hikeAbout, L) } : none) }
    ];
  });
  const stop = (e: PointerEvent) => e.stopPropagation();
</script>

<div class="hike-strip" data-hike-strip><StatStrip {items} /></div>
<div class="hike-row">
  {#if live.wakeOk}
    <button type="button" class="wake" role="switch" aria-checked={live.wake} data-wake data-sfx="tick" onpointerdown={stop} onclick={() => live.setWake(!live.wake)}>
      <span class="sw" aria-hidden="true"></span><span class="wt">{pick(S.wake, L)}<small>{pick(S.wakeNote, L)}</small></span>
    </button>
  {:else}<span></span>{/if}
  <button type="button" class="btn small paper end" data-hike-end data-sfx="back" onpointerdown={stop} onclick={() => live.endHike()}>{pick(S.hikeEnd, L)}</button>
</div>

<style>
  /* (the strip's cream is the day's at every hour: its text the day's ink too, not the night's light --text) */
  .hike-strip { --text: var(--c-ink); --text-soft: var(--c-ink-soft); margin: 2px 0 0; background: var(--c-cream); border-radius: var(--r-row); box-shadow: inset 0 0 0 2px var(--c-edge); color: var(--c-ink); }
  .hike-strip :global(.stats) { padding: 8px 0; }
  .hike-strip :global(.stats b) { font-size: 22px; }
  .hike-strip :global(.stats dt) { font-size: var(--fs-s); color: var(--text); }
  .hike-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0 max(8px, var(--safe-bottom)); }
  .end { margin: 0; min-height: 52px; min-width: 96px; font-size: var(--fs-talk); }
  .wake { appearance: none; border: 0; background: none; padding: 4px 0; min-height: 52px; display: flex; align-items: center; gap: 10px; text-align: left; color: var(--text); font: 700 var(--fs-body)/1.25 var(--font-ui); cursor: pointer; }
  .wake small { display: block; font-weight: 600; font-size: var(--fs-s); color: var(--text-soft); }
  .sw { flex: none; position: relative; width: 50px; height: 30px; border-radius: 15px; background: var(--ctl-off); box-shadow: inset 0 0 0 2px var(--edge); transition: background-color .15s; }
  .sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: var(--c-card); box-shadow: 0 1px 2px rgb(0 0 0 / .25); transition: transform .15s var(--ease-soft); }
  .wake[aria-checked='true'] .sw { background: var(--c-leaf-edge); box-shadow: none; }
  .wake[aria-checked='true'] .sw::after { transform: translateX(20px); }
  .wake:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: var(--r-row); }
</style>
