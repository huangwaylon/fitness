<script lang="ts">
  // The tent's edit mode (docs/design.md "The tent"): NH's furniture arranging, one-handed. The tray at the foot, in
  // the thumb's reach: its tabs (かぐ, ラグ, みつけた: what the balloons brought, かべがみ, ゆか) over NH's icons in a row
  // that scrolls sideways, and ✓ おわる with the count. A tap on an icon puts that piece down as a ghost on the free
  // spot nearest my villager (lifted, its footprint green or red on the floor); a finger on it (or on a placed piece:
  // it's picked up) drags it a tile at a time; a tap on the floor moves it there; ↻ まわす turns it a quarter; ✓ おく
  // places it (greyed while red, the bar saying why); 🗑 しまう takes a placed one away (とりけす on the banner); ✕ やめる
  // puts it back. A wallpaper or a floor is on the walls at once. While I hold a piece the partner's phone sees it move
  // (dragLink.ts); what the partner holds, I can't pick up. Every change is one op (store/tent.svelte.ts), in the room
  // it's given: the home's own (the tent's `t`, うめ's house's `u`, the guest's `v`).
  import { onMount } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import type { rooms } from '#lib/store/tent.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { TENT_MAX } from '#lib/contract/tent.ts';
  import { DEFAULT_FLOOR, DEFAULT_WALL, FLOORS, GYM, ITEMS, STARTER, WALLS, footprint, iconUrl } from './items.ts';
  import { HALF, ROOM, TILE, centreOf, fitsOn, isSmall, isSurface, isWallItem, kidSpot, tilesOf, wallSnap, wallSteps, wallWhy, nearestFree, placeWhy, resolve, slotTaken, snapTo, surfaceAt, tileToSlot, type Facing, type Spot, type Why } from './grid.ts';
  import type { Tent } from './engine.ts';
  import type { DragLink } from './dragLink.ts';

  interface Props {
    /** The home's room being arranged (store/tent.svelte.ts rooms[home]): never the tent's when it's another home. */
    room: (typeof rooms)[keyof typeof rooms];
    eng: () => Tent | null;
    link: DragLink;
    /** What the balloons brought that the tent can hold (codes, newest first). */
    finds: readonly string[];
    /** What I bought at the shop (codes, newest first: model/shop.ts), mine to place. */
    bought: readonly string[];
    /** Where the villagers stand (a piece never lands on one). */
    villagers: () => readonly (readonly [number, number])[];
    /** The relay's clock (the hold's start: two people grabbing one piece). */
    relayNow: () => number;
    /** The name of whoever else holds a piece (the partner, or with the guest here, the one holding it). */
    holderName: (id: string) => string;
    ondone: () => void;
  }
  let { room, eng, link, finds, bought, villagers, relayNow, holderName, ondone }: Props = $props();

  type Tab = 'recent' | 'furniture' | 'rugs' | 'walled' | 'finds' | 'bought' | 'gym' | 'wall' | 'floor';
  /** The gym's pieces I have (found or bought: items.ts GYM), gathered on a tab of their own. */
  const gym = $derived([...new Set([...finds, ...bought])].filter((c) => GYM.has(c)));
  /** The pieces I picked last (this phone's, newest first): NH's quick access to what's at hand. */
  const RECENT_MAX = 12;
  let recent = $state<string[]>(((r) => (Array.isArray(r) ? r.filter((c): c is string => typeof c === 'string' && !!ITEMS[c]) : []))(readJson<unknown>(localKV(), DEVICE.tentRecent)));
  const TABS = $derived<Tab[]>([...(recent.length ? ['recent' as const] : []), 'furniture', 'rugs', 'walled', 'finds', ...(bought.length ? ['bought' as const] : []), ...(gym.length ? ['gym' as const] : []), 'wall', 'floor']);
  let tab = $state<Tab>('furniture');
  const list = $derived(
    tab === 'recent' ? recent : tab === 'furniture' ? STARTER.filter((c) => !ITEMS[c].rug && !ITEMS[c].wl) : tab === 'rugs' ? STARTER.filter((c) => ITEMS[c].rug)
      : tab === 'walled' ? [...new Set([...STARTER, ...finds, ...bought].filter((c) => ITEMS[c].wl))] : tab === 'finds' ? finds : tab === 'bought' ? bought : tab === 'gym' ? gym
      : tab === 'wall' ? WALLS : FLOORS
  );
  /** How many of each piece stand in the room (the icons' counts). */
  const counts = $derived(room.pieces.reduce((m, p) => m.set(p.item, (m.get(p.item) ?? 0) + 1), new Map<string, number>()));
  /** An icon pressed: its name in the bar a moment (NH's name on a held icon). */
  let peek = $state<string | null>(null);
  let peekTimer: ReturnType<typeof setTimeout> | undefined;
  function peekAt(code: string) {
    clearTimeout(peekTimer);
    peek = code;
    peekTimer = setTimeout(() => (peek = null), 1600);
  }
  function used(code: string) {
    recent = [code, ...recent.filter((c) => c !== code)].slice(0, RECENT_MAX);
    writeJson(localKV(), DEVICE.tentRecent, recent);
  }

  /** What I hold: a new piece or a placed one (`orig`: where it stood, as stored). `at` and `f` are in the room; a small
   *  thing over a surface is on it (`on`: that piece and the slot there). */
  let sel = $state<{ id: string; fresh: boolean; item: string; f: Facing; p?: number; orig?: { x: number; z: number; f: Facing; on?: string } } | null>(null);
  let at = $state<[number, number]>([0, 0]);
  let why = $state<Why | 'villager' | null>(null);
  let onto = $state<{ id: string; item: string; f: Facing; slot: [number, number]; y: number; at: [number, number] } | null>(null);

  /** The pieces as stored (a small thing on a surface: its slot there). */
  const others = (): Spot[] => room.pieces.map((p) => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f, ...(p.on ? { on: p.on } : {}) }));
  /** …and where they stand in the room. */
  const placed = () => resolve(others() as (Spot & { id: string })[]);
  /** What stands on a piece (its slot and facing there). */
  const kidsOf = (id: string) => others().filter((s) => s.on === id).map((s) => ({ id: s.id!, item: s.item, x: s.x, z: s.z, f: s.f }));
  function check(): void {
    onto = null;
    if (!sel) return void (why = null);
    // on a wall: its wall's grid (its facing is the wall: f)
    if (isWallItem(sel.item)) return void (why = wallWhy(others(), { id: sel.fresh ? undefined : sel.id, item: sel.item, x: at[0], z: at[1], f: sel.f }));
    // a small thing over a surface goes on its top (NH's table tops): on the tiles of it that hold a thing, one thing
    // a tile (a bigger one on two)
    if (isSmall(sel.item)) {
      const tiles = tilesOf({ item: sel.item, x: at[0], z: at[1], f: sel.f });
      const sur = surfaceAt(placed(), tiles[0][0], tiles[0][1], sel.id);
      if (sur) {
        const slots = tiles.map(([x, z]) => tileToSlot(sur, x, z));
        if (slots.every((q) => q)) {
          const sx = Math.min(...slots.map((q) => q![0])), sz = Math.min(...slots.map((q) => q![1])), rf = (((sel.f - sur.f) % 4) + 4) % 4;
          const k = kidSpot(sur, { item: sel.item, x: sx, z: sz, f: rf });
          onto = { id: sur.id!, item: sur.item, f: sur.f, slot: [sx, sz], y: k.y, at: k.at };
          why = !fitsOn(sur.item, sel.item, sx, sz, rf) ? 'top' : slotTaken(others(), sur.id!, sx, sz, sel.id, sel.item, rf) ? 'taken' : null;
          return;
        }
        // half over its edge
        why = 'top';
        return;
      }
    }
    const s: Spot = { id: sel.fresh ? undefined : sel.id, item: sel.item, x: at[0], z: at[1], f: sel.f };
    why = placeWhy(placed(), s);
    if (!why && !ITEMS[sel.item]?.rug) {
      const [w, d] = footprint(sel.item, sel.f), x0 = -HALF + at[0] * TILE, z0 = -HALF + at[1] * TILE;
      if (villagers().some(([x, z]) => x > x0 - 2 && x < x0 + w * TILE + 2 && z > z0 - 2 && z < z0 + d * TILE + 2)) why = 'villager';
    }
  }
  /** The ghost, what's hidden, and the partner's view of what I hold. */
  function show(): void {
    const e = eng();
    if (!e) return;
    // a piece carried with what stands on it: its things ride on the ghost, hidden where they were
    const kids = sel && !sel.fresh ? kidsOf(sel.id) : [];
    e.ghost(sel ? { item: sel.item, x: at[0], z: at[1], f: sel.f, ok: !why, y: onto ? onto.y : 0, ...(onto ? { at: onto.at } : {}), kids } : null);
    e.hide([...(sel && !sel.fresh ? [sel.id] : []), ...kids.map((k) => k.id), ...link.theirs().flatMap((h) => [h.id, ...kidsOf(h.id).map((k) => k.id)])]);
    // (a wall thing isn't streamed: the partner's phone sees it land)
    if (sel && !isWallItem(sel.item)) {
      const [cx, cz] = centreOf({ item: sel.item, x: at[0], z: at[1], f: sel.f });
      link.hold({ id: sel.id, item: sel.item, fresh: sel.fresh, x: cx, z: cz, f: sel.f }, relayNow());
    }
  }
  /** A wall thing to a point on a wall (across from its left end, up): its wall's grid. */
  function moveToWall(wall: number, u: number, y: number): boolean {
    if (!sel || !isWallItem(sel.item)) return false;
    const n = wallSnap(sel.item, u, y);
    if (n[0] === at[0] && n[1] === at[1] && sel.f === wall) return false;
    sel.f = wall as Facing;
    at = n;
    check();
    show();
    return true;
  }
  function moveTo(x: number, z: number): boolean {
    if (!sel || isWallItem(sel.item)) return false;
    const n = snapTo(sel.item, sel.f, x, z);
    if (n[0] === at[0] && n[1] === at[1]) return false;
    at = n;
    check();
    show();
    return true;
  }

  const newId = (t0: number) => `d${t0.toString(36)}${Math.floor(Math.random() * 36 ** 3).toString(36).padStart(3, '0')}`;

  function pickNew(code: string) {
    if (sel) cancel(false);
    if (room.room <= 0) {
      cue('boop');
      toasts.show(t('tent.full', { max: TENT_MAX }), 2600);
      return;
    }
    const me = villagers()[0] ?? [0, 0];
    let f: Facing = 0;
    let spot = nearestFree(placed(), code, f, me[0], me[1] - 12) ?? snapTo(code, f, 0, 0);
    if (isWallItem(code)) {
      // a wall thing: the first free spot on the back wall, from its middle out, at eye height first
      const w = ITEMS[code].w, steps = wallSteps(code), mid = Math.floor((ROOM - w) / 2);
      const tries: [number, number, number][] = [];
      for (const wall of [0, 1, 2, 3]) for (let dz = 0; dz <= steps; dz++) for (let dx = 0; dx <= ROOM; dx++)
        for (const x of [mid + dx, mid - dx]) tries.push([wall, x, Math.min(steps, Math.max(0, 3 + (dz % 2 ? -1 : 1) * Math.ceil(dz / 2)))]);
      const ok = tries.find(([wall, x, z]) => !wallWhy(others(), { item: code, x, z, f: wall as Facing }));
      [f, spot] = ok ? [ok[0] as Facing, [ok[1], ok[2]]] : [0, [Math.max(0, mid), 0]];
    }
    sel = { id: newId(Date.now()), fresh: true, item: code, f };
    at = spot;
    check();
    show();
    cue('tick');
    // (the recent list moves on only once this tab's grid is left alone: an icon never jumps under the finger)
    if (tab !== 'recent') used(code);
  }
  /** A placed piece picked up (a tap or the start of a drag on it): false when the partner holds it. */
  export function pickPlaced(id: string): boolean {
    const p = room.byId(id);
    if (!p) return false;
    if (link.heldThere(id)) {
      cue('boop');
      toasts.show(t('tent.heldThere', { name: holderName(id) }), 2000);
      return false;
    }
    if (sel?.id === id) return true;
    if (sel) cancel(false);
    // where it stands in the room (a thing on a table: its tile and facing there)
    const r = placed().find((q) => q.id === id) ?? p;
    sel = { id, fresh: false, item: p.item, f: r.f, p: p.p, orig: { x: p.x, z: p.z, f: p.f, ...(p.on ? { on: p.on } : {}) } };
    at = [r.x, r.z];
    check();
    show();
    cue('tick');
    return true;
  }

  // ---- the finger (NH's: one thing held at a time). Holding nothing, a press on a piece picks it up (a drag moves it).
  //      Holding something, the finger is for it alone: a press on it (or near it: its drawn shape and HELD_SLOP px
  //      round it) drags it, a tap turns it; a tap on the floor puts it there (where it may stand: else a red flash
  //      there, and it stays); a tap on another piece doesn't take that one (a head-shake, and the first few times
  //      「いまの かぐを おいてね」), a drag from one turns the camera, and a long press (the screen's LONG_MS) puts
  //      what I hold down and takes that one; a tap off the room puts what I hold down. The screen hands its pointer
  //      events here. ----
  const whenOf = (e: PointerEvent) => (e.timeStamp > 0 ? e.timeStamp : performance.now());
  let drag: { id: number; dx: number; dz: number; moved: boolean; held: boolean; x0: number; y0: number; t0: number; wall?: boolean; long?: boolean } | null = null;
  /** A near miss on what I hold (px round its drawn shape) is still it. */
  const HELD_SLOP = 14;
  /** Holding something (the screen's long press then may switch to another piece). */
  export const holding = (): boolean => !!sel;
  /** A pointer went down on the room: true when the mode takes it (a drag). */
  export function down(e: PointerEvent): boolean {
    const g = eng();
    if (!g) return false;
    const p = g.floorAt(e.clientX, e.clientY);
    const onGhost = (): boolean => {
      if (!sel) return false;
      const on = g.onHeld(e.clientX, e.clientY, HELD_SLOP);
      if (on === 'on') return true;
      // near it: it, unless that's on a surface it could go onto (the table's top is where a tap puts it)
      if (on === 'near') {
        const q = room.byId(g.pick(e.clientX, e.clientY) ?? '');
        return !(isSmall(sel.item) && q && !q.on && isSurface(q.item));
      }
      if (!p || isWallItem(sel.item)) return false;
      const [w, d] = footprint(sel.item, sel.f), [cx, cz] = onto?.at ?? centreOf({ item: sel.item, x: at[0], z: at[1], f: sel.f });
      return Math.abs(p[0] - cx) <= (w * TILE) / 2 + 4 && Math.abs(p[1] - cz) <= (d * TILE) / 2 + 4;
    };
    // a wall thing held: a press on it, or on its wall near it, drags it along the walls
    if (sel && isWallItem(sel.item)) {
      const wp = g.wallAt(e.clientX, e.clientY), m = ITEMS[sel.item], u = (at[0] + m.w / 2) * TILE;
      if (onGhost() || (wp && wp.wall === sel.f && Math.abs(wp.u - u) <= (m.w * TILE) / 2 + 4)) {
        drag = { id: e.pointerId, dx: 0, dz: 0, moved: false, held: true, x0: e.clientX, y0: e.clientY, t0: whenOf(e), wall: true };
        return true;
      }
      return false;
    }
    const held = onGhost();
    // holding something, a press anywhere else is the room's (a tap, a turn of the camera, a long press)
    if (sel && !held) return false;
    if (!held) {
      const id = g.pick(e.clientX, e.clientY);
      if (!id || !pickPlaced(id)) return false;
    }
    grab(e, held);
    return true;
  }
  /** The finger takes what I hold from where it is on it (a drag moves it from there). */
  function grab(e: PointerEvent, held: boolean, long = false) {
    const base = { id: e.pointerId, moved: false, held, x0: e.clientX, y0: e.clientY, t0: whenOf(e), long };
    if (sel && isWallItem(sel.item)) return void (drag = { ...base, dx: 0, dz: 0, wall: true });
    const p = eng()?.floorAt(e.clientX, e.clientY);
    if (!sel || !p) return void (drag = { ...base, dx: 0, dz: 0 });
    const [cx, cz] = centreOf({ item: sel.item, x: at[0], z: at[1], f: sel.f });
    drag = { ...base, dx: cx - p[0], dz: cz - p[1] };
  }
  /** The screen's long press on the room (the finger still a while): on another piece while I hold one, what I hold is
   *  put down (where it is when it may stand there, else back where it was) and that one taken up, the finger on it
   *  (a drag goes on moving it). True when it switched (the finger is then this mode's). */
  export function longPress(e: PointerEvent): boolean {
    const g = eng();
    if (!sel || !g) return false;
    const id = g.pick(e.clientX, e.clientY);
    if (!id || id === sel.id) return false;
    if (link.heldThere(id)) return pickPlaced(id);
    if (!why) place();
    else cancel(false);
    if (!pickPlaced(id)) return false;
    cue('villager-tap');
    grab(e, false, true);
    return true;
  }
  /** A tap, not a drag: the finger stayed within TAP_PX and let go within TAP_MS (by the events' own times: a busy frame
   *  between the press and the lift doesn't make a tap a hold; a made-up event, now). */
  const TAP_PX = 8, TAP_MS = 450;
  export function move(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.wall) {
      const wp = eng()?.wallAt(e.clientX, e.clientY);
      if (wp && moveToWall(wp.wall, wp.u, wp.y)) drag.moved = true;
      return;
    }
    // a small thing over a surface: where the finger is on its top (a tall shelf's top is far over its tiles)
    const sp = sel && isSmall(sel.item) ? eng()?.surfacePoint(e.clientX, e.clientY, sel.id) : null;
    if (sp) {
      if (moveTo(sp[0], sp[1])) drag.moved = true;
      return;
    }
    const p = eng()?.floorAt(e.clientX, e.clientY);
    if (p && moveTo(p[0] + drag.dx, p[1] + drag.dz)) drag.moved = true;
  }
  export function up(e: PointerEvent): boolean {
    if (!drag || e.pointerId !== drag.id) return false;
    const d = drag;
    drag = null;
    const tap = !d.moved && !d.long && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) <= TAP_PX && whenOf(e) - d.t0 <= TAP_MS;
    if (d.moved) cue('tick');
    // a tap on what I hold turns it a quarter, clockwise (NH's rotate); a tap that picked a piece up just picks it
    // (a wall thing's facing is its wall's: nothing to turn)
    else if (tap && d.held && !(sel && isWallItem(sel.item))) turn();
    return true;
  }
  /** A tap on a wall (no drag): a held wall thing goes there. */
  export function tapWall(wall: number, u: number, y: number): boolean {
    if (!sel || !isWallItem(sel.item)) return false;
    if (moveToWall(wall, u, y)) cue('tick');
    return true;
  }
  /** Holding a wall thing (a tap on a wall is where it goes). */
  export const holdingWall = (): boolean => !!sel && isWallItem(sel.item);
  /** A tap on the floor (no drag): the held piece goes there if it may stand there; if not, it stays where it is and
   *  the spot flashes red (the bar saying why). */
  export function tapFloor(x: number, z: number): void {
    if (!sel || isWallItem(sel.item)) return;
    const n = snapTo(sel.item, sel.f, x, z), was = at;
    if (n[0] === at[0] && n[1] === at[1]) return;
    at = n;
    check();
    if (why) {
      const w = why, there = { item: sel.item, x: n[0], z: n[1], f: sel.f, y: onto?.y ?? 0, ...(onto ? { at: onto.at } : {}) };
      at = was;
      check();
      show();
      eng()?.flash(there);
      say(t(`tent.why.${w}`), w);
      cue('boop');
      return;
    }
    show();
    cue('tick');
  }
  /** A tap (no drag) on a piece I don't hold, while I hold one: where what I hold may go (a small thing onto a table's
   *  top, a piece over a rug, a rug under a piece) it goes there; else that piece isn't taken (NH's: put this one down
   *  first): what I hold shakes its head, and the first few times the bar says so. */
  export function tapPiece(id: string, cx: number, cy: number): void {
    if (!sel) return;
    const g = eng(), q = room.byId(id);
    if (g && q && !isWallItem(sel.item) && !isWallItem(q.item)) {
      // (the tap's point on its top; or, where the ray found none, a model still popping in, its tile nearest the tap)
      const top = isSmall(sel.item) && !q.on && isSurface(q.item) ? g.surfacePoint(cx, cy, sel.id) ?? nearestTile(q, g.floorAt(cx, cy)) : null;
      const layered = !!ITEMS[q.item]?.rug !== !!ITEMS[sel.item]?.rug ? g.floorAt(cx, cy) : null;
      const pt = top ?? layered;
      if (pt) return tapFloor(pt[0], pt[1]);
    }
    refuse();
  }
  /** The middle of `q`'s tile nearest model point p (its own middle without one). */
  function nearestTile(q: Spot, p: [number, number] | null): [number, number] {
    const [w, d] = footprint(q.item, q.f), [cx, cz] = centreOf(q);
    if (!p) return [cx, cz];
    const x = Math.min(q.x + w - 1, Math.max(q.x, Math.floor((p[0] + HALF) / TILE))), z = Math.min(q.z + d - 1, Math.max(q.z, Math.floor((p[1] + HALF) / TILE)));
    return [-HALF + (x + 0.5) * TILE, -HALF + (z + 0.5) * TILE];
  }
  /** A tap off the room (no piece, no floor): what I hold is put down (if it may stand where it is). */
  export function putDown(): void {
    if (!sel) return;
    if (why) {
      eng()?.nudge();
      cue('boop');
      return;
    }
    place();
  }
  /** How many times the hint shows (this phone's): the rule learnt, only the head-shake. */
  const HINT_TIMES = 3;
  function refuse() {
    eng()?.nudge();
    cue('boop');
    const n = Number(readJson<unknown>(localKV(), DEVICE.tentHoldHint)) || 0;
    if (n >= HINT_TIMES) return;
    writeJson(localKV(), DEVICE.tentHoldHint, n + 1);
    say(t('tent.putFirst'), 'hold');
  }
  /** A word in the bar a moment (why a tap didn't move what I hold, or the hint). */
  let note = $state<{ text: string; k: string } | null>(null);
  let noteTimer: ReturnType<typeof setTimeout> | undefined;
  function say(text: string, k: string) {
    clearTimeout(noteTimer);
    note = { text, k };
    noteTimer = setTimeout(() => (note = null), 2200);
  }
  /** The partner began holding a piece: if it's mine and they took it first, I let go of it. */
  export function partnerHolds(id: string, since: number): void {
    if (sel?.id !== id || since >= link.since) return;
    cancel(false);
    toasts.show(t('tent.heldThere', { name: holderName(id) }), 2000);
  }
  /** The partner moved or took away the one I hold: let go of it. */
  export function changedThere(id: string, rm: boolean): void {
    if (sel?.id === id && rm) cancel(false);
  }

  function turn() {
    if (!sel) return;
    const [cx, cz] = centreOf({ item: sel.item, x: at[0], z: at[1], f: sel.f });
    // clockwise seen from above (a quarter turn the other way about the up axis)
    sel.f = ((sel.f + 3) % 4) as Facing;
    at = snapTo(sel.item, sel.f, cx, cz);
    check();
    show();
    cue('tick', { step: 5 });
  }
  function cancel(sound = true) {
    note = null;
    sel = null;
    why = null;
    drag = null;
    link.release();
    show();
    if (sound) cue('tick');
  }
  function place(): boolean {
    if (!sel) return false;
    if (why) {
      cue('boop');
      return false;
    }
    const s = sel;
    // on a surface: its slot there and its facing relative to the piece; else its tile in the room
    const op = onto
      ? { x: onto.slot[0], z: onto.slot[1], f: (((s.f - onto.f) % 4) + 4) % 4 as Facing, on: onto.id }
      : { x: at[0], z: at[1], f: s.f, on: undefined };
    let ok = true;
    if (s.fresh) ok = room.set({ id: s.id, item: s.item, ...op });
    else if (!s.orig || s.orig.x !== op.x || s.orig.z !== op.z || s.orig.f !== op.f || s.orig.on !== op.on) ok = room.set({ id: s.id, item: s.item, ...op, p: s.p });
    if (!ok) {
      toasts.show(t('tent.full', { max: TENT_MAX }), 2600);
      cancel(false);
      return false;
    }
    cue('confirm');
    // the op went first: the partner's phone has the piece where it lands before the drag ends
    note = null;
    sel = null;
    why = null;
    link.release();
    show();
    return true;
  }
  function putAway() {
    if (!sel || sel.fresh) return;
    // NH won't store a table with things on it: those first
    if (kidsOf(sel.id).length) {
      cue('boop');
      toasts.show(t('tent.hasThings'), 2600);
      return;
    }
    const p = room.byId(sel.id);
    cancel(false);
    if (!p || !room.remove(p.id)) return;
    cue('undo');
    toasts.show(t('tent.removed', { name: t(`tent.item.${p.item}`) }), 5000, {
      action: {
        label: t('common.undo'),
        // a removal is final: the undo puts a new one down where it stood (if the spot is still free)
        run: () => {
          const back = p.on ? !slotTaken(others(), p.on, p.x, p.z, undefined, p.item, p.f) && !!room.byId(p.on) : !placeWhy(placed(), { item: p.item, x: p.x, z: p.z, f: p.f });
          if (back) room.set({ id: newId(Date.now()), item: p.item, x: p.x, z: p.z, f: p.f, p: p.p, ...(p.on ? { on: p.on } : {}) });
        }
      }
    });
  }
  function surface(kind: 'wall' | 'floor', code: string) {
    if (room.surface(kind, code)) cue('confirm');
  }
  function done() {
    if (sel && !place()) cancel(false);
    ondone();
  }
  const current = $derived(tab === 'wall' ? (room.wall ?? DEFAULT_WALL) : tab === 'floor' ? (room.floor ?? DEFAULT_FLOOR) : null);
  const nameOf = (code: string) => t(code[0] === 'w' ? `tent.wall.${code}` : code[0] === 'g' ? `tent.floor.${code}` : `tent.item.${code}`);

  onMount(() => {
    eng()?.grid(true);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && (sel ? cancel() : done());
    addEventListener('keydown', esc);
    return () => {
      clearTimeout(noteTimer);
      removeEventListener('keydown', esc);
      sel = null;
      link.release();
      const g = eng();
      g?.ghost(null);
      g?.grid(false);
      g?.hide(link.theirs().map((h) => h.id));
    };
  });

  /** The e2e's view of the mode. */
  export const snapshot = () => ({ sel: sel ? { ...sel, x: at[0], z: at[1], on: onto?.id ?? null } : null, why, tab, note: note?.k ?? null });
</script>

<div class="te edit-tray sheet-copy" data-tent-edit>
  {#if sel}
    <div class="bar" role="toolbar" aria-label={nameOf(sel.item)}>
      <span class="say" class:bad={!!why || !!note} data-why={why ?? ''} data-note={note?.k ?? ''} aria-live="polite">{note ? note.text : why ? t(`tent.why.${why}`) : nameOf(sel.item)}</span>
      {#if !isWallItem(sel.item)}
        <button type="button" class="act" data-act="turn" data-sfx="self" aria-label={t('decor.turn')} onclick={turn}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" /><path d="M19 4v4h-4" /></svg>
        </button>
      {/if}
      {#if !sel.fresh}
        <button type="button" class="act" data-act="remove" data-sfx="self" aria-label={t('decor.remove')} onclick={putAway}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>
        </button>
      {/if}
      <button type="button" class="act" data-act="cancel" data-sfx="self" aria-label={t('decor.cancel')} onclick={() => cancel()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
      </button>
      <button type="button" class="act ok" data-act="place" data-sfx="self" aria-label={t('decor.place')} aria-disabled={!!why} onclick={place}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>
      </button>
    </div>
  {:else}
    <div class="bar hint" data-tent-hint>{peek ? nameOf(peek) : t(room.pieces.length ? 'tent.hintMove' : 'tent.hint')}</div>
  {/if}
  <div class="tray">
    <div class="tabs" role="tablist" aria-label={t('tent.edit')}>
      {#each TABS as k (k)}
        <button type="button" role="tab" class="tab" data-tab={k} data-sfx="self" aria-selected={tab === k} onclick={() => ((tab = k), cue('tick'))}>{t(`tent.tab.${k}`)}</button>
      {/each}
    </div>
    <div class="row">
      <!-- a grid that scrolls up and down under the thumb (no snapping: a tap is a tap, never the start of a jump) -->
      <div class="items" role="group" aria-label={t(`tent.tab.${tab}`)} data-tent-items>
        {#each list as code (code)}
          {@const n = counts.get(code) ?? 0}
          <button type="button" class="it" data-tent-item={code} data-sfx="self" aria-label={n ? `${nameOf(code)} ×${n}` : nameOf(code)}
            aria-pressed={current ? current === code : !!sel?.fresh && sel.item === code} class:full={!current && room.room <= 0}
            onpointerdown={() => peekAt(code)}
            onclick={() => (current ? surface(tab as 'wall' | 'floor', code) : pickNew(code))}>
            <img src={iconUrl(code)} alt="" width="48" height="48" loading="lazy" decoding="async" draggable="false" />
            {#if n}<span class="n" aria-hidden="true">{n}</span>{/if}
          </button>
        {:else}
          <p class="empty" data-tent-empty>{t('tent.findsEmpty')}</p>
        {/each}
      </div>
      <button type="button" class="done" data-tent-done data-sfx="confirm" onclick={done}>
        <span class="count" data-tent-count>{room.pieces.length}/{TENT_MAX}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg><span>{t('decor.done')}</span>
      </button>
    </div>
  </div>
</div>

<style>
  /* the tray's look is the editors' one (theme.css .edit-tray); the tent's own bits: */
  .te { z-index: 3; }
  .bar { animation: up .2s var(--ease-soft) both; }
  /* how many already stand in the room */
  .n {
    position: absolute; right: 4px; top: 4px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px; display: grid; place-items: center;
    font: 700 var(--fs-xs)/1 var(--font-num); color: var(--c-ink); background: color-mix(in srgb, var(--c-lip) 60%, var(--c-cream));
  }
  .it.full { opacity: .45; }
  .empty { grid-column: 1 / -1; margin: 0; align-self: center; padding: 12px 8px; color: var(--c-ink-soft); font-weight: 700; white-space: normal; text-align: center; }
  .count { font: 700 var(--fs-xs)/1 var(--font-num); color: var(--c-ink); }
  @keyframes up { from { translate: 0 8px; opacity: 0; } to { translate: 0 0; opacity: 1; } }
</style>
