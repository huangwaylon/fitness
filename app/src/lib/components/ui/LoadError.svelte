<script lang="ts">
  // A failed load, every sheet's one look (docs/design.md "Unified kit"): a yuzu-tinted row, what failed in the
  // caller's words (offline said as offline), and もう一度 (sunk while a load is on its way). Whatever was shown before
  // stays under it. More attributes (a data-* for tests) go on the row.
  import type { HTMLAttributes } from 'svelte/elements';
  import Phrases from './Phrases.svelte';
  import { t } from '#lib/i18n/index.ts';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
    text: string;
    onretry: () => void;
    busy?: boolean;
    /** The button's label, when not もう一度. */
    retry?: string;
  };
  let { text, onretry, busy = false, retry, ...rest }: Props = $props();
</script>

<div class="prow static load-error" aria-live="polite" {...rest}>
  <span class="prl"><Phrases {text} /></span>
  <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={busy} onclick={() => busy || onretry()}>{retry ?? t('state.retry')}</button>
</div>

<style>
  /* (a class of its own, so .prow.static's background can't win) */
  .prow.load-error { background: var(--warn-soft); }
</style>
