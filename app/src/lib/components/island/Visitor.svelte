<script lang="ts" module>
  /** The day Gulliver was woken this session (he stays up for it). */
  let wokeOn: string | null = null;
</script>

<script lang="ts">
  // Visitors (docs/design.md "Visitors"), after NH: Daisy Mae on Sunday mornings, Wisp floating by on some nights (see-through, a slow bob), Gulliver on some days. Most stand at centre
  // stage (world.ts CENTRE_STAGE: the layout's plaza, a clear patch of lawn behind the villagers' spots, in view as the
  // island opens); Gulliver lies washed up on the front beach, as in NH. Each is one world node (camera.svelte.ts) at the
  // villagers' scale: NH's own model, drawn and posed by the 3D island as the villagers are (world3d/villagers.ts; the
  // node here its tap area, its balloon's anchor, its emotes). A tap: their introduction the first time, then one of
  // their lines (no trading, no ベル).
  // On Halloween night (events.ts) Jack comes instead and asks for candy: 「キャンディを あげる」 delights him (joy, the
  // candy pops up over a spooky sparkle), 「なにも あげない」 earns his trick (my villager's face goes goofy for a minute:
  // `ontrick`). No inventory, no ベル.
  // SceneTaps mounts this inside the stage and asks it about each tap (`tap`). `?visitor=<id>` (dev or test mode) brings
  // one now.
  // Their life (visitorLife.ts; docs/design.md "Visitors: life"): the director's 'visitor' actor moves them (walks,
  // motions, emotes, fx, facing), as it does the villagers; its model breathes and looks about as theirs do (villager3d
  // poses). Idle life's beat gives them one small thing at a time: their NH signature, an emote, a look
  // at the nearest villager, a stroll for those who roam, or a villager coming over to say hello. A tap: they turn to
  // my villager with a little hop, back on their spot first if they'd strolled off, then speak (and stand still while
  // they do). Gulliver sleeps face down until the fifth nudge. They arrive when their visit starts (walking from the
  // campsite along the paths, down from the sky, or appearing) and leave when it ends (back to the campsite); on a
  // page's first paint they're simply there.
  // `?arrive` (dev or test mode): the arrival plays on load; `?leave=<ms>`: the visit ends after that long; `?stroll`: a
  // stroll now; `?meet`: the partner comes over now.
  import { dayRecord } from '../../world/dayRecord.ts';
  import { untrack } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { tall3d } from '../villager3d/manifest.ts';
  import Emote from '../characters/Emote.svelte';
  import Fx from '../characters/Fx.svelte';
  import { villagerEmote, type EmoteIcon } from '#lib/art.ts';
  import { actors, addFx, awayFromHome, cancel, faceToward, later, livePos, place as placeActor, removeFx, setEmote, setMotion, walkTo } from '../motion/director.svelte.ts';
  import { BEHAVIOUR, EDGE_FADE_MS, MUMBLES, POP_MS, VISITOR_SPEED, WAY_MS, nudge, pickAct, pickEmote, strollSpots, tapMotion, wayMs, type Way } from './visitorLife.ts';
  import type { Pt } from '../../world/walkGraph.ts';
  import { t } from '#lib/i18n/index.ts';
  import { dayKey, minuteNow, now } from '#lib/time/clock.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { eventJingle } from '#lib/sound/sound.svelte.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { EDGE, clearAt, guardsU, stageGeo } from './placement.ts';
  import { zodiacOf } from '../../world/beach.ts';
  import { hook, hookFlag, islandSeed } from '../../world/devHooks.ts';
  import { meetVisitor, turnTo, presence, villagerFree, visitorRoute, visitorWalkable } from './avatar.ts';
  import { su, VILLAGER } from './scene.ts';
  import { BUILDINGS, CENTRE_STAGE } from '../../world/world.ts';
  import { site } from './site.svelte.ts';
  import { useWorld } from './camera.svelte.ts';
  import { beachedAt, dayVisitor, guestNow, onBeach, visitorLine, visitorNow, type VisitorId } from '../../world/visitors.ts';
  import { besideStage, guestSpot } from '#lib/layout/spots.ts';
  import { ROLES, fortuneOf, giftOf, isGuest, type GuestId } from '../../world/visitorRoles.ts';
  import { findKey, findsView } from '#lib/model/finds.ts';
  import { recordFind } from '#lib/store/actions.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { dateMs, ZONE_OFFSET_MS } from '#lib/time/dates.ts';
  import type { Component } from 'svelte';
  import type { Choice } from '../../world/pager.ts';
  import { stretch } from '../motion/stretch.svelte.ts';
  import { SCENE } from '#lib/sync/storage.ts';
  import { critterArt, type FishId } from '../../world/critters.ts';
  import { daysUntil } from '../../world/wedding.ts';
  import { scenePreview } from '#lib/ui-state/preview.svelte.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { handOver, holding, markVeg, myAsk, vegDay } from './vegAsk.svelte.ts';
  import { vegGift, type VegRequest } from '../../world/vegRequest.ts';
  import { cropName } from './farmUi.svelte.ts';
  import { loadNames } from './catchLine.ts';

  interface Props {
    scene?: HTMLElement;
    enabled: () => boolean;
    /** Say a line in the speech balloon (IslandScene's Talk). */
    say?: (name: string, parts: string | string[], from: Element, o?: { colour?: string; choices?: Choice[]; ondone?: () => void }) => void;
    /** Jack's trick, when he gets no candy (IslandScene: my villager's goofy face for a while). */
    ontrick?: () => void;
    /** Whose slot: the day's visitor's (visitors.ts visitorNow, centre stage), or the day's guest's (guestNow: the guest
     *  spot, visitorRoles.ts), each its own director actor and 3D figure. */
    slot?: 'visitor' | 'guest';
    /** The guest's: whether the day's visitor stands on centre stage now (no guest spot down: the guest stands beside). */
    stageTaken?: () => boolean;
  }
  let { scene, enabled, say: rawSay, ontrick, slot = 'visitor', stageTaken = () => false }: Props = $props();
  /** The slot's director actor (fixed for the component's life). */
  const A = untrack(() => slot);


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
    return stageTaken() && l ? ((b) => (b ? [...b] : null))(besideStage(l)) : null;
  };
  /** Gulliver washes up today (the visitors' slot's: the rotation's draw). */
  const gulliverToday = (date: string) => dayVisitor(date, new Date(`${date}T00:00:00Z`).getUTCDay(), islandSeed()) === 'gulliver';
  /** The campsite's door: walkers arrive from it and leave into it (spec §3). */
  const camp = (): Pt => ((b) => [b.x, b.z - 16] as Pt)(BUILDINGS.find((b) => b.id === 'campsite')!);
  /** The partner comes over only to a visitor this near its home (u): never across the island to centre stage. */
  const MEET_NEAR = 600;
  const w = useWorld();
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
  function say(name: string, parts: string | string[], from: Element, o: { colour?: string; choices?: Choice[]; ondone?: () => void } = {}) {
    speakingUntil = Date.now() + 20_000;
    rawSay?.(name, parts, from, { ...o, ondone: () => ((speakingUntil = 0), o.ondone?.()) });
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
      sinceMeet: lastMeet ? Date.now() - lastMeet : Infinity, villagerFree: meetable(s) && villagerFree()
    }, r);
    if (!act) return;
    if (act === 'signature') signature(id);
    else if (act === 'emote') setEmote(A, (lastEmote = pickEmote(id, r, lastEmote)));
    else if (act === 'look') look();
    else if (act === 'wander') stroll(r);
    else if (act === 'home') back(VISITOR_SPEED.stroll);
    else if (act === 'meet') meet(id);
    if (follow && (act === 'signature' || act === 'emote' || act === 'look') && r() < 0.5) later(A, 4000 + r() * 2500, () => beat(r, false));
  }
  $effect(() => {
    if (!shown) return;
    const k = A === 'guest' ? 'guestBeat' : 'beat';
    presence[k] = beat;
    return () => {
      if (presence[k] === beat) presence[k] = null;
    };
  });

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

  /** A stroll (the ones who roam in NH): to a spot near theirs that's walkable, clear of the villagers and, where it's
   *  on screen, of every control, then a look around and, a while later, back. */
  function stroll(r: () => number = Math.random): boolean {
    const id = shown, s = spot, g = stageGeo(scene);
    if (!id || !s || !g) return false;
    const keep = guardsU(g, -5 * g.k, (el) => getComputedStyle(el).visibility === 'hidden'); // (out-of-view world nodes)
    const from = where();
    for (const p of strollSpots(home(), BEHAVIOUR[id].roam, r)) {
      if (!visitorWalkable(p[0], p[1]) || !standsClear(keep, p[0], p[1], s.h)) continue;
      if ((['mine', 'partner'] as const).some((v) => Math.hypot(livePos(v)[0] - p[0], livePos(v)[1] - p[1]) < 44)) continue;
      const pts = visitorRoute(from, p);
      if (!pts) continue;
      walkTo(A, pts, { speed: VISITOR_SPEED.stroll, from, then: () => {
        setMotion(A, id === 'zipper' ? 'hop' : 'turn');
        later(A, rand(4000, 7000), () => !speaking() && back(VISITOR_SPEED.stroll));
      } });
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
    const host = scene;
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

  let el = $state<HTMLElement>();
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
  const art = () => el?.querySelector('.art') ?? null;
  let last: string | undefined;

  /** Jack got his candy this session (then he just chats); `treat` replays his joy (Franklin's too, with his fish). */
  let treated = false;
  let treat = $state(0);
  let treatArt = $state('items/candy');
  let treatTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(treatTimer));

  /** Jack: trick or treat. His introduction (the first time) ends on the ask; after a treat, one of his lines. */
  function jack(name: string, target: Element, colour: string) {
    if (treated) {
      last = visitorLine('jack', Math.random, last);
      return say(name, t(last), target, { colour });
    }
    const parts = met.has('jack') ? [t('chat.sp.jack.ask')] : [t('chat.sp.jack.intro'), t('chat.sp.jack.ask')];
    met.add('jack');
    const again = () => el?.querySelector('.art');
    say(name, parts, target, {
      colour,
      choices: [
        { label: t('visitor.jack.give'), pick: () => {
          treated = true;
          cue('emote-joy');
          treatArt = 'items/candy';
          treat++;
          clearTimeout(treatTimer);
          treatTimer = setTimeout(() => (treat = 0), 2400);
          const a = again();
          if (a) say(name, t('chat.sp.jack.thanks'), a, { colour });
        } },
        { label: t('visitor.jack.none'), pick: () => {
          cue('emote-surprise');
          ontrick?.();
          const a = again();
          if (a) say(name, t('chat.sp.jack.trick'), a, { colour });
        } }
      ]
    });
  }

  /** Franklin on Turkey Day (NH: "a fish for the dish"): his introduction ends on the ask; the next fish caught that day
   *  (Critters tells the scene: `island:catch`) makes him happy, and after that he chats. This phone's own record of the
   *  day (scene-franklin), so a reload keeps it. */
  function franklin(name: string, target: Element, colour: string) {
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
    const host = scene;
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
        treatArt = critterArt(fish as FishId);
        treat++;
        clearTimeout(treatTimer);
        treatTimer = setTimeout(() => (treat = 0), 2400);
        const a = el?.querySelector('.art');
        if (a) say(t('visitor.franklin'), t('chat.sp.franklin.thanks', { fish: t(`critter.name.${fish}`) }), a, { colour: TAG.franklin });
      }, 2800);
    };
    host.addEventListener('island:catch', onCatch);
    return () => host.removeEventListener('island:catch', onCatch);
  });

  /** Reese and Cyrus on a milestone day: her introduction ends on the count (「けっこんしき まで あと 100日！」; on the day
   *  「ごけっこん おめでとう！」), then they take turns. */
  let coupleTurn = 0;
  function couple(target: Element) {
    const left = scenePreview().event === 'wedding' ? 0 : daysUntil(today());
    const count = left === 0 ? t('chat.sp.reese.day') : t('chat.sp.reese.count', { n: left });
    if (!met.has('reese')) {
      met.add('reese');
      return say(t('visitor.reese'), [t('chat.sp.reese.intro'), count], target, { colour: TAG.reese });
    }
    // Cyrus a line of his; Reese one of hers, and the count again
    const cyrus = coupleTurn++ % 2 === 0;
    last = visitorLine((cyrus ? 'cyrus' : 'reese') as VisitorId, Math.random, last);
    if (cyrus) say(t('visitor.cyrus'), t(last), target, { colour: CYRUS_TAG });
    else say(t('visitor.reese'), [t(last), count], target, { colour: TAG.reese });
  }

  async function talk(id: VisitorId) {
    const target = art();
    if (!target) return;
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
  let shopOpen = $state(false);
  let shopFor = $state<{ id: GuestId; pool: 'dear' | 'any'; name: string } | null>(null);
  let ShopSheet = $state<Component<{ open: boolean; id: GuestId; pool: 'dear' | 'any'; name: string }> | null>(null);
  function openShop(id: GuestId, name: string) {
    void import('./VisitorShop.svelte').then((m) => {
      ShopSheet = m.default as unknown as typeof ShopSheet;
      shopFor = { id, pool: ROLES[id].pool ?? 'any', name };
      shopOpen = true;
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
  async function give(id: GuestId, name: string, target: Element, colour: string, key = 'gift') {
    const g = await giftNow(id);
    if (!g) return say(name, t(`chat.sp.${id}.given`), target, { colour });
    if (g.given) return say(name, t(`chat.sp.${id}.given`), target, { colour });
    recordFind('item', g.item);
    cue('emote-joy');
    say(name, t(`chat.sp.${id}.${key}`, { item: g.name }), target, { colour });
    toasts.show(t('guestShop.got', { item: g.name }), 3600, { reaction: 'joy' });
  }
  /** A guest's tap after their introduction: their role's. */
  function guest(id: GuestId, name: string, target: Element, colour: string, first = false) {
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
    const role = ROLES[id], a = el?.querySelector('.art');
    if (!c || !a || phase !== 'here') return;
    if (role.kind === 'fish' && c.kind === 'fish') {
      const d = wendellDay.read(today());
      if (!d.asked || d.fed) return;
      wendellDay.patch(d.date, { fed: true });
      clearTimeout(thanksTimer);
      thanksTimer = setTimeout(() => {
        treatArt = critterArt(c.id as FishId);
        treat++;
        clearTimeout(treatTimer);
        treatTimer = setTimeout(() => (treat = 0), 2400);
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
        const what = t(`critter.name.${c.id}`);
        if (!speaking()) say(t(`visitor.${id}`), t(`chat.sp.${id}.cheer`, { name: what }), a, { colour: TAG[id] });
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
  async function vegTalk(id: VisitorId, r: VegRequest, name: string, target: Element, colour: string) {
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
  async function thank(id: VisitorId, r: VegRequest, name: string, target: Element, colour: string, veg: string, v: number) {
    cue('emote-joy');
    if (id === 'franklin') eventJingle(['turkey-cooking-start', 'turkey-cooking-done']);
    treatArt = `finds/${r.crop}`;
    treat++;
    clearTimeout(treatTimer);
    treatTimer = setTimeout(() => (treat = 0), 2400);
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
    thanksTimer = setTimeout(() => say(name, pages, target, { colour, ondone: g ? () => toasts.show(t('guestShop.got', { item: g.name }), 3600, { reaction: 'joy' }) : undefined }), THANKS_MS);
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
  export function tap(px: number, py: number, body = false): boolean {
    const id = shown, a = art();
    if (!id || !a || !spot || phase === 'leave' || !enabled()) return false;
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
    const fig = a.getBoundingClientRect();
    if (body && !(seen(now[0], now[1]) && px >= fig.left && px <= fig.right && py >= fig.top && py <= fig.bottom)) return false;
    const onFigure = seen(now[0], now[1]) && inside(fig);
    const onSpot = seen(spot.x, spot.z) && inside(box(spot.x, spot.z));
    if (!onFigure && !onSpot) {
      const at = w.worldAtClient(px, py);
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
    // back on their spot if they'd strolled off (the balloon anchors to them there), turned to my villager with a
    // little hop, then their line
    const backMs = phase === 'here' ? back(VISITOR_SPEED.back) : 0;
    const turn = () => {
      faceToward(A, actors.mine.x);
      setMotion(A, tapMotion(id));
    };
    if (backMs) later(A, backMs, turn);
    else turn();
    speakingUntil = Date.now() + 20_000; // stand still from now
    talkTimer = setTimeout(() => {
      talkTimer = undefined;
      void talk(id);
    }, backMs + TURN_MS);
    return true;
  }
  /** The little hop before a line (ms). */
  const TURN_MS = 600;

  /** A nudge on sleeping Gulliver: a twitch, a snore and his sleep talk; the fifth: he jumps up, looks about, and
   *  introduces himself. */
  let mumble = $state<{ n: number; text: string; want?: true } | null>(null);
  let mumbleTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(mumbleTimer));
  // the sleep talk stays on screen: nudged in to keep EDGE from the sides (Gulliver may lie near one)
  let mumbleEl = $state<HTMLElement>();
  let mumbleShift = $state(0);
  $effect(() => {
    if (!mumble || !mumbleEl) return;
    // its laid-out box (the pop-in animation scales it about its middle)
    const r = mumbleEl.getBoundingClientRect(), w = mumbleEl.offsetWidth, x0 = r.left + (r.width - w) / 2 - untrack(() => mumbleShift);
    mumbleShift = Math.max(EDGE - x0, Math.min(0, innerWidth - EDGE - (x0 + w)));
  });
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
  const emote = $derived(st.emote ? villagerEmote(st.emote) : null);
</script>

{#if ShopSheet && shopFor}<ShopSheet bind:open={shopOpen} {...shopFor} />{/if}
{#if shown && spot}
  <!-- one world node at the feet (camera.svelte.ts): its live position is the director's while it walks; the 3D island
       draws its model there (v3), the node's .art its tap area and its balloon's anchor -->
  <span class="visitor {shown}" aria-hidden="true" {@attach w.at({ x: spot.x, z: spot.z, h: spot.h + 40, live: () => livePos(A), always: true, inv: true,
        v3: { id: shown, actor: A, lift: liftNow, prone: proneNow, away: awayNow, also: shown === 'reese' ? { id: 'cyrus', dx: spot.h * PAIR_DX } : undefined } })}
      class:walking={st.walking} data-visitor={shown} data-slot={A} data-veg-ask={ask?.crop} data-stage={spot.stage || undefined}
      data-phase={phase} data-way={way} data-asleep={sleeping ? (spot.lie ? 'lie' : 'stand') : undefined} data-motion={st.motion ?? undefined} bind:this={el}
      style:--h={su(spot.h)} style:--lift={su(FLOAT[shown] ?? 0)} style:--wide={WIDE[shown] ?? 1}>
      {#if shown === 'wisp'}<i class="glow"></i>{/if}
      <span class="art"></span>
      {#if shown === 'reese'}
        <!-- Reese and Cyrus under their heart float -->
        <span class="float" data-heart-float>{@render heart()}</span>
      {/if}
      <!-- emotes and fx over the head (never mirrored or squashed with the body), puffs at the feet -->
      <span class="over">
        {#if emote}<span class="emote">{#key st.emoteN}<Emote id={emote} size="var(--emote-size, 40px)" bare />{/key}</span>{/if}
        {#each st.fx as f (f.n)}
          <span class="fxa {f.kind}"><Fx kind={f.kind} dir={f.kind === 'zzz' ? -1 : 1} spread="calc(var(--h) * .55)" ondone={() => removeFx(A, f.n)} /></span>
        {/each}
        {#if mumble}{#key mumble.n}<span class="mumble if-caption" data-mumble data-veg-want={mumble.want} bind:this={mumbleEl} style:--shift="{mumbleShift}px">{mumble.text}</span>{/key}{/if}
      </span>
      {#if treat}
        <!-- Jack's joy at a treat: the candy pops up over his head in a little spooky sparkle -->
        {#key treat}
          <span class="treat" data-treat>
            <span class="candy"><OfficialArt key={treatArt} size={su(treatArt.startsWith('finds/') ? 32 : 22)} eager /></span>
            {#each [0, 1, 2, 3, 4] as i (i)}<i style:--i={i}></i>{/each}
          </span>
        {/key}
      {/if}
  </span>
{/if}

<!-- the heart float: a pink heart balloon on a string, a highlight on its upper left (NH's soft item style) -->
{#snippet heart()}
  <svg viewBox="-24 -24 48 64"><path class="string" d="M0 18 C-3 26 3 32 0 40" /><path class="hb" d="M0 18 C-26 2 -20 -20 -8 -20 C-3 -20 0 -16 0 -12 C0 -16 3 -20 8 -20 C20 -20 26 2 0 18 Z" />
    <path class="hl" d="M-12 -12 C-9 -16 -5 -15 -4 -12" /></svg>
{/snippet}

<style>
  /* the feet at the node's origin (camera.svelte.ts places it and sets its depth among the island's things, under the
     time-of-day tint); taps go to the scene (SceneTaps asks `tap`) */
  .visitor { width: 0; height: 0; transform-origin: 0 0; pointer-events: none; }
  .visitor.walking { will-change: transform; }
  .visitor > * { position: absolute; left: 0; top: 0; line-height: 0; }
  /* the tap area and the balloon's anchor: the model's core standing (its height, ~0.6 as wide; a pair wider), or lying
     face down (its length across, low) */
  .art { display: block; width: calc(var(--h) * .6 * var(--wide)); height: var(--h); translate: -50% calc(-100% - var(--lift)); }
  .visitor[data-asleep='lie'] .art { width: var(--h); height: calc(var(--h) * .45); translate: -50% -75%; }
  /* Wisp's glow round him (the model floats in it) */
  .glow {
    display: block; width: calc(var(--h) * 1.3); height: calc(var(--h) * 1.1); translate: -50% calc(-50% - var(--h) * .5 - var(--lift));
    background: radial-gradient(closest-side, rgba(225, 238, 255, .55), rgba(225, 238, 255, 0)); animation: v-glow 3.2s ease-in-out infinite alternate;
  }
  @keyframes v-glow { from { opacity: .45; } to { opacity: .9; } }
  .visitor[data-asleep='lie'] .over { top: calc(var(--h) * -.5); left: calc(var(--h) * -.36); }
  @keyframes v-appear { from { opacity: 0; transform: scale(.85); } 60% { opacity: 1; transform: scale(1.04); } to { opacity: 1; transform: none; } }
  /* under a sheet or with the page hidden, everyone holds still */
  :global(.if-scene:is([data-covered], [data-paused])) .visitor :is(.glow, .float) { animation-play-state: paused; }

  /* over the head: the emote, the fx, Gulliver's sleep talk (unmirrored); a walk's puffs at the feet */
  .over { left: 0; top: calc(-1 * (var(--h) + var(--lift))); width: 0; height: 0; }
  .emote { position: absolute; left: 0; bottom: 2px; translate: calc(-50% + var(--h) * .14) 0; line-height: 0; }
  .fxa { position: absolute; left: 0; top: calc(var(--h) * .04); width: 0; height: 0; }
  .fxa.puff { top: calc(var(--h) + var(--lift)); }
  .fxa.zzz { left: calc(var(--h) * -.12); top: calc(var(--h) * .1); }
  .fxa.sweat { left: calc(var(--h) * .2); top: calc(var(--h) * .2); }
  .fxa.notes { left: calc(var(--h) * .18); top: calc(var(--h) * .12); }
  /* drawn at its true size (the node's --inv), nudged in from the screen's edge */
  .mumble { left: 0; bottom: 4px; transform-origin: 40% 100%; scale: var(--inv, 1); translate: calc(-60% + var(--shift, 0px) * var(--inv, 1)) 0; animation: v-mumble 1.6s ease-out both; }
  .mumble[data-veg-want] { animation-duration: 3s; }
  @keyframes v-mumble { from { opacity: 0; transform: translateY(6px) scale(.8); } 15% { opacity: 1; transform: none; } 80% { opacity: 1; } to { opacity: 0; transform: translateY(-6px); } }

  /* the heart float over Reese and Cyrus */
  .float { left: 0; top: calc(var(--h) * -1.5); width: calc(var(--h) * .5); translate: -50% 0; animation: v-appear .6s ease-out both, bob 3.4s ease-in-out infinite alternate; }
  .float svg { width: 100%; overflow: visible; filter: var(--leaf-tint,) drop-shadow(0 2px 2px rgba(120, 40, 70, .3)); }
  .float .hb { fill: #FF7FAE; } .float .hl { fill: none; stroke: #FFE3EE; stroke-width: 3; stroke-linecap: round; }
  .float .string { fill: none; stroke: rgba(255, 255, 255, .85); stroke-width: 1.4; }
  @keyframes bob { from { transform: translateY(0) rotate(-3deg); } to { transform: translateY(calc(var(--h) * -.06)) rotate(3deg); } }
  /* Jack's treat: the candy hops up over his pumpkin head, five orange and purple glints burst around it */
  .treat { left: 0; top: calc(var(--h) * -1.1); }
  .candy :global(.official) { max-width: none; }
  .candy { position: absolute; translate: -50% -50%; line-height: 0; animation: candy 2.2s cubic-bezier(.3, 1.4, .5, 1) both; }
  @keyframes candy {
    from { transform: translateY(calc(10 * var(--su))) scale(.3); opacity: 0; } 18% { transform: none; opacity: 1; }
    80% { opacity: 1; } to { transform: translateY(calc(-6 * var(--su))); opacity: 0; }
  }
  .treat i {
    position: absolute; width: calc(5 * var(--su)); height: calc(5 * var(--su)); translate: -50% -50%; border-radius: 50%;
    background: var(--c, #FFB347); box-shadow: 0 0 calc(4 * var(--su)) var(--c, #FFB347);
    --a: calc(var(--i) * 72deg - 90deg); animation: glint 1.1s ease-out calc(.15s + var(--i) * .05s) both;
  }
  .treat i:nth-child(odd) { --c: #B98AF0; }
  @keyframes glint {
    from { transform: rotate(var(--a)) translateX(0) scale(.4); opacity: 0; } 30% { opacity: 1; }
    to { transform: rotate(var(--a)) translateX(calc(16 * var(--su))) scale(1); opacity: 0; }
  }
</style>
