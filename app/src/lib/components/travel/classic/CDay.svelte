<script lang="ts">
  // A classic itinerary day (the site's details.card): its spine node, date chip, icon, title and line, the chevron;
  // inside, the timeline, the headed lists, a hike's details (the photo with its place, the difficulty pill and the
  // date, the six stats, the trail map), the day's note and links. Open as the site had it (Okinawa's days).
  import type { Day } from '#lib/travel/types.ts';
  import { t, type Locale } from '#lib/i18n/index.ts';
  import CText from './CText.svelte';
  import CIcon from './CIcon.svelte';
  import CList from './CList.svelte';
  import CLinks from './CLinks.svelte';
  import CPhoto from './CPhoto.svelte';
  import { dayLook, dayOpen, leadChip, shortDate } from './guide.ts';
  import { fmtM } from '../text.ts';
  import { fmtKm } from '../units.ts';

  let { day, note, lang }: { day: Day; note: Record<string, string> | null; lang: Locale } = $props();
  const chip = $derived(leadChip(day.date, lang));
  const look = $derived(dayLook(day));
  // svelte-ignore state_referenced_locally
  const open = dayOpen(day);
</script>

<details class="ccard {look}" {open} data-day={day.n}>
  <summary class="head" data-sfx="page">
    <span class="node"></span>
    <div class="lead-chip" lang={lang}><div class="d">{chip.d}</div><div class="m">{chip.m}</div><div class="wd">{chip.wd}</div></div>
    <span class="gly"><CIcon name={day.icon} /></span>
    <div class="ttl"><div class="t"><CText l={day.title} {note} /></div>{#if day.sub}<div class="sub2"><CText l={day.sub} {note} /></div>{/if}</div>
    <span class="chev"><CIcon name="chevron-right" /></span>
  </summary>
  <div class="content">
    {#if day.rows.length}<CList kind="tl" rows={day.rows} {note} />{/if}
    {#each day.sections ?? [] as s, i (i)}
      {#if s.head}<div class="subhead"><CText l={s.head} {note} /></div>{/if}
      <CList kind={s.kind} rows={s.rows} {note} />
    {/each}
    {#if day.hike}
      {@const h = day.hike}
      <div class="subhead" lang={lang}>{t('travel.classic.hike.details', undefined, lang)}</div>
      {#if day.photo}<CPhoto photo={day.photo} caption />{/if}
      <div class="diff-row" lang={lang}>
        <span class="diff {h.level}">{t(`travel.classic.hike.${h.level}`, undefined, lang)}</span>
        <span class="where">{t('travel.classic.hike.where', { where: h.where[lang] ?? h.where.en ?? h.where.ja ?? '', date: shortDate(day.date, lang) }, lang)}</span>
      </div>
      <div class="stat-grid" lang={lang}>
        <div class="stat"><div class="k">{t('travel.classic.hike.km', undefined, lang)}</div><div class="v">{fmtKm(h.km)}</div></div>
        <div class="stat"><div class="k">{t('travel.classic.hike.gain', undefined, lang)}</div><div class="v">{fmtM(h.gainM)}</div></div>
        <div class="stat"><div class="k">{t('travel.classic.hike.route', undefined, lang)}</div><div class="v"><CText l={h.route} {note} /></div></div>
        <div class="stat"><div class="k">{t('travel.classic.hike.drive', undefined, lang)}</div><div class="v"><CText l={h.drive} {note} /></div></div>
        <div class="stat"><div class="k">{t('travel.classic.hike.time', undefined, lang)}</div><div class="v"><CText l={h.time} {note} /></div></div>
        <div class="stat"><div class="k">{t('travel.classic.hike.pass', undefined, lang)}</div><div class="v"><CText l={h.pass} {note} /></div></div>
      </div>
      {#if h.gpx}<CLinks links={[{ label: { [lang]: t('travel.classic.hike.map', undefined, lang) }, href: h.gpx }]} {note} />{/if}
    {:else if day.photo}
      <CPhoto photo={day.photo} />
    {/if}
    {#if day.note}<p class="desc note-sm"><CText l={day.note} {note} /></p>{/if}
    {#if day.links?.length}<CLinks links={day.links} {note} />{/if}
  </div>
</details>
