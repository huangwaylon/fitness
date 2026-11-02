// Where each villager is: on the island or in the tent (docs/design.md "The tent", "One place at a time"). Presence,
// shared over the relay: my tent screen says `tent {in: true}` as it opens (and again whenever someone joins or the
// socket comes back), `{in: false}` as it closes; a phone hears everyone else's (the partner's, and the guest's or the
// members' on the guest's phone: ui-state/cast.ts). While someone's villager is in the tent, the island shows it
// nowhere (and its life there leaves it alone); in the tent it shows only while they're there. Someone who goes quiet
// while inside (the app closed, the phone offline) leaves it when the relay's leave time + the walk-home timeout comes
// (island/villagerSync HOME_AFTER_MS: their villager comes out of the door and walks home then; `homeN` counts those,
// `wentHome` the partner's), `goneMs` after the island heard it when the relay doesn't say. The screens feed it what
// their relay hears.
import type { Relayed } from '#lib/sync/live-protocol.ts';
import type { Who } from '#lib/types.ts';
import { whoOf } from '#lib/ui-state/cast.ts';

/** How long someone who went offline inside the tent stays there (ms): the walk home's (villagerSync HOME_AFTER_MS;
 *  the island sets `goneMs` to homeAfter()). */
const GONE_MS = 180_000;

const none = (): Record<Who, boolean> => ({ A: false, B: false, G: false });

class Where {
  /** Whose villager is in the tent (anyone else's: mine is this screen's own): in any of the homes. */
  inTent = $state<Record<Who, boolean>>(none());
  /** Which home each one is in (its owner: the tent's A, うめ's house B, the guest's G; the presence's `sc`), or null. */
  home = $state<Record<Who, Who | null>>({ A: null, B: null, G: null });
  /** Bumped each time someone who went quiet inside is taken home. */
  homeN = $state<Record<Who, number>>({ A: 0, B: 0, G: 0 });
  #timers = new Map<Who, { timer: ReturnType<typeof setTimeout>; due: number }>();
  goneMs = GONE_MS;

  /** The partner's villager is in the tent. */
  get partnerInTent(): boolean {
    return this.inTent[whoOf('partner')];
  }
  /** How many times the partner went quiet inside and was taken home. */
  get wentHome(): number {
    return this.homeN[whoOf('partner')];
  }

  /** A relayed intent of someone else's (only `tent` matters). */
  heard(m: Relayed): void {
    if (m.kind !== 'tent') return;
    this.#clear(m.who);
    this.inTent[m.who] = m.in;
    this.home[m.who] = m.in ? (m.sc === 'u' ? 'B' : m.sc === 'v' ? 'G' : 'A') : null;
  }
  /** Whether the partner is on the relay (`presence(partner, on)`). */
  peer(on: boolean): void {
    this.presence(whoOf('partner'), on);
  }
  /** Whether `who` is on the relay: gone while inside, out `dueMs` from now (by the relay's leave time; default
   *  goneMs; null: this phone is offline, nobody knows yet: it waits). */
  presence(who: Who, on: boolean, dueMs: number | null = this.goneMs): void {
    if (on) return this.#clear(who);
    const t = this.#timers.get(who);
    if (!this.inTent[who] || dueMs === null || (t && t.due <= Date.now() + dueMs + 50)) return;
    this.#clear(who);
    const timer = setTimeout(() => {
      this.#timers.delete(who);
      if (!this.inTent[who]) return;
      this.inTent[who] = false;
      this.home[who] = null;
      this.homeN[who]++;
    }, Math.max(0, dueMs));
    this.#timers.set(who, { timer, due: Date.now() + dueMs });
  }
  #clear(who: Who): void {
    const t = this.#timers.get(who);
    if (t) clearTimeout(t.timer);
    this.#timers.delete(who);
  }
  /** Forget (tests). */
  reset(): void {
    for (const w of ['A', 'B', 'G'] as const) this.#clear(w);
    this.inTent = none();
    this.home = { A: null, B: null, G: null };
    this.homeN = { A: 0, B: 0, G: 0 };
    this.goneMs = GONE_MS;
  }
}

export const where = new Where();
