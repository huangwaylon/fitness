<script lang="ts" generics="L extends string">
  // A map screen's drag-up sheet (map/sheet.svelte.ts: its states and drags): the app's paper with its lip over the map,
  // the grip on top, the screen's own content (a peek and a body, a head and a list) under it. The grip: the pill 10 px
  // down a STRIP px strip; its 44 px hit straddles the sheet's edge (20 px of it over the map, the middle 160 px only:
  // clear of the discs and pills at the sides), so nothing on the paper under the strip (a card's ‹, the search field)
  // is covered.
  import type { Snippet } from 'svelte';
  import type { DragSheet } from './sheet.svelte.ts';

  let { sheet, label, children }: { sheet: DragSheet<L>; label: string; children: Snippet } = $props();
</script>

<svelte:window onresize={sheet.layout} />

<div class="sheet" class:dragging={sheet.drag !== null} style:height="{sheet.height}px" onpointerdowncapture={sheet.fresh} onclickcapture={sheet.swallow}>
  <div class="grip" role="button" tabindex="0" aria-expanded={sheet.state === 'full'} aria-label={label} data-sheet-grip data-sfx="page"
    {...sheet.handle} onkeydown={sheet.key}></div>
  {@render children()}
</div>

<style>
  .sheet {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 600; display: flex; flex-direction: column;
    background: var(--surface); border-radius: var(--r-card) var(--r-card) 0 0; box-shadow: 0 calc(-1 * var(--lip-s)) 0 var(--lip), var(--sh-float);
    transition: height .32s var(--ease-soft);
  }
  .sheet.dragging { transition: none; }
  /* (20 px of it over the edge: sheet.svelte.ts REACH; 25 in the layout, STRIP: then a px clear of what sits under it) */
  .grip {
    flex: none; box-sizing: border-box; height: 44px; margin: -20px 0 1px; padding-top: 30px;
    display: flex; align-items: flex-start; justify-content: center; cursor: grab; touch-action: none; -webkit-user-select: none; user-select: none;
    clip-path: polygon(0 20px, calc(50% - 80px) 20px, calc(50% - 80px) 0, calc(50% + 80px) 0, calc(50% + 80px) 20px, 100% 20px, 100% 100%, 0 100%);
  }
  .grip::before { content: ''; width: 36px; height: 5px; border-radius: var(--r-pill); background: var(--stitch); }
  .grip:focus-visible { outline: none; }
  .grip:focus-visible::before { outline: 2px solid var(--focus); outline-offset: 3px; }
</style>
