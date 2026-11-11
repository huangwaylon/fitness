// NH's human players in 3D (components/player3d; docs/players.md "Assets"): the parts the app
// assembles a player from at runtime, from the game files the user supplied, loose into the work folder (.cache/player/,
// gitignored), then packed into static/room/player/ (scripts/player-packs.ts, run at the end):
//   body.glb              the body, once per page (skeleton, skin, legs, face patches, ears, noses)
//   face/<PlayerEyeNN|PlayerMouthNN>.webp   an eye type's 16 frames, a mouth's 9 (atlases)
//   face/cheek<0-2>.webp  the blush shapes
//   mesh/<key>.glb        each part's mesh alone (a hairstyle with its greyscale texture; a top's shape, a shoe's, a
//                         glasses' frame…), bound to the body's joints by name
//   tex/<id>[.<material>].webp   each item's baked albedo (its colour; tints stay at runtime)
//   src/lib/components/look/swatches.json   the bundled items' swatches alone (the 2D stand-in figure)
//   src/lib/components/player3d/parts.json   the part table: every id → its slot, mesh, textures, colour line, icon,
//                                            swatch (the closet's dot); each icon's colour (the closet tints it)
// Under /room/: the service worker caches what a phone wears on first use, never at install. Then npm run world3d-ktx2
// (the KTX2s of what's new: it packs them in).
//
// Which items: the first closet (STARTER below: every hairstyle, eye and mouth, and every colour of the lines the art
// scout curated), or --all (every item the closet sweep wore cleanly: ~19 MB). The sweep's
// exclusions are kept (customs designs, underwater variants, NPC aprons, placeholders; umbrellas aren't worn).
//
// Usage (from app/): NH_MODELS=~/Downloads/Model node scripts/players3d-models.ts [--all] [--map]
// The model folder is untrusted input and never part of the repo: only the named folders' .dae and .png files are
// copied into a scratch dir (three.js reads them in the page; nothing in them is run). Needs Google Chrome (Playwright's
// channel 'chrome'), cwebp and dwebp; gltfpack from node_modules. --map refetches the community's item names (Norviah's
// animal-crossing data: the closet icons' names) into scripts/players3d-map.json.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
import { WORK, packPlayer, writeTable } from './player-packs.ts';

const APP = join(import.meta.dirname, '..');
const OUT = WORK;
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

/** The first closet: every hairstyle, eye and mouth; of the clothes, every colour of these lines. */
const STARTER: Record<string, RegExp> = {
  top: /^TopsTex(TopOuterLAran|TopOuterLSweat|TopOuterLArancardigan|TopTshirtsLVnecksweater|TopYshirtsHPolo|TopYshirtsHStandard|TopTshirtsHPocketshirts|OnepieceAlineHLinen|OnepieceBoxLShirt|OnepieceBalloonHDolly)\d$/,
  bottom: /^BottomsTex(PantsNormalSlacks|PantsNormalChino|PantsNormalDenim|PantsNormalSweat|PantsWideChino|SkirtLongDenim|SkirtLongPleats|SkirtLongChino|SkirtAlineFlare)\d$/,
  shoes: /^Shoes(LowcutRubbertoe|HighcutRubbertoe|LowcutLeathersneker|LowcutSlipon|LowcutLoafers|LowcutSuede)\d$/,
  socks: /^SocksTex(Dailysocks|Line|Footcover)\d$/,
  glasses: /^AccessoryGlass(Circle|Oval|Thurmont|Octagon|Square|Round)\d$/,
  ornament: /^CapOrnament(LRibbon|TRibbon|LHearthairpin|LFlowerhairpin|LStarhairpin)\d$/,
  hat: /^CapHat(Beret|Knitcap|Baseball|Strawhat)\d$/
};
const SLOT_PREFIX: [string, string][] = [['top', 'TopsTex'], ['bottom', 'BottomsTex'], ['shoes', 'Shoes'], ['socks', 'SocksTex'], ['glasses', 'AccessoryGlass'], ['ornament', 'CapOrnament'], ['hat', 'CapHat']];
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
  // (-vtf: the uvs stay floats: the runtime puts the closet's textures on these meshes, and a quantised uv's scale
  // rides on the texture it came with, which a part's GLB hasn't)
  execFileSync('node', [GLTFPACK, '-i', join(dir, 'm.gltf'), '-o', out, '-cc', '-ce', 'ext', '-kn', '-km', '-ke', '-vtf'], { stdio: 'pipe' });
  return { v: hash(out), kb: kb(out) };
}

for (const f of ['PlayerBody', 'PlayerEye00', 'PlayerMouth00']) copy(f);
await call('init', files);
const table: Record<string, unknown> = { _: 'scripts/players3d-models.ts: the player parts (packed in static/room/player/: KB, content hash v, place at [pack, offset, bytes] and a KTX2\'s k, scripts/player-packs.ts), and per item its slot, mesh, textures (material → file), colour line, icon (static/art/finds/items/<icon>.webp), swatch sw (its own colour); icons: each catalogue icon\'s own colour' };

// the body
const b = await call<{ gltf: string; tris: number }>('bodyGltf');
table.body = { ...pack(b, join(OUT, 'body.glb')), tris: b.tris };
const ch = await call<string[]>('cheeks');
table.cheek = ch.map((u, i) => webp(u, join(OUT, 'face', `cheek${i}.webp`)));
console.log(`body: ${(table.body as { kb: number }).kb} KB, ${b.tris} tris`);

// the faces
const face: Record<string, unknown> = {};
for (const [kind, list] of [['eye', eyes], ['mouth', mouths]] as const) {
  for (const id of list) {
    face[id] = webp(await call<string>('faceAtlas', kind, id, copy(id)), join(OUT, 'face', `${id}.webp`), 82);
    // (an eye's iris mask: the eye colour's tint)
    if (kind === 'eye') (face[id] as Record<string, unknown>).iris = webp(await call<string>('irisAtlas', id, copy(id)), join(OUT, 'face', `${id}.iris.webp`), 80);
  }
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
// each hairstyle's top and left side, measured (hair ornaments sit there)
const spots: Record<string, unknown> = {};
for (const h of hairs) spots[h] = await call('hairSpots', h, copy(h));
table.hair = Object.fromEntries(hairs.map((h) => [h, { mesh: h, cap: capOf(h), spot: spots[h] }]));

// the items' textures
const out: Record<string, unknown> = {};
let texKB = 0;
for (const it of items) {
  const more = { ...copy(it.id), ...(it.mesh ? copy(it.mesh) : {}) };
  const value = it.slot === 'top' ? { mesh: it.mesh, tex: it.id, onepiece: it.onepiece } : it.slot === 'bottom' ? { mesh: it.mesh, tex: it.id } : it.id;
  // (player.js wears an ornament, as a hat, in its hat slot: on the crown)
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

// ---- the closet's colours (its dots, its colour filter): per item its texture's dominant colour, only the pixels its
// own among its line's colours (a loafer's black sole, a shirt's buttons are every colour's), lifted as the island's
// light lifts an albedo (gamma 0.85); per catalogue icon its own (the closet tints a line's icon to a colour). The
// dominant: the opaque pixels binned at 4 bits a channel, the fullest bin's mean (a knit's cables don't drag it grey).
function pixels(file: string, from = 0): Uint8Array {
  const pam = execFileSync('dwebp', ['-quiet', '-pam', file, '-o', '-'], { maxBuffer: 1 << 26 });
  const end = pam.indexOf('ENDHDR\n');
  const w = Number(/WIDTH (\d+)/.exec(pam.toString('latin1', 0, end))?.[1]), h = Number(/HEIGHT (\d+)/.exec(pam.toString('latin1', 0, end))?.[1]);
  if (end < 0 || !w || !h) throw new Error(`${file}: not a PAM`);
  return new Uint8Array(pam.buffer, pam.byteOffset + end + 7 + Math.floor(h * from) * w * 4);
}
/** Where a slot's colour is, as rows from a fraction down: a sock's top is its darker cuff. */
const FROM: Record<string, number> = { socks: 0.45 };
const hexOf = (r: number, g: number, b: number) => '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
function dominant(px: Uint8Array, keep?: Uint8Array, lift = 1): string {
  const bins = new Map<number, [number, number, number, number]>();
  for (let i = 0; i + 3 < px.length; i += 4) {
    if (px[i + 3] < 128 || (keep && !keep[i >> 2])) continue;
    const k = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
    const b = bins.get(k) ?? [0, 0, 0, 0];
    b[0] += px[i]; b[1] += px[i + 1]; b[2] += px[i + 2]; b[3]++;
    bins.set(k, b);
  }
  let best: [number, number, number, number] | null = null;
  for (const b of bins.values()) if (!best || b[3] > best[3]) best = b;
  if (!best) return '#808080';
  const up = (c: number) => 255 * (c / best![3] / 255) ** lift;
  return hexOf(up(best[0]), up(best[1]), up(best[2]));
}
/** A colour's own pixels: not the same (within 24 a channel) in 40% or more of its line's others; null: one colour, or
 *  under 2% left. */
function own(all: Uint8Array[], v: number): Uint8Array | null {
  if (all.length < 2 || all.some((p) => p.length !== all[0].length)) return null;
  const n = all[0].length >> 2, keep = new Uint8Array(n), me = all[v], need = (all.length - 1) * 0.4;
  let count = 0;
  for (let j = 0, i = 0; j < n; j++, i += 4) {
    let same = 0;
    for (const p of all) if (p !== me && Math.abs(p[i] - me[i]) <= 24 && Math.abs(p[i + 1] - me[i + 1]) <= 24 && Math.abs(p[i + 2] - me[i + 2]) <= 24) same++;
    if (same < need) { keep[j] = 1; count++; }
  }
  return count > n * 0.02 ? keep : null;
}
type OutItem = { slot: string; mesh?: string; line: string; icon: string | null; tex: Record<string, { file?: string; glass?: number }>; sw?: string };
const lines = new Map<string, [string, Uint8Array][]>();
const icons: Record<string, string> = {};
for (const [id, it] of Object.entries(out as Record<string, OutItem>)) {
  const t = Object.values(it.tex).find((x) => x.file && x.glass === undefined) ?? Object.values(it.tex).find((x) => x.file);
  if (t?.file) lines.set(it.line, [...(lines.get(it.line) ?? []), [id, pixels(join(OUT, 'tex', t.file), FROM[it.slot])]]);
  if (it.icon && !(it.icon in icons)) icons[it.icon] = dominant(pixels(join(ICONS, `${it.icon}.webp`)));
}
for (const line of lines.values()) {
  const all = line.map(([, px]) => px);
  line.forEach(([id, px], v) => ((out as Record<string, OutItem>)[id].sw = dominant(px, own(all, v) ?? undefined, 0.85)));
}
table.icons = Object.fromEntries(Object.entries(icons).sort(([a], [b]) => a.localeCompare(b)));

const sorted = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
for (const k of ['face', 'mesh', 'hair', 'items'] as const) table[k] = sorted(table[k] as Record<string, unknown>);
mkdirSync(dirname(TABLE), { recursive: true });
const write = writeTable;
// the whole table, fetched when a player is drawn (static/room/player/parts.json: lazy, as the parts); the app's bundle
// carries the first closet's (components/player3d/parts.json: what the closet lists now), and the whole one's hash
// (both with each file's place once packed: player-packs.ts)
const FULL = join(OUT, 'parts.json');
write(FULL, table);
const fullV = hash(FULL);
const itemsAll = table.items as Record<string, OutItem & { mesh?: string }>;
const starter = Object.fromEntries(Object.entries(itemsAll).filter(([id, it]) => STARTER[it.slot === 'ornament' ? 'ornament' : it.slot]?.test(id)));
const keepMesh = new Set([...hairs, ...caps, ...Object.values(starter).flatMap((it) => (it.mesh ? [it.mesh] : []))]);
const keepIcon = new Set(Object.values(starter).flatMap((it) => (it.icon ? [it.icon] : [])));
write(TABLE, {
  ...table,
  _: `${table._}. The first closet's: the whole table is static/room/player/parts.json (full)`,
  full: { v: fullV, items: Object.keys(itemsAll).length },
  mesh: Object.fromEntries(Object.entries(table.mesh as Record<string, unknown>).filter(([k]) => keepMesh.has(k))),
  items: starter,
  icons: Object.fromEntries(Object.entries(table.icons as Record<string, string>).filter(([k]) => keepIcon.has(k)))
});
// each bundled item's swatch alone (look/swatch.ts: the 2D stand-in figure in the first load, without the table)
const swatches = Object.entries(starter).flatMap(([id, it]) => ((it as { sw?: string }).sw ? [[id, (it as { sw?: string }).sw!]] : []));
writeFileSync(join(APP, 'src', 'lib', 'components', 'look', 'swatches.json'), `{\n "_": "scripts/players3d-models.ts: each bundled item’s swatch (components/player3d/parts.json sw), for the 2D stand-in figure (look/swatch.ts) without the part table",\n "sw": {\n${swatches.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n }\n}\n`);
// every part id the app knows (contract/look.ts usePartTable: store/look.ts), compact for the main bundle: an id that
// ends in a digit by its line (the id less its digit: its digits), the rest as they are
const ids = [...hairs, ...eyes, ...mouths, ...items.map((it) => it.id)].sort();
const lineIds: Record<string, string> = {};
const exact: string[] = [];
for (const id of ids) {
  const m = /^(.*\D)(\d)$/.exec(id);
  if (m && !/^Player/.test(id)) lineIds[m[1]] = (lineIds[m[1]] ?? '') + m[2];
  else exact.push(id);
}
writeFileSync(join(APP, 'src', 'lib', 'contract', 'partIds.json'), `{\n "exact": ${JSON.stringify(exact)},\n "lines": {\n${Object.entries(lineIds).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n }\n}\n`);
const meshKB = Object.values(meshes).reduce((t: number, m) => t + (m as { kb: number }).kb, 0);
console.log(`${items.length} items, ${hairs.length} hairstyles (+${caps.length} caps), ${eyes.length} eyes, ${mouths.length} mouths; meshes ${Object.keys(meshes).length} (${(meshKB / 1024).toFixed(2)} MB), item textures ${(texKB / 1024).toFixed(2)} MB`);
rmSync(scratch, { recursive: true, force: true });
rmSync(work, { recursive: true, force: true });
const packed = packPlayer({ from: OUT });
console.log(`${packed.packs} packs, ${(packed.bytes / 1e6).toFixed(2)} MB (${packed.written} written, ${packed.removed} removed): npm run world3d-ktx2 next`);
