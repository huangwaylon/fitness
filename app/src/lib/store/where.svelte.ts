// Where each villager is: on the island or inside (the tent, a home, the museum, the shop: docs/design.md "The tent",
// "One place at a time"). Presence, shared over the relay: a room's screen says `tent {in: true, sc?}` as it opens
// (and again whenever someone joins, walks in or the socket comes back), `{in: false}` as it closes; a phone hears
// everyone else's (the partner's, and the guest's or the members' on the guest's phone: ui-state/cast.ts). While
// someone's villager is inside, the island shows it nowhere (and its life there leaves it alone); in a room it shows only while
// they're in that one. Someone who goes quiet while inside (the app closed, the phone offline) leaves it when the
// relay's leave time + GONE_MS comes (`goneMs` after the island heard it when the relay doesn't say): back on the
// island where it went in. Someone who comes back on the relay (or whom this phone sees again after its own outage)
// while thought inside is said again at once by their room (rooms/roomLife.ts onPresence `came`), or out by their island;
// with no word in CONFIRM_MS they're out (a word lost, or their other device on the island saying nothing). The
// screens feed it what their relay hears.
import type { Relayed } from '#lib/contract/live-protocol.ts';
import type { Who } from '#lib/types.ts';
import { whoOf } from '#lib/ui-state/cast.ts';
import { log } from '#lib/sync/log.ts';

/** How long someone who went offline inside stays there (ms; the e2e's `?quietafter=` sets `goneMs`). */
const GONE_MS = 180_000;
/** How long one back on the relay while thought inside has to say so again (ms: their room answers an arrival at once). */
export const CONFIRM_MS = 6000;

const none = (): Record<Who, boolean> => ({ A: false, B: false, G: false });
/** Where inside: a home (its owner's letter), the museum (`M`), the shop (`S`), or a place a newer build has that this
 *  one doesn't know (`X`: `sc` x, live-protocol intentOf `lax`): inside somewhere, shown nowhere here. */
type Place = Who | 'M' | 'S' | 'X';

class Where {
  /** Whose villager is in the tent (anyone else's: mine is this screen's own): in any of the homes. */
  inTent = $state<Record<Who, boolean>>(none());
  /** Which home each one is in (its owner: the tent's A, うめ's house B, the guest's G; the presence's `sc`), the museum
   *  (`M`: `sc` m), the shop (`S`: `sc` s), somewhere this build doesn't know (`X`), or null. */
  home = $state<Record<Who, Place | null>>({ A: null, B: null, G: null });
  #timers = new Map<Who, { timer: ReturnType<typeof setTimeout>; due: number }>();
  /** Who this phone has on the relay now (presence's `on`). */
  #here = new Set<Who>();
  /** Each one's last `tent` heard (live, or the room's replay after a welcome: relay/src/room.ts Pres), while they're
   *  inside: a room opened later on the same socket draws them from it (tentOf). Not reactive. */
  #tents = new Map<Who, Extract<Relayed, { kind: 'tent' }>>();
  goneMs = GONE_MS;

  /** The partner's villager is in the tent. */
  get partnerInTent(): boolean {
    return this.inTent[whoOf('partner')];
  }

  /** A relayed intent of someone else's (only `tent` matters). True when it brings them into a place they weren't in:
   *  a room already there says where its own villager is at once (walking in keeps one socket: no `came`, no replay). */
  heard(m: Relayed): boolean {
    if (m.kind !== 'tent') return false;
    this.#clear(m.who);
    this.#tents.set(m.who, m);
    const was = this.inTent[m.who] ? this.home[m.who] : null;
    this.#set(m.who, m.in ? (m.sc === 'u' ? 'B' : m.sc === 'v' ? 'G' : m.sc === 'm' ? 'M' : m.sc === 's' ? 'S' : m.sc === 'x' ? 'X' : 'A') : null, 'tent');
    return m.in && this.home[m.who] !== was;
  }
  /** `who`'s last `tent` heard while they're inside (where, the walk or the seat), else null. */
  tentOf(who: Who): Extract<Relayed, { kind: 'tent' }> | null {
    return this.inTent[who] ? (this.#tents.get(who) ?? null) : null;
  }
  /** `who` is at `place` (null: the island) now: the log's where.change when that's news (each phone's own, so two
   *  phones' views of one person are told apart: 2026-11-22). */
  #set(who: Who, place: Place | null, src: 'tent' | 'gone'): void {
    const was = this.home[who];
    if (place === null) this.#tents.delete(who);
    this.inTent[who] = place !== null;
    this.home[who] = place;
    if (was !== place) log('where.change', { who, place: place ?? 'island', src });
  }
  /** Whether `who` is on the relay: gone while inside, out `dueMs` from now (by the relay's leave time; default
   *  goneMs; null: this phone is offline, nobody knows yet: it waits); back while inside, out after CONFIRM_MS
   *  unless they say where they are first. */
  presence(who: Who, on: boolean, dueMs: number | null = this.goneMs): void {
    const was = this.#here.has(who);
    if (on) {
      if (was) return;
      this.#here.add(who);
      this.#clear(who);
      if (this.inTent[who]) this.#outIn(who, CONFIRM_MS);
      return;
    }
    this.#here.delete(who);
    if (was) this.#clear(who);
    const t = this.#timers.get(who);
    if (!this.inTent[who] || dueMs === null || (t && t.due <= Date.now() + dueMs + 50)) return;
    this.#outIn(who, dueMs);
  }
  /** `who` back on the island `ms` from now, unless heard (or back) first. */
  #outIn(who: Who, ms: number): void {
    this.#clear(who);
    const timer = setTimeout(() => {
      this.#timers.delete(who);
      if (!this.inTent[who]) return;
      this.#set(who, null, 'gone');
    }, Math.max(0, ms));
    this.#timers.set(who, { timer, due: Date.now() + ms });
  }
  #clear(who: Who): void {
    const t = this.#timers.get(who);
    if (t) clearTimeout(t.timer);
    this.#timers.delete(who);
  }
  /** Forget (tests). */
  reset(): void {
    this.#tents.clear();
    for (const w of ['A', 'B', 'G'] as const) this.#clear(w);
    this.#here.clear();
    this.inTent = none();
    this.home = { A: null, B: null, G: null };
    this.goneMs = GONE_MS;
  }
}

export const where = new Where();
