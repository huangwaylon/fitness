<script lang="ts">
  // A trail: the map full screen (TrailMap) under the game's buttons: NavBar's ‹ (to the list) and ✕ (the sheet), the
  // cream discs with the brown lip (the HUD's and the island's), and the map's own in the same disc, 44px each
  // (no ＋ −: pinch and double-tap zoom), オフライン用に保存 on ‹'s row; and the drag-up sheet over it, on the app's paper: the grip
  // and the peek (the name, 距離 · 標高差 · 時間 · 難易度) at a height that shows the whole elevation chart (so it
  // scrubs without opening the sheet), dragged or tapped up to just under ‹ ✕ (their row and the safe area stay the map's:
  // the buttons never move or cover the sheet, a strip of the map above it as an iOS sheet's large detent); its body the chart, the plan card, 概要, コース紹介,
  // the tips, the facts and the credits, each a dense card. The map's layers (保存した場所, 参考ルート) in the maps' one
  // MapLayers disc under ✕; a saved place's square tapped, its floating card (places/PlaceFloat) over the discs. The in-hike map (docs/hiking.md "In-hike map", map/live.svelte.ts):
  // the location disc's loop (off → 追従 → off; the compass only draws the dot's cone, never turns the map; into 追従 the
  // map turns back to north) and the N disc (after a two-finger turn) bottom-right over the sheet (MapDiscs), 56px in a
  // 64px hit; 歩きはじめる, a quiet row under the chart
  // (below the peek's fold: tracking is occasional; in the peek on the hike's own day, lib/hiking/list.ts hikeToday, so
  // nobody drags at the trailhead), turns hike mode on and folds the sheet: the peek becomes the strip (HikeStrip: 歩いた · のこり · のぼり · 到着 ごろ,
  // the chart behind a tap), the off-route banner or the junction card in one top slot (TopSlot), the discs (MapDiscs),
  // OSM's other trails with their line key bottom-left; a hike the app was killed in resumes (resume.ts). The position never leaves the phone; nothing is recorded. A registered hike (trail.user): its track from
  // the record (never fetched), its card (状況, 日付, メモ; 編集 reopens the form, 削除 asks, then 取り消す on the banner)
  // in the guide's write-ups' place; with no track, no map or chart: a plain page with its figures and the card.
  import { onMount, untrack } from 'svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Icon from '../ui/Icon.svelte';
  import StatStrip from '../ui/StatStrip.svelte';
  import TopSlot from './TopSlot.svelte';
  import MapDiscs from './MapDiscs.svelte';
  import MapLayers, { type LayerRow } from '../map/MapLayers.svelte';
  import { MS } from '../map/strings.ts';
  import { PlacesLayer } from '../map/places/layer.svelte.ts';
  import { C } from './map/style.ts';
  import HikeStrip from './HikeStrip.svelte';
  import LoadError from '../ui/LoadError.svelte';
  import ElevCard from './ElevCard.svelte';
  import PlanCard from './PlanCard.svelte';
  import StartChip from './StartChip.svelte';
  import { scheduleOf, userEnd } from '#lib/hiking/start.ts';
  import { hikeToday } from '#lib/hiking/list.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { todayIn } from '#lib/time/zone.ts';
  import TrailMap from './TrailMap.svelte';
  import SaveButton from '../offline/SaveButton.svelte';
  import { areas } from '#lib/offline/areas.svelte.ts';
  import { planTrail, type Plan } from '#lib/offline/plan.ts';
  import { Live } from './map/live.svelte.ts';
  import { standardMin } from './map/hike.ts';
  import { packing } from '../travel/packing.svelte.ts';
  import { fmtM, pick } from '../travel/text.ts';
  import { trailStats } from './stats.ts';
  import { loadNet, loadTrack } from '#lib/hiking/load.ts';
  import { pointAt, prepare, type Prepared } from '#lib/hiking/track.ts';
  import { DOGS, ROUTE, S, fmtDur, fmtSeason, span } from '#lib/hiking/strings.ts';
  import type { Trail } from '#lib/hiking/types.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import Sheet from '../ui/Sheet.svelte';
  import MapSheet from '../map/MapSheet.svelte';
  import { DragSheet, REACH } from '../map/sheet.svelte.ts';
  import Phrases from '../ui/Phrases.svelte';
  import { hikes } from './hikes.svelte.ts';
  import { undoBanner, UNDO_MS } from '#lib/store/actions.ts';
  import PlaceFloat from '../places/PlaceFloat.svelte';
  import { S as PS } from '#lib/places/strings.ts';
  import type { Place } from '#lib/contract/places.ts';

  interface Props {
    trail: Trail;
    onback: () => void;
    onclose: () => void;
    /** A registered hike's 編集 (its id). */
    onedit?: (id: string) => void;
    /** A registered hike deleted. */
    onremoved?: () => void;
  }
  let { trail, onback, onclose, onedit, onremoved }: Props = $props();
  const L = $derived(i18n.locale);

  // the track
  let prep = $state.raw<Prepared | null>(null);
  let track = $state<'loading' | 'ok' | 'failed' | 'none'>('loading');
  /** The trail's area to save ahead (lib/offline/plan.ts: from the track's own points). */
  let plan = $state.raw<Plan | null>(null);
  /** The plan computed a frame after the track is drawn (track C: 136 ms of near() at 4×, in the open's long task). */
  let planTm = 0;
  const planLater = (pts: readonly (readonly number[])[]) => {
    clearTimeout(planTm);
    requestAnimationFrame(() => (planTm = window.setTimeout(() => (plan = planTrail(trail.slug, trail.tiles, pts)))));
  };
  $effect(() => () => clearTimeout(planTm));
  /** A registered hike's track, from the record's rows: read again as they change (its `hike_trk` row can come after
   *  the hike's, from another phone or the queue: the map and chart then draw). */
  const ownTrack = $derived(trail.user ? hikes.track(trail.user.id) : null);
  $effect.pre(() => {
    if (!trail.user) return;
    const t = ownTrack;
    untrack(() => {
      if (t) ((prep = prepare(t)), planLater(t.pts), (track = 'ok'));
      else track = 'none';
    });
  });
  function load() {
    if (trail.user) return;
    track = 'loading';
    void loadTrack(trail.slug).then((r) => {
      if (r.k === 'ok') ((prep = prepare(r.track)), planLater(r.track.pts), (track = 'ok'));
      else track = 'failed';
    });
  }
  const saved = $derived(['saved', 'partial', 'saving'].includes(areas.state(`trail-${trail.slug}`).k));
  load();

  // the live map: location, compass, camera, hike mode (map/live.svelte.ts)
  // its day's start and finish, the start as moved (hike_start: lib/hiking/start.ts): the arrival counted from a start
  // still ahead, the plan's finish before the first fix
  const startHm = $derived(hikes.start(trail.slug));
  const sched = $derived(scheduleOf(trail, startHm));
  const live = new Live({ prep: () => prep, std: () => standardMin(trail), start: () => sched?.start ?? null, slug: () => trail.slug, name: () => pick(trail.name, L), locale: () => L });
  // OSM's other trails (a Japan guide trail's net file, lib/hiking/net.ts): drawn under the route, toggled by 参考ルート
  function loadRef() {
    if (trail.tiles === 'jp' && !trail.user) void loadNet(trail.slug).then((n) => live.setNet(n));
  }
  loadRef();
  // a hike under way when the app was killed: back in hike mode once the track is in
  $effect(() => {
    if (prep) untrack(() => live.resumeHike());
  });

  // the scrub: a distance held on the chart, its point on the map
  let held = $state<number | null>(null);
  const scrub = $derived(prep && held !== null ? pointAt(prep, held) : null);

  /** The hike's own day (the phone's date, the trailhead's): the peek reaches 歩きはじめる too. */
  const hikeDay = $derived(hikeToday(trail, todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone, minuteNow().getTime())));

  // the sheet (map/sheet.svelte.ts): peek (just under the chart; 歩きはじめる too on the hike's day) or full (under ‹ ✕), or a drag's height
  let body: HTMLElement | undefined = $state();
  let peekH = $state(0);
  /** The floating row's foot (the safe area, NavBar's 48px): the full sheet stops under it. */
  let barH = $state(0);
  let bar: HTMLElement | undefined = $state();
  const sheet: DragSheet = new DragSheet({ peek: () => peekH || Math.round(sheet.vh * 0.16), bar: () => barH || Math.round(sheet.vh * 0.1), onset: (s) => void (s === 'peek' && body && (body.scrollTop = 0)) });
  /** The top row's foot (‹, the save pill, ✕): the top slot and the map's notes go under it. */
  let rowH = $state(0);
  /** The controls' foot (that row, the layers disc under ✕): the route is fitted under it. */
  let topH = $state(0);
  let lyr: HTMLElement | undefined = $state();
  let peekEl: HTMLElement | undefined = $state();
  function measure() {
    barH = bar?.offsetHeight ?? 0;
    rowH = barH + 8;
    topH = Math.max(barH, lyr ? lyr.offsetTop + lyr.offsetHeight : 0) + 8;
    // hike mode: the strip is the peek (the chart behind a tap)
    if (live.hiking && peekEl) return void (peekH = Math.round(peekEl.offsetTop + peekEl.offsetHeight));
    const card = (hikeDay ? body?.querySelector<HTMLElement>('[data-hike-start]') : null) ?? body?.querySelector<HTMLElement>('[data-elev]') ?? body?.querySelector<HTMLElement>('.track-msg, [data-track-failed]');
    const fallback = Math.round(sheet.vh * 0.16);
    if (!card) return void (peekH = fallback);
    // layout offsets from the sheet (the card's offsetParent), not the screen's rects: the sheet's opening zoom scales those
    const h = card.offsetTop + card.offsetHeight + 8;
    peekH = Math.round(Math.min(Math.max(h, fallback), sheet.vh * 0.62));
  }
  $effect(() => {
    void track;
    void sheet.vh;
    void live.hiking;
    void hikeDay;
    void rows.length; // (the layers disc comes with the track's places or net)
    void Promise.resolve().then(measure);
  });

  /** Esc: a saved place's card closes, else the full sheet folds to its peek (true), else the sheet's own Esc closes. */
  export function escape(): boolean {
    if (layer.selected) return (layer.select(null), true);
    if (sheet.state !== 'full') return false;
    sheet.set('peek');
    return true;
  }

  let map: { flyToFix(): void; north(): void; reveal(p: Place, cover: number): void } | undefined = $state();
  /** The location disc: its loop (the compass asked first thing inside, synchronously: live.tap); into 追従, or again
   *  while following in a hike, the map back on the dot. */
  function locate() {
    live.tap();
    if (live.cam === 'follow') map?.flyToFix();
  }
  /** 歩きはじめる (the compass asked first thing inside, synchronously: live.startHike). */
  function startHike() {
    live.startHike();
    map?.flyToFix();
    sheet.set('peek');
  }
  onMount(() => {
    const shown = () => live.visible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', shown);
    return () => (document.removeEventListener('visibilitychange', shown), live.stop());
  });

  const netView = $derived({ net: live.net, forks: live.forksOk, shown: live.netShown });

  // the saved places near the track (docs/hiking.md "Saved places": the maps' shared layer, map/places/layer.svelte.ts;
  // the places' copy, read on view, offline too), the phone's one switch for every map; the one tapped: its card
  const layer = new PlacesLayer(() => prep?.pts ?? null);
  const placesView = $derived({ pts: layer.pts, shown: layer.on, small: live.hiking, sel: layer.selected });
  // the layers panel: 保存した場所 first (its square), then 参考ルート (OSM's other trails: the legend's slate key)
  const rows = $derived<LayerRow[]>([
    ...(layer.near.length ? [{ id: 'places', label: pick(PS.layer, L), on: layer.on, swatch: 'square', def: true }] : []),
    ...(live.net ? [{ id: 'ref', label: pick(S.refRoutes, L), on: live.netShown, swatch: C.net, line: 'solid' as const, def: true }] : [])
  ]);
  let layersOpen = $state(false);
  const toggleLayer = (id: string) => (id === 'places' ? layer.toggle() : live.toggleNet());
  /** The line key bottom-left: the route and OSM's other trails, while those draw. */
  const legend = $derived(!!live.net && live.netShown);

  const note = $derived(packing.note('hiking'));
  const full = $derived(sheet.raised);
  // the sheet raised: the card closed (the layers panel too)
  $effect(() => {
    if (sheet.state === 'full') untrack(() => (layer.select(null), (layersOpen = false)));
  });
  /** The discs' stack (MapDiscs) and the top slot's height; the card's own. */
  let discsH = $state(0), slotH = $state(0), floatH = $state(0);
  /** The card's foot: 8 px over what covers the map's bottom (the peek, the discs over it). */
  const floatBottom = $derived(peekH + 6 + discsH + 8);
  // a square tapped: the map eased only if it would sit under its card
  $effect(() => {
    const p = layer.selected, h = floatH;
    if (p && h) untrack(() => map?.reveal(p, floatBottom + h));
  });
  /** The map's notes: under the left column, and under the top slot while it shows. */
  const noteTop = $derived(rowH + (live.slot ? slotH + 8 : 0));

  // a registered hike's 削除: asked first, then held for the banner's 取り消す (a removal is final on the record)
  let asking = $state(false);
  function remove() {
    const u = trail.user;
    if (!u) return;
    const r = hikes.removeHeld(u.id, UNDO_MS);
    undoBanner(pick(S.removed, L), r);
    if (r.ok) onremoved?.();
  }
  const STATUS = { done: S.secWalked, planned: S.secPlanned, want: S.secWant } as const;
</script>

{#if track === 'none'}
<section class="detail plain" data-trail-view={trail.slug} data-sheet="none">
  <NavBar pad title={pick(trail.name, L)} {onback} {onclose} />
  <div class="body sheet-scroll">
    <StatStrip items={trailStats(trail, L, true)} />
    {@render cards()}
  </div>
</section>
{:else}
<section class="detail" data-trail-view={trail.slug} data-sheet={sheet.state} data-hike-day={hikeDay || undefined}>
  <TrailMap bind:this={map} region={trail.tiles} center={trail.center} {prep} {scrub} fix={live.fix} heading={live.heading} cam={live.cam}
    walked={live.hiking && live.at ? live.at.d : null} off={live.off?.line ?? null} net={netView} hl={live.hl} bottom={peekH} clear={legend ? 56 + REACH : 0} top={topH} {saved}
    places={placesView} onplace={(id) => layer.select(id)} onmiss={() => (layer.select(null), (layersOpen = false))} {noteTop} covered={full}
    onbearing={(b) => (live.bearing = b)} onpan={() => live.pan()} />

  <div class="top" bind:this={bar}><NavBar pad {onback} {onclose} />{#if !live.hiking}<SaveButton {plan} name={trail.name} />{/if}</div>
  {#if rows.length}<div class="layers" class:gone={full} inert={full} bind:this={lyr}><MapLayers {rows} label={MS.layers[L]} ontoggle={toggleLayer} bind:open={layersOpen} /></div>{/if}

  <TopSlot {live} {full} top={rowH} bind:h={slotH} />
  <MapDiscs {live} bottom={peekH} {full} onlocate={locate} onnorth={() => map?.north()} bind:h={discsH} />

  <!-- the line key (the route, OSM's other trails while they draw); MapLibre's attribution under it names OSM then -->
  {#if legend}
    <div class="legend" style:bottom="{peekH + REACH + 22}px" inert={full} data-legend>
      <span class="key"><span class="k route" aria-hidden="true"></span>{pick(S.thisRoute, L)}</span><span class="key"><span class="k ref" aria-hidden="true"></span>{pick(S.refRoutes, L)}</span>
    </div>
  {/if}
  {#if layer.selected && layer.on && !full}<PlaceFloat p={layer.selected} bottom={floatBottom} onclose={() => layer.select(null)} bind:h={floatH} />{/if}

  <MapSheet {sheet} label={pick(S.sheetToggle, L)}>
    <div class="peek" data-sheet-peek role="presentation" bind:this={peekEl} {...sheet.handle}>
      {#if live.hiking}
        <HikeStrip {live} {prep} {sched} />
      {:else}
        <h2 class="pk-title">{pick(trail.name, L)}</h2>
        <StatStrip items={trailStats(trail, L, true)} />
      {/if}
    </div>
    <div class="body sheet-scroll" bind:this={body} {@attach sheet.pull}>
      {#if track === 'ok' && prep}
        <ElevCard {prep} bind:held here={live.hiking && live.at ? live.at.d : null} />
        {#if !live.hiking}
          <button type="button" class="btn paper start" data-hike-start data-sfx="open" onclick={startHike}>
            <Icon name="mountain" size={22} />
            <span class="st-txt">{pick(S.hikeStart, L)}<small>{pick(S.hikeStartNote, L)}</small></span>
            <Icon name="chevron-right" size={20} />
          </button>
        {/if}
      {:else if track === 'failed'}
        <LoadError text={pick(S.trackFailed, L)} onretry={load} data-track-failed />
      {:else}
        <div class="card dense track-msg" aria-busy="true"></div>
      {/if}
      {@render cards()}
    </div>
  </MapSheet>
</section>
{/if}

{#snippet cards()}
      {#if trail.user}
        {@const u = trail.user}
        <h3 class="sec-label head">{pick(S.secRecord, L)}</h3>
        <div class="card dense mine" data-hike-card>
          <dl class="facts">
            <div class="row kv"><dt>{pick(S.fStatus, L)}</dt><dd data-hike-status={u.status}>{pick(STATUS[u.status], L)}</dd></div>
            {#if u.date}<div class="row kv"><dt>{pick(S.fDate, L)}</dt><dd>{formatDate(u.date, { year: true })}</dd></div>{/if}
          </dl>
          {#if u.status !== 'done'}<div class="row"><StartChip slug={trail.slug} from={null} end={startHm && trail.time ? userEnd(startHm, trail.time) : null} /></div>{/if}
          {#if u.notes}<div class="row notes" data-hike-notes>{u.notes}</div>{/if}
          <div class="row acts">
            <button type="button" class="btn small paper" data-hike-edit data-sfx="open" onclick={() => onedit?.(u.id)}><Icon name="edit" size={18} />{pick(S.editBtn, L)}</button>
            <button type="button" class="btn small paper del" data-hike-remove data-sfx="open" aria-haspopup="dialog" onclick={() => (asking = true)}><Icon name="trash" size={18} />{pick(S.remove, L)}</button>
          </div>
        </div>
      {/if}
      {#if trail.plan}<PlanCard plan={trail.plan} slug={trail.slug} {note} walked={!!trail.walked} />{/if}
      {#if !trail.user}
      <h3 class="sec-label head">{pick(S.secOverview, L)}</h3>
      <p class="card dense txt">{pick(trail.summary, L)}</p>
      <h3 class="sec-label head">{pick(S.secHike, L)}</h3>
      <p class="card dense txt">{pick(trail.description, L)}</p>
      <h3 class="sec-label head">{pick(S.secTips, L)}</h3>
      <ul class="card dense tips">
        {#each trail.tips as tip, i (i)}<li class="row"><Icon name="check" size={16} />{pick(tip, L)}</li>{/each}
      </ul>
      {/if}
      {#if trail.user}
        {@const u = trail.user}
        {#if trail.area.ja || u.track || u.downM !== undefined}
          <h3 class="sec-label head">{pick(S.secDetails, L)}</h3>
          <dl class="card dense facts">
            {#if trail.area.ja}<div class="row kv"><dt>{pick(S.factLocation, L)}</dt><dd>{trail.area.ja}</dd></div>{/if}
            {#if u.track}<div class="row kv"><dt>{pick(S.factRoute, L)}</dt><dd>{pick(ROUTE[trail.route], L)}</dd></div>{/if}
            {#if u.downM !== undefined}<div class="row kv"><dt>{pick(S.factUpDown, L)}</dt><dd>{fmtM(trail.gainM)} ／ {fmtM(u.downM)}</dd></div>{/if}
          </dl>
        {/if}
        {#if u.src === 'yamap' || u.track}
          <p class="attrib">{#if u.src === 'yamap'}{pick(S.attribYamap, L)}{/if}{#if u.src === 'yamap' && u.track} ／ {/if}{#if u.track}{pick(trail.tiles === 'us' ? S.attribUsgs : S.attribGsi, L)}{/if}</p>
        {/if}
      {:else}
      <h3 class="sec-label head">{pick(S.secDetails, L)}</h3>
      <dl class="card dense facts">
        <div class="row kv"><dt>{pick(S.factRoute, L)}</dt><dd>{pick(ROUTE[trail.route], L)}</dd></div>
        <div class="row kv"><dt>{pick(S.factSeason, L)}</dt><dd>{fmtSeason(trail.season, L)}</dd></div>
        <div class="row kv"><dt>{pick(S.factDogs, L)}</dt><dd>{pick(DOGS[trail.dogs], L)}</dd></div>
        <div class="row kv"><dt>{pick(S.factPermit, L)}</dt><dd>{pick(trail.permit, L)}</dd></div>
        <div class="row kv"><dt>{pick(S.factLocation, L)}</dt><dd>{pick(trail.area, L)}</dd></div>
        {#if trail.walked}
          {@const w = trail.walked}
          <div class="row kv" data-walked><dt>{pick(S.factWalked, L)}</dt><dd>{formatDate(w.dateISO, { year: true })}</dd></div>
          <div class="row kv"><dt>{pick(S.factUpDown, L)}</dt><dd>{fmtM(trail.gainM)} ／ {fmtM(w.downM)}</dd></div>
          <div class="row kv"><dt>{pick(S.factStandard, L)}</dt><dd>{fmtDur(span('0:00', w.standard), L)}</dd></div>
          <div class="row kv"><dt>{pick(S.planCourse, L)}</dt><dd>{w.constant}</dd></div>
        {/if}
      </dl>
      <p class="attrib">
        <!-- (a trail with its own photo and no record is a YAMAP plan's: AllTrails' trails come with theirs) -->
        {pick(trail.walked ? S.attribYamap : trail.photo ? S.attribPlan : S.attribTrail, L)} ／
        {#if trail.photo}
          {@const p = trail.photo}
          <span data-photo-credit>{pick(S.attribPhoto, L)}<a href={p.url} target="_blank" rel="noopener noreferrer" data-sfx="open">{p.title}</a> © {p.by}{pick(S.attribPhotoOpen, L)}<a href={p.licenceUrl} target="_blank" rel="noopener noreferrer" data-sfx="open">{p.licence}</a>{pick(S.attribPhotoVia, L)}</span> ／
        {/if}
        {pick(trail.tiles === 'us' ? S.attribUsgs : S.attribGsi, L)}{#if live.net} ／ <span data-osm-credit>{pick(S.attribOsm, L)}</span>{/if}
      </p>
      {/if}
{/snippet}

{#if trail.user}
  <Sheet name="hike.ask" bind:open={asking} title={pick(S.removeAsk, L)}
    confirm={{ verb: pick(S.remove, L), danger: true, focusNo: true, onyes: () => ((asking = false), remove()) }}>
    <p class="ask"><Phrases text={trail.name.ja ?? ""} /></p>
  </Sheet>
{/if}

<style>
  .detail { position: absolute; inset: 0; z-index: 10; background: var(--surface); overflow: hidden; }

  /* ‹ ✕ over the map: NavBar's buttons; the map's own (the layers, locate, the save pill) the same family: theme.css .disc */
  .top { position: absolute; z-index: 1000; top: 0; left: 0; right: 0; pointer-events: none; }
  .top :global(.nav) { pointer-events: auto; }
  /* the layers disc under ✕ (its disc 12 px under ✕'s), its panel over the top slot (TopSlot, 560) */
  .layers { position: absolute; z-index: 561; top: calc(var(--ui-top) + 52px); right: calc(6px + var(--safe-right)); pointer-events: none; }
  .layers > :global(*) { pointer-events: auto; }
  /* the sheet at full reaches up past it: hidden, not left half under the sheet's edge (保存した場所's discs go the same way) */
  .layers { transition: opacity .2s var(--ease-soft), visibility .2s; }
  .layers.gone { opacity: 0; visibility: hidden; }
  /* the line key, bottom-left over the attribution, clear of the discs (the map's controls' own colours, theme.css
     .disc: --ctl, --edge, --text) */
  .legend {
    position: absolute; z-index: 510; left: calc(6px + var(--safe-left)); max-width: calc(100% - 84px - var(--safe-left) - var(--safe-right)); min-height: 32px;
    display: inline-flex; align-items: center; gap: 12px; padding: 0 12px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--ctl) 94%, transparent);
    color: var(--text); box-shadow: inset 0 0 0 1.5px var(--edge), 0 2px 0 var(--edge); font: 700 var(--fs-s)/1 var(--font-ui); pointer-events: none;
    transition: bottom .32s var(--ease-soft);
  }
  .legend .key { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
  .legend .k { display: inline-block; width: 18px; height: 0; }
  .legend .k.route { border-top: 5px solid #AD3F2B; border-radius: 2px; }
  .legend .k.ref { border-top: 3px solid #3E5C9A; border-radius: 2px; }

  /* (the sheet, its grip: map/MapSheet.svelte; the peek drags and toggles as the grip does) */
  .peek { -webkit-user-select: none; user-select: none; }
  .peek { flex: none; padding: 0 calc(12px + var(--safe-right)) 0 calc(12px + var(--safe-left)); cursor: pointer; touch-action: none; }
  .pk-title { margin: 4px 4px 0; font: 700 var(--fs-talk)/1.25 var(--font-ui); color: var(--text); }
  .peek :global(.stats) { padding: 6px 0 8px; }
  /* 歩きはじめる: a quiet cream row under the chart (as 編集), its note what hike mode shows */
  .start { min-height: 56px; margin: 4px 0 0; padding: 8px 12px 8px 14px; gap: 10px; justify-content: flex-start; text-align: left; font-size: var(--fs-body); }
  .start .st-txt { flex: 1; min-width: 0; line-height: 1.3; }
  .start small { display: block; font-weight: 600; font-size: var(--fs-s); color: var(--c-ink-soft); }
  .start :global(svg:last-child) { color: var(--c-ink-soft); }
  .body {
    scrollbar-width: none;
    display: flex; flex-direction: column; gap: 8px; padding: 0 calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left));
  }
  .body::-webkit-scrollbar { display: none; }
  /* (the cards clip: never shrunk to the scroller) */
  .body > * { flex: none; }
  .body > .sec-label.head { margin: 8px 4px -2px; }
  .card.track-msg { min-height: 132px; }
  .card.txt { margin: 0; padding: 12px; line-height: 1.65; }
  .tips { list-style: none; margin: 0; }
  .tips .row { align-items: flex-start; font-size: var(--fs-s); line-height: 1.5; }
  .tips .row :global(svg) { flex: none; margin-top: 2px; color: var(--leaf-text); }
  .facts { margin: 0; }
  .facts dd { margin: 0; font-weight: 600; }
  .attrib { margin: 4px 4px 0; font-size: var(--fs-s); color: var(--text-soft); }
  .attrib a { color: var(--leaf-text); }
  /* no track: a plain page, the figures and the card under the bar */
  .plain { display: flex; flex-direction: column; }
  .plain .body { flex: 1; min-height: 0; padding-top: 4px; }
  .plain .body > :global(.stats) { padding: 0 4px 4px; }
  .mine .facts { margin: 0; }
  .mine .notes { margin: 0; display: block; padding-top: 4px; white-space: pre-line; overflow-wrap: anywhere; line-height: 1.6; font-size: var(--fs-body); }
  .mine .acts { gap: 8px; justify-content: flex-end; }
  .mine .acts .btn { width: auto; margin: 0; }
  .del { color: var(--c-coral-text); }
  .ask { margin: 0; color: var(--text-soft); text-align: center; }
</style>
