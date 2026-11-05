<script lang="ts">
  // The video channel (docs/kikimimi.md "Visuals"): a 2×2 call grid over the (blurred) room, the speakers and two
  // others, each tile a head on a pastel ground with a name tag; whoever's talking ringed in yuzu (bobbing; still under
  // reduced motion), one of the others muted. The clip's bar along the foot. Pure CSS.
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import ClipBar from './ClipBar.svelte';
  import { villagerArt } from '#lib/art.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';

  let { tiles, talker, name, bar, now }: { tiles: RosterId[]; talker: RosterId | null; name: (id: RosterId) => string; bar: { from: number; until: number; key: string } | null; now: number } = $props();
  const GROUND = ['#cde8f4', '#f6dce6', '#e2f1d6', '#fff0c4'];
</script>

<div class="video" data-kiki-frame="video">
  <div class="grid">
    {#each tiles as who, k (who)}
      <div class="tile" class:speak={talker === who} class:talk={!!bar && talker === who} style:--t={GROUND[k % 4]} data-tile={who}>
        <span class="head"><OfficialArt key={villagerArt(who, true)} alt="" size={46} eager /></span>
        <span class="lbl">
          {#if k === tiles.length - 1}<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="4" y="1" width="4" height="6.5" rx="2" fill="#fff9e3" /><path d="M2.5 6a3.5 3.5 0 0 0 7 0M6 9.5V11" stroke="#fff9e3" stroke-width="1.2" fill="none" /><path d="M1.5 1.5l9 9" stroke="#ff8f7a" stroke-width="1.6" stroke-linecap="round" /></svg>{/if}
          {name(who)}
        </span>
      </div>
    {/each}
  </div>
  <span class="bar"><ClipBar {bar} {now} /></span>
</div>

<style>
  .video { position: absolute; inset: 0; z-index: 1; display: grid; grid-template-rows: 1fr auto; gap: 6px; padding: 40px 10px 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 6px; min-height: 0; }
  .tile { position: relative; border-radius: 14px; overflow: hidden; display: grid; place-items: center; background: var(--t); box-shadow: inset 0 0 0 2px rgba(74, 58, 44, .1); min-height: 0; }
  /* the head high in its tile (a horn or ears never cut at the top), its chin clear of the name tag */
  .head { line-height: 0; align-self: start; margin-top: 5px; }
  .tile.speak { box-shadow: inset 0 0 0 4px var(--c-yuzu), 0 0 0 2px var(--c-yuzu-lip, var(--c-yuzu)); }
  .tile.talk .head { animation: bob 520ms ease-in-out infinite alternate; }
  .lbl {
    position: absolute; left: 4px; bottom: 4px; display: inline-flex; gap: 3px; align-items: center; padding: 1px 6px; border-radius: var(--r-pill);
    background: rgba(74, 58, 44, .66); color: var(--c-cream); font: 700 var(--fs-xs)/1.25 var(--font-ui);
  }
  .lbl svg { width: 11px; height: 11px; }
  @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-3px); } }
  @media (prefers-reduced-motion: reduce) { .tile.talk .head { animation: none; } }
</style>
