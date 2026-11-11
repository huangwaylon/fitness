// Deterministic ambient life (docs/backend.md#ambient-life): what the island does on its own in each 10-second slot of
// the Tokyo day (a villager's outing or small move, the visitor's beat, a fish, bubbles or a bug coming by), from the
// date, the slot and the shared world only, with PRNGs keyed by date + slot + kind. Both phones compute the same slot
// from the same inputs, so they show the same island without a message: the relay's clock (live.ts serverNow) aligns the
// slots, the relay's intents keep the inputs shared (a walk). What one person does by hand stays theirs (a cast's
// bite, a line read), and so does where on a screen a critter shows (each camera sees its own part of the world).
// idleLife.svelte.ts plays the villagers' and the visitor's slots, Critters.svelte the critters'. Engine-proof:
// integer world points, squared distances (never Math.hypot), plain string order, mulberry32.
import { ZONE_OFFSET_MS } from '#lib/time/dates.ts';
import type { LocalDate } from '#lib/types.ts';
import type { PersonId as Who, Who as Islander } from '#lib/types.ts';
import { mulberry32, pickOne } from '#lib/random.ts';
import { IDLE_POOL, type IdleAction } from '../motion/reactions.ts';
import { BUBBLE_ODDS } from './critters.ts';
import { dayRand } from './daySeed.ts';
import { MAX_HOPS, POI_LINGER } from './wander.ts';
import type { FreshWhere, Pt } from './world.ts';

// ---------- the slot clock ----------

/** One slot: every decision belongs to one, and every walk starts on a boundary. */
export const SLOT_MS = 10_000;
const DAY_MS = 86_400_000;
export const SLOTS_PER_DAY = DAY_MS / SLOT_MS;
/** The critters' stays are chained within blocks of this many slots (10 min; a block never spans an hour or a day), so
 *  a slot's critters are a function of its block alone. */
const BLOCK = 60;

interface SlotTime {
  /** The Tokyo date. */
  date: LocalDate;
  /** The slot of that date, 0 … SLOTS_PER_DAY − 1. */
  slot: number;
  /** How far into the slot (ms). */
  into: number;
  /** The Tokyo hour and month (1–12) the slot is in. */
  hour: number;
  month: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The slot a clock reading falls in, on the relay's clock: `ms` the island's clock (clock.ts now(), so a `?date=`
 * preview moves the slots too), `offset` the relay's clock minus the device's (live.serverNow() − Date.now(); 0 when
 * offline: alone, nobody has to agree).
 */
export function slotAt(ms: number, offset = 0): SlotTime {
  const tokyo = ms + offset + ZONE_OFFSET_MS;
  const day = Math.floor(tokyo / DAY_MS);
  const inDay = tokyo - day * DAY_MS;
  const d = new Date(day * DAY_MS);
  const slot = Math.floor(inDay / SLOT_MS);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    slot,
    into: inDay - slot * SLOT_MS,
    hour: Math.floor(inDay / 3_600_000),
    month: d.getUTCMonth() + 1
  };
}

/** How long until the next slot begins (ms, on the device's clock: what a setTimeout waits). */
export const msToNextSlot = (ms: number, offset = 0): number => SLOT_MS - slotAt(ms, offset).into;

/** A slot is decided and played this long after its start (its walks start then, its moves `at` after it): by then an
 *  intent the partner sent before the start has reached this phone (one way ~20 ms, p90 ~45 ms: backend.md "Measured"). */
export const DECIDE_MS = 500;

/** When a slot begins (ms since the epoch, the relay's clock). Slots sit on whole 10 s of the epoch (Tokyo is +9 h). */
export const slotStart = (date: LocalDate, slot: number): number =>
  Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) - ZONE_OFFSET_MS + slot * SLOT_MS;

/** A PRNG for one kind of decision in one slot ('villager', 'visitor', 'critter:sea', …): the same on both phones. */
export const slotRand = (date: LocalDate, slot: number, kind: string): (() => number) => dayRand(date, `ambient:${kind}:${slot}`);
const between = (r: () => number, [a, b]: readonly [number, number]) => Math.round(a + r() * (b - a));

// ---------- the world snapshot ----------

/** A point a villager may wander to: a walk-graph node and its world point. */
export interface Poi {
  node: string;
  at: Pt;
}

export interface VillagerState {
  /** Where it stands (world units, rounded). */
  at: Pt;
  home: Pt;
  /** Free for an idle beat: awake, standing, not mid-reaction. From the shared state only (a partner's walk or act
   *  arrives over the relay); my own touches that never reach the relay must not count, or the phones disagree. */
  free: boolean;
  /** Its person has the island open (on their own phone: always; another's: the relay's presence, ui-state/cast.ts
   *  online): it makes small moves but no outings, as its person may tap it any moment. Not present and free: woken by
   *  a tap for its minute (asleep, it isn't free). */
  present?: boolean;
  /** The relay's `t` of its owner's last walk or act (my own: the serverNow() I sent it at), if any: idle life leaves
   *  a villager its owner is steering alone for HOLD_SLOTS (held()). */
  lastIntent?: number;
}

export interface AmbientWorld {
  /** The members' villagers, and the guest's while it's awake (`G`: its app open, or woken by a tap). The guest's
   *  villager takes part as a member's does (docs/design.md "The guest", 2026-11-06): small moves, a chat or a dance
   *  with anyone, and the dusk meet-up beside the bench; never an outing on its own. */
  villagers: Record<Who, VillagerState> & { G?: VillagerState };
  /** Where a villager may wander (the world's points of interest, any order: sorted here). */
  pois: readonly Poi[];
  /** 'evening' (tod night, the evening and the night: no day-only moves). */
  phase: 'day' | 'evening';
  /** Each person's day score (progress.ts dayScore: today's ベル as % of a full day), for dancing together and the dusk
   *  meet-up at the bench (both 100: every goal met). */
  scores: Record<Who, number>;
  /** Each person's exercise goal (🍑) met today: their villager may go do a pull-up. */
  exercise?: Record<Who, boolean>;
}

// ---------- what a slot holds ----------

type IdleMove = Exclude<IdleAction, 'wander' | 'chat' | 'dance'>;

export type VillagerBeat =
  /** A small move, `at` ms into the slot. */
  | { kind: 'idle'; action: IdleMove; at: number }
  /** A walk to 1–MAX_HOPS points of interest, lingering at each, then home; it starts on the slot's boundary.
   *  `together`: both set off at once (the dusk meet-up at the bench). */
  | { kind: 'outing'; stops: readonly { node: string; linger: number }[]; together?: boolean }
  /** Two villagers: a chat or a dance, the same for both; the lead's starts it. */
  | { kind: 'pair'; action: 'chat' | 'dance'; with: Islander; lead: boolean; at: number };

type CritterKind = 'fish' | 'bubbles' | 'fresh' | 'bug';

export interface Spawn {
  kind: CritterKind;
  /** When it comes, ms into its first slot. */
  at: number;
  /** Its first slot and how many it stays (it leaves at the end of the last one, on a boundary, unless caught first). */
  slot: number;
  slots: number;
  /** Seeds what it is: the species pickers take spawnRand(spawn) (critters.ts pickFish / pickBug, pondFish.ts
   *  pickFresh, sea.ts pickDive), so the lazily loaded tables stay out of this module. Where it shows is the
   *  phone's (the waters and patches its camera sees). */
  seed: number;
  /** A fresh-water shadow's water (its channel's). */
  water?: FreshWhere;
  /** A sea shadow's stretch of coast past the first (its channel's: coast.ts). */
  coast?: number;
  /** The second roaming bug's (`bug2`): its spot keeps off the first's (bugRivals). */
  lane?: 2;
}


// ---------- the villagers ----------

/** Idle life leaves a villager alone this many slots after its owner's last walk or act (12: 2 min, idle life's
 *  MINE_WANDER_IDLE). */
export const HOLD_SLOTS = 12;
/** The chance a slot sends a free villager out on an outing when nobody is out (idle life: every other tick or so). */
const OUTING_ODDS = 0.3;
/** Outings stay within this of home (u, the world spec's 600u), and a stop is never where it stands (30u). */
export const WANDER_REACH_U = 600;
const NEAR_U = 30;
/** With both day scores ≥ 80 a pair beat is a dance this often (idle life weights it 15). */
const DANCE_BOOST = 0.25;
/** A small move lands this far into its slot at most (ms), so it is done before the next. */
const IDLE_AT_MAX = 6_000;
const PEOPLE: readonly Who[] = ['A', 'B'];
const WITH_GUEST: readonly Islander[] = ['A', 'B', 'G'];

const d2 = (a: Pt, b: Pt) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const atHome = (v: VillagerState) => d2(v.at, v.home) <= NEAR_U ** 2;

/** Whether its owner steered it in the HOLD_SLOTS slots' time before the slot starting at `start`. Only intents before
 *  the start count (one sent after it counts from the next slot), and a slot is decided DECIDE_MS after its start, by
 *  when the partner's phone has the intent too. */
export function held(v: VillagerState, start: number): boolean {
  return v.lastIntent !== undefined && v.lastIntent < start && start - v.lastIntent <= HOLD_SLOTS * SLOT_MS;
}

type PoolEntry = (typeof IDLE_POOL)[number];
/** How far back a roll can rule a move out (slots): the last two, or the longest `every` gap. */
const LOOKBACK = Math.max(2, ...IDLE_POOL.map((e) => (e.every ?? 0) / SLOT_MS));

function pickEntry(pool: readonly PoolEntry[], r: () => number): PoolEntry | null {
  const total = pool.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) return null;
  let x = r() * total;
  for (const e of pool) if ((x -= e.weight) < 0) return e;
  return pool[pool.length - 1];
}

/** A slot's first roll for the villagers, from the date, the slot and whether the guest is on the island alone: whose
 *  turn (a third each with the guest) and what from the hour's pool. The final beat checks it against the snapshot and
 *  the recent rolls (no repeat, each move's `every` gap). */
function roll(date: LocalDate, slot: number, phase: AmbientWorld['phase'], guest: boolean) {
  const r = slotRand(date, slot, 'villager');
  const outing = r();
  const x = r();
  const who: Islander = guest ? (x < 1 / 3 ? 'A' : x < 2 / 3 ? 'B' : 'G') : x < 0.5 ? 'A' : 'B';
  const hour = Math.floor(slot / 360);
  const pool = IDLE_POOL.filter((e) => !(e.day && phase !== 'day') && !(e.hours && !(hour >= e.hours[0] && hour < e.hours[1])));
  return { r, outing, who, pool, first: pickEntry(pool, r) };
}

/** The moves `who` rolled in the slots before `slot` that rule a move out now: the last two (no repeats) and any within
 *  its `every` gap. Rolls only (whether they happened doesn't matter), so the phones agree without history. */
function recent(date: LocalDate, slot: number, who: Islander, phase: AmbientWorld['phase'], guest: boolean): Set<IdleAction> {
  const out = new Set<IdleAction>();
  for (let k = 1; k <= LOOKBACK && slot - k >= 0; k++) {
    const p = roll(date, slot - k, phase, guest);
    if (p.who !== who || !p.first) continue;
    if (k <= 2 || k * SLOT_MS < (p.first.every ?? 0)) out.add(p.first.action);
  }
  return out;
}

/** A seat (a bench's, a stool: world.ts SEATS): a villager sits there SIT_LINGER. */
const isSeat = (node: string) => /^(seat|stool)/.test(node);
const SIT_LINGER = [20_000, 40_000] as const;
/** The dusk meet-up (both met every goal today): both sit on the front bench, facing the sunset over the sea, from
 *  17:00 to 19:00, at each quarter hour when both are home. */
const MEET_HOURS = [17, 19] as const;
const MEET_EVERY = 90;
const MEET_LINGER = 90_000;
/** In the evening (19–22) an outing is to the campfire's stool this often (A's the west stool, B's the east). */
const FIRE_ODDS = 0.45;
const FIRE_LINGER = [30_000, 60_000] as const;
/** On a day its person met the exercise goal, an outing is to the pull-up bar this often (a rep there). */
const BAR_ODDS = 0.2;
const BAR_LINGER = 7_000;
/** A day outing is to the pond's bench this often. */
const POND_ODDS = 0.12;

/** An outing from `v`: 1–MAX_HOPS stops among `pois` (sorted by node), each away from the last and within reach of home. */
function outing(v: VillagerState, pois: readonly Poi[], r: () => number): VillagerBeat | null {
  const hops = 1 + Math.floor(r() * MAX_HOPS);
  const stops: { node: string; linger: number }[] = [];
  let from = v.at;
  for (let i = 0; i < hops; i++) {
    const ok = pois.filter((p) => d2(p.at, from) > NEAR_U ** 2 && d2(p.at, v.home) <= WANDER_REACH_U ** 2);
    if (!ok.length) break;
    const p = pickOne(ok, r);
    stops.push({ node: p.node, linger: between(r, isSeat(p.node) ? SIT_LINGER : POI_LINGER) });
    from = p.at;
  }
  return stops.length ? { kind: 'outing', stops } : null;
}

/** The villagers' beats in one slot of the day, from the slot and the shared world at its start: at most one villager's,
 *  two for a pair (a sleeping villager isn't free: in none). */
export function villagerBeats(w: AmbientWorld, date: LocalDate, slot: number): Partial<Record<Islander, VillagerBeat>> {
  const start = slotStart(date, slot);
  const guest = !!w.villagers.G;
  const everyone = guest ? WITH_GUEST : PEOPLE;
  const v = (p: Islander) => (p === 'G' ? w.villagers.G! : w.villagers[p]);
  const free = (p: Islander) => v(p).free && !held(v(p), start);
  const { r, outing: o, who, pool, first } = roll(date, slot, w.phase, guest);
  // one villager out at a time, from home (the members': the guest's stands wherever its taps put it)
  const nobodyOut = PEOPLE.every((p) => atHome(w.villagers[p]));
  const hour = Math.floor(slot / 360);
  // both met every goal today: at dusk they meet on the front bench, side by side (each phone sends its own villager)
  if (w.phase === 'day' && hour >= MEET_HOURS[0] && hour < MEET_HOURS[1] && slot % MEET_EVERY === 0 && nobodyOut && free('A') && free('B') && w.scores.A >= 100 && w.scores.B >= 100) {
    const go = (node: string): VillagerBeat => ({ kind: 'outing', stops: [{ node, linger: MEET_LINGER }], together: true });
    // the guest joins them, standing at the nearest spot to the bench that isn't a seat
    const by = guest && free('G') ? nearBench(w.pois) : null;
    return { A: go('seatMaeL'), B: go('seatMaeR'), ...(by ? { G: go(by) } : {}) };
  }
  const goers = PEOPLE.filter((p) => free(p) && !w.villagers[p].present && nobodyOut);
  if (goers.length && o < OUTING_ODDS) {
    // (the guest's turn: a member's outing all the same, theirs never: its villager is always present)
    const p = goers.find((g) => g === who) ?? goers[slot % goers.length];
    const special = r();
    // the evening: to the campfire's stool; an exercise day: a pull-up at the bar
    if (w.phase === 'evening' && special < FIRE_ODDS) return { [p]: { kind: 'outing', stops: [{ node: p === 'A' ? 'stoolW' : 'stoolE', linger: between(r, FIRE_LINGER) }] } };
    if (w.phase === 'day' && w.exercise?.[p] && special < BAR_ODDS) return { [p]: { kind: 'outing', stops: [{ node: 'pullup', linger: BAR_LINGER }] } };
    // now and then a sit on the pond's bench (its own seat each)
    if (w.phase === 'day' && special > 1 - POND_ODDS) return { [p]: { kind: 'outing', stops: [{ node: p === 'A' ? 'seatPondL' : 'seatPondR', linger: between(r, SIT_LINGER) }] } };
    const pois = [...w.pois].sort((a, b) => (a.node < b.node ? -1 : a.node > b.node ? 1 : 0)).filter((q) => !SPECIAL.has(q.node));
    const beat = outing(w.villagers[p], pois, r);
    if (beat) return { [p]: beat };
  }
  if (!free(who) || !first) return {};
  // a pair's other: the other member, or with the guest here one of the other two; awake (a sleeping one is left out)
  const mates = everyone.filter((p) => p !== who && v(p).free);
  const mate = mates.length <= 1 ? mates[0] : mates[Math.floor(r() * mates.length)];
  const pairOk = mate !== undefined && free(mate);
  const low = Math.min(w.scores.A, w.scores.B);
  const at = Math.floor(r() * IDLE_AT_MAX);
  if (pairOk && low >= 80 && r() < DANCE_BOOST) return both('dance', who, mate!, at);
  const no = recent(date, slot, who, w.phase, guest);
  // (the guest has no tree of its own to shake)
  const allowed = (e: PoolEntry) => !no.has(e.action) && (!e.pair || pairOk) && (e.action !== 'dance' || low >= 70) && !(who === 'G' && e.action === 'treeshake');
  const e = allowed(first) ? first : pickEntry(pool.filter(allowed), r);
  if (!e) return {};
  if (e.action === 'dance') return both('dance', who, mate!, at);
  if (e.action === 'chat') return both('chat', who, mate!, at);
  return { [who]: { kind: 'idle', action: e.action as IdleMove, at } };
}

/** The nodes only their own beats go to (the far stools, the bar, the pond bench). */
const SPECIAL = new Set(['stoolW', 'stoolE', 'pullup', 'seatPondL', 'seatPondR']);

const both = (action: 'chat' | 'dance', who: Islander, mate: Islander, at: number): Partial<Record<Islander, VillagerBeat>> => ({
  [who]: { kind: 'pair', action, with: mate, lead: true, at },
  [mate]: { kind: 'pair', action, with: who, lead: false, at }
});

/** The guest's spot at the dusk meet-up: the point of interest nearest the front bench's two seats that isn't a seat
 *  or one of the special nodes (null: no bench). */
function nearBench(pois: readonly Poi[]): string | null {
  const l = pois.find((p) => p.node === 'seatMaeL'), r = pois.find((p) => p.node === 'seatMaeR');
  if (!l || !r) return null;
  const mid: Pt = [(l.at[0] + r.at[0]) >> 1, (l.at[1] + r.at[1]) >> 1];
  let best: Poi | null = null;
  for (const p of pois) {
    if (isSeat(p.node) || SPECIAL.has(p.node)) continue;
    if (!best || d2(p.at, mid) < d2(best.at, mid) || (d2(p.at, mid) === d2(best.at, mid) && p.node < best.node)) best = p;
  }
  return best?.node ?? null;
}

// ---------- the critters ----------

/** Per slot, the chance a channel with room brings someone; how long each stays (slots: a fish ~45 s, bubbles 30 s,
 *  a bug ~18 s, critters.ts STAY_MS and sea.ts BUBBLE_STAY_MS). The front's bubbles are a channel of their own (they
 *  took 1 in 4 of its turns once: its shadow 0.8× the other stretches', its rare fish with it), so every stretch's shadow
 *  is alike: a fish's odds are its water's and the hour's, the month's and the sky's, never its stretch's. Each
 *  fresh water is a channel of its own (the pond, the river, its mouth, the clifftop): a shadow in each nearly all
 *  the time, as NH's (one channel for all four left each a quarter of the turns: a pond on screen stood empty most
 *  of the time). */
const CHANNELS = {
  sea: { odds: 0.9 },
  bubbles: { odds: BUBBLE_ODDS },
  pond: { odds: 0.9 },
  river: { odds: 0.9 },
  mouth: { odds: 0.9 },
  clifftop: { odds: 0.9 },
  bug: { odds: 0.9 },
  // the second roaming bug (lane 2): two about at once, each its own chain (the user, 2026-11-08: "2 at once")
  bug2: { odds: 0.9 }
} as const;
/** The sea round the rest of the coast past the front's (`sea`): a channel per stretch (coast.ts), `sea1`, `sea2`…,
 *  as the front's (the dive spots stay off the front beach: `bubbles`). */
type Channel = keyof typeof CHANNELS | `sea${number}`;
const FRESH_CH: ReadonlySet<Channel> = new Set(['pond', 'river', 'mouth', 'clifftop']);
const coastOfCh = (ch: Channel): number => (/^sea\d+$/.test(ch) ? +ch.slice(3) : 0);
const STAY: Record<CritterKind, readonly [number, number]> = { fish: [4, 5], fresh: [4, 5], bubbles: [3, 3], bug: [2, 2] };
/** A critter comes this far into its first slot at most (ms). */
const SPAWN_AT_MAX = 8_000;

/** One channel's critters through a block: a slot's roll brings one when the channel is empty (the last one's stay
 *  is over); stays end within the block. A function of (date, block, channel) alone, kept for the last few blocks. */
const chains = new Map<string, Spawn[]>();
function chain(date: LocalDate, block: number, ch: Channel): Spawn[] {
  const key = `${date}|${block}|${ch}`;
  let out = chains.get(key);
  if (out) return out;
  out = [];
  const first = block * BLOCK, end = first + BLOCK;
  let freeAt = first;
  for (let s = first; s < end; s++) {
    const r = slotRand(date, s, `critter:${ch}`), coast = coastOfCh(ch);
    if (r() >= (coast ? CHANNELS.sea : CHANNELS[ch as keyof typeof CHANNELS]).odds || s < freeAt) continue;
    const fresh = FRESH_CH.has(ch);
    // (a sea channel's second draw kept: the chains as they were)
    const kind: CritterKind = ch === 'bubbles' ? 'bubbles' : ch === 'sea' || coast ? (r(), 'fish') : fresh ? 'fresh' : 'bug';
    const slots = Math.min(between(r, STAY[kind]), end - s);
    out.push({ kind, slot: s, slots, at: Math.floor(r() * SPAWN_AT_MAX), seed: Math.floor(r() * 2 ** 32), ...(fresh ? { water: ch as FreshWhere } : {}), ...(coast ? { coast } : {}), ...(ch === 'bug2' ? { lane: 2 } : {}) });
    freeAt = s + slots;
  }
  if (chains.size >= 160) chains.delete(chains.keys().next().value!);
  chains.set(key, out);
  return out;
}

/** The critters there in `slot`: those that come in it and those still staying from before (a phone opening mid-stay
 *  shows them too, `slot - spawn.slot` slots in). One at a time off each of the island's `coasts` stretches of coast
 *  (coast.ts), the front's bubbles, in each fresh water, two among the bugs (`bug`, `bug2`); the phone skips a channel it
 *  has no room for (no such water, no bug about at this hour). */
export function crittersAt(date: LocalDate, slot: number, coasts = 1): Spawn[] {
  const out: Spawn[] = [];
  const chs: Channel[] = [...(Object.keys(CHANNELS) as Channel[]), ...Array.from({ length: Math.max(0, coasts - 1) }, (_, i) => `sea${i + 1}` as const)];
  for (const ch of chs)
    for (const c of chain(date, Math.floor(slot / BLOCK), ch)) if (c.slot <= slot && slot < c.slot + c.slots) out.push(c);
  return out;
}

/** The first lane's bugs about at any time during a second-lane bug's stay (none for any other spawn): its spot
 *  keeps off theirs (critterPath.ts BugOpts.taken), so the two never share one, the same on both phones. */
export const bugRivals = (date: LocalDate, c: Spawn): Spawn[] =>
  c.lane === 2 ? chain(date, Math.floor(c.slot / BLOCK), 'bug').filter((o) => o.slot < c.slot + c.slots && c.slot < o.slot + o.slots) : [];

/** The critters coming in `slot`. */
export const spawnsIn = (date: LocalDate, slot: number, coasts = 1): Spawn[] => crittersAt(date, slot, coasts).filter((s) => s.slot === slot);

/** A species picker's random source for a spawn (pickFish(month, hour, spawnRand(s), sky), …). */
export const spawnRand = (s: Spawn): (() => number) => mulberry32(s.seed);
