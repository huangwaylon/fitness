<script lang="ts">
  // The tent's inside (docs/design.md "The tent"): NH's largest room in 3D, behind its door on the island. The room
  // (engine.ts, three.js) comes in its own chunk once the screen opens; until its first frame the door's black covers
  // it (ui-state/doorTransition.ts). A tap on the floor walks my villager there (round the furniture); a tap on a piece
  // acts where I stand (my villager turns to it, it jiggles, a lamp turns on or off); the doormat or ‹ 島へ goes back
  // out; もようがえ arranges the room (TentEdit). The room is both of ours (store/tent.svelte.ts: the relay live, the
  // sheet for good); the partner's villager is here while they are (each phone moves its own: the `tent` intent, the
  // very walk) or while they're away; what they drag moves here as they drag it (dragLink.ts). Nothing gives ベル.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount, untrack } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';
  import TentEdit from './TentEdit.svelte';
  import type { WeekView } from '#lib/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { loadTentNames } from '#lib/i18n/tent.ts';
  import { art, artUrl, villagerArt } from '#lib/art.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { doorReady, provideDoor } from '#lib/ui-state/doorTransition.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { tent as room } from '#lib/store/tent.svelte.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { sendDecor } from '#lib/store/actions.ts';
  import { LIVE_URL, createLive, liveRelay, type Live } from '#lib/sync/live.ts';
  import { createLocalLive } from '#lib/sync/live-local.ts';
  import type { Intent, Pt as WirePt, Relayed } from '#lib/sync/live-protocol.ts';
  import { hook } from '../island/devHooks.ts';
  import { DEFAULT_FLOOR, DEFAULT_WALL, ITEMS, STARTER, codeOfFind } from './items.ts';
  import { DOOR_IN, HALF, centreOf, nearestFree, walkPath, type Pt, type Spot } from './grid.ts';
  import { DragLink } from './dragLink.ts';
  import type { Look, Tent, Who } from './engine.ts';

  let { view }: { view: WeekView } = $props();

  let canvas = $state<HTMLCanvasElement>();
  let eng = $state<Tent | null>(null);
  let failed = $state(false);
  let editing = $state(false);
  let edit = $state<ReturnType<typeof TentEdit>>();
  // svelte-ignore state_referenced_locally
  const me: Who = view.me;
  // svelte-ignore state_referenced_locally
  const partner: Who = view.partner;

  // ---- the relay: the phone's one socket (the demo's two tabs share a channel; ?relay=&key= a test relay) ----
  const demo = !!week.demo;
  const testRelay = (): Live | null => {
    const url = hook('relay'), key = hook('key');
    return url && /^wss?:\/\//.test(url) && key ? createLive({ url, key: () => key }) : null;
  };
  const own = demo ? (testRelay() ?? createLocalLive(me)) : null;
  const relay: Live | null = demo ? own : LIVE_URL ? liveRelay() : null;
  const relayNow = () => shared.now();
  const send = (i: Intent) => relay?.send(i) ?? false;
  const link = new DragLink((d) => send(d));

  const spots = (): Spot[] => room.pieces.map((p) => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f }));

  function lookOf(who: Who): Look | null {
    const p = view.people[who];
    const l = resolveLook({ villager: p.villager, person: who });
    const key = villagerArt(l.id);
    const a = art(key), url = artUrl(key);
    return a && url ? { url, aspect: a.w / a.h, looksRight: l.looksRight, noMirror: l.noMirror } : null;
  }
  const nightOf = (tod: string) => (tod === 'night' ? 1 : tod === 'dusk' ? 0.55 : tod === 'dawn' ? 0.3 : 0);

  /** What the balloons brought that NH has a model of (either of us found it), newest first, the starters left out. */
  const finds = $derived.by(() => {
    const fs = week.model?.state.finds ?? [];
    const out: string[] = [];
    for (let i = fs.length - 1; i >= 0; i--) {
      const f = fs[i];
      const c = f.kind === 'item' ? codeOfFind(f.id) : null;
      if (c && !ITEMS[c].starter && !out.includes(c)) out.push(c);
    }
    return out;
  });

  // ---- my villager in the tent, told to the partner (the very walk) ----
  /** My last walk (for a partner who joins while it's under way). */
  let myWalk: { from: Pt; via: Pt[]; to: Pt; s: number; ms: number } | null = null;
  const r = (p: Pt): WirePt => [Math.round(Math.max(-HALF, Math.min(HALF, p[0]))), Math.round(Math.max(-HALF, Math.min(HALF, p[1])))];
  function sayWhere() {
    const at = eng?.at(me);
    if (!at) return;
    const w = myWalk && relayNow() < myWalk.s + myWalk.ms ? myWalk : null;
    send(w ? { kind: 'tent', in: true, from: r(w.from), ...(w.via.length ? { via: w.via.map(r).slice(0, 10) } : {}), to: r(w.to), s: Math.round(w.s), ms: Math.round(w.ms) } : { kind: 'tent', in: true, to: r(at) });
  }
  function walkTo(to: Pt) {
    if (!eng) return;
    const from = eng.at(me);
    if (!from) return;
    const pts = walkPath(spots(), from, to);
    if (!pts.length) return;
    const ms = eng.walk(me, pts);
    myWalk = { from, via: pts.slice(0, -1), to: pts[pts.length - 1], s: relayNow(), ms };
    sayWhere();
  }

  // ---- the partner's villager: theirs to move while they're here, resting in the room while they're away ----
  let peer = $state(false);
  /** The partner said they're in the tent (null: not since they came online). */
  let partnerIn: boolean | null = null;
  let partnerAt: Pt = [me === 'A' ? 9 : -9, 16];
  function partnerShown() {
    if (!eng) return;
    const shown = !peer || partnerIn === true;
    eng.villager(partner, shown ? lookOf(partner) : null);
    if (shown && !eng.walking(partner)) eng.put(partner, partnerAt, partner === 'A' ? 1 : -1);
  }
  function heardTent(m: Extract<Relayed, { kind: 'tent' }>) {
    if (!eng) return;
    partnerIn = m.in;
    if (m.to) partnerAt = m.to;
    partnerShown();
    if (!m.in || !m.to) return;
    if (m.from && m.s !== undefined && m.ms) {
      const ago = relayNow() - m.s;
      if (ago < m.ms) eng.walk(partner, [...(m.via ?? []), m.to], { from: m.from, ago, ms: m.ms });
      else eng.put(partner, m.to);
    } else eng.put(partner, m.to);
  }

  // ---- what the partner drags ----
  function heldChanged() {
    if (!eng) return;
    eng.held(link.theirs());
    eng.hide([...link.theirs().map((h) => h.id), ...(editHeld() ? [editHeld()!] : [])]);
  }
  const editHeld = (): string | null => (editing ? (edit?.snapshot().sel && !edit.snapshot().sel!.fresh ? edit.snapshot().sel!.id : null) : null);
  let expiry: ReturnType<typeof setInterval> | null = null;
  function heardDrag(m: Extract<Relayed, { kind: 'drag' }>) {
    const was = link.heldThere(m.id);
    if (!link.heard(m, (id) => room.byId(id)?.item)) return;
    if (!was && !m.end) edit?.partnerHolds(m.id, m.t);
    heldChanged();
    expiry ??= setInterval(() => {
      if (link.expire()) heldChanged();
      if (!link.theirs().length && expiry) (clearInterval(expiry), (expiry = null));
    }, 500);
  }

  // ---- the finger: a tap walks (or acts on what it's on); a drag turns the camera round the room (in the edit mode a
  //      drag that starts on a piece moves it instead); two fingers pinch to zoom and tilt ----
  const ptrs = new Map<number, { x: number; y: number }>();
  type G = { kind: 'maybe' | 'orbit'; x0: number; y0: number; t0: number; lx: number; ly: number } | { kind: 'pinch'; d: number; my: number } | { kind: 'edit'; id: number };
  let gesture: G | null = null;
  /** The camera isn't NH's view (the reset button shows). */
  let turned = $state(false);
  const spread = () => {
    const [a, b] = [...ptrs.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), my: (a.y + b.y) / 2 };
  };
  function onDown(e: PointerEvent) {
    canvas?.setPointerCapture(e.pointerId);
    // the first finger down: nothing else is (a pointer whose up never came, a lost capture, is forgotten)
    if (e.isPrimary) {
      ptrs.clear();
      if (gesture?.kind !== 'edit') gesture = null;
    }
    if (editing && !ptrs.size && edit?.down(e)) {
      gesture = { kind: 'edit', id: e.pointerId };
      return;
    }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) gesture = { kind: 'maybe', x0: e.clientX, y0: e.clientY, t0: Date.now(), lx: e.clientX, ly: e.clientY };
    else if (ptrs.size === 2) {
      gesture = { kind: 'pinch', ...spread() };
      eng?.moving(true);
    }
  }
  function onMove(e: PointerEvent) {
    const g = gesture;
    if (!g || !eng) return;
    if (g.kind === 'edit') return void (g.id === e.pointerId && edit?.move(e));
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.kind === 'maybe' && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 10) {
      g.kind = 'orbit';
      eng.moving(true);
    }
    if (g.kind === 'orbit') {
      eng.orbit(-(e.clientX - g.lx) * 0.0085, (e.clientY - g.ly) * 0.005);
      g.lx = e.clientX;
      g.ly = e.clientY;
      turned = !eng.isDefault();
    } else if (g.kind === 'pinch' && ptrs.size === 2) {
      const n = spread();
      if (g.d > 0) eng.zoom(n.d / g.d);
      eng.orbit(0, (n.my - g.my) * 0.004);
      Object.assign(g, n);
      turned = !eng.isDefault();
    }
  }
  function onUp(e: PointerEvent) {
    const g = gesture;
    if (g?.kind === 'edit') {
      if (g.id !== e.pointerId) return;
      gesture = null;
      edit?.up(e);
      return;
    }
    if (!ptrs.delete(e.pointerId)) return;
    if (g?.kind === 'maybe' && Date.now() - g.t0 < 700) tap(e.clientX, e.clientY);
    if (!ptrs.size) {
      gesture = null;
      eng?.moving(false);
    } else if (g?.kind === 'pinch') {
      // one finger left: it turns the camera on from where it is
      const [p] = [...ptrs.values()];
      gesture = { kind: 'orbit', x0: p.x, y0: p.y, t0: 0, lx: p.x, ly: p.y };
    }
  }
  function onCancel(e: PointerEvent) {
    if (gesture?.kind === 'edit') edit?.up(e);
    ptrs.delete(e.pointerId);
    if (!ptrs.size) {
      gesture = null;
      eng?.moving(false);
    }
  }
  function onWheel(e: WheelEvent) {
    if (!eng) return;
    e.preventDefault();
    eng.zoom(Math.exp(-e.deltaY * 0.0015));
    turned = !eng.isDefault();
  }
  function resetView() {
    eng?.resetView();
    turned = false;
  }
  function tap(cx: number, cy: number) {
    if (!eng) return;
    const h = eng.hit(cx, cy);
    if (!h) return;
    if (h.kind === 'villager') {
      eng.hop(h.who);
      cue('villager-tap');
      return;
    }
    if (editing) {
      // the doormat is floor to the edit mode (its tiles are the door's: the bar says why a piece can't go there)
      const f = h.kind === 'floor' ? [h.x, h.z] : h.kind === 'door' ? eng.floorAt(cx, cy) : null;
      if (f) edit?.tapFloor(f[0], f[1]);
      return;
    }
    if (h.kind === 'door') return leave();
    if (h.kind === 'piece') {
      // in place: my villager turns to it, it answers where it stands
      const p = room.byId(h.id);
      if (p) eng.face(me, centreOf(p));
      eng.bump(h.id);
      cue(eng.toggle(h.id) ? 'toggle-on' : 'scene-decor');
      return;
    }
    walkTo([h.x, h.z]);
  }

  function leave() {
    if (leaving) return;
    leaving = true;
    cue('scene-bench');
    void goto(resolve('/') + location.search).finally(() => (leaving = false));
  }
  let leaving = false;

  // the room as the store has it: the pieces, the wallpaper and the floor
  $effect(() => {
    const ps = room.pieces, w = room.wall, f = room.floor, e = eng;
    if (!e) return;
    untrack(() => {
      e.pieces(ps.map((p) => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f })));
      e.surfaces(w ?? DEFAULT_WALL, f ?? DEFAULT_FLOOR);
    });
  });
  $effect(() => {
    const m = week.model;
    if (m) untrack(() => room.rows(m.state.tent));
  });
  $effect(() => eng?.night(nightOf(theme.tod)));
  $effect(() => void loadTentNames(i18n.locale).catch(() => {}));

  onMount(() => {
    let alive = true;
    room.attach(relay, me, demo);
    room.sink = (op) => sendDecor(op);
    own?.start();
    const offs: (() => void)[] = [];
    if (relay) {
      offs.push(relay.on((m) => {
        if (m.who === me) return;
        if (m.kind === 'tent') heardTent(m);
        else if (m.kind === 'drag') heardDrag(m);
      }));
      offs.push(relay.onStatus((st) => {
        const was = peer;
        peer = st.connected && st.peer;
        if (peer && !was) {
          partnerIn = null;
          sayWhere();
        }
        if (!peer && link.gone()) heldChanged();
        partnerShown();
      }));
    }
    // the partner's change, just made: it bumps where it lands and their villager turns to it
    offs.push(room.on(({ e, live }) => {
      edit?.changedThere(e.id, !!e.rm);
      if (!live || e.rm || !eng) return;
      const p = room.byId(e.id);
      if (!p) return;
      eng.bump(e.id);
      eng.face(partner, centreOf(p));
    }));
    const offDoor = provideDoor(() => (eng ? (([x, y]) => ({ x, y }))(eng.client(0, 0, HALF - 2)) : null));
    void import('./engine.ts').then(
      ({ createTent }) => {
        if (!alive || !canvas) return;
        const e = createTent(canvas);
        e.resize(insets());
        e.night(nightOf(theme.tod));
        e.villager(me, lookOf(me));
        // in at the door, a few steps into the room
        e.put(me, DOOR_IN, me === 'A' ? 1 : -1);
        eng = e;
        partnerShown();
        walkTo([me === 'A' ? -7 : 7, 22]);
        void e.ready.then(() => alive && doorReady());
        hooks();
      },
      () => {
        failed = true;
        doorReady();
      }
    );
    const ro = new ResizeObserver(() => eng?.resize(insets()));
    if (canvas) ro.observe(canvas);
    return () => {
      alive = false;
      send({ kind: 'tent', in: false });
      link.stop();
      if (expiry) clearInterval(expiry);
      for (const f of offs) f();
      ro.disconnect();
      offDoor();
      room.sink = null;
      own?.stop();
      eng?.dispose();
      eng = null;
      delete (window as unknown as { __tent?: unknown }).__tent;
    };
  });

  /** The edit mode's tray and bar (px): the room fits above them. */
  const TRAY_H = 236;
  let top = $state<HTMLElement>();
  let foot = $state<HTMLElement>();
  /** What covers the canvas at its top (the back button) and foot (the controls): the room fits between. */
  function insets() {
    const rc = canvas?.getBoundingClientRect();
    if (!rc) return { top: 0, bottom: 0 };
    const tb = top?.getBoundingClientRect(), fb = foot?.getBoundingClientRect();
    // the foot keeps room for the edit mode's tray, so the room stays where it is when it opens
    return { top: tb ? Math.max(0, tb.bottom - rc.top) : 0, bottom: Math.max(TRAY_H, fb ? rc.bottom - fb.top : 0) };
  }

  /** The e2e's and the console's hooks (dev builds and ?demo). */
  function hooks() {
    if (!import.meta.env.DEV && !new URLSearchParams(location.search).has('demo')) return;
    (window as unknown as { __tent?: unknown }).__tent = {
      stats: () => eng?.stats(),
      loading: () => eng?.loading() ?? 0,
      mine: () => eng?.at(me),
      at: (who: Who) => eng?.at(who),
      walking: (who: Who) => eng?.walking(who),
      /** A model point's client px. */
      px: (x: number, z: number, y = 0) => eng?.client(x, y, z),
      /** A tile's middle in client px. */
      tile: (x: number, z: number) => eng?.client(-HALF + (x + 0.5) * 10, 0, -HALF + (z + 0.5) * 10),
      pieces: () => room.pieces.map((p) => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f, who: p.who })),
      surfaces: () => ({ wall: room.wall, floor: room.floor }),
      edit: () => edit?.snapshot() ?? null,
      held: () => link.theirs().map((h) => ({ id: h.id, item: h.item, x: h.x, z: h.z, f: h.f })),
      partner: () => (eng?.at(partner) ? { at: eng.at(partner), walking: eng.walking(partner) } : null),
      starter: () => STARTER,
      /** The partner has the app open (the relay's presence). */
      peer: () => peer,
      hit: (cx: number, cy: number) => eng?.hit(cx, cy),
      /** Turn the camera (radians), zoom it; whether it's NH's view. */
      orbit: (dAz: number, dPitch = 0) => (eng?.orbit(dAz, dPitch), (turned = !eng?.isDefault())),
      zoom: (f: number) => (eng?.zoom(f), (turned = !eng?.isDefault())),
      isDefault: () => eng?.isDefault(),
      /** Furnish the room with these pieces (rugs first, then each on the free spot nearest the middle): how many. */
      fill: (codes: string[]) => {
        let n = 0;
        for (const c of [...codes].sort((a, b) => Number(!ITEMS[b].rug) - Number(!ITEMS[a].rug) || 0)) {
          if (room.room <= 0) break;
          const at = nearestFree(spots(), c, 0, 0, -10);
          if (at && room.set({ id: `d${Date.now().toString(36)}${(n++).toString(36).padStart(3, '0')}`, item: c, x: at[0], z: at[1], f: 0 })) continue;
        }
        return room.pieces.length;
      },
      /** A full turn of the camera, a frame at a time: the frames' own cost (ms) and the time between them. */
      orbitBench: async (steps = 180) => {
        const gaps: number[] = [];
        const c0 = eng?.stats().cost.length ?? 0;
        eng?.moving(true);
        let last = performance.now();
        for (let i = 0; i < steps; i++) {
          eng?.orbit((Math.PI * 2) / steps, 0);
          await new Promise((r) => requestAnimationFrame(r));
          const t = performance.now();
          gaps.push(t - last);
          last = t;
        }
        eng?.moving(false);
        const cost = (eng?.stats().cost ?? []).slice(-(steps - 1));
        const q = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * p))];
        return { frames: steps, c0, cost: { p50: q(cost, 0.5), p95: q(cost, 0.95), max: Math.max(...cost) }, gap: { p50: q(gaps, 0.5), p95: q(gaps, 0.95), max: Math.max(...gaps) }, stats: eng?.stats() && { calls: eng.stats().calls, tris: eng.stats().tris, dpr: eng.stats().dpr } };
      }
    };
  }
</script>

<main class="tent" data-tent data-editing={editing || undefined}>
  <h1 class="sr-only">{t('tent.title')}</h1>
  <canvas bind:this={canvas} class="room" data-room onpointerdown={onDown} onpointermove={onMove} onpointerup={onUp}
    onpointercancel={onCancel} onwheel={onWheel} aria-label={t('tent.room')}></canvas>
  <div class="top" bind:this={top}>
    {#if !editing}<NavButton kind="back" text={t('tent.back')} onclick={leave} sfx="self" />{/if}
  </div>
  {#if turned}
    <!-- back to NH's view of the room -->
    <button type="button" class="reset" data-tent-reset data-sfx="tick" aria-label={t('tent.resetView')} onclick={resetView}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9" /><path d="M10 19v-5h4v5" /></svg>
    </button>
  {/if}
  <div class="foot" bind:this={foot}>
    {#if !editing}
      <button type="button" class="edit" data-tent-edit-open data-sfx="open" onclick={() => (editing = true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h16v5H4zM6 13V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M6 18v2M18 18v2" /></svg>
        <span>{t('tent.edit')}</span>
      </button>
    {/if}
  </div>
  {#if editing && eng}
    <TentEdit bind:this={edit} eng={() => eng} {link} {finds} {relayNow} partnerName={view.people[partner].villagerName}
      villagers={() => [eng?.at(me), eng?.at(partner)].filter((p): p is [number, number] => !!p)}
      ondone={() => {
        editing = false;
        heldChanged();
      }} />
  {/if}
  {#if failed}<p class="fail" role="alert">{t('tent.failed')}</p>{/if}
</main>

<style>
  .tent {
    position: relative; max-width: var(--col); margin: 0 auto; height: var(--vh-fill); overflow: hidden; background: #2a1f17; touch-action: none;
    /* the edit mode's plates: the island's cream at every hour (NH's game objects) */
    --plate: var(--c-cream); --plate-lip: var(--c-lip); --plate-ink: var(--c-ink);
  }
  .room { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; -webkit-tap-highlight-color: transparent; }
  .top { position: absolute; left: calc(var(--side) + var(--safe-left)); top: calc(var(--safe-top) + 8px); z-index: 2; min-height: var(--hit); }
  .foot {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; display: flex; justify-content: center; gap: 10px;
    padding: 0 12px calc(var(--safe-bottom, 0px) + 14px); pointer-events: none; min-height: 72px;
  }
  .edit {
    pointer-events: auto; appearance: none; border: 0; cursor: pointer; min-height: 56px; padding: 0 24px 0 18px; border-radius: 28px;
    display: inline-flex; align-items: center; gap: 8px; font: 700 var(--fs-m, 16px)/1 var(--font-ui); color: var(--c-ink);
    background: var(--c-yuzu, #F7D94C); box-shadow: 0 3px 0 var(--c-yuzu-lip, #D9B21E), 0 6px 14px rgba(0, 0, 0, .3); -webkit-tap-highlight-color: transparent;
  }
  .edit svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .edit:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--c-yuzu-lip, #D9B21E); }
  .edit:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .reset {
    position: absolute; right: calc(var(--side) + var(--safe-right)); top: calc(var(--safe-top) + 8px); z-index: 2;
    width: 52px; height: 52px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    color: var(--c-ink); background: var(--c-card); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
    animation: pop .22s var(--ease-bounce) both;
  }
  .reset svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .reset:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .reset:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  @keyframes pop { from { scale: .6; opacity: 0; } }
  .fail { position: absolute; left: 16px; right: 16px; top: 40%; text-align: center; color: #F5E4BC; font-weight: 700; }
</style>
