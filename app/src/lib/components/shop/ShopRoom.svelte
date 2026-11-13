<script lang="ts">
  // タヌキ商店: the shop's inside (docs/design.md "The shop"), behind its door on the island. NH's built-up Nook's Cranny
  // in 3D (the rooms' engine, tent/engine.ts, with the shop's own model as its shell: shop/plan.ts), loaded in its own
  // chunk once the screen opens; until its first frame the door's black covers it. まめきち and つぶきち behind the counter
  // (NH's model, static/room/villagers3d/timmy.glb: one for the two), today's stock shown on the stage's tiers, the
  // blue table, by the left wall and on the back wall (plan.ts display: the same on every phone).
  // The finger is the rooms' (rooms/gesture.ts): a tap on the floor walks my villager there; a tap on a piece picks it
  // in place (my villager turns to it, a card with its name, price and 買う: stock.ts buyPiece); a tap on the twins (their
  // model, or their bodies and the counter's top: plan.ts TWINS_BOX, never the floor before it), on their balloon or on
  // the sign by the door (「タップで かう・うる」) opens the counter's lists at once, wherever I stand (Counter.svelte, a sheet
  // over the room, on the tab last shown; no choice box, no walk); a drag turns the camera, a pinch zooms; the doormat or
  // ‹ 島へ goes out.
  // The twins say いらっしゃいませ once I reach the counter (plan.ts atCounter), not at the door; their balloon goes after
  // a few seconds, never takes a tap meant for the room, and never shows over the list. A bought piece joins my もようがえ. The guest's pocket and
  // かいがら are its own. Never ベル.
  // While I'm in here the others' islands show my villager nowhere, as in the museum and the rooms (the rooms' `tent`
  // presence with `sc: 's'`: store/where.svelte.ts); out of the door they see it there. The others in here are drawn,
  // walking where they walk (the very walk, as the museum's: `tent` with `sc: 's'` and its points; a bare `in` first,
  // an older app's, which drops a shop walk); out of the door, or gone quiet past the presence's grace, they're not.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount, untrack } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import EyeToggle from '../rooms/EyeToggle.svelte';
  import { madeGL } from '../rooms/madeGL.ts';
  import { replayWalk, roomRelay } from '../rooms/roomRelay.ts';
  import { logError } from '#lib/sync/log.ts';
  import PanHint from '../rooms/PanHint.svelte';
  import RecentreIcon from '../rooms/RecentreIcon.svelte';
  import { gestures, roomCamera } from '../rooms/gesture.ts';
  import { nightOf } from '../rooms/speaker.ts';
  import { firstPerson } from '#lib/store/firstPerson.svelte.ts';
  import { iconUrl } from '../tent/items.ts';
  import Counter, { type Tab } from './Counter.svelte';
  import { nm } from './PieceTile.svelte';
  import { placeOf, samePlace, type Place } from './words.ts';
  import { findArt } from '#lib/world/beach.ts';
  import { person3, type Dirs } from '../person3d/person3d.ts';
  import { url3d } from '../villager3d/manifest.ts';
  import { lookOf as wornOf } from '#lib/store/look.ts';
  import { art, artUrl, villagerArt } from '#lib/art.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import type { WeekView, Who } from '#lib/types.ts';
  import { buyPrice } from '#lib/contract/stock.ts';
  import { buyPiece, buyRefusal, stockAt } from './stock.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { undoBanner } from '#lib/store/actions.ts';
  import { layout as islandLayout } from '#lib/store/layout.svelte.ts';
  import { leaveBy } from '../island/doorOut.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { where } from '#lib/store/where.svelte.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { doorReady, provideDoor } from '#lib/ui-state/doorTransition.ts';
  import { testHooks } from '#lib/ui-state/testMode.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { setPlace } from '#lib/sound/sound.svelte.ts';
  import { formatNum, i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/catch.ts';
  import { loadTentNames } from '#lib/i18n/tent.ts';
  import { staticUrl } from '#lib/staticUrl.ts';
  import { COUNTER_FRONT, DOOR, DOOR_IN, FRONT, RECT, SIGN, TWINS, TWINS_BOX, WALK_IN, WALL_H, atCounter, blocked, corners, display, inHull, side, standable, walkPath, type Shown } from './plan.ts';
  import M from './models.json' with { type: 'json' };
  import type { Look, Tent } from '../tent/engine.ts';
  import type { Pt } from '../tent/grid.ts';
  import type { Pt as WirePt, Relayed } from '#lib/contract/live-protocol.ts';

  let { view }: { view: WeekView } = $props();

  /** The room's default view: nearer than the whole room (too wide for a phone held upright), its middle following my
   *  villager from the stage's left to the counter. */
  const FOLLOW = { k: 0.64, x: [-28, 26] as [number, number], z: [-2.5, -2.5] as [number, number] };
  /** The counter's tab last shown (the next open's, but an empty pocket's: かう). */
  let tab = $state<Tab>('sell');
  /** The counter's list open over the room (null: the room alone). */
  let panel = $state<Tab | null>(null);
  /** かう: the piece picked (in the list, or tapped in the room: its card). */
  let pick = $state<string | null>(null);
  /** The twins' line (a key of `shop.say.*` and its params): by まめきち for SAY_MS after it changes, or till it's
   *  tapped. Only in the room: never while the list is over it (the list says what it needs itself). */
  let say = $state<{ k: string; p?: Record<string, string> }>({ k: 'hello' });
  let sayOn = $state(false);
  const SAY_MS = 4000;
  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  const speak = (k: string, p?: Record<string, string>) => {
    if (panel) return;
    say = { k, p };
    sayOn = true;
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => (sayOn = false), SAY_MS);
  };
  /** The balloon gone (the list opened, a card closed). */
  function hush() {
    clearTimeout(sayTimer);
    sayOn = false;
  }
  /** Whether the twins said hello this visit (once I first reach the counter). */
  let greeted = false;

  const viewer: Who = untrack(() => view.viewer);
  const me = $derived(week.model?.me ?? viewer);
  const shop = $derived(week.model ? shopView(week.model.state, me) : { pocket: new Map<string, number>(), shells: 0, owned: [] as readonly string[] });
  // (as of the day's start: a find or a buy today leaves it as it was)
  const stock = $derived(week.model ? stockAt(week.model.state, week.model.now) : []);
  const night = $derived(theme.tod === 'night' || theme.tod === 'dusk');

  // ---- my presence (the phone's one socket; the demo's two tabs share a channel; ?relay=&key= a test relay) ----
  const demo = !!week.demo;
  // svelte-ignore state_referenced_locally
  const { own, relay, now: relayNow } = roomRelay(demo, viewer);
  const inside = (on: boolean) => relay?.send({ kind: 'tent', in: on, sc: 's' });

  /** The pieces' names (NH's, i18n/tent.ts: loaded with the screen, the language on screen). */
  let names = $state(0);
  $effect(() => void loadTentNames(i18n.locale).then(() => names++, () => {}));
  const itemName = (code: string) => (void names, t(`tent.item.${code}`));

  // ---- かう's piece (the list's tile, the room's piece: its card)
  /** A piece picked in the room: the twins say its price, or why not. */
  function choose(code: string) {
    pick = code;
    cue('tick');
    const why = buyRefusal(code, stock);
    if (why === 'owned') speak('owned');
    else if (why === 'wallet') speak('short', { name: itemName(code) });
    else speak('price', { name: itemName(code), v: formatNum(buyPrice(code) ?? 0) });
  }
  const why = $derived(pick ? (void shop, buyRefusal(pick, stock)) : null);
  function buyPicked() {
    if (!pick || why) {
      if (pick) speak(why === 'owned' ? 'owned' : 'short', why === 'owned' ? undefined : { name: itemName(pick) });
      return void cue('boop');
    }
    const r = buyPiece(pick, stock);
    if (!r.ok) return void cue('boop');
    cue('buy');
    undoBanner(t('shop.bought', { name: itemName(pick) }), r);
    const bought = pick;
    // (a piece bought in the room: its card stays, saying it's mine now)
    if (panel) pick = null;
    eng?.bump(`s-${bought}`);
    speak('thanks');
  }

  // ---- the twins: a tap on them, their balloon or the sign opens the counter's list over the room, on its last tab
  // (an empty pocket's: かう)
  function twinsTalk() {
    cue('host-tap');
    eng?.hop('n:timmy');
    eng?.face(viewer, TWINS.timmy);
    hush();
    pick = null;
    tab = shop.pocket.size ? tab : 'buy';
    panel = tab;
  }
  function closePanel() {
    panel = null;
    pick = null;
  }

  // ---- the room (tent/engine.ts with the shop's shell) ----
  let canvas = $state<HTMLCanvasElement>();
  let eng = $state<Tent | null>(null);
  let failed = $state(false);
  const DIRS: Dirs = { villagers: staticUrl('room/villagers3d/'), player: staticUrl('room/player/') };
  /** Who draws my villager (person3d: the look I wear; its render the card till its model is in). */
  function lookOf(w: Who): Look | null {
    const villager = w === 'G' ? view.guest.villager : view.people[w].villager;
    const person = person3(w, wornOf(w), villager, DIRS);
    const l = resolveLook({ villager: person.villager, person: w });
    const key = villagerArt(l.id), a = art(key), url = artUrl(key);
    return a && url ? { url, aspect: a.w / a.h, looksRight: l.looksRight, noMirror: l.noMirror, person: person.has3d ? person : undefined, cardless: person.kind === 'player' } : null;
  }
  $effect(() => {
    for (const w of ['A', 'B', 'G'] as const) void wornOf(w);
    untrack(() => {
      if (eng?.at(viewer)) eng.villager(viewer, lookOf(viewer));
      othersShown();
    });
  });

  // ---- my villager, told to the others (the very walk: where it set off, by way of, to, when, how long) ----
  let myWalk: { from: Pt; via: Pt[]; to: Pt; s: number; ms: number } | null = null;
  const r = (p: Pt): WirePt => [Math.round(Math.max(-80, Math.min(80, p[0]))), Math.round(Math.max(-80, Math.min(80, p[1])))];
  function sayWhere() {
    const at = eng?.at(viewer);
    if (!at || !relay) return;
    const w = myWalk && relayNow() < myWalk.s + myWalk.ms ? myWalk : null;
    relay.send(w ? { kind: 'tent', in: true, from: r(w.from), ...(w.via.length ? { via: w.via.map(r).slice(0, 10) } : {}), to: r(w.to), s: Math.round(w.s), ms: Math.round(w.ms), sc: 's' }
      : { kind: 'tent', in: true, to: r(at), sc: 's' });
  }

  // ---- the others: each drawn only while they're in the shop (store/where.svelte.ts), walking as they walk ----
  const others = (['A', 'B', 'G'] as const).filter((w) => w !== viewer);
  /** Where each one comes in (a little apart: A left, B right, the guest in the middle), and last stood. */
  const sideX = (w: Who) => (w === 'A' ? -8 : w === 'B' ? 8 : 0);
  const theirAt = new Map<Who, Pt>(others.map((w) => [w, [DOOR_IN[0] + sideX(w), DOOR_IN[1] - 6] as Pt]));
  function othersShown() {
    if (!eng) return;
    for (const w of others) {
      const on = where.inTent[w] && where.home[w] === 'S', fresh = on && !eng.at(w);
      eng.villager(w, on ? lookOf(w) : null);
      if (fresh) eng.put(w, theirAt.get(w)!, 1);
    }
  }
  function heardTent(m: Extract<Relayed, { kind: 'tent' }>) {
    where.heard(m);
    if (!eng) return;
    if (m.sc !== 's') return othersShown();
    const w = m.who;
    if (m.to) theirAt.set(w, m.to);
    othersShown();
    if (!m.in || !m.to) return;
    replayWalk(eng, m, relayNow());
  }
  $effect(() => {
    for (const w of others) void (where.inTent[w], where.home[w]);
    untrack(() => othersShown());
  });
  /** Today's stock as shown (plan.ts display) and what one may walk round. */
  const shown = $derived(display(stock));
  const walls = $derived(blocked(shown.shown));
  $effect(() => {
    const list = shown.shown;
    eng?.pieces(list);
  });
  function walkTo(to: readonly [number, number]) {
    if (!eng) return;
    const at = eng.at(viewer);
    if (!at) return;
    const pts = walkPath(walls, at, to);
    if (!pts.length) return;
    const ms = eng.walk(viewer, pts);
    myWalk = { from: at, via: pts.slice(0, -1), to: pts[pts.length - 1], s: relayNow(), ms };
    sayWhere();
  }

  /** The twins' line by まめきち's head (client px: where the balloon stands, kept on screen, and how far its tail is
   *  off its middle to point at him), followed as the camera moves; null at my villager's eyes with him out of view. */
  let sayAt = $state<Place | null>(null);
  /** The sign by the door's foot (client px), null out of view. */
  let signAt = $state<{ x: number; y: number } | null>(null);
  /** The room's box on the screen (kept by the ResizeObserver: no layout read a frame). */
  let box: DOMRect | null = null;
  /** Each drawn frame (and when the balloon or the list comes or goes): the hello at the counter, and where the sign and
   *  the balloon stand, only while shown (the list over the room shows neither), written only when they move. */
  function placeSay() {
    const at = eng?.at(viewer);
    if (!greeted && at && atCounter(at)) {
      greeted = true;
      speak('hello');
    }
    if (!eng || panel) return;
    // the sign by the door, where it stands (none out of view)
    const sign = eng.inView(SIGN[0], SIGN[1] + 6, SIGN[2]) ? (([x, y]) => ({ x: Math.round(x), y: Math.round(y) }))(eng.client(SIGN[0], SIGN[1], SIGN[2])) : null;
    if (!samePlace(sign, signAt)) signAt = sign;
    if (!sayShown) return;
    // (off the view to a side, the balloon stands at that edge, its tail toward him; behind the eyes, none)
    const h = eng.headPoint('n:timmy');
    box ??= canvas?.getBoundingClientRect() ?? null;
    let say: Place | null = null;
    if (h && box && !(fpv && !eng.inView(h[0], h[1], h[2]))) {
      const [hx, hy] = eng.client(h[0], h[1] + 2, h[2]);
      say = placeOf(hx, hy, box.left, box.right);
    }
    if (!samePlace(say, sayAt)) sayAt = say;
  }
  const sayShown = $derived(sayOn);
  $effect(() => {
    void panel;
    void sayShown;
    untrack(placeSay);
  });

  // ---- the finger: a tap walks or acts in place; a drag turns the camera; two fingers pinch ----
  let turned = $state(false);
  const fpv = $derived(firstPerson.on);
  const camera = roomCamera(() => eng, () => fpv, (off) => (turned = off));
  const fingers = gestures({
    tap: (x, y) => tap(x, y),
    start: () => eng?.moving(true),
    ...camera.fingers,
    end: () => eng?.moving(false)
  });
  function onDown(e: PointerEvent) {
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
  /** A piece of today's stock shown in the room: picked in place (its card), my villager turned to it. */
  function pickPiece(code: string) {
    const s = shown.shown.find((x) => x.item === code);
    if (s && eng) {
      eng.bump(s.id);
      eng.face(viewer, s.at);
    }
    choose(code);
  }
  /** Whether client px are over the twins' box (their bodies and the counter's top: plan.ts TWINS_BOX) as drawn. */
  function atTwins(cx: number, cy: number): boolean {
    if (!eng) return false;
    const [x0, x1, y0, y1, z0, z1] = TWINS_BOX;
    if (!eng.inView((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)) return false;
    return inHull(corners(TWINS_BOX).map(([x, y, z]) => eng!.client(x, y, z)), cx, cy);
  }
  function tap(cx: number, cy: number) {
    if (!eng) return;
    const h = eng.hit(cx, cy);
    // (the twins: their model, or their box where no one, no piece and no floor one walks on is under the finger)
    if (h?.kind === 'npc' || ((!h || (h.kind === 'floor' && !standable(walls, [h.x, h.z]))) && atTwins(cx, cy))) return twinsTalk();
    if (!h) return void cue('boop');
    if (h.kind === 'villager') {
      eng.hop(h.who);
      return void cue('villager-tap');
    }
    if (h.kind === 'piece') {
      const s = shown.shown.find((x) => x.id === h.id);
      return s ? pickPiece(s.item) : undefined;
    }
    if (h.kind === 'door') return leave();
    pick = null;
    walkTo([h.x, h.z]);
  }

  // ---- out of the door: on the island just out of the shop's door, on every phone (island/doorOut.ts)
  let leaving = false;
  function leave() {
    if (leaving) return;
    leaving = true;
    cue('scene-bench');
    // (out at the door first, then seen: the others' islands show it there, not where it went in)
    leaveBy('shop', me);
    inside(false);
    const q = new URLSearchParams(location.search);
    void goto(resolve('/') + (q.size ? `?${q}` : '')).finally(() => (leaving = false));
  }

  $effect(() => {
    const m = week.model;
    if (m) untrack(() => islandLayout.rows(m.state.layout));
  });
  $effect(() => eng?.night(nightOf(theme.tod)));
  $effect(() => eng?.firstPerson(fpv ? viewer : null));
  $effect(() => () => clearTimeout(sayTimer));
  // NH's タヌキ商店 music while in here (sound/places.ts; no hours or upgrade here, so never its closing or big shop's),
  // the island's again out of the door
  onMount(() => (setPlace('shop'), () => setPlace(null)));
  onMount(() => {
    let alive = true;
    shared.attach(relay, me, demo);
    own?.start();
    const offs: (() => void)[] = [];
    if (relay) {
      inside(true);
      // said again to whoever arrives; what the others say of themselves is kept for the island (one place at a time)
      let hereNow: readonly Who[] = [];
      offs.push(
        relay.onStatus((st) => {
          const was = hereNow, here = st.connected ? st.here : [];
          hereNow = here;
          if (here.some((w) => !was.includes(w))) (inside(true), sayWhere());
          for (const w of ['A', 'B', 'G'] as const) if (w !== me) where.presence(w, here.includes(w));
          othersShown();
        }),
        relay.on((m) => m.who !== me && m.kind === 'tent' && heardTent(m))
      );
    }
    const offDoor = provideDoor(() => (eng?.inView(DOOR[0], 0, FRONT - 2) ? (([x, y]) => ({ x, y }))(eng.client(DOOR[0], 0, FRONT - 2)) : null));
    const fail = () => ((failed = true), doorReady());
    void import('../tent/engine.ts').then(async ({ createTent }) => {
      if (!alive || !canvas) return;
      let e: Tent;
      try {
        e = await madeGL(() => createTent(canvas!, { shell: { url: `${staticUrl('room/shop/shell.glb')}?v=${M.models.shell.v}`, rect: RECT, h: WALL_H, front: FRONT, door: DOOR, side, follow: FOLLOW } }), () => alive && !!canvas);
      } catch {
        return fail();
      }
      try {
        e.resize(insets());
        e.night(nightOf(theme.tod));
        e.villager(viewer, lookOf(viewer));
        e.put(viewer, DOOR_IN, 1);
        e.follow(viewer);
        const twin = url3d('timmy', DIRS.villagers);
        if (twin) for (const id of ['timmy', 'tommy'] as const) e.npc(id, { id: 'timmy', url: twin }, TWINS[id]);
        e.pieces(shown.shown);
        e.firstPerson(fpv ? viewer : null, true);
        e.onDrawn(placeSay);
      } catch (err) {
        logError('error', err);
        e.dispose();
        return fail();
      }
      eng = e;
      othersShown();
      void e.ready.then(() => {
        if (!alive) return;
        walkTo(WALK_IN);
        doorReady();
      });
      hooks();
    }, fail);
    const ro = new ResizeObserver(() => {
      box = canvas?.getBoundingClientRect() ?? null;
      eng?.resize(insets());
    });
    if (canvas) ro.observe(canvas);
    return () => {
      alive = false;
      inside(false);
      for (const f of offs) f();
      ro.disconnect();
      offDoor();
      own?.stop();
      eng?.dispose();
      eng = null;
      delete window.__shop;
    };
  });

  let top = $state<HTMLElement>();
  let foot = $state<HTMLElement>();
  /** What covers the canvas at its top (the back button and my かいがら) and foot (the buttons): the room fits between. */
  function insets() {
    const rc = canvas?.getBoundingClientRect(), tb = top?.getBoundingClientRect(), fb = foot?.getBoundingClientRect();
    if (!rc) return { top: 0, bottom: 0 };
    return { top: tb ? Math.max(0, tb.bottom - rc.top) : 0, bottom: fb ? Math.max(0, rc.bottom - fb.top) : 0 };
  }

  /** The e2e's and the console's hooks (dev builds, test mode, and the logic tier). */
  function hooks() {
    if (!testHooks()) return;
    window.__shop = {
      stats: () => eng?.stats(),
      loading: () => eng?.loading() ?? 0,
      still: () => !!eng?.still(),
      mine: () => eng?.at(viewer),
      walking: () => eng?.walking(viewer),
      /** Someone in here as drawn (null: not here): where, walking. */
      who: (w: Who) => {
        const at = eng?.at(w);
        return at ? { at, walking: !!eng?.walking(w) } : null;
      },
      /** The stock as shown (each piece's code and where) and what has no place (the list has it). */
      shown: () => shown.shown.map((s: Shown) => ({ item: s.item, at: s.at, y: s.y })),
      rest: () => shown.rest,
      /** A piece's top in client px (null: not shown), and a twin's head. */
      piece: (code: string) => {
        const p = eng?.pieceTop(`s-${code}`);
        return p && eng ? eng.client(p[0], p[1] - 2, p[2]) : null;
      },
      twin: (id: 'timmy' | 'tommy') => {
        const h = eng?.headPoint(`n:${id}`);
        return h && eng ? eng.client(h[0], h[1] - 4, h[2]) : null;
      },
      px: (x: number, z: number, y = 0) => eng?.client(x, y, z),
      hit: (cx: number, cy: number) => eng?.hit(cx, cy),
      walkTo: (x: number, z: number) => walkTo([x, z]),
      standable: (x: number, z: number) => standable(walls, [x, z]),
      counter: () => COUNTER_FRONT,
      /** As a tap on the twins (the list on its last tab), wherever my villager stands. */
      talk: () => twinsTalk(),
      orbit: (a: number, p = 0) => eng?.orbit(a, p),
      zoom: (f: number) => eng?.zoom(f)
    };
  }
  // (the line's language follows the app's)
  const line = $derived((void i18n.locale, t(`shop.say.${say.k}`, say.p)));
  const cardOwned = $derived(!!pick && shop.owned.includes(pick));
</script>

<main class="shop" class:night data-shop data-shells={shop.shells} data-exact-taps data-panel={panel ?? undefined}>
  <h1 class="sr-only">{t('shop.title')}</h1>
  <canvas bind:this={canvas} class="room" data-shop-room onpointerdown={onDown} onpointermove={onMove} onpointerup={onUp}
    onpointercancel={onCancel} onwheel={camera.wheel} {@attach camera.attach} aria-label={t('shop.room')}></canvas>
  <div class="top obj-cream" bind:this={top}>
    <NavButton kind="back" text={t('shop.out')} onclick={leave} sfx="self" />
    <!-- my かいがら, the word said (the cowrie is also a kind of 貝 sold here); the list's own title bar says them while
         it's open (one wallet on screen) -->
    {#if !panel}
      <p class="wallet" data-shop-wallet>
        <span class="shell" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={26} eager /></span>
        <b class="num">{t('shop.wallet', { v: formatNum(shop.shells) })}</b>
      </p>
    {/if}
  </div>
  {#if turned && !fpv && !panel}
    <button type="button" class="reset" data-shop-reset data-sfx="tick" aria-label={t('tent.resetView')} onclick={resetView}>
      <RecentreIcon />
    </button>
  {/if}
  <PanHint room="shop" on={!!eng && !fpv && !panel} untilPan />

  {#if !panel}
    {#if signAt}
      <!-- the sign by the door: where to buy and sell, a tap the counter's list (as a tap on them) -->
      <button type="button" class="sign" data-shop-sign data-sfx="self" style:left="{signAt.x}px" style:top="{signAt.y}px" onclick={twinsTalk}>{t('shop.sign')}</button>
    {/if}
    <!-- the twins' line by まめきち in the room (NH's balloon); a tap on it is a tap on them. It goes by itself anyway, so
         no key needed -->
    <div class="say float" class:on={sayShown && !!sayAt} style:left={sayAt ? `${sayAt.x}px` : undefined} style:top={sayAt ? `${sayAt.y}px` : undefined}
      style:--tail={sayAt ? `${sayAt.tail}px` : '0px'}>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
      <p class="kana" role="status" aria-live="polite" data-shop-say={say.k} data-sfx="self" onclick={twinsTalk}>{line}</p>
    </div>
    {#if pick}
      <!-- a piece picked in the room: its name and price, and 買う (or mine already) -->
      <section class="card sheet-copy obj-cream" data-shop-card={pick} aria-label={itemName(pick)}>
        <img class="ic" src={iconUrl(pick)} alt="" width="48" height="48" decoding="async" />
        <div class="what">
          {@render nm(itemName(pick))}
          {#if cardOwned}<span class="price owned-tag">{t('shop.owned')}</span>
          {:else}<span class="price"><span class="mini" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={16} /></span>{formatNum(buyPrice(pick) ?? 0)}</span>{/if}
        </div>
        <button type="button" class="btn small" data-shop-card-buy data-sfx="self" aria-disabled={!!why} onclick={buyPicked}>{t('shop.buy')}</button>
        <NavButton kind="close" data-shop-card-close onclick={() => ((pick = null), hush())} />
      </section>
    {/if}
    <div class="foot" bind:this={foot}>
      <EyeToggle />
    </div>
  {:else}
    <Counter {shop} {stock} bind:tab bind:pick {why} buy={buyPicked} {itemName} onclose={closePanel} />
  {/if}
  {#if failed}<p class="fail" role="alert">{t('shop.fail')}</p>{/if}
</main>

<style>
  /* the room fills the screen; over it the back button and my かいがら, the twins' balloon, a picked piece's card and
     the foot's buttons; the counter's list a cream sheet from the bottom (Counter.svelte) */
  .shop {
    position: relative; max-width: var(--col); margin: 0 auto; height: var(--vh-fill); overflow: hidden; color: var(--c-ink);
    background: #2a1f17; touch-action: none;
  }
  .room { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; -webkit-tap-highlight-color: transparent; }
  .top {
    position: absolute; z-index: 3; left: calc(var(--side) + var(--safe-left)); right: calc(var(--side) + var(--safe-right));
    top: calc(var(--ui-top) + 8px); display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; pointer-events: none;
  }
  .top > :global(*) { pointer-events: auto; }
  .wallet {
    margin: 0; display: inline-flex; align-items: center; gap: 6px; height: var(--hit); padding: 0 14px 0 8px; border-radius: var(--r-pill);
    background: var(--c-cream); box-shadow: 0 var(--lip-h) 0 var(--c-lip); color: var(--c-ink);
  }
  .shell { display: inline-flex; width: 30px; justify-content: center; line-height: 0; }
  .num { font: 700 var(--fs-body)/1 var(--font-ui); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .reset {
    position: absolute; right: calc(var(--side) + var(--safe-right)); top: calc(var(--ui-top) + 64px); z-index: 2;
    width: 52px; height: 52px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    color: var(--c-ink); background: var(--c-card); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
  }

  /* the sign by the door: a little wooden board on a post, standing on the floor (its foot at its point), the world's
     spaced kana; at least a finger's size to tap */
  .sign {
    position: absolute; z-index: 2; translate: -50% calc(-100% - 12px); appearance: none; border: 0; margin: 0; cursor: pointer;
    min-height: 36px; padding: 6px 10px; border-radius: 8px; white-space: nowrap; background: #8A5A2E; color: var(--c-cream);
    box-shadow: inset 0 0 0 2px #7A512A, 0 3px 0 #6A4524, var(--sh-float); font: 700 var(--fs-s)/1.2 var(--font-ui);
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .sign::before { content: ''; position: absolute; left: 50%; top: 100%; width: 6px; height: 12px; translate: -50% 0; background: #7A512A; }
  .sign::after { content: ''; position: absolute; inset: -6px -4px -16px; }
  .sign:active { translate: -50% calc(-100% - 10px); }
  .sign:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

  /* the twins' balloon: over まめきち's head, its tail down to him, a speech balloon's size; hidden (still there for its
     line) when quiet */
  .say.float {
    position: absolute; z-index: 2; left: 70%; top: 40%; translate: -50% calc(-100% - 10px); width: max-content; max-width: 220px;
    opacity: 0; pointer-events: none; transition: opacity .18s;
  }
  .say.float.on { opacity: 1; }
  /* (the balloon takes no tap meant for the room: only its line) */
  .say.float.on p { pointer-events: auto; }
  .say.float p { cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .say p {
    margin: 0; padding: 8px 14px; border-radius: 18px; background: var(--c-cream); color: var(--c-ink);
    box-shadow: 0 3px 0 var(--c-lip), var(--sh-float); font: 700 var(--fs-body)/1.35 var(--font-ui); text-align: center;
  }
  .say.float p { padding: 6px 12px; border-radius: 16px; font-size: var(--fs-s); }
  .say.float p::after {
    content: ''; position: absolute; left: calc(50% + var(--tail)); bottom: -8px; width: 14px; height: 14px; translate: -50% 0; rotate: 45deg;
    background: var(--c-cream); border-radius: 0 0 4px 0;
  }

  /* a piece picked in the room */
  .card {
    position: absolute; z-index: 3; left: calc(var(--side) + var(--safe-left)); right: calc(var(--side) + var(--safe-right));
    bottom: calc(var(--safe-bottom, 0px) + 72px); display: flex; align-items: center; gap: 10px; padding: 10px 10px 10px 12px;
    border-radius: var(--r-card); background: var(--c-cream); box-shadow: 0 var(--lip-h) 0 var(--c-lip), var(--sh-float);
    animation: card-in .16s ease-out;
  }
  @keyframes card-in { from { opacity: 0; translate: 0 8px; } }
  .card .ic { width: 48px; height: 48px; object-fit: contain; flex: none; }
  .card .what { flex: 1 1 auto; min-width: 0; display: grid; gap: 4px; }
  .card .btn { margin: 0; flex: none; }
  .foot {
    position: absolute; z-index: 3; left: calc(var(--safe-left, 0px) + 8px); right: calc(var(--side) + var(--safe-right));
    bottom: calc(var(--safe-bottom, 0px) + 14px); display: flex; align-items: center;
  }

  .card .what :global(.nm) { text-align: left; font: 700 var(--fs-body)/1.25 var(--font-ui); overflow-wrap: anywhere; }
  .price { display: inline-flex; align-items: center; gap: 3px; font: 700 var(--fs-body)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .mini { display: inline-flex; line-height: 0; }
  .owned-tag { font-family: var(--font-ui); color: var(--c-leaf-text); }
  .fail { position: absolute; left: 16px; right: 16px; top: 40%; text-align: center; color: #F5E4BC; font-weight: 700; }
  @media (prefers-reduced-motion: reduce) { .card { animation: none; } }
</style>
