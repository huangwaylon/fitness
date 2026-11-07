<script lang="ts">
  // A results page's shell, every game's: しずえ reads out the results (her line in the bubble), the game's sections under
  // it (`children`: the headline card, its own strip, the review or the list), and the foot's 終わる / もう一度遊ぶ.
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Bubble from '../../ui/Bubble.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { line, children, ondone, onagain, ...rest }: { line: string; children: Snippet; ondone: () => void; onagain: () => void } & HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class="results" data-kiki-results {...rest}>
  <Bubble text={line} host="wave" size={64} />
  {@render children()}
</div>

<div class="level-acts">
  <button type="button" class="btn paper" data-kiki-done data-sfx="back" onclick={ondone}>{t('kiki.done')}</button>
  <button type="button" class="btn" data-kiki-again data-sfx="confirm" onclick={onagain}>{t('kiki.again')}</button>
</div>

<style>
  .results { display: grid; gap: 14px; }
  .results :global(.bubble) { margin-bottom: 0; }
</style>
