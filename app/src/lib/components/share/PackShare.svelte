<script lang="ts">
  // 持ち物 on the visitor's page (`trips` links, docs/travel.md "Sharing"): the trip's list read-only, the bundle's seed
  // with the shared ops over it (contract/share.ts sharedPackList), a card per category, a row per item (its text and
  // note, redacted by the relay), a category's guide icon (not the NH art: the page stays light). No ticks, no who, no
  // 編集: never the packing store (PackList is ours).
  import type { Trip } from '#lib/travel/types.ts';
  import { sharedPackList, type SharedTrip, type ShareTripRef } from '#lib/contract/share.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Icon, { isIcon } from '../ui/Icon.svelte';
  import { packView } from '../travel/packView.ts';
  import Redacted from './Redacted.svelte';
  import Phrases from '../ui/Phrases.svelte';

  let { trip, shared }: { trip: Trip; shared: SharedTrip | undefined } = $props();
  const view = $derived(packView(sharedPackList(trip.id as ShareTripRef, trip.packing, shared), null, i18n.locale));
  const total = $derived(view.reduce((n, c) => n + c.total, 0));
</script>

<div class="pack" data-share-pack={trip.id} data-pack-total={total}>
  <p class="count"><Phrases text={t('travel.pack.items', { n: total })} /></p>
  {#each view as c (c.id)}
    <section class="card dense cat" data-pack-cat={c.id} aria-labelledby="sp-{c.id}">
      <h3 class="row ch">
        <span class="ci" aria-hidden="true">
          <Icon name={isIcon(c.icon) ? c.icon : 'shopping-bag'} size={18} />
        </span>
        <span class="cn" id="sp-{c.id}"><Redacted s={c.name} /></span>
        <span class="cc">{c.total}</span>
      </h3>
      {#each c.rows as r (r.id)}
        <div class="row pr" data-pack-item={r.id}>
          <span class="dot" aria-hidden="true"></span>
          <span class="tx"><span class="it"><Redacted s={r.text} /></span>{#if r.note}<small><Redacted s={r.note} /></small>{/if}</span>
        </div>
      {:else}
        <p class="row none"><Phrases text={t('travel.pack.emptyCat')} /></p>
      {/each}
    </section>
  {:else}
    <p class="card dense empty"><Phrases text={t('travel.pack.empty')} /></p>
  {/each}
</div>

<style>
  .pack { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .count { margin: 4px 4px 0; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .tx, .cn { word-break: normal; overflow-wrap: anywhere; }
  .empty { margin: 0; padding: 18px 16px; text-align: center; color: var(--text-soft); }
  .cat { display: grid; }
  .ch { margin: 0; font: inherit; }
  .ci {
    width: 32px; height: 32px; border-radius: 50%; flex: none; display: grid; place-items: center; overflow: hidden; line-height: 1; font-size: 17px;
    background: var(--c-cream); color: var(--c-ink); box-shadow: inset 0 0 0 1.5px var(--stitch);
  }
  .cn { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .cc { flex: none; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .pr { align-items: flex-start; padding-block: 9px; }
  .dot { flex: none; width: 6px; height: 6px; margin: 8px 7px 0; border-radius: 50%; background: var(--stitch); }
  .tx { flex: 1; min-width: 0; display: grid; gap: 1px; padding-top: 2px; }
  .it { font-size: var(--fs-body); line-height: 1.35; }
  .tx small { font-size: var(--fs-s); color: var(--text-soft); line-height: 1.35; }
  .none { color: var(--text-soft); font-size: var(--fs-s); }
</style>
