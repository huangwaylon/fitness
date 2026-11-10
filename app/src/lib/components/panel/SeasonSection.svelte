<script lang="ts">
  // 設定 → 季節 (docs/design.md "Seasonal look"): the whole island's look, every phone's at once (`pref seasonLook` and
  // `pref weatherMode` in the record: the last anyone set, the guest too). An event (Halloween, the fireworks, a
  // birthday…), a season, the weather and the time of day, each 自動 (the real day's) or a forced value; the island's
  // finds, critters and ベル stay the real day's. 天気's 自動 is Tokyo's real sky by the hour (what it is now and the
  // data's credit under it), ゲーム the island's seeded days, 晴れ / 雨 / 雪 a forced look. Folded to one row (自動, or
  // what's forced: 「ハロウィン · 冬」, and a chevron: aria-expanded, Purchases' grow); 自動に戻す stays in that row while
  // anything is forced and sets everything back, for everyone.
  import { roving } from '../ui/roving.ts';
  import { t } from '#lib/i18n/index.ts';
  import type { WeekView } from '#lib/types.ts';
  import { PREVIEW_EVENTS, PREVIEW_WEATHER, TODS, type Choice } from '#lib/ui-state/preview.ts';
  import { SEASONS } from '#lib/ui-state/season.ts';
  import { clearPreview, previewChoice, setPreview } from '#lib/ui-state/preview.svelte.ts';
  import { setWeatherMode } from '#lib/store/actions.ts';
  import { weather, weatherSource } from '../island/weatherNow.svelte.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { previewLabel } from './previewLabel.ts';

  let { view }: { view: WeekView } = $props();

  const choice = $derived(previewChoice());
  const game = $derived(weatherSource.mode === 'game');
  const on = $derived(game || Object.values(choice).some((v) => v !== null));

  const GROUPS: { key: keyof Choice; values: readonly string[] }[] = [
    { key: 'event', values: PREVIEW_EVENTS },
    { key: 'season', values: SEASONS },
    { key: 'weather', values: ['game', ...PREVIEW_WEATHER] },
    { key: 'tod', values: TODS }
  ];
  /** A chip's value: null is 自動; 天気's `game` is the island's seeded days (`pref weatherMode`), not a look. */
  const picked = (key: keyof Choice): string | null => (key === 'weather' && choice.weather === null && game ? 'game' : choice[key]);
  const label = (key: keyof Choice, v: string, zone: 'chip' | 'sum') =>
    key === 'weather' && v === 'game' ? t(zone === 'chip' ? 'wx.game' : 'season.weather.game') : previewLabel(key, v, view, 'season');
  /** What's forced, in the folded row. */
  const summary = $derived(GROUPS.flatMap((g) => { const v = picked(g.key); return v === null ? [] : [label(g.key, v, 'sum')]; }).join(' · ') || t('preview.auto'));

  function pick(key: keyof Choice, v: string | null) {
    if (key !== 'weather') return setPreview({ [key]: v });
    if (v !== null && v !== 'game') return setPreview({ weather: v });
    // 自動 or ゲーム: no forced look, and the island's weather Tokyo's or the game's
    if (choice.weather !== null) setPreview({ weather: null });
    const mode = v === 'game' ? 'game' : 'real';
    if (weatherSource.mode !== mode) setWeatherMode(mode);
  }
  function reset() {
    clearPreview();
    if (game) setWeatherMode('real');
  }

  /** A timeline fetched longer ago than this says when. */
  const OLD_MS = 2 * 3600_000;
  const sky = $derived(weather.fog ? 'fog' : weather.sky);
  const old = $derived(weatherSource.at !== null && minuteNow().getTime() - weatherSource.at > OLD_MS);
  let open = $state(false);
</script>

<div class="card season" class:open data-preview-section>
  <div class="head">
    <button type="button" class="toggle" aria-expanded={open} aria-controls="preview-body" data-preview-toggle data-sfx={open ? 'toggle-off' : 'toggle-on'}
      onclick={() => (open = !open)}>
      <span class="sum" data-preview-summary>{summary}</span>
      <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
    </button>
    {#if on}<button type="button" class="btn small paper" data-preview-reset data-sfx="back" onclick={reset}>{t('preview.reset')}</button>{/if}
  </div>
  <div class="fold" id="preview-body" inert={!open}><div class="fold-in"><div class="body">
    <p class="note">{t('preview.note')}</p>
    {#each GROUPS as g (g.key)}
      {@const cur = picked(g.key)}
      <div class="group" data-weather-section={g.key === 'weather' ? '' : undefined}>
        <h3 id="preview-{g.key}">{t(`preview.${g.key}`)}</h3>
        <div class="chips" role="radiogroup" aria-labelledby="preview-{g.key}" data-weather-mode={g.key === 'weather' ? weatherSource.mode : undefined} {@attach roving}>
          {#each [null, ...g.values] as v (v)}
            {@const sel = cur === v}
            <button type="button" class="chip" role="radio" aria-checked={sel} tabindex={sel ? 0 : -1} data-preview={`${g.key}:${v ?? 'auto'}`}
              data-wx-mode={g.key === 'weather' && (v === null || v === 'game') ? (v ?? 'real') : undefined}
              data-sfx={sel ? 'none' : 'tick'} onclick={() => !sel && pick(g.key, v)}>
              {v === null ? t('preview.auto') : label(g.key, v, 'chip')}
            </button>
          {/each}
        </div>
        {#if g.key === 'weather' && cur === null}
          <p class="wx-now" data-wx-now={weatherSource.real ? 'real' : 'none'}>
            {#if weatherSource.real}{t('wx.now', { sky: t(`wx.sky.${sky}`) })}{#if old && weatherSource.at !== null}<span> · {t('wx.last', { time: formatSyncTime(new Date(weatherSource.at)) })}</span>{/if}{:else}{t('wx.none')}{/if}
          </p>
          <p class="wx-credit" data-wx-credit>{t('wx.credit')}</p>
        {:else if g.key === 'weather' && cur === 'game'}
          <p class="wx-now" data-wx-game>{t('wx.game.hint')}</p>
        {/if}
      </div>
    {/each}
  </div></div></div>
</div>

<style>
  /* (the settings' control, as 言語's dropdown and the 図鑑 row: its fill and outline, open or folded) */
  .season { display: grid; padding: 4px 12px 4px 16px; background: var(--ctl); box-shadow: var(--sh-ctl); }
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
  .wx-now { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .wx-credit { margin: 0 4px; font-size: var(--fs-s); color: var(--text-soft); }
</style>
