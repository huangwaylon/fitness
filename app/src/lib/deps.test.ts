// Folder boundaries: each top-level folder of src/lib may import only the folders on its allow-list,
// so the direction contract/time → config/scoring/model → sync → store → ui-state → components holds, and nothing
// under lib imports a route. A new edge has to be added here on purpose. The relay (relay/) imports only contract/.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const LIB = import.meta.dirname;
const DOMAIN = ['types', 'contract', 'time', 'config', 'scoring', 'model'];
/** Leaves that import nothing (their own allow-list is empty): any folder may import them. */
const FREE = ['math', 'quiet', 'keyed', 'staticUrl', 'packPlan', 'packStore', 'surface', 'touch', 'strip'];

const ALLOW: Record<string, string[]> = {
  types: [],
  random: [],
  // the leaves (FREE): math.ts (clamp, smoothstep, the easing curves), quiet.ts (a swallowed failure counted in
  // IslandLog, the log plugging its counter in) and staticUrl.ts (a static file's URL: $app/paths only); packPlan.ts and
  // packStore.ts (files in packs: planned, read on the phone; ききみみ's audio and the players' parts)
  math: [],
  quiet: [],
  // keyed.ts: a members-only call (the key's header, one failure vocabulary): the chain menus' worker, the mic, the bots
  keyed: [],
  // strip.ts: the bots' status strip, its slots placed (保養所's minutes, ジム's checks)
  strip: [],
  staticUrl: [],
  packPlan: [],
  packStore: [],
  // surface.ts: NH's table tops' rules, the rooms' and the island's; touch.ts: the slops, the tap and the scroll physics
  surface: [],
  touch: [],
  // (random.ts imports nothing: the shop's stock is seeded by it, the relay bundling it along)
  contract: ['types', 'random'],
  time: ['types', 'contract'],
  config: ['types'],
  scoring: ['types', 'contract', 'time', 'config'],
  model: DOMAIN,
  // the island's layout (docs/island-layout.md): pure, over the contract's ops
  layout: ['types', 'contract', 'random'],
  // the meal log's food catalog (lib/food/index.ts): pure but for its loader, over the contract's snapshot
  food: ['contract'],
  // けっこんしき (docs/wedding.md): the board's pure rules (lib/wedding: progress, its settings' defaults, the note's
  // markdown and its links; the board's zone and the days between two days: time/zone.ts, time/dates.ts)
  wedding: ['types', 'contract', 'time'],
  i18n: ['types', 'time', 'config'],
  sync: [...DOMAIN, 'random'],
  store: [...DOMAIN, 'layout', 'sync', 'i18n', 'ui-state', 'random'],
  // store → ui-state (toasts), never back: ui-state importing store would close a cycle (the island's look, the
  // record's, is bound in by the root layout: ui-state/preview.svelte.ts bindLook)
  'ui-state': [...DOMAIN, 'i18n', 'sync'],
  art: ['types', 'ui-state'],
  villagers: ['types', 'art', 'i18n'],
  // (contract: the music stages' records and their rule, sound/stage.svelte.ts)
  sound: ['types', 'contract', 'time', 'sync', 'i18n', 'random'],
  // ききみみ クイズ (docs/kikimimi.md): the session's pure state machine over the quiz intent (sync: the Live's type), the
  // bank naming roster ids (a type), the deck seeded by random; the scene clock (time: しずえの ニュース's day and weather)
  kikimimi: ['types', 'contract', 'time', 'sync', 'random', 'villagers'],
  // りょこう (docs/travel.md): the guides' data and its tokens, pure; the packing seed is the relay contract's type
  // (contract/pack.ts PackSeed)
  travel: ['contract'],
  // トレイル (docs/hiking.md): the trails' data and their tracks, pure; a text pair is the guides' (travel), a locale i18n's
  hiking: ['travel', 'i18n'],
  // ききみみ's mic (docs/kikimimi-mic.md): the capture's audio session (sound/engine.ts applySession), the relay's
  // `/stt` and the key (sync)
  mic: ['sync', 'sound'],
  offline: ['travel', 'hiking', 'sync'],
  // ボット's ジム (docs/design.md "Bots"): the gym bot's /status, read and worded for its page, and its
  // /gym/config with the member key (the guards: contract/guards.ts)
  gym: ['i18n', 'sync', 'contract'],
  // ボット's 保養所 (docs/design.md "Bots"): the its-bot Worker's client (the member key, the log) and the page's view
  its: ['i18n', 'sync', 'contract'],
  // the island's game model (world.ts, the walk, the critters, the sea, the day's weather and seeds, the farm's batch
  // writes…): pure, never a component, so the DOM island, the 3D renderer and the sheets (ずかん, the museum, the shop)
  // all read it, never each other's folders for it. The day's own records (storage: sceneDay, birthday, say, …)
  world: [...DOMAIN, 'layout', 'random', 'villagers', 'art', 'ui-state', 'sync', 'i18n'],
  components: [...DOMAIN, 'layout', 'food', 'wedding', 'sync', 'store', 'ui-state', 'i18n', 'art', 'villagers', 'sound', 'kikimimi', 'random', 'travel', 'hiking', 'mic', 'offline', 'gym', 'its', 'world']
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
  for (const [, spec] of readFileSync(f, 'utf8').matchAll(/(?<![\w'".-])(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
    let target: string;
    if (spec.startsWith('#lib/')) target = join(LIB, spec.slice(5));
    else if (spec.startsWith('$lib/')) target = join(LIB, spec.slice(5));
    else if (spec.startsWith('.')) target = resolve(dirname(f), spec);
    else if (/^\$app\/|^\$service-worker$/.test(spec) || /^(@[\w.-]+\/)?[\w.-]+(\/[\w./-]+)?(\?(worker&)?url)?$|^node:/.test(spec)) continue; // packages (a file of one as a URL: `?url`, `?worker&url`), Kit's modules
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
    // art.ts and sound/manifest.ts bundle static/art/manifest.json and static/audio/manifest.json (outside src/lib),
    // sound/kk.ts imports static/audio/kk.json (its own chunk), the mic's recogniser the service worker's STT cache's
    // name (service-worker/caches.ts STT_CACHE, the cache it fills), the saved map areas the worker's names and tile keys
    // for them (SAVED_PREFIX, tileKey), and 保養所ボット's demo the ITS contract's example (its/contract-example.json): the only
    // allowed reaches outside.
    const outside = (e: { from: string; to: string }) =>
      (e.from === 'art' && e.to.endsWith('static/art/manifest.json')) || (e.from === 'sound' && /static\/audio\/(manifest|kk)\.json$/.test(e.to)) ||
      ((e.from === 'mic' || e.from === 'offline') && e.to.endsWith('service-worker/caches.ts')) || (e.from === 'its' && e.to.endsWith('its/contract-example.json'));
    const bad = edges
      .filter((e) => !(ALLOW[e.from] ?? []).includes(e.to) && !FREE.includes(e.to) && !outside(e))
      .map((e) => `${e.file} → ${e.to}`);
    expect(bad).toEqual([]);
  });
});

// Inside components/: the 3D renderers and rooms draw, the sheets are the UI over them. A renderer never imports a
// sheet (what both need is world/'s, or a kit's), and a sheet another sheet only by an edge named here.
const RENDERERS = ['world3d', 'villager3d', 'player3d', 'person3d', 'rooms', 'homes', 'tent', 'museum', 'shop'];
const SHEETS = ['panel', 'health', 'food', 'kikimimi', 'wallet', 'board', 'farm', 'kiroku', 'bots', 'travel', 'hiking', 'wedding', 'look', 'sheets', 'editor', 'layoutEdit'];
/** The one renderer → sheet edge: the villagers' portraits (すがた's), the cards' faces on the island and in the rooms. */
const RENDERER_READS = ['look/portraits.svelte.ts'];
/** Sheet → sheet, on purpose: ごはん on けんこう's kit (its pager, range, cards, whose) and けんこう hosting ごはん, 登山
 *  on 旅行's guide kit (and its packing) and 旅行's day opening a trail, the layout editor and the world editor's shared
 *  pieces, the panel's own pages (すがた, けんこう, the wallet), the harvest overlay's fill (the wallet's), anyone's
 *  きろく formatters. */
const SHEET_EDGES: Record<string, string[]> = {
  food: ['health'], health: ['food'], hiking: ['travel'], travel: ['hiking'], layoutEdit: ['editor'], editor: ['layoutEdit'],
  panel: ['look', 'health', 'wallet', 'kiroku'], sheets: ['wallet']
};
const subOf = (f: string) => relative(join(LIB, 'components'), f).split('/');
const componentEdges = [...graph].flatMap(([f, to]) => {
  const [a, ...rest] = subOf(f);
  return a.startsWith('..') || !rest.length ? [] : to.map((t) => ({ file: relative(LIB, f), a, b: subOf(t)[0], to: subOf(t).join('/') })).filter((e) => !e.b.startsWith('..') && e.b !== e.a);
});

describe('inside components/', () => {
  it('a renderer never imports a sheet (but the portraits)', () => {
    expect(componentEdges.length).toBeGreaterThan(100);
    const bad = componentEdges.filter((e) => RENDERERS.includes(e.a) && SHEETS.includes(e.b) && !RENDERER_READS.includes(e.to));
    expect(bad.map((e) => `${e.file} → ${e.to}`)).toEqual([]);
  });

  it('a sheet imports another sheet only by an edge on the list (anyone may read きろく’s formatters)', () => {
    const bad = componentEdges.filter((e) => SHEETS.includes(e.a) && SHEETS.includes(e.b) && e.b !== 'kiroku' && !(SHEET_EDGES[e.a] ?? []).includes(e.b));
    expect(bad.map((e) => `${e.file} → ${e.to}`)).toEqual([]);
    // (each edge listed still there: a gone one leaves the list)
    for (const [a, bs] of Object.entries(SHEET_EDGES)) for (const b of bs) expect(componentEdges.some((e) => e.a === a && e.b === b), `${a} → ${b}`).toBe(true);
  });
});

describe('the relay boundary', () => {
  it('relay/ (its code, tests and scripts) imports from the app only contract/, and contract/ reaches only itself, types.ts and random.ts', () => {
    const RELAY = resolve(LIB, '../../../relay');
    const APP = resolve(LIB, '../..');
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => {
      const p = join(d, f);
      return statSync(p).isDirectory() ? (f === 'node_modules' ? [] : walk(p)) : /\.ts$/.test(f) ? [p] : [];
    });
    const seen: string[] = [];
    const bad: string[] = [];
    for (const f of ['src', 'test', 'scripts'].flatMap((d) => walk(join(RELAY, d))))
      for (const [, spec] of readFileSync(f, 'utf8').matchAll(/(?<![\w'".-])(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
        if (!spec.startsWith('.')) continue;
        const target = fileOf(resolve(dirname(f), spec));
        if (!target.startsWith(`${APP}/`)) continue;
        seen.push(target);
        if (!target.startsWith(join(LIB, 'contract/'))) bad.push(`${relative(RELAY, f)} → ${relative(APP, target)}`);
      }
    expect(seen.length).toBeGreaterThan(10); // the scan found the relay's imports
    expect(bad).toEqual([]);
    // what the relay bundles through the contract
    const ok = (f: string) => f.startsWith(join(LIB, 'contract/')) || f === join(LIB, 'types.ts') || f === join(LIB, 'random.ts');
    const reached = new Set(seen.flatMap((f) => [f, ...reachable(f)]));
    expect([...reached].filter((f) => !ok(f)).map((f) => relative(APP, f))).toEqual([]);
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
    const bad = (r: string) => [...reachable(r)].some((f) => f === finds || f.includes('/components/island/') || relative(LIB, f).startsWith('world/'));
    expect(roots.filter(bad).map((r) => relative(LIB, r))).toEqual([]);
  });
});

describe('かいがら never mix with ベル', () => {
  it('the economy (model/bells.ts, scoring/*) never imports the shop’s fold, and the shop never the economy or its prices', () => {
    const shop = [join(LIB, 'model/shop.ts'), join(LIB, 'contract/shop.ts')];
    for (const f of shop) expect(existsSync(f)).toBe(true);
    const economy = [join(LIB, 'model/bells.ts'), ...readdirSync(join(LIB, 'scoring')).filter((f) => /\.ts$/.test(f) && !/\.test\.ts$/.test(f)).map((f) => join(LIB, 'scoring', f))];
    // (the model's State reads the shop's rows as it reads a tally's: model/state.ts → contract/shop.ts, its shapes only)
    expect(economy.filter((r) => reachable(r).has(shop[0])).map((r) => relative(LIB, r))).toEqual([]);
    const bells = [...economy, join(LIB, 'config/rules.ts'), join(LIB, 'contract/rules.ts')];
    expect(shop.filter((r) => bells.some((f) => reachable(r).has(f))).map((r) => relative(LIB, r))).toEqual([]);
  });
});

describe('the buy prices stay off the first load', () => {
  it('only the relay imports contract/shopCheck.ts, and the model never reaches the buy price list', () => {
    const check = join(LIB, 'contract/shopCheck.ts'), prices = join(LIB, 'contract/buyPrices.ts');
    for (const f of [check, prices]) expect(existsSync(f)).toBe(true);
    expect([...graph].filter(([, to]) => to.includes(check)).map(([f]) => relative(LIB, f))).toEqual([]);
    // (the model's State takes the record's rules, contract/record.ts, and the shop's shapes, contract/shop.ts)
    expect(reachable(join(LIB, 'model/state.ts')).has(prices)).toBe(false);
    // the check can see it: the shop's room reaches the list
    expect(reachable(join(LIB, 'components/shop/ShopRoom.svelte')).has(prices)).toBe(true);
  });
});

describe('meals are never rewarded', () => {
  it('model/bells.ts and scoring/* never import the food catalog (lib/food/) or the model’s meal log, even indirectly', () => {
    const roots = [join(LIB, 'model/bells.ts'), ...readdirSync(join(LIB, 'scoring')).filter((f) => /\.ts$/.test(f) && !/\.test\.ts$/.test(f)).map((f) => join(LIB, 'scoring', f))];
    const food = (f: string) => relative(LIB, f).startsWith('food/') || f === join(LIB, 'model/food.ts');
    expect(roots.filter((r) => [...reachable(r)].some(food)).map((r) => relative(LIB, r))).toEqual([]);
  });
});
