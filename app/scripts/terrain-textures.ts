// NH's ground textures for the 3D island's live terrain (docs/island-layout.md, world3d/terrain.ts): the cliff's
// strata (and its snow), the beach's sand, the stone, brick and plank paths, the grass's and the dirt path's patterns,
// the waterfall's streaks, from the game files the user supplied (FldUnit.Nin_NX_NVN, the same folder of folders the
// model scripts read), converted to WebP in static/terrain/nh/. Only the named PNGs are read; nothing in the folder
// is run, and none of it is ever part of the repo.
//
// Usage (from app/): NH_MODELS=~/Downloads/Model npm run terrain-textures
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MODELS = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~');
if (!MODELS || !existsSync(MODELS)) {
  console.error('Set NH_MODELS to the folder of NH model folders (<Model>.Nin_NX_NVN), e.g. NH_MODELS=~/Downloads/Model npm run terrain-textures');
  process.exit(1);
}
const SRC = join(MODELS, 'FldUnit.Nin_NX_NVN');
const OUT = join(import.meta.dirname, '..', 'static', 'terrain', 'nh');
mkdirSync(OUT, { recursive: true });

/** Our name → NH's file and the size it ships at (px). */
const TEX: Record<string, [string, number]> = {
  cliff: ['mCliff_Alb', 512],
  'cliff-snow': ['mCliffSnow_Alb', 512],
  sand: ['mSand_Alb', 256],
  stone: ['mRoadStone_Alb', 256],
  brick: ['mRoadBrick_Alb', 256],
  plank: ['mRoadWood_Alb', 256],
  'grass-mix': ['mGrass_Mix', 256],
  'soil-mix': ['mRoadSoil_Mix', 256],
  falls: ['mWaterfall_Alb', 128]
};
let total = 0;
for (const [name, [file, px]] of Object.entries(TEX)) {
  const src = join(SRC, `${file}.png`), out = join(OUT, `${name}.webp`);
  if (!/^[A-Za-z0-9_]+$/.test(file) || !existsSync(src)) throw new Error(`missing ${file}`);
  execFileSync('cwebp', ['-quiet', '-q', '82', '-m', '6', '-resize', String(px), String(px), src, '-o', out]);
  total += statSync(out).size;
  console.log(`${name}: ${(statSync(out).size / 1024).toFixed(1)} KB`);
}
console.log(`${Object.keys(TEX).length} textures, ${(total / 1024).toFixed(1)} KB`);
