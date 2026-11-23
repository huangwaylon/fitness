import { sveltekit } from '@sveltejs/kit/vite';
import adapterStatic from '@sveltejs/adapter-static';
import { defineConfig, type Plugin } from 'vitest/config';
import { runnerImport } from 'vite';
import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { carried, contentHash, precachable } from './src/service-worker/caches.ts';
import { basisModuleCode } from './src/lib/components/world3d/basisModule.ts';
import { catalogNameKeys, pack, packRefs, tentCodes, tentNameKeys } from './src/lib/packedKeys.ts';
import { encodeLine } from './src/lib/travel/polyline.ts';
import { bankOf, bankPath, deckOf, metaOf, shardPath, shardsOf, withScenes, withTranscript } from './src/lib/english/catalog.ts';
import { fnv } from './src/lib/english/hash.ts';
import { planOf } from './src/lib/english/plan.ts';
import type { Bank, Clip, JaTranscriptFile, ScenesFile, TranscriptFile, TranscriptLine } from './src/lib/english/types.ts';

/** The app version (the log's `build`, names the SW cache, and in _app/version.json for Kit's update check): the build date (UTC) + the commit, e.g. `2026-10-29.ef93d8b`. Deterministic per commit and day. */
function appVersion(): string {
  let sha = process.env.GITHUB_SHA?.slice(0, 7);
  if (!sha) {
    try {
      sha = execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      sha = 'local';
    }
  }
  return `${new Date().toISOString().slice(0, 10)}.${sha}`;
}
const VERSION = appVersion();
/** The seat tables' version (the live hello's `sv`, sync/live.ts): a hash of what a seated villager's pose is read from,
 *  so a phone whose tables differ from its partner's is told to update (ui-state/peerVer.ts). */
const SEATS_V = fnv(['src/lib/components/villager3d/seats3d.json', 'src/lib/components/tent/seats-more.json'].map((f) => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n'));

/** The art manifest is bundled into the main chunk (lib/art.ts): ship only each key's size, packed per folder (a
 *  file is `<key>.webp`, so the path is implied, but for a key sharing another's picture: `same`, key → that key,
 *  scripts/art-dedupe.ts; the `source` credit URLs stay in static/art/manifest.json for the runbook). Per folder (`villagers`, and `villagers/*-icon` for the `-icon` keys): its most common size, the height most
 *  of the rest share, the names at the common size and `name:w` / `name:w:h` for the others; art.ts unpacks it.
 *  ~1,300 keys in 13 KB instead of 40. */
type Packed = Record<string, [w: number, h: number, h2: number, plain: string, odd: string]>;
const slimArtManifest: Plugin = {
  name: 'slim-art-manifest',
  enforce: 'pre',
  transform(code, id) {
    if (!id.split('?')[0].endsWith('/static/art/manifest.json')) return;
    const { files } = JSON.parse(code) as { files: Record<string, { path: string; w: number; h: number }> };
    const groups = new Map<string, Map<string, [number, number]>>();
    const same: Record<string, string> = {};
    for (const [k, { path, w, h }] of Object.entries(files)) {
      if (path !== `${k}.webp`) {
        const to = path.slice(0, -5);
        if (files[to]?.path !== path) throw new Error(`static/art/manifest.json: ${k} is at ${path}, neither ${k}.webp nor another key's file (lib/art.ts assumes one)`);
        same[k] = to;
      }
      const cut = k.lastIndexOf('/'), icon = k.endsWith('-icon');
      const g = icon ? `${k.slice(0, cut)}/*-icon` : k.slice(0, cut), n = k.slice(cut + 1, icon ? -5 : undefined);
      if (/[,:]/.test(n)) throw new Error(`static/art/manifest.json: ${k} has a , or : (the packing's separators)`);
      if (!groups.has(g)) groups.set(g, new Map());
      groups.get(g)!.set(n, [w, h]);
    }
    const commonest = <T>(xs: T[]): T => {
      const n = new Map<string, [T, number]>();
      for (const x of xs) { const k = String(x); n.set(k, [x, (n.get(k)?.[1] ?? 0) + 1]); }
      return [...n.values()].sort((a, b) => b[1] - a[1])[0][0];
    };
    const packed: Packed = {};
    for (const [g, items] of groups) {
      const [w, h] = commonest([...items.values()]);
      const h2 = commonest([...items.values()].map((s) => s[1]));
      const plain: string[] = [], odd: string[] = [];
      for (const [n, [iw, ih]] of items) {
        if (iw === w && ih === h) plain.push(n);
        else odd.push(ih === h2 ? `${n}:${iw}` : `${n}:${iw}:${ih}`);
      }
      packed[g] = [w, h, h2, plain.join(','), odd.join(',')];
    }
    return { code: JSON.stringify({ files: packed, same }), map: null };
  }
};

/** The audio manifest (lib/sound/manifest.ts) ships without its `_readme`: only paths and loop starts reach the JS.
 *  The audio itself is never imported: it is served from static/audio/ and fetched on demand. */
const slimAudioManifest: Plugin = {
  name: 'slim-audio-manifest',
  enforce: 'pre',
  transform(code, id) {
    if (!id.split('?')[0].endsWith('/static/audio/manifest.json')) return;
    const { _readme, ...rest } = JSON.parse(code) as Record<string, unknown>;
    void _readme;
    return { code: JSON.stringify(rest), map: null };
  }
};

/** A table keyed by ids the app already holds, imported as `<file>.json?packed`, ships as its values in their order
 *  and unpacks itself with the app's own key list (lib/packedKeys.ts; its module imports that list's): the HHA
 *  numbers (tent/hha.ts) and the tent's names (i18n/tent.ts) by the tent's codes (tent/items.ts), the balloon
 *  catalogue's names (i18n/catalog.ts) by its ids (island/catalog.json): ~40 % less gzip each (the ids were a third
 *  of it). And tent/more.json's pack places by a pack's index, most without their offset (packRefs: a sixth less).
 *  The plain import (the tests', the scripts') stays the file as it is. */
/** The guides' legs (lib/travel/trips/*.ts `line: [[lon, lat], …]`, OSRM's routes: two thirds of okinawa.ts's gzip)
 *  ship as polyline strings, decoded as the guide's chunk loads (lib/travel/polyline.ts): ~10 KB less gzip over the
 *  four. The source keeps the numbers. */
const tripLines: Plugin = {
  name: 'trip-lines',
  enforce: 'pre',
  transform(code, id) {
    if (!/\/src\/lib\/travel\/trips\/[\w-]+\.ts$/.test(id.split('?')[0])) return;
    let n = 0;
    const out = code.replace(/\bline: (\[\[[-\d.,[\]]*\]\])/g, (_, pts: string) => (n++, `line: decodeLine(${JSON.stringify(encodeLine(JSON.parse(pts)))})`));
    if (/\bline: \[\[/.test(out)) throw new Error(`vite.config.ts trip-lines: a leg's line in ${id} isn't plain numbers; recheck the pattern`);
    return n ? { code: `import { decodeLine } from ${JSON.stringify(join(import.meta.dirname, 'src/lib/travel/polyline.ts'))};\n${out}`, map: null } : null;
  }
};

const packedKeys: Plugin = {
  name: 'packed-keys',
  enforce: 'pre',
  transform(code, id) {
    const [path, query] = id.split('?');
    if (query !== 'packed') return;
    const lib = (f: string) => JSON.stringify(join(import.meta.dirname, 'src/lib', f));
    const json = (f: string) => JSON.parse(readFileSync(join(import.meta.dirname, 'src/lib', f), 'utf8'));
    const out = (lines: string[]) => ({ code: [`import { unpack, unpackRefs, catalogNameKeys } from ${lib('packedKeys.ts')};`, ...lines].join('\n'), map: null, moduleType: 'js' });
    const table = JSON.parse(code);
    if (path.endsWith('/tent/more.json')) {
      delete table._;
      return out([`const m = ${JSON.stringify({ ...table, ...packRefs(table) })};`, 'export default { ...m, ...unpackRefs(m) };']);
    }
    const tent = () => [json('components/tent/items.json'), json('components/tent/more.json')] as const;
    const [keys, from, list] = path.endsWith('/tent/hha.json') ? [tentCodes(...tent()), 'components/tent/items.ts', 'TENT_CODES']
      : /\/i18n\/tent\.(ja|en)\.json$/.test(path) ? [tentNameKeys(...tent()), 'components/tent/items.ts', 'TENT_NAME_KEYS']
      : /\/i18n\/catalog\.(ja|en)\.json$/.test(path) ? [catalogNameKeys(json('components/island/catalog.json')), 'components/island/catalog.json', null]
      : [];
    if (!keys || !from) throw new Error(`vite.config.ts packed-keys: no key list for ${path}`);
    for (const f of ['components/tent/items.json', 'components/tent/more.json', 'components/island/catalog.json']) this.addWatchFile(join(import.meta.dirname, 'src/lib', f));
    const v = JSON.stringify(pack(table, keys));
    return out(list
      ? [`import { ${list} } from ${lib(from)};`, `export default unpack(${v}, ${list});`]
      : [`import c from ${lib(from)};`, `export default unpack(${v}, catalogNameKeys(c));`]);
  }
};

/** The model tables the first load carries ship without what only the scripts and the tests read: each file's KB
 *  and triangles (`kb`, `tris`: the budgets' checks) and the readme (`_`) of world3d/assets.json, tent/items.json and
 *  player3d/parts.json (~2 KB of gzip). In the build only: the tests read the tables whole. */
const SLIM_TABLES = /\/src\/lib\/components\/(world3d\/assets|tent\/items|player3d\/parts)\.json$/;
const slimModelTables: Plugin = {
  name: 'slim-model-tables',
  apply: 'build',
  enforce: 'pre',
  transform(code, id) {
    if (!SLIM_TABLES.test(id.split('?')[0])) return;
    const drop = (v: unknown): unknown =>
      Array.isArray(v) ? v.map(drop)
      : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'kb' && k !== 'tris' && k !== '_' && k !== 'budgetKb').map(([k, x]) => [k, drop(x)]))
      : v;
    return { code: JSON.stringify(drop(JSON.parse(code))), map: null };
  }
};

/** Vite's preload helper (a lazy chunk's CSS: a <link> in the head, kept) leaves its load and error listeners on the
 *  link, and the error one's closure holds the import's thunk, so the component that first asked for that CSS (a whole
 *  island: its DOM, its WebGL context) stays alive for the page's life (docs/ops/testing.md "Memory"). Both go once
 *  either fires. */
const preloadListenersOff: Plugin = {
  name: 'preload-listeners-off',
  enforce: 'post',
  transform(code, id) {
    if (id !== '\0vite/preload-helper.js') return;
    const re = /link\.addEventListener\("load", res\);\s*link\.addEventListener\("error", \(\) => rej\((.*)\)\);/;
    const m = re.exec(code);
    if (!m) throw new Error("vite.config.ts preload-listeners-off: Vite's preload helper changed; recheck its CSS link listeners");
    const off = `const off = new AbortController(), o = { signal: off.signal };
      link.addEventListener("load", () => (off.abort(), res()), o);
      link.addEventListener("error", () => (off.abort(), rej(${m[1]})), o);`;
    return { code: code.replace(re, () => off), map: null };
  }
};

/** The service worker's `$app/manifest` carries only what it precaches (service-worker/caches.ts precachable): Kit's
 *  lists every file of the build (~11,700: the art, the rooms, the fonts' subsets), which the worker filtered as it
 *  started, 560 KB of script (56 KB gzipped) fetched with each update check that finds a deploy. The lists are Kit's
 *  defines, set on the worker's environment just before its build; its manifest module names them, and here they're
 *  written in already filtered. The chunks kept on first use (caches.ts carried: MapLibre, the features) stay listed:
 *  each install carries them on. The static files' entries carry their content hash. */
const swPrecacheOnly: Plugin = {
  name: 'sw-precache-only',
  applyToEnvironment: (env) => env.name === 'serviceWorker',
  async transform(code, id) {
    if (!id.split('?')[0].endsWith('/generated/build/app-manifest.js')) return;
    const define = (this.environment.config.define ?? {}) as Record<string, unknown>;
    let out = code;
    for (const name of ['__SVELTEKIT_MANIFEST_IMMUTABLE__', '__SVELTEKIT_MANIFEST_ASSETS__']) {
      const list = define[name];
      if (typeof list !== 'string' || !out.includes(name)) throw new Error(`vite.config.ts sw-precache-only: Kit's ${name} changed; recheck the service worker's manifest`);
      let kept = (JSON.parse(list) as { path: string }[]).filter((f) => precachable(f.path) || carried(f.path));
      // a static file's content hash (caches.ts StaticFile): an install copies an unchanged one from the older shell
      // (installStatics) instead of revalidating every one with each deploy
      if (name === '__SVELTEKIT_MANIFEST_ASSETS__') {
        const dir = join(this.environment.config.root, 'static');
        kept = await Promise.all(kept.map(async (f) => ({ path: f.path, hash: await contentHash(await readFile(join(dir, f.path))) })));
      }
      out = out.replace(name, JSON.stringify(kept));
    }
    return { code: out, map: null };
  }
};

/** Vitest's file-system module cache (on by default, node_modules/.vitest-cache) keys a module on its own source: an
 *  `import.meta.glob`'s list of files was cached with it, so a file added under the glob stayed unseen by vitest till the cache was cleared. A module with a glob is never cached. */
const globsUncached: Plugin = {
  name: 'vitest-globs-uncached',
  configureVitest(ctx) {
    ctx.defineCacheKeyGenerator(({ sourceCode }) => (sourceCode.includes('import.meta.glob') ? false : undefined));
  }
};

/** The maps' MapLibre chunk and its CSS under a stable name (`_app/immutable/chunks/maplibre.<hash>.js`,
 *  `assets/maplibre.<hash>.css`; its worker is `workers/maplibre-gl-worker-<hash>.js` already), so the service worker
 *  leaves them out of its precache (caches.ts isMapLibre: kept once a map draws). So are the maps' engines (travel's,
 *  トレイル's and 保存した場所's map/engine.ts: their basemap, fonts and layers, ~40 KB gzipped) and any chunk of the
 *  shared GL modules (MAP_CORE), which import MapLibre and run only with it; the bundle's check keeps any other chunk
 *  from importing MapLibre. Kit enforces its own file names in the client build; this wraps them. */
/** English Study's data (docs/english.md "Data"): clips/'s files stay the source; `clips/index.ts?english-index` is
 *  the library's index (lib/english/catalog.ts ClipMeta, in the sheet's chunk, in the shared plan's order: plan.ts),
 *  and each bank a file of its own (catalog.ts bankOf: its retired questions cut to what この動画のフレーズ shows), `english/c/<id>.<v>.json` (catalog.ts bankPath), written into the build (served by
 *  the dev server), never bundled nor precached (caches.ts isEnglishData). A clip with scenes/<video>.json (場面のあらすじ)
 *  has them in its bank (`scenes`, and `beats` when the file has them), their version in the file's name. A clip with
 *  transcripts/<video>.en.json (セリフ) has its lines in its bank too, each with the ja file's translation when in,
 *  held to the clip's length, their version in the file's name as well. フレーズ's deck (catalog.ts deckOf) is SHARDS
 *  files, `english/p/<n>.<v>.json` (shardPath), their versions the index module's `DECK`. The clips are read fresh (Vite's module runner)
 *  once a build, and in dev again after one of them changes. */
const ENGLISH_INDEX = '/src/lib/english/clips/index.ts?english-index';
const ENGLISH_BANK = /\/english\/c\/([\w-]+)\.[0-9a-z]+\.json$/;
const ENGLISH_SHARD = /\/english\/p\/(\d+)\.[0-9a-z]+\.json$/;
const englishData = (): Plugin => {
  let root = process.cwd();
  type Data = { clips: Clip[]; deps: string[]; scenes: Map<string, Pick<ScenesFile, 'scenes' | 'beats'>>; lines: Map<string, TranscriptLine[]>; shards: string[]; deck: string[] };
  let clips: Promise<Data> | null = null;
  const scenesDir = () => join(root, 'src/lib/english/scenes');
  const transcriptsDir = () => join(root, 'src/lib/english/transcripts');
  /** video → its scenes and beats (the files lib/english/scenes.test.ts checks). */
  const readScenes = () => {
    const dir = scenesDir();
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
    return new Map(files.map((f) => {
      const sf = JSON.parse(readFileSync(join(dir, f), 'utf8')) as ScenesFile;
      return [sf.video, sf.beats ? { scenes: sf.scenes, beats: sf.beats } : { scenes: sf.scenes }] as const;
    }));
  };
  /** video → its transcript lines, the library's clips only, each with its translation when the ja file is in
   *  (transcripts.test.ts holds the ja files one line for each of the en file's, the same `t`s), held to the clip's
   *  length here (a line begun after its end dropped, one running past it cut), so a file written before its clip
   *  joined the library never needs rewriting. */
  const readTranscripts = (clips: readonly Clip[]) => {
    const dir = transcriptsDir();
    const json = <T,>(f: string): T | undefined => (existsSync(join(dir, f)) ? (JSON.parse(readFileSync(join(dir, f), 'utf8')) as T) : undefined);
    return new Map(clips.flatMap((c) => {
      const ef = json<TranscriptFile>(`${c.video}.en.json`);
      if (!ef) return [];
      const jl = json<JaTranscriptFile>(`${c.video}.ja.json`)?.lines;
      const lines = ef.lines
        .map((l, i): TranscriptLine => (jl?.[i] ? { ...l, ja: jl[i].ja } : l))
        .filter((l) => l.t[0] < c.dur)
        .map((l) => (l.t[1] > c.dur ? { ...l, t: [l.t[0], c.dur] as const } : l));
      return lines.length ? [[c.video, lines] as const] : [];
    }));
  };
  const read = () =>
    (clips ??= runnerImport<{ CLIPS: Clip[] }>(join(root, 'src/lib/english/clips/index.ts')).then(({ module, dependencies }) => {
      const shards = shardsOf(deckOf(planOf(module.CLIPS))).map((s) => JSON.stringify(s));
      return { clips: module.CLIPS, deps: dependencies, scenes: readScenes(), lines: readTranscripts(module.CLIPS), shards, deck: shards.map(fnv) };
    }));
  const meta = (d: Data, c: Clip) => withTranscript(withScenes(metaOf(c), d.scenes.get(c.video)), d.lines.get(c.video));
  const bank = (d: Data, c: Clip): Bank => bankOf(c, d.scenes.get(c.video), d.lines.get(c.video));
  return {
    name: 'english-data',
    enforce: 'pre',
    configResolved: (c) => void (root = c.root),
    async load(id) {
      if (!id.endsWith(ENGLISH_INDEX)) return;
      const d = await read();
      for (const f of d.deps) this.addWatchFile(f);
      if (existsSync(scenesDir())) for (const f of readdirSync(scenesDir())) this.addWatchFile(join(scenesDir(), f));
      if (existsSync(transcriptsDir())) for (const f of readdirSync(transcriptsDir())) this.addWatchFile(join(transcriptsDir(), f));
      return { code: `export default JSON.parse(${JSON.stringify(JSON.stringify(planOf(d.clips).map((c) => meta(d, c))))});\nexport const DECK = ${JSON.stringify(d.deck)};`, map: null };
    },
    watchChange: (id) => void (/\/src\/lib\/english\/(clips|scenes|transcripts)\//.test(id) && (clips = null)),
    async generateBundle() {
      if (this.environment.name !== 'client') return;
      const d = await read();
      for (const c of d.clips) this.emitFile({ type: 'asset', fileName: bankPath(meta(d, c)), source: JSON.stringify(bank(d, c)) });
      d.shards.forEach((s, n) => this.emitFile({ type: 'asset', fileName: shardPath(n, d.deck[n]), source: s }));
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] ?? '';
        const id = ENGLISH_BANK.exec(path)?.[1], n = ENGLISH_SHARD.exec(path)?.[1];
        if (!id && !n) return next();
        read().then((d) => {
          const c = d.clips.find((x) => x.id === id);
          const body = c ? JSON.stringify(bank(d, c)) : n ? d.shards[+n] : undefined;
          if (!body) return next();
          res.setHeader('content-type', 'application/json');
          res.end(body);
        }, next);
      });
    }
  };
};

const MAP_ENGINE = /\/src\/lib\/components\/(travel|hiking|places)\/map\/engine\.ts$/;
/** The maps' shared GL modules (components/map/gl*.ts, map/places/layer.ts): only the engines import them, so a chunk
 *  holding one (shared by two engines but not the third: not MapLibre's own) is a map chunk too. */
const MAP_CORE = /\/src\/lib\/components\/map\/(gl[^/]*|places\/layer)\.ts$/;
const mapLibreNames: Plugin = {
  name: 'maplibre-names',
  applyToEnvironment: (env) => env.name === 'client',
  outputOptions(o) {
    const chunk = o.chunkFileNames, asset = o.assetFileNames;
    if (typeof chunk !== 'function' || typeof asset !== 'string' || !asset.endsWith('/[name].[hash][extname]')) throw new Error("vite.config.ts maplibre-names: Kit's client file names changed; recheck the map's chunk names");
    const ours = (c: { moduleIds?: readonly string[]; facadeModuleId?: string | null }) =>
      !!c.moduleIds?.some((id) => id.includes('/node_modules/maplibre-gl/') || MAP_CORE.test(id)) || MAP_ENGINE.test(c.facadeModuleId ?? '');
    return {
      ...o,
      chunkFileNames: (c) => (ours(c) ? chunk(c).replace('[hash]', 'maplibre.[hash]') : chunk(c)),
      // (a chunk's CSS has no module ids: MapLibre's is told by its own selectors)
      assetFileNames: (a) => (a.names.some((n) => n.endsWith('.css')) && String(a.source).includes('.maplibregl-map') ? asset.replace('[name]', 'maplibre') : asset)
    };
  },
  generateBundle(_, bundle) {
    // a chunk that imports MapLibre is only of use with it: out of the precache with it, by its name
    const isMap = (f: string) => /(^|\/)maplibre\./.test(f.slice(f.lastIndexOf('/') + 1));
    for (const c of Object.values(bundle)) {
      if (c.type === 'chunk' && !isMap(c.fileName) && c.imports.some(isMap)) throw new Error(`vite.config.ts maplibre-names: ${c.fileName} imports MapLibre statically (${[...c.moduleIds].find((id) => id.includes('/src/'))}); name it a map chunk or import MapLibre lazily`);
    }
  }
};

/** What a phone may never open, under stable names (`_app/immutable/chunks/<name>.<hash>.js`): the English catalogs
 *  (`en`, `en-<part>`: lib/i18n's *.en.json, loaded only with English on), the wedding board's sheet (`wedding`),
 *  ごはん's barcode scanner and its decoder (`scan`) and 英語すごろく's word lists (`sg`: ~150 KB on the wire), so
 *  the service worker leaves them out of its precache (caches.ts carried: kept once used, an install carrying a changed
 *  one by its name). Not トレイル's: a trail never opened works offline on the mountain
 *  (offline.spec). A chunk is named only if all of it is the feature's; nothing outside the feature imports one
 *  statically (the bundle's check). */
const FEATURE_CHUNK: [RegExp, (m: RegExpExecArray) => string][] = [
  // (not catch.en.json: the museum's plates show both names, imported with it)
  [/\/src\/lib\/i18n\/(?:((?!catch\.)[\w-]+)\.)?en\.json$/, (m) => (m[1] ? `en-${m[1]}` : 'en')],
  [/\/src\/lib\/(?:components\/)?wedding\/|\/src\/lib\/i18n\/wedding\.(?:ts|ja\.json)$|\/src\/lib\/contract\/wedCats\.ts$/, () => 'wedding'],
  // ごはん's barcode scanner: its level (FoodScan, its lookup scan.ts, lib/scan/) and its decoder (zxing-wasm, its wasm
  // beside it as assets/zxing_reader.<hash>.wasm: lib/scan/decode.ts)
  [/\/src\/lib\/scan\/|\/src\/lib\/components\/food\/(?:FoodScan\.svelte|scan\.ts)$/, () => 'scan'],
  // 英語すごろく's word lists and mini-games' content (lib/sugoroku/words.ts, sentences.ts, mini/data.ts: imported when a
  // game opens)
  [/\/src\/lib\/sugoroku\/(?:words\.txt|accept\.txt|everyday\.json|sentences\.json|mini\/data\/[\w-]+\.json)$/, () => 'sg']
];
/** A chunk's feature: all its modules one feature's (or a package's only it uses: svelte/transition with the board). */
const featureOf = (ids: readonly string[]): string | null => {
  let name: string | null = null;
  for (const id of ids) {
    if (id.includes('/node_modules/')) continue;
    const hit = FEATURE_CHUNK.map(([re, f]) => ((m) => m && f(m))(re.exec(id.split('?')[0]))).find((n) => n);
    if (!hit || (name && name !== hit)) return null;
    name = hit;
  }
  return name;
};
const featureNames: Plugin = {
  name: 'feature-names',
  applyToEnvironment: (env) => env.name === 'client',
  outputOptions(o) {
    const chunk = o.chunkFileNames;
    if (typeof chunk !== 'function') throw new Error("vite.config.ts feature-names: Kit's client chunk names changed; recheck the features' names");
    return {
      ...o,
      chunkFileNames: (c) => {
        const name = featureOf(c.moduleIds);
        return name ? chunk(c).replace('[hash]', `${name}.[hash]`) : chunk(c);
      }
    };
  },
  generateBundle(_, bundle) {
    // (a feature's own: its chunks, the English ones each other's)
    const groupOf = (f: string) => /(?:^|\/)(en|wedding|scan|sg)(?:-[\w-]+)?\.[\w-]+\.js$/.exec(f)?.[1] ?? null;
    const chunks = Object.values(bundle).filter((c) => c.type === 'chunk');
    for (const want of ['en', 'wedding', 'scan', 'sg']) if (!chunks.some((c) => groupOf(c.fileName) === want)) throw new Error(`vite.config.ts feature-names: no ${want} chunk named; recheck FEATURE_CHUNK`);
    for (const c of chunks) {
      const bad = c.imports.find((f) => groupOf(f) && groupOf(f) !== groupOf(c.fileName));
      if (bad) throw new Error(`vite.config.ts feature-names: ${c.fileName} imports ${bad} statically (offline before it's used, it wouldn't load); load the feature lazily`);
    }
  }
};

/** three's Basis transcoder as an ES module without eval, for the island's KTX2 worker (components/world3d/ktx2.worker.ts;
 *  world3d/basisModule.ts). Its wasm isn't bundled: static/room/basis/ (scripts/world3d-ktx2.ts), fetched on first use,
 *  never precached. */
const basisModule: Plugin = {
  name: 'basis-module',
  transform: (code, id) => (id.endsWith('/three/examples/jsm/libs/basis/basis_transcoder.js') ? { code: basisModuleCode(code), map: null } : null)
};

// A static SPA (GitHub Pages). The backend is the relay: the record at its /api (lib/sync/transport.ts), the room at /room.
// Output goes to build-pages/.
export default defineConfig({
  plugins: [
    slimArtManifest,
    slimAudioManifest,
    slimModelTables,
    packedKeys,
    tripLines,
    preloadListenersOff,
    swPrecacheOnly,
    globsUncached,
    mapLibreNames,
    basisModule,
    featureNames,
    englishData(),
    sveltekit({
      adapter: adapterStatic({ pages: 'build-pages', assets: 'build-pages', fallback: 'index.html', strict: false }),
      version: { name: VERSION },
      // registered by the app once the island is up (lib/ui-state/swLate.ts), not on the window's load
      serviceWorker: { register: false },
      paths: { base: (process.env.BASE_PATH ?? '') as '' | `/${string}` },
      // SvelteKit writes this as a <meta http-equiv> tag and adds the hash of its inline bootstrap script to
      // script-src; scripts/headers.ts copies it into build-pages/_headers too. Only the relay (its socket, lib/sync/live.ts LIVE_URL, and the record's /api,
      // lib/sync/transport.ts), the gym bot's /status (lib/gym/status.ts GYM_URL), the ITS booker's Worker (lib/its/client.ts ITS_URL), the Kalori scraper's status.json and the trip map's tiles are reachable besides our own.
      csp: {
        mode: 'hash',
        directives: {
          'default-src': ['self'],
          // + the trip and places maps' basemap (components/map/style.ts BASEMAP: OpenFreeMap's TileJSON and tiles, fetched by
          // MapLibre's worker; its fonts are ours), and トレイル's raster topo (components/hiking/map/style.ts TOPO: USGS
          // Topo, GSI 地理院タイル; fetched, then decoded from blob:); ボット's メニュー reads the Kalori scraper's status.json
          // raw from GitHub (lib/kalori/status.ts KALORI_STATUS_URL: that one file, nothing else on the host); ごはん's barcode
          // scan asks Open Food Facts' product API for a code our data lacks (lib/scan/off.ts OFF_API: that path only)
          'connect-src': ['self', 'https://world.openfoodfacts.org/api/v2/product/', 'wss://island-fund-relay.island-fund-relay.workers.dev', 'https://island-fund-relay.island-fund-relay.workers.dev', 'https://gym-bot.island-fund-relay.workers.dev', 'https://its-bot.island-fund-relay.workers.dev', 'https://raw.githubusercontent.com/huangwaylon/fitness/kalori-status/status.json', 'https://tiles.openfreemap.org', 'https://basemap.nationalmap.gov', 'https://cyberjapandata.gsi.go.jp', 'blob:'],
          // the tent's models carry their textures inside (three.js decodes them from blob: URLs); a member's chain
          // menus show Kalori's pictures hotlinked (lib/food/images.ts kaloriImg); English Study's thumbnails are YouTube's own
          // stills, hotlinked (lib/english/components/Thumb.svelte; no referrer); 英語すごろく's 絵 are Google's Noto Emoji,
          // hotlinked from its CDN (lib/sugoroku/pictures.ts: that path only)
          'img-src': ['self', 'data:', 'blob:', 'https://assets.kalori.jp', 'https://i.ytimg.com', 'https://fonts.gstatic.com/s/e/notoemoji/'],
          // the hourly music plays from blob: URLs (lib/sound/engine.ts), and the first tap's silent unlock clip
          'media-src': ['self', 'blob:'],
          // English Study's clips: YouTube's privacy-enhanced embed (lib/english/player.svelte.ts, driven over
          // postMessage: no script of theirs on our page)
          'frame-src': ['https://www.youtube-nocookie.com'],
          'style-src': ['self', 'unsafe-inline'],
          // the tent's meshopt decoder is WebAssembly (compiled, never eval'd JavaScript)
          'script-src': ['self', 'wasm-unsafe-eval'],
          'object-src': ['none'],
          'base-uri': ['self'],
          'form-action': ['none']
        }
      }
    })
  ],
  // A chunk imports another by a stable key, the page's import map naming its file (scripts/headers.ts writes it into
  // index.html): a changed chunk is the only file a deploy changes, not every chunk that imports it, and theirs, by its
  // new name (a deploy's update fetched ~250 KB of chunks that differed only in the names they import; review 11/10 r2).
  // (the page's build and seat tables in its live hello: sync/live.ts APP_BUILD, SEATS_V)
  define: { __APP_BUILD__: JSON.stringify(VERSION), __SEATS_V__: JSON.stringify(SEATS_V) },
  environments: { client: { build: { chunkImportMap: true } } },
  worker: { format: 'es', plugins: () => [basisModule] },
  build: {
    // The two phones it's for: an iPhone 15 and an iPhone 16 (shipped with iOS 17 and 18), on Safari.
    target: ['safari17', 'ios17'],
    cssTarget: ['safari17', 'ios17'],
    // (no gzip of every chunk for the size table: ~1 s of each build, 5 a push; the load budget measures what matters)
    reportCompressedSize: false,
    // Fonts ship as separate files (fetched per unicode-range subset) instead of base64 in the blocking CSS.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined)
  },
  // (worker threads, not forked processes: the same isolation per file, a third to almost half less wall time at
  // CI's 4 vCPU, 2026-11-08)
  // (src/no-network.setup.ts: a real request fails the test.) (coverage: `npm run coverage`, scripts/coverage-floors.ts). A timeout catches a hang: 15 s, not vitest's 5, since the
  // CPU-bound tests (1.5-2.5 s alone: fields, museum visitors, terrain) passed 5 s on a loaded Mac (2026-11-13).
  test: { include: ['src/**/*.test.ts'], setupFiles: ['src/no-network.setup.ts'], pool: 'threads', testTimeout: 15_000, coverage: { include: ['src/**/*.ts'], reporter: ['json-summary', 'text-summary'] } }
});
