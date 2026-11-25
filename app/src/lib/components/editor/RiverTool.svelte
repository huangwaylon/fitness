<script lang="ts">
  // 川の道 (docs/island-layout.md "The river tool"): the editor's tool for the main river's path, over the plan. Its
  // knots (layout/riverPath.ts pathOf: from the tiles each time it opens) are dragged a tile at a time, the end pulled to
  // the coast or a pond's edge, the start to a pond (the spring); a click on a segment or its "+" adds a knot there (and
  // holds it), Delete/Backspace, a right-click or 点を消す takes one away (a fall's pair together); ⌘Z / ⇧⌘Z step its
  // own history; a drag on open ground pans, the wheel zooms. A finger (planFingers.ts): a tap picks a knot or adds one,
  // a drag moves a knot or pans, two pinch. Every move routes the path, paints it
  // (the tiles only) and checks it (red holds ✓, amber is a note); a moment after the pointer lifts, the whole save is
  // worked out (what moves aside, the bridges: amber arrows) and handed to the 3D preview. ✓ sends it as one action
  // (the editor's commit: one burst of chunk and object ops, one ⌘Z). The editor imports it when the tool opens.
  import { onMount, untrack } from 'svelte';
  import { GRID, TILE, kindOf } from '#lib/layout/grid.ts';
  import { defaultLayout, objMid, type Layout } from '#lib/layout/model.ts';
  import { kindDef } from '#lib/layout/catalog.ts';
  import { riverStems } from '#lib/layout/river.ts';
  import type { Issue } from '#lib/layout/validate.ts';
  import { applyPath, paintPath, pathOf, pullEnd, pullStart, route, sameKnots, tileOf, type Applied, type Knot, type RiverIssue, type RiverPath } from '#lib/layout/riverPath.ts';
  import { testHooks } from '#lib/ui-state/testMode.ts';
  import { planFingers } from './planFingers.ts';
  import { draw, drawRiverHandles, plusTile, riverHit, tileUnder, toScreen, zoomAt, type RiverHit, type View } from './plan.ts';

  interface Props {
    /** The island as it is now (the store's). */
    layout: Layout;
    view: View;
    W: number;
    H: number;
    grid: boolean;
    show3d: boolean;
    icon(key: string): HTMLImageElement | null;
    /** The save worked out, for the 3D preview (null: the island as it is). */
    onpreview(l: Layout | null): void;
    /** ✓: the new island, and the line that says what moved. */
    oncommit(next: Layout, said: string): void;
    onclose(): void;
  }
  let { layout, view = $bindable(), W, H, grid, show3d = $bindable(), icon, onpreview, oncommit, onclose }: Props = $props();

  // the river as it was when the tool opened (the knots' first base), and the default's (最初の川)
  const at0 = untrack(() => layout), was0 = pathOf(at0);
  let opened = $state.raw<Layout>(at0);
  let was = $state.raw<RiverPath | null>(was0);
  const first = pathOf(defaultLayout());
  let knots = $state.raw<Knot[]>(was0?.knots ?? first?.knots ?? []);
  let undoS = $state.raw<Knot[][]>([]);
  let redoS = $state.raw<Knot[][]>([]);
  let selected = $state<number | null>(null);
  let hover = $state<RiverHit | null>(null);
  let listOpen = $state(false);
  let note = $state<string | null>(null);

  // the path, its tiles painted (each move: cheap), its checks
  const routed = $derived(route(knots, [was, first], layout, was));
  const painted = $derived(paintPath(layout, was, routed));
  const stems = $derived(riverStems(painted));
  // the whole save a moment after the pointer lifts (what moves aside, the bridges): for these knots only
  let full = $state.raw<{ knots: Knot[]; on: Layout; a: Applied } | null>(null);
  const fresh = $derived(full && full.knots === knots && full.on === layout ? full.a : null);
  const issues = $derived<RiverIssue[]>(fresh ? fresh.issues : routed.issues);
  const reds = $derived(issues.filter((i) => i.level === 'red'));
  const ambers = $derived(issues.filter((i) => i.level === 'amber'));
  const changed = $derived(!was || routed.tiles.length !== was.tiles.length || routed.tiles.some((t, i) => t !== was!.tiles[i]));
  // the partner changed the river under the tool
  const riverKey = (l: Layout) => {
    let s = '';
    for (let i = 0; i < l.codes.length; i++) if (kindOf(l.codes[i]) === 'river') s += `${i},`;
    return s;
  };
  const moved = $derived(riverKey(layout) !== riverKey(opened));

  let held = $state<number | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** The whole save, worked out 300 ms after the last change while nothing's held. */
  $effect(() => {
    const ks = knots, l = layout, r = routed;
    if (held !== null) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const a = applyPath(l, was, r);
      full = { knots: ks, on: l, a };
      onpreview(changed ? a.layout : null);
    }, 300);
    return () => clearTimeout(timer);
  });

  // ---- history (knot lists, 100 steps) ----
  function set(next: Knot[], push = true): void {
    if (sameKnots(next, knots)) return;
    if (push) {
      undoS = [...undoS.slice(-99), knots];
      redoS = [];
    }
    knots = next;
  }
  function undo(): void {
    const k = undoS.at(-1);
    if (!k) return;
    undoS = undoS.slice(0, -1);
    redoS = [...redoS, knots];
    knots = k;
    selected = null;
  }
  function redo(): void {
    const k = redoS.at(-1);
    if (!k) return;
    redoS = redoS.slice(0, -1);
    undoS = [...undoS, knots];
    knots = k;
    selected = null;
  }
  function backToOpened(): void {
    if (was) set(was.knots);
    selected = null;
  }
  function toFirst(): void {
    if (first) set(first.knots);
    selected = null;
  }
  function reread(): void {
    opened = layout;
    was = pathOf(layout);
    knots = was?.knots ?? knots;
    undoS = redoS = [];
    selected = null;
  }
  /** Take knot k away (a fall's pair together; two knots stay at least). */
  function removeKnot(k: number): void {
    const kn = knots[k];
    if (!kn) return;
    let drop = [k];
    if (kn.pin) drop = [k, knots[k - 1]?.pin ? k - 1 : k + 1].filter((i) => knots[i]?.pin);
    if (knots.length - drop.length < 2) return tell('点は2つ以上必要です');
    set(knots.filter((_, i) => !drop.includes(i)));
    selected = null;
  }
  let noteTimer: ReturnType<typeof setTimeout> | undefined;
  function tell(t: string): void {
    note = t;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => (note = null), 2400);
  }

  // ---- the plan ----
  let canvas = $state<HTMLCanvasElement>();
  const planIssues = $derived<Issue[]>(
    issues.map((i) => ({ code: 'water-edge', level: i.level === 'red' ? 'error' : 'warn', tiles: i.tiles.map(tileOf), ids: i.ids, ja: i.ja, en: i.ja }))
  );
  const ghosts = $derived.by(() => {
    if (!fresh) return { moved: undefined, arrows: [] };
    const m = new Map<string, { x: number; z: number; f: number }>(), arrows: { from: [number, number]; to: [number, number] }[] = [];
    for (const o of [...fresh.moved, ...fresh.bridges]) {
      const was0 = layout.objects.get(o.id);
      if (!was0) continue;
      const f = 'f' in o ? o.f : was0.f;
      m.set(o.id, { x: o.x, z: o.z, f });
      arrows.push({ from: objMid(layout, was0), to: objMid(fresh.layout, fresh.layout.objects.get(o.id) ?? was0) });
    }
    return { moved: m, arrows };
  });
  $effect(() => {
    const c = canvas, ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const dpr = devicePixelRatio || 1;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, { layout: painted, view, w: W, h: H, grid, selected: new Set(), hover: null, issues: planIssues, river: stems, moved: ghosts.moved, icon });
    drawRiverHandles(ctx, view, { knots, hover, selected, held, arrows: ghosts.arrows });
  });

  // ---- the pointer ----
  let drag: { mode: 'knot' | 'pan'; x: number; y: number; k?: number; before?: Knot[]; view?: View; moved?: boolean } | null = null;
  let space = false;
  let panning = $state(false);
  const local = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = canvas!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  /** Knot k on tile (c, r): the end pulled to an outlet, the start to a pond; on the grid. */
  function place(k: number, c: number, r: number): Knot[] {
    c = Math.max(0, Math.min(GRID.cols - 1, c));
    r = Math.max(0, Math.min(GRID.rows - 1, r));
    if (k === knots.length - 1) [c, r] = pullEnd(layout, c, r, was);
    else if (k === 0) [c, r] = pullStart(layout, c, r, was);
    return knots.map((q, i) => (i === k ? { c, r } : q));
  }
  const fingers = planFingers({
    local: (x, y) => local({ clientX: x, clientY: y }),
    view: () => view,
    setView: (v) => (view = v),
    // a tap: a knot picked (点を消す takes it away), one added on a segment, open ground lets go
    tap: (px, py) => {
      const hit = riverHit(view, knots, px, py);
      if (hit?.kind === 'knot') selected = hit.k;
      else if (hit) (grab(hit, px, py), lift());
      else selected = null;
    },
    grab: (px, py) => {
      const hit = riverHit(view, knots, px, py);
      return !!hit && grab(hit, px, py);
    },
    drag: (px, py) => dragTo(tileUnder(view, px, py)),
    release: (done) => {
      if (done) return lift();
      // (a pinch took it: the knots as they were)
      if (drag?.before) knots = drag.before;
      drag = null;
      held = null;
      pending = null;
    }
  });
  function onDown(e: PointerEvent) {
    if (!canvas) return;
    // (a finger is the canvas's till it lifts without asking)
    if (e.pointerType !== 'mouse') return fingers.down(e);
    canvas.setPointerCapture(e.pointerId);
    const [px, py] = local(e);
    const hit = riverHit(view, knots, px, py);
    if (e.button === 2) {
      if (hit?.kind === 'knot') removeKnot(hit.k);
      return;
    }
    if (space || e.button === 1 || !hit) {
      if (!hit) selected = null;
      drag = { mode: 'pan', x: px, y: py, view: { ...view } };
      panning = true;
      return;
    }
    grab(hit, px, py);
  }
  /** A knot held (a segment or its "+": a knot added there, held); false for a fall's (the cliff places it). */
  function grab(hit: RiverHit, px: number, py: number): boolean {
    if (hit.kind === 'knot') {
      selected = hit.k;
      if (knots[hit.k].pin) return (tell('滝の位置は崖で決まります（点を消すで消せます）'), false);
      drag = { mode: 'knot', x: px, y: py, k: hit.k, before: knots };
      held = hit.k;
      return true;
    }
    const [c, r] = hit.kind === 'plus' ? plusTile(knots[hit.k], knots[hit.k + 1]) : hit.tile;
    const before = knots;
    knots = [...knots.slice(0, hit.k + 1), { c, r }, ...knots.slice(hit.k + 1)];
    selected = held = hit.k + 1;
    drag = { mode: 'knot', x: px, y: py, k: hit.k + 1, before, moved: true };
    return true;
  }
  let frame = 0;
  let pending: [number, number] | null = null;
  function onMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return fingers.move(e);
    const [px, py] = local(e);
    if (!drag) {
      hover = riverHit(view, knots, px, py);
      return;
    }
    if (drag.mode === 'pan') {
      view = { ...drag.view!, ox: drag.view!.ox + px - drag.x, oy: drag.view!.oy + py - drag.y };
      return;
    }
    dragTo(tileUnder(view, px, py));
  }
  /** The held knot toward a tile (a frame's routing at most: the last tile the pointer was on). */
  function dragTo(tile: [number, number]) {
    pending = tile;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!drag || drag.mode !== 'knot' || !pending) return;
      const next = place(drag.k!, ...pending);
      if (!sameKnots(next, knots)) {
        knots = next;
        drag.moved = true;
      }
    });
  }
  function onUp(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return e.type === 'pointercancel' ? fingers.cancel(e) : fingers.up(e);
    canvas?.releasePointerCapture(e.pointerId);
    lift();
  }
  /** The knot let go: one step of history for the whole drag (an insert and its drag one step too). */
  function lift() {
    const d = drag;
    drag = null;
    panning = false;
    if (!d || d.mode !== 'knot') return;
    cancelAnimationFrame(frame);
    frame = 0;
    if (pending) {
      const next = place(d.k!, ...pending);
      if (!sameKnots(next, knots)) knots = next;
      pending = null;
    }
    held = null;
    if (d.before && !sameKnots(d.before, knots)) {
      undoS = [...undoS.slice(-99), d.before];
      redoS = [];
    }
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const [px, py] = local(e);
    view = zoomAt(view, px, py, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
  }
  function onKey(e: KeyboardEvent) {
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
    if (cmd) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && selected !== null) {
      e.preventDefault();
      removeKnot(selected);
    } else if (e.key === 'Escape') {
      if (listOpen) listOpen = false;
      else if (selected !== null) selected = null;
      else onclose();
    } else if (e.key === 'Enter' && !reds.length && changed) save();
  }
  function onKeyUp(e: KeyboardEvent) {
    if (e.key === ' ') space = false;
  }
  // (the window left with space held: its keyup never comes)
  const onBlur = () => (space = false);

  /** Bring an issue's first tile to the middle of the plan. */
  function showIssue(i: RiverIssue) {
    listOpen = false;
    const t = i.tiles[0];
    if (t === undefined) return;
    const [c, r] = tileOf(t), [x, y] = toScreen(view, GRID.x0 + (c + 0.5) * TILE, GRID.z0 + (r + 0.5) * TILE);
    view = { ...view, ox: view.ox + W / 2 - x, oy: view.oy + H / 2 - y };
  }

  /** What moved, in words: 「木を3本・橋を1つ動かしました」. */
  function movedWords(a: Applied): string {
    const trees = a.moved.filter((m) => kindDef(m.k)?.group === 'tree').length, other = a.moved.length - trees;
    const parts = [trees ? `木を${trees}本` : '', other ? `物を${other}個` : '', a.bridges.length ? `橋を${a.bridges.length}つ` : ''].filter(Boolean);
    return parts.length ? `（${parts.join('・')}動かしました）` : '';
  }
  function save() {
    // over the island as it is now (a partner's change since stays, but for the river's own tiles)
    const r = route(knots, [was, first], layout, was);
    if (r.issues.some((i) => i.level === 'red')) return;
    const a = applyPath(layout, was, r);
    if (a.issues.some((i) => i.level === 'red')) {
      full = { knots, on: layout, a };
      return;
    }
    oncommit(a.layout, `川を変えました${movedWords(a)}`);
  }

  /** The river in view between the header and the bar (as the tool opens, when it isn't). */
  function frame0(): void {
    if (!knots.length || W < 100 || H < 200) return;
    const xs = knots.map((k) => GRID.x0 + (k.c + 0.5) * TILE), zs = knots.map((k) => GRID.z0 + (k.r + 0.5) * TILE);
    const top = 76, bottom = H - 76, inView = knots.every((_, i) => {
      const [x, y] = toScreen(view, xs[i], zs[i]);
      return x > 30 && x < W - 30 && y > top && y < bottom;
    });
    if (inView) return;
    const x0 = Math.min(...xs) - TILE * 2, x1 = Math.max(...xs) + TILE * 2, z0 = Math.min(...zs) - TILE * 2, z1 = Math.max(...zs) + TILE * 2;
    const s = Math.min((W - 60) / (x1 - x0), (bottom - top) / (z1 - z0), 1.2);
    const [cx, cy] = toScreen({ s, ox: 0, oy: 0 }, (x0 + x1) / 2, (z0 + z1) / 2);
    view = { s, ox: W / 2 - cx, oy: (top + bottom) / 2 - cy };
  }

  onMount(() => {
    frame0();
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    if (testHooks()) window.__river = {
      knots: () => knots.map((k) => ({ ...k })),
      tiles: () => routed.tiles.map(tileOf),
      issues: () => issues.map((i) => ({ kind: i.kind, level: i.level, ja: i.ja })),
      ready: () => !!fresh,
      knotScreen: (k: number) => {
        const q = knots[k], b = canvas!.getBoundingClientRect();
        if (!q) return null;
        const [x, y] = toScreen(view, GRID.x0 + (q.c + 0.5) * TILE, GRID.z0 + (q.r + 0.5) * TILE);
        return [b.left + x, b.top + y];
      },
      plusScreen: (k: number) => {
        const a = knots[k], c = knots[k + 1], b = canvas!.getBoundingClientRect();
        if (!a || !c) return null;
        const [x0, y0] = toScreen(view, GRID.x0 + (a.c + 0.5) * TILE, GRID.z0 + (a.r + 0.5) * TILE), [x1, y1] = toScreen(view, GRID.x0 + (c.c + 0.5) * TILE, GRID.z0 + (c.r + 0.5) * TILE);
        return [b.left + (x0 + x1) / 2, b.top + (y0 + y1) / 2];
      },
      tileScreen: (c: number, r: number) => {
        const [x, y] = toScreen(view, GRID.x0 + (c + 0.5) * TILE, GRID.z0 + (r + 0.5) * TILE), b = canvas!.getBoundingClientRect();
        return [b.left + x, b.top + y];
      }
    };
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      clearTimeout(timer);
      clearTimeout(noteTimer);
      cancelAnimationFrame(frame);
      onpreview(null);
      delete window.__river;
    };
  });

  const chip = $derived(reds.length ? reds[0].ja : ambers.length ? `注意 ${ambers.length}` : 'OK');
  const cursor = $derived(panning || held !== null ? 'grabbing' : hover?.kind === 'knot' ? (knots[hover.k]?.pin ? 'not-allowed' : 'grab') : hover ? 'copy' : 'default');
</script>

<div class="rt" data-river-tool data-red={reds.length} data-amber={ambers.length}>
  <canvas
    bind:this={canvas}
    data-river-plan
    style:cursor
    onpointerdown={onDown}
    onpointermove={onMove}
    onpointerup={onUp}
    onpointercancel={onUp}
    onpointerleave={() => (hover = null)}
    onwheel={onWheel}
    oncontextmenu={(e) => e.preventDefault()}
  ></canvas>
  <header class="head">
    <button type="button" data-river-cancel onclick={onclose} title="Esc">✕ やめる</button>
    <h2>川の道</h2>
    <button type="button" class="chip" class:red={reds.length} class:amber={!reds.length && ambers.length} data-river-chip aria-expanded={listOpen} onclick={() => (listOpen = !listOpen)}>{chip}</button>
    <button type="button" class="ok" data-river-save disabled={!!reds.length || !changed} onclick={save} title="Enter">✓ 決定</button>
  </header>
  {#if listOpen && issues.length}
    <ul class="list" data-river-issues>
      {#each issues as i, n (n)}
        <li><button type="button" class={i.level} onclick={() => showIssue(i)}>{i.ja}</button></li>
      {/each}
    </ul>
  {/if}
  {#if moved}
    <div class="banner" data-river-partner>相手が川を変えました <button type="button" onclick={reread}>読み直す</button></div>
  {/if}
  {#if note}<div class="note" role="status">{note}</div>{/if}
  <footer class="bar">
    <button type="button" onclick={undo} disabled={!undoS.length} title="⌘Z" aria-label="取り消す" data-river-undo>↶<span class="word"> 取り消す</span></button>
    <button type="button" onclick={redo} disabled={!redoS.length} title="⇧⌘Z" aria-label="やり直す" data-river-redo>↷<span class="word"> やり直す</span></button>
    <button type="button" onclick={backToOpened} data-river-opened>開いた時に戻す</button>
    <button type="button" onclick={toFirst} data-river-first>最初の川</button>
    {#if selected !== null}<button type="button" onclick={() => removeKnot(selected!)} data-river-drop>点を消す</button>{/if}
    <label class="b3d"><input type="checkbox" bind:checked={show3d} /> 3D</label>
    <span class="hint">点をドラッグで移動 · 線か＋をクリックで点を追加 · 右クリックかDeleteで削除 · 空き地をドラッグで移動</span>
  </footer>
</div>

<style>
  .rt { position: absolute; inset: 0; z-index: 2; }
  canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  .head, .bar {
    position: absolute; left: 12px; right: 12px; display: flex; align-items: center; gap: 8px; padding: 6px 8px;
    background: rgba(255, 249, 227, 0.94); border: 2px solid var(--c-edge); border-radius: 14px; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }
  .head { top: 12px; }
  .bar { bottom: 12px; flex-wrap: wrap; }
  h2 { margin: 0 auto 0 4px; font-size: 16px; }
  .head .chip { background: var(--c-leaf); color: #fff; border-color: transparent; max-width: 420px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .head .chip.amber { background: #d7a323; color: #2c2218; }
  .head .chip.red { background: #e2553d; }
  .ok:not(:disabled) { background: var(--c-yuzu); }
  /* (the editor's buttons, compact: the bar stays one row over the plan on a desktop) */
  .head :global(button), .bar :global(button) { padding: 3px 9px; }
  .hint { font-size: 13px; color: var(--c-ink-soft); flex: 1 1 0; min-width: 0; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  label { font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
  .list {
    position: absolute; top: 64px; right: 12px; width: 340px; list-style: none; margin: 0; padding: 8px; display: flex; flex-direction: column; gap: 4px;
    background: var(--c-card); border: 2px solid var(--c-edge); border-radius: 12px; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }
  .list button { width: 100%; text-align: left; font-weight: 500; border-width: 1.5px; }
  .list .red { border-color: #d0533c; background: #fff0ec; }
  .list .amber { border-color: #d7a323; background: #fff8e2; }
  .banner, .note {
    position: absolute; left: 50%; transform: translateX(-50%); background: var(--c-cream); border: 2px solid var(--c-edge); border-radius: 999px;
    padding: 6px 14px; font-weight: 700; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18); display: flex; gap: 8px; align-items: center;
  }
  .banner { top: 66px; border-color: #d7a323; }
  .note { top: 110px; }
  /* a phone (the editor's ≤ 760 px): clear of the notch and the home indicator, the kit's 44px hit, no mouse words,
     ↶ ↷ bare so the bar is one row; its 3D from the editor's bar once the tool's closed */
  @media (max-width: 760px) {
    .head { top: calc(var(--ui-top) + 8px); left: calc(8px + var(--safe-left)); right: calc(8px + var(--safe-right)); }
    .bar { bottom: calc(var(--safe-bottom) + 8px); left: calc(8px + var(--safe-left)); right: calc(8px + var(--safe-right)); gap: 6px; }
    .head :global(button), .bar :global(button) { min-height: 44px; }
    .head .chip { max-width: 34vw; }
    .hint, .b3d, .word { display: none; }
    [data-river-undo], [data-river-redo] { min-width: 44px; }
    .list { top: calc(var(--ui-top) + 70px); left: 8px; right: 8px; width: auto; max-height: 50%; overflow-y: auto; }
    .banner { top: calc(var(--ui-top) + 70px); }
    .note { top: calc(var(--ui-top) + 114px); max-width: calc(100% - 24px); }
  }
</style>
