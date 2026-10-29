// Fetch the official New Horizons art the UI uses (from Nookipedia's file pages) into static/art/.
// Usage (from app/): npm run assets:fetch   [--force to re-download everything]
//                    npm run assets:fetch -- --only=trees/oak,host/   (re-download keys with these prefixes)
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
const only = (process.argv.find((a) => a.startsWith('--only='))?.slice(7) ?? '').split(',').filter(Boolean);

/** key → [max px on the longer side, ...candidate file titles in preference order]. */
type Spec = [number, ...string[]];

const ROSTER = ['Goldie', 'Raymond', 'Bob', 'Bunnie', 'Judy', 'Stitches', 'Hamlet', 'Molly', 'Lily', 'Dom'];

const SPECS: Record<string, Spec> = {
  // Isabelle, the host. Only the transparent renders (NH_2..4 have white backgrounds). There is no
  // official bow render: 'bow' is the stand render + a CSS bow (N2). Winter = the full-body cardigan
  // model (same canvas as the stand model, N3); the old `Isabelle_NH_Winter.png` is a waist-up bust.
  'host/isabelle': [512, 'Isabelle_NH_Transparent.png'],
  'host/isabelle-stand': [512, 'Isabelle_NH_Model.png'],
  'host/isabelle-winter': [512, 'Isabelle_NH_Model_2.png'],
  'host/isabelle-icon': [128, 'Isabelle_NH_Character_Icon.png'],
  'host/tom-nook': [512, 'Tom_Nook_NH.png'],
  // The four fruit rings.
  'fruit/peach': [128, 'Peach_NH_Inv_Icon.png'],
  'fruit/coconut': [128, 'Coconut_NH_Inv_Icon.png'],
  'fruit/apple': [128, 'Apple_NH_Inv_Icon.png'],
  'fruit/pear': [128, 'Pear_NH_Inv_Icon.png'],
  // Island flower beds (scale pass): the NH inventory art of each planted flower, trimmed to the figure (TRIM).
  'flowers/red-tulips': [128, 'Red_Tulips_NH_Inv_Icon.png'],
  'flowers/yellow-tulips': [128, 'Yellow_Tulips_NH_Inv_Icon.png'],
  'flowers/red-roses': [128, 'Red_Roses_NH_Inv_Icon.png'],
  'flowers/white-roses': [128, 'White_Roses_NH_Inv_Icon.png'],
  'flowers/pink-cosmos': [128, 'Pink_Cosmos_NH_Inv_Icon.png'],
  'flowers/purple-mums': [128, 'Purple_Mums_NH_Inv_Icon.png'],
  'flowers/orange-pansies': [128, 'Orange_Pansies_NH_Inv_Icon.png'],
  // Money UI.
  'money/bells': [128, '99k_Bells_NH_Inv_Icon.png'],
  'money/leaf': [128, 'Leaf_NH_Icon.png'],
  // NookPhone (しまフォン launcher).
  'phone/nookphone': [208, 'NookPhone_NH_Model.png'], // drawn 30px tall (35 wide) → 2× at 3x DPR
  'phone/diy': [92, 'NookPhone_DIY_NH_Icon.png'],
  'phone/passport': [92, 'NookPhone_Passport_NH_Icon.png'],
  // v4 launcher: full squircle tiles (92 px) and bare menu glyphs (180 px, transparent; drawn on our tile).
  'phone/rescue': [92, 'NookPhone_Rescue_Service_NH_Icon.png'],
  'phone/miles': [92, 'NookPhone_Nook_Miles_NH_Icon.png'],
  'phone/glyph-help': [96, 'Menu_Island_Life_101_NH_Icon.png'],
  'phone/glyph-chat': [96, 'Menu_Chat_Log_NH_Icon.png'],
  'phone/glyph-friends': [96, 'Menu_Best_Friends_List_NH_Icon.png'],
  'phone/glyph-resident': [96, 'Menu_Call_Resident_NH_Icon.png'],
  'phone/glyph-map': [96, 'Menu_Map_NH_Icon.png'],
  'money/miles': [96, 'Nook_Miles_NH_Icon.png'],
  // v4 trees: the hardwood in its four seasonal looks is the NH fruit tree (each bears one fruit kind);
  // cedar + palm frame the island. A11: the seasonal sources are only 329×409, so they ship at full
  // resolution (never upscaled: the orchard draws them ≤ 104u ≈ 315 device px); summer has a big
  // source and ships at 2× the drawn size.
  'trees/oak-spring': [409, 'Oak_Tree_NH_Spring.png'],
  'trees/oak-summer': [640, 'Oak_Tree_NH.png'],
  'trees/oak-fall': [409, 'Oak_Tree_NH_Fall.png'],
  'trees/oak-winter': [409, 'Oak_Tree_NH_Winter.png'],
  'trees/cedar': [384, 'Cedar_Tree_NH.png'],
  'trees/palm': [320, 'Palm_Tree_NH.png'],
  'trees/palm-sm': [128, 'Palm_Tree_NH.png'], // the distant islet (26u): a small decode
  'trees/apple-icon': [96, 'Apple_Tree_NH_Icon.png'],
  'trees/peach-icon': [96, 'Peach_Tree_NH_Icon.png'],
  'trees/pear-icon': [96, 'Pear_Tree_NH_Icon.png'],
  'trees/coconut-icon': [96, 'Coconut_Tree_NH_Icon.png'],
  // Scale pass (docs/design/scale-and-ground.md): the hedge uses the 3D catalog renders (`*_Bush_NH_Icon`,
  // 128 px, the largest Nookipedia has), trimmed to the figure (TRIM), one species per season, two colours.
  'bushes/pink-azalea': [128, 'Pink-Azalea_Bush_NH_Icon.png'],
  'bushes/white-azalea': [128, 'White-Azalea_Bush_NH_Icon.png'],
  'bushes/blue-hydrangea': [128, 'Blue-Hydrangea_Bush_NH_Icon.png'],
  'bushes/pink-hydrangea': [128, 'Pink-Hydrangea_Bush_NH_Icon.png'],
  'bushes/red-hibiscus': [128, 'Red-Hibiscus_Bush_NH_Icon.png'],
  'bushes/yellow-hibiscus': [128, 'Yellow-Hibiscus_Bush_NH_Icon.png'],
  'bushes/orange-tea-olive': [128, 'Orange-Tea-Olive_Bush_NH_Icon.png'],
  'bushes/yellow-tea-olive': [128, 'Yellow-Tea-Olive_Bush_NH_Icon.png'],
  'bushes/holly': [128, 'Holly_Bush_NH_Icon.png'],
  'bushes/pink-camellia': [128, 'Pink-Camellia_Bush_NH_Icon.png'],
  'bushes/red-camellia': [128, 'Red-Camellia_Bush_NH_Icon.png'],
  // v4 island decorations.
  'deco/fence-wood': [96, 'Simple_Wooden_Fence_NH_Icon.png'],
  'deco/fence-log': [96, 'Log_Fence_NH_Icon.png'],
  'deco/log-bench': [96, 'Log_Bench_NH_Icon.png'],
  'deco/mailbox': [96, 'Wooden_Mailbox_NH_Icon.png'],
  'deco/bonfire': [96, 'Bonfire_NH_Icon.png'],
  'deco/rock': [96, 'Mossy_Garden_Rock_NH_Icon.png'],
  'deco/stone': [96, 'Stone_NH_Inv_Icon.png'],
  'deco/resident-services': [256, 'Resident_Services_NH_Map_Icon.png'],
  'deco/airport': [256, 'Airport_(Blue)_NH_Map_Icon.png'],
  'deco/sand-dollar': [64, 'Sand_Dollar_NH_Inv_Icon.png'],
  'deco/cowrie': [64, 'Cowrie_NH_Inv_Icon.png'],
  'deco/conch': [64, 'Conch_NH_Inv_Icon.png'],
  'deco/star-fragment': [96, 'Star_Fragment_NH_Inv_Icon.png'],
  'deco/star-fragment-large': [96, 'Large_Star_Fragment_NH_Inv_Icon.png'],
  'deco/party-popper': [96, 'Party_Popper_NH_Inv_Icon.png'],
  'deco/present': [96, 'Present_NH_Inv_Icon.png'],
  // v5 (docs/design/v5-direction.md): game-derived replacements for hand-drawn chrome.
  // The NH map is the reference for the flat sea/shore style; the islet render is that style's sample.
  'map/islet': [548, 'NH_Map_Islet.png'],
  'phone/nook-shopping': [92, 'NookPhone_Nook_Shopping_NH_Icon.png'], // ごほうび財布 (reward wallet)
  'phone/island-designer': [92, 'NookPhone_Island_Designer_NH_Icon.png'], // しまフォン settings tile
  'money/miles-ticket': [128, 'Nook_Miles_Ticket_NH_Inv_Icon.png'], // the trip goal (次は 沖縄)
  // v4 seasonal particles + seasonal ground items.
  'season/petal': [64, 'Cherry-Blossom_Petal_NH_Inv_Icon.png'],
  'season/maple-leaf': [64, 'Maple_Leaf_NH_Inv_Icon.png'],
  'season/snowflake': [64, 'Snowflake_NH_Inv_Icon.png'],
  'season/snowflake-large': [96, 'Large_Snowflake_NH_Inv_Icon.png'],
  'season/acorn': [64, 'Acorn_NH_Inv_Icon.png'],
  'season/pine-cone': [64, 'Pine_Cone_NH_Inv_Icon.png'],
  'season/mushroom': [64, 'Mushroom_NH_Inv_Icon.png'],
};
/** Keys whose transparent margin is trimmed off (alpha bbox + 2 px), so `size` = the figure's height and
 *  scene sizes are true to the tile unit (docs/design/scale-and-ground.md). */
const TRIM = ['bushes/', 'flowers/'];

// v4 reaction icons (the NH reaction wheel: grey cat face + coloured accents), shown inside our emote bubble.
const EMOTIONS = [
  'Joy', 'Delight', 'Love', 'Surprise', 'Laughter', 'Sleepy', 'Happiness', 'Greetings', 'Encouraging',
  'Glee', 'Pleased', 'Pride', 'Inspiration', 'Daydreaming', 'Dozing', 'Amazed', 'Curiosity', 'Thought',
  'Flourish', 'Bashfulness', 'Sheepishness', 'Worry', 'Confident', 'Shocked'
];
for (const e of EMOTIONS) SPECS[`reactions/${e.toLowerCase()}`] = [96, `Emotion_${e}_NH_Icon.png`];
// Pose-style reactions (player silhouettes) for the harvest / cheer moments.
const POSES: Record<string, string> = {
  excited: 'Excited', confetti: 'Confetti', viva: 'Viva', 'lets-go': "Let's_Go", 'ta-da': 'Ta-da',
  'double-wave': 'Double_Wave', jump: 'Jump', 'work-out': 'Work_Out', stretch: 'Stretch', flex: 'Flex'
};
for (const [id, t] of Object.entries(POSES)) SPECS[`reactions/pose-${id}`] = [96, `${t}_NH_Reaction_Icon.png`];
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

/** Alpha bounding box of an image (via a lossless webp → PAM round trip; no image library needed), padded 2 px. */
function alphaBox(src: string, tmp: string): [number, number, number, number] {
  const lossless = join(tmp, 'trim.webp'), pam = join(tmp, 'trim.pam');
  execFileSync('cwebp', ['-quiet', '-lossless', '-exact', src, '-o', lossless]);
  execFileSync('dwebp', ['-quiet', lossless, '-pam', '-o', pam]);
  const buf = readFileSync(pam);
  const head = buf.subarray(0, 200).toString('latin1');
  const end = head.indexOf('ENDHDR\n') + 7;
  const W = Number(/WIDTH (\d+)/.exec(head)![1]), H = Number(/HEIGHT (\d+)/.exec(head)![1]);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (buf[end + (y * W + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return [0, 0, W, H];
  x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(W - 1, x1 + 2); y1 = Math.min(H - 1, y1 + 2);
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
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
    ([key]) =>
      force || only.some((o) => key.startsWith(o)) || !manifest.files[key] || !existsSync(join(OUT, manifest.files[key].path))
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
    const crop = TRIM.some((p) => key.startsWith(p)) ? alphaBox(src, tmp) : null;
    const [w, h] = crop ? fit(crop[2], crop[3], max) : fit(info.width, info.height, max);
    const rel = `${key}.webp`;
    const dest = join(OUT, rel);
    mkdirSync(dirname(dest), { recursive: true });
    const cropArgs = crop ? ['-crop', ...crop.map(String)] : [];
    execFileSync('cwebp', ['-quiet', '-q', '86', '-alpha_q', '100', '-m', '6', ...cropArgs, '-resize', String(w), String(h), src, '-o', dest]);
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
