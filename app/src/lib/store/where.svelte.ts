// Where each villager is: on the island or in the tent (docs/design.md "The tent", "One place at a time"). Presence,
// shared over the relay: my tent screen says `tent {in: true}` as it opens (and again whenever someone joins or the
// socket comes back), `{in: false}` as it closes; a phone hears everyone else's (the partner's, and the guest's or the
// members' on the guest's phone: ui-state/cast.ts). While someone's villager is in the tent, the island shows it
// nowhere (and its life there leaves it alone); in the tent it shows only while they're there. Someone who goes quiet
// while inside (the app closed, the phone offline) is home on the island again after `goneMs` (`homeN` counts those,
// for the island to put their villager home; `wentHome` the partner's). The screens feed it what their relay hears.
import type { Relayed } from '#lib/sync/live-protocol.ts';
import type { Who } from '#lib/types.ts';
import { whoOf } from '#lib/ui-state/cast.ts';

/** How long someone who went offline inside the tent stays there (ms): the island's own "away too long" (avatar.ts
 *  SNAP_HOME_MS). */
const GONE_MS = 30_000;

const none = (): Record<Who, boolean> => ({ A: false, B: false, G: false });

class Where {
  /** Whose villager is in the tent (anyone else's: mine is this screen's own). */
  inTent = $state<Record<Who, boolean>>(none());
  /** Bumped each time someone who went quiet inside is taken home. */
  homeN = $state<Record<Who, number>>({ A: 0, B: 0, G: 0 });
  #timers = new Map<Who, ReturnType<typeof setTimeout>>();
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
  }
  /** Whether the partner is on the relay (`presence(partner, on)`). */
  peer(on: boolean): void {
    this.presence(whoOf('partner'), on);
  }
  /** Whether `who` is on the relay: gone while inside, home after goneMs. */
  presence(who: Who, on: boolean): void {
    if (on) return this.#clear(who);
    if (!this.inTent[who] || this.#timers.has(who)) return;
    this.#timers.set(who, setTimeout(() => {
      this.#timers.delete(who);
      if (!this.inTent[who]) return;
      this.inTent[who] = false;
      this.homeN[who]++;
    }, this.goneMs));
  }
  #clear(who: Who): void {
    const t = this.#timers.get(who);
    if (t) clearTimeout(t);
    this.#timers.delete(who);
  }
  /** Forget (tests). */
  reset(): void {
    for (const w of ['A', 'B', 'G'] as const) this.#clear(w);
    this.inTent = none();
    this.homeN = { A: 0, B: 0, G: 0 };
    this.goneMs = GONE_MS;
  }
}

export const where = new Where();
