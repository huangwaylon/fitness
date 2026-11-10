// The villagers in 3D (src/lib/components/villager3d): every villager the picker offers whose NH
// model is in the game files the user supplied, as a skinned GLB (its 46-joint skeleton and skin, posed at runtime:
// NH's files have no animation clips), wearing its default top, its 16 eyes and 9 mouths as two atlases
// (scripts/villagers3d-page.js), packed as the island's models are (WebP textures, gltfpack's quantisation and meshopt)
// into static/room/villagers3d/<roster id>.glb (under /room/: the service worker caches it on first use, never at
// install; a phone only ever loads the two or three villagers on its island), plus src/lib/components/villager3d/
// villagers.json (each one's bytes, triangles, height and content hash; and who has no model, and why).
//
// Which model is whose (scripts/villagers3d-map.json, committed): the community's data (Norviah/animal-crossing, the
// ACNH data spreadsheet's export: each villager's internal file name and default clothing, the clothing's texture file)
// matched to the roster by English name: `npm run villagers3d -- --map` refetches it.
//
// Usage (from app/): NH_MODELS=~/Downloads/Model npm run villagers3d [-- --only=goldie,anchovy] [--map]
// The model folder is untrusted input and never part of the repo: only the named folders' .dae and .png files are
// copied into a scratch dir (three.js reads them in the page; nothing in them is run). Needs Google Chrome (Playwright's
// channel 'chrome') and cwebp.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { createRequire, registerHooks } from 'node:module';
import { createHash } from 'node:crypto';

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'static', 'room', 'villagers3d');
const MANIFEST = join(APP, 'src', 'lib', 'components', 'villager3d', 'villagers.json');
const MAP = join(import.meta.dirname, 'villagers3d-map.json');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = (arg('only') ?? '').split(',').filter(Boolean);
/** Triangles over this are simplified (gltfpack -si): NH's villagers are 3–5 k with their top. */
const TRIS = 5000;
/** Longest side of the body's and the top's textures (px), and the face atlases' cells [cols, w, h]. */
const MAX_TEX = 256;
const EYE: [number, number, number] = [4, 96, 48];
const MOUTH: [number, number, number] = [3, 96, 48];
/** A villager's GLB at most (KB: villager3d.test.ts holds it): over it, it's converted again smaller (its textures at
 *  SMALLER px, fewer triangles). */
const BUDGET_KB = 100;
const SMALLER = { maxTex: 192, tris: 4000 };
/** …and smaller again (a special character with its three swapped faces: Saharah). */
const SMALLEST = { maxTex: 128, tris: 3000 };

/** roster id → [body folder, top's mesh folder or null, top's texture folder or null, why it has no model]. */
type MapRow = [body: string | null, tops: string | null, tex: string | null, note?: string];

const MODELS = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~');
if (!MODELS || !existsSync(MODELS)) {
  console.error('Set NH_MODELS to the folder of NH model folders (<Model>.Nin_NX_NVN), e.g. NH_MODELS=~/Downloads/Model npm run villagers3d');
  process.exit(1);
}
const ROOT: string = MODELS;
const F = (n: string) => `${n}.Nin_NX_NVN`;
const SAFE = /^[A-Za-z0-9_]+$/;
const has = (folder: string | null): folder is string => !!folder && SAFE.test(folder) && existsSync(join(ROOT, F(folder)));

// ---- the map: roster → NH's files ----
/** The special characters' NH codes (the community's NPC icons: NpcSp<Code>); Brewster, Kapp'n and Wilbur aren't in
 *  the files. Their clothes are part of their bodies but for Tom Nook's and Isabelle's (their own tops). */
const SPECIAL: Record<string, [string, string?, string?]> = {
  'tom-nook': ['Rco', 'NpcSpTopsRcoYshirtsH', 'TopsTexTopYshirtsHAloha0'], isabelle: ['Sza', 'NpcSpTopsSzaYshirtsH', null as unknown as string],
  'kk-slider': ['Tkk'], blathers: ['Owl'], celeste: ['Ows'], mabel: ['Hgh'], sable: ['Hgs'], label: ['Hgc'], kicks: ['Skk'],
  brewster: ['Pge'], harvey: ['Spn'], 'daisy-mae': ['Boc'], redd: ['Fox', 'NpcSpTopsFoxOuterL'], flick: ['Chy'], cj: ['Bey'], saharah: ['Cml'],
  leif: ['Slo'], gulliver: ['Gul'], kappn: ['Kpp'], wisp: ['GstA'], pascal: ['Seo'], orville: ['Dod'], wilbur: ['Doc']
};
/** The characters that aren't in the picker's roster (island/visitors.ts: the holiday hosts, Jack, the wedding's pair;
 *  the shop's twins), their NH codes (and, for one whose clothes aren't part of its body, its top's mesh and texture):
 *  converted as the special characters are (face at rest), into the same folder and manifest. Tommy is Timmy's model
 *  (NH ships one for the two). */
const VISITOR_ONLY: Record<string, string | [code: string, tops: string, tex: string]> = {
  franklin: 'Tuk', jack: 'Pkn', jingle: 'Rei', zipper: 'Pyn', reese: 'Alw', cyrus: 'Alp',
  timmy: ['Rcm', 'NpcSpTopsRcmYshirtsapronH', 'TopsTexTopYshirtsapronHRcm00']
};
async function buildMap(): Promise<Record<string, MapRow>> {
  registerHooks({
    resolve: (spec, ctx, next) => (spec === '$app/paths' ? { url: 'data:text/javascript,export const asset = (p) => p;', shortCircuit: true } : next(spec, ctx)),
    load: (url, ctx, next) => (url.endsWith('.json') ? next(url, { ...ctx, importAttributes: { type: 'json' } }) : next(url, ctx))
  });
  const { ROSTER, ROSTER_IDS } = await import('../src/lib/villagers/roster.ts');
  const DATA = 'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/';
  const get = async (f: string) => (await (await fetch(DATA + encodeURIComponent(f))).json()) as unknown[];
  type V = { name: string; filename: string; defaultClothing: string; defaultClothingInternalId: number; gender: string };
  type C = { name: string; internalId?: number; filename?: string; variations?: { internalId: number; filename: string }[] };
  const villagers = (await get('Villagers.json')) as V[];
  const clothes = [...((await get('Tops.json')) as C[]), ...((await get('Dress-Up.json')) as C[])];
  const byId = new Map<number, string>(), byName = new Map<string, string>();
  for (const c of clothes) {
    // (a top with one look has no variations: its id and file are the row's own, as the Sanrio tees')
    const vs = c.variations ?? (c.filename && c.internalId !== undefined ? [{ internalId: c.internalId, filename: c.filename }] : []);
    for (const v of vs) byId.set(v.internalId, v.filename);
    if (vs[0]) byName.set(c.name.toLowerCase(), vs[0].filename);
  }
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  const out: Record<string, MapRow> = {};
  for (const id of ROSTER_IDS) {
    const r = ROSTER[id];
    if (r.special) {
      const s = SPECIAL[id];
      const body = s ? `NpcSp${s[0]}` : null;
      out[id] = has(body) ? [body, has(s[1] ?? null) ? s[1]! : null, has(s[2] ?? null) ? s[2]! : null] : [null, null, null, 'not in the game files'];
      continue;
    }
    const v = villagers.find((x) => norm(x.name) === norm(r.nameEn));
    if (!v) {
      out[id] = [null, null, null, 'not in the community data (2.0)'];
      continue;
    }
    const body = `NpcNml${v.filename[0].toUpperCase()}${v.filename.slice(1)}`;
    if (!has(body)) {
      out[id] = [null, null, null, 'not in the game files (2.0)'];
      continue;
    }
    // the default top: by its variation's id, else by its name (a villager's own variation has another id)
    const tex = byId.get(v.defaultClothingInternalId) ?? byName.get(v.defaultClothing.toLowerCase()) ?? null;
    const sp = body.slice(6, 9);
    // the top's mesh: NH's villagers wear every top as a tee or a dress, by its sleeves (H half, L long, N none);
    // the kangaroos' come female (a joey in the pouch) and male
    const k = tex ? /^TopsTex(Top|Onepiece|Marinesuit)[A-Z][a-z]+([HLN])/.exec(tex) : null;
    const kind = k ? (k[1] === 'Top' ? 'Tshirts' : 'Onepiece') : 'Tshirts';
    const tops = `NpcNmlTops${sp}${kind}${k?.[2] ?? 'H'}${sp === 'Kgr' ? (r.gender === 'f' ? 'F' : 'M') : ''}`;
    out[id] = [body, has(tops) ? tops : null, has(tex) ? tex : null, ...(has(tex) ? [] : [`its top's texture (${v.defaultClothing}) isn't in the files: plain`])] as MapRow;
  }
  return out;
}

const map: Record<string, MapRow> = process.argv.includes('--map') || !existsSync(MAP) ? await buildMap() : JSON.parse(readFileSync(MAP, 'utf8'));
if (process.argv.includes('--map') || !existsSync(MAP)) {
  writeFileSync(MAP, `{\n${Object.entries(map).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n}\n`);
  console.log(`map: ${Object.values(map).filter((r) => r[0]).length} of ${Object.keys(map).length} have a model`);
}

for (const [id, v] of Object.entries(VISITOR_ONLY)) {
  const [c, tops, tex] = typeof v === 'string' ? [v, null, null] : v;
  map[id] = has(`NpcSp${c}`) ? [`NpcSp${c}`, has(tops) ? tops : null, has(tex) ? tex : null] : [null, null, null, 'not in the game files'];
}
const todo = Object.entries(map).filter(([id, r]) => r[0] && (!only.length || only.includes(id)));
const scratch = mkdtempSync(join(tmpdir(), 'nh-villagers3d-'));
const work = mkdtempSync(join(tmpdir(), 'nh-villagers3d-out-'));
const copy = (folder: string) => {
  const dst = join(scratch, F(folder));
  if (existsSync(dst)) return;
  mkdirSync(dst);
  const src = join(ROOT, F(folder));
  for (const n of readdirSync(src)) if (/^[A-Za-z0-9_]+(\.[0-9]+)?\.(dae|png)$/.test(n) && !/_Nrm/.test(n) && statSync(join(src, n)).isFile()) cpSync(join(src, n), join(dst, n));
};
mkdirSync(OUT, { recursive: true });
mkdirSync(dirname(MANIFEST), { recursive: true });

const webp = (png: string, out: string, q: number) => execFileSync('cwebp', ['-quiet', '-q', String(q), '-alpha_q', '90', '-m', '6', '-sharp_yuv', png, '-o', out]);
const GLTFPACK = join(dirname(createRequire(import.meta.url).resolve('gltfpack/package.json')), 'cli.js');
const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
const PAGE = join(import.meta.dirname, 'villagers3d-page.js');
const MIME: Record<string, string> = { '.js': 'text/javascript', '.png': 'image/png', '.dae': 'model/vnd.collada+xml' };

const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.route('http://v3d.local/**', (route) => {
  const u = decodeURIComponent(new URL(route.request().url()).pathname);
  const within = (root: string, rel: string) => {
    const f = resolve(root, rel);
    return f.startsWith(root + sep) ? f : null;
  };
  const f = u === '/page.js' ? PAGE : u.startsWith('/three/') ? within(three, u.slice(7)) : u.startsWith('/src/') ? within(scratch, u.slice(5)) : null;
  if (u === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/page.js"></script>' });
  if (!f || !existsSync(f)) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' });
});
await page.goto('http://v3d.local/');
await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);

interface Entry { kb: number; tris: number; h: number; v: string }
interface Manifest { villagers: Record<string, Entry>; none: Record<string, string> }
const man: Manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { villagers: {}, none: {} };
/** The page's glTF → a GLB at `out`: its images as WebP, packed by gltfpack (quantised, meshopt; simplified to maxTris). */
function pack(id: string, r: { gltf: string; tris: number }, maxTris: number, out: string) {
  const g = JSON.parse(r.gltf) as { buffers: { uri: string }[]; images?: { uri?: string; mimeType?: string }[]; textures?: { source?: number; extensions?: object }[]; extensionsUsed?: string[]; extensionsRequired?: string[] };
  const dir = join(work, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  g.buffers.forEach((b, i) => {
    writeFileSync(join(dir, `b${i}.bin`), Buffer.from(b.uri.split(',')[1], 'base64'));
    b.uri = `b${i}.bin`;
  });
  (g.images ?? []).forEach((im, i) => {
    const png = join(dir, `i${i}.png`);
    writeFileSync(png, Buffer.from(im.uri!.split(',')[1], 'base64'));
    webp(png, join(dir, `i${i}.webp`), 80);
    im.uri = `i${i}.webp`;
    im.mimeType = 'image/webp';
  });
  if (g.images?.length) {
    for (const t of g.textures ?? []) {
      t.extensions = { EXT_texture_webp: { source: t.source } };
      delete t.source;
    }
    g.extensionsUsed = [...new Set([...(g.extensionsUsed ?? []), 'EXT_texture_webp'])];
    g.extensionsRequired = [...new Set([...(g.extensionsRequired ?? []), 'EXT_texture_webp'])];
  }
  writeFileSync(join(dir, 'm.gltf'), JSON.stringify(g));
  const si = r.tris > maxTris ? ['-si', (maxTris / r.tris).toFixed(3)] : [];
  // -kn: the joints keep their names (villager3d/ poses them by name); -km -ke: the face's materials, and their extras
  execFileSync('node', [GLTFPACK, '-i', join(dir, 'm.gltf'), '-o', out, '-cc', '-ce', 'ext', '-kn', '-km', '-ke', ...si]);
}

let total = 0;
const failed: string[] = [];
type R = { gltf: string; box: [number[], number[]]; tris: number; joints: number; uv: Record<string, number[]>; want: Record<string, boolean> };
/** The GLB's materials that have no base colour though their source had one (the page's `want`): none, or it fails. */
function untextured(glb: string, want: Record<string, boolean>): string[] {
  const b = readFileSync(glb);
  const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8')) as { materials?: { name?: string; pbrMetallicRoughness?: { baseColorTexture?: object } }[] };
  const mats = j.materials ?? [];
  return Object.entries(want).filter(([n, w]) => w && !mats.some((m) => m.name === n && m.pbrMetallicRoughness?.baseColorTexture)).map(([n]) => n)
    .concat(mats.filter((m) => want[m.name ?? ''] && !m.pbrMetallicRoughness?.baseColorTexture).map((m) => m.name!));
}
for (const [id, [body, tops, tex]] of todo) {
  const folders = [body!, tops, tex].filter((f): f is string => !!f);
  for (const f of folders) copy(f);
  const files = Object.fromEntries(folders.map((f) => [F(f), readdirSync(join(scratch, F(f)))]));
  const out = join(OUT, `${id}.glb`);
  let r: R | null = null, tris = TRIS;
  try {
    // over budget, once more smaller
    for (const size of [{ maxTex: MAX_TEX, tris: TRIS }, SMALLER, SMALLEST]) {
      r = await page.evaluate((o) => (window as unknown as { convertVillager: (o: unknown) => Promise<R> }).convertVillager(o), {
        body: [F(body!), body], tops: tops ? [F(tops), tops] : null, topsTex: tex ? F(tex) : null, files, maxTex: size.maxTex, eye: EYE, mouth: MOUTH,
        // a special character's face at rest only (its three whole faces would be over budget): a villager's every one
        swaps: !SPECIAL[id] && !VISITOR_ONLY[id]
      });
      tris = size.tris;
      pack(id, r, size.tris, out);
      const lost = [...new Set(untextured(out, r.want))];
      if (lost.length) throw new Error(`untextured though the source has an albedo: ${lost.join(', ')}`);
      if (statSync(out).size / 1024 <= BUDGET_KB) break;
      console.log(`${id}: ${(statSync(out).size / 1024).toFixed(1)} KB, over budget: again, smaller`);
    }
  } catch (e) {
    failed.push(`${id}: ${(e as Error).message.split('\n')[0]}`);
    console.error(`${id}: FAILED ${(e as Error).message.split('\n')[0]}`);
    continue;
  }
  if (!r) continue;
  const bytes = statSync(out).size;
  total += bytes;
  const v = createHash('sha256').update(readFileSync(out)).digest('hex').slice(0, 8);
  man.villagers[id] = { kb: +(bytes / 1024).toFixed(1), tris: Math.min(r.tris, tris), h: +(r.box[1][1] - r.box[0][1]).toFixed(2), v };
  console.log(`${id}: ${(bytes / 1024).toFixed(1)} KB, ${r.tris} tris, ${r.joints} joints, h ${(r.box[1][1] - r.box[0][1]).toFixed(1)}`);
}
await browser.close();
if (!only.length) {
  for (const k of Object.keys(man.villagers)) if (!map[k]?.[0]) delete man.villagers[k];
}
man.none = Object.fromEntries(Object.entries(map).filter(([, r]) => !r[0]).map(([k, r]) => [k, r[3] ?? 'no model']));
for (const f of failed) man.none[f.split(':')[0]] = `failed to convert: ${f.split(': ').slice(1).join(': ')}`;
for (const f of failed) delete man.villagers[f.split(':')[0]];
const sorted = (o: Record<string, unknown>) => Object.entries(o).sort(([a], [b]) => a.localeCompare(b));
writeFileSync(MANIFEST, `{\n  "_": "scripts/villagers3d-models.ts: each villager's GLB (static/room/villagers3d/<id>.glb: KB, triangles, height in model units, content hash), and who has none",\n  "villagers": {\n${sorted(man.villagers).map(([k, m]) => `    ${JSON.stringify(k)}: ${JSON.stringify(m)}`).join(',\n')}\n  },\n  "none": {\n${sorted(man.none).map(([k, m]) => `    ${JSON.stringify(k)}: ${JSON.stringify(m)}`).join(',\n')}\n  }\n}\n`);
console.log(`${todo.length - failed.length} villagers, ${(total / 1024 / 1024).toFixed(2)} MB${failed.length ? `; ${failed.length} failed` : ''}`);
rmSync(scratch, { recursive: true, force: true });
rmSync(work, { recursive: true, force: true });
