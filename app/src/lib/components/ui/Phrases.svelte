<script lang="ts">
  // A line of sheet Japanese wrapped by phrase (i18n/phrases.ts), for WebKit, which has no `word-break: auto-phrase`:
  // keep-all with a <wbr> between the phrases, a number never cut, so it breaks 「…場所が / わかります」, never
  // 「わかりま / す」 or 「ご / ほうび」. Use: <p><Phrases text={t('…')} /></p>; a name (a food's): <Phrases text={n} name />,
  // by its brackets and ・ (nameParts). A part wider than the line still breaks where the parent's overflow-wrap lets it.
  import { nameParts, phrases } from '#lib/i18n/phrases.ts';

  let { text, name = false }: { text: string; name?: boolean } = $props();
  const parts = $derived(name ? nameParts(text) : phrases(text));
  /** A bare number (17,090 · 12 · 3.5): plain text, no span. Nothing breaks inside one (UAX #14: digits with , . between),
   *  and an inline-block span would put spaces around it in the accessible name (「全部で 33 個」: shop.spec 全部売る). */
  const BARE = /^[\d,.]+$/;
</script>

<span class="phr">{#each parts as ph, i (i)}{#if i}<wbr />{/if}{#each ph as p, k (k)}{#if k % 2 && !BARE.test(p)}<span class="num">{p}</span>{:else}{p}{/if}{/each}{/each}</span>

<style>
  .phr { word-break: keep-all; }
  /* A number with its brackets or punctuation (（3件） · 9かいがら）), kept whole. inline-block, not `nowrap`: WebKit with
     keep-all + line-break: strict paints a nowrap span that ends a line twice (「…近い4日だけ / 4日だけ 12:00〜」 in the
     gym's note, Zen Maru Gothic; walk-through 11/24). */
  .num { display: inline-block; }
</style>
