<script lang="ts">
  // A guide string in a classic guide: the reader's side of the pair (else the other, with its lang), its measures in
  // the phone's units, its private values from the trip note (🔒 ・・・ until it's in). No <wbr>s: the old site's
  // Japanese broke anywhere, as the browser breaks it.
  import type { L } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { otherLang, pick, render } from '../text.ts';

  let { l, note }: { l: L | undefined; note: Record<string, string> | null } = $props();
  const parts = $derived(render(pick(l, i18n.locale), note));
  const lang = $derived(otherLang(l, i18n.locale));
</script>

<span lang={lang ?? undefined}>{#each parts as p, i (i)}{#if p.k === 'text'}{p.s}{:else}<span class="lock" role="img" aria-label={t('travel.locked')} data-locked={p.key}>🔒 ・・・</span>{/if}{/each}</span>
