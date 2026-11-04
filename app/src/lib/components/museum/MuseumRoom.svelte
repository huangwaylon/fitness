<script lang="ts">
  // はくぶつかん: the museum's inside (docs/design.md "The museum"), behind its door on the island. The museum (engine.ts,
  // three.js) comes in its own chunk once the screen opens; until its first frame the door's black covers it
  // (ui-state/doorTransition.ts). A tap on the floor walks my villager there (through the hall's openings into a wing);
  // a tap on a fish or a bug shows its card (MuseumCard: its names, who found it first and when, how many we've had);
  // a tap on a bench walks my villager up to its free seat and sits it down facing the great tank (the rooms' sitting:
  // rooms/seating.ts, its seats seats.ts), a tap on the floor gets it up; a tap on the curator at the desk (フータ: curator.ts, his idle life) is his line in NH's balloon (Talk, lines.ts);
  // the doormat or ‹ 島へ goes back out. What's on show is the ずかん's (model/finds.ts: every fish and bug anyone has
  // found, the guest's too), and comes as it's found. The others in here are seen (the relay's `tent` with `sc: 'm'`,
  // the rooms' presence); the say button says a phrase here (`say` with `sc: 'm'`). Nothing gives ベル.
  import { goto } from '$app/navigation';
  import { asset, resolve } from '$app/paths';
  import { onMount, untrack } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Says from '../island/Says.svelte';
  import Talk from '../island/Talk.svelte';
  import SayPicker from '../island/SayPicker.svelte';
  import SayButton from '../island/SayButton.svelte';
  import EyeToggle from '../rooms/EyeToggle.svelte';
  import { gestures } from '../rooms/gesture.ts';
  import { firstPerson } from '#lib/store/firstPerson.svelte.ts';
  import MuseumCard from './MuseumCard.svelte';
  import { SAY_TAG, rememberSay, sayGate, type SaySpeaker } from '../island/say.ts';
  import { url3d } from '../villager3d/manifest.ts';
  import type { WeekView } from '#lib/types.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { doorReady, provideDoor } from '#lib/ui-state/doorTransition.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { layout as islandLayout } from '#lib/store/layout.svelte.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { where } from '#lib/store/where.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { leaveBy } from '../island/doorOut.ts';
  import { findsView } from '#lib/model/finds.ts';
  import { tallyTotals } from '#lib/model/tally.ts';
  import { LIVE_URL, createLive, liveRelay, type Live } from '#lib/sync/live.ts';
  import { createLocalLive } from '#lib/sync/live-local.ts';
  import type { Intent, Pt as WirePt, Relayed } from '#lib/sync/live-protocol.ts';
  import { hook } from '../island/devHooks.ts';
  import { now } from '#lib/time/clock.ts';
  import { ENTRANCE, type Pt } from './plan.ts';
  import { onShow, type Specimen } from './species.ts';
  import { CURATOR, curatorLine } from './lines.ts';
  import { benchSeats, seatOf, type MuseumSeat } from './seats.ts';
  import { createSeating } from '../rooms/seating.ts';
  import { t } from '#lib/i18n/index.ts';
  import type { Curator } from './curator.ts';
  import type { Hit, Museum, Who } from './engine.ts';

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
  const testRelay = (): Live | null => {
    const url = hook('relay'), key = hook('key');
    return url && /^wss?:\/\//.test(url) && key ? createLive({ url, key: () => key }) : null;
  };
  const own = demo ? (testRelay() ?? createLocalLive(me)) : null;
  const relay: Live | null = demo ? own : LIVE_URL ? liveRelay() : null;
  const relayNow = () => relay?.serverNow() ?? Date.now();
  /** My presence and walks in here: the rooms' `tent` intent, this place's scope. */
  const send = (i: Intent) => relay?.send(i.kind === 'tent' ? ({ ...i, sc: 'm' } as Intent) : i) ?? false;

  // ---- what's on show: the ずかん's first finds (everyone's), the tallies for the card ----
  const finds = $derived(week.model ? findsView(week.model.state) : null);
  const specimens = $derived<Specimen[]>(finds ? onShow(finds) : []);

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

  // ---- the benches (seats.ts): walk up to the nearest free seat, then on; one villager a seat, the first keeps it ----
  const seats = createSeating<MuseumSeat>(me);
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
  function lookOf(w: Who) {
    const villager = w === 'G' ? view.guest.villager : view.people[w].villager;
    const l = resolveLook({ villager, person: w });
    return { id: l.id, model: url3d(l.id, asset('room/villagers3d/' as Parameters<typeof asset>[0])) };
  }
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
    if (m.from && m.s !== undefined && m.ms) {
      const ago = relayNow() - m.s;
      if (ago < m.ms) eng.walk(w, [...(m.via ?? []), m.to], { from: m.from, ago, ms: m.ms });
      else eng.put(w, m.to);
    } else eng.put(w, m.to);
  }

  // ---- the phrases (island/say.ts): as in the rooms, this place's `sc` ----
  let says = $state<ReturnType<typeof Says>>();
  let scene = $state<HTMLElement>();
  let sayAt = $state<HTMLElement | null>(null);
  let sayBtn = $state<HTMLButtonElement>();
  let sayClosedBy: Event | null = null;
  /** The card of the creature tapped (its specimen), or null. */
  let card = $state<Specimen | null>(null);
  const sayShown = $derived(!!eng && !failed && !ui.sheets.length);
  const sayId = (w: Who) => (w === me ? 'mine' : w === partner ? 'partner' : 'third');
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
        if (w === me && fpv && canvas) {
          const r = canvas.getBoundingClientRect();
          return new DOMRect(r.left + r.width / 2 - 20, r.bottom - insets().bottom - 70, 40, 40);
        }
        const [hx, hy] = eng.client(h[0], h[1], h[2]), [, fy] = eng.client(at[0], 0, at[1]);
        const tall = Math.max(12, fy - hy), wide = tall * 0.55;
        return new DOMRect(hx - wide / 2, hy, wide, tall);
      }
    };
  }
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
    curatorSaid = curatorLine(Math.random, curatorSaid);
    const fish = specimens.filter((s) => s.kind === 'fish').length, bugs = specimens.length - fish;
    const line = t(curatorSaid, { fish, bugs }), him = curator;
    him.talk([...line].length);
    talk?.say(t('museum.curator'), line, curatorSpeaker, { colour: CURATOR_TAG, ondone: () => him.quiet() });
    const p = curator.where(CURATOR);
    if (p) eng.face(me, [p[0], p[2]]);
  }

  // ---- the finger: a tap walks (or shows a creature's card); a drag turns the camera; two fingers pinch to zoom ----
  let turned = $state(false);
  const fingers = gestures({
    tap: (x, y) => tap(x, y),
    start() {
      eng?.moving(true);
      says?.hold(true);
      talk?.hold(true);
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
    const h: Hit | null = eng.hit(cx, cy);
    // (nothing there: a soft no)
    if (!h) return void cue('boop');
    if (h.kind === 'villager') {
      eng.hop(h.who);
      cue('villager-tap');
      return;
    }
    if (h.kind === 'creature' && h.id === CURATOR) return curatorTalk();
    if (h.kind === 'creature') {
      const s = specimens.find((x) => x.id === h.id);
      if (!s) return;
      card = s;
      const p = eng.exhibits().map((x) => x.where(h.id)).find(Boolean);
      if (p) eng.face(me, [p[0], p[2]]);
      cue('open');
      return;
    }
    card = null;
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
    send({ kind: 'tent', in: false });
    leaveBy('museum', me);
    const q = new URLSearchParams(location.search);
    void goto(resolve('/') + (q.size ? `?${q}` : '')).finally(() => (leaving = false));
  }

  const nightOf = (tod: string) => (tod === 'night' ? 1 : tod === 'dusk' ? 0.55 : tod === 'dawn' ? 0.3 : 0);
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
  // the exhibits as the finds come (the museum's own chunk builds them: exhibits.ts); the aquarium's fish by the scene
  // clock's hour (?date; the e2e's nextHour() a later one)
  let hoursOn = 0;
  const clock = () => now().getTime() + hoursOn * 3_600_000;
  // (none found yet: the wings built all the same, their tanks and benches empty of fish; once the record is in)
  let shownKey: string | null = null;
  $effect(() => {
    const list = specimens, e = eng;
    if (!e || !finds) return;
    const k = list.map((s) => s.id).join(',');
    if (k === shownKey) return;
    shownKey = k;
    untrack(() => void import('./exhibits.ts').then(({ show }) => show(e, list, clock)));
  });

  onMount(() => {
    let alive = true;
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
    void Promise.all([import('./engine.ts'), import('./plan.ts'), import('./curator.ts')]).then(
      ([{ createMuseum }, { walkPath }, { buildCurator }]) => {
        if (!alive || !canvas) return;
        const e = createMuseum(canvas, { base: asset('room/museum/' as Parameters<typeof asset>[0]), world: asset('room/world3d/' as Parameters<typeof asset>[0]) });
        walkPathOf = (from, to) => walkPath(e.nav(), from, to);
        e.resize(insets());
        e.night(nightOf(theme.tod));
        e.villager(me, lookOf(me));
        e.follow(me);
        curator = buildCurator(e.kit, { model: url3d('blathers', asset('room/villagers3d/' as Parameters<typeof asset>[0])), me: () => e.at(me) });
        e.exhibit(curator);
        // in at the front door, a few steps into the hall
        e.put(me, [ENTRANCE[0] + sideX(me), ENTRANCE[1] + 6], Math.PI);
        e.firstPerson(fpv, true);
        eng = e;
        othersShown();
        walkTo([ENTRANCE[0] + sideX(me), ENTRANCE[1] - 14]);
        void e.ready.then(() => alive && doorReady());
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
      for (const f of offs) f();
      ro.disconnect();
      offDoor();
      own?.stop();
      eng?.dispose();
      eng = null;
      delete (window as unknown as { __museum?: unknown }).__museum;
    };
  });

  let top = $state<HTMLElement>();
  function insets() {
    const rc = canvas?.getBoundingClientRect(), tb = top?.getBoundingClientRect();
    return { top: rc && tb ? Math.max(0, tb.bottom - rc.top) : 0, bottom: 72 };
  }

  /** The e2e's and the console's hooks (dev builds and ?demo). */
  function hooks() {
    if (!import.meta.env.DEV && !new URLSearchParams(location.search).has('demo')) return;
    (window as unknown as { __museum?: unknown }).__museum = {
      stats: () => eng?.stats(),
      mine: () => eng?.at(me),
      at: (w: Who) => eng?.at(w),
      walking: (w: Who) => eng?.walking(w),
      still: () => !!eng?.still(),
      /** A floor point's client px. */
      px: (x: number, z: number, y = 0) => eng?.client(x, y, z),
      /** The species on show (the ずかん's finds) and those drawn (each wing's). */
      specimens: () => specimens.map((s) => ({ id: s.id, kind: s.kind, tank: s.tank, by: s.found.person })),
      shown: () => eng?.exhibits().flatMap((x) => x.shown()) ?? [],
      /** A creature's client px (null: not drawn). */
      creature: (id: string) => {
        const p = eng?.exhibits().map((x) => x.where(id)).find(Boolean);
        return p && eng ? eng.client(p[0], p[1], p[2]) : null;
      },
      card: () => (card ? card.id : null),
      /** The aquarium's clock an hour on (its pick changes). */
      nextHour: () => {
        hoursOn++;
        eng?.kit.invalidate();
      },
      /** The curator's head's client px, and what he's doing (idle, watching my villager, dozing, talking). */
      curator: () => {
        const p = curator?.where(CURATOR);
        return p && eng ? { at: eng.client(p[0], p[1] - 4, p[2]), doing: curator!.doing() } : null;
      },
      curatorDoze: () => curator?.doze(),
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

<main class="museum" bind:this={scene} data-museum>
  <h1 class="sr-only">{t('museum.title')}</h1>
  <canvas bind:this={canvas} class="room" data-museum-room onpointerdown={onDown} onpointermove={onMove} onpointerup={onUp}
    onpointercancel={onCancel} onwheel={onWheel} aria-label={t('museum.room')}></canvas>
  <div class="top" bind:this={top}>
    <NavButton kind="back" text={t('tent.back')} onclick={leave} sfx="self" />
  </div>
  {#if turned && !fpv}
    <button type="button" class="reset" data-museum-reset data-sfx="tick" aria-label={t('tent.resetView')} onclick={resetView}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9" /><path d="M10 19v-5h4v5" /></svg>
    </button>
  {/if}
  {#if card && counts}
    <MuseumCard specimen={card} {counts} {view} onclose={() => (card = null)} />
  {/if}
  <Says bind:this={says} {scene} />
  <Talk bind:this={talk} {scene} />
  {#if sayAt && scene}
    <SayPicker {scene} anchor={sayAt} onpick={pickSay} onclose={(e) => {
      closeSay(e);
      if (!e) sayBtn?.focus({ preventScroll: true });
    }} />
  {/if}
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
  .top { position: absolute; left: calc(var(--side) + var(--safe-left)); top: calc(var(--ui-top) + 8px); z-index: 2; min-height: var(--hit); }
  .say-dock { position: absolute; z-index: 3; right: calc(var(--safe-right, 0px) + 8px); bottom: calc(var(--safe-bottom, 0px) + 14px); }
  .eye-dock { position: absolute; z-index: 3; left: calc(var(--safe-left, 0px) + 8px); bottom: calc(var(--safe-bottom, 0px) + 14px); }
  .reset {
    position: absolute; right: calc(var(--side) + var(--safe-right)); top: calc(var(--ui-top) + 8px); z-index: 2;
    width: 52px; height: 52px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    color: var(--c-ink); background: var(--c-card); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
  }
  .reset svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .reset:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .fail { position: absolute; left: 16px; right: 16px; top: 40%; text-align: center; color: #F5E4BC; font-weight: 700; }
</style>
