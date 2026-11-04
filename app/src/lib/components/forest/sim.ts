// くまのもり's world as the host runs it (docs/design.md "Kuma no mori"): the bears (what they see and hear, where
// they go, their lunges and catches), the menace that forces them to back off, the items' claims, the traps, the
// fallen trees, the wasp nests, the bank and the clock. Pure: step() takes the players as their phones last said and
// returns the messages to send. Seconds and metres.
import { HALF, LOG_L, N, SAFE, VALUE, at, bearWalk, cellOf, inGrid, logCells, rng, segDist, sight, type ForestMap, type Item } from './map.ts';
import type { BNet, BState, Msg, PNet } from './protocol.ts';
import type { Who } from '#lib/sync/live-protocol.ts';

export const TUNE = {
  round: 240, nightAt: 90, lastAt: 210, wakeS: 8,
  walk: 2.6, run: 5.0, wade: 1.8, wheeze: 2.0, stamina: 8, regenDelay: 1.0, regen: 0.28, stungSlow: 0.55, stungS: 4,
  noiseWalk: 4, noiseRun: 14,
  wander: 1.5, investigate: 2.2, chase: 4.2, chaseNight: 4.5, alone: 0.2, turn: 2.1,
  vision: 18, cone: (70 * Math.PI) / 180, visionNight: 24, coneNight: (90 * Math.PI) / 180, sense: 2.5,
  catchR: 0.9, snout: 0.8,
  lungeMin: 2, lungeMax: 3.5, lungeCone: (25 * Math.PI) / 180, teleS: 0.45, lungeS: 0.3, lungeV: 10, recoverS: 1.2, lungeCd: 3,
  alertS: 0.6, loseS: 3, searchS: 4, unreachS: 6, eatS: 4, ignoreCatch: 8, ignoreRevive: 3, hideSeenS: 2, digS: 2.5,
  menaceChase: 12, menaceNear: 6, menaceSee: 4, menaceFall: 5, relief: [25, 35] as const, quietS: 40,
  tripV: 3.6, tripS: 1.5, tripR: 2.5,
  stunTrap: 4, stunLog: 3, stunSwarm: 3.5, immune: 8, trapR: 0.9, logHitR: 1.6, nestR: 10,
  downS: 25, reviveS: 2.5, reviveR: 1.5, soloUpS: 6, giriR: 1.5, giriEscapeR: 3, giriMax: 5
};

interface Bear {
  x: number;
  z: number;
  f: number;
  v: number;
  st: BState;
  since: number;
  until: number;
  tg?: Who;
  goal: [number, number] | null;
  seen: { x: number; z: number; t: number } | null;
  menace: number;
  quiet: number;
  immune: number;
  dir: number;
  lungeCd: number;
  tripped: boolean;
  tripUntil: number;
  ignore: Map<Who, number>;
  /** All players ignored till then (after a catch, in relief). */
  calm: number;
  nav: { cell: number; dist: Int16Array; t: number } | null;
  dig?: Who;
  /** Pacing a bank since then (its target out of reach). */
  stuck?: number;
}

export interface World {
  map: ForestMap;
  t: number;
  bears: Bear[];
  items: Item[];
  taken: Set<number>;
  traps: { id: number; x: number; z: number; live: boolean }[];
  fallen: Set<number>;
  logs: Uint8Array;
  nests: Set<number>;
  bank: number;
  players: Who[];
  over: boolean;
  /** Each player as last stepped (its state's changes: hid, climbed, reached safety), and when it hid. */
  prev: Map<Who, PNet>;
  hidAt: Map<Who, number>;
  /** ギリギリ given per player. */
  giri: Map<Who, number>;
  rnd: () => number;
}

export function createWorld(map: ForestMap, bears: number, players: Who[]): World {
  const r = rng(map.seed ^ 0x9e3779b9);
  return {
    map, t: 0, items: map.items.map((i) => ({ ...i })), taken: new Set(), traps: [], fallen: new Set(), logs: new Uint8Array(N * N), nests: new Set(),
    bank: 0, players, over: false, prev: new Map(), hidAt: new Map(), giri: new Map(), rnd: r,
    bears: Array.from({ length: Math.max(1, bears) }, (_, i) => {
      const [x, z] = map.dens[i % map.dens.length];
      return {
        x, z, f: r() * Math.PI * 2, v: 0, st: 'sleep' as BState, since: 0, until: TUNE.wakeS + i * 3, goal: null, seen: null, menace: 0, quiet: 0,
        immune: 0, dir: 0, lungeCd: 0, tripped: false, tripUntil: 0, ignore: new Map(), calm: 0, nav: null
      };
    })
  };
}

const night = (t: number) => t >= TUNE.nightAt;
/** The world taken over from a host gone quiet, as its players last heard it: the bears where they were (searching,
 *  a stunned one still dazed a moment), what's taken, planted, fallen, knocked down and banked. */
export function adopt(
  map: ForestMap, players: Who[],
  o: { t: number; bears: BNet[]; items: Item[]; taken: Iterable<number>; traps: { id: number; x: number; z: number; live: boolean }[]; fallen: Iterable<number>; nests: Iterable<number>; bank: number }
): World {
  const w = createWorld(map, Math.max(1, o.bears.length), players);
  w.t = o.t;
  w.items = o.items.map((i) => ({ ...i }));
  w.taken = new Set(o.taken);
  w.traps = o.traps.map((x) => ({ ...x }));
  for (const id of o.fallen) {
    w.fallen.add(id);
    for (const c of logCells(map.leaners[id])) w.logs[c] = 1;
  }
  w.nests = new Set(o.nests);
  w.bank = o.bank;
  o.bears.forEach((b, i) => {
    const st: BState = b.st === 'sleep' || b.st === 'stun' || b.st === 'trap' ? b.st : 'search';
    Object.assign(w.bears[i], { x: b.x, z: b.z, f: b.f, st, since: o.t, until: o.t + 2, goal: [b.x, b.z] });
  });
  return w;
}

export const bearNet = (w: World): BNet[] =>
  w.bears.map((b) => ({ x: r2(b.x), z: r2(b.z), f: r2(b.f), v: r2(b.v), st: b.st, ...(b.tg ? { tg: b.tg } : {}), ...(b.tripUntil > w.t ? { trip: true } : {}) }));
const r2 = (v: number) => Math.round(v * 100) / 100;

const inSafe = (w: World, p: { x: number; z: number }) => !!(at(w.map, p.x, p.z) & SAFE);
/** A bear could catch it (on the ground, out in the open or on a ladder). */
const catchable = (w: World, p: PNet) => (p.st === 'ok' || p.st === 'climb') && !p.top && !inSafe(w, p);
/** A bear could notice it (up on a cliff too: it sees, it can't reach). */
const noticeable = (w: World, p: PNet) => (p.st === 'ok' || p.st === 'climb') && !inSafe(w, p);
const snout = (b: Bear) => [b.x + Math.sin(b.f) * TUNE.snout, b.z + Math.cos(b.f) * TUNE.snout] as const;
const angDiff = (a: number, b: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};
const yawTo = (ax: number, az: number, bx: number, bz: number) => Math.atan2(bx - ax, bz - az);

function sees(w: World, b: Bear, p: PNet): boolean {
  if (b.calm > w.t || (b.ignore.get(p.who) ?? 0) > w.t || !noticeable(w, p)) return false;
  const d = Math.hypot(p.x - b.x, p.z - b.z);
  if (d < TUNE.sense && !p.top) return true;
  const n = night(w.t), range = n ? TUNE.visionNight : TUNE.vision, cone = n ? TUNE.coneNight : TUNE.cone;
  if (d > range || Math.abs(angDiff(b.f, yawTo(b.x, b.z, p.x, p.z))) > cone / 2) return false;
  return sight(w.map, b.x, b.z, p.x, p.z, !p.top);
}

/** The cell nearest (x, z) a bear can stand in (the bank across from a player in the river, a cliff's foot). */
function nearestWalk(w: World, x: number, z: number): [number, number] {
  const cx = cellOf(x), cz = cellOf(z);
  if (bearWalk(w.map, cx, cz, w.logs)) return [x, z];
  for (let r = 1; r < 14; r++) {
    let best: [number, number] | null = null, bd = 1e9;
    for (let dz = -r; dz <= r; dz++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r || !bearWalk(w.map, cx + dx, cz + dz, w.logs)) continue;
        const d = dx * dx + dz * dz;
        if (d < bd) {
          bd = d;
          best = [cx + dx - HALF + 0.5, cz + dz - HALF + 0.5];
        }
      }
    if (best) return best;
  }
  return [x, z];
}

/** Distances (cells) to the goal over what a bear may walk: 8 ways, no cutting a blocked corner. */
function field(w: World, gx: number, gz: number): Int16Array {
  const dist = new Int16Array(N * N).fill(-1), q = new Int32Array(N * N);
  const g = gz * N + gx;
  let h = 0, tl = 0;
  dist[g] = 0;
  q[tl++] = g;
  while (h < tl) {
    const c = q[h++], cx = c % N, cz = (c / N) | 0, d = dist[c] + 1;
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const nx = cx + dx, nz = cz + dz;
        if (!bearWalk(w.map, nx, nz, w.logs) || dist[nz * N + nx] >= 0) continue;
        if (dx && dz && (!bearWalk(w.map, cx + dx, cz, w.logs) || !bearWalk(w.map, cx, cz + dz, w.logs))) continue;
        dist[nz * N + nx] = d;
        q[tl++] = nz * N + nx;
      }
  }
  return dist;
}

/** The line from a to b crosses only cells a bear may walk. */
function clearWalk(w: World, ax: number, az: number, bx: number, bz: number): boolean {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.4);
  for (let i = 1; i <= n; i++) if (!bearWalk(w.map, cellOf(ax + ((bx - ax) * i) / n), cellOf(az + ((bz - az) * i) / n), w.logs)) return false;
  return true;
}

/** Walk the bear toward (gx, gz) at `speed`, turning at most `turn` rad/s: around the trees, the river by the bridge. */
function steer(w: World, b: Bear, gx: number, gz: number, speed: number, dt: number, turn = TUNE.turn): number {
  let tx = gx, tz = gz;
  if (!clearWalk(w, b.x, b.z, gx, gz)) {
    const gc = cellOf(gz) * N + cellOf(gx);
    if (!b.nav || b.nav.cell !== gc || w.t - b.nav.t > 1.5) {
      if (!b.nav || w.t - b.nav.t > 0.2 || b.nav.cell !== gc) b.nav = { cell: gc, dist: field(w, cellOf(gx), cellOf(gz)), t: w.t };
    }
    const cx = cellOf(b.x), cz = cellOf(b.z), dist = b.nav.dist;
    let best = -1, bd = inGrid(cx, cz) && dist[cz * N + cx] >= 0 ? dist[cz * N + cx] : 1e9;
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, nz = cz + dz;
        if (!inGrid(nx, nz)) continue;
        const v = dist[nz * N + nx];
        if (v >= 0 && v < bd) {
          bd = v;
          best = nz * N + nx;
        }
      }
    if (best >= 0) {
      tx = (best % N) - HALF + 0.5;
      tz = ((best / N) | 0) - HALF + 0.5;
    }
  }
  const want = yawTo(b.x, b.z, tx, tz), d = angDiff(b.f, want);
  b.f += Math.max(-turn * dt, Math.min(turn * dt, d));
  const off = Math.abs(angDiff(b.f, want));
  const v = speed * (off > Math.PI / 2 ? 0.3 : 1 - 0.5 * (off / (Math.PI / 2)));
  const left = Math.hypot(gx - b.x, gz - b.z);
  const stepLen = Math.min(v * dt, left);
  const nx = b.x + Math.sin(b.f) * stepLen, nz = b.z + Math.cos(b.f) * stepLen;
  if (bearWalk(w.map, cellOf(nx), cellOf(nz), w.logs)) [b.x, b.z] = [nx, nz];
  else if (bearWalk(w.map, cellOf(nx), cellOf(b.z), w.logs)) b.x = nx;
  else if (bearWalk(w.map, cellOf(b.x), cellOf(nz), w.logs)) b.z = nz;
  b.v = stepLen / Math.max(dt, 1e-3);
  return left;
}

function setSt(w: World, b: Bear, st: BState, dur = 0) {
  b.st = st;
  b.since = w.t;
  b.until = w.t + dur;
  if (st !== 'chase' && st !== 'alert' && st !== 'tele' && st !== 'lunge' && st !== 'recover') b.tg = undefined;
  if (st === 'chase') {
    b.tripped = false;
    b.stuck = undefined;
  }
}

function wanderGoal(w: World, b: Bear, ps: PNet[]): [number, number] {
  // too quiet: drift toward the nearest player (never onto it)
  if (b.quiet > TUNE.quietS && ps.length) {
    const p = ps.reduce((a, c) => (Math.hypot(c.x - b.x, c.z - b.z) < Math.hypot(a.x - b.x, a.z - b.z) ? c : a));
    b.quiet = 0;
    return nearestWalk(w, p.x + (w.rnd() - 0.5) * 16, p.z + (w.rnd() - 0.5) * 16);
  }
  for (let k = 0; k < 20; k++) {
    const x = b.x + (w.rnd() - 0.5) * 30, z = b.z + (w.rnd() - 0.5) * 30;
    if (Math.abs(x) < HALF - 2 && Math.abs(z) < HALF - 2 && bearWalk(w.map, cellOf(x), cellOf(z), w.logs)) return [x, z];
  }
  return [b.x, b.z];
}

function stun(w: World, b: Bear, st: 'stun' | 'trap', s: number) {
  setSt(w, b, st, s);
  b.immune = w.t + s + TUNE.immune;
  b.v = 0;
}

function giri(w: World, who: Who, out: Msg[]) {
  const n = w.giri.get(who) ?? 0;
  if (n >= TUNE.giriMax) return;
  w.giri.set(who, n + 1);
  out.push({ k: 'giri', who });
}

/** One step of the world (dt s) with the players as last heard: the messages to send. */
export function step(w: World, players: PNet[], dt: number): Msg[] {
  const out: Msg[] = [];
  if (w.over) return out;
  w.t += dt;
  const live = players.filter((p) => w.players.includes(p.who));
  const active = live.filter((p) => p.st === 'ok' || p.st === 'hide' || p.st === 'climb');
  const n = night(w.t);
  const alone = w.players.length > 1 && active.length === 1;

  // the players' changes since the last step: hid (when: the bear may have seen it go in), got away (a near miss)
  for (const p of live) {
    const was = w.prev.get(p.who);
    if (was && was.st !== 'hide' && p.st === 'hide') w.hidAt.set(p.who, w.t);
    if (was) {
      const away = (p.st === 'hide' && was.st !== 'hide') || (p.top && !was.top) || (inSafe(w, p) && !inSafe(w, was)) ||
        (!!(at(w.map, p.x, p.z) & 1) && !(at(w.map, was.x, was.z) & 1));
      if (away && w.bears.some((b) => b.tg === p.who && (b.st === 'chase' || b.st === 'lunge' || b.st === 'tele') && Math.hypot(b.x - p.x, b.z - p.z) < TUNE.giriEscapeR)) giri(w, p.who, out);
    }
    w.prev.set(p.who, p);
  }

  for (let bi = 0; bi < w.bears.length; bi++) {
    const b = w.bears[bi];
    const byWho = (who?: Who) => live.find((p) => p.who === who);
    const seen = live.filter((p) => sees(w, b, p));
    const nearest = (list: PNet[]) => list.reduce<PNet | null>((a, c) => (!a || Math.hypot(c.x - b.x, c.z - b.z) < Math.hypot(a.x - b.x, a.z - b.z) ? c : a), null);
    const chaseV = (n ? TUNE.chaseNight : TUNE.chase) - (alone ? TUNE.alone : 0);

    // the menace: up while it hunts, down while nobody's near; at 100 it backs off a while (not in the last flight)
    const dNear = Math.min(1e9, ...active.map((p) => Math.hypot(p.x - b.x, p.z - b.z)));
    if (b.st === 'chase' || b.st === 'tele' || b.st === 'lunge') b.menace += TUNE.menaceChase * dt;
    else if (dNear < 8) b.menace += TUNE.menaceNear * dt;
    else if (seen.length) b.menace += TUNE.menaceSee * dt;
    else if (dNear > 20) b.menace -= TUNE.menaceFall * dt;
    b.menace = Math.max(0, Math.min(100, b.menace));
    b.quiet = b.menace < 15 ? b.quiet + dt : 0;
    if (b.menace >= 100 && w.t < TUNE.lastAt && b.st !== 'relief' && b.st !== 'stun' && b.st !== 'trap' && b.st !== 'eat' && b.st !== 'lunge') {
      const far = w.map.dens.reduce((a, c) =>
        Math.min(...active.map((p) => Math.hypot(p.x - c[0], p.z - c[1]))) > Math.min(...active.map((p) => Math.hypot(p.x - a[0], p.z - a[1]))) ? c : a);
      setSt(w, b, 'relief', TUNE.relief[0] + w.rnd() * (TUNE.relief[1] - TUNE.relief[0]));
      b.goal = nearestWalk(w, far[0], far[1]);
      b.menace = 30;
      b.calm = b.until;
    }

    // a live trap under it
    if (b.st !== 'trap' && b.st !== 'stun' && w.t >= b.immune)
      for (const tr of w.traps)
        if (tr.live && Math.hypot(tr.x - b.x, tr.z - b.z) < TUNE.trapR) {
          tr.live = false;
          stun(w, b, 'trap', TUNE.stunTrap);
          b.x = tr.x;
          b.z = tr.z;
          out.push({ k: 'trap', id: tr.id, x: tr.x, z: tr.z, bear: bi });
          break;
        }

    const t = w.t;
    switch (b.st) {
      case 'sleep': {
        b.v = 0;
        const heard = active.some((p) => p.run && Math.hypot(p.x - b.x, p.z - b.z) < 8);
        if (t >= b.until || heard) {
          setSt(w, b, 'wander');
          b.goal = wanderGoal(w, b, active);
        }
        break;
      }
      case 'stun':
      case 'trap':
        b.v = 0;
        if (t >= b.until) {
          setSt(w, b, 'search', TUNE.searchS);
          b.goal = [b.x, b.z];
        }
        break;
      case 'eat':
        b.v = 0;
        if (t >= b.until) {
          setSt(w, b, 'wander');
          b.goal = wanderGoal(w, b, active);
        }
        break;
      case 'relief':
        if (!b.goal || steer(w, b, b.goal[0], b.goal[1], TUNE.wander * 1.4, dt, 3) < 1) b.v = 0;
        if (t >= b.until) {
          setSt(w, b, 'wander');
          b.calm = 0;
          b.goal = wanderGoal(w, b, active);
        }
        break;
      case 'alert':
        b.v = 0;
        {
          const p = byWho(b.tg);
          if (p) b.f += Math.max(-6 * dt, Math.min(6 * dt, angDiff(b.f, yawTo(b.x, b.z, p.x, p.z))));
          if (t >= b.until) setSt(w, b, p && sees(w, b, p) ? 'chase' : 'search', p ? 0 : TUNE.searchS);
          if ((b.st as BState) === 'search' && b.seen) b.goal = [b.seen.x, b.seen.z];
        }
        break;
      case 'tele':
        b.v = 0;
        if (t >= b.until) setSt(w, b, 'lunge', TUNE.lungeS);
        break;
      case 'lunge': {
        const s = Math.min(TUNE.lungeV * dt, TUNE.lungeV * (b.until - t + dt));
        const nx = b.x + Math.sin(b.dir) * s, nz = b.z + Math.cos(b.dir) * s;
        if (bearWalk(w.map, cellOf(nx), cellOf(nz), w.logs)) [b.x, b.z] = [nx, nz];
        b.f = b.dir;
        b.v = TUNE.lungeV;
        if (t >= b.until) {
          // a miss: the bear stumbles; whoever it nearly had is told so
          const [sx, sz] = snout(b);
          for (const p of live) if (catchable(w, p) && Math.hypot(p.x - sx, p.z - sz) < TUNE.catchR + TUNE.giriR) giri(w, p.who, out);
          setSt(w, b, 'recover', TUNE.recoverS);
          b.tg = byWho(b.tg) ? b.tg : undefined;
          b.lungeCd = t + TUNE.lungeCd;
        }
        break;
      }
      case 'recover':
        b.v = 0;
        if (t >= b.until) setSt(w, b, b.tg && byWho(b.tg) && sees(w, b, byWho(b.tg)!) ? 'chase' : 'search', TUNE.searchS);
        if ((b.st as BState) === 'search') b.goal = b.seen ? [b.seen.x, b.seen.z] : [b.x, b.z];
        break;
      case 'chase': {
        const p = byWho(b.tg);
        if (!p || !noticeable(w, p) || (b.ignore.get(p.who) ?? 0) > t || b.calm > t) {
          // it hid: seen going in, the bear goes to dig it out
          if (p && p.st === 'hide' && p.bush !== undefined && b.seen && t - b.seen.t < TUNE.hideSeenS + 0.5 && (w.hidAt.get(p.who) ?? -1e9) - b.seen.t < TUNE.hideSeenS) {
            const bu = w.map.bushes[p.bush];
            setSt(w, b, 'sniff', TUNE.digS + 4);
            b.goal = nearestWalk(w, bu.x, bu.z);
            b.dig = p.who;
          } else {
            setSt(w, b, 'search', TUNE.searchS);
            b.goal = b.seen ? [b.seen.x, b.seen.z] : [b.x, b.z];
          }
          break;
        }
        const vis = sees(w, b, p);
        if (vis) b.seen = { x: p.x, z: p.z, t };
        else if (b.seen && t - b.seen.t > TUNE.loseS) {
          setSt(w, b, 'search', TUNE.searchS);
          b.goal = [b.seen.x, b.seen.z];
          break;
        }
        const gx = b.seen?.x ?? p.x, gz = b.seen?.z ?? p.z;
        const reach = !p.top && bearWalk(w.map, cellOf(gx), cellOf(gz), w.logs);
        const d = Math.hypot(p.x - b.x, p.z - b.z);
        if (!b.tripped && d < TUNE.tripR) {
          b.tripped = true;
          b.tripUntil = t + TUNE.tripS;
        }
        if (reach && vis && d >= TUNE.lungeMin && d <= TUNE.lungeMax && t >= b.lungeCd && Math.abs(angDiff(b.f, yawTo(b.x, b.z, p.x, p.z))) < TUNE.lungeCone) {
          b.dir = yawTo(b.x, b.z, p.x, p.z);
          setSt(w, b, 'tele', TUNE.teleS);
          b.tg = p.who;
          break;
        }
        if (!reach) {
          // in the river, up a cliff: pace the nearest bank, then give up on it
          const [nx, nz] = nearestWalk(w, gx, gz);
          steer(w, b, nx, nz, chaseV * 0.8, dt);
          if (Math.hypot(nx - b.x, nz - b.z) < 1.5) {
            b.stuck ??= t;
            if (t - b.stuck > TUNE.unreachS) {
              b.ignore.set(p.who, t + 4);
              setSt(w, b, 'wander');
              b.goal = wanderGoal(w, b, active);
            }
          }
        } else {
          b.stuck = undefined;
          steer(w, b, gx, gz, b.tripUntil > t ? TUNE.tripV : chaseV, dt);
        }
        break;
      }
      case 'sniff':
      case 'search':
      case 'wander': {
        const p = nearest(seen);
        if (p && b.st !== 'sniff') {
          b.seen = { x: p.x, z: p.z, t };
          setSt(w, b, 'alert', TUNE.alertS);
          b.tg = p.who;
          b.dig = undefined;
          break;
        }
        if (p && b.st === 'sniff' && !b.dig) {
          b.seen = { x: p.x, z: p.z, t };
          setSt(w, b, 'alert', TUNE.alertS);
          b.tg = p.who;
          break;
        }
        // heard a footstep (a run carries far)
        if (b.st !== 'sniff' && b.calm <= t) {
          const loud = active.find((q) => q.st === 'ok' && !q.top && Math.hypot(q.x - b.x, q.z - b.z) < (q.run ? TUNE.noiseRun : q.v > 0.5 ? TUNE.noiseWalk : 0));
          if (loud) {
            setSt(w, b, 'sniff', 7);
            b.goal = nearestWalk(w, loud.x + (w.rnd() - 0.5) * 3, loud.z + (w.rnd() - 0.5) * 3);
            break;
          }
        }
        const g = b.goal ?? (b.goal = wanderGoal(w, b, active));
        const v = b.st === 'wander' ? TUNE.wander : TUNE.investigate;
        const left = steer(w, b, g[0], g[1], v, dt, 3);
        if (left < 0.8) {
          b.v = 0;
          if (b.st === 'sniff' && b.dig) {
            // digging out whoever it saw hide here
            const q = byWho(b.dig);
            if (q && q.st === 'hide' && t - b.since > TUNE.digS) {
              b.dig = undefined;
              out.push({ k: 'catch', who: q.who, by: bi });
              setSt(w, b, 'eat', TUNE.eatS);
              b.calm = t + TUNE.ignoreCatch;
            } else if (!q || q.st !== 'hide') b.dig = undefined;
          } else if (b.st === 'wander') b.goal = wanderGoal(w, b, active);
        }
        if (b.st !== 'wander' && t >= b.until) {
          b.dig = undefined;
          setSt(w, b, 'wander');
          b.goal = wanderGoal(w, b, active);
        }
        break;
      }
    }

    // a catch: its snout on someone it may catch (the lunge's, the chase's)
    if (b.st === 'chase' || b.st === 'lunge') {
      const [sx, sz] = snout(b);
      const p = live.find((q) => catchable(w, q) && Math.hypot(q.x - sx, q.z - sz) < TUNE.catchR);
      if (p) {
        out.push({ k: 'catch', who: p.who, by: bi });
        setSt(w, b, 'eat', TUNE.eatS);
        b.calm = t + TUNE.ignoreCatch;
      }
    }
  }

  // the clock, and nobody left on their feet
  if (w.t >= TUNE.round) end(w, 'time', out);
  else if (live.length && !live.some((p) => p.st === 'ok' || p.st === 'hide' || p.st === 'climb')) {
    if (live.some((p) => p.st === 'down')) {
      // (a solo player's own one get-up: its phone says so with `up`)
      if (!live.some((p) => p.st === 'down' && p.up)) end(w, 'wiped', out);
    } else end(w, 'left', out);
  }
  return out;
}

function end(w: World, why: 'time' | 'wiped' | 'left', out: Msg[]) {
  w.over = true;
  out.push({ k: 'end', why, total: w.bank });
}

/** A message to the host: what the world does with it (the messages it sends back). */
export function handle(w: World, m: Msg): Msg[] {
  if (w.over) return [];
  switch (m.k) {
    case 'pick': {
      const it = w.items.find((i) => i.id === m.id);
      if (!it || w.taken.has(m.id)) return [];
      w.taken.add(m.id);
      return [{ k: 'picked', who: m.who, id: m.id, n: it.n ?? VALUE[it.kind] ?? 1 }];
    }
    case 'drop': {
      if (m.n <= 0) return [];
      const id = w.items.length;
      w.items.push({ id, x: m.x, z: m.z, kind: 'pile', top: m.top, n: m.n });
      return [{ k: 'pile', id, x: m.x, z: m.z, n: m.n, top: m.top }];
    }
    case 'bank':
      w.bank += m.n;
      return [{ k: 'banked', who: m.who, n: m.n, total: w.bank }];
    case 'seed': {
      const id = w.traps.length;
      w.traps.push({ id, x: m.x, z: m.z, live: true });
      return [{ k: 'trap', id, x: m.x, z: m.z }];
    }
    case 'push': {
      const l = w.map.leaners[m.id];
      if (!l || w.fallen.has(m.id)) return [];
      w.fallen.add(m.id);
      for (const c of logCells(l)) w.logs[c] = 1;
      const ex = l.x + Math.cos(l.a) * LOG_L, ez = l.z + Math.sin(l.a) * LOG_L;
      const hit = w.bears.findIndex((b) => b.st !== 'stun' && b.st !== 'trap' && segDist(b.x, b.z, l.x, l.z, ex, ez) < TUNE.logHitR);
      const out: Msg[] = [{ k: 'fell', id: m.id, ...(hit >= 0 ? { hit } : {}) }];
      if (hit >= 0) {
        const b = w.bears[hit];
        stun(w, b, 'stun', TUNE.stunLog);
        // (shoved off the log onto the side it came from)
        const [nx, nz] = nearestWalk(w, b.x, b.z);
        b.x = nx;
        b.z = nz;
        const p = w.prev.get(m.who);
        if (p && Math.hypot(p.x - b.x, p.z - b.z) < 5) giri(w, m.who, out);
      }
      // a bear standing in the log's cells steps off it
      for (const b of w.bears)
        if (!bearWalk(w.map, cellOf(b.x), cellOf(b.z), w.logs)) [b.x, b.z] = nearestWalk(w, b.x, b.z);
      return out;
    }
    case 'nest': {
      const nest = w.map.nests[m.id];
      if (!nest || w.nests.has(m.id)) return [];
      w.nests.add(m.id);
      const tr = w.map.trees[nest.tree];
      let best = -1, bd = TUNE.nestR;
      w.bears.forEach((b, i) => {
        const d = Math.hypot(b.x - tr.x, b.z - tr.z);
        if (d < bd && b.st !== 'stun' && b.st !== 'trap') [best, bd] = [i, d];
      });
      if (best >= 0) {
        stun(w, w.bears[best], 'stun', TUNE.stunSwarm);
        return [{ k: 'swarm', id: m.id, bear: best }];
      }
      return [{ k: 'swarm', id: m.id, who: m.who }];
    }
    case 'revive':
      for (const b of w.bears) b.ignore.set(m.who, w.t + TUNE.ignoreRevive);
      return [];
    default:
      return [];
  }
}
