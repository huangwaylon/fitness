<script lang="ts">
  // タヌキ商店: the shop's inside (docs/design.md "The shop"), behind its door on the island. NH's built-up Nook's Cranny
  // in 3D (the rooms' engine, tent/engine.ts, with the shop's own model as its shell: shop/plan.ts), loaded in its own
  // chunk once the screen opens; until its first frame the door's black covers it. まめきち and つぶきち behind the counter
  // (NH's model, static/room/villagers3d/timmy.glb: one for the two), today's stock shown on the stage's tiers, the
  // blue table, by the left wall and on the back wall (plan.ts display: the same on every phone).
  // The finger is the rooms' (rooms/gesture.ts): a tap on the floor walks my villager there; a tap on a piece picks it
  // in place (my villager turns to it, a card with its name, price and 買う: stock.ts buyPiece); a tap on the twins (their
  // model, or their bodies and the counter's top: plan.ts TWINS_BOX, never the floor before it), on their balloon or on
  // the sign by the door (「かう・うるは カウンターで」) is NH's choice box, the only way to the lists (うりたい: the うる list;
  // しなもの: the day's list, its 全部 buying every
  // piece I don't have at once: stock.ts buyAll); a drag turns the camera, a pinch zooms; the doormat or ‹ 島へ goes out.
  // The twins say いらっしゃいませ once I reach the counter (plan.ts atCounter), not at the door; their balloon goes after
  // a few seconds, and never takes a tap meant for the room.
  // The two lists are the old counter panel, now a sheet over the room (its head and tabs pinned, the list scrolling
  // under them): うる (my pocket, everything I caught, found or
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
  import { buyStarts } from '#lib/store/farm.svelte.ts';
  import { CROPS, FARM, isFarmCrop, type Crop } from '#lib/contract/farm.ts';
  import { isLong, words } from './words.ts';
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
  import { COUNTER_FRONT, DOOR, DOOR_IN, FRONT, RECT, SIGN, TWINS, TWINS_BOX, WALL_H, atCounter, blocked, corners, display, inHull, side, standable, walkPath, type Shown } from './plan.ts';
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
  /** The line shows by まめきち for SAY_MS after it changes, or till it's tapped (always on the list's top while that's
   *  open; with their choice box up, till it's answered). */
  let sayOn = $state(false);
  const SAY_MS = 4000;
  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  const speak = (k: string, p?: Record<string, string>) => {
    say = { k, p };
    sayOn = true;
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => (sayOn = false), SAY_MS);
  };
  /** The balloon gone (a tap on it, a card closed): its choice box too. */
  function hush() {
    clearTimeout(sayTimer);
    sayOn = false;
    asking = false;
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
  const testRelay = (): Live | null => {
    const url = hook('relay'), key = hook('key');
    return url && /^wss?:\/\//.test(url) && key ? createLive({ url, key: () => key }) : null;
  };
  // svelte-ignore state_referenced_locally
  const own = demo ? (testRelay() ?? createLocalLive(viewer)) : null;
  const relay: Live | null = demo ? own : LIVE_URL ? liveRelay() : null;
  const inside = (on: boolean) => relay?.send({ kind: 'tent', in: on, sc: 's' });
  const relayNow = () => relay?.serverNow() ?? Date.now();

  /** A tally key's name (the pocket's table: the ずかん's names; a start's the list's own kanji, 「トマトの苗」). */
  const speciesName = (k: string) => {
    const c = /^goods:(\w+)-start$/.exec(k)?.[1];
    return c && isFarmCrop(c) ? startName(c) : bare(t(pocketItem(k)?.name ?? k));
  };
  const startName = (c: Crop) => t(`farm.start.${c}`);
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
    else speak('sell');
  }
  function less(k: string) {
    picks = { ...picks, [k]: Math.max(0, (picks[k] ?? 0) - 1) };
    if (pickedN) speak('offer', { v: formatNum(pickedV) });
    else speak('sell');
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
  // ---- かう's 苗 (docs/farming.md): the six starts, always in stock, a tap one more, − one less; 買う buys them at once,
  // all or none (one group: store/farm.svelte.ts buyStarts)
  let starts = $state<Partial<Record<Crop, number>>>({});
  const startsN = $derived(CROPS.reduce((a, c) => a + (starts[c] ?? 0), 0));
  const startsV = $derived(startsN * FARM.startBuy);
  function moreStart(c: Crop) {
    starts = { ...starts, [c]: ((starts[c] ?? 0) + 1) % 100 };
    cue('tick');
  }
  function lessStart(c: Crop) {
    starts = { ...starts, [c]: Math.max(0, (starts[c] ?? 0) - 1) };
  }
  function buyStartsPicked() {
    if (!startsN) return void cue('boop');
    if (startsV > shop.shells) {
      speak('short', { name: t('shop.starts') });
      return void cue('boop');
    }
    const r = buyStarts(starts);
    if (!r.ok) return void cue('boop');
    cue('buy');
    undoBanner(t('shop.boughtStarts', { n: String(startsN), v: formatNum(startsV) }), r);
    starts = {};
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
    hush();
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
    speak(id === 'sell' ? (shop.pocket.size ? 'sell' : 'empty') : 'stock');
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
  /** The sign by the door's foot (client px), null out of view. */
  let signAt = $state<{ x: number; y: number } | null>(null);
  const SAY_HALF = 110;
  function placeSay() {
    const at = eng?.at(viewer);
    if (!greeted && at && atCounter(at)) {
      greeted = true;
      if (!panel && !asking) speak('hello');
    }
    const h = eng?.headPoint('n:timmy');
    // the sign by the door, where it stands (none out of view)
    signAt = eng && eng.inView(SIGN[0], SIGN[1] + 6, SIGN[2]) ? (([x, y]) => ({ x, y }))(eng.client(SIGN[0], SIGN[1], SIGN[2])) : null;
    // (off the view to a side, the balloon stands at that edge, its tail toward him; behind the eyes, none)
    if (!h || !eng || !canvas || (fpv && !eng.inView(h[0], h[1], h[2]))) return void (sayAt = null);
    const [hx, hy] = eng.client(h[0], h[1] + 2, h[2]), r = canvas.getBoundingClientRect();
    const x = Math.min(r.right - SAY_HALF - 8, Math.max(r.left + SAY_HALF + 8, hx));
    sayAt = { x, y: hy, tail: Math.max(-SAY_HALF + 20, Math.min(SAY_HALF - 20, hx - x)) };
  }
  const sayShown = $derived(!!panel || asking || sayOn);

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
      /** As a tap on the twins (their choice box), wherever my villager stands. */
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
    {#if signAt}
      <!-- the sign by the door: where to buy and sell, a tap the twins' choice box (as a tap on them) -->
      <button type="button" class="sign" data-shop-sign data-sfx="self" style:left="{signAt.x}px" style:top="{signAt.y}px" onclick={twinsTalk}>{t('shop.sign')}</button>
    {/if}
    <!-- the twins' line by まめきち in the room (NH's balloon), and their choice box after a tap on them -->
    <div class="say float" class:on={sayShown && !!sayAt} style:left={sayAt ? `${sayAt.x}px` : undefined} style:top={sayAt ? `${sayAt.y}px` : undefined}
      style:--tail={sayAt ? `${sayAt.tail}px` : '0px'}>
      <!-- (a tap on the line is a tap on them, their choice box; with it up, the line and the box go. It goes by itself
           anyway, so no key needed) -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
      <p role="status" aria-live="polite" data-shop-say={say.k} data-sfx={asking ? 'tick' : 'self'} onclick={() => (asking ? hush() : twinsTalk())}>{line}</p>
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
    <section class="menu sheet-copy" data-shop-panel={panel}>
      <!-- the head (the twins' line, ×) and the tabs stay put; the list scrolls under them, the bar stays at the foot -->
      <header class="pin">
        <div class="head">
          <p class="say docked" role="status" aria-live="polite" data-shop-say={say.k}>{line}</p>
          <NavButton kind="close" data-shop-close onclick={closePanel} />
        </div>
        <Segmented items={[{ id: 'sell', label: t('shop.tab.sell') }, { id: 'buy', label: t('shop.tab.buy') }]} value={tab} label={t('shop.title')} attr="shop-tab" onpick={switchTab} />
      </header>

      {#if tab === 'sell'}
        <div class="list" data-shop-list>
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
                        {@render nm(speciesName(k))}
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
        </div>
        {#if pocket.length}
          <div class="bar">
            <p class="sum" data-shop-offer={pickedV}>{pickedN ? t('shop.offer', { n: String(pickedN), v: formatNum(pickedV) }) : t('shop.pickHint')}</p>
            <button type="button" class="btn small paper" data-shop-all data-sfx="tick" onclick={all}>{t('shop.all')}</button>
            <button type="button" class="btn small" data-shop-sell data-sfx="self" aria-disabled={!pickedN} onclick={sellPicked}>{t('shop.sell')}</button>
          </div>
        {/if}
      {:else}
        <div class="list" data-shop-list>
          <!-- the starts for the fields (docs/farming.md): always in stock, a count each, bought by their own 買う -->
          <h2 class="sec-label">{t('shop.starts')}</h2>
          <ul class="grid" data-shop-starts>
            {#each CROPS as c (c)}
              {@const n = starts[c] ?? 0}
              <li class="tile" class:on={n > 0}>
                <button type="button" class="pickable" data-shop-start={c} data-picked={n} data-sfx="self" aria-label={t('shop.startLabel', { name: startName(c), v: String(FARM.startBuy), c: String(n) })} onclick={() => moreStart(c)}>
                  <span class="ic"><OfficialArt key="finds/{c}-start" size={46} /><span class="tag"><OfficialArt key="finds/{c}" size={20} /></span></span>
                  {@render nm(startName(c))}
                  <span class="price"><span class="mini" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={14} /></span>{FARM.startBuy}</span>
                  {#if n}<span class="count" aria-hidden="true">×{n}</span>{/if}
                </button>
                {#if n}<button type="button" class="less" data-shop-start-less={c} data-sfx="tick" aria-label={t('shop.less', { name: startName(c) })} onclick={() => lessStart(c)}>−</button>{/if}
              </li>
            {/each}
          </ul>
          {#if startsN}
            <div class="starts-bar">
              <p class="sum" data-shop-starts-offer={startsV}>{t('shop.offer', { n: String(startsN), v: formatNum(startsV) })}</p>
              <button type="button" class="btn small" data-shop-starts-buy data-sfx="self" aria-disabled={startsV > shop.shells} onclick={buyStartsPicked}>{t('shop.buy')}</button>
            </div>
          {/if}
          <h2 class="sec-label">{t('shop.today')}</h2>
          {#if stock.length}
            <ul class="grid" data-shop-stock>
              {#each stock as code (code)}{@render piece(code)}{/each}
            </ul>
          {:else if week.model}
            <p class="empty" data-shop-sold-out>{t('shop.soldOut')}</p>
          {/if}
        </div>
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

<!-- a tile's name: two lines, breaking only between its words (words.ts), smaller with a word too long for a line -->
{#snippet nm(name: string)}
  <span class="nm" class:xs={isLong(name, i18n.locale)}>{#each words(name, i18n.locale) as w, i (i)}{#if i}<wbr />{/if}{w}{/each}</span>
{/snippet}

{#snippet piece(code: string)}
  {@const owned = shop.owned.includes(code)}
  <li class="tile" class:on={pick === code || (every && !owned)} class:owned>
    <button type="button" class="pickable" data-shop-item={code} data-price={buyPrice(code)} data-owned={owned} data-sfx="self" aria-pressed={pick === code}
      aria-label={t(owned ? 'shop.itemOwned' : 'shop.itemLabel', { name: itemName(code), v: formatNum(buyPrice(code) ?? 0) })} onclick={() => choose(code)}>
      <span class="ic"><img src={iconUrl(code)} alt="" width="46" height="46" loading="lazy" decoding="async" /></span>
      {@render nm(itemName(code))}
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

  /* the sign by the door: a little wooden board on a post, standing on the floor (its foot at its point), the world's
     spaced kana; at least a finger's size to tap */
  .sign {
    position: absolute; z-index: 2; translate: -50% calc(-100% - 12px); appearance: none; border: 0; margin: 0; cursor: pointer;
    min-height: 36px; padding: 6px 10px; border-radius: 8px; white-space: nowrap; background: #A0703F; color: var(--c-cream);
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
  /* (the balloon takes no tap meant for the room: only its line, which hides it, and its choices) */
  .say.float.on p, .say.float.on .choices { pointer-events: auto; }
  .say.float p { cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .say p, .say.docked {
    margin: 0; padding: 8px 14px; border-radius: 18px; background: var(--c-cream); color: var(--c-ink);
    box-shadow: 0 3px 0 var(--c-lip), var(--sh-float); font: 700 var(--fs-body)/1.35 var(--font-ui); text-align: center;
  }
  .say.float p { padding: 6px 12px; border-radius: 16px; font-size: var(--fs-s); }
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
    bottom: calc(var(--safe-bottom, 0px) + 14px); display: flex; align-items: center;
  }

  /* the sheet: its head and tabs pinned at the top and the bar at the foot, only the list between them scrolls (its own
     scroller, so iOS Safari's rubber band never drags the head off) */
  .menu {
    position: absolute; z-index: 4; left: 0; right: 0; bottom: 0; max-height: 72%; display: flex; flex-direction: column;
    background: var(--c-cream); border-radius: var(--r-card) var(--r-card) 0 0; box-shadow: 0 -4px 0 var(--c-lip); overflow: hidden;
    /* the panel's own controls keep the day's look (fixed cream, ink) at every time of day */
    --text: var(--c-ink); --text-soft: var(--c-ink-soft); --ctl: var(--c-card); --ctl-sel: var(--c-yuzu); --ctl-off: #EADBB8;
    --sh-ctl: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); --sh-ctl-press: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge);
    animation: sheet-in .2s ease-out;
  }
  @keyframes sheet-in { from { translate: 0 24px; opacity: 0; } }
  .pin {
    flex: none; display: grid; gap: 10px; padding: 12px calc(var(--side) + var(--safe-right)) 10px calc(var(--side) + var(--safe-left));
    box-shadow: 0 2px 0 var(--c-lip);
  }
  .head { display: flex; align-items: center; gap: 8px; }
  .list {
    flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; -webkit-overflow-scrolling: touch;
    display: flex; flex-direction: column; gap: 10px; padding: 12px calc(var(--side) + var(--safe-right)) 12px calc(var(--side) + var(--safe-left));
  }
  /* (no bar under it, an empty うる: the list keeps clear of the home indicator) */
  .list:last-child { padding-bottom: var(--pad-foot); }
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
  /* a long name breaks only between its words (its <wbr>s: words.ts), balanced (プラスチックの / ベンチ, not プラスチッ / クの
     ベンチ); a word longer than the line still breaks where it must */
  .nm { font: 700 var(--fs-s)/1.2 var(--font-ui); text-align: center; word-break: keep-all; overflow-wrap: anywhere; text-wrap: balance; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .nm.xs { font-size: var(--fs-xs); }
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
    flex: none; padding: 10px calc(var(--side) + var(--safe-right)) var(--pad-foot) calc(var(--side) + var(--safe-left));
    display: flex; align-items: center; gap: 8px; background: var(--c-cream); box-shadow: 0 -2px 0 var(--c-lip);
  }
  .bar .btn { margin: 0; flex: none; }
  .bar .btn.paper[aria-pressed='true'] { --fill: var(--c-yuzu); }
  .sum { flex: 1 1 auto; min-width: 0; margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  /* the starts' own 買う, under their row */
  .starts-bar { display: flex; align-items: center; gap: 8px; }
  .starts-bar .btn { margin: 0; flex: none; }
  /* a start's seedling (NH's one for all six) wears its crop */
  .ic { position: relative; }
  .tag { position: absolute; right: -6px; bottom: -4px; line-height: 0; }
  .fail { position: absolute; left: 16px; right: 16px; top: 40%; text-align: center; color: #F5E4BC; font-weight: 700; }
  @media (prefers-reduced-motion: reduce) { .pickable:active { transform: none; } .card, .menu { animation: none; } }
</style>
