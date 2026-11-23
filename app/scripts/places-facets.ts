// 保存した場所's search facets and descriptions (lib/places/facets.ts packFacets) from the committed vendored shards
// (static/places/d/*.json): src/lib/places/data/places-facets.json and places-descs.json, the two lazy assets the
// search reads. Run after a re-vendor (`npm run places:details pack`); facets.test.ts fails while they're out of step.
//   node scripts/places-facets.ts           # write them
//   node scripts/places-facets.ts --check   # exit 1 when they differ from the shards'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { packFacets } from '../src/lib/places/facets.ts';
import type { VendoredPlace } from '../src/lib/places/vendored.ts';

const APP = join(import.meta.dirname, '..');
const D = join(APP, 'static/places/d');
const OUT = join(APP, 'src/lib/places/data');

/** Every shard's places, by id (an absent tree: none). */
export function shardPlaces(dir = D): Record<string, VendoredPlace> {
  const all: Record<string, VendoredPlace> = {};
  if (!existsSync(dir)) return all;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) Object.assign(all, (JSON.parse(readFileSync(join(dir, f), 'utf8')) as { p: Record<string, VendoredPlace> }).p);
  return all;
}

/** The two files' text as written (one line each: the build hashes the bytes). */
export function facetFiles(dir = D): { facets: string; descs: string } {
  const { facets, descs } = packFacets(shardPlaces(dir));
  return { facets: JSON.stringify(facets), descs: JSON.stringify(descs) };
}

if (import.meta.main) {
  const files = facetFiles();
  const paths = { facets: join(OUT, 'places-facets.json'), descs: join(OUT, 'places-descs.json') };
  const keys = Object.keys(paths) as (keyof typeof paths)[];
  if (process.argv.includes('--check')) {
    const off = keys.filter((k) => !existsSync(paths[k]) || readFileSync(paths[k], 'utf8') !== files[k]);
    if (off.length) {
      console.error(`places-facets: ${off.join(', ')} out of step with static/places/d (npm run places:facets)`);
      process.exit(1);
    }
  } else for (const k of keys) writeFileSync(paths[k], files[k]);
  const kb = (s: string) => `${(gzipSync(s, { level: 9 }).length / 1024).toFixed(1)} KB gz`;
  console.log(`places-facets: facets ${kb(files.facets)}, descs ${kb(files.descs)}`);
}
