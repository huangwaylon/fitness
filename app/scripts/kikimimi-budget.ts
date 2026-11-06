// ききみみ's chunk budget (docs/kikimimi.md "Loading"; docs/curriculum-wave2.md §4 W2-C2), after `vite build` (npm run
// build runs it): the sheet's own chunk ≤ 80 KB gzipped (the code, the strings and the index: no items), the hub ≤ 25 KB,
// every other page (あそぶ, a mode, きろく, せってい, しまの みち's, frame/Sandwich once it's built) ≤ 15 KB each; each
// game's folder (src/lib/kikimimi/games/<id>/: a later game's lane.ts, its own chunk) and its views
// (src/lib/components/kikimimi/<id>/*.svelte, each lazy) ≤ 15 KB each; each level's chunk (src/lib/kikimimi/levels/parts/,
// compile.ts) ≤ 60 KB gzipped, a listening file's (content/listen/) ≤ 32 KB. Over any, the build fails: split a level
// (compile.ts PART_AIM) or move what grew.
//   node scripts/kikimimi-budget.ts
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = join(import.meta.dirname, '..');
const CLIENT = join(ROOT, '.svelte-kit/output/client');
const SHEET_MAX = 80 * 1024;
const PART_MAX = 60 * 1024;
const LISTEN_MAX = 32 * 1024;
/** The lazy pages (docs/kikimimi-ux.md §10): the hub ≤ 25 KB gzipped, each other ≤ 15 KB; a game's lane and views too. */
const HUB_MAX = 25 * 1024;
const PAGE_MAX = 15 * 1024;
const GAME_MAX = 15 * 1024;
const PAGES: [src: string, max: number][] = [
  ['hub/Hub', HUB_MAX], ['asobu/Asobu', PAGE_MAX], ['mode/ModeDetail', PAGE_MAX], ['Progress', PAGE_MAX], ['settings/KikiSettings', PAGE_MAX],
  ['path/IslandPath', PAGE_MAX], ['path/UnitPage', PAGE_MAX], ['zukan/KikiZukan', PAGE_MAX], ['zukan/Words', PAGE_MAX], ['zukan/Voices', PAGE_MAX], ['zukan/Friends', PAGE_MAX], ['zukan/Stamps', PAGE_MAX],
  ['story/StoryFrame', PAGE_MAX], ['story/StoryList', PAGE_MAX], ['onboarding/Welcome', PAGE_MAX], ['onboarding/Placed', PAGE_MAX], ['frame/Sandwich', PAGE_MAX]
];
const KIKI = 'src/lib/components/kikimimi';
const GAMES = 'src/lib/kikimimi/games';
const PARTS = 'src/lib/kikimimi/levels/parts/';

const manifest = JSON.parse(readFileSync(join(CLIENT, '.vite/manifest.json'), 'utf8')) as Record<string, { file: string }>;
const gz = (file: string) => gzipSync(readFileSync(join(CLIENT, file))).length;
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

const checks: [name: string, bytes: number, max: number][] = [];
const sheet = manifest[`${KIKI}/KikimimiSheet.svelte`];
if (!sheet) throw new Error('kikimimi-budget: no KikimimiSheet chunk in the build');
checks.push(['the sheet', gz(sheet.file), SHEET_MAX]);
for (const [src, max] of PAGES) {
  const page = manifest[`${KIKI}/${src}.svelte`];
  const name = src.split('/').at(-1)!;
  if (!existsSync(join(ROOT, `${KIKI}/${src}.svelte`))) continue; // (a page not built yet: frame/Sandwich before W2-0)
  if (!page) throw new Error(`kikimimi-budget: no ${name} chunk in the build (it must stay lazy)`);
  checks.push([name, gz(page.file), max]);
}
// each game's folder: its lane when it's a chunk of its own (a later game's), and its views (each lazy: at least one is)
for (const id of readdirSync(join(ROOT, GAMES), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const lane = manifest[`${GAMES}/${id}/lane.ts`];
  if (lane) checks.push([`${id}/lane`, gz(lane.file), GAME_MAX]);
  const dir = join(ROOT, KIKI, id);
  if (!existsSync(dir)) continue;
  const views = readdirSync(dir).filter((f) => f.endsWith('.svelte')).flatMap((f) => (manifest[`${KIKI}/${id}/${f}`] ? [[f, manifest[`${KIKI}/${id}/${f}`].file] as const] : []));
  if (!views.length) throw new Error(`kikimimi-budget: no view of ${id} is a chunk of its own (a game's views stay lazy)`);
  for (const [f, file] of views) checks.push([`${id}/${f.slice(0, -'.svelte'.length)}`, gz(file), PAGE_MAX]);
}
const listen = new Set(Object.keys((JSON.parse(readFileSync(join(ROOT, 'src/lib/kikimimi/levels/index.json'), 'utf8')) as { listen?: Record<string, unknown> }).listen ?? {}));
const parts = Object.entries(manifest).filter(([src]) => src.startsWith(PARTS));
if (!parts.length) throw new Error('kikimimi-budget: no level chunks in the build');
for (const [src, { file }] of parts) {
  const name = src.slice(PARTS.length, -'.json'.length);
  checks.push([name, gz(file), listen.has(name) ? LISTEN_MAX : PART_MAX]);
}

const over = checks.filter(([, n, max]) => n > max);
console.log(`ききみみ chunks (gzipped): ${checks.map(([name, n]) => `${name} ${kb(n)}`).join(', ')}`);
if (over.length) {
  for (const [name, n, max] of over) console.error(`kikimimi-budget: ${name} is ${kb(n)}, over ${kb(max)}`);
  process.exit(1);
}
