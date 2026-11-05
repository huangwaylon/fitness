// ききみみ クイズ's state machine (docs/kikimimi.md "Sync"): pure (no I/O, no timers, no clock of its own). It folds
// the quiz intents heard (live.on), who is here (live status().here) and the relay's clock (live.serverNow(), passed in
// as `now` to every call) into a view: {phase, players, answers, scores, i, …}. The host is the clock: every phone
// computes a question's lead-in, clip and answer window from its start and the clip's length, and adopts the host's
// position (its `skip`: question i starts at `at`, sent as it changes and every few seconds as a beacon) whenever it
// hears it. The reveal is untimed (time to read), so the next question's start is only ever known from the host's
// つぎへ (its skip); the answer window is the lobby's こたえる じかん (20 / 30 / 60 s, or none: everyone in). Each call
// returns the intents to send (my taps, the host's skips and beacons, the re-sends when someone comes back), which the
// caller hands to live.send; the UI only renders `view(now)`. The deck comes in through an interface (QuizDeck).
import type { Live } from '../sync/live.ts';
import { points } from './score.ts';
import { QUIZ_MAX_S, QUIZ_QS, type QuizLv, type QuizWire, type Relayed, type Who } from '../contract/live-protocol.ts';

/** Where a game is: none (`idle`, an invite perhaps), the lobby, the 3-2-1, a question's lead-in (the villager pops
 *  in), its clip playing, its answer window, its reveal, the results. */
export type QuizPhase = 'idle' | 'lobby' | 'countdown' | 'lead' | 'play' | 'answer' | 'reveal' | 'results';

/** What the session needs of a game's deck (kikimimi/deck.ts deck(seed, lv), its clips' lengths from clips.json): how
 *  many questions, each one's clip length (ms) and its right choice (after the deck's shuffle). */
export interface QuizDeck {
  count: number;
  dur(i: number): number;
  answer(i: number): number;
  /** A player's points from their answers, when the deck scores its own way (スピード はしご: the rungs climbed,
   *  ladder.ts ladderPoints); else each answer's points.ts `points`. */
  score?(answers: ReadonlyMap<number, { k: number; rp: boolean }>): number;
}
/** The deck every phone builds from an `open`'s seed and level. */
export type DeckOf = (seed: number, lv: QuizLv) => QuizDeck;

/** The schedule's windows (ms), the same on every phone (?kikimimi=fast: FAST_WINDOWS on all of them). */
export interface QuizWindows {
  /** `go`'s `at` is the host's now + this (the 3-2-1). */
  countdown: number;
  /** A question's lead-in before its clip. */
  lead: number;
  /** The time limit from the clip's end, by the lobby's こたえる じかん (the seed's bits 2-3, TIMERS' order: 30, 20,
   *  60 s, none: Infinity, the reveal once everyone in it has answered). No reveal window: it lasts till つぎへ. */
  answers: readonly [number, number, number, number];
  /** The host's position heard more than this after its question's clip began: that question is sat out. */
  late: number;
  /** A lobby not started within this of its `open` is dropped. */
  openTtl: number;
  /** The host away this long has gone (a moment's reconnect hasn't): its lobby is dropped, and in a game each phone
   *  moves on by itself. */
  hostGrace: number;
  /** The host's beacon: its position at least this often while a game runs. */
  beacon: number;
}
export const WINDOWS: QuizWindows = { countdown: 4000, lead: 1500, answers: [30_000, 20_000, 60_000, Infinity], late: 5000, openTtl: 600_000, hostGrace: 15_000, beacon: 3000 };
/** The `?kikimimi=fast` test hook's: a shorter time limit (still roomy: a throttled tab's taps); none stays none. */
export const FAST_WINDOWS: QuizWindows = { ...WINDOWS, answers: [8000, 8000, 8000, Infinity] };

/** A quiz intent to send (live.send), and one heard (live.on). */
export type QuizOut = { kind: 'quiz' } & QuizWire;
export type QuizIn = Extract<Relayed, { kind: 'quiz' }>;

/** An answer: the choice, whether the clip was replayed or slowed first, when it was given or heard (relay clock). */
interface QuizAnswer {
  k: number;
  rp: boolean;
  t: number;
}

/** A player in the game: here or away (a locked phone), whether they answered the current question (never what,
 *  until its reveal: `pick` then), their score. */
interface QuizPlayer {
  who: Who;
  here: boolean;
  answered: boolean;
  /** Their choice for the current question, in its reveal only (and whether it was right). */
  pick?: { k: number; ok: boolean };
  /** In a reveal: they tapped よみおわった (done reading; the host's つぎへ counts them). */
  ready: boolean;
  score: number;
}

/** A lobby or game someone else opened that I haven't joined: the invite banner's. */
interface QuizInvite {
  g: string;
  host: Who;
  lv: QuizLv;
  /** スピード はしご (the seed's bit 1). */
  ladder: boolean;
  same: boolean;
  /** It's already going (さんか joins at the next question). */
  started: boolean;
}

/** A multiplayer game's team result (co-op, the default: docs/kikimimi.md "Co-op and たいせん"), over the questions
 *  revealed so far: `right` those at least one player got right (the team covers it: 「ふたりで n/8」; a player who
 *  left still counts for the ones they answered), `all` those every player who had the question got right (「そろって
 *  せいかい」: had it, answered it or was in the game as its clip began), `done` the questions counted. From what this
 *  phone heard, the same on every phone (a lost `a` costs that question's credit here only). Never who missed. */
interface QuizTeam {
  right: number;
  all: number;
  done: number;
}

/** たいせん (ranking) rides on the `open`'s seed: its lowest bit (1: たいせん; a new lobby's seed is even, co-op). No
 *  new field, so no relay deploy (the relay passes known fields only); flipping it deals a new deck, never seen yet. */
export const versus = (seed: number): boolean => (seed & 1) === 1;
const withVersus = (seed: number, vs: boolean): number => ((seed & ~1) | (vs ? 1 : 0)) >>> 0;
/** スピード はしご (kikimimi/ladder.ts) rides on the seed too: its bit 1 (a quiz lobby's seed has it clear). The deck is
 *  the ladders' then, the level unused; the session is the quiz's (8 questions), its points the deck's (QuizDeck.score). */
export const isLadder = (seed: number): boolean => (seed & 2) === 2;
export const withLadder = (seed: number, on: boolean): number => ((seed & ~2) | (on ? 2 : 0)) >>> 0;

/** こたえる じかん (the answer window, s; 0: none, the reveal once everyone in it has answered) rides on the seed too:
 *  bits 2-3 are its index here (bit 1 is スピード はしご's): 0 30 s, the default; 1 20 s; 2 60 s; 3 none. Like たいせん,
 *  no new field and no relay deploy, every phone computes the same limit from the `open`, and changing it deals a new
 *  deck. */
export const TIMERS = [30, 20, 60, 0] as const;
export type QuizTimer = (typeof TIMERS)[number];
export const timerOf = (seed: number): QuizTimer => TIMERS[(seed >>> 2) & 3];
const withTimer = (seed: number, timer: QuizTimer): number => ((seed & ~12) | (Math.max(0, TIMERS.indexOf(timer)) << 2)) >>> 0;

/** Why my game went away: the host cancelled it, the host left the lobby, or it was never started. */
export type QuizNotice = 'cancelled' | 'host-left' | 'stale';

export interface QuizView {
  phase: QuizPhase;
  /** My game (joined), else null. */
  g: string | null;
  host: Who | null;
  amHost: boolean;
  /** My lobby, on this phone only (not announced: みんなを さそう not tapped). */
  local: boolean;
  lv: QuizLv;
  same: boolean;
  seed: number;
  /** たいせん: points and a ranking (else co-op: the team's tally, no one's score shown to the others). */
  vs: boolean;
  /** スピード はしご (else the quiz at `lv`). */
  ladder: boolean;
  /** こたえる じかん (s; 0: none). */
  timer: QuizTimer;
  /** Whether this phone plays the clips (おなじへや: the host's only). */
  speaks: boolean;
  /** Who joined, A B G order. */
  players: QuizPlayer[];
  /** The current question (0-based), -1 before the first, n at the results. */
  i: number;
  /** The game's questions. */
  n: number;
  /** The phase's span on the relay's clock (the lobby, idle and the results: `until` Infinity). */
  from: number;
  until: number;
  /** The current question's clip start and end, and its time limit (relay clock). */
  playAt: number;
  playEnd: number;
  limit: number;
  /** This question is sat out (its clip began well before this phone heard of it: a late `go`, a lock, a join mid-game). */
  out: boolean;
  /** My answer to each question (null: none), for the reveal and the review list. */
  answers: (QuizAnswer | null)[];
  /** Whether I had each question: answered it, or its clip began after I came into the schedule (not sat out: a
   *  mid-game join, a late `go`, a lock). My `listen` row holds only these (a question not had isn't a miss). */
  had: boolean[];
  scores: Partial<Record<Who, number>>;
  /** The team's tally so far (counted in the reveal and the results). */
  team: QuizTeam;
  /** In a reveal: how many players got this question right (「2にん せいかい」). */
  rightNow: number;
  /** I may tap つぎへ: the host in its reveal (any player once the host has gone). */
  canNext: boolean;
  /** I may tap よみおわった: a player (not the host) in a reveal, the host still here. */
  canReady: boolean;
  /** In a reveal: how many of the others here (not the host) have tapped よみおわった, of how many (the host's つぎへ). */
  ready: { n: number; of: number };
  invite: QuizInvite | null;
  notice: QuizNotice | null;
}

interface Game {
  g: string;
  host: Who;
  seed: number;
  lv: QuizLv;
  same: boolean;
  deck: QuizDeck;
  n: number;
  /** The answer window (ms, from the seed's こたえる じかん; Infinity: none). */
  answer: number;
  /** When this phone first heard of it, or announced it (the lobby's TTL). */
  opened: number;
  /** My lobby not announced yet: nothing of it is sent. */
  local?: boolean;
  /** Who joined (the host too), and still in it. */
  joined: Set<Who>;
  /** Everyone who has been in it (never shrinks: a player who left keeps their answers in the team's tally). */
  played: Set<Who>;
  /** When each player in it came in (relay clock, as heard: their `join`; the host, -Infinity): they had every question
   *  whose clip began from then on (the team's そろって, the same on every phone). */
  since: Map<Who, number>;
  /** `go`'s `at` (the host's re-send). */
  goAt?: number;
  /** Question starts fixed here (`go`: 0; the host's position; n: the results); the rest follow from the one before. */
  starts: Map<number, number>;
  /** When this phone came into the schedule: questions whose clip began before are sat out. */
  inAt: number;
  answers: Map<Who, Map<number, QuizAnswer>>;
  /** Each other player's latest running total (`a`'s `s`): a lost `a` is made up by the next. */
  totals: Map<Who, { i: number; s: number }>;
  /** When everyone joined and here had answered question i (its early reveal). */
  allIn: Map<number, number>;
  /** The host's position (its own phone's): the latest start it fixed or the question it's in. */
  pos?: { i: number; at: number };
  /** The host's last position sent, and when. */
  beaconed?: { i: number; at: number; t: number };
  /** Each player's よみおわった: the question whose reveal they're done reading (the latest). */
  ready: Map<Who, number>;
  /** The host gone: the furthest a player's つぎへ moved the game (mine or heard), so a phone that sees the host gone a
   *  moment later follows it, and a host back from a lock behind it adopts it. */
  advance?: { i: number; at: number };
}

/** The players' order (A B G), as the chips show them. */
export const ORDER: readonly Who[] = ['A', 'B', 'G'];
const GAME_ID = 'abcdefghijklmnopqrstuvwxyz0123456789';

export interface QuizSessionOptions {
  me: Who;
  deckOf: DeckOf;
  windows?: Partial<QuizWindows>;
  /** For the game id and seed (tests: a fixed one). */
  random?: () => number;
}

/** One phone's quiz: every game it hears of, the one it's in. */
export class QuizSession {
  readonly me: Who;
  readonly w: QuizWindows;
  private readonly deckOf: DeckOf;
  private readonly random: () => number;
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
  private notice: QuizNotice | null = null;

  constructor(o: QuizSessionOptions) {
    this.me = o.me;
    this.deckOf = o.deckOf;
    this.w = { ...WINDOWS, ...o.windows };
    this.random = o.random ?? Math.random;
  }

  // ---------- what's heard ----------

  /** A quiz intent from another phone. */
  receive(m: QuizIn, now: number): QuizOut[] {
    if (m.who === this.me || this.left.has(m.g)) return [];
    this.prune(now);
    const gm = this.games.get(m.g);
    switch (m.op) {
      case 'open': {
        if (gm) {
          // the host's re-send, or its lobby's level or おなじへや changed
          if (gm.host === m.who && gm.goAt === undefined && (gm.seed !== m.seed || gm.lv !== m.lv || gm.same !== m.same)) this.setup(gm, m.seed, m.lv, m.same);
          return [];
        }
        // a host has one lobby: an older one of theirs not started goes
        for (const o of this.games.values()) if (o.host === m.who && o.goAt === undefined) this.drop(o, 'cancelled');
        const fresh = this.game(m.g, m.who, m.seed, m.lv, m.same, now);
        for (const w of this.early.get(m.g) ?? []) enter(fresh, w, now);
        this.early.delete(m.g);
        return [];
      }
      case 'join':
        if (gm) {
          enter(gm, m.who, now);
          // a phone joining (or back): my answer and よみおわった for the question under way, which it may have missed
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
        }
        return [];
      case 'skip':
        if (!gm || m.i > gm.n) return [];
        if (m.who === gm.host) {
          // the host back behind where we moved on while it was gone: ours to it (it adopts it), not its to us
          if (gm.advance && m.i < gm.advance.i && gm.goAt !== undefined) return this.send(gm, this.advancing(gm, gm.advance));
          // the host's position (its clock): adopted even for a question already under way here, or one I raced past
          this.adopt(gm, m.i, m.at, now);
          gm.goAt ??= m.at;
          if (gm.advance && m.i >= gm.advance.i) gm.advance = undefined;
          return [];
        }
        return this.heard(gm, m.who, m.i, m.at, now);
      case 'a': {
        if (!gm || m.i >= gm.n) return [];
        // their join unheard: in from this question at the latest
        enter(gm, m.who, gm.goAt === undefined ? now : Math.min(now, this.times(gm, m.i).playAt));
        const mine = gm.answers.get(m.who) ?? new Map<number, QuizAnswer>();
        gm.answers.set(m.who, mine);
        if (!mine.has(m.i)) mine.set(m.i, { k: m.k, rp: m.rp, t: now });
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
  presence(here: readonly Who[] | null, now: number): QuizOut[] {
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
    const out: QuizOut[] = [];
    const gm = this.mine();
    if (!gm || this.over(gm, now)) return out;
    if (back.length && !gm.local) {
      if (gm.host !== this.me) out.push({ kind: 'quiz', g: gm.g, op: 'join' });
      else {
        out.push({ kind: 'quiz', g: gm.g, op: 'open', seed: gm.seed, lv: gm.lv, same: gm.same });
        if (gm.goAt !== undefined) out.push({ kind: 'quiz', g: gm.g, op: 'go', at: gm.goAt }, this.beacon(gm, now));
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
  tick(now: number): QuizOut[] {
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

  /** Open a lobby of mine (せってい's あそぶ), on this phone only until I invite the others: I'm its host. Leaves the
   *  game I was in. */
  open(o: { lv: QuizLv; same?: boolean; vs?: boolean; ladder?: boolean; timer?: QuizTimer }, now: number): QuizOut[] {
    const out = this.leave(now);
    this.notice = null;
    let g = '';
    do {
      g = '';
      for (let n = 0; n < 6; n++) g += GAME_ID[Math.floor(this.random() * GAME_ID.length) % GAME_ID.length];
    } while (this.games.has(g));
    const seed = withTimer(withLadder(withVersus(Math.floor(this.random() * 2 ** 32), !!o.vs), !!o.ladder), o.timer ?? 30);
    const gm = this.game(g, this.me, seed, o.lv, o.same ?? false, now);
    gm.local = true;
    return out;
  }

  /** みんなを さそう: my lobby is announced (an `open`: everyone here gets the invite). */
  invite(now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host !== this.me || !gm.local || gm.goAt !== undefined) return [];
    gm.local = false;
    gm.opened = now;
    return [this.opening(gm)];
  }

  /** The host changes its lobby's level, おなじへや, たいせん, the mode (スピード はしご) or こたえる じかん, sent again as an
   *  `open` once announced. */
  configure(o: { lv?: QuizLv; same?: boolean; vs?: boolean; ladder?: boolean; timer?: QuizTimer }, now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host !== this.me || gm.goAt !== undefined) return [];
    let seed = o.vs === undefined ? gm.seed : withVersus(gm.seed, o.vs);
    if (o.ladder !== undefined) seed = withLadder(seed, o.ladder);
    if (o.timer !== undefined) seed = withTimer(seed, o.timer);
    this.setup(gm, seed, o.lv ?? gm.lv, o.same ?? gm.same);
    return this.send(gm, this.opening(gm));
  }

  /** Join the invite (さんか; a game already going: from its next question). Leaves the game I was in. */
  join(now: number, g?: string): QuizOut[] {
    this.prune(now);
    const gm = g !== undefined ? this.games.get(g) : this.offer(now);
    if (!gm || gm.joined.has(this.me) || this.over(gm, now)) return [];
    const out = this.leave(now);
    this.notice = null;
    enter(gm, this.me, now);
    gm.inAt = now;
    out.push({ kind: 'quiz', g: gm.g, op: 'join' });
    return out;
  }

  /** Leave my game (✕): the host's lobby is cancelled (`end`); a game going goes on for the others, the host's too. */
  leave(now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm) return [];
    this.games.delete(gm.g);
    this.left.add(gm.g);
    if (this.over(gm, now)) return [];
    return this.send(gm, { kind: 'quiz', g: gm.g, op: gm.host === this.me && gm.goAt === undefined ? 'end' : 'leave' });
  }

  /** The host starts the game (はじめる): the 3-2-1, then question 0 at now + the countdown (alone, not announced:
   *  nothing sent). */
  go(now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host !== this.me || gm.goAt !== undefined) return [];
    const at = now + this.w.countdown;
    gm.n = questions(gm.deck); // (a deck settled in the lobby: にがて れんしゅう's own, on this phone alone)
    gm.goAt = at;
    gm.starts.set(0, at);
    gm.pos = { i: 0, at };
    gm.beaconed = { i: 0, at, t: now };
    return this.send(gm, { kind: 'quiz', g: gm.g, op: 'go', at });
  }

  /** My answer to the current question (one tap, final; in its answer window only). `rp`: I replayed or slowed it. */
  answer(k: number, rp: boolean, now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || !Number.isInteger(k) || k < 0 || k > 3) return [];
    const at = this.at(gm, now);
    if (at.phase !== 'answer' || at.out) return [];
    const mine = gm.answers.get(this.me) ?? new Map<number, QuizAnswer>();
    gm.answers.set(this.me, mine);
    if (mine.has(at.i)) return [];
    mine.set(at.i, { k, rp, t: now });
    this.check(gm, at.i, now);
    return this.send(gm, this.answerOf(gm, at.i)!);
  }

  /** つぎへ in a reveal: the next question now (the last's: the results, on every phone). The host's; once the host has
   *  gone, any player's (sent as their skip: the others follow it, and so does the host if it comes back). */
  next(now: number): QuizOut[] {
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

  /** よみおわった in a reveal (a player's, the host still here): sent as a skip to the question I'm in, which the host's
   *  つぎへ counts (an older phone ignores a player's skip). Once. */
  ready(now: number): QuizOut[] {
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

  view(now: number): QuizView {
    this.prune(now);
    const gm = this.mine();
    const none: QuizView = {
      phase: 'idle', g: null, host: null, amHost: false, local: false, lv: 1, same: false, seed: 0, vs: false, ladder: false, timer: 30, speaks: true, players: [],
      i: -1, n: 0, from: 0, until: Infinity, playAt: 0, playEnd: 0, limit: 0, out: false, answers: [], had: [], scores: {}, team: { right: 0, all: 0, done: 0 },
      rightNow: 0, canNext: false, canReady: false, ready: { n: 0, of: 0 }, invite: null, notice: this.notice
    };
    if (!gm) {
      const o = this.offer(now);
      return o ? { ...none, invite: { g: o.g, host: o.host, lv: o.lv, ladder: isLadder(o.seed), same: o.same, started: o.goAt !== undefined } } : none;
    }
    const at = this.at(gm, now);
    const scores: Partial<Record<Who, number>> = {};
    for (const w of gm.joined) scores[w] = this.scoreOf(gm, w);
    const reveal = at.phase === 'reveal' || at.phase === 'results';
    const players = ORDER.filter((w) => gm.joined.has(w)).map((who): QuizPlayer => {
      const a = at.i >= 0 ? gm.answers.get(who)?.get(at.i) : undefined;
      return {
        who, here: who === this.me || this.here.has(who), answered: !!a, score: scores[who] ?? 0,
        ready: at.phase === 'reveal' && (gm.ready.get(who) ?? -1) >= at.i,
        ...(a && reveal ? { pick: { k: a.k, ok: a.k === gm.deck.answer(at.i) } } : {})
      };
    });
    const mine = gm.answers.get(this.me);
    const gone = this.hostGone(gm, now);
    const others = players.filter((p) => p.who !== gm.host && p.who !== this.me && p.here);
    return {
      ...none, phase: at.phase, g: gm.g, host: gm.host, amHost: gm.host === this.me, local: !!gm.local, lv: gm.lv, same: gm.same, seed: gm.seed,
      vs: versus(gm.seed), ladder: isLadder(gm.seed), timer: timerOf(gm.seed), team: this.team(gm, at.phase === 'results' ? gm.n : reveal ? at.i + 1 : Math.max(0, at.i)),
      rightNow: at.phase === 'reveal' ? players.filter((p) => p.pick?.ok).length : 0,
      speaks: !gm.same || gm.host === this.me, players, i: at.i, n: gm.n, from: at.from, until: at.until, playAt: at.playAt, playEnd: at.playEnd,
      limit: at.limit, out: at.out, answers: Array.from({ length: gm.n }, (_, i) => mine?.get(i) ?? null),
      had: Array.from({ length: gm.n }, (_, i) => !!mine?.has(i) || this.times(gm, i).playAt >= gm.inAt), scores,
      canNext: at.phase === 'reveal' && (gm.host === this.me || gone),
      canReady: at.phase === 'reveal' && gm.host !== this.me && !gone,
      ready: { n: others.filter((p) => p.ready).length, of: others.length }
    };
  }

  // ---------- inside ----------

  private game(g: string, host: Who, seed: number, lv: QuizLv, same: boolean, now: number): Game {
    const deck = this.deckOf(seed, lv);
    const gm: Game = {
      g, host, seed, lv, same, deck, n: questions(deck), answer: this.w.answers[(seed >>> 2) & 3], opened: now, joined: new Set([host]), played: new Set([host]),
      since: new Map([[host, -Infinity]]), starts: new Map(), inAt: now, answers: new Map(), totals: new Map(), allIn: new Map(), ready: new Map()
    };
    this.games.set(g, gm);
    return gm;
  }

  private setup(gm: Game, seed: number, lv: QuizLv, same: boolean): void {
    if (seed !== gm.seed || lv !== gm.lv) {
      gm.deck = this.deckOf(seed, lv);
      gm.n = questions(gm.deck);
    }
    Object.assign(gm, { seed, lv, same, answer: this.w.answers[(seed >>> 2) & 3] });
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

  private drop(gm: Game, why: QuizNotice): void {
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

  /** Question i (n: the results) starts at `at` here; the later ones follow from it. */
  private fix(gm: Game, i: number, at: number): void {
    gm.starts.set(i, at);
    for (const j of [...gm.starts.keys()]) if (j > i) gm.starts.delete(j);
  }

  /** The host's position, heard at `now`: question i starts at `at` (even under way here, or behind where this phone
   *  got to by itself). A question whose clip began more than `late` before it came is sat out. */
  private adopt(gm: Game, i: number, at: number, now: number): void {
    if (this.start(gm, i) === at && ![...gm.starts.keys()].some((j) => j > i)) return;
    this.fix(gm, i, at);
    if (i < gm.n && now - (at + this.w.lead) > this.w.late) gm.inAt = Math.max(gm.inAt, now);
  }

  /** Question i starts at `at` here when that's sooner than the schedule (the host's skip; a player's with the host
   *  gone). */
  private rebase(gm: Game, i: number, at: number): boolean {
    if (at >= this.start(gm, i)) return false;
    this.fix(gm, i, at);
    return true;
  }

  /** The host's skip to question i (n: the results) at `at`: applied here and sent, when sooner than the schedule. */
  private skip(gm: Game, i: number, at: number, now: number): QuizOut[] {
    if (i > gm.n || !this.rebase(gm, i, at)) return [];
    gm.pos = { i, at };
    return gm.local ? [] : [this.beacon(gm, now)];
  }

  /** The host's position now: the latest start it fixed, or the question its schedule is in if that's later. */
  private position(gm: Game, now: number): { i: number; at: number } {
    const cur = Math.max(0, this.at(gm, now).i);
    if (!gm.pos || cur > gm.pos.i) gm.pos = { i: cur, at: this.start(gm, cur) };
    return gm.pos;
  }

  /** The host's position as a `skip` (noted as sent). */
  private beacon(gm: Game, now: number): QuizOut {
    const p = this.position(gm, now);
    gm.beaconed = { ...p, t: now };
    return { kind: 'quiz', g: gm.g, op: 'skip', i: p.i, at: p.at };
  }

  private opening(gm: Game): QuizOut {
    return { kind: 'quiz', g: gm.g, op: 'open', seed: gm.seed, lv: gm.lv, same: gm.same };
  }

  /** My answer to question i as an `a` (with my running total), if I gave one. */
  private answerOf(gm: Game, i: number): QuizOut | null {
    const a = gm.answers.get(this.me)?.get(i);
    return a ? { kind: 'quiz', g: gm.g, op: 'a', i, k: a.k, rp: a.rp, s: Math.min(QUIZ_MAX_S, this.sum(gm, this.me)) } : null;
  }

  /** よみおわった for question i: a player's skip to the question it's in (its start, as the host's beacon has it). */
  private readying(gm: Game, i: number): QuizOut {
    return { kind: 'quiz', g: gm.g, op: 'skip', i, at: this.start(gm, i) };
  }

  /** A player's つぎへ with the host gone: its skip to the next question. */
  private advancing(gm: Game, p: { i: number; at: number }): QuizOut {
    return { kind: 'quiz', g: gm.g, op: 'skip', i: p.i, at: p.at };
  }

  /** What a phone back or joining may have missed of mine for the question under way: my answer, my よみおわった. */
  private resend(gm: Game, now: number): QuizOut[] {
    if (gm.goAt === undefined || gm.local || this.over(gm, now)) return [];
    const at = this.at(gm, now);
    if (at.i < 0 || at.i >= gm.n) return [];
    const a = this.answerOf(gm, at.i);
    const ready = gm.host !== this.me && at.phase === 'reveal' && (gm.ready.get(this.me) ?? -1) >= at.i;
    return [...(a ? [a] : []), ...(ready ? [this.readying(gm, at.i)] : [])];
  }

  /** A player's skip heard: question i at or before the one I'm in, their よみおわった for it; a later one, their つぎへ
   *  with the host gone (done reading the one before), followed here once I see the host gone too (the host itself
   *  adopts it: it was away, and the players moved on). */
  private heard(gm: Game, w: Who, i: number, at: number, now: number): QuizOut[] {
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
  private send(gm: Game, m: QuizOut): QuizOut[] {
    return gm.local ? [] : [m];
  }

  /** Every question's start here, 0 to n (n: the results), never decreasing. Question 0 at `go`'s `at`; the others
   *  only once fixed (the host's skip, its つぎへ; a player's with the host gone): the reveal before is untimed, so
   *  unfixed they're Infinity. A start fixed cuts the questions before it short (none shown once it has come). */
  private schedule(gm: Game): number[] {
    const s: number[] = [gm.starts.get(0) ?? gm.goAt ?? Infinity];
    for (let j = 1; j <= gm.n; j++) s.push(gm.starts.get(j) ?? Infinity);
    for (let j = gm.n - 1; j >= 0; j--) s[j] = Math.min(s[j], s[j + 1]);
    return s;
  }

  private start(gm: Game, i: number): number {
    return this.schedule(gm)[i];
  }

  /** Where the game is at `now`: in the last question started (the end of the schedule started: the results). */
  private at(gm: Game, now: number): { phase: QuizPhase; i: number; from: number; until: number; playAt: number; playEnd: number; limit: number; out: boolean } {
    const base = { i: -1, from: gm.opened, until: Infinity, playAt: 0, playEnd: 0, limit: 0, out: false };
    if (gm.goAt === undefined || gm.n === 0) return { ...base, phase: gm.n === 0 && gm.goAt !== undefined ? 'results' : 'lobby' };
    const s = this.schedule(gm);
    if (now < s[0]) return { ...base, phase: 'countdown', from: s[0] - this.w.countdown, until: s[0] };
    let i = gm.n;
    while (i > 0 && s[i] > now) i--;
    if (i === gm.n) return { ...base, phase: 'results', i, from: s[i] };
    const t = this.times(gm, i, s);
    // (untimed, a question begun before I came isn't sat out: no hurry, its clip plays from my 🔁)
    const q = { i, playAt: t.playAt, playEnd: t.playEnd, limit: t.limit, out: t.playAt < gm.inAt && Number.isFinite(gm.answer) };
    if (now < t.playAt) return { ...q, phase: 'lead', from: s[i], until: t.playAt };
    if (now < t.playEnd) return { ...q, phase: 'play', from: t.playAt, until: t.playEnd };
    if (now < t.reveal) return { ...q, phase: 'answer', from: t.playEnd, until: t.reveal };
    return { ...q, phase: 'reveal', from: t.reveal, until: s[i + 1] };
  }

  /** Question i's clip, limit (Infinity: none) and reveal: at the limit, once everyone in it has answered, or as the
   *  next question starts (its skip heard before this phone revealed). It lasts till the next starts. */
  private times(gm: Game, i: number, s = this.schedule(gm)) {
    const playAt = s[i] + this.w.lead;
    const playEnd = playAt + Math.max(0, gm.deck.dur(i));
    const limit = playEnd + gm.answer;
    const reveal = Math.max(playEnd, Math.min(limit, gm.allIn.get(i) ?? Infinity, s[i + 1]));
    return { playAt, playEnd, limit, reveal };
  }

  private over(gm: Game, now: number): boolean {
    return gm.goAt !== undefined && this.at(gm, now).phase === 'results';
  }

  /** The current question's early reveal (someone gone or leaving was the one not in). */
  private checkNow(gm: Game, now: number): void {
    if (gm.goAt !== undefined) this.check(gm, this.at(gm, now).i, now);
  }

  /** Everyone joined and here has answered question i: its reveal starts now, on each phone from the answers it heard
   *  (nothing sent: the reveal holds till つぎへ, so there's no end to skip to). A question I sit out doesn't wait for
   *  me (back from a lock into the others' reveal: theirs re-sent, mine never coming), nor for one who joined after its
   *  clip began (they sit it out: timed, it's not theirs). */
  private check(gm: Game, i: number, now: number): void {
    if (!gm.joined.has(this.me) || gm.goAt === undefined || i < 0 || i >= gm.n || gm.allIn.has(i)) return;
    const timed = Number.isFinite(gm.answer), playAt = this.times(gm, i).playAt;
    const players = [...gm.joined].filter((w) =>
      w === this.me ? !(timed && playAt < gm.inAt) : this.here.has(w) && !(timed && (gm.since.get(w) ?? -Infinity) > playAt && !gm.answers.get(w)?.has(i))
    );
    if (players.every((w) => gm.answers.get(w)?.has(i))) gm.allIn.set(i, now);
  }

  /** A player's answers' points counted here: 100 a right one (いっぱつ is a badge, no points); a deck that scores its
   *  own way counts them its way (スピード はしご's climb, where a replay is the replayer's own). */
  private sum(gm: Game, w: Who): number {
    if (gm.deck.score) return gm.deck.score(gm.answers.get(w) ?? new Map());
    let s = 0;
    for (const [i, a] of gm.answers.get(w) ?? []) s += points(a.k === gm.deck.answer(i));
    return s;
  }

  /** The team's tally over questions 0 … upto − 1, over everyone who has played (a player who left too): right by at
   *  least one player, right by every player who had it. */
  private team(gm: Game, upto: number): QuizTeam {
    const t: QuizTeam = { right: 0, all: 0, done: 0 };
    const who = [...gm.played];
    for (let i = 0; i < Math.min(upto, gm.n); i++) {
      const oks = who.map((w) => gm.answers.get(w)?.get(i)?.k === gm.deck.answer(i));
      t.done++;
      if (!oks.some(Boolean)) continue;
      t.right++;
      if (who.every((w, n) => oks[n] || !this.hadQuestion(gm, w, i))) t.all++;
    }
    return t;
  }

  /** Whether a player had question i, from what every phone hears alike: they answered it, or they're in the game and
   *  were when its clip began (their `join` heard before it; me too, whatever I sat out: the others can't know). A
   *  player who joined later doesn't hold back the ones before; one who left, the ones they didn't answer. */
  private hadQuestion(gm: Game, w: Who, i: number): boolean {
    if (gm.answers.get(w)?.has(i)) return true;
    return gm.joined.has(w) && this.times(gm, i).playAt >= (gm.since.get(w) ?? Infinity);
  }

  /** Mine counted here; another's their latest running total (else what I heard of theirs). */
  private scoreOf(gm: Game, w: Who): number {
    const t = w === this.me ? undefined : gm.totals.get(w);
    return t ? t.s : this.sum(gm, w);
  }
}

/** A player comes into a game at `at` (relay clock; a re-sent `join` from one already in changes nothing). */
function enter(gm: Game, w: Who, at: number): void {
  if (!gm.joined.has(w)) gm.since.set(w, at);
  gm.joined.add(w);
  gm.played.add(w);
}

/** A deck's questions (at most a game's). */
const questions = (deck: QuizDeck): number => Math.max(0, Math.min(QUIZ_QS, deck.count));

// ---------- the wiring (the UI's) ----------

/** What the session needs of the island's Live (relay ?? demoRelay, IslandScene: never a second one). */
export interface QuizLink {
  /** The relay's clock. */
  now(): number;
  send(m: QuizOut): boolean;
  /** Quiz intents heard. */
  on(fn: (m: QuizIn) => void): () => void;
  /** Who else is here (called at once; null while this phone's own socket is down). */
  onHere(fn: (here: readonly Who[] | null) => void): () => void;
}

/** A Live as a QuizLink. */
export function quizLink(live: Pick<Live, 'send' | 'on' | 'onStatus' | 'serverNow'>): QuizLink {
  return {
    now: () => live.serverNow(),
    send: (m) => live.send(m),
    on: (fn) => live.on((m) => void (m.kind === 'quiz' && fn(m))),
    onHere: (fn) => {
      let was = '';
      return live.onStatus((st) => {
        const key = st.connected ? st.here.join() : '-';
        if (key === was) return;
        was = key;
        fn(st.connected ? st.here : null);
      });
    }
  };
}

/** Wire a session to a link: what's heard and who's here go in (their outputs sent), `changed` after each. The UI's
 *  taps go through `act` (`act((s, now) => s.answer(k, rp, now))`); its wake-ups call `tick` (the host's beacon: sent,
 *  `changed` not called). */
export function wireQuiz(
  session: QuizSession,
  link: QuizLink,
  changed: () => void
): { act(f: (s: QuizSession, now: number) => QuizOut[] | void): void; tick(): void; stop(): void } {
  const send = (out: QuizOut[] | void) => {
    for (const m of out ?? []) link.send(m);
    changed();
  };
  const offs = [link.on((m) => send(session.receive(m, link.now()))), link.onHere((here) => send(session.presence(here, link.now())))];
  return {
    act: (f) => send(f(session, link.now())),
    tick: () => {
      for (const m of session.tick(link.now())) link.send(m);
    },
    stop: () => {
      for (const off of offs) off();
    }
  };
}
