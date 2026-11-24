<script lang="ts" generics="L extends string">
  // A map screen's drag-up sheet (map/sheet.svelte.ts: its states and drags): the app's paper with its lip over the map,
  // the grip on top, the screen's own content (a peek and a body, a head and a list) under it. No pill drawn atop it (the
  // user: its strip cost height; one rule across the app's sheets): the grip is unseen, 160 × 44 in the middle: REACH px over the
  // map's edge (clear of the discs and pills at the sides) and the STRIP px inset at the paper's top (the content's side
  // padding), so nothing on the paper (a card's ‹, the search field) is covered; the peek, the head and a low
  // list drag the sheet too. Focused (a keyboard, VoiceOver), the whole sheet is ringed.
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
  /* (160 × 44 in the middle: REACH 32 over the edge, STRIP 12 on the paper, the layout's) */
  .grip {
    flex: none; align-self: center; width: 160px; height: 44px; margin-top: -32px; cursor: grab; touch-action: none;
    -webkit-user-select: none; user-select: none;
  }
  .grip:focus-visible { outline: none; }
  .sheet:has(> .grip:focus-visible) { outline: 2px solid var(--focus); outline-offset: -2px; }
</style>
