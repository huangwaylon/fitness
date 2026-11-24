<script lang="ts">
  // A place's card, a level in the sheet (docs/places.md "Card"): its head pinned at the top of the sheet's scroller (a
  // line under it once scrolled): ‹ back to the list, the name (15 bold, two lines at most), ⋯ (its website, 電話,
  // この周辺で探す); no ✕ of its own (the bar's over the map closes the sheet: two read as the card's); its icon and 「subtype · area · distance」, NEW for 3 days; the hours line (the week
  // view behind a tap); the note with 「メモはGoogleマップで編集」;
  // 経路, Googleマップ, コピー (name and address: 「住所をコピーしました」); 保存日. Google's details (the row's `det`, the
  // relay's): ★ and its count in the sub line, a line about the place under it, the hours, 電話 / the website in ⋯;
  // the photo band over the sub line once its links are in (places/pics.ts), no spinner before.
  import NavButton from '../ui/NavButton.svelte';
  import Icon from '../ui/Icon.svelte';
  import ActionSheet from '../ui/ActionSheet.svelte';
  import HoursLine from './HoursLine.svelte';
  import PlacePhotos from './PlacePhotos.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import Badge from './Badge.svelte';
  import type { Entry } from '#lib/places/search.ts';
  import { isNew } from '#lib/places/search.ts';
  import { fmtDist, type LL } from '#lib/places/geo.ts';
  import { copyText, mapsUrl, routeUrl } from '#lib/places/links.ts';
  import { S, ratingText, telLabel } from '#lib/places/strings.ts';
  import { loadPics } from '#lib/places/pics.ts';
  import { picUrl } from '#lib/contract/places.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { pick } from '../travel/text.ts';

  interface Props {
    e: Entry;
    /** Metres from the anchor (NaN: none shown). */
    dist: number;
    now: number;
    onback: () => void;
    /** この周辺で探す: a point about it. */
    onnear: (at: LL) => void;
  }
  let { e, dist, now, onback, onnear }: Props = $props();
  const L = $derived(i18n.locale);
  const p = $derived(e.p);
  const sub = $derived([p.sub || p.cat, e.area.label, Number.isFinite(dist) ? fmtDist(dist) : ''].filter(Boolean).join(' · '));
  let more = $state(false);

  // Google's details: the row's own (the relay's); the photos' links asked when the card opens (pics.ts), keyed by the
  // place's id so a stale answer never lands on the next card. A place with photos holds the band as the paper box
  // while its links are out (E3: the title doesn't jump when they land; none reached: the box goes).
  const detail = $derived(e.p.det ?? null);
  let pics = $state<{ id: string; urls: string[] } | null>(null);
  let settled = $state<string | null>(null);
  $effect(() => {
    const id = p.id, n = detail?.pn ?? 0;
    if (!n) return void (settled = id);
    let live = true;
    loadPics(id)
      .then((t) => void (live && t?.length && (pics = { id, urls: t.map((x) => picUrl(x, 600, 338)) })))
      .finally(() => void (live && (settled = id)));
    return () => void (live = false);
  });
  const photos = $derived(pics && pics.id === p.id ? pics.urls : []);
  const bandHeld = $derived(!photos.length && settled !== p.id && !!detail?.pn);

  // the head's line: the sheet's scroller (PlacesView's .sheet-scroll) off its top (not a rubber band's negative top)
  let scrolled = $state(false);
  const watch = (el: HTMLElement) => {
    const sc = el.closest('.sheet-scroll');
    if (!sc) return;
    const on = () => (scrolled = sc.scrollTop > 0);
    sc.addEventListener('scroll', on, { passive: true });
    return () => sc.removeEventListener('scroll', on);
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText(p));
      toasts.show(pick(S.copied, L));
    } catch {
      /* refused (no user gesture, no permission): nothing to say */
    }
  }
  const acts = $derived([
    ...(detail?.web ? [{ id: 'web', label: pick(S.web, L), icon: 'external-link' as const, hook: 'place-web' }] : []),
    ...(detail?.tel ? [{ id: 'tel', label: telLabel(detail.tel, L), hook: 'place-tel' }] : []),
    { id: 'near', label: pick(S.searchNear, L), icon: 'search' as const, hook: 'place-near' }
  ]);
  function act(id: string) {
    if (id === 'web') window.open(detail?.web, '_blank', 'noopener,noreferrer');
    else if (id === 'tel') window.open(`tel:${(detail?.tel ?? '').replace(/[ ()]/g, '')}`, '_self');
    else onnear([p.lng, p.lat]);
  }
</script>

<section class="card-level" data-place-card={p.id} {@attach watch}>
  <div class="head" data-scrolled={scrolled || undefined}>
    <NavButton kind="back" onclick={onback} data-place-back />
    <h2 class="name">{p.name}</h2>
    <NavButton kind="tool" icon="more" popup label={pick(S.more, L)} data-place-more onclick={() => (more = true)} />
  </div>
  <div class="body">
    {#if photos.length}
      <PlacePhotos urls={photos} alt={p.name} href={mapsUrl(p)} />
    {:else if bandHeld}
      <div class="band-hold" aria-hidden="true"></div>
    {/if}
    <div class="sub"><Badge cat={p.cat} /><span class="st">{sub}</span>{#if detail?.r && detail?.rn}<span class="rate" data-place-rating>{ratingText(detail.r, detail.rn, L)}</span>{/if}{#if isNew(p, now)}<span class="tag new">{pick(S.isNew, L)}</span>{/if}</div>
    {#if detail?.desc}<p class="desc" data-place-desc><Phrases text={detail.desc} /></p>{/if}
    <HoursLine hours={e.hours ?? detail?.hours ?? null} tz={p.tz} {now} closed={!!detail?.shut} />
    {#if p.note}
      <div class="note" data-place-note>
        <div class="nt">{p.note}</div>
        <p class="hint"><Phrases text={pick(S.noteHint, L)} /></p>
      </div>
    {/if}
    <div class="acts">
      <a class="btn small" href={routeUrl(p)} target="_blank" rel="noopener noreferrer" data-place-route data-sfx="open"><Icon name="arrow-up-right" size={18} />{pick(S.route, L)}</a>
      <a class="btn small paper" href={mapsUrl(p)} target="_blank" rel="noopener noreferrer" data-place-maps data-sfx="open"><Icon name="map" size={18} />{pick(S.gmaps, L)}</a>
      <button type="button" class="btn small paper" data-place-copy data-sfx="tick" onclick={copy}><Icon name="clipboard" size={18} />{pick(S.copy, L)}</button>
    </div>
    <div class="foot">{pick(S.added, L)} {formatDate(localDateAt(p.added * 1000), { year: true })}</div>
  </div>
</section>

<ActionSheet bind:open={more} name="place-more" title={p.name} groups={[acts]} onpick={act} />

<style>
  .card-level { display: flex; flex-direction: column; min-height: 0; }
  /* pinned in the scroller (sticky: iOS's rubber band carries it with the card, never off it); the scroller's 12 px
     sides (PlacesView .card-wrap) under its paper too, the controls 6 px in as ever; the line only once scrolled */
  .head {
    position: sticky; top: 0; z-index: 1; display: grid; grid-template-columns: var(--hit) minmax(0, 1fr) var(--hit); align-items: center; gap: 2px;
    margin: 0 -12px; padding: 0 6px 2px; background: var(--surface); box-shadow: 0 1px 0 transparent; transition: box-shadow 0.15s;
  }
  .head[data-scrolled] { box-shadow: 0 1px 0 var(--stitch); }
  .name { margin: 0; font: 700 15px/1.3 var(--font-ui); color: var(--text); overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
  .body { display: flex; flex-direction: column; gap: 6px; padding: 0 2px; }
  .sub { margin: 0; display: flex; align-items: center; gap: 8px; min-width: 0; font: 600 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .st { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sub .tag { flex: none; }
  /* Google's sections, faded in */
  .rate { flex: none; color: var(--text); animation: vd-in 0.25s var(--ease-soft); }
  /* the band's space, held till the photos' links settle (the paper box's size, the band's height) */
  .band-hold { height: 192px; border-radius: var(--r-row); background: var(--c-paper); }
  .desc { margin: 0; font: 400 var(--fs-body)/1.55 var(--font-body); color: var(--text); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; animation: vd-in 0.25s var(--ease-soft); }
  @keyframes vd-in { from { opacity: 0; } }
  .note { margin: 2px 0; padding: 10px 12px; border-radius: var(--r-row); background: var(--card); box-shadow: var(--sh-lip-s); }
  .nt { margin: 0; font: 400 var(--fs-body)/1.55 var(--font-body); color: var(--text); white-space: pre-line; overflow-wrap: anywhere; }
  .hint { margin: 6px 0 0; font: 600 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .acts { display: flex; gap: 8px; margin: 4px 0 2px; }
  .acts .btn { flex: 1; min-width: 0; margin: 0 0 var(--lip-h, 4px); padding: 0 8px; gap: 4px; font-size: var(--fs-s); text-decoration: none; white-space: nowrap; }
  .foot { margin: 2px 0 0; font: 600 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
</style>
