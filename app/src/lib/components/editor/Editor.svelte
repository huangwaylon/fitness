<script lang="ts">
  // The island's layout editor (docs/island-layout.md "The editor"): for a big screen, a mouse and a keyboard, the
  // members' only. The plan (plan.ts) top-down, the back of the island at the top; the 3D preview beside it (the
  // island's own ground and models); the palette, the brushes, the cliffs; what's wrong, live (validate.ts). Every
  // finished action goes out at once as layout ops (store/layout.svelte.ts: the record and the relay), so the phones
  // see it as it's made; undo reverts one action over whatever the island is now.
  import { onMount, untrack } from 'svelte';
  import { layout as store } from '#lib/store/layout.svelte.ts';
  import { KIND_LIST, kindDef, type KindDef } from '#lib/layout/catalog.ts';
  import { GRID, PATHS, TILE, type Kind } from '#lib/layout/grid.ts';
  import { extentOf, fromJson, footOf, objMid, opsBetween, toJson, type Layout, type Obj } from '#lib/layout/model.ts';
  import { validate, type Issue } from '#lib/layout/validate.ts';
  import { riverStems } from '#lib/layout/river.ts';
  import { EDGES, landSize, resizedCodes, type Blocker, type Edge } from '#lib/layout/resize.ts';
  import { artUrl } from '#lib/art.ts';
  import type { Live } from '#lib/sync/live.ts';
  import Preview3D from './Preview3D.svelte';
  import type { Undrawn } from '../world3d/drawCheck.ts';
  import HomePicker from '../homes/HomePicker.svelte';
  import ResetConfirm from './ResetConfirm.svelte';
  import { draw, fitView, tileUnder, toScreen, toWorld, zoomAt, type View } from './plan.ts';
  import {
    brushTiles, cliff, copy, ghostFoot, inBox, move, objectAt, paint, paste, place, remove, removable, resize, restyle, revert, rotate, sameLayout, wetAt, type Clip
  } from './edits.ts';

  let { me, relay }: { me: 'A' | 'B' | 'G'; relay: Live | null } = $props();

  type Tool = 'select' | 'paint' | 'cliff' | 'place';
  let tool = $state<Tool>('select');
  let brush = $state<Kind>('grass');
  let size = $state(1);
  let cliffDir = $state<1 | -1>(1);
  let placing = $state<KindDef | null>(null);
  let placeS = $state<string | undefined>(undefined);
  let placeF = $state<0 | 1 | 2 | 3>(0);
  let grid = $state(true);
  // the 3D preview beside the plan (`?preview=0`: none, the e2e's: a software GL draws it at a frame every few seconds)
  let show3d = $state(new URLSearchParams(location.search).get('preview') !== '0');
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
  interface Action { before: Layout; after: Layout; label: string }
  let undoStack = $state<Action[]>([]);
  let redoStack = $state<Action[]>([]);

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
    if (sameLayout(before, next)) return;
    if (!send(next)) return;
    undoStack = [...undoStack.slice(-199), { before, after: next, label }];
    redoStack = [];
  }
  function undo(): void {
    const a = undoStack.at(-1);
    if (!a) return;
    undoStack = undoStack.slice(0, -1);
    send(revert(store.current, a.before, a.after));
    redoStack = [...redoStack, a];
    say(`取り消した: ${a.label}`);
  }
  function redo(): void {
    const a = redoStack.at(-1);
    if (!a) return;
    redoStack = redoStack.slice(0, -1);
    send(revert(store.current, a.after, a.before));
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
  function icon(key: string): HTMLImageElement | null {
    if (!key) return null;
    let im = icons.get(key);
    if (!im) {
      const url = artUrl(key);
      if (!url) return null;
      im = new Image();
      im.onload = () => iconRev++;
      im.src = url;
      icons.set(key, im);
    }
    return im;
  }

  interface Drag {
    mode: 'move' | 'box' | 'paint' | 'cliff' | 'pan';
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
  const ghost = $derived.by(() => {
    if (tool !== 'place' || !placing || !hover) return null;
    const [w, d] = ghostFoot(placing.k, placeF);
    const x = hover[0] - Math.floor((w - 1) / 2), z = hover[1] - Math.floor((d - 1) / 2);
    let ok = x >= 0 && z >= 0 && x + w <= GRID.cols && z + d <= GRID.rows;
    for (let j = 0; j < d && ok; j++) for (let i = 0; i < w && ok; i++) if (placing.k !== 'bridge' && (wetAt(cur, x + i, z + j) || cur.kind(x + i, z + j) === 'sea')) ok = false;
    return { k: placing.k, x, z, f: placeF, ok };
  });
  // しまの おおきさ: the land's size, which way each edge can go, the new coast's ghost (a stepper hovered, or a resize
  // waiting on what's in its way)
  const isle = $derived(landSize(cur));
  const room = $derived(Object.fromEntries(EDGES.map((e) => [e, { out: !!resizedCodes(cur, e, 1), in: !!resizedCodes(cur, e, -1) }])) as Record<Edge, { out: boolean; in: boolean }>);
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
    draw(ctx, { layout: cur, view, w: W, h: H, grid, selected, hover, moved, ghost, brush: brushAt, box, issues, focus, icon, river: riverLine ? stems : null, coast });
  });

  // the issues, a moment after a change
  let vTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    const l = store.current;
    clearTimeout(vTimer);
    vTimer = setTimeout(() => (issues = validate(l)), 120);
  });
  const errors = $derived(issues.filter((i) => i.level === 'error').length);

  // `?check`: what the phones' 3D island leaves undrawn of the layout, and why (world3d/drawCheck.ts), a moment after a change
  const drawCheckOn = new URLSearchParams(location.search).has('check');
  let undrawnList = $state<Undrawn[] | null>(null);
  let dTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    const l = store.current;
    if (!drawCheckOn) return;
    clearTimeout(dTimer);
    dTimer = setTimeout(() => void import('../world3d/drawCheck.ts').then(({ undrawn }) => (undrawnList = undrawn(l))), 200);
  });
  const WHY: Record<string, string> = {
    'unknown-kind': '不明な種類（unknown kind: nothing drawn）',
    card: '絵のカード（a card of 2D art, not a model）',
    'no-model': '何も描かれない（no model at all）',
    'model-missing': 'モデルのファイルがない（model file missing）'
  };

  // ---- the pointer ----
  const local = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = canvas!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  function onDown(e: PointerEvent) {
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const [px, py] = local(e);
    const tile = tileUnder(view, px, py);
    if (space || e.button === 1 || e.button === 2) {
      drag = { mode: 'pan', x: px, y: py, tile, view: { ...view } };
      return;
    }
    if (tool === 'paint' || tool === 'cliff') {
      const before = store.current;
      drag = { mode: tool, x: px, y: py, tile, before };
      stroke(tile);
      return;
    }
    if (tool === 'place') {
      if (!placing || !ghost) return;
      if (!ghost.ok) return say('そこには置けません');
      const fixedHere = placing.fixed && [...cur.objects.values()].some((o) => o.k === placing!.k && (o.s ?? '') === (placeS ?? placing!.variants?.[0] ?? ''));
      if (fixedHere) return say('これは島に1つだけです');
      const r = place(cur, placing.k, ghost.x, ghost.z, placeF, placeS, store.stamp());
      if (r) {
        commit(r.layout, `${placing.ja}を置いた`);
        if (placing.fixed) setTool('select');
      }
      return;
    }
    // select: an object picks it up (and its group if it's selected), empty ground starts a box
    const o = objectAt(cur, tile[0], tile[1]);
    if (o) {
      if (e.shiftKey || e.metaKey) {
        const s = new Set(selected);
        if (s.has(o.id)) s.delete(o.id);
        else s.add(o.id);
        selected = s;
        return;
      }
      if (!selected.has(o.id)) selected = new Set([o.id]);
      drag = { mode: 'move', x: px, y: py, tile, ids: [...selected], dc: 0, dr: 0, turn: 0, lastSent: 0 };
    } else {
      if (!e.shiftKey) selected = new Set();
      drag = { mode: 'box', x: px, y: py, tile };
    }
  }
  function stroke(tile: [number, number]) {
    const tiles = brushTiles(tile[0], tile[1], size);
    const base = work ?? store.current;
    work = tool === 'cliff' ? cliff(base, tiles, cliffDir) : paint(base, tiles, brush);
  }
  function onMove(e: PointerEvent) {
    const [px, py] = local(e);
    const tile = tileUnder(view, px, py);
    hover = tile[0] >= 0 && tile[1] >= 0 && tile[0] < GRID.cols && tile[1] < GRID.rows ? tile : null;
    if (!drag) return;
    if (drag.mode === 'pan') {
      view = { ...drag.view!, ox: drag.view!.ox + px - drag.x, oy: drag.view!.oy + py - drag.y };
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
    const d = drag;
    drag = null;
    if (!d) return;
    canvas?.releasePointerCapture(e.pointerId);
    if (d.mode === 'paint' || d.mode === 'cliff') {
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
      commit(next, d.ids.length > 1 ? `${d.ids.length}個動かした` : `${kindDef(store.current.objects.get(d.ids[0])?.k ?? '')?.ja ?? ''}を動かした`);
      for (const id of d.ids.slice(0, 8)) {
        const o = store.current.objects.get(id);
        if (o && relay) {
          const [mx, mz] = objMid(store.current, o);
          relay.send({ kind: 'drag', sc: 'o', id, x: Math.round(mx), z: Math.round(mz), f: o.f, end: true } as never);
        }
      }
    } else if (d.mode === 'box' && hover) {
      const ids = inBox(cur, d.tile[0], d.tile[1], hover[0], hover[1]);
      selected = new Set([...(e.shiftKey ? selected : []), ...ids]);
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
      if (Math.abs(e.deltaY) > 2) placeF = (((placeF + (e.deltaY > 0 ? 1 : 3)) % 4) as 0 | 1 | 2 | 3);
      return;
    }
    view = zoomAt(view, px, py, Math.exp(-e.deltaY * 0.0015));
  }

  // ---- the keyboard ----
  let clip: Clip | null = null;
  function onKey(e: KeyboardEvent) {
    if (confirmReset) return;
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
        if (drag?.mode === 'move') drag = null;
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
        if (tool === 'place') placeF = (((placeF + 1) % 4) as 0 | 1 | 2 | 3);
        else if (drag?.mode === 'move') drag = { ...drag, turn: ((drag.turn ?? 0) + 1) % 4 };
        else if (selected.size) turnSel();
        break;
      case 'Delete': case 'Backspace': {
        if (!selected.size) break;
        const fixed = [...selected].map((id) => cur.objects.get(id)).filter((o) => o && !removable(o));
        commit(remove(store.current, selected), `${selected.size - fixed.length}個削除した`);
        if (fixed.length) say(`${fixed.map((o) => kindDef(o!.k)?.ja).join('・')}は削除できません`);
        selected = new Set([...selected].filter((id) => store.current.objects.has(id)));
        break;
      }
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
        view = fitView(W, H, extentOf(store.current).land);
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
      if (who !== me) say(`${who === 'B' ? 'うめ' : who === 'A' ? 'ウェイ' : 'お客さん'}の家はその人だけが回せます`);
      else if (next.objects.get(id)?.f === store.current.objects.get(id)?.f) say('ここでは回せません（扉がふさがるため）');
    }
    commit(next, '回した');
  }
  function setTool(t: Tool) {
    tool = t;
    if (t !== 'place') placing = null;
  }
  function pick(def: KindDef) {
    placing = def;
    placeS = def.variants?.[0];
    placeF = 0;
    tool = 'place';
  }

  // ---- the panel ----
  const BRUSHES: Kind[] = ['grass', 'sand', ...PATHS, 'river', 'pond', 'sea'];
  const BRUSH_NAME: Record<Kind, string> = { grass: '草', sand: '砂', dirt: '土', stone: '石', brick: 'レンガ', plank: '板', river: '川', pond: '池', sea: '海' };
  const GROUPS: [string, string][] = [['tree', '木'], ['bush', '低木'], ['flower', '花'], ['rock', '岩'], ['light', '明かり'], ['furniture', '家具'], ['camp', 'キャンプ'], ['food', '食べ物'], ['gym', 'ジム'], ['season', '季節'], ['structure', '橋・坂'], ['building', '建物'], ['visitor', 'お客さん']];
  const one = $derived(selected.size === 1 ? (cur.objects.get([...selected][0]) ?? null) : null);
  function setVariant(s: string) {
    if (one) commit(restyle(store.current, one.id, s), '変更した');
  }
  const EDGE_NAME: Record<Edge, string> = { front: '手前', back: '奥', left: '左', right: '右' };
  /** An edge a tile out or in: one action, its ops one burst (commit); what's in the way listed instead, and 「うごかす」
   *  (`moveIn`) moves it inside first (a fixed piece never deleted: one with nowhere to go holds it). */
  function resizeBy(edge: Edge, by: number, moveIn = false) {
    const r = resize(store.current, edge, by, moveIn);
    const label = `島を${by > 0 ? '広げた' : '狭めた'}（${EDGE_NAME[edge]}）`;
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
  /** Select a piece and bring it to the middle of the plan. */
  function showObj(id: string) {
    const o = cur.objects.get(id);
    if (!o) return;
    selected = new Set([id]);
    const [mx, mz] = objMid(cur, o), [x, y] = toScreen(view, mx, mz);
    view = { ...view, ox: view.ox + W / 2 - x, oy: view.oy + H / 2 - y };
  }
  function showIssue(is: Issue) {
    focus = focus === is ? null : is;
    if (is.ids.length) selected = new Set(is.ids.filter((id) => cur.objects.has(id)));
    const t = is.tiles[0];
    if (t) {
      const [x, y] = toScreen(view, GRID.x0 + (t[0] + 0.5) * TILE, GRID.z0 + (t[1] + 0.5) * TILE);
      view = { ...view, ox: view.ox + W / 2 - x, oy: view.oy + H / 2 - y };
    }
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
    undoStack = [...undoStack, { before, after: store.current, label: '最初の島に戻した' }];
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
    // the front of the island in view at the start, a tile ~27px
    const fit = untrack(() => fitView(W, H, extentOf(store.current).land));
    view = zoomAt(fit, W / 2, H - 20, 0.9 / fit.s);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.__editor = {
      view: () => view, layout: () => store.current, select: (ids: string[]) => (selected = new Set(ids)), issues: () => issues, undrawn: () => undrawnList,
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
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      delete window.__editor;
    };
  });

  const palette = (g: string) => KIND_LIST.filter((d) => d.group === g && !d.hidden);
  const present = (d: KindDef) => d.fixed && [...cur.objects.values()].some((o) => o.k === d.k);
  const footText = (o: Obj) => footOf(cur, o).join('×');
</script>

<div class="ed sheet-copy" data-editor data-tool={tool}>
  <aside class="tools">
    <h1>島のエディター <small>{me === 'A' ? 'ウェイ' : me === 'B' ? 'うめ' : 'お客さん'}</small></h1>
    <div class="row" role="group" aria-label="tools">
      <button type="button" aria-pressed={tool === 'select'} onclick={() => setTool('select')} title="V">選択</button>
      <button type="button" aria-pressed={tool === 'paint'} onclick={() => setTool('paint')} title="B">塗る</button>
      <button type="button" aria-pressed={tool === 'cliff'} onclick={() => setTool('cliff')} title="C">崖</button>
    </div>
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
        {#each [1, 2, 3] as n (n)}<button type="button" aria-pressed={size === n} onclick={() => (size = n)} title={String(n)}>{n}</button>{/each}
      </div>
    {/if}
    <h2>置く</h2>
    <div class="palette">
      {#each GROUPS as [g, name] (g)}
        <div class="group">
          <span class="gname">{name}</span>
          <div class="items">
            {#each palette(g) as d (d.k)}
              <button type="button" class="item" data-kind={d.k} aria-pressed={placing?.k === d.k} disabled={present(d)} title={`${d.ja} · ${d.en}${present(d) ? '（島にある）' : ''}`} onclick={() => pick(d)}>
                {#if d.icon && artUrl(d.icon)}<img src={artUrl(d.icon)} alt="" />{:else}<span class="glyph">{d.k === 'stairs' ? '⛰' : d.k === 'board' ? '📋' : '・'}</span>{/if}
                <span class="lbl">{d.ja}</span>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    {#if placing?.variants}
      <label class="row small">種類
        <select bind:value={placeS}>{#each placing.variants as v (v)}<option value={v}>{v}</option>{/each}</select>
      </label>
    {/if}
    <p class="hint">
      ドラッグで移動 · R / ホイールで回す · Delete で削除 · Cmd+Z / Cmd+Shift+Z · Cmd+C / Cmd+V · G でグリッド · スペース＋ドラッグでパン · ホイールでズーム · 0 で全体
    </p>
  </aside>

  <main class="plan" bind:this={wrap}>
    <canvas
      bind:this={canvas}
      data-plan
      style:cursor={space || drag?.mode === 'pan' ? 'grabbing' : tool === 'select' ? 'default' : 'crosshair'}
      onpointerdown={onDown}
      onpointermove={onMove}
      onpointerup={onUp}
      onpointercancel={onUp}
      onpointerleave={() => (hover = null)}
      onwheel={onWheel}
      oncontextmenu={(e) => e.preventDefault()}
    ></canvas>
    {#if toast}<div class="toast" role="status">{toast}</div>{/if}
    <div class="status" data-status>
      <span>送信 {sent}</span>
      {#if hover}<span>マス {hover[0]}, {hover[1]} · {BRUSH_NAME[cur.kind(hover[0], hover[1])]} {cur.tier(hover[0], hover[1])}段</span>{/if}
      <span>{relay ? 'ライブ' : 'オフライン'}</span>
    </div>
  </main>

  <aside class="side">
    <div class="bar">
      <button type="button" onclick={undo} disabled={!undoStack.length} title="Cmd+Z">↶ 取り消す</button>
      <button type="button" onclick={redo} disabled={!redoStack.length} title="Cmd+Shift+Z">↷ やり直す</button>
    </div>
    <label class="row small"><input type="checkbox" bind:checked={show3d} /> 3D</label>
    <label class="row small"><input type="checkbox" data-river-line bind:checked={riverLine} /> 川の線 <small>(the river as the 3D island draws it: each turn's arc and its radius)</small></label>
    {#if show3d}
      <div class="p3d"><Preview3D layout={store.current} mode="orbit" /></div>
    {/if}
    {#if one}
      {@const d = kindDef(one.k)}
      <section class="inspect" data-inspect>
        <h2>{d?.ja} <small>{d?.en} · {footText(one)} · {one.id}</small></h2>
        {#if d?.variants && one.k !== 'goal-tree' && one.k !== 'spot'}
          <label class="row small">種類
            <select value={one.s ?? d.variants[0]} onchange={(e) => setVariant((e.target as HTMLSelectElement).value)}>
              {#each d.variants as v (v)}<option value={v}>{v}</option>{/each}
            </select>
          </label>
        {/if}
        <div class="row">
          <button type="button" data-turn onclick={turnSel}>↻ 回す</button>
          <button type="button" disabled={!removable(one)} onclick={() => commit(remove(store.current, selected), '削除した')}>🗑 削除</button>
        </div>
      </section>
    {:else if selected.size > 1}
      <section class="inspect"><h2>{selected.size}個選択中</h2>
        <div class="row">
          <button type="button" onclick={turnSel}>↻ 回す</button>
          <button type="button" onclick={() => commit(remove(store.current, selected), '削除した')}>🗑 削除</button>
        </div>
      </section>
    {/if}
    <section class="size" data-island-size>
      <h2>島の大きさ <small data-size-readout>{isle.cols} × {isle.rows}</small></h2>
      <div class="edges">
        {#each EDGES as e (e)}
          <div class="edge" data-edge={e}>
            <span class="ename">{EDGE_NAME[e]}</span>
            {#each [-1, 1] as by (by)}
              <button
                type="button"
                data-resize={e}
                data-by={by}
                disabled={!room[e][by > 0 ? 'out' : 'in']}
                aria-label={`${EDGE_NAME[e]}を1マス${by > 0 ? '広げる' : '狭める'}`}
                title={`${EDGE_NAME[e]}を1マス${by > 0 ? '広げる' : '狭める'}`}
                onpointerenter={() => (sizeHover = { edge: e, by })}
                onpointerleave={() => (sizeHover = null)}
                onclick={() => resizeBy(e, by)}>{by > 0 ? '＋' : '−'}</button>
            {/each}
          </div>
        {/each}
      </div>
      {#if pending}
        {@const p = pending}
        <div class="blocked" data-resize-blocked>
          <p>{EDGE_NAME[p.edge]}を{p.by > 0 ? '広げる' : '狭める'}には邪魔な物があります（{p.blocked.length}個）<small>★は消せない物: 動かすのみ</small></p>
          <ul>
            {#each p.blocked as b (b.id)}
              <li><button type="button" data-blocker={b.id} class:stuck={p.stuck.includes(b.id)} aria-pressed={selected.has(b.id)} onclick={() => showObj(b.id)}>{b.fixed ? '★ ' : ''}{kindDef(b.k)?.ja ?? b.k}<small>{b.id}{p.stuck.includes(b.id) ? ' · 動かせない' : ''}</small></button></li>
            {/each}
          </ul>
          <div class="row">
            <button type="button" data-resize-move onclick={() => resizeBy(p.edge, p.by, true)}>動かす</button>
            <button type="button" onclick={() => (pending = null)}>キャンセル</button>
          </div>
        </div>
      {/if}
    </section>
    <section class="issues" data-issues>
      <h2>チェック {#if errors}<span class="bad">{errors}</span>{:else}<span class="good">OK</span>{/if}</h2>
      <ul>
        {#each issues as is, i (i)}
          <li><button type="button" class={is.level} aria-pressed={focus === is} onclick={() => showIssue(is)}>{is.ja}<small>{is.en}</small></button></li>
        {/each}
      </ul>
    </section>
    {#if drawCheckOn}
      <section class="issues" data-draw-check>
        <h2>3Dのチェック {#if undrawnList === null}…{:else if undrawnList.length}<span class="bad">{undrawnList.length}</span>{:else}<span class="good">OK</span>{/if}</h2>
        <ul>
          {#each undrawnList ?? [] as u (u.id + u.why)}
            <li><button type="button" class="error" onclick={() => (selected = new Set([u.id]))}>{u.id}（{kindDef(u.k)?.ja ?? u.k}）{u.x}, {u.z}<small>{WHY[u.why]}{u.detail ? `: ${u.detail}` : ''} · {u.seasons.join(' ')}</small></button></li>
          {/each}
        </ul>
        <h3>川のカーブ <small>(the river's turns, drawn on the plan in orange)</small></h3>
        <ul data-river-arcs>
          {#each stems as s, i (i)}
            {#each s.arcs as a, j (j)}
              <li class="arc">R {(a.r / TILE).toFixed(1)}マス · {Math.round(a.deg)}°<small>マス {Math.floor((a.x0 - GRID.x0) / TILE)}, {Math.floor((a.z0 - GRID.z0) / TILE)} → {Math.floor((a.x1 - GRID.x0) / TILE)}, {Math.floor((a.z1 - GRID.z0) / TILE)}</small></li>
            {:else}
              <li class="arc"><small>まっすぐ (no turns)</small></li>
            {/each}
          {/each}
        </ul>
      </section>
    {/if}
    <section class="mine" data-my-home>
      <h2>自分の家 <small>{store.home(me).m === 'house' ? `${store.home(me).w} · ${store.home(me).r} · ${store.home(me).d}` : store.home(me).m}</small></h2>
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
  </aside>
</div>
{#if picking}<HomePicker bind:open={picking} who={me} />{/if}
<ResetConfirm bind:open={confirmReset} onconfirm={resetAll} />

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
  .small { font-size: 13px; }
  button {
    font: inherit; font-weight: 700; font-size: 13px; color: var(--c-ink); background: var(--c-card); border: 2px solid var(--c-edge);
    border-radius: 10px; padding: 6px 10px; cursor: pointer;
  }
  button[aria-pressed='true'] { background: var(--c-yuzu); }
  button:disabled { opacity: 0.45; cursor: default; }
  .danger { border-color: #c4553f; color: #a23a26; }
  .brushes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .swatch { background: var(--c); color: #2c2218; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5); }
  .swatch[aria-pressed='true'] { outline: 3px solid var(--c-ink); background: var(--c); }
  .palette { display: flex; flex-direction: column; gap: 8px; }
  .gname { font-size: 12px; color: var(--c-ink-soft); font-weight: 700; }
  .items { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 2px; border-radius: 8px; border-width: 1.5px; }
  .item img { width: 38px; height: 38px; object-fit: contain; }
  .glyph { font-size: 26px; line-height: 38px; height: 38px; }
  .lbl { font-size: 10px; font-weight: 500; line-height: 1.15; text-align: center; max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hint { font-size: 11px; color: var(--c-ink-soft); line-height: 1.5; margin: 0; }
  .plan { position: relative; overflow: hidden; }
  canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  .toast {
    position: absolute; left: 50%; top: 14px; transform: translateX(-50%); background: var(--c-cream); border: 2px solid var(--c-edge);
    border-radius: 999px; padding: 6px 16px; font-weight: 700; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
  }
  .status {
    position: absolute; left: 10px; bottom: 10px; display: flex; gap: 12px; font-size: 12px; background: rgba(255, 249, 227, 0.9);
    border-radius: 999px; padding: 4px 12px; font-weight: 700;
  }
  .p3d { height: 260px; border-radius: 12px; overflow: hidden; border: 2px solid var(--c-lip); }
  .bar { display: flex; gap: 6px; }
  .edges { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; }
  .edge { display: flex; align-items: center; gap: 4px; }
  .ename { font-size: 13px; font-weight: 700; min-width: 3.2em; }
  .edge button { padding: 2px 10px; min-width: 34px; }
  .blocked { background: #fff8e2; border: 2px solid #d7a323; border-radius: 10px; padding: 6px 8px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
  .blocked p { margin: 0; }
  .blocked p small { display: block; font-size: 11px; color: var(--c-ink-soft); }
  .blocked ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; max-height: 180px; overflow-y: auto; }
  .blocked li button { width: 100%; text-align: left; font-weight: 600; display: flex; justify-content: space-between; gap: 6px; border-width: 1.5px; }
  .blocked li button small { font-size: 11px; color: var(--c-ink-soft); font-weight: 400; }
  .blocked li button.stuck { border-color: #d0533c; background: #fff0ec; }
  .inspect, .issues, .file, .mine, .size { background: var(--c-card); border-radius: 12px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
  .issues ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; max-height: 240px; overflow-y: auto; }
  .issues li button { width: 100%; text-align: left; font-weight: 500; display: flex; flex-direction: column; gap: 1px; border-width: 1.5px; }
  .issues li button small { font-size: 11px; color: var(--c-ink-soft); }
  .issues h3 { font-size: 13px; margin: 8px 0 4px; }
  .issues li.arc { display: flex; flex-direction: column; font-size: 13px; color: #a34a00; font-weight: 600; }
  .issues li.arc small { font-size: 11px; color: var(--c-ink-soft); font-weight: 400; }
  .issues .error { border-color: #d0533c; background: #fff0ec; }
  .issues .warn { border-color: #d7a323; background: #fff8e2; }
  .bad { background: #e2553d; color: #fff; border-radius: 999px; padding: 0 8px; font-size: 12px; }
  .good { background: var(--c-leaf); color: #fff; border-radius: 999px; padding: 0 8px; font-size: 12px; }
</style>
