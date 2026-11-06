<script lang="ts">
  // The island's もようがえ on the phone (docs/island-layout.md "Phone editing"): NH's outdoor arranging, one-handed, on
  // the island's layout (store/layout.svelte.ts), the tent's way (tent/TentEdit.svelte). The tray at the foot: its tabs
  // (き, かんぼく, はな, いわ, あかり, かぐ, ジム, はし・さか, たてもの, おきゃくさん) over each kind's icon; a tap puts that kind down as a ghost on the
  // free tile nearest the middle of the view, its footprint on the ground green or red (and why, in the bar); a finger
  // on it, or on a placed thing (it's picked up), drags it a tile at a time; a tap on the ground moves it there; ↻ turns
  // it; ✓ puts it down; 🗑 しまう takes a placed one away (the island's one-offs, the goal trees, the homes never); ✕
  // puts it back. While a finger holds it the other phones see it move (`drag`, `sc: 'o'`); a drop is one action,
  // its ops at once (every phone's island, the editor). The members' only: the guest never arranges the outdoors.
  // The terrain (paths, water, cliffs) is the desktop editor's for now. The visitors' spots (おきゃくさん: the plaza's, where
  // the visitors stand, and Gulliver's on the beach; docs/design.md "Visitors") are marks only here: one each, a tap on
  // one in the tray picks up the one there; the visitors' usual spot (spots.ts stageOf) shows as a dashed ring while
  // no plaza is put down, and a mark nobody can stand at now (something put on it) shows red, its reason in the bar.
  //   stage: the island's projection (world ⇄ the host's px) and the model to hide while it's held
  import { isMarker, kindDef, KIND_LIST, type KindDef } from '#lib/layout/catalog.ts';
  import { markerOf, markerSpot, stageOf } from '#lib/layout/spots.ts';
  import { GRID, TILE } from '#lib/layout/grid.ts';
  import { footOf, newObjId, objMid, opsBetween, originOf, withChanges, type Layout, type Obj } from '#lib/layout/model.ts';
  import { validate } from '#lib/layout/validate.ts';
  import { layout as store } from '#lib/store/layout.svelte.ts';
  import { site } from '../island/site.svelte.ts';
  import { artUrl } from '#lib/art.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
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
    /** The stage pans itself on a drag over open ground (the editor's preview: a tap there does nothing of its own):
     *  a press on the ground while something's held passes on to it too, its tap still putting the held thing there. */
    pans?: boolean;
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
  const TABS = ['tree', 'bush', 'flower', 'rock', 'light', 'furniture', 'gym', 'structure', 'building', 'visitor'] as const;
  const MARKS = ['plaza', 'beach-spot'] as const;
  /** A kind's or an issue's name in this phone's language. */
  const say = (x: { ja: string; en: string }) => (i18n.locale === 'ja' ? x.ja : x.en);
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
    if (x0 < 0 || z0 < 0 || x0 + w > GRID.cols || z0 + d > GRID.rows) return void (why = t('decor.island.outside'));
    // (a visitors' spot: where nobody can stand is no place for it)
    const mine = validate(h.l).filter((i) => (i.level === 'error' || i.code === 'visitor-spot') && i.ids.includes(h.id) && i.code !== 'unreachable');
    why = mine[0] ? say(mine[0]) : null;
  }

  /** Where the middle of the view's ground is (a new thing lands near it). */
  function viewCentre(): [number, number] {
    const [w, h] = stage.size();
    const g = stage.toGround(w / 2, h * 0.45) ?? [site.midX, 300];
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
    // (one of it on the island: the one there is picked up, to go where it's put down now)
    const one = def.one ? markerOf(store.current, def.k as (typeof MARKS)[number]) : null;
    // the free tile nearest the middle (rings outward)
    sel = one ? { id: one.id, k: def.k, x, z, f, orig: one } : { id: null, k: def.k, s: def.variants?.[0], x, z, f };
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
    // (one of it on the island: any other a phone put down at the same time goes)
    const extra = kindDef(o.k)?.one ? [...before.objects.values()].filter((p) => p.k === o.k && p.id !== id).map((p) => p.id) : [];
    const next = who && who === me && o.f !== sel.orig?.f ? withChanges(before, { set: [o], homes: { [who]: { ...before.homes[who], f: o.f } } }) : withChanges(before, { set: [o], remove: extra });
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
      // (a visitors' spot is a mark on the ground: with something held, a tap there puts it there)
      if (o && kindDef(o.k) && o.k !== 'spot' && !(sel && isMarker(o.k))) {
        pickUp(o);
        onHeld = true;
      }
    }
    if (!onHeld && !sel) return;
    finger = { id: e.pointerId, x: sx, y: sy, moved: false, onHeld };
    // (on open ground with something held, over a stage that pans: the drag is the stage's, the tap ours)
    if (!onHeld && stage.pans) return;
    host.setPointerCapture(e.pointerId);
    e.stopPropagation();
    e.preventDefault();
  }
  function onMove(e: PointerEvent) {
    if (!finger || finger.id !== e.pointerId) return;
    if (!finger.onHeld && stage.pans) {
      // (a drag that pans the stage is never a tap, wherever it's lifted)
      const b = stage.host.getBoundingClientRect();
      if (Math.hypot(e.clientX - b.left - finger.x, e.clientY - b.top - finger.y) >= 8) finger.moved = true;
      return;
    }
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
    if (f.onHeld || !stage.pans) e.stopPropagation();
    const b = stage.host.getBoundingClientRect();
    const sx = e.clientX - b.left, sy = e.clientY - b.top;
    // a tap on the ground with something held: there
    if (!f.onHeld && sel && !f.moved && Math.hypot(sx - f.x, sy - f.y) < 8) {
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
  // ---- the visitors' spots: their marks on the ground (nothing in play), the usual spot while no plaza's put down ----
  const marks = $derived.by(() => {
    const l = store.current;
    const out: { id: string; k: string; x: number; z: number; ok: boolean }[] = [];
    for (const k of MARKS) {
      const m = markerSpot(l, k), o = m && l.objects.get(m.id);
      if (o) out.push({ id: o.id, k, x: GRID.x0 + (o.x + 0.5) * TILE, z: GRID.z0 + (o.z + 0.5) * TILE, ok: !!m.at });
    }
    const st = markerSpot(l, 'plaza')?.at ? null : stageOf(l);
    if (st) out.push({ id: 'usual', k: 'usual', x: st[0], z: st[1], ok: true });
    return out;
  });
  /** A mark nobody can stand at now: why (the bar says it while nothing's held). */
  const markWhy = $derived.by(() => {
    const bad = validate(store.current).find((i) => i.code === 'visitor-spot');
    return bad ? say(bad) : null;
  });
  const markShown = $derived.by(() => {
    void rev;
    return marks.filter((m) => m.id !== sel?.id && !(m.k === 'usual' && sel?.k === 'plaza')).map((m) => {
      const h = TILE / 2, pts = [[m.x - h, m.z - h], [m.x + h, m.z - h], [m.x + h, m.z + h], [m.x - h, m.z + h]].map(([x, z]) => stage.toScreen(x, z, 1));
      const at = stage.toScreen(m.x, m.z, 0);
      return pts.some((p) => !p) || !at ? null : { ...m, poly: pts.map((p) => p!.join(',')).join(' '), at };
    }).filter((m) => !!m);
  });

  /** How far apart along the island the camera's moves are looked for (u): one at least on screen wherever it looks. */
  const CAM_PROBE = 150;
  let raf = 0;
  $effect(() => {
    // the camera may move under a held thing (a pinch), and under the marks: they follow
    if (!sel && !marks.length) return;
    // (a re-render only when the camera did move: ground points along the island, those on screen, and the stage's
    // size, read each display frame; a bump every frame re-rendered the marks and the held thing's outline at 60 a
    // second for nothing)
    let was = '';
    const tick = () => {
      // (down the island's middle, its land's whole length: the back of a grown island too)
      const land = site.extent.land, mid = site.midX;
      let key = stage.size().join();
      for (let z = Math.min(0, land.z0); z <= land.z1 + CAM_PROBE; z += CAM_PROBE) key += `|${stage.toScreen(mid, z, 0)?.join() ?? '-'}`;
      if (key !== was) {
        was = key;
        rev++;
      }
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
    window.__islandEdit = {
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
    return () => delete window.__islandEdit;
  });
</script>

<!-- the taps over the island are the mode's (a drag on empty ground still reaches the island under it) -->
<div class="ie" data-island-edit>
  <svg class="over" viewBox={`0 0 ${size[0]} ${size[1]}`} aria-hidden="true">
    {#each markShown as m (m.id)}
      <polygon points={m.poly} class="mark" class:usual={m.k === 'usual'} class:bad={!m.ok} />
    {/each}
    {#if ghost}
      <polygon points={ghost.poly} class:bad={!!why} />
    {/if}
  </svg>
  {#each markShown as m (m.id)}
    {@const icon = m.k === 'usual' ? null : artUrl(kindDef(m.k)?.icon ?? '')}
    <div class="pin" class:bad={!m.ok} style:left={`${m.at[0]}px`} style:top={`${m.at[1]}px`} data-mark={m.k} data-mark-ok={m.ok}>
      {#if icon}<img src={icon} alt="" draggable="false" />{:else}<span class="usual">{t('decor.island.usual')}</span>{/if}
    </div>
  {/each}
  {#if ghost?.top && ghost.foot && def}
    {@const icon = def.icon ? artUrl(sel?.k === 'bush' && sel.s && !sel.s.startsWith('month') ? `bushes/${sel.s}` : def.icon) : null}
    {@const ih = Math.max(22, ghost.foot[1] - ghost.top[1])}
    <div class="lift" style:left={`${ghost.foot[0]}px`} style:top={`${ghost.foot[1] - ih}px`}>
      {#if icon}<img src={icon} alt="" draggable="false" style:height={`${ih}px`} />{:else}<span class="glyph">{ICON_FALLBACK[def.k] ?? '・'}</span>{/if}
    </div>
  {/if}
  <div class="foot edit-tray">
    {#if sel && def}
      <div class="bar" role="toolbar" aria-label={say(def)}>
        <span class="say" class:bad={!!why} data-why={why ?? ''} aria-live="polite">{why ?? say(def)}</span>
        {#if turns}<button type="button" class="act" data-act="turn" data-sfx="self" aria-label={t('decor.turn')} onclick={turn}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" /><path d="M19 4v4h-4" /></svg>
        </button>{/if}
        {#if sel.id && !def.fixed}
          <button type="button" class="act" data-act="remove" data-sfx="self" aria-label={t('decor.remove')} onclick={putAway}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>
          </button>
        {/if}
        <button type="button" class="act" data-act="cancel" data-sfx="self" aria-label={t('decor.cancel')} onclick={cancel}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
        </button>
        <button type="button" class="act ok" data-act="place" data-sfx="self" aria-label={t('decor.place')} aria-disabled={!!why} onclick={place}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" /></svg>
        </button>
      </div>
    {:else}
      <div class="bar hint" class:bad={!!markWhy} data-island-hint data-island-warn={markWhy ?? undefined}>{markWhy ?? t('decor.island.hint')}</div>
    {/if}
    <div class="tray">
      <div class="tabs" role="tablist" aria-label={t('panel.decor')}>
        {#each TABS as g (g)}
          <button type="button" role="tab" class="tab" data-tab={g} data-sfx="self" aria-selected={tab === g} onclick={() => ((tab = g), cue('tick'))}>{t(`decor.tab.${g}`)}</button>
        {/each}
      </div>
      <div class="row">
        <div class="items" role="group" aria-label={t(`decor.tab.${tab}`)}>
          {#each list as d (d.k)}
            <button type="button" class="it" data-island-item={d.k} data-sfx="self" aria-label={say(d)} aria-pressed={!!sel && !sel.id && sel.k === d.k} onclick={() => pickNew(d)}>
              {#if d.icon && artUrl(d.icon)}<img src={artUrl(d.icon)} alt="" width="48" height="48" loading="lazy" draggable="false" />{:else}<span class="glyph">{ICON_FALLBACK[d.k] ?? '・'}</span>{/if}
            </button>
          {/each}
          {#if !list.length}<span class="none" data-island-none>{t('decor.island.none')}</span>{/if}
        </div>
        <button type="button" class="done" data-island-done data-sfx="confirm" onclick={() => (cancel(), ondone())}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" /></svg><span>{t('decor.done')}</span>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  /* (over every world node: their z-index is their depth, geom.ts zIndexAt, up to ~8M; at 5 a tree's tap area near the
     camera took a tap meant for the tray's icon over it) */
  .ie { position: absolute; inset: 0; z-index: 100000000; pointer-events: none; font: 700 var(--fs-s, 14px)/1.2 var(--font-ui, system-ui); }
  .over { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .over polygon { fill: rgba(110, 208, 122, 0.35); stroke: #6ed07a; stroke-width: 2.5; stroke-linejoin: round; }
  .over polygon.bad { fill: rgba(255, 90, 70, 0.35); stroke: #ff5a46; }
  /* the visitors' spots: a soft tile on the ground and its sign over it; the usual spot a dashed ring */
  .over polygon.mark { fill: rgba(255, 236, 170, 0.45); stroke: #e0a42c; stroke-width: 2; }
  .over polygon.mark.usual { fill: none; stroke: rgba(255, 255, 255, 0.85); stroke-dasharray: 6 5; }
  .over polygon.mark.bad { fill: rgba(255, 90, 70, 0.3); stroke: #ff5a46; }
  .pin { position: absolute; transform: translate(-50%, -100%); filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.25)); }
  .pin img { display: block; height: 34px; width: auto; }
  .pin.bad img { filter: grayscale(0.6) opacity(0.75); }
  .pin .usual { display: block; padding: 2px 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.85); color: var(--c-ink-soft); font-size: 11px; white-space: nowrap; }
  .hint.bad { color: #d23c2a; }
  .lift { position: absolute; transform: translate(-50%, -10px); filter: drop-shadow(0 6px 4px rgba(0, 0, 0, 0.25)); animation: bob 1.4s ease-in-out infinite; }
  .lift img { display: block; width: auto; max-width: 140px; object-fit: contain; }
  .glyph { font-size: 28px; }
  /* the tray's look is the editors' one (theme.css .edit-tray) */
  @keyframes bob { 50% { translate: 0 -4px; } }
  .none { align-self: center; padding: 0 8px; font-size: var(--fs-s); color: var(--c-ink-soft); }
</style>
