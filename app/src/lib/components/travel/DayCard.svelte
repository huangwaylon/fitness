<script lang="ts">
  // A day of a trip (docs/design.md §Trips, 日程): a card whose head is a button, the day of the month big in the
  // day's colour, the month and weekday beside it, the title and the route, ⌃ / ⌄; open, a hike's figures, the
  // hour-by-hour timeline (the rows gone by quiet, the one that is now lit in the day's colour), the free day's lists,
  // the note, the photo, the links out. 「きょう」 by today's title.
  import type { Day } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Icon from '../quiet/Icon.svelte';
  import Txt from './Txt.svelte';
  import Rows from './Rows.svelte';
  import Photo from './Photo.svelte';
  import Stats from './Stats.svelte';
  import Links from './Links.svelte';
  import { fmtM } from './text.ts';
  import { fmtKm } from './units.ts';
  import { dayParts } from './dates.ts';

  interface Props {
    day: Day;
    /** The day's route colour. */
    color: string;
    open: boolean;
    ontoggle: () => void;
    note: Record<string, string> | null;
    /** Today on the trip's calendar. */
    today?: boolean;
    /** The row of this day to mark: now, or the next to come. */
    mark?: { i: number; next: boolean } | null;
  }
  let { day, color, open, ontoggle, note, today = false, mark = null }: Props = $props();
  const dp = $derived(dayParts(day.date, i18n.locale));
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

<article class="q-card day" class:open data-day={day.n} data-open={open || undefined} data-today={today || undefined} style:--c={color}>
  <h3 class="head">
    <button type="button" class="tog" aria-expanded={open} aria-controls="trip-day-{day.n}" data-sfx="page" onclick={ontoggle}>
      <span class="dn q-title" aria-hidden="true">{dp.d}</span>
      <span class="dm" aria-hidden="true"><span>{dp.m}</span><span>{dp.wd}</span></span>
      <span class="sr-only">{t('travel.day', { n: day.n })}</span>
      <span class="meta">
        <span class="ttl guide"><Txt l={day.title} {note} />{#if today}<em class="today">{t('travel.today')}</em>{/if}</span>
        {#if day.sub}<span class="sub guide"><Txt l={day.sub} {note} /></span>{/if}
      </span>
      <span class="chev"><Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} /></span>
    </button>
  </h3>
  {#if open}
    <div class="body guide" id="trip-day-{day.n}">
      {#if day.hike}
        <div class="hike" data-hike={day.hike.level}>
          <p class="hk"><b class="lv {day.hike.level}">{t(`travel.hike.${day.hike.level}`)}</b><span><Txt l={day.hike.where} {note} /></span></p>
          <Stats stats={figures!} {note} />
        </div>
      {/if}
      {#if day.rows.length}<Rows rows={day.rows} kind="tl" {note} {mark} date={day.date} />{/if}
      {#each day.sections ?? [] as s, i (i)}
        <section class="sec">
          {#if s.head}<h4><Txt l={s.head} {note} /></h4>{/if}
          <Rows rows={s.rows} kind={s.kind} {note} />
        </section>
      {/each}
      {#if day.note}<p class="tip"><Txt l={day.note} {note} /></p>{/if}
      {#if day.photo}<div class="ph"><Photo photo={day.photo} /></div>{/if}
      {#if links.length}<div class="lk"><Links {links} {note} /></div>{/if}
    </div>
  {/if}
</article>

<style>
  .head { margin: 0; font: inherit; }
  .tog {
    appearance: none; border: 0; background: none; width: 100%; margin: 0; padding: 12px 14px; cursor: pointer; text-align: start;
    display: flex; align-items: center; gap: 10px; min-height: 64px; color: var(--q-ink); font: inherit; -webkit-tap-highlight-color: transparent;
  }
  .tog:active { background: var(--q-sunken); }
  .tog:focus-visible { outline: 2px solid var(--q-accent); outline-offset: -2px; border-radius: var(--q-r-card); }
  .dn { flex: none; width: 36px; text-align: center; font-size: var(--q-fs-big); line-height: 1; letter-spacing: -.02em; color: var(--c); }
  :global(:root[data-tod='night']) .dn { filter: brightness(1.35) saturate(.9); }
  .dm { flex: none; width: 30px; margin-left: -4px; display: flex; flex-direction: column; font: var(--q-w-b) var(--q-fs-xs)/1.3 var(--q-font); color: var(--q-muted); letter-spacing: .04em; white-space: nowrap; }
  .meta { flex: 1; min-width: 0; display: grid; }
  .ttl { font: var(--q-w-b) var(--q-fs-head)/1.35 var(--q-font); }
  .sub { font-size: var(--q-fs-s); color: var(--q-muted); }
  .today {
    font: normal var(--q-w-b) var(--q-fs-xs)/1.4 var(--q-font); color: #fff; background: #D2701F; border-radius: 6px;
    padding: 1px 6px; margin-left: 8px; vertical-align: 2px; letter-spacing: .04em; white-space: nowrap;
  }
  .chev { flex: none; color: var(--q-muted); display: flex; }
  .body { border-top: 1px solid var(--q-hairline); padding: 4px 0 10px; display: grid; }
  .sec { padding: 8px 16px 0; display: grid; gap: 6px; }
  h4 { margin: 0; font: var(--q-w-b) var(--q-fs-s)/1.3 var(--q-font); color: var(--q-muted); letter-spacing: .03em; }
  .tip { margin: 10px 16px 0; padding: 10px 12px; border-radius: var(--q-r-ctl); background: var(--q-sunken); font-size: var(--q-fs-s); line-height: 1.5; color: var(--q-ink-2); }
  .ph { padding: 12px 16px 0; }
  .lk { padding: 12px 16px 2px; }
  .hike { padding: 10px 16px 4px; display: grid; gap: 8px; }
  .hk { margin: 0; display: flex; align-items: center; gap: 8px; font-size: var(--q-fs-s); color: var(--q-ink-2); }
  .lv { padding: 2px 8px; border-radius: var(--q-r-tag); font: var(--q-w-b) var(--q-fs-xs)/1.4 var(--q-font); color: var(--q-ink); background: var(--q-sunken); }
  .lv.hard { background: #FBEBC8; color: #7A5410; }
  .lv.epic { background: var(--q-coral-soft); color: var(--q-coral); }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
