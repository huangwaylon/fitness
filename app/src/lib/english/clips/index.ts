// English Study's clips: every file in this folder is one (its lesson in docs/english.md's shape, lib/english/types.ts
// Clip; clips.test checks every one), read from the folder, so a clip joins by its file alone. CLIPS is by id; the order
// offered is the shared plan's (plan.ts, plan-order.ts: the build orders the index by it, whatever this order). Node-only
// (the build's module runner, the tests, scripts/english-*): the app reads the built index (`?english-index`).
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Band, Clip } from '../types.ts';

const FILES = readdirSync(fileURLToPath(new URL('.', import.meta.url))).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.d.ts'));
const MODS = await Promise.all(FILES.map((f) => import(/* @vite-ignore */ `./${f}`) as Promise<Record<string, Clip>>));

export const CLIPS: readonly Clip[] = MODS.flatMap((m) => Object.values(m)).sort((a, b) => (a.id < b.id ? -1 : 1));

/** Each wpm's band, the library cut in thirds (types.ts Band): ゆっくり below the ⌊n/3⌋th slowest, 速い from the
 *  ⌊2n/3⌋th on, ふつう between. clips.test holds every clip's band to it; scripts/english-wpm.ts writes them. */
export function bandsOf(wpms: readonly number[]): Band[] {
  const sorted = [...wpms].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length / 3)], hi = sorted[Math.floor((2 * sorted.length) / 3)];
  return wpms.map((w) => (w < lo ? 'slow' : w < hi ? 'mid' : 'fast'));
}
