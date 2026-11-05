// The shared island's day (docs/backend.md#shared-world): what both people did to the world today, folded from the
// shared-world intents (live-protocol.ts: catch, pick, put, shake, world, walk) in the relay's order. Both phones fold
// the same intents (the relay's replay, the partner's live ones, my own as I send them, the sheet's day rows) into
// the same day, so they show the same island: what is caught or picked up is gone on both, a tree's drops lie on both,
// each villager stands where its person sent it. Pure: no clock, no storage (store/world.svelte.ts keeps it).
import { claimOf, tokyoDay, type Drop, type How, type Intent, type Pt, type Target, type Who } from '../contract/live-protocol.ts';
import { ISLAND_MAX } from '#lib/contract/island.ts';
import { fnv1a } from '#lib/random.ts';

type Walk = Extract<Intent, { kind: 'walk' }>;

/** One change to the day: an intent with who made it and when (the relay's clock; my own: my serverNow() at sending). */
export type DayEvent = Extract<Intent, { kind: 'catch' | 'pick' | 'put' | 'shake' | 'world' | 'walk' | 'act' }> & { who: Who; t: number };

/** A claimed critter or thing: who got it, when, what it was (and for a critter how and where). */
export interface Claim {
  who: Who;
  t: number;
  what: string;
  how?: How;
  at?: Pt;
}

/** Something put down in the world (a landed present, a bug out of a bush), until it's picked up or caught. */
export interface Put {
  id: string;
  what: string;
  at: Pt;
  who: Who;
  t: number;
}

/** A tree's shake (its outcome), in order. `t`: when the shaker's phone shook it (the intent's `at`, else the relay's
 *  time), the same on both phones; `row`: known from the sheet's day row only (the relay's own may still come). */
export interface Shake {
  tree: string;
  drop: Drop;
  who: Who;
  t: number;
  row?: boolean;
}

export interface WorldDay {
  /** The Tokyo day (days since the epoch: live-protocol tokyoDay). */
  day: number;
  /** `catch:<id>` / `pick:<id>` (claimOf) → the first claim. */
  claims: Record<string, Claim>;
  /** What was put down today, by id (a pick of it takes it away: see `taken`). */
  puts: Record<string, Put>;
  /** Every shake of the day, in order (a tree's branches and nests derive from them: island/treeShake.ts). */
  shakes: Shake[];
  /** The flowers watered today (world.ts FLOWERS ids), by whom. */
  watered: Record<string, Who>;
  /** Wishes on shooting stars, each for the morning (`YYYY-MM-DD`) its fragment comes: who wished how often. */
  wishes: Record<string, Partial<Record<Who, number>>>;
  /** The wishes folded (`who:t:morning`), so a replay counts none twice. */
  wished: string[];
  /** Sleeping visitors woken today (`gulliver`), by whom: awake on both phones for the day. */
  woke: Record<string, Who>;
  /** Each person's last walk: where their villager is going (or stands), the very walk when it came with it. */
  walks: Partial<Record<Who, { to: Target; t: number } & Partial<Omit<Walk, 'kind' | 'to' | 'at'>>>>;
}

export const emptyDay = (day: number): WorldDay => ({ day, claims: {}, puts: {}, shakes: [], watered: {}, wishes: {}, wished: [], walks: {}, woke: {} });

/** What folding one event did: `fresh` it changed the day (not a repeat); `beat` an earlier claim of the same thing
 *  by the other person that this one overrides (the relay heard theirs first: I lost the race), or null. */
export interface Applied {
  fresh: boolean;
  beat: Claim | null;
}

const SAME: Applied = { fresh: false, beat: null };

/**
 * Fold `e` into `d` (mutating it). `me`: whose phone this is. First wins, in the relay's order, with one exception
 * that makes it so: a partner's claim of something I claimed too means the relay heard theirs first (it would have
 * dropped theirs otherwise), so theirs replaces mine and comes back as `beat`. A repeat (same who and claim, a replay
 * of what I have already) changes nothing. An event of another day is ignored.
 */
export function apply(d: WorldDay, e: DayEvent, me: Who | null, row = false): Applied {
  if (tokyoDay(e.t) !== d.day) return SAME;
  const c = claimOf(e);
  if (e.kind === 'catch' || e.kind === 'pick') {
    if (!c) return SAME;
    const was = d.claims[c];
    // the sheet's row had it, and here's the change itself (its what, how and where): the same claim, now news
    const upgrade = was?.what === 'row' && was.who === e.who;
    // the sheet's row said the other one had it, but the relay kept this claim (it keeps the race's winner only): a
    // row written before its writer heard it lost the race (a phone opening later folds rows before the replay)
    const outrun = was?.what === 'row' && was.who !== e.who;
    if (was && !upgrade && !outrun && (was.who === e.who || was.who !== me || e.who === me)) return SAME;
    if (upgrade) {
      d.claims[c] = { ...was, what: e.what, ...(e.kind === 'catch' && e.how ? { how: e.how } : {}), ...(e.at ? { at: e.at } : {}) };
      return { fresh: true, beat: null };
    }
    d.claims[c] = { who: e.who, t: e.t, what: e.what, ...(e.kind === 'catch' && e.how ? { how: e.how } : {}), ...(e.at ? { at: e.at } : {}) };
    return { fresh: true, beat: was ?? null };
  }
  switch (e.kind) {
    case 'put': {
      // one id put by both of us (a tree's present, shaken out on both phones at once: island/treeGifts.ts): the relay
      // keeps the first, so the partner's coming after mine means theirs got there first (as a claim's race above)
      const was = d.puts[e.id];
      if (was && (was.who === e.who || was.who !== me || e.who === me)) return SAME;
      d.puts[e.id] = { id: e.id, what: e.what, at: e.at, who: e.who, t: e.t };
      return { fresh: true, beat: null };
    }
    case 'shake': {
      // the same shake again (a replay of one I folded already, or the row's and then the relay's): its tree, who and
      // the shaker's own time match
      const t = e.at ?? e.t;
      const was = d.shakes.find((s) => s.tree === e.tree && s.who === e.who && s.t === t);
      if (was) {
        if (!was.row || row) return SAME;
        delete was.row;
        return { fresh: true, beat: null };
      }
      d.shakes.push({ tree: e.tree, drop: e.drop, who: e.who, t, ...(row ? { row } : {}) });
      d.shakes.sort((a, b) => a.t - b.t || (a.who < b.who ? -1 : a.who > b.who ? 1 : 0));
      return { fresh: true, beat: null };
    }
    case 'world':
      if (e.op === 'watered') {
        if (d.watered[e.id]) return SAME;
        d.watered[e.id] = e.who;
        return { fresh: true, beat: null };
      }
      if (e.op === 'woke') {
        if (d.woke[e.id]) return SAME;
        d.woke[e.id] = e.who;
        return { fresh: true, beat: null };
      }
      if (e.op === 'wished') {
        // each wish once (a replay of one I have is no second wish); a count the sheet's row brought first is a floor,
        // not more wishes on top (the row, then the relay's own of the same wish, is one wish)
        const k = `${e.who}:${e.t}:${e.id}`;
        if (d.wished.includes(k)) return SAME;
        d.wished.push(k);
        const w = (d.wishes[e.id] ??= {});
        const heard = d.wished.filter((x) => x.startsWith(`${e.who}:`) && x.endsWith(`:${e.id}`)).length;
        if (heard <= (w[e.who] ?? 0)) return { fresh: false, beat: null };
        w[e.who] = heard;
        return { fresh: true, beat: null };
      }
      return SAME;
    case 'walk': {
      const was = d.walks[e.who];
      if (was && (was.t > e.t || (was.t === e.t && String(was.to) === String(e.to)))) return SAME;
      const { kind: _k, who: _w, at: _a, ...w } = e;
      d.walks[e.who] = w;
      return { fresh: true, beat: null };
    }
    default:
      // an act only plays (the partner's villager walks there with the tool): nothing to keep
      return { fresh: true, beat: null };
  }
}

/** The day as both phones must have it, in one stable string (keys sorted, times that differ per phone left out): what
 *  is claimed and by whom, what lies about and where, every shake, the watered flowers, the wishes, where each
 *  villager is going, the visitors woken. Two phones with the same `canonical` show the same island. */
export function canonical(d: WorldDay): string {
  const sorted = <T>(o: Record<string, T>): [string, T][] => Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify({
    day: d.day,
    claims: sorted(d.claims).map(([k, c]) => [k, c.who]),
    puts: sorted(d.puts).map(([k, p]) => [k, p.what, p.at[0], p.at[1], p.who]),
    shakes: d.shakes.map((s) => [s.tree, s.drop, s.who, s.t]),
    watered: sorted(d.watered),
    wishes: sorted(d.wishes).map(([k, w]) => [k, w.A ?? 0, w.B ?? 0]),
    walks: (['A', 'B'] as const).map((w) => d.walks[w]?.to ?? null),
    woke: sorted(d.woke)
  });
}
/** A short hash of a string (FNV-1a, 32 bits, hex): the two-phone checks compare these. */
export function hash(s: string): string {
  return fnv1a(s).toString(16).padStart(8, '0');
}

/** Whether a critter (by its shared id) is gone today: caught, or it got away. */
export const caught = (d: WorldDay, id: string): Claim | null => d.claims[`catch:${id}`] ?? null;
/** Whether a thing on the ground (by its id) was taken today. */
export const taken = (d: WorldDay, id: string): Claim | null => d.claims[`pick:${id}`] ?? null;
/** The ids picked up, dug or pulled today (a day item's uid, a put's id), by anyone: gone on every phone, mine too. A
 *  claim of mine the day holds is gone even when this phone's own record (sceneDay, fruitDay) doesn't have it: a phone
 *  that lost that record (a new origin, Safari's cleared storage) gets my claims back in the relay's replay, and a
 *  claim can't be made twice, so a thing kept lying for it could never be picked up. */
export const takenIds = (d: WorldDay): Set<string> =>
  new Set(Object.keys(d.claims).filter((k) => k.startsWith('pick:')).map((k) => k.slice(5)));
/** What lies about now: the day's puts nobody (me included) has picked up or caught. */
export const lying = (d: WorldDay): Put[] =>
  Object.values(d.puts).filter((p) => !(taken(d, p.id) ?? caught(d, p.id))).sort((a, b) => a.t - b.t);
/** How many wishes, everyone's, bring a fragment on the morning of `date`. */
export const wishesFor = (d: WorldDay, date: string): number => Object.values(d.wishes[date] ?? {}).reduce((s, n) => s + (n ?? 0), 0);

// ---------- the sheet's day row (contract/island.ts) ----------

/** One person's day as the sheet keeps it (one row per person and day: the `island` event): enough to put the island
 *  back together when both apps were closed and the relay has nothing (another day's watering, a long outage). */
export interface DayRow {
  /** Ids this person picked up, dug, pulled or opened. */
  taken: string[];
  /** What they put down that day: [id, what, x, z]. */
  puts: [string, string, number, number][];
  /** Their shakes that left something: [tree, drop, t]. */
  shakes: [string, Drop, number][];
  /** The flowers they watered. */
  watered: string[];
  /** Their wishes: the morning each brings its fragment → how many. */
  wishes: Record<string, number>;
  /** Where their villager stands, if they sent it somewhere. */
  at?: Pt;
}

/** `who`'s part of the day, as the sheet row keeps it. */
export function rowOf(d: WorldDay, who: Who): DayRow {
  const row: DayRow = {
    taken: Object.entries(d.claims).filter(([k, c]) => k.startsWith('pick:') && c.who === who).map(([k]) => k.slice(5)).slice(-ISLAND_MAX.taken),
    // things that stay (presents; a bug out of a bush is gone in seconds)
    puts: Object.values(d.puts).filter((p) => p.who === who && !p.what.startsWith('bug:')).map((p) => [p.id, p.what, p.at[0], p.at[1]] as DayRow['puts'][number]).slice(-ISLAND_MAX.puts),
    shakes: d.shakes.filter((s) => s.who === who && s.drop !== 'none').map((s) => [s.tree, s.drop, s.t] as DayRow['shakes'][number]).slice(-ISLAND_MAX.shakes),
    watered: Object.entries(d.watered).filter(([, w]) => w === who).map(([id]) => id).slice(-ISLAND_MAX.watered),
    wishes: Object.fromEntries(Object.entries(d.wishes).flatMap(([day, w]) => (w[who] ? [[day, w[who]!]] : [])))
  };
  const walk = d.walks[who];
  if (walk && Array.isArray(walk.to)) row.at = walk.to as Pt;
  return row;
}

/** A sheet row folded back into the day as `who`'s events at `t` (the row's time: its claims count as theirs then, so
 *  the relay's own events, earlier, keep their order). Fills in what the relay didn't bring; never undoes it. */
export function applyRow(d: WorldDay, row: DayRow, who: Who, t: number, me: Who | null): void {
  for (const id of row.taken) if (!taken(d, id)) d.claims[`pick:${id}`] = { who, t, what: 'row' };
  for (const [id, what, x, z] of row.puts) apply(d, { kind: 'put', id, what, at: [x, z], who, t }, me);
  for (const [tree, drop, ts] of row.shakes) apply(d, { kind: 'shake', tree, drop, at: ts, who, t }, me, true);
  for (const id of row.watered) d.watered[id] ??= who;
  for (const [day, n] of Object.entries(row.wishes)) {
    const w = (d.wishes[day] ??= {});
    w[who] = Math.max(w[who] ?? 0, n);
  }
  if (row.at && !d.walks[who]) d.walks[who] = { to: row.at, t };
}
