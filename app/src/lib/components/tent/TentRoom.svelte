<script lang="ts">
  // The tent's inside (docs/design.md "The tent"): NH's largest room in 3D, behind its door on the island. The room
  // (engine.ts, three.js) comes in its own chunk once the screen opens; until its first frame the door's black covers
  // it (ui-state/doorTransition.ts). A tap on the floor walks my villager there (round the furniture); a tap on a piece
  // acts where I stand (my villager turns to it, it jiggles, a lamp, a TV or a fan turns on or off, a clock says the
  // time, a gadget answers: toggles.ts; an instrument is walked up to and played, a mirror or a clothes wardrobe looked
  // into and すがた opened, DressSheet; a bin gets a toss); the doormat or ‹ しまへ goes back
  // out; もようがえ arranges the room (TentEdit). The room is both of ours (store/tent.svelte.ts: the relay live, the
  // sheet for good); the partner's villager is here while they are (each phone moves its own: the `tent` intent, the
  // very walk) or while they're away; what they drag moves here as they drag it (dragLink.ts). Nothing gives ベル.
  // The say button at the bottom right opens the island's phrase picker: a phrase shows over my villager in here, and
  // on the phones whose villager is in this room too (the relay's `say` with this room's `sc`; one place at a time).
  import { lookOf as wornOf } from '#lib/store/look.ts';
  import { onMount, untrack } from 'svelte';
  import TentEdit from './TentEdit.svelte';
  import HomePicker from '../homes/HomePicker.svelte';
  import HhaLetter from './HhaLetter.svelte';
  import StereoPicker from './StereoPicker.svelte';
  import { isStereo } from './stereo.ts';
  import {
    MIRROR_MS, channelOf, dressesAt, playFrom, familyOf, gadgetOf, insideOf, isGadget, isInstrument, isSwitched, nextOf, onOf, playSpot, toyMove,
    type Act, type Gadget, type Switched
  } from './toggles.ts';
  import { timeLine } from './says.ts';
  import { HELD_PLAY } from './heldPlay.ts';
  import { SAY_MS } from '#lib/world/say.ts';
  import { wantMusic } from '#lib/sound/sound.svelte.ts';
  import { enterStage, hush, live, request, restage } from '#lib/sound/stage.svelte.ts';
  import type { KKTrack } from '#lib/sound/kk.ts';
  import RoomSay from '../rooms/RoomSay.svelte';
  import RoomShell from '../rooms/RoomShell.svelte';
  import { heardRoom, insetsOf, onPresence, roomDoor, roomExit, showOthers, startRoom, tentLook, walkIntent, type MyWalk } from '../rooms/roomLife.ts';
  import { roomTiming } from '../rooms/roomTiming.ts';
  import { replayWalk, roomRelay } from '../rooms/roomRelay.ts';
  import { nightOf } from '../rooms/speaker.ts';
  import { gestures, roomCamera } from '../rooms/gesture.ts';
  import { firstPerson } from '#lib/store/firstPerson.svelte.ts';
  import { lens } from '../rooms/lens.svelte.ts';
  import { shot } from '../rooms/shot.svelte.ts';
  import { loadHha, rate, type HhaRating } from './hha.ts';
  import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
  import type { WeekView } from '#lib/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/rooms.ts'; // its strings, loaded with it
  import { loadTentNames } from '#lib/i18n/tent.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { doorReady } from '#lib/ui-state/doorTransition.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { rooms } from '#lib/store/tent.svelte.ts';
  import { layout as islandLayout } from '#lib/store/layout.svelte.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { where } from '#lib/store/where.svelte.ts';
  import { loopNow, useLoopClock } from '../villager3d/loopClock.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { leaveBy } from '../island/doorOut.ts';
  import { sendDecor, sendDecorGroup, sendDecors } from '#lib/store/actions.ts';
  import { SAVE_SLOTS, type RoomSaveOp } from '#lib/contract/roomSave.ts';
  import { TENT_FAVS_MAX, type RoomSize } from '#lib/contract/tent.ts';
  import { tokyoDayNum, type Intent, type SayScope, type Relayed } from '#lib/contract/live-protocol.ts';
  import { DEFAULT_FLOOR, DEFAULT_WALL, ITEMS, STARTER, codeOfCatch, codeOfFind } from './items.ts';
  import { DOOR_IN, HALF, TILE, boundsOf, centreOf, clampIn, isWallItem, nearestFree, onFloor, outside, rectOf, resolve as resolveRoom, standable, wallMid, wallSpan, wallSteps, wallWhy, walkPath, type Facing, type Pt, type Resolved, type Spot } from './grid.ts';
  import { DragLink } from './dragLink.ts';
  import { seatsOf, usable, type Seat } from './seats.ts';
  import { ACT_PIECES, STAND_PIECES } from '../world3d/heldProps.ts';
  import type { Once } from '../villager3d/poses-stand.ts';
  import { createSeating } from '../rooms/seating.ts';
  import { testHooks } from '#lib/ui-state/testMode.ts';
  import type { Pose, Tent, Who } from './engine.ts';
  import { quiet } from '#lib/quiet.ts';

  // `home`: whose home this is (docs/island-layout.md "Homes"): ウェイ's the tent's room (as it always was), うめ's house's
  // (`sc: 'u'`), the guest's (`v`); anyone comes in and arranges it (2026-11-10: each of us any room, with what they
  // have: the starter set, the island's finds, their own buys), its look its owner's
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
  const { own, relay, now: relayNow } = roomRelay(demo, me);
  // (on the relay's own clock, as the island's: a `?date=` preview shifts the day, not when a walk set off; it's set at
  // each page's load, so two phones previewing one date would disagree by the gap between their loads)
  // the tent's presence and drags as before; another home's say which (`sc`), so they show only in there
  const send = (i: Intent) => relay?.send(homeSc && (i.kind === 'tent' || i.kind === 'drag') ? ({ ...i, sc: homeSc } as Intent) : i) ?? false;
  /** Whether a relayed tent or drag is about this home. */
  const here = (m: { sc?: string }) => (m.sc ?? undefined) === homeSc;
  /** いえを かえる: a home's look is its owner's alone. */
  // svelte-ignore state_referenced_locally
  const mine = view.viewer === home;
  let picking = $state(false);
  const link = new DragLink((d) => send(d));

  /** The room's size (store/tent: NH's main rooms, the largest unless its owner chose another). */
  const bounds = $derived(boundsOf(room.size));
  /** The pieces as stored, but any a smaller room can't hold (a piece an old phone put outside it, or one placed as the
   *  room shrank on the other phone): kept, not drawn, there again when the room grows. */
  function inRoom(): (Spot & { id: string; l?: 0 | 1; ch?: number })[] {
    // (a screen's channel: its switch's time, toggles.ts)
    const all = room.pieces.map((p) => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f, ...(p.on ? { on: p.on } : {}), ...(p.l !== undefined ? { l: p.l } : {}),
      ...(familyOf(p.item) === 'screen' ? { ch: channelOf(room.switchedAt(p.id)) } : {}) }));
    const out = new Set(outside(all, bounds).map((s) => s.id));
    return out.size ? all.filter((p) => !out.has(p.id) && !(p.on && out.has(p.on))) : all;
  }
  /** The pieces where they stand in the room (a small thing on a table: on its top there). */
  const spots = (): Resolved[] => resolveRoom(inRoom());

  const lookOf = (who: Who) => tentLook(who, view);
  // a look changed (on leaving すがた, or the partner's phone): the model swapped where it is
  $effect(() => {
    for (const w of [me, ...others]) void wornOf(w);
    untrack(() => {
      if (!eng) return;
      if (eng.at(me)) eng.villager(me, lookOf(me));
      partnerShown();
    });
  });

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

  /** The critters' tanks of the ずかん's catches (anyone's first: NH's caught critter put down indoors), newest first. */
  const catches = $derived.by(() => {
    const fs = week.model?.state.finds ?? [];
    const out: string[] = [];
    for (let i = fs.length - 1; i >= 0; i--) {
      const f = fs[i];
      const c = f.kind === 'fish' || f.kind === 'bug' || f.kind === 'sea' ? codeOfCatch(`${f.kind}:${f.id}`) : null;
      if (c && !out.includes(c)) out.push(c);
    }
    return out;
  });

  /** What I bought at the shop (model/shop.ts: mine, the guest's its own), newest first: mine to place in any room I
   *  arrange. */
  const bought = $derived(week.model ? [...shopView(week.model.state, me).owned].reverse().filter((c) => ITEMS[c]) : []);
  /** When each piece came (a find's or a catch's `at`, my buy's): もようがえ's 新しい順, 新着 and NEW. */
  const got = $derived.by(() => {
    const m = new Map<string, number>();
    const at = (c: string | null, t: number) => c && t > (m.get(c) ?? 0) && m.set(c, t);
    for (const f of week.model?.state.finds ?? []) at(f.kind === 'item' ? codeOfFind(f.id) : f.kind === 'fish' || f.kind === 'bug' || f.kind === 'sea' ? codeOfCatch(`${f.kind}:${f.id}`) : null, f.at);
    if (week.model) for (const [c, t] of shopView(week.model.state, me).ownedAt) at(c, t);
    return m;
  });
  /** My もようがえ favourites (`pref tentFavs`, contract/tent.ts: synced, each person's own), newest first. */
  const favs = $derived(week.model?.state.prefs[me]?.tentFavs ?? []);
  function fav(code: string, on: boolean): boolean {
    const next = on ? [code, ...favs.filter((c) => c !== code)].slice(0, TENT_FAVS_MAX) : favs.filter((c) => c !== code);
    return week.send('pref', { key: 'tentFavs', value: next.length ? next : null }).ok;
  }
  /** What this home's owner bought (a saved arrangement may put it down: TentEdit's rule). */
  const ownerBought = $derived(new Set(week.model ? shopView(week.model.state, home).owned : []));
  /** This room's saved arrangements, slot by slot (each slot's last row; emptied: null). */
  const saves = $derived.by(() => {
    const out: (Extract<RoomSaveOp, { name: string }> | null)[] = Array(SAVE_SLOTS).fill(null);
    for (const s of week.model?.state.roomSaves ?? []) if (s.sc === room.sc) out[s.n - 1] = s.rm ? null : s;
    return out;
  });

  // ---- my villager in the tent, told to the partner (the very walk) ----
  /** My last walk (for a partner who joins while it's under way). */
  let myWalk: MyWalk | null = null;
  function sayWhere() {
    const at = eng?.at(me);
    if (!at) return;
    const mine = seats.mine();
    // (on a seat: where I get up from, so the other phones pick the seat's same side: seatAt's `near`)
    send(mine ? { ...walkIntent(null, mine.from, 0, rectOf(bounds)), ...seats.wire()! } : walkIntent(myWalk, at, relayNow(), rectOf(bounds)));
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
    const pts = walkPath(spots(), from, to, bounds);
    if (!pts.length) return void then?.();
    const ms = eng.walk(me, pts);
    myWalk = { from, via: pts.slice(0, -1), to: pts[pts.length - 1], s: relayNow(), ms };
    sayWhere();
    // (up from under a lid: it opens first)
    if (then) arriving = setTimeout(then, eng.upIn(me) + ms + 30);
  }
  let arriving: ReturnType<typeof setTimeout> | undefined;

  // ---- sitting and lying (NH's chairs, sofas, beds: seats.ts): walk up to it, then on; one villager a seat, first wins ----
  // svelte-ignore state_referenced_locally
  const seats = createSeating<Seat>(me);
  // (each gets on and off from its nearest free side: a step off the footprint no piece or wall is on)
  const canStand = (at: Pt) => standable(spots(), at, bounds);
  const seatAt = (id: string, n: number, near?: Pt) => {
    const p = spots().find((q) => q.id === id);
    return p ? (seatsOf(p, canStand, near)[n] ?? null) : null;
  };
  const poseOf = (st: Seat): Pose => ({ at: st.at, y: st.y, lie: st.lie, front: st.front, a: st.anchor, id: st.id });
  function sitOn(id: string) {
    const p = spots().find((q) => q.id === id);
    if (!p || !eng) return false;
    const here = eng.at(me) ?? [0, 0];
    const go = seats.tap(seatsOf(p, canStand, here), here, relayNow, walkTo, (st) => {
      eng?.pose(me, poseOf(st));
      cue('scene-bench');
      sayWhere();
    });
    if (go === 'full') cue('boop');
    return true;
  }

  // ---- the others' villagers: each here only while they're in the tent (store/where.svelte.ts), theirs to move ----
  let peer = $state(false);
  /** Where each one in here was last said to be (their room's word: shown only once heard, never at a made-up spot). */
  const theirAt = new Map<Who, Pt>();
  // svelte-ignore state_referenced_locally
  // (one not here any more, out, in another place or timed out, lets go of their seat)
  const partnerShown = () => showOthers(eng, others, home, lookOf, theirAt, faceOf, seats.gone);
  function heardTent(m: Extract<Relayed, { kind: 'tent' }>) {
    // someone walked in here: where I am, said to them at once
    heardRoom(m, here, sayWhere);
    // (heard before the engine is up, the room's replay after its welcome too: drawn from where.tentOf once it is)
    if (eng) showTent(m);
  }
  /** What a `tent` says of someone, shown: where they are in here, walking, sitting or using a piece. */
  function showTent(m: Extract<Relayed, { kind: 'tent' }>) {
    if (!eng) return;
    // in another home: shown nowhere here
    if (!here(m)) return partnerShown();
    const w = m.who;
    if (m.to) theirAt.set(w, m.to);
    partnerShown();
    // on a seat: one villager to a seat, the first to sit keeps it (I stand up if they were there first)
    const { seat, yields } = seats.heard(w, m);
    if (seat) {
      const st = seatAt(seat.id, seat.n, m.to ?? eng.at(w) ?? undefined), mine = seats.mine();
      if (yields && mine) {
        walkTo(mine.from);
        cue('boop');
      }
      if (st) return void eng.pose(w, poseOf(st));
    }
    if (!m.in || !m.to) return;
    replayWalk(eng, m, relayNow());
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

  // ---- the phrases (rooms/RoomSay): here and on the phones in this room too (`say` with this room's `sc`) ----
  let roomSay = $state<ReturnType<typeof RoomSay>>();
  /** ハニワくん's letter open (its rating, worked out as it opened). */
  let letter = $state<HhaRating | null>(null);
  let scene = $state<HTMLElement>();
  /** Where a phrase said in here is: this room (the tent `t`, うめ's `u`, the guest's `v`). */
  // svelte-ignore state_referenced_locally
  const saySc: SayScope = home === 'B' ? 'u' : home === 'G' ? 'v' : 't';
  /** As on the island: not in もようがえ, nor under a sheet or ハニワくん's letter. */
  const sayShown = $derived(!!eng && !failed && !editing && !picking && !letter && !ui.sheets.length);
  $effect(() => {
    // もようがえ: the balloons go too (the picker goes with its button)
    if (editing) untrack(() => roomSay?.hush());
  });

  // ---- the finger: a tap walks (or acts on what it's on); a drag turns the camera round the room (in the edit mode a
  //      drag that starts on a piece moves it instead); two fingers pinch to zoom and pan the view ----
  /** The finger the edit mode has (TentEdit: its moves and its lift go to it alone). */
  let editId: number | null = null;
  /** The camera isn't NH's view (the reset button shows). */
  let turned = $state(false);
  const camera = roomCamera(() => eng, () => fpv, (off) => (turned = off));
  const fingers = gestures({
    tap: (x, y) => tap(x, y),
    start() {
      clearTimeout(longTimer);
      eng?.moving(true);
      roomSay?.hold(true);
    },
    ...camera.fingers,
    end() {
      eng?.moving(false);
      roomSay?.hold(false);
    }
  });
  /** The edit mode's long press: held this still this long on another piece, it takes that one (TentEdit.longPress). */
  const LONG_MS = 400;
  let longTimer: ReturnType<typeof setTimeout> | undefined;
  function onDown(e: PointerEvent) {
    clearTimeout(longTimer);
    // the tap that closed the phrase picker only closes it
    if (roomSay?.closedBy(e)) return;
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
  function resetView() {
    eng?.resetView();
    turned = false;
  }
  /** Taps the room took (the e2e's: a finger held past the tap's time under load isn't one). */
  let taps = 0;
  function tap(cx: number, cy: number) {
    if (!eng) return;
    taps++;
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
      // a chair, a sofa, a bed, a piece used (the gym's, a bath, a stall): walk up to it and sit, lie or use it
      if (p && (STAND_PIECES[p.item] || ACT_PIECES[p.item])) return void standAt(p.id);
      if (p && usable(p.item) && !p.on && sitOn(h.id)) return;
      const fam = p ? familyOf(p.item) : null;
      // an instrument: my villager walks up to it and plays a few seconds (toggles.ts; this phone's alone); a mirror, a
      // rack, a clothes wardrobe: up to it, a look, then すがた; a bin: up to it and a toss
      if (p && isInstrument(fam)) return actAt(p.id, fam);
      if (p && dressesAt(p.item)) return actAt(p.id, 'mirror');
      if (p && fam === 'bin') return actAt(p.id, 'toss');
      // in place: my villager turns to it, it answers where it stands; a light switches on or off (both phones)
      const at = spots().find((q) => q.id === h.id);
      // (a look inside, a clock's time: facing it while the line shows)
      if (at) eng.face(me, centreOf(at), fam === 'closet' || fam === 'clock' ? SAY_MS : 0);
      // a wardrobe's or a fridge's door, a toy's move (this phone's)
      if (p && fam === 'closet') return peek(p.id, p.item);
      if (p && fam === 'toy') {
        const mv = toyMove(p.item);
        eng.react(h.id, mv);
        return cue(TOY_CUE[mv]);
      }
      if (p && fam === 'clock') return sayTime(p.id);
      if (p && isGadget(fam)) return gadget(p.id, p.item, fam);
      eng.bump(h.id);
      // a music player (stereo.ts): playing, a tap stops it (for everyone in here); else its song list
      if (p && isStereo(p.item)) {
        if (stereo === p.id) {
          hush(stageSrc);
          cue('toggle-off');
        } else {
          stereoPick = p.id;
          cue('open');
        }
        return;
      }
      // a screen, a fan, a tap… on or off, a screen's channel (both phones, kept)
      if (p && isSwitched(fam)) return switchPiece(p.id, p.item, p.l, fam);
      if (p && meta?.lt) {
        const on = (p.l ?? 1) !== 1;
        room.switchLight(p.id, on);
        cue(on ? 'toggle-on' : 'toggle-off');
      } else cue('scene-decor');
      return;
    }
    if (h.kind === 'floor') walkTo([h.x, h.z]);
  }

  // ---- what the pieces do (toggles.ts): a switched piece's state is the room's (its light switch: both phones, kept);
  //      a play, a door, a toy this phone's alone ----
  const ON_CUE: Record<Switched, Parameters<typeof cue>[0]> = { screen: 'room-screen', fan: 'room-fan', washer: 'room-washer', water: 'room-water', steam: 'room-steam', heater: 'toggle-on', glow: 'toggle-on' };
  const TOY_CUE: Record<ReturnType<typeof toyMove>, Parameters<typeof cue>[0]> = { sway: 'room-tick', rock: 'scene-bench', spin: 'scene-cast', shake: 'scene-shell', flip: 'scene-sand', hop: 'room-toy' };
  function switchPiece(id: string, item: string, l: 0 | 1 | undefined, fam: Switched) {
    const on = onOf(l, !!ITEMS[item]?.lt), next = nextOf(fam, on, channelOf(room.switchedAt(id)));
    room.switchTo(id, next.l, next.ch);
    cue(!next.l ? 'toggle-off' : on ? 'room-channel' : ON_CUE[fam]);
  }
  /** The look inside a wardrobe or a fridge: its door, and what my villager finds there (a line over it, here). */
  let peeks = 0;
  function peek(id: string, item: string) {
    eng?.react(id, 'door');
    cue('room-door');
    roomSay?.say(me, t(`tent.peek.${insideOf(item)}.${peeks++ % 3}`));
  }
  /** A clock: my villager says the Tokyo time (the scene clock: `?date` too), the clock ticking. */
  function sayTime(id: string) {
    eng?.bump(id);
    cue('room-tick');
    roomSay?.say(me, timeLine());
  }
  /** A gadget's answer where it stands (toggles.ts gadgetOf): its move, its flourish, its cue. */
  function gadget(id: string, item: string, fam: Gadget) {
    const g = gadgetOf(item, fam);
    eng?.react(id, g.move);
    if (g.spark) eng?.spark(id, g.spark);
    cue(g.cue);
  }
  /** Play an instrument, look in a mirror, toss into a bin: up to its front (else a side, its back: toggles.ts
   *  playSpot; a thing on a table, the table's), turned to it, the act's pose (an instrument's riff, a mirror's line
   *  then すがた, a toss's line); in place when there's nowhere to stand (sitting: the piece answers alone). */
  let lines = 0;
  function actAt(id: string, act: Act) {
    const all = spots(), at = all.find((q) => q.id === id);
    if (!at || !eng) return;
    const base = (at.on && all.find((q) => q.id === at.on)) || at, m = ITEMS[base.item];
    const c = at.at ?? centreOf(at), here = eng.at(me) ?? [0, 0];
    // (an instrument from the side the camera sees the player's face; one lifted into the hands from its side, then
    // turned to the camera: toggles.ts playFrom, heldPlay.ts)
    const held = isInstrument(act) && !!HELD_PLAY[at.item];
    const from = held ? 'side' : isInstrument(act) ? playFrom(at.item, act) : 'front';
    const go = m && playSpot(centreOf(base), [(m.w * TILE) / 2, (m.d * TILE) / 2], base.f, canStand, here, from);
    const sound = () => cue(act === 'mirror' ? 'room-dress' : act === 'toss' ? 'room-toss' : `room-play-${act}`);
    const start = () => {
      const p = eng?.at(me);
      eng?.face(me, held && p ? [p[0], p[1] + 100] : c);
      eng?.play(me, act, id);
      sound();
      if (act === 'toss') roomSay?.say(me, t(`tent.toss.${lines++ % 3}`));
      if (act !== 'mirror') return;
      roomSay?.say(me, t(`tent.dress.${lines++ % 3}`));
      // (すがた once the look's over, unless a walk or another tap put it down first)
      clearTimeout(dressAt);
      dressAt = setTimeout(() => eng?.playing(me) === 'mirror' && dress(), MIRROR_MS - 150);
    };
    if (go && Math.hypot(go[0] - here[0], go[1] - here[1]) > 1.5) walkTo(go, start);
    else if (!seats.mine()) start();
    else if (act === 'mirror') dress();
    else {
      eng.react(id, act === 'toss' ? 'gulp' : 'play');
      sound();
    }
  }
  /** すがた (look/DressSheet, the route's: the dresser, as せってい's 姿 level), over the room; closed, the room as it was. */
  let dressAt: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => (clearTimeout(dressAt), (ui.dress = false)));
  function dress() {
    ui.dress = true;
  }

  // ---- the pieces stood at (world3d/heldProps.ts; docs/design.md "The gym": Stood at) ----
  const ONCE_CUE: Record<Once, Parameters<typeof cue>[0]> = {
    sip: 'room-water', photo: 'scene-glint', call: 'room-tick', dart: 'scene-cast', cue: 'scene-clonk', shoot: 'scene-launch', kick: 'scene-kon',
    cook: 'room-steam', hammer: 'scene-clonk', type: 'room-tick', peer: 'scene-glint', read: 'room-tick', write: 'room-tick'
  };
  /** A stove, a desk, a shelf: up to it and on (its use is the seat's: both phones); on a table or with nowhere free to
   *  stand at it, its use a while here, in place. A one-off (a drink, a photo, a call, a dart, a shot, a kick): up to it
   *  (playSpot's tiers; a thing on a table, the table's), turned to it, played once, this phone's. */
  function standAt(id: string) {
    const all = spots(), at = all.find((q) => q.id === id), p = room.byId(id);
    if (!at || !p || !eng) return;
    const once: Once | undefined = ACT_PIECES[p.item]?.act;
    if (!once && !at.on && seatsOf(at, canStand).length) return void sitOn(id);
    const base = (at.on && all.find((q) => q.id === at.on)) || at, m = ITEMS[base.item];
    const c = at.at ?? centreOf(at), here = eng.at(me) ?? [0, 0];
    const go = m && playSpot(centreOf(base), [(m.w * TILE) / 2, (m.d * TILE) / 2], base.f, canStand, here);
    const a: Once = once ?? STAND_PIECES[p.item].use;
    const start = () => {
      eng?.face(me, c);
      eng?.act(me, a, id);
      cue(ONCE_CUE[a]);
    };
    if (go && Math.hypot(go[0] - here[0], go[1] - here[1]) > 1.5) walkTo(go, start);
    else if (seats.mine()) walkTo(seats.mine()!.from, start);
    else start();
  }

  /** This room's music stage (sound/stage.svelte.ts: the tent's `t`, うめ's `u`, the guest's `v`), shared by everyone
   *  in here: the music player playing (its piece, while it stands: one put away mid-song is silent, nothing sent), the
   *  one whose song list is open, the last song it played. */
  // svelte-ignore state_referenced_locally
  const stageSrc = homeSc ?? 't';
  const standing = (id: string | undefined) => !!id && room.pieces.some((p) => p.id === id);
  const stereo = $derived.by(() => {
    const pc = live(stageSrc)?.pc;
    return standing(pc) ? pc! : null;
  });
  let stereoPick = $state<string | null>(null);
  let stereoLast = $state<string | null>(null);
  /** A song for the picked player, for everyone in here (from the pick's tap: ミュージック on here, as K.K.'s). */
  function playStereo(song: KKTrack) {
    const id = stereoPick;
    stereoPick = null;
    if (!id) return void cue('boop');
    wantMusic();
    request(stageSrc, song.id, { pc: id });
    stereoLast = song.id;
  }
  // a song starts on a player (anyone's): it bumps; one put away or back: the sound follows
  $effect(() => {
    const id = stereo;
    untrack(() => {
      if (id) eng?.bump(id);
      restage();
    });
  });

  // out of the door: on the island my villager stands just outside this home's door (the tent's, うめ's or the guest's),
  // facing out, on every phone (island/doorOut.ts: the island's put, said here at once with the leaving); back to the
  // island without the room's `home`
  const leave = roomExit(() => (leaveBy(home === 'A' ? 'campsite' : home === 'B' ? 'home-B' : 'home-G', me), send({ kind: 'tent', in: false })), 'home');

  // the room as the store has it: the pieces, the wallpaper and the floor
  $effect(() => {
    const w = room.wall, f = room.floor, e = eng, b = bounds;
    void room.pieces;
    void room.lights;
    if (!e) return;
    untrack(() => {
      // the room's size first (its walls, the camera's framing); a villager left outside a smaller room steps in
      e.size(b);
      for (const who of [me, ...others]) {
        const at = e.at(who);
        if (at && !onFloor(at, b)) e.put(who, clampIn(at, b));
      }
      e.pieces(spots());
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
  $effect(() => eng?.lens(lens.fov));
  $effect(() => eng?.faceCam(shot.faceCam));
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
    const table = await quiet(loadHha(), 'tent.hha', null);
    if (table) letter = rate(roomNow(), table);
  }
  /** Come in through the door (the island's goIn), not a reload or a link: only then does the letter come. */
  const throughDoor = ui.islandZ !== null;
  /** The first time someone comes in after a day's decorating (mine or the partner's), ハニワくん's letter: once a day
   *  on each phone. The day on the ops' own clock (opClock: the relay's, never a `?date=` preview's). */
  function rateOnEntry(): void {
    if (!throughDoor) return;
    const today = tokyoDayNum(shared.serverNow()), key = `${demo ? 'demo.' : ''}${me}`;
    if (!room.changed || tokyoDayNum(room.changed) !== today) return;
    const rated = readJson<Record<string, number>>(localKV(), DEVICE.tentRated) ?? {};
    if (rated[key] === today) return;
    writeJson(localKV(), DEVICE.tentRated, { ...rated, [key]: today });
    void openLetter();
  }

  /** The letter comes this long after coming in. */
  const HHA_AFTER_MS = 1400;
  let hhaTimer: ReturnType<typeof setTimeout> | undefined;
  /** One said to be inside with no word yet of where: drawn at their side of the room this long after I came in. */
  const UNHEARD_MS = 4000;
  let unheard: ReturnType<typeof setTimeout> | undefined;
  onMount(() => {
    let alive = true;
    const timing = roomTiming(home === 'A' ? 'tent' : 'home');
    room.attach(relay, me, demo);
    // the island's layout too (a home's look changed in here goes out as its op; this home's door on the way out)
    islandLayout.attach(relay, me, demo);
    islandLayout.sink = (ops) => sendDecors(ops);
    // the shared island hears the partner while I'm in here too (their walks, their exit at the door): on the phone's
    // one socket it already does; the demo's tabs have a relay per screen
    shared.attach(relay, me, demo);
    room.sink = (op) => sendDecor(op);
    room.sinkMany = (ops) => sendDecorGroup(ops);
    // this room's music stage is heard in here, its player standing
    const leaveStage = enterStage(stageSrc, (s) => standing(s.pc));
    own?.start();
    const offs: (() => void)[] = [];
    if (relay) {
      offs.push(relay.on((m) => {
        if (m.who === me) return;
        if (m.kind === 'tent') heardTent(m);
        // a phrase said in this room (one said on the island or in another home isn't for in here)
        else if (m.kind === 'say' && m.sc === saySc) roomSay?.say(m.who, m.text);
        else if (m.kind === 'drag' && here(m)) heardDrag(m);
      }));
      offs.push(onPresence(relay, others, (here, came) => {
        peer = here.length > 0;
        // someone came: where I am in here, said to them
        if (came) sayWhere();
        if (!peer && link.gone()) heldChanged();
        partnerShown();
      }));
    }
    // the partner's change, just made: it bumps where it lands and their villager turns to it
    offs.push(room.on(({ e, live }) => {
      // (a light's switch alone never moves the piece: a piece in my hands stays there)
      if (e.lt === undefined) edit?.changedThere(e.id, !!e.rm);
      if (!live || e.rm || !eng) return;
      const p = room.byId(e.id);
      if (!p) return;
      eng.bump(e.id);
      // a switch is a tap on the piece, which turned them to it on their phone: here too; a piece placed or moved turns
      // nobody (on their phone it didn't: no intent says so)
      if (e.lt !== undefined && e.who !== me) eng.face(e.who, centreOf(p));
    }));
    const offDoor = roomDoor(() => eng, 0, HALF - 2);
    const fail = () => ((failed = true), doorReady());
    void import('./engine.ts').then(
      async ({ createTent }) => {
        if (!alive || !canvas) return;
        // (a WebGL context lost as it's made throws here: the room's failure, not a white room for good)
        const e = await startRoom(() => createTent(canvas!), () => alive && !!canvas, (e) => {
          e.resize(insets());
          e.night(nightOf(theme.tod));
          e.villager(me, lookOf(me));
          // in at the door, a few steps into the room (at my villager's eyes from the first frame, if that's the choice)
          e.put(me, DOOR_IN, faceOf(me));
          e.lens(lens.fov, true);
          e.firstPerson(fpv ? me : null, true);
          e.onDrawn(() => roomSay?.track());
        }, fail);
        if (!e) return;
        eng = e;
        timing.engine(e, e.loading);
        // the others already in here where their last word has them (heard on the island, or before the engine was up;
        // their rooms say it again as mine comes in), and mine at the door, said at once (their rooms answer it)
        for (const w of others) {
          const m = where.tentOf(w);
          if (m && here(m)) showTent(m);
        }
        partnerShown();
        sayWhere();
        // (one inside whose word had no place in it: at their side of the room after a while, not never)
        unheard = setTimeout(() => {
          for (const w of others) if (!theirAt.has(w)) theirAt.set(w, [sideX(w, 9), 16]);
          partnerShown();
        }, UNHEARD_MS);
        // (once the room's first frame is drawn, the iris opening: it waits for my villager's model, engine.ts holding)
        void e.ready.then(() => {
          if (!alive) return;
          // (a tap already on its way, made as the room came up, wins: no walk in over it, cancelling its arrival)
          if (!myWalk) walkTo([sideX(me, 7), me === 'G' ? 26 : 22]);
          doorReady();
        });
        // after the door's iris and the walk in
        hhaTimer = setTimeout(() => alive && !editing && rateOnEntry(), HHA_AFTER_MS);
        hooks();
      },
      fail
    );
    return () => {
      alive = false;
      send({ kind: 'tent', in: false });
      link.stop();
      if (expiry) clearInterval(expiry);
      clearTimeout(hhaTimer);
      clearTimeout(unheard);
      // (a walk to a seat or a long press still on its way: nothing of it once out)
      clearTimeout(arriving);
      clearTimeout(longTimer);
      for (const f of offs) f();
      offDoor();
      leaveStage();
      room.sink = null;
      room.sinkMany = null;
      islandLayout.sink = null;
      own?.stop();
      timing.stop();
      eng?.dispose();
      eng = null;
      delete window.__tent;
    };
  });

  let top = $state<HTMLElement>();
  let foot = $state<HTMLElement>();
  /** What covers the canvas at its top (the back button) and foot (the controls): the room fits between. */
  function insets() {
    // the foot: the edit button, or the edit mode's tray and bar (the room glides to the middle of what's left)
    const tray = editing ? document.querySelector<HTMLElement>('[data-tent-edit]') : null;
    return insetsOf(canvas, top, tray ? Math.min(...[...tray.children].map((c) => c.getBoundingClientRect().top)) : foot);
  }

  /** The e2e's and the console's hooks (dev builds, test mode, and the e2e's logic mode: a paired phone on a test record). */
  function hooks() {
    if (!testHooks()) return;
    window.__tent = {
      stats: () => eng?.stats(),
      loading: () => eng?.loading() ?? 0,
      mine: () => eng?.at(me),
      /** Walk my villager to a floor point (model units), as a tap there. */
      walkTo: (x: number, z: number) => walkTo([x, z]),
      /** My last walk: where it set out, its corners and where it ends (model units). */
      way: () => (myWalk ? { from: myWalk.from, via: myWalk.via, to: myWalk.to } : null),
      v3: (who: Who) => eng?.v3(who) ?? null,
      /** The model drawn for `who` (person3d's key), null till one is in. */
      model: (who: Who) => eng?.model(who) ?? null,
      at: (who: Who) => eng?.at(who),
      walking: (who: Who) => eng?.walking(who),
      /** A model point's client px. */
      px: (x: number, z: number, y = 0) => eng?.client(x, y, z),
      /** A tile's middle in client px. */
      tile: (x: number, z: number) => eng?.client(-HALF + (x + 0.5) * 10, 0, -HALF + (z + 0.5) * 10),
      pieces: () => room.pieces.map((p) => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f, who: p.who, ...(p.on ? { on: p.on } : {}) })),
      /** Where each piece stands in the room (a thing on a table: its tile there, and how high). */
      placed: () => spots().map((p) => ({ id: p.id, x: p.x, z: p.z, f: p.f, y: p.y })),
      surfaces: () => ({ wall: room.wall, floor: room.floor, size: room.size }),
      /** The room's size (contract/tent.ts ROOM_SIZES), and to another (as 広さ does, no check). */
      size: () => room.size,
      resize: (n: RoomSize) => room.resize(n),
      edit: () => edit?.snapshot() ?? null,
      /** The room's saved arrangements' names, slot by slot (null: empty). */
      saves: () => saves.map((s) => s?.name ?? null),
      held: () => link.theirs().map((h) => ({ id: h.id, item: h.item, x: h.x, z: h.z, f: h.f })),
      partner: () => (eng?.at(partner) ? { at: eng.at(partner), walking: eng.walking(partner) } : null),
      starter: () => STARTER,
      /** Where my villager sits or lies (null: standing), and the partner's. */
      seat: () => ((st) => (st ? { id: st.id, n: st.n, lie: st.lie } : null))(seats.mine()),
      /** How shut a piece's lid is (0 open … 1 shut; null: it has none). */
      lid: (id: string) => eng?.lid(id) ?? null,
      /** What a piece used moves of itself (tent/uses.ts: held, a door, see-through), and whether a villager's hidden in a stall. */
      use: (id: string) => eng?.use(id) ?? null,
      hidden: (w: Who) => eng?.hidden(w) ?? false,
      partnerSeat: () => seats.their(partner),
      /** Up to a piece's nearest free seat and on, as a tap on it (false: no such piece). */
      sit: (id: string) => sitOn(id),
      /** The clock the uses' loops are at (villager3d/loopClock.ts: the relay's). */
      loop: () => loopNow(),
      /** The uses' loops held at `ms` (a pose's keyframe, for a shot; null: the relay's clock again). */
      loopAt: (ms: number | null) => useLoopClock(ms === null ? relayNow : () => ms),
      /** Another villager (`w`) put on seat `n` of piece `id`, as if heard from its phone. */
      seatAs: (w: Who, id: string, n: number) => {
        const st = seatAt(id, n);
        if (!st || !eng) return false;
        eng.villager(w, lookOf(w));
        eng.put(w, st.from);
        seats.heard(w, { in: true, seat: id, n, s: relayNow(), t: relayNow() });
        eng.pose(w, poseOf(st));
        return true;
      },
      /** Another villager (`w`) standing at (x, z), as if come in from its phone (e2e: room-shot): its `tent` heard, so
       *  where.svelte.ts has it inside (a bare put was taken away by the next partnerShown, UNHEARD_MS's at the latest). */
      putAs: (w: Who, x: number, z: number) => heardTent({ v: 3, kind: 'tent', who: w, in: true, to: [x, z], t: relayNow(), ...(homeSc ? { sc: homeSc } : {}) } as unknown as Extract<Relayed, { kind: 'tent' }>),
      /** Anyone's villager in here (A, B or G), null when it isn't (e2e: the guest). */
      who: (w: Who) => (eng?.at(w) ? { at: eng.at(w), walking: eng.walking(w) } : null),
      /** The pieces that do something (toggles.ts): each one's family, a switched one's state (on, a screen's channel). */
      toggles: () => room.pieces.flatMap((p) => {
        const fam = familyOf(p.item);
        return fam ? [{ id: p.id, item: p.item, fam, ...(isSwitched(fam) ? { on: onOf(p.l, !!ITEMS[p.item]?.lt), ch: channelOf(room.switchedAt(p.id)) } : {}) }] : [];
      }),
      /** A switched piece as drawn (engine.ts fx), what my villager plays now, the moving pieces animated. */
      fx: (id: string) => eng?.fx(id) ?? null,
      /** Switch a piece as a tap would set it (on or off, a screen's channel). */
      switchTo: (id: string, l: 0 | 1, ch?: number) => room.switchTo(id, l, ch),
      playing: () => eng?.playing(me) ?? null,
      /** The flourish over a piece now (confetti, bubbles, twinkles, ♪), a piece's one-off move, すがた open. */
      sparking: () => eng?.sparking() ?? null,
      reaction: (id: string) => eng?.reaction(id) ?? null,
      dressing: () => ui.dress,
      taps: () => taps,
      /** A piece stood at (standFx.ts): `w`'s one-off now, what's in its hands, the fx shown at piece `id`. */
      acting: (w: Who = me) => eng?.acting(w) ?? null,
      stand: (w: Who, id?: string) => eng?.stand(w, id) ?? null,
      moving: () => eng?.stats().moving ?? 0,
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
        const [x0, x1, z0, z1] = rectOf(bounds), mz = (z0 + z1) / 2;
        const th = [0, Math.PI / 2, -Math.PI / 2, Math.PI][wall], at = [[0, z0], [x0, mz], [x1, mz], [0, z1]][wall];
        const lx = u - wallMid(wall, bounds), lz = 0.3;
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
      /** Furnish the room with these pieces (rugs first, then each on the free spot nearest the middle; a wall thing on
       *  the first free spot of the back, left, then right wall): how many. */
      fill: (codes: string[], f: Facing = 0) => {
        let n = 0;
        const onWall = (c: string): [number, number, Facing] | null => {
          for (const wall of [0, 1, 2] as const) {
            const [lo, hi] = wallSpan(wall, bounds);
            for (let z = wallSteps(c); z >= 0; z--) for (let x = lo; x < hi; x++) if (!wallWhy(spots(), { item: c, x, z, f: wall }, bounds)) return [x, z, wall];
          }
          return null;
        };
        for (const c of [...codes].sort((a, b) => Number(!ITEMS[b].rug) - Number(!ITEMS[a].rug) || 0)) {
          if (room.room <= 0) break;
          const at: [number, number, Facing] | null = isWallItem(c) ? onWall(c) : ((p) => p && [p[0], p[1], f])(nearestFree(spots(), c, f, 0, -10, bounds));
          if (at && room.set({ id: `d${Date.now().toString(36)}${(n++).toString(36).padStart(3, '0')}`, item: c, x: at[0], z: at[1], f: at[2] })) continue;
        }
        return room.pieces.length;
      },
      /** Ms a frame drawn and read back, `n` back to back (engine.ts drawMs). */
      drawMs: (n = 60, shadows = false) => eng?.drawMs(n, shadows) ?? 0,
      /** A full turn of the camera, a frame at a time: the frames' own cost (ms) and the time between them. */
      orbitBench: async (steps = 180) => {
        const gaps: number[] = [];
        const c0 = eng?.stats().cost.length ?? 0, f0 = eng?.stats().frames ?? 0;
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
        // (the frames it drew: at 30 a second half the steps; the last steps − 1 had the entry's frames in them)
        const cost = (eng?.stats().cost ?? []).slice(-Math.max(1, Math.min(steps - 1, (eng?.stats().frames ?? 0) - f0)));
        const q = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * p))];
        return { frames: steps, c0, cost: { p50: q(cost, 0.5), p95: q(cost, 0.95), max: Math.max(...cost) }, gap: { p50: q(gaps, 0.5), p95: q(gaps, 0.95), max: Math.max(...gaps) }, stats: eng?.stats() && { calls: eng.stats().calls, tris: eng.stats().tris, dpr: eng.stats().dpr } };
      }
    };
  }
</script>

<!-- (the edit mode's plates: the island's cream at every hour, NH's game objects) -->
<RoomShell room="tent" title={t('tent.title')} label={t('tent.room')} failText={t('tent.failed')} {failed} mark="data-room" bind:canvas bind:top bind:el={scene}
  finger={{ down: onDown, move: onMove, up: onUp, cancel: onCancel }} {camera} back={t('tent.back')} backShown={!editing} onback={leave}
  reset={turned && !fpv} onreset={resetView} hint={!!eng && !fpv && !editing && !picking} onresize={() => eng?.resize(insets())}
  style="--plate: var(--c-cream); --plate-lip: var(--c-lip); --plate-ink: var(--c-ink)" data-tent data-room-home={home} data-editing={editing || undefined}>
  {#if home !== 'A'}<p class="whose" data-guard data-home={home}>{t('tent.whose', { name: nameOf(home) })}</p>{/if}
  {#if !editing}
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
  <div class="foot" bind:this={foot}>
    {#if !editing && mine}
      <button type="button" class="edit look" data-home-look data-sfx="open" onclick={() => (picking = true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7M5.5 9.5V20h13V9.5" /><path d="M10 20v-5h4v5" /></svg>
        <span>{t('tent.homeLook')}</span>
      </button>
    {/if}
    {#if !editing}
      <button type="button" class="edit" data-tent-edit-open data-sfx="open" onclick={() => (editing = true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h16v5H4zM6 13V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M6 18v2M18 18v2" /></svg>
        <span>{t('tent.edit')}</span>
      </button>
    {/if}
  </div>
  {#if editing && eng}
    <TentEdit bind:this={edit} {room} eng={() => eng} {link} {finds} {bought} {catches} {got} {favs} onfav={fav} {saves} ownerHas={(c) => ownerBought.has(c)} {relayNow} house={islandLayout.home(home).m === 'house'} holderName={(id) => nameOf(link.theirs().find((h) => h.id === id)?.who ?? partner)}
      villagers={() => [eng?.at(me), ...others.map((w) => eng?.at(w))].filter((p): p is [number, number] => !!p)}
      ondone={() => {
        editing = false;
        heldChanged();
      }} />
  {/if}
  <!-- (the say button just above the foot's buttons: いえを かえる and もようがえ fill the foot's width) -->
  <RoomSay bind:this={roomSay} {scene} sc={saySc} shown={sayShown} {me} {partner} {nameOf} {relay} lift="66px"
    room={() => ({ eng, fpv, canvas, bottom: insets().bottom })} seated={(w) => !!(w === me ? seats.mine() : seats.seated(w))} />
  {#if stereoPick && !editing}<StereoPicker last={stereoLast} onpick={playStereo} onclose={() => (stereoPick = null)} />{/if}
  {#if letter}<HhaLetter rating={letter} onclose={() => (letter = null)} />{/if}
  {#if picking}<HomePicker bind:open={picking} who={home} />{/if}
</RoomShell>

<style>
  .foot :global(.look) { margin-right: 8px; }
  .whose {
    position: absolute; left: 50%; top: calc(var(--ui-top, 0px) + 70px); transform: translateX(-50%); margin: 0; padding: 6px 14px;
    border-radius: 999px; background: var(--c-cream); color: var(--c-ink); font-weight: 700; font-size: var(--fs-s, 13px); pointer-events: none;
  }
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
  .switch {
    position: absolute; right: calc(var(--side) + var(--safe-right) + 62px); top: calc(var(--ui-top) + 8px); z-index: 2;
    width: 52px; height: 52px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    color: var(--c-ink); background: var(--c-yuzu, #F7D94C); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
  }
  .switch.off { background: #5A4A3A; color: #F5E4BC; }
  .switch svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .switch:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .hha {
    position: absolute; right: calc(var(--side) + var(--safe-right) + 124px); top: calc(var(--ui-top) + 8px); z-index: 2;
    width: 52px; height: 52px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    background: var(--c-card); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
  }
  .hha svg { width: 30px; height: 36px; }
  .hha svg path { fill: #D08A52; stroke: #8C5326; stroke-width: 3; stroke-linejoin: round; }
  .hha svg ellipse { fill: #8C5326; }
  .hha:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
</style>
