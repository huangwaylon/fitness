<script lang="ts">
  // キャンプ場 (docs/design.md §Trips; a trip with campsites: Okinawa's 35): one ChipRow filter (すべて 35 ·
  // 無料 · 有料 · ビーチ · トイレ · シャワー: one criterion at a time), the sites in one dense card (a row each: the photo
  // thumb (a tent for a site with none), the name, kind · town and the drive from the office (or ferry only), our
  // nights' sticker, its amenities' icons), a row opening its card (CampSheet), then the source's foot.
  //   <CampList {trip} {note} />
  import { photoFallback } from '../ui/photoFallback.ts';
  import type { Camp, Trip } from '#lib/travel/types.ts';
  import { t } from '#lib/i18n/index.ts';
  import { asset } from '$app/paths';
  import Chip from '../ui/Chip.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import Icon from '../ui/Icon.svelte';
  import Txt from './Txt.svelte';
  import CampSheet from './CampSheet.svelte';
  import { amenities, CAMP_FILTERS, campShown, type CampFilter } from './camps.ts';

  let { trip, note }: { trip: Trip; note: Record<string, string> | null } = $props();
  const camps = $derived(trip.camps ?? []);
  let filter = $state<CampFilter>('all');
  const shown = $derived(camps.filter((c) => campShown(c, filter)));
  const ICON = { beach: 'waves', toilet: 'toilet', shower: 'shower' } as const;

  let open = $state(false);
  let camp = $state<Camp | null>(null);
  function show(c: Camp) {
    camp = c;
    open = true;
  }
</script>

<div class="camps" data-camps>
  <div class="ctl">
    <ChipRow label={t('travel.camps.filter')}>
      {#each CAMP_FILTERS as f (f)}
        <Chip label={t(`travel.camps.${f}`)} count={f === 'all' ? camps.length : undefined} selected={filter === f} data-camp-filter={f} onclick={() => (filter = f)} />
      {/each}
    </ChipRow>
  </div>
  <ul class="card dense list">
    {#each shown as c (c.id)}
      {@const nights = c.chips.filter((x) => x.pick)}
      <li>
        <button type="button" class="row camp" data-camp={c.id} data-sfx="open" onclick={() => show(c)}>
          {#if c.photo}<img class="th" src={asset(c.photo.src as Parameters<typeof asset>[0])} alt="" width="48" height="48" loading="lazy" decoding="async" {@attach photoFallback} />{:else}<span class="th none-ph"><Icon name="tent" size={20} /></span>{/if}
          <span class="tx">
            <span class="nm guide"><Txt l={c.name} {note} />{#each nights as n, i (i)}<span class="sticker"><Txt l={n.text} {note} /></span>{/each}</span>
            <span class="sb guide"><Txt l={c.sub} {note} /> · {c.fromMin === undefined ? t('travel.camps.ferry') : t('travel.camps.drive', { min: c.fromMin })}</span>
          </span>
          <span class="am">{#each amenities(c) as a (a)}<span title={t(`travel.camps.${a}`)}><Icon name={ICON[a]} size={16} /></span>{/each}</span>
        </button>
      </li>
    {:else}
      <li class="row none">{t('travel.camps.none')}</li>
    {/each}
  </ul>
  {#if trip.campsFoot}<p class="foot guide"><Txt l={trip.campsFoot} {note} /></p>{/if}
</div>

<CampSheet bind:open {camp} {note} />

<style>
  .camps { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
  p { margin: 0; }
  /* the filter held under the title bar as the sites scroll */
  .ctl { position: sticky; top: 0; z-index: 3; margin: 0 -12px; padding: 4px 0 2px; background: var(--surface); }
  .list { list-style: none; margin: 0; padding: 0; }
  .list li { position: relative; }
  .list li + li::before { content: ''; position: absolute; top: 0; left: 12px; right: 12px; border-top: 1.5px dashed var(--stitch); z-index: 1; pointer-events: none; }
  .camp { width: 100%; }
  .th { width: 48px; height: 48px; flex: none; border-radius: var(--r-chip); object-fit: cover; background: var(--ctl-off); }
  /* an outer-island site: no photo of ours */
  .none-ph { display: grid; place-items: center; color: var(--text-soft); }
  .tx { flex: 1; min-width: 0; display: grid; gap: 2px; text-align: start; }
  .nm { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .sb { font-size: var(--fs-s); color: var(--text-soft); }
  .am { flex: none; display: flex; gap: 4px; color: var(--sky-text); }
  .none { color: var(--text-soft); font-size: var(--fs-s); }
  .foot { padding: 6px 4px 0; font-size: var(--fs-s); line-height: 1.5; color: var(--text-soft); }
</style>
