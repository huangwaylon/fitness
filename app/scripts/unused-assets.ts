// What nothing uses any more (the unused-asset scan; docs/ops/testing.md "Unused assets"):
// every file under static/ and every module under src/, sorted into what may go (the 3D island draws NH's model and
// nothing else shows the art, or nothing names it), what stays (the tent, the ずかん, the HUD, the cards of art the 3D
// island draws for what has no model, the DOM tap areas' sizes) and what needs a look. Read-only: it deletes nothing.
//   An asset's users are the source files that name it: a literal key or path ('bushes/holly', `art/x.webp`), a
// template that builds it (`critters/${id}`: a pattern, and whether the id is spelled anywhere in the source), or a
// JSON's string. Each user is a kind (below): the island's world (its DOM node stays, but its art shows only where the
// 3D island has no model: world3d/assets.json keys), the app beyond the island (stays), a dev page or a build script
// (keeps nothing). The built chunks (build-pages/, when there is a build) are read too: a key in the shipped JS that the
// source scan missed is "unsure".
//   The modules: the import graph from the routes, the service worker and vite.config.ts (imports, import(),
// import.meta.glob, new URL(…, import.meta.url)); what it doesn't reach is listed: dead, or only the tests' and the
// build scripts' (fixtures, ききみみ's content sources compiled to levels/*.json).
//
// Usage (from app/): npm run unused [-- --json] [-- --list=safe|used|unsure] [-- --seen=/tmp/seen.txt]
//   (the probe that writes --seen's file: node scripts/unused-probe.ts <port>, with the build served)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const APP = join(import.meta.dirname, '..');
const STATIC = join(APP, 'static'), SRC = join(APP, 'src'), BUILD = join(APP, 'build-pages');
const asJson = process.argv.includes('--json');
const listArg = process.argv.find((a) => a.startsWith('--list='))?.slice(7);
/** `--seen=<file>`: what the probe (scripts/unused-probe.ts) saw on the 3D island, a static path a line: what was drawn
 *  (a visible DOM image) or loaded by the engine (a card's texture, the ground) can't be "safe". */
const seenArg = process.argv.find((a) => a.startsWith('--seen='))?.slice(7);
const SEEN = new Set(seenArg ? readFileSync(seenArg, 'utf8').split('\n').filter(Boolean) : []);

// ---- the kinds of source file ---------------------------------------------------------------------------------------

/** The island's world: its DOM nodes stay over the 3D canvas (taps, the m3 keys), but an art key named here is drawn
 *  only where the 3D island has no model for it (a card, or the node's own art: Island3D's m3off). */
const WORLD = /^lib\/components\/(island|world3d|board)\//;
/** In island/ but UI over the canvas on either island (the HUD, the plates, the speech, the balloon catalogue's
 *  presents): their art stays. */
const OVERLAY = new Set([
  'Hud.svelte', 'Jar.svelte', 'CoinFlow.svelte', 'Plate.svelte', 'CatchStack.svelte', 'catchStack.svelte.ts', 'catchCard.ts',
  'catchLine.ts', 'catchLines.ts', 'Talk.svelte', 'Says.svelte', 'SayPicker.svelte', 'SayButton.svelte',
  'PartnerNews.svelte', 'partnerNews.ts', 'catalog.ts', 'catalog.json', 'pager.ts', 'HitOverlay.svelte'
].map((f) => `lib/components/island/${f}`));
/** Dev pages and tools: what they name keeps nothing (the gallery shows every key). */
const DEV = /^(routes\/(dev|world3d)\/|lib\/components\/dev\/)/;
type Kind = 'world' | 'app' | 'dev';
const kindOf0 = (f: string): Kind =>
  // art.ts's key helpers (treeArt, flowerArt, seasonArt) are called by the island alone; its others are KNOWN below
  f === 'lib/art.ts' ? 'world' : DEV.test(f) ? 'dev' : OVERLAY.has(f) ? 'app' : WORLD.test(f) ? 'world' : 'app';
/** The island's data modules the app beyond it imports (the ずかん reads critters.ts' and beach.ts' art keys, the
 *  catch plate its icons): what they name is the app's. Filled once the import graph is read (below). */
const SHARED = new Set<string>();
const kindOf = (f: string): Kind => (SHARED.has(f) ? 'app' : kindOf0(f));

// ---- the files ------------------------------------------------------------------------------------------------------

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.DS_Store' || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const isTest = (f: string) => /\.(test|spec)\.ts$/.test(f);
const srcFiles = walk(SRC).filter((f) => /\.(ts|svelte|json|css|html|js)$/.test(f) && !isTest(f)).map((f) => relative(SRC, f));
const staticFiles = walk(STATIC).map((f) => relative(STATIC, f)).filter((f) => f !== 'art/manifest.json' && f !== 'audio/manifest.json');

// ---- the strings each source file holds ----------------------------------------------------------------------------

interface Pattern { re: RegExp; src: string }
interface Strings { lits: Set<string>; pats: Pattern[] }
const stripComments = (s: string) =>
  s.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\'"`])\/\/[^\n]*/g, '$1');
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A template literal → an anchored pattern: each ${…} one path segment's worth (no /). Only those that start with a
 *  word and a / (`critters/${id}`, `terrain/${s}/${c}.webp`): a bare `${a}/${b}` names nothing. */
function templatePattern(body: string): Pattern | null {
  let re = '', i = 0, lit = '';
  while (i < body.length) {
    if (body[i] === '$' && body[i + 1] === '{') {
      let depth = 1, j = i + 2;
      while (j < body.length && depth) {
        if (body[j] === '{') depth++;
        else if (body[j] === '}') depth--;
        j++;
      }
      re += '[^/]*';
      i = j;
    } else {
      re += esc(body[i]);
      lit += body[i];
      i++;
    }
  }
  if (!/^[a-z0-9-]+\//i.test(body)) return null;
  return { re: new RegExp(`^${re}$`), src: body };
}
function stringsOf(file: string): Strings {
  const text = readFileSync(join(SRC, file), 'utf8');
  const lits = new Set<string>(), pats: Pattern[] = [];
  if (file.endsWith('.json')) {
    const visit = (v: unknown): void => {
      if (typeof v === 'string') lits.add(v);
      else if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) (lits.add(k), visit(x));
    };
    try { visit(JSON.parse(text)); } catch { /* not JSON after all */ }
    return { lits, pats };
  }
  const code = stripComments(text);
  for (const m of code.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)) lits.add(m[1] ?? m[2]);
  for (const m of code.matchAll(/`((?:[^`\\]|\\.|\$\{(?:[^{}]|\{[^{}]*\})*\})*)`/g)) {
    const body = m[1];
    if (!body.includes('${')) lits.add(body);
    else {
      const p = templatePattern(body);
      if (p) pats.push(p);
      // the quoted strings inside its ${…} (a ternary's 'fall' : 'summer') are the source's too
      for (const q of body.matchAll(/'([^'\n]*)'/g)) lits.add(q[1]);
    }
  }
  // a prefix concatenated on ('room/homes/' + id): a pattern of its own
  for (const s of lits) if (/^[a-z0-9-]+(\/[a-z0-9-]+)*\/$/i.test(s)) pats.push({ re: new RegExp(`^${esc(s)}[^/]+$`), src: `${s}…` });
  return { lits, pats };
}
const strings = new Map(srcFiles.map((f) => [f, stringsOf(f)]));
/** Every literal in the source (any file): a pattern's id is "spelled" when its varying part is one of these. */
const allLits = new Set<string>();
for (const s of strings.values()) for (const l of s.lits) allLits.add(l);

// ---- the 3D island's models ----------------------------------------------------------------------------------------

const ASSETS = JSON.parse(readFileSync(join(SRC, 'lib/components/world3d/assets.json'), 'utf8')) as { keys: Record<string, { m: string; standIn?: number }> };
const modelOf = (key: string) => ASSETS.keys[key]?.m ?? null;

// ---- the built chunks -----------------------------------------------------------------------------------------------

const built = existsSync(join(BUILD, '_app')) ? walk(join(BUILD, '_app')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n') : null;

// ---- the modules ----------------------------------------------------------------------------------------------------

const modFiles = srcFiles.filter((f) => /\.(ts|svelte|js|json)$/.test(f));
const modSet = new Set(modFiles);
function resolveImport(from: string, spec: string): string | null {
  let p: string;
  if (spec.startsWith('#lib/') || spec.startsWith('$lib/')) p = join('lib', spec.slice(5));
  else if (spec.startsWith('.')) p = relative(SRC, resolve(SRC, dirname(from), spec));
  else return null;
  p = p.replace(/\?.*$/, ''); // Vite's queries: ?worker, ?url, ?raw
  for (const c of [p, `${p}.ts`, `${p}.svelte`, `${p}/index.ts`]) if (modSet.has(c)) return c;
  return null;
}
/** An import.meta.glob pattern (relative to `from`, or #lib/) → the modules it matches: `*` within a path segment,
 *  `**` across them, `{a,b}`; a negated one (`!…`) matches nothing (the scan errs toward reached). */
function globImports(from: string, pat: string): string[] {
  if (pat.startsWith('!')) return [];
  const abs = pat.startsWith('#lib/') || pat.startsWith('$lib/') ? join('lib', pat.slice(5)) : pat.startsWith('.') ? relative(SRC, resolve(SRC, dirname(from), pat)) : null;
  if (!abs || abs.startsWith('..')) return [];
  const re = new RegExp(`^${abs.split('**/').map((s) => esc(s).replace(/\\\*/g, '[^/]*').replace(/\\\{([^}]*)\\\}/g, (_, a: string) => `(?:${a.split(',').join('|')})`)).join('(?:.*/)?')}$`);
  return modFiles.filter((m) => re.test(m));
}
const edges = new Map<string, { to: string }[]>();
const importsIn = (f: string, text: string): { to: string }[] => {
  const out: { to: string }[] = [];
  // static and dynamic imports, and `new URL('./x', import.meta.url)` (a Worker's, a worklet's)
  for (const m of text.matchAll(/(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]|new URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url/g)) {
    const to = resolveImport(f, m[1] ?? m[2] ?? m[3] ?? m[4]);
    if (to) out.push({ to });
  }
  // import.meta.glob('…') and import.meta.glob(['…', '…'])
  for (const m of text.matchAll(/import\.meta\.glob\s*(?:<[^(]*>)?\(\s*(\[[^\]]*\]|'[^']*'|"[^"]*")/g))
    for (const p of m[1].matchAll(/['"]([^'"]+)['"]/g)) for (const to of globImports(f, p[1])) out.push({ to });
  return out;
};
for (const f of modFiles) {
  if (f.endsWith('.json')) continue;
  edges.set(f, importsIn(f, readFileSync(join(SRC, f), 'utf8')));
}
// vite.config.ts is a root too (its plugins import src modules: world3d/basisModule.ts); `from` as if it sat in src/
// one level up, so its ./src/… specs resolve
const viteRoot = '../vite.config.ts';
edges.set(viteRoot, importsIn('x', readFileSync(join(APP, 'vite.config.ts'), 'utf8').replace(/(['"])\.\/src\//g, '$1./')));
const roots = [viteRoot, ...modFiles.filter((f) => /^routes\/.*\+(page|layout|error)(\.server)?\.(svelte|ts)$/.test(f) || f === 'service-worker/index.ts' || /^hooks/.test(f))];
function reach(): Set<string> {
  const seen = new Set<string>(), stack = [...roots];
  while (stack.length) {
    const f = stack.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    for (const e of edges.get(f) ?? []) stack.push(e.to);
  }
  return seen;
}
// the island's data the app's own modules import (the ずかん: critters.ts, beach.ts, sea.ts, pondFish.ts, catalog.ts):
// what they name is the app's. One step only, and not world.ts: the app reads its positions (the walk, the relay's
// checks, the sound's surfaces), while its art keys (the scenery) are the island's to draw.
for (const f of modFiles) {
  if (kindOf0(f) !== 'app' || /^lib\/components\/(island|board)\//.test(f)) continue;
  for (const e of edges.get(f) ?? []) if (/^lib\/components\/(island|board)\/.*\.(ts|json)$/.test(e.to) && e.to !== 'lib/components/island/world.ts' && kindOf0(e.to) === 'world') SHARED.add(e.to);
}
const now = reach();
const unreachedNow = modFiles.filter((f) => !now.has(f) && !f.endsWith('.json') && !f.startsWith('service-worker/') && !f.endsWith('.d.ts')).sort();
/** world.ts's exports and who still reads each. */
const worldTs = readFileSync(join(SRC, 'lib/components/island/world.ts'), 'utf8');
const worldExports = [...worldTs.matchAll(/^export (?:const|function|type|interface) ([A-Za-z_]\w*)/gm)].map((m) => m[1]);
const readers = Object.fromEntries(worldExports.map((x) => [x, [...now].filter((f) => {
  if (f === 'lib/components/island/world.ts' || !(edges.get(f) ?? []).some((e) => e.to === 'lib/components/island/world.ts')) return false;
  return new RegExp(`\\b${x}\\b`).test(readFileSync(join(SRC, f), 'utf8'));
}).map((f) => f.replace(/^lib\/components\//, ''))]));

// ---- each static file's users ---------------------------------------------------------------------------------------

interface Use { file: string; kind: Kind; how: 'literal' | 'pattern'; spelled?: boolean; via: string }
interface Row { path: string; bytes: number; key: string; model: string | null; uses: Use[]; cat: 'safe' | 'used' | 'unsure'; why: string }

function keyOf(path: string): string {
  return path.startsWith('art/') ? path.slice(4).replace(/\.webp$/, '') : path.replace(/\.[a-z0-9]+$/, '');
}
function usesOf(path: string, key: string): Use[] {
  const out: Use[] = [];
  const forms = new Set([key, path, path.replace(/\.[a-z0-9]+$/, ''), `art/${key}`]);
  for (const [file, s] of strings) {
    const kind = kindOf(file);
    let lit = [...forms].find((f) => s.lits.has(f));
    // a longer literal holding the path (a URL, `static/art/…`)
    lit ??= [...s.lits].find((l) => l.length > path.length && l.includes(path));
    if (lit) {
      out.push({ file, kind, how: 'literal', via: lit });
      continue;
    }
    for (const p of s.pats) {
      const hit = [...forms].find((f) => p.re.test(f));
      if (!hit) continue;
      // the varying part: what's left of the key after the pattern's fixed head
      const head = p.src.slice(0, p.src.indexOf('${') >= 0 ? p.src.indexOf('${') : p.src.length - 1);
      const rest = hit.startsWith(head) ? hit.slice(head.length) : hit;
      const spelled = allLits.has(rest) || allLits.has(rest.replace(/\.[a-z0-9]+$/, '')) || allLits.has(rest.replace(/-(winter|lit|icon)$/, ''));
      out.push({ file, kind, how: 'pattern', spelled, via: p.src });
      break;
    }
  }
  return out;
}

/** Hand-checked users the scan can't see (the key built from data it doesn't read, a name in CSS): path prefix → why. */
const KNOWN: [RegExp, Row['cat'], string][] = [
  [/^art\/villagers\//, 'used', 'the villagers: the roster, the HUD, the tent, and the 3D island’s cards for a villager with no 3D model (has3d)'],
  [/^art\/host\//, 'used', 'しずえ / Tom Nook (Host.svelte: the news box, the sheets, the error page)'],
  [/^art\/finds\/(items|recipes)\//, 'used', 'the balloon catalogue’s icons (catalog.json: the presents, the ずかん, the tent’s items)'],
  [/^art\/(reactions|money|fruit3d)\//, 'used', 'UI art: emotes and しずえ’s reactions, the ベル / leaf, the HUD’s fruit'],
  [/^audio\//, 'used', 'audio (sound/manifest.ts)'],
  [/^icons\//, 'used', 'the app icons (the web manifest, app.html)'],
  [/^manifest\.webmanifest$/, 'used', 'the web manifest'],
  [/^room\//, 'used', 'the 3D models and the tent’s room (room/world3d is the 3D island’s)'],
  [/^terrain\/nh\//, 'used', 'NH’s ground textures for the layout’s live terrain (world3d/terrain.ts)'],
  [/^art\/season\//, 'used', 'the falling petals, leaves and snowflakes the DOM still draws over the 3D island (a tapped bush’s rustle, a shaken tree: seen drawn in the probe), and the 3D floats’ cards'],
  [/^food\//, 'used', 'the meal log’s food data (lib/food/load.ts: fetched by name from its index)'],
  // kept by hand though the scan calls them safe (the DOM over the 3D island still shows or measures them):
  [/^art\/(flowers|trees)\//, 'used', 'a DOM tap area’s size or clip over the 3D model comes from its art (Flowers’ .fl, Scenery’s oak layers)'],
  [/^art\/items\/candy\.webp$|^art\/deco\/party-popper\.webp$/, 'used', 'drawn by the DOM over the 3D island (Jack’s treat, the birthday popper)'],
  [/^art\/deco\/birthday-cake\.webp$/, 'used', 'the cake’s tap box is its art’s (Cake.svelte)'],
  [/^art\/deco\/(bamboo-shoot-lamp|bulletin-board-winter|egg-arch|illumi-tree|kadomatsu|mushroom-lamp|nut-lamp|picnic-set|pond-stone-(maple|sakura)|present|pumpkin|shishiodoshi-tip|snowboy-\d|spooky-lantern|wedding-arch)\.webp$/, 'used', 'the event and seasonal pieces: hidden under their 3D models, but the specs read their nodes’ art (a later cleanup: check their models instead)']
];

const rows: Row[] = staticFiles.map((path) => {
  const key = keyOf(path), bytes = statSync(join(STATIC, path)).size;
  const uses = usesOf(path, key), model = path.startsWith('art/') ? modelOf(key) : null;
  const known = KNOWN.find(([re]) => re.test(path));
  const row: Row = { path, bytes, key, model, uses, cat: 'unsure', why: '' };
  if (known) return { ...row, cat: known[1], why: known[2] };
  const strong = (u: Use) => u.how === 'literal' || u.spelled;
  const app = uses.filter((u) => u.kind === 'app'), world = uses.filter((u) => u.kind === 'world');
  const name = (us: Use[]) => [...new Set(us.map((u) => u.file.replace(/^lib\/components\//, '')))].slice(0, 3).join(', ');
  if (app.some(strong)) return { ...row, cat: 'used', why: `named by the app beyond the island: ${name(app.filter(strong))}` };
  if (world.some(strong)) {
    if (!path.startsWith('art/')) return { ...row, cat: 'used', why: `the 3D island’s: ${name(world)}` };
    // a layer or a look of a thing the 3D island has a model for (an oak's -trunk / -canopy, a lamp's -lit head)
    const base = key.replace(/-(trunk|canopy|lit)$/, '');
    if (!model && base !== key && modelOf(base)) return { ...row, cat: 'safe', why: `a layer of ${base}’s 2D sprite; the 3D island draws NH’s model ${modelOf(base)}` };
    if (!model) return { ...row, cat: 'used', why: `no 3D model: the 3D island draws this art (a card, or the node’s own art): ${name(world)}` };
    // a model for it: its art was the 2D island's alone, unless something beyond the island names it loosely
    // the ずかん's data builds it (`finds/${id}` in beach.ts): its icon in the ずかん and on the catch plate
    if (app.some((u) => SHARED.has(u.file))) return { ...row, cat: 'used', why: `the ずかん’s and the catch plate’s icon (built by ${name(app.filter((u) => SHARED.has(u.file)))})` };
    if (app.length) return { ...row, cat: 'unsure', why: `a model (${model}); a loose pattern beyond the island too: ${name(app)}` };
    if (built && !built.includes(key) && world.every((u) => u.how === 'literal')) return { ...row, cat: 'safe', why: `the 3D island draws NH’s model ${model} (not in the built JS by name)` };
    return { ...row, cat: 'safe', why: `the 3D island draws NH’s model ${model}; the art only the 2D island’s (${name(world)})` };
  }
  if (app.length || world.length) return { ...row, cat: 'unsure', why: `matched only by a pattern whose id isn’t spelled in the source: ${name([...app, ...world])}` };
  const dev = uses.filter((u) => u.kind === 'dev');
  if (built && built.includes(key.split('/').pop()!) && key.length > 6) return { ...row, cat: 'unsure', why: 'no source names it, but its name is in the built JS' };
  if (dev.length) return { ...row, cat: 'safe', why: `only a dev page names it (${name(dev)}): unused today` };
  return { ...row, cat: 'safe', why: 'nothing names it: unused today' };
});

for (const r of rows) if (r.cat === 'safe' && SEEN.has(r.path)) Object.assign(r, { cat: 'unsure', why: `the probe saw the 3D island draw or load it (${r.why})` });

// ---- the report ----------------------------------------------------------------------------------------------------

const MB = (b: number) => `${(b / 1048576).toFixed(2)} MB`;
const cats = ['safe', 'used', 'unsure'] as const;
const sum = Object.fromEntries(cats.map((c) => {
  const rs = rows.filter((r) => r.cat === c);
  return [c, { files: rs.length, bytes: rs.reduce((n, r) => n + r.bytes, 0) }];
}));
if (asJson) {
  console.log(JSON.stringify({ summary: sum, rows: rows.map(({ uses, ...r }) => ({ ...r, users: [...new Set(uses.map((u) => u.file))] })), unreachedNow, worldReaders: readers }, null, 1));
} else if (listArg) {
  for (const r of rows.filter((r) => r.cat === listArg)) console.log(`${r.path}\t${r.bytes}\t${r.why}`);
} else {
  console.log(`island modules the app reads (their keys count as the app’s): ${[...SHARED].sort().join(", ")}\n`);
  console.log(`static/: ${rows.length} files${built ? '' : ' (no build-pages/: the built JS not checked; npm run build first)'}`);
  for (const c of cats) console.log(`  ${c.padEnd(6)} ${String(sum[c].files).padStart(5)} files  ${MB(sum[c].bytes).padStart(10)}`);
  // grouped by folder and reason
  for (const c of cats) {
    console.log(`\n## ${c}`);
    const g = new Map<string, { n: number; b: number; why: Set<string> }>();
    for (const r of rows.filter((r) => r.cat === c)) {
      const parts = r.path.split('/'), deep = /^(art\/finds|room\/world3d)\/[^/]+\//.test(r.path);
      const dir = parts.slice(0, deep ? 3 : 2).join('/') + (parts.length > (deep ? 3 : 2) ? '/' : '');
      const e = g.get(dir) ?? { n: 0, b: 0, why: new Set() };
      e.n++;
      e.b += r.bytes;
      e.why.add(r.why.replace(/NH’s model \S+/g, 'NH’s model').replace(/\(built by [^)]*\)/, '').replace(/a layer of \S+/, 'a layer of a modelled thing'));
      g.set(dir, e);
    }
    for (const [dir, e] of [...g].sort((a, b) => b[1].b - a[1].b)) console.log(`  ${dir.padEnd(30)} ${String(e.n).padStart(5)}  ${MB(e.b).padStart(9)}  ${[...e.why].slice(0, 3).join(' | ')}`);
  }
  console.log('\n## modules the app never reaches (dead, or only the tests\' and the build scripts\')');
  for (const f of unreachedNow) console.log(`  ${f}`);
  console.log('\n## world.ts exports still read');
  for (const [x, rs] of Object.entries(readers)) console.log(`  ${x.padEnd(16)} ${rs.length ? rs.join(', ') : '— (nobody: world.ts-internal)'}`);
}
