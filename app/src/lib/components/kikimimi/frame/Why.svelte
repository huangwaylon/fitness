<script lang="ts">
  // 解説 (docs/kikimimi.md "Japanese help"): an item's `why`, why the answer is right and the trap wrong, in a box under
  // the verdict and in the review list's open row.
  import { t } from '#lib/i18n/index.ts';

  let { text }: { text: string } = $props();
</script>

<aside class="why" data-kiki-why lang="ja"><b>{t('kiki.why')}</b><p>{text}</p></aside>

<style>
  /* a soft mint card, its label on top: the fixed cream and ink, readable at any time of day */
  .why {
    display: grid; gap: 2px; padding: 8px 12px; border-radius: 14px; text-align: left; color: var(--c-ink);
    background: color-mix(in srgb, var(--c-mint) 30%, var(--c-card)); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c-mint) 85%, var(--c-ink));
  }
  .why b { font: 700 var(--fs-xs)/1.3 var(--font-ui); color: var(--c-ink-soft); }
  .why p { margin: 0; font: 700 var(--fs-s)/1.55 var(--font-ui); }
</style>
