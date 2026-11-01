// Every i18n key, sprite symbol and art file the UI uses exists, and none is left unused. Usage is read
// from the UI's sources (components, routes, the store, i18n, villagers, the art helpers): string literals, plus
// the static prefix of a dynamic key (`panel.tab.${id}`). The host's lines (`host.<line>`) are
// picked by name.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import jaMain from '#lib/i18n/ja.json';
import enMain from '#lib/i18n/en.json';
import jaTab from '#lib/i18n/kenkou.ja.json';
import enTab from '#lib/i18n/kenkou.en.json';
import jaNames from '#lib/i18n/catch.ja.json';
import enNames from '#lib/i18n/catch.en.json';
import jaCatalog from '#lib/i18n/catalog.ja.json';
import enCatalog from '#lib/i18n/catalog.en.json';
import { artKeys, REACTIONS } from '#lib/art.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';
import { ROSTER_IDS } from '#lib/villagers/roster.ts';
import { BUGS, FISH, JUNK, critterArt } from '#lib/components/island/critters.ts';
import { POND_FISH } from '#lib/components/island/pondFish.ts';
import { FOSSILS, FRAGMENTS, SHELLS, findArt } from '#lib/components/island/beach.ts';
import { PEARL, SEA } from '#lib/components/island/sea.ts';
import { MUSHROOMS } from '#lib/components/island/mushrooms.ts';
import { EGGS } from '#lib/components/island/eggs.ts';

const LIB = import.meta.dirname;
const SRC = join(LIB, '..');
/** Code outside the UI that hands i18n keys to it (the model's host line, labels, …). */
const EMITTER_DIRS = ['lib/model', 'lib/scoring', 'lib/config', 'lib/contract', 'lib/time'];
const UI_DIRS = ['lib/components', 'lib/store', 'lib/sync', 'lib/ui-state', 'lib/i18n', 'lib/villagers', 'routes', 'lib/art.ts', 'lib/sound/sound.svelte.ts'];

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

/** The main catalogs, けんこう's (loaded with its tab) and the catchables' names (loaded with the first catch or the
 *  ずかん), as `t()` sees them once all are in. */
const ja: Record<string, string> = { ...jaMain, ...jaTab, ...jaNames, ...jaCatalog };
const en: Record<string, string> = { ...enMain, ...enTab, ...enNames, ...enCatalog };
/** A lazily loaded catalog's own key prefixes. */
const NAME_KEY = /^(critter|sea|beach)\.name\.|^fossil\.set\./;
/** The balloon catalogue's names (i18n/catalog.ts, per language). */
const CATALOG_KEY = /^(item|recipe)\.name\./;

describe('i18n catalogs', () => {
  it('keep けんこう’s strings (health.*) in its own catalog, out of the first load', () => {
    for (const c of [jaTab, enTab]) expect(Object.keys(c).filter((k) => !k.startsWith('health.'))).toEqual([]);
    for (const c of [jaMain, enMain]) expect(Object.keys(c).filter((k) => k.startsWith('health.'))).toEqual([]);
  });
  it('keep the catchables’ names in their own catalog (i18n/catch.ts), out of the first load', () => {
    for (const c of [jaNames, enNames]) expect(Object.keys(c).filter((k) => !NAME_KEY.test(k))).toEqual([]);
    for (const c of [jaMain, enMain]) expect(Object.keys(c).filter((k) => NAME_KEY.test(k))).toEqual([]);
  });
  it('keep the balloon catalogue’s names (i18n/catalog.ts) in their own catalogs, out of the first load', () => {
    for (const c of [jaCatalog, enCatalog]) expect(Object.keys(c).filter((k) => !CATALOG_KEY.test(k))).toEqual([]);
    for (const c of [jaMain, enMain, jaNames, enNames]) expect(Object.keys(c).filter((k) => CATALOG_KEY.test(k))).toEqual([]);
  });
  it('have the same keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ja).sort());
  });
  it('have no unused keys', () => {
    const unused = Object.keys(ja).filter((k) =>
      k.startsWith('host.') ? !usedBy(k, false) && !hostLines.has(k.slice(5)) : !usedBy(k)
    );
    expect(unused).toEqual([]);
  });
  it('have every key the model and the rules emit', () => {
    const namespaces = new Set(Object.keys(ja).map((k) => k.split('.')[0]));
    const emitted = EMITTER_DIRS.flatMap((d) => files(join(SRC, d)))
      .filter((f) => /\.ts$/.test(f) && !/\.test\.ts$/.test(f))
      .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/'([a-z]+\.[a-z_][\w.]*)'/g)].map((m) => m[1]))
      .filter((k) => namespaces.has(k.split('.')[0]) && !/\.(ts|js|json|svelte)$/.test(k));
    expect(emitted.length).toBeGreaterThan(0);
    expect([...new Set(emitted)].filter((k) => !(k in ja) || !(k in en))).toEqual([]);
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
    const used = (id: string) => refs.includes(id) || named.has(id) || (fruitFallback && RING_FRUITS.some((f) => id === `f-${f}`));
    expect(ids.filter((id) => !used(id))).toEqual([]);
  });
});

describe('official art (static/art/manifest.json)', () => {
  const keys = artKeys();
  /** Keys built by the helpers in lib/art.ts from a fixed list. */
  const built = new Set([
    ...RING_FRUITS.map((f) => `fruit/${f}`),
    ...ROSTER_IDS.flatMap((id) => [`villagers/${id}`, `villagers/${id}-icon`]),
    ...REACTIONS.map((r) => `reactions/${r}`),
    // the scene's catches (island/critters.ts critterArt)
    ...[...Object.keys(FISH), ...Object.keys(POND_FISH), ...Object.keys(BUGS), ...JUNK, ...Object.keys(SEA)].map((id) => critterArt(id as keyof typeof FISH)),
    // the beach finds (island/beach.ts findArt)
    ...[...SHELLS.map(([id]) => id), PEARL, ...FOSSILS, ...FRAGMENTS, 'message-bottle', 'shovel', 'rock', 'watering-can'].map(findArt),
    // mushroom season (island/mushrooms.ts)
    ...[...MUSHROOMS.map(([id]) => id), 'rare-mushroom'].map(findArt),
    // Bunny Day's eggs (island/eggs.ts)
    ...EGGS.map(findArt),
    // a present's recipe card (island/Finds.svelte); its items' and recipes' icons are outside the manifest (catalog.test)
    'presents/diy-recipe'
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
    const named = [...literals].filter((l) => /^(bushes|deco|flowers|fruit|host|money|reactions|season|trees|villagers)\/[\w-]+$/.test(l));
    expect(named.filter((k) => !keys.includes(k))).toEqual([]);
  });
});
