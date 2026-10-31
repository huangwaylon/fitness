// Folder boundaries: each top-level folder of src/lib may import only the folders on its allow-list,
// so the direction contract/time → config/scoring/model → sync → store → ui-state → components holds, and nothing
// under lib imports a route. A new edge has to be added here on purpose.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const LIB = import.meta.dirname;
const DOMAIN = ['types', 'contract', 'time', 'config', 'scoring', 'model'];

const ALLOW: Record<string, string[]> = {
  types: [],
  random: [],
  contract: ['types'],
  time: ['types', 'contract'],
  config: ['types'],
  scoring: ['types', 'contract', 'time', 'config'],
  model: DOMAIN,
  i18n: ['types', 'time', 'config'],
  sync: [...DOMAIN],
  store: [...DOMAIN, 'sync', 'i18n', 'ui-state', 'random'],
  // store → ui-state (toasts), never back: ui-state importing store would close a cycle
  'ui-state': [...DOMAIN, 'i18n'],
  art: ['types', 'ui-state'],
  villagers: ['types', 'art', 'i18n'],
  sound: ['types', 'time', 'sync', 'i18n', 'random'],
  components: [...DOMAIN, 'sync', 'store', 'ui-state', 'i18n', 'art', 'villagers', 'sound', 'random']
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

/** A specifier's file: as written, or with `.ts` / `/index.ts` added. */
const fileOf = (p: string): string => [p, `${p}.ts`, join(p, 'index.ts')].find((c) => existsSync(c) && statSync(c).isFile()) ?? p;

const edges: { from: string; to: string; file: string }[] = [];
/** File → the files it imports (within the repo), for the transitive checks. */
const graph = new Map<string, string[]>();
/** Aliased specifiers this scan doesn't understand: each must be added here on purpose. */
const unknown: string[] = [];
for (const f of files(LIB)) {
  const out: string[] = [];
  for (const [, spec] of readFileSync(f, 'utf8').matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
    let target: string;
    if (spec.startsWith('#lib/')) target = join(LIB, spec.slice(5));
    else if (spec.startsWith('$lib/')) target = join(LIB, spec.slice(5));
    else if (spec.startsWith('.')) target = resolve(dirname(f), spec);
    else if (/^\$app\/|^\$service-worker$/.test(spec) || /^(@[\w.-]+\/)?[\w.-]+(\/[\w./-]+)?$|^node:/.test(spec)) continue; // packages, Kit's modules
    else { unknown.push(`${relative(LIB, f)}: ${spec}`); continue; }
    out.push(fileOf(target));
    const from = folderOf(f);
    const to = folderOf(target);
    if (from !== to) edges.push({ from, to, file: relative(LIB, f) });
  }
  graph.set(f, out);
}

/** Every file reachable from `start` through imports. */
function reachable(start: string): Set<string> {
  const seen = new Set<string>();
  const todo = [start];
  while (todo.length) {
    const f = todo.pop()!;
    for (const g of graph.get(f) ?? []) if (!seen.has(g)) (seen.add(g), todo.push(g));
  }
  return seen;
}

describe('src/lib folder boundaries', () => {
  it('every folder is on the allow-list', () => {
    expect(edges.length).toBeGreaterThan(100); // the scan found the imports
    expect(new Set(edges.map((e) => e.from)).difference(new Set(Object.keys(ALLOW)))).toEqual(new Set());
  });

  it('imports only what its folder allows', () => {
    // art.ts and sound/manifest.ts bundle static/art/manifest.json and static/audio/manifest.json (outside src/lib):
    // the only allowed reaches outside.
    const outside = (e: { from: string; to: string }) =>
      (e.from === 'art' && e.to.endsWith('static/art/manifest.json')) || (e.from === 'sound' && e.to.endsWith('static/audio/manifest.json'));
    const bad = edges
      .filter((e) => !(ALLOW[e.from] ?? []).includes(e.to) && !outside(e))
      .map((e) => `${e.file} → ${e.to}`);
    expect(bad).toEqual([]);
  });
});

describe('import specifiers', () => {
  it('are all understood by this scan (relative, #lib/, $lib/, a package or Kit)', () => {
    expect(unknown).toEqual([]);
  });
});

describe('weight is never rewarded', () => {
  it('model/bells.ts and scoring/* never import model/weight.ts, even indirectly', () => {
    const weight = join(LIB, 'model/weight.ts');
    expect(existsSync(weight)).toBe(true);
    const roots = [join(LIB, 'model/bells.ts'), ...readdirSync(join(LIB, 'scoring')).filter((f) => /\.ts$/.test(f) && !/\.test\.ts$/.test(f)).map((f) => join(LIB, 'scoring', f))];
    expect(roots.length).toBeGreaterThanOrEqual(2); // model/bells.ts + scoring/bells.ts
    expect(roots.filter((r) => reachable(r).has(weight)).map((r) => relative(LIB, r))).toEqual([]);
    // the check can see an import of weight.ts (けんこう reaches it)
    expect(reachable(join(LIB, 'components/health/Health.svelte')).has(weight)).toBe(true);
  });
});

describe('scenery is never rewarded', () => {
  it('model/bells.ts and scoring/* never import model/finds.ts (the ずかん) or the island scenery, even indirectly', () => {
    const finds = join(LIB, 'model/finds.ts');
    expect(existsSync(finds)).toBe(true);
    const roots = [join(LIB, 'model/bells.ts'), ...readdirSync(join(LIB, 'scoring')).filter((f) => /\.ts$/.test(f) && !/\.test\.ts$/.test(f)).map((f) => join(LIB, 'scoring', f))];
    const bad = (r: string) => [...reachable(r)].some((f) => f === finds || f.includes('/components/island/'));
    expect(roots.filter(bad).map((r) => relative(LIB, r))).toEqual([]);
  });
});
