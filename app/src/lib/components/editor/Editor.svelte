<script lang="ts">
  // The island's layout editor (docs/island-layout.md "The editor"), for anyone paired. The plan (plan.ts) top-down, the
  // back of the island at the top; the 3D preview (the island's own ground and models); the palette, the brushes, the
  // cliffs; what's wrong, live (validate.ts). A big screen has three columns, the mouse and the keyboard's shortcuts; a
  // phone (≤ 760 px) the plan full-bleed under a top bar, a tool dock, the selection's card and the palette and 島 as
  // sheets; a finger taps, drags and pinches (planFingers.ts), every shortcut a button. Every
  // finished action goes out at once as layout ops (store/layout.svelte.ts: the record and the relay), so the phones
  // see it as it's made; undo reverts one action over whatever the island is now.
  import Icon from '../ui/Icon.svelte';
  import { onMount, untrack } from 'svelte';
  import { layout as store } from '#lib/store/layout.svelte.ts';
  import { kindDef, type KindDef } from '#lib/layout/catalog.ts';
  import { OWNER_NAME, labelOf } from '#lib/layout/labels.ts';
  import { queued } from '#lib/sync/queue.ts';
  import { liveBadge } from './liveBadge.ts';
  import './kanjiNames.ts';
  import { loadOutdoor, outdoorReady } from '#lib/layout/outdoor.ts';
  import { roomIconUrl } from './roomIcon.ts';
  import { GRID, PATHS, TILE, type Kind } from '#lib/layout/grid.ts';
  import { Layout, extentOf, fromJson, footOf, objMid, opsBetween, toJson, type Obj } from '#lib/layout/model.ts';
  import { validate, type Issue } from '#lib/layout/validate.ts';
  import { riverStems } from '#lib/layout/river.ts';
  import { resizedCodes, type Blocker, type Edge } from '#lib/layout/resize.ts';
  import { artUrl } from '#lib/art.ts';
  import type { Live } from '#lib/sync/live.ts';
  import Preview3D from './Preview3D.svelte';
  import Lazy from '../ui/Lazy.svelte';
  import type { Undrawn } from '../world3d/drawCheck.ts';
  import HomePicker from '../homes/HomePicker.svelte';
  import ResetConfirm from './ResetConfirm.svelte';
  import Palette from './Palette.svelte';
  import IssueList from './IssueList.svelte';
  import IslandSize, { EDGE_NAME } from './IslandSize.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { planFingers } from './planFingers.ts';
  import { draw, fitView, tileUnder, toScreen, toWorld, zoomAt, type AutoSpot, type View } from './plan.ts';
  import { markerSpot, stageOf } from '#lib/layout/spots.ts';
  import { carryTops } from '#lib/layout/tops.ts';
  import {
    brushTiles, cliff, copy, duplicate, ghostAt, inBox, move, objectAt, paint, paste, place, placeRun, remove, removable, resize, restyle, revert, rotate, runs, runTiles, sameLayout, type Clip
  } from './edits.ts';
  import { gardenIcons, variantName } from './gardenIcons.ts';
  import { FIELD_MAX, fieldOf, fieldS, fieldPlots } from '#lib/layout/field.ts';
  import { farmOfState } from '#lib/model/farm.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import { testHooks } from '#lib/ui-state/testMode.ts';

  let { me, relay }: { me: 'A' | 'B' | 'G'; relay: Live | null } = $props();

  type Tool = 'select' | 'paint' | 'cliff' | 'place' | 'river';
  let tool = $state<Tool>('select');
  let brush = $state<Kind>('grass');
  let size = $state(1);
  let cliffDir = $state<1 | -1>(1);
  let placing = $state<KindDef | null>(null);
  let placeS = $state<string | undefined>(undefined);
  let placeF = $state<0 | 1 | 2 | 3>(0);
  let grid = $state(true);
  // a phone's layout (the window ≤ 760 px wide: a narrow desktop window too)
  const narrow = matchMedia('(max-width: 760px)');
  let phone = $state(narrow.matches);
  onMount(() => {
    const on = () => (phone = narrow.matches);
    narrow.addEventListener('change', on);
    return () => narrow.removeEventListener('change', on);
  });
  /** A phone's sheet over the plan: the palette (置く) or the island's panel (島). */
  let sheet = $state<'palette' | 'island' | null>(null);
  /** A finger's taps add to the selection and take from it (desktop: shift-click). */
  let multi = $state(false);
  // the 3D preview beside the plan, a phone's in its place when asked for (`?preview=0`: none, the e2e's: a software
  // GL draws it at a frame every few seconds)
  let show3d = $state(new URLSearchParams(location.search).get('preview') !== '0' && !narrow.matches);
  // 川の道 (RiverTool.svelte, imported as it opens): the save it's worked out, shown in the 3D preview
  let riverPreview = $state.raw<Layout | null>(null);
  let selected = $state<Set<string>>(new Set());
  let issues = $state<Issue[]>([]);
  let focus = $state<Issue | null>(null);
  let toast = $state<string | null>(null);
  let sent = $state(0);
  let hover = $state<[number, number] | null>(null);
  let confirmReset = $state(false);
  let picking = $state(false);

  /** The layout drawn: the store's, or a stroke's in progress. */
  let work = $state<Layout | null>(null);
  const cur = $derived(work ?? store.current);
  // the rivers as the 3D island draws them (layout/river.ts: straights, each turn an arc), marked on the plan as a stroke
  // paints (かわの せん) and listed in `?check`
  let riverLine = $state(true);
  const stems = $derived(riverLine || new URLSearchParams(location.search).has('check') ? riverStems(cur) : []);

  // ---- history: each action's before and after; undo reverts it over the island as it is now ----
  // Kept as plain data, never the Layouts: the caches keyed by a layout (layout/fields.ts, height.ts, mesh.ts: the 3D
  // preview's ~4 MB of rasters a layout) live as long as it does. Raw: the layouts aren't proxied.
  type Snap = Pick<Layout, 'codes' | 'objects' | 'homes'>;
  interface Action { before: Snap; after: Snap; label: string }
  const snap = (l: Layout): Snap => ({ codes: l.codes, objects: l.objects, homes: l.homes });
  const unsnap = (s: Snap): Layout => new Layout(s.codes, s.objects, s.homes);
  let undoStack = $state.raw<Action[]>([]);
  let redoStack = $state.raw<Action[]>([]);

  function send(next: Layout): number {
    const now = store.current;
    const ops = opsBetween(now, next, store.stamp());
    if (!ops.length) return 0;
    const took = store.apply(ops);
    sent += took.length;
    return took.length;
  }
  function commit(next: Layout, label: string): void {
    const before = store.current;
    // the things on the tops of the tables moved, turned or taken away go with them (layout/tops.ts)
    next = carryTops(before, next);
    if (sameLayout(before, next)) return;
    if (!send(next)) return;
    undoStack = [...undoStack.slice(-199), { before: snap(before), after: snap(next), label }];
    redoStack = [];
  }
  function undo(): void {
    const a = undoStack.at(-1);
    if (!a) return;
    undoStack = undoStack.slice(0, -1);
    send(revert(store.current, unsnap(a.before), unsnap(a.after)));
    redoStack = [...redoStack, a];
    say(`取り消した: ${a.label}`);
  }
  function redo(): void {
    const a = redoStack.at(-1);
    if (!a) return;
    redoStack = redoStack.slice(0, -1);
    send(revert(store.current, unsnap(a.after), unsnap(a.before)));
    undoStack = [...undoStack, a];
    say(`やり直した: ${a.label}`);
  }
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  function say(t: string): void {
    toast = t;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = null), 2600);
  }

  // ---- the plan ----
  let canvas = $state<HTMLCanvasElement>();
  let wrap = $state<HTMLElement>();
  let view = $state<View>({ s: 0.5, ox: 0, oy: 0 });
  let W = $state(800), H = $state(600);
  const icons = new Map<string, HTMLImageElement>();
  let iconRev = $state(0);
  /** The garden's icons (gardenIcons.ts: one sheet, cut up once it's in). */
  let garden = $state<Readonly<Record<string, string>>>({});
  onMount(() => void gardenIcons().then((g) => (garden = g)));
  /** The outdoor catalogue's kinds (layout/outdoor.ts: the rooms' pieces NH puts outdoors), in the palette once in. */
  let outdoorIn = $state(outdoorReady());
  onMount(() => void loadOutdoor().then(() => ((outdoorIn = true), iconRev++), () => say('屋外カタログを読み込めません')));
  const iconUrl = (key: string): string | null => (key.startsWith('garden:') ? (garden[key] ?? null) : (roomIconUrl(key) ?? artUrl(key)));
  function icon(key: string): HTMLImageElement | null {
    if (!key) return null;
    let im = icons.get(key);
    if (!im) {
      const url = iconUrl(key);
      if (!url) return null;
      im = new Image();
      im.onload = () => iconRev++;
      im.src = url;
      icons.set(key, im);
    }
    return im;
  }

  interface Drag {
    /** (`place`: a run of the garden's, a fence or a crop a tile, as the pointer goes: edits.ts placeRun) */
    mode: 'move' | 'box' | 'paint' | 'cliff' | 'pan' | 'place';
    x: number;
    y: number;
    tile: [number, number];
    ids?: string[];
    dc?: number;
    dr?: number;
    turn?: number;
    before?: Layout;
    view?: View;
    lastSent?: number;
  }
  let drag = $state<Drag | null>(null);
  let space = $state(false);

  const moved = $derived.by(() => {
    if (!drag || drag.mode !== 'move' || !drag.ids) return undefined;
    const m = new Map<string, { x: number; z: number; f: number }>();
    for (const id of drag.ids) {
      const o = cur.objects.get(id);
      if (o) m.set(id, { x: o.x + (drag.dc ?? 0), z: o.z + (drag.dr ?? 0), f: (o.f + (drag.turn ?? 0)) % 4 });
    }
    return m;
  });
  const ghost = $derived(tool === 'place' && placing && hover ? ghostAt(cur, placing.k, placeF, hover) : null);
  // しまの おおきさ (IslandSize.svelte): the new coast's ghost (a stepper hovered, or a resize waiting on what's in its way)
  let sizeHover = $state<{ edge: Edge; by: number } | null>(null);
  let pending = $state<{ edge: Edge; by: number; blocked: Blocker[]; stuck: string[] } | null>(null);
  // what's in the way is the layout's it was tried on: any change of it (an undo, a partner's edit, a file loaded, the
  // resize itself) lets the list and its coast's ghost go
  $effect(() => {
    void store.current;
    untrack(() => (pending = null));
  });
  const coast = $derived.by(() => {
    const r = sizeHover ?? pending;
    return r ? resizedCodes(cur, r.edge, r.by) : null;
  });
  const brushAt = $derived(hover && (tool === 'paint' || tool === 'cliff') ? brushTiles(hover[0], hover[1], size) : null);
  const box = $derived(drag?.mode === 'box' && hover ? { c0: drag.tile[0], r0: drag.tile[1], c1: hover[0], r1: hover[1] } : null);

  $effect(() => {
    const c = canvas;
    if (!c) return;
    void iconRev;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = devicePixelRatio || 1;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, { layout: cur, view, w: W, h: H, grid, selected, hover, moved, ghost, brush: brushAt, box, issues, focus, auto, icon, river: riverLine ? stems : null, coast, inset: phone ? { top: topH, bottom: dockH } : undefined });
  });

  // the issues, a moment after a change, and where the visitor stands while no usable mark of theirs is down (spots.ts
  // stageOf)
  let auto = $state<AutoSpot[]>([]);
  function autoSpots(l: Layout): AutoSpot[] {
    const st = markerSpot(l, 'plaza')?.at ? null : stageOf(l);
    return st ? [{ label: 'お客さんの場所（自動）', x: st[0], z: st[1] }] : [];
  }
  $effect(() => {
    const l = store.current, t = setTimeout(() => ((issues = validate(l)), (auto = autoSpots(l))), 120);
    return () => clearTimeout(t);
  });
  const errors = $derived(issues.filter((i) => i.level === 'error').length);
  const warns = $derived(issues.length - errors);

  // `?check`: what the phones' 3D island leaves undrawn of the layout, and why (world3d/drawCheck.ts), a moment after a change
  const drawCheckOn = new URLSearchParams(location.search).has('check');
  let undrawnList = $state<Undrawn[] | null>(null);
  $effect(() => {
    const l = store.current;
    if (!drawCheckOn) return;
    // (cleared on the next change and as the editor goes: no import after leaving)
    const t = setTimeout(() => void import('../world3d/drawCheck.ts').then(({ undrawn }) => (undrawnList = undrawn(l))), 200);
    return () => clearTimeout(t);
  });

  // ---- the pointer: a mouse here, a finger through planFingers (tap, a drag the tool takes or a pan, a pinch) ----
  const local = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = canvas!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const fingers = planFingers({
    local: (x, y) => local({ clientX: x, clientY: y }),
    view: () => view,
    setView: (v) => (view = v),
    tap: tapAt,
    grab: grabAt,
    drag: moveTo,
    release: (done) => {
      if (done) lift(false);
      else dropDrag();
      hover = null;
    }
  });
  function onDown(e: PointerEvent) {
    if (!canvas) return;
    // (a finger is the canvas's till it lifts without asking)
    if (e.pointerType !== 'mouse') return fingers.down(e);
    canvas.setPointerCapture(e.pointerId);
    const [px, py] = local(e);
    const tile = tileUnder(view, px, py);
    if (space || e.button === 1 || e.button === 2) {
      drag = { mode: 'pan', x: px, y: py, tile, view: { ...view } };
      return;
    }
    if (tool === 'paint' || tool === 'cliff') return startStroke(px, py, tile);
    if (tool === 'place') return void placeAt(px, py, tile, true);
    // select: an object picks it up (and its group if it's selected), empty ground starts a box
    const o = pickAt(px, py, tile);
    if (o) {
      if (e.shiftKey || e.metaKey) return toggle(o.id);
      if (!selected.has(o.id)) selected = new Set([o.id]);
      startMove(px, py, tile);
    } else {
      if (!e.shiftKey) selected = new Set();
      drag = { mode: 'box', x: px, y: py, tile };
    }
  }
  /** The piece under a point: a thing on a table's top by its middle, the table by the rest of its tile. */
  const pickAt = (px: number, py: number, tile: [number, number]) => objectAt(cur, tile[0], tile[1], toWorld(view, px, py));
  function toggle(id: string) {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    selected = s;
  }
  function startStroke(px: number, py: number, tile: [number, number]) {
    drag = { mode: tool as 'paint' | 'cliff', x: px, y: py, tile, before: store.current };
    stroke(tile);
  }
  /** The selection picked up (a table carries what's on its top). */
  function startMove(px: number, py: number, tile: [number, number]) {
    const ids = [...selected], kids = [...cur.objects.values()].filter((k) => k.on && selected.has(k.on) && !selected.has(k.id)).map((k) => k.id);
    drag = { mode: 'move', x: px, y: py, tile, ids: [...ids, ...kids], dc: 0, dr: 0, turn: 0, lastSent: 0 };
  }
  /** The piece being placed put down at a tile; a fence or a crop (`run`: a drag on) one a tile as the pointer goes on,
   *  the run one action as it lifts. True if a run began. */
  function placeAt(px: number, py: number, tile: [number, number], run: boolean): boolean {
    if (!placing) return false;
    const g = ghostAt(cur, placing.k, placeF, tile);
    if (!g.ok) return (say('そこには置けません'), false);
    const fixedHere = placing.fixed && [...cur.objects.values()].some((o) => o.k === placing!.k && (o.s ?? '') === (placeS ?? placing!.variants?.[0] ?? ''));
    if (fixedHere) return (say('これは島に1つだけです'), false);
    const r = place(cur, placing.k, g.x, g.z, placeF, placeS, store.stamp());
    if (!r) return false;
    if (run && runs(placing.k)) {
      drag = { mode: 'place', x: px, y: py, tile: [g.x, g.z], before: store.current, ids: [r.id] };
      work = r.layout;
      return true;
    }
    commit(r.layout, `${labelOf(placing.k)}を置いた`);
    if (placing.fixed) setTool('select');
    return false;
  }
  // a finger's tap: select (the piece under it, or near it while the tiles are smaller than a finger), place, a dab
  function tapAt(px: number, py: number) {
    const tile = tileUnder(view, px, py);
    if (tool === 'place') return void placeAt(px, py, tile, false);
    if (tool === 'paint' || tool === 'cliff') return (startStroke(px, py, tile), lift(false));
    if (tool !== 'select') return;
    const o = pickAt(px, py, tile) ?? nearAt(px, py);
    if (multi) return o ? toggle(o.id) : undefined;
    selected = o ? new Set([o.id]) : new Set();
  }
  /** The nearest piece round a point, its middle within a fingertip (22 px). */
  function nearAt(px: number, py: number) {
    const [x, z] = toWorld(view, px, py), [c0, r0] = tileUnder(view, px, py);
    let best: Obj | null = null, d = 22 / view.s;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const o = objectAt(cur, c0 + dc, r0 + dr);
        if (!o) continue;
        const [mx, mz] = objMid(cur, o), dd = Math.hypot(mx - x, mz - z);
        if (dd < d) (best = o), (d = dd);
      }
    return best;
  }
  // a finger's drag: the tool's if it began on a selected piece, with a brush, or with a fence or a crop; else a pan
  function grabAt(px: number, py: number): boolean {
    const tile = tileUnder(view, px, py);
    if (tool === 'paint' || tool === 'cliff') return (startStroke(px, py, tile), (hover = tile), true);
    if (tool === 'place') return !!placing && runs(placing.k) && placeAt(px, py, tile, true);
    if (tool !== 'select') return false;
    const o = pickAt(px, py, tile);
    if (!o || !selected.has(o.id)) return false;
    startMove(px, py, tile);
    return true;
  }
  function stroke(tile: [number, number]) {
    const tiles = brushTiles(tile[0], tile[1], size);
    const base = work ?? store.current;
    work = tool === 'cliff' ? cliff(base, tiles, cliffDir) : paint(base, tiles, brush);
  }
  function onMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return fingers.move(e);
    moveTo(...local(e));
  }
  function moveTo(px: number, py: number) {
    const tile = tileUnder(view, px, py);
    hover = tile[0] >= 0 && tile[1] >= 0 && tile[0] < GRID.cols && tile[1] < GRID.rows ? tile : null;
    if (!drag) return;
    if (drag.mode === 'pan') {
      view = { ...drag.view!, ox: drag.view!.ox + px - drag.x, oy: drag.view!.oy + py - drag.y };
      return;
    }
    if (drag.mode === 'place') {
      if (!placing || !hover || (hover[0] === drag.tile[0] && hover[1] === drag.tile[1])) return;
      const r = placeRun(work ?? store.current, placing.k, runTiles(drag.tile, hover), placeF, placeS, store.stamp() + (drag.ids?.length ?? 0));
      work = r.layout;
      drag = { ...drag, tile: hover, ids: [...(drag.ids ?? []), ...r.ids] };
      return;
    }
    if (drag.mode === 'paint' || drag.mode === 'cliff') {
      // a cliff stroke lifts each tile once; paint follows the pointer
      if (drag.mode === 'cliff' && drag.tile[0] === tile[0] && drag.tile[1] === tile[1]) return;
      if (drag.mode === 'cliff') {
        const base = work ?? store.current, before = drag.before!;
        const fresh = brushTiles(tile[0], tile[1], size).filter(([c, r]) => base.tier(c, r) === before.tier(c, r));
        work = cliff(base, fresh, cliffDir);
        drag = { ...drag, tile };
        return;
      }
      drag = { ...drag, tile };
      stroke(tile);
      return;
    }
    if (drag.mode === 'move') {
      const dc = tile[0] - drag.tile[0], dr = tile[1] - drag.tile[1];
      if (dc !== drag.dc || dr !== drag.dr) drag = { ...drag, dc, dr };
      // the partner sees it move (presence: ~10 a second)
      const now = performance.now();
      if (relay && now - (drag.lastSent ?? 0) > 100 && drag.ids?.length) {
        drag.lastSent = now;
        for (const id of drag.ids.slice(0, 8)) {
          const o = cur.objects.get(id);
          if (!o) continue;
          const [mx, mz] = objMid(cur, { ...o, x: o.x + dc, z: o.z + dr, n: undefined });
          relay.send({ kind: 'drag', sc: 'o', id, x: Math.round(mx), z: Math.round(mz), f: (o.f + (drag.turn ?? 0)) % 4 } as never);
        }
      }
    }
  }
  function onUp(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return e.type === 'pointercancel' ? fingers.cancel(e) : fingers.up(e);
    canvas?.releasePointerCapture(e.pointerId);
    lift(e.shiftKey);
  }
  /** The drag done: its action committed (a box selects, `shift` adding to the selection). */
  function lift(shift: boolean) {
    const d = drag;
    drag = null;
    if (!d) return;
    if (d.mode === 'place') {
      const next = work;
      work = null;
      // (put down over the island as it was when it began: its pieces sent over the island as it is now)
      if (next) commit(revert(store.current, next, d.before!), `${labelOf(next.objects.get(d.ids![0])?.k ?? '')}を${d.ids!.length > 1 ? `${d.ids!.length}個` : ''}置いた`);
    } else if (d.mode === 'paint' || d.mode === 'cliff') {
      const next = work;
      work = null;
      if (next) {
        const label = d.mode === 'cliff' ? (cliffDir > 0 ? '崖を高く' : '崖を低く') : `${BRUSH_NAME[brush]}を塗った`;
        // the stroke was drawn over the island as it was when it began: send its tiles over the island as it is now
        commit(revert(store.current, next, d.before!), label);
      }
    } else if (d.mode === 'move' && d.ids?.length) {
      let next = move(store.current, d.ids, d.dc ?? 0, d.dr ?? 0);
      if (d.turn) next = rotate(next, d.ids, d.turn, me);
      commit(next, d.ids.length > 1 ? `${d.ids.length}個動かした` : `${labelOf(store.current.objects.get(d.ids[0])?.k ?? '', d.ids[0])}を動かした`);
      dragEnd(d.ids);
    } else if (d.mode === 'box' && hover) {
      const ids = inBox(cur, d.tile[0], d.tile[1], hover[0], hover[1]);
      selected = new Set([...(shift ? selected : []), ...ids]);
    }
  }
  /** The drag given up (a pinch took over, the system took the finger): nothing kept. */
  function dropDrag() {
    const d = drag;
    drag = null;
    work = null;
    if (d?.mode === 'move' && d.ids) dragEnd(d.ids);
  }
  /** The partner's drag ghosts put where the pieces are now. */
  function dragEnd(ids: string[]) {
    for (const id of ids.slice(0, 8)) {
      const o = store.current.objects.get(id);
      if (o && relay) {
        const [mx, mz] = objMid(store.current, o);
        relay.send({ kind: 'drag', sc: 'o', id, x: Math.round(mx), z: Math.round(mz), f: o.f, end: true } as never);
      }
    }
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const [px, py] = local(e);
    // the wheel turns what's held (a drag, a placement); else it zooms (Cmd/Ctrl with a placement)
    if (!(e.metaKey || e.ctrlKey) && drag?.mode === 'move') {
      drag = { ...drag, turn: ((drag.turn ?? 0) + (e.deltaY > 0 ? 1 : 3)) % 4 };
      return;
    }
    if (!(e.metaKey || e.ctrlKey) && tool === 'place' && placing) {
      if (Math.abs(e.deltaY) > 2) turnPlacing(e.deltaY > 0 ? 1 : 3);
      return;
    }
    view = zoomAt(view, px, py, Math.exp(-e.deltaY * 0.0015));
  }

  // ---- the keyboard ----
  let clip: Clip | null = null;
  function onKey(e: KeyboardEvent) {
    // (the river tool has its own keys)
    if (confirmReset || tool === 'river') return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    const cmd = e.metaKey || e.ctrlKey;
    if (e.key === ' ') {
      space = true;
      e.preventDefault();
      return;
    }
    if (cmd && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (cmd && e.key.toLowerCase() === 'y') return (e.preventDefault(), redo());
    if (cmd && e.key.toLowerCase() === 'c') {
      clip = copy(cur, selected);
      if (clip) say(`${clip.items.length}個コピーした`);
      return;
    }
    if (cmd && e.key.toLowerCase() === 'v') {
      if (!clip || !hover) return;
      const r = paste(store.current, clip, hover[0], hover[1], store.stamp());
      if (!r.ids.length) return say('そこには貼り付けられません');
      commit(r.layout, `${r.ids.length}個貼り付けた`);
      selected = new Set(r.ids);
      return;
    }
    if (cmd && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      selected = new Set([...cur.objects.values()].filter((o) => o.k !== 'spot').map((o) => o.id));
      return;
    }
    if (cmd) return;
    switch (e.key) {
      case 'Escape':
        // (a drag given up: a move's ghosts on the partner's plan cleared, a stroke or a run never saved)
        if (drag) dropDrag();
        else if (tool !== 'select') setTool('select');
        else selected = new Set();
        break;
      case 'v': case 'V':
        setTool('select');
        break;
      case 'b': case 'B':
        setTool('paint');
        break;
      case 'c': case 'C':
        setTool('cliff');
        break;
      case 'g': case 'G':
        grid = !grid;
        break;
      case 'r': case 'R':
        // (turns what's held or selected; with nothing, 川の道)
        if (tool === 'place') turnPlacing(1);
        else if (drag?.mode === 'move') drag = { ...drag, turn: ((drag.turn ?? 0) + 1) % 4 };
        else if (selected.size) turnSel();
        else setTool('river');
        break;
      case 'Delete': case 'Backspace':
        if (selected.size) removeSel();
        break;
      case 'ArrowLeft': case 'ArrowRight': case 'ArrowUp': case 'ArrowDown': {
        if (!selected.size) break;
        e.preventDefault();
        const [dc, dr] = e.key === 'ArrowLeft' ? [-1, 0] : e.key === 'ArrowRight' ? [1, 0] : e.key === 'ArrowUp' ? [0, 1] : [0, -1];
        commit(move(store.current, selected, dc, dr), '動かした');
        break;
      }
      case '1': case '2': case '3':
        size = Number(e.key);
        break;
      case '=': case '+':
        view = zoomAt(view, W / 2, H / 2, 1.25);
        break;
      case '-':
        view = zoomAt(view, W / 2, H / 2, 0.8);
        break;
      case '0':
        fitAll();
        break;
      case '/':
        e.preventDefault();
        (document.querySelector('[data-palette-search]') as HTMLInputElement | null)?.focus();
        break;
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    if (e.key === ' ') space = false;
  }
  /** R: the selection a quarter round; a home only its owner's, and only where its door stays clear. */
  function turnSel() {
    const next = rotate(store.current, selected, 1, me);
    const homes = [...selected].filter((id) => /^home-/.test(id));
    for (const id of homes) {
      const who = id.slice(-1);
      if (who !== me) say(`${OWNER_NAME[who as 'A' | 'B' | 'G']}の家はその人だけが回せます`);
      else if (next.objects.get(id)?.f === store.current.objects.get(id)?.f) say('ここでは回せません（扉がふさがるため）');
    }
    commit(next, '回した');
  }
  function turnPlacing(by: number) {
    placeF = ((placeF + by) % 4) as 0 | 1 | 2 | 3;
  }
  /** 複製: a copy of the selection beside it, selected (desktop: ⌘C ⌘V at the pointer). */
  function duplicateSel() {
    const r = duplicate(store.current, selected, store.stamp());
    if ('why' in r) return say(r.why);
    commit(r.layout, `${r.ids.length}個複製した`);
    selected = new Set(r.ids);
  }
  function removeSel() {
    const fixed = [...selected].map((id) => cur.objects.get(id)).filter((o) => o && !removable(o));
    commit(remove(store.current, selected), `${selected.size - fixed.length}個削除した`);
    if (fixed.length) say(`${fixed.map((o) => labelOf(o!.k, o!.id)).join('・')}は削除できません`);
    selected = new Set([...selected].filter((id) => store.current.objects.has(id)));
  }
  function setTool(t: Tool) {
    tool = t;
    sheet = null;
    show3d &&= !phone;
    if (t !== 'place') placing = null;
    if (t === 'river') selected = new Set();
  }
  function pick(def: KindDef) {
    placing = def;
    placeS = def.variants?.[0];
    placeF = 0;
    tool = 'place';
    sheet = null;
  }

  // ---- the panel ----
  const BRUSHES: Kind[] = ['grass', 'sand', ...PATHS, 'river', 'pond', 'sea'];
  const BRUSH_NAME: Record<Kind, string> = { grass: '草', sand: '砂', dirt: '土', stone: '石', brick: 'レンガ', plank: '板', river: '川', pond: '池', sea: '海' };
  const one = $derived(selected.size === 1 ? (cur.objects.get([...selected][0]) ?? null) : null);
  function setVariant(s: string) {
    if (one) commit(restyle(store.current, one.id, s), '変更した');
  }
  /** How many plants stand on a field (the record keeps them if it's deleted or shrunk: docs/farming.md). */
  function plantsOn(o: Obj): number {
    const m = week.model;
    if (!m) return 0;
    const plots = farmOfState(m.state).plots;
    return fieldPlots(o).filter((t) => plots.has(t.p)).length;
  }
  /** An edge a tile out or in (shift: a chunk's 8, as far as it can go): one action, its ops one burst (commit); what's
   *  in the way listed instead, and 「うごかす」 (`moveIn`) moves it inside first (a fixed piece never deleted: one with
   *  nowhere to go holds it). */
  function resizeBy(edge: Edge, by: number, moveIn = false) {
    while (Math.abs(by) > 1 && !resizedCodes(store.current, edge, by)) by -= Math.sign(by);
    const r = resize(store.current, edge, by, moveIn);
    const label = `島を${by > 0 ? '広げた' : '狭めた'}（${EDGE_NAME[edge]}${Math.abs(by) > 1 ? ` ${Math.abs(by)}マス` : ''}）`;
    if (r.layout) {
      pending = null;
      commit(r.layout, label);
      say(r.removed.length ? `${label} · ${r.removed.length}個片付けた` : label);
      return;
    }
    if (!r.blocked.length) return say('これ以上できません');
    pending = { edge, by, blocked: r.blocked, stuck: r.stuck };
    say(r.stuck.length ? '動かせない物があります（先に動かしてください）' : '邪魔な物があります');
  }
  /** A world point to the middle of the plan's open part (a phone's: between its top bar and its sheet or card). */
  function centre(x: number, z: number) {
    const [sx, sy] = toScreen(view, x, z), y = phone ? (sheet ? H * 0.22 : H * 0.42) : H / 2;
    view = { ...view, ox: view.ox + W / 2 - sx, oy: view.oy + y - sy };
  }
  /** Select a piece and bring it to the middle of the plan. */
  function showObj(id: string) {
    const o = cur.objects.get(id);
    if (!o) return;
    selected = new Set([id]);
    centre(...objMid(cur, o));
  }
  function showIssue(is: Issue) {
    focus = focus === is ? null : is;
    if (is.ids.length) selected = new Set(is.ids.filter((id) => cur.objects.has(id)));
    // (a phone's sheet makes way for it)
    if (phone) sheet = null;
    const t = is.tiles[0];
    if (t) centre(GRID.x0 + (t[0] + 0.5) * TILE, GRID.z0 + (t[1] + 0.5) * TILE);
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(toJson(store.current), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `island-layout-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  let fileInput = $state<HTMLInputElement>();
  async function importJson(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    try {
      const l = fromJson(JSON.parse(await f.text()));
      if (!l) return say('このファイルは読み込めません');
      commit(l, '読み込んだ');
      say('読み込んだ');
    } catch {
      say('このファイルは読み込めません');
    }
    (e.target as HTMLInputElement).value = '';
  }
  function resetAll() {
    const before = store.current;
    const at = store.stamp();
    store.apply([{ sc: 'r', id: 'reset', at }]);
    undoStack = [...undoStack, { before: snap(before), after: snap(store.current), label: '最初の島に戻した' }];
    redoStack = [];
    say('最初の島に戻した');
  }

  onMount(() => {
    const ro = new ResizeObserver(() => {
      const r = wrap!.getBoundingClientRect();
      W = r.width;
      H = r.height;
    });
    ro.observe(wrap!);
    const r = wrap!.getBoundingClientRect();
    W = r.width;
    H = r.height;
    // the front of the island in view at the start, a tile ~27px (a phone's ~22, over its dock and card)
    const fit = untrack(() => fitView(W, H, extentOf(store.current).land));
    const v = zoomAt(fit, W / 2, H - 20, (phone ? 0.75 : 0.9) / fit.s);
    view = phone ? { ...v, oy: v.oy - 120 } : v;
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    if (testHooks()) window.__editor = {
      view: () => view, layout: () => store.current, select: (ids: string[]) => (selected = new Set(ids)), issues: () => issues, auto: () => auto, undrawn: () => undrawnList,
      screenOf: (x: number, z: number) => {
        const [sx, sy] = toScreen(view, x, z), b = canvas!.getBoundingClientRect();
        return [b.left + sx, b.top + sy];
      },
      tileScreen: (c: number, r: number) => {
        const [sx, sy] = toScreen(view, GRID.x0 + (c + 0.5) * TILE, GRID.z0 + (r + 0.5) * TILE), b = canvas!.getBoundingClientRect();
        return [b.left + sx, b.top + sy];
      },
      world: (cx: number, cy: number) => {
        const b = canvas!.getBoundingClientRect();
        return toWorld(view, cx - b.left, cy - b.top);
      }
    };
    return () => {
      ro.disconnect();
      clearTimeout(toastTimer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      delete window.__editor;
    };
  });

  /** The whole island in view (desktop: 0; a phone: 全体), a phone's between its top bar and its dock. */
  function fitAll() {
    const v = fitView(W, H - (phone ? topH + dockH : 0), extentOf(store.current).land);
    view = phone ? { ...v, oy: v.oy + topH } : v;
  }
  let topH = $state(0), dockH = $state(0);

  // the badge: the relay's socket as it is (connected, coming back, offline) and the edits the record hasn't taken yet
  // (the write queue's layout ops: queue.ts; looked at again at each change, each status and every few seconds)
  let connected = $state(false);
  let online = $state(navigator.onLine);
  // (called at once with the status as it is)
  $effect(() => relay?.onStatus((s) => (connected = s.connected)));
  let tick = $state(0);
  onMount(() => {
    const on = () => (online = navigator.onLine), t = setInterval(() => tick++, 3000);
    addEventListener('online', on);
    addEventListener('offline', on);
    return () => (clearInterval(t), removeEventListener('online', on), removeEventListener('offline', on));
  });
  const unsent = $derived((void week.view, void sent, void tick, void connected, queued().filter((e) => e.type === 'decor').length));
  const badge = $derived(liveBadge(!!relay && connected, !!relay && online, unsent));

  const present = (d: KindDef) => !!d.fixed && [...cur.objects.values()].some((o) => o.k === d.k);
  const footText = (o: Obj) => footOf(cur, o).join('×');
</script>

<div class="ed sheet-copy" class:phone data-editor data-tool={tool} data-layout={phone ? 'phone' : 'desktop'}>
  {#if !phone}
    <aside class="tools">
      <h1>島のエディター <small>{OWNER_NAME[me]}</small></h1>
      <div class="row" role="group" aria-label="tools">
        <button type="button" aria-pressed={tool === 'select'} onclick={() => setTool('select')} title="V">選択</button>
        <button type="button" aria-pressed={tool === 'paint'} onclick={() => setTool('paint')} title="B">塗る</button>
        <button type="button" aria-pressed={tool === 'cliff'} onclick={() => setTool('cliff')} title="C">崖</button>
        <button type="button" data-tool-river aria-pressed={tool === 'river'} onclick={() => setTool('river')} title="R（何も選んでいない時）">川の道</button>
      </div>
      {#if tool === 'river'}
        <p class="hint">川の点を動かして道を描き直します。始まりは池に、終わりは海か池につなぎます。崖を下る所は滝になります（1マス幅、本流だけ、崖はそのまま）</p>
      {/if}
      {@render toolOptions()}
      <h2>置く</h2>
      {@render palette()}
      <p class="hint">
        ドラッグで移動 · R / ホイールで回す（何も選んでいなければ R で川の道） · Delete で削除 · Cmd+Z / Cmd+Shift+Z · Cmd+C / Cmd+V · G でグリッド · スペース＋ドラッグでパン · ホイールでズーム · 0 で全体
      </p>
    </aside>
  {/if}

  <main class="plan" bind:this={wrap}>
    <canvas
      bind:this={canvas}
      data-plan
      style:cursor={space || drag?.mode === 'pan' ? 'grabbing' : tool === 'select' ? 'default' : 'crosshair'}
      onpointerdown={onDown}
      onpointermove={onMove}
      onpointerup={onUp}
      onpointercancel={onUp}
      onpointerleave={(e) => e.pointerType === 'mouse' && (hover = null)}
      onwheel={onWheel}
      oncontextmenu={(e) => e.preventDefault()}
    ></canvas>
    {#if tool === 'river'}
      <Lazy load={() => import('./RiverTool.svelte')}>
        {#snippet children(RiverTool)}
        <RiverTool
          layout={store.current}
          bind:view
          {W}
          {H}
          {grid}
          bind:show3d
          {icon}
          onpreview={(l) => (riverPreview = l)}
          oncommit={(next, said) => {
            commit(next, '川の道を変えた');
            setTool('select');
            say(said);
          }}
          onclose={() => setTool('select')} />
        {/snippet}
      </Lazy>
    {/if}
    {#if phone && show3d}
      <div class="p3d-full" data-preview-full><Preview3D layout={riverPreview ?? store.current} mode="orbit" /></div>
    {/if}
    {#if toast}<div class="toast" class:low={tool === 'river'} role="status">{toast}</div>{/if}
    {#if !phone}
      <div class="status" data-status>
        <span>送信 {sent}</span>
        {#if hover}<span>マス {hover[0]}, {hover[1]} · {BRUSH_NAME[cur.kind(hover[0], hover[1])]} {cur.tier(hover[0], hover[1])}段</span>{/if}
        <span class="live {badge.state}" data-live={badge.state} data-unsent={unsent}>{badge.text}</span>
      </div>
    {/if}
  </main>

  {#if !phone}
    <aside class="side">
      <div class="bar">{@render history()}</div>
      <label class="row small toggle"><input type="checkbox" bind:checked={show3d} /> 3D</label>
      {@render riverToggle()}
      {#if show3d}
        <div class="p3d"><Preview3D layout={riverPreview ?? store.current} mode="orbit" /></div>
      {/if}
      {@render inspector()}
      {@render islandPanel()}
    </aside>
  {:else if tool !== 'river'}
    <!-- a phone: the bar, the card or a sheet, the dock (docs/island-layout.md "The editor") -->
    <header class="top" bind:clientHeight={topH}>
      <h1>島のエディター</h1>
      <span class="live {badge.state}" data-live={badge.state} data-unsent={unsent}>{badge.short}</span>
      {@render history()}
      <button type="button" class="b3d" data-show3d aria-pressed={show3d} onclick={() => ((show3d = !show3d), (sheet = null))}>3D</button>
    </header>
    {#if sheet}
      <section class="sheet" data-sheet={sheet} aria-label={sheet === 'palette' ? '置く' : '島'}>
        <div class="shead">
          <h2>{sheet === 'palette' ? '置く' : '島'}</h2>
          <NavButton kind="close" onclick={() => (sheet = null)} data-sheet-close />
        </div>
        <div class="sbody">
          {#if sheet === 'palette'}{@render palette()}{:else}{@render riverToggle()}{@render islandPanel()}{/if}
        </div>
      </section>
    {:else if !show3d}
      <div class="card" data-card>
        {#if tool === 'select'}
          {#if selected.size}{@render inspector()}{:else}<p class="hint">タップで選ぶ · 選んだ物はドラッグで移動</p>{/if}
        {:else if tool === 'place' && placing}
          {@const iu = placing.icon ? iconUrl(placing.icon) : null}
          <div class="placing" data-placing={placing.k}>
            {#if iu}<img src={iu} alt="" />{/if}
            <strong>{labelOf(placing.k)}</strong>
            {#if placing.variants}
              <select bind:value={placeS} aria-label="種類">{#each placing.variants as v (v)}<option value={v}>{variantName(placing.k, v)}</option>{/each}</select>
            {/if}
            <button type="button" data-turn aria-label="回す" onclick={() => turnPlacing(1)}><Icon name="rotate" size={18} stroke={2.4} /></button>
            <button type="button" aria-label="置くのをやめる" onclick={() => setTool('select')}><Icon name="close" size={18} stroke={2.4} /></button>
          </div>
          <p class="hint"><Phrases text={runs(placing.k) ? 'タップで置く · ドラッグで続けて置く' : 'タップで置く · ドラッグで地図を動かす'} /></p>
        {:else}
          {@render toolOptions()}
        {/if}
      </div>
    {/if}
    {#if !sheet && !show3d}
      <button type="button" class="fit" data-fit aria-label="島の全体を見る" onclick={fitAll}><Icon name="map" size={18} stroke={2.4} /><span>全体</span></button>
    {/if}
    <nav class="dock" aria-label="道具" bind:clientHeight={dockH}>
      <button type="button" data-dock="select" aria-pressed={tool === 'select' && !sheet} onclick={() => setTool('select')}>選択</button>
      <button type="button" data-dock="place" aria-pressed={sheet === 'palette' || (tool === 'place' && !sheet)} onclick={() => (sheet === 'palette' ? (sheet = null) : ((show3d = false), (sheet = 'palette')))}>置く</button>
      <button type="button" data-dock="paint" aria-pressed={tool === 'paint' && !sheet} onclick={() => setTool('paint')}>塗る</button>
      <button type="button" data-dock="cliff" aria-pressed={tool === 'cliff' && !sheet} onclick={() => setTool('cliff')}>崖</button>
      <button type="button" data-dock="river" onclick={() => setTool('river')}>川</button>
      <button type="button" data-dock="island" aria-pressed={sheet === 'island'} onclick={() => (sheet = sheet === 'island' ? null : 'island')}>
        島{#if errors}<span class="dot bad" data-check-count>{errors}</span>{:else if warns}<span class="dot warn-n" data-check-count>{warns}</span>{/if}
      </button>
    </nav>
  {/if}
</div>
{#if picking}<HomePicker bind:open={picking} who={me} />{/if}
<ResetConfirm bind:open={confirmReset} onconfirm={resetAll} />

{#snippet history()}
  <button type="button" class="hist" data-undo onclick={undo} disabled={!undoStack.length} title="Cmd+Z" aria-label="取り消す"><Icon name="undo" size={18} stroke={2.4} /><span>取り消す</span></button>
  <button type="button" class="hist" data-redo onclick={redo} disabled={!redoStack.length} title="Cmd+Shift+Z" aria-label="やり直す"><span class="flip"><Icon name="undo" size={18} stroke={2.4} /></span><span>やり直す</span></button>
{/snippet}

{#snippet riverToggle()}
  <label class="row small toggle"><input type="checkbox" data-river-line bind:checked={riverLine} /> 川の線 <small>（3Dの島が描く川：曲がり角ごとのカーブと半径）</small></label>
{/snippet}

{#snippet palette()}
  <Palette {placing} bind:placeS {outdoorIn} {present} {iconUrl} onpick={pick} />
{/snippet}

{#snippet toolOptions()}
  {#if tool === 'paint'}
    <div class="brushes">
      {#each BRUSHES as k (k)}
        <button type="button" class="swatch" data-brush={k} aria-pressed={brush === k} onclick={() => (brush = k)} style:--c={`var(--k-${k})`}>{BRUSH_NAME[k]}</button>
      {/each}
    </div>
  {/if}
  {#if tool === 'cliff'}
    <div class="row">
      <button type="button" data-cliff="up" aria-pressed={cliffDir === 1} onclick={() => (cliffDir = 1)}>高く ▲</button>
      <button type="button" data-cliff="down" aria-pressed={cliffDir === -1} onclick={() => (cliffDir = -1)}>低く ▼</button>
    </div>
  {/if}
  {#if tool === 'paint' || tool === 'cliff'}
    <div class="row small">ブラシの大きさ
      {#each [1, 2, 3] as n (n)}<button type="button" data-size={n} aria-pressed={size === n} onclick={() => (size = n)} title={String(n)}>{n}</button>{/each}
    </div>
  {/if}
{/snippet}

{#snippet inspector()}
    {#if one}
      {@const d = kindDef(one.k)}
      <section class="inspect" data-inspect>
        <div class="ihead"><h2>{labelOf(one.k, one.id)} <small>{footText(one)}<span class="oid"> · {one.id}</span></small></h2>{@render deselect()}</div>
        {#if one.k === 'field'}
          {@const f = fieldOf(one.s)}
          {@const planted = plantsOn(one)}
          <!-- a field (layout/field.ts, docs/farming.md): its size -->
          <label class="row small">横 <input data-field-w type="number" min="1" max={FIELD_MAX} value={f.w} onchange={(e) => setVariant(fieldS({ ...f, w: Number((e.target as HTMLInputElement).value) || 1 }))} /></label>
          <label class="row small">奥行き <input data-field-d type="number" min="1" max={FIELD_MAX} value={f.d} onchange={(e) => setVariant(fieldS({ ...f, d: Number((e.target as HTMLInputElement).value) || 1 }))} /></label>
          {#if planted}<p class="small" data-field-plants>作物があります（{planted}株）。削除しても作物は記録に残ります。</p>{/if}
        {:else if d?.variants && one.k !== 'goal-tree' && one.k !== 'spot'}
          <label class="row small">種類
            <select value={one.s ?? d.variants[0]} onchange={(e) => setVariant((e.target as HTMLSelectElement).value)}>
              {#each d.variants as v (v)}<option value={v}>{variantName(d.k, v)}</option>{/each}
            </select>
          </label>
        {/if}
        {@render actions(!removable(one))}
      </section>
    {:else if selected.size > 1}
      <section class="inspect" data-inspect>
        <div class="ihead"><h2>{selected.size}個選択中</h2>{@render deselect()}</div>
        {@render actions(false)}
      </section>
    {/if}
{/snippet}

{#snippet actions(fixed: boolean)}
  <div class="row acts">
    <button type="button" data-turn onclick={turnSel}><Icon name="rotate" size={16} stroke={2.4} />回す</button>
    <button type="button" data-duplicate disabled={fixed} onclick={duplicateSel}><Icon name="plus" size={16} stroke={2.4} />複製</button>
    <button type="button" data-delete disabled={fixed} onclick={removeSel}><Icon name="trash" size={16} stroke={2.4} />削除</button>
    {#if phone}<button type="button" data-multi aria-pressed={multi} onclick={() => (multi = !multi)}>複数</button>{/if}
  </div>
{/snippet}

{#snippet deselect()}
  <NavButton kind="close" label="選択を解除" onclick={() => ((selected = new Set()), (multi = false))} data-deselect />
{/snippet}

{#snippet islandPanel()}
  <IslandSize layout={cur} {pending} {selected} bind:hover={sizeHover} onresize={resizeBy} onshow={showObj} oncancel={() => (pending = null)} />
  <IssueList {issues} {focus} onshow={showIssue} undrawn={drawCheckOn ? undrawnList : undefined} {stems} onpick={(id) => (selected = new Set([id]))} />
  <section class="mine" data-my-home>
    <h2>自分の家 <small data-my-home-name>{t(`homes.model.${store.home(me).m}`)}</small></h2>
    <button type="button" data-home-look onclick={() => (picking = true)}>家を変更</button>
  </section>
  <section class="file">
    <div class="row">
      <button type="button" onclick={exportJson}>JSONに書き出す</button>
      <button type="button" onclick={() => fileInput?.click()}>JSONを読み込む</button>
      <input type="file" accept="application/json,.json" bind:this={fileInput} onchange={importJson} hidden />
    </div>
    <button type="button" class="danger" data-reset onclick={() => (confirmReset = true)}>最初の島に戻す…</button>
  </section>
{/snippet}

<style>
  .ed {
    position: fixed; inset: 0; display: grid; grid-template-columns: 280px 1fr 340px; background: var(--c-paper); color: var(--c-ink);
    font-family: 'Zen Maru Gothic', system-ui, sans-serif; user-select: none;
    --k-grass: #80c462; --k-sand: #f1d99a; --k-dirt: #c9a26b; --k-stone: #b4b0a6; --k-brick: #c56d50; --k-plank: #b98a55; --k-river: #5ab4ec; --k-pond: #4aa6e0; --k-sea: #3f8fd8;
  }
  aside { overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .tools { border-right: 2px solid var(--c-lip); }
  .side { border-left: 2px solid var(--c-lip); }
  h1 { font-size: 18px; margin: 0; }
  h1 small, h2 small { font-size: 12px; color: var(--c-ink-soft); font-weight: 500; margin-left: 6px; }
  h2 { font-size: 15px; margin: 4px 0 0; }
  .row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .row button { display: inline-flex; align-items: center; gap: 4px; }
  .small { font-size: 13px; }
  /* (the editor's controls, its parts' too: Palette, IslandSize, IssueList; never the kit's NavButton) */
  :global(:where(.ed) button:not(.disc)) {
    font: inherit; font-weight: 700; font-size: 13px; color: var(--c-ink); background: var(--c-card); border: 2px solid var(--c-edge);
    border-radius: 10px; padding: 6px 10px; cursor: pointer;
  }
  :global(:where(.ed) button:not(.disc)[aria-pressed='true']) { background: var(--c-yuzu); }
  :global(:where(.ed) button:not(.disc):disabled) { opacity: 0.45; cursor: default; }
  .ed .danger { border-color: #c4553f; color: #a23a26; }
  .brushes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .ed .swatch { background: var(--c); color: #2c2218; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5); }
  .ed .swatch[aria-pressed='true'] { outline: 3px solid var(--c-ink); background: var(--c); }
  .hint { font-size: 13px; color: var(--c-ink-soft); line-height: 1.5; margin: 0; }
  .plan { position: relative; overflow: hidden; }
  canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  .toast {
    position: absolute; left: 50%; top: 14px; transform: translateX(-50%); background: var(--c-cream); border: 2px solid var(--c-edge);
    border-radius: 999px; padding: 6px 16px; font-weight: 700; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18); z-index: 5; white-space: nowrap;
  }
  .toast.low { top: 70px; z-index: 3; }
  .status {
    position: absolute; left: 10px; bottom: 10px; display: flex; gap: 12px; font-size: 12px; background: rgba(255, 249, 227, 0.9);
    border-radius: 999px; padding: 4px 12px; font-weight: 700;
  }
  .p3d { height: 260px; border-radius: 12px; overflow: hidden; border: 2px solid var(--c-lip); }
  .bar { display: flex; gap: 6px; }
  .hist { display: inline-flex; align-items: center; gap: 4px; }
  .flip { display: inline-flex; transform: scaleX(-1); }
  .inspect, .file, .mine { background: var(--c-card); border-radius: 12px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
  .ihead { display: flex; align-items: center; gap: 6px; }
  .ihead h2 { flex: 1; min-width: 0; margin: 0; }


  /* ---- a phone: the plan full-bleed, the bar over it, the card or a sheet over the dock ---- */
  .ed.phone { display: block; --dock-h: calc(62px + var(--safe-bottom)); }
  .phone .plan { position: absolute; inset: 0; }
  .phone :global(button:not(.disc)) { min-height: 44px; font-size: 14px; }
  .phone :global(select), .phone :global(input:not([type='checkbox'])) { font-size: 16px; min-height: 44px; }
  .phone .toast { top: calc(var(--ui-top) + 66px); max-width: calc(100% - 24px); white-space: normal; text-align: center; }
  .top {
    position: absolute; top: 0; left: 0; right: 0; z-index: 3; display: flex; align-items: center; gap: 6px;
    padding: calc(var(--ui-top) + 6px) calc(10px + var(--safe-right)) 6px calc(14px + var(--safe-left));
    background: color-mix(in srgb, var(--c-paper) 94%, transparent); border-bottom: 2px solid var(--c-lip);
  }
  .top h1 { font-size: 16px; margin-right: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .live { white-space: nowrap; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
  .live::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #e2553d; flex: none; }
  .live.on::before { background: #3fae5a; }
  .live.wait::before { background: #d7a323; }
  .top .live { font-size: 13px; color: var(--c-ink-soft); flex: none; }
  .ed .fit {
    position: absolute; z-index: 3; top: calc(var(--ui-top) + 66px); right: calc(10px + var(--safe-right)); display: inline-flex; align-items: center; gap: 4px;
    border-radius: 999px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  }
  .sheet[data-sheet='palette'] { height: 62%; }
  .phone .hist { min-width: 44px; justify-content: center; padding: 6px; }
  .phone .hist span:not(.flip) { display: none; }
  .ed .b3d { min-width: 52px; }
  .dock {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px;
    padding: 7px calc(8px + var(--safe-right)) calc(var(--safe-bottom) + 7px) calc(8px + var(--safe-left));
    background: var(--c-paper); border-top: 2px solid var(--c-lip);
  }
  .ed .dock button { min-height: 48px; padding: 0; font-size: 15px; position: relative; }
  .dot { position: absolute; top: -6px; right: -4px; min-width: 20px; height: 20px; line-height: 20px; border-radius: 999px; font-size: 11px; padding: 0 5px; }
  .bad { background: #e2553d; color: #fff; }
  .warn-n { background: #d7a323; color: #2c2218; }
  .card {
    position: absolute; left: calc(8px + var(--safe-left)); right: calc(8px + var(--safe-right)); bottom: calc(var(--dock-h) + 8px); z-index: 3;
    display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; background: var(--c-paper); border: 2px solid var(--c-edge);
    border-radius: 16px; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18); max-height: 46%; overflow-y: auto;
  }
  .card .inspect { background: none; padding: 0; }
  .card .inspect h2 { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card .brushes { display: flex; overflow-x: auto; scrollbar-width: none; margin: 0 -12px; padding: 2px 12px; }
  .card .brushes::-webkit-scrollbar { display: none; }
  .card .swatch { flex: none; min-width: 60px; }
  .placing { display: flex; align-items: center; gap: 8px; }
  .placing img { width: 40px; height: 40px; object-fit: contain; flex: none; }
  .placing strong { font-size: 15px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .placing select { flex: 1; min-width: 0; }
  .placing button { min-width: 44px; padding: 6px; display: inline-flex; align-items: center; justify-content: center; }
  .acts button { flex: 1 1 auto; justify-content: center; }
  .phone .acts { display: grid; grid-template-columns: repeat(auto-fit, minmax(64px, 1fr)); }
  .phone .acts button { padding: 4px; }
  .phone .oid { display: none; }
  .sheet {
    position: absolute; left: 0; right: 0; bottom: var(--dock-h); z-index: 3; max-height: 62%; display: flex; flex-direction: column;
    background: var(--c-paper); border-top: 2px solid var(--c-lip); border-radius: 18px 18px 0 0; box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.16);
  }
  .shead { display: flex; align-items: center; justify-content: space-between; padding: 4px calc(4px + var(--safe-right)) 0 calc(14px + var(--safe-left)); min-height: 48px; }
  .shead h2 { margin: 0; font-size: 18px; }
  .sbody {
    overflow-y: auto; overscroll-behavior: contain; padding: 0 calc(12px + var(--safe-right)) 14px calc(12px + var(--safe-left));
    display: flex; flex-direction: column; gap: 10px;
  }
  .toggle { min-height: 32px; }
  .phone .toggle { min-height: 44px; }
  /* (no page zoom from a pinch on the chrome; the card and the sheets scroll) */
  .phone :is(.top, .dock) { touch-action: none; }
  .phone :is(.card, .sbody) { touch-action: pan-y; }
  .phone .toggle small { display: none; }
  .toggle input { width: 20px; height: 20px; }
  .p3d-full { position: absolute; inset: 0; z-index: 2; }
</style>
