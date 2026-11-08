// What the gate's e2e run for a push (docs/ops/testing.md "The gate"): the core gate set (e2e/gate.json), the specs
// the push changed, each test 3× and never retried (playwright.config.ts E2E_X3), and the specs its other files
// reach: a changed e2e helper, its importers; a src or content file, e2e/impact.json's rules (else its own name). A
// file nothing maps (a store, the config, a fixture, the package) adds nothing: the gate set, and the full logic tier
// after the deploy. Over the budget (CAP_MS of tests by e2e/timings.json, ~110 s a gate shard), the changed specs run
// once, then the reached ones drop out: the gate set only.
//
//   node scripts/e2e-impact.ts [--base <rev>] [--out <dir>]
//     the base: --base, else the last commit deployed (the cloudflare-pages environment's newest successful
//     deployment, the GitHub API), else HEAD~1. Runs get superseded, so a push's base is the live site, never the push
//     before. <dir>/specs.txt and <dir>/x3.txt (e2e/ paths, one a line); Markdown for the job summary on stdout.
//   node scripts/e2e-impact.ts --changed <base>
//     the specs changed since <base> (the working tree too), one a line: `npm run e2e:ci-like -- --changed`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CAP_MS = 1_300_000, MAX_CHANGED = 8, MAX_IMPORTERS = 10, UNTIMED_MS = 60_000;
type Rule = [glob: string, specs: string[]];
export type Ctx = {
  /** every spec file's name (tent.spec.ts) */
  specs: string[];
  /** an e2e helper (island.ts) → the specs that import it, directly or through another helper */
  importers: Map<string, string[]>;
  rules: Rule[];
  gate: string[];
  /** a spec's tests' time, ms */
  cost: (spec: string) => number;
};
export type Selection = { gate: string[]; x3: string[]; reached: Map<string, string>; gateOnly: string[]; notes: string[]; ms: number };

const reOf = (glob: string) =>
  new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\?/g, '[^/]').replace(/\*\*\/?/g, '\u0000').replace(/\*/g, '([^/]*?)').replace(/\u0000/g, '.*')}$`);
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** the specs a file (under app/) maps to: the first rule with specs that exist, else its name's */
export function mapFile(file: string, ctx: Pick<Ctx, 'rules' | 'specs'>): string[] {
  const named = (pattern: string) => ctx.specs.filter((s) => reOf(`${pattern}.spec.ts`).test(s));
  for (const [glob, pats] of ctx.rules) {
    const m = reOf(glob).exec(file);
    if (!m) continue;
    const hit = [...new Set(pats.flatMap((p) => named(p.replace(/\$1/g, m[1] ?? ''))))];
    if (hit.length) return hit.sort();
  }
  const stem = kebab(file.split('/').pop()!.replace(/\..*$/, ''));
  return file.startsWith('src/') && stem.length >= 4 ? named(`${stem}*`) : [];
}

/** the gate's e2e for these changed files (paths under app/) */
export function select(changed: string[], ctx: Ctx): Selection {
  const has = new Set(ctx.specs);
  const changedSpecs: string[] = [], reached = new Map<string, string>(), gateOnly: string[] = [], notes: string[] = [];
  const reach = (spec: string, why: string) => reached.has(spec) || reached.set(spec, why);
  for (const f of changed) {
    const e2e = /^e2e\/([^/]+)$/.exec(f)?.[1];
    if (e2e && has.has(e2e)) changedSpecs.push(e2e);
    else if (e2e && ctx.importers.has(e2e)) {
      const by = ctx.importers.get(e2e)!;
      if (by.length > MAX_IMPORTERS) notes.push(`${f}: ${by.length} specs import it, over ${MAX_IMPORTERS}: the gate set for it`);
      else by.forEach((s) => reach(s, f));
    } else if (/\.test\.ts$/.test(f)) continue; // vitest's: the checks
    else {
      const specs = mapFile(f, ctx);
      if (specs.length) specs.forEach((s) => reach(s, f));
      else gateOnly.push(f);
    }
  }
  const sum = (xs: string[]) => xs.reduce((a, s) => a + ctx.cost(s), 0);
  const gate = ctx.gate.filter((s) => has.has(s));
  let x3 = changedSpecs.sort();
  if (x3.length > MAX_CHANGED) {
    notes.push(`${x3.length} specs changed, over ${MAX_CHANGED} (a sweep): each runs once`);
    x3.forEach((s) => reach(s, 'changed'));
    x3 = [];
  }
  let ms = sum(gate) + 3 * sum(x3);
  if (ms > CAP_MS) {
    notes.push(`the changed specs 3× are over the budget (${Math.round(ms / 1000)} s): each runs once`);
    x3.forEach((s) => reach(s, 'changed'));
    x3 = [];
    ms = sum(gate);
  }
  for (const s of [...gate, ...x3]) reached.delete(s);
  const more = sum([...reached.keys()]);
  if (ms + more > CAP_MS) {
    notes.push(`${reached.size} specs reached (${Math.round(more / 1000)} s) are over the budget: the gate set only`);
    reached.clear();
  } else ms += more;
  return { gate, x3, reached, gateOnly, notes, ms };
}

const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 << 20 }).trim();
const isCommit = (rev: string) => { try { git('cat-file', '-e', `${rev}^{commit}`); return true; } catch { return false; } };
const isAncestor = (rev: string) => { try { git('merge-base', '--is-ancestor', rev, 'HEAD'); return true; } catch { return false; } };

/** the commit live on the site: the cloudflare-pages environment's newest successful deployment */
async function deployed(): Promise<string> {
  const repo = process.env.GITHUB_REPOSITORY ?? execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim();
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
  const signal = AbortSignal.timeout(6000);
  const api = async <T>(path: string) => {
    const r = await fetch(`https://api.github.com/repos/${repo}/${path}`, { signal, headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    return (await r.json()) as T;
  };
  for (const d of await api<{ id: number; sha: string }[]>('deployments?environment=cloudflare-pages&per_page=10')) {
    const [s] = await api<{ state: string }[]>(`deployments/${d.id}/statuses?per_page=1`);
    if (s?.state === 'success') return d.sha;
  }
  throw new Error('no successful deployment');
}

function context(): Ctx {
  const specs = readdirSync('e2e').filter((f) => f.endsWith('.spec.ts')).sort();
  // the helpers' import graph: e2e/*.ts importing './x.ts'
  const imports = new Map<string, string[]>();
  for (const f of readdirSync('e2e').filter((f) => f.endsWith('.ts')))
    imports.set(f, [...readFileSync(join('e2e', f), 'utf8').matchAll(/from '\.\/([\w.-]+?)(?:\.ts)?'/g)].map((m) => `${m[1]}.ts`));
  const importers = new Map<string, string[]>();
  for (const h of imports.keys()) {
    if (h.endsWith('.spec.ts') || h === 'fixtures.ts') continue; // (fixtures.ts: every spec's: the gate set)
    importers.set(h, specs.filter((s) => {
      const seen = new Set<string>(), todo = [s];
      while (todo.length) for (const i of imports.get(todo.pop()!) ?? []) if (!seen.has(i)) (seen.add(i), todo.push(i));
      return seen.has(h);
    }));
  }
  const times: Record<string, number> = JSON.parse(readFileSync('e2e/timings.json', 'utf8'));
  const perFile = new Map<string, number>();
  for (const [k, ms] of Object.entries(times)) perFile.set(k.split(' › ')[0], (perFile.get(k.split(' › ')[0]) ?? 0) + ms);
  return {
    specs,
    importers,
    rules: (JSON.parse(readFileSync('e2e/impact.json', 'utf8')) as { rules: Rule[] }).rules,
    gate: Object.keys((JSON.parse(readFileSync('e2e/gate.json', 'utf8')) as { specs: Record<string, string> }).specs),
    cost: (s) => perFile.get(s) ?? UNTIMED_MS
  };
}

/** the changed files under app/, relative to it (deleted ones left out) */
function changedSince(base: string, head?: string) {
  return git('diff', '--name-only', '--no-renames', '--diff-filter=d', base, ...(head ? [head] : []), '--', '.')
    .split('\n')
    .filter(Boolean)
    .map((f) => f.replace(/^app\//, ''));
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : '');
  process.chdir(join(git('rev-parse', '--show-toplevel'), 'app'));
  if (args.includes('--changed')) {
    const base = opt('--changed');
    const specs = changedSince(isCommit(base) ? base : 'HEAD~1').filter((f) => /^e2e\/[^/]+\.spec\.ts$/.test(f));
    if (specs.length > MAX_CHANGED) console.error(`e2e-impact: ${specs.length} specs changed (over ${MAX_CHANGED}: a sweep)`);
    else if (specs.length) console.log(specs.join('\n'));
    process.exit(0);
  }
  let base = opt('--base'), from = 'given';
  if (!base || !isCommit(base) || /^0+$/.test(base)) {
    try {
      base = await deployed();
      from = 'live on the site';
    } catch (e) {
      base = '';
      from = `the last deploy unknown (${(e as Error).message})`;
    }
  }
  if (!base || !isCommit(base) || !isAncestor(base)) (base = 'HEAD~1'), (from += ': HEAD~1');
  const head = git('rev-parse', 'HEAD');
  const ctx = context();
  const sel = select(changedSince(base, head), ctx);
  const out = opt('--out');
  if (out) {
    mkdirSync(out, { recursive: true });
    const lines = (xs: string[]) => xs.map((s) => `e2e/${s}\n`).join('');
    writeFileSync(join(out, 'specs.txt'), lines([...new Set([...sel.gate, ...sel.reached.keys()])].sort()));
    writeFileSync(join(out, 'x3.txt'), lines(sel.x3));
  }
  const n = sel.gate.length + sel.reached.size + sel.x3.length;
  const short = (r: string) => git('rev-parse', '--short=8', r);
  console.log(`### The gate's e2e: ${n} spec files, ~${Math.round(sel.ms / 1000)} s of tests\n`);
  console.log(`Changes since ${short(base)} (${from}) to ${short(head)}.\n`);
  console.log(`- the gate set (e2e/gate.json): ${sel.gate.length} files`);
  if (sel.x3.length) console.log(`- changed, each test 3× (no retry): ${sel.x3.join(', ')}`);
  if (sel.reached.size) console.log(`- reached by the change: ${[...sel.reached].map(([s, why]) => `${s} (${why})`).join(', ')}`);
  if (sel.gateOnly.length) console.log(`- mapped to no spec (the gate set covers them; the full logic tier after the deploy): ${sel.gateOnly.slice(0, 12).join(', ')}${sel.gateOnly.length > 12 ? `, +${sel.gateOnly.length - 12} more` : ''}`);
  for (const note of sel.notes) console.log(`- ${note}`);
  console.log();
}
