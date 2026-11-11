<script lang="ts">
  // A line of sheet Japanese wrapped by phrase (i18n/phrases.ts), for WebKit, which has no `word-break: auto-phrase`:
  // keep-all with a <wbr> between the phrases, a number never cut, so it breaks 「…場所が / わかります」, never
  // 「わかりま / す」 or 「ご / ほうび」. Use: <p><Phrases text={t('…')} /></p>
  import { phrases } from '#lib/i18n/phrases.ts';

  let { text }: { text: string } = $props();
  const parts = $derived(phrases(text));
</script>

<span class="phr">{#each parts as ph, i (i)}{#if i}<wbr />{/if}{#each ph as p, k (k)}{#if k % 2}<span class="num">{p}</span>{:else}{p}{/if}{/each}{/each}</span>

<style>
  .phr { word-break: keep-all; }
  .num { white-space: nowrap; }
</style>
