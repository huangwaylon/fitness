<script lang="ts">
  // 保存した場所 (docs/places.md "Screen"): the map full bleed (PlacesMap) under the game's buttons, as a trail's view: ✕
  // top-right (NavBar over the map), ＋ − under it, the location disc bottom-right over the sheet, the attribution
  // bottom-left; and the drag-up sheet on the app's paper (peek or full; the grip and the head drag it, a tap toggles):
  // its head the search field (one-handed; a tap raises the sheet with the keyboard), the chip row (the sort chip, the
  // chips the field read, the top categories, a picked one's subs after it) and the meta line (count · 同期 …); its body
  // the matches, a virtualised list of 56 px rows. The list and the map show the same matches. 近い順 measures from a
  // chosen point (a long press: この地点の周辺; このあたりで探す: 地図の中心; an area), else my location, else the map's
  // centre. A row flies there and opens the card (a level in the sheet: PlaceCard); a marker opens it; a cluster zooms.
  // Browse mode (no text, no where-chip: an area, 現在地周辺, a point, 地図の中心; the filter chips keep it): the list is
  // the places in the map above the sheet's peek, from each moveend (docs/places.md "Browse"); the map draws every match.
  import { onMount, tick, untrack } from 'svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Icon from '../ui/Icon.svelte';
  import Chip from '../ui/Chip.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import LoadError from '../ui/LoadError.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import PlacesMap from './PlacesMap.svelte';
  import ZoomDiscs from '../map/ZoomDiscs.svelte';
  import LocateDisc from '../map/LocateDisc.svelte';
  import PlaceCard from './PlaceCard.svelte';
  import PlacesFilter from './PlacesFilter.svelte';
  import Badge from './Badge.svelte';
  import { places } from '#lib/places/store.svelte.ts';
  import { PLACE_CATS, PLACE_CAT_KEYS, type PlaceCat } from '#lib/contract/places.ts';
  import { search, relax, isNew, QUICK_RATE, type Box, type Sort } from '#lib/places/search.ts';
  import { chipKey, chipLabel, continues, parse, withChips, type Chip as QChip } from '#lib/places/query.ts';
  import { placeKey } from '#lib/places/text.ts';
  import { hoursNow } from '#lib/places/hours.ts';
  import { fmtDist, homeOf, type LL } from '#lib/places/geo.ts';
  import { S, SF, SORT_LABEL, ago } from '#lib/places/strings.ts';
  import { useLocate } from '../map/locate.svelte.ts';
  import MapSheet from '../map/MapSheet.svelte';
  import { DragSheet, STRIP } from '../map/sheet.svelte.ts';
  import { MS } from '../map/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { minuteTimer, now as clockNow } from '#lib/time/clock.ts';
  import { DEVICE, getStoredMe, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
  import { formatNum } from '#lib/i18n/index.ts';
  import { mapStub, testHooks } from '#lib/ui-state/testMode.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';
  import { loadPlaceDetail, loadVendoredIndex } from '#lib/places/vendored.ts';
  import { pick } from '../travel/text.ts';
  import type { Cam } from './map/engine.ts';

  let { onclose }: { onclose: () => void } = $props();
  const L = $derived(i18n.locale);

  // ---- the data
  void places.load(false, true);
  const ix = $derived(places.index);
  let now = $state(clockNow().getTime());
  onMount(() => minuteTimer(() => (now = clockNow().getTime())));


  // ---- the query
  let chips = $state.raw<QChip[]>([]);
  let text = $state('');
  let sort = $state<Sort>('near');
  /** 絞り込み (PlacesFilter) open. */
  let filtering = $state(false);
  /** The field focused since the sheet rose (入力の例 shows while it's full and empty; a blur keeps them: a tap on one
   *  blurs the field first). */
  let asked = $state(false);
  let field: HTMLInputElement | undefined = $state();
  let composing = false;
  /** The term the last word became as it was typed (what's typed next may go on with it: query.ts continues). */
  let tail = '';
  /** The field read: the words it took leave it as chips (`commit`: Enter, the field let go). */
  function read(commit = false) {
    if (!ix || composing) return;
    if (tail && text && !/\s/.test(text)) {
      const c = continues(ix.vocab, tail, text);
      if (c === 'more') return void ((tail = placeKey(tail + text)), (text = ''));
      if (c === 'wait' && !commit) return;
    }
    const r = parse(ix.vocab, text, commit);
    tail = r.tail;
    if (!r.chips.length) return;
    chips = withChips(chips, r.chips);
    typed = new Set([...typed, ...r.chips.map(chipKey)]);
    text = r.text;
  }
  /** The chips the field made (typed: a search, the whole list's), not the chip row's taps (those keep browse). */
  let typed = $state.raw(new Set<string>());
  function onkey(e: KeyboardEvent) {
    // (an IME's key: Safari ends the composition before the Return that picks a candidate, isComposing false, keyCode 229)
    if (e.isComposing || composing || e.keyCode === 229) return;
    if (e.key === 'Backspace' && !text && chips.length) {
      e.preventDefault();
      chips = chips.slice(0, -1);
      tail = '';
      prune();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      read(true);
      field?.blur();
    }
  }
  const removeChip = (c: QChip) => ((chips = chips.filter((x) => chipKey(x) !== chipKey(c))), (tail = ''), prune());
  const clearAll = () => ((chips = []), (text = ''), (tail = ''), (typed = new Set()));
  /** (a chip gone: its typed mark too, so the row's tap of it later keeps browse) */
  const prune = () => (typed = new Set([...typed].filter((k) => chips.some((c) => chipKey(c) === k))));
  /** The adders' names (members; the guest's payload has none). */
  /** A member (the guest's payload has no notes or people: メモあり, the note hint, the placeholder). */
  const member = getStoredMe() !== 'G';
  /** 保存した人's names: none yet (the payload's are Google account names, never shown; the app's ウェイ / うめ need the
   *  relay's account → person map: /tmp requests 7), so the section stays hidden. */
  const people: readonly string[] | null = null;
  // the descriptions, fetched with the first free-text word of 2 characters or more
  $effect(() => {
    if (text.trim().split(/[\s　]+/).some((w) => w.length >= 2)) untrack(() => places.wantDescs());
  });
  const label = (c: QChip) => chipLabel(c);
  /** A top is picked (its chip yuzu, its subs shown after it) while it or one of its subs is a chip. */
  const topOn = (cat: PlaceCat) => chips.some((c) => c.k === 'cat' && c.cat === cat);
  const subOn = (cat: PlaceCat, sub: string) => chips.some((c) => c.k === 'cat' && c.cat === cat && c.sub === sub);
  /** A top's chip: picks it, or lets go of it and its subs; a sub's: narrows the top to it (any of its picked subs). */
  function toggleCat(cat: PlaceCat, sub = '') {
    const mine = (c: QChip) => c.k === 'cat' && c.cat === cat;
    // (a tap: the chip's no longer the field's)
    typed = new Set([...typed].filter((k) => !k.startsWith(`cat:${cat}:`)));
    if (!sub) chips = topOn(cat) ? chips.filter((c) => !mine(c)) : withChips(chips, [{ k: 'cat', cat, sub: '' }]);
    else if (subOn(cat, sub)) chips = chips.filter((c) => !(mine(c) && c.k === 'cat' && c.sub === sub));
    else chips = withChips(chips.filter((c) => !(mine(c) && c.k === 'cat' && !c.sub)), [{ k: 'cat', cat, sub }]);
  }

  /** The row's category chips after the active ones: a picked top's other subs, then the tops not picked with
   *  matches. Quick chips (営業中, ★4.5以上) before them while not set, with the count they'd leave. */
  const notSub = (cat: PlaceCat, sub: string) => chips.some((c) => c.k === 'not' && c.cat === cat && (!c.sub || c.sub === sub));
  const subs = $derived(PLACE_CAT_KEYS.filter(topOn).flatMap((cat) => PLACE_CATS[cat].filter((sub) => !subOn(cat, sub) && !notSub(cat, sub)).map((sub) => [cat, sub] as const)));
  const tops = $derived(PLACE_CAT_KEYS.filter((c) => !topOn(c) && !chips.some((x) => x.k === 'not' && x.cat === c && !x.sub) && (result?.perCat.get(c) ?? 0) > 0));
  const quick = $derived.by(() => {
    const q = result?.quick;
    if (!q) return [];
    const out: { key: string; chip: QChip; n: number }[] = [];
    if (!chips.some((c) => c.k === 'open' || c.k === 'at')) out.push({ key: 'open', chip: { k: 'open' }, n: q.open });
    if (!chips.some((c) => c.k === 'rate')) out.push({ key: 'rate', chip: { k: 'rate', min: QUICK_RATE }, n: q.rate });
    // (営業中 at 0 stays, so none open now reads as such, not as a missing chip)
    return out.filter((x) => x.n > 0 || (x.key === 'open' && !!result?.list.length));
  });

  // ---- location (map/locate.svelte.ts: paused while the tab is hidden; refused: the maps' note, and how to pick a spot)
  /** Asked to show me (the disc, a fresh phone's first view): the map flies there once both it and the fix are in. */
  let flyToMe = $state(false);
  const loc = useLocate();
  const me = $derived<LL | null>(loc.fix ? [loc.fix.lon, loc.fix.lat] : null);
  $effect(() => {
    if (flyToMe && me && map) untrack(() => ((flyToMe = false), map!.fly(me!, 14)));
  });
  const say = $derived(loc.note === 'denied' ? `${MS.refused[L]}\n${pick(S.pickHint, L)}` : null);
  function locate() {
    flyToMe = true;
    if (me) return ((flyToMe = false), map?.fly(me, 14));
    loc.start();
  }
  // 現在地周辺, or a radius with no point or area, asks for the location (the prompt once)
  $effect(() => {
    if (all?.needMe && !me) untrack(() => loc.start());
  });

  // ---- the camera: the last view on this phone, else (a fresh phone) about all the places, once they're in (the map is
  // made only then; its middle the 近い順's centre)
  const saved = readJson<Cam>(localKV(), DEVICE.placesCam);
  const kept = saved && Array.isArray(saved.center) ? saved : null;
  function middle(): Cam {
    const r = places.rows;
    if (!r?.length) return { center: [139.767, 35.681], zoom: 10 };
    const lats = r.map((p) => p.lat).sort((a, b) => a - b), lngs = r.map((p) => p.lng).sort((a, b) => a - b);
    return { center: [lngs[lngs.length >> 1], lats[lats.length >> 1]], zoom: 11 };
  }
  /** (the camera computed again only as the rows first come, not on each sync) */
  const rowsIn = $derived(!!places.rows);
  const cam0 = $derived.by(() => (void rowsIn, kept ?? untrack(middle)));
  /** A fresh phone with the location already allowed: its first view is about me (the map waits for the answer; the
   *  fix flies there), not every place fitted (the list would open on the far ones). null: not known yet. */
  let mine = $state<boolean | null>(kept ? false : null);
  if (!kept)
    void (navigator.permissions?.query({ name: 'geolocation' }).then((p) => p.state === 'granted', () => false) ?? Promise.resolve(false)).then((g) => {
      mine = g;
      if (g) ((flyToMe = true), loc.start());
    });
  /** A fresh phone's first view: every place, or a list spread round the world its home's (geo.ts homeOf; PlacesMap
   *  fits them once), unless it's about me. */
  const fitFirst = $derived.by(() => (void rowsIn, kept || mine ? null : untrack(() => (places.rows ? homeOf(places.rows.map((p) => [p.lng, p.lat] as LL)) : null))));
  /** 近い順's last resort: the map's centre as it opened (a pan doesn't reorder the list: このあたりで探す does). */
  const viewAt = $derived<LL>(cam0.center);
  let camTimer: ReturnType<typeof setTimeout> | undefined, camNext: Cam | null = null;
  const writeCam = () => (clearTimeout(camTimer), camNext && writeJson(localKV(), DEVICE.placesCam, camNext), (camNext = null));
  const keepCam = (c: Cam) => (clearTimeout(camTimer), (camNext = c), (camTimer = setTimeout(writeCam, 400)));

  // ---- the search (the specs' hook: each search's time, the perf check's; the warm-up's state)
  const hooks = testHooks() ? ((window as unknown as { __places?: { searchMs: number; warm: string } }).__places = { searchMs: 0, warm: 'off' }) : null;
  // the card's vendored details warmed (lib/places/vendored.ts): the index once the list shows and the places' fetch is
  // done, a moment after (the tiles first), online only (offline it could only miss); a row's shard on its press
  // and a marker's on its tap
  let warmed = false;
  const WARM_MS = 1200;
  $effect(() => {
    if (warmed || !places.rows || places.busy || !online.current) return;
    if (hooks) hooks.warm = 'soon';
    const t = setTimeout(() => ((warmed = true), hooks && (hooks.warm = 'asked'), void loadVendoredIndex()), WARM_MS);
    return () => (clearTimeout(t), hooks && !warmed && (hooks.warm = 'off'));
  });
  const warm = (id: string) => void (online.current && loadPlaceDetail(id));
  const all = $derived.by(() => {
    if (!ix) return null;
    const t0 = performance.now();
    const r = search(ix, chips, text, { now, me, view: viewAt, sort });
    if (hooks) hooks.searchMs = performance.now() - t0;
    return r;
  });
  // browse mode's box: the map's, from each moveend (equal ones dropped); held while the full list is scrolled
  const browse = $derived(text.trim() === '' && !chips.some((c) => c.k === 'area' || c.k === 'near' || c.k === 'point' || c.k === 'centre' || typed.has(chipKey(c))));
  let box = $state.raw<Box | null>(null);
  let held: Box | null = null;
  const same = (a: Box | null, b: Box) => !!a && a.every((x, k) => Math.abs(x - b[k]) < 1e-6);
  function onview(b: Box) {
    if (same(held ?? box, b)) return;
    if (sheet.state === 'full' && listEl && listEl.scrollTop > 0) held = b;
    else ((held = null), (box = b));
  }
  const unhold = () => held && ((box = held), (held = null));
  const inView = $derived(browse && box && ix ? search(ix, chips, '', { now, me, view: viewAt, sort, box }) : null);
  /** The list's: the view's in browse mode, else the whole search's. */
  const result = $derived(inView ?? all);
  const pts = $derived(all && ix ? all.list.map((i) => { const e = ix.entries[i]; return { id: e.p.id, lng: e.p.lng, lat: e.p.lat, cat: e.cat }; }) : []);
  const filtered = $derived(chips.length > 0 || text.trim() !== '');
  /** 全体を見る: the map about every match (the view's list then has them all). */
  /** 全体を見る: the map about every match, or (spread round the world) the home's: geo.ts homeOf, as a fresh phone's first view. */
  const fitAll = () => map?.fit(homeOf(pts.map((p) => [p.lng, p.lat] as LL)));

  // ---- the chosen place
  let selId = $state<string | null>(null);
  const selIdx = $derived(selId && ix ? ix.entries.findIndex((e) => e.p.id === selId) : -1);
  const selEntry = $derived(selIdx >= 0 ? ix!.entries[selIdx] : null);
  const sel = $derived(selEntry ? { id: selEntry.p.id, lng: selEntry.p.lng, lat: selEntry.p.lat, cat: selEntry.cat, name: selEntry.p.name } : null);
  let map: { fly(at: LL, z?: number): void; zoom(by: 1 | -1): void; view(): { center: LL; r: number }; fit(lls: readonly LL[]): void } | undefined = $state();
  function open(id: string, fly: boolean) {
    selId = id;
    const e = ix?.entries.find((x) => x.p.id === id);
    // (the flight once the sheet is the card's height, measured a frame on: flown with the full list's padding, the
    // place came to rest under the bar's buttons as the sheet came down)
    void tick().then(() => {
      sheet.set('card');
      if (e && fly) requestAnimationFrame(() => void tick().then(() => selId === id && map?.fly([e.p.lng, e.p.lat], 15)));
    });
  }
  function back() {
    selId = null;
    sheet.set('peek');
  }

  // ---- the map's chips
  const pin = $derived.by((): LL | null => {
    const p = chips.find((c) => c.k === 'point');
    return p?.k === 'point' ? p.at : null;
  });
  let moved = $state(false);
  function point(at: LL) {
    chips = withChips(chips, [{ k: 'point', at }]);
    moved = false;
    if (sheet.state === 'full') sheet.set('peek');
  }
  function here() {
    const v = map?.view();
    if (!v) return;
    chips = withChips(chips, [{ k: 'centre', at: v.center, r: Math.round(v.r) }]);
    moved = false;
  }

  // ---- the sheet (map/sheet.svelte.ts): peek, full, or the card's height (a level), or a drag's; the grip, the head and
  // the peek's list (it doesn't scroll at the peek: a swipe on its rows raises the sheet, a tap on one still opens it)
  // drag it; the full list pulled down from its top folds it
  let headEl: HTMLElement | undefined = $state();
  let cardEl: HTMLElement | undefined = $state();
  let bar: HTMLElement | undefined = $state();
  let headH = $state(150), cardH = $state(280), barH = $state(56);
  const ROW = 56;
  const sheet: DragSheet<'peek' | 'card'> = new DragSheet({
    peek: () => peekH,
    bar: () => barH,
    low: () => (selId ? 'card' : 'peek'),
    height: (l) => (l === 'card' ? Math.min(sheet.full, Math.max(peekH, cardH + 20)) : peekH),
    onset: (s) => {
      if (s === 'peek' && listEl) listEl.scrollTop = 0;
      if (s !== 'full') (unhold(), (asked = false));
    }
  });
  const peekH: number = $derived(Math.round(Math.min(sheet.vh * 0.5, STRIP + 1 + headH + ROW * 2.5)));
  const settled = $derived(sheet.drag === null ? sheet.height : peekH);
  $effect(() => {
    if (!headEl) return;
    const ro = new ResizeObserver(() => ((headH = headEl!.offsetHeight), (barH = bar?.offsetHeight ?? 56)));
    ro.observe(headEl);
    return () => ro.disconnect();
  });
  $effect(() => {
    if (!cardEl) return;
    const ro = new ResizeObserver(() => (cardH = cardEl!.offsetHeight + 12));
    ro.observe(cardEl);
    return () => ro.disconnect();
  });
  /** Esc: the card goes back to the list, the full sheet folds; else the sheet's own Esc closes. */
  export function escape(): boolean {
    if (selId) return (back(), true);
    if (sheet.state === 'full') return (sheet.set('peek'), true);
    return false;
  }
  const full = $derived(sheet.raised);

  // ---- the virtualised list (56 px rows; what's on screen and a screen either side)
  let listEl: HTMLElement | undefined = $state();
  let scrollTop = $state(0), listH = $state(400);
  const total = $derived(result?.list.length ?? 0);
  const first = $derived(Math.max(0, Math.floor(scrollTop / ROW) - 10));
  const last = $derived(Math.min(total, Math.ceil((scrollTop + listH) / ROW) + 10));
  const visible = $derived(result && ix ? result.list.slice(first, last).map((i, k) => ({ e: ix.entries[i], i, y: (first + k) * ROW })) : []);
  // a new search starts at the top
  $effect(() => {
    void chips;
    void text;
    void sort;
    void (browse && box);
    if (listEl) untrack(() => ((listEl!.scrollTop = 0), (scrollTop = 0)));
  });
  const SHORT = { open: '営業中', soon: 'まもなく閉店', closed: '営業時間外', unknown: '' } as const;
  const SHORT_EN = { open: 'Open', soon: 'Closing', closed: 'Closed', unknown: '' } as const;
  function rowHours(e: (typeof visible)[number]['e']): { t: string; tone: string } {
    const h = hoursNow(e.hours, e.p.tz, now);
    const tone = h.k === 'always' || (h.k === 'open' && !h.soon) ? 'open' : h.k === 'open' ? 'soon' : h.k === 'closed' ? 'closed' : 'unknown';
    return { t: (L === 'ja' ? SHORT : SHORT_EN)[tone], tone };
  }
  /** The sub line's head, Google's kind (else the sub, else the top), and its tail 「 · 渋谷 · 320 m」. */
  const kindOf = (e: (typeof visible)[number]['e']) => e.kind || e.sub || e.cat;
  const tailOf = (e: (typeof visible)[number]['e'], i: number) =>
    [e.area.label, result?.shown && Number.isFinite(result.dist[i]) ? fmtDist(result.dist[i]) : ''].filter(Boolean).map((x) => ` · ${x}`).join('');

  /** A match by its note or description, in the kind's place: 「メモ：…」 from a little before the hit (the longest run
   *  of a typed word the text has), the hit underlined. */
  function whyOf(e: (typeof visible)[number]['e'], i: number): { lead: string; pre: string; hit: string; post: string } | null {
    const w = result?.why.get(i);
    const src = (w === 'note' ? e.p.note : w === 'desc' ? places.descs?.get(e.p.id) : '')?.replace(/\s+/g, ' ');
    if (!src) return null;
    const low = src.toLowerCase();
    let at = -1, n = 0;
    for (const word of text.trim().toLowerCase().split(/[\s　]+/).filter(Boolean))
      for (let len = word.length; len > Math.max(n, word.length > 1 ? 1 : 0); len--)
        for (let k = 0; k + len <= word.length; k++) {
          const j = low.indexOf(word.slice(k, k + len));
          if (j >= 0) ((at = j), (n = len), (k = word.length));
        }
    const lead = pick(w === 'note' ? SF.note : SF.desc, L);
    if (at < 0) return { lead, pre: src, hit: '', post: '' };
    const from = at > 6 ? at - 4 : 0;
    return { lead, pre: (from ? '…' : '') + src.slice(from, at), hit: src.slice(at, at + n), post: src.slice(at + n) };
  }

  // ---- an empty search: what each chip let go would bring (relax: the best 2), the words alone with chips set
  const relaxed = $derived.by(() => {
    if (!ix || !all || all.list.length) return [];
    const rel = relax(ix, chips, text, { now, me, view: viewAt, sort });
    const out = rel.map((r) => ({
      key: chipKey(r.drop) + (r.also ? `+${chipKey(r.also)}` : ''),
      label: pick(SF.drop, L).replace('{c}', r.also ? pick(SF.and, L).replace('{a}', label(r.drop)).replace('{b}', label(r.also)) : label(r.drop)),
      n: r.n,
      go: () => ((chips = chips.filter((x) => chipKey(x) !== chipKey(r.drop) && (!r.also || chipKey(x) !== chipKey(r.also)))), (tail = ''))
    }));
    // (the words alone: not when a suggestion already lets every chip go)
    if (text.trim() && chips.length && !rel.some((r) => (r.also ? 2 : 1) === chips.length)) {
      const n = search(ix, [], text, { now, me, view: viewAt, sort }).list.length;
      if (n) out.push({ key: 'text', label: pick(SF.textOnly, L), n, go: () => ((chips = []), (tail = '')) });
    }
    return out;
  });

  // ---- 入力の例: the focused empty field (a tap types one and reads it)
  const EXAMPLES = [{ q: '渋谷のラーメン' }, { q: '営業中 ★4.5以上 カフェ' }, { q: '土曜 19時 居酒屋' }, { q: 'ramen shibuya open now', en: true }];
  const examples = $derived(asked && sheet.state === 'full' && !text && !chips.length);
  function example(q: string) {
    text = q;
    read(true);
    field?.focus();
  }

  // ---- the meta line
  const stale = $derived(places.syncedAt !== null && now - places.syncedAt > 86_400_000);
  // 「3,412件 · 同期 2時間前」, 「12 / 3,412件」 a search's; browse mode with fewer in view than match 「この範囲 214 / 3,412件」,
  // a tap on it shows them all (offline: 「オフライン」 first)
  const sync = $derived(places.syncedAt ? `同期 ${ago(places.syncedAt, now, L)}` : '');
  // (none in view, some elsewhere: 「この範囲 0 · 全体 142件」, a tap fits them)
  const partial = $derived(inView && all && total < all.list.length ? (total ? `${pick(S.inView, L)} ${formatNum(total)} / ${formatNum(all.list.length)}件` : `${pick(S.inView, L)} 0 · ${pick(S.whole, L)} ${formatNum(all.list.length)}件`) : null);
  const lead = $derived.by(() => {
    const rows = places.rows, g = all?.list.length ?? 0;
    if (!rows) return '';
    return places.net === 'offline' ? pick(S.offline, L) : partial ? '' : filtered ? `${formatNum(g)} / ${formatNum(rows.length)}件` : `${formatNum(rows.length)}件`;
  });
  /** A word that matched nothing is left out of the search, and said so (in the sync's place). */
  const ignored = $derived(all?.ignored.length ? pick(SF.ignored, L).replace('{w}', all.ignored.join(' ')) : '');
  /** An area's mountains none in it: the day trip about it, said. */
  const wide = $derived(all?.wide ? pick(SF.wide, L).replace('{km}', String(all.wide / 1000)) : '');
  const parts = $derived(places.rows ? [lead, partial, wide, ignored || sync].filter((x): x is string => !!x) : []);

  // (a view kept within 400 ms of the close: written now, not dropped)
  onMount(() => writeCam);
  // the map's engine (MapLibre's chunk) asked for as the view opens, not once the list is in (PlacesMap is made only
  // then: a first run's GET /places then the chunk, a waterfall; track C: ~2.5 s at 400 kbit/s). Online only: a failed
  // import Safari keeps for the page's life; PlacesMap's own import is the same module.
  onMount(() => void (!mapStub() && navigator.onLine && import('./map/engine.ts').catch(() => {})));
</script>

<section class="pv" data-places data-sheet={sheet.state} data-level={selId ? 'card' : 'list'}>
  {#if places.rows && mine !== null}
    <PlacesMap bind:this={map} {pts} {sel} {pin} fix={loc.fix} stale={loc.stale} cam={cam0} {fitFirst} bottom={settled} top={barH + 96} covered={settled >= sheet.full} {say} boxPad={{ bottom: peekH, top: barH }} {onview}
      onselect={(id) => (warm(id), open(id, false))} onpoint={point} onmoved={() => (moved = true)} oncam={keepCam} />
  {:else}
    <div class="map-wait" aria-hidden="true"></div>
  {/if}

  <div class="top" class:hid={filtering} bind:this={bar}><NavBar pad over title={pick(S.title, L)} {onclose} /></div>
  {#if !filtering}<ZoomDiscs onzoom={(by) => map?.zoom(by)} inert={full} />{/if}
  {#if moved && !browse && places.rows && !full && !filtering}
    <button type="button" class="here obj-cream" data-search-here data-sfx="tick" onclick={here}><Icon name="search" size={16} />{pick(S.searchHere, L)}</button>
  {/if}
  {#if places.rows && settled < sheet.vh * 0.6 && !filtering}
    <div class="loc" style:bottom="{settled + 6}px" inert={full}><LocateDisc loc={loc.state} label={pick(S.locate, L)} onclick={locate} /></div>
  {/if}

  <MapSheet {sheet} label={pick(S.sheetToggle, L)}>
    {#if selEntry}
      {#key selEntry.p.id}<div class="card-wrap sheet-scroll" {@attach sheet.pull}><div bind:this={cardEl}>
        <PlaceCard e={selEntry} dist={result?.shown ? result.dist[selIdx] : NaN} {now} onback={back}
          onnear={(at) => (back(), point(at))} />
      </div></div>{/key}
    {:else}
      <div class="head" bind:this={headEl} role="presentation" {...sheet.handle}>
        <label class="search">
          <Icon name="search" size={18} />
          <input bind:this={field} bind:value={text} type="search" class="q" data-places-q data-sfx="none" enterkeyhint="search" autocomplete="off" spellcheck="false"
            placeholder={pick(member ? S.search : SF.searchGuest, L)} aria-label={pick(member ? S.search : SF.searchGuest, L)} oninput={() => read()} onkeydown={onkey}
            oncompositionstart={() => (composing = true)} oncompositionend={() => ((composing = false), read())}
            onfocus={() => ((asked = true), sheet.set('full'))} onblur={() => read(true)} />
          {#if text}<button type="button" class="clear hit44" data-sfx="tick" aria-label={pick(S.clearText, L)} onclick={() => ((text = ''), field?.focus())}><Icon name="close" size={14} stroke={2.6} /></button>{/if}
        </label>
        {#if places.rows?.length}<ChipRow label={pick(S.filters, L)}>
          <span class="pin">
            <button type="button" class="chip s" aria-haspopup="dialog" aria-label="{pick(SF.title, L)}: {pick(SORT_LABEL[sort], L)}" data-sort={sort} data-sfx="tick" onclick={() => (filtering = true)}>
              <Icon name="sort" size={16} /><span>{pick(SORT_LABEL[sort], L)}</span>
            </button>
            {#if chips.length >= 2}<button type="button" class="chip s clear-all" data-places-clear-all data-sfx="tick" onclick={clearAll}>{pick(S.clearAll, L)}</button>{/if}
          </span>
          {#each chips as c (chipKey(c))}
            <button type="button" class="chip s q-chip" data-qchip={chipKey(c)} data-sfx="tick" aria-label="{label(c)}{pick(S.removeChip, L)}" onclick={() => removeChip(c)}>
              <span>{label(c)}</span><Icon name="close" size={12} stroke={2.8} />
            </button>
          {/each}
          {#each quick as q (q.key)}<Chip label={label(q.chip)} count={formatNum(q.n)} data-quick={q.key} onclick={() => (chips = withChips(chips, [q.chip]))} />{/each}
          {#if subs.length || tops.length}<span class="div" aria-hidden="true"></span>{/if}
          {#each subs as [cat, sub] (`${cat}:${sub}`)}<Chip label={sub} data-sub={sub} onclick={() => toggleCat(cat, sub)} />{/each}
          {#each tops as cat (cat)}<Chip label={cat} count={formatNum(result?.perCat.get(cat) ?? 0)} data-cat={cat} onclick={() => toggleCat(cat)} />{/each}
        </ChipRow>{/if}
        {#if parts.length}<div class="meta" data-places-meta role="status">{#if stale}<span class="stale" aria-hidden="true"></span>{/if}<span class="mtt">{#each parts as part, k (k)}{k ? ' · ' : ''}{#if part === partial}<button
          type="button" class="in-view" data-places-inview data-sfx="tick" aria-label="{partial} · {pick(S.showAll, L)}" onclick={fitAll}>{part}</button>{:else}{part}{/if}{/each}</span></div>{/if}
      </div>
      <div class="list sheet-scroll" class:peek={sheet.state === 'peek'} bind:this={listEl} bind:clientHeight={listH} onscroll={() => ((scrollTop = listEl!.scrollTop), scrollTop <= 0 && unhold())}
        {...sheet.list} {@attach sheet.pull} data-places-list role="region" aria-label={pick(S.list, L)}>
        {#if !places.rows}
          {#if places.net === 'offline'}
            <LoadError text={pick(S.firstOffline, L)} onretry={() => places.load(true)} busy={places.busy} data-places-error="offline" />
          {:else if places.net === 'failed' || places.net === 'refused'}
            <LoadError text={pick(S.failed, L)} onretry={() => places.load(true)} busy={places.busy} data-places-error={places.net} />
          {:else}
            <p class="state" data-places-loading role="status"><Phrases text={pick(S.loading, L)} /></p>
            {#each [0, 1, 2, 3] as k (k)}<div class="row skel" aria-hidden="true"><span class="sk-i"></span><span class="sk-t"><span></span><span></span></span></div>{/each}
          {/if}
        {:else if !places.rows.length}
          <p class="state" data-places-empty><Phrases text={pick(S.empty, L)} /></p>
        {:else if !total && inView && all?.list.length}
          <div class="state none" data-places-none-here>
            <p><Phrases text={pick(S.noneInView, L)} /></p>
            <span class="acts">
              <button type="button" class="btn small paper" data-places-all data-sfx="tick" onclick={fitAll}>{pick(S.showAll, L)}</button>
              {#if chips.length}<button type="button" class="btn small paper" data-places-clear data-sfx="tick" onclick={clearAll}>{pick(S.clearAll, L)}</button>{/if}
            </span>
          </div>
        {:else if !total}
          <div class="state none" data-places-none>
            <p><Phrases text={pick(S.none, L)} /></p>
            <span class="acts">
              {#each relaxed as r (r.key)}
                <button type="button" class="btn small paper" data-places-relax={r.key} data-sfx="tick" onclick={r.go}>{r.label} · {formatNum(r.n)}件</button>
              {/each}
              <button type="button" class="btn small paper" data-places-clear data-sfx="tick" onclick={clearAll}>{pick(S.clearAll, L)}</button>
            </span>
          </div>
        {:else}
          {#if examples}
            <div class="examples" data-places-examples>
              <h3>{pick(SF.examples, L)}</h3>
              {#each EXAMPLES as x (x.q)}
                <button type="button" class="ex" lang={x.en ? 'en' : undefined} data-places-example data-sfx="tick" onclick={() => example(x.q)}>
                  <Icon name="search" size={14} /><span>{x.q}</span>
                </button>
              {/each}
            </div>
          {/if}
          <div class="rows" style:height="{total * ROW}px">
            {#each visible as v (v.e.p.id)}
              {@const h = rowHours(v.e)}
              {@const why = whyOf(v.e, v.i)}
              <button type="button" class="row" style:transform="translateY({v.y}px)" data-place-row={v.e.p.id} data-sfx="page" onpointerdown={() => warm(v.e.p.id)} onclick={() => open(v.e.p.id, true)}>
                <Badge cat={v.e.cat} />
                <span class="txt">
                  <span class="nm"><span class="nmt">{v.e.p.name}</span>{#if isNew(v.e.p, now)}<span class="tag new">{pick(S.isNew, L)}</span>{/if}{#if v.e.rn >= 5 && v.e.r}<span
                    class="rt" role="img" data-row-rating aria-label={pick(SF.rating, L).replace('{r}', v.e.r.toFixed(1)).replace('{n}', formatNum(v.e.rn))}>★{v.e.r.toFixed(1)}</span>{/if}</span>
                  <span class="sb"><span class="sbt">{#if why}<span class="sbk why" data-place-why>{why.lead}{why.pre}<u>{why.hit}</u>{why.post}</span>{:else}<span
                    class="sbk">{kindOf(v.e)}</span>{/if}<span class="sbr">{tailOf(v.e, v.i)}</span></span>{#if h.t}<span class="hr {h.tone}">{h.t}</span>{/if}</span>
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </MapSheet>
</section>

<PlacesFilter bind:open={filtering} {chips} {sort} total={all?.list.length ?? 0} perCat={all?.perCat ?? new Map()} {people} {member}
  onchips={(c) => ((chips = c), (tail = ''))} onsort={(k) => (sort = k)} oncat={toggleCat} />

<style>
  .pv { position: absolute; inset: 0; overflow: hidden; background: var(--surface); }
  .map-wait { position: absolute; inset: 0; background: #DCEFB4; }
  .top { position: absolute; z-index: 1000; top: 0; left: 0; right: 0; pointer-events: none; }
  .top :global(.nav) { pointer-events: auto; }
  /* 絞り込み up: the map's ✕ would show over its sheet's top, ~34 px above that sheet's own ✕ */
  .top.hid { visibility: hidden; }
  /* このあたりで探す: a cream pill centred over the map, under the bar */
  .here {
    position: absolute; z-index: 510; top: calc(var(--ui-top) + 8px); left: 50%; translate: -50% 0; min-height: 36px; padding: 0 14px; border: 0; border-radius: var(--r-pill);
    display: inline-flex; align-items: center; gap: 6px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink); background: var(--c-cream); cursor: pointer;
    box-shadow: inset 0 0 0 2px var(--c-edge), 0 3px 0 var(--c-edge), var(--sh-float);
  }
  .here::after { content: ''; position: absolute; inset: -4px 0; }
  .here:active { translate: -50% 2px; box-shadow: inset 0 0 0 2px var(--c-edge), 0 1px 0 var(--c-edge); }
  /* the location disc (map/LocateDisc big), bottom-right over the sheet */
  .loc { position: absolute; z-index: 520; right: calc(4px + var(--safe-right)); transition: bottom .32s var(--ease-soft); }

  /* (the sheet, its grip: map/MapSheet.svelte) */
  .head { flex: none; touch-action: none; }
  .search {
    display: flex; align-items: center; gap: 8px; margin: 0 calc(12px + var(--safe-right)) 0 calc(12px + var(--safe-left)); min-height: 44px; padding: 0 6px 0 12px;
    border-radius: var(--r-pill); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge); color: var(--text-soft);
  }
  .search:focus-within { box-shadow: inset 0 0 0 3px var(--leaf-text); }
  .q { flex: 1; min-width: 0; border: 0; margin: 0; padding: 0; background: none; outline: none; -webkit-appearance: none; appearance: none; font: 400 var(--fs-input)/1.3 var(--font-body); color: var(--text); }
  .q::placeholder { color: color-mix(in srgb, var(--text-soft) 70%, transparent); }
  .q::-webkit-search-cancel-button { display: none; }
  .clear { flex: none; width: 32px; height: 32px; display: grid; place-items: center; border: 0; border-radius: 50%; background: var(--ctl-off); color: var(--text-soft); padding: 0; }
  .head :global(.chip-row) { padding-top: 4px; padding-bottom: 4px; }
  .q-chip { gap: 4px; padding-right: 9px; }
  /* the sort chip (and 条件を全部外す) stay at the row's left as it scrolls; the chips pass under the paper behind them */
  .pin { position: sticky; left: -12px; z-index: 1; flex: none; display: flex; align-items: center; gap: 6px; margin: -6px 0 -6px -12px; padding: 6px 4px 6px 12px;
    background: linear-gradient(to right, var(--surface) calc(100% - 4px), transparent); }
  .div { flex: none; align-self: stretch; width: 1.5px; margin: 8px 2px; background: linear-gradient(var(--stitch) 60%, transparent 0) 0 0 / 1.5px 6px repeat-y; }
  .meta { margin: 0 calc(16px + var(--safe-right)) 4px calc(16px + var(--safe-left)); display: flex; align-items: center; gap: 6px; font: 600 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .mtt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .clear-all { color: var(--leaf-text); background: none; box-shadow: none; text-decoration: underline 1.5px; text-underline-offset: 3px; }
  .in-view { appearance: none; border: 0; margin: 0 0 -10px; padding: 0 0 10px; background: none; font: inherit; color: var(--text); text-decoration: underline dotted 1.5px; text-underline-offset: 3px; cursor: pointer; }
  .in-view:focus-visible { outline: 3px solid var(--focus); outline-offset: -6px; border-radius: 6px; }
  .state .acts { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
  .state .acts .btn { white-space: nowrap; }
  .stale { width: 7px; height: 7px; border-radius: 50%; background: var(--c-coral); }

  .list { flex: 1; min-height: 0; overflow: auto; scrollbar-width: none; padding: 0 calc(8px + var(--safe-right)) calc(var(--safe-bottom) + 12px + var(--kb, 0px)) calc(8px + var(--safe-left)); overscroll-behavior: contain; }
  .list::-webkit-scrollbar { display: none; }
  .list.peek { overflow: hidden; touch-action: none; }
  .rows { position: relative; }
  .row {
    position: absolute; left: 0; right: 0; top: 0; height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 8px 0 10px; border: 0; margin: 0;
    background: none; text-align: start; color: var(--text); border-radius: 12px; cursor: pointer; -webkit-tap-highlight-color: transparent; font: inherit;
  }
  .row:active { background: var(--hl); }
  .row:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }
  .row + .row::before { content: ''; position: absolute; top: 0; left: 44px; right: 8px; border-top: 1.5px dashed var(--stitch); }
  .txt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .nm { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .nmt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 700 var(--fs-body)/1.25 var(--font-ui); }
  .nm .tag { flex: none; }
  .rt { flex: none; margin-left: auto; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .sb { display: flex; align-items: baseline; gap: 8px; min-width: 0; font: 600 var(--fs-s)/1.25 var(--font-ui); color: var(--text-soft); }
  .sbt { min-width: 0; flex: 1; display: flex; white-space: nowrap; font-variant-numeric: tabular-nums; }
  /* a long kind (or a why line) gives way first, then the area and distance */
  .sbk { flex: 0 1000 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .sbr { flex: none; max-width: 65%; overflow: hidden; text-overflow: ellipsis; white-space: pre; }
  .why u { text-decoration: underline 1.5px; text-underline-offset: 2px; color: var(--text); }
  .hr { flex: none; }
  .why { font-family: var(--font-body); font-weight: 400; }
  .examples { display: grid; justify-items: start; margin: 4px 8px 12px; }
  .examples h3 { margin: 0 0 2px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .ex {
    appearance: none; border: 0; margin: 0; padding: 0 4px; min-height: 44px; display: inline-flex; align-items: center; gap: 8px; background: none;
    font: 400 var(--fs-body)/1.3 var(--font-body); color: var(--text); cursor: pointer;
  }
  .ex :global(svg) { color: var(--text-soft); }
  .hr.open { color: var(--leaf-text); }
  .hr.soon { color: var(--coral-text); }
  .state { margin: 24px 16px; text-align: center; color: var(--text-soft); font: 600 var(--fs-s)/1.5 var(--font-ui); }
  .state.none { display: grid; justify-items: center; gap: 10px; }
  .state.none p { margin: 0; }
  .list :global(.load-error) { margin: 8px 4px; }
  .skel { position: relative; }
  .sk-i { width: 22px; height: 22px; border-radius: 50%; background: var(--ctl-off); }
  .sk-t { flex: 1; display: grid; gap: 6px; }
  .sk-t span { height: 10px; border-radius: 5px; background: var(--ctl-off); }
  .sk-t span:first-child { width: 60%; height: 12px; }
  .sk-t span:last-child { width: 40%; }
  .card-wrap { flex: 1; min-height: 0; overflow: auto; padding: 0 calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 12px) calc(12px + var(--safe-left)); }
</style>
