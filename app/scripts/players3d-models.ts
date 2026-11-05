// NH's human players in 3D (components/player3d; design/avatar/tech-notes.md, closet/feasibility.md): the parts the app
// assembles a player from at runtime, from the game files the user supplied:
//   static/room/player/body.glb              the body, once per page (skeleton, skin, legs, face patches, ears, noses)
//   static/room/player/face/<PlayerEyeNN|PlayerMouthNN>.webp   an eye type's 16 frames, a mouth's 9 (atlases)
//   static/room/player/face/cheek<0-2>.webp  the blush shapes
//   static/room/player/mesh/<key>.glb        each part's mesh alone (a hairstyle with its greyscale texture; a top's
//                                            shape, a shoe's, a glasses' frame…), bound to the body's joints by name
//   static/room/player/tex/<id>[.<material>].webp   each item's baked albedo (its colour; tints stay at runtime)
//   src/lib/components/player3d/parts.json   the part table: every id → its slot, mesh, textures, colour line, icon
// Under /room/: the service worker caches what a phone wears on first use, never at install.
//
// Which items: the first closet (STARTER below: every hairstyle, eye and mouth, and every colour of the lines the art
// scout curated, design/avatar/catalog.md), or --all (every item the closet sweep wore cleanly: ~19 MB). The sweep's
// exclusions are kept (customs designs, underwater variants, NPC aprons, placeholders; umbrellas aren't worn).
//
// Usage (from app/): NH_MODELS=~/Downloads/Model node scripts/players3d-models.ts [--all] [--map]
// The model folder is untrusted input and never part of the repo: only the named folders' .dae and .png files are
// copied into a scratch dir (three.js reads them in the page; nothing in them is run). Needs Google Chrome (Playwright's
// channel 'chrome'), cwebp; gltfpack from node_modules. --map refetches the community's item names (Norviah's
// animal-crossing data: the closet icons' names) into scripts/players3d-map.json.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'static', 'room', 'player');
const TABLE = join(APP, 'src', 'lib', 'components', 'player3d', 'parts.json');
const MAP = join(import.meta.dirname, 'players3d-map.json');
const ICONS = join(APP, 'static', 'art', 'finds', 'items');
const all = process.argv.includes('--all');

const MODELS = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~');
if (!MODELS || !existsSync(MODELS)) {
  console.error('Set NH_MODELS to the folder of NH model folders (<Model>.Nin_NX_NVN), e.g. NH_MODELS=~/Downloads/Model node scripts/players3d-models.ts');
  process.exit(1);
}
const ROOT: string = MODELS;
const F = (n: string) => `${n}.Nin_NX_NVN`;
const SAFE = /^[A-Za-z0-9_]+$/;
const NAMES = readdirSync(ROOT).filter((n) => n.endsWith('.Nin_NX_NVN')).map((n) => n.slice(0, -11)).filter((n) => SAFE.test(n)).sort();
const HAS = new Set(NAMES);

/** The first closet: every hairstyle, eye and mouth; of the clothes, every colour of these lines (catalog.md). */
const STARTER: Record<string, RegExp> = {
  top: /^TopsTex(TopOuterLAran|TopOuterLSweat|TopOuterLArancardigan|TopTshirtsLVnecksweater|TopYshirtsHPolo|TopYshirtsHStandard|TopTshirtsHPocketshirts|OnepieceAlineHLinen|OnepieceBoxLShirt|OnepieceBalloonHDolly)\d$/,
  bottom: /^BottomsTex(PantsNormalSlacks|PantsNormalChino|PantsNormalDenim|PantsNormalSweat|PantsWideChino|SkirtLongDenim|SkirtLongPleats|SkirtLongChino|SkirtAlineFlare)\d$/,
  shoes: /^Shoes(LowcutRubbertoe|HighcutRubbertoe|LowcutLeathersneker|LowcutSlipon|LowcutLoafers|LowcutSuede)\d$/,
  socks: /^SocksTex(Dailysocks|Line|Footcover)\d$/,
  glasses: /^AccessoryGlass(Circle|Oval|Thurmont|Octagon|Square|Round)\d$/,
  ornament: /^CapOrnament(LRibbon|TRibbon|LHearthairpin|LFlowerhairpin|LStarhairpin)\d$/
};
const SLOT_PREFIX: [string, string][] = [['top', 'TopsTex'], ['bottom', 'BottomsTex'], ['shoes', 'Shoes'], ['socks', 'SocksTex'], ['glasses', 'AccessoryGlass'], ['ornament', 'CapOrnament']];
/** The closet sweep's exclusions (design/avatar/closet/excluded.json), and its by-design odd glasses kept out of a
 *  first closet. */
const excluded = (id: string) => /mydesign|Preview|3ds|UnderWater|apron|Apron|Plt\d|Glassmouth/.test(id) || /^AccessoryGlass(Monocle|PilotDoc|MirrorGray)/.test(id);

// ---- the items and their meshes ----
const topsMeshes = NAMES.filter((n) => n.startsWith('PlayerTops') && !/mydesign|3ds|Preview/.test(n)).sort((a, b) => b.length - a.length);
const bottomsMeshes = NAMES.filter((n) => n.startsWith('PlayerBottoms')).sort((a, b) => b.length - a.length);
interface Item { id: string; slot: string; mesh: string | null; onepiece?: boolean }
const items: Item[] = [];
for (const id of NAMES) {
  const slot = SLOT_PREFIX.find(([, p]) => id.startsWith(p))?.[0];
  if (!slot || excluded(id) || (!all && !STARTER[slot].test(id))) continue;
  if (slot === 'glasses' && id.startsWith('AccessoryGlassmouth')) continue;
  let mesh: string | null = null;
  if (slot === 'top') mesh = topsMeshes.find((m) => id.slice(7).startsWith(m.slice(10))) ?? null;
  else if (slot === 'bottom') mesh = bottomsMeshes.find((m) => id.slice(10).startsWith(m.slice(13))) ?? null;
  else if (slot !== 'socks') mesh = id;
  if (slot !== 'socks' && !mesh) continue;
  items.push({ id, slot, mesh, ...(slot === 'top' ? { onepiece: /^PlayerTops(Onepiece|Marinesuit)/.test(mesh!) } : {}) });
}
const hairs = NAMES.filter((n) => /^PlayerHair\d+$/.test(n));
const caps = NAMES.filter((n) => /^PlayerHairCap\d+$/.test(n));
const eyes = NAMES.filter((n) => /^PlayerEye\d+$/.test(n));
const mouths = NAMES.filter((n) => /^PlayerMouth\d+$/.test(n));

// own-mesh items (shoes, glasses, ornaments): their colours share a geometry; one mesh per geometry
const geoOf = new Map<string, string>();
function geoHash(folder: string): string {
  const t = readFileSync(join(ROOT, F(folder), `${folder}.dae`), 'utf8');
  const g = /<library_geometries>([\s\S]*?)<\/library_geometries>/.exec(t)?.[1] ?? t;
  const h = createHash('sha256');
  for (const m of g.matchAll(/<float_array[^>]*>([^<]*)<\/float_array>/g)) h.update(m[1]);
  return h.digest('hex').slice(0, 12);
}
const meshKey = new Map<string, string>();     // item id → mesh key
for (const it of items) {
  if (!it.mesh) continue;
  if (it.slot === 'top' || it.slot === 'bottom') { meshKey.set(it.id, it.mesh); continue; }
  const h = geoHash(it.mesh);
  if (!geoOf.has(h)) geoOf.set(h, it.mesh);
  meshKey.set(it.id, geoOf.get(h)!);
}

// ---- the community's names (the closet's icons: static/art/finds/items/<slug>.webp) ----
async function buildMap(): Promise<Record<string, string>> {
  const DATA = 'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/';
  const out: Record<string, string> = {};
  for (const f of ['Tops.json', 'Bottoms.json', 'Dress-Up.json', 'Shoes.json', 'Socks.json', 'Accessories.json', 'Headwear.json']) {
    const list = (await (await fetch(DATA + encodeURIComponent(f))).json()) as { name: string; variations?: { filename?: string }[] }[];
    for (const c of list) for (const v of c.variations ?? []) if (v.filename) out[v.filename] = c.name;
  }
  return out;
}
const names: Record<string, string> = process.argv.includes('--map') || !existsSync(MAP) ? await buildMap() : JSON.parse(readFileSync(MAP, 'utf8'));
if (process.argv.includes('--map') || !existsSync(MAP)) writeFileSync(MAP, JSON.stringify(Object.fromEntries(Object.entries(names).sort()), null, 0).replace(/","/g, '",\n"') + '\n');
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const iconOf = (id: string) => {
  const n = names[id];
  return n && existsSync(join(ICONS, `${slug(n)}.webp`)) ? slug(n) : null;
};

// ---- the page ----
const scratch = mkdtempSync(join(tmpdir(), 'nh-players3d-'));
const work = mkdtempSync(join(tmpdir(), 'nh-players3d-out-'));
const files: Record<string, string[]> = {};
const copy = (folder: string) => {
  if (!SAFE.test(folder) || !HAS.has(folder)) throw new Error(`not in the dump: ${folder}`);
  const dst = join(scratch, F(folder));
  if (!existsSync(dst)) {
    mkdirSync(dst);
    const src = join(ROOT, F(folder));
    for (const n of readdirSync(src)) if (/^[A-Za-z0-9_]+(\.[0-9]+)?\.(dae|png)$/.test(n) && !/_Nrm/.test(n) && statSync(join(src, n)).isFile()) cpSync(join(src, n), join(dst, n));
  }
  files[F(folder)] = readdirSync(dst);
  return { [F(folder)]: files[F(folder)] };
};
const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
const PLAYER = join(APP, 'design', 'avatar', 'render', 'player.js');
const PAGE = join(import.meta.dirname, 'players3d-page.js');
const V3D = join(APP, 'src', 'lib', 'components', 'villager3d');
const MIME: Record<string, string> = { '.js': 'text/javascript', '.png': 'image/png', '.dae': 'model/vnd.collada+xml' };
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.route('http://p3d.local/**', (route) => {
  const u = decodeURIComponent(new URL(route.request().url()).pathname);
  const within = (root: string, rel: string) => {
    const f = resolve(root, rel);
    return f.startsWith(root + sep) ? f : null;
  };
  if (u === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/page.js"></script>' });
  const f = u === '/page.js' ? PAGE : u === '/player.js' ? PLAYER : u.startsWith('/three/') ? within(three, u.slice(7)) : u.startsWith('/v3d/') ? within(V3D, u.slice(5)) : u.startsWith('/src/') ? within(scratch, u.slice(5)) : null;
  if (!f || !existsSync(f)) return route.fulfill({ status: 404, body: '' });
  // (player.js's rig: the app's villager3d rig.ts, type-stripped)
  if (f.endsWith('.ts')) return route.fulfill({ contentType: 'text/javascript', body: stripTypeScriptTypes(readFileSync(f, 'utf8')) });
  return route.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' });
});
await page.goto('http://p3d.local/');
await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);
type W = Record<string, (...a: unknown[]) => Promise<unknown>>;
const call = <T>(fn: string, ...a: unknown[]) => page.evaluate(([fn, a]) => (window as unknown as W)[fn as string](...(a as unknown[])), [fn, a] as const) as Promise<T>;

// ---- writing ----
rmSync(OUT, { recursive: true, force: true });
for (const d of ['face', 'mesh', 'tex']) mkdirSync(join(OUT, d), { recursive: true });
const hash = (f: string) => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 8);
const kb = (f: string) => +(statSync(f).size / 1024).toFixed(1);
const webp = (dataUrl: string, out: string, q = 80) => {
  const png = join(work, 'i.png');
  writeFileSync(png, Buffer.from(dataUrl.split(',')[1], 'base64'));
  execFileSync('cwebp', ['-quiet', '-q', String(q), '-alpha_q', '90', '-m', '6', '-sharp_yuv', '-exact', png, '-o', out]);
  return { v: hash(out), kb: kb(out) };
};
const GLTFPACK = join(dirname(createRequire(import.meta.url).resolve('gltfpack/package.json')), 'cli.js');
/** The page's glTF → a GLB: images as WebP, gltfpack's quantisation and meshopt; joint and material names kept. */
function pack(r: { gltf: string }, out: string) {
  const g = JSON.parse(r.gltf);
  const dir = join(work, 'g');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir);
  g.buffers.forEach((b: { uri: string }, i: number) => { writeFileSync(join(dir, `b${i}.bin`), Buffer.from(b.uri.split(',')[1], 'base64')); b.uri = `b${i}.bin`; });
  (g.images ?? []).forEach((im: { uri: string; mimeType: string }, i: number) => {
    const png = join(dir, `i${i}.png`);
    writeFileSync(png, Buffer.from(im.uri.split(',')[1], 'base64'));
    execFileSync('cwebp', ['-quiet', '-q', '80', '-alpha_q', '90', '-m', '6', '-sharp_yuv', '-exact', png, '-o', join(dir, `i${i}.webp`)]);
    im.uri = `i${i}.webp`;
    im.mimeType = 'image/webp';
  });
  if (g.images?.length) {
    for (const t of g.textures ?? []) { t.extensions = { EXT_texture_webp: { source: t.source } }; delete t.source; }
    g.extensionsUsed = [...new Set([...(g.extensionsUsed ?? []), 'EXT_texture_webp'])];
    g.extensionsRequired = [...new Set([...(g.extensionsRequired ?? []), 'EXT_texture_webp'])];
  }
  writeFileSync(join(dir, 'm.gltf'), JSON.stringify(g));
  execFileSync('node', [GLTFPACK, '-i', join(dir, 'm.gltf'), '-o', out, '-cc', '-ce', 'ext', '-kn', '-km', '-ke'], { stdio: 'pipe' });
  return { v: hash(out), kb: kb(out) };
}

for (const f of ['PlayerBody', 'PlayerEye00', 'PlayerMouth00']) copy(f);
await call('init', files);
const table: Record<string, unknown> = { _: 'scripts/players3d-models.ts: the player parts (static/room/player/…: KB, content hash v), and per item its slot, mesh, textures (material → file), colour line, icon (static/art/finds/items/<icon>.webp)' };

// the body
const b = await call<{ gltf: string; tris: number }>('bodyGltf');
table.body = { ...pack(b, join(OUT, 'body.glb')), tris: b.tris };
const ch = await call<string[]>('cheeks');
table.cheek = ch.map((u, i) => webp(u, join(OUT, 'face', `cheek${i}.webp`)));
console.log(`body: ${(table.body as { kb: number }).kb} KB, ${b.tris} tris`);

// the faces
const face: Record<string, unknown> = {};
for (const [kind, list] of [['eye', eyes], ['mouth', mouths]] as const) {
  for (const id of list) face[id] = webp(await call<string>('faceAtlas', kind, id, copy(id)), join(OUT, 'face', `${id}.webp`), 82);
}
table.face = face;

// the meshes: hair (textured), the garments' shapes, the own-mesh items' geometries
const meshes: Record<string, unknown> = {};
const doMesh = async (folder: string, textured: boolean) => {
  if (meshes[folder]) return;
  const more = copy(folder);
  const dae = files[F(folder)].find((n) => n.endsWith('.dae'));
  if (!dae) throw new Error(`${folder}: no .dae`);
  const r = await call<{ gltf: string; tris: number; joints: number; mats: string[] }>('meshGltf', folder, dae, textured, more);
  meshes[folder] = { ...pack(r, join(OUT, 'mesh', `${folder}.glb`)), tris: r.tris, rigid: r.joints <= 1, mats: r.mats };
};
for (const h of [...hairs, ...caps]) await doMesh(h, true);
for (const k of new Set(meshKey.values())) await doMesh(k, false);
table.mesh = meshes;
const capOf = (h: string) => (HAS.has(h.replace('PlayerHair', 'PlayerHairCap')) ? h.replace('PlayerHair', 'PlayerHairCap') : null);
table.hair = Object.fromEntries(hairs.map((h) => [h, { mesh: h, cap: capOf(h) }]));

// the items' textures
const out: Record<string, unknown> = {};
let texKB = 0;
for (const it of items) {
  const more = { ...copy(it.id), ...(it.mesh ? copy(it.mesh) : {}) };
  const value = it.slot === 'top' ? { mesh: it.mesh, tex: it.id, onepiece: it.onepiece } : it.slot === 'bottom' ? { mesh: it.mesh, tex: it.id } : it.id;
  const slot = it.slot === 'ornament' ? 'hat' : it.slot;
  const mats = await call<Record<string, { png: string | null; cut: boolean; glass: boolean; opacity: number; color: string | null; tint: string | null }>>('itemTex', slot, value, more);
  const tex: Record<string, unknown> = {};
  for (const [m, t] of Object.entries(mats)) {
    const file = `${it.id}${Object.keys(mats).length > 1 ? `.${m}` : ''}.webp`;
    const w = t.png ? webp(t.png, join(OUT, 'tex', file)) : null;
    if (w) texKB += w.kb;
    tex[m] = { ...(w ? { file, ...w } : { color: t.color }), ...(t.cut ? { cut: true } : {}), ...(t.glass ? { glass: t.opacity } : {}), ...(t.tint ? { tint: t.tint } : {}) };
  }
  const line = it.id.replace(/\d+$/, '');
  out[it.id] = { slot: it.slot, ...(it.mesh ? { mesh: meshKey.get(it.id) } : {}), ...(it.onepiece ? { onepiece: true } : {}), tex, line, icon: iconOf(it.id) };
}
table.items = out;
await browser.close();

const sorted = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
for (const k of ['face', 'mesh', 'hair', 'items'] as const) table[k] = sorted(table[k] as Record<string, unknown>);
mkdirSync(dirname(TABLE), { recursive: true });
// (one entry a line: a diff shows what changed)
const block = (v: unknown) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 3
  ? `{\n${Object.entries(v).map(([k, x]) => `  ${JSON.stringify(k)}: ${JSON.stringify(x)}`).join(',\n')}\n }` : JSON.stringify(v);
writeFileSync(TABLE, `{\n${Object.entries(table).map(([k, v]) => ` ${JSON.stringify(k)}: ${block(v)}`).join(',\n')}\n}\n`);
// every part id the app knows (contract/look.ts usePartTable: store/look.ts), small enough for the main bundle
const ids = [...hairs, ...eyes, ...mouths, ...items.map((it) => it.id)].sort();
writeFileSync(join(APP, 'src', 'lib', 'contract', 'partIds.json'), `[\n${ids.map((i) => JSON.stringify(i)).join(',\n')}\n]\n`);
const meshKB = Object.values(meshes).reduce((t: number, m) => t + (m as { kb: number }).kb, 0);
console.log(`${items.length} items, ${hairs.length} hairstyles (+${caps.length} caps), ${eyes.length} eyes, ${mouths.length} mouths; meshes ${Object.keys(meshes).length} (${(meshKB / 1024).toFixed(2)} MB), item textures ${(texKB / 1024).toFixed(2)} MB`);
rmSync(scratch, { recursive: true, force: true });
rmSync(work, { recursive: true, force: true });
