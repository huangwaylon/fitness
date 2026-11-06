// ききみみ's round session (docs/kikimimi-framework.md §3.2; docs/kikimimi.md "Sync"): any game's state machine, pure (no
// I/O, no timers, no clock of its own). It folds the game ops heard (round/wire.ts, from either wire), who is here
// (live status().here) and the relay's clock (live.serverNow(), passed in as `now` to every call) into a view: {phase,
// players, answers, scores, i, …}. The host is the clock: every phone computes a round's lead-in, clip and answer window
// from its start and the round's timing (the game's deck), and adopts the host's position (its `skip`: round i starts
// at `at`, sent as it changes and every few seconds as a beacon) whenever it hears it. The reveal is untimed (time to
// read), so the next round's start is only ever known from the host's つぎへ (its skip), but for a reveal the deck says
// moves on by itself (スピード はしご's lower rungs: 3 s, on every phone). Each call returns the ops to send (my taps,
// the host's skips and beacons, the re-sends when someone comes back), which the caller hands to the wire (link.ts); the
// UI only renders `view(now)`. A game comes in through its GameDef (`defs`), its deck through the def; the session never
// looks inside a round.
import type { Who } from '../../contract/live-protocol.ts';
import { PLAY_ROUNDS } from '../../contract/live-protocol.ts';
import type { RoundIn, RoundOut } from './wire.ts';
import { fix, schedule, times, where, type Where } from './schedule.ts';
import { rightOf, sum, team, teamFirst, type Team } from './tally.ts';
import { F_SAME, F_VS, type AnswerValue, type Game, type GameDef, type GameId, type RoundAnswer, type RoundDeck, type RoundPhase, type RoundWindows, type Setup } from './types.ts';

export const WINDOWS: RoundWindows = { countdown: 4000, lead: 1500, answers: [30_000, 20_000, 60_000, Infinity], late: 5000, openTtl: 600_000, hostGrace: 15_000, beacon: 3000, auto: 3000 };
/** The `?kikimimi=fast` test hook's: a shorter time limit (still roomy: a throttled tab's taps); none stays none. */
export const FAST_WINDOWS: RoundWindows = { ...WINDOWS, answers: [8000, 8000, 8000, Infinity] };

/** A player in the game: here or away (a locked phone), whether they answered the current round (never what, until its
 *  reveal: `pick` then), their score. */
interface RoundPlayer {
  who: Who;
  here: boolean;
  answered: boolean;
  /** Their answer to the current round, in its reveal only (and whether it was right). */
  pick?: { a: AnswerValue; ok: boolean };
  /** In a reveal: they tapped よみおわった (done reading; the host's つぎへ counts them). */
  ready: boolean;
  score: number;
}

/** A lobby or game someone else opened that I haven't joined: the invite banner's. */
interface RoundInvite {
  g: string;
  host: Who;
  gm: GameId;
  o: readonly number[];
  u?: string;
  same: boolean;
  /** It's already going (さんか joins at the next round). */
  started: boolean;
}

/** Why my game went away: the host cancelled it, the host left the lobby, or it was never started. */
export type RoundNotice = 'cancelled' | 'host-left' | 'stale';

export interface RoundView {
  phase: RoundPhase;
  /** My game (joined), else null. */
  g: string | null;
  host: Who | null;
  amHost: boolean;
  /** My lobby, on this phone only (not announced: みんなを さそう not tapped). */
  local: boolean;
  /** Its game, options (as on the wire) and unit; null, [] outside one. */
  gm: GameId | null;
  o: readonly number[];
  u?: string;
  same: boolean;
  seed: number;
  /** たいせん: points and a ranking (else co-op: the team's tally, no one's score shown to the others). */
  vs: boolean;
  /** Whether this phone plays the clips (おなじへや: the host's only). */
  speaks: boolean;
  /** Who joined, A B G order. */
  players: RoundPlayer[];
  /** The current round (0-based), -1 before the first, n at the results. */
  i: number;
  /** The game's rounds. */
  n: number;
  /** The phase's span on the relay's clock (the lobby, idle and the results: `until` Infinity). */
  from: number;
  until: number;
  /** The current round's clip start and end, and its time limit (relay clock). */
  playAt: number;
  playEnd: number;
  limit: number;
  /** This round is sat out (its clip began well before this phone heard of it: a late `go`, a lock, a join mid-game). */
  out: boolean;
  /** My answer to each round (null: none), for the reveal and the review list. */
  answers: (RoundAnswer | null)[];
  /** Whether I had each round: answered it, or its clip began after I came into the schedule (not sat out: a mid-game
   *  join, a late `go`, a lock). My `listen` row holds only these (a round not had isn't a miss). */
  had: boolean[];
  scores: Partial<Record<Who, number>>;
  /** The team's tally so far (counted in the reveal and the results). */
  team: Team;
  /** Of those, the rounds at least one player got right on the first listen (no replay): a co-op lesson's `tm`. */
  teamFirst: number;
  /** In a reveal: how many players got this round right (「2にん せいかい」). */
  rightNow: number;
  /** I may tap つぎへ: the host in its reveal (any player once the host has gone). */
  canNext: boolean;
  /** I may tap よみおわった: a player (not the host) in a reveal, the host still here. */
  canReady: boolean;
  /** In a reveal: how many of the others here (not the host) have tapped よみおわった, of how many (the host's つぎへ). */
  ready: { n: number; of: number };
  invite: RoundInvite | null;
  notice: RoundNotice | null;
}

/** The players' order (A B G), as the chips show them. */
export const ORDER: readonly Who[] = ['A', 'B', 'G'];
const GAME_ID = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** The games a session knows, by id (registry.ts). */
export type Defs = (gm: GameId) => GameDef<unknown> | undefined;

/** What the host's seed for a lobby is asked from: its game, options, the flag bits the game fixes and their mask. */
export interface SeedAsk {
  gm: GameId;
  o: readonly number[];
  flags: number;
  mask: number;
  random: () => number;
}

export interface RoundSessionOptions {
  me: Who;
  defs: Defs;
  windows?: Partial<RoundWindows>;
  /** For the game id and seed (tests: a fixed one). */
  random?: () => number;
  /** The host's seed for a lobby's deck (recent.ts freshSeed: the least overlap with this phone's last games), its
   *  `mask` bits `flags` as given; else a random one. Asked at `open` and whenever `configure` changes the game, its
   *  options or a flag bit. */
  seedFor?: (o: SeedAsk) => number;
}

/** A seed whose `mask` bits are `flags` and whose other bits come from `random` (recent.ts seedWith, any mask). */
const randomSeed = (x: SeedAsk): number => ((Math.floor(x.random() * 2 ** 32) & ~x.mask) | (x.flags & x.mask)) >>> 0;
const sameList = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, k) => x === b[k]);

/** One phone's games: every game it hears of, the one it's in. */
export class RoundSession {
  readonly me: Who;
  readonly w: RoundWindows;
  private readonly defs: Defs;
  private readonly random: () => number;
  private readonly seedFor: (o: SeedAsk) => number;
  /** A seedFor given: `configure` asks it again for a new deck (else the seed's other bits stay). */
  private readonly picks: boolean;
  private games = new Map<string, Game>();
  /** The others here now, and since when each other has been away. */
  private here = new Set<Who>();
  private away = new Map<Who, number>();
  /** My own socket is down (who's here unknown). */
  private offline = false;
  /** Joins heard before their game's `open` (a re-send's race). */
  private early = new Map<string, Set<Who>>();
  /** Games I left: their later messages are ignored. */
  private left = new Set<string>();
  private notice: RoundNotice | null = null;

  constructor(o: RoundSessionOptions) {
    this.me = o.me;
    this.defs = o.defs;
    this.w = { ...WINDOWS, ...o.windows };
    this.random = o.random ?? Math.random;
    this.seedFor = o.seedFor ?? randomSeed;
    this.picks = !!o.seedFor;
  }

  // ---------- what's heard ----------

  /** A game op from another phone. */
  receive(m: RoundIn, now: number): RoundOut[] {
    if (m.who === this.me || this.left.has(m.g)) return [];
    this.prune(now);
    const gm = this.games.get(m.g);
    switch (m.op) {
      case 'open': {
        // (a game this build doesn't have, or options it can't read: not offered; 8c's cv check offers an update)
        const def = this.defs(m.gm);
        if (!def || !def.opts.decode(m.o)) return [];
        const set: Setup = { gm: m.gm, seed: m.seed, o: m.o, f: m.f, ...(m.u !== undefined && { u: m.u }) };
        if (gm) {
          // the host's re-send, or its lobby's game, options or おなじへや changed
          if (gm.host === m.who && gm.goAt === undefined && !sameSetup(gm, set)) this.setup(gm, set);
          return [];
        }
        // a host has one lobby: an older one of theirs not started goes
        for (const o of this.games.values()) if (o.host === m.who && o.goAt === undefined) this.drop(o, 'cancelled');
        const fresh = this.game(m.g, m.who, set, now);
        if (!fresh) return [];
        for (const w of this.early.get(m.g) ?? []) enter(fresh, w, now);
        this.early.delete(m.g);
        return [];
      }
      case 'join':
        if (gm) {
          enter(gm, m.who, now);
          // a phone joining (or back): my answer and よみおわった for the round under way, which it may have missed
          return this.resend(gm, now);
        } else {
          if (this.early.size > 8) this.early.clear();
          this.early.set(m.g, (this.early.get(m.g) ?? new Set()).add(m.who));
        }
        return [];
      case 'leave':
        if (!gm) return [];
        gm.joined.delete(m.who);
        if (m.who === gm.host && gm.goAt === undefined) {
          this.drop(gm, 'host-left');
          return [];
        }
        this.checkNow(gm, now);
        return [];
      case 'end':
        if (gm && m.who === gm.host && !this.over(gm, now)) this.drop(gm, 'cancelled');
        return [];
      case 'go':
        if (gm && m.who === gm.host && gm.goAt === undefined) {
          this.adopt(gm, 0, m.at, now);
          gm.goAt = m.at;
          if (m.pl !== undefined) gm.pl = m.pl;
        }
        return [];
      case 'skip':
        if (!gm || m.i > gm.n) return [];
        if (m.who === gm.host) {
          // the host back behind where we moved on while it was gone: ours to it (it adopts it), not its to us
          if (gm.advance && m.i < gm.advance.i && gm.goAt !== undefined) return this.send(gm, this.advancing(gm, gm.advance));
          // the host's position (its clock): adopted even for a round already under way here, or one I raced past
          this.adopt(gm, m.i, m.at, now);
          gm.goAt ??= m.at;
          if (gm.advance && m.i >= gm.advance.i) gm.advance = undefined;
          return [];
        }
        return this.heard(gm, m.who, m.i, m.at, now);
      case 'a': {
        if (!gm || m.i >= gm.n) return [];
        // their join unheard: in from this round at the latest
        enter(gm, m.who, gm.goAt === undefined ? now : Math.min(now, this.times(gm, m.i).playAt));
        const mine = gm.answers.get(m.who) ?? new Map<number, RoundAnswer>();
        gm.answers.set(m.who, mine);
        if (!mine.has(m.i)) mine.set(m.i, { a: m.k, rp: m.rp, t: now });
        const was = gm.totals.get(m.who);
        if (!was || m.i >= was.i) gm.totals.set(m.who, { i: m.i, s: m.s });
        this.check(gm, m.i, now);
        return [];
      }
    }
  }

  /** Who else is here (live status().here; null while my own socket is down: unknown, so nobody counts as gone).
   *  Someone back (everyone, as my socket comes back): the host re-sends its `open` (and once started `go` and its
   *  position), a player its `join`, so a phone back from a lock rejoins the schedule. Someone gone: they no longer
   *  hold up the early reveal. */
  presence(here: readonly Who[] | null, now: number): RoundOut[] {
    if (!here) {
      this.offline = true;
      return [];
    }
    const next = new Set(here.filter((w) => w !== this.me));
    const back = [...next].filter((w) => this.offline || !this.here.has(w));
    const gone = [...this.here].filter((w) => !next.has(w));
    this.offline = false;
    for (const w of gone) this.away.set(w, now);
    for (const w of back) this.away.delete(w);
    this.here = next;
    this.prune(now);
    const out: RoundOut[] = [];
    const gm = this.mine();
    if (!gm || this.over(gm, now)) return out;
    if (back.length && !gm.local) {
      if (gm.host !== this.me) out.push({ g: gm.g, gm: gm.gm, op: 'join' });
      else {
        out.push(this.opening(gm));
        if (gm.goAt !== undefined) out.push(this.going(gm, gm.goAt), this.beacon(gm, now));
      }
      // and what the one back may have missed: my answer and よみおわった now, where we moved on with the host gone
      out.push(...this.resend(gm, now));
      if (gm.advance && gm.host !== this.me) out.push(this.advancing(gm, gm.advance));
    }
    if (gone.length) this.checkNow(gm, now);
    return out;
  }

  /** Time passing (the UI's wake-ups, at least every `beacon` ms in a game): the host's beacon, its position when it
   *  changed or every `beacon` ms; a player's moving on once the host has really gone (its grace over). */
  tick(now: number): RoundOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.goAt === undefined || this.over(gm, now)) return [];
    if (gm.host !== this.me) {
      this.checkNow(gm, now);
      this.follow(gm, now);
      return [];
    }
    if (gm.local) return [];
    const p = this.position(gm, now);
    const b = gm.beaconed;
    return b && b.i === p.i && b.at === p.at && now - b.t < this.w.beacon ? [] : [this.beacon(gm, now)];
  }

  // ---------- my taps ----------

  /** Open a lobby of mine (a game, its options as on the wire, おなじへや, たいせん, a unit), on this phone only until I
   *  invite the others: I'm its host. Leaves the game I was in. */
  open(o: { gm: GameId; o: readonly number[]; same?: boolean; vs?: boolean; u?: string }, now: number): RoundOut[] {
    const out = this.leave(now);
    this.notice = null;
    let g = '';
    do {
      g = '';
      for (let n = 0; n < 6; n++) g += GAME_ID[Math.floor(this.random() * GAME_ID.length) % GAME_ID.length];
    } while (this.games.has(g));
    const def = this.defs(o.gm), opts = def?.opts.decode(o.o);
    if (!def || !opts) return out;
    const f = (o.same ? F_SAME : 0) | (o.vs ? F_VS : 0);
    const bits = seedBitsOf(def, opts, f);
    const seed = this.seedFor({ gm: o.gm, o: o.o, ...bits, random: this.random });
    const gm = this.game(g, this.me, { gm: o.gm, seed, o: o.o, f, ...(o.u !== undefined && { u: o.u }) }, now);
    if (gm) gm.local = true;
    return out;
  }

  /** みんなを さそう: my lobby is announced (an `open`: everyone here gets the invite). */
  invite(now: number): RoundOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host !== this.me || !gm.local || gm.goAt !== undefined) return [];
    gm.local = false;
    gm.opened = now;
    return [this.opening(gm)];
  }

  /** The host changes its lobby: the game, its options, おなじへや, たいせん, the unit; sent again as an `open` once
   *  announced. A new deck (the game, its options, the unit or a seed bit changed) asks the host's seed again, unless
   *  `seed` says which (a lesson dealt into my lobby keeps its seed: game.svelte.ts). */
  configure(o: { gm?: GameId; o?: readonly number[]; same?: boolean; vs?: boolean; u?: string; seed?: number }, now: number): RoundOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host !== this.me || gm.goAt !== undefined) return [];
    const id = o.gm ?? gm.gm, enc = o.o ?? gm.o, def = this.defs(id), opts = def?.opts.decode(enc);
    if (!def || !opts) return [];
    let f = gm.f;
    if (o.same !== undefined) f = o.same ? f | F_SAME : f & ~F_SAME;
    if (o.vs !== undefined) f = o.vs ? f | F_VS : f & ~F_VS;
    const u = o.u ?? (id === gm.gm ? gm.u : undefined);
    const bits = seedBitsOf(def, opts, f);
    let seed = (((o.seed ?? gm.seed) & ~bits.mask) | bits.flags) >>> 0;
    if (o.seed === undefined && this.picks && (id !== gm.gm || !sameList(enc, gm.o) || u !== gm.u || (seed & bits.mask) !== (gm.seed & bits.mask)))
      seed = this.seedFor({ gm: id, o: enc, ...bits, random: this.random });
    this.setup(gm, { gm: id, seed, o: enc, f, ...(u !== undefined && { u }) });
    return this.send(gm, this.opening(gm));
  }

  /** Join the invite (さんか; a game already going: from its next round). Leaves the game I was in. */
  join(now: number, g?: string): RoundOut[] {
    this.prune(now);
    const gm = g !== undefined ? this.games.get(g) : this.offer(now);
    if (!gm || gm.joined.has(this.me) || this.over(gm, now)) return [];
    const out = this.leave(now);
    this.notice = null;
    enter(gm, this.me, now);
    gm.inAt = now;
    out.push({ g: gm.g, gm: gm.gm, op: 'join' });
    return out;
  }

  /** Leave my game (✕): the host's lobby is cancelled (`end`); a game going goes on for the others, the host's too. */
  leave(now: number): RoundOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm) return [];
    this.games.delete(gm.g);
    this.left.add(gm.g);
    if (this.over(gm, now)) return [];
    return this.send(gm, { g: gm.g, gm: gm.gm, op: gm.host === this.me && gm.goAt === undefined ? 'end' : 'leave' });
  }

  /** The host starts the game (はじめる): the 3-2-1, then round 0 at now + the countdown (alone, not announced:
   *  nothing sent). */
  go(now: number): RoundOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host !== this.me || gm.goAt !== undefined) return [];
    const at = now + this.w.countdown;
    gm.n = rounds(gm.deck); // (a deck settled in the lobby: にがて れんしゅう's own, on this phone alone)
    gm.goAt = at;
    gm.pl = ORDER.reduce((m, w, k) => (gm.joined.has(w) ? m | (1 << k) : m), 0);
    gm.starts.set(0, at);
    gm.pos = { i: 0, at };
    gm.beaconed = { i: 0, at, t: now };
    return this.send(gm, this.going(gm, at));
  }

  /** My answer to the current round (one tap, final; in its answer window only). `rp`: how many times I replayed or
   *  slowed it first. */
  answer(a: AnswerValue, rp: number, now: number): RoundOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm) return [];
    const at = this.at(gm, now);
    if (at.phase !== 'answer' || at.out || !gm.deck.valid(at.i, a)) return [];
    const mine = gm.answers.get(this.me) ?? new Map<number, RoundAnswer>();
    gm.answers.set(this.me, mine);
    if (mine.has(at.i)) return [];
    mine.set(at.i, { a, rp, t: now });
    this.check(gm, at.i, now);
    return this.send(gm, this.answerOf(gm, at.i)!);
  }

  /** つぎへ in a reveal: the next round now (the last's: the results, on every phone). The host's; once the host has
   *  gone, any player's (sent as their skip: the others follow it, and so does the host if it comes back). */
  next(now: number): RoundOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm) return [];
    const at = this.at(gm, now);
    if (at.phase !== 'reveal') return [];
    if (gm.host === this.me) return this.skip(gm, at.i + 1, now, now);
    if (!this.hostGone(gm, now) || !this.rebase(gm, at.i + 1, now)) return [];
    gm.advance = { i: at.i + 1, at: now };
    gm.ready.set(this.me, at.i);
    return this.send(gm, this.advancing(gm, gm.advance));
  }

  /** よみおわった in a reveal (a player's, the host still here): sent as a skip to the round I'm in, which the host's
   *  つぎへ counts (an older phone ignores a player's skip). Once. */
  ready(now: number): RoundOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host === this.me) return [];
    const at = this.at(gm, now);
    if (at.phase !== 'reveal' || (gm.ready.get(this.me) ?? -1) >= at.i) return [];
    gm.ready.set(this.me, at.i);
    return this.send(gm, this.readying(gm, at.i));
  }

  /** Done with the results or a notice: back to idle. */
  close(now: number): void {
    this.prune(now);
    this.notice = null;
    const gm = this.mine();
    if (gm && this.over(gm, now)) this.games.delete(gm.g);
  }

  // ---------- the view ----------

  view(now: number): RoundView {
    this.prune(now);
    const gm = this.mine();
    const none: RoundView = {
      phase: 'idle', g: null, host: null, amHost: false, local: false, gm: null, o: [], same: false, seed: 0, vs: false, speaks: true, players: [],
      i: -1, n: 0, from: 0, until: Infinity, playAt: 0, playEnd: 0, limit: 0, out: false, answers: [], had: [], scores: {}, team: { right: 0, all: 0, done: 0 }, teamFirst: 0,
      rightNow: 0, canNext: false, canReady: false, ready: { n: 0, of: 0 }, invite: null, notice: this.notice
    };
    if (!gm) {
      const o = this.offer(now);
      return o ? { ...none, invite: { g: o.g, host: o.host, gm: o.gm, o: o.o, ...(o.u !== undefined && { u: o.u }), same: (o.f & F_SAME) !== 0, started: o.goAt !== undefined } } : none;
    }
    const at = this.at(gm, now);
    const scores: Partial<Record<Who, number>> = {};
    for (const w of gm.joined) scores[w] = this.scoreOf(gm, w);
    const reveal = at.phase === 'reveal' || at.phase === 'results';
    const players = ORDER.filter((w) => gm.joined.has(w)).map((who): RoundPlayer => {
      const a = at.i >= 0 ? gm.answers.get(who)?.get(at.i) : undefined;
      return {
        who, here: who === this.me || this.here.has(who), answered: !!a, score: scores[who] ?? 0,
        ready: at.phase === 'reveal' && (gm.ready.get(who) ?? -1) >= at.i,
        ...(a && reveal ? { pick: { a: a.a, ok: rightOf(gm, who, at.i) } } : {})
      };
    });
    const mine = gm.answers.get(this.me);
    const gone = this.hostGone(gm, now);
    const others = players.filter((p) => p.who !== gm.host && p.who !== this.me && p.here);
    const upto = at.phase === 'results' ? gm.n : reveal ? at.i + 1 : Math.max(0, at.i);
    const same = (gm.f & F_SAME) !== 0;
    return {
      ...none, phase: at.phase, g: gm.g, host: gm.host, amHost: gm.host === this.me, local: !!gm.local, gm: gm.gm, o: gm.o, ...(gm.u !== undefined && { u: gm.u }),
      same, seed: gm.seed, vs: (gm.f & F_VS) !== 0, team: team(gm, upto, this.w), teamFirst: teamFirst(gm, upto),
      rightNow: at.phase === 'reveal' ? players.filter((p) => p.pick?.ok).length : 0,
      speaks: !same || gm.host === this.me, players, i: at.i, n: gm.n, from: at.from, until: at.until, playAt: at.playAt, playEnd: at.playEnd,
      limit: at.limit, out: at.out, answers: Array.from({ length: gm.n }, (_, i) => mine?.get(i) ?? null),
      had: Array.from({ length: gm.n }, (_, i) => !!mine?.has(i) || this.times(gm, i).playAt >= gm.inAt), scores,
      canNext: at.phase === 'reveal' && (gm.host === this.me || gone),
      canReady: at.phase === 'reveal' && gm.host !== this.me && !gone && !gm.deck.timing(at.i).auto,
      ready: { n: others.filter((p) => p.ready).length, of: others.length }
    };
  }

  // ---------- inside ----------

  /** A game from its set-up (null: a game this build doesn't have, or options it can't read). */
  private game(g: string, host: Who, s: Setup, now: number): Game | null {
    const made = this.dealt(s);
    if (!made) return null;
    const gm: Game = {
      ...s, ...made, g, host, opened: now, joined: new Set([host]), played: new Set([host]), since: new Map([[host, -Infinity]]), starts: new Map(), inAt: now,
      answers: new Map(), totals: new Map(), allIn: new Map(), ready: new Map()
    };
    this.games.set(g, gm);
    return gm;
  }

  /** A set-up's game and deck, and its rounds. */
  private dealt(s: Setup): { def: GameDef<unknown>; deck: RoundDeck; n: number } | null {
    const def = this.defs(s.gm), opts = def?.opts.decode(s.o);
    if (!def || !opts) return null;
    const deck = def.deck(s.seed, opts, { u: s.u, w: this.w, enc: s.o });
    return { def, deck, n: rounds(deck) };
  }

  private setup(gm: Game, s: Setup): void {
    if (s.gm !== gm.gm || s.seed !== gm.seed || !sameList(s.o, gm.o) || s.u !== gm.u) {
      const made = this.dealt(s);
      if (!made) return;
      Object.assign(gm, made);
    }
    Object.assign(gm, { gm: s.gm, seed: s.seed, o: s.o, f: s.f, u: s.u });
  }

  /** The game I'm in. */
  private mine(): Game | undefined {
    for (const gm of this.games.values()) if (gm.joined.has(this.me)) return gm;
    return undefined;
  }

  /** The newest game someone here opened that I'm not in and that's still going. */
  private offer(now: number): Game | undefined {
    let best: Game | undefined;
    for (const gm of this.games.values())
      if (!gm.joined.has(this.me) && this.here.has(gm.host) && !this.over(gm, now) && (!best || gm.opened >= best.opened)) best = gm;
    return best;
  }

  private drop(gm: Game, why: RoundNotice): void {
    this.games.delete(gm.g);
    if (gm.joined.has(this.me)) this.notice = why;
  }

  /** A lobby never started (10 min) or whose host is gone goes; a game over that I'm not in goes. */
  private prune(now: number): void {
    for (const gm of [...this.games.values()]) {
      if (gm.goAt === undefined) {
        if (this.hostGone(gm, now)) this.drop(gm, 'host-left');
        else if (now - gm.opened >= this.w.openTtl) this.drop(gm, 'stale');
      } else if (!gm.joined.has(this.me) && this.over(gm, now)) this.games.delete(gm.g);
    }
  }

  /** The host has really gone: it left, or its phone has been away past the grace (a moment's reconnect isn't). */
  private hostGone(gm: Game, now: number): boolean {
    if (gm.host === this.me) return false;
    if (!gm.joined.has(gm.host)) return true;
    return !this.here.has(gm.host) && now - (this.away.get(gm.host) ?? gm.opened) >= this.w.hostGrace;
  }

  /** The host's position, heard at `now`: round i starts at `at` (even under way here, or behind where this phone got
   *  to by itself). A round whose clip began more than `late` before it came is sat out. */
  private adopt(gm: Game, i: number, at: number, now: number): void {
    if (this.start(gm, i) === at && ![...gm.starts.keys()].some((j) => j > i)) return;
    fix(gm, i, at);
    if (i < gm.n && now - (at + gm.deck.timing(i).lead) > this.w.late) gm.inAt = Math.max(gm.inAt, now);
  }

  /** Round i starts at `at` here when that's sooner than the schedule (the host's skip; a player's with the host
   *  gone). */
  private rebase(gm: Game, i: number, at: number): boolean {
    if (at >= this.start(gm, i)) return false;
    fix(gm, i, at);
    return true;
  }

  /** The host's skip to round i (n: the results) at `at`: applied here and sent, when sooner than the schedule. */
  private skip(gm: Game, i: number, at: number, now: number): RoundOut[] {
    if (i > gm.n || !this.rebase(gm, i, at)) return [];
    gm.pos = { i, at };
    return gm.local ? [] : [this.beacon(gm, now)];
  }

  /** The host's position now: the latest start it fixed, or the round its schedule is in if that's later. */
  private position(gm: Game, now: number): { i: number; at: number } {
    const cur = Math.max(0, this.at(gm, now).i);
    if (!gm.pos || cur > gm.pos.i) gm.pos = { i: cur, at: this.start(gm, cur) };
    return gm.pos;
  }

  /** The host's position as a `skip` (noted as sent). */
  private beacon(gm: Game, now: number): RoundOut {
    const p = this.position(gm, now);
    gm.beaconed = { ...p, t: now };
    return { g: gm.g, gm: gm.gm, op: 'skip', i: p.i, at: p.at };
  }

  private opening(gm: Game): RoundOut {
    return { g: gm.g, gm: gm.gm, op: 'open', seed: gm.seed, f: gm.f, o: gm.o, ...(gm.u !== undefined && { u: gm.u }) };
  }

  /** `go` at `at`, with the players in it at the start (`pl`, the `play` wire's: 8c's roles). */
  private going(gm: Game, at: number): RoundOut {
    return { g: gm.g, gm: gm.gm, op: 'go', at, ...(gm.pl !== undefined && { pl: gm.pl }) };
  }

  /** My answer to round i as an `a` (with my running total), if I gave one. */
  private answerOf(gm: Game, i: number): RoundOut | null {
    const a = gm.answers.get(this.me)?.get(i);
    return a ? { g: gm.g, gm: gm.gm, op: 'a', i, k: a.a, rp: a.rp, s: Math.min(gm.deck.maxScore, sum(gm, this.me)) } : null;
  }

  /** よみおわった for round i: a player's skip to the round it's in (its start, as the host's beacon has it). */
  private readying(gm: Game, i: number): RoundOut {
    return { g: gm.g, gm: gm.gm, op: 'skip', i, at: this.start(gm, i) };
  }

  /** A player's つぎへ with the host gone: its skip to the next round. */
  private advancing(gm: Game, p: { i: number; at: number }): RoundOut {
    return { g: gm.g, gm: gm.gm, op: 'skip', i: p.i, at: p.at };
  }

  /** What a phone back or joining may have missed of mine for the round under way: my answer, my よみおわった. */
  private resend(gm: Game, now: number): RoundOut[] {
    if (gm.goAt === undefined || gm.local || this.over(gm, now)) return [];
    const at = this.at(gm, now);
    if (at.i < 0 || at.i >= gm.n) return [];
    const a = this.answerOf(gm, at.i);
    const ready = gm.host !== this.me && at.phase === 'reveal' && (gm.ready.get(this.me) ?? -1) >= at.i;
    return [...(a ? [a] : []), ...(ready ? [this.readying(gm, at.i)] : [])];
  }

  /** A player's skip heard: round i at or before the one I'm in, their よみおわった for it; a later one, their つぎへ
   *  with the host gone (done reading the one before), followed here once I see the host gone too (the host itself
   *  adopts it: it was away, and the players moved on). */
  private heard(gm: Game, w: Who, i: number, at: number, now: number): RoundOut[] {
    if (!gm.joined.has(w) || gm.goAt === undefined) return [];
    const cur = this.at(gm, now).i;
    if (i <= cur) {
      gm.ready.set(w, Math.max(gm.ready.get(w) ?? -1, i));
      return [];
    }
    gm.ready.set(w, Math.max(gm.ready.get(w) ?? -1, i - 1));
    if (!gm.advance || i > gm.advance.i) gm.advance = { i, at };
    if (gm.host === this.me) {
      const p = gm.advance;
      gm.advance = undefined;
      return this.skip(gm, p.i, p.at, now);
    }
    this.follow(gm, now);
    return [];
  }

  /** The host gone: a player's つぎへ heard (or mine) moves this phone on too. */
  private follow(gm: Game, now: number): void {
    if (gm.advance && gm.host !== this.me && this.hostGone(gm, now)) this.rebase(gm, gm.advance.i, gm.advance.at);
  }

  /** Mine to the others (nothing of a lobby of mine not announced). */
  private send(gm: Game, m: RoundOut): RoundOut[] {
    return gm.local ? [] : [m];
  }

  private start(gm: Game, i: number): number {
    return schedule(gm, this.w)[i];
  }

  private at(gm: Game, now: number): Where {
    return where(gm, now, this.w);
  }

  private times(gm: Game, i: number) {
    return times(gm, i, schedule(gm, this.w));
  }

  private over(gm: Game, now: number): boolean {
    return gm.goAt !== undefined && this.at(gm, now).phase === 'results';
  }

  /** The current round's early reveal (someone gone or leaving was the one not in). */
  private checkNow(gm: Game, now: number): void {
    if (gm.goAt !== undefined) this.check(gm, this.at(gm, now).i, now);
  }

  /** Everyone joined and here has answered round i: its reveal starts now, on each phone from the answers it heard
   *  (nothing sent: the reveal holds till つぎへ, so there's no end to skip to). A round I sit out doesn't wait for me
   *  (back from a lock into the others' reveal: theirs re-sent, mine never coming), nor for one who joined after its
   *  clip began (they sit it out: timed, it's not theirs). */
  private check(gm: Game, i: number, now: number): void {
    if (!gm.joined.has(this.me) || gm.goAt === undefined || i < 0 || i >= gm.n || gm.allIn.has(i)) return;
    const t = this.times(gm, i), timed = Number.isFinite(t.answer), playAt = t.playAt;
    const players = [...gm.joined].filter((w) =>
      w === this.me ? !(timed && playAt < gm.inAt) : this.here.has(w) && !(timed && (gm.since.get(w) ?? -Infinity) > playAt && !gm.answers.get(w)?.has(i))
    );
    if (players.every((w) => gm.answers.get(w)?.has(i))) gm.allIn.set(i, now);
  }

  /** Mine counted here; another's their latest running total (else what I heard of theirs). */
  private scoreOf(gm: Game, w: Who): number {
    const t = w === this.me ? undefined : gm.totals.get(w);
    return t ? t.s : sum(gm, w);
  }
}

/** A player comes into a game at `at` (relay clock; a re-sent `join` from one already in changes nothing). */
function enter(gm: Game, w: Who, at: number): void {
  if (!gm.joined.has(w)) gm.since.set(w, at);
  gm.joined.add(w);
  gm.played.add(w);
}

/** A deck's rounds (at most a game's on the wire). */
const rounds = (deck: RoundDeck): number => Math.max(0, Math.min(PLAY_ROUNDS, deck.count));

/** The seed bits a game fixes for these options and flags, and their mask (none: 0, 0). */
function seedBitsOf(def: GameDef<unknown>, opts: unknown, f: number): { flags: number; mask: number } {
  return def.seedBits ? { flags: def.seedBits.of(opts, f) & def.seedBits.mask, mask: def.seedBits.mask } : { flags: 0, mask: 0 };
}

const sameSetup = (gm: Setup, s: Setup): boolean => gm.gm === s.gm && gm.seed === s.seed && gm.f === s.f && gm.u === s.u && sameList(gm.o, s.o);
