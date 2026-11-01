// A per-connection token bucket: up to `burst` messages at once, refilled at `perSec`; beyond that, messages are
// dropped (not queued, not closed): a tap storm loses a few intents, never the connection.
export class Bucket {
  private tokens: number;
  private at: number;

  constructor(private readonly burst: number, private readonly perSec: number, now: number) {
    this.tokens = burst;
    this.at = now;
  }

  /** Spend one token if there is one. */
  take(now: number): boolean {
    this.tokens = Math.min(this.burst, this.tokens + (Math.max(0, now - this.at) * this.perSec) / 1000);
    this.at = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}
