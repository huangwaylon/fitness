// Whether this launch opens the island: test mode (`?demo`, ui-state/testMode.ts), or a phone paired on a build that is set up (else the app goes to
// /pair, or says it isn't set up). The 3D island's chunk (three.js and its scene, ~1 MB) and its ground's fields are
// asked for at the launch only then (+layout.ts load). index.html's inline preload of that chunk's graph applies the
// same rule before any of the app's code runs (scripts/headers.ts ISLAND_BOOT: keep the two alike).
import { DEMO, getKey, sessionKV } from '#lib/sync/storage.ts';
import { RECORD_CONFIGURED } from '#lib/sync/transport.ts';
import { keyFromHash } from '#lib/sync/pairing.ts';
import { testModeAllowed } from './testMode.ts';

export function opensIsland(loc: Pick<Location, 'search' | 'hash'> = location): boolean {
  let mode: string | null | undefined = null;
  try {
    mode = sessionKV()?.getItem(DEMO.mode);
  } catch {
    /* no storage */
  }
  if (testModeAllowed() && (new URLSearchParams(loc.search).has('demo') || mode === 'plain' || mode === 'harvest')) return true;
  // (the dev server without a record: the fixtures' demo, store/week.svelte.ts)
  if (import.meta.env.DEV && !import.meta.env.VITE_RECORD_URL) return true;
  return RECORD_CONFIGURED && !!getKey() && !keyFromHash(loc.hash);
}
