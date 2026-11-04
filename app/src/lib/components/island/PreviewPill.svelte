<script lang="ts">
  // The seasonal preview's chip under the HUD row (beside the sync chip): while せってい's きせつ shows another day's
  // look, it says which (「きせつ: ハロウィン」), so the island is never mistaken for the real day; a tap is もどす.
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { clearPreview, previewChoice } from '#lib/ui-state/preview.svelte.ts';
  import type { Choice } from '#lib/ui-state/preview.ts';
  import { previewLabel } from '../panel/previewLabel.ts';

  const label = $derived.by(() => {
    const c = previewChoice();
    const key = (['event', 'season', 'weather', 'tod'] as const).find((k) => c[k] !== null) as keyof Choice | undefined;
    return key ? previewLabel(key, c[key]!, week.view) : null;
  });
</script>

{#if label}
  <button type="button" class="chip" data-preview-chip aria-label={t('preview.chipLabel', { what: label })} data-sfx="back" onclick={clearPreview}>
    <span aria-hidden="true">{t('preview.chip', { what: label })}</span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  </button>
{/if}

<style>
  .chip {
    appearance: none; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    min-height: 32px; padding: 0 9px 0 12px; border-radius: var(--r-chip);
    background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj); font: 700 var(--fs-s)/1 var(--font-ui);
    position: relative;
  }
  /* A 44px tap target around the 32px chip. */
  .chip::after { content: ''; position: absolute; inset: -6px -4px; }
  .chip:active { transform: translateY(3px); box-shadow: var(--sh-obj-press); }
  svg { width: 12px; height: 12px; flex: none; stroke: var(--c-coral); stroke-width: 3.5; stroke-linecap: round; fill: none; }
</style>
