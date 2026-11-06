<script lang="ts">
  // じゅんび: one logistics card (a flight, the car, a dive, what to know): its head a button (the icon, the title, the
  // line under it), opening the card: the description, the photo, the figures, the lists, the links out.
  import type { Card } from '#lib/travel/types.ts';
  import { glyphOf } from './icons.ts';
  import Txt from './Txt.svelte';
  import Rows from './Rows.svelte';
  import Links from './Links.svelte';
  import Photo from './Photo.svelte';
  import Stats from './Stats.svelte';

  let { card, open, ontoggle, note }: { card: Card; open: boolean; ontoggle: () => void; note: Record<string, string> | null } = $props();
  const id = $derived(`trip-card-${card.id}`);
</script>

<article class="gc card" class:open data-card={card.id} data-open={open || undefined}>
  <h3 class="head">
    <button type="button" class="tog" aria-expanded={open} aria-controls={id} data-sfx="page" onclick={ontoggle}>
      <span class="ic" aria-hidden="true">{glyphOf(card.icon)}</span>
      <span class="meta">
        <span class="ttl guide"><Txt l={card.title} {note} /></span>
        {#if card.sub}<span class="sub guide"><Txt l={card.sub} {note} /></span>{/if}
      </span>
      <svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
    </button>
  </h3>
  {#if open}
    <div class="body guide" {id}>
      {#if card.desc}<p class="desc"><Txt l={card.desc} {note} /></p>{/if}
      {#if card.photo}<Photo photo={card.photo} />{/if}
      {#if card.stats?.length}<Stats stats={card.stats} {note} />{/if}
      {#each card.sections ?? [] as s, i (i)}
        <section class="sec">
          {#if s.head}<h4><Txt l={s.head} {note} /></h4>{/if}
          <Rows rows={s.rows} kind={s.kind} {note} />
        </section>
      {/each}
      {#if card.links?.length}<Links links={card.links} {note} />{/if}
    </div>
  {/if}
</article>

<style>
  .gc { padding: 0; overflow: clip; }
  .head { margin: 0; font: inherit; }
  .tog {
    appearance: none; border: 0; background: none; width: 100%; margin: 0; padding: 12px; cursor: pointer; text-align: left;
    display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 64px;
    color: var(--text); border-radius: var(--r-card); -webkit-tap-highlight-color: transparent;
  }
  .tog:active { background: var(--hl); }
  .ic { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--surface); font-size: 1.35rem; line-height: 1; }
  .meta { display: grid; gap: 2px; min-width: 0; }
  .ttl { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .sub { font: 500 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .chev { width: 18px; height: 18px; fill: none; stroke: var(--text-soft); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; transition: transform 200ms var(--ease-soft); }
  .open .chev { transform: rotate(180deg); }
  .body { display: grid; gap: 14px; padding: 2px 14px 14px; animation: in 220ms var(--ease-soft); }
  @keyframes in { from { opacity: 0; transform: translateY(-6px); } }
  .desc { margin: 0; font: 500 var(--fs-body)/1.6 var(--font-ui); }
  .sec { display: grid; gap: 6px; }
  h4 { margin: 0 4px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); letter-spacing: .03em; }
  @media (prefers-reduced-motion: reduce) { .body { animation: none; } .chev { transition: none; } }
</style>
