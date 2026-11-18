// The island room's logic, free of the Workers runtime so it is unit-testable: sockets, their attachments, the clock
// and storage come in through RoomIO. The Durable Object (index.ts) is a thin adapter over this.
import { CLOSE, HB_PING, HB_PONG, HIGHFIVE_HOLD_MS, LIVE_V, LIVE_VS, MAX_BYTES, NEST_GAP_MS, REPLAY_BYTES, claimOf, musicAt, pickMaySend, musicBeats, musicLive, isStored, scopeMaySend, otherVersion, parseClient, tokyoDayNum, type ClientMsg, type Gone, type LiveV, type MusicRec, type MusicSrc, type Notice, type RecordMark, type Relayed, type ServerMsg, type SgAt, type SgIntent, type SgView, type Who, type Wx } from '../../app/src/lib/contract/live-protocol.ts';
import { AHEAD_MS } from '../../app/src/lib/contract/ops.ts';
import { keyOwner, type Keys } from './auth.ts';
import { Bucket } from './bucket.ts';
import { served } from './weather.ts';

/** A socket's attachment (survives hibernation): who it is once its hello was accepted, when it opened, and the protocol
 *  version it spoke in its hello. */
export interface Meta {
  who: Who | null;
  opened: number;
  v?: LiveV;
  /** The socket's own id (made at open, 2026-11-05): a walk's order is its socket's (admit). */
  sk?: string;
  /** When the room last heard from it (its hello, then a message: kept every HEARD_EVERY_MS at most). */
  hd?: number;
  /** Its hello said `beat`: the phone sends something (the heartbeat at least) whenever it has sent nothing for 20 s,
   *  so its silence means it's gone (sweepSilent). */
  bt?: true;
  /** Whose admission ticket it came with (contract/ticket.ts, the Worker's check): its hello must be that person's,
   *  and it is never let go to make room for another. */
  tk?: Who;
  /** Its hello's device id (`dev`, 2026-11-09): a hello replaces only the same device's sockets, and the person's other
   *  devices that said one hear their layout ops and `presence` (a phone from before it hears neither). */
  dv?: string;
}

export interface Sock {
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export interface RoomIO<S extends Sock> {
  /** Every open socket the room holds (after a hibernation too). */
  sockets(): S[];
  meta(s: S): Meta | null;
  setMeta(s: S, m: Meta): void;
  keys: Keys;
  now(): number;
  /** Persist the day's world (fire and forget). */
  save(ring: Kept[]): void;
  /** Persist the record's last change (`notify`) and the last the guest hears of (no member's ingest: guestNotice),
   *  for the welcomes (fire and forget; once per notify that moved either). */
  saveRec?(rec: RecordMark | null, recG: RecordMark | null): void;
  /** Persist the high-fives held for a partner who was away (fire and forget). */
  hold?(held: Held): void;
  /** Persist when each person's phone last left (fire and forget). */
  saveGone?(gone: Gone): void;
  /** Persist what the room acked but doesn't keep (fire and forget): a resend after a wake is acked again. */
  saveAcked?(acked: Acked): void;
  /** Persist the music stages (fire and forget). */
  saveMusic?(music: Music): void;
  /** Persist the day's claims and nests (fire and forget): they outlive the ring's trimming and a restart. */
  saveDay?(d: DayIndex): void;
  /** Persist one すごろく move (fire and forget), a storage row of its own (sgKey), and let a game's rows go. */
  saveSg?(key: string, e: SgRow): void;
  dropSg?(keys: string[]): void;
  /** When the runtime last answered this socket's heartbeat (ms; the auto-response's timestamp: HB_PING never reaches
   *  the room), or null. */
  heardAt?(s: S): number | null;
  /** A hello was welcomed: the room arms the ghosts' watch and fetches the real weather then, when it's due
   *  (weather.ts). */
  onHello?(): void;
}

/** The high-fives held for people while they were away, one per (sender, recipient) pair (`<from>><to>`, e.g. `G>A`):
 *  the last one only, a newer one of the pair replacing it; when it was tapped (`at`, its identity) and when the room
 *  heard it (`t`). */
export type Held = Partial<Record<string, { from: Who; to: Who; at: number; t: number }>>;

/** The music stages (docs/sound-sync.md): the last record per source (newerMusic), replayed at hello while musicLive. */
export type Music = Partial<Record<MusicSrc, MusicRec>>;

/** What the room acked but doesn't keep, as its storage holds it: `[<who>:<c>, {same, t}]`, oldest first. */
export type Acked = [string, { same: string; t: number }][];

/** The day's claims (who made each, its stamp and sequence number: a resend of it is acked again) and each tree's
 *  last nest, kept apart from the ring so that trimming the ring, and a restart after it, never lets a claim be made
 *  twice. `day`: the Tokyo day they are of (another day's are let go). */
export interface DayIndex {
  day: number;
  claims: [key: string, who: Who, t: number, c: number | null][];
  nests: [tree: string, t: number][];
}

/** A change as the room keeps it: relayed, with its sender's sequence number (`c`: a resend is known again) and the
 *  socket it came on (`sk`: a walk's numbers are compared on one socket only). Neither goes out again. */
export type Kept = Relayed & { c?: number; sk?: string };
/** A すごろく move as the room keeps it. */
export type SgKept = Extract<Kept, { kind: 'sg' }>;
/** A game's moves folded into one row (`sg:<g>`): its first moves, and its end once it has one. */
interface SgFold {
  moves: SgKept[];
  end?: SgKept;
}
/** A すごろく storage row: a move, or a game's fold. */
export type SgRow = SgKept | SgFold;

/** 英語すごろく's games (docs/backend.md#shared-world), apart from the day's ring (a long game is ~250 moves: in the ring
 *  they were the first trimmed, and every move rewrote it): each game's moves in order (`moves[i]`, the first of each
 *  `i`), its earliest end (`end`: its `i` the moves it follows), and its last move's stamp. One storage row a move
 *  (`sg:<g>:<i>`, the end `sg:<g>:e`) until SG_FOLD of them, or the end: then the game's moves so far go into its fold
 *  row (`sg:<g>`, `fold` of them) and their own rows go, so a wake reads a game's few rows, not its every move (2026-11-18,
 *  network review N4). A game goes SG_KEEP_MS after its last move, and past SG_GAMES the oldest. */
interface SgGame {
  moves: SgKept[];
  end?: SgKept;
  last: number;
  /** How many of its moves its fold row holds (0: none), and whether the end. */
  fold: number;
  foldEnd?: boolean;
}
const SG_FOLD = 32;
/** A fold row at most this long (JSON): past it, the moves keep their own rows (the store takes 128 KiB a value). */
const SG_FOLD_MAX = 100_000;
const SG_KEEP_MS = 2 * 86_400_000;
const SG_GAMES = 12;
/** A move's storage row. */
const sgKey = (e: Pick<SgIntent, 'g' | 'i' | 'a'>): string => `sg:${e.g}:${e.a === 'end' ? 'e' : e.i}`;
const foldKey = (g: string): string => `sg:${g}`;
/** Whether a game takes a move: a start for a game the room hasn't; a move at the game's next `i`; an end after the
 *  start, at most at the next `i`, before any end it has (an end ahead of a move at its `i` beats it on every phone:
 *  lib/sugoroku/online.ts heard). Nothing at or past the game's end, nothing from someone not seated (`who`, a move
 *  sent; the rows read back were taken so). Whose turn it is the fold's (a mini-game's plays come from any seat, racing
 *  for the next `i`: lib/sugoroku/wire.ts). */
function sgTakes(game: SgGame | undefined, m: SgIntent, who?: Who): boolean {
  if (m.a === 'start') return !game;
  if (!game || m.i < 1 || (game.end && m.i >= game.end.i)) return false;
  if (who && !(game.moves[0]?.s ?? '').includes(who)) return false;
  return m.a === 'end' ? m.i <= game.moves.length : m.i === game.moves.length;
}

/** A socket whose hello said `beat` (its phone sends something, the heartbeat at least, whenever it has sent nothing
 *  for 20 s) and that the room heard nothing from this long (no message, no heartbeat: three beats missed) is a ghost:
 *  a phone gone without closing it (asleep, out of signal), closed and its person gone (2026-11-05, relay review O2:
 *  the heartbeat's auto-response never woke the room, a ghost stayed `here`). A socket without `beat` (the apps before
 *  it ping only when they've *heard* nothing for 20 s, so one only listening to the others' news may be silent for
 *  minutes) is never closed for its silence: it isn't told apart from a ghost. */
export const SILENT_MS = 60_000;
/** The watchdog's alarm at most this often (the room wakes for it: cheap, but not every second). */
const WATCH_MIN_MS = 30_000;
/** A message's time is kept in the socket's attachment at most this often. */
const HEARD_EVERY_MS = 10_000;

/** A socket must say hello within this long: one round trip and the phone's onopen (at boot a 1.5 s long task; a 3–5 s
 *  round trip on a poor line). 3 s locked such a phone out (2026-11-05: 3.2 s RTT, every hello closed 4003); MAX_PENDING
 *  keeps the silent sockets few however long this is. */
export const HELLO_MS = 12_000;
/** The day's world kept for a phone that opens later (docs/backend.md#shared-world): today's (Tokyo) changes, the
 *  last RING_MAX, and each person's last walk (never trimmed, carried into each new day). */
export const RING_MAX = 400;
/** Per connection: a burst of 20, 20 a second after that. */
const BURST = 20;
const PER_SEC = 20;
/** At most this many sockets waiting for their hello: a new one lets the oldest go. Welcomed sockets have no cap of
 *  their own and never count here: a person's hello replaces their earlier socket, so there are at most three. */
export const MAX_PENDING = 4;
/** How many acked-but-not-kept intents the room remembers for resends (room.ts acked). */
const ACKED_MAX = 64;
/** A person's phrases (`say`) at most one this often (ms): a newer one within it goes nowhere (the phone waits 1.5 s). */
const SAY_GAP_MS = 1000;
/** A walk from another socket of the same person than the one kept (another device, or the same after a reconnect)
 *  is refused only when it set off (`s`, the relay's clock as the phone has it) this much before the kept one: a stale
 *  resend, never a phone's clock a little off. */
const WALK_SKEW_MS = 5000;

export class RoomCore<S extends Sock> {
  private readonly buckets = new WeakMap<S, Bucket>();
  private lastT = 0;

  /** Today's claims (live-protocol claimOf: first wins) and each tree's last nest, from the ring. */
  private claims = new Map<string, { who: Who; t: number; c?: number }>();
  private nests = new Map<string, number>();
  private day = -1;
  /** The numbered intents the room acked but doesn't keep (a high-five), the last ACKED_MAX: `<who>:<c>` → the intent
   *  and its stamp, so a resend after a reconnect is acked again, not delivered twice. Kept in storage (saveAcked:
   *  a wake from hibernation remembers it; 2026-11-05, relay review R2). */
  private acked: Map<string, { same: string; t: number }>;
  /** 英語すごろく's games by id (SgGame). */
  private games = new Map<string, SgGame>();
  /** When each person's last phrase went out (presence only: not kept). */
  private said = new Map<Who, number>();

  /** When each person's last socket closed (the room's clock), until they're back: the welcome's `gone`, for one gone
   *  quiet inside a room to come out of it on every phone at the same time (app store/where.svelte.ts). */
  private gone: Gone;

  /** Tokyo's real sky by the hour (weather.ts), sent after each welcome and to everyone when it changes. */
  private wx: Wx | null;

  constructor(private readonly io: RoomIO<S>, private ring: Kept[] = [], private rec: RecordMark | null = null, private held: Held = {}, gone: Gone = {}, wx: Wx | null = null, private kept: DayIndex | null = null, private recG: RecordMark | null = null, acked: Acked = [], private music: Music = {}, sg?: SgRow[]) {
    this.music = { ...music };
    if (sg) this.loadSg(sg);
    // (2026-11-18) the moves the day's ring held from before: into their games, out of the ring
    const old = ring.filter((e): e is SgKept => e.kind === 'sg');
    if (old.length) {
      this.ring = ring.filter((e) => e.kind !== 'sg');
      for (const e of old) if (this.takeSg(e)) this.io.saveSg?.(sgKey(e), e);
      this.io.save(this.ring);
    }
    this.acked = new Map(Array.isArray(acked) ? acked.slice(-ACKED_MAX) : []);
    this.wx = wx;
    this.held = { ...held };
    this.gone = { ...gone };
    for (const e of ring) this.lastT = Math.max(this.lastT, e.t);
    this.fresh();
  }

  /** The relay's clock, strictly increasing so a `since` never skips or repeats an event. */
  private stamp(): number {
    this.lastT = Math.max(this.io.now(), this.lastT + 1);
    return this.lastT;
  }

  private authed(who?: Who): S[] {
    return this.io.sockets().filter((s) => {
      const m = this.io.meta(s);
      return m?.who != null && (who === undefined || m.who === who);
    });
  }

  /** The sockets of everyone but `who`. */
  private others(who: Who): S[] {
    return this.authed().filter((s) => this.io.meta(s)?.who !== who);
  }

  /** `s`'s person's other sockets that said their device (`dv`): they hear that person's layout ops and presence. */
  private mine(s: S, who: Who): S[] {
    return this.authed(who).filter((x) => x !== s && !!this.io.meta(x)?.dv);
  }

  /** Tell each of `who`'s devices that said theirs whether another of theirs is here. */
  private ownPresence(who: Who, t: number): void {
    const all = this.authed(who);
    for (const p of all) if (this.io.meta(p)?.dv) this.send(p, { v: LIVE_V, kind: 'presence', who, on: all.length > 1, t });
  }

  /** Who else is here, as `me`'s phone hears it. */
  private hereFor(me: Who): Who[] {
    const out = new Set<Who>();
    for (const s of this.authed()) {
      const w = this.io.meta(s)!.who!;
      if (w !== me) out.add(w);
    }
    return [...out].sort();
  }

  private send(s: S, m: ServerMsg): void {
    try {
      s.send(JSON.stringify({ ...m, v: LIVE_V }));
    } catch {
      /* closing: its close handler tidies up */
    }
  }

  private shut(s: S, code: number, reason: string): void {
    try {
      s.close(code, reason);
    } catch {
      /* already closed */
    }
  }

  /** A new socket, accepted but not yet authenticated (`tk`: whose admission ticket it came with). */
  open(s: S, tk?: Who): void {
    this.io.setMeta(s, { who: null, opened: this.io.now(), sk: `${this.io.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, ...(tk ? { tk } : {}) });
  }

  message(s: S, raw: unknown): void {
    // the heartbeat: answered as the runtime's auto-response answers it (index.ts), before anything else (a room
    // awake, or a test's): any socket, no bucket
    if (raw === HB_PING) {
      try {
        s.send(HB_PONG);
      } catch {
        /* closing */
      }
      return;
    }
    const now = this.io.now();
    const meta = this.io.meta(s);
    // a socket let go (swept, or making room) before its hello: whatever it says now goes nowhere
    if (!meta || (!meta.who && meta.opened === 0)) return;
    // heard from: not silent (sweepSilent)
    if (meta.who && now - (meta.hd ?? 0) >= HEARD_EVERY_MS) this.io.setMeta(s, { ...meta, hd: now });
    const msg = parseClient(raw);
    // the bucket: a ping and a got never wait on it (the clock, a held high-five let go); over it, a welcomed phone's
    // numbered intent hears `busy {c}` (resend it later), anything else is dropped
    if (!(meta.who && (msg?.kind === 'ping' || msg?.kind === 'got'))) {
      let b = this.buckets.get(s);
      if (!b) this.buckets.set(s, (b = new Bucket(BURST, PER_SEC, now)));
      if (!b.take(now)) {
        const c = meta.who && msg && 'c' in msg ? msg.c : undefined;
        if (c !== undefined) this.send(s, { v: LIVE_V, kind: 'busy', c, t: now });
        return;
      }
    }
    if (!msg) {
      const v = otherVersion(raw);
      if (v !== null) this.shut(s, CLOSE.version, versionReason(v));
      else if (!meta.who) this.shut(s, CLOSE.unauthorized, 'hello first');
      else {
        // a malformed intent from a known person: dropped, but a numbered one is refused by its ack, so the phone
        // lets it go (unacked, it was resent on every reconnect until the day turned)
        const c = seqOf(raw);
        if (c !== null) this.ack(s, c, this.stamp(), false);
      }
      return;
    }
    if (msg.kind === 'hello') return this.hello(s, meta, msg);
    if (!meta.who) return this.shut(s, CLOSE.unauthorized, 'hello first');
    if (msg.kind === 'ping') return this.send(s, { v: LIVE_V, kind: 'pong', c: msg.c, t: now });
    const who = meta.who;
    if (msg.kind === 'got') {
      // a high-five held for me reached my phone
      for (const [k, h] of Object.entries(this.held)) if (h?.to === who && h.at === msg.at) this.unhold(k);
      return;
    }
    const { v: _v, c, ...intent } = msg;
    // a scoped decor op: a home's look and room its owner's (the outdoors anyone's, the guest's too: contract/layout.ts)
    // (and its `at` not over a day ahead, as the record's check: the partner would apply a far-future op, 2026-11-08)
    if (intent.kind === 'decor' && (!scopeMaySend(who, intent.sc, intent.id) || intent.at > now + AHEAD_MS)) return c !== undefined ? this.ack(s, c, this.stamp(), false) : undefined;
    // a goal tree's fruit its owner's alone (live-protocol.ts pickMaySend: credited to the tree's owner, 2026-11-16)
    if (intent.kind === 'pick' && !pickMaySend(who, intent.id)) return c !== undefined ? this.ack(s, c, this.stamp(), false) : undefined;
    if (intent.kind === 'sg') return this.sgMove(s, who, c, intent);
    if (intent.kind === 'sgv') return this.sgView(who, intent);
    const stored = isStored(intent);
    if (stored && c !== undefined) {
      // a resend (after a reconnect) of one the room has, the same intent with the same number: acked again, not
      // relayed twice
      const same = JSON.stringify(intent);
      const had = this.fresh().find((e) => e.who === who && e.c === c && JSON.stringify(bare(e)) === same);
      if (had) return this.ack(s, c, had.t, true);
      // or of a claim of mine trimmed from the ring since
      const k = claimOf(intent);
      const mine = k ? this.claims.get(k) : undefined;
      if (mine && mine.who === who && mine.c === c) return this.ack(s, c, mine.t, true);
    }
    if (!stored && c !== undefined) {
      const was = this.acked.get(`${who}:${c}`);
      if (was && was.same === JSON.stringify(intent)) return this.ack(s, c, was.t, true);
    }
    if (intent.kind === 'say') {
      // presence only, gently limited (the room's bucket is for bursts of world taps)
      if (now - (this.said.get(who) ?? -Infinity) < SAY_GAP_MS) return;
      this.said.set(who, now);
    }
    const out: Relayed = { ...intent, v: LIVE_V, who, t: this.stamp() };
    if (out.kind === 'music') {
      // a wrong clock can't pin the stage; a stale record (a resend, a race lost) or one already over goes nowhere, its
      // sender told what won
      out.at = musicAt(out.at, out.t);
      const cur = this.music[out.src];
      if (!musicBeats(out, cur, out.t)) {
        if (cur) this.send(s, cur);
        return c !== undefined ? this.ack(s, c, out.t, false) : undefined;
      }
      this.music = { ...this.music, [out.src]: out };
      this.io.saveMusic?.(this.music);
    }
    // the shared world: a claim already made today, a second nest within the hour, or a walk older than the one kept
    // goes nowhere
    if (stored && !this.admit(out, c, meta.sk)) return c !== undefined ? this.ack(s, c, out.t, false) : undefined;
    // a high-five goes to whose villager was tapped (`to`), else the partner (member to member)
    const to = out.kind === 'highfive' ? (out.to ?? (who === 'G' ? null : other(who))) : null;
    if (out.kind === 'highfive' && (!to || to === who)) return c !== undefined ? this.ack(s, c, out.t, false) : undefined;
    // to the others first, then kept: a message sent after a storage write waits for it (the output gate)
    let heard = false;
    for (const p of this.others(who)) {
      if (to && this.io.meta(p)?.who !== to) continue;
      this.send(p, out);
      heard = true;
    }
    // a decor op to my other devices too (the editor on the Mac, the island on the phone; 2026-11-09)
    if (out.kind === 'decor') for (const p of this.mine(s, who)) this.send(p, out);
    // a high-five with nobody there to hear it: held for them, the last one only
    if (to && !heard) {
      this.held = { ...this.held, [`${who}>${to}`]: { from: who, to, at: (out as { at: number }).at, t: out.t } };
      this.io.hold?.(this.held);
    }
    if (stored) this.keep({ ...out, ...(c !== undefined ? { c } : {}), ...(out.kind === 'walk' && meta.sk ? { sk: meta.sk } : {}) });
    else if (c !== undefined) {
      this.acked.set(`${who}:${c}`, { same: JSON.stringify(intent), t: out.t });
      if (this.acked.size > ACKED_MAX) this.acked.delete(this.acked.keys().next().value!);
      this.io.saveAcked?.([...this.acked]);
    }
    if (c !== undefined) this.ack(s, c, out.t, true);
  }

  private ack(s: S, c: number, t: number, ok: boolean): void {
    this.send(s, { v: LIVE_V, kind: 'ack', c, t, ok });
  }

  private hello(s: S, meta: Meta, { key, since, v, beat, dev, sg }: Extract<ClientMsg, { kind: 'hello' }>): void {
    const who = keyOwner(key, this.io.keys);
    if (!who) return this.shut(s, CLOSE.unauthorized, 'unknown key');
    // a ticket's socket is its person's alone
    if (meta.tk && meta.tk !== who) return this.shut(s, CLOSE.unauthorized, "not the ticket's");
    // a repeated hello: nothing changes
    if (meta.who) return;
    // the same device's earlier socket (a phone back before the room saw it go, another tab): replaced; the person's
    // other devices stay (a hello without `dev` replaces those without it, as before)
    const theirs = this.authed(who);
    const was = theirs.filter((x) => this.io.meta(x)?.dv === dev);
    for (const old of was) {
      // drop it from the room first, so its close doesn't announce me gone
      this.io.setMeta(old, { who: null, opened: this.io.meta(old)?.opened ?? 0 });
      this.shut(old, CLOSE.replaced, 'replaced');
    }
    const t = this.io.now();
    // the ghosts of the others (a phone gone without closing) out before this one hears who's here (and before it's
    // in: it never hears of them)
    this.sweepSilent();
    this.io.setMeta(s, { ...meta, who, v, hd: t, ...(beat ? { bt: true as const } : {}), ...(dev ? { dv: dev } : {}) });
    // `peer`: a member's partner is here; the guest's, either member. `here`: everyone else who is
    const here = this.hereFor(who);
    const peer = who === 'G' ? here.some((w) => w !== 'G') : here.includes(other(who));
    // `gone`: when those not here left, and my own last socket
    const gone: Gone = {};
    for (const w of ['A', 'B', 'G'] as const) if (this.gone[w] !== undefined && !here.includes(w)) gone[w] = this.gone[w];
    if (this.gone[who] !== undefined) this.setGone(who, undefined);
    // `hb`: this room answers the heartbeat (HB_PING) without waking (2026-11-05)
    const rec = who === 'G' ? this.recG : this.rec;
    const mine = dev ? this.authed(who).some((x) => x !== s) : false;
    this.send(s, { v: LIVE_V, kind: 'welcome', me: who, peer, t, ...(rec ? { rec } : {}), here, ...(Object.keys(gone).length ? { gone } : {}), hb: true, ...(mine ? { mine: true as const } : {}) });
    // the real sky, when the room has one that still serves
    const wx = served(this.wx, t);
    if (wx) this.send(s, { v: LIVE_V, kind: 'wx', ...wx, t });
    // the music stages still playing (or stopped lately), mine too; the ones over let go
    const live = Object.values(this.music).filter((m) => musicLive(m, t));
    for (const m of live) this.send(s, m);
    if (live.length < Object.keys(this.music).length) {
      this.music = Object.fromEntries(live.map((m) => [m.src, m]));
      this.io.saveMusic?.(this.music);
    }
    if (since !== undefined) {
      // the day in as few `replay` messages as fit (mine too: a phone that lost its own record gets it back)
      // (the games' moves after the day's world: each game's in its order; the phone's own game from its `n`th move)
      const day = [...this.fresh().filter((e) => e.t > since), ...this.sgSince(since, sg).sort((a, b) => a.t - b.t)];
      for (const es of chunks(day.map(strip))) this.send(s, { v: LIVE_V, kind: 'replay', es, t });
    }
    // the high-fives held for me while I was away, one from each (a day old: let go); each goes once my phone says `got`
    for (const [k, h] of Object.entries(this.held)) {
      if (!h || h.to !== who) continue;
      if (t - h.t > HIGHFIVE_HOLD_MS) this.unhold(k);
      else this.send(s, { v: LIVE_V, kind: 'highfive', at: h.at, who: h.from, t: h.t, to: who });
    }
    if (!theirs.length) for (const p of this.others(who)) this.send(p, { v: LIVE_V, kind: 'presence', who, on: true, t });
    else for (const p of this.mine(s, who)) this.send(p, { v: LIVE_V, kind: 'presence', who, on: true, t });
    this.io.onHello?.();
  }

  /** The real sky was fetched (weather.ts): kept for the welcomes, and when it changed (`send`) every phone hears it.
   *  Returns how many did. */
  setWx(wx: Wx | null, send: boolean): number {
    this.wx = wx;
    const t = this.io.now();
    const w = send ? served(wx, t) : null;
    if (!w) return 0;
    const to = this.authed();
    for (const s of to) this.send(s, { v: LIVE_V, kind: 'wx', ...w, t });
    return to.length;
  }

  private setGone(who: Who, t: number | undefined): void {
    const { [who]: _was, ...rest } = this.gone;
    this.gone = t === undefined ? rest : { ...rest, [who]: t };
    this.io.saveGone?.(this.gone);
  }

  private unhold(pair: string): void {
    const { [pair]: _gone, ...rest } = this.held;
    this.held = rest;
    this.io.hold?.(this.held);
  }

  /** The record changed (its RPC after a write): every connected phone hears it, the writer's own
   *  too, but the guest only what it may see of (guestNotice; `guest`: the record's word on it). Returns how many. */
  notify(n: Notice, guest?: boolean): number {
    const forG = this.guestNotice(n, guest);
    let moved = false;
    if (!this.rec || n.at > this.rec.at || n.rev !== this.rec.rev) {
      this.rec = { at: n.at, rev: n.rev };
      moved = true;
    }
    if (forG && (!this.recG || n.at > this.recG.at || n.rev !== this.recG.rev)) {
      this.recG = { at: n.at, rev: n.rev };
      moved = true;
    }
    if (moved) this.io.saveRec?.(this.rec, this.recG);
    const to = this.authed().filter((s) => forG || this.io.meta(s)?.who !== 'G');
    const m: ServerMsg = { v: LIVE_V, kind: 'changed', what: n.what, who: n.who, at: n.at, rev: n.rev, ...(n.sid ? { sid: n.sid } : {}), ...(n.calm ? { calm: true } : {}), t: this.io.now() };
    for (const s of to) this.send(s, m);
    return to.length;
  }

  /** Whether the guest hears of this change: an event's, a member's ingest that brought activity rows (the record says
   *  so: `guest`; the guest's snapshot holds them, so it reaches the mark), or a new epoch (its cache refetched). Never
   *  an ingest of からだ rows alone: when one ran is the member's (docs/backend.md#the-guest), and the guest's
   *  snapshot, which holds none of them, could never reach its mark. (An admin load at the same epoch, told as an
   *  ingest: the guest has them at its next poll.) */
  private guestNotice(n: Notice, guest?: boolean): boolean {
    const was = this.recG ?? this.rec;
    return n.what !== 'ingest' || guest === true || (was !== null && n.rev !== was.rev);
  }

  /** A socket closed (or errored). Its person's partner hears they left, unless another socket of theirs is open.
   *  `at`: when it went (a ghost's last beat: sweepSilent), else now. */
  close(s: S, at?: number): void {
    const who = this.io.meta(s)?.who;
    if (!who) return;
    this.io.setMeta(s, { who: null, opened: 0 });
    const t = at ?? this.io.now();
    if (this.authed(who).length) return this.ownPresence(who, t);
    this.setGone(who, t);
    for (const p of this.others(who)) if (p !== s) this.send(p, { v: LIVE_V, kind: 'presence', who, on: false, t });
  }

  /**
   * The ghosts let go: each welcomed socket whose hello said `beat` and that the room heard nothing from for SILENT_MS
   * (no message, no heartbeat) is closed (4003 `silent`), its person gone for the others (presence off) unless another
   * socket of theirs is open. Nothing is sent to ask (a mid-session welcome would make a phone redo its welcome's
   * work: its outbox, its catch-up, its clock). From the alarm while such a socket is in, and on each hello. Returns
   * when to look next (at least WATCH_MIN_MS on), or null when there's none to watch.
   */
  sweepSilent(): number | null {
    const now = this.io.now();
    let next: number | null = null;
    for (const s of this.authed()) {
      const m = this.io.meta(s)!;
      if (!m.bt) continue;
      const last = Math.max(m.hd ?? m.opened, this.io.heardAt?.(s) ?? 0);
      if (now - last >= SILENT_MS) {
        // gone since its last beat, not since the sweep found it (up to a minute later): the partner's grace (the app's
        // ui-state/presence.ts) runs from when the phone really went
        this.close(s, last);
        this.shut(s, CLOSE.timeout, 'silent');
      } else next = next === null ? last + SILENT_MS : Math.min(next, last + SILENT_MS);
    }
    return next === null ? null : Math.max(next, now + WATCH_MIN_MS);
  }

  /** Close sockets that never said hello. Returns when to sweep next, or null when none is waiting. */
  sweep(): number | null {
    const now = this.io.now();
    let next: number | null = null;
    for (const s of this.io.sockets()) {
      const m = this.io.meta(s);
      if (!m || m.who) continue;
      if (m.opened === 0) continue; // already let go
      const due = m.opened + HELLO_MS;
      if (due <= now) {
        this.io.setMeta(s, { who: null, opened: 0 });
        this.shut(s, CLOSE.timeout, 'no hello');
      } else next = next === null ? due : Math.min(next, due);
    }
    return next;
  }

  /** Room for one more socket: the silent ones past their time swept out, then the oldest still waiting for a hello
   *  let go until fewer than MAX_PENDING wait (so a few silent sockets can never keep a phone out). Returns how many
   *  were let go to make room. */
  makeRoom(): number {
    this.sweep();
    // (a ticketed one never: it proved a key before it got here, and has its hello's time like any)
    const waiting = this.io.sockets().filter((s) => {
      const m = this.io.meta(s);
      return m && !m.who && m.opened !== 0 && !m.tk;
    }).sort((x, y) => this.io.meta(x)!.opened - this.io.meta(y)!.opened);
    let n = 0;
    while (waiting.length - n >= MAX_PENDING) {
      const s = waiting[n++];
      this.io.setMeta(s, { who: null, opened: 0 });
      this.shut(s, CLOSE.timeout, 'no hello');
    }
    return n;
  }

  /** Today's world (a new Tokyo day starts empty but for each person's last walk: where their villager stands, however
   *  long their phone is gone, stamped into today so a phone opening asks for it): the ring, its claims and nests
   *  rebuilt when the day turns. */
  private fresh(): Kept[] {
    const today = tokyoDayNum(this.io.now());
    if (today === this.day) return this.ring;
    this.day = today;
    const ring = this.ring.filter((e) => tokyoDayNum(e.t) === today);
    const walked = new Set(ring.filter((e) => e.kind === 'walk').map((e) => e.who));
    const carried = this.ring.filter((e) => e.kind === 'walk' && !walked.has(e.who) && tokyoDayNum(e.t) !== today).map((e) => ({ ...e, t: this.stamp() }));
    this.ring = [...ring, ...carried];
    if (carried.length) this.io.save(this.ring);
    // the games left two days: gone
    for (const [g, x] of this.games) if (this.io.now() - x.last > SG_KEEP_MS) this.dropGame(g);
    this.claims.clear();
    this.nests.clear();
    for (const e of this.ring) this.index(e);
    // and those the ring no longer holds (kept apart: saveDay), when they are today's
    if (this.kept?.day === today) {
      for (const [k, who, t, c] of this.kept.claims) if (!this.claims.has(k)) this.claims.set(k, c === null ? { who, t } : { who, t, c });
      for (const [tree, t] of this.kept.nests) this.nests.set(tree, Math.max(this.nests.get(tree) ?? 0, t));
    }
    this.kept = null;
    return this.ring;
  }

  /** Take a kept change into the day's claims and nests; true when they changed. */
  private index(e: Kept): boolean {
    const c = claimOf(e);
    if (c && !this.claims.has(c)) {
      this.claims.set(c, e.c === undefined ? { who: e.who, t: e.t } : { who: e.who, t: e.t, c: e.c });
      return true;
    }
    if (e.kind === 'shake' && e.drop === 'nest' && e.t > (this.nests.get(e.tree) ?? 0)) {
      this.nests.set(e.tree, e.t);
      return true;
    }
    return false;
  }

  /** The day's claims and nests as saveDay keeps them. */
  private dayIndex(): DayIndex {
    return {
      day: this.day,
      claims: [...this.claims].map(([k, x]) => [k, x.who, x.t, x.c ?? null]),
      nests: [...this.nests]
    };
  }

  /** A すごろく move (sgTakes): relayed to the game's other seats (its start's `s`: no one else's phone plays it) and kept, acked; refused (`ok` false) when the game doesn't take
   *  it (a race lost: the phone takes the winner it hears, lib/sugoroku/online.ts). A resend of one the game has (the
   *  same move from the same person, after a reconnect) is acked again, not relayed twice. */
  private sgMove(s: S, who: Who, c: number | undefined, m: SgIntent): void {
    const game = this.games.get(m.g);
    const had = m.a === 'end' ? game?.end : game?.moves[m.i];
    if (had && had.who === who && JSON.stringify(bare(had)) === JSON.stringify(m)) return c !== undefined ? this.ack(s, c, had.t, true) : undefined;
    if (!sgTakes(game, m, who)) return c !== undefined ? this.ack(s, c, this.stamp(), false) : undefined;
    const out: SgKept = { ...m, v: LIVE_V, who, t: this.stamp(), ...(c !== undefined ? { c } : {}) };
    const seats = (m.a === 'start' ? m.s : game?.moves[0]?.s) ?? '';
    for (const p of this.others(who)) if (seats.includes(this.io.meta(p)!.who!)) this.send(p, strip(out));
    this.takeSg(out);
    this.io.saveSg?.(sgKey(out), out);
    this.foldSg(m.g);
    // past SG_GAMES, the game left longest goes
    if (this.games.size > SG_GAMES) this.dropGame([...this.games].reduce((a, b) => (b[1].last < a[1].last ? b : a))[0]);
    if (c !== undefined) this.ack(s, c, out.t, true);
  }

  /** A すごろく turn as its player sees it (`sgv`, presence only): to the game's other seats alone (the speaking step's
   *  words are the table's), and only at the game's next move (a late one, or a game the room hasn't or that's over,
   *  goes nowhere). Never kept, never acked. */
  private sgView(who: Who, m: SgView): void {
    const game = this.games.get(m.g), seats = game?.moves[0]?.s ?? '';
    if (!game || game.end || m.i !== game.moves.length || !seats.includes(who)) return;
    const out: Relayed = { ...m, v: LIVE_V, who, t: this.io.now() };
    for (const p of this.others(who)) if (seats.includes(this.io.meta(p)!.who!)) this.send(p, out);
  }

  /** The games as kept (rows in no order: the folds first, then each game's own rows in its order, up to a gap), those
   *  past SG_KEEP_MS let go. The room's storage reads them when a message needs them (index.ts: a hello, a move, a
   *  view), never on every wake. */
  loadSg(rows: readonly SgRow[]): void {
    const folds = rows.filter((r): r is SgFold => 'moves' in r);
    for (const f of folds) {
      for (const e of f.moves) this.takeSg(e);
      if (f.end) this.takeSg(f.end);
      const x = this.games.get(f.moves[0]?.g ?? '');
      if (x) (x.fold = f.moves.length), (x.foldEnd = !!f.end);
    }
    const own = rows.filter((r): r is SgKept => !('moves' in r)).sort((a, b) => (a.a === 'end' ? 1 : 0) - (b.a === 'end' ? 1 : 0) || a.i - b.i);
    for (const e of own) this.takeSg(e);
    for (const [g, x] of this.games) if (this.io.now() - x.last > SG_KEEP_MS) this.dropGame(g);
  }

  /** A game's moves since its fold into the fold row, their own rows gone, at SG_FOLD of them or the end. */
  private foldSg(g: string): void {
    const x = this.games.get(g);
    if (!x || (x.moves.length - x.fold < SG_FOLD && !(x.end && !x.foldEnd))) return;
    const f: SgFold = { moves: x.moves, ...(x.end ? { end: x.end } : {}) };
    if (JSON.stringify(f).length > SG_FOLD_MAX) return;
    const own = [...x.moves.slice(x.fold), ...(x.end && !x.foldEnd ? [x.end] : [])].map(sgKey);
    this.io.saveSg?.(foldKey(g), f);
    this.io.dropSg?.(own);
    x.fold = x.moves.length;
    x.foldEnd = !!x.end;
  }

  /** Take a move into its game (sgTakes); true when it did. */
  private takeSg(e: SgKept): boolean {
    const game = this.games.get(e.g);
    if (!sgTakes(game, e)) return false;
    const x: SgGame = game ?? { moves: [], last: 0, fold: 0 };
    if (e.a === 'end') x.end = e;
    else x.moves.push(e);
    x.last = Math.max(x.last, e.t);
    this.lastT = Math.max(this.lastT, e.t);
    this.games.set(e.g, x);
    return true;
  }

  private dropGame(g: string): void {
    const x = this.games.get(g);
    if (!x) return;
    this.games.delete(g);
    this.io.dropSg?.([...(x.fold ? [foldKey(g)] : []), ...[...x.moves.slice(x.fold), ...(x.end && !x.foldEnd ? [x.end] : [])].map(sgKey)]);
  }

  /** The games' moves after `since` (a hello's), the moves from an end on left out; the hello's own game (`at`) from
   *  its `n`th move and its end, however old (a game crosses Tokyo midnight: `since` restarts at it). */
  private sgSince(since: number, at?: SgAt): SgKept[] {
    const out: SgKept[] = [];
    for (const [g, x] of this.games) {
      const n = at?.g === g ? at.n : Infinity, after = (e: SgKept) => e.t > since || e.i >= n;
      for (const e of x.moves) if (after(e) && !(x.end && e.i >= x.end.i)) out.push(e);
      if (x.end && (x.end.t > since || at?.g === g)) out.push(x.end);
    }
    return out;
  }

  /** Whether the day's world takes a change: false when it refuses it (claimed already, a nest too soon, a walk sent
   *  before the one it holds: a late resend). A walk's number (`seq`, the phone's clock) is compared with the kept
   *  walk's only when both came on the same socket (`sk`): another device's clock, or the same phone's after a reload,
   *  numbers its own way, and a newer socket's first walk is taken; across sockets a walk that set off WALK_SKEW_MS
   *  before the kept one is a stale resend. (A socket from before `sk` compares as before.) */
  private admit(e: Relayed, seq?: number, sk?: string): boolean {
    this.fresh();
    const c = claimOf(e);
    if (c && this.claims.has(c)) return false;
    if (e.kind === 'shake' && e.drop === 'nest' && e.t - (this.nests.get(e.tree) ?? -Infinity) < NEST_GAP_MS) return false;
    if (e.kind === 'walk' && seq !== undefined) {
      const last = this.ring.find((x) => x.kind === 'walk' && x.who === e.who);
      if (last?.kind === 'walk') {
        const same = !sk || last.sk === sk;
        if (same && last.c !== undefined && last.c > seq) return false;
        if (!same && e.s !== undefined && last.s !== undefined && e.s + WALK_SKEW_MS < last.s) return false;
      }
    }
    return true;
  }

  /** Keep a change the world took (admit) in the day's world. A walk replaces its person's last one; past RING_MAX the
   *  oldest change that claims nothing and isn't a walk goes (else the oldest that isn't a walk: its claim stays in
   *  the day's claims, saveDay). */
  private keep(e: Kept): void {
    const ring = this.fresh();
    const rest = e.kind === 'walk' ? ring.filter((x) => !(x.kind === 'walk' && x.who === e.who)) : ring;
    const next = [...rest, e];
    while (next.length > RING_MAX) {
      const i = next.findIndex((x) => x.kind !== 'walk' && !claimOf(x));
      next.splice(i >= 0 ? i : Math.max(0, next.findIndex((x) => x.kind !== 'walk')), 1);
    }
    this.ring = next;
    if (this.index(e)) this.io.saveDay?.(this.dayIndex());
    this.io.save(this.ring);
  }
}

/** The sequence number `c` of a message the protocol couldn't read (a whole number, as live-protocol's isSeq), or null. */
function seqOf(raw: unknown): number | null {
  if (typeof raw !== 'string' || raw.length > MAX_BYTES) return null;
  let o: unknown;
  try {
    o = JSON.parse(raw);
  } catch {
    return null;
  }
  const c = o !== null && typeof o === 'object' ? (o as { c?: unknown; kind?: unknown }).c : undefined;
  const kind = (o as { kind?: unknown } | null)?.kind;
  return kind !== 'ping' && kind !== 'hello' && Number.isInteger(c) && (c as number) > 0 && (c as number) < 1e15 ? (c as number) : null;
}

/** A kept change's intent alone (as its sender sent it). */
const bare = ({ c: _c, sk: _sk, v: _v, who: _w, t: _t, ...i }: Kept): Omit<Kept, 'c' | 'sk' | 'v' | 'who' | 't'> => i;

/** A kept change as sent: without its sender's sequence number and socket. */
const strip = ({ c: _c, sk: _sk, ...e }: Kept): Relayed => e;

/** The day's changes in runs whose `replay` message stays within REPLAY_BYTES. */
function chunks(es: Relayed[]): Relayed[][] {
  const out: Relayed[][] = [];
  let run: Relayed[] = [], size = 0;
  const room = REPLAY_BYTES - 80; // the message around them
  for (const e of es) {
    const n = JSON.stringify(e).length + 1;
    if (run.length && size + n > room) {
      out.push(run);
      run = [];
      size = 0;
    }
    run.push(e);
    size += n;
  }
  if (run.length) out.push(run);
  return out;
}

/** A member's partner (the guest has none: it sees both). */
const other = (w: Who): Who => (w === 'A' ? 'B' : 'A');

/** The close reason for a phone speaking a version the relay doesn't (≤ 123 bytes: the browser console and the logs). */
const versionReason = (v: number): string => `protocol version ${String(v).slice(0, 12)} unsupported (relay speaks ${LIVE_VS.join(', ')})`;
