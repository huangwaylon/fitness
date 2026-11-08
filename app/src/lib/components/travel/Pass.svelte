<script lang="ts">
  // A trip's boarding pass on the list (docs/design.md §Trips, "Unified kit"): a dense card on the app's tokens, the
  // airline's sky strip (「✈ しまの そら便 · SHIMA AIR」, the route TYO ✈ the trip's airport) over the cover photo, the
  // area, the place and its year, its dates; torn off down the right along a stitch, the stub: 「あと 97 日」, 「明日」,
  // 「いま 2 日目」 (yuzu), or, a trip gone by, the coral 「行ってきた」 stamp with its year. The whole pass is the
  // button into the trip.
  import { photoFallback } from '../ui/photoFallback.ts';
  import type { TripMeta } from '#lib/travel/trips/meta.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { listSpan } from './dates.ts';
  import { otherLang, phaseLabel, pick } from './text.ts';
  import type { Phase } from './when.ts';
  import { staticUrl } from '#lib/staticUrl.ts';

  let { trip, phase, onopen }: { trip: TripMeta; phase: Phase; onopen: () => void } = $props();
  const year = $derived(trip.start.slice(0, 4));
  const title = $derived(pick(trip.title, i18n.locale));
  const span = $derived(listSpan(trip.start, trip.end, i18n.locale));
</script>

<button type="button" class="pass {phase.k}" data-trip={trip.id} data-phase={phase.k} data-sfx="page" onclick={onopen}
  aria-label="{title} {year}, {span}, {phaseLabel(phase)}">
  <span class="main" aria-hidden="true">
    <span class="cover">
      <img src={staticUrl(trip.cover.src)} alt="" width={trip.cover.w} height={trip.cover.h} loading="eager" decoding="async" {@attach photoFallback} />
      <span class="band"><span class="air">✈ {t('travel.air')}</span><span class="route">TYO <i>✈</i> {trip.code}</span></span>
    </span>
    <span class="txt">
      <span class="eyebrow">{pick(trip.eyebrow, i18n.locale)}</span>
      <span class="dest" lang={otherLang(trip.title, i18n.locale) ?? undefined}>{title} <span class="num">{year}</span></span>
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
      <span class="sticker coral stamp" data-stamp><span>{t('travel.stamp')}</span><span class="num">{year}</span></span>
    {/if}
    <span class="code"></span>
  </span>
</button>

<style>
  /* the pass: a dense card (the small lip), the photo and the words, the stub torn off right */
  .pass {
    --stub: 84px;
    position: relative; display: grid; grid-template-columns: minmax(0, 1fr) var(--stub); width: 100%; margin: 0; padding: 0;
    appearance: none; border: 0; cursor: pointer; text-align: start; color: var(--text); font: inherit;
    background: var(--card); border-radius: var(--r-row); box-shadow: var(--sh-lip-s);
    -webkit-tap-highlight-color: transparent; transition: transform var(--dur-base) var(--ease-bounce);
  }
  .pass:active { transform: translateY(1px) scale(.99); }
  .pass:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .main { display: grid; min-width: 0; }
  .cover { position: relative; display: block; height: 104px; overflow: hidden; border-radius: var(--r-row) 0 0 0; background: var(--ctl-off); }
  .cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .past .cover img { filter: saturate(.7) sepia(.18); }
  /* the airline's strip: sky over the photo's top, its name and the route in white */
  .band {
    position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 5px 12px 4px; background: var(--c-sky); color: #fff; font: 700 var(--fs-xs)/1.3 var(--font-ui); letter-spacing: .04em;
  }
  .air, .route { white-space: nowrap; }
  .air { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .route { font: 600 var(--fs-s)/1.2 var(--font-num); letter-spacing: .06em; }
  .route i { font-style: normal; font-size: .8em; }
  .txt { display: grid; gap: 1px; padding: 8px 12px 10px; min-width: 0; }
  .eyebrow { font: 700 var(--fs-xs)/1.3 var(--font-ui); color: var(--text-soft); }
  .dest { font: 700 var(--fs-talk)/1.25 var(--font-ui); }
  .num { font-family: var(--font-num); font-weight: 600; font-variant-numeric: tabular-nums; }
  .dates { font-size: var(--fs-s); color: var(--text-soft); }
  .past .dest { color: var(--text-soft); }

  /* the stub: the stitch down its left edge, a notch top and bottom (the sheet's paper bites the card) */
  .stub {
    position: relative; display: grid; justify-items: center; align-content: center; padding: 8px 4px 24px;
    border-left: 1.5px dashed var(--stitch); border-radius: 0 var(--r-row) var(--r-row) 0;
  }
  .stub::before, .stub::after { content: ''; position: absolute; left: -9px; width: 16px; height: 16px; border-radius: 50%; background: var(--surface); }
  .stub::before { top: -8px; }
  .stub::after { bottom: -10px; }
  .stub small { font: 700 var(--fs-s)/1.1 var(--font-ui); color: var(--text-soft); }
  .stub b { font-size: 1.75rem; line-height: 1.1; color: var(--text); }
  .stub .tmr { font: 700 var(--fs-talk)/1.2 var(--font-ui); text-align: center; }
  /* on the trip now: the stub yuzu (its ink dark at night too) */
  .now .stub { background: var(--c-yuzu); }
  .now .stub small, .now .stub b { color: var(--c-ink); }
  .now .stub .code { color: var(--c-ink); }
  /* a barcode under it all (a pass's look, nothing to read) */
  .code {
    position: absolute; left: 12px; right: 12px; bottom: 9px; height: 9px; opacity: .4; color: var(--text);
    background: repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 4px, currentColor 4px 5px, transparent 5px 8px);
  }
  /* gone by: the coral sticker stamp, tilted, over the tear */
  .stamp { flex-direction: column; height: auto; gap: 2px; padding: 6px 8px; border-radius: var(--r-chip); transform: rotate(-8deg); text-align: center; }
  .stamp .num { font-size: var(--fs-body); line-height: 1; }
  @media (prefers-reduced-motion: reduce) { .pass { transition: none; } .pass:active { transform: none; } }
</style>
