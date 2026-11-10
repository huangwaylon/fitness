<script lang="ts">
  // タヌキ商店: the shop's inside (docs/design.md "The shop"), behind its door on the island. NH's built-up Nook's Cranny
  // in 3D (the rooms' engine, tent/engine.ts, with the shop's own model as its shell: shop/plan.ts), loaded in its own
  // chunk once the screen opens; until its first frame the door's black covers it. まめきち and つぶきち behind the counter
  // (NH's model, static/room/villagers3d/timmy.glb: one for the two), today's stock shown on the stage's tiers, the
  // blue table, by the left wall and on the back wall (plan.ts display: the same on every phone).
  // The finger is the rooms' (rooms/gesture.ts): a tap on the floor walks my villager there; a tap on a piece picks it
  // in place (my villager turns to it, a card with its name, price and 買う: stock.ts buyPiece); a tap on the twins is
  // their greeting and NH's choice box (うりたい: the うる list; しなもの: the day's list, its 全部 buying every piece
  // I don't have at once: stock.ts buyAll); a drag turns the camera, a pinch zooms; the doormat or ‹ 島へ goes out.
  // The two lists are the old counter panel, now a sheet over the room: うる (my pocket, everything I caught, found or
  // picked up less what I sold: model/shop.ts; by its sections, shop/pocket.ts) and かう (the day's stock, never a piece
  // the island had by the day's start: shop/stock.ts). A sell or a buy shows at once with もとに戻す; a bought piece joins
  // my もようがえ. The guest's pocket and かいがら are its own. Never ベル.
  // While I'm in here the others' islands show my villager nowhere, as in the museum and the rooms (the rooms' `tent`
  // presence with `sc: 's'`: store/where.svelte.ts); out of the door they see it there. The others in here are drawn,
  // walking where they walk (the very walk, as the museum's: `tent` with `sc: 's'` and its points; a bare `in` first,
  // an older app's, which drops a shop walk); out of the door, or gone quiet past the presence's grace, they're not.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount, untrack } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import EyeToggle from '../rooms/EyeToggle.svelte';
  import { gestures } from '../rooms/gesture.ts';
  import { nightOf } from '../rooms/speaker.ts';
  import { firstPerson } from '#lib/store/firstPerson.svelte.ts';
  import { iconUrl } from '../tent/items.ts';
  import { bare } from '../kiroku/zukan.ts';
  import { SECTIONS, pocketItem } from './pocket.ts';
  import { findArt } from '../island/beach.ts';
  import { person3, type Dirs } from '../person3d/person3d.ts';
  import { url3d } from '../villager3d/manifest.ts';
  import { lookOf as wornOf } from '#lib/store/look.ts';
  import { art, artUrl, villagerArt } from '#lib/art.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import type { WeekView, Who } from '#lib/types.ts';
  import { sellPrice } from '#lib/contract/shop.ts';
  import { buyPrice } from '#lib/contract/stock.ts';
  import { allOf, buyAll, buyPiece, buyRefusal, stockAt } from './stock.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { sell, undoBanner } from '#lib/store/actions.ts';
  import { layout as islandLayout } from '#lib/store/layout.svelte.ts';
  import { leaveBy } from '../island/doorOut.ts';
  import { hook } from '../island/devHooks.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { where } from '#lib/store/where.svelte.ts';
  import { LIVE_URL, createLive, liveRelay, type Live } from '#lib/sync/live.ts';
  import { createLocalLive } from '#lib/sync/live-local.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { doorReady, provideDoor } from '#lib/ui-state/doorTransition.ts';
  import { drawOff } from '#lib/ui-state/testMode.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { setPlace } from '#lib/sound/sound.svelte.ts';
  import { formatNum, i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/catch.ts';
  import { loadTentNames } from '#lib/i18n/tent.ts';
  import { staticUrl } from '#lib/staticUrl.ts';
  import { COUNTER_FRONT, DOOR, DOOR_IN, FRONT, RECT, TWINS, WALL_H, blocked, display, side, standable, walkPath, type Shown } from './plan.ts';
  import M from './models.json' with { type: 'json' };
  /** The room's default view: nearer than the whole room (too wide for a phone held upright), its middle following my
   *  villager from the stage's left to the counter. */
  const FOLLOW = { k: 0.64, x: [-28, 26] as [number, number], z: [-2.5, -2.5] as [number, number] };
  import type { Look, Tent } from '../tent/engine.ts';
  import type { Pt } from '../tent/grid.ts';
  import type { Pt as WirePt, Relayed } from '#lib/contract/live-protocol.ts';

  let { view }: { view: WeekView } = $props();

  type Tab = 'sell' | 'buy';
  let tab = $state<Tab>('sell');
  /** The counter's list open over the room (null: the room alone). */
  let panel = $state<Tab | null>(null);
  /** うる: how many of each species picked (`kind:id` → n). */
  let picks = $state<Record<string, number>>({});
  /** かう: the piece picked (in the list, or tapped in the room: its card). */
  let pick = $state<string | null>(null);
  /** かう: 全部 picked (every piece of the stock I don't have yet, bought at once: stock.ts buyAll). */
  let every = $state(false);
  /** The twins' line (a key of `shop.say.*` and its params), and whether their choice box is up. */
  let say = $state<{ k: string; p?: Record<string, string> }>({ k: 'hello' });
  let asking = $state(false);
  /** The line shows by まめきち a while after it changes (always on the list's top while that's open). */
  let sayUntil = $state(Date.now() + 4500);
  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  const speak = (k: string, p?: Record<string, string>) => {
    say = { k, p };
    sayUntil = Date.now() + 4500;
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => (sayUntil = 0), 4600);
  };

  const viewer: Who = untrack(() => view.viewer);
  const me = $derived(week.model?.me ?? viewer);
  const shop = $derived(week.model ? shopView(week.model.state, me) : { pocket: new Map<string, number>(), shells: 0, owned: [] as readonly string[] });
  // (as of the day's start: a find or a buy today leaves it as it was)
  const stock = $derived(week.model ? stockAt(week.model.state, week.model.now) : []);
  const night = $derived(theme.tod === 'night' || theme.tod === 'dusk');

  // ---- my presence (the phone's one socket; the demo's two tabs share a channel; ?relay=&key= a test relay) ----
  const demo = !!week.demo;
  const testRelay = (): Live | null => {
    const url = hook('relay'), key = hook('key');
    return url && /^wss?:\/\//.test(url) && key ? createLive({ url, key: () => key }) : null;
  };
  // svelte-ignore state_referenced_locally
  const own = demo ? (testRelay() ?? createLocalLive(viewer)) : null;
  const relay: Live | null = demo ? own : LIVE_URL ? liveRelay() : null;
  const inside = (on: boolean) => relay?.send({ kind: 'tent', in: on, sc: 's' });
  const relayNow = () => relay?.serverNow() ?? Date.now();

  /** A tally key's name and icon (the pocket's table: the ずかん's names, the official icon). */
  const speciesName = (k: string) => bare(t(pocketItem(k)?.name ?? k));
  /** The pieces' names (NH's, i18n/tent.ts: loaded with the screen, the language on screen). */
  let names = $state(0);
  $effect(() => void loadTentNames(i18n.locale).then(() => names++, () => {}));
  const itemName = (code: string) => (void names, t(`tent.item.${code}`));

  // ---- うる
  /** My pocket by うる's sections (pocket.ts SECTIONS), each dearest first. */
  const pocket = $derived([...shop.pocket].flatMap(([k, n]) => {
    const it = pocketItem(k);
    return it ? [{ k, n, p: sellPrice(k) ?? 0, it }] : [];
  }).sort((a, b) => SECTIONS.indexOf(a.it.section) - SECTIONS.indexOf(b.it.section) || b.p - a.p || a.k.localeCompare(b.k)));
  const sections = $derived(SECTIONS.flatMap((s) => {
    const rows = pocket.filter((r) => r.it.section === s);
    return rows.length ? [{ s, rows }] : [];
  }));
  const picked = $derived(Object.entries(picks).filter(([k, n]) => n > 0 && (shop.pocket.get(k) ?? 0) >= n));
  const pickedN = $derived(picked.reduce((a, [, n]) => a + n, 0));
  const pickedV = $derived(picked.reduce((a, [k, n]) => a + n * (sellPrice(k) ?? 0), 0));
  function more(k: string) {
    const max = shop.pocket.get(k) ?? 0;
    const n = picks[k] ?? 0;
    picks = { ...picks, [k]: n >= max ? 0 : n + 1 };
    cue('tick');
    if (pickedN) speak('offer', { v: formatNum(pickedV) });
    else speak('hello');
  }
  function less(k: string) {
    picks = { ...picks, [k]: Math.max(0, (picks[k] ?? 0) - 1) };
    if (pickedN) speak('offer', { v: formatNum(pickedV) });
    else speak('hello');
  }
  function all() {
    picks = Object.fromEntries(pocket.map(({ k, n }) => [k, n]));
    speak('offer', { v: formatNum(pickedV) });
  }
  function sellPicked() {
    if (!pickedN) return void cue('boop');
    const r = sell(new Map(picked));
    if (!r.ok) {
      speak('cant');
      return void cue('boop');
    }
    cue('buy');
    const one = picked.length === 1 ? picked[0] : null;
    undoBanner(one ? t('shop.sold', { name: speciesName(one[0]), n: String(one[1]), v: formatNum(r.shells ?? 0) }) : t('shop.soldMany', { n: String(pickedN), v: formatNum(r.shells ?? 0) }), r);
    picks = {};
    speak('thanks');
  }

  // ---- かう
  /** 全部: what I don't have of today's stock, and its price together. */
  const rest = $derived((void shop, allOf(stock)));
  const short = $derived(Math.max(0, rest.total - shop.shells));
  /** A piece picked (the list's tile, the room's piece): the twins say its price, or why not. `toggle`: picked again in
   *  the list, none. */
  function choose(code: string, toggle = true) {
    every = false;
    pick = toggle && pick === code ? null : code;
    cue('tick');
    if (!pick) return speak('hello');
    const why = buyRefusal(code, stock);
    if (why === 'owned') speak('owned');
    else if (why === 'wallet') speak('short', { name: itemName(code) });
    else speak('price', { name: itemName(code), v: formatNum(buyPrice(code) ?? 0) });
  }
  const why = $derived(every ? (short ? 'wallet' : null) : pick ? (void shop, buyRefusal(pick, stock)) : null);
  /** 全部: picks the lot (the twins say what it comes to, or how many かいがら short), again: none. */
  function pickAll() {
    pick = null;
    if (!rest.items.length) return void cue('boop');
    every = !every;
    cue('tick');
    if (!every) speak('stock');
    else if (short) speak('allShort', { v: formatNum(short) });
    else speak('allOffer', { n: String(rest.items.length), v: formatNum(rest.total) });
  }
  function buyPicked() {
    if (every) return buyEvery();
    if (!pick || why) {
      if (pick) speak(why === 'owned' ? 'owned' : 'short', why === 'owned' ? undefined : { name: itemName(pick) });
      return void cue('boop');
    }
    const r = buyPiece(pick, stock);
    if (!r.ok) return void cue('boop');
    cue('buy');
    undoBanner(t('shop.bought', { name: itemName(pick), v: formatNum(r.price ?? 0) }), r);
    const bought = pick;
    // (a piece bought in the room: its card stays, saying it's mine now)
    if (panel) pick = null;
    eng?.bump(`s-${bought}`);
    speak('thanks');
  }
  function buyEvery() {
    if (short) {
      speak('allShort', { v: formatNum(short) });
      return void cue('boop');
    }
    const r = buyAll(stock);
    if (!r.ok) return void cue('boop');
    cue('buy');
    undoBanner(t('shop.boughtMany', { n: String(r.n ?? 0), v: formatNum(r.total ?? 0) }), r);
    every = false;
    speak('thanks');
  }

  /** The counter's list: うる or かう over the room (its picks cleared). */
  function openPanel(id: Tab) {
    asking = false;
    panel = id;
    switchTab(id);
  }
  function closePanel() {
    panel = null;
    pick = null;
    every = false;
    picks = {};
  }
  function switchTab(id: Tab) {
    tab = id;
    picks = {};
    pick = null;
    every = false;
    speak(id === 'sell' ? (shop.pocket.size ? 'hello' : 'empty') : 'stock');
  }
  // an empty pocket (once the record is in): the list opens on かう, nothing to sell
  let opened = false;
  $effect(() => {
    if (opened || !week.model) return;
    opened = true;
    if (!shop.pocket.size) untrack(() => (tab = 'buy'));
  });

  // ---- the twins: a tap is their greeting and NH's choice box ----
  function twinsTalk() {
    cue('host-tap');
    pick = null;
    asking = true;
    speak('ask');
    sayUntil = Infinity;
    clearTimeout(sayTimer);
    eng?.hop('n:timmy');
    eng?.face(viewer, TWINS.timmy);
  }
  function answer(a: 'sell' | 'buy' | 'none') {
    asking = false;
    if (a === 'none') return speak('bye');
    openPanel(a);
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
    if (m.from && m.s !== undefined && m.ms) {
      const ago = relayNow() - m.s;
      if (ago < m.ms) eng.walk(w, [...(m.via ?? []), m.to], { from: m.from, ago, ms: m.ms });
      else eng.put(w, m.to);
    } else eng.put(w, m.to);
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
  let walking: ReturnType<typeof setTimeout> | undefined;
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
  let sayAt = $state<{ x: number; y: number; tail: number } | null>(null);
  const SAY_HALF = 130;
  function placeSay() {
    const h = eng?.headPoint('n:timmy');
    // (off the view to a side, the balloon stands at that edge, its tail toward him; behind the eyes, none)
    if (!h || !eng || !canvas || (fpv && !eng.inView(h[0], h[1], h[2]))) return void (sayAt = null);
    const [hx, hy] = eng.client(h[0], h[1] + 2, h[2]), r = canvas.getBoundingClientRect();
    const x = Math.min(r.right - SAY_HALF - 8, Math.max(r.left + SAY_HALF + 8, hx));
    sayAt = { x, y: hy, tail: Math.max(-SAY_HALF + 20, Math.min(SAY_HALF - 20, hx - x)) };
  }
  const sayShown = $derived(!!panel || asking || sayUntil > Date.now());

  // ---- the finger: a tap walks or acts in place; a drag turns the camera; two fingers pinch ----
  let turned = $state(false);
  const fpv = $derived(firstPerson.on);
  const fingers = gestures({
    tap: (x, y) => tap(x, y),
    start: () => eng?.moving(true),
    drag(dx, dy) {
      if (!eng) return;
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
    end: () => eng?.moving(false)
  });
  function onDown(e: PointerEvent) {
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
  /** A piece of today's stock shown in the room: picked in place (its card), my villager turned to it. */
  function pickPiece(code: string) {
    const s = shown.shown.find((x) => x.item === code);
    if (s && eng) {
      eng.bump(s.id);
      eng.face(viewer, s.at);
    }
    asking = false;
    choose(code, false);
  }
  function tap(cx: number, cy: number) {
    if (!eng) return;
    const h = eng.hit(cx, cy);
    if (!h) return void cue('boop');
    if (h.kind === 'npc') return twinsTalk();
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
    asking = false;
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
    void import('../tent/engine.ts').then(({ createTent }) => {
      if (!alive || !canvas) return;
      let e: Tent;
      try {
        e = createTent(canvas, { shell: { url: `${staticUrl('room/shop/shell.glb')}?v=${M.models.shell.v}`, rect: RECT, h: WALL_H, front: FRONT, door: DOOR, side, follow: FOLLOW } });
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
        console.warn('shop', err);
        e.dispose();
        return fail();
      }
      eng = e;
      othersShown();
      void e.ready.then(() => {
        if (!alive) return;
        walkTo([DOOR_IN[0] + 8, DOOR_IN[1] - 12]);
        doorReady();
      });
      hooks();
    }, fail);
    const ro = new ResizeObserver(() => eng?.resize(insets()));
    if (canvas) ro.observe(canvas);
    return () => {
      alive = false;
      clearTimeout(walking);
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

  /** The e2e's and the console's hooks (dev builds, ?demo, and the logic tier). */
  function hooks() {
    if (!import.meta.env.DEV && !new URLSearchParams(location.search).has('demo') && !drawOff()) return;
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
    onpointercancel={onCancel} onwheel={onWheel} aria-label={t('shop.room')}></canvas>
  <div class="top" bind:this={top}>
    <NavButton kind="back" text={t('shop.out')} onclick={leave} sfx="self" />
    <p class="wallet" data-shop-wallet aria-label={t('shop.wallet', { v: formatNum(shop.shells) })}>
      <span class="shell" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={26} eager /></span>
      <b class="num" aria-hidden="true">{formatNum(shop.shells)}</b>
    </p>
  </div>
  {#if turned && !fpv && !panel}
    <button type="button" class="reset" data-shop-reset data-sfx="tick" aria-label={t('tent.resetView')} onclick={resetView}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9" /><path d="M10 19v-5h4v5" /></svg>
    </button>
  {/if}

  {#if !panel}
    <!-- the twins' line by まめきち in the room (NH's balloon), and their choice box after a tap on them -->
    <div class="say float" class:on={sayShown && !!sayAt} style:left={sayAt ? `${sayAt.x}px` : undefined} style:top={sayAt ? `${sayAt.y}px` : undefined}
      style:--tail={sayAt ? `${sayAt.tail}px` : '0px'}>
      <p role="status" aria-live="polite" data-shop-say={say.k}>{line}</p>
      {#if asking}
        <div class="choices" data-shop-choices>
          <button type="button" data-shop-choice="sell" data-sfx="tick" onclick={() => answer('sell')}>{t('shop.choice.sell')}</button>
          <button type="button" data-shop-choice="buy" data-sfx="tick" onclick={() => answer('buy')}>{t('shop.choice.buy')}</button>
          <button type="button" data-shop-choice="none" data-sfx="back" onclick={() => answer('none')}>{t('shop.choice.none')}</button>
        </div>
      {/if}
    </div>
    {#if pick}
      <!-- a piece picked in the room: its name and price, and 買う (or mine already) -->
      <section class="card sheet-copy" data-shop-card={pick} aria-label={itemName(pick)}>
        <img class="ic" src={iconUrl(pick)} alt="" width="48" height="48" decoding="async" />
        <div class="what">
          <b class="nm">{itemName(pick)}</b>
          {#if cardOwned}<span class="price owned-tag">{t('shop.owned')}</span>
          {:else}<span class="price"><span class="mini" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={16} /></span>{formatNum(buyPrice(pick) ?? 0)}</span>{/if}
        </div>
        <button type="button" class="btn small" data-shop-card-buy data-sfx="self" aria-disabled={!!why} onclick={buyPicked}>{t('shop.buy')}</button>
        <NavButton kind="close" data-shop-card-close onclick={() => ((pick = null), speak('hello'))} />
      </section>
    {/if}
    <div class="foot" bind:this={foot}>
      <div class="eye-dock"><EyeToggle /></div>
      <button type="button" class="btn small paper" data-shop-open="sell" data-sfx="open" onclick={() => openPanel('sell')}>{t('shop.open.sell')}</button>
      <button type="button" class="btn small" data-shop-open="buy" data-sfx="open" onclick={() => openPanel('buy')}>{t('shop.open.buy')}</button>
    </div>
  {:else}
    <section class="menu sheet-copy" data-shop-panel={panel}>
      <div class="head">
        <p class="say docked" role="status" aria-live="polite" data-shop-say={say.k}>{line}</p>
        <NavButton kind="close" data-shop-close onclick={closePanel} />
      </div>
      <Segmented items={[{ id: 'sell', label: t('shop.tab.sell') }, { id: 'buy', label: t('shop.tab.buy') }]} value={tab} label={t('shop.title')} attr="shop-tab" onpick={switchTab} />

      {#if tab === 'sell'}
        {#if pocket.length}
          <div class="pocket" data-shop-pocket>
            {#each sections as { s, rows } (s)}
              <h2 class="sec-label" data-shop-sec={s}>{t(`shop.sec.${s}`)}</h2>
              <ul class="grid">
                {#each rows as { k, n, p, it } (k)}
                  {@const c = picks[k] ?? 0}
                  <li class="tile" class:on={c > 0}>
                    <button type="button" class="pickable" data-shop-catch={k} data-n={n} data-picked={c} data-sfx="self"
                      aria-label={t('shop.catchLabel', { name: speciesName(k), n: String(n), v: String(p), c: String(c) })} onclick={() => more(k)}>
                      <span class="ic"><OfficialArt key={it.art} size={46} /></span>
                      <span class="nm">{speciesName(k)}</span>
                      <span class="price"><span class="mini" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={14} /></span>{formatNum(p)}</span>
                      <span class="count" aria-hidden="true">{c ? `${c}/${n}` : `×${n}`}</span>
                    </button>
                    {#if c}<button type="button" class="less" data-shop-less={k} data-sfx="tick" aria-label={t('shop.less', { name: speciesName(k) })} onclick={() => less(k)}>−</button>{/if}
                  </li>
                {/each}
              </ul>
            {/each}
          </div>
        {:else}
          <p class="empty" data-shop-empty>{t('shop.emptyPocket')}</p>
        {/if}
        {#if pocket.length}
          <div class="bar">
            <p class="sum" data-shop-offer={pickedV}>{pickedN ? t('shop.offer', { n: String(pickedN), v: formatNum(pickedV) }) : t('shop.pickHint')}</p>
            <button type="button" class="btn small paper" data-shop-all data-sfx="tick" onclick={all}>{t('shop.all')}</button>
            <button type="button" class="btn small" data-shop-sell data-sfx="self" aria-disabled={!pickedN} onclick={sellPicked}>{t('shop.sell')}</button>
          </div>
        {/if}
      {:else}
        <h2 class="sec-label">{t('shop.today')}</h2>
        {#if stock.length}
          <ul class="grid" data-shop-stock>
            {#each stock as code (code)}{@render piece(code)}{/each}
          </ul>
        {:else if week.model}
          <p class="empty" data-shop-sold-out>{t('shop.soldOut')}</p>
        {/if}
        <div class="bar">
          <p class="sum" data-shop-pick={every ? 'all' : (pick ?? '')} data-shop-total={every ? rest.total : null}>
            {every ? t('shop.offer', { n: String(rest.items.length), v: formatNum(rest.total) })
              : pick ? `${itemName(pick)} · ${formatNum(buyPrice(pick) ?? 0)}`
              : stock.length && !rest.items.length ? t('shop.allOwned') : t('shop.buyHint')}
          </p>
          {#if stock.length}
            <button type="button" class="btn small paper" data-shop-buy-all data-sfx="self" aria-pressed={every} aria-disabled={!rest.items.length}
              aria-label={t('shop.buyAll')} onclick={pickAll}>{t('shop.all')}</button>
          {/if}
          <button type="button" class="btn small" data-shop-buy data-sfx="self" aria-disabled={!(pick || every) || !!why} onclick={buyPicked}>{t('shop.buy')}</button>
        </div>
      {/if}
    </section>
  {/if}
  {#if failed}<p class="fail" role="alert">{t('shop.fail')}</p>{/if}
</main>

{#snippet piece(code: string)}
  {@const owned = shop.owned.includes(code)}
  <li class="tile" class:on={pick === code || (every && !owned)} class:owned>
    <button type="button" class="pickable" data-shop-item={code} data-price={buyPrice(code)} data-owned={owned} data-sfx="self" aria-pressed={pick === code}
      aria-label={t(owned ? 'shop.itemOwned' : 'shop.itemLabel', { name: itemName(code), v: formatNum(buyPrice(code) ?? 0) })} onclick={() => choose(code)}>
      <span class="ic"><img src={iconUrl(code)} alt="" width="46" height="46" loading="lazy" decoding="async" /></span>
      <span class="nm">{itemName(code)}</span>
      {#if owned}<span class="price owned-tag">{t('shop.owned')}</span>
      {:else}<span class="price"><span class="mini" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={14} /></span>{formatNum(buyPrice(code) ?? 0)}</span>{/if}
    </button>
  </li>
{/snippet}

<style>
  /* the room fills the screen; over it the back button and my かいがら, the twins' balloon, a picked piece's card and
     the foot's buttons; the counter's list a cream sheet from the bottom (fixed cream at every time of day, ink text: a
     game object, as the HUD's) */
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
  .num { font: 700 var(--fs-talk)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .reset {
    position: absolute; right: calc(var(--side) + var(--safe-right)); top: calc(var(--ui-top) + 64px); z-index: 2;
    width: 52px; height: 52px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    color: var(--c-ink); background: var(--c-card); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
  }
  .reset svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }

  /* the twins' balloon: over まめきち's head, its tail down to him; hidden (still there for its line) when quiet */
  .say.float {
    position: absolute; z-index: 2; left: 70%; top: 40%; translate: -50% calc(-100% - 10px); width: max-content; max-width: 260px;
    opacity: 0; pointer-events: none; transition: opacity .18s;
  }
  .say.float.on { opacity: 1; }
  /* (the balloon never takes a tap meant for the room: only its choices do) */
  .say.float.on .choices { pointer-events: auto; }
  .say p, .say.docked {
    margin: 0; padding: 8px 14px; border-radius: 18px; background: var(--c-cream); color: var(--c-ink);
    box-shadow: 0 3px 0 var(--c-lip), var(--sh-float); font: 700 var(--fs-body)/1.35 var(--font-ui); text-align: center;
  }
  .say.float p::after {
    content: ''; position: absolute; left: calc(50% + var(--tail)); bottom: -8px; width: 14px; height: 14px; translate: -50% 0; rotate: 45deg;
    background: var(--c-cream); border-radius: 0 0 4px 0;
  }
  .say.float:has(.choices) p::after { display: none; }
  .choices { display: grid; gap: 6px; margin-top: 8px; justify-items: end; }
  .choices button {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); padding: 0 16px; border-radius: var(--r-pill);
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 3px 0 var(--c-lip); font: 700 var(--fs-body)/1 var(--font-ui);
  }
  .choices button:focus-visible { outline: 3px solid var(--c-ink); outline-offset: 2px; }

  /* a piece picked in the room */
  .card {
    position: absolute; z-index: 3; left: calc(var(--side) + var(--safe-left)); right: calc(var(--side) + var(--safe-right));
    bottom: calc(var(--safe-bottom, 0px) + 72px); display: flex; align-items: center; gap: 10px; padding: 10px 10px 10px 12px;
    border-radius: var(--r-card); background: var(--c-cream); box-shadow: 0 var(--lip-h) 0 var(--c-lip), var(--sh-float);
    --text: var(--c-ink); --text-soft: var(--c-ink-soft); animation: card-in .16s ease-out;
  }
  @keyframes card-in { from { opacity: 0; translate: 0 8px; } }
  .card .ic { width: 48px; height: 48px; object-fit: contain; flex: none; }
  .card .what { flex: 1 1 auto; min-width: 0; display: grid; gap: 4px; }
  .card .nm { font: 700 var(--fs-body)/1.25 var(--font-ui); overflow-wrap: anywhere; }
  .card .btn { margin: 0; flex: none; }
  .foot {
    position: absolute; z-index: 3; left: calc(var(--safe-left, 0px) + 8px); right: calc(var(--side) + var(--safe-right));
    bottom: calc(var(--safe-bottom, 0px) + 14px); display: flex; align-items: center; gap: 8px; justify-content: flex-end;
  }
  .foot .btn { margin: 0; }
  .eye-dock { margin-right: auto; }

  .menu {
    position: absolute; z-index: 4; left: 0; right: 0; bottom: 0; max-height: 72%; display: flex; flex-direction: column; gap: 10px;
    padding: 12px var(--side) 0; background: var(--c-cream); border-radius: var(--r-card) var(--r-card) 0 0;
    box-shadow: 0 -4px 0 var(--c-lip); overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y;
    /* the panel's own controls keep the day's look (fixed cream, ink) at every time of day */
    --text: var(--c-ink); --text-soft: var(--c-ink-soft); --ctl: var(--c-card); --ctl-sel: var(--c-yuzu); --ctl-off: #EADBB8;
    --sh-ctl: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); --sh-ctl-press: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge);
    animation: sheet-in .2s ease-out;
  }
  @keyframes sheet-in { from { translate: 0 24px; opacity: 0; } }
  .head { display: flex; align-items: center; gap: 8px; }
  .say.docked { flex: 1 1 auto; text-align: left; background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge); }
  .pocket { display: flex; flex-direction: column; gap: 10px; }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
  .tile { position: relative; }
  .pickable {
    appearance: none; border: 0; cursor: pointer; width: 100%; min-height: 118px; padding: 10px 6px 8px; border-radius: var(--r-btn);
    display: grid; justify-items: center; align-content: start; gap: 4px; background: var(--c-card); color: var(--c-ink);
    box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .pickable:active { transform: translateY(2px); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge); }
  .pickable:focus-visible { outline: 3px solid var(--c-ink); outline-offset: 2px; }
  .on .pickable { background: var(--c-yuzu); }
  .owned .pickable { background: #F1E6CC; }
  .owned .ic { opacity: .55; }
  .ic { width: 46px; height: 46px; display: grid; place-items: center; line-height: 0; }
  .ic img { width: 46px; height: 46px; object-fit: contain; }
  /* a long name breaks between its kana where it must, balanced (アウトド / アベンチ, not アウトドアベン / チ) */
  .nm { font: 700 var(--fs-s)/1.2 var(--font-ui); text-align: center; word-break: normal; overflow-wrap: anywhere; text-wrap: balance; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .card .nm { text-align: left; font-size: var(--fs-body); }
  .price { display: inline-flex; align-items: center; gap: 3px; font: 700 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .card .price { font-size: var(--fs-body); }
  .mini { display: inline-flex; line-height: 0; }
  .owned-tag { font-family: var(--font-ui); color: var(--c-leaf-text); }
  .count {
    position: absolute; top: 6px; right: 8px; padding: 2px 6px; border-radius: var(--r-pill); background: var(--c-paper);
    font: 700 var(--fs-s)/1.1 var(--font-num); font-variant-numeric: tabular-nums;
  }
  .on .count { background: var(--c-cream); }
  .less {
    position: absolute; top: -8px; left: -6px; width: 32px; height: 32px; border-radius: 50%; border: 0; cursor: pointer;
    background: var(--c-card); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge);
    font: 700 var(--fs-talk)/1 var(--font-ui);
  }
  .less::after { content: ''; position: absolute; inset: -6px; }
  .empty { margin: 18px 4px; text-align: center; color: var(--c-ink-soft); font-weight: 700; }
  .bar {
    position: sticky; bottom: 0; margin: auto calc(-1 * var(--side)) 0; padding: 10px var(--side) var(--pad-foot);
    display: flex; align-items: center; gap: 8px; background: var(--c-cream); box-shadow: 0 -2px 0 var(--c-lip);
  }
  .bar .btn { margin: 0; flex: none; }
  .bar .btn.paper[aria-pressed='true'] { --fill: var(--c-yuzu); }
  .sum { flex: 1 1 auto; min-width: 0; margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .fail { position: absolute; left: 16px; right: 16px; top: 40%; text-align: center; color: #F5E4BC; font-weight: 700; }
  @media (prefers-reduced-motion: reduce) { .pickable:active { transform: none; } .card, .menu { animation: none; } }
</style>
