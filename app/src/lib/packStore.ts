// Files packed end to end into a few static files (Cloudflare Pages caps a deploy at 20,000 files: lib/static-budget.ts),
// read on the phone: ききみみ's audio (components/kikimimi/packs.ts) and the players' parts (player3d/parts.ts). A file is
// a slice of its pack (`[stem, offset, bytes]`, the pack's stem naming its content: `<name>.<hash>`). A pack is fetched
// whole (`pack`) and held in memory among the most recently used (a byte cap), or a file alone (`slice`): the pack's URL
// with `?s=<from>-<to>` (the service worker's key for it: caches.ts packSlice), asked as a Range. Cloudflare Pages
// answers a Range with the whole file (200, measured 2026-11-09): a whole answer is held as the pack, so its other
// files are cut from memory.
import { quiet } from '#lib/quiet.ts';

/** Where a file is: its pack's stem, its offset and bytes. */
export type PackRef = readonly [stem: string, offset: number, bytes: number];

export interface PackStoreOpts {
  /** A pack's URL (its stem names its content: cached for good). */
  url: (stem: string) => string;
  get?: (url: string, init?: RequestInit) => Promise<Response>;
  /** The packs held in memory (bytes). */
  cap?: number;
  /** The slices held in memory. */
  slices?: number;
  /** The failures' log tag (`<tag>.pack`, `<tag>.slice`). */
  tag: string;
}

/** A file's slice of its pack: the pack's URL with the bytes asked for (the service worker's cache key). */
export const sliceOf = (packUrl: string, [, offset, n]: PackRef): string => `${packUrl}?s=${offset}-${offset + n - 1}`;

export class PackStore {
  /** Packs asked for, least recently used first: their bytes (null: offline, not kept). */
  #held = new Map<string, Promise<ArrayBuffer | null>>();
  #size = new Map<string, number>();
  /** Slices asked for, least recently used first (key `stem:offset`). */
  #slices = new Map<string, Promise<ArrayBuffer | null>>();
  readonly #get: (url: string, init?: RequestInit) => Promise<Response>;
  readonly #cap: number;
  readonly #keep: number;
  readonly #tag: string;
  readonly url: (stem: string) => string;

  constructor(o: PackStoreOpts) {
    this.url = o.url;
    this.#get = o.get ?? ((u, i) => fetch(u, i));
    this.#cap = o.cap ?? 12_000_000;
    this.#keep = o.slices ?? 64;
    this.#tag = o.tag;
  }

  /** A file's slice URL (`?s=from-to`). */
  sliceUrl(ref: PackRef): string {
    return sliceOf(this.url(ref[0]), ref);
  }

  /** Whether a pack is held (or on its way). */
  holds(stem: string): boolean {
    return this.#held.has(stem);
  }

  /** A pack's bytes, whole: fetched once at a time, held among the most recently used within the cap (the newest
   *  always); null when it can't be fetched (asked again, it tries again). */
  pack(stem: string): Promise<ArrayBuffer | null> {
    const had = this.#held.get(stem);
    if (had) {
      this.#held.delete(stem);
      this.#held.set(stem, had);
      return had;
    }
    return this.#hold(stem, quiet(this.#get(this.url(stem)).then((r) => (r.ok ? r.arrayBuffer() : null)), `${this.#tag}.pack`, null));
  }

  #hold(stem: string, bytes: Promise<ArrayBuffer | null>): Promise<ArrayBuffer | null> {
    const p: Promise<ArrayBuffer | null> = bytes.then((b) => {
      if (!b) {
        if (this.#held.get(stem) === p) this.#held.delete(stem);
        return null;
      }
      this.#size.set(stem, b.byteLength);
      this.#trim();
      return b;
    });
    this.#held.delete(stem);
    this.#held.set(stem, p);
    return p;
  }

  #trim(): void {
    let total = [...this.#held.keys()].reduce((s, k) => s + (this.#size.get(k) ?? 0), 0);
    for (const k of [...this.#held.keys()].slice(0, -1)) {
      if (total <= this.#cap) break;
      total -= this.#size.get(k) ?? 0;
      this.#held.delete(k);
      this.#size.delete(k);
    }
  }

  /** A file's bytes, a copy (a decode may detach what it's given): sliced from its pack when that's held or on its
   *  way, else fetched alone (slice); null when neither can be had, or past the pack's end. */
  async bytes(ref: PackRef): Promise<ArrayBuffer | null> {
    const [stem, offset, n] = ref;
    if (!this.#held.has(stem)) {
      const b = await this.slice(ref);
      return b && b.byteLength === n ? b.slice(0) : null;
    }
    const b = await this.pack(stem);
    return b && offset + n <= b.byteLength ? b.slice(offset, offset + n) : null;
  }

  /** A file's bytes alone: a Range of its pack, fetched once at a time, held among the most recent few; null when it
   *  can't be fetched (asked again, it tries again). A server that answers with the whole pack (Pages): sliced here,
   *  and the pack held (its other files from memory). */
  slice(ref: PackRef): Promise<ArrayBuffer | null> {
    const [stem, offset, n] = ref, key = `${stem}:${offset}`;
    const had = this.#slices.get(key);
    if (had) {
      this.#slices.delete(key);
      this.#slices.set(key, had);
      return had;
    }
    const p: Promise<ArrayBuffer | null> = quiet(this.#get(this.sliceUrl(ref), { headers: { range: `bytes=${offset}-${offset + n - 1}` } }).then(async (r) => {
      if (!r.ok) return null;
      // (the slice itself: a 206, or the service worker's 200 of just its bytes; else the whole pack, sliced here)
      const got = await r.arrayBuffer();
      if (r.status === 206 || got.byteLength === n) return got;
      if (offset + n > got.byteLength) return null;
      if (!this.#held.has(stem)) void this.#hold(stem, Promise.resolve(got));
      return got.slice(offset, offset + n);
    }), `${this.#tag}.slice`, null).then((b) => {
      if (!b && this.#slices.get(key) === p) this.#slices.delete(key);
      return b;
    });
    this.#slices.set(key, p);
    for (const k of [...this.#slices.keys()].slice(0, Math.max(0, this.#slices.size - this.#keep))) this.#slices.delete(k);
    return p;
  }

  /** Every pack and slice let go. */
  clear(): void {
    this.#held.clear();
    this.#size.clear();
    this.#slices.clear();
  }
}
