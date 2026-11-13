// NH's own head icons of its special characters (the export's `Layout_NpcIcon_<code>`, 128 px) as 96 px WebPs,
// static/room/npc/<id>.webp (under /room/: cached on first use, never at install): the ずかん's cast (components/kiroku/Cast.svelte), Resetti in the editor's reset, Booker and
// Copper at the pairing page's gate. Which character is which code: world/visitorRoles.ts CAST.
// Usage (from app/): NH_MODELS=~/Downloads/acnh-2.0.0-models/Model npm run npc-icons
// The model folder is untrusted input: only a folder's PNG is read (by cwebp); nothing in it is run.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CAST } from '../src/lib/world/visitorRoles.ts';

const OUT = join(import.meta.dirname, '..', 'static', 'room', 'npc');
const ROOT = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~');
if (!ROOT || !existsSync(ROOT)) {
  console.error('Set NH_MODELS to the folder of NH model folders');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [id, code] of CAST) {
  if (!/^[A-Za-z0-9]+$/.test(code)) throw new Error(`${id}: ${code}`);
  const dir = join(ROOT, `Layout_NpcIcon_${code}.Nin_NX_NVN`);
  const png = existsSync(dir) ? readdirSync(dir).find((f) => /^[A-Za-z0-9_]+\.png$/.test(f)) : undefined;
  if (!png) throw new Error(`${id}: no Layout_NpcIcon_${code}`);
  execFileSync('cwebp', ['-quiet', '-q', '82', '-alpha_q', '90', '-m', '6', '-resize', '96', '96', join(dir, png), '-o', join(OUT, `${id}.webp`)]);
  n++;
}
console.log(`${n} icons → static/room/npc/`);
