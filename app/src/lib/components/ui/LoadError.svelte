<script lang="ts">
  // A failed load, every sheet's one look (docs/design.md "Unified kit"): a yuzu-tinted row, what failed in the
  // caller's words (offline said as offline), and もう一度 (sunk while a load is on its way). Whatever was shown before
  // stays under it. More attributes (a data-* for tests) go on the row. `tone="bad"`: an act that failed (coral); no
  // `onretry`: nothing to try again (no button).
  import type { HTMLAttributes } from 'svelte/elements';
  import Phrases from './Phrases.svelte';
  import { t } from '#lib/i18n/index.ts';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
    text: string;
    onretry?: () => void;
    busy?: boolean;
    tone?: 'bad';
    /** The button's label, when not もう一度. */
    retry?: string;
  };
  let { text, onretry, busy = false, retry, tone, ...rest }: Props = $props();
</script>

<div class="prow static load-error" class:bad={tone === 'bad'} aria-live="polite" {...rest}>
  <span class="prl"><Phrases {text} /></span>
  {#if onretry}<button type="button" class="btn small paper" data-sfx="tick" aria-disabled={busy} onclick={() => busy || onretry()}>{retry ?? t('state.retry')}</button>{/if}
</div>

<style>
  /* (a class of its own, so .prow.static's background can't win) */
  .prow.load-error { background: var(--warn-soft); }
  .prow.load-error.bad { color: var(--coral-text); background: color-mix(in srgb, var(--c-coral) 18%, var(--card)); }
</style>
