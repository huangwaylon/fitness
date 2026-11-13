// The models are served immutable (scripts/headers.ts: `*.glb`, a year), so every load must carry its file's `?v=`
// (its manifest's `v`, the converter's hash): a model missing from its manifest would load as `?v=0` and stay cached
// as it was for good. Each GLB under static/room/ is named in a manifest (any src JSON: the key of an entry with a
// string `v`, or that entry's pack).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = join(import.meta.dirname, '..', '..', '..', '..');
const walk = (d: string, f: (p: string) => void) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, f);
    else f(p);
  }
};

describe('the models carry their hash', () => {
  it('every GLB under static/room/ has a manifest entry with its `v`', () => {
    const named = new Set<string>();
    const collect = (o: unknown): void => {
      if (Array.isArray(o)) return o.forEach(collect);
      if (!o || typeof o !== 'object') return;
      for (const [k, x] of Object.entries(o as Record<string, unknown>)) {
        const e = x as Record<string, unknown> | null;
        if (e && typeof e === 'object' && typeof e.v === 'string') {
          named.add(k);
          for (const f of ['pack', 'pk', 'm']) if (typeof e[f] === 'string') named.add(e[f]);
        }
        collect(x);
      }
    };
    walk(join(APP, 'src'), (p) => p.endsWith('.json') && !/\/(i18n|fixtures)\//.test(p) && collect(JSON.parse(readFileSync(p, 'utf8'))));
    const room = join(APP, 'static', 'room'), missing: string[] = [];
    let n = 0;
    walk(room, (p) => {
      if (!p.endsWith('.glb')) return;
      n++;
      // (under its folder: world3d/critters/bugs/ant is assets.json's `critters/bugs/ant`, villagers3d/ace villagers.json's `ace`)
      const rest = relative(room, p).replace(/\.glb$/, '').split('/').slice(1);
      if (!named.has(rest.join('/')) && !named.has(rest.at(-1)!)) missing.push(relative(room, p));
    });
    expect(n).toBeGreaterThan(1000);
    expect(missing).toEqual([]);
  });
});
