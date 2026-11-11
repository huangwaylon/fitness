<script lang="ts">
  // A line of sheet Japanese wrapped by phrase (i18n/phrases.ts), for WebKit, which has no `word-break: auto-phrase`:
  // keep-all with a <wbr> between the phrases, a number never cut, so it breaks 「…場所が / わかります」, never
  // 「わかりま / す」 or 「ご / ほうび」. Use: <p><Phrases text={t('…')} /></p>; a name (a food's): <Phrases text={n} name />,
  // by its brackets and ・ (nameParts). A part wider than the line still breaks where the parent's overflow-wrap lets it.
  import { nameParts, phrases } from '#lib/i18n/phrases.ts';

  let { text, name = false }: { text: string; name?: boolean } = $props();
  const parts = $derived(name ? nameParts(text) : phrases(text));
</script>

<span class="phr">{#each parts as ph, i (i)}{#if i}<wbr />{/if}{#each ph as p, k (k)}{#if k % 2}<span class="num">{p}</span>{:else}{p}{/if}{/each}{/each}</span>

<style>
  .phr { word-break: keep-all; }
  .num { white-space: nowrap; }
</style>
