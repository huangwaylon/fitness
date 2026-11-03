<script lang="ts">
  // The island's もようがえ on the phone (docs/island-layout.md "Phone editing"): NH's outdoor arranging, one-handed, on
  // the island's layout (store/layout.svelte.ts), the tent's way (tent/TentEdit.svelte). The tray at the foot: its tabs
  // (き, かんぼく, はな, いわ, あかり, かぐ, はし・さか) over each kind's icon; a tap puts that kind down as a ghost on the
  // free tile nearest the middle of the view, its footprint on the ground green or red (and why, in the bar); a finger
  // on it, or on a placed thing (it's picked up), drags it a tile at a time; a tap on the ground moves it there; ↻ turns
  // it; ✓ puts it down; 🗑 しまう takes a placed one away (the island's one-offs, the goal trees, the homes never); ✕
  // puts it back. While a finger holds it the other phones see it move (`drag`, `sc: 'o'`); a drop is one action,
  // its ops at once (every phone's island, the editor). The members' only: the guest never arranges the outdoors.
  // The terrain (paths, water, cliffs) is the desktop editor's for now.
  //   stage: the island's projection (world ⇄ the host's px) and the model to hide while it's held
  import { kindDef, KIND_LIST, type KindDef } from '#lib/layout/catalog.ts';
  import { GRID, TILE } from '#lib/layout/grid.ts';
  import { footOf, newObjId, objMid, opsBetween, originOf, withChanges, type Layout, type Obj } from '#lib/layout/model.ts';
  import { validate } from '#lib/layout/validate.ts';
  import { layout as store } from '#lib/store/layout.svelte.ts';
  import { artUrl } from '#lib/art.ts';
  import { cue } from '#lib/sound/cues.ts';
  import type { Live } from '#lib/sync/live.ts';
  import { objectAt } from '../editor/edits.ts';
  import { WHO_OF_HOME } from '#lib/layout/homes.ts';

  export interface EditStage {
    /** The element over the island the mode's taps come through (its own taps pass on to the island). */
    host: HTMLElement;
    /** A world point (on the ground, `lift` above it) in the host's px, or null when it's out of view. */
    toScreen(x: number, z: number, lift?: number): [number, number] | null;
    /** The ground under the host's px, or null (the sky). */
    toGround(sx: number, sy: number): [number, number] | null;
    /** The host's size (px). */
    size(): [number, number];
    /** Hide a placed thing's model while it's held (null: none). */
    hide?(id: string | null): void;
  }
  interface Props {
    stage: EditStage;
    relay: Live | null;
    /** Who's arranging (a home turns only for its owner: its facing is its look's). */
    me: 'A' | 'B';
    ondone: () => void;
  }
  let { stage, relay, me, ondone }: Props = $props();

  type Facing = Obj['f'];
  const TABS: [string, string][] = [['tree', 'き'], ['bush', 'かんぼく'], ['flower', 'はな'], ['rock', 'いわ'], ['light', 'あかり'], ['furniture', 'かぐ'], ['structure', 'はし・さか'], ['building', 'たてもの']];
  let tab = $state('tree');
  // (the island's one-off buildings only while it has none of them: the museum stands there already, moved by a tap on it)
  const present = (d: KindDef) => [...store.current.objects.values()].some((o) => o.k === d.k);
  const list = $derived(KIND_LIST.filter((d) => d.group === tab && !d.hidden && (!d.fixed || (d.group === 'building' && !present(d)))));
  const ICON_FALLBACK: Record<string, string> = { stairs: '⛰', board: '📋' };

  /** What's held: a new kind (`id` null) or a placed thing, its tile (its footprint's anchor) and facing. */
  let sel = $state<{ id: string | null; k: string; s?: string; x: number; z: number; f: Facing; orig?: Obj } | null>(null);
  let why = $state<string | null>(null);
  /** Whether the held thing may turn here (a home: its owner only). */
  const turns = $derived(!sel || sel.k !== 'home' || sel.id === `home-${me}`);
  let rev = $state(0);

  /** The layout with the held thing where it is now. */
  function withHeld(l: Layout): { l: Layout; id: string } | null {
    if (!sel) return null;
    const id = sel.id ?? 'held-new';
    const o: Obj = { id, k: sel.k, x: sel.x, z: sel.z, f: sel.f, ...(sel.s ? { s: sel.s } : {}) };
    return { l: withChanges(l, { set: [o] }), id };
  }
  /** Why the held thing can't stand there (the checks' reason for it), or null. */
  function check(): void {
    const h = withHeld(store.current);
    if (!h) return void (why = null);
    const [w, d] = footOf(h.l, h.l.objects.get(h.id)!), [x0, z0] = originOf(h.l, h.l.objects.get(h.id)!);
    if (x0 < 0 || z0 < 0 || x0 + w > GRID.cols || z0 + d > GRID.rows) return void (why = 'しまの そとです');
    const mine = validate(h.l).filter((i) => i.level === 'error' && i.ids.includes(h.id) && i.code !== 'unreachable');
    why = mine[0]?.ja ?? null;
  }

  /** Where the middle of the view's ground is (a new thing lands near it). */
  function viewCentre(): [number, number] {
    const [w, h] = stage.size();
    const g = stage.toGround(w / 2, h * 0.45) ?? [195, 300];
    return [g[0], g[1]];
  }
  const tileOf = (x: number, z: number): [number, number] => [Math.floor((x - GRID.x0) / TILE), Math.floor((z - GRID.z0) / TILE)];
  /** A footprint's anchor tile for its middle at (x, z) (a home's is its door's: model.ts originOf). */
  function anchorFor(k: string, f: Facing, x: number, z: number): [number, number] {
    const def = kindDef(k)!;
    const [w, d] = def.turns && f % 2 ? [def.d, def.w] : [def.w, def.d];
    return [Math.round((x - GRID.x0) / TILE - w / 2), Math.round((z - GRID.z0) / TILE - d / 2)];
  }

  function pickNew(def: KindDef) {
    cancel();
    const [cx, cz] = viewCentre();
    const f: Facing = 0;
    let [x, z] = anchorFor(def.k, f, cx, cz);
    // the free tile nearest the middle (rings outward)
    sel = { id: null, k: def.k, s: def.variants?.[0], x, z, f };
    check();
    for (let r = 1; why && r <= 6; r++)
      for (let dz = -r; dz <= r && why; dz++)
        for (let dx = -r; dx <= r && why; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          sel = { ...sel!, x: x + dx, z: z + dz };
          check();
        }
    if (why) sel = { ...sel!, x, z };
    check();
    cue('tick');
    sayDrag(false);
  }
  function pickUp(o: Obj) {
    cancel();
    if (!kindDef(o.k)) return;
    sel = { id: o.id, k: o.k, ...(o.s ? { s: o.s } : {}), x: o.x, z: o.z, f: o.f, orig: o };
    stage.hide?.(o.id);
    check();
    cue('tick');
  }
  function turn() {
    if (!sel || !turns) return cue('boop');
    sel = { ...sel, f: ((sel.f + 1) % 4) as Facing };
    check();
    cue('tick');
    sayDrag(false);
  }
  function cancel() {
    if (sel?.id) stage.hide?.(null);
    if (sel) sayDrag(true);
    sel = null;
    why = null;
  }
  function place() {
    if (!sel) return;
    if (why) return cue('boop');
    const before = store.current;
    const id = sel.id ?? newObjId(store.stamp());
    const o: Obj = { id, k: sel.k, x: sel.x, z: sel.z, f: sel.f, ...(sel.s ? { s: sel.s } : {}) };
    const same = sel.orig && sel.orig.x === o.x && sel.orig.z === o.z && sel.orig.f === o.f && !sel.orig.n;
    // a home's turn is its owner's look (an `h` op the record lets only them send)
    const who = WHO_OF_HOME[id];
    const next = who && who === me && o.f !== sel.orig?.f ? withChanges(before, { set: [o], homes: { [who]: { ...before.homes[who], f: o.f } } }) : withChanges(before, { set: [o] });
    if (!same) store.apply(opsBetween(before, next, store.stamp()));
    stage.hide?.(null);
    sayDrag(true);
    sel = null;
    why = null;
    cue('confirm');
  }
  function putAway() {
    if (!sel?.id) return;
    const o = store.current.objects.get(sel.id);
    if (!o || kindDef(o.k)?.fixed) return cue('boop');
    store.apply(opsBetween(store.current, withChanges(store.current, { remove: [o.id] }), store.stamp()));
    stage.hide?.(null);
    sayDrag(true);
    sel = null;
    cue('undo');
  }

  // ---- the finger: on the held thing (or a placed one) it drags; a tap on the ground moves the held one there.
  //      Anything else is the island's (a drag on empty ground scrolls it); while something's held, every tap is ours ----
  let finger: { id: number; x: number; y: number; moved: boolean; onHeld: boolean } | null = null;
  let lastSent = 0;
  function sayDrag(end: boolean) {
    if (!relay || !sel) return;
    const now = performance.now();
    if (!end && now - lastSent < 100) return;
    lastSent = now;
    const h = withHeld(store.current);
    if (!h || !sel.id) return;
    const [mx, mz] = objMid(h.l, h.l.objects.get(h.id)!);
    relay.send({ kind: 'drag', sc: 'o', id: sel.id, x: Math.round(mx), z: Math.round(mz), f: sel.f, ...(end ? { end: true } : {}) } as never);
  }
  function heldAt(sx: number, sy: number): boolean {
    if (!sel) return false;
    const g = stage.toGround(sx, sy);
    if (!g) return false;
    const h = withHeld(store.current)!;
    const o = h.l.objects.get(h.id)!;
    const [w, d] = footOf(h.l, o), [x0, z0] = originOf(h.l, o);
    const [c, r] = tileOf(g[0], g[1]);
    return c >= x0 - 1 && c <= x0 + w && r >= z0 - 1 && r <= z0 + d;
  }
  function onDown(e: PointerEvent) {
    if ((e.target as Element | null)?.closest('.foot')) return;
    const host = stage.host, b = host.getBoundingClientRect();
    const sx = e.clientX - b.left, sy = e.clientY - b.top;
    let onHeld = heldAt(sx, sy);
    if (!onHeld) {
      const g = stage.toGround(sx, sy);
      const o = g && objectAt(store.current, ...tileOf(g[0], g[1]));
      if (o && kindDef(o.k) && o.k !== 'spot') {
        pickUp(o);
        onHeld = true;
      }
    }
    if (!onHeld && !sel) return;
    finger = { id: e.pointerId, x: sx, y: sy, moved: false, onHeld };
    host.setPointerCapture(e.pointerId);
    e.stopPropagation();
    e.preventDefault();
  }
  function onMove(e: PointerEvent) {
    if (!finger || finger.id !== e.pointerId) return;
    e.stopPropagation();
    if (!finger.onHeld || !sel) return;
    const b = stage.host.getBoundingClientRect();
    const sx = e.clientX - b.left, sy = e.clientY - b.top;
    if (Math.hypot(sx - finger.x, sy - finger.y) > 6) finger.moved = true;
    const g = stage.toGround(sx, sy);
    if (!g) return;
    const [x, z] = anchorFor(sel.k, sel.f, g[0], g[1]);
    const ax = sel.k === 'home' ? sel.x : x, az = sel.k === 'home' ? sel.z : z;
    if (ax !== sel.x || az !== sel.z) {
      sel = { ...sel, x: ax, z: az };
      check();
      sayDrag(false);
    }
  }
  function onUp(e: PointerEvent) {
    const f = finger;
    finger = null;
    if (!f || f.id !== e.pointerId) return;
    e.stopPropagation();
    const b = stage.host.getBoundingClientRect();
    const sx = e.clientX - b.left, sy = e.clientY - b.top;
    // a tap on the ground with something held: there
    if (!f.onHeld && sel && Math.hypot(sx - f.x, sy - f.y) < 8) {
      const g = stage.toGround(sx, sy);
      if (g) {
        const [x, z] = anchorFor(sel.k, sel.f, g[0], g[1]);
        sel = { ...sel, x, z };
        check();
        sayDrag(false);
      }
    }
  }

  // ---- the held thing's footprint and icon, drawn over the island ----
  // (its footprint in the world only when what's held or the layout changes: the layout's objects copied once, not in
  // each frame of the camera's follow below)
  const held = $derived.by(() => {
    if (!sel) return null;
    const h = withHeld(store.current);
    if (!h) return null;
    const o = h.l.objects.get(h.id)!;
    const [w, d] = footOf(h.l, o), [x0, z0] = originOf(h.l, o);
    const X0 = GRID.x0 + x0 * TILE, Z0 = GRID.z0 + z0 * TILE;
    return { X0, Z0, X1: X0 + w * TILE, Z1: Z0 + d * TILE };
  });
  const ghost = $derived.by(() => {
    void rev;
    if (!sel || !held) return null;
    const { X0, Z0, X1, Z1 } = held;
    const pts = [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]].map(([x, z]) => stage.toScreen(x, z, 1));
    if (pts.some((p) => !p)) return null;
    const [mx, mz] = [(X0 + X1) / 2, (Z0 + Z1) / 2];
    const top = stage.toScreen(mx, mz, Math.min(60, kindDef(sel.k)?.h ?? 30)), foot = stage.toScreen(mx, mz, 0);
    return { poly: pts.map((p) => p!.join(',')).join(' '), top, foot };
  });
  let raf = 0;
  $effect(() => {
    // the camera may move under a held thing (a pinch): its footprint follows
    if (!sel) return;
    const tick = () => {
      rev++;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });
  const def = $derived(sel ? kindDef(sel.k) : null);
  const size = $derived.by(() => (void rev, stage.size()));
  $effect(() => {
    const host = stage.host;
    const opt = { capture: true } as const;
    host.addEventListener('pointerdown', onDown, opt);
    host.addEventListener('pointermove', onMove, opt);
    host.addEventListener('pointerup', onUp, opt);
    host.addEventListener('pointercancel', onUp, opt);
    return () => {
      host.removeEventListener('pointerdown', onDown, opt);
      host.removeEventListener('pointermove', onMove, opt);
      host.removeEventListener('pointerup', onUp, opt);
      host.removeEventListener('pointercancel', onUp, opt);
      stage.hide?.(null);
    };
  });

  /** The e2e's view of the mode. */
  export const snapshot = () => (sel ? { ...sel, why } : null);
  $effect(() => {
    (window as unknown as { __islandEdit?: unknown }).__islandEdit = {
      sel: () => (sel ? { ...sel, orig: undefined, why } : null),
      ghost: () => ghost,
      screenOf: (x: number, z: number) => {
        const p = stage.toScreen(x, z), b = stage.host.getBoundingClientRect();
        return p ? [b.left + p[0], b.top + p[1]] : null;
      },
      tileScreen: (c: number, r: number) => {
        const p = stage.toScreen(GRID.x0 + (c + 0.5) * TILE, GRID.z0 + (r + 0.5) * TILE), b = stage.host.getBoundingClientRect();
        return p ? [b.left + p[0], b.top + p[1]] : null;
      }
    };
    return () => delete (window as unknown as { __islandEdit?: unknown }).__islandEdit;
  });
</script>

<!-- the taps over the island are the mode's (a drag on empty ground still reaches the island under it) -->
<div class="ie" data-island-edit>
  <svg class="over" viewBox={`0 0 ${size[0]} ${size[1]}`} aria-hidden="true">
    {#if ghost}
      <polygon points={ghost.poly} class:bad={!!why} />
    {/if}
  </svg>
  {#if ghost?.top && ghost.foot && def}
    {@const icon = def.icon ? artUrl(sel?.k === 'bush' && sel.s && !sel.s.startsWith('month') ? `bushes/${sel.s}` : def.icon) : null}
    {@const ih = Math.max(22, ghost.foot[1] - ghost.top[1])}
    <div class="lift" style:left={`${ghost.foot[0]}px`} style:top={`${ghost.foot[1] - ih}px`}>
      {#if icon}<img src={icon} alt="" draggable="false" style:height={`${ih}px`} />{:else}<span class="glyph">{ICON_FALLBACK[def.k] ?? '・'}</span>{/if}
    </div>
  {/if}
  <div class="foot">
    {#if sel && def}
      <div class="bar" role="toolbar" aria-label={def.ja}>
        <span class="say" class:bad={!!why} data-why={why ?? ''} aria-live="polite">{why ?? def.ja}</span>
        {#if turns}<button type="button" class="act" data-act="turn" data-sfx="self" aria-label="まわす" onclick={turn}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" /><path d="M19 4v4h-4" /></svg>
        </button>{/if}
        {#if sel.id && !def.fixed}
          <button type="button" class="act" data-act="remove" data-sfx="self" aria-label="しまう" onclick={putAway}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>
          </button>
        {/if}
        <button type="button" class="act" data-act="cancel" data-sfx="self" aria-label="やめる" onclick={cancel}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
        </button>
        <button type="button" class="act ok" data-act="place" data-sfx="self" aria-label="ここに おく" aria-disabled={!!why} onclick={place}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" /></svg>
        </button>
      </div>
    {:else}
      <div class="bar hint" data-island-hint>しまの ものを タップで もちあげ、ドラッグで うごかす。したから えらんで おく。</div>
    {/if}
    <div class="tray">
      <div class="tabs" role="tablist" aria-label="もようがえ">
        {#each TABS as [g, name] (g)}
          <button type="button" role="tab" class="tab" data-tab={g} data-sfx="self" aria-selected={tab === g} onclick={() => ((tab = g), cue('tick'))}>{name}</button>
        {/each}
      </div>
      <div class="row">
        <div class="items" role="group" aria-label={TABS.find((t) => t[0] === tab)?.[1]}>
          {#each list as d (d.k)}
            <button type="button" class="it" data-island-item={d.k} data-sfx="self" aria-label={d.ja} aria-pressed={!!sel && !sel.id && sel.k === d.k} onclick={() => pickNew(d)}>
              {#if d.icon && artUrl(d.icon)}<img src={artUrl(d.icon)} alt="" width="48" height="48" loading="lazy" draggable="false" />{:else}<span class="glyph">{ICON_FALLBACK[d.k] ?? '・'}</span>{/if}
            </button>
          {/each}
          {#if !list.length}<span class="none" data-island-none>しまに あります（タップで うごかせます）</span>{/if}
        </div>
        <button type="button" class="done" data-island-done data-sfx="confirm" onclick={() => (cancel(), ondone())}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" /></svg><span>おわる</span>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .ie { position: absolute; inset: 0; z-index: 5; pointer-events: none; font: 700 var(--fs-s, 14px)/1.2 var(--font-ui, system-ui); }
  .over { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .over polygon { fill: rgba(110, 208, 122, 0.35); stroke: #6ed07a; stroke-width: 2.5; stroke-linejoin: round; }
  .over polygon.bad { fill: rgba(255, 90, 70, 0.35); stroke: #ff5a46; }
  .lift { position: absolute; transform: translate(-50%, -10px); filter: drop-shadow(0 6px 4px rgba(0, 0, 0, 0.25)); animation: bob 1.4s ease-in-out infinite; }
  .lift img { display: block; width: auto; max-width: 140px; object-fit: contain; }
  .glyph { font-size: 28px; }
  .foot {
    position: absolute; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: stretch; gap: 8px;
    padding: 0 10px calc(var(--safe-bottom, 0px) + 10px); pointer-events: none;
  }
  .bar, .tray { pointer-events: auto; background: var(--plate, #fff9e3); color: var(--plate-ink, #4a3a2c); border-radius: 22px; box-shadow: 0 3px 0 var(--plate-lip, #e0c48a), 0 6px 16px rgba(20, 10, 0, 0.3); }
  .bar { display: flex; align-items: center; gap: 6px; padding: 6px 6px 6px 16px; align-self: center; max-width: 100%; }
  .hint { padding: 12px 18px; color: var(--c-ink-soft, #7a6a50); text-align: center; }
  .say { flex: 1; min-width: 0; padding-right: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .say.bad { color: #c2412f; }
  .tray { display: flex; flex-direction: column; gap: 6px; padding: 8px; }
  .tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
  .tab { flex: 1 0 auto; min-height: 44px; padding: 0 9px; border-radius: 14px; border: 0; font: inherit; background: transparent; color: var(--c-ink, #4a3a2c); white-space: nowrap; }
  .tab[aria-selected='true'] { background: var(--c-yuzu, #f7d94c); box-shadow: 0 2px 0 var(--c-yuzu-lip, #d9b21e); }
  .row { display: flex; gap: 6px; align-items: stretch; }
  .items {
    flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); grid-auto-rows: 60px; gap: 6px;
    max-height: calc(60px * 2.4 + 12px); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; touch-action: pan-y; padding: 2px;
  }
  .it, .act, .done { appearance: none; border: 0; margin: 0; font: inherit; color: inherit; display: grid; place-items: center; flex: none; }
  .it { width: 100%; height: 60px; border-radius: 16px; background: var(--c-card, #fffcf2); box-shadow: inset 0 0 0 2px var(--c-edge, #e8dcc0); touch-action: pan-y; }
  .it img { width: 48px; height: 48px; object-fit: contain; pointer-events: none; }
  .it[aria-pressed='true'] { box-shadow: inset 0 0 0 3px var(--c-leaf-edge, #6dbe5a); background: #f1fbe6; }
  .act { width: 44px; height: 44px; border-radius: 50%; background: var(--c-card, #fffcf2); box-shadow: inset 0 0 0 2px var(--c-edge, #e8dcc0); }
  .act svg, .done svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
  .act.ok { background: var(--c-leaf, #7cc860); color: #fff; box-shadow: 0 2px 0 var(--c-leaf-lip, #4f9a3c); }
  .act.ok[aria-disabled='true'] { background: #cfc6b0; box-shadow: none; }
  .done { width: 68px; padding: 6px 4px; gap: 2px; display: flex; flex-direction: column; justify-content: center; border-radius: 16px; background: var(--c-yuzu, #f7d94c); box-shadow: 0 2px 0 var(--c-yuzu-lip, #d9b21e); }
  @keyframes bob { 50% { translate: 0 -4px; } }
  .none { align-self: center; padding: 0 8px; font-size: var(--fs-s, 13px); color: var(--plate-ink, var(--c-ink)); opacity: .75; }
</style>
