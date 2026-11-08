// ききみみ クイズ's scene backdrops (docs/kikimimi.md "Visuals", docs/curriculum.md "Visual rules"): each scene of scenes.json painted
// by an open-weights image model, then cut to the scene card's 393:224 and encoded at 1x / 2x / 3x into
// static/art/scene/<id>{,@2x,@3x}.webp, registered in static/art/manifest.json (its 1x size; the card's srcset names the
// others). Silent and offline: nothing is downloaded.
//   node scripts/scenes/scenes.ts [ids...]          paint (if its PNG isn't cached) and encode the scenes (default all)
//     --force                                       paint again even when the PNG is cached
//     --encode                                      encode only (the cached PNGs; a missing one is an error)
//
// The model: Z-Image-Turbo (Tongyi-MAI, Apache-2.0: its outputs are ours to ship), the MFlux community's Q6 conversion
// (mflux-community/z-image-turbo-mflux-q6, 8.4 GB), at `model` in scenes.json (~/.cache/island-fund/zimg-q6), run by
// `mflux-generate-z-image-turbo` (uv tool install mflux) on Apple silicon: 9 steps, 1344×768, seed 7, ~40 s a scene on
// the M5 Max. The prompt is the scene's line + `style` (scenes.json): paper storybook gouache, no people, no text, no
// logos, an empty floor in the lower third for the villagers. Never NH characters or Nintendo's look (§8's licence rule):
// the villagers are the official art composited over the backdrop by the app.
//   The same model, seed, steps, size and prompt give the same PNG (MLX is deterministic on one machine; another chip
// may differ by a few pixels). Masters are cached under app/.cache/scenes/ (ignored), not committed.
// Requires cwebp (brew install webp).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const APP = join(import.meta.dirname, '..', '..');
const CFG = JSON.parse(readFileSync(join(import.meta.dirname, 'scenes.json'), 'utf8')) as {
  model: string; baseModel: string; seed: number; steps: number; width: number; height: number; style: string; scenes: Record<string, string>;
};
const CACHE = join(APP, '.cache', 'scenes');
const OUT = join(APP, 'static', 'art', 'scene');
const MANIFEST = join(APP, 'static', 'art', 'manifest.json');
/** The scene card's size at 1x (css px): the sheet's width on an iPhone 15 / 16, ~16:9. */
const CARD = [393, 224] as const;
const QUALITY = 80;

const args = process.argv.slice(2);
const force = args.includes('--force'), encodeOnly = args.includes('--encode');
const ids = args.filter((a) => !a.startsWith('--'));
const todo = ids.length ? ids : Object.keys(CFG.scenes);
for (const id of todo) if (!CFG.scenes[id]) throw new Error(`no scene ${id} in scenes.json`);

const model = CFG.model.replace(/^~/, homedir());
mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT, { recursive: true });

/** The scene's prompt, as painted. */
const prompt = (id: string) => `${CFG.scenes[id]}. ${CFG.style}`;

function paint(id: string): string {
  const png = join(CACHE, `${id}-s${CFG.seed}.png`);
  if (existsSync(png) && !force) return png;
  if (encodeOnly) throw new Error(`${png} is missing (paint it: drop --encode)`);
  if (!existsSync(model)) throw new Error(`the model isn't at ${model} (scenes.json model)`);
  const t = Date.now();
  execFileSync('mflux-generate-z-image-turbo', [
    '--model', model, '--base-model', CFG.baseModel, '--prompt', prompt(id), '--seed', String(CFG.seed), '--steps', String(CFG.steps),
    '--width', String(CFG.width), '--height', String(CFG.height), '--output', png
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`${id}: painted in ${Math.round((Date.now() - t) / 1000)} s`);
  return png;
}

/** The card's 393:224 out of the painting: its full width, the band a quarter below centre (the floor kept). */
function crop(): [number, number, number, number] {
  const w = CFG.width, h = Math.round(w / (CARD[0] / CARD[1]));
  const top = Math.floor((CFG.height - h) / 2) + Math.floor((CFG.height - h) / 4);
  return [0, Math.max(0, top), w, Math.min(h, CFG.height)];
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { version: number; files: Record<string, { path: string; w: number; h: number; source: string }> };
let bytes = 0;
for (const id of todo) {
  const png = paint(id);
  const [x, y, w, h] = crop();
  for (const s of [1, 2, 3]) {
    const out = join(OUT, `${id}${s === 1 ? '' : `@${s}x`}.webp`);
    execFileSync('cwebp', ['-quiet', '-q', String(QUALITY), '-m', '6', '-crop', String(x), String(y), String(w), String(h), '-resize', String(CARD[0] * s), String(CARD[1] * s), png, '-o', out]);
    bytes += statSync(out).size;
  }
  const key = `scene/${id}`;
  manifest.files[key] = {
    path: `${key}.webp`, w: CARD[0], h: CARD[1],
    source: `rendered by Z-Image-Turbo (Apache-2.0; MFlux Q6) from scripts/scenes/scenes.json, seed ${CFG.seed} (scripts/scenes/scenes.ts)`
  };
}
manifest.files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
manifest.version += 1;
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`${todo.length} scenes, ${Math.round(bytes / 1024)} KB (1x + 2x + 3x); manifest v${manifest.version}`);
