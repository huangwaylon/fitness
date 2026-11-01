<script lang="ts">
  // The plate of the catch shown now (catchCard.ts): keyed per catch, and when it closes my villager puts the item
  // away. `card` is the parent's (bindable): the plate clears it, unless a newer catch has taken its place.
  //   <CatchPlate {scene} bind:card />
  import Plate from './Plate.svelte';
  import { putAway } from '../motion/director.svelte.ts';
  import type { CatchCard } from './catchCard.ts';

  let { scene, card = $bindable() }: { scene?: HTMLElement; card: CatchCard | null } = $props();

  function done(n: number) {
    if (card?.n !== n) return;
    const who = card.who ?? 'mine';
    card = null;
    putAway(who);
  }
</script>

{#if card}
  {@const c = card}
  {#key c.n}<Plate {scene} x={c.x} y={c.y} art={c.art} parts={c.parts} ondone={() => done(c.n)} />{/key}
{/if}
