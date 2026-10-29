// Every i18n key, sprite symbol and art file the UI uses exists, and none is left unused (round 8). Usage is read
// from the UI's sources (components, routes, client code, i18n, villagers, the art helpers): string literals, plus
// the static prefix of a dynamic key (`habit.${k}`, 'rung.' + key). The host's lines (`host.<line>`) are picked by
// name: `hostLine('grew')` or `key === 'payday'`.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';
import { artKeys, REACTIONS } from '#lib/art.ts';
import { FRUITS } from '#lib/config/rules.ts';
import { ROSTER_IDS } from '#lib/villagers/roster.ts';

const LIB = import.meta.dirname;
const SRC = join(LIB, '..');
const UI_DIRS = ['lib/components', 'lib/client', 'lib/ui-state', 'lib/i18n', 'lib/villagers', 'routes', 'lib/art.ts'];

function files(p: string): string[] {
  try {
    return readdirSync(p, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(join(p, d.name)) : [join(p, d.name)]));
  } catch {
    return [p];
  }
}
const sources = UI_DIRS.flatMap((d) => files(join(SRC, d)))
  .filter((f) => /\.(ts|svelte)$/.test(f) && !/\.test\.ts$/.test(f))
  .map((f) => ({ f: relative(SRC, f), text: readFileSync(f, 'utf8') }));
const code = sources.map((s) => s.text).join('\n');
const literals = new Set([...code.matchAll(/(['"`])([\w.:/-]+)\1/g)].map((m) => m[2]));
/** `prefix.${…}`, `'prefix.' + …`, `"prefix.{…}"` (Svelte attribute interpolation). */
const prefixes = new Set([
  ...[...code.matchAll(/`([\w.:/-]+)\$\{/g)].map((m) => m[1]),
  ...[...code.matchAll(/['"]([\w.:/-]+)['"]\s*\+/g)].map((m) => m[1]),
  ...[...code.matchAll(/"([\w.:/#-]+)\{/g)].map((m) => m[1])
]);
const hostLines = new Set([...code.matchAll(/(?:hostLine\(|===\s*)'(\w+)'/g)].map((m) => m[1]));
const usedBy = (key: string, prefixOk = true) => literals.has(key) || (prefixOk && [...prefixes].some((p) => p.length > 1 && key.startsWith(p)));

describe('i18n catalogs', () => {
  it('have the same keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ja).sort());
  });
  it('have no unused keys', () => {
    const unused = Object.keys(ja).filter((k) =>
      k.startsWith('host.') ? !usedBy(k, false) && !hostLines.has(k.slice(5)) : !usedBy(k)
    );
    expect(unused).toEqual([]);
  });
  it('have every key the UI names literally', () => {
    const keys = new Set(Object.keys(ja));
    const calls = [...code.matchAll(/\bt\(\s*'([\w.-]+)'\s*[,)]/g)].map((m) => m[1]);
    expect(calls.filter((k) => !keys.has(k))).toEqual([]);
  });
});

describe('sprite symbols (Sprites.svelte)', () => {
  const sprites = readFileSync(join(LIB, 'components/ui/Sprites.svelte'), 'utf8');
  const ids = [...sprites.matchAll(/<symbol id="([\w-]+)"/g)].map((m) => m[1]);
  const rest = sources.filter((s) => !s.f.endsWith('Sprites.svelte')).map((s) => s.text).join('\n');
  const refs = [...rest.matchAll(/href="#([\w-]+)"/g)].map((m) => m[1]);
  const named = new Set([...rest.matchAll(/'((?:i|f)-[\w-]+)'/g)].map((m) => m[1]));
  /** `#f-{fruit}`: the fruit fallbacks. */
  const fruitFallback = /href="#f-\{/.test(rest);
  it('every referenced symbol exists', () => {
    expect([...refs, ...named].filter((r) => !ids.includes(r))).toEqual([]);
  });
  it('every symbol is used', () => {
    const used = (id: string) => refs.includes(id) || named.has(id) || (fruitFallback && FRUITS.some((f) => id === `f-${f}`));
    expect(ids.filter((id) => !used(id))).toEqual([]);
  });
});

describe('official art (static/art/manifest.json)', () => {
  const keys = artKeys();
  /** Keys built by the helpers in lib/art.ts from a fixed list. */
  const built = new Set([
    ...FRUITS.map((f) => `fruit/${f}`),
    ...ROSTER_IDS.flatMap((id) => [`villagers/${id}`, `villagers/${id}-icon`]),
    ...REACTIONS.map((r) => `reactions/${r}`)
  ]);
  /** `bushes/<id>`, `flowers/<id>`, `season/<id>`, the oaks: named by id in the scene code. */
  const byId = (k: string) => {
    const [group, id] = k.split('/');
    if (group === 'trees') return literals.has(id.replace(/^oak-/, '')) || literals.has(id);
    if (group === 'reactions') return literals.has(id);
    return ['bushes', 'flowers', 'season', 'money'].includes(group) && literals.has(id);
  };
  it('every file is used', () => {
    expect(keys.filter((k) => !literals.has(k) && !built.has(k) && !byId(k))).toEqual([]);
  });
  it('every key named in the code exists', () => {
    const named = [...literals].filter((l) => /^(bushes|deco|flowers|fruit|host|money|phone|reactions|season|trees|villagers)\/[\w-]+$/.test(l));
    expect(named.filter((k) => !keys.includes(k))).toEqual([]);
  });
});
