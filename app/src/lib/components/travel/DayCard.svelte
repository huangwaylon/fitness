<script lang="ts">
  // A day of a trip (docs/travel.md "The sheet", にってい), a Fold: its head the day on a yuzu plate, its date and
  // weekday in the reader's locale, the title and the route, the day's icon; open, a hike's figures, the hour-by-hour
  // timeline (the row that is now marked, or the next one), the free day's lists, the note, the photo, the links out.
  import type { Day } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { fmtM } from './text.ts';
  import { glyphOf } from './icons.ts';
  import Fold from './Fold.svelte';
  import Txt from './Txt.svelte';
  import Rows from './Rows.svelte';
  import Photo from './Photo.svelte';
  import Stats from './Stats.svelte';
  import { fmtKm } from './units.ts';
  import { dayLabel } from './dates.ts';

  interface Props {
    day: Day;
    open: boolean;
    ontoggle: () => void;
    note: Record<string, string> | null;
    /** Today on the trip's calendar. */
    today?: boolean;
    /** The row of this day to mark: now, or the next to come. */
    mark?: { i: number; next: boolean } | null;
  }
  let { day, open, ontoggle, note, today = false, mark = null }: Props = $props();
  /** The day's links, a hike's trail map last. */
  const links = $derived([...(day.links ?? []), ...(day.hike?.gpx ? [{ label: { [i18n.locale]: t('travel.hike.map') }, href: day.hike.gpx }] : [])]);
  const figures = $derived(
    day.hike && [
      { k: t('travel.hike.km'), v: fmtKm(day.hike.km) },
      { k: t('travel.hike.gain'), v: fmtM(day.hike.gainM) },
      { k: t('travel.hike.time'), v: day.hike.time },
      { k: t('travel.hike.drive'), v: day.hike.drive },
      { k: t('travel.hike.route'), v: day.hike.route },
      { k: t('travel.hike.pass'), v: day.hike.pass }
    ]
  );
</script>

<Fold id="trip-day-{day.n}" class="day {today ? 'today' : ''}" {open} {ontoggle} {note} sections={day.sections} {links} data-day={day.n} data-today={today || undefined}>
  {#snippet head()}
    <span class="plate" aria-hidden="true"><small>{t('travel.platePre')}</small><b class="money">{day.n}</b><small>{t('travel.platePost')}</small></span>
    <span class="sr-only">{t('travel.day', { n: day.n })}</span>
    <span class="meta">
      <span class="date"><span class="ic" aria-hidden="true">{glyphOf(day.icon)}</span>{dayLabel(day.date, i18n.locale)}{#if today}<em class="tag">{t('travel.today')}</em>{/if}</span>
      <span class="ttl guide"><Txt l={day.title} {note} /></span>
      {#if day.sub}<span class="sub guide"><Txt l={day.sub} {note} /></span>{/if}
    </span>
  {/snippet}
  {#snippet pin()}
    <b class="pn">{t('travel.day', { n: day.n })}</b><span class="pt"><Txt l={day.title} {note} /></span>
  {/snippet}
  {#if day.hike}
    <div class="hike" data-hike={day.hike.level}>
      <p class="hk-head"><b class="lv {day.hike.level}">{t(`travel.hike.${day.hike.level}`)}</b><span><Txt l={day.hike.where} {note} /></span></p>
      <Stats stats={figures!} {note} />
    </div>
  {/if}
  {#if day.rows.length}<Rows rows={day.rows} kind="tl" {note} {mark} date={day.date} />{/if}
  {#snippet tail()}
    {#if day.note}<p class="tip"><span aria-hidden="true">💡</span><span><Txt l={day.note} {note} /></span></p>{/if}
    {#if day.photo}<Photo photo={day.photo} />{/if}
  {/snippet}
</Fold>

<style>
  .plate {
    display: grid; justify-items: center; align-content: center; width: 56px; height: 56px; flex: none; border-radius: var(--r-btn);
    background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip); transform: rotate(-3deg);
  }
  .plate b { font-size: 1.5rem; line-height: 1; }
  .plate small { font: 700 var(--fs-xs)/1 var(--font-ui); }
  .plate small:empty { display: none; }
  .plate small:first-child { margin-bottom: 2px; }
  .plate small:last-child { margin-top: 2px; }
  .meta { display: grid; gap: 2px; min-width: 0; }
  .date { display: flex; align-items: center; gap: 6px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .tag {
    font-style: normal; padding: 1px 8px; border-radius: var(--r-pill); background: var(--c-leaf); color: var(--c-ink);
    font: 700 var(--fs-xs)/1.4 var(--font-ui); box-shadow: 0 2px 0 var(--c-leaf-lip);
  }
  .ttl { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .sub { font: 500 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .ic { font-size: 1rem; line-height: 1; }
  .pn { flex: none; padding: 2px 8px; border-radius: var(--r-pill); background: var(--c-yuzu); color: var(--c-ink); font-size: var(--fs-xs); }
  /* today: a leaf rim */
  :global(.fold.today) { box-shadow: var(--sh-lip), inset 0 0 0 3px var(--c-leaf); }
  .tip { margin: 0; display: flex; gap: 8px; padding: 10px 12px; border-radius: var(--r-btn); background: var(--hl); font: 500 var(--fs-s)/1.5 var(--font-ui); }

  /* a hike's figures: its level pill and the trailhead over the numbers */
  .hike { display: grid; gap: 8px; }
  .hk-head { margin: 0; display: flex; align-items: center; gap: 8px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .lv { padding: 3px 10px; border-radius: var(--r-pill); color: var(--c-ink); font: 700 var(--fs-s)/1.3 var(--font-ui); }
  .lv.mod { background: var(--c-mint); }
  .lv.hard { background: var(--c-yuzu); }
  .lv.epic { background: var(--c-coral); }
</style>
