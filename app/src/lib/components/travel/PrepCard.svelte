<script lang="ts">
  // じゅんび: one logistics card (a flight, the car, a dive, what to know; docs/design.md §Trips): its head (the
  // icon on a soft tile, or the card's photo; the title, the line under it), its figures as key · value rows, then
  // a row that opens the rest (the description, the lists, the links out), named by its lists' heads.
  import type { Card } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Icon from '../quiet/Icon.svelte';
  import Txt from './Txt.svelte';
  import Stats from './Stats.svelte';
  import Rows from './Rows.svelte';
  import Links from './Links.svelte';
  import { asset } from '$app/paths';
  import { pick } from './text.ts';

  let { card, note }: { card: Card; note: Record<string, string> | null } = $props();
  let open = $state(false);
  const more = $derived(!!card.desc || !!card.sections?.length || !!card.links?.length);
  const moreLabel = $derived(
    card.sections?.some((s) => s.head)
      ? card.sections.flatMap((s) => (s.head ? [pick(s.head, i18n.locale)] : [])).join(i18n.locale === 'ja' ? '・' : ' · ')
      : t('travel.more')
  );
</script>

<article class="q-card prep" data-card={card.id} data-open={open || undefined}>
  <div class="q-row hd">
    {#if card.photo}
      <img class="pi photo" src={asset(card.photo.src as Parameters<typeof asset>[0])} alt="" width="40" height="40" loading="lazy" decoding="async" />
    {:else}
      <span class="pi"><Icon name={card.icon} size={20} /></span>
    {/if}
    <span class="meta">
      <span class="ttl guide"><Txt l={card.title} {note} /></span>
      {#if card.sub}<span class="sub guide"><Txt l={card.sub} {note} /></span>{/if}
    </span>
  </div>
  {#if card.stats?.length}<div class="q-hl"><Stats stats={card.stats} {note} /></div>{/if}
  {#if more}
    <button type="button" class="q-row q-hl tog" aria-expanded={open} aria-controls="trip-card-{card.id}" data-sfx="page" onclick={() => (open = !open)}>
      <span class="ml guide">{moreLabel}</span>
      <span class="chev"><Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} /></span>
    </button>
    {#if open}
      <div class="body guide" id="trip-card-{card.id}">
        {#if card.desc}<p class="desc"><Txt l={card.desc} {note} /></p>{/if}
        {#each card.sections ?? [] as s, i (i)}
          <section class="sec">
            {#if s.head}<h4><Txt l={s.head} {note} /></h4>{/if}
            <Rows rows={s.rows} kind={s.kind} {note} />
          </section>
        {/each}
        {#if card.links?.length}<Links links={card.links} {note} />{/if}
      </div>
    {/if}
  {/if}
</article>

<style>
  .hd { padding: 14px 16px; gap: 12px; }
  .pi { width: 40px; height: 40px; border-radius: 12px; flex: none; display: grid; place-items: center; background: var(--q-accent-soft); color: var(--q-accent-ink); }
  .photo { object-fit: cover; background: var(--q-sunken); }
  .meta { flex: 1; min-width: 0; display: grid; }
  .ttl { font: var(--q-w-b) var(--q-fs-head)/1.35 var(--q-font); }
  .sub { font-size: var(--q-fs-s); color: var(--q-muted); }
  .tog { justify-content: space-between; }
  .ml { flex: 1; min-width: 0; color: var(--q-ink-2); }
  .chev { color: var(--q-muted); display: flex; flex: none; }
  .body { border-top: 1px solid var(--q-hairline); padding: 12px 16px 14px; display: grid; gap: 12px; }
  .desc { margin: 0; line-height: 1.6; }
  .sec { display: grid; gap: 6px; }
  .sec :global(.tl) { padding-left: 0; padding-right: 0; }
  h4 { margin: 0; font: var(--q-w-b) var(--q-fs-s)/1.3 var(--q-font); color: var(--q-muted); letter-spacing: .03em; }
</style>
