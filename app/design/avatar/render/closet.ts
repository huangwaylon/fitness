// The closet feasibility sweep (design exploration): every player-wearable item in the dump worn on one player in
// turn (player.js wear(): the closet's runtime swap), a thumbnail of its region into contact sheets, checks for broken
// items (missing mesh or albedo, misplaced, mostly cut away), each item's texture as a ≤256 px WebP (its bytes), and
// every distinct mesh packed alone as a GLB (gltfpack meshopt, no textures: the shared-mesh half of the closet).
//
// Usage (from app/):
//   python3 -I design/avatar/render/closet-enum.py      → /tmp/avatar-ta/closet/items.json (names, files, dae facts)
//   node design/avatar/render/closet.ts [--only=tops,shoes] [--limit=40] [--no-glb]
//     → design/avatar/closet/results.json (+ summary.json), sheets in /tmp/avatar-ta/closet/sheets/, a sample sheet per
//       category and the failures' sheet in design/avatar/closet/
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { F, SCRATCH, openHarness } from './harness.ts';

const HERE = import.meta.dirname;
const OUT = join(HERE, '..', 'closet');
const TMP = '/tmp/avatar-ta/closet';
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = (arg('only') ?? '').split(',').filter(Boolean);
const limit = Number(arg('limit') ?? 0);
mkdirSync(OUT, { recursive: true });
mkdirSync(join(TMP, 'sheets'), { recursive: true });
mkdirSync(join(TMP, 'webp'), { recursive: true });

interface Item { cat: string; id: string; mesh: string | null; files: string[]; alb: string | null; op: boolean; variant?: boolean; underwater?: boolean; apron?: boolean; dae?: { joints?: string[]; mats?: string[]; tris?: number; geo?: string; error?: string } | null }
const items: Item[] = JSON.parse(readFileSync(join(TMP, 'items.json'), 'utf8'));

/** The closet's categories → the slot an item is worn in. Excluded: custom-design (My Design) meshes and
 *  textures, underwater variants, NPC-only aprons; umbrellas are held props (a hand anchor), not worn. */
const SLOT: Record<string, string> = {
  tops: 'top', bottoms: 'bottom', shoes: 'shoes', socks: 'socks', glasses: 'glasses', glassmouth: 'glasses', mouthacc: 'face',
  caphat: 'hat', capornament: 'hat', capbangs: 'hat', capcostume: 'hat', capfullface: 'hat', caphelmet: 'hat', capmask: 'hat', capwig: 'hat', capplt: 'hat', accplt: 'face', bag: 'bag'
};
function excluded(it: Item): string | null {
  if (it.cat === 'umbrella') return 'held prop (hand anchor), not worn';
  if (/mydesign|Preview|3ds/.test(it.id)) return 'custom-design (My Design) variant: no albedo (_Crv)';
  if (it.underwater || /UnderWater/.test(it.id)) return 'underwater variant';
  if (it.apron || /apron/i.test(it.id)) return 'NPC apron';
  if (it.cat === 'capplt' || it.cat === 'accplt') return 'placeholder (Plt)';
  if ((it.cat === 'tops' || it.cat === 'bottoms') && !it.mesh) return 'no player mesh (NPC-only texture)';
  return null;
}
const work = items.filter((it) => SLOT[it.cat] && !excluded(it) && (!only.length || only.includes(it.cat)));
const byCat = new Map<string, Item[]>();
for (const it of work) byCat.set(it.cat, [...(byCat.get(it.cat) ?? []), it]);

const base = JSON.parse(readFileSync(join(HERE, 'outfits', 'a.json'), 'utf8'));
delete base.glasses;
const h = await openHarness({ page: join(HERE, 'closet-page.js') });
const NRM = /_Nrm/;
const baseFiles = h.filesFor(base);
const keep = new Set(Object.keys(baseFiles));
const results: Record<string, unknown>[] = [];
const valueOf = (it: Item) => it.cat === 'tops' ? { mesh: it.mesh, tex: it.id, onepiece: /^PlayerTops(Onepiece|Marinesuit)/.test(it.mesh!) }
  : it.cat === 'bottoms' ? { mesh: it.mesh, tex: it.id } : it.id;
const webp = (png: string, out: string) => { execFileSync('cwebp', ['-quiet', '-q', '80', '-alpha_q', '90', '-m', '6', '-sharp_yuv', png, '-o', out]); return statSync(out).size; };

for (const [cat, list0] of byCat) {
  const list = limit ? list0.slice(0, limit) : list0;
  const slot = SLOT[cat];
  const b = structuredClone(base);
  if (slot === 'hat') b.hatHidesHair = true;       // placement judged on the bare head
  if (slot === 'bottom') b.top = { mesh: 'PlayerTopsTopTshirtsH', tex: 'TopsTexTopTshirtsHPocketshirts0' };
  if (slot === 'top' || slot === 'glasses' || slot === 'face') {} // the default look
  await h.call('closetInit', b, { ...baseFiles, ...h.filesFor(b) });
  console.log(`${cat}: ${list.length}`);
  for (let i = 0; i < list.length; i += 40) {
    const chunk = list.slice(i, i + 40);
    const more: Record<string, string[]> = {};
    for (const it of chunk) {
      for (const f of [it.id, it.mesh].filter((x): x is string => !!x && x !== 'PlayerBody')) more[F(f)] = h.copy(f, NRM);
    }
    const res = await h.call<Record<string, unknown>[]>('closetBatch', chunk.map((it) => ({ id: it.id, cat: it.cat, slot, value: valueOf(it) })), more);
    for (const [k, r] of res.entries()) {
      const it = chunk[k];
      const tex = (r.tex as string[] | undefined) ?? [];
      let bytes = 0;
      tex.forEach((u, j) => {
        const png = join(TMP, 'webp', `t.png`);
        writeFileSync(png, Buffer.from(u.split(',')[1], 'base64'));
        bytes += webp(png, join(TMP, 'webp', `${it.id}-${j}.webp`));
      });
      delete r.tex;
      results.push({ ...r, cat, slot, mesh: it.mesh, geo: it.dae?.geo ?? null, texKB: +(bytes / 1024).toFixed(2) });
    }
    // the copied folders go once worn (the dump's textures don't pile up in /tmp)
    for (const k of Object.keys(more)) if (!keep.has(k) && !k.startsWith('PlayerTops') && !k.startsWith('PlayerBottoms')) rmSync(join(SCRATCH, k), { recursive: true, force: true });
    process.stdout.write(`  ${Math.min(i + 40, list.length)}/${list.length}\r`);
  }
  const pngs = await h.call<string[]>('closetSheets');
  pngs.forEach((u, j) => h.save(join(TMP, 'sheets'), `${cat}-${j + 1}.png`, u));
  if (pngs[0]) copyFileSync(join(TMP, 'sheets', `${cat}-1.png`), join(OUT, `sheet-${cat}.png`));
  console.log('');
}

// the failures, on one sheet (worn again), and the results
const bad = (only.length ? [] : results).filter((r) => (r.why as string[]).length);
if (bad.length) {
  for (const slot of [...new Set(bad.map((r) => r.slot as string))]) {
    const list = bad.filter((r) => r.slot === slot);
    const b = structuredClone(base);
    if (slot === 'hat') b.hatHidesHair = true;
    if (slot === 'bottom') b.top = { mesh: 'PlayerTopsTopTshirtsH', tex: 'TopsTexTopTshirtsHPocketshirts0' };
    await h.call('closetInit', b, { ...baseFiles, ...h.filesFor(b) });
    for (let i = 0; i < list.length; i += 40) {
      const chunk = list.slice(i, i + 40).map((r) => items.find((x) => x.id === r.id)!);
      const more: Record<string, string[]> = {};
      for (const it of chunk) for (const f of [it.id, it.mesh].filter((x): x is string => !!x && x !== 'PlayerBody')) more[F(f)] = h.copy(f, NRM);
      await h.call('closetBatch', chunk.map((it) => ({ id: it.id, cat: it.cat, slot, value: valueOf(it) })), more);
    }
  }
  const pngs = await h.call<string[]>('closetSheets');
  pngs.forEach((u, j) => h.save(OUT, `failures-${j + 1}.png`, u));
}

// every distinct mesh alone as a packed GLB (no textures): tops and bottoms by shape, the rest by geometry
const meshes = new Map<string, string>();   // key → folder
if (!process.argv.includes('--no-glb') && !only.length) {
  for (const r of results) {
    const it = items.find((x) => x.id === r.id)!;
    if (!it.mesh || it.mesh === 'PlayerBody') continue;
    const key = it.cat === 'tops' || it.cat === 'bottoms' ? it.mesh : `${it.cat}:${it.dae?.geo}`;
    if (!meshes.has(key)) meshes.set(key, it.mesh);
  }
  const GLTFPACK = join(dirname(createRequire(import.meta.url).resolve('gltfpack/package.json')), 'cli.js');
  const glb: Record<string, { kb: number; tris: number; folder: string }> = {};
  let n = 0;
  for (const [key, folder] of meshes) {
    const files = h.copy(folder, /\.png$/);
    const dae = files.find((f) => f.endsWith('.dae'))!;
    const r = await h.call<{ gltf: string; tris: number }>('meshGltf', folder, dae);
    const dir = join(TMP, 'glb'); mkdirSync(dir, { recursive: true });
    const g = JSON.parse(r.gltf);
    g.buffers.forEach((b: { uri: string }, i: number) => { writeFileSync(join(dir, `b${i}.bin`), Buffer.from(b.uri.split(',')[1], 'base64')); b.uri = `b${i}.bin`; });
    writeFileSync(join(dir, 'm.gltf'), JSON.stringify(g));
    const out = join(dir, 'm.glb');
    try {
      execFileSync('node', [GLTFPACK, '-i', join(dir, 'm.gltf'), '-o', out, '-cc', '-kn', '-km'], { stdio: 'pipe' });
      glb[key] = { kb: +(statSync(out).size / 1024).toFixed(1), tris: r.tris, folder };
    } catch (e) {
      glb[key] = { kb: -1, tris: r.tris, folder };
    }
    if (!keep.has(F(folder))) rmSync(join(SCRATCH, F(folder)), { recursive: true, force: true });
    if (++n % 25 === 0) process.stdout.write(`  glb ${n}/${meshes.size}\r`);
  }
  writeFileSync(join(OUT, 'meshes.json'), JSON.stringify(glb, null, 0).replace(/},"/g, '},\n"'));
}
// (a partial run, --only, replaces just its categories in the results)
const prev: Record<string, unknown>[] = only.length && existsSync(join(OUT, 'results.json')) ? JSON.parse(readFileSync(join(OUT, 'results.json'), 'utf8')) : [];
const all = [...prev.filter((r) => !only.includes(r.cat as string)), ...results];
writeFileSync(join(OUT, 'results.json'), '[\n' + all.map((r) => JSON.stringify(r)).join(',\n') + '\n]\n');
const ex = items.filter((it) => excluded(it)).map((it) => ({ id: it.id, cat: it.cat, why: excluded(it) }));
writeFileSync(join(OUT, 'excluded.json'), '[\n' + ex.map((r) => JSON.stringify(r)).join(',\n') + '\n]\n');
console.log(`${results.length} worn, ${bad.length} flagged, ${ex.length} excluded`);
await h.close();
void existsSync;
