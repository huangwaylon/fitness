<script lang="ts">
  // A campsite's card (docs/design.md §Trips, キャンプ場): the kit's sheet over the trip, from its row or its map pin:
  // the photo (if ours), the kind and town, the description, its tags (our nights' as yuzu stickers), the drive from the
  // office (or ferry only), the kind and the fee as key · value rows, and Maps out.
  //   <CampSheet bind:open camp={c} {note} />
  import type { Camp } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Sheet from '../ui/Sheet.svelte';
  import Photo from './Photo.svelte';
  import Stats from './Stats.svelte';
  import Links from './Links.svelte';
  import Txt from './Txt.svelte';
  import { pick } from './text.ts';
  import { fmtKm } from './units.ts';

  let { open = $bindable(), camp, note }: { open: boolean; camp: Camp | null; note: Record<string, string> | null } = $props();
  const name = $derived(camp ? pick(camp.name, i18n.locale) : '');
</script>

<Sheet bind:open title={name}>
  {#if camp}
    <div class="camp guide" data-camp-sheet={camp.id}>
      {#if camp.photo}<Photo photo={camp.photo} />{/if}
      <p class="sub"><Txt l={camp.sub} {note} /></p>
      <p class="desc"><Txt l={camp.desc} {note} /></p>
      <div class="tags">
        {#each camp.chips as c, i (i)}<span class={c.pick ? 'sticker' : 'tag'}><Txt l={c.text} {note} /></span>{/each}
      </div>
      <div class="card dense">
        <Stats {note} stats={[
          { k: t('travel.camps.office'), v: camp.fromMin === undefined || camp.fromKm === undefined ? t('travel.camps.ferry') : `${t('travel.camps.drive', { min: camp.fromMin })} · ${fmtKm(camp.fromKm)}` },
          { k: t('travel.camps.type'), v: t(`travel.camps.kind.${camp.type}`) },
          { k: t('travel.camps.fee'), v: camp.fee }
        ]} />
      </div>
      <Links links={[{ label: { [i18n.locale]: t('travel.camps.maps') }, href: camp.maps }]} {note} />
    </div>
  {/if}
</Sheet>

<style>
  .camp { display: grid; gap: 10px; padding-bottom: 8px; }
  /* the photo a band (its description and facts in view without a scroll) */
  .camp :global(.ph img) { height: 200px; object-fit: cover; }
  p { margin: 0; }
  .sub { font: 700 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .desc { font-size: .9375rem; line-height: 1.55; }
  .tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .tags .sticker { transform: none; }
</style>
