<script lang="ts">
  // はくぶつかん: the museum's inside (docs/design.md "The museum"), behind its door on the island. The museum (engine.ts,
  // three.js) comes in its own chunk once the screen opens; until its first frame the door's black covers it
  // (ui-state/doorTransition.ts). Only the room my villager is in is drawn; through a doorway the screen dips to the next
  // room's colour and the room changes inside the dip (engine.ts showRoom, onDip). A tap on the floor walks my villager
  // there (through the hall's openings into a wing);
  // a tap on an exhibit (a fish, a bug, a sea creature, a fossil, an artwork) shows its card (MuseumCard: its names, who
  // found it first and when, how many we've had);
  // a tap on a bench walks my villager up to its free seat and sits it down facing the great tank (the rooms' sitting:
  // rooms/seating.ts, its seats seats.ts), the first tap then gets it up (only that); a tap on the curator at the desk (フータ: curator.ts, his idle life) is his line in NH's balloon (Talk, lines.ts),
  // and he greets my villager once on the way in; with a card open, any tap only closes it; a doorway's dip closes every
  // balloon; the finds of the last day get a NEW tag (newTags.ts), the chip's 「あたらしい n」 and a dot on the hall's plaque;
  // the doormat or ‹ しまへ goes back out. What's on show is the ずかん's (model/finds.ts: every fish, bug, sea creature
  // and fossil anyone has found, the guest's too, and every genuine artwork a present has held), and comes as it's
  // found; the sea creatures', the fossils' and the art's wings are built (their models fetched) only once my villager
  // comes near (plan.ts nearRooms). The others in here are seen (the relay's `tent` with `sc: 'm'`,
  // the rooms' presence); the say button says a phrase here (`say` with `sc: 'm'`). Nothing gives ベル.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount, untrack } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Says from '../island/Says.svelte';
  import Talk from '../island/Talk.svelte';
  import SayPicker from '../island/SayPicker.svelte';
  import SayButton from '../island/SayButton.svelte';
  import EyeToggle from '../rooms/EyeToggle.svelte';
  import { madeGL } from '../rooms/madeGL.ts';
  import { replayWalk, roomRelay } from '../rooms/roomRelay.ts';
  import { logError } from '#lib/sync/log.ts';
  import PanHint from '../rooms/PanHint.svelte';
  import RecentreIcon from '../rooms/RecentreIcon.svelte';
  import { nightOf, roomSpeaker } from '../rooms/speaker.ts';
  import { gestures, roomCamera } from '../rooms/gesture.ts';
  import { firstPerson } from '#lib/store/firstPerson.svelte.ts';
  import MuseumCard, { type Shown } from './MuseumCard.svelte';
  import RoomChip from './RoomChip.svelte';
  import { DIP_FADE_MS, NEW_MS, cardDock, chipName, freshFinds, freshIn, freshWings, roomTally, tagsOf, unitOf } from './hud.ts';
  import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
  import { SAY_TAG, rememberSay, sayGate, type SaySpeaker } from '#lib/world/say.ts';
  import { url3d } from '../villager3d/manifest.ts';
  import { person3, type Dirs } from '../person3d/person3d.ts';
  import { art, artUrl, villagerArt } from '#lib/art.ts';
  import { testHooks } from '#lib/ui-state/testMode.ts';
  import { lookOf as wornOf } from '#lib/store/look.ts';
  import type { WeekView } from '#lib/types.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { doorReady, provideDoor } from '#lib/ui-state/doorTransition.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { prefetchPlace, setPlace } from '#lib/sound/sound.svelte.ts';
  import { MUSEUM_MUSIC, Settle, type PlaceId } from '#lib/sound/places.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { layout as islandLayout } from '#lib/store/layout.svelte.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { where } from '#lib/store/where.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { leaveBy } from '../island/doorOut.ts';
  import { findsView } from '#lib/model/finds.ts';
  import { tallyTotals } from '#lib/model/tally.ts';
  import type { Intent, Pt as WirePt, Relayed } from '#lib/contract/live-protocol.ts';
  import { now } from '#lib/time/clock.ts';
  import { ENTRANCE, ROOM_IDS, boundsOf, nearRooms, wingOfRoom, type Pt, type RoomId, type Wing } from './plan.ts';
  import { hourOf, onShow, type Specimen } from './species.ts';
  import { ROW, fossilsOnShow, type FossilOnShow } from './fossils.ts';
  import { artOnShow, type ArtOnShow } from './art.ts';
  import { CURATOR, curatorLine } from './lines.ts';
  import { benchSeats, seatOf, type MuseumSeat } from './seats.ts';
  import { createSeating } from '../rooms/seating.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import catchJa from '#lib/i18n/catch.ja.json';
  import catchEn from '#lib/i18n/catch.en.json';
  import type { Crowd } from './visitors.ts';
  import type { Crowd3D } from './crowd3d.ts';
  import type { Curator } from './curator.ts';
  import type { NewTags } from './newTags.ts';
  import type { Hit, Look, Museum, Who } from './engine.ts';
  import { staticUrl } from '#lib/staticUrl.ts';

  let { view }: { view: WeekView } = $props();

  let canvas = $state<HTMLCanvasElement>();
  let eng = $state<Museum | null>(null);
  let failed = $state(false);
  // svelte-ignore state_referenced_locally
  const me: Who = view.viewer;
  // svelte-ignore state_referenced_locally
  const partner: Who = view.viewer === 'G' ? 'A' : view.partner;
  const others: Who[] = (['A', 'B', 'G'] as const).filter((w) => w !== me);
  const nameOf = (w: Who) => (w === 'G' ? view.guest.villagerName : view.people[w].villagerName);
  const sideX = (w: Who) => (w === 'A' ? -8 : w === 'B' ? 8 : 0);

  // ---- the relay: the phone's one socket (the demo's two tabs share a channel; ?relay=&key= a test relay) ----
  const demo = !!week.demo;
  const { own, relay, now: relayNow } = roomRelay(demo, me);
  /** My presence and walks in here: the rooms' `tent` intent, this place's scope. */
  const send = (i: Intent) => relay?.send(i.kind === 'tent' ? ({ ...i, sc: 'm' } as Intent) : i) ?? false;

  // ---- what's on show: the ずかん's first finds (everyone's), the tallies for the card ----
  const finds = $derived(week.model ? findsView(week.model.state) : null);
  /** One find kept off show (the e2e's and the Simulator's: let back, it arrives as a new find does, its wing rebuilt). */
  let withheld = $state<string | null>(null);
  const specimens = $derived<Specimen[]>(finds ? onShow(finds).filter((s) => s.id !== withheld) : []);
  const fossils = $derived<FossilOnShow[]>(finds ? fossilsOnShow(finds).filter((f) => f.id !== withheld) : []);
  const artworks = $derived<ArtOnShow[]>(finds ? artOnShow(finds).filter((a) => a.id !== withheld) : []);
  /** The rooms woken (near my villager once: plan.ts nearRooms; or a whole wing, the hook's), their exhibits built and
   *  their models fetched. */
  let awake = $state<ReadonlySet<Wing | RoomId>>(new Set());
  function wake(ws: readonly (Wing | RoomId)[]) {
    if (ws.every((w) => awake.has(w))) return;
    awake = new Set([...awake, ...ws]);
    for (const w of ws) {
      const wing = (ROOM_IDS as readonly string[]).includes(w) ? wingOfRoom(w as RoomId) : (w as Wing);
      if (wing === 'fossil' || wing === 'art') prefetchPlace(MUSEUM_MUSIC[wing]);
    }
  }

  // ---- my villager, told to the others (the very walk) ----
  let myWalk: { from: Pt; via: Pt[]; to: Pt; s: number; ms: number } | null = null;
  const r = (p: Pt): WirePt => [Math.round(Math.max(-320, Math.min(320, p[0]))), Math.round(Math.max(-320, Math.min(320, p[1])))];
  function sayWhere() {
    const at = eng?.at(me);
    if (!at) return;
    const mine = seats.mine();
    if (mine) return void send({ kind: 'tent', in: true, to: r(mine.at), ...seats.wire()! });
    const w = myWalk && relayNow() < myWalk.s + myWalk.ms ? myWalk : null;
    send(w ? { kind: 'tent', in: true, from: r(w.from), ...(w.via.length ? { via: w.via.map(r).slice(0, 10) } : {}), to: r(w.to), s: Math.round(w.s), ms: Math.round(w.ms) } : { kind: 'tent', in: true, to: r(at) });
  }
  let arriving: ReturnType<typeof setTimeout> | undefined;
  function walkTo(to: Pt, then?: () => void) {
    if (!eng) return;
    clearTimeout(arriving);
    const at = eng.at(me);
    if (!at) return;
    let from: Pt = at;
    // (seated: up first, at the seat's step)
    const up = seats.stand();
    if (up) eng.put(me, (from = up));
    const pts = walkPathOf(from, to);
    if (!pts.length) return void then?.();
    const ms = eng.walk(me, pts);
    myWalk = { from, via: pts.slice(0, -1), to: pts[pts.length - 1], s: relayNow(), ms };
    sayWhere();
    if (then) arriving = setTimeout(then, ms + 30);
  }
  let walkPathOf: (from: Pt, to: Pt) => Pt[] = () => [];

  // ---- the music: each room its own (sound/places.ts), as in NH; it changes with the room drawn (once my villager has
  // gone through a doorway: engine.ts, then Settle), read on the frames drawn (none while nothing moves) ----
  const music = new Settle<PlaceId>(setPlace);
  /** The wings' tracks are fetched this long after the hall opens (its own first). */
  const WINGS_AHEAD_MS = 4000;
  function heardMusic() {
    const at = eng?.at(me);
    if (!at || !eng) return;
    // (the room drawn: it changes inside the doorway's dip, the music and the chip with it; a put's at once, no balloon
    // carried over either)
    if (eng.room() !== roomId) (hushAll(), restamp());
    roomId = eng.room();
    music.to(MUSEUM_MUSIC[wingOfRoom(roomId)]);
    wake(nearRooms(at[0], at[1]));
  }
  /** The room drawn (the chip's: its plaque's name, what's on show in it of how many it holds, its new finds). */
  let roomId = $state<RoomId>('hall');
  const chipTally = $derived(roomTally(roomId, { specimens, fossils, artworks }));
  /** The doorway's dip: the screen fades to the next room's colour and back (engine.ts onDip), never in a finger's way. */
  let dip = $state<string | null>(null), dipColor = $state('#000');

  // ---- the benches (seats.ts): walk up to the nearest free seat, then on; one villager a seat, the first keeps it ----
  const seats = createSeating<MuseumSeat>(me);
  /** Up off my seat, at its step. */
  function standUp() {
    if (!eng || !seats.stand()) return;
    eng.sit(me, null);
    sayWhere();
  }
  function sitOn(id: string) {
    if (!eng) return;
    const go = seats.tap(benchSeats(id), eng.at(me) ?? ENTRANCE, relayNow, walkTo, (st) => {
      eng?.sit(me, st.anchor);
      cue('scene-bench');
      sayWhere();
    });
    if (go === 'full') cue('boop');
  }

  // ---- the others: each here only while they're in the museum (store/where.svelte.ts) ----
  const theirAt = new Map<Who, Pt>(others.map((w) => [w, [ENTRANCE[0] + sideX(w), ENTRANCE[1] - 10] as Pt]));
  /** The villagers' GLBs and the players' parts (person3d). */
  const DIRS: Dirs = { villagers: staticUrl('room/villagers3d/'), player: staticUrl('room/player/') };
  /** Who draws them (person3d: the look they wear, their villager or their human player; a villager with no model its
   *  render, as a card). */
  function lookOf(w: Who): Look {
    const villager = w === 'G' ? view.guest.villager : view.people[w].villager;
    const p = person3(w, wornOf(w), villager, DIRS);
    if (p.has3d) return p;
    const key = villagerArt(p.villager), a = art(key), url = artUrl(key);
    return a && url ? { ...p, card: { url, aspect: a.w / a.h } } : p;
  }
  // a look changed (on leaving すがた, or the partner's phone): the model swapped where it is
  $effect(() => {
    for (const w of [me, ...others]) void wornOf(w);
    untrack(() => {
      if (!eng) return;
      if (eng.at(me)) eng.villager(me, lookOf(me));
      othersShown();
    });
  });
  function othersShown() {
    if (!eng) return;
    for (const w of others) {
      const shown = where.inTent[w] && where.home[w] === 'M', fresh = shown && !eng.at(w);
      eng.villager(w, shown ? lookOf(w) : null);
      if (fresh) eng.put(w, theirAt.get(w)!);
    }
  }
  function heardTent(m: Extract<Relayed, { kind: 'tent' }>) {
    where.heard(m);
    if (!eng) return;
    if (m.sc !== 'm') return othersShown();
    const w = m.who;
    if (m.to) theirAt.set(w, m.to);
    othersShown();
    // on a seat: one villager a seat, the first to sit keeps it (mine gets up if they were there first)
    const { seat, yields } = seats.heard(w, m), mine = seats.mine();
    if (yields && mine) {
      walkTo(mine.from);
      cue('boop');
    }
    const st = seat && seatOf(seat.id, seat.n);
    if (st) return void eng.sit(w, st.anchor);
    if (!m.in || !m.to) return;
    replayWalk(eng, m, relayNow());
  }

  // ---- the phrases (world/say.ts): as in the rooms, this place's `sc` ----
  let says = $state<ReturnType<typeof Says>>();
  let scene = $state<HTMLElement>();
  let sayAt = $state<HTMLElement | null>(null);
  let sayBtn = $state<HTMLButtonElement>();
  let sayClosedBy: Event | null = null;
  /** The card of the exhibit tapped, or null; the edge it docks to (hud.ts cardDock: clear of the exhibit). */
  let card = $state<Shown | null>(null);
  let dock = $state<'top' | 'bottom'>('top');
  /** An exhibit's world point (the first exhibit that draws it), or null. */
  function whereOf(e: Museum | null, id: string): [number, number, number] | null {
    for (const x of e?.exhibits() ?? []) {
      const p = x.where(id);
      if (p) return p;
    }
    return null;
  }
  /** An exhibit's card's contents, by its id (a fossil's skeleton: its pieces found of how many). */
  function shownOf(id: string): Shown | null {
    const s = specimens.find((x) => x.id === id);
    if (s) return { kind: s.kind, id, found: s.found };
    const f = fossils.find((x) => x.id === id);
    if (f) return { kind: 'fossil', id, found: f.found, ...(f.set ? { set: { id: f.set, n: fossils.filter((x) => x.set === f.set).length, of: ROW[f.set].length } } : {}) };
    const a = artworks.find((x) => x.id === id);
    return a ? { kind: 'art', id, found: a.found } : null;
  }
  const sayShown = $derived(!!eng && !failed && !ui.sheets.length);
  const sayId = (w: Who) => (w === me ? 'mine' : w === partner ? 'partner' : 'third');
  const speakerOf = (w: Who) => roomSpeaker(w, me, () => ({ eng, fpv, canvas, bottom: insets().bottom }));
  function showSay(w: Who, text: string) {
    if (!eng?.at(w)) return;
    says?.say(sayId(w), text, speakerOf(w), { name: nameOf(w), colour: SAY_TAG[w] });
    if (!eng.walking(w) && !eng.seated(w)) eng.hop(w);
  }
  function closeSay(by?: Event) {
    if (!sayAt) return;
    sayAt = null;
    if (by) sayClosedBy = by;
  }
  function pickSay(text: string) {
    closeSay();
    rememberSay(text);
    showSay(me, text);
    sayOut.say(text);
  }
  const sayOut = sayGate((text) => void relay?.send({ kind: 'say', text, sc: 'm' }));
  $effect(() => () => sayOut.stop());
  $effect(() => {
    if (sayAt && !sayShown) untrack(() => closeSay());
  });

  // ---- the curator (フータ): a tap, his line in NH's balloon by him, never the same twice running ----
  let talk = $state<ReturnType<typeof Talk>>();
  let curator: Curator | null = null;
  let curatorSaid: string | undefined;
  /** NH's name tag colour for him (his brown). */
  const CURATOR_TAG = '#A0784A';
  const curatorSpeaker: SaySpeaker = {
    get isConnected() {
      return !!eng && !!curator;
    },
    getBoundingClientRect() {
      const p = curator?.where(CURATOR);
      if (!eng || !p) return new DOMRect();
      const [hx, hy] = eng.client(p[0], p[1], p[2]), [, fy] = eng.client(p[0], p[1] * 0.45, p[2]);
      const tall = Math.max(12, fy - hy), wide = tall * 0.9;
      return new DOMRect(hx - wide / 2, hy, wide, tall);
    }
  };
  function curatorTalk() {
    if (!eng || !curator) return;
    cue('host-tap');
    // (the newest find of the last day, as the NEW tags have them: now and then he tells of it by name)
    const newest = fresh.reduce<(typeof fresh)[number] | null>((a, b) => (!a || b.at > a.at ? b : a), null);
    const news = newest ? kanaName(newest.id) : null;
    curatorSaid = curatorLine(Math.random, curatorSaid, !!news);
    const fish = specimens.filter((s) => s.kind === 'fish').length, bugs = specimens.filter((s) => s.kind === 'bug').length;
    curatorSay(t(curatorSaid, { fish, bugs, fossils: fossils.length, art: artworks.length, name: news ? news[i18n.locale === 'en' ? 'en' : 'ja'] : '' }));
    const p = curator.where(CURATOR);
    if (p) eng.face(me, [p[0], p[2]]);
  }
  /** Every balloon closed (a doorway's dip: none carried into the next room). */
  function hushAll() {
    talk?.hush();
    says?.hush();
    curator?.quiet();
  }
  function curatorSay(line: string, o: { read?: number; avoid?: () => { x0: number; x1: number; y0: number; y1: number }[] } = {}) {
    const him = curator;
    if (!him) return;
    him.talk([...line].length);
    talk?.say(t('museum.curator'), line, curatorSpeaker, { colour: CURATOR_TAG, ondone: () => him.quiet(), ...o });
  }
  /** His welcome, once a visit, untapped: the first frame on the way in with him drawn and on screen (its first line
   *  only, ~2 s, kept off the plaques: where one's eye goes to pick a wing); a tap then has his other lines. */
  let greeted = false;
  function greet() {
    if (greeted || !eng || !curator || dip || eng.room() !== 'hall') return;
    const p = curator.where(CURATOR);
    if (!p || !eng.inView(p[0], p[1], p[2])) return;
    greeted = true;
    curatorSaid = curatorLine(Math.random);
    curatorSay(t(curatorSaid).split('\n')[0], { read: GREET_READ_MS, avoid: plaqueBoxes });
  }
  /** The greeting's time left alone once typed (its line types in ~0.6 s). */
  const GREET_READ_MS = 1400;
  /** The room's plaques on the screen (client px, a little round each). */
  const plaqueBoxes = () =>
    (eng?.doorways() ?? []).flatMap((d) => d.plaques).map((q) => ({ x0: Math.min(...q.map((p) => p[0])) - 4, x1: Math.max(...q.map((p) => p[0])) + 4, y0: Math.min(...q.map((p) => p[1])) - 4, y1: Math.max(...q.map((p) => p[1])) + 4 }));

  // ---- the visitors (visitors.ts: the day's NH villagers, the same on every phone; crowd3d.ts draws the room's) ----
  /** The synced clock: the relay's, shifted as the scene clock is (?date): every phone's visitors where they are. */
  const syncedNow = () => relayNow() + (now().getTime() - Date.now());
  let crowd: Crowd | null = null, crowd3: Crowd3D | null = null;
  /** When NEW was last worked out: the synced clock and the exhibits' hour (their pick: an off-season fish isn't drawn),
   *  again on a room change and once a minute (a NEW ends a day after its find, the pick each hour). */
  let stamp = $state({ t: syncedNow(), hour: hourOf(now().getTime()) });
  const restamp = () => (stamp = { t: syncedNow(), hour: hourOf(clock()) });
  /** The new finds looked at on this phone (their card opened: by id, with their first find's time to drop them by); a
   *  NEW clears then. */
  let seen = $state<Record<string, number>>(readJson<Record<string, number>>(localKV(), DEVICE.museumSeen) ?? {});
  function sawFind(id: string) {
    const f = fresh.find((x) => x.id === id);
    if (!f) return;
    const t = syncedNow(), unit = unitOf(f);
    // (a skeleton's new pieces all seen with any one's card: its one tag; only those still within their day kept: a day
    // and a little for the clocks)
    const saw = fresh.filter((x) => unitOf(x) === unit).map((x) => [x.id, x.at] as const);
    seen = Object.fromEntries([...Object.entries(seen).filter(([, at]) => t - at < 2 * NEW_MS), ...saw]);
    writeJson(localKV(), DEVICE.museumSeen, seen);
  }
  /** The finds of the last day drawn now and not yet looked at here (hud.ts freshFinds): the tags, the chip, the dots, Blathers' news. */
  const fresh = $derived(freshFinds({ specimens, fossils, artworks }, stamp.t, { hour: stamp.hour, seen }));
  let tags: NewTags | null = null;
  $effect(() => {
    const f = fresh, e = eng;
    untrack(() => {
      tags?.set(tagsOf(f));
      e?.newWings(freshWings(f));
    });
  });
  $effect(() => {
    const tick = setInterval(restamp, 60_000);
    return () => clearInterval(tick);
  });
  /** An exhibit's name as the world writes it (the catch's), if it's on show. */
  function kanaName(id: string): { ja: string; en: string } | null {
    const s = specimens.find((x) => x.id === id), kind = s ? s.kind : fossils.some((f) => f.id === id) ? 'fossil' : artworks.some((a) => a.id === id) ? 'art' : null;
    if (!kind) return null;
    const key = `${{ fish: 'critter.name', bug: 'critter.name', sea: 'sea.name', fossil: 'beach.name', art: 'art.name' }[kind]}.${id}`;
    const ja = (catchJa as Record<string, string>)[key], en = (catchEn as Record<string, string>)[key];
    return ja && en ? { ja, en: en.replace(/^(an?|the) /, '') } : null;
  }
  /** The seats players sit on (a visitor stands by one instead). */
  function seatsHeld(): ReadonlySet<string> {
    const held = new Set<string>(), mine = seats.mine();
    if (mine) held.add(`${mine.id}:${mine.n}`);
    for (const w of others) {
      const st = seats.their(w);
      if (st) held.add(`${st.id}:${st.n}`);
    }
    return held;
  }
  const visitorSpeaker = (id: string): SaySpeaker => ({
    get isConnected() {
      return !!eng && !!crowd3?.where(id);
    },
    getBoundingClientRect() {
      const p = crowd3?.where(id);
      if (!eng || !p) return new DOMRect();
      const [hx, hy] = eng.client(p[0], p[1], p[2]), [, fy] = eng.client(p[0], p[1] * 0.45, p[2]);
      const tall = Math.max(12, fy - hy), wide = tall * 0.9;
      return new DOMRect(hx - wide / 2, hy, wide, tall);
    }
  });
  /** A tap on a visitor: it stops where it is, turns to my villager with a hop and says its line (nobody walks). */
  function visitorTalk(id: string) {
    if (!eng || !crowd) return;
    const line = crowd.tap(id, syncedNow(), eng.at(me) ?? ENTRANCE), r = crowd3?.nameOf(id);
    if (!line || !r) return;
    cue('villager-tap');
    talk?.say(i18n.locale === 'en' ? r.en : r.ja, i18n.locale === 'en' ? line.en : line.ja, visitorSpeaker(id), { colour: r.colour });
    const p = crowd3?.where(id);
    if (p) eng.face(me, [p[0], p[2]]);
    eng.kit.invalidate();
  }
  // a find just put on show while I'm in here: the visitors of its room turn to it (the first look at the finds aside)
  let knownFinds: Set<string> | null = null;
  $effect(() => {
    const ids = [...specimens, ...fossils, ...artworks].map((x) => x.id);
    untrack(() => {
      if (!finds) return;
      const was = knownFinds;
      knownFinds = new Set(ids);
      if (was && crowd) for (const id of ids) if (!was.has(id)) crowd.notice(id, syncedNow());
    });
  });

  // ---- the finger: a tap walks (or shows a creature's card); a drag turns the camera; two fingers pinch to zoom and pan ----
  let turned = $state(false);
  const camera = roomCamera(() => eng, () => fpv, (off) => (turned = off));
  const fingers = gestures({
    tap: (x, y) => tap(x, y),
    start() {
      eng?.moving(true);
      says?.hold(true);
      talk?.hold(true);
    },
    ...camera.fingers,
    end() {
      eng?.moving(false);
      says?.hold(false);
      talk?.hold(false);
    }
  });
  function onDown(e: PointerEvent) {
    if (e === sayClosedBy) return void (sayClosedBy = null);
    canvas?.setPointerCapture(e.pointerId);
    fingers.down(e);
  }
  const onMove = (e: PointerEvent) => fingers.move(e);
  const onUp = (e: PointerEvent) => fingers.up(e);
  const onCancel = (e: PointerEvent) => fingers.cancel(e);
  function resetView() {
    eng?.resetView();
    turned = false;
  }
  function tap(cx: number, cy: number) {
    if (!eng) return;
    // (a card open: a tap anywhere off it only closes it, an exhibit's too; nobody walks off)
    if (card) return void (card = null);
    const h: Hit | null = eng.hit(cx, cy);
    // (seated: the first tap that isn't someone gets my villager up at the seat's step, nothing else; the statue or
    // the floor in front of the bench never opens a card or walks off)
    if (seats.mine() && h?.kind !== 'visitor' && h?.kind !== 'villager') return standUp();
    // (nothing there: a soft no)
    if (!h) return void cue('boop');
    if (h.kind === 'visitor') return visitorTalk(h.id);
    if (h.kind === 'villager') {
      eng.hop(h.who);
      cue('villager-tap');
      return;
    }
    if (h.kind === 'creature' && h.id === CURATOR) return curatorTalk();
    if (h.kind === 'creature') {
      const s = shownOf(h.id);
      if (!s) return;
      const p = whereOf(eng, h.id);
      if (p) {
        eng.face(me, [p[0], p[2]]);
        const rc = canvas?.getBoundingClientRect();
        if (rc) dock = cardDock(eng.client(p[0], p[1], p[2])[1] - rc.top, rc.height);
      }
      card = s;
      sawFind(h.id);
      cue('open');
      return;
    }
    if (h.kind === 'door') return leave();
    if (h.kind === 'seat') return sitOn(h.id);
    walkTo([h.x, h.z]);
  }

  // ---- out of the door: on the island just out of the museum's door, on every phone (island/doorOut.ts) ----
  let leaving = false;
  function leave() {
    if (leaving) return;
    leaving = true;
    cue('scene-bench');
    // (out at the door first, then seen: the others' islands show it there, not where it went in: the shop's order)
    leaveBy('museum', me);
    send({ kind: 'tent', in: false });
    const q = new URLSearchParams(location.search);
    void goto(resolve('/') + (q.size ? `?${q}` : '')).finally(() => (leaving = false));
  }

  $effect(() => eng?.night(nightOf(theme.tod)));
  /** At my villager's eyes (docs/design.md "First person"): the phone's choice. Local only. */
  const fpv = $derived(firstPerson.on);
  $effect(() => eng?.firstPerson(fpv));
  $effect(() => {
    for (const w of others) void where.inTent[w];
    untrack(() => othersShown());
  });
  $effect(() => {
    const m = week.model;
    if (m) untrack(() => islandLayout.rows(m.state.layout));
  });
  // the exhibits as the finds come (the museum's own chunk builds them: exhibits.ts); the aquarium's fish and the garden's
  // bugs by the scene clock's hour (?date; the e2e's nextHour() a later one)
  let hoursOn = 0;
  const clock = () => now().getTime() + hoursOn * 3_600_000;
  // (none found yet: the wings built all the same, their tanks and benches empty of fish; once the record is in)
  let shownKey: string | null = null;
  $effect(() => {
    const on = { list: specimens, fossils, art: artworks }, woke = awake, e = eng;
    if (!e || !finds) return;
    const k = [...on.list, ...on.fossils, ...on.art].map((s) => s.id).join(',') + `|${[...woke].join(',')}`;
    if (k === shownKey) return;
    shownKey = k;
    // (not on an engine let go of meanwhile: the room left before the chunk landed)
    untrack(() => void import('./exhibits.ts').then(({ show }) => eng === e && show(e, on, clock, woke)));
  });

  onMount(() => {
    let alive = true;
    music.now(MUSEUM_MUSIC.hall);
    // the wings' tracks once the hall's has started (a first walk into one then changes at once)
    const wings = setTimeout(() => (prefetchPlace(MUSEUM_MUSIC.fish), prefetchPlace(MUSEUM_MUSIC.bug)), WINGS_AHEAD_MS);
    islandLayout.attach(relay, me, demo);
    shared.attach(relay, me, demo);
    own?.start();
    const offs: (() => void)[] = [];
    if (relay) {
      offs.push(relay.on((m) => {
        if (m.who === me) return;
        if (m.kind === 'tent') heardTent(m);
        else if (m.kind === 'say' && m.sc === 'm') showSay(m.who, m.text);
      }));
      let hereNow: readonly Who[] = [];
      offs.push(relay.onStatus((st) => {
        const was = hereNow, here = st.connected ? st.here : [];
        hereNow = here;
        if (here.some((w) => !was.includes(w))) sayWhere();
        for (const w of others) where.presence(w, here.includes(w));
        othersShown();
      }));
    }
    const offDoor = provideDoor(() => (eng?.inView(ENTRANCE[0], 0, ENTRANCE[1] + 10) ? (([x, y]) => ({ x, y }))(eng.client(ENTRANCE[0], 0, ENTRANCE[1] + 10)) : null));
    void Promise.all([import('./engine.ts'), import('./plan.ts'), import('./curator.ts'), import('./visitors.ts'), import('./crowd3d.ts'), import('./spots.ts'), import('./newTags.ts')]).then(
      async ([{ createMuseum }, { walkPath }, { buildCurator }, { crowdOf }, { buildCrowd }, { VISITOR_ROOMS, VISITOR_POINTS }, { buildNewTags }]) => {
        if (!alive || !canvas) return;
        let e: ReturnType<typeof createMuseum>;
        try {
          // (no WebGL context to be had: the door opens on the room's stand-in, the tent's way)
          e = await madeGL(() => createMuseum(canvas!, { base: staticUrl('room/museum/'), world: staticUrl('room/world3d/') }), () => alive && !!canvas);
        } catch {
          failed = true;
          doorReady();
          return;
        }
        try {
          walkPathOf = (from, to) => walkPath(e.nav(), from, to);
          e.resize(insets());
          e.night(nightOf(theme.tod));
          e.villager(me, lookOf(me));
          e.follow(me);
          curator = buildCurator(e.kit, { model: url3d('blathers', staticUrl('room/villagers3d/')), me: () => e.at(me) });
          e.exhibit(curator);
          // (no visitor at a room's very sides or front: framed, in a finger's reach)
          const rooms = VISITOR_ROOMS.map((r) => ({ ...r, bounds: boundsOf(r.id as RoomId) }));
          crowd = crowdOf({ rooms, points: VISITOR_POINTS, path: (_room, a, b) => walkPath(e.nav(), a, b), name: kanaName });
          crowd3 = buildCrowd(e.kit, {
            crowd, clock: syncedNow, room: () => e.room(), blocked: seatsHeld, dir: staticUrl('room/villagers3d/'), me: () => e.at(me),
            anchor: (pid) => ((id, n) => seatOf(id, Number(n))?.anchor ?? null)(...(pid.split(':') as [string, string]))
          });
          e.exhibit(crowd3);
          tags = buildNewTags(e.kit, { room: () => e.room(), where: (id) => whereOf(e, id), hidden: () => fpv });
          tags.set(tagsOf(fresh));
          e.exhibit(tags);
          e.newWings(freshWings(fresh));
          // in at the front door, a few steps into the hall
          e.put(me, [ENTRANCE[0] + sideX(me), ENTRANCE[1] + 6], Math.PI);
          e.firstPerson(fpv, true);
          // (the balloons carried with their speakers while the camera moves: Talk.track, Says.track)
          e.onDrawn(() => (talk?.track(), says?.track(), heardMusic(), greet()));
          // (a dip's start: every balloon closes, none carried into the next room)
          e.onDip((c) => {
            if (c) (dipColor = c), hushAll();
            dip = c;
          });
        } catch (err) {
          // (its renderer let go of: before eng, nothing else would)
          logError('error', err);
          e.dispose();
          failed = true;
          doorReady();
          return;
        }
        eng = e;
        othersShown();
        // (once the hall's first frame is drawn: it waits for my villager's model, engine.ts holding)
        void e.ready.then(() => {
          if (!alive) return;
          walkTo([ENTRANCE[0] + sideX(me), ENTRANCE[1] - 14]);
          doorReady();
        });
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
      clearTimeout(wings);
      music.stop();
      setPlace(null);
      send({ kind: 'tent', in: false });
      // (a walk to a bench still on its way: no sit or its sound once out)
      clearTimeout(arriving);
      for (const f of offs) f();
      ro.disconnect();
      offDoor();
      own?.stop();
      eng?.dispose();
      eng = null;
      delete window.__museum;
    };
  });

  let top = $state<HTMLElement>();
  let foot = $state<HTMLElement>();
  /** What covers the canvas at its top (the back button) and foot (the say and eye buttons' row over the safe area,
   *  `foot` its line, there before the buttons are): the room fits between. */
  function insets() {
    const rc = canvas?.getBoundingClientRect(), tb = top?.getBoundingClientRect(), fb = foot?.getBoundingClientRect();
    if (!rc) return { top: 0, bottom: 0 };
    return { top: tb ? Math.max(0, tb.bottom - rc.top) : 0, bottom: fb ? Math.max(0, rc.bottom - fb.top) : 0 };
  }

  /** The e2e's and the console's hooks (dev builds, test mode and the logic tier). */
  function hooks() {
    if (!testHooks()) return;
    window.__museum = {
      stats: () => eng?.stats(),
      mine: () => eng?.at(me),
      at: (w: Who) => eng?.at(w),
      /** The model drawn for `w` (person3d's key), null till one is in. */
      model: (w: Who) => eng?.model(w) ?? null,
      /** Whether `w` is drawn as its card (a villager with no model), its picture in. */
      asCard: (w: Who) => !!eng?.card(w),
      walking: (w: Who) => eng?.walking(w),
      still: () => !!eng?.still(),
      /** A floor point's client px. */
      px: (x: number, z: number, y = 0) => eng?.client(x, y, z),
      /** The species on show (the ずかん's finds) and those drawn (each wing's). */
      specimens: () => specimens.map((s) => ({ id: s.id, kind: s.kind, tank: s.tank, by: s.found.person })),
      /** The fossils and the art on show (the ずかん's finds, the presents' artworks), and the wings woken. */
      fossils: () => fossils.map((f) => ({ id: f.id, set: f.set, by: f.found.person })),
      art: () => artworks.map((a) => ({ id: a.id, kind: a.art.kind, by: a.found.person })),
      awake: () => [...awake],
      /** Wake a wing now (its exhibits built, its models fetched), as coming near it does. */
      wake: (w: Wing | RoomId) => wake([w]),
      shown: () => eng?.exhibits().flatMap((x) => x.shown()) ?? [],
      /** A creature's client px (null: not drawn). */
      creature: (id: string) => {
        const p = whereOf(eng, id);
        return p && eng ? eng.client(p[0], p[1], p[2]) : null;
      },
      /** An exhibit's world point (null: not drawn). */
      where: (id: string) => whereOf(eng, id),
      /** A named spot on the floor (spots.ts: 'room:F2', 'in:fish', 'tank:reef', 'fossil:t-rex-skull', 'bench:hbench1:0'…). */
      spot: (name: string) => import('./spots.ts').then((m) => m.spot(name)),
      card: () => (card ? card.id : null),
      /** The aquarium's clock an hour on (its pick changes). */
      withhold: (id: string | null) => (withheld = id),
      nextHour: () => {
        hoursOn++;
        restamp();
        eng?.kit.invalidate();
      },
      /** The curator's head's client px, and what he's doing (idle, watching my villager, dozing, talking). */
      curator: () => {
        const p = curator?.where(CURATOR);
        return p && eng ? { at: eng.client(p[0], p[1] - 4, p[2]), doing: curator!.doing() } : null;
      },
      curatorDoze: () => curator?.doze(),
      /** The visitors drawn in the room I'm in (crowd3d.ts: id, x, z, state, fade), and one's head's client px. */
      visitors: () => crowd3?.drawn() ?? [],
      visitorPx: (id: string) => ((p) => (p && eng ? eng.client(p[0], p[1] * 0.6, p[2]) : null))(crowd3?.where(id)),
      /** The NEW tags shown in the room drawn (ids; a skeleton's `set:<set>`, a tank's `case:<tank>`), the new finds
       *  counted (ids), and the hall's plaques with a dot (their wings). */
      tagged: () => tags?.tagged() ?? [],
      fresh: () => fresh.map((f) => f.id),
      /** The room drawn's doorways on the screen (engine.ts doorways: the room beyond, its floor line and plaques in
       *  client px; its middle on the floor and the way in). */
      doorways: () => eng?.doorways() ?? [],
      dotted: () => eng?.dotted() ?? [],
      put: (x: number, z: number) => eng?.put(me, [x, z]),
      walkTo: (x: number, z: number) => walkTo([x, z]),
      orbit: (a: number, p = 0) => eng?.orbit(a, p),
      /** The first-person view (on, fully in, yaw, pitch, the eye), and a finger's look (px). */
      fpv: () => eng?.fpv() ?? null,
      look: (dx: number, dy: number) => eng?.look(dx, dy),
      zoom: (f: number) => eng?.zoom(f),
      hit: (cx: number, cy: number) => eng?.hit(cx, cy),
      /** The walls the cutaway takes away (engine.ts walls). */
      walls: () => eng?.walls(),
      /** The gallery's panels faded out round my villager (engine.ts screensCut). */
      panels: () => eng?.screensCut(),
      /** The room drawn (only it), and its look retuned (look.ts: the Simulator's tuning). */
      room: () => eng?.room(),
      /** The room's look (look.ts) or camera (viewW: this room's, the wings' all at once; pitch: degrees) retuned. */
      tune: (over: Record<string, number>) => eng?.tune(over),
      who: (w: Who) => (eng?.at(w) ? { at: eng.at(w), walking: eng.walking(w), seated: !!eng.seated(w) } : null),
      /** My seat (a bench's id, which of its seats), another's as heard, and a bench's seat's client px (its seat's top). */
      seat: () => ((st) => (st ? { id: st.id, n: st.n } : null))(seats.mine()),
      theirSeat: (w: Who) => seats.their(w),
      benchPx: (id: string, n = 0) => {
        const a = seatOf(id, n)?.anchor;
        return a && eng ? eng.client(a.x, a.y + 2, a.z) : null;
      }
    };
  }
  const counts = $derived(week.model ? tallyTotals(week.model.state.tallies) : null);
</script>

<main class="museum" bind:this={scene} data-museum data-exact-taps>
  <h1 class="sr-only">{t('museum.title')}</h1>
  <canvas bind:this={canvas} class="room" data-museum-room onpointerdown={onDown} onpointermove={onMove} onpointerup={onUp}
    onpointercancel={onCancel} onwheel={camera.wheel} {@attach camera.attach} aria-label={t('museum.room')}></canvas>
  <div class="dip" class:on={!!dip} style:background={dipColor} style:--dip-in="{DIP_FADE_MS}ms" aria-hidden="true" data-museum-dip={dip ? 'on' : 'off'}></div>
  <div class="top obj-cream" bind:this={top}>
    <NavButton kind="back" text={t('tent.back')} onclick={leave} sfx="self" />
  </div>
  {#if eng && !fpv}<RoomChip name={chipName(roomId)} found={chipTally?.found} total={chipTally?.total} fresh={freshIn(roomId, fresh)} />{/if}
  {#if turned && !fpv}
    <button type="button" class="reset" data-museum-reset data-sfx="tick" aria-label={t('tent.resetView')} onclick={resetView}>
      <RecentreIcon />
    </button>
  {/if}
  <PanHint room="museum" on={!!eng && !fpv && !card} />
  {#if card && counts}
    <MuseumCard shown={card} {counts} {view} {dock} onclose={() => (card = null)} />
  {/if}
  <Says bind:this={says} {scene} />
  <Talk bind:this={talk} {scene} />
  {#if sayAt && scene}
    <SayPicker {scene} anchor={sayAt} onpick={pickSay} onclose={(e) => {
      closeSay(e);
      if (!e) sayBtn?.focus({ preventScroll: true });
    }} />
  {/if}
  <div class="foot" bind:this={foot} aria-hidden="true"></div>
  {#if sayShown}
    <div class="say-dock"><SayButton bind:el={sayBtn} open={!!sayAt} onopen={(el) => (sayAt = el)} /></div>
    <!-- my villager's eyes, the say button's mirror at the bottom left -->
    <div class="eye-dock"><EyeToggle /></div>
  {/if}
  {#if failed}<p class="fail" role="alert">はくぶつかんを ひらけませんでした</p>{/if}
</main>

<style>
  .museum { position: relative; max-width: var(--col); margin: 0 auto; height: var(--vh-fill); overflow: hidden; background: #1d1712; touch-action: none; }
  .room { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; -webkit-tap-highlight-color: transparent; }
  /* (the doorway's dip: dark a little before the room changes inside it (hud.ts DIP_MS), lifting slower; never takes a finger) */
  .dip { position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0; transition: opacity 200ms ease-out; }
  .dip.on { opacity: 1; transition: opacity var(--dip-in) ease-in; }
  .top { position: absolute; left: calc(var(--side) + var(--safe-left)); top: calc(var(--ui-top) + 8px); z-index: 2; min-height: var(--hit); }
  .foot { position: absolute; left: 0; right: 0; height: 0; bottom: calc(var(--safe-bottom, 0px) + 14px + var(--hit, 44px)); pointer-events: none; }
  .say-dock { position: absolute; z-index: 3; right: calc(var(--safe-right, 0px) + 8px); bottom: calc(var(--safe-bottom, 0px) + 14px); }
  .eye-dock { position: absolute; z-index: 3; left: calc(var(--safe-left, 0px) + 8px); bottom: calc(var(--safe-bottom, 0px) + 14px); }
  .reset {
    position: absolute; right: calc(var(--side) + var(--safe-right)); top: calc(var(--ui-top) + 8px); z-index: 2;
    width: 52px; height: 52px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    color: var(--c-ink); background: var(--c-card); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
  }
  .reset:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .fail { position: absolute; left: 16px; right: 16px; top: 40%; text-align: center; color: #F5E4BC; font-weight: 700; }
</style>
