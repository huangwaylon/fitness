// Visitors (docs/design.md "Visitors"), after NH: Daisy Mae on Sunday mornings, Wisp floating by on some nights (see-through,
// a slow bob in his glow), Gulliver on some days. Most stand at centre stage (world.ts CENTRE_STAGE: the layout's plaza, a
// clear patch of lawn behind the villagers' spots, in view as the island opens); Gulliver lies washed up on the front
// beach, as in NH. The 3D island draws each as NH's own model at the villagers' scale, posed by its director actor
// (world3d/villagers.ts: a things3 figure), and every flourish on it (its emotes and fx over its head, a treat popping up,
// Reese and Cyrus's heart float: world3d, fx3d); no DOM of its own (R4 step 7): its box is worked out from where it
// stands (a tap's, its balloon's speaker). A tap: their introduction the first time, then one of their lines (no
// trading, no ベル).
// On Halloween night (events.ts) Jack comes instead and asks for candy: 「キャンディを あげる」 delights him (joy, the
// candy pops up over a spooky sparkle), 「なにも あげない」 earns his trick (my villager's face goes goofy for a minute:
// `ontrick`). No inventory, no ベル.
// SceneTaps loads this chunk when a visitor or a guest is due, calls this once per slot, and asks it about each tap
// (`tap`); it draws the sleep talk's caption (`mumble`, an overlay) and a guest shop's sheet (`shop`). `?visitor=<id>`
// (dev or test mode) brings one now.
// Their life (visitorLife.ts; docs/design.md "Visitors: life"): the director's 'visitor' actor moves them (walks,
// motions, emotes, fx, facing), as it does the villagers; its model breathes and looks about as theirs do (villager3d
// poses). Idle life's beat gives them one small thing at a time: their NH signature, an emote, a look
// at the nearest villager, a stroll for those who roam, or a villager coming over to say hello. A tap: they turn to
// my villager with a little hop where they stand, then speak (and stand still while
// they do). Gulliver sleeps face down until the fifth nudge. They arrive when their visit starts (walking from the
// campsite along the paths, down from the sky, or appearing) and leave when it ends (back to the campsite); on a
// page's first paint they're simply there.
// `?arrive` (dev or test mode): the arrival plays on load; `?leave=<ms>`: the visit ends after that long; `?stroll`: a
// stroll now; `?meet`: the partner comes over now.
import { dayRecord } from '#lib/world/dayRecord.ts';
import { untrack, type Component } from 'svelte';
import { tall3d } from '../villager3d/manifest.ts';
import type { EmoteIcon } from '#lib/art.ts';
import { actors, addFx, awayFromHome, busy, cancel, faceToward, later, livePos, place as placeActor, setEmote, setMotion, walkTo } from '../motion/director.svelte.ts';
import { BEHAVIOUR, EDGE_FADE_MS, MUMBLES, POP_MS, VISITOR_SPEED, WAY_MS, nudge, pickAct, pickEmote, strollSpots, strollTrack, tapMotion, wayMs, type Way } from './visitorLife.ts';
import { drop, following, playTrack } from './trackPlay.ts';
import type { Pt } from '#lib/world/walkGraph.ts';
import { t } from '#lib/i18n/index.ts';
import '#lib/i18n/visitors.ts'; // its strings, loaded with it
import { dayKey, minuteNow, now } from '#lib/time/clock.ts';
import { localDateAt } from '#lib/time/dates.ts';
import { cue } from '#lib/sound/cues.ts';
import { eventJingle } from '#lib/sound/sound.svelte.ts';
import { sceneSfx } from './sceneTaps.ts';
import { clearAt, guardsU, stageGeo } from './placement.ts';
import { zodiacOf } from '#lib/world/beach.ts';
import { hook, hookFlag, islandSeed } from '#lib/world/devHooks.ts';
import { meetVisitor, turnTo, presence, strollRoute, villagerFree, visitorRoute, visitorWalkable } from './avatar.ts';
import { VILLAGER } from './scene.ts';
import { BUILDINGS, CENTRE_STAGE } from '#lib/world/world.ts';
import { site } from './site.svelte.ts';
import type { World } from './camera.svelte.ts';
import { figure, thing, things3 } from '../world3d/things3.ts';
import { beachedAt, dayVisitor, guestNow, onBeach, visitorLine, visitorNow, type VisitorId } from '#lib/world/visitors.ts';
import { besideStage, guestSpot } from '#lib/layout/spots.ts';
import { ROLES, fortuneOf, giftOf, isGuest, npcIcon, type GuestId } from '#lib/world/visitorRoles.ts';
import { findKey, findsView } from '#lib/model/finds.ts';
import { recordFind } from '#lib/store/actions.ts';
import { week } from '#lib/store/week.svelte.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { i18n } from '#lib/i18n/index.ts';
import { dateMs, ZONE_OFFSET_MS } from '#lib/time/dates.ts';
import type { Choice } from '#lib/world/pager.ts';
import type { SaySpeaker } from '#lib/world/say.ts';
import { stretch } from '../motion/stretch.svelte.ts';
import { SCENE } from '#lib/sync/storage.ts';
import type { FishId } from '#lib/world/critters.ts';
import { critterArt } from '#lib/world/critterBits.ts';
import { daysUntil } from '#lib/world/wedding.ts';
import { scenePreview } from '#lib/ui-state/preview.svelte.ts';
import { world as shared } from '#lib/store/world.svelte.ts';
import { handOver, holding, markVeg, myAsk, vegDay } from './vegAsk.svelte.ts';
import { vegGift, type VegRequest } from '#lib/world/vegRequest.ts';
import { cropName } from './farmUi.svelte.ts';
import { loadNames } from './catchLine.ts';
import { fx3d } from '#lib/world/fx3d.ts';

/** The day Gulliver was woken this session (he stays up for it). */
let wokeOn: string | null = null;

export type ShopSheet = Component<{ open: boolean; id: GuestId; pool: 'dear' | 'any'; name: string }>;
/** Gulliver's sleep talk or an おねがい's caption over their head (SceneTaps draws it: an overlay, the wish's kind). */
export type Mumble = { n: number; text: string; want?: true };
/** A visitor as the e2e's hooks list it (things3 probes `visitor:<slot>`; Island3D adds `shown`): its visit's `phase`
 *  (pop, arrive, here, leave) and the `way` it comes by, `stage` ('true': on centre stage), `asleep` (lie, stand), its
 *  director `motion`, the vegetable it asks for (`vegAsk`), walking; what shows on it: an `emote`, its `fx` (zzz, …), a
 *  `treat` popping up, the pair's `heart` float, the caption (`mumble`: its text). */
export interface VisitorRow {
  id: string; slot: string; stage: string | null; phase: string; way: string; asleep: string | null; motion: string | null;
  vegAsk: string | null; walking: boolean; mode: null; playing: false; card: false; emote: boolean; fx: string[]; treat: boolean;
  heart: boolean; mumble: string | null;
}
/** What SceneTaps asks of a visitor's slot. */
export type Visitor = {
  tap(px: number, py: number, body?: boolean): boolean;
  claims(px: number, py: number, body?: boolean): string | null;
  /** The caption over their head now, and where its anchor is (world x, z, lift: their head's top). */
  readonly mumble: Mumble | null;
  mumbleAt(): readonly [number, number, number];
  /** A guest shop's sheet (loaded on its first ask), what it sells, open. */
  shop: { open: boolean; for: { id: GuestId; pool: 'dear' | 'any'; name: string } | null; Sheet: ShopSheet | null };
};

/** One visitor slot on island `w` (the day's visitor's, centre stage, or the day's guest's, at the guest spot: each its own
 *  director actor and 3D figure): its effects in a root of their own (`stop` with the scene). */
export function useVisitor(w: World, o_: {
  scene: () => HTMLElement | undefined;
  enabled: () => boolean;
  /** Say a line in the speech balloon (IslandScene's Talk), from a speaker (its box on screen). */
  say?: (name: string, parts: string | string[], from: SaySpeaker, o?: { colour?: string; choices?: Choice[]; ondone?: () => void }) => void;
  /** Jack's trick, when he gets no candy (IslandScene: my villager's goofy face for a while). */
  ontrick?: () => void;
  /** Whose slot: the day's visitor's (visitors.ts visitorNow, centre stage), or the day's guest's (guestNow: the guest
   *  spot, visitorRoles.ts). */
  slot?: 'visitor' | 'guest';
  /** The guest's: whether the day's visitor stands on centre stage now (no guest spot down: the guest stands beside). */
  stageTaken?: () => boolean;
}): Visitor & { stop: () => void } {
  /** The slot's director actor. */
  const A = o_.slot ?? 'visitor';
  const { enabled } = o_;
  const shop = $state<Visitor['shop']>({ open: false, for: null, Sheet: null });
  let api!: Visitor;
  const stop = $effect.root(() => {


    /** A pair standing side by side (Reese and Cyrus): how many figures wide the clearance is, and how far apart their
     *  middles stand (shares of the height). */
    const WIDE: Partial<Record<VisitorId, number>> = { reese: 1.95 };
    const PAIR_DX = 0.55;
    /** Floating off the ground (u). */
    const FLOAT: Partial<Record<VisitorId, number>> = { wisp: 12 };
    /** Gulliver lies washed up face down at the front beach's water's edge (NH), somewhere new each day (visitors.ts
     *  beachedAt: the layout's sand, by the date); the rest stand on centre stage (spots.ts stageOf: the layout's plaza). */
    const spotOf = (id: VisitorId, date: string): Pt | null => {
      if (A === 'visitor') return onBeach(id) ? [...beachedAt(site.layout, date, islandSeed())] : null;
      // the guest (docs/design.md "Visitors: roles"): a beach guest on Gulliver's beach (at the guest spot on a day he lies
      // there), the rest at the guest spot; none down: centre stage, or beside it while the day's visitor stands there
      const l = site.layout, own = l && guestSpot(l);
      if (onBeach(id) && !(gulliverToday(date) || own)) return [...beachedAt(l, date, islandSeed())];
      if (own) return [...own];
      return o_.stageTaken?.() && l ? ((b) => (b ? [...b] : null))(besideStage(l)) : null;
    };
    /** Gulliver washes up today (the visitors' slot's: the rotation's draw). */
    const gulliverToday = (date: string) => dayVisitor(date, new Date(`${date}T00:00:00Z`).getUTCDay(), islandSeed()) === 'gulliver';
    /** The campsite's door: walkers arrive from it and leave into it (spec §3). */
    const camp = (): Pt => ((b) => [b.x, b.z - 16] as Pt)(BUILDINGS.find((b) => b.id === 'campsite')!);
    /** The partner comes over only to a visitor this near its home (u): never across the island to centre stage. */
    const MEET_NEAR = 600;
    /** Visitors outside the roster (an event's guest): their name-tag colour (Jack: his robe's purple; the holiday hosts:
     *  Nookipedia's title colours). */
    const TAG: Partial<Record<VisitorId, string>> = {
      jack: '#7A4FB8', franklin: '#FF97CA', jingle: '#E10000', zipper: '#FFE20B', reese: '#FFAAD1',
      // the guests (the ACNH data's bubble colours)
      gracie: '#D254C7', wardell: '#3E8FB0', katrina: '#1C2F60', wendell: '#8C99FD', gullivarrr: '#F52C2C', pete: '#44C04F', leilani: '#7DCC00',
      lottie: '#FFA6AA', chip: '#77614C', nat: '#72AA1C', rover: '#5A66D2', shrunk: '#E86A6A', tortimer: '#C9A800', phineas: '#D38856', pave: '#0A96AE'
    };
    const CYRUS_TAG = '#4DDCD9';

    const clock = $derived(minuteNow());
    const who = $derived(A === 'guest' ? guestNow(clock) : visitorNow(clock));
    const date = $derived(dayKey(clock));
    /** `?leave=<ms>` (dev or test mode): the visit ends after that long (the departure's hook). */
    let gone = $state(false);
    $effect(() => {
      const ms = Number(hook('leave'));
      if (!ms) return;
      const t = setTimeout(() => (gone = true), ms);
      return () => clearTimeout(t);
    });
    /** Who should be here now, and who is (a visitor whose time is up is still here while they leave). */
    const target = $derived(gone ? null : who);
    let shown = $state<VisitorId | null>(null);
    /** pop: there on the page's first paint; arrive / leave: coming or going (`way`); here: on the island. */
    let phase = $state<'pop' | 'arrive' | 'here' | 'leave'>('pop');
    let way = $state<Way>('appear');
    /** At the water's edge, walking on or off: fading in or out. */
    let edge = $state(false);
    /** When the arrival or the departure began (performance.now()): a float or a flight's height follows it. */
    let wayT0 = 0;
    /** Arrivals in the page's first moments are a pop in place (they were already here); `?arrive` plays it. */
    const bornAt = Date.now();
    const forceArrive = hookFlag('arrive');
    let liveArrival = false;
    $effect(() => {
      const t = target;
      untrack(() => {
        if (t === shown) return;
        if (!shown) {
          liveArrival = forceArrive || Date.now() - bornAt > 3000;
          shown = t;
        } else if (phase !== 'leave') depart();
      });
    });

    /** Gulliver asleep (NH: face down on the beach until he's been nudged five times); the day he was woken (this
     *  session's), so a scene remount keeps him up; woken by either of us, he's up on both phones (the shared day's
     *  `woke`, docs/backend.md#shared-world). */
    let woke = $state(wokeOn === localDateAt(now().getTime()) || !!shared.day.woke.gulliver);
    $effect(() =>
      shared.on(({ e, live: now }) => {
        if (e.kind === 'world' && e.op === 'woke' && e.id === 'gulliver' && !woke) upGulliver(now && shown === 'gulliver');
      })
    );
    let nudges = 0;
    const sleeping = $derived(shown === 'gulliver' && !woke);

    /** Where it stands this visit and how tall (u). `stage`: at centre stage; `lie`: Gulliver, who lies there asleep. */
    const spot = $derived.by(() => {
      const id = shown;
      if (!id) return null;
      void site.rev;
      const own = spotOf(id, date), [x, z] = own ?? CENTRE_STAGE;
      return { x, z, h: tall3d(id) || VILLAGER.h, stage: !own, lie: id === 'gulliver' };
    });
    // a new visitor with a spot: they arrive (once per visit)
    let arrivedFor: VisitorId | null = null;
    $effect(() => {
      const id = shown, s = spot;
      if (!id || !s || arrivedFor === id) return;
      arrivedFor = id;
      untrack(() => arrive(id, s));
    });
    $effect(() => () => untrack(() => cancel(A)));
    // the stage moved under them (the island's layout came in after they arrived, or a もようがえ moved the visitors'
    // spot, spots.ts stageOf): they're on the new one at once, as on their next appearance
    let arrivedAt = '';
    $effect(() => {
      const id = shown, s = spot;
      if (!id || !s || arrivedFor !== id) return;
      const key = `${id}|${s.x},${s.z}`;
      if (key === arrivedAt) return;
      const first = !arrivedAt.startsWith(`${id}|`);
      arrivedAt = key;
      if (first) return;
      untrack(() => {
        if (phase === 'leave') return;
        cancel(A);
        st.home = [s.x, s.z];
        placeActor(A, s.x, s.z);
        w.kick();
        if (phase === 'arrive' || phase === 'pop') phase = 'here';
      });
    });

    const st = actors[A];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const home = (): Pt => [spot?.x ?? CENTRE_STAGE[0], spot?.z ?? CENTRE_STAGE[1]];
    /** Where the feet are right now (world u), mid-walk included. */
    const where = (): Pt => livePos(A);
    /** Here they come: from the campsite (walking or hopping) along the walk graph, down from the sky, or appearing; a
     *  pop in place on the page's first paint. */
    function arrive(id: VisitorId, s: NonNullable<typeof spot>) {
      cancel(A);
      edge = false;
      const at: Pt = [s.x, s.z], b = BEHAVIOUR[id];
      st.home = at;
      st.face = 'home';
      st.fx = [];
      st.emote = null;
      way = id === 'gulliver' && sleeping ? 'appear' : b.arrive;
      if (sleeping) later(A, 400, () => addFx(A, 'zzz'));
      if (!liveArrival) {
        placeActor(A, at[0], at[1]);
        w.kick();
        phase = 'pop';
        later(A, POP_MS, () => (phase = 'here'));
        return;
      }
      phase = 'arrive';
      wayT0 = performance.now();
      if (way === 'walk' || way === 'hop') {
        const from = camp(), pts = visitorRoute(from, at);
        if (pts) {
          placeActor(A, from[0], from[1]);
          edge = true;
          later(A, EDGE_FADE_MS, () => (edge = false));
          walkTo(A, pts, { speed: VISITOR_SPEED.arrive, from, face: 'home', then: () => {
            phase = 'here';
            setMotion(A, 'hop');
          } });
          return;
        }
        way = 'appear';
      }
      placeActor(A, at[0], at[1]);
      w.kick();
      later(A, wayMs(way), () => (phase = 'here'));
    }

    /** Their time is up: off the way they came (back to the campsite and into it, up into the sky, gone in a puff),
     *  then the next visitor (if any) arrives. */
    function depart() {
      const id = shown;
      if (!id) return;
      cancel(A);
      phase = 'leave';
      wayT0 = performance.now();
      edge = false;
      st.emote = null;
      st.fx = st.fx.filter((f) => f.kind !== 'zzz');
      way = id === 'gulliver' && sleeping ? 'appear' : BEHAVIOUR[id].leave;
      const done = () => {
        shown = null;
        arrivedFor = null;
        phase = 'pop';
        edge = false;
        const next = untrack(() => target);
        if (next) {
          liveArrival = true;
          shown = next;
        }
      };
      if (way === 'walk' || way === 'hop') {
        const from = where(), to = camp(), pts = visitorRoute(from, to);
        if (pts) {
          walkTo(A, pts, { speed: VISITOR_SPEED.arrive, from, then: () => {
            edge = true;
            later(A, EDGE_FADE_MS, done);
          } });
          return;
        }
        way = 'appear';
      }
      later(A, wayMs(way), done);
    }

    /** A line of theirs is in the balloon (until it closes, or 20 s at most: another speaker may replace it). */
    let speakingUntil = 0;
    const speaking = () => Date.now() < speakingUntil;
    let bannerTimer: ReturnType<typeof setTimeout> | undefined;
    $effect(() => () => clearTimeout(bannerTimer));
    /** Their line in the balloon by them; out of view (a catch's cheer or thanks while they stand past the horizon or
     *  behind the camera), a banner with their name and icon instead (`who`: the speaker, else the one shown): a balloon has no one to stand by. */
    function say(name: string, parts: string | string[], from: SaySpeaker, o: { colour?: string; choices?: Choice[]; ondone?: () => void; who?: string } = {}) {
      speakingUntil = Date.now() + 20_000;
      if (!o.choices?.length && !onScreenNow()) {
        const text = [parts].flat().join(' ').replace(/\s*\n\s*/g, ' '), ms = Math.max(3600, 1200 + [...text].length * 70);
        toasts.show(t('visitor.said', { name, text }), ms, { reaction: 'joy', npc: npcIcon(o.who ?? shown ?? '') });
        clearTimeout(bannerTimer);
        bannerTimer = setTimeout(() => ((speakingUntil = 0), o.ondone?.()), ms);
        return;
      }
      o_.say?.(name, parts, from, { ...o, ondone: () => ((speakingUntil = 0), o.ondone?.()) });
    }

    /** Idle life's beat (presence.beat), drawn from the slot's PRNG (`r`: the same on both phones, island/ambient.ts): one
     *  small thing, and now and then a quieter second one a few seconds later. */
    let lastEmote: EmoteIcon | null = null;
    let lastMeet = 0;
    function beat(r: () => number = Math.random, follow = true) {
      const id = shown, s = spot;
      if (!id || !s || phase !== 'here' || !enabled()) return;
      // an open おねがい: now and then its caption instead (this phone's own draw: the shared beat's stays in step)
      if (follow && ask && !sleeping && !speaking() && Math.random() < WANT_P) return void want();
      const act = pickAct(id, {
        speaking: speaking(), asleep: sleeping, walking: st.walking, away: awayFromHome(A),
        sinceMeet: lastMeet ? Date.now() - lastMeet : Infinity, villagerFree: meetable(s) && villagerFree(), scheduled: true
      }, r);
      if (!act) return;
      if (act === 'signature') signature(id);
      else if (act === 'emote') setEmote(A, (lastEmote = pickEmote(id, r, lastEmote)));
      else if (act === 'look') look();
      else if (act === 'meet') meet(id);
      if (follow && (act === 'signature' || act === 'emote' || act === 'look') && r() < 0.5) later(A, 4000 + r() * 2500, () => beat(r, false));
    }
    $effect(() => {
      if (!shown) return;
      const k = A === 'guest' ? 'guestBeat' : 'beat';
      presence[k] = beat;
      presence.syncs[A] = sync;
      return () => {
        if (presence[k] === beat) presence[k] = null;
        if (presence.syncs[A] === sync) delete presence.syncs[A];
        drop(A);
      };
    });

    /** A stroll of this phone's own (`?stroll`) holds the schedule's off until it's back. */
    let ownUntil = 0;
    /** Where the schedule has them at `t` (idle life's sync, on every slot and on coming back: visitorLife.ts
     *  strollTrack): on a stroll (joined where it is by now), else on their spot. Not while they speak, sleep, come
     *  or go. `jump`: the island wasn't in view meanwhile (put there, no walk). */
    function sync(t: number, jump: boolean) {
      const id = shown, s = spot;
      if (!id || !s || phase !== 'here' || speaking() || sleeping || Date.now() < ownUntil) return;
      const tr = strollTrack(id, home(), t, A, visitorWalkable, strollRoute);
      if (tr && t < tr.end) {
        if (jump || !following(A, tr.key)) playTrack(A, tr, t, jump, (_, l) => (l.face ? (st.face = l.face) : setMotion(A, l.kind === 'hop' ? 'hop' : 'turn')));
        w.kick();
        return;
      }
      drop(A);
      if (!jump && (st.walking || busy(A))) return;
      const [x, z] = where(), [hx, hz] = home();
      if (Math.hypot(x - hx, z - hz) < 3) return;
      if (!jump) return void back(VISITOR_SPEED.stroll);
      placeActor(A, hx, hz);
      st.face = 'home';
      w.kick();
    }

    /** Their NH signature (visitorLife.ts BEHAVIOUR): Gulliver's sleeping twitch, Franklin looking about for food, … */
    function signature(id: VisitorId) {
      if (sleeping) {
        setMotion(A, 'twitch');
        if (!st.fx.some((f) => f.kind === 'zzz')) addFx(A, 'zzz');
        return;
      }
      const sig = BEHAVIOUR[id].signature;
      if (sig.motion) setMotion(A, sig.motion);
      if (sig.fx) addFx(A, sig.fx);
      if (sig.emote && Math.random() < 0.5) setEmote(A, sig.emote);
      if (id === 'franklin') {
        // a look one way, then the other, for something to cook
        st.face = Math.random() < 0.5 ? 'l' : 'r';
        later(A, 1100, () => (st.face = st.face === 'l' ? 'r' : 'l'));
        later(A, 2300, () => (st.face = 'home'));
      }
    }

    /** The partner may come over: the visitor stands within MEET_NEAR of its home (Daisy Mae, Gulliver at まえ). */
    const meetable = (s: { x: number; z: number }) => Math.hypot(actors.partner.home[0] - s.x, actors.partner.home[1] - s.z) <= MEET_NEAR;

    /** A look at the nearest villager (or at world `x`), then back. */
    function look(x?: number) {
      const [vx, vz] = where();
      const tx = x ?? (['mine', 'partner'] as const).map((v) => livePos(v)).sort((a, b) => Math.hypot(a[0] - vx, a[1] - vz) - Math.hypot(b[0] - vx, b[1] - vz))[0][0];
      faceToward(A, tx);
      later(A, rand(1800, 2800), () => !speaking() && (st.face = 'home'));
    }

    /** A stroll of this phone's own (`?stroll`, the e2e's; idle life's come from the schedule: sync): to a spot near
     *  theirs that's walkable, clear of the villagers and, where it's on screen, of every control, then a look around
     *  and, a while later, back. */
    function stroll(r: () => number = Math.random): boolean {
      const id = shown, s = spot, g = stageGeo(o_.scene());
      if (!id || !s || !g) return false;
      const keep = guardsU(g, -5 * g.k, (el) => getComputedStyle(el).visibility === 'hidden'); // (out-of-view anchored overlays)
      const from = where();
      for (const p of strollSpots(home(), BEHAVIOUR[id].roam, r)) {
        if (!visitorWalkable(p[0], p[1]) || !standsClear(keep, p[0], p[1], s.h)) continue;
        if ((['mine', 'partner'] as const).some((v) => Math.hypot(livePos(v)[0] - p[0], livePos(v)[1] - p[1]) < 44)) continue;
        const pts = visitorRoute(from, p);
        if (!pts) continue;
        drop(A);
        const ms = walkTo(A, pts, { speed: VISITOR_SPEED.stroll, from, then: () => {
          setMotion(A, id === 'zipper' ? 'hop' : 'turn');
          later(A, rand(4000, 7000), () => !speaking() && back(VISITOR_SPEED.stroll));
        } });
        ownUntil = Date.now() + ms * 2 + 7500;
        return true;
      }
      return false;
    }

    /** A figure h units tall standing at world (x, z) covers no control (off screen: nothing to cover). */
    function standsClear(keep: ReturnType<typeof guardsU>, x: number, z: number, h: number): boolean {
      if (!w.inView(x, z)) return true;
      const [sx, sy] = w.screenU(x, z), k = w.scaleAt(x, z);
      return clearAt(keep, sx, sy - (h * k) / 2, h * k * 0.32, (h * k) / 2);
    }

    /** Back to their spot (ms until there; 0: already). */
    function back(speed: number, then?: () => void): number {
      const from = where(), to = home();
      if (Math.hypot(from[0] - to[0], from[1] - to[1]) < 2) return (then?.(), 0);
      const pts = visitorRoute(from, to) ?? [to];
      return walkTo(A, pts, { speed, from, face: 'home', then });
    }

    /** The partner comes over to say hello: they face each other, the visitor answers with their own emote. */
    function meet(id: VisitorId): boolean {
      const ok = meetVisitor(where(), (x) => {
        faceToward(A, x);
        setMotion(A, 'hop');
        later(A, 500, () => setEmote(A, BEHAVIOUR[id].hello));
        later(A, 3600, () => !speaking() && (st.face = 'home'));
      });
      if (ok) lastMeet = Date.now();
      return ok;
    }

    // Celeste: a falling star (SceneTaps' 'island:star') — she looks up at it and points (NH: she loves the stars)
    $effect(() => {
      const host = o_.scene();
      if (!host) return;
      let lastStar = 0;
      const onStar = (e: Event) => {
        const x = (e as CustomEvent<{ x: number }>).detail?.x;
        if (shown !== 'celeste' || phase !== 'here' || speaking() || Date.now() - lastStar < 2500) return;
        lastStar = Date.now();
        // the star's screen x (px from the scene's left) → a world x level with her
        if (Number.isFinite(x)) {
          const [vx, vz] = where(), p = w.screenAt(vx, vz);
          faceToward(A, vx + (x - p.sx) / (p.scale * w.view.s));
        }
        setMotion(A, 'point');
        setEmote(A, Math.random() < 0.5 ? 'mark-sparkle' : 'inspiration');
        later(A, 2600, () => !speaking() && (st.face = 'home'));
      };
      host.addEventListener('island:star', onStar);
      return () => host.removeEventListener('island:star', onStar);
    });

    // dev hooks: a stroll now, the partner coming over now (after the opening beats; `?stroll=6000`: that many ms after)
    $effect(() => {
      const meetNow = hookFlag('meet');
      if (!(meetNow || hookFlag('stroll')) || !shown) return;
      const after = meetNow ? 3000 : Number(hook('stroll')) || 3000;
      let t: ReturnType<typeof setTimeout>, tries = 0;
      const go = () => {
        const ok = meetNow ? meet(shown!) : stroll();
        if (!ok && ++tries < 12) t = setTimeout(go, 700);
      };
      t = setTimeout(go, after);
      return () => clearTimeout(t);
    });

    /** Group stretching: an awake visitor joins in on the villagers' beat (Gulliver sleeps through it): each stretch is its
     *  motion (its model does NH's three, as the villagers' do). */
    const pose = $derived(shown && !sleeping ? stretch.pose : null);
    $effect(() => {
      const m = pose;
      void stretch.n;
      if (m) untrack(() => setMotion(A, m));
    });
    /** How high it floats now (u, read by the 3D island each frame): Wisp a little off the ground; floating or flying
     *  down on arriving (up again on leaving), from about a figure and a half above its spot. */
    function liftNow(): number {
      const id = shown;
      if (!id) return 0;
      const base = FLOAT[id] ?? 0;
      if ((phase !== 'arrive' && phase !== 'leave') || (way !== 'float' && way !== 'fly')) return base;
      const k = Math.min(1, (performance.now() - wayT0) / WAY_MS[way]), up = phase === 'arrive' ? 1 - k : k;
      return base + (spot?.h ?? VILLAGER.h) * 1.5 * up * up;
    }
    /** Asleep face down on the beach (Gulliver), read by the 3D island. */
    const proneNow = () => sleeping && !!spot?.lie;
    /** Faded out: at the campsite's door walking on or off, or leaving in a puff (appearing, spooking) or flying away. */
    const awayNow = () => edge || (phase === 'leave' && way !== 'walk' && way !== 'hop' && performance.now() - wayT0 > WAY_MS[way] * 0.5);
    /** Visitors who introduced themselves this session. */
    const met = new Set<VisitorId>();
    let last: string | undefined;

    /** Jack got his candy this session (then he just chats); a treat replays his joy (Franklin's too, with his fish). */
    let treated = false;
    let treat = $state(false);
    let treatTimer: ReturnType<typeof setTimeout> | undefined;
    $effect(() => () => clearTimeout(treatTimer));
    /** A treat pops up over their head (Jack's candy, Franklin's or Wendell's fish, the vegetable handed over: its
     *  official picture rising in a little spooky sparkle, the 3D island's: fx3d `art` and `burst`). */
    function treatPop(key: string) {
      const [x, z] = where(), h = spot?.h ?? VILLAGER.h, up = h * 1.1 + (FLOAT[shown ?? 'jack'] ?? 0);
      fx3d('art', x, z, up, { art: key, v: 'rise', size: key.startsWith('finds/') ? 32 : 22, ms: 2200 });
      fx3d('burst', x, z, up);
      treat = true;
      clearTimeout(treatTimer);
      treatTimer = setTimeout(() => (treat = false), 2400);
    }

    /** Jack: trick or treat. His introduction (the first time) ends on the ask; after a treat, one of his lines. */
    function jack(name: string, target: SaySpeaker, colour: string) {
      if (treated) {
        last = visitorLine('jack', Math.random, last);
        return say(name, t(last), target, { colour });
      }
      const parts = met.has('jack') ? [t('chat.sp.jack.ask')] : [t('chat.sp.jack.intro'), t('chat.sp.jack.ask')];
      met.add('jack');
      say(name, parts, target, {
        colour,
        choices: [
          { label: t('visitor.jack.give'), pick: () => {
            treated = true;
            cue('emote-joy');
            treatPop('items/candy');
            if (shown) say(name, t('chat.sp.jack.thanks'), speaker, { colour });
          } },
          { label: t('visitor.jack.none'), pick: () => {
            cue('emote-surprise');
            o_.ontrick?.();
            if (shown) say(name, t('chat.sp.jack.trick'), speaker, { colour });
          } }
        ]
      });
    }

    /** Franklin on Turkey Day (NH: "a fish for the dish"): his introduction ends on the ask; the next fish caught that day
     *  (Critters tells the scene: `island:catch`) makes him happy, and after that he chats. This phone's own record of the
     *  day (scene-franklin), so a reload keeps it. */
    function franklin(name: string, target: SaySpeaker, colour: string) {
      const d = franklinDay.read(today());
      if (d.fed) {
        last = visitorLine('franklin', Math.random, last);
        return say(name, t(last), target, { colour });
      }
      const parts = met.has('franklin') || d.asked ? [t('chat.sp.franklin.ask')] : [t('chat.sp.franklin.intro'), t('chat.sp.franklin.ask')];
      met.add('franklin');
      franklinDay.patch(d.date, { asked: true });
      say(name, parts, target, { colour });
    }
    const today = () => dayKey(now());
    const franklinDay = dayRecord(SCENE.franklin, { asked: false, fed: false });
    let thanksTimer: ReturnType<typeof setTimeout> | undefined;
    $effect(() => () => clearTimeout(thanksTimer));
    $effect(() => {
      const host = o_.scene();
      if (!host) return;
      const onCatch = (e: Event) => {
        const c = (e as CustomEvent<{ kind: string; id: string }>).detail;
        if (shown && isGuest(shown)) return guestCatch(shown, c);
        const fish = c?.kind === 'fish' ? c.id : undefined;
        const d = franklinDay.read(today());
        if (shown !== 'franklin' || !fish || !d.asked || d.fed) return;
        franklinDay.patch(d.date, { fed: true });
        // after the catch's plate has had its moment: his joy, the fish over his head, his thanks
        clearTimeout(thanksTimer);
        thanksTimer = setTimeout(() => {
          cue('emote-joy');
          // NH's Turkey Day: he cooks it then and there (the cooking jingle, then the dish's; only with ミュージック on)
          eventJingle(['turkey-cooking-start', 'turkey-cooking-done']);
          treatPop(critterArt(fish as FishId));
          if (shown) say(t('visitor.franklin'), t('chat.sp.franklin.thanks', { fish: t(`critter.name.${fish}`) }), speaker, { colour: TAG.franklin });
        }, 2800);
      };
      host.addEventListener('island:catch', onCatch);
      return () => host.removeEventListener('island:catch', onCatch);
    });

    /** Reese and Cyrus on a milestone day: her introduction ends on the count (「けっこんしき まで あと 100日！」; on the day
     *  「ごけっこん おめでとう！」), then they take turns. */
    let coupleTurn = 0;
    function couple(target: SaySpeaker) {
      const left = scenePreview().event === 'wedding' ? 0 : daysUntil(today());
      const count = left === 0 ? t('chat.sp.reese.day') : t('chat.sp.reese.count', { n: left });
      if (!met.has('reese')) {
        met.add('reese');
        return say(t('visitor.reese'), [t('chat.sp.reese.intro'), count], target, { colour: TAG.reese });
      }
      // Cyrus a line of his; Reese one of hers, and the count again
      const cyrus = coupleTurn++ % 2 === 0;
      last = visitorLine((cyrus ? 'cyrus' : 'reese') as VisitorId, Math.random, last);
      if (cyrus) say(t('visitor.cyrus'), t(last), target, { colour: CYRUS_TAG, who: 'cyrus' });
      else say(t('visitor.reese'), [t(last), count], target, { colour: TAG.reese });
    }

    async function talk(id: VisitorId) {
      const target = speaker;
      if (!shown) return;
      sceneSfx('visitor');
      const name = t(`visitor.${id}`);
      if (ask && (id === 'franklin' || isGuest(id))) return vegTalk(id, ask, name, target, TAG[id]!);
      if (id === 'jack') return jack(name, target, TAG.jack!);
      if (id === 'franklin') return franklin(name, target, TAG.franklin!);
      if (id === 'reese') return couple(target);
      // a guest: their role's (a shop's first tap is its introduction and its offer at once)
      if (isGuest(id) && (met.has(id) || ROLES[id].kind === 'shop')) {
        const first = !met.has(id);
        met.add(id);
        return guest(id, name, target, TAG[id]!, first);
      }
      // their name tag in their own NH colour (the roster, loaded on the first visit's tap)
      const colour = TAG[id] ?? ((await import('#lib/villagers/roster.ts')).ROSTER as Record<string, { colour?: string }>)[id]?.colour;
      // the first tap of a visit: their introduction (a few pages, as NH's visitors open)
      if (!met.has(id)) {
        met.add(id);
        if (id === 'wendell') wendellDay.patch(today(), { asked: true });
        return say(name, t(`chat.sp.${id}.intro`), target, { colour });
      }
      last = visitorLine(id, Math.random, last);
      // Celeste names the season's sign (its zodiac fragment is the likelier one after tonight's wishes)
      const sign = zodiacOf(localDateAt(now().getTime())).replace(/-fragment$/, '');
      say(name, t(last, { sign: t(`zodiac.${sign}`) }), target, { colour });
    }

    // ---- the guests' roles (visitorRoles.ts): a shop, a gift, Katrina's reading, Wendell's fish, a cheer at a catch ----
    const wendellDay = dayRecord(SCENE.wendell, { asked: false, fed: false });
    function openShop(id: GuestId, name: string) {
      void import('./VisitorShop.svelte').then((m) => {
        shop.Sheet = m.default as unknown as ShopSheet;
        shop.for = { id, pool: ROLES[id].pool ?? 'any', name };
        shop.open = true;
      }, () => {});
    }
    /** The piece a giver gives today (the same on every phone), whether the island has it already, its name. */
    async function giftNow(id: GuestId): Promise<{ item: string; given: boolean; name: string } | null> {
      const m = week.model;
      if (!m) return null;
      const C = await import('./catalog.ts');
      const { loadCatalogNames } = await import('#lib/i18n/catalog.ts');
      await loadCatalogNames(i18n.locale);
      const date = today(), start = dateMs(date) - ZONE_OFFSET_MS;
      const before = new Set(m.state.finds.filter((f) => f.kind === 'item' && f.at < start).map((f) => f.id));
      const item = giftOf(id, date, C.treeFurniture(date).map((i) => i.id), before, islandSeed());
      if (!item) return null;
      return { item, given: findsView(m.state).has(findKey('item', item)), name: t(C.catalogName({ kind: 'item', id: item })) };
    }
    /** Their gift handed over (a present's find: in the ずかん's みつけた, the もようがえ's), their line, a word on it. */
    async function give(id: GuestId, name: string, target: SaySpeaker, colour: string, key = 'gift') {
      const g = await giftNow(id);
      if (!g) return say(name, t(`chat.sp.${id}.given`), target, { colour });
      if (g.given) return say(name, t(`chat.sp.${id}.given`), target, { colour });
      recordFind('item', g.item);
      cue('emote-joy');
      const got = () => toasts.show(t('world.guestShop.got', { item: g.name }), 3600, { reaction: 'joy', npc: npcIcon(id) });
      // (out of view their line is a banner itself: the word on the gift after it)
      const off = !onScreenNow();
      say(name, t(`chat.sp.${id}.${key}`, { item: g.name }), target, { colour, ondone: off ? got : undefined });
      if (!off) got();
    }
    /** A guest's tap after their introduction: their role's. */
    function guest(id: GuestId, name: string, target: SaySpeaker, colour: string, first = false) {
      const role = ROLES[id];
      if (role.kind === 'shop')
        return say(name, [...(first ? [t(`chat.sp.${id}.intro`)] : []), t(`chat.sp.${id}.offer`)], target, { colour, choices: [
          { label: t('visitor.shop.open'), pick: () => openShop(id, name) },
          { label: t('visitor.shop.no'), pick: () => {} }
        ] });
      if (role.kind === 'gift') return void give(id, name, target, colour);
      if (role.kind === 'fortune') {
        const f = fortuneOf(today(), week.model?.me ?? 'A', islandSeed());
        return say(name, [t('chat.sp.katrina.read'), t(`visitor.fortune.luck.${f.luck}`), t('visitor.fortune.colour', { c: t(`visitor.fortune.c.${f.colour}`) })], target, { colour });
      }
      if (role.kind === 'fish' && !wendellDay.read(today()).fed) {
        wendellDay.patch(today(), { asked: true });
        return say(name, t('chat.sp.wendell.ask'), target, { colour });
      }
      last = visitorLine(id, Math.random, last);
      say(name, t(last), target, { colour });
    }
    /** A catch while a guest is here: Wendell fed (his gift), Chip's or Nat's cheer for one of theirs. */
    function guestCatch(id: GuestId, c: { kind: string; id: string } | undefined) {
      const role = ROLES[id], a = speaker;
      if (!c || phase !== 'here') return;
      if (role.kind === 'fish' && c.kind === 'fish') {
        const d = wendellDay.read(today());
        if (!d.asked || d.fed) return;
        wendellDay.patch(d.date, { fed: true });
        clearTimeout(thanksTimer);
        thanksTimer = setTimeout(() => {
          treatPop(critterArt(c.id as FishId));
          void give(id, t(`visitor.${id}`), a, TAG[id]!, 'thanks');
        }, 2800);
        return;
      }
      if (role.kind === 'cheer' && c.kind === role.cheer && !speaking()) {
        setEmote(A, 'glee');
        setMotion(A, 'hop');
        faceToward(A, actors.mine.x);
        clearTimeout(thanksTimer);
        thanksTimer = setTimeout(() => {
          // (the fish's name from its catalog, loaded first: never a raw key)
          void loadNames().catch(() => {}).then(() => !speaking() && say(t(`visitor.${id}`), t(`chat.sp.${id}.cheer`, { name: t(`critter.name.${c.id}`) }), a, { colour: TAG[id] }));
        }, 2600);
      }
    }

    // ---- おねがい (vegAsk.svelte.ts, vegRequest.ts): the day's asker wants a vegetable of mine; a tap with it in my pocket
    // hands it over in place (their joy, the vegetable over their head, hearts, their かいがら and now and then a piece) ----
    /** My ask from whoever stands here (null: none, or handed over). */
    const ask = $derived(shown && phase !== 'leave' ? myAsk(shown, date) : null);
    const askKey = $derived(ask ? `${ask.by}|${ask.crop}|${date}` : '');
    /** A beat shows the ask's caption this often instead of its own; the first, this long after they're here. */
    const WANT_P = 1 / 3, WANT_FIRST_MS = 2500, WANT_MS = 3000;
    let wantN = 1000;
    /** The ask's caption over their head for a moment (「ニンジンが たべたいなあ」), a thought emote with it. */
    function want() {
      const r = ask;
      if (!r) return;
      void loadNames().then(() => {
        if (ask?.crop !== r.crop || speaking()) return;
        setEmote(A, 'thought');
        mumble = { n: ++wantN, text: t('visitor.veg.want', { name: cropName(r.crop) }), want: true };
        clearTimeout(mumbleTimer);
        mumbleTimer = setTimeout(() => (mumble = null), WANT_MS);
      }, () => {});
    }
    // once a little after they're first here with an ask open (this session)
    let wantedFor = '';
    $effect(() => {
      const k = askKey;
      if (!k || phase !== 'here' || wantedFor === k) return;
      wantedFor = k;
      const t0 = setTimeout(want, WANT_FIRST_MS);
      return () => clearTimeout(t0);
    });
    /** A tap on the asker: with the vegetable, the hand-over; else the ask (their introduction first, Franklin's fish
     *  too), and asked again, a kind word. */
    async function vegTalk(id: VisitorId, r: VegRequest, name: string, target: SaySpeaker, colour: string) {
      const fr = id === 'franklin', d = today();
      const intro = !met.has(id) && !(fr && franklinDay.read(d).asked);
      met.add(id);
      mumble = null;
      await loadNames().catch(() => {});
      const veg = cropName(r.crop);
      const v = holding(r) ? handOver(r, d) : null;
      if (v !== null) return thank(id, r, name, target, colour, veg, v);
      const pages = intro ? [t(`chat.sp.${id}.intro`)] : [];
      if (fr && !franklinDay.read(d).fed) {
        franklinDay.patch(d, { asked: true });
        pages.push(t('chat.sp.franklin.ask'));
      }
      pages.push(t(vegDay(d).asked ? 'visitor.veg.none' : fr ? 'chat.sp.franklin.vegAsk' : 'visitor.veg.ask', { name: veg }));
      markVeg(d, { asked: true });
      say(name, pages, target, { colour });
    }
    /** Handed over: their joy (Franklin cooks it), the vegetable over their head, hearts, then their thanks and かいがら,
     *  and the day's piece when the ask brings one (a present's find, as a giver's: its word once the balloon closes). */
    async function thank(id: VisitorId, r: VegRequest, name: string, target: SaySpeaker, colour: string, veg: string, v: number) {
      cue('emote-joy');
      if (id === 'franklin') eventJingle(['turkey-cooking-start', 'turkey-cooking-done']);
      treatPop(`finds/${r.crop}`);
      addFx(A, 'hearts');
      const pages = [t(id === 'franklin' ? 'chat.sp.franklin.vegThanks' : 'visitor.veg.thanks', { name: veg, v })];
      speakingUntil = Date.now() + 20_000;
      const g = r.gift ? await vegGiftNow().catch(() => null) : null;
      if (g) {
        recordFind('item', g.item);
        pages.push(t('visitor.veg.gift', { item: g.name }));
      }
      // (the vegetable's pop over their head first, then their words)
      clearTimeout(thanksTimer);
      thanksTimer = setTimeout(() => say(name, pages, target, { colour, ondone: g ? () => toasts.show(t('world.guestShop.got', { item: g.name }), 3600, { reaction: 'joy', npc: npcIcon(id) }) : undefined }), THANKS_MS);
    }
    const THANKS_MS = 1100;
    /** The ask's piece today (vegRequest.ts vegGift: the same on every phone), null: none left, or the island has it. */
    async function vegGiftNow(): Promise<{ item: string; name: string } | null> {
      const m = week.model;
      if (!m) return null;
      const C = await import('./catalog.ts');
      const { loadCatalogNames } = await import('#lib/i18n/catalog.ts');
      await loadCatalogNames(i18n.locale);
      const date = today(), start = dateMs(date) - ZONE_OFFSET_MS;
      const before = new Set(m.state.finds.filter((f) => f.kind === 'item' && f.at < start).map((f) => f.id));
      const item = vegGift(date, m.me, C.treeFurniture(date).map((i) => i.id), before, islandSeed());
      if (!item || findsView(m.state).has(findKey('item', item))) return null;
      return { item, name: t(C.catalogName({ kind: 'item', id: item })) };
    }

    /** A tap on the scene (client px): true when the visitor took it. `body`: only a tap on its figure itself (what's
     *  exactly under the finger wins: SceneTaps asks this first, then the small things' own boxes, then its reach: a
     *  finger's slack round the figure and its spot). A tap elsewhere on the island now and then draws a glance that
     *  way. */
    let lastGlance = 0;
    /** The figure's box now (client px), worked out from where it stands: its model's core standing (its height, 0.6 as
     *  wide: a pair wider; floating up), or lying face down (its length across, low). */
    function figBox(): { left: number; right: number; top: number; bottom: number } | null {
      const id = shown;
      if (!id || !spot) return null;
      const [x, z] = where(), p = w.screenAt(x, z), k = p.scale * w.view.s, cx = p.sx + w.view.left, fy = p.sy + w.view.top, h = spot.h * k;
      // (lying: h wide, .45 h tall, 3/4 of it above the feet; else .6 h wide (Reese's pair wider), h tall, floating up)
      if (sleeping && spot.lie) return { left: cx - h / 2, right: cx + h / 2, top: fy - 0.45 * h * 0.75, bottom: fy + 0.45 * h * 0.25 };
      const hw = 0.3 * (WIDE[id] ?? 1) * h, up = (FLOAT[id] ?? 0) * k;
      return { left: cx - hw, right: cx + hw, top: fy - up - h, bottom: fy - up };
    }
    // (its .art from its spot, for what keeps clear of it: standsClear, the balloon's present)
    $effect(() => {
      const m = things3(w).arts, f = () => (shown && phase !== 'leave' && w.inView(...where(), 20) ? figBox() : null);
      m.set(A, f);
      return () => void (m.get(A) === f && m.delete(A));
    });
    /** Whether a tap at client (px, py) is the visitor's (no side effect: SceneTaps' claims, the 3D pick's oracle; `body`
     *  and `src` as tap's and figBox's): who it is, or null. */
    function claims(px: number, py: number, body = false): string | null {
      const id = shown;
      if (!id || !spot || phase === 'leave' || !enabled()) return null;
      const pad = 8; // a finger's slack around the figure (px)
      const inside = (r: { left: number; right: number; top: number; bottom: number }) =>
        px >= r.left - pad && px <= r.right + pad && py >= r.top - pad && py <= r.bottom + pad;
      // the figure where it is now (only while on screen: a node out of view keeps its last box), or on its spot (a tap
      // aimed at it as it arrives or strolls off); Gulliver lying face down is wider than tall
      const lying = sleeping && spot.lie;
      const hwU = lying ? spot.h * 0.5 : spot.h * 0.32 * (WIDE[id] ?? 1), hU = (lying ? spot.h * 0.6 : spot.h) + (FLOAT[id] ?? 0);
      const now = where();
      const box = (x: number, z: number) => {
        const p = w.screenAt(x, z), k = p.scale * w.view.s, cx = p.sx + w.view.left, cy = p.sy + w.view.top;
        return { left: cx - hwU * k, right: cx + hwU * k, top: cy - hU * k, bottom: cy };
      };
      // on screen: in view, its feet clear of the horizon (a speck sunk behind it is out of reach)
      const seen = (x: number, z: number) => w.inView(x, z, 20) && w.screenAt(x, z).sy > w.view.horizon + 24;
      const fig = figBox();
      if (!fig) return null;
      const on = body ? seen(now[0], now[1]) && px >= fig.left && px <= fig.right && py >= fig.top && py <= fig.bottom
        : (seen(now[0], now[1]) && inside(fig)) || (seen(spot.x, spot.z) && inside(box(spot.x, spot.z)));
      return on ? id : null;
    }
    function tap(px: number, py: number, body = false): boolean {
      const id = shown;
      if (!id || !spot || phase === 'leave' || !enabled()) return false;
      if (!claims(px, py, body)) {
        const at = body ? null : w.worldAtClient(px, py), now = where();
        if (at && w.inView(now[0], now[1]) && phase === 'here' && !sleeping && !speaking() && !st.walking && Date.now() - lastGlance > 3000 && Math.random() < 0.5) {
          lastGlance = Date.now();
          look(at.x);
        }
        return false;
      }
      // in place (only a tap on empty ground walks): my villager turns to them and they answer (a tap meanwhile is the
      // same tap)
      if (talkTimer) return true;
      turnTo(spot.x);
      if (sleeping) {
        // a nudge: he twitches and mumbles in his sleep; the fifth wakes him (NH)
        nudgeGulliver();
        return true;
      }
      // where they stand (a stroll stopped there: the balloon follows its speaker; walking back to their spot first
      // kept a tap waiting seconds), turned to my villager with a little hop, then their line; the schedule's sync
      // takes them on their way, or home, once they're done
      if (phase === 'here') {
        drop(A);
        if (st.walking) placeActor(A, ...where());
      }
      faceToward(A, actors.mine.x);
      setMotion(A, tapMotion(id));
      speakingUntil = Date.now() + 20_000; // stand still from now
      talkTimer = setTimeout(() => {
        talkTimer = undefined;
        void talk(id);
      }, TURN_MS);
      return true;
    }
    /** The little hop before a line (ms). */
    const TURN_MS = 600;

    /** A nudge on sleeping Gulliver: a twitch, a snore and his sleep talk; the fifth: he jumps up, looks about, and
     *  introduces himself. */
    let mumble = $state<{ n: number; text: string; want?: true } | null>(null);
    let mumbleTimer: ReturnType<typeof setTimeout> | undefined;
    $effect(() => () => clearTimeout(mumbleTimer));
    /** Gulliver is up (`show`: with the jump, the sweat and a look about: woken here, or just now on the other phone). */
    function upGulliver(show: boolean) {
      woke = true;
      wokeOn = localDateAt(now().getTime());
      st.fx = st.fx.filter((f) => f.kind !== 'zzz');
      if (!show) return;
      cue('emote-surprise');
      setMotion(A, 'surprise');
      setEmote(A, 'surprise');
      addFx(A, 'sweat');
      // up on his feet (the pose eases upright), a look about (then, woken here, his introduction)
      later(A, 700, () => faceToward(A, actors.mine.x));
    }
    function nudgeGulliver() {
      const r = nudge(nudges);
      nudges = r.taps;
      sceneSfx('visitor');
      if (!r.woke) {
        setMotion(A, 'twitch');
        if (!st.fx.some((f) => f.kind === 'zzz')) addFx(A, 'zzz');
        mumble = { n: nudges, text: t(`visitor.gulliver.zzz.${(nudges - 1) % MUMBLES}`) };
        clearTimeout(mumbleTimer);
        mumbleTimer = setTimeout(() => (mumble = null), 1600);
        return;
      }
      mumble = null;
      shared.share({ kind: 'world', op: 'woke', id: 'gulliver' });
      upGulliver(true);
      speakingUntil = Date.now() + 20_000;
      talkTimer = setTimeout(() => {
        talkTimer = undefined;
        void talk('gulliver');
      }, WAKE_MS);
    }
    /** From the fifth nudge to his first words (ms): the jump, standing up, a look. */
    const WAKE_MS = 1300;
    // centre stage and the shore in front of it are the visitor's while one is out (the villagers wander elsewhere)
    $effect(() => {
      if (A !== 'visitor') return;
      presence.visitor = !!(shown && spot);
      return () => (presence.visitor = false);
    });
    let talkTimer: ReturnType<typeof setTimeout> | undefined;
    $effect(() => () => clearTimeout(talkTimer));


    // ---- what the 3D island draws of it (no DOM of its own) ----
    // its NH model, posed by the slot's actor (a things3 figure), wherever it walks; Reese's Cyrus beside her
    $effect(() => {
      const id = shown, s = spot;
      if (!id || !s) return;
      return untrack(() => figure(w, { x: s.x, z: s.z, h: s.h + 40, live: () => livePos(A), always: true,
        v3: { id, actor: A, lift: liftNow, prone: proneNow, away: awayNow, also: id === 'reese' ? { id: 'cyrus', dx: s.h * PAIR_DX } : undefined } })());
    });
    // Wisp's glow round him (a pale light breathing as he floats in it), and Reese and Cyrus under their heart float
    // (a pink heart balloon on a string, bobbing): held flourishes that follow them (things3 emit `hold`)
    $effect(() => {
      const id = shown, s = spot;
      if ((id !== 'wisp' && id !== 'reese') || !s) return;
      const h = s.h, t0 = performance.now();
      const live = id === 'wisp' ? () => [...where(), liftNow() + h * 0.5] as const : () => [...where(), h * 2.2 + Math.sin((performance.now() - t0) / 1080) * h * 0.03] as const;
      const emit = id === 'wisp' ? { kind: 'aura', every: 0, hold: true as const, size: (h * 1.6) / 10 } : { kind: 'art', v: 'float', art: 'heart-float', every: 0, hold: true as const, size: h * 0.67 };
      return untrack(() => thing(w, { x: s.x, z: s.z, h: h * 2, always: true, live, m3: { key: '', id: `${A}-${id === 'wisp' ? 'glow' : 'heart'}`, emit } })());
    });
    /** On screen now: in view, its feet clear of the horizon, its box on the page (out of it, a line is a banner). */
    function onScreenNow(): boolean {
      const r = shown && spot ? figBox() : null, [x, z] = where();
      return !!r && w.inView(x, z, 20) && w.screenAt(x, z).sy > w.view.horizon + 24 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
    }
    /** The figure as a balloon's speaker (Talk's): its box from where it stands, there while it's out. */
    const speaker: SaySpeaker = {
      // (gone as they set off: a balloon closes as its speaker leaves)
      get isConnected() {
        return !!shown && !!spot && phase !== 'leave';
      },
      getBoundingClientRect() {
        const r = figBox();
        return r ? new DOMRect(r.left, r.top, r.right - r.left, r.bottom - r.top) : new DOMRect();
      }
    };
    /** The caption's anchor: over the head (lying face down, over his head's end). */
    const mumbleAt = (): readonly [number, number, number] => {
      const [x, z] = where(), h = spot?.h ?? VILLAGER.h;
      // (higher than the 2D node's screen offsets: the camera looks down, so a height shows shorter)
      return sleeping && spot?.lie ? [x - h * 0.36, z, h * 0.9] : [x, z, h * 1.3 + (FLOAT[shown ?? 'jack'] ?? 0)];
    };
    // The e2e's row and box (things3 probes and boxes `visitor:<slot>`: its box by id, its foot the point it stands on).
    $effect(() => {
      const r = things3(w), key = `visitor:${A}`;
      const row = (): VisitorRow | null => {
        const s = spot;
        if (!shown || !s) return null;
        return {
          id: shown, slot: A, stage: s.stage ? 'true' : null, phase, way, asleep: sleeping ? (s.lie ? 'lie' : 'stand') : null, motion: st.motion ?? null,
          vegAsk: ask?.crop ?? null, walking: st.walking, mode: null, playing: false, card: false, emote: !!st.emote, fx: st.fx.map((f) => f.kind),
          treat, heart: shown === 'reese', mumble: mumble?.text ?? null
        };
      };
      const box = (id: string) => {
        const b = shown && (!id || id === shown) ? figBox() : null;
        return b ? { left: b.left, top: b.top, width: b.right - b.left, height: b.bottom - b.top, foot: [...w.clientAt(...where())] as [number, number] } : null;
      };
      // (and the visit's end now: __world3d.leave)
      const go = () => untrack(depart);
      r.probes.set(key, row);
      r.probes.set(`leave:${A}`, go);
      r.boxes.set(key, box);
      return () => {
        if (r.probes.get(key) === row) r.probes.delete(key);
        if (r.probes.get(`leave:${A}`) === go) r.probes.delete(`leave:${A}`);
        if (r.boxes.get(key) === box) r.boxes.delete(key);
      };
    });

    api = {
      tap, claims, mumbleAt, shop,
      get mumble() {
        return mumble;
      }
    };
  });
  return Object.assign(api, { stop });
}
