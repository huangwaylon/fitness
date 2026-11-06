<script lang="ts">
  // もちもの: the slot for the packing list (PackList.svelte, the packing branch: the shared, ticked list on the relay,
  // docs/travel.md "Packing list (relay)"). Until it lands, the guide's own list, read only: a card per category, its
  // items with their small print.
  //   <PackList {trip} />
  import type { Trip } from '#lib/travel/types.ts';
  import { t } from '#lib/i18n/index.ts';
  import { glyphOf } from './icons.ts';
  import Txt from './Txt.svelte';

  let { trip, note }: { trip: Trip; note: Record<string, string> | null } = $props();
</script>

<div class="pack" data-pack-slot>
  <p class="soon">{t('travel.pack.soon')}</p>
  {#each trip.packing.cats as c (c.id)}
    <section class="cat card" data-pack-cat={c.id}>
      <h3><span class="ic" aria-hidden="true">{glyphOf(c.icon)}</span><span class="guide"><Txt l={c.name} {note} /></span><small>{t('travel.pack.count', { n: c.items.length })}</small></h3>
      <ul>
        {#each c.items as it (it.id)}
          <li class="guide"><span class="box" aria-hidden="true"></span><span><Txt l={it.text} {note} />{#if it.note}<small><Txt l={it.note} {note} /></small>{/if}</span></li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

<style>
  .pack { display: grid; gap: 12px; }
  .soon { margin: 0 4px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .cat { padding: 12px 14px; display: grid; gap: 8px; }
  h3 { margin: 0; display: flex; align-items: center; gap: 10px; font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  h3 small { margin-left: auto; font: 700 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .ic { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--surface); font-size: 1.15rem; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; }
  li { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; align-items: start; padding: 8px 2px; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  li + li { border-top: 2px dotted var(--lip); }
  li small { display: block; margin-top: 2px; font: 500 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .box { width: 18px; height: 18px; margin-top: 2px; border-radius: 6px; box-shadow: inset 0 0 0 2px var(--lip); }
</style>
