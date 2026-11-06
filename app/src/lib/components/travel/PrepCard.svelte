<script lang="ts">
  // 準備: one logistics card (a flight, the car, a dive, what to know; docs/design.md §Trips): a dense card, its head
  // (the icon on a cream disc, or the card's photo; the title, the line under it), its figures as key · value rows,
  // then a row that opens the rest (the description, the lists, the links out), named by its lists' heads.
  import type { Card } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Icon from '../ui/Icon.svelte';
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

<article class="card dense prep" data-card={card.id} data-open={open || undefined}>
  <div class="row hd">
    {#if card.photo}
      <img class="pi photo" src={asset(card.photo.src as Parameters<typeof asset>[0])} alt="" width="36" height="36" loading="lazy" decoding="async" />
    {:else}
      <span class="pi"><Icon name={card.icon} size={18} /></span>
    {/if}
    <h3 class="meta">
      <span class="ttl guide"><Txt l={card.title} {note} /></span>
      {#if card.sub}<span class="sub guide"><Txt l={card.sub} {note} /></span>{/if}
    </h3>
  </div>
  {#if card.stats?.length}<hr class="stitch" /><Stats stats={card.stats} {note} />{/if}
  {#if more}
    <hr class="stitch" />
    <button type="button" class="row tog" aria-expanded={open} aria-controls="trip-card-{card.id}" data-sfx="page" onclick={() => (open = !open)}>
      <span class="ml guide">{moreLabel}</span>
      <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} />
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
  .stitch { margin: 0 12px; }
  .pi {
    width: 36px; height: 36px; border-radius: 50%; flex: none; display: grid; place-items: center;
    background: var(--c-cream); color: var(--c-ink); box-shadow: inset 0 0 0 1.5px var(--stitch);
  }
  .photo { object-fit: cover; background: var(--ctl-off); }
  .meta { flex: 1; min-width: 0; display: grid; margin: 0; font: inherit; }
  .ttl { font: 700 var(--fs-body)/1.35 var(--font-ui); }
  .sub { font-size: var(--fs-s); color: var(--text-soft); }
  .tog { color: var(--text-soft); }
  .ml { flex: 1; min-width: 0; font-size: var(--fs-s); font-weight: 600; }
  .body { padding: 4px 12px 12px; display: grid; gap: 10px; }
  .desc { margin: 0; font-size: .875rem; line-height: 1.55; }
  /* a timeline's spine and dots: the leaf (a day card's are the day's colour) */
  .sec { display: grid; gap: 4px; --c: var(--c-leaf-edge); }
  .sec :global(.tl) { padding-left: 0; padding-right: 0; }
  h4 { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); letter-spacing: .03em; }
</style>
