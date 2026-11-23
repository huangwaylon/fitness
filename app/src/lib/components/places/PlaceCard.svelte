<script lang="ts">
  // A place's card, a level in the sheet (docs/places.md "Card"): ‹ back to the list, the name (15 bold), ⋯ (its website,
  // 電話, この周辺で探す); no ✕ of its own (the bar's over the map closes the sheet: two read as the card's); its icon and 「subtype · area · distance」, NEW for 3 days; the hours line (the week
  // view behind a tap); the note (a member's only: the guest's payload has none) with 「メモはGoogleマップで編集」;
  // 経路, Googleマップ, コピー (name and address: 「住所をコピーしました」); 保存日. The vendored detail (places/vendored.ts,
  // Google's) in when it arrives, no spinner before: the photo band over the sub line, ★ and its count in it, a line
  // about the place under it, the hours filled where the relay has none, 電話 / the website in ⋯.
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
  import { loadVendoredIndex, loadPlaceDetail, cardCell, type VendoredIndex, type VendoredPlace } from '#lib/places/vendored.ts';
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

  // The vendored detail (Google's: photos, the hours OSM has none of, a phone, a rating, a line about it): the card
  // as ever until it arrives, its sections then faded in; keyed by the place's id so a stale one never lands on the
  // next card (nor its photos linger). A vendorable id's band is reserved as the paper box while the detail is out
  // (E3: the title doesn't jump when it lands; a k: id never asks, a detail without photos takes the box back).
  let vend = $state<{ id: string; ix: VendoredIndex; d: VendoredPlace } | null>(null);
  let settled = $state<string | null>(null);
  $effect(() => {
    const id = p.id;
    let live = true;
    loadVendoredIndex()
      .then((ix) => (ix ? loadPlaceDetail(id).then((d) => (d ? { id, ix, d } : null)) : null))
      .then((v) => void (live && v && (vend = v)), () => {})
      .finally(() => void (live && (settled = id)));
    return () => void (live = false);
  });
  const detail = $derived(vend && vend.id === p.id ? vend.d : null);
  const photos = $derived.by(() => {
    if (!vend || vend.id !== p.id || !vend.d.pics?.length) return [];
    const out = [];
    for (let i = 0; i < Math.min(3, vend.d.pics.length); i++) {
      const c = cardCell(vend.ix, vend.d, i);
      if (c) out.push(c);
    }
    return out;
  });
  const bandHeld = $derived(!photos.length && settled !== p.id && /^(\d+|f:0x[0-9a-f]+:0x[0-9a-f]+)$/.test(p.id));

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText(p));
      toasts.show(pick(S.copied, L));
    } catch {
      /* refused (no user gesture, no permission): nothing to say */
    }
  }
  const acts = $derived([
    ...(p.web || detail?.web ? [{ id: 'web', label: pick(S.web, L), icon: 'external-link' as const, hook: 'place-web' }] : []),
    ...(detail?.tel ? [{ id: 'tel', label: telLabel(detail.tel, L), hook: 'place-tel' }] : []),
    { id: 'near', label: pick(S.searchNear, L), icon: 'search' as const, hook: 'place-near' }
  ]);
  function act(id: string) {
    if (id === 'web') window.open(p.web || detail?.web, '_blank', 'noopener,noreferrer');
    else if (id === 'tel') window.open(`tel:${(detail?.tel ?? '').replace(/[ ()]/g, '')}`, '_self');
    else onnear([p.lng, p.lat]);
  }
</script>

<section class="card-level" data-place-card={p.id}>
  <div class="head">
    <NavButton kind="back" onclick={onback} />
    <h2 class="name">{p.name}</h2>
    <NavButton kind="tool" icon="more" popup label={pick(S.more, L)} data-place-more onclick={() => (more = true)} />
  </div>
  <div class="body">
    {#if photos.length}
      <PlacePhotos cells={photos} alt={p.name} href={mapsUrl(p)} />
    {:else if bandHeld}
      <div class="band-hold" aria-hidden="true"></div>
    {/if}
    <div class="sub"><Badge cat={p.cat} /><span class="st">{sub}</span>{#if detail?.r && detail?.rn}<span class="rate" data-place-rating>{ratingText(detail.r, detail.rn, L)}</span>{/if}{#if isNew(p, now)}<span class="tag new">{pick(S.isNew, L)}</span>{/if}</div>
    {#if detail?.desc}<p class="desc" data-place-desc><Phrases text={detail.desc} /></p>{/if}
    <HoursLine hours={p.hours ?? detail?.hours ?? null} tz={p.tz} {now} />
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
  .head { display: grid; grid-template-columns: var(--hit) minmax(0, 1fr) var(--hit); align-items: center; gap: 2px; margin: 0 -6px; }
  .name { margin: 0; font: 700 15px/1.3 var(--font-ui); color: var(--text); overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
  .body { display: flex; flex-direction: column; gap: 6px; padding: 0 2px; }
  .sub { margin: 0; display: flex; align-items: center; gap: 8px; min-width: 0; font: 600 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .st { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sub .tag { flex: none; }
  /* the vendored sections, in when the detail arrives (no spinner while it doesn't) */
  .rate { flex: none; color: var(--text); animation: vd-in 0.25s var(--ease-soft); }
  /* the band's space, held till the detail settles (the paper box's size, the band's height) */
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
