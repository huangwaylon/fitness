// Where each villager is: on the island or in the tent (docs/design.md "The tent", "One place at a time"). Presence,
// shared over the relay: my tent screen says `tent {in: true}` as it opens (and again whenever the partner joins or the
// socket comes back), `{in: false}` as it closes; a phone hears the partner's. While the partner's villager is in the
// tent, their island shows it nowhere (and their life leaves it alone); in the tent it shows only while they're there.
// A partner who goes quiet while inside (the app closed, the phone offline) is home on the island again after `goneMs`
// (`wentHome` counts those, for the island to put their villager home). The screens feed it what their relay hears.
import type { Relayed } from '#lib/sync/live-protocol.ts';

/** How long a partner who went offline inside the tent stays there (ms): the island's own "away too long" (avatar.ts
 *  SNAP_HOME_MS). */
const GONE_MS = 30_000;

class Where {
  /** The partner's villager is in the tent. */
  partnerInTent = $state(false);
  /** Bumped each time a partner who went quiet inside is taken home. */
  wentHome = $state(0);
  #timer: ReturnType<typeof setTimeout> | null = null;
  goneMs = GONE_MS;

  /** A relayed intent of the partner's (only `tent` matters). */
  heard(m: Relayed): void {
    if (m.kind !== 'tent') return;
    this.#clear();
    this.partnerInTent = m.in;
  }
  /** Whether the partner is on the relay: gone while inside, home after goneMs. */
  peer(on: boolean): void {
    if (on) return this.#clear();
    if (!this.partnerInTent || this.#timer) return;
    this.#timer = setTimeout(() => {
      this.#timer = null;
      if (!this.partnerInTent) return;
      this.partnerInTent = false;
      this.wentHome++;
    }, this.goneMs);
  }
  #clear(): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
  }
  /** Forget (tests). */
  reset(): void {
    this.#clear();
    this.partnerInTent = false;
    this.wentHome = 0;
    this.goneMs = GONE_MS;
  }
}

export const where = new Where();
