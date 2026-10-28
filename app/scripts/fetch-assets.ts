// Fetch the official New Horizons art the UI uses (from Nookipedia's file pages) into static/art/.
// Usage (from app/): npm run assets:fetch   [--force to re-download everything]
//
// The art is Nintendo's, used here for a private, personal app: keep the repo private.
// Output: static/art/<category>/<id>.webp (+ static/art/manifest.json), downscaled to ≤ the size the UI needs.
// Idempotent: files already on disk are skipped. Requires `cwebp` (brew install webp).
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const API = 'https://nookipedia.com/w/api.php';
const OUT = join(import.meta.dirname, '..', 'static', 'art');
const MANIFEST = join(OUT, 'manifest.json');
const DELAY_MS = 400;
const force = process.argv.includes('--force');

/** key → [max px on the longer side, ...candidate file titles in preference order]. */
type Spec = [number, ...string[]];

const ROSTER = ['Goldie', 'Raymond', 'Bob', 'Bunnie', 'Judy', 'Stitches', 'Hamlet', 'Molly', 'Lily', 'Dom'];

const SPECS: Record<string, Spec> = {
  // Isabelle, the host. Only the transparent renders (NH_2..4 have white backgrounds).
  'host/isabelle': [512, 'Isabelle_NH_Transparent.png'],
  'host/isabelle-stand': [512, 'Isabelle_NH_Model.png'],
  'host/isabelle-bow': [512, 'Isabelle_NH_Model_2.png'],
  'host/isabelle-winter': [512, 'Isabelle_NH_Winter.png'],
  'host/isabelle-icon': [128, 'Isabelle_NH_Character_Icon.png'],
  'host/tom-nook': [512, 'Tom_Nook_NH.png'],
  // The four fruit rings.
  'fruit/peach': [128, 'Peach_NH_Inv_Icon.png'],
  'fruit/coconut': [128, 'Coconut_NH_Inv_Icon.png'],
  'fruit/apple': [128, 'Apple_NH_Inv_Icon.png'],
  'fruit/pear': [128, 'Pear_NH_Inv_Icon.png'],
  // Island flowers.
  'flowers/red-tulips': [128, 'Red_Tulips_NH_Inv_Icon.png'],
  'flowers/yellow-tulips': [128, 'Yellow_Tulips_NH_Inv_Icon.png'],
  'flowers/white-cosmos': [128, 'White_Cosmos_NH_Inv_Icon.png'],
  'flowers/red-roses': [128, 'Red_Roses_NH_Inv_Icon.png'],
  // Money UI.
  'money/bells': [128, '99k_Bells_NH_Inv_Icon.png'],
  'money/leaf': [128, 'Leaf_NH_Icon.png'],
  // NookPhone (しまフォン launcher).
  'phone/nookphone': [512, 'NookPhone_NH_Model.png'],
  'phone/diy': [92, 'NookPhone_DIY_NH_Icon.png'],
  'phone/passport': [92, 'NookPhone_Passport_NH_Icon.png']
};
for (const name of ROSTER) {
  const id = name.toLowerCase();
  // Prefer the large transparent renders; `<Name>_NH.png` (the infobox image) is the safe last resort.
  const extra = name === 'Hamlet' ? ['Hamlet_NH_2.png'] : []; // Hamlet's _1 doesn't exist; _2 is the big front render
  SPECS[`villagers/${id}`] = [512, `${name}_NH_Transparent.png`, `${name}_NH_1.png`, ...extra, `${name}_NH.png`];
  SPECS[`villagers/${id}-icon`] = [128, `${name}_NH_Villager_Icon.png`];
}

interface Info {
  url: string;
  width: number;
  height: number;
}
interface Entry {
  path: string;
  w: number;
  h: number;
  source: string;
}
interface Manifest {
  version: number;
  files: Record<string, Entry>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string): Promise<Response> {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

/** Resolve file titles → original URL + size, 40 titles per API call. */
async function resolve(titles: string[]): Promise<Map<string, Info>> {
  const out = new Map<string, Info>();
  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40).map((t) => `File:${t}`);
    const url = `${API}?action=query&format=json&prop=imageinfo&iiprop=url|size&titles=${encodeURIComponent(batch.join('|'))}`;
    const data = (await (await get(url)).json()) as {
      query: {
        normalized?: { from: string; to: string }[];
        pages: Record<string, { title: string; missing?: string; imageinfo?: Info[] }>;
      };
    };
    const back = new Map((data.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of Object.values(data.query.pages)) {
      if (!p.imageinfo?.length) continue;
      const asked = (back.get(p.title) ?? p.title).replace(/^File:/, '');
      out.set(asked, p.imageinfo[0]);
    }
    await sleep(DELAY_MS);
  }
  return out;
}

function fit(w: number, h: number, max: number): [number, number] {
  const s = Math.min(1, max / Math.max(w, h));
  return [Math.round(w * s), Math.round(h * s)];
}

async function main() {
  const manifest: Manifest = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, 'utf8'))
    : { version: 1, files: {} };
  const todo = Object.entries(SPECS).filter(
    ([key]) => force || !manifest.files[key] || !existsSync(join(OUT, manifest.files[key].path))
  );
  console.log(`${Object.keys(SPECS).length} assets, ${todo.length} to fetch`);
  // Drop manifest entries (and files) the UI no longer uses.
  for (const [key, e] of Object.entries(manifest.files)) {
    if (SPECS[key]) continue;
    rmSync(join(OUT, e.path), { force: true });
    delete manifest.files[key];
  }
  if (!todo.length) return writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

  const infos = await resolve([...new Set(todo.flatMap(([, [, ...t]]) => t))]);
  const tmp = join(tmpdir(), `island-art-${process.pid}`);
  mkdirSync(tmp, { recursive: true });
  const missing: string[] = [];

  for (const [key, [max, ...titles]] of todo) {
    const title = titles.find((t) => infos.has(t));
    if (!title) {
      missing.push(`${key} (${titles.join(', ')})`);
      continue;
    }
    const info = infos.get(title)!;
    const src = join(tmp, 'src' + (title.match(/\.\w+$/)?.[0] ?? '.png'));
    writeFileSync(src, Buffer.from(await (await get(info.url)).arrayBuffer()));
    const [w, h] = fit(info.width, info.height, max);
    const rel = `${key}.webp`;
    const dest = join(OUT, rel);
    mkdirSync(dirname(dest), { recursive: true });
    execFileSync('cwebp', ['-quiet', '-q', '86', '-alpha_q', '100', '-m', '6', '-resize', String(w), String(h), src, '-o', dest]);
    manifest.files[key] = { path: rel, w, h, source: `https://nookipedia.com/wiki/File:${title}` };
    console.log(`  ✓ ${key}  ${w}×${h}  ← ${title}`);
    await sleep(DELAY_MS);
  }
  rmSync(tmp, { recursive: true, force: true });

  manifest.version += todo.length - missing.length > 0 ? 1 : 0;
  manifest.files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(OUT, { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`manifest: ${Object.keys(manifest.files).length} files (v${manifest.version})`);
  if (missing.length) console.log(`missing (no candidate title found):\n  ${missing.join('\n  ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
