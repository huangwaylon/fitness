<script lang="ts">
  // せってい → きせつ (docs/design.md "Seasonal preview"): show the island another day's look on this phone, for today:
  // an event (Halloween, the fireworks, a birthday…), a season, the weather and the time of day; おまかせ is the real
  // day's. A look only (ui-state/preview.svelte.ts): never synced, never sent, and the island's finds, critters and
  // ベル stay the real day's. もどす (or the HUD's chip) ends it; it ends on its own when the day does.
  import { roving } from '../ui/roving.ts';
  import { t } from '#lib/i18n/index.ts';
  import type { WeekView } from '#lib/types.ts';
  import { PREVIEW_EVENTS, PREVIEW_WEATHER, TODS, type Choice } from '#lib/ui-state/preview.ts';
  import { SEASONS } from '#lib/ui-state/season.ts';
  import { clearPreview, previewChoice, setPreview } from '#lib/ui-state/preview.svelte.ts';
  import { previewLabel } from './previewLabel.ts';

  let { view }: { view: WeekView } = $props();

  const choice = $derived(previewChoice());
  const on = $derived(Object.values(choice).some((v) => v !== null));
  const GROUPS: { key: keyof Choice; values: readonly string[] }[] = [
    { key: 'event', values: PREVIEW_EVENTS },
    { key: 'season', values: SEASONS },
    { key: 'weather', values: PREVIEW_WEATHER },
    { key: 'tod', values: TODS }
  ];
</script>

<div class="card season" data-preview-section>
  {#each GROUPS as g (g.key)}
    <div class="group">
      <h3 id="preview-{g.key}">{t(`preview.${g.key}`)}</h3>
      <div class="chips" role="radiogroup" aria-labelledby="preview-{g.key}" {@attach roving}>
        {#each [null, ...g.values] as v (v)}
          {@const sel = choice[g.key] === v}
          <button type="button" class="chip" role="radio" aria-checked={sel} tabindex={sel ? 0 : -1} data-preview={`${g.key}:${v ?? 'auto'}`}
            data-sfx={sel ? 'none' : 'tick'} onclick={() => !sel && setPreview({ [g.key]: v })}>
            {v === null ? t('preview.auto') : previewLabel(g.key, v, view)}
          </button>
        {/each}
      </div>
    </div>
  {/each}
  <p class="note">{t('preview.note')}</p>
  {#if on}<button type="button" class="btn small paper reset" data-preview-reset data-sfx="back" onclick={clearPreview}>{t('preview.reset')}</button>{/if}
</div>

<style>
  .season { display: grid; gap: 12px; padding: 14px 16px; }
  .group { display: grid; gap: 6px; }
  h3 { margin: 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  /* (.chips / .chip: theme.css) */
  .note { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .reset { justify-self: end; }
</style>
