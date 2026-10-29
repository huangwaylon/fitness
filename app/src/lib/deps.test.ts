// Folder boundaries (round 9 §1): each top-level folder of src/lib may import only the folders on its allow-list,
// so the direction contract/time → config/scoring/model → sync → store → ui-state → components holds, and nothing
// under lib imports a route. A new edge has to be added here on purpose.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const LIB = import.meta.dirname;
const DOMAIN = ['types', 'contract', 'time', 'config', 'scoring', 'model'];

const ALLOW: Record<string, string[]> = {
  types: [],
  contract: ['types'],
  time: ['types', 'contract'],
  config: ['types'],
  scoring: ['types', 'contract', 'time', 'config'],
  model: DOMAIN,
  i18n: ['types', 'time', 'config'],
  sync: [...DOMAIN],
  store: [...DOMAIN, 'sync', 'i18n', 'ui-state'],
  'ui-state': [...DOMAIN, 'store', 'i18n'],
  art: ['types', 'ui-state'],
  villagers: ['types', 'art', 'i18n'],
  components: [...DOMAIN, 'sync', 'store', 'ui-state', 'i18n', 'art', 'villagers']
};

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|svelte)$/.test(f) && !/\.test\.ts$/.test(f) ? [p] : [];
  });
}

/** `components/ui/Sheet.svelte` → `components`; `art.ts` → `art`; outside lib → `../<path>`. */
function folderOf(path: string): string {
  const r = relative(LIB, path);
  if (r.startsWith('..')) return r;
  return r.includes('/') ? r.split('/')[0] : r.replace(/\.(ts|svelte)$/, '');
}

const edges: { from: string; to: string; file: string }[] = [];
for (const f of files(LIB)) {
  for (const [, spec] of readFileSync(f, 'utf8').matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)) {
    let target: string;
    if (spec.startsWith('#lib/')) target = join(LIB, spec.slice(5));
    else if (spec.startsWith('.')) target = resolve(dirname(f), spec);
    else continue; // packages, $app/*
    const from = folderOf(f);
    const to = folderOf(target);
    if (from !== to) edges.push({ from, to, file: relative(LIB, f) });
  }
}

describe('src/lib folder boundaries', () => {
  it('every folder is on the allow-list', () => {
    expect(edges.length).toBeGreaterThan(100); // the scan found the imports
    expect(new Set(edges.map((e) => e.from)).difference(new Set(Object.keys(ALLOW)))).toEqual(new Set());
  });

  it('imports only what its folder allows', () => {
    // art.ts bundles static/art/manifest.json (outside src/lib): the one allowed reach outside.
    const bad = edges
      .filter((e) => !(ALLOW[e.from] ?? []).includes(e.to) && !(e.from === 'art' && e.to.endsWith('static/art/manifest.json')))
      .map((e) => `${e.file} → ${e.to}`);
    expect(bad).toEqual([]);
  });
});
