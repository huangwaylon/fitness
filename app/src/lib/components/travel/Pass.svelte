<script lang="ts">
  // A trip's boarding pass on the list (Dodo Airlines, docs/design.md §Trips), a quiet card with its character kept:
  // the airline's blue strip over the cover photo and the route (TYO ✈ the trip's airport), the area, the place and
  // its year, its dates; torn off down the right, the stub: 「あと 97 日」, 「明日」, 「いま 2 日目」 (yuzu), or, a trip
  // gone by, the coral 「行ってきた」 stamp with its year. The whole pass is the button into the trip.
  import type { TripMeta } from '#lib/travel/trips/meta.ts';
  import { asset } from '$app/paths';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { listSpan } from './dates.ts';
  import { otherLang, phaseLabel, pick } from './text.ts';
  import type { Phase } from './when.ts';

  let { trip, phase, onopen }: { trip: TripMeta; phase: Phase; onopen: () => void } = $props();
  const year = $derived(trip.start.slice(0, 4));
  const title = $derived(pick(trip.title, i18n.locale));
  const span = $derived(listSpan(trip.start, trip.end, i18n.locale));
</script>

<button type="button" class="pass {phase.k}" data-trip={trip.id} data-phase={phase.k} data-sfx="page" onclick={onopen}
  aria-label="{title} {year}, {span}, {phaseLabel(phase)}">
  <span class="main" aria-hidden="true">
    <span class="cover">
      <img src={asset(trip.cover.src as Parameters<typeof asset>[0])} alt="" width={trip.cover.w} height={trip.cover.h} loading="eager" decoding="async" />
      <span class="band"><span class="air">✈ {t('travel.airline')}</span><span class="route">TYO <i>✈</i> {trip.code}</span></span>
    </span>
    <span class="txt">
      <span class="eyebrow">{pick(trip.eyebrow, i18n.locale)}</span>
      <span class="dest q-title" lang={otherLang(trip.title, i18n.locale) ?? undefined}>{title} <span class="num">{year}</span></span>
      <span class="dates">{span}</span>
    </span>
  </span>
  <span class="stub" aria-hidden="true">
    {#if phase.k === 'soon' && phase.days === 1}
      <b class="tmr" data-days="1">{t('travel.tomorrow')}</b>
    {:else if phase.k === 'soon'}
      <small>{t('travel.soonPre')}</small><b class="num" data-days={phase.days}>{phase.days}</b><small>{t('travel.soonPost')}</small>
    {:else if phase.k === 'now'}
      <small>{t('travel.nowPre')}</small><b class="num" data-day-now={phase.day}>{phase.day}</b><small>{t('travel.nowPost')}</small>
    {:else}
      <span class="stamp" data-stamp><span>{t('travel.stamp')}</span><span class="num">{year}</span></span>
    {/if}
    <span class="code"></span>
  </span>
</button>

<style>
  /* the pass: a quiet card (hairline, soft shadow), a column of the photo and the words, the stub torn off right */
  .pass {
    --stub: 88px;
    position: relative; display: grid; grid-template-columns: minmax(0, 1fr) var(--stub); width: 100%; margin: 0; padding: 0;
    appearance: none; cursor: pointer; text-align: start; color: var(--q-ink); font: inherit;
    background: var(--q-surface); border: 1px solid var(--q-hairline); border-radius: var(--q-r-card); box-shadow: var(--q-shadow);
    -webkit-tap-highlight-color: transparent; transition: transform 160ms ease-out;
  }
  .pass:active { transform: scale(.985); }
  .pass:focus-visible { outline: 2px solid var(--q-accent); outline-offset: 2px; }
  .main { display: grid; min-width: 0; }
  .cover { position: relative; display: block; height: 116px; overflow: hidden; border-radius: calc(var(--q-r-card) - 1px) 0 0 0; background: var(--q-sunken); }
  .cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .past .cover img { filter: saturate(.7) sepia(.18); }
  /* the airline's strip: NH blue over the photo's top, its name and the route in cream */
  .band {
    position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 7px 12px 6px; background: color-mix(in srgb, var(--sea-flat) 92%, transparent); color: var(--c-cream);
    font: var(--q-w-b) var(--q-fs-xs)/1.2 var(--q-font); letter-spacing: .04em;
  }
  .air { white-space: nowrap; }
  .route { font: 700 var(--q-fs-s)/1.2 var(--font-num); letter-spacing: .06em; white-space: nowrap; }
  .route i { font-style: normal; font-size: .8em; opacity: .85; }
  .txt { display: grid; gap: 2px; padding: 10px 14px 14px; min-width: 0; }
  .eyebrow { font: var(--q-w-b) var(--q-fs-s)/1.3 var(--q-font); color: var(--q-muted); }
  .dest { font-size: var(--q-fs-title); line-height: 1.25; }
  .num { font-family: var(--font-num); font-weight: 700; font-variant-numeric: tabular-nums; }
  .dates { font-size: var(--q-fs-s); color: var(--q-ink-2); }
  .past .dest { color: var(--q-ink-2); }

  /* the stub: a dashed tear down its left edge, a notch top and bottom (the sheet's ground bites the card) */
  .stub {
    position: relative; display: grid; justify-items: center; align-content: center; padding: 10px 4px 26px;
    border-left: 2px dashed var(--q-hairline); border-radius: 0 calc(var(--q-r-card) - 1px) calc(var(--q-r-card) - 1px) 0;
  }
  .stub::before, .stub::after {
    content: ''; position: absolute; left: -10px; width: 18px; height: 18px; border-radius: 50%;
    background: var(--q-bg);
  }
  .stub::before { top: -11px; box-shadow: inset 0 -1px 0 var(--q-hairline); }
  .stub::after { bottom: -11px; box-shadow: inset 0 1px 0 var(--q-hairline); }
  .stub small { font: var(--q-w-b) var(--q-fs-s)/1.1 var(--q-font); color: var(--q-ink-2); }
  .stub b { font-size: 2.4rem; line-height: 1.05; color: var(--q-ink); }
  .stub .tmr { font: var(--q-w-b) var(--q-fs-head)/1.2 var(--q-font); text-align: center; }
  /* on the trip now: the stub yuzu (its ink dark at night too) */
  .now .stub { background: var(--c-yuzu); }
  .now .stub small, .now .stub b { color: #3F3326; }
  .now .stub .code { background: repeating-linear-gradient(90deg, #3F3326 0 2px, transparent 2px 4px, #3F3326 4px 5px, transparent 5px 8px); }
  /* a barcode under it all (a pass's look, nothing to read) */
  .code {
    position: absolute; left: 14px; right: 14px; bottom: 10px; height: 10px; opacity: .4;
    background: repeating-linear-gradient(90deg, var(--q-ink) 0 2px, transparent 2px 4px, var(--q-ink) 4px 5px, transparent 5px 8px);
  }
  /* gone by: the coral ring stamp, tilted, over the tear */
  .stamp {
    display: grid; place-items: center; align-content: center; gap: 1px; width: 80px; height: 80px; margin-left: -10px; border-radius: 50%; white-space: nowrap;
    box-shadow: inset 0 0 0 3px var(--q-coral), inset 0 0 0 6px var(--q-surface), inset 0 0 0 7px var(--q-coral);
    color: var(--q-coral); transform: rotate(-14deg); opacity: .9; text-align: center;
    font: 700 var(--q-fs-xs)/1.2 var(--q-font);
  }
  .stamp .num { font-size: 1.15rem; line-height: 1; }
  @media (prefers-reduced-motion: reduce) { .pass { transition: none; } }
</style>
