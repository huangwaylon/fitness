<script lang="ts">
  // じゅんび: one logistics card (a flight, the car, a dive, what to know), a Fold: its head the icon, the title, the
  // line under it; open, the description, the photo, the figures, the lists, the links out.
  import type { Card } from '#lib/travel/types.ts';
  import { glyphOf } from './icons.ts';
  import Fold from './Fold.svelte';
  import Txt from './Txt.svelte';
  import Photo from './Photo.svelte';
  import Stats from './Stats.svelte';

  let { card, open, ontoggle, note }: { card: Card; open: boolean; ontoggle: () => void; note: Record<string, string> | null } = $props();
</script>

<Fold id="trip-card-{card.id}" {open} {ontoggle} {note} sections={card.sections} links={card.links} data-card={card.id}>
  {#snippet head()}
    <span class="ic" aria-hidden="true">{glyphOf(card.icon)}</span>
    <span class="meta">
      <span class="ttl guide"><Txt l={card.title} {note} /></span>
      {#if card.sub}<span class="sub guide"><Txt l={card.sub} {note} /></span>{/if}
    </span>
  {/snippet}
  {#snippet pin()}
    <span aria-hidden="true">{glyphOf(card.icon)}</span><span class="pt"><Txt l={card.title} {note} /></span>
  {/snippet}
  {#if card.desc}<p class="desc"><Txt l={card.desc} {note} /></p>{/if}
  {#if card.photo}<Photo photo={card.photo} />{/if}
  {#if card.stats?.length}<Stats stats={card.stats} {note} />{/if}
</Fold>

<style>
  .ic { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--surface); font-size: 1.35rem; line-height: 1; }
  .meta { display: grid; gap: 2px; min-width: 0; }
  .ttl { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .sub { font: 500 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .desc { margin: 0; font: 500 var(--fs-body)/1.6 var(--font-ui); }
</style>
