<script lang="ts">
  // A trip's boarding pass (Dodo Airlines, docs/travel.md "The sheet"): the airline's blue strip over the cover photo
  // and the route (TYO ✈ the trip's airport), the destination, the trip's line and its dates in the reader's locale;
  // torn off down the right, the stub: 「あと 97にち」, 「いま 2日目」 (yuzu), or, a trip gone by, a stamp (おもいで).
  // The whole pass is the button into the trip.
  import type { Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Photo from './Photo.svelte';
  import { pick } from './text.ts';
  import { spanLabel } from './dates.ts';
  import type { Phase } from './when.ts';

  let { trip, phase, onopen }: { trip: Trip; phase: Phase; onopen: () => void } = $props();
  /** The trip's airport (a pass's flavour; a trip not listed shows only the airline). */
  const CODE: Record<string, string> = { okinawa: 'OKA', seattle: 'SEA', nz: 'AKL' };
  const aria = $derived(
    phase.k === 'soon' ? (phase.days === 1 ? t('travel.tomorrowAria') : t('travel.soonAria', { n: phase.days })) : phase.k === 'now' ? t('travel.nowAria', { n: phase.day }) : t('travel.stamp')
  );
  const year = $derived(trip.start.slice(0, 4));
</script>

<button type="button" class="pass {phase.k}" data-trip={trip.id} data-phase={phase.k} data-sfx="open" onclick={onopen}
  aria-label="{pick(trip.title, i18n.locale)}, {spanLabel(trip.start, trip.end, i18n.locale)}, {aria}">
  <span class="main" aria-hidden="true">
    <span class="cover"><Photo photo={trip.cover} fill /><span class="band"><span class="air">✈ {t('travel.airline')}</span>{#if CODE[trip.id]}<span class="route money">TYO <i>✈</i> {CODE[trip.id]}</span>{/if}</span></span>
    <span class="txt">
      <span class="eyebrow">{pick(trip.eyebrow, i18n.locale)}</span>
      <span class="dest">{pick(trip.title, i18n.locale)}</span>
      <span class="dates">{spanLabel(trip.start, trip.end, i18n.locale)}</span>
    </span>
  </span>
  <span class="stub" aria-hidden="true">
    {#if phase.k === 'soon' && phase.days === 1}
      <b class="tmr">{t('travel.tomorrow')}</b>
    {:else if phase.k === 'soon'}
      <small>{t('travel.soonPre')}</small><b class="money" data-days={phase.days}>{phase.days}</b><small>{t('travel.soonPost')}</small>
    {:else if phase.k === 'now'}
      <small>{t('travel.nowPre')}</small><b class="money" data-day-now={phase.day}>{phase.day}</b><small>{t('travel.nowPost')}</small>
    {:else}
      <span class="stamp" data-stamp><span>{t('travel.stamp')}</span><span class="money">{year}</span></span>
    {/if}
    <span class="code"></span>
  </span>
</button>

<style>
  /* the pass: cream paper, the card's radius and lip, a column of the photo and the words, the stub torn off right */
  .pass {
    --stub: 86px;
    position: relative; display: grid; grid-template-columns: minmax(0, 1fr) var(--stub); width: 100%; margin: 0 0 var(--lip-h); padding: 0;
    appearance: none; border: 0; cursor: pointer; text-align: left; color: var(--c-ink);
    background: var(--c-card); border-radius: var(--r-card); box-shadow: 0 var(--lip-h) 0 var(--c-lip), var(--sh-float);
    -webkit-tap-highlight-color: transparent; transition: transform var(--dur-base) var(--ease-bounce);
  }
  .pass:active { transform: translateY(2px) scale(.985); transition-duration: var(--dur-tap); }
  .main { display: grid; min-width: 0; }
  .cover { position: relative; display: block; height: 116px; overflow: hidden; border-radius: var(--r-card) 0 0 0; background: var(--hl); }
  .past .cover :global(img) { filter: saturate(.7) sepia(.18); }
  /* the airline's strip: NH blue over the photo's top, its name and the route in cream */
  .band {
    position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 7px 12px 6px; background: color-mix(in srgb, var(--sea-flat) 92%, transparent); color: var(--c-cream);
    font: 700 var(--fs-xs)/1.2 var(--font-ui); letter-spacing: .04em;
  }
  .air { white-space: nowrap; }
  .route { font-size: var(--fs-s); letter-spacing: .06em; white-space: nowrap; }
  .route i { font-style: normal; font-size: .8em; opacity: .85; }
  .txt { display: grid; gap: 3px; padding: 10px 14px 14px; }
  .eyebrow { font: 700 var(--fs-xs)/1.3 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .03em; }
  .dest { font: 700 1.3rem/1.2 var(--font-ui); }
  .dates { font: 700 var(--fs-s)/1.3 var(--font-num); color: var(--c-ink-soft); }

  /* the stub: a dashed tear down its left edge, a notch top and bottom (the panel's colour bites the paper) */
  .stub {
    position: relative; display: grid; justify-items: center; align-content: center; gap: 0; padding: 10px 4px 26px;
    border-left: 2px dashed var(--c-lip); border-radius: 0 var(--r-card) var(--r-card) 0;
  }
  .stub::before, .stub::after {
    content: ''; position: absolute; left: -10px; width: 18px; height: 18px; border-radius: 50%; background: var(--surface);
  }
  .stub::before { top: -9px; }
  .stub::after { bottom: -9px; }
  .stub small { font: 700 var(--fs-s)/1.1 var(--font-ui); color: var(--c-ink-soft); }
  .stub b { font-size: 2.4rem; line-height: 1.05; color: var(--c-ink); }
  .stub .tmr { font: 700 var(--fs-body)/1.2 var(--font-ui); text-align: center; }
  /* on the trip now: the stub yuzu */
  .now .stub { background: var(--c-yuzu); }
  .now .stub small { color: var(--c-ink); }
  /* a barcode under it all (a pass's look, nothing to read) */
  .code {
    position: absolute; left: 14px; right: 14px; bottom: 10px; height: 10px; opacity: .45;
    background: repeating-linear-gradient(90deg, var(--c-ink) 0 2px, transparent 2px 4px, var(--c-ink) 4px 5px, transparent 5px 8px);
  }
  /* gone by: the coral ring stamp, tilted, over the tear */
  .stamp {
    display: grid; place-items: center; align-content: center; gap: 1px; width: 80px; height: 80px; margin-left: -10px; border-radius: 50%; white-space: nowrap;
    box-shadow: inset 0 0 0 3px var(--c-coral-text), inset 0 0 0 6px var(--c-card), inset 0 0 0 7px var(--c-coral-text);
    color: var(--c-coral-text); transform: rotate(-14deg); opacity: .9; text-align: center;
    font: 700 var(--fs-xs)/1.2 var(--font-ui);
  }
  .stamp .money { font-size: var(--fs-s); }
  @media (prefers-reduced-motion: reduce) { .pass { transition: none; } }
</style>
