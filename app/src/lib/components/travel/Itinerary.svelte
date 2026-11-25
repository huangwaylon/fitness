<script lang="ts">
  // 日程 (docs/design.md §Trips, docs/travel.md "Itinerary"): every day of the trip on one page, each day a boarding
  // pass: its heading the stub (● the day's colour, the date, n日目, the title), held at the top while the day scrolls
  // under it, torn off along a stitch (a notch each side); then the day's lines (ledger.ts): a stop's arrival and
  // place, under it how we got there; 「泊」 on the night's stop (「未予約」 in bold); a tap opens a line's details (its
  // notes, km, sunrise/sunset, 地図で見る, Googleマップ) and the heading's (the day's photo and tip, a hike's facts). During the trip
  // the line we're heading to is lit (「いま移動中 · あと1時間40分 · 181 km」), the ones before it quiet, and the page
  // opens scrolled to it. Its words are in the guide's language (itinerary.ts guideLocale). A day far below is `content-visibility: auto` (not one holding an open line). `scroller` is
  // the parent's scrolling box (the heading sticks to its top); the day at its top is `viewDay`.
  import { onMount, tick, untrack } from 'svelte';
  import type { Day, Trip } from '#lib/travel/types.ts';
  import { colourOf, guideLocale } from '#lib/travel/itinerary.ts';
  import { i18n, pinLocale, t } from '#lib/i18n/index.ts';
  import Icon from '../ui/Icon.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import Txt from './Txt.svelte';
  import Stats from './Stats.svelte';
  import Links from './Links.svelte';
  import Photo from './Photo.svelte';
  import { ledger, nowMark, type How, type Line, type Mark } from './ledger.ts';
  import { dateOn, headDate, listSpan } from './dates.ts';
  import { fmtM, pick } from './text.ts';
  import { fmtKm } from './units.ts';
  import { hikeSlugOf } from '#lib/hiking/slugs.ts';
  import { openTrail } from '../hiking/open.svelte.ts';

  interface Props {
    trip: Trip;
    note: Record<string, string> | null;
    now: number;
    scroller: HTMLElement | undefined;
    /** The day whose heading is at the top (地図 opens on it). */
    viewDay?: number;
    /** Where the page was left (back from another page); null: open on the lit line. */
    at?: number | null;
    /** 地図で見る on a stop (none: no map, the action not shown). */
    onmap?: ((id: string, day: number) => void) | null;
  }
  let { trip, note, now, scroller, viewDay = $bindable(1), at = null, onmap = null }: Props = $props();

  /** The guide's language (Seattle's: English): every word of the list in it, never a mix of two on a line. */
  const lang = $derived(guideLocale(trip, i18n.locale));
  pinLocale(untrack(() => lang));
  const tr = (key: string, params?: Record<string, string | number>) => t(key, params, lang);
  const all = $derived(ledger(trip));
  const mark: Mark | null = $derived(nowMark(trip, all, now));
  let open = $state<string | null>(null);
  let tipOpen = $state<number | null>(null);
  const openDay = $derived(open ? trip.days.find((d) => all.get(d.n)?.some((l) => l.id === open))?.n : undefined);
  /** Days drawn lazily: below the lit one (or past the first two), not the one with an open line. */
  const lazy = (n: number) => n !== openDay && n > (mark?.day ?? 2);
  /** A lazy day's height before it is first drawn, from what it holds (WebKit has no scroll anchoring: a close guess
   *  keeps the page from jumping as it is drawn). */
  const guess = (d: Day, ls: Line[]) =>
    76 + (d.hike ? 27 : 0) + ls.reduce((h, l) => h + (l.how ? 55 : 44) + l.subs.length * 21, 0) + (d.sections ?? []).reduce((h, s) => h + (s.head ? 26 : 0) + s.rows.length * 34, 0);

  const dur = (min: number) => {
    const h = Math.floor(min / 60), m = min % 60;
    return h ? (m ? tr('travel.it.hm', { h, m }) : tr('travel.it.h', { h })) : tr('travel.map.min', { min });
  };
  const howText = (h: How) =>
    [h.dep ? tr('travel.it.dep', { t: h.dep }) : '', h.mode ? tr(`travel.it.mode.${h.mode}`) + (h.min ? ` ${dur(h.min)}` : '') : ''].filter(Boolean).join(' · ');
  const markText = (m: Mark) =>
    m.state === 'here' ? tr('travel.it.here') : [tr(m.state === 'moving' ? 'travel.it.moving' : 'travel.it.next'), ...(m.left ? [tr('travel.it.left', { d: dur(m.left) })] : []), ...(m.km ? [fmtKm(m.km)] : [])].join(' · ');
  const mapsHref = (l: Line) => l.place?.link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pick(l.name, 'en') + ' ' + pick(trip.title, 'en'))}`;
  const hikeLine = (d: Day) => (d.hike ? `${fmtKm(d.hike.km)} · ${tr('travel.it.gain', { m: fmtM(d.hike.gainM) })} · ${pick(d.hike.time, lang)}` : '');
  /** The heading's details: the day's photo and tip, a hike's facts and trail, its links where no stop has its own. */
  const hasTip = (d: Day) => !!d.note || !!d.hike || !!d.photo || (!!d.links?.length && !(all.get(d.n) ?? []).some((l) => l.place));
  const label = (d: Day) => `${tr('travel.day', { n: d.n })} ${headDate(d.date, lang)} ${pick(d.title, lang)}`;
  const LEVEL = { mod: 'leaf', hard: '', epic: 'coral' } as const;

  /** Scrolls a line to a third down the page (after the layout settles: fonts, then two frames). */
  async function reveal(id: string, smooth = false) {
    await tick();
    await document.fonts?.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el = scroller?.querySelector<HTMLElement>(`[data-line="${CSS.escape(id)}"]`);
    if (!el || !scroller) return;
    const top = scroller.scrollTop + el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - scroller.clientHeight * 0.35;
    scroller.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'instant' });
    track();
  }
  /** A stop from 地図 (日程で見る): its line opened and brought into view. */
  export function show(id: string) {
    open = id;
    void reveal(id);
  }

  let raf = 0;
  function track() {
    if (!scroller) return;
    const top = scroller.getBoundingClientRect().top + 8;
    let n = trip.days[0]?.n ?? 1;
    for (const s of scroller.querySelectorAll<HTMLElement>('section[data-day]')) {
      if (s.getBoundingClientRect().top <= top) n = Number(s.dataset.day);
      else break;
    }
    viewDay = n;
  }
  $effect(() => {
    const el = scroller;
    if (!el) return;
    const on = () => (cancelAnimationFrame(raf), (raf = requestAnimationFrame(track)));
    el.addEventListener('scroll', on, { passive: true });
    return () => (el.removeEventListener('scroll', on), cancelAnimationFrame(raf));
  });
  onMount(() => {
    const top = untrack(() => at), m = untrack(() => mark);
    if (top !== null) void tick().then(() => (scroller && (scroller.scrollTop = top), track()));
    else if (m) void reveal(m.id);
  });
</script>

<div class="itin guide" data-itinerary={trip.id}>
  <p class="span"><Phrases text="{listSpan(trip.start, trip.end, lang)} · {tr('travel.it.days', { n: trip.days.length })}" /></p>
  {#each trip.days as d (d.n)}
    {@const ls = all.get(d.n) ?? []}
    {@const tip = hasTip(d)}
    <section class="day" class:lazy={lazy(d.n)} data-day={d.n} style:--dc={colourOf(trip, d.n)} style:contain-intrinsic-size={lazy(d.n) ? `auto ${guess(d, ls)}px` : undefined}>
      <div class="pass">
        <h2 class="dh" aria-label={label(d)}>
          <svelte:element this={tip ? 'button' : 'span'} type={tip ? 'button' : undefined} class="dhb" data-sfx="page" aria-expanded={tip ? tipOpen === d.n : undefined} data-day-head={d.n} onclick={() => tip && (tipOpen = tipOpen === d.n ? null : d.n)} role={tip ? undefined : 'presentation'}>
            <i class="dot" aria-hidden="true"></i>
            <span class="date" aria-hidden="true">{headDate(d.date, lang)}</span>
            <span class="ord" aria-hidden="true">{tr('travel.day', { n: d.n })}</span>
            <span class="ttl" aria-hidden="true"><Txt l={d.title} {note} /></span>
            {#if tip}<span class="chev" aria-hidden="true"><Icon name={tipOpen === d.n ? 'chevron-up' : 'chevron-down'} size={14} /></span>{/if}
          </svelte:element>
        </h2>
        <div class="body">
          {#if d.hike}<p class="hike"><Phrases text={hikeLine(d)} /></p>{/if}
          {#if tipOpen === d.n}
            <div class="tip" data-day-tip={d.n}>
              {#if d.photo}<Photo photo={d.photo} />{/if}
              {#if d.note}<p><Txt l={d.note} {note} /></p>{/if}
              {#if d.hike}
                {@const trail = hikeSlugOf(d.hike.gpx)}
                <p class="lv"><b class="sticker {LEVEL[d.hike.level]}">{tr(`travel.hike.${d.hike.level}`)}</b><Txt l={d.hike.where} {note} /></p>
                <Stats stats={[{ k: tr('travel.hike.drive'), v: d.hike.drive }, { k: tr('travel.hike.route'), v: d.hike.route }, { k: tr('travel.hike.pass'), v: d.hike.pass }]} {note} />
                {#if trail}
                  <button type="button" class="act" data-sfx="open" data-trail-open={trail} onclick={() => openTrail(trail)}><Icon name="mountain" size={15} />{tr('travel.hike.trail')}</button>
                {:else if d.hike.gpx}
                  <Links links={[{ label: { [lang]: tr('travel.hike.map') }, href: d.hike.gpx }]} {note} />
                {/if}
              {/if}
              {#if d.links?.length && !ls.some((l) => l.place)}<Links links={d.links} {note} />{/if}
            </div>
          {/if}
          {#if ls.length}
            <ol class="ledger">
              {#each ls as l (l.id)}
                {@const lit = mark?.id === l.id}
                {@const past = !lit && !!mark?.past(d.n, l.id)}
                {@const can = l.more.length > 0 || !!l.km || !!l.place || l.subs.some((s) => s.note)}
                {@const isOpen = open === l.id}
                <li class={l.kind} class:lit class:past data-line={l.id} data-now={lit ? mark?.state : undefined}>
                  <svelte:element this={can ? 'button' : 'div'} type={can ? 'button' : undefined} class="ln" data-sfx="page" class:static={!can} aria-expanded={can ? isOpen : undefined} onclick={() => can && (open = isOpen ? null : l.id)} role={can ? undefined : 'presentation'}>
                    <span class="t">{#if l.dd}<small>{tr(l.dd < 0 ? 'travel.ddEve' : 'travel.ddNext', { d: dateOn(d.date, l.dd, lang) })}</small>{/if}{l.t}</span>
                    <span class="tx">
                      <span class="nm"><Txt l={l.name} {note} />{#if pick(l.gloss, lang)}<span class="gl"><Txt l={l.gloss} {note} /></span>{/if}{#if l.kind === 'stay'}<span class="bed" data-stay>{tr('travel.it.stay')}{#if !l.booked}<b data-unbooked>{tr('travel.it.unbooked')}</b>{/if}</span>{/if}</span>
                      {#if lit && mark}<span class="how nw">{markText(mark)}</span>{:else if l.how}<span class="how">{howText(l.how)}</span>{/if}
                    </span>
                  </svelte:element>
                  {#if isOpen}
                    <div class="more" data-more={l.id}>
                      {#each l.more as m, i (i)}
                        <p>{#if m.t}<span class="mt">{m.t}</span>{/if}{#if m.text}<Txt l={m.text} {note} />{/if}{#if m.text && m.note}<br />{/if}{#if m.note}<Txt l={m.note} {note} />{/if}</p>
                      {/each}
                      {#if l.km}<p><Phrases text={fmtKm(l.km)} /></p>{/if}
                      {#if l.place}
                        <p class="acts">
                          {#if onmap}<button type="button" class="act" data-sfx="tick" data-on-map={l.id} onclick={() => onmap?.(l.id, d.n)}>{tr('travel.it.onMap')}</button>{/if}
                          <a class="act" data-sfx="open" href={mapsHref(l)} target="_blank" rel="noopener" aria-label="{tr('travel.it.gmaps')} ({tr('travel.opens')})">{tr('travel.it.gmaps')} <Icon name="external-link" size={13} /></a>
                        </p>
                      {/if}
                    </div>
                  {/if}
                  {#each l.subs as s (s.row)}
                    <p class="sub"><span class="t">{s.t}</span><span><Txt l={s.text} {note} />{#if s.note && isOpen}<span class="gl blk"><Txt l={s.note} {note} /></span>{/if}</span></p>
                  {/each}
                </li>
              {/each}
            </ol>
          {/if}
          {#each d.sections ?? [] as s, i (i)}
            {#if s.head}<h3 class="sh"><Txt l={s.head} {note} /></h3>{/if}
            <ul class="bul">
              {#each s.rows as r, j (j)}<li>{#if r.t}<span class="t">{r.t}</span>{/if}<span><Txt l={r.text} {note} />{#if r.note}<span class="gl blk"><Txt l={r.note} {note} /></span>{/if}</span></li>{/each}
            </ul>
          {/each}
        </div>
      </div>
    </section>
  {/each}
  {#if trip.foot}<p class="foot"><Txt l={trip.foot} {note} /></p>{/if}
</div>

<style>
  .itin { padding: 6px 0 32px; }
  .span { margin: 0 0 2px; font: 600 var(--fs-s)/1.4 var(--font-num); color: var(--text-soft); text-align: center; }

  /* a day: the pass's own side room (8px) inside the section, so a lazy section's paint box never cuts the notches */
  .day { padding: 10px 8px 0; }
  .day.lazy { content-visibility: auto; }
  .pass { position: relative; padding: 0 10px 2px; border-radius: var(--r-row); background: var(--card); box-shadow: var(--sh-lip-s); }
  /* the stub: held at the top of the page while its day scrolls under it, opaque down to and with its torn edge (a
     stitch, a notch biting each side of the card) and a short fade under it, so a line half under it dissolves; the card's last line is its
     content's end, so the next day pushes it off with no empty card under it */
  .dh { position: sticky; top: 0; z-index: 2; margin: 0 -10px; padding: 0 10px 4px; border-radius: var(--r-row) var(--r-row) 0 0; border-bottom: 1.5px dashed var(--stitch); background: var(--card); box-shadow: 0 9px 6px -3px var(--card); font: inherit; }
  .dh::before, .dh::after { content: ''; position: absolute; bottom: -9px; width: 16px; height: 16px; border-radius: 50%; background: var(--surface); }
  .dh::before { left: -8px; }
  .dh::after { right: -8px; }
  .dhb { width: 100%; min-height: 48px; display: flex; align-items: baseline; gap: 8px; padding: 12px 0 6px; border: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  span.dhb { cursor: default; }
  .dot { flex: none; align-self: center; width: 8px; height: 8px; border-radius: 50%; background: var(--dc); }
  .date { flex: none; font: 600 var(--fs-body)/1.3 var(--font-num); color: var(--c-ink); }
  .ord { flex: none; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .ttl { min-width: 0; font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .chev { margin-left: auto; align-self: center; color: var(--text-soft); }
  .body { padding-top: 10px; }
  .body > :last-child, .body > .ledger:last-child > li:last-child > :last-child { margin-bottom: 0; }

  .hike { margin: 0 0 6px; padding-left: 6px; font: 400 var(--fs-s)/1.5 var(--font-body); color: var(--text-soft); }
  .tip { margin: 0 0 8px; padding: 8px 10px; display: grid; gap: 6px; border-radius: var(--r-chip); background: var(--ctl-off); font: 400 var(--fs-s)/1.5 var(--font-body); color: var(--text-soft); }
  .tip p { margin: 0; }
  .lv { display: flex; align-items: center; gap: 8px; }
  .lv .sticker { text-shadow: none; }

  .ledger { list-style: none; margin: 0; padding: 0; }
  .ln { width: 100%; min-height: 44px; display: grid; grid-template-columns: 50px minmax(0, 1fr); column-gap: 10px; align-items: baseline; padding: 6px 0; margin: 0; border: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; border-radius: var(--r-chip); -webkit-tap-highlight-color: transparent; }
  .ln:active { background: var(--hl); }
  .ln.static { cursor: default; }
  .ln.static:active { background: none; }
  .t { text-align: right; font: 600 var(--fs-s)/1.6 var(--font-num); font-variant-numeric: tabular-nums; color: var(--text-soft); white-space: nowrap; }
  .t small { display: block; font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .tx { display: grid; min-width: 0; }
  .nm { font: 500 var(--fs-body)/1.45 var(--font-body); }
  .event .nm { font-size: var(--fs-s); color: var(--text-soft); }
  .gl { margin-left: 8px; font: 400 var(--fs-s)/1.4 var(--font-body); color: var(--text-soft); }
  .gl.blk { display: block; margin: 0; }
  .bed { margin-left: 8px; font: 400 var(--fs-s)/1 var(--font-body); color: var(--text-soft); white-space: nowrap; }
  .bed b { margin-left: 6px; font-weight: 700; color: var(--c-ink); }
  .how { font: 400 var(--fs-s)/1.4 var(--font-body); color: var(--text-soft); }
  .how.nw { font-weight: 700; color: var(--c-ink); }
  .sub { margin: -4px 0 4px; display: grid; grid-template-columns: 50px minmax(0, 1fr); column-gap: 10px; align-items: baseline; font: 400 var(--fs-s)/1.45 var(--font-body); color: var(--text-soft); }
  .past .nm, .past .t { color: var(--text-soft); font-weight: 400; }
  /* the line we're heading to: one yuzu band, edge to edge of the card */
  .lit { margin: 0 -10px; padding: 0 10px; background: color-mix(in srgb, var(--c-yuzu) 42%, var(--card)); }
  .lit .t { color: var(--c-ink); }
  .lit .nm { font-weight: 700; }
  .lit .ln:active { background: none; }
  .body > .ledger:last-child > .lit:last-child { margin-bottom: -2px; padding-bottom: 2px; border-radius: 0 0 var(--r-row) var(--r-row); }

  .more { padding: 0 0 8px 60px; display: grid; gap: 4px; font: 400 var(--fs-s)/1.5 var(--font-body); color: var(--text-soft); }
  .more p { margin: 0; }
  .mt { margin-right: 8px; font: 600 var(--fs-s)/1.5 var(--font-num); font-variant-numeric: tabular-nums; }
  .acts { display: flex; flex-wrap: wrap; column-gap: 20px; }
  .act { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding: 0; border: 0; background: none; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--leaf-text); text-decoration: none; cursor: pointer; }
  .sh { margin: 8px 0 2px 6px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .bul { margin: 0 0 6px; padding: 0 0 0 60px; list-style: none; display: grid; gap: 6px; font: 400 var(--fs-body)/1.45 var(--font-body); }
  .bul li { display: flex; gap: 8px; }
  .bul .t { font-size: var(--fs-s); }
  .foot { margin: 24px 16px 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
</style>
