<script lang="ts">
  // A day of a trip (docs/design.md §Trips, 日程), the one shown under the day chips: a dense card, its head the day
  // of the month big in the day's colour, the month and weekday beside it, the title and the route, 「今日」 on
  // today's; then a hike (its photo with the level sticker and the trailhead on it, distance · climb · time as a
  // StatStrip, the drive, route and pass as key · value rows, and the trail: トレイル's own opens in the app,
  // hiking/open.svelte.ts openTrail, else its link out), the hour-by-hour timeline (Rows: the rows gone by quiet, the one that is now lit
  // in the day's colour), the free day's lists, the note, the photo, the links out.
  import type { Day } from '#lib/travel/types.ts';
  import { hikeSlugOf } from '#lib/hiking/trails.ts';
  import { openTrail } from '../hiking/open.svelte.ts';
  import PhotoBand from '../ui/PhotoBand.svelte';
  import StatStrip from '../ui/StatStrip.svelte';
  import Icon from '../ui/Icon.svelte';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Txt from './Txt.svelte';
  import Rows from './Rows.svelte';
  import Photo from './Photo.svelte';
  import Stats from './Stats.svelte';
  import Links from './Links.svelte';
  import { fmtM, pick } from './text.ts';
  import { fmtKm } from './units.ts';
  import { dayParts } from './dates.ts';
  import { staticUrl } from '#lib/staticUrl.ts';

  interface Props {
    day: Day;
    /** The day's route colour. */
    color: string;
    note: Record<string, string> | null;
    /** Today on the trip's calendar. */
    today?: boolean;
    /** The row of this day to mark: now, or the next to come. */
    mark?: { i: number; next: boolean } | null;
  }
  let { day, color, note, today = false, mark = null }: Props = $props();
  const dp = $derived(dayParts(day.date, i18n.locale));
  /** A hike's trail in トレイル (null: not one of its trails; then its link out, last of the day's links). */
  const trail = $derived(hikeSlugOf(day.hike?.gpx));
  const links = $derived([...(day.links ?? []), ...(day.hike?.gpx && !trail ? [{ label: { [i18n.locale]: t('travel.hike.map') }, href: day.hike.gpx }] : [])]);
  /** '9.8 km' → the strip's value and unit. */
  const vu = (s: string) => {
    const i = s.lastIndexOf(' ');
    return i < 0 ? { value: s } : { value: s.slice(0, i), unit: s.slice(i + 1) };
  };
  const strip = $derived(
    day.hike
      ? [
          { icon: 'distance' as const, label: t('travel.hike.km'), ...vu(fmtKm(day.hike.km)) },
          { icon: 'mountain' as const, label: t('travel.hike.gain'), ...vu(fmtM(day.hike.gainM)) },
          { icon: 'clock' as const, label: t('travel.hike.time'), value: pick(day.hike.time, i18n.locale) }
        ]
      : []
  );
  const facts = $derived(
    day.hike
      ? [
          { k: t('travel.hike.drive'), v: day.hike.drive },
          { k: t('travel.hike.route'), v: day.hike.route },
          { k: t('travel.hike.pass'), v: day.hike.pass }
        ]
      : []
  );
  const LEVEL = { mod: 'leaf', hard: '', epic: 'coral' } as const;
</script>

<article class="card dense day" data-day={day.n} data-today={today || undefined} style:--c={color}>
  <header class="dh">
    <span class="dn" aria-hidden="true">{dp.d}</span>
    <span class="dm" aria-hidden="true"><span>{dp.m}</span><span>{dp.wd}</span></span>
    <h3 class="meta">
      <span class="sr-only">{t('travel.day', { n: day.n })}</span>
      <span class="ttl guide"><Txt l={day.title} {note} /></span>
      {#if day.sub}<span class="sub guide"><Txt l={day.sub} {note} /></span>{/if}
    </h3>
    {#if today}<span class="sticker">{t('travel.today')}</span>{/if}
  </header>
  <div class="body guide">
    {#if day.hike}
      <div class="hike" data-hike={day.hike.level}>
        {#if day.photo}
          <div class="hp">
            <PhotoBand src={staticUrl(day.photo.src)} alt={pick(day.photo.alt, i18n.locale)} height={150}>
              <span class="hk"><b class="sticker {LEVEL[day.hike.level]}">{t(`travel.hike.${day.hike.level}`)}</b><span><Txt l={day.hike.where} {note} /></span></span>
            </PhotoBand>
          </div>
        {:else}
          <p class="hk plain"><b class="sticker {LEVEL[day.hike.level]}">{t(`travel.hike.${day.hike.level}`)}</b><span><Txt l={day.hike.where} {note} /></span></p>
        {/if}
        <StatStrip items={strip} />
        <Stats stats={facts} {note} />
        {#if trail}
          <div class="tr"><button type="button" class="chip s go" data-sfx="open" data-trail-open={trail} onclick={() => openTrail(trail)}><Icon name="mountain" size={16} />{t('travel.hike.trail')}<Icon name="chevron-right" size={16} /></button></div>
        {/if}
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
    {#if day.photo && !day.hike}<div class="ph"><Photo photo={day.photo} /></div>{/if}
    {#if links.length}<div class="lk"><Links {links} {note} /></div>{/if}
  </div>
</article>

<style>
  .dh { position: relative; display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 8px 12px; }
  .dh::after { content: ''; position: absolute; left: 12px; right: 12px; bottom: 0; border-top: 1.5px dashed var(--stitch); }
  .dn { flex: none; min-width: 32px; text-align: center; font: 600 1.75rem/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--c); }
  :global(:root[data-tod='night']) .dn { filter: brightness(1.35) saturate(.9); }
  .dm { flex: none; display: flex; flex-direction: column; font: 700 var(--fs-xs)/1.3 var(--font-ui); color: var(--text-soft); white-space: nowrap; }
  .meta { flex: 1; min-width: 0; display: grid; margin: 0 0 0 2px; font: inherit; }
  .ttl { font: 700 var(--fs-body)/1.35 var(--font-ui); }
  .sub { font-size: var(--fs-s); color: var(--text-soft); }
  .body { padding: 2px 0 10px; display: grid; }
  .sec { padding: 8px 12px 0; display: grid; gap: 6px; }
  h4 { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); letter-spacing: .03em; }
  .tip { margin: 10px 12px 0; padding: 8px 10px; border-radius: var(--r-chip); background: var(--ctl-off); font-size: var(--fs-s); line-height: 1.5; color: var(--text-soft); }
  .ph { padding: 10px 12px 0; }
  .lk { padding: 8px 12px 0; }
  .hike { padding: 10px 0 2px; display: grid; gap: 2px; }
  .hp { margin: 0 12px; border-radius: var(--r-chip); overflow: hidden; }
  .hk { display: flex; align-items: center; gap: 8px; font: 700 var(--fs-s)/1.3 var(--font-ui); }
  .hk.plain { margin: 0; padding: 0 12px; color: var(--text-soft); }
  .hk .sticker { text-shadow: none; }
  .tr { padding: 4px 12px 0; }
  .go { color: var(--leaf-text); }
</style>
