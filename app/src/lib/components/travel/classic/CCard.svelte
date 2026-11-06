<script lang="ts">
  // A classic logistics card (the site's details.card.travel: the ringed node, the icon in the second accent):
  // inside, its photo, description, stat grid, headed lists and links out, in that order. Closed at first.
  import type { Card } from '#lib/travel/types.ts';
  import CText from './CText.svelte';
  import CIcon from './CIcon.svelte';
  import CList from './CList.svelte';
  import CLinks from './CLinks.svelte';
  import CPhoto from './CPhoto.svelte';

  let { card, note }: { card: Card; note: Record<string, string> | null } = $props();
</script>

<details class="ccard travel" data-card={card.id}>
  <summary class="head" data-sfx="page">
    <span class="node"></span>
    <span class="gly"><CIcon name={card.icon} /></span>
    <div class="ttl"><div class="t"><CText l={card.title} {note} /></div>{#if card.sub}<div class="sub2"><CText l={card.sub} {note} /></div>{/if}</div>
    <span class="chev"><CIcon name="chevron-right" /></span>
  </summary>
  <div class="content">
    {#if card.photo}<CPhoto photo={card.photo} />{/if}
    {#if card.desc}<p class="desc"><CText l={card.desc} {note} /></p>{/if}
    {#if card.stats?.length}
      <div class="stat-grid">
        {#each card.stats as s, i (i)}<div class="stat"><div class="k"><CText l={s.k} {note} /></div><div class="v"><CText l={s.v} {note} /></div></div>{/each}
      </div>
    {/if}
    {#each card.sections ?? [] as s, i (i)}
      {#if s.head}<div class="subhead"><CText l={s.head} {note} /></div>{/if}
      <CList kind={s.kind} rows={s.rows} {note} />
    {/each}
    {#if card.links?.length}<CLinks links={card.links} {note} />{/if}
  </div>
</details>
