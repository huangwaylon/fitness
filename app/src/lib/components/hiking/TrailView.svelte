<script lang="ts">
  // A trail: the map full screen (TrailMap) under the game's buttons: NavBar's ‹ (to the list) and ✕ (the sheet), the
  // cream discs with the brown lip (the HUD's and the island's), and the map's own in the same disc (＋ − under ✕, locate
  // bottom-left over the sheet), 44px each; and the drag-up sheet over it, on the app's paper: the grip
  // and the peek (the name, 距離 · 標高差 · 時間 · 難易度) at a height that shows the whole elevation chart (so it
  // scrubs without opening the sheet), dragged or tapped up to just under ‹ ✕ (their row and the safe area stay the map's:
  // the buttons never move or cover the sheet, a strip of the map above it as an iOS sheet's large detent); its body the chart, the plan card, 概要, コース紹介,
  // the tips, the facts and the credits, each a dense card. The in-hike map (docs/hiking.md "In-hike map", map/live.svelte.ts):
  // the location disc's loop (off → 追従 → 進行方向) and the compass disc bottom-right over the sheet, 56px in a 64px hit;
  // 歩きはじめる on the peek turns hike mode on: the peek becomes the strip (歩いた · のこり · のぼり · 到着 ごろ, the chart
  // behind a tap), the off-route banner or the junction card in one top slot, OSM's other trails with their legend and
  // toggle bottom-left. The position never leaves the phone; nothing is recorded. A registered hike (trail.user): its track from
  // the record (never fetched), its card (状況, 日付, メモ; 編集 reopens the form, 削除 asks, then 取り消す on the banner)
  // in the guide's write-ups' place; with no track, no map or chart: a plain page with its figures and the card.
  import { onMount } from 'svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Icon from '../ui/Icon.svelte';
  import StatStrip from '../ui/StatStrip.svelte';
  import LoadError from '../ui/LoadError.svelte';
  import ElevCard from './ElevCard.svelte';
  import PlanCard from './PlanCard.svelte';
  import TrailMap from './TrailMap.svelte';
  import SaveButton from '../offline/SaveButton.svelte';
  import { areas } from '#lib/offline/areas.svelte.ts';
  import { planTrail, type Plan } from '#lib/offline/plan.ts';
  import { Live } from './map/live.svelte.ts';
  import { standardMin } from './map/hike.ts';
  import type { Dir } from './map/junction.ts';
  import { packing } from '../travel/packing.svelte.ts';
  import { fmtM, pick } from '../travel/text.ts';
  import { trailStats } from './stats.ts';
  import { loadNet, loadTrack } from '#lib/hiking/load.ts';
  import { units } from '../travel/units.ts';
  import { pointAt, prepare, type Prepared } from '#lib/hiking/track.ts';
  import { DOGS, ROUTE, S, fmtDur, fmtSeason, span } from '#lib/hiking/strings.ts';
  import type { Trail } from '#lib/hiking/types.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import Sheet from '../ui/Sheet.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { hikes } from './hikes.svelte.ts';
  import { undoBanner, UNDO_MS } from '#lib/store/actions.ts';

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
  /** A registered hike's track, from the record's rows. */
  function own(id: string) {
    const t = hikes.track(id);
    if (t) ((prep = prepare(t)), (plan = planTrail(trail.slug, trail.tiles, t.pts)), (track = 'ok'));
    else track = 'none';
  }
  function load() {
    if (trail.user) return own(trail.user.id);
    track = 'loading';
    void loadTrack(trail.slug).then((r) => {
      if (r.k === 'ok') ((prep = prepare(r.track)), (plan = planTrail(trail.slug, trail.tiles, r.track.pts)), (track = 'ok'));
      else track = 'failed';
    });
  }
  const saved = $derived(['saved', 'partial', 'saving'].includes(areas.state(`trail-${trail.slug}`).k));
  load();

  // the live map: location, compass, camera, hike mode (map/live.svelte.ts)
  const live = new Live({ prep: () => prep, std: () => standardMin(trail) });
  // OSM's other trails (a Japan guide trail's net file, lib/hiking/net.ts): drawn under the route, toggled by 参考ルート
  function loadRef() {
    if (trail.tiles === 'jp' && !trail.user) void loadNet(trail.slug).then((n) => (live.net = n));
  }
  loadRef();

  // the scrub: a distance held on the chart, its point on the map
  let held = $state<number | null>(null);
  const scrub = $derived(prep && held !== null ? pointAt(prep, held) : null);

  // the sheet: peek (just under the chart) or full (up to under ‹ ✕), or a drag's height
  let vh = $state(800);
  let sheetState = $state<'peek' | 'full'>('peek');
  let drag = $state<number | null>(null);
  let body: HTMLElement | undefined = $state();
  let peekH = $state(0);
  /** The floating row's foot (the safe area's top, NavBar's 48px): the full sheet stops 6px under it. */
  let barH = $state(0);
  let bar: HTMLElement | undefined = $state();
  /** The map's controls' foot (‹ ✕, the save pill, ＋ −): the route is fitted under it. */
  let topH = $state(0);
  let ctl: HTMLElement[] = $state([]);
  let peekEl: HTMLElement | undefined = $state();
  function measure() {
    barH = bar?.offsetHeight ?? 0;
    topH = Math.max(barH, ...ctl.filter(Boolean).map((c) => c.offsetTop + c.offsetHeight)) + 8;
    // hike mode: the strip is the peek (the chart behind a tap)
    if (live.hiking && peekEl) return void (peekH = Math.round(peekEl.offsetTop + peekEl.offsetHeight));
    const card = body?.querySelector<HTMLElement>('[data-elev]') ?? body?.querySelector<HTMLElement>('.track-msg, [data-track-failed]');
    const fallback = Math.round(vh * 0.16);
    if (!card) return void (peekH = fallback);
    // layout offsets from the sheet (the card's offsetParent), not the screen's rects: the sheet's opening zoom scales those
    const h = card.offsetTop + card.offsetHeight + 8;
    peekH = Math.round(Math.min(Math.max(h, fallback), vh * 0.62));
  }
  $effect(() => {
    void track;
    void vh;
    void live.hiking;
    void Promise.resolve().then(measure);
  });
  const fullH = $derived(vh - (barH || Math.round(vh * 0.1)) - 6);
  const height = $derived(drag ?? (sheetState === 'full' ? fullH : peekH || Math.round(vh * 0.16)));

  function setSheet(s: 'peek' | 'full') {
    sheetState = s;
    if (s === 'peek' && body) body.scrollTop = 0;
  }
  // the grip and the peek drag the sheet; a tap toggles it
  let startY = 0, startH = 0, moved = false, pid: number | null = null;
  function down(e: PointerEvent) {
    pid = e.pointerId;
    startY = e.clientY;
    startH = height;
    moved = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (pid !== e.pointerId) return;
    if (Math.abs(e.clientY - startY) > 6) moved = true;
    if (moved) drag = Math.min(fullH, Math.max(peekH, startH + (startY - e.clientY)));
  }
  function up(e: PointerEvent) {
    if (pid !== e.pointerId) return;
    pid = null;
    if (moved && drag !== null) setSheet(drag > vh * 0.45 ? 'full' : 'peek');
    else if (e.type !== 'pointercancel') setSheet(sheetState === 'peek' ? 'full' : 'peek');
    drag = null;
  }
  function key(e: KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    setSheet(sheetState === 'peek' ? 'full' : 'peek');
  }
  /** Esc: the full sheet folds to its peek (true), else the sheet's own Esc closes. */
  export function escape(): boolean {
    if (sheetState !== 'full') return false;
    setSheet('peek');
    return true;
  }

  let map: { flyToFix(): void; zoom(by: 1 | -1): void; north(): void } | undefined = $state();
  /** The location disc: its loop (the compass asked first thing inside, synchronously: live.tap). */
  function locate() {
    const was = live.cam.c;
    live.tap();
    if ((was === 'off' || was === 'free') && live.cam.c === 'follow') map?.flyToFix();
  }
  function north() {
    live.north();
    map?.north();
  }
  function startHike() {
    live.startHike();
    map?.flyToFix();
    setSheet('peek');
  }
  onMount(() => {
    const shown = () => live.visible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', shown);
    return () => (document.removeEventListener('visibilitychange', shown), live.stop());
  });

  const compassShown = $derived(Math.abs(live.bearing) > 0.5 || live.cam.c === 'heading');
  const junction = $derived(live.junction);
  const hl = $derived(live.highlight(junction));
  const netView = $derived({ net: live.net, forks: live.forksOk, shown: live.netShown });
  /** The one top slot: off the route wins, then the fork ahead, then the notes. */
  const slot = $derived(live.off ? 'off' : junction ? 'fork' : live.back ? 'back' : live.locDenied ? 'loc' : live.compassMsg ? 'compass' : live.calib && live.cam.c === 'heading' ? 'calib' : null);
  const DIR: Record<Dir, keyof typeof S> = { right: 'dirRight', left: 'dirLeft', straight: 'dirStraight' };
  const fill = (s: string, k: string, v: string | number) => s.replace(`{${k}}`, String(v));
  /** A distance on the strip: km (mi) to a tenth. */
  const dist = (m: number) => (units.current === 'mi' ? { value: (m / 1609.344).toFixed(1), unit: 'mi' } : { value: (m / 1000).toFixed(1), unit: 'km' });
  const height_ = (m: number) => (units.current === 'mi' ? { value: Math.round(m * 3.28084).toLocaleString('en-US'), unit: 'ft' } : { value: Math.round(m).toLocaleString('en-US'), unit: 'm' });
  const clock = (t: number) => {
    const d = new Date(t);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const hikeItems = $derived.by(() => {
    const st = live.strip, none = { value: '—' };
    const goal = pick(st?.goal === 'summit' ? S.hikeSummit : S.hikeGoal, L);
    return [
      { label: pick(S.hikeWalked, L), ...(st ? dist(st.walked) : none) },
      { label: pick(S.hikeLeft, L), ...(st ? dist(st.left) : prep ? dist(prep.total) : none) },
      { label: pick(S.hikeUp, L), ...(st ? height_(st.up) : none) },
      { label: fill(pick(S.hikeArrive, L), 'goal', goal), ...(st?.eta ? { value: clock(st.eta), unit: pick(S.hikeAbout, L) } : none) }
    ];
  });
  /** The location disc's look: off (the crosshair), free (hollow), follow (filled), heading (the cone). */
  const camLabel = $derived(pick(live.cam.c === 'heading' ? S.camHeading : live.cam.c === 'follow' ? S.camFollow : S.locate, L));

  const note = $derived(packing.note('hiking'));
  const full = $derived(sheetState === 'full' && drag === null);

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

<svelte:window bind:innerHeight={vh} />

{#if track === 'none'}
<section class="detail plain" data-trail-view={trail.slug} data-sheet="none">
  <NavBar pad title={pick(trail.name, L)} {onback} {onclose} />
  <div class="body sheet-scroll">
    <StatStrip items={trailStats(trail, L, true)} />
    {@render cards()}
  </div>
</section>
{:else}
<section class="detail" data-trail-view={trail.slug} data-sheet={sheetState}>
  <TrailMap bind:this={map} region={trail.tiles} center={trail.center} {prep} {scrub} fix={live.fix} heading={live.heading} cam={live.cam}
    walked={live.hiking && live.at ? live.at.d : null} off={live.off?.line ?? null} net={netView} {hl} bottom={peekH} clear={live.net ? 56 : 0} top={topH} {saved}
    noteTop={slot ? 'calc(var(--ui-top) + 160px)' : undefined}
    onbearing={(b) => (live.bearing = b)} onpan={() => live.pan()} onrotate={() => live.rotate()} />

  <div class="top" bind:this={bar}><NavBar pad {onback} {onclose} /></div>
  {#if !live.hiking}<div class="offline" inert={full} bind:this={ctl[0]}><SaveButton {plan} name={trail.name} /></div>{/if}
  <div class="zoom" inert={full} bind:this={ctl[1]}>
    <button type="button" class="disc" data-sfx="tick" aria-label={pick(S.zoomIn, L)} onclick={() => map?.zoom(1)}><Icon name="plus" size={18} stroke={2.4} /></button>
    <button type="button" class="disc" data-sfx="tick" aria-label={pick(S.zoomOut, L)} onclick={() => map?.zoom(-1)}><Icon name="minus" size={18} stroke={2.4} /></button>
  </div>

  <!-- the one top slot: off the route, else the fork ahead, else a note -->
  {#if slot}
    <div class="slot" class:alert={slot === 'off'} class:fork={slot === 'fork'} inert={full} role="status" data-top-slot={slot}>
      {#if slot === 'off' && live.off}
        <p class="big" data-off-route><Phrases text={fill(pick(S.offRoute, L), 'n', live.off.n)} /></p>
      {:else if slot === 'fork' && junction}
        {@const j = junction}
        {@const named = j.br.filter((b) => b.name || b.take)}
        <div class="big" data-junction>{j.to <= 10 ? pick(S.fork, L) : fill(pick(S.forkIn, L), 'n', Math.max(10, Math.round(j.to / 10) * 10))}{#if j.dir}<span class="dot"> · </span>{fill(pick(S.forkDir, L), 'dir', pick(S[DIR[j.dir]], L))}{/if}</div>
        {#if named.length}
          <div class="names" data-junction-names>{#each named as b, k (k)}{#if k}<span class="sep">{' / '}</span>{/if}<span class:take={b.take}>{#if b.take}<i class="mark" aria-hidden="true"></i>{/if}{#if b.dir}{pick(S[DIR[b.dir]], L)}：{/if}{b.name ?? pick(S.thisRoute, L)}</span>{/each}</div>
        {/if}
      {:else if slot === 'back'}
        <p class="big" data-back-on-route><Phrases text={pick(S.backOnRoute, L)} /></p>
      {:else if slot === 'loc'}
        <p data-loc-denied><Phrases text={pick(S.locDenied, L)} /></p>
      {:else if slot === 'compass'}
        <p data-compass-denied><Phrases text={pick(S.compassDenied, L)} /></p>
      {:else if slot === 'calib'}
        <p data-calib><Phrases text={pick(S.compassCalib, L)} /></p>
      {/if}
    </div>
  {/if}

  <!-- bottom-right in the thumb's reach: the compass (only turned or in heading mode) over the location disc -->
  <div class="discs" style:bottom="{peekH + 6}px" inert={full}>
    {#if live.toast}<span class="toast" role="status" data-cam-toast>{pick(S[live.toast], L)}</span>{/if}
    {#if compassShown}
      <button type="button" class="big-disc compass" data-compass data-sfx="tick" aria-label={pick(S.north, L)} onclick={north}>
        <svg viewBox="0 0 24 24" width="42" height="42" style:transform="rotate({-live.bearing}deg)" aria-hidden="true">
          <path d="M12 2 15.4 12H8.6z" fill="var(--c-coral-text)" /><path d="M12 22 8.6 12h6.8z" fill="var(--c-ink-soft)" />
          <text x="12" y="10" text-anchor="middle" font-size="5.6" font-weight="800" fill="#fff">N</text>
        </svg>
      </button>
    {/if}
    <button type="button" class="big-disc locate" class:on={live.cam.c === 'follow' || live.cam.c === 'heading'} data-locate={live.cam.c} data-sfx="tick"
      aria-label={camLabel} aria-pressed={live.cam.c !== 'off'} onclick={locate}>
      {#if live.cam.c === 'off'}
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M2 12h3M19 12h3M12 2v3M12 19v3" /><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.6" fill="currentColor" /></svg>
      {:else if live.cam.c === 'heading'}
        <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 13 5.5 3.6a11 11 0 0 1 13 0z" fill="currentColor" opacity=".6" /><circle cx="12" cy="15" r="4.6" fill="currentColor" /><circle cx="12" cy="15" r="2.4" fill="var(--c-sky)" /></svg>
      {:else}
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M12 3 19 20.5 12 16.6 5 20.5z" fill={live.cam.c === 'follow' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" /></svg>
      {/if}
    </button>
  </div>

  <!-- OSM's other trails: the legend is the toggle; MapLibre's attribution under it names OSM while they draw -->
  {#if live.net}
    <button type="button" class="legend" class:off={!live.netShown} style:bottom="{peekH + 22}px" inert={full} data-ref-toggle data-sfx="tick"
      aria-pressed={live.netShown} onclick={() => (live.netShown = !live.netShown)}>
      {#if live.netShown}<span class="k route" aria-hidden="true"></span>{pick(S.thisRoute, L)}{/if}
      <span class="k ref" aria-hidden="true"></span>{pick(S.refRoutes, L)}
    </button>
  {/if}

  <div class="sheet" class:dragging={drag !== null} style:height="{height}px">
    <div class="grip" role="button" tabindex="0" aria-expanded={sheetState === 'full'} aria-label={pick(S.sheetToggle, L)} data-sheet-grip data-sfx="page"
      onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onkeydown={key}></div>
    <div class="peek" data-sheet-peek role="presentation" bind:this={peekEl} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      {#if live.hiking}
        <div class="hike-strip" data-hike-strip><StatStrip items={hikeItems} /></div>
        <div class="hike-row">
          {#if live.wakeOk}
            <button type="button" class="wake" role="switch" aria-checked={live.wake} data-wake data-sfx="tick" onpointerdown={(e) => e.stopPropagation()} onclick={() => live.setWake(!live.wake)}>
              <span class="sw" aria-hidden="true"></span><span class="wt">{pick(S.wake, L)}<small>{pick(S.wakeNote, L)}</small></span>
            </button>
          {:else}<span></span>{/if}
          <button type="button" class="btn small paper end" data-hike-end data-sfx="back" onpointerdown={(e) => e.stopPropagation()} onclick={() => live.endHike()}>{pick(S.hikeEnd, L)}</button>
        </div>
      {:else}
        <div class="pk-head">
          <h2 class="pk-title">{pick(trail.name, L)}</h2>
          {#if prep}<button type="button" class="btn small start" data-hike-start data-sfx="open" onpointerdown={(e) => e.stopPropagation()} onclick={startHike}><Icon name="mountain" size={20} />{pick(S.hikeStart, L)}</button>{/if}
        </div>
        <StatStrip items={trailStats(trail, L, true)} />
      {/if}
    </div>
    <div class="body sheet-scroll" bind:this={body}>
      {#if track === 'ok' && prep}
        <ElevCard {prep} bind:held here={live.hiking && live.at ? live.at.d : null} />
      {:else if track === 'failed'}
        <LoadError text={pick(S.trackFailed, L)} onretry={load} data-track-failed />
      {:else}
        <div class="card dense track-msg" aria-busy="true"></div>
      {/if}
      {@render cards()}
    </div>
  </div>
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
          {#if u.notes}<div class="row notes" data-hike-notes>{u.notes}</div>{/if}
          <div class="row acts">
            <button type="button" class="btn small paper" data-hike-edit data-sfx="open" onclick={() => onedit?.(u.id)}><Icon name="edit" size={18} />{pick(S.editBtn, L)}</button>
            <button type="button" class="btn small paper del" data-hike-remove data-sfx="open" aria-haspopup="dialog" onclick={() => (asking = true)}><Icon name="trash" size={18} />{pick(S.remove, L)}</button>
          </div>
        </div>
      {/if}
      {#if trail.plan}<PlanCard plan={trail.plan} {note} />{/if}
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

  /* ‹ ✕ over the map: NavBar's buttons; the map's own (＋ − locate, the save pill) the same family: theme.css .disc */
  .top { position: absolute; z-index: 1000; top: 0; left: 0; right: 0; pointer-events: none; }
  .top :global(.nav) { pointer-events: auto; }
  .disc { transition: bottom .32s var(--ease-soft); }
  /* the discs' drawn edge on the bar's (NavBar pulls its 6px out) */
  .zoom { position: absolute; z-index: 500; top: calc(var(--ui-top) + 52px); right: calc(6px + var(--safe-right)); display: flex; flex-direction: column; gap: 0; }
  .offline { position: absolute; z-index: 500; top: calc(var(--ui-top) + 52px); left: calc(12px + var(--safe-left)); }
  /* the location and compass discs: bottom-right over the sheet's peek, 56px drawn in a 64px hit (gloves), high contrast */
  .discs { position: absolute; z-index: 520; right: calc(4px + var(--safe-right)); display: flex; flex-direction: column; align-items: flex-end; gap: 4px; transition: bottom .32s var(--ease-soft); }
  .big-disc {
    appearance: none; position: relative; width: 64px; height: 64px; margin: 0; padding: 0; border: 0; background: none; border-radius: 50%;
    display: grid; place-items: center; color: var(--c-ink); cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .big-disc::before { content: ''; position: absolute; inset: 4px; border-radius: 50%; background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-ink-soft), 0 3px 0 var(--c-ink-soft), var(--sh-float); }
  .big-disc > * { position: relative; }
  .big-disc:active::before { transform: translateY(2px); box-shadow: inset 0 0 0 2px var(--c-ink-soft), 0 1px 0 var(--c-ink-soft); }
  .big-disc:focus-visible { outline: none; }
  .big-disc:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  .locate { color: var(--c-sky-text); }
  .locate[data-locate='off'] { color: var(--c-ink); }
  .locate.on { color: #fff; }
  .locate.on::before { background: var(--c-sky); box-shadow: inset 0 0 0 2px var(--c-sky-text), 0 3px 0 var(--c-sky-text), var(--sh-float); }
  .compass svg { transition: transform .12s linear; }
  /* the 1 s label after a tap, beside the disc */
  .toast {
    position: absolute; right: 70px; bottom: 16px; margin: 0; padding: 8px 14px; white-space: nowrap; pointer-events: none;
    background: var(--c-ink); color: var(--c-cream); border-radius: var(--r-pill); font: 700 var(--fs-body)/1.2 var(--font-ui); box-shadow: var(--sh-float);
  }

  /* the one top slot (under ‹ ✕, clear of ＋ −): off the route (coral), the fork ahead, a note */
  .slot {
    position: absolute; z-index: 560; top: calc(var(--ui-top) + 52px); left: calc(10px + var(--safe-left)); right: calc(62px + var(--safe-right));
    padding: 10px 14px; background: var(--c-card); color: var(--c-ink); border-radius: var(--r-row); box-shadow: inset 0 0 0 2px var(--c-ink-soft), var(--sh-float);
    font: 600 var(--fs-body)/1.45 var(--font-ui);
  }
  .slot p, .slot div { margin: 0; }
  .slot .big { font: 700 20px/1.3 var(--font-ui); }
  .slot.alert { background: var(--c-coral-text); color: #fff; box-shadow: var(--sh-float); }
  .slot .names { margin-top: 4px; font-size: var(--fs-body); }
  .slot .names .take { font-weight: 800; color: var(--c-coral-text); }
  .slot .mark { display: inline-block; width: 16px; height: 5px; margin: 0 5px 3px 0; border-radius: 3px; background: var(--c-coral-text); vertical-align: middle; }
  .slot .sep { color: var(--c-ink-soft); }

  /* OSM's other trails: the legend chip (its toggle), bottom-left over the attribution */
  .legend {
    appearance: none; position: absolute; z-index: 510; left: calc(6px + var(--safe-left)); min-height: 44px; display: inline-flex; align-items: center; gap: 6px;
    padding: 0 12px; border: 0; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-card) 94%, transparent); color: var(--c-ink);
    box-shadow: inset 0 0 0 1.5px var(--c-ink-soft); font: 700 var(--fs-s)/1 var(--font-ui); cursor: pointer; transition: bottom .32s var(--ease-soft);
  }
  .legend.off { color: var(--c-ink-soft); box-shadow: inset 0 0 0 1.5px var(--edge); text-decoration: line-through; }
  .legend .k { display: inline-block; width: 18px; height: 0; }
  .legend .k.route { border-top: 5px solid #AD3F2B; border-radius: 2px; }
  .legend .k.ref { border-top: 3px dashed #3E5C9A; margin-left: 4px; }

  /* the drag-up sheet: the app's paper with its lip, the cards on it */
  .sheet {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 600; display: flex; flex-direction: column;
    background: var(--surface); border-radius: var(--r-card) var(--r-card) 0 0; box-shadow: 0 calc(-1 * var(--lip-s)) 0 var(--lip), var(--sh-float);
    transition: height .32s var(--ease-soft);
  }
  .sheet.dragging { transition: none; }
  .grip { flex: none; padding: 8px 0 4px; display: flex; justify-content: center; cursor: grab; touch-action: none; }
  .grip::before { content: ''; width: 36px; height: 5px; border-radius: var(--r-pill); background: var(--stitch); }
  .grip:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px; }
  .grip, .peek { -webkit-user-select: none; user-select: none; }
  .peek { flex: none; padding: 0 calc(12px + var(--safe-right)) 0 calc(12px + var(--safe-left)); cursor: pointer; touch-action: none; }
  .pk-head { display: flex; align-items: center; gap: 8px; min-height: 48px; }
  .pk-title { flex: 1; min-width: 0; margin: 0 4px; font: 700 var(--fs-talk)/1.25 var(--font-ui); color: var(--text); }
  .peek :global(.stats) { padding: 6px 0 8px; }
  /* 歩きはじめる: the trail's one action, leaf, big enough for a gloved thumb */
  .start { flex: none; min-height: 48px; margin: 0; padding: 0 16px; gap: 6px; }
  /* hike mode's peek: the strip (Fredoka 22, on the solid cream) and its row (the wake switch, 終了) */
  .hike-strip { margin: 2px 0 0; background: var(--c-cream); border-radius: var(--r-row); box-shadow: inset 0 0 0 2px var(--edge); }
  .hike-strip :global(.stats) { padding: 8px 0; }
  .hike-strip :global(.stats b) { font-size: 22px; }
  .hike-strip :global(.stats dt) { font-size: var(--fs-s); color: var(--text); }
  .hike-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0 max(8px, var(--safe-bottom)); }
  .end { margin: 0; min-height: 52px; min-width: 96px; font-size: var(--fs-talk); }
  .wake { appearance: none; border: 0; background: none; padding: 4px 0; min-height: 52px; display: flex; align-items: center; gap: 10px; text-align: left; color: var(--text); font: 700 var(--fs-body)/1.25 var(--font-ui); cursor: pointer; }
  .wake small { display: block; font-weight: 600; font-size: var(--fs-s); color: var(--text-soft); }
  .sw { flex: none; position: relative; width: 50px; height: 30px; border-radius: 15px; background: var(--ctl-off); box-shadow: inset 0 0 0 2px var(--edge); transition: background-color .15s; }
  .sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: var(--c-card); box-shadow: 0 1px 2px rgb(0 0 0 / .25); transition: transform .15s var(--ease-soft); }
  .wake[aria-checked='true'] .sw { background: var(--c-leaf-edge); box-shadow: none; }
  .wake[aria-checked='true'] .sw::after { transform: translateX(20px); }
  .wake:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: var(--r-row); }

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
