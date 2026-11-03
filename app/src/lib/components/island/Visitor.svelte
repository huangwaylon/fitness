<script lang="ts" module>
  /** The day Gulliver was woken this session (he stays up for it). */
  let wokeOn: string | null = null;
</script>

<script lang="ts">
  // Visitors (docs/design.md "Visitors"), after NH: K.K. Slider with his guitar on Saturday nights, Daisy Mae on Sunday
  // mornings, Wisp floating by on some nights (see-through, a slow bob), Gulliver on some days. Most stand at centre
  // stage (world.ts CENTRE_STAGE: the campsite's clearing, seen from おく); Gulliver lies washed up on the front beach and
  // Daisy Mae wanders the front lawn (both seen from まえ), as in NH. Each is one world node (camera.svelte.ts) at the
  // villagers' scale (their NH height relative to a villager), with the same contact shadow. A tap: their introduction
  // the first time, then one of their lines (no trading, no ベル).
  // K.K.'s show (NH's Saturday concert): with ミュージック on, a tap is his greeting and 「リクエストは あるかな？」
  // (リクエスト: a few of his songs to pick from; おまかせ: one at random); the island's music stops for the song
  // (sound/kk.ts, sound.svelte.ts playKK), he strums harder, ♪ float up, the villagers sway, a 「♪ title」 caption
  // shows; a tap meanwhile offers ストップ; at the end his sign-off and the island's music comes back. With no songs
  // he's still tuning his guitar. Official renders.
  // On Halloween night (events.ts) Jack comes instead and asks for candy: 「キャンディを あげる」 delights him (joy, the
  // candy pops up over a spooky sparkle), 「なにも あげない」 earns his trick (my villager's face goes goofy for a minute:
  // `ontrick`). No inventory, no ベル.
  // SceneTaps mounts this inside the stage and asks it about each tap (`tap`). `?visitor=<id>` (dev or ?demo) brings
  // one now.
  // Their life (visitorLife.ts; docs/design.md "Visitors: life"): the director's 'visitor' actor moves them (walks,
  // motions, emotes, fx, facing), as it does the villagers. Every one breathes, shifts its weight and its shadow
  // breathes with it (CSS); idle life's beat gives them one small thing at a time: their NH signature, an emote, a look
  // at the nearest villager, a stroll for those who roam, or a villager coming over to say hello. A tap: they turn to
  // my villager with a little hop, back on their spot first if they'd strolled off, then speak (and stand still while
  // they do). Gulliver sleeps face down until the fifth nudge. They arrive when their visit starts (walking from the
  // campsite along the paths, down from the sky, or appearing) and leave when it ends (back to the campsite); on a
  // page's first paint they're simply there.
  // `?arrive` (dev or ?demo): the arrival plays on load; `?leave=<ms>`: the visit ends after that long; `?stroll`: a
  // stroll now; `?meet`: the partner comes over now.
  import { dayRecord } from './dayRecord.ts';
  import { shuffle } from '#lib/random.ts';
  import { tick, untrack } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Emote from '../characters/Emote.svelte';
  import Fx from '../characters/Fx.svelte';
  import { villagerEmote, type EmoteIcon } from '#lib/art.ts';
  import { actors, addFx, awayFromHome, cancel, faceToward, later, livePos, place as placeActor, removeFx, setEmote, setMotion, walkTo } from '../motion/director.svelte.ts';
  import type { Motion } from '../motion/reactions.ts';
  import { BEHAVIOUR, EDGE_FADE_MS, MUMBLES, POP_MS, VISITOR_SPEED, nudge, pickAct, pickEmote, strollSpots, tapMotion, wayMs, type Way } from './visitorLife.ts';
  import type { Pt } from './walkGraph.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { dayKey, minuteNow, now } from '#lib/time/clock.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { kkPick, kkTracks, type KKTrack } from '#lib/sound/kk.ts';
  import { playKK, sound, stopKK } from '#lib/sound/sound.svelte.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { EDGE, clearAt, guardsU, place, stageGeo } from './placement.ts';
  import { zodiacOf } from './beach.ts';
  import { hook, hookFlag } from './devHooks.ts';
  import { meetVisitor, turnTo, presence, villagerFree, visitorRoute, visitorWalkable } from './avatar.ts';
  import { su, VILLAGER } from './scene.ts';
  import { BUILDINGS, CENTRE_STAGE } from './world.ts';
  import { site } from './site.svelte.ts';
  import { useWorld } from './camera.svelte.ts';
  import { visitorLine, visitorNow, type VisitorId } from './visitors.ts';
  import type { Choice } from './pager.ts';
  import { stretch } from '../motion/stretch.svelte.ts';
  import { SCENE } from '#lib/sync/storage.ts';
  import { critterArt, type FishId } from './critters.ts';
  import { daysUntil } from './wedding.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';

  interface Props {
    scene?: HTMLElement;
    enabled: () => boolean;
    /** Say a line in the speech balloon (IslandScene's Talk). */
    say?: (name: string, parts: string | string[], from: Element, o?: { colour?: string; choices?: Choice[]; ondone?: () => void }) => void;
    /** Jack's trick, when he gets no candy (IslandScene: my villager's goofy face for a while). */
    ontrick?: () => void;
  }
  let { scene, enabled, say: rawSay, ontrick }: Props = $props();


  /** NH heights relative to a villager (VILLAGER.h): K.K. stands about as tall, Daisy Mae is a child, Wisp a small
   *  ghost floating a little off the ground, Gulliver a tall seagull. */
  const REL: Record<VisitorId, number> = { 'kk-slider': 1, 'daisy-mae': 0.78, wisp: 0.7, gulliver: 1.1, jack: 1, celeste: 0.85,
    franklin: 1, jingle: 1.05, pave: 1.1, zipper: 0.9, reese: 0.76 };
  /** A pair standing side by side (Reese and Cyrus): how many figures wide the clearance is. */
  const WIDE: Partial<Record<VisitorId, number>> = { reese: 1.95 };
  /** Floating off the ground (u). */
  const FLOAT: Partial<Record<VisitorId, number>> = { wisp: 12 };
  /** Where they stand (world x, z): centre stage, but Gulliver washed up face down near the front beach's water's edge
   *  (left of the day's finds) and Daisy Mae on the front lawn between the tape deck and the dig spots (NH). */
  const SPOT: Partial<Record<VisitorId, Pt>> = { gulliver: [96, 30], 'daisy-mae': [206, 396] };
  /** The campsite's door: walkers arrive from it and leave into it (spec §3). */
  const camp = (): Pt => ((b) => [b.x, b.z - 16] as Pt)(BUILDINGS.find((b) => b.id === 'campsite')!);
  /** The partner comes over only to a visitor this near its home (u): never across the island to centre stage. */
  const MEET_NEAR = 600;
  const w = useWorld();
  /** Visitors outside the roster (an event's guest): their render and name-tag colour (Jack: his robe's purple; the
   *  holiday hosts: Nookipedia's title colours). */
  const ART: Partial<Record<VisitorId, string>> = {
    jack: 'villagers/jack', franklin: 'villagers/franklin', jingle: 'villagers/jingle', pave: 'villagers/pave', zipper: 'villagers/zipper'
  };
  const TAG: Partial<Record<VisitorId, string>> = { jack: '#7A4FB8', franklin: '#FF97CA', jingle: '#E10000', pave: '#0A96AE', zipper: '#FFE20B', reese: '#FFAAD1' };
  const CYRUS_TAG = '#4DDCD9';

  const clock = $derived(minuteNow());
  const who = $derived(visitorNow(clock));
  /** `?leave=<ms>` (dev or ?demo): the visit ends after that long (the departure's hook). */
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
    const [x, z] = SPOT[id] ?? CENTRE_STAGE;
    return { x, z, h: VILLAGER.h * REL[id], stage: !SPOT[id], lie: id === 'gulliver' };
  });
  // a new visitor with a spot: they arrive (once per visit)
  let arrivedFor: VisitorId | null = null;
  $effect(() => {
    const id = shown, s = spot;
    if (!id || !s || arrivedFor === id) return;
    arrivedFor = id;
    untrack(() => arrive(id, s));
  });
  $effect(() => () => untrack(() => cancel('visitor')));

  const st = actors.visitor;
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const home = (): Pt => [spot?.x ?? CENTRE_STAGE[0], spot?.z ?? CENTRE_STAGE[1]];
  /** Where the feet are right now (world u), mid-walk included. */
  const where = (): Pt => livePos('visitor');
  /** Here they come: from the campsite (walking or hopping) along the walk graph, down from the sky, or appearing; a
   *  pop in place on the page's first paint. */
  function arrive(id: VisitorId, s: NonNullable<typeof spot>) {
    cancel('visitor');
    edge = false;
    const at: Pt = [s.x, s.z], b = BEHAVIOUR[id];
    st.home = at;
    st.face = 'home';
    st.fx = [];
    st.emote = null;
    way = id === 'gulliver' && sleeping ? 'appear' : b.arrive;
    if (sleeping) later('visitor', 400, () => addFx('visitor', 'zzz'));
    if (!liveArrival) {
      placeActor('visitor', at[0], at[1]);
      w.kick();
      phase = 'pop';
      later('visitor', POP_MS, () => (phase = 'here'));
      return;
    }
    phase = 'arrive';
    if (way === 'walk' || way === 'hop') {
      const from = camp(), pts = visitorRoute(from, at);
      if (pts) {
        placeActor('visitor', from[0], from[1]);
        edge = true;
        later('visitor', EDGE_FADE_MS, () => (edge = false));
        walkTo('visitor', pts, { speed: VISITOR_SPEED.arrive, from, face: 'home', then: () => {
          phase = 'here';
          setMotion('visitor', id === 'kk-slider' ? 'nod' : 'hop');
        } });
        return;
      }
      way = 'appear';
    }
    placeActor('visitor', at[0], at[1]);
    w.kick();
    later('visitor', wayMs(way), () => (phase = 'here'));
  }

  /** Their time is up: off the way they came (back to the campsite and into it, up into the sky, gone in a puff),
   *  then the next visitor (if any) arrives. */
  function depart() {
    const id = shown;
    if (!id) return;
    cancel('visitor');
    phase = 'leave';
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
        walkTo('visitor', pts, { speed: VISITOR_SPEED.arrive, from, then: () => {
          edge = true;
          later('visitor', EDGE_FADE_MS, done);
        } });
        return;
      }
      way = 'appear';
    }
    later('visitor', wayMs(way), done);
  }

  /** A line of theirs is in the balloon (until it closes, or 20 s at most: another speaker may replace it). */
  let speakingUntil = 0;
  const speaking = () => Date.now() < speakingUntil;
  function say(name: string, parts: string | string[], from: Element, o: { colour?: string; choices?: Choice[] } = {}) {
    speakingUntil = Date.now() + 20_000;
    rawSay?.(name, parts, from, { ...o, ondone: () => (speakingUntil = 0) });
  }

  /** Idle life's beat (presence.beat), drawn from the slot's PRNG (`r`: the same on both phones, island/ambient.ts): one
   *  small thing, and now and then a quieter second one a few seconds later. */
  let lastEmote: EmoteIcon | null = null;
  let lastMeet = 0;
  function beat(r: () => number = Math.random, follow = true) {
    const id = shown, s = spot;
    if (!id || !s || phase !== 'here' || !enabled()) return;
    const act = pickAct(id, {
      speaking: speaking(), asleep: sleeping, walking: st.walking, away: awayFromHome('visitor'),
      sinceMeet: lastMeet ? Date.now() - lastMeet : Infinity, villagerFree: meetable(s) && villagerFree(), playing: !!playing
    }, r);
    if (!act) return;
    if (act === 'signature') signature(id);
    else if (act === 'emote') setEmote('visitor', (lastEmote = pickEmote(id, r, lastEmote)));
    else if (act === 'look') look();
    else if (act === 'wander') stroll(r);
    else if (act === 'home') back(VISITOR_SPEED.stroll);
    else if (act === 'meet') meet(id);
    if (follow && (act === 'signature' || act === 'emote' || act === 'look') && r() < 0.5) later('visitor', 4000 + r() * 2500, () => beat(r, false));
  }
  $effect(() => {
    if (!shown) return;
    presence.beat = beat;
    return () => {
      if (presence.beat === beat) presence.beat = null;
    };
  });

  /** Their NH signature (visitorLife.ts BEHAVIOUR): Gulliver's sleeping twitch, Franklin looking about for food, … */
  function signature(id: VisitorId) {
    if (sleeping) {
      setMotion('visitor', 'twitch');
      if (!st.fx.some((f) => f.kind === 'zzz')) addFx('visitor', 'zzz');
      return;
    }
    const sig = BEHAVIOUR[id].signature;
    if (sig.motion) setMotion('visitor', sig.motion);
    if (sig.fx) addFx('visitor', sig.fx);
    if (sig.emote && Math.random() < 0.5) setEmote('visitor', sig.emote);
    if (id === 'franklin') {
      // a look one way, then the other, for something to cook
      st.face = Math.random() < 0.5 ? 'l' : 'r';
      later('visitor', 1100, () => (st.face = st.face === 'l' ? 'r' : 'l'));
      later('visitor', 2300, () => (st.face = 'home'));
    }
  }

  /** The partner may come over: the visitor stands within MEET_NEAR of its home (Daisy Mae, Gulliver at まえ). */
  const meetable = (s: { x: number; z: number }) => Math.hypot(actors.partner.home[0] - s.x, actors.partner.home[1] - s.z) <= MEET_NEAR;

  /** A look at the nearest villager (or at world `x`), then back. */
  function look(x?: number) {
    const [vx, vz] = where();
    const tx = x ?? (['mine', 'partner'] as const).map((v) => livePos(v)).sort((a, b) => Math.hypot(a[0] - vx, a[1] - vz) - Math.hypot(b[0] - vx, b[1] - vz))[0][0];
    faceToward('visitor', tx);
    later('visitor', rand(1800, 2800), () => !speaking() && (st.face = 'home'));
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
      walkTo('visitor', pts, { speed: VISITOR_SPEED.stroll, from, then: () => {
        setMotion('visitor', id === 'zipper' ? 'hop' : 'turn');
        later('visitor', rand(4000, 7000), () => !speaking() && back(VISITOR_SPEED.stroll));
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
    return walkTo('visitor', pts, { speed, from, face: 'home', then });
  }

  /** The partner comes over to say hello: they face each other, the visitor answers with their own emote. */
  function meet(id: VisitorId): boolean {
    const ok = meetVisitor(where(), (x) => {
      faceToward('visitor', x);
      setMotion('visitor', id === 'kk-slider' ? 'nod' : 'hop');
      later('visitor', 500, () => setEmote('visitor', BEHAVIOUR[id].hello));
      later('visitor', 3600, () => !speaking() && (st.face = 'home'));
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
        faceToward('visitor', vx + (x - p.sx) / (p.scale * w.view.s));
      }
      setMotion('visitor', 'point');
      setEmote('visitor', Math.random() < 0.5 ? 'mark-sparkle' : 'inspiration');
      later('visitor', 2600, () => !speaking() && (st.face = 'home'));
    };
    host.addEventListener('island:star', onStar);
    return () => host.removeEventListener('island:star', onStar);
  });

  // dev hooks: a stroll now, the partner coming over now (after the opening beats)
  $effect(() => {
    const meetNow = hookFlag('meet');
    if (!(meetNow || hookFlag('stroll')) || !shown) return;
    let t: ReturnType<typeof setTimeout>, tries = 0;
    const go = () => {
      const ok = meetNow ? meet(shown!) : stroll();
      if (!ok && ++tries < 12) t = setTimeout(go, 700);
    };
    t = setTimeout(go, 3000);
    return () => clearTimeout(t);
  });

  let el = $state<HTMLElement>();
  /** Group stretching: an awake visitor joins in on the villagers' beat (Gulliver sleeps through it). */
  const pose = $derived(shown && !sleeping ? stretch.pose : null);
  /** On the body: the stretch's pose, else the director's motion (replayed back to back: drop, reflow, set). */
  const act = $derived<Motion | null>(pose ?? st.motion);
  let bodyEl = $state<HTMLElement>();
  $effect(() => {
    const m = act;
    void stretch.n;
    void st.motionN;
    if (!bodyEl) return;
    bodyEl.removeAttribute('data-act');
    if (m) {
      void bodyEl.offsetWidth;
      bodyEl.setAttribute('data-act', m);
    }
  });
  /** Facing: a side-on render (Gulliver looks left, Daisy Mae right) mirrors to look the other way; one that faces us
   *  leans toward what it looks at. */
  const facing = $derived.by(() => {
    const d = shown ? BEHAVIOUR[shown].drawn : null, f = st.face;
    const want = f === 'l' ? 'l' : f === 'r' ? 'r' : null;
    if (!want) return { flip: 1, lean: 0 };
    return d ? { flip: want === d ? 1 : -1, lean: 0 } : { flip: 1, lean: want === 'r' ? 1 : -1 };
  });
  /** Visitors who introduced themselves this session. */
  const met = new Set<VisitorId>();
  let last: string | undefined;
  /** K.K.'s song playing now (sound.kk), and the caption's place (stage px). */
  const playing = $derived<KKTrack | null>(sound.kk ? (kkTracks.find((k) => k.id === sound.kk) ?? null) : null);
  let caption = $state<{ x: number; y: number; placed: boolean } | null>(null);
  let capEl = $state<HTMLElement>();
  /** The show this visit started (its sign-off comes when the song is over); the name tag's colour for it. */
  let ours: { id: string; colour?: string } | null = null;
  let lastSong: string | undefined;

  // The show sways the villagers (IslandScene: `.if-scene[data-show]`).
  $effect(() => {
    const s = scene, on = !!playing;
    s?.toggleAttribute('data-show', on);
    return () => s?.removeAttribute('data-show');
  });
  // the song is over (its end, ストップ, the music turned off): his sign-off, and the caption goes
  $effect(() => {
    const id = sound.kk;
    untrack(() => {
      if (id || !ours) return;
      const c = ours.colour;
      ours = null;
      caption = null;
      const a = art();
      if (a) say(t('visitor.kk-slider'), t('chat.sp.kk-slider.bye'), a, { colour: c });
    });
  });
  // his show is over (midnight) or the island is left: his song stops and the island's music comes back
  $effect(() => {
    const here = who === 'kk-slider';
    untrack(() => !here && stopKK());
    return () => untrack(stopKK);
  });

  const titleOf = (s: KKTrack) => (i18n.locale === 'en' ? s.en : s.ja);
  const art = () => el?.querySelector('.art') ?? null;

  /** K.K. plays `song`: the island's music stops for it; its end (or ストップ) brings his sign-off. */
  async function perform(song: KKTrack, colour?: string) {
    const target = art();
    if (!target) return;
    if (!playKK(song.id)) return say(t('visitor.kk-slider'), t('chat.sp.kk-slider.2'), target, { colour });
    ours = { id: song.id, colour };
    lastSong = song.id;
    // the 「♪ title」 caption: measured hidden, then placed by K.K. clear of every control
    caption = { x: 0, y: 0, placed: false };
    await tick();
    const st = scene?.querySelector('.stage')?.getBoundingClientRect(), c = capEl?.getBoundingClientRect(), a = target.getBoundingClientRect();
    if (!scene || !st || !c) return;
    const p = place(scene, c.width, c.height, a.left + a.width / 2, a.top, [{ x0: a.left, x1: a.right, y0: a.top, y1: a.bottom }]);
    caption = p ? { x: p.x - st.left, y: p.y - st.top, placed: true } : null;
  }

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
      const fish = (e as CustomEvent<{ kind: string; id: string }>).detail?.id;
      const d = franklinDay.read(today());
      if (shown !== 'franklin' || !fish || !d.asked || d.fed) return;
      franklinDay.patch(d.date, { fed: true });
      // after the catch's plate has had its moment: his joy, the fish over his head, his thanks
      clearTimeout(thanksTimer);
      thanksTimer = setTimeout(() => {
        cue('emote-joy');
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
    const left = daysUntil(today());
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
    if (id === 'jack') return jack(name, target, TAG.jack!);
    if (id === 'franklin') return franklin(name, target, TAG.franklin!);
    if (id === 'reese') return couple(target);
    // their name tag in their own NH colour (the roster, loaded on the first visit's tap)
    const colour = TAG[id] ?? ((await import('#lib/villagers/roster.ts')).ROSTER as Record<string, { colour?: string }>)[id]?.colour;
    if (id === 'kk-slider') {
      // mid-song: nothing disruptive, but he'll stop if asked
      if (playing)
        return say(name, t('chat.sp.kk-slider.playing'), target, { colour, choices: [
          { label: t('visitor.stop'), pick: stopKK }, { label: t('visitor.keep'), pick: () => {} }
        ] });
      if (sound.settings.music && kkTracks.length)
        return say(name, t('chat.sp.kk-slider.hello'), target, { colour, choices: [
          { label: t('visitor.request'), pick: () => request(colour) },
          { label: t('visitor.surprise'), pick: () => { const s = kkPick(Math.random, lastSong); if (s) void perform(s, colour); } }
        ] });
      if (sound.settings.music) return say(name, t('chat.sp.kk-slider.tuning'), target, { colour }); // no songs yet
    }
    // the first tap of a visit: their introduction (a few pages, as NH's visitors open)
    if (!met.has(id)) {
      met.add(id);
      return say(name, t(`chat.sp.${id}.intro`), target, { colour });
    }
    last = visitorLine(id, Math.random, last);
    // Celeste names the season's sign (its zodiac fragment is the likelier one after tonight's wishes)
    const sign = zodiacOf(localDateAt(now().getTime())).replace(/-fragment$/, '');
    say(name, t(last, { sign: t(`zodiac.${sign}`) }), target, { colour });
  }
  /** リクエスト: two of his songs to pick from, or 「ほかの 曲」 for two others (NH lets you name one). */
  function request(colour?: string, from: readonly KKTrack[] = []) {
    const target = art();
    if (!target) return;
    const rest = kkTracks.filter((s) => !from.includes(s));
    const pool = rest.length >= 2 ? rest : kkTracks;
    const two = shuffle([...pool], Math.random).slice(0, 2);
    const more = kkTracks.length > 2 ? [{ label: t('visitor.other'), pick: () => request(colour, [...from, ...two]) }] : [];
    say(t('visitor.kk-slider'), t('chat.sp.kk-slider.which'), target, { colour, choices: [...two.map((s) => ({ label: titleOf(s), pick: () => void perform(s, colour) })), ...more] });
  }

  /** A tap on the scene (client px): true when the visitor took it. A tap elsewhere on the island now and then
   *  draws a glance that way. */
  let lastGlance = 0;
  export function tap(px: number, py: number): boolean {
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
    const onFigure = seen(now[0], now[1]) && inside(a.getBoundingClientRect());
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
      faceToward('visitor', actors.mine.x);
      setMotion('visitor', tapMotion(id));
    };
    if (backMs) later('visitor', backMs, turn);
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
  let mumble = $state<{ n: number; key: string } | null>(null);
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
    setMotion('visitor', 'surprise');
    setEmote('visitor', 'surprise');
    addFx('visitor', 'sweat');
    // up on his feet (the pose eases upright), a look about (then, woken here, his introduction)
    later('visitor', 700, () => faceToward('visitor', actors.mine.x));
  }
  function nudgeGulliver() {
    const r = nudge(nudges);
    nudges = r.taps;
    sceneSfx('visitor');
    if (!r.woke) {
      setMotion('visitor', 'twitch');
      if (!st.fx.some((f) => f.kind === 'zzz')) addFx('visitor', 'zzz');
      mumble = { n: nudges, key: `visitor.gulliver.zzz.${(nudges - 1) % MUMBLES}` };
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
    presence.visitor = !!(shown && spot);
    return () => (presence.visitor = false);
  });
  let talkTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(talkTimer));
  const emote = $derived(st.emote ? villagerEmote(st.emote) : null);
</script>

{#if shown && spot}
  {@const b = BEHAVIOUR[shown]}
  <!-- one world node at the feet (camera.svelte.ts): its live position is the director's while it walks -->
  <span class="visitor {shown}" aria-hidden="true" {@attach w.at({ x: spot.x, z: spot.z, h: spot.h + 40, live: () => livePos('visitor'), always: true, inv: true,
        m3: playing ? { key: '', emit: { kind: 'notes', every: 1100, lift: spot.h * 0.9 }, art: () => el?.querySelector('.notes') } : null,
        c3: shown === 'reese' ? { key: 'villagers/reese', h: spot.h, lift: FLOAT[shown] ?? 0, flip: false, actor: 'visitor', art: () => el?.querySelector('.art'), also: { key: 'villagers/cyrus', h: spot.h * 1.05, dx: spot.h * 0.55 } } : { key: ART[shown] ?? `villagers/${shown}`, h: spot.h, lift: FLOAT[shown] ?? 0, flip: facing.flip < 0, actor: 'visitor', art: () => el?.querySelector('.art') } })} class:show={!!playing} class:walking={st.walking} class:edge data-visitor={shown} data-stage={spot.stage || undefined}
      data-phase={phase} data-way={way} data-asleep={sleeping ? (spot.lie ? 'lie' : 'stand') : undefined} data-motion={st.motion ?? undefined} bind:this={el}
      style:--h={su(spot.h)} style:--lift={su(FLOAT[shown] ?? 0)}
      style:--breath="{b.breath}ms" style:--step="{st.stepMs}ms" style:--flip={facing.flip} style:--lean={facing.lean}>
      <i class="shade"></i>
      {#if shown === 'wisp'}<i class="glow"></i>{/if}
      {#if shown === 'reese'}
        <!-- Reese and Cyrus, side by side, under their heart float -->
        <span class="art pair"><span class="face"><span class="body" bind:this={bodyEl}><span class="idle">
          <span class="one"><OfficialArt key="villagers/reese" size={su(spot.h)} /></span><span class="one cyrus"><OfficialArt key="villagers/cyrus" size={su(spot.h * 1.05)} /></span>
        </span></span></span></span>
        <span class="float" data-heart-float>{@render heart()}</span>
      {:else}
        <span class="art"><span class="face" class:turning={st.motion === 'turn'}><span class="body" bind:this={bodyEl}><span class="idle">
          <OfficialArt key={ART[shown] ?? `villagers/${shown}`} size={su(spot.h)} />
        </span></span></span></span>
      {/if}
      <!-- emotes and fx over the head (never mirrored or squashed with the body), puffs at the feet -->
      <span class="over">
        {#if emote}<span class="emote">{#key st.emoteN}<Emote id={emote} size="var(--emote-size, 40px)" bare />{/key}</span>{/if}
        {#each st.fx as f (f.n)}
          <span class="fxa {f.kind}"><Fx kind={f.kind} dir={f.kind === 'zzz' ? -1 : 1} spread="calc(var(--h) * .55)" ondone={() => removeFx('visitor', f.n)} /></span>
        {/each}
        {#if mumble}{#key mumble.n}<span class="mumble if-caption" data-mumble bind:this={mumbleEl} style:--shift="{mumbleShift}px">{t(mumble.key)}</span>{/key}{/if}
      </span>
      {#if playing}<span class="notes">{#each [0, 1, 2] as i (i)}<i style:--i={i}>♪</i>{/each}</span>{/if}
      {#if treat}
        <!-- Jack's joy at a treat: the candy pops up over his head in a little spooky sparkle -->
        {#key treat}
          <span class="treat" data-treat>
            <span class="candy"><OfficialArt key={treatArt} size={su(22)} eager /></span>
            {#each [0, 1, 2, 3, 4] as i (i)}<i style:--i={i}></i>{/each}
          </span>
        {/key}
      {/if}
  </span>
{/if}
{#if playing && caption}
  <span class="caption if-caption" class:placed={caption.placed} data-fx="kk-caption" bind:this={capEl} style:left="{caption.x}px" style:top="{caption.y}px">♪ {titleOf(playing)}</span>
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
  .art { translate: -50% calc(-97% - var(--lift)); transform-origin: 50% 100%; transition: opacity .5s ease, rotate .6s ease-out, translate .6s ease-out, scale .6s ease-out, transform-origin .6s ease-out; }
  .visitor.edge .art { opacity: 0; }
  .art :global(.official) { max-width: none; }
  /* facing: a side-on render mirrors (--flip), one facing us leans toward what it looks at (--lean) */
  .face {
    display: block; transform-origin: 50% 100%; --facing: var(--flip); --in: 1;
    transform: scaleX(var(--flip)) translateX(calc(var(--lean) * 3%)) rotate(calc(var(--lean) * 5deg)); transition: transform 240ms var(--ease-soft, ease);
  }
  .face.turning { animation: if-turn 1400ms var(--ease-soft, ease) both; transition: none; }
  .body { display: block; transform-origin: 50% 100%; }
  /* the shared idle base: a breath (scale: ~1.5% taller, a tiny squash at the bottom of it) and now and then a weight
     shift (rotate + translate), on their own properties so they add up; walking, the villagers' walk bounce instead */
  .idle {
    display: block; transform-origin: 50% 100%;
    animation: v-breathe var(--breath) ease-in-out infinite, v-shift calc(var(--breath) * 3.3) ease-in-out infinite;
  }
  .visitor.walking .idle { animation: if-walkbounce var(--step, 640ms) linear infinite; }
  @keyframes v-breathe { 0%, 100% { scale: 1.004 .996; } 50% { scale: .993 1.015; } }
  @keyframes v-shift {
    0%, 28%, 100% { rotate: 0deg; translate: 0 0; } 36%, 58% { rotate: 1.4deg; translate: .8% 0; }
    66%, 80% { rotate: -1deg; translate: -.6% 0; } 88% { rotate: 0deg; translate: 0 0; }
  }
  /* the villagers' contact shadow (IslandScene .vil .shadow): radial, surface-coloured, under the feet; it breathes with
     the body and shrinks under a hop */
  .shade {
    display: block; width: calc(var(--h) * .6); height: calc(var(--h) * .12); translate: -50% -50%;
    background: radial-gradient(closest-side, var(--sh-c, rgba(60, 80, 30, .35)), color-mix(in srgb, var(--sh-c, rgba(60, 80, 30, .35)) 70%, transparent) 50%, transparent);
    animation: v-shade var(--breath) ease-in-out infinite;
  }
  @keyframes v-shade { 0%, 100% { scale: 1.02 1; } 50% { scale: .965 .97; } }
  .visitor:is([data-motion='hop'], [data-motion='hop2'], [data-motion='surprise'], [data-motion='twirl']) .shade { animation: v-sh-hop 600ms ease both; }
  @keyframes v-sh-hop { 0%, 100% { scale: 1; } 40% { scale: .78; } }
  .visitor.walking .shade { animation: none; }

  /* the director's motions (tokens.css's, and the visitors' own) */
  .body:global([data-act='hop']) { animation: if-hop 600ms var(--ease-soft, ease) both; }
  .body:global([data-act='hop2']) { animation: if-hop2 900ms var(--ease-soft, ease) both; }
  .body:global([data-act='wiggle']) { animation: if-wiggle 700ms ease-in-out both; }
  .body:global([data-act='nod']) { animation: if-nod 520ms ease-in-out both; }
  .body:global([data-act='laugh']) { animation: if-laugh 620ms ease-in-out both; }
  .body:global([data-act='surprise']) { animation: if-surprise 420ms var(--ease-bounce, ease) both; }
  .body:global([data-act='stretch']) { animation: if-stretch 1400ms var(--ease-soft, ease) both; }
  .body:global([data-act='dance']) { animation: if-dance 1600ms ease-in-out both; }
  .body:global([data-act='samba']) { animation: if-dance 1000ms ease-in-out 2 both; }
  .body:global([data-act='twirl']) { animation: v-twirl 900ms ease-in-out both; }
  .body:global([data-act='twitch']) { animation: v-twitch 420ms ease-out both; }
  .body:global([data-act='lookup']) { animation: v-lookup 1800ms var(--ease-soft, ease) both; }
  .body:global([data-act='point']) { animation: v-point 1400ms var(--ease-soft, ease) both; }
  .body:global([data-act='flap']) { animation: v-flap 900ms ease-in-out both; }
  /* group stretching: the same stretches as the villagers (tokens.css), from the feet */
  .body:global([data-act='warmup']) { animation: if-warmup 2000ms ease-in-out both; }
  .body:global([data-act='sidebend']) { animation: if-sidebend 2000ms ease-in-out both; }
  .body:global([data-act='leap']) { animation: if-leap 2000ms ease-in-out both; }
  /* Jack's twirl: a spin on the spot (through edge-on and back), a little lift */
  @keyframes v-twirl {
    0%, 100% { transform: none; } 25% { transform: translateY(-3%) scaleX(.08); } 50% { transform: translateY(-5%) scaleX(-1); }
    75% { transform: translateY(-3%) scaleX(.08); }
  }
  /* Gulliver's sleeping twitch */
  @keyframes v-twitch { 0%, 100% { transform: none; } 20% { transform: translateY(-3%) rotate(-2deg); } 45% { transform: rotate(1.5deg); } 70% { transform: translateY(-1.5%); } }
  /* Celeste: up on her toes, leaning back to the sky, held */
  @keyframes v-lookup { 0%, 100% { transform: none; } 20%, 75% { transform: translateY(-1.5%) rotate(-3deg) scale(.98, 1.04); } }
  /* Celeste points at a falling star: a bounce, up and leaning its way */
  @keyframes v-point {
    0%, 100% { transform: none; } 15% { transform: scale(1.06, .94); }
    35%, 80% { transform: translateY(-4%) rotate(calc(var(--lean, 0) * 7deg - 2deg)) scale(.97, 1.05); }
  }
  /* Franklin's flap: three little wing beats, a bob each */
  @keyframes v-flap { 0%, 100% { transform: none; } 12%, 37%, 62% { transform: translateY(-4%) scale(1.06, .96); } 25%, 50%, 75% { transform: scale(.97, 1.03); } }

  /* K.K.: a gentle head-bob as he strums; harder while he plays */
  .kk-slider .idle { animation: v-breathe var(--breath) ease-in-out infinite, v-strum 1.3s ease-in-out infinite alternate; }
  .kk-slider.show .idle { animation: v-breathe var(--breath) ease-in-out infinite, v-strum-hard .42s ease-in-out infinite alternate; }
  @keyframes v-strum { from { rotate: -1.5deg; translate: 0 0; } to { rotate: 1.5deg; translate: 0 -.6%; } }
  @keyframes v-strum-hard { from { rotate: -3.5deg; translate: 0 0; } to { rotate: 3.5deg; translate: 0 -2%; } }
  /* Wisp: see-through and glowing, floating with a slow bob, drifting a little side to side, a flicker */
  .wisp .art { filter: var(--leaf-tint,) drop-shadow(0 0 6px rgba(220, 235, 255, .9)); }
  .wisp .idle { animation: v-breathe var(--breath) ease-in-out infinite, v-drift 7.4s ease-in-out infinite, v-flicker 5.3s linear infinite; }
  @keyframes v-drift { 0%, 100% { translate: 0 0; } 25% { translate: 4% -6%; } 50% { translate: 0 -2%; } 75% { translate: -4% -6%; } }
  @keyframes v-flicker { 0%, 100% { opacity: .84; } 9% { opacity: .62; } 12% { opacity: .84; } 47% { opacity: .8; } 50% { opacity: .56; } 54% { opacity: .82; } 80% { opacity: .88; } }
  .wisp .shade { opacity: .45; scale: .7; }
  .glow {
    display: block; width: calc(var(--h) * 1.3); height: calc(var(--h) * 1.1); translate: -50% calc(-50% - var(--h) * .5 - var(--lift));
    background: radial-gradient(closest-side, rgba(225, 238, 255, .55), rgba(225, 238, 255, 0)); animation: v-glow 3.2s ease-in-out infinite alternate;
  }
  @keyframes v-glow { from { opacity: .45; } to { opacity: .9; } }
  /* Gulliver asleep: face down on the ground (on his front, his beak in the sand), a slow snoring breath; he eases up
     onto his feet when woken (the transition) */
  .visitor[data-asleep='lie'] .art { translate: -50% calc(-50% - var(--h) * .2); rotate: -90deg; scale: .92; transform-origin: 50% 50%; }
  .visitor[data-asleep] .idle { animation: v-snore 4s ease-in-out infinite; }
  .visitor[data-asleep='lie'] .shade { width: var(--h); translate: -50% -60%; animation-duration: 4s; }
  .visitor[data-asleep='stand'] .face { rotate: 5deg; }
  @keyframes v-snore { 0%, 100% { scale: 1; } 50% { scale: 1.03 .975; } }
  .visitor[data-asleep='lie'] .over { top: calc(var(--h) * -.5); left: calc(var(--h) * -.36); }
  /* Jack: a theatrical sway */
  .jack .idle { animation: v-breathe var(--breath) ease-in-out infinite, v-sway 2.6s ease-in-out infinite alternate; }
  @keyframes v-sway { from { rotate: -3.5deg; translate: -1% 0; } to { rotate: 3.5deg; translate: 1% 0; } }
  /* Franklin: a waddling bob */
  .franklin .idle { animation: v-breathe var(--breath) ease-in-out infinite, v-waddle 1.1s ease-in-out infinite alternate; }
  @keyframes v-waddle { 0% { rotate: -1.5deg; translate: 0 0; } 50% { translate: 0 -1.4%; } 100% { rotate: 1.5deg; translate: 0 0; } }
  /* Jingle: a jolly bounce */
  .jingle .idle { animation: v-breathe var(--breath) ease-in-out infinite, v-bounce .9s cubic-bezier(.3, 0, .6, 1) infinite alternate; }
  @keyframes v-bounce { from { translate: 0 0; } to { translate: 0 -4.5%; } }
  /* Pavé: Festivale's dance steps, all day */
  .pave .idle { animation: v-breathe var(--breath) ease-in-out infinite, v-steps 1.2s ease-in-out infinite; }
  @keyframes v-steps { 0%, 50%, 100% { translate: 0 0; rotate: 0deg; } 25% { translate: -3% -2%; rotate: -5deg; } 75% { translate: 3% -2%; rotate: 5deg; } }
  /* Zipper: a hop on the spot now and then; walking, he hops along */
  .zipper .idle { animation: v-breathe var(--breath) ease-in-out infinite, v-hops 1.9s ease-out infinite; }
  @keyframes v-hops { 0%, 62%, 84%, 92%, 100% { translate: 0 0; } 74% { translate: 0 -9%; } 88% { translate: 0 -2.5%; } }
  .zipper.walking .idle { animation: v-hopwalk .46s ease-out infinite; }
  @keyframes v-hopwalk { 0%, 100% { translate: 0 0; scale: 1.04 .96; } 45% { translate: 0 -8%; scale: .96 1.04; } }
  /* Reese and Cyrus: side by side, a little apart, each leaning toward the other in turn; a nuzzle closer */
  .pair .idle { display: flex; align-items: flex-end; gap: calc(var(--h) * .03); animation: v-breathe var(--breath) ease-in-out infinite; }
  .one { display: block; transform-origin: 50% 100%; animation: v-lean-r 3.4s ease-in-out infinite; }
  .one.cyrus { animation-name: v-lean-c; animation-delay: -.5s; }
  @keyframes v-lean-r { 0%, 100% { rotate: 0deg; } 40%, 60% { rotate: 3.5deg; } }
  @keyframes v-lean-c { 0%, 100% { rotate: 0deg; } 40%, 60% { rotate: -3.5deg; } }
  .pair .body:global([data-act='nuzzle']) .one { animation: v-nuzzle-r 1600ms ease-in-out both; }
  .pair .body:global([data-act='nuzzle']) .one.cyrus { animation-name: v-nuzzle-c; }
  @keyframes v-nuzzle-r { 0%, 100% { rotate: 0deg; translate: 0 0; } 30%, 70% { rotate: 8deg; translate: 4% 0; } }
  @keyframes v-nuzzle-c { 0%, 100% { rotate: 0deg; translate: 0 0; } 30%, 70% { rotate: -8deg; translate: -4% 0; } }
  .visitor.walking .one { animation: none; }

  /* arriving and leaving (transform and opacity on the figure): a pop in place on the page's first paint; down from the
     sky (Wisp floats, Celeste flies), appearing (K.K. on his stool, Gulliver washed up), Jack's spooky puff; walking on
     from the shore fades in at the water's edge (.edge). Leaving plays the same backwards */
  .visitor[data-phase='pop'] .art { animation: v-pop 700ms ease-out both; }
  .visitor[data-phase='pop']:is([data-way='float'], [data-way='fly']) .art { animation-name: v-pop-down; }
  @keyframes v-pop { from { opacity: 0; transform: translateY(4%) scale(.94); } }
  @keyframes v-pop-down { from { opacity: 0; transform: translateY(-10%); } }
  .visitor[data-phase='arrive'][data-way='float'] .art { animation: v-float-in 2200ms ease-out both; }
  .visitor[data-phase='arrive'][data-way='fly'] .art { animation: v-fly-in 1600ms ease-out both; }
  .visitor[data-phase='arrive'][data-way='appear'] .art { animation: v-appear 900ms ease-out both; }
  .visitor[data-phase='arrive'][data-way='spook'] .art { animation: v-spook 1200ms ease-out both; }
  .visitor[data-phase='leave'][data-way='float'] .art { animation: v-float-in 2200ms ease-in reverse both; }
  .visitor[data-phase='leave'][data-way='fly'] .art { animation: v-fly-in 1600ms ease-in reverse both; }
  .visitor[data-phase='leave'][data-way='appear'] .art { animation: v-appear 900ms ease-in reverse both; }
  .visitor[data-phase='leave'][data-way='spook'] .art { animation: v-spook 1200ms ease-in reverse both; }
  .visitor[data-phase='leave']:not(.walking) .shade, .visitor[data-phase='arrive']:not(.walking):not([data-way='appear']) .shade { animation: v-shade-in 1600ms ease-out both; }
  .visitor[data-phase='leave']:not(.walking) .shade { animation-direction: reverse; }
  @keyframes v-float-in { from { opacity: 0; transform: translateY(calc(var(--h) * -1.4)); } 70% { opacity: .9; } to { opacity: 1; transform: none; } }
  @keyframes v-fly-in {
    from { opacity: 0; transform: translate(calc(var(--h) * .8), calc(var(--h) * -1.8)) rotate(12deg); }
    60% { opacity: 1; transform: translate(calc(var(--h) * .1), calc(var(--h) * -.3)) rotate(-4deg); }
    80% { transform: translateY(2%) scale(1.06, .94); } to { opacity: 1; transform: none; }
  }
  @keyframes v-appear { from { opacity: 0; transform: scale(.85); } 60% { opacity: 1; transform: scale(1.04); } to { opacity: 1; transform: none; } }
  @keyframes v-spook {
    0% { opacity: 0; transform: scale(.4) rotate(-30deg); } 30% { opacity: .6; } 45% { opacity: .2; }
    60% { opacity: .9; transform: scale(1.1) rotate(8deg); } 100% { opacity: 1; transform: none; }
  }
  @keyframes v-shade-in { from { opacity: 0; scale: .4; } }
  /* under a sheet or with the page hidden, everyone holds still */
  :global(.if-scene:is([data-covered], [data-paused])) .visitor :is(.idle, .one, .shade, .glow, .body, .art, .face) { animation-play-state: paused; }

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
  @keyframes v-mumble { from { opacity: 0; transform: translateY(6px) scale(.8); } 15% { opacity: 1; transform: none; } 80% { opacity: 1; } to { opacity: 0; transform: translateY(-6px); } }

  /* the heart float over Reese and Cyrus */
  .float { left: 0; top: calc(var(--h) * -1.5); width: calc(var(--h) * .5); translate: -50% 0; animation: v-appear .6s ease-out both, bob 3.4s ease-in-out infinite alternate; }
  .float svg { width: 100%; overflow: visible; filter: var(--leaf-tint,) drop-shadow(0 2px 2px rgba(120, 40, 70, .3)); }
  .float .hb { fill: #FF7FAE; } .float .hl { fill: none; stroke: #FFE3EE; stroke-width: 3; stroke-linecap: round; }
  .float .string { fill: none; stroke: rgba(255, 255, 255, .85); stroke-width: 1.4; }
  @keyframes bob { from { transform: translateY(0) rotate(-3deg); } to { transform: translateY(calc(var(--h) * -.06)) rotate(3deg); } }
  /* ♪ float up off his guitar while he plays */
  .notes { left: calc(var(--h) * .18); top: calc(var(--h) * -.62); }
  .notes i {
    position: absolute; font: 700 calc(var(--h) * .17) / 1 var(--font-ui); font-style: normal; color: #FFF6C8;
    text-shadow: 0 1px 2px rgba(60, 40, 20, .5); animation: note 1.8s ease-out calc(var(--i) * .6s) infinite;
  }
  @keyframes note {
    from { transform: translate(0, 0) rotate(-10deg); opacity: 0; } 20% { opacity: 1; }
    to { transform: translate(calc(var(--h) * .14), calc(var(--h) * -.3)) rotate(12deg); opacity: 0; }
  }
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
  /* 「♪ title」 */
  .caption { z-index: var(--z-taps); translate: -50% -50%; animation: v-appear .4s ease-out both; }
  .caption:not(.placed) { visibility: hidden; }
</style>
