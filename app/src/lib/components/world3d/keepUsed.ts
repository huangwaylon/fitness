// A page-wide cache's bound by use (player3d's parts' GLBs, the tent's furniture): how many users each entry has, and of
// those none uses, the `keep` last used stay (back at once), the older evicted (oldest first), as world3d/things.ts
// keeps the island's lazy models. Taken (use) before its load is awaited, so an eviction never frees what a user is
// about to draw.

export interface Kept<K> {
  /** One more user of `k` (out of the unused, if it was there). */
  use(k: K): void;
  /** One user fewer: at none it's unused, the unused past `keep` evicted. */
  unuse(k: K): void;
  /** Every unused one `spare` doesn't keep evicted now (a browse's leftovers: home.ts trimHomes). */
  drop(spare: (k: K) => boolean): void;
  /** In use (by how many keys), unused and kept. */
  stats(): { used: number; idle: number };
}

/** A bound of `keep` unused entries; `evict` lets one go (out of its cache: its GPU copies, its images). */
export function keepUsed<K>(keep: number, evict: (k: K) => void): Kept<K> {
  const users = new Map<K, number>(), idle = new Set<K>();
  return {
    use(k) {
      users.set(k, (users.get(k) ?? 0) + 1);
      idle.delete(k);
    },
    unuse(k) {
      const n = (users.get(k) ?? 1) - 1;
      if (n > 0) return void users.set(k, n);
      users.delete(k);
      idle.add(k);
      for (const old of idle) {
        if (idle.size <= keep) break;
        idle.delete(old);
        evict(old);
      }
    },
    drop(spare) {
      for (const k of [...idle]) if (!spare(k)) (idle.delete(k), evict(k));
    },
    stats: () => ({ used: users.size, idle: idle.size })
  };
}
