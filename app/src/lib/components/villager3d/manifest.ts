// Which villagers have a 3D model (villagers.json, scripts/villagers3d-models.ts) and where it is: under /room/ (the
// service worker caches it on first use, never at install), its content hash in the address.
import MANIFEST from './villagers.json' with { type: 'json' };

interface Entry {
  kb: number;
  tris: number;
  h: number;
  v: string;
}
const M = MANIFEST as { villagers: Record<string, Entry>; none: Record<string, string> };

export const has3d = (id: string): boolean => id in M.villagers;
export const ids3d = (): string[] => Object.keys(M.villagers);

/** The GLB's address in `dir` (the site's room/villagers3d/: $app/paths asset), or null when it has none. */
export function url3d(id: string, dir: string): string | null {
  const e = M.villagers[id];
  return e ? `${dir.replace(/\/?$/, '/')}${id}.glb?v=${e.v}` : null;
}
