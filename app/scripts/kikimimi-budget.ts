// ききみみ's chunk budget (docs/kikimimi.md "Loading"), after `vite build` (npm run build runs it): the sheet's own chunk
// ≤ 80 KB gzipped (the code, the strings and the index: no items), the hub ≤ 25 KB, every other page (あそぶ, a mode,
// きろく, せってい, しまの みち's) ≤ 15 KB each, each level's chunk (src/lib/kikimimi/levels/parts/,
// compile.ts) ≤ 60 KB gzipped. Over either, the build fails: split a level (compile.ts PART_AIM) or move what grew.
//   node scripts/kikimimi-budget.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const CLIENT = join(import.meta.dirname, '../.svelte-kit/output/client');
const SHEET_MAX = 80 * 1024;
const PART_MAX = 60 * 1024;
/** The lazy pages (docs/kikimimi-ux.md §10): the hub ≤ 25 KB gzipped, each other ≤ 15 KB. */
const HUB_MAX = 25 * 1024;
const PAGE_MAX = 15 * 1024;
const PAGES: [src: string, max: number][] = [
  ['hub/Hub', HUB_MAX], ['asobu/Asobu', PAGE_MAX], ['mode/ModeDetail', PAGE_MAX], ['Progress', PAGE_MAX], ['settings/KikiSettings', PAGE_MAX],
  ['path/IslandPath', PAGE_MAX], ['path/UnitPage', PAGE_MAX], ['path/PhraseZukan', PAGE_MAX],
  ['story/StoryFrame', PAGE_MAX], ['story/StoryList', PAGE_MAX]
];

const manifest = JSON.parse(readFileSync(join(CLIENT, '.vite/manifest.json'), 'utf8')) as Record<string, { file: string }>;
const gz = (file: string) => gzipSync(readFileSync(join(CLIENT, file))).length;
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

const checks: [name: string, bytes: number, max: number][] = [];
const sheet = manifest['src/lib/components/kikimimi/KikimimiSheet.svelte'];
if (!sheet) throw new Error('kikimimi-budget: no KikimimiSheet chunk in the build');
checks.push(['the sheet', gz(sheet.file), SHEET_MAX]);
for (const [src, max] of PAGES) {
  const page = manifest[`src/lib/components/kikimimi/${src}.svelte`];
  const name = src.split('/').at(-1)!;
  if (!page) throw new Error(`kikimimi-budget: no ${name} chunk in the build (it must stay lazy)`);
  checks.push([name, gz(page.file), max]);
}
const parts = Object.entries(manifest).filter(([src]) => src.startsWith('src/lib/kikimimi/levels/parts/'));
if (!parts.length) throw new Error('kikimimi-budget: no level chunks in the build');
for (const [src, { file }] of parts) checks.push([src.slice('src/lib/kikimimi/levels/parts/'.length, -'.json'.length), gz(file), PART_MAX]);

const over = checks.filter(([, n, max]) => n > max);
console.log(`ききみみ chunks (gzipped): ${checks.map(([name, n]) => `${name} ${kb(n)}`).join(', ')}`);
if (over.length) {
  for (const [name, n, max] of over) console.error(`kikimimi-budget: ${name} is ${kb(n)}, over ${kb(max)}`);
  process.exit(1);
}
