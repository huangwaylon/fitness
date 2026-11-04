<script lang="ts">
  // くまのもり (docs/design.md "Kuma no mori"): a forest island the players fly to, one to three of them, to gather
  // mushrooms and the five lost pieces while bears hunt them. Its own screen: the island is unloaded while you're here.
  //   A lobby (everyone here says they're ready → a shared countdown), a 4-minute round on one clock (dusk, then night,
  //   then the last flight to the dock), a results card. Each phone moves its own player; the host (the lowest of A, B,
  //   G in the round) runs the bears, the claims and the clock (sim.ts), over link.ts (the POC: tabs of one browser).
  //   Controls: the left side's stick (pushed to its rim: a sprint), the right side's drag turns the camera (it follows
  //   me but never turns by itself), the act button (what's near: hide, climb, push a dead tree over, knock a nest down,
  //   help a partner up, fly home), the seed button (a pitfall behind me). Keys: WASD, Shift, E, Q.
  //   Caught: down, half the basket dropped; a partner holds act to help me up (once a round), else 25 s and I'm flown
  //   home. Banked finds (at the dock, the camp) are everyone's; nothing here gives ベル.
  import { goto } from '$app/navigation';
  import { asset, resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import type { WeekView } from '#lib/types.ts';
  import type { Who } from '#lib/sync/live-protocol.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { url3d } from '../villager3d/manifest.ts';
  import { t } from '#lib/i18n/index.ts';
  import { sound, waspMusic } from '#lib/sound/sound.svelte.ts';
  import { frameRate } from '#lib/store/frameRate.svelte.ts';
  import { at, buildMap, SAFE, type ForestMap, type Item } from './map.ts';
  import { createLocalLink, createRelayLink, type Heard, type Link } from './link.ts';
  import { TUNE, adopt, bearNet, createWorld, handle, step, type World } from './sim.ts';
  import { LIVE_URL } from '#lib/sync/live.ts';
  import { getKey } from '#lib/sync/storage.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { hook } from '../island/devHooks.ts';
  import { actHere, createMe, move, type Act, type Me } from './player.ts';
  import type { BNet, Msg, PNet } from './protocol.ts';
  import type { Forest, PView } from './engine.ts';

  let { view }: { view: WeekView } = $props();

  // svelte-ignore state_referenced_locally
  const me: Who = view.viewer;
  const nameOf = (w: Who) => (w === 'G' ? view.guest.villagerName : view.people[w].villagerName);
  const dir3d = asset('room/villagers3d/' as Parameters<typeof asset>[0]);
  const vidOf = (w: Who) => resolveLook({ villager: w === 'G' ? view.guest.villager : view.people[w].villager, person: w }).id;
  const params = new URLSearchParams(location.search);
  const FPS = frameRate.fps;
  const showStats = params.has('stats');


  // the relay's forest room (two phones); the demo's tabs on a BroadcastChannel (?relay=&key= a test relay)
  const relayUrl = hook('relay') ?? (week.demo ? null : LIVE_URL ? LIVE_URL.replace(/\/room$/, '/expedition') : null);
  const relayKey = hook('key') ?? getKey();
  const link: Link = relayUrl && relayKey ? createRelayLink(relayUrl, relayKey, me) : createLocalLink();
  const online = !!(relayUrl && relayKey);
  let linkUp = $state(!online);
  // ---- the lobby ----
  type Here = { who: Who; name: string; vid: string; ready: boolean; bears: number; at: number };
  let here = $state<Record<string, Here>>({});
  let ready = $state(false);
  let bearsWanted = $state(0);
  const present = $derived((Object.values(here) as Here[]).filter((h) => h.at > Date.now() - 4000 || h.who === me).sort((a, b) => a.who.localeCompare(b.who)));
  const hostOf = (ws: Who[]) => [...ws].sort()[0];

  // ---- the round ----
  type Phase = 'lobby' | 'count' | 'play' | 'done';
  let phase = $state<Phase>('lobby');
  let map: ForestMap | null = null;
  let t0 = 0, host: Who = 'A', nBears = 1;
  let roundPlayers = $state<Who[]>([]);
  let world: World | null = null;
  let my: Me = createMe(0, 30);
  let others = new Map<Who, PNet & { at: number; rx: number; rz: number }>();
  let bears: BNet[] = [], bearDraw: BNet[] = [];
  let items: Item[] = [];
  const taken = new Set<number>(), claimed = new Set<number>();
  let traps: { id: number; x: number; z: number; live: boolean }[] = [];
  const fallen = new Map<number, number>(), nests = new Map<number, { t: number; x: number; z: number }>();
  let bank = $state(0);
  let basket = $state(0);
  let seeds = $state(1);
  let clock = $state(TUNE.round);
  let countdown = $state(3);
  let stamina = $state(1);
  let actLabel = $state<string | null>(null);
  let downLeft = $state(0);
  let myState = $state<PNet['st']>('ok');
  let giriN = $state(0);
  let giriFlash = $state(0);
  let danger = $state(0);
  let ending = $state<{ why: string; total: number } | null>(null);
  let chips = $state<{ who: Who; name: string; st: string; chased: boolean }[]>([]);
  let labels = $state<{ who: Who; x: number; y: number; name: string; down: boolean }[]>([]);
  let holdP = $state(0);
  let stats = $state('');
  let toast = $state<string | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | 0 = 0;
  const say = (s: string) => {
    toast = s;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = null), 1800);
  };

  let canvas = $state<HTMLCanvasElement>();
  let eng: Forest | null = null;
  let failed = $state(false);
  const now = () => link.now();
  const roundT = () => (now() - t0) / 1000;

  // ---- input ----
  let stick = $state<{ id: number; ox: number; oy: number; x: number; y: number } | null>(null);
  let drag: { id: number; x: number; y: number } | null = null;
  let yaw = 0, pitch = 0.42;
  const keys = new Set<string>();
  let actHeld = false, actDownAt = 0, act: Act | null = null;
  /** The stick's ring (px): inside it a walk, its speed by how far; past it, out to the sprint ring (SPRINT_ON × the
   *  ring), a sprint, kept till the thumb comes back inside the ring itself (SPRINT_OFF). The base follows a thumb that
   *  wanders past the sprint ring. */
  const STICK_R = 56, DEAD = 0.15, SPRINT_ON = 1.55, SPRINT_OFF = 1.05, STICK_MAX = 1.75;
  let sprinting = $state(false);

  function onDown(e: PointerEvent) {
    if (phase !== 'play') return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!stick && e.clientX - r.left < r.width * 0.45) stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 };
    else if (!drag) drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: PointerEvent) {
    if (stick && e.pointerId === stick.id) {
      let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy;
      const d = Math.hypot(dx, dy);
      if (d > STICK_R * STICK_MAX) {
        // (the stick's base follows a thumb that wanders off it)
        stick.ox += (dx / d) * (d - STICK_R * STICK_MAX);
        stick.oy += (dy / d) * (d - STICK_R * STICK_MAX);
        dx = e.clientX - stick.ox;
        dy = e.clientY - stick.oy;
      }
      stick.x = dx / STICK_R;
      stick.y = dy / STICK_R;
    } else if (drag && e.pointerId === drag.id) {
      yaw -= (e.clientX - drag.x) * 0.008;
      pitch = Math.max(0.18, Math.min(1.1, pitch + (e.clientY - drag.y) * 0.004));
      drag.x = e.clientX;
      drag.y = e.clientY;
    }
  }
  function onUp(e: PointerEvent) {
    if (stick && e.pointerId === stick.id) stick = null;
    if (drag && e.pointerId === drag.id) drag = null;
  }
  const keyDown = (e: KeyboardEvent) => {
    keys.add(e.key.toLowerCase());
    if (e.key === 'e' || e.key === 'E' || e.key === ' ') actPress(true);
    if (e.key === 'q' || e.key === 'Q') plant();
  };
  const keyUp = (e: KeyboardEvent) => {
    keys.delete(e.key.toLowerCase());
    if (e.key === 'e' || e.key === 'E' || e.key === ' ') actPress(false);
  };

  /** The stick's push in world x/z (the camera's frame: up is away from it), and whether it's a sprint. */
  function input(): { x: number; z: number; run: boolean } {
    let sx = 0, sy = 0, run = false;
    if (stick) {
      const d = Math.hypot(stick.x, stick.y);
      // a dead zone in the middle; the walk's speed by how far inside the ring
      const k = d < DEAD ? 0 : Math.min(1, (d - DEAD) / (1 - DEAD));
      sx = d ? (stick.x / d) * k : 0;
      sy = d ? (stick.y / d) * k : 0;
      sprinting = sprinting ? d > SPRINT_OFF : d >= SPRINT_ON;
      run = sprinting;
    } else sprinting = false;
    if (keys.has('w') || keys.has('arrowup')) sy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) sy += 1;
    if (keys.has('a') || keys.has('arrowleft')) sx -= 1;
    if (keys.has('d') || keys.has('arrowright')) sx += 1;
    if (keys.has('shift')) run = true;
    const l = Math.hypot(sx, sy);
    if (l > 1) [sx, sy] = [sx / l, sy / l];
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    return { x: rx * sx - fx * sy, z: rz * sx - fz * sy, run };
  }

  // ---- what I do ----
  function actPress(down: boolean) {
    if (phase !== 'play') return;
    actHeld = down;
    if (!down) {
      holdP = 0;
      return;
    }
    actDownAt = now();
    const a = act;
    if (!a || a.k === 'revive') return;
    const rt = roundT();
    if (a.k === 'hide') {
      my.st = 'hide';
      my.bush = a.id;
      const b = map!.bushes[a.id];
      my.x = b.x;
      my.z = b.z;
    } else if (a.k === 'unhide') {
      my.st = 'ok';
      const b = map!.bushes[my.bush!];
      // out the side away from the nearest bear
      const near = bears.reduce<BNet | null>((p, c) => (!p || Math.hypot(c.x - b.x, c.z - b.z) < Math.hypot(p.x - b.x, p.z - b.z) ? c : p), null);
      const a2 = near ? Math.atan2(b.x - near.x, b.z - near.z) : my.f;
      my.x = b.x + Math.sin(a2) * 1.3;
      my.z = b.z + Math.cos(a2) * 1.3;
      my.bush = undefined;
    } else if (a.k === 'climb') {
      my.climb = { p: a.p, t0: rt };
      my.st = 'climb';
    } else if (a.k === 'push') link.send({ k: 'push', who: me, id: a.id });
    else if (a.k === 'nest') link.send({ k: 'nest', who: me, id: a.id });
    else if (a.k === 'leave') {
      if (basket) bankNow();
      my.st = 'out';
      link.send({ k: 'home', who: me, why: 'left' });
      say(t('forest.flewHome'));
    }
  }
  function plant() {
    if (phase !== 'play' || my.st !== 'ok' || my.top || seeds <= 0) return;
    seeds--;
    my.seeds = seeds;
    link.send({ k: 'seed', who: me, x: my.x - Math.sin(my.f) * 0.9, z: my.z - Math.cos(my.f) * 0.9 });
  }
  function bankNow() {
    if (!basket) return;
    link.send({ k: 'bank', who: me, n: basket });
    basket = 0;
    my.n = 0;
  }
  function dropHalf(all: boolean) {
    const n = all ? basket : Math.ceil(basket / 2);
    if (n > 0) link.send({ k: 'drop', who: me, x: my.x, z: my.z, n, top: my.top });
    basket -= n;
    my.n = basket;
  }
  function goHome(why: 'caught' | 'bled' | 'time') {
    dropHalf(true);
    my.st = 'home';
    link.send({ k: 'home', who: me, why });
  }

  // ---- the messages ----
  /** The round's host last heard from (its bears), on the shared clock. */
  let hostHeard = 0;
  function onMsg(m: Heard) {
    // a host's message from someone else than the host I know: they took over (I was away), so I'm not it any more
    if ((m.k === 'bear' || m.k === 'host') && m.from && m.from !== me && (phase === 'play' || phase === 'count')) {
      if (m.from !== host) {
        host = m.from;
        world = null;
        claimed.clear();
      }
      hostHeard = now();
    }
    if (m.k === 'hi') {
      here[m.who] = { who: m.who, name: m.name, vid: m.vid, ready: m.ready, bears: m.bears, at: Date.now() };
      return;
    }
    if (m.k === 'bye') {
      delete here[m.who];
      if (m.who === host && m.who !== me && phase === 'play') takeOver();
      return;
    }
    if (m.k === 'start') {
      if (phase === 'lobby' && m.players.includes(me)) begin(m);
      return;
    }
    if (phase !== 'play' && phase !== 'count' && m.k !== 'end') return;
    // the host's world hears everything first
    if (world && me === host) for (const r of handle(world, m)) link.send(r);
    switch (m.k) {
      case 'p':
        if (m.who !== me) {
          const o = others.get(m.who);
          others.set(m.who, { ...m, at: now(), rx: o?.rx ?? m.x, rz: o?.rz ?? m.z });
        }
        break;
      case 'bear':
        if (me !== host) bears = m.b;
        break;
      case 'host':
        break;
      case 'picked':
        taken.add(m.id);
        if (m.who === me) {
          const it = items.find((i) => i.id === m.id);
          if (it?.kind === 'seed') {
            seeds = Math.min(3, seeds + 1);
            my.seeds = seeds;
            say(t('forest.gotSeed'));
          } else {
            basket += m.n;
            my.n = basket;
            if (it?.kind === 'piece') say(t('forest.gotPiece'));
          }
        }
        break;
      case 'pile':
        items = [...items, { id: m.id, x: m.x, z: m.z, kind: 'pile', top: m.top, n: m.n }];
        break;
      case 'banked':
        bank = m.total;
        if (m.who === me) say(t('forest.banked', { n: m.n }));
        break;
      case 'catch':
        if (m.who === me && (my.st === 'ok' || my.st === 'climb' || my.st === 'hide')) {
          my.climb = null;
          if (my.st === 'hide') {
            my.st = 'ok';
            my.bush = undefined;
          }
          const solo = roundPlayers.length === 1;
          if ((solo && my.soloUp) || (!solo && my.revived)) {
            goHome('caught');
            say(t('forest.sentHome'));
          } else {
            dropHalf(false);
            my.st = 'down';
            my.downAt = roundT();
            say(t('forest.caught'));
          }
          waspMusic('stung');
        }
        break;
      case 'revive':
        if (m.who === me && my.st === 'down') {
          my.st = 'ok';
          my.revived = true;
          my.stamina = 0.5;
          say(t('forest.revived', { name: nameOf(m.by) }));
        }
        break;
      case 'trap':
        traps = traps.some((x) => x.id === m.id) ? traps.map((x) => (x.id === m.id ? { ...x, live: m.bear === undefined } : x)) : [...traps, { id: m.id, x: m.x, z: m.z, live: m.bear === undefined }];
        if (m.bear !== undefined) say(t('forest.trapped'));
        break;
      case 'fell':
        fallen.set(m.id, roundT());
        if (m.hit !== undefined) say(t('forest.bonk'));
        break;
      case 'swarm': {
        const tr = map!.trees[map!.nests[m.id].tree];
        const b = m.bear !== undefined ? bears[m.bear] : null;
        nests.set(m.id, { t: roundT(), x: b?.x ?? tr.x, z: b?.z ?? tr.z });
        if (m.who === me) {
          my.stung = roundT() + TUNE.stungS;
          say(t('forest.stung'));
        } else if (b) say(t('forest.swarmed'));
        break;
      }
      case 'giri':
        if (m.who === me) {
          giriN++;
          giriFlash = now();
        }
        break;
      case 'end':
        if (phase === 'play' || phase === 'count') finish(m);
        break;
    }
  }

  /** The host went quiet (its phone locked, its tab closed): the lowest of us still here runs the world from what we
   *  last heard (the bears where they were, what's taken, fallen, planted, banked) and says so. */
  function takeOver() {
    if (!map || world || phase !== 'play') return;
    const nowMs = now();
    const still = roundPlayers.filter((w) => w !== host && (w === me || nowMs - (others.get(w)?.at ?? 0) < 3000));
    if ([...still].sort()[0] !== me) return;
    world = adopt(map, roundPlayers, { t: roundT(), bears, items, taken, traps, fallen: fallen.keys(), nests: nests.keys(), bank });
    host = me;
    claimed.clear();
    link.send({ k: 'host', who: me });
  }

  function begin(m: Extract<Msg, { k: 'start' }>) {
    map = buildMap(m.seed);
    t0 = m.t0;
    roundPlayers = m.players;
    host = m.host;
    nBears = m.bears;
    items = map.items.map((i) => ({ ...i }));
    taken.clear();
    claimed.clear();
    traps = [];
    fallen.clear();
    nests.clear();
    others = new Map();
    bank = 0;
    basket = 0;
    seeds = 1;
    giriN = 0;
    ending = null;
    const k = Math.max(0, roundPlayers.indexOf(me));
    my = createMe(map.spawn[k][0], map.spawn[k][1]);
    yaw = 0;
    world = me === host ? createWorld(map, nBears, roundPlayers) : null;
    hostHeard = m.t0;
    bears = world ? bearNet(world) : [];
    bearDraw = bears.map((b) => ({ ...b }));
    phase = 'count';
    void startEngine();
  }

  async function startEngine() {
    eng?.dispose();
    eng = null;
    await Promise.resolve();
    if (!canvas || !map) return;
    try {
      const { createForest } = await import('./engine.ts');
      const villagers: Partial<Record<Who, string>> = {};
      for (const w of roundPlayers) {
        const u = url3d(vidOf(w), dir3d) ?? url3d('marshal', dir3d);
        if (u) villagers[w] = u;
      }
      const root = asset('room/' as Parameters<typeof asset>[0]).replace(/room\/$/, '');
      eng = await createForest(canvas, map, { base: root, villagers, bear: url3d('beardo', dir3d)!, bears: nBears });
    } catch (e) {
      console.warn('forest: engine', e);
      failed = true;
    }
  }

  function finish(m: Extract<Msg, { k: 'end' }>) {
    // out in the forest at the end: the basket's lost (what's banked is everyone's)
    if (m.why === 'time' && (my.st === 'ok' || my.st === 'hide' || my.st === 'climb' || my.st === 'down') && map && !(at(map, my.x, my.z) & SAFE)) {
      basket = 0;
      my.st = 'home';
    }
    ending = { why: m.why, total: m.total };
    phase = 'done';
    waspMusic('caught');
  }

  // ---- each frame ----
  let raf = 0, lastMs = 0, lastDraw = 0, lastP = 0, lastBear = 0, acc = 0, chasing = false;
  function tick(ms: number) {
    raf = requestAnimationFrame(tick);
    const dt = lastMs ? Math.min(0.1, (ms - lastMs) / 1000) : 0;
    lastMs = ms;
    if (phase === 'count') {
      countdown = Math.max(0, Math.ceil((t0 - now()) / 1000));
      if (now() >= t0) phase = 'play';
    }
    if ((phase === 'play' || phase === 'count') && map) play(dt);
    if (eng && map && ms - lastDraw >= 1000 / FPS - 2) {
      lastDraw = ms;
      draw(ms);
    }
  }

  function play(dt: number) {
    const m = map!;
    linkUp = link.status().up;
    if (phase === 'play' && !world && now() - hostHeard > 2500) takeOver();
    const t = Math.max(0, roundT());
    clock = Math.max(0, TUNE.round - t);
    const live = phase === 'play';
    // me
    const inp = input();
    if (live) move(m, my, inp, inp.run, t, dt, new Set(fallen.keys()));
    stamina = my.stamina;
    myState = my.st;
    // down: bleeding out (a partner's help, or a solo player's own get-up)
    if (my.st === 'down') {
      const solo = roundPlayers.length === 1;
      if (solo && !my.soloUp && t - my.downAt > TUNE.soloUpS) {
        my.st = 'ok';
        my.soloUp = true;
        my.stamina = 0.5;
      } else if (t - my.downAt > TUNE.downS) {
        goHome('bled');
        say(t2('forest.sentHome'));
      }
      downLeft = Math.max(0, (solo ? TUNE.soloUpS : TUNE.downS) - (t - my.downAt));
    }
    // pick up what I walk over; bank in a safe place
    if (live && my.st === 'ok')
      for (const it of items)
        if (!taken.has(it.id) && !claimed.has(it.id) && it.top === my.top && Math.hypot(it.x - my.x, it.z - my.z) < 1.0) {
          claimed.add(it.id);
          link.send({ k: 'pick', who: me, id: it.id });
        }
    if (live && basket > 0 && my.st === 'ok' && !my.top && at(m, my.x, my.z) & SAFE) bankNow();
    // what act would do; held, helping a partner up
    const downs = [...others.values()].filter((o) => o.st === 'down').map((o) => ({ who: o.who as string, x: o.x, z: o.z, top: o.top }));
    act = live ? actHere(m, my, { downs, fallen: new Set(fallen.keys()), nests: new Set(nests.keys()) }) : null;
    actLabel = act ? t2(`forest.act.${act.k}`) : null;
    if (act?.k === 'revive' && actHeld) {
      holdP = Math.min(1, (now() - actDownAt) / 1000 / TUNE.reviveS);
      if (holdP >= 1) {
        link.send({ k: 'revive', who: act.who as Who, by: me });
        actHeld = false;
        holdP = 0;
      }
    } else if (!actHeld) holdP = 0;
    // tell the others where I am (15 a second)
    const nowMs = now();
    const net: PNet = {
      who: me, x: r2(my.x), z: r2(my.z), f: r2(my.f), v: r2(my.v), st: my.st, top: my.top, n: basket, run: my.run,
      ...(my.bush !== undefined && my.st === 'hide' ? { bush: my.bush } : {}),
      ...(my.st === 'down' && roundPlayers.length === 1 && !my.soloUp ? { up: true } : {})
    };
    if (nowMs - lastP > 66) {
      lastP = nowMs;
      link.send({ k: 'p', ...net });
    }
    // the host: the world on a fixed 30 a second, the bears out 15 a second
    if (world && live) {
      acc += dt;
      const players = [net, ...[...others.values()].filter((o) => nowMs - o.at < 1200)];
      while (acc >= 1 / 30) {
        acc -= 1 / 30;
        for (const r of step(world, players, 1 / 30)) link.send(r);
      }
      bears = bearNet(world);
      if (nowMs - lastBear > 66) {
        lastBear = nowMs;
        link.send({ k: 'bear', b: bears, t: world.t });
      }
    }
    // the danger: the nearest bear after me (the vignette, the chase music)
    let dz = 0, after = false;
    for (const b of bears)
      if (b.tg === me && (b.st === 'chase' || b.st === 'tele' || b.st === 'lunge' || b.st === 'alert')) {
        after = true;
        dz = Math.max(dz, 1 - Math.min(1, Math.hypot(b.x - my.x, b.z - my.z) / 15));
      }
    danger = dz;
    if (after !== chasing) {
      chasing = after;
      waspMusic(after ? 'chase' : 'caught');
    }
    heartbeat(dz);
    chips = roundPlayers.filter((w) => w !== me).map((w) => {
      const o = others.get(w);
      return { who: w, name: nameOf(w), st: o?.st ?? 'ok', chased: bears.some((b) => b.tg === w && b.st === 'chase') };
    });
  }
  const t2 = (k: string, p?: Record<string, string | number>) => t(k, p);
  const r2 = (v: number) => Math.round(v * 100) / 100;

  function draw(ms: number) {
    if (!eng || !map) return;
    // the others and the bears eased toward what was last heard (a 15-a-second stream)
    const k = 1 - Math.exp(-(1 / FPS) * 14);
    for (const o of others.values()) {
      o.rx += (o.x - o.rx) * k;
      o.rz += (o.z - o.rz) * k;
    }
    while (bearDraw.length < bears.length) bearDraw.push({ ...bears[bearDraw.length] });
    bearDraw = bears.map((b, i) => {
      const d = bearDraw[i];
      const jump = Math.hypot(b.x - d.x, b.z - d.z) > 3;
      return { ...b, x: jump || world ? b.x : d.x + (b.x - d.x) * k, z: jump || world ? b.z : d.z + (b.z - d.z) * k };
    });
    const players: PView[] = [{ who: me, x: my.x, y: my.y, z: my.z, f: my.f, v: my.v, st: my.st, run: my.run, bush: my.bush }];
    for (const o of others.values()) players.push({ who: o.who, x: o.rx, y: o.top ? 3 : 0, z: o.rz, f: o.f, v: o.v, st: o.st, run: o.run });
    // gone home or flown out: watch someone still out there
    const watch = my.st === 'home' || my.st === 'out' ? (players.find((p) => p.st === 'ok' || p.st === 'hide' || p.st === 'down')?.who ?? me) : me;
    const t = Math.max(0, roundT());
    eng.frame({ me: watch, yaw, pitch, players, bears: bearDraw, items, taken, traps, fallen, nests, t }, ms);
    labels = players.filter((p) => p.who !== me && p.st !== 'home' && p.st !== 'out' && p.st !== 'hide').flatMap((p) => {
      const s = eng!.project(p.x, p.y + 1.7, p.z);
      return s ? [{ who: p.who, x: s.x, y: s.y, name: nameOf(p.who), down: p.st === 'down' }] : [];
    });
    if (showStats) {
      const s = eng.stats();
      stats = `${s.calls} calls · ${(s.tris / 1000).toFixed(0)}k tris · ${s.textures} tex`;
    }
  }

  // ---- the heartbeat (with 効果音 on): faster as the bear closes in ----
  let ctx: AudioContext | null = null, nextBeat = 0;
  function heartbeat(k: number) {
    if (k <= 0.05 || sound.settings.volume <= 0 || !sound.settings.sfx) return;
    ctx ??= new AudioContext();
    const bpm = 70 + 80 * k, at0 = ctx.currentTime;
    if (at0 < nextBeat) return;
    nextBeat = at0 + 60 / bpm;
    for (const [d, g] of [[0, 1], [0.18, 0.6]] as const) {
      const o = ctx.createOscillator(), v = ctx.createGain();
      o.frequency.value = 52;
      v.gain.setValueAtTime(0, at0 + d);
      v.gain.linearRampToValueAtTime(0.5 * g * k * sound.settings.volume, at0 + d + 0.02);
      v.gain.exponentialRampToValueAtTime(0.001, at0 + d + 0.16);
      o.connect(v).connect(ctx.destination);
      o.start(at0 + d);
      o.stop(at0 + d + 0.2);
    }
  }

  // ---- the lobby's hello ----
  function hello() {
    link.send({ k: 'hi', who: me, name: nameOf(me), vid: vidOf(me), ready: ready && phase === 'lobby', bears: bearsWanted });
  }
  function toggleReady() {
    ready = !ready;
    hello();
  }
  /** Everyone here ready: the host (the lowest here) starts the round. */
  function maybeStart() {
    if (phase !== 'lobby' || !ready) return;
    const ws = present.map((h) => h.who);
    if (!present.every((h) => h.ready || h.who === me) || hostOf(ws) !== me) return;
    const n = bearsWanted || Math.max(1, Math.ceil(ws.length / 2));
    link.send({ k: 'start', t0: now() + 3000, seed: (Math.random() * 2 ** 31) | 0, players: ws, bears: n, host: me });
  }
  function again() {
    phase = 'lobby';
    ready = false;
    eng?.dispose();
    eng = null;
    map = null;
    world = null;
    hello();
  }

  onMount(() => {
    // (the demo's test hook: where I am, the bears, a teleport)
    if (params.has('demo'))
      (window as unknown as { __forest: unknown }).__forest = {
        me: () => ({ ...my }), bears: () => bears, phase: () => phase, host: () => host, bank: () => bank, basket: () => basket,
        put: (x: number, z: number) => Object.assign(my, { x, z, top: false, climb: null }),
        wake: () => world?.bears.forEach((b) => Object.assign(b, { st: 'wander', until: 0 }))
      };
    const off = link.on(onMsg);
    hello();
    const hi = setInterval(() => {
      linkUp = link.status().up;
      hello();
      maybeStart();
    }, 700);
    raf = requestAnimationFrame(tick);
    const onResize = () => eng?.resize();
    addEventListener('resize', onResize);
    addEventListener('keydown', keyDown);
    addEventListener('keyup', keyUp);
    return () => {
      link.send({ k: 'bye', who: me });
      off();
      clearInterval(hi);
      cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
      removeEventListener('keydown', keyDown);
      removeEventListener('keyup', keyUp);
      if (chasing) waspMusic('caught');
      eng?.dispose();
      eng = null;
      void ctx?.close();
      link.close();
    };
  });

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const phaseName = $derived(clock <= TUNE.round - TUNE.lastAt ? t('forest.phase.last') : clock <= TUNE.round - TUNE.nightAt ? t('forest.phase.night') : t('forest.phase.dusk'));
</script>

<div class="forest" class:playing={phase !== 'lobby'}>
  <canvas bind:this={canvas} class="stage"></canvas>
  {#if phase !== 'lobby'}
    <div class="touch" onpointerdown={onDown} onpointermove={onMove} onpointerup={onUp} onpointercancel={onUp} role="presentation"></div>
    <div class="vignette" style:opacity={danger * 0.9}></div>
    {#each labels as l (l.who)}
      <div class="tag" class:down={l.down} style:left="{l.x}px" style:top="{l.y}px">{l.name}{l.down ? ' 🛟' : ''}</div>
    {/each}
    <header class="hud">
      <div class="clock" class:last={clock <= TUNE.round - TUNE.lastAt}>{mmss(clock)}<small>{phaseName}</small></div>
      <div class="bag">🧺 {basket} <span class="bank">⛺ {bank}</span></div>
      <div class="chips">
        {#each chips as c (c.who)}
          <span class="chip" class:chased={c.chased} class:off={c.st !== 'ok' && c.st !== 'hide' && c.st !== 'climb'}>{c.name}{c.chased ? ' !' : c.st === 'down' ? ' 💫' : c.st === 'home' || c.st === 'out' ? ' ✈︎' : ''}</span>
        {/each}
      </div>
    </header>
    <div class="stamina"><i style:width="{stamina * 100}%" class:low={stamina < 0.25}></i></div>
    {#if stick}
      {@const sd = Math.hypot(stick.x, stick.y)}
      {@const sk = Math.min(sd, SPRINT_ON) / Math.max(sd, 1e-3)}
      <div class="stickbase" class:sprint={sprinting} class:near={!sprinting && sd > 1} style:left="{stick.ox}px" style:top="{stick.oy}px">
        <b class="sprintring" style:--r="{STICK_R * SPRINT_ON * 2}px"><span>🏃</span></b>
        <i style:transform="translate({stick.x * sk * STICK_R}px, {stick.y * sk * STICK_R}px)"></i>
      </div>
    {/if}
    {#if phase === 'play' && (myState === 'ok' || myState === 'hide')}
      <div class="buttons">
        <button class="seed" aria-disabled={seeds <= 0 || myState !== 'ok'} data-sfx="none" onpointerdown={(e) => (e.stopPropagation(), plant())}>{t('forest.seed')}<b>×{seeds}</b></button>
        <button class="act" class:on={!!actLabel} aria-disabled={!actLabel} data-sfx="none"
          onpointerdown={(e) => (e.stopPropagation(), actPress(true))} onpointerup={() => actPress(false)} onpointerleave={() => actPress(false)}>
          {#if holdP > 0}<span class="hold" style:--p={holdP}></span>{/if}{actLabel ?? '…'}
        </button>
      </div>
    {/if}
    {#if phase === 'count'}<div class="count">{countdown || t('forest.go')}</div>{/if}
    {#if myState === 'down'}
      <div class="downcard">💫 {t(roundPlayers.length === 1 ? 'forest.downSolo' : 'forest.down', { s: Math.ceil(downLeft) })}</div>
    {/if}
    {#if (myState === 'home' || myState === 'out') && phase === 'play'}
      <div class="downcard">✈︎ {t(myState === 'out' ? 'forest.watchingOut' : 'forest.watching')}</div>
    {/if}
    {#key giriFlash}{#if giriFlash}<div class="giri">ギリギリ!</div>{/if}{/key}
    {#if toast}<div class="toast">{toast}</div>{/if}
    {#if showStats}<div class="stats">{stats}</div>{/if}
    {#if failed}<div class="downcard">{t('forest.failed')}</div>{/if}
  {/if}

  {#if phase === 'lobby'}
    <section class="card lobby">
      <h1>🐻 {t('forest.title')}</h1>
      <p>{t('forest.lead')}</p>
      {#if !linkUp}<p class="hint">{t('forest.connecting')}</p>{/if}
      <ul class="who">
        {#each present as h (h.who)}
          <li class:ready={h.who === me ? ready : h.ready}>{h.name}{h.who === me ? ` (${t('forest.you')})` : ''}<span>{(h.who === me ? ready : h.ready) ? t('forest.ready') : t('forest.waiting')}</span></li>
        {/each}
      </ul>
      <label class="bears">{t('forest.bears')}
        <select bind:value={bearsWanted} onchange={hello} data-sfx="tick">
          <option value={0}>{t('forest.bearsAuto')}</option>
          {#each [1, 2, 3, 4] as n (n)}<option value={n}>{n}</option>{/each}
        </select>
      </label>
      <button class="go" class:on={ready} data-sfx="confirm" onclick={toggleReady}>{ready ? t('forest.cancel') : present.length > 1 ? t('forest.readyUp') : t('forest.solo')}</button>
      <p class="hint">{t('forest.howto')}</p>
      <button class="back" data-sfx="back" onclick={() => goto(resolve('/'))}>‹ {t('forest.backIsland')}</button>
    </section>
  {/if}

  {#if phase === 'done' && ending}
    <section class="card">
      <h1>{ending.why === 'wiped' ? t('forest.endWiped') : ending.why === 'time' ? t('forest.endTime') : t('forest.endLeft')}</h1>
      <p class="big">⛺ {t('forest.haul', { n: ending.total })}</p>
      <p>ギリギリ × {giriN}</p>
      <button class="go on" data-sfx="confirm" onclick={again}>{t('forest.again')}</button>
      <button class="back" data-sfx="back" onclick={() => goto(resolve('/'))}>‹ {t('forest.backIsland')}</button>
    </section>
  {/if}
</div>

<style>
  .forest {
    position: fixed;
    inset: 0;
    background: #1d2540;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    font-family: var(--font-body, system-ui);
  }
  .stage,
  .touch {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .forest:not(.playing) .stage {
    filter: blur(2px) brightness(0.6);
  }
  .vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 45%, rgba(120, 10, 0, 0.75) 100%);
    transition: opacity 0.2s;
  }
  .hud {
    position: absolute;
    top: max(10px, env(safe-area-inset-top));
    left: 12px;
    right: 12px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    pointer-events: none;
    color: #fff8e6;
    text-shadow: 0 1px 2px #0008;
  }
  .clock {
    font: 700 26px/1 'Fredoka', system-ui;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #0005;
    padding: 6px 10px;
    border-radius: 14px;
  }
  .clock small {
    font-size: 11px;
    opacity: 0.85;
  }
  .clock.last {
    color: #ffd27a;
    animation: pulse 0.8s infinite;
  }
  .bag {
    font: 700 18px 'Fredoka', system-ui;
    background: #0005;
    padding: 8px 12px;
    border-radius: 14px;
  }
  .bank {
    margin-left: 8px;
    opacity: 0.85;
  }
  .chips {
    margin-left: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;
  }
  .chip {
    background: #0006;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 13px;
  }
  .chip.chased {
    background: #c0392b;
    animation: pulse 0.5s infinite;
  }
  .chip.off {
    opacity: 0.6;
  }
  .stamina {
    position: absolute;
    left: 50%;
    bottom: max(18px, env(safe-area-inset-bottom));
    width: 120px;
    height: 8px;
    margin-left: -60px;
    background: #0006;
    border-radius: 99px;
    pointer-events: none;
  }
  .stamina i {
    display: block;
    height: 100%;
    background: #9fe07a;
    border-radius: 99px;
  }
  .stamina i.low {
    background: #ff8a5c;
  }
  .stickbase {
    position: absolute;
    width: 112px;
    height: 112px;
    margin: -56px 0 0 -56px;
    border-radius: 50%;
    background: #fff2;
    border: 2px solid #fff5;
    pointer-events: none;
  }
  .sprintring {
    position: absolute;
    left: 50%;
    top: 50%;
    width: var(--r);
    height: var(--r);
    margin: calc(var(--r) / -2) 0 0 calc(var(--r) / -2);
    border-radius: 50%;
    border: 2px dashed #fff4;
    opacity: 0;
    transition: opacity 0.15s, border-color 0.15s;
  }
  .sprintring span {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 16px;
  }
  .stickbase.near .sprintring {
    opacity: 1;
  }
  .stickbase.sprint .sprintring {
    opacity: 1;
    border: 3px solid #ff9a3c;
    background: #ff9a3c22;
  }
  .stickbase.sprint i {
    background: #ffb36b;
  }
  .stickbase i {
    position: absolute;
    left: 31px;
    top: 31px;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #fff9;
  }
  .buttons {
    position: absolute;
    right: 16px;
    bottom: max(40px, calc(env(safe-area-inset-bottom) + 24px));
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }
  .buttons button {
    border: none;
    border-radius: 50%;
    color: #4a3a1a;
    font: 700 14px var(--font-body, system-ui);
    box-shadow: 0 3px 0 #0004;
    position: relative;
    overflow: hidden;
  }
  .seed[aria-disabled='true'] {
    opacity: 0.5;
  }
  .seed {
    width: 62px;
    height: 62px;
    background: #f3dcae;
  }
  .seed b {
    display: block;
    font-size: 12px;
  }
  .act {
    width: 86px;
    height: 86px;
    background: #d8d2c2;
    opacity: 0.7;
  }
  .act.on {
    background: #ffd84d;
    opacity: 1;
  }
  .hold {
    position: absolute;
    inset: 0;
    background: conic-gradient(#7fd06a calc(var(--p) * 360deg), transparent 0);
    opacity: 0.6;
  }
  .tag {
    position: absolute;
    transform: translate(-50%, -100%);
    background: #fff8e6;
    color: #4a3a1a;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    pointer-events: none;
  }
  .tag.down {
    background: #ff8a5c;
    color: #fff;
  }
  .count {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font: 700 96px 'Fredoka', system-ui;
    color: #fff8e6;
    text-shadow: 0 4px 8px #0008;
    pointer-events: none;
  }
  .downcard,
  .toast {
    position: absolute;
    left: 50%;
    top: 34%;
    transform: translateX(-50%);
    background: #fff8e6ee;
    color: #4a3a1a;
    padding: 10px 16px;
    border-radius: 16px;
    font-size: 15px;
    text-align: center;
    pointer-events: none;
    max-width: 80vw;
  }
  .toast {
    top: auto;
    bottom: 140px;
    font-size: 14px;
  }
  .giri {
    position: absolute;
    left: 50%;
    top: 22%;
    transform: translateX(-50%);
    font: 700 40px 'Fredoka', system-ui;
    color: #ffd84d;
    text-shadow: 0 3px 0 #a8461a, 0 0 20px #ff7a2a;
    pointer-events: none;
    animation: giri 1.1s forwards;
  }
  .stats {
    position: absolute;
    left: 8px;
    bottom: 8px;
    font: 11px ui-monospace, monospace;
    color: #fff;
    background: #0008;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .card {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(340px, 88vw);
    background: #fff8e6;
    color: #4a3a1a;
    border-radius: 24px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 8px 30px #0006;
  }
  .card h1 {
    margin: 0 0 8px;
    font-size: 22px;
  }
  .card p {
    margin: 6px 0;
    font-size: 14px;
    line-height: 1.5;
  }
  .card .big {
    font: 700 24px 'Fredoka', system-ui;
  }
  .who {
    list-style: none;
    padding: 0;
    margin: 12px 0;
  }
  .who li {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f0e6cc;
    border-radius: 12px;
    margin: 4px 0;
  }
  .who li.ready {
    background: #d6efc4;
  }
  .who li span {
    font-size: 12px;
    opacity: 0.8;
  }
  .bears {
    display: flex;
    justify-content: center;
    gap: 8px;
    align-items: center;
    font-size: 14px;
    margin: 8px 0;
  }
  .go {
    display: block;
    width: 100%;
    margin-top: 10px;
    padding: 12px;
    border: none;
    border-radius: 999px;
    background: #ffd84d;
    color: #4a3a1a;
    font: 700 16px var(--font-body, system-ui);
  }
  .go.on {
    background: #7fd06a;
  }
  .hint {
    font-size: 12px !important;
    opacity: 0.75;
  }
  .back {
    margin-top: 8px;
    background: none;
    border: none;
    color: #8a6a3a;
    font-size: 14px;
  }
  @keyframes pulse {
    50% {
      opacity: 0.55;
    }
  }
  @keyframes giri {
    0% {
      transform: translateX(-50%) scale(0.4);
      opacity: 0;
    }
    20% {
      transform: translateX(-50%) scale(1.15);
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      transform: translateX(-50%) translateY(-30px) scale(1);
      opacity: 0;
    }
  }
</style>
