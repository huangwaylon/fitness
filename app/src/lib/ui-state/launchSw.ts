// What a launch shared the phone with when a deploy was new (perf.boot `swi`, `swiMs`, `chunkEnd`, `chunkN`): ~half
// the phones' launches are a build's first after a deploy, and those pay more before the island's mount (A 481 vs 318
// ms p50, 11-21..24) and wait longer in all (B 1,855 vs 1,052). The browser checks for a new worker on each
// navigation; a deploy's installs beside the launch (its script's evaluation, then its install held for the launch:
// service-worker/index.ts launchDone). sync/cacheEarly.ts watchLaunchSw watches from the app's start (hooks.client.ts);
// world3d/boot.ts reads it here into the launch's report.
import type { SwSeen } from '#lib/sync/cacheEarly.ts';

type Timing = { name: string; startTime: number; responseEnd: number };

/** The launch's report fields: the new worker seen (if any), and when the last of the app's own files (`_app/`: the
 *  chunks, the CSS) begun before `mount` arrived and how many there were (ms since the navigation's start). */
export function launchSw(mount: number, entries: readonly Timing[] = (globalThis.performance?.getEntriesByType?.('resource') ?? []) as unknown as Timing[]): { swi?: SwSeen['swi']; swiMs?: number; chunkEnd?: number; chunkN?: number } {
  let end = 0, n = 0;
  for (const e of entries) {
    if (e.startTime > mount || !e.name.includes('/_app/')) continue;
    n++;
    end = Math.max(end, e.responseEnd);
  }
  const seen = (globalThis as { __islandSw?: SwSeen }).__islandSw;
  return { ...(seen ? { swi: seen.swi, ...(seen.ms !== undefined ? { swiMs: seen.ms } : {}) } : {}), ...(n ? { chunkEnd: Math.round(end), chunkN: n } : {}) };
}
