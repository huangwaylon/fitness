// Player-avatar render harness (design exploration, not part of the app's build). Assembles an NH player from the
// game-file dump (PlayerBody + hair + eyes/mouth textures + top/bottom/shoes/socks/glasses, page.js) in headless
// Chrome via three.js's ColladaLoader, as scripts/villagers3d-models.ts does for villagers, and writes PNG renders.
//
// Usage (from app/):
//   NH_MODELS=~/Downloads/Model node design/avatar/render/render.ts design/avatar/render/outfits/a.json [b.json]
//     → design/avatar/renders/<name>-front.png, <name>-34.png, <name>-seated.png per outfit; with two outfits also
//       pair-front.png and pair-seated.png (first left, second right)
//   ... render.ts --glb a.json        also packs the outfit as one skinned GLB (WebP, gltfpack) and prints KB / tris
//   ... render.ts --inspect Folder/file.png ...   each texture's RGB, R, G, B, A side by side → /tmp/avatar-ta/inspect
//   ... render.ts --sheet base.json key v1 v2 … [--view=face|front|34] [--name=x]   a labelled grid → /tmp/avatar-ta/sheets
//   ... render.ts --compare out.png r1.png …  [--title=…]   the target beside renders → renders/out.png
//   ... render.ts --avg Folder …   each folder's albedo's mean colour;  --debug a.json   joint and mesh positions
// See ../tech-notes.md. The assembler is player.js (browser) and harness.ts (Node), both importable.
// The model folder is untrusted input: only the named folders' .dae and .png files (safe names) are copied into a
// scratch dir under /tmp/avatar-ta/ and read by three.js; nothing in them is run, nothing of them is committed.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';
import { F, openHarness } from './harness.ts';

const HERE = import.meta.dirname;
const OUT = join(HERE, '..', 'renders');
const args = process.argv.slice(2);
const flag = (k: string) => args.includes(`--${k}`);
const rest = args.filter((a) => !a.startsWith('--'));
const h = await openHarness();
const { call, copy } = h;
const save = (name: string, dataUrl: string) => h.save(OUT, name, dataUrl);
const saveTo = (dir: string, name: string, dataUrl: string) => h.save(dir, name, dataUrl);
const foldersOf = (o: unknown) => Object.keys(h.filesFor(o)).map((k) => k.replace('.Nin_NX_NVN', ''));

if (flag('inspect')) {
  for (const p of rest) {
    const [folder, file] = p.split('/');
    copy(folder);
    saveTo('/tmp/avatar-ta/inspect', `inspect-${folder}-${file.replace(/\.png$/, '')}.png`, await call<string>('inspect', `/src/${F(folder)}/${file}`));
  }
} else if (flag('compare')) {
  // --compare name.png file1.png … [--title=…]: the target beside these renders (renders/<file>), labelled by file name
  const [name, ...pngs] = rest;
  const url = (f: string) => `data:image/${f.endsWith('.jpg') ? 'jpeg' : 'png'};base64,${readFileSync(f).toString('base64')}`;
  const title = args.find((a) => a.startsWith('--title='))?.slice(8) ?? '';
  save(name, await call<string>('compare', url(join(HERE, '..', 'target.jpg')), pngs.map((p) => [p.replace(/\.png$/, ''), url(join(OUT, p))]), title));
} else if (flag('avg')) {
  // --avg Folder... : each folder's albedo's mean colour (for finding a colourway)
  const urls: string[] = [];
  for (const f of rest) { const l = copy(f); const a = l.find((n) => /_Alb(\.0)?\.png$/.test(n)); if (a) urls.push(`/src/${F(f)}/${a}`); }
  const r = await call<Record<string, number[]>>('avg', urls);
  for (const [u, c] of Object.entries(r)) console.log(c.map((v) => String(v).padStart(4)).join(''), u.split('/')[2].replace('.Nin_NX_NVN', ''));
} else if (flag('debug')) {
  const o = JSON.parse(readFileSync(rest[0], 'utf8'));
  const files: Record<string, string[]> = {};
  for (const f of foldersOf(o)) files[F(f)] = copy(f);
  console.log(await call<string>('debug', o, files));
} else if (flag('sheet')) {
  // --sheet base.json key value1 value2 … [--view=face|front|34] [--name=x]: one cell per value (values parsed as JSON
  // when they parse, else strings)
  const [basePath, key, ...vals] = rest;
  const base = JSON.parse(readFileSync(basePath, 'utf8'));
  const values = vals.map((v) => { try { return JSON.parse(v); } catch { return v; } });
  const files: Record<string, string[]> = {};
  for (const f of foldersOf([base, values])) files[F(f)] = copy(f);
  const name = args.find((a) => a.startsWith('--name='))?.slice(7) ?? `sheet-${key}`;
  const view = args.find((a) => a.startsWith('--view='))?.slice(7) ?? 'face';
  saveTo('/tmp/avatar-ta/sheets', `${name}.png`, await call<string>('sheet', { base, key, values, view }, files));
} else {
  const outfits = rest.map((p) => ({ ...JSON.parse(readFileSync(p, 'utf8')), name: JSON.parse(readFileSync(p, 'utf8')).name ?? basename(p, '.json') }));
  const files: Record<string, string[]> = {};
  for (const o of outfits) for (const f of foldersOf(o)) files[F(f)] = copy(f);
  for (const o of outfits) {
    const r = await call<Record<string, string>>('renderOne', o, files);
    for (const [view, url] of Object.entries(r)) if (view !== 'info') save(`${o.name}-${view}.png`, url);
    console.log(o.name, r.info);
    if (flag('glb')) await glb(o, files);
  }
  if (outfits.length === 2) {
    const r = await call<Record<string, string>>('renderPair', outfits[0], outfits[1], files);
    for (const [view, url] of Object.entries(r)) save(`pair-${view}.png`, url);
  }
}
await h.close();

/** The outfit as one GLB, packed as the villagers' are (WebP textures, gltfpack quantised + meshopt): its size. */
async function glb(o: { name: string }, files: Record<string, string[]>) {
  const r = await call<{ gltf: string; tris: number }>('exportOne', o, files);
  const g = JSON.parse(r.gltf);
  const dir = join('/tmp/avatar-ta/glb', o.name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  g.buffers.forEach((b: { uri: string }, i: number) => { writeFileSync(join(dir, `b${i}.bin`), Buffer.from(b.uri.split(',')[1], 'base64')); b.uri = `b${i}.bin`; });
  (g.images ?? []).forEach((im: { uri: string; mimeType: string }, i: number) => {
    const png = join(dir, `i${i}.png`);
    writeFileSync(png, Buffer.from(im.uri.split(',')[1], 'base64'));
    execFileSync('cwebp', ['-quiet', '-q', '80', '-alpha_q', '90', '-m', '6', '-sharp_yuv', png, '-o', join(dir, `i${i}.webp`)]);
    im.uri = `i${i}.webp`;
    im.mimeType = 'image/webp';
  });
  if (g.images?.length) {
    for (const t of g.textures ?? []) { t.extensions = { EXT_texture_webp: { source: t.source } }; delete t.source; }
    g.extensionsUsed = [...new Set([...(g.extensionsUsed ?? []), 'EXT_texture_webp'])];
    g.extensionsRequired = [...new Set([...(g.extensionsRequired ?? []), 'EXT_texture_webp'])];
  }
  writeFileSync(join(dir, 'm.gltf'), JSON.stringify(g));
  const GLTFPACK = join(dirname(createRequire(import.meta.url).resolve('gltfpack/package.json')), 'cli.js');
  const out = join(dir, `${o.name}.glb`);
  execFileSync('node', [GLTFPACK, '-i', join(dir, 'm.gltf'), '-o', out, '-cc', '-ce', 'ext', '-kn', '-km', '-ke']);
  console.log(`${o.name}.glb: ${(statSync(out).size / 1024).toFixed(1)} KB, ${r.tris} tris (${out})`);
}
