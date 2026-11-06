<script lang="ts">
  // A day of a trip (docs/travel.md "The sheet", にってい): its head a button (the day on a yuzu plate, its date and
  // weekday in the reader's locale, the title and the route, the day's icon), opening the day: a hike's figures, the
  // hour-by-hour timeline (the row that is now marked), the free day's lists, the note, the photo, the links out.
  import type { Day } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { pick } from './text.ts';
  import { glyphOf } from './icons.ts';
  import Txt from './Txt.svelte';
  import Rows from './Rows.svelte';
  import Links from './Links.svelte';
  import Photo from './Photo.svelte';
  import { fmtKm } from './units.ts';
  import { fmtM } from './text.ts';
  import { dayLabel } from './dates.ts';

  interface Props {
    day: Day;
    open: boolean;
    ontoggle: () => void;
    note: Record<string, string> | null;
    /** Today on the trip's calendar. */
    today?: boolean;
    /** The row of this day that is now. */
    now?: number | null;
  }
  let { day, open, ontoggle, note, today = false, now = null }: Props = $props();
  const id = $derived(`trip-day-${day.n}`);
  /** The day's links, a hike's trail map last. */
  const links = $derived([...(day.links ?? []), ...(day.hike?.gpx ? [{ label: { [i18n.locale]: t('travel.hike.map') }, href: day.hike.gpx }] : [])]);
  const date = $derived(dayLabel(day.date, i18n.locale));
</script>

<article class="day card" class:open class:today data-day={day.n} data-open={open || undefined} data-today={today || undefined}>
  <h3 class="head">
    <button type="button" class="tog" aria-expanded={open} aria-controls={id} data-sfx="page" onclick={ontoggle}>
      <span class="plate" aria-hidden="true"><b class="money">{day.n}</b><small>{t('travel.plate')}</small></span>
      <span class="sr-only">{t('travel.day', { n: day.n })}</span>
      <span class="meta">
        <span class="date"><span class="ic" aria-hidden="true">{glyphOf(day.icon)}</span>{date}{#if today}<em class="tag">{t('travel.today')}</em>{/if}</span>
        <span class="ttl guide"><Txt l={day.title} {note} /></span>
        {#if day.sub}<span class="sub guide"><Txt l={day.sub} {note} /></span>{/if}
      </span>
      <svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
    </button>
  </h3>
  {#if open}
    <div class="body guide" {id}>
      {#if day.hike}
        {@const h = day.hike}
        <div class="hike" data-hike={h.level}>
          <p class="hk-head"><b class="lv {h.level}">{t(`travel.hike.${h.level}`)}</b><span><Txt l={h.where} {note} /></span></p>
          <dl class="hk-grid">
            <div><dt>{t('travel.hike.km')}</dt><dd class="money">{fmtKm(h.km)}</dd></div>
            <div><dt>{t('travel.hike.gain')}</dt><dd class="money">{fmtM(h.gainM)}</dd></div>
            <div><dt>{t('travel.hike.time')}</dt><dd><Txt l={h.time} {note} /></dd></div>
            <div><dt>{t('travel.hike.drive')}</dt><dd><Txt l={h.drive} {note} /></dd></div>
            <div class="wide"><dt>{t('travel.hike.route')}</dt><dd><Txt l={h.route} {note} /></dd></div>
            <div class="wide"><dt>{t('travel.hike.pass')}</dt><dd><Txt l={h.pass} {note} /></dd></div>
          </dl>
        </div>
      {/if}
      {#if day.rows.length}<Rows rows={day.rows} kind="tl" {note} {now} />{/if}
      {#each day.sections ?? [] as s, i (i)}
        <section class="sec">
          {#if s.head}<h4><Txt l={s.head} {note} /></h4>{/if}
          <Rows rows={s.rows} kind={s.kind} {note} />
        </section>
      {/each}
      {#if day.note}<p class="tip"><span aria-hidden="true">💡</span><span><Txt l={day.note} {note} /></span></p>{/if}
      {#if day.photo}<Photo photo={day.photo} />{/if}
      {#if links.length}<Links {links} {note} />{/if}
    </div>
  {/if}
</article>

<style>
  .day { padding: 0; overflow: clip; }
  .head { margin: 0; font: inherit; }
  /* the head: plate | date, title, route | icon ⌄ — the whole row the button (a 44px+ target) */
  .tog {
    appearance: none; border: 0; background: none; width: 100%; margin: 0; padding: 12px 12px 12px 12px; cursor: pointer; text-align: left;
    display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 72px;
    color: var(--text); border-radius: var(--r-card); -webkit-tap-highlight-color: transparent;
  }
  .tog:active { background: var(--hl); }
  .plate {
    display: grid; justify-items: center; align-content: center; width: 56px; height: 56px; flex: none; border-radius: var(--r-btn);
    background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip); transform: rotate(-3deg);
  }
  .plate b { font-size: 1.5rem; line-height: 1; }
  .plate small { margin-top: 2px; font: 700 var(--fs-xs)/1 var(--font-ui); }
  .meta { display: grid; gap: 2px; min-width: 0; }
  .date { display: flex; align-items: center; gap: 6px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .tag {
    font-style: normal; padding: 1px 8px; border-radius: var(--r-pill); background: var(--c-leaf); color: var(--c-ink);
    font: 700 var(--fs-xs)/1.4 var(--font-ui); box-shadow: 0 2px 0 var(--c-leaf-lip);
  }
  .ttl { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .sub { font: 500 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .ic { font-size: 1rem; line-height: 1; }
  .chev { width: 18px; height: 18px; fill: none; stroke: var(--text-soft); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; transition: transform 200ms var(--ease-soft); }
  .open .chev { transform: rotate(180deg); }
  /* today: a leaf rim */
  .today { box-shadow: var(--sh-lip), inset 0 0 0 3px var(--c-leaf); }

  .body { display: grid; gap: 14px; padding: 2px 12px 14px; animation: in 220ms var(--ease-soft); }
  @keyframes in { from { opacity: 0; transform: translateY(-6px); } }
  .sec { display: grid; gap: 6px; }
  h4 { margin: 0 4px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); letter-spacing: .03em; }
  .tip { margin: 0; display: flex; gap: 8px; padding: 10px 12px; border-radius: var(--r-btn); background: var(--hl); font: 500 var(--fs-s)/1.5 var(--font-ui); }

  /* a hike's figures: its level pill and the trailhead, the numbers in a grid */
  .hike { display: grid; gap: 8px; }
  .hk-head { margin: 0; display: flex; align-items: center; gap: 8px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .lv { padding: 3px 10px; border-radius: var(--r-pill); color: var(--c-ink); font: 700 var(--fs-s)/1.3 var(--font-ui); }
  .lv.mod { background: var(--c-mint); }
  .lv.hard { background: var(--c-yuzu); }
  .lv.epic { background: var(--c-coral); }
  .hk-grid { margin: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; border-radius: var(--r-btn); overflow: hidden; background: var(--lip); }
  .hk-grid div { padding: 8px 8px 9px; background: color-mix(in srgb, var(--surface) 55%, var(--card)); text-align: center; }
  .hk-grid .wide { grid-column: span 2; text-align: left; padding-inline: 12px; }
  dt { font: 700 var(--fs-xs)/1.3 var(--font-ui); color: var(--text-soft); }
  dd { margin: 2px 0 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  dd.money { font-size: var(--fs-talk); line-height: 1.2; }
  @media (prefers-reduced-motion: reduce) { .body { animation: none; } .chev { transition: none; } }
</style>
