<script lang="ts">
  // A record text on the visitor's page (a packing item's name or note, a trip note's value), as the relay redacted it:
  // plain text, each hidden run (🔒: contract/private.ts) the guides' lock chip. Never a link, never HTML.
  //   <Redacted s={note} />
  import { LOCK } from '#lib/contract/private.ts';
  import { t } from '#lib/i18n/index.ts';

  let { s }: { s: string } = $props();
  const parts = $derived(s.split(LOCK));
</script>

<span>{#each parts as p, i (i)}{#if i}<span class="lock" role="img" aria-label={t('travel.locked')} data-locked="redacted">🔒 ・・・</span>{/if}{p}{/each}</span>

<style>
  .lock {
    display: inline-block; padding: 0 6px; margin: 0 1px; border-radius: 6px; white-space: nowrap;
    background: var(--ctl-off); color: var(--text-soft); font-size: .9em; line-height: 1.4; letter-spacing: .08em;
  }
</style>
