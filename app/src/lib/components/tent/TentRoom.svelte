<script lang="ts">
  // The tent's inside (docs/design.md "The tent"): NH's largest room in 3D, behind its door on the island. The room
  // (engine.ts, three.js) comes in its own chunk once the screen opens; until its first frame the door's black covers
  // it (ui-state/doorTransition.ts). A tap on the floor walks my villager there (round the furniture); a tap on a piece
  // acts where I stand (my villager turns to it, it jiggles, a lamp turns on or off); the doormat or ‹ 島へ goes back
  // out; もようがえ arranges the room (TentEdit). The room is both of ours (store/tent.svelte.ts: the relay live, the
  // sheet for good); the partner's villager is here while they are (each phone moves its own: the `tent` intent, the
  // very walk) or while they're away; what they drag moves here as they drag it (dragLink.ts). Nothing gives ベル.
  // The say button at the bottom right opens the island's phrase picker: a phrase shows over my villager in here, and
  // on the phones whose villager is in this room too (the relay's `say` with this room's `sc`; one place at a time).
  import { goto } from '$app/navigation';
  import { asset, resolve } from '$app/paths';
  import { url3d } from '../villager3d/manifest.ts';
  import { onMount, untrack } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';
  import TentEdit from './TentEdit.svelte';
  import HomePicker from '../homes/HomePicker.svelte';
  import HhaLetter from './HhaLetter.svelte';
  import Says from '../island/Says.svelte';
  import SayPicker from '../island/SayPicker.svelte';
  import SayButton from '../island/SayButton.svelte';
  import EyeToggle from '../rooms/EyeToggle.svelte';
  import { gestures } from '../rooms/gesture.ts';
  import { firstPerson } from '#lib/store/firstPerson.svelte.ts';
  import { SAY_TAG, rememberSay, sayGate, type SaySpeaker } from '../island/say.ts';
  import { loadHha, rate, type HhaRating } from './hha.ts';
  import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
  import type { WeekView } from '#lib/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { loadTentNames } from '#lib/i18n/tent.ts';
  import { art, artUrl, villagerArt } from '#lib/art.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { doorReady, provideDoor } from '#lib/ui-state/doorTransition.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { rooms } from '#lib/store/tent.svelte.ts';
  import { layout as islandLayout } from '#lib/store/layout.svelte.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { where } from '#lib/store/where.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { leaveBy } from '../island/doorOut.ts';
  import { sendDecor } from '#lib/store/actions.ts';
  import { LIVE_URL, createLive, liveRelay, type Live } from '#lib/sync/live.ts';
  import { createLocalLive } from '#lib/sync/live-local.ts';
  import { tokyoDay, type Intent, type SayScope, type Pt as WirePt, type Relayed } from '#lib/sync/live-protocol.ts';
  import { hook } from '../island/devHooks.ts';
  import { DEFAULT_FLOOR, DEFAULT_WALL, ITEMS, STARTER, codeOfFind } from './items.ts';
  import { DOOR_IN, HALF, centreOf, nearestFree, resolve as resolveRoom, walkPath, type Pt, type Resolved } from './grid.ts';
  import { DragLink } from './dragLink.ts';
  import { seatsOf, type Seat } from './seats.ts';
  import { createSeating } from '../rooms/seating.ts';
  import { drawOff } from '#lib/ui-state/testMode.ts';
  import type { Look, Pose, Tent, Who } from './engine.ts';

  // `home`: whose home this is (docs/island-layout.md "Homes"): ウェイ's the tent's room (as it always was), うめ's house's
  // (`sc: 'u'`), the guest's (`v`); its owner arranges it (the tent's: all three), anyone may come in
  let { view, home = 'A' }: { view: WeekView; home?: Who } = $props();
  // svelte-ignore state_referenced_locally
  const room = rooms[home];
  /** The presence's scope for this home (none: the tent's, as before). */
  // svelte-ignore state_referenced_locally
  const homeSc = home === 'B' ? ('u' as const) : home === 'G' ? ('v' as const) : undefined;

  let canvas = $state<HTMLCanvasElement>();
  let eng = $state<Tent | null>(null);
  let failed = $state(false);
  let editing = $state(false);
  let edit = $state<ReturnType<typeof TentEdit>>();
  // svelte-ignore state_referenced_locally
  const me: Who = view.viewer;
  // svelte-ignore state_referenced_locally
  const partner: Who = view.viewer === 'G' ? 'A' : view.partner;
  /** Everyone else who may be in here (the guest too, or the two members on the guest's phone: one place at a time). */
  const others: Who[] = (['A', 'B', 'G'] as const).filter((w) => w !== me);
  const nameOf = (w: Who) => (w === 'G' ? view.guest.villagerName : view.people[w].villagerName);
  /** Where each of us stands in the room, a little apart (A left, B right, the guest in the middle). */
  const sideX = (w: Who, k: number) => (w === 'A' ? -k : w === 'B' ? k : 0);
  const faceOf = (w: Who) => (w === 'A' ? 1 : w === 'B' ? -1 : 1);

  // ---- the relay: the phone's one socket (the demo's two tabs share a channel; ?relay=&key= a test relay) ----
  const demo = !!week.demo;
  const testRelay = (): Live | null => {
    const url = hook('relay'), key = hook('key');
    return url && /^wss?:\/\//.test(url) && key ? createLive({ url, key: () => key }) : null;
  };
  const own = demo ? (testRelay() ?? createLocalLive(me)) : null;
  const relay: Live | null = demo ? own : LIVE_URL ? liveRelay() : null;
  // (on the relay's own clock, as the island's: a `?date=` preview shifts the day, not when a walk set off; it's set at
  // each page's load, so two phones previewing one date would disagree by the gap between their loads)
  const relayNow = () => relay?.serverNow() ?? Date.now();
  // the tent's presence and drags as before; another home's say which (`sc`), so they show only in there
  const send = (i: Intent) => relay?.send(homeSc && (i.kind === 'tent' || i.kind === 'drag') ? ({ ...i, sc: homeSc } as Intent) : i) ?? false;
  /** Whether a relayed tent or drag is about this home. */
  const here = (m: { sc?: string }) => (m.sc ?? undefined) === homeSc;
  // svelte-ignore state_referenced_locally
  const canEdit = home === 'A' || view.viewer === home;
  /** いえを かえる: a home's look is its owner's alone. */
  // svelte-ignore state_referenced_locally
  const mine = view.viewer === home;
  let picking = $state(false);
  const link = new DragLink((d) => send(d));

  /** The pieces where they stand in the room (a small thing on a table: on its top there). */
  const spots = (): Resolved[] => resolveRoom(room.pieces.map((p) => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f, ...(p.on ? { on: p.on } : {}), ...(p.l !== undefined ? { l: p.l } : {}) })));

  function lookOf(who: Who): Look | null {
    const villager = who === 'G' ? view.guest.villager : view.people[who].villager;
    const l = resolveLook({ villager, person: who });
    const key = villagerArt(l.id);
    const a = art(key), url = artUrl(key);
    // NH's 3D villager where it has one
    const model = url3d(l.id, asset('room/villagers3d/' as Parameters<typeof asset>[0]));
    return a && url ? { url, aspect: a.w / a.h, looksRight: l.looksRight, noMirror: l.noMirror, model, id: l.id } : null;
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

  /** What I bought at the shop (model/shop.ts: mine, the guest's its own), newest first: mine to place in any room I
   *  arrange. */
  const bought = $derived(week.model ? [...shopView(week.model.state, me).owned].reverse().filter((c) => ITEMS[c]) : []);

  // ---- my villager in the tent, told to the partner (the very walk) ----
  /** My last walk (for a partner who joins while it's under way). */
  let myWalk: { from: Pt; via: Pt[]; to: Pt; s: number; ms: number } | null = null;
  const r = (p: Pt): WirePt => [Math.round(Math.max(-HALF, Math.min(HALF, p[0]))), Math.round(Math.max(-HALF, Math.min(HALF, p[1])))];
  function sayWhere() {
    const at = eng?.at(me);
    if (!at) return;
    const mine = seats.mine();
    if (mine) return void send({ kind: 'tent', in: true, to: r(mine.at), ...seats.wire()! });
    const w = myWalk && relayNow() < myWalk.s + myWalk.ms ? myWalk : null;
    send(w ? { kind: 'tent', in: true, from: r(w.from), ...(w.via.length ? { via: w.via.map(r).slice(0, 10) } : {}), to: r(w.to), s: Math.round(w.s), ms: Math.round(w.ms) } : { kind: 'tent', in: true, to: r(at) });
  }
  /** Walk my villager there (standing up first, a seat's step out in front); `then` on arrival. */
  function walkTo(to: Pt, then?: () => void) {
    if (!eng) return;
    clearTimeout(arriving);
    const now0 = eng.at(me);
    if (!now0) return;
    let from: Pt = now0;
    const up = seats.stand();
    if (up) eng.put(me, (from = up));
    const pts = walkPath(spots(), from, to);
    if (!pts.length) return void then?.();
    const ms = eng.walk(me, pts);
    myWalk = { from, via: pts.slice(0, -1), to: pts[pts.length - 1], s: relayNow(), ms };
    sayWhere();
    if (then) arriving = setTimeout(then, ms + 30);
  }
  let arriving: ReturnType<typeof setTimeout> | undefined;

  // ---- sitting and lying (NH's chairs, sofas, beds: seats.ts): walk up to it, then on; one villager a seat, first wins ----
  // svelte-ignore state_referenced_locally
  const seats = createSeating<Seat>(me);
  const seatAt = (id: string, n: number) => {
    const p = spots().find((q) => q.id === id);
    return p ? (seatsOf(p)[n] ?? null) : null;
  };
  const poseOf = (st: Seat): Pose => ({ at: st.at, y: st.y, lie: st.lie, front: st.front, a: st.anchor });
  function sitOn(id: string) {
    const p = spots().find((q) => q.id === id);
    if (!p || !eng) return false;
    const go = seats.tap(seatsOf(p), eng.at(me) ?? [0, 0], relayNow, walkTo, (st) => {
      eng?.pose(me, poseOf(st));
      cue('scene-bench');
      sayWhere();
    });
    if (go === 'full') cue('boop');
    return true;
  }

  // ---- the others' villagers: each here only while they're in the tent (store/where.svelte.ts), theirs to move ----
  let peer = $state(false);
  /** Who else has the app open (the relay's presence). */
  let hereNow: readonly Who[] = [];
  const theirAt = new Map<Who, Pt>(others.map((w) => [w, [sideX(w, 9) || 0, 16] as Pt]));
  function partnerShown() {
    if (!eng) return;
    // (called on every presence news: a villager already shown stays as it is, walking, sitting or standing)
    for (const w of others) {
      const shown = where.inTent[w] && where.home[w] === home, fresh = shown && !eng.at(w);
      eng.villager(w, shown ? lookOf(w) : null);
      if (fresh) eng.put(w, theirAt.get(w)!, faceOf(w));
    }
  }
  function heardTent(m: Extract<Relayed, { kind: 'tent' }>) {
    where.heard(m);
    if (!eng) return;
    // in another home: shown nowhere here
    if (!here(m)) return partnerShown();
    const w = m.who;
    if (m.to) theirAt.set(w, m.to);
    partnerShown();
    // on a seat: one villager to a seat, the first to sit keeps it (I stand up if they were there first)
    const { seat, yields } = seats.heard(w, m);
    if (seat) {
      const st = seatAt(seat.id, seat.n), mine = seats.mine();
      if (yields && mine) {
        walkTo(mine.from);
        cue('boop');
      }
      if (st) return void eng.pose(w, poseOf(st));
    }
    if (!m.in || !m.to) return;
    if (m.from && m.s !== undefined && m.ms) {
      const ago = relayNow() - m.s;
      if (ago < m.ms) eng.walk(w, [...(m.via ?? []), m.to], { from: m.from, ago, ms: m.ms });
      else eng.put(w, m.to);
    } else eng.put(w, m.to);
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

  // ---- the phrases (island/say.ts): the say button opens the picker; a pick hops my villager and shows the phrase
  //      over it for a few seconds, here and on the phones in this room too (`say` with this room's `sc`) ----
  let says = $state<ReturnType<typeof Says>>();
  /** ハニワくん's letter open (its rating, worked out as it opened). */
  let letter = $state<HhaRating | null>(null);
  let scene = $state<HTMLElement>();
  /** The say button while its picker is open. */
  let sayAt = $state<HTMLElement | null>(null);
  let sayBtn = $state<HTMLButtonElement>();
  /** The pointerdown that closed the picker: on the room it only closes (nobody walks, the camera stays). */
  let sayClosedBy: Event | null = null;
  /** Where a phrase said in here is: this room (the tent `t`, うめ's `u`, the guest's `v`). */
  // svelte-ignore state_referenced_locally
  const saySc: SayScope = home === 'B' ? 'u' : home === 'G' ? 'v' : 't';
  /** As on the island: not in もようがえ, nor under a sheet or ハニワくん's letter. */
  const sayShown = $derived(!!eng && !failed && !editing && !picking && !letter && !ui.sheets.length);
  const sayId = (w: Who) => (w === me ? 'mine' : w === partner ? 'partner' : 'third');
  /** A villager's box on screen as the room's camera has it now (Says asks it again as it follows): from the top of
   *  its head (the engine's headPoint) down to its feet. Gone with the villager. */
  function speakerOf(w: Who): SaySpeaker {
    return {
      get isConnected() {
        // (at my villager's eyes another's balloon goes once it's out of view: behind the camera it has no place)
        const h = eng?.at(w) && eng.headPoint(w);
        return !!h && (w === me || !fpv || eng!.inView(h[0], h[1], h[2]));
      },
      getBoundingClientRect() {
        const h = eng?.headPoint(w), at = eng?.at(w);
        if (!eng || !h || !at) return new DOMRect();
        // mine, at its eyes: from the foot of the view, as one's own voice
        if (w === me && fpv && canvas) return ownVoice(canvas, insets().bottom);
        const [hx, hy] = eng.client(h[0], h[1], h[2]), [, fy] = eng.client(at[0], 0, at[1]);
        const tall = Math.max(12, fy - hy), wide = tall * 0.55;
        return new DOMRect(hx - wide / 2, hy, wide, tall);
      }
    };
  }
  /** At my villager's eyes, my own balloon stands by the middle of the view's foot. */
  const ownVoice = (c: HTMLCanvasElement, bottom: number) => {
    const r = c.getBoundingClientRect();
    return new DOMRect(r.left + r.width / 2 - 20, r.bottom - bottom - 70, 40, 40);
  };
  /** `text` over a villager in here (mine: picked here; another's: from the relay) and a hop. */
  function showSay(w: Who, text: string) {
    if (!eng?.at(w)) return;
    says?.say(sayId(w), text, speakerOf(w), { name: nameOf(w), colour: SAY_TAG[w] });
    if (!eng.walking(w) && !(w === me ? seats.mine() : seats.seated(w))) eng.hop(w);
  }
  function closeSay(by?: Event) {
    if (!sayAt) return;
    sayAt = null;
    if (by) sayClosedBy = by;
  }
  function pickSay(text: string) {
    closeSay();
    rememberSay(text); // (a quick pick again: first)
    showSay(me, text);
    sayOut.say(text);
  }
  const sayOut = sayGate((text) => void relay?.send({ kind: 'say', text, sc: saySc }));
  $effect(() => () => sayOut.stop());
  $effect(() => {
    // もようがえ, a sheet or the letter: the picker goes with its button, the balloons too in もようがえ
    if (sayAt && !sayShown) untrack(() => closeSay());
  });
  $effect(() => {
    if (editing) untrack(() => says?.hush());
  });

  // ---- the finger: a tap walks (or acts on what it's on); a drag turns the camera round the room (in the edit mode a
  //      drag that starts on a piece moves it instead); two fingers pinch to zoom and tilt ----
  /** The finger the edit mode has (TentEdit: its moves and its lift go to it alone). */
  let editId: number | null = null;
  /** The camera isn't NH's view (the reset button shows). */
  let turned = $state(false);
  const fingers = gestures({
    tap: (x, y) => tap(x, y),
    start() {
      clearTimeout(longTimer);
      eng?.moving(true);
      says?.hold(true);
    },
    drag(dx, dy) {
      if (!eng) return;
      // (at my villager's eyes the head turns: rooms/firstPerson.ts)
      if (fpv) eng.look(dx, dy);
      else eng.orbit(-dx * 0.0085, dy * 0.005);
      turned = !eng.isDefault();
    },
    pinch(scale, dy) {
      if (!eng || fpv) return;
      eng.zoom(scale);
      eng.orbit(0, dy * 0.004);
      turned = !eng.isDefault();
    },
    end() {
      eng?.moving(false);
      says?.hold(false);
    }
  });
  /** The edit mode's long press: held this still this long on another piece, it takes that one (TentEdit.longPress). */
  const LONG_MS = 400;
  let longTimer: ReturnType<typeof setTimeout> | undefined;
  function onDown(e: PointerEvent) {
    clearTimeout(longTimer);
    // the tap that closed the phrase picker only closes it
    if (e === sayClosedBy) return void (sayClosedBy = null);
    canvas?.setPointerCapture(e.pointerId);
    // the first finger down: nothing else is (a pointer whose up never came, a lost capture, is forgotten)
    if (e.isPrimary) fingers.reset();
    if (editing && !fingers.count && edit?.down(e)) {
      editId = e.pointerId;
      return;
    }
    editId = null;
    fingers.down(e);
    // holding a piece, a finger kept still on another one takes that one instead (a tap doesn't: NH's one at a time)
    if (fingers.count === 1 && editing && edit?.holding()) {
      const id = e.pointerId;
      longTimer = setTimeout(() => {
        const at = fingers.pending(id);
        if (at && edit?.longPress({ pointerId: id, clientX: at.x, clientY: at.y } as PointerEvent)) {
          fingers.reset(true);
          editId = id;
        }
      }, LONG_MS);
    }
  }
  function onMove(e: PointerEvent) {
    if (editId !== null) return void (editId === e.pointerId && edit?.move(e));
    fingers.move(e);
  }
  function onUp(e: PointerEvent) {
    clearTimeout(longTimer);
    if (editId !== null) {
      if (editId !== e.pointerId) return;
      editId = null;
      edit?.up(e);
      return;
    }
    fingers.up(e);
  }
  function onCancel(e: PointerEvent) {
    clearTimeout(longTimer);
    if (editId !== null) {
      editId = null;
      edit?.up(e);
    }
    fingers.cancel(e);
  }
  function onWheel(e: WheelEvent) {
    if (!eng) return;
    e.preventDefault();
    if (fpv) return;
    eng.zoom(Math.exp(-e.deltaY * 0.0015));
    turned = !eng.isDefault();
  }
  function resetView() {
    eng?.resetView();
    turned = false;
  }
  function tap(cx: number, cy: number) {
    if (!eng) return;
    // a wall thing held: a tap on a wall is where it goes
    if (editing && edit?.holdingWall()) {
      const wp = eng.wallAt(cx, cy);
      if (wp) return void edit.tapWall(wp.wall, wp.u, wp.y);
    }
    const h = eng.hit(cx, cy);
    // off the room (a wall, the dark round it): what the edit mode holds is put down; else a soft no
    if (!h) return void (editing ? edit?.putDown() : cue('boop'));
    if (h.kind === 'villager') {
      eng.hop(h.who);
      cue('villager-tap');
      return;
    }
    if (editing) {
      // holding a piece: a tap on another one doesn't take it (TentEdit.tapPiece: a small thing goes onto a table's top,
      // a piece over a rug; else a head-shake); the doormat is floor to the edit mode (its tiles are the door's: the bar
      // says why a piece can't go there). (Holding nothing, the press on a piece already took it.)
      if (h.kind === 'piece') return void edit?.tapPiece(h.id, cx, cy);
      const f = h.kind === 'floor' ? [h.x, h.z] : eng.floorAt(cx, cy);
      if (f) edit?.tapFloor(f[0], f[1]);
      return;
    }
    if (h.kind === 'door') return leave();
    if (h.kind === 'piece') {
      const p = room.byId(h.id), meta = p && ITEMS[p.item];
      // a chair, a sofa, a bed: walk up to it and sit or lie (physical, like the door)
      if (p && meta?.u && !p.on && sitOn(h.id)) return;
      // in place: my villager turns to it, it answers where it stands; a light switches on or off (both phones)
      const at = spots().find((q) => q.id === h.id);
      if (at) eng.face(me, centreOf(at));
      eng.bump(h.id);
      if (p && meta?.lt && canEdit) {
        const on = (p.l ?? 1) !== 1;
        room.switchLight(p.id, on);
        cue(on ? 'toggle-on' : 'toggle-off');
      } else cue('scene-decor');
      return;
    }
    walkTo([h.x, h.z]);
  }

  function leave() {
    if (leaving) return;
    leaving = true;
    cue('scene-bench');
    // out of the door: on the island my villager stands just outside this home's door (the tent's, うめ's or the
    // guest's), facing out, on every phone (island/doorOut.ts: the island's put, said here at once with the leaving)
    send({ kind: 'tent', in: false });
    leaveBy(home === 'A' ? 'campsite' : home === 'B' ? 'home-B' : 'home-G', me);
    // (back to the island without the room's `home`)
    const q = new URLSearchParams(location.search);
    q.delete('home');
    void goto(resolve('/') + (q.size ? `?${q}` : '')).finally(() => (leaving = false));
  }
  let leaving = false;

  // the room as the store has it: the pieces, the wallpaper and the floor
  $effect(() => {
    const ps = room.pieces, w = room.wall, f = room.floor, e = eng;
    void room.lights;
    if (!e) return;
    untrack(() => {
      e.pieces(resolveRoom(ps.map((p) => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f, ...(p.on ? { on: p.on } : {}), ...(p.l !== undefined ? { l: p.l } : {}) }))));
      e.room(room.lights);
      // a seat whose piece moved or went: up and off it
      const sat = seats.mine();
      if (sat && !seatAt(sat.id, sat.n)) walkTo(sat.from);
      e.surfaces(w ?? DEFAULT_WALL, f ?? DEFAULT_FLOOR);
    });
  });
  $effect(() => {
    const m = week.model;
    if (m) untrack(() => (room.rows(m.state.tent), islandLayout.rows(m.state.layout)));
  });
  $effect(() => eng?.night(nightOf(theme.tod)));
  /** At my villager's eyes (docs/design.md "First person"): the phone's choice, but never in もようがえ (the room's
   *  camera arranges it). Local only. */
  const fpv = $derived(firstPerson.on && !editing);
  $effect(() => eng?.firstPerson(fpv ? me : null));
  // the edit tray opening or closing: the usable band changes (after it has laid out)
  /** A refit to come (the tray's, after it has laid out). */
  let refit = false;
  $effect(() => {
    void editing;
    const e = eng;
    if (!e) return;
    refit = true;
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => ((refit = false), e.resize(insets())))));
    return () => ((refit = false), cancelAnimationFrame(id));
  });
  $effect(() => {
    for (const w of others) void where.inTent[w];
    untrack(() => partnerShown());
  });
  $effect(() => void loadTentNames(i18n.locale).catch(() => {}));

  // ---- the Happy Home Academy (tent/hha.ts) ----
  const roomNow = () => ({ pieces: room.pieces, wall: room.wall, floor: room.floor, lights: room.lights });
  async function openLetter(): Promise<void> {
    const table = await loadHha().catch(() => null);
    if (table) letter = rate(roomNow(), table);
  }
  /** Come in through the door (the island's goIn), not a reload or a link: only then does the letter come. */
  const throughDoor = ui.islandZ !== null;
  /** The first time someone comes in after a day's decorating (mine or the partner's), ハニワくん's letter: once a day
   *  on each phone. */
  function rateOnEntry(): void {
    if (!throughDoor) return;
    const today = tokyoDay(shared.now()), key = `${demo ? 'demo.' : ''}${me}`;
    if (!room.changed || tokyoDay(room.changed) !== today) return;
    const rated = readJson<Record<string, number>>(localKV(), DEVICE.tentRated) ?? {};
    if (rated[key] === today) return;
    writeJson(localKV(), DEVICE.tentRated, { ...rated, [key]: today });
    void openLetter();
  }

  /** The letter comes this long after coming in. */
  const HHA_AFTER_MS = 1400;
  let hhaTimer: ReturnType<typeof setTimeout> | undefined;
  onMount(() => {
    let alive = true;
    room.attach(relay, me, demo);
    // the island's layout too (a home's look changed in here goes out as its op; this home's door on the way out)
    islandLayout.attach(relay, me, demo);
    islandLayout.sink = (op) => sendDecor(op);
    // the shared island hears the partner while I'm in here too (their walks, their exit at the door): on the phone's
    // one socket it already does; the demo's tabs have a relay per screen
    shared.attach(relay, me, demo);
    room.sink = (op) => sendDecor(op);
    own?.start();
    const offs: (() => void)[] = [];
    if (relay) {
      offs.push(relay.on((m) => {
        if (m.who === me) return;
        if (m.kind === 'tent') heardTent(m);
        // a phrase said in this room (one said on the island or in another home isn't for in here)
        else if (m.kind === 'say' && m.sc === saySc) showSay(m.who, m.text);
        else if (m.kind === 'drag' && here(m)) heardDrag(m);
      }));
      offs.push(relay.onStatus((st) => {
        const was = hereNow, here = st.connected ? st.here : [];
        hereNow = here;
        peer = here.length > 0;
        // someone came: where I am in here, said to them
        if (here.some((w) => !was.includes(w))) sayWhere();
        for (const w of others) where.presence(w, here.includes(w));
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
      if (e.who !== me) eng.face(e.who, centreOf(p));
    }));
    const offDoor = provideDoor(() => (eng?.inView(0, 0, HALF - 2) ? (([x, y]) => ({ x, y }))(eng.client(0, 0, HALF - 2)) : null));
    void import('./engine.ts').then(
      ({ createTent }) => {
        if (!alive || !canvas) return;
        const e = createTent(canvas);
        e.resize(insets());
        e.night(nightOf(theme.tod));
        e.villager(me, lookOf(me));
        // in at the door, a few steps into the room (at my villager's eyes from the first frame, if that's the choice)
        e.put(me, DOOR_IN, faceOf(me));
        e.firstPerson(fpv ? me : null, true);
        eng = e;
        partnerShown();
        walkTo([sideX(me, 7), me === 'G' ? 26 : 22]);
        void e.ready.then(() => alive && doorReady());
        // after the door's iris and the walk in
        hhaTimer = setTimeout(() => alive && !editing && rateOnEntry(), HHA_AFTER_MS);
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
      clearTimeout(hhaTimer);
      for (const f of offs) f();
      ro.disconnect();
      offDoor();
      room.sink = null;
      islandLayout.sink = null;
      own?.stop();
      eng?.dispose();
      eng = null;
      delete (window as unknown as { __tent?: unknown }).__tent;
    };
  });

  let top = $state<HTMLElement>();
  let foot = $state<HTMLElement>();
  /** What covers the canvas at its top (the back button) and foot (the controls): the room fits between. */
  function insets() {
    const rc = canvas?.getBoundingClientRect();
    if (!rc) return { top: 0, bottom: 0 };
    // the foot: the edit button, or the edit mode's tray and bar (the room glides to the middle of what's left)
    const tray = editing ? document.querySelector<HTMLElement>('[data-tent-edit]') : null;
    const tb = top?.getBoundingClientRect(), fb = (tray ?? foot)?.getBoundingClientRect();
    const barTop = tray ? Math.min(...[...tray.children].map((c) => c.getBoundingClientRect().top)) : fb?.top;
    return { top: tb ? Math.max(0, tb.bottom - rc.top) : 0, bottom: barTop !== undefined ? Math.max(0, rc.bottom - barTop) : 0 };
  }

  /** The e2e's and the console's hooks (dev builds, ?demo, and the e2e's logic mode: a paired phone on a test record). */
  function hooks() {
    if (!import.meta.env.DEV && !new URLSearchParams(location.search).has('demo') && !drawOff()) return;
    (window as unknown as { __tent?: unknown }).__tent = {
      stats: () => eng?.stats(),
      loading: () => eng?.loading() ?? 0,
      mine: () => eng?.at(me),
      /** Walk my villager to a floor point (model units), as a tap there. */
      walkTo: (x: number, z: number) => walkTo([x, z]),
      v3: (who: Who) => eng?.v3(who) ?? null,
      at: (who: Who) => eng?.at(who),
      walking: (who: Who) => eng?.walking(who),
      /** A model point's client px. */
      px: (x: number, z: number, y = 0) => eng?.client(x, y, z),
      /** A tile's middle in client px. */
      tile: (x: number, z: number) => eng?.client(-HALF + (x + 0.5) * 10, 0, -HALF + (z + 0.5) * 10),
      pieces: () => room.pieces.map((p) => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f, who: p.who, ...(p.on ? { on: p.on } : {}) })),
      /** Where each piece stands in the room (a thing on a table: its tile there, and how high). */
      placed: () => spots().map((p) => ({ id: p.id, x: p.x, z: p.z, f: p.f, y: p.y })),
      surfaces: () => ({ wall: room.wall, floor: room.floor }),
      edit: () => edit?.snapshot() ?? null,
      held: () => link.theirs().map((h) => ({ id: h.id, item: h.item, x: h.x, z: h.z, f: h.f })),
      partner: () => (eng?.at(partner) ? { at: eng.at(partner), walking: eng.walking(partner) } : null),
      starter: () => STARTER,
      /** Where my villager sits or lies (null: standing), and the partner's. */
      seat: () => ((st) => (st ? { id: st.id, n: st.n, lie: st.lie } : null))(seats.mine()),
      partnerSeat: () => seats.their(partner),
      /** Anyone's villager in here (A, B or G), null when it isn't (e2e: the guest). */
      who: (w: Who) => (eng?.at(w) ? { at: eng.at(w), walking: eng.walking(w) } : null),
      lights: () => ({ room: room.lights, pieces: room.pieces.filter((p) => ITEMS[p.item]?.lt).map((p) => ({ id: p.id, on: (p.l ?? 1) === 1 })) }),
      /** The partner has the app open (the relay's presence). */
      peer: () => peer,
      hit: (cx: number, cy: number) => eng?.hit(cx, cy),
      /** The top of a villager's head in client px (a phrase's balloon stands by it). */
      head: (w: Who) => {
        const h = eng?.headPoint(w);
        return h ? eng!.client(h[0], h[1], h[2]) : null;
      },
      /** A point on a wall (0 back, 1 left, 2 right, 3 front; across from its left end and up) in client px. */
      /** The camera at rest and framed for what covers the canvas now (after the tray's re-centring). */
      still: () => !refit && !!eng?.still(),
      /** The room's HHA rating now, and the letter on screen. */
      hha: async () => rate(roomNow(), await loadHha()),
      letter: () => letter,
      wallPx: (wall: number, u: number, y: number) => {
        const th = [0, Math.PI / 2, -Math.PI / 2, Math.PI][wall], at = [[0, -HALF], [-HALF, 0], [HALF, 0], [0, HALF]][wall];
        const lx = u - HALF, lz = 0.3;
        return eng?.client(at[0] + lx * Math.cos(th) + lz * Math.sin(th), y, at[1] - lx * Math.sin(th) + lz * Math.cos(th));
      },
      /** Where the floor's middle and the usable band's middle are on screen. */
      centre: () => eng?.centre(),
      /** The first-person view (on, fully in, yaw, pitch, the eye), and a finger's look (px). */
      fpv: () => eng?.fpv() ?? null,
      look: (dx: number, dy: number) => eng?.look(dx, dy),
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

<main class="tent" bind:this={scene} data-tent data-room-home={home} data-editing={editing || undefined}>
  <h1 class="sr-only">{t('tent.title')}</h1>
  <canvas bind:this={canvas} class="room" data-room onpointerdown={onDown} onpointermove={onMove} onpointerup={onUp}
    onpointercancel={onCancel} onwheel={onWheel} aria-label={t('tent.room')}></canvas>
  <div class="top" bind:this={top}>
    {#if !editing}<NavButton kind="back" text={t('tent.back')} onclick={leave} sfx="self" />{/if}
  </div>
  {#if home !== 'A'}<p class="whose" data-guard data-home={home}>{t('tent.whose', { name: nameOf(home) })}</p>{/if}
  {#if !editing && canEdit}
    <!-- NH's room light switch: the room's own light on or off (the lamps that are on light it then) -->
    <button type="button" class="switch" class:off={!room.lights} data-tent-lights={room.lights ? 'on' : 'off'} data-sfx="self"
      aria-label={t('tent.lights')} aria-pressed={room.lights}
      onclick={() => (room.switchRoom(!room.lights), cue(room.lights ? 'toggle-on' : 'toggle-off'))}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" /></svg>
    </button>
  {/if}
  {#if !editing}
    <!-- ハニワくん's letter again: the room's rating as it is now -->
    <button type="button" class="hha" data-tent-hha data-sfx="open" aria-label={t('tent.hha.open')} onclick={() => void openLetter()}>
      <svg viewBox="0 0 64 80" aria-hidden="true"><path d="M14 70c0-12 2-20 4-28-6-2-10-7-10-11 4 0 8 3 11 6 1-10 6-27 13-27s12 17 13 27c3-3 7-6 11-6 0 4-4 9-10 11 2 8 4 16 4 28Z" /><ellipse cx="25" cy="24" rx="3.2" ry="4.2" /><ellipse cx="39" cy="24" rx="3.2" ry="4.2" /><ellipse cx="32" cy="37" rx="4" ry="5" /></svg>
    </button>
  {/if}
  {#if turned && !fpv}
    <!-- back to NH's view of the room -->
    <button type="button" class="reset" data-tent-reset data-sfx="tick" aria-label={t('tent.resetView')} onclick={resetView}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9" /><path d="M10 19v-5h4v5" /></svg>
    </button>
  {/if}
  <div class="foot" bind:this={foot}>
    {#if !editing && mine}
      <button type="button" class="edit look" data-home-look data-sfx="open" onclick={() => (picking = true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7M5.5 9.5V20h13V9.5" /><path d="M10 20v-5h4v5" /></svg>
        <span>{t('homes.title')}</span>
      </button>
    {/if}
    {#if !editing && canEdit}
      <button type="button" class="edit" data-tent-edit-open data-sfx="open" onclick={() => (editing = true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h16v5H4zM6 13V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M6 18v2M18 18v2" /></svg>
        <span>{t('tent.edit')}</span>
      </button>
    {/if}
  </div>
  {#if editing && eng}
    <TentEdit bind:this={edit} {room} eng={() => eng} {link} {finds} {bought} {relayNow} holderName={(id) => nameOf(link.theirs().find((h) => h.id === id)?.who ?? partner)}
      villagers={() => [eng?.at(me), ...others.map((w) => eng?.at(w))].filter((p): p is [number, number] => !!p)}
      ondone={() => {
        editing = false;
        heldChanged();
      }} />
  {/if}
  <Says bind:this={says} {scene} />
  {#if sayAt && scene}
    <SayPicker {scene} anchor={sayAt} onpick={pickSay} onclose={(e) => {
      closeSay(e);
      if (!e) sayBtn?.focus({ preventScroll: true }); // ✕ or Esc: the focus back on its button
    }} />
  {/if}
  {#if sayShown}
    <!-- the picker's door: bottom right, as on the island, above the foot's buttons -->
    <div class="say-dock"><SayButton bind:el={sayBtn} open={!!sayAt} onopen={(el) => (sayAt = el)} /></div>
    <!-- my villager's eyes, the say button's mirror at the bottom left -->
    <div class="eye-dock"><EyeToggle /></div>
  {/if}
  {#if letter}<HhaLetter rating={letter} onclose={() => (letter = null)} />{/if}
  {#if picking}<HomePicker bind:open={picking} who={home} />{/if}
  {#if failed}<p class="fail" role="alert">{t('tent.failed')}</p>{/if}
</main>

<style>
  .foot :global(.look) { margin-right: 8px; }
  /* the say button: bottom right, just above the foot's buttons (いえを かえる and もようがえ fill the foot's width) */
  .say-dock { position: absolute; z-index: 3; right: calc(var(--safe-right, 0px) + 8px); bottom: calc(var(--safe-bottom, 0px) + 14px + 56px + 10px); }
  .eye-dock { position: absolute; z-index: 3; left: calc(var(--safe-left, 0px) + 8px); bottom: calc(var(--safe-bottom, 0px) + 14px + 56px + 10px); }
  .whose {
    position: absolute; left: 50%; top: calc(var(--ui-top, 0px) + 70px); transform: translateX(-50%); margin: 0; padding: 6px 14px;
    border-radius: 999px; background: var(--c-cream); color: var(--c-ink); font-weight: 700; font-size: var(--fs-s, 13px); pointer-events: none;
  }
  .tent {
    position: relative; max-width: var(--col); margin: 0 auto; height: var(--vh-fill); overflow: hidden; background: #2a1f17; touch-action: none;
    /* the edit mode's plates: the island's cream at every hour (NH's game objects) */
    --plate: var(--c-cream); --plate-lip: var(--c-lip); --plate-ink: var(--c-ink);
  }
  .room { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; -webkit-tap-highlight-color: transparent; }
  .top { position: absolute; left: calc(var(--side) + var(--safe-left)); top: calc(var(--ui-top) + 8px); z-index: 2; min-height: var(--hit); }
  .foot {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; display: flex; justify-content: center; gap: 10px;
    padding: 0 12px calc(var(--safe-bottom, 0px) + 14px); pointer-events: none; min-height: 72px;
  }
  .edit {
    pointer-events: auto; appearance: none; border: 0; cursor: pointer; min-height: 56px; padding: 0 24px 0 18px; border-radius: 28px;
    display: inline-flex; align-items: center; gap: 8px; font: 700 var(--fs-body)/1 var(--font-ui); color: var(--c-ink);
    background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge), 0 6px 14px rgba(0, 0, 0, .3); -webkit-tap-highlight-color: transparent;
  }
  .edit svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .edit:active { transform: translateY(2px); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 1px 0 var(--c-leaf-edge); }
  .edit:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .switch {
    position: absolute; right: calc(var(--side) + var(--safe-right) + 62px); top: calc(var(--ui-top) + 8px); z-index: 2;
    width: 52px; height: 52px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    color: var(--c-ink); background: var(--c-yuzu, #F7D94C); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
  }
  .switch.off { background: #5A4A3A; color: #F5E4BC; }
  .switch svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .switch:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .switch:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .hha {
    position: absolute; right: calc(var(--side) + var(--safe-right) + 124px); top: calc(var(--ui-top) + 8px); z-index: 2;
    width: 52px; height: 52px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    background: var(--c-card); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
  }
  .hha svg { width: 30px; height: 36px; }
  .hha svg path { fill: #D08A52; stroke: #8C5326; stroke-width: 3; stroke-linejoin: round; }
  .hha svg ellipse { fill: #8C5326; }
  .hha:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .hha:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .reset {
    position: absolute; right: calc(var(--side) + var(--safe-right)); top: calc(var(--ui-top) + 8px); z-index: 2;
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
