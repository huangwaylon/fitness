<script lang="ts">
  // りょこう's first level (docs/design.md §Trips): a card of rows per group, これからの旅 (on now and coming, soonest
  // first) and これまで (the past, newest first): the cover, the place, its dates and area · days, and where it stands
  // (「あと97日」, 「あした」, 「2日目」). Under them the one km | mi switch (this phone's, units.ts). From the trips'
  // meta only (trips/meta.ts): no guide loads for the list.
  import type { TripId } from '#lib/travel/types.ts';
  import type { TripMeta } from '#lib/travel/trips/meta.ts';
  import { asset } from '$app/paths';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Icon from '../quiet/Icon.svelte';
  import Segmented from '../quiet/Segmented.svelte';
  import { phaseOf, sortTrips, type Phase } from './when.ts';
  import { listSpan } from './dates.ts';
  import { pick } from './text.ts';
  import { UNITS, setUnits, units } from './units.ts';

  interface Props {
    trips: readonly TripMeta[];
    now: number;
    onopen: (id: TripId) => void;
  }
  let { trips, now, onopen }: Props = $props();
  const sorted = $derived(sortTrips(trips, now));
  const unitItems = UNITS.map((u) => ({ id: u, label: u }));
  const badge = (p: Phase): string | null =>
    p.k === 'now' ? t('travel.day', { n: p.day }) : p.k === 'soon' ? (p.days === 1 ? t('travel.tomorrow') : t('travel.soon', { n: p.days })) : null;
</script>

{#snippet row(m: TripMeta)}
  {@const p = phaseOf(m, now)}
  {@const b = badge(p)}
  <button type="button" class="q-row trip" class:past={p.k === 'past'} data-trip={m.id} data-phase={p.k} data-sfx="page" onclick={() => onopen(m.id)}>
    <img class="th" src={asset(m.cover.src as Parameters<typeof asset>[0])} alt="" width="72" height="72" loading="eager" decoding="async" />
    <span class="tx">
      <span class="l1"><span class="ttl q-ell" lang={m.title[i18n.locale] ? undefined : i18n.locale === 'ja' ? 'en' : 'ja'}>{pick(m.title, i18n.locale)}</span>
        {#if b}<span class="q-badge" data-badge={p.k} data-days={p.k === 'soon' ? p.days : undefined} data-day-now={p.k === 'now' ? p.day : undefined}>{b}</span>{/if}</span>
      <span class="dates">{listSpan(m.start, m.end, i18n.locale)}</span>
      <span class="meta">{pick(m.eyebrow, i18n.locale)}</span>
    </span>
    <span class="chev"><Icon name="chevron-right" size={18} /></span>
  </button>
{/snippet}

<div class="list" data-trip-list>
  {#if sorted.coming.length}
    <h3 class="q-sec">{t('travel.coming')}</h3>
    <div class="q-card">{#each sorted.coming as m (m.id)}{@render row(m)}{/each}</div>
  {/if}
  {#if sorted.past.length}
    <h3 class="q-sec" data-memories>{t('travel.memories')}</h3>
    <div class="q-card">{#each sorted.past as m (m.id)}{@render row(m)}{/each}</div>
  {/if}
  <div class="q-card units">
    <div class="q-row">
      <span class="q-muted"><Icon name="ruler" size={18} /></span>
      <span class="ul">{t('travel.units')}</span>
      <Segmented items={unitItems} value={units.current} label={t('travel.units')} attr="units" onpick={setUnits} />
    </div>
  </div>
</div>

<style>
  .list { flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; padding: 0 16px calc(var(--safe-bottom, 0px) + 24px); }
  .trip { padding: 12px 14px 12px 12px; gap: 14px; }
  .th { width: 72px; height: 72px; border-radius: 14px; object-fit: cover; flex: none; background: var(--q-sunken); }
  .tx { flex: 1; min-width: 0; display: grid; }
  .l1 { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; min-width: 0; }
  .ttl { flex: 1; min-width: 0; font: var(--q-w-b) var(--q-fs-head)/1.3 var(--q-font); }
  .dates { font-size: var(--q-fs-s); color: var(--q-ink-2); }
  .meta { font-size: var(--q-fs-s); color: var(--q-muted); }
  .chev { color: var(--q-muted); margin-right: -4px; display: flex; }
  .past .th { filter: saturate(.55); opacity: .8; }
  .past .ttl { color: var(--q-ink-2); }
  .past .dates { color: var(--q-muted); }
  .units { margin-top: 28px; }
  .units .q-row { padding: 8px 12px 8px 16px; }
  .ul { flex: 1; color: var(--q-ink-2); }
</style>
