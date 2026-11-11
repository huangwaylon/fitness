// Files packed end to end into a few static files (Cloudflare Pages caps a deploy at 20,000 files: lib/static-budget.ts),
// read on the phone: ききみみ's audio (components/kikimimi/packs.ts) and the players' parts (player3d/parts.ts). A file is
// a cut of its pack (`[stem, offset, bytes]`, the pack's stem naming its content: `<name>.<hash>`). Pages answers a Range
// with the whole file (200, measured 2026-11-09), so a pack is only ever fetched whole: once at a time, whoever asks
// (the page's parts at once share one fetch; the service worker shares its own), held in memory among the most recently
// used (a byte cap), and each file cut from it.
import { quiet } from '#lib/quiet.ts';

/** Where a file is: its pack's stem, its offset and bytes. */
export type PackRef = readonly [stem: string, offset: number, bytes: number];

export interface PackStoreOpts {
  /** A pack's URL (its stem names its content: cached for good). */
  url: (stem: string) => string;
  get?: (url: string) => Promise<Response>;
  /** The packs held in memory (bytes). */
  cap?: number;
  /** The failures' log tag (`<tag>.pack`). */
  tag: string;
  /** Everything held let go of as the page is hidden (pagehide, or hidden: iOS ranks a background tab for its end
   *  by its footprint; the service worker keeps every pack, so a read after is cheap). */
  dropOnHide?: boolean;
  /** Everything held let go of this long after the last ask, none on its way (the rooms': their pieces, once parsed,
   *  are the models' cache's; the service worker and the HTTP cache keep the bytes, so a read after is a local one). */
  idleMs?: number;
}

/** The stores let go of as the page is hidden (one listener each for the page's life). */
const hiding = new Set<PackStore>();
function dropOnHide(s: PackStore): void {
  if (typeof document === 'undefined') return;
  if (!hiding.size) {
    const drop = () => hiding.forEach((h) => h.clear());
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && drop());
    window.addEventListener('pagehide', drop);
  }
  hiding.add(s);
}

export class PackStore {
  /** Packs asked for, least recently used first: their bytes (null: offline, not kept). */
  #held = new Map<string, Promise<ArrayBuffer | null>>();
  /** The bytes of each pack held (one still on its way has none: never let go for the cap). */
  #size = new Map<string, number>();
  /** Bumped by clear: a prefetch started before it asks for nothing more. */
  #gen = 0;
  readonly #get: (url: string) => Promise<Response>;
  readonly #cap: number;
  readonly #tag: string;
  /** The idle let-go (re)armed (idleMs): at its end everything held goes, or (one still on its way) it waits again. */
  readonly #idle: () => void;
  readonly url: (stem: string) => string;

  constructor(o: PackStoreOpts) {
    this.url = o.url;
    this.#get = o.get ?? ((u) => fetch(u));
    this.#cap = o.cap ?? 12_000_000;
    this.#tag = o.tag;
    let t: ReturnType<typeof setTimeout>;
    this.#idle = () => {
      clearTimeout(t);
      if (o.idleMs) t = setTimeout(() => (this.#held.size > this.#size.size ? this.#idle() : this.clear()), o.idleMs);
    };
    if (o.dropOnHide) dropOnHide(this);
  }

  /** A pack's bytes, whole: fetched once at a time, held among the most recently used within the cap (the newest
   *  always); null when it can't be fetched (asked again, it tries again). */
  pack(stem: string): Promise<ArrayBuffer | null> {
    this.#idle();
    const had = this.#held.get(stem);
    if (had) {
      this.#held.delete(stem);
      this.#held.set(stem, had);
      return had;
    }
    const p: Promise<ArrayBuffer | null> = quiet(this.#get(this.url(stem)).then((r) => (r.ok ? r.arrayBuffer() : null)), `${this.#tag}.pack`, null).then((b) => {
      if (this.#held.get(stem) !== p) return b;
      if (!b) this.#held.delete(stem);
      else {
        this.#size.set(stem, b.byteLength);
        this.#trim(stem);
      }
      return b;
    });
    this.#held.set(stem, p);
    return p;
  }

  /** The least recently used out till within the cap, never `kept` (the pack just in: the newest key may be one still
   *  on its way). */
  #trim(kept: string): void {
    let total = [...this.#size.values()].reduce((s, n) => s + n, 0);
    for (const k of this.#held.keys()) {
      if (total <= this.#cap) break;
      if (k === kept) continue;
      const n = this.#size.get(k);
      if (n === undefined) continue; // (on its way)
      total -= n;
      this.#held.delete(k);
      this.#size.delete(k);
    }
  }

  /** A file's bytes, a copy (a decode may detach what it's given), cut from its pack; null when the pack can't be had,
   *  or past its end. */
  async bytes([stem, offset, n]: PackRef): Promise<ArrayBuffer | null> {
    const b = await this.pack(stem);
    return b && offset + n <= b.byteLength ? b.slice(offset, offset + n) : null;
  }

  /** Packs fetched ahead, each once: the first, then the rest once it's in (on 4G a level-4 deck's packs all at once
   *  took the first question's 6.3 s); none of the rest after a clear meanwhile (the sheet closed). */
  prefetch(stems: readonly string[]): void {
    const [first, ...rest] = [...new Set(stems)];
    if (!first) return;
    const gen = this.#gen;
    void this.pack(first).then(() => gen === this.#gen && rest.forEach((s) => void this.pack(s)));
  }

  /** Every pack let go, and a prefetch's rest. */
  clear(): void {
    this.#gen++;
    this.#held.clear();
    this.#size.clear();
  }
}
