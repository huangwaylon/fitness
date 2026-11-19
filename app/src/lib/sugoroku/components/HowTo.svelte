<script lang="ts">
  // 英語すごろく's 遊び方: the tab's page and the play screen's ⋯ sheet.
  import { REWARD, REWARD_GOAL } from '../game.ts';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { s } from '../i18n.ts';

  // (each wrapped by phrase: never 「マ / ス」)
  const items = $derived((['how1', 'how2', 'how3', 'how4', 'how7', 'how8', 'how5'] as const).map((k) => s(k)).concat(s('how6', { n: REWARD, g: REWARD + REWARD_GOAL })));
</script>

<ol class="how">
  {#each items as text, i (i)}<li><Phrases {text} /></li>{/each}
</ol>

<style>
  .how { margin: 0; padding-left: 28px !important; display: grid; gap: 8px; font-size: var(--fs-body); line-height: 1.5; }
</style>
