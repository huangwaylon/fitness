<script lang="ts">
  // せってい → てんき (docs/design.md "Weather"): ほんもの (Tokyo's real sky by the hour, the default) | ゲーム (the island's
  // seeded days), one for the whole island (`pref weatherMode`: the last anyone set, the guest too). Under it what the island has now (「いま: とうきょう あめ」, the time it was fetched when that's a
  // while ago, or that no real weather is to be had: the game's then), and the data's credit.
  import { roving } from '../ui/roving.ts';
  import { WEATHER_MODES, type WeatherMode } from '#lib/contract/api.ts';
  import { setWeatherMode } from '#lib/store/actions.ts';
  import { weather, weatherSource } from '../island/weatherNow.svelte.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { t } from '#lib/i18n/index.ts';

  /** A timeline fetched longer ago than this says when. */
  const OLD_MS = 2 * 3600_000;
  const sky = $derived(weather.fog ? 'fog' : weather.sky);
  const old = $derived(weatherSource.at !== null && minuteNow().getTime() - weatherSource.at > OLD_MS);
  const pick = (m: WeatherMode) => {
    if (weatherSource.mode !== m) setWeatherMode(m);
  };
</script>

<div class="prows" role="radiogroup" aria-label={t('panel.weather')} data-weather-mode={weatherSource.mode} {@attach roving}>
  {#each WEATHER_MODES as m (m)}
    {@const on = weatherSource.mode === m}
    <button type="button" class="prow" role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-wx-mode={m} data-sfx={on ? 'none' : 'tick'} onclick={() => pick(m)}>
      <span class="prl">{t(`wx.${m}`)}<small>{t(`wx.${m}.hint`)}</small></span><span class="radio" aria-hidden="true"></span>
    </button>
  {/each}
</div>
{#if weatherSource.mode === 'real'}
  <p class="wx-now" data-wx-now={weatherSource.real ? 'real' : 'none'}>
    {#if weatherSource.real}{t('wx.now', { sky: t(`wx.sky.${sky}`) })}{#if old && weatherSource.at !== null}<span> · {t('wx.last', { time: formatSyncTime(new Date(weatherSource.at)) })}</span>{/if}{:else}{t('wx.none')}{/if}
  </p>
{/if}
<p class="wx-credit" data-wx-credit>{t('wx.credit')}</p>

<style>
  .prl small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .prow[aria-checked='true'] .prl small { color: var(--c-ink-soft); }
  .radio { width: 26px; height: 26px; border-radius: 50%; background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge); flex: none; }
  .prow[aria-checked='true'] .radio { background: radial-gradient(circle, var(--c-card) 0 5px, var(--c-leaf-edge) 6px); box-shadow: none; }
  .wx-now { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .wx-credit { margin: 0 4px; font-size: var(--fs-s); color: var(--text-soft); }
</style>
