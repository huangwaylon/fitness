// One file per picture in static/art: a key whose file has the same bytes as another key's points at that key's file
// (its manifest `path`; vite.config.ts slimArtManifest bundles it as `same`, lib/art.ts reads it) and its own copy goes.
// NH draws some things alike (the six crop starts are one seedling, a few winter bushes one snowy bush). Every script
// that writes the art manifest runs this last (fetch-assets, models, nh-icons; scenes' cards are each a render of their
// own); a key's own file, written again, wins first, so a re-run re-checks it. Kept: host/ (Tom Nook's and Isabelle's
// precached copies, the error page's, of their villagers/ files).
// Usage (from app/): node scripts/art-dedupe.ts (static/art/manifest.json in place)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Entry { path: string }
const KEEP = /^host\//;

/** Points each copy's key at the first (by key) of its picture and deletes the copy; returns the keys repointed. */
export function dedupeArt(files: Record<string, Entry>, dir: string): string[] {
  for (const [k, e] of Object.entries(files)) if (existsSync(join(dir, `${k}.webp`))) e.path = `${k}.webp`;
  const first = new Map<string, string>(), moved: string[] = [];
  for (const k of Object.keys(files).sort()) {
    const e = files[k];
    if (KEEP.test(k) || e.path !== `${k}.webp`) continue;
    const hash = createHash('sha256').update(readFileSync(join(dir, e.path))).digest('hex');
    const to = first.get(hash);
    if (!to) {
      first.set(hash, k);
      continue;
    }
    rmSync(join(dir, e.path));
    e.path = `${to}.webp`;
    moved.push(k);
  }
  // (a copy of a copy: the key it pointed at is itself one now)
  for (const e of Object.values(files)) {
    const to = files[e.path.slice(0, -5)];
    if (to && to.path !== e.path) e.path = to.path;
  }
  return moved;
}

if (import.meta.main) {
  const ART = join(import.meta.dirname, '..', 'static', 'art'), MANIFEST = join(ART, 'manifest.json');
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { files: Record<string, Entry> };
  const moved = dedupeArt(manifest.files, ART);
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`${moved.length} copies dropped${moved.length ? `: ${moved.join(', ')}` : ''}`);
}
