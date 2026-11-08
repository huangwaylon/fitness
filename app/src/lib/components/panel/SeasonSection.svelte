<script lang="ts">
  // せってい → きせつ (docs/design.md "Seasonal preview"): show the island another day's look on this phone, for today:
  // an event (Halloween, the fireworks, a birthday…), a season, the weather and the time of day; おまかせ is the real
  // day's. A look only (ui-state/preview.svelte.ts): never synced, never sent, and the island's finds, critters and
  // ベル stay the real day's. もどす (or the HUD's chip) ends it; it ends on its own when the day does. Folded to one row
  // (what's showing, おまかせ or 「ハロウィン · ふゆ」, and a chevron: aria-expanded, Purchases' grow) for compactness;
  // もどす stays in that row while a preview is on. Its fold opens on 島の天気 first (WeatherSection: real or the game's,
  // for the whole island, unlike the preview), then the preview's groups.
  import { roving } from '../ui/roving.ts';
  import { t } from '#lib/i18n/index.ts';
  import type { WeekView } from '#lib/types.ts';
  import { PREVIEW_EVENTS, PREVIEW_WEATHER, TODS, type Choice } from '#lib/ui-state/preview.ts';
  import { SEASONS } from '#lib/ui-state/season.ts';
  import { clearPreview, previewChoice, setPreview } from '#lib/ui-state/preview.svelte.ts';
  import { previewLabel } from './previewLabel.ts';
  import WeatherSection from './WeatherSection.svelte';

  let { view }: { view: WeekView } = $props();

  const choice = $derived(previewChoice());
  const on = $derived(Object.values(choice).some((v) => v !== null));

  const GROUPS: { key: keyof Choice; values: readonly string[] }[] = [
    { key: 'event', values: PREVIEW_EVENTS },
    { key: 'season', values: SEASONS },
    { key: 'weather', values: PREVIEW_WEATHER },
    { key: 'tod', values: TODS }
  ];
  /** What's showing, in the folded row. */
  const summary = $derived(GROUPS.flatMap((g) => (choice[g.key] === null ? [] : [previewLabel(g.key, choice[g.key]!, view, 'season')])).join(' · ') || t('preview.auto'));
  let open = $state(false);
</script>

<div class="card season" class:open data-preview-section>
  <div class="head">
    <button type="button" class="toggle" aria-expanded={open} aria-controls="preview-body" data-preview-toggle data-sfx={open ? 'toggle-off' : 'toggle-on'}
      onclick={() => (open = !open)}>
      <span class="sum" data-preview-summary>{summary}</span>
      <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
    </button>
    {#if on}<button type="button" class="btn small paper" data-preview-reset data-sfx="back" onclick={clearPreview}>{t('preview.reset')}</button>{/if}
  </div>
  <div class="fold" id="preview-body" inert={!open}><div class="fold-in"><div class="body">
    <div class="group" data-weather-section>
      <h3>{t('wx.title')}</h3>
      <WeatherSection />
    </div>
    {#each GROUPS as g (g.key)}
      <div class="group">
        <h3 id="preview-{g.key}">{t(`preview.${g.key}`)}</h3>
        <div class="chips" role="radiogroup" aria-labelledby="preview-{g.key}" {@attach roving}>
          {#each [null, ...g.values] as v (v)}
            {@const sel = choice[g.key] === v}
            <button type="button" class="chip" role="radio" aria-checked={sel} tabindex={sel ? 0 : -1} data-preview={`${g.key}:${v ?? 'auto'}`}
              data-sfx={sel ? 'none' : 'tick'} onclick={() => !sel && setPreview({ [g.key]: v })}>
              {v === null ? t('preview.auto') : previewLabel(g.key, v, view, 'season')}
            </button>
          {/each}
        </div>
      </div>
    {/each}
    <p class="note">{t('preview.note')}</p>
  </div></div></div>
</div>

<style>
  .season { display: grid; padding: 6px 12px 6px 16px; }
  .head { display: flex; align-items: center; gap: 8px; }
  /* the folded row: what's showing and the chevron (Purchases' disclosure), turning up when open */
  .toggle {
    appearance: none; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; flex: 1; min-width: 0;
    min-height: var(--hit); padding: 0; display: flex; align-items: center; gap: 8px; text-align: left; -webkit-tap-highlight-color: transparent;
  }
  .toggle:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: var(--r-chip); }
  .sum { flex: 1; min-width: 0; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .chev { flex: none; width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; transition: rotate 240ms var(--ease-soft); }
  .open .chev { rotate: 180deg; }
  .head .btn { flex: none; }
  /* folded: a grid row grown from 0fr to 1fr (WebKit animates it), hidden after the fold */
  .fold { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 280ms var(--ease-soft); }
  .open .fold { grid-template-rows: 1fr; }
  .fold-in { min-height: 0; overflow: hidden; visibility: hidden; transition: visibility 0s linear 280ms; margin: 0 -8px; }
  .open .fold-in { visibility: visible; transition: visibility 0s; }
  .body { display: grid; gap: 12px; padding: 6px 8px 10px; }
  .group { display: grid; gap: 6px; }
  h3 { margin: 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  /* (.chips / .chip: theme.css) */
  .note { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
