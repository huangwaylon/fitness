// What the gate's e2e run for a push (docs/ops/testing.md "The gate"): the core gate set (e2e/gate.json), the specs
// the push changed, each test 3× and never retried (playwright.config.ts E2E_X3), and the specs its other files
// reach: a changed e2e helper, its importers; a src or content file, e2e/impact.json's rules (else its own name). A
// file nothing maps (a store, the config, a fixture, the package) adds nothing: the gate set, and the full logic tier
// after the deploy. Over the budget (CAP_MS of tests by e2e/timings.json, ~110 s a gate shard) the reached ones drop
// out first, then the changed specs run once each; a changed spec always runs, but in a sweep (over 8): cheapest first
// up to the budget. A base thousands of files away (over 500) or meeting HEAD only at the first commit (a rewritten
// history) is no base.
//
//   node scripts/e2e-impact.ts [--base <rev>] [--out <dir>]
//     the base: --base, else the last commit deployed (the cloudflare-pages environment's newest successful
//     deployment; that API down, the newest green Deploy UI run's commit). Runs get superseded, so a push's base is
//     the live site, never the push before. Not an ancestor (a force push): where it and HEAD meet. No base at all:
//     the gate set and more specs up to the budget, and a ::warning. <dir>/specs.txt and <dir>/x3.txt (e2e/ paths,
//     one a line), <dir>/changed.txt (the changed files: scripts/e2e-missed.ts names them when the full tier finds a
//     spec the gate missed); Markdown for the job summary on stdout.
//   node scripts/e2e-impact.ts --changed <base>
//     the specs changed since this branch left <base> (three-dot; the working tree too), one a line:
//     `npm run e2e:ci-like -- --changed`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CAP_MS = 1_300_000, MAX_CHANGED = 8, MAX_IMPORTERS = 10, UNTIMED_MS = 60_000, MAX_FILES = 500;
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
export type Selection = { gate: string[]; x3: string[]; once: string[]; reached: Map<string, string>; gateOnly: string[]; notes: string[]; ms: number };

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
  // the changed specs run 3× each, or once over the budget (the reached ones drop out first); a sweep once each up to it
  let x3 = [...new Set(changedSpecs)].sort(), once: string[] = [];
  if (x3.length > MAX_CHANGED) {
    // (a sweep: once each, cheapest first, up to the budget beside the gate set; the rest are the full tier's)
    let room = CAP_MS - sum(gate);
    const more = x3.filter((s) => !gate.includes(s)).sort((a, b) => ctx.cost(a) - ctx.cost(b) || a.localeCompare(b));
    once = more.filter((s) => (room -= ctx.cost(s)) >= 0).sort();
    const left = more.length - once.length;
    notes.push(`${x3.length} specs changed, over ${MAX_CHANGED} (a sweep): each runs once${left ? `, the cheapest up to the budget (${left} left to the full logic tier)` : ''}`);
    x3 = [];
  }
  for (const s of [...gate, ...x3, ...once]) reached.delete(s);
  let ms = sum(gate) + 3 * sum(x3) + sum(once);
  const more = sum([...reached.keys()]);
  if (ms + more > CAP_MS && reached.size) {
    notes.push(`${reached.size} specs reached (${Math.round(more / 1000)} s) are over the budget: left out`);
    reached.clear();
  } else ms += more;
  if (ms > CAP_MS && x3.length) {
    notes.push(`the changed specs 3× are over the budget (${Math.round(ms / 1000)} s): each runs once`);
    [once, x3] = [x3, []];
    ms = sum(gate) + sum(once);
  }
  return { gate, x3, once, reached, gateOnly, notes, ms };
}

/** no base to diff against: the gate set, then the other specs, cheapest first, up to the budget */
export function fill(ctx: Ctx): Selection {
  const gate = ctx.gate.filter((s) => ctx.specs.includes(s));
  let ms = gate.reduce((a, s) => a + ctx.cost(s), 0);
  const reached = new Map<string, string>();
  for (const s of ctx.specs.filter((s) => !gate.includes(s)).sort((a, b) => ctx.cost(a) - ctx.cost(b) || a.localeCompare(b))) {
    if (ms + ctx.cost(s) > CAP_MS) break;
    reached.set(s, 'no base: up to the budget');
    ms += ctx.cost(s);
  }
  return { gate, x3: [], once: [], reached, gateOnly: [], notes: [`no base to diff against: the gate set and ${reached.size} more specs up to the budget`], ms };
}

const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const tryGit = (...a: string[]) => { try { return git(...a); } catch { return ''; } };
const isCommit = (rev: string) => !!rev && !/^0+$/.test(rev) && tryGit('cat-file', '-t', `${rev}^{commit}`) === 'commit';
/** the point to diff from: <rev> itself, else (force-pushed away) where it and HEAD meet; '' if they never do */
const isAncestor = (rev: string) => { try { git('merge-base', '--is-ancestor', rev, 'HEAD'); return true; } catch { return false; } };
const short = (r: string) => git('rev-parse', '--short=8', r);
const forkPoint = (rev: string) => (isAncestor(rev) ? git('rev-parse', rev) : tryGit('merge-base', rev, 'HEAD'));

/** the commit live on the site: the cloudflare-pages environment's newest successful deployment; else (that API down)
 *  the newest green Deploy UI run's on main (a push or a dispatch from this repo, not this run) */
async function deployed(): Promise<{ sha: string; from: string }> {
  const repo = process.env.GITHUB_REPOSITORY ?? execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim();
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
  const api = async <T>(path: string) => {
    const r = await fetch(`https://api.github.com/repos/${repo}/${path}`, { signal: AbortSignal.timeout(6000), headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(`${path.split('?')[0]}: ${r.status}`);
    return (await r.json()) as T;
  };
  const why: string[] = [];
  try {
    for (const d of await api<{ id: number; sha: string }[]>('deployments?environment=cloudflare-pages&per_page=10')) {
      const [s] = await api<{ state: string }[]>(`deployments/${d.id}/statuses?per_page=1`);
      if (s?.state === 'success') return { sha: d.sha, from: 'live on the site' };
    }
    why.push('no successful deployment');
  } catch (e) {
    why.push((e as Error).message);
  }
  try {
    type Run = { id: number; event: string; head_sha: string; repository: { id: number }; head_repository?: { id: number } };
    const { workflow_runs } = await api<{ workflow_runs: Run[] }>('actions/workflows/pages.yml/runs?branch=main&status=success&per_page=20');
    const run = workflow_runs.find((r) => String(r.id) !== process.env.GITHUB_RUN_ID && ['push', 'workflow_dispatch'].includes(r.event) && r.head_repository?.id === r.repository.id);
    if (run) return { sha: run.head_sha, from: `the last green Deploy UI run, ${run.id} (deployments: ${why[0]})` };
    why.push('no green Deploy UI run');
  } catch (e) {
    why.push((e as Error).message);
  }
  throw new Error(why.join('; '));
}

/** the repo's own: its specs, their helpers' importers, impact.json's rules, the gate set, timings.json's costs (`app`: app/) */
export function context(app = '.'): Ctx {
  const e2e = join(app, 'e2e');
  const specs = readdirSync(e2e).filter((f) => f.endsWith('.spec.ts')).sort();
  // the helpers' import graph: e2e/*.ts importing './x.ts'
  const imports = new Map<string, string[]>();
  for (const f of readdirSync(e2e).filter((f) => f.endsWith('.ts')))
    imports.set(f, [...readFileSync(join(e2e, f), 'utf8').matchAll(/from '\.\/([\w.-]+?)(?:\.ts)?'/g)].map((m) => `${m[1]}.ts`));
  const importers = new Map<string, string[]>();
  for (const h of imports.keys()) {
    if (h.endsWith('.spec.ts') || h === 'fixtures.ts') continue; // (fixtures.ts: every spec's: the gate set)
    importers.set(h, specs.filter((s) => {
      const seen = new Set<string>(), todo = [s];
      while (todo.length) for (const i of imports.get(todo.pop()!) ?? []) if (!seen.has(i)) (seen.add(i), todo.push(i));
      return seen.has(h);
    }));
  }
  const times: Record<string, number> = JSON.parse(readFileSync(join(e2e, 'timings.json'), 'utf8'));
  const perFile = new Map<string, number>();
  for (const [k, ms] of Object.entries(times)) perFile.set(k.split(' › ')[0], (perFile.get(k.split(' › ')[0]) ?? 0) + ms);
  return {
    specs,
    importers,
    rules: (JSON.parse(readFileSync(join(e2e, 'impact.json'), 'utf8')) as { rules: Rule[] }).rules,
    gate: Object.keys((JSON.parse(readFileSync(join(e2e, 'gate.json'), 'utf8')) as { specs: Record<string, string> }).specs),
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
    // (three-dot: what this branch changed since it left <base>, the working tree too; not what <base> did since)
    const base = opt('--changed');
    const specs = changedSince((isCommit(base) && tryGit('merge-base', base, 'HEAD')) || 'HEAD~1').filter((f) => /^e2e\/[^/]+\.spec\.ts$/.test(f));
    if (specs.length > MAX_CHANGED) console.error(`e2e-impact: ${specs.length} specs changed (over ${MAX_CHANGED}: a sweep)`);
    else if (specs.length) console.log(specs.join('\n'));
    process.exit(0);
  }
  let base = opt('--base'), from = 'given';
  if (!isCommit(base)) {
    try {
      ({ sha: base, from } = await deployed());
    } catch (e) {
      (base = ''), (from = `the last deploy unknown: ${(e as Error).message.split('\n')[0]}`);
    }
  }
  // (a deploy force-pushed away: not in the clone till fetched by its sha)
  if (/^[0-9a-f]{40}$/.test(base) && !isCommit(base)) tryGit('fetch', '--quiet', '--no-tags', '--filter=blob:none', 'origin', base);
  let point = isCommit(base) ? forkPoint(base) : '';
  if (point && point !== git('rev-parse', base)) from += `; not an ancestor (a force push): from where it and HEAD meet`;
  if (base && !point) from += `; ${base.slice(0, 8)} not in the history`;
  const head = git('rev-parse', 'HEAD');
  const ctx = context();
  let changed = point ? changedSince(point, head) : [];
  // (a history rewritten under the base: it meets HEAD only at the first commit, or thousands of files apart: no base)
  if (point && (!tryGit('rev-parse', '--verify', '--quiet', `${point}^`) || changed.length > MAX_FILES)) {
    from += `; ${short(point)} is ${changed.length > MAX_FILES ? `${changed.length} files from HEAD (over ${MAX_FILES})` : 'the first commit'}: no base`;
    [point, changed] = ['', []];
  }
  const sel = point ? select(changed, ctx) : fill(ctx);
  // (a workflow command, on stderr: stdout is the summary)
  if (!point) console.error(`::warning title=e2e-impact::no base to diff against (${from}): the gate set and more specs up to the budget`);
  const out = opt('--out');
  if (out) {
    mkdirSync(out, { recursive: true });
    const lines = (xs: string[]) => xs.map((s) => `e2e/${s}\n`).join('');
    writeFileSync(join(out, 'specs.txt'), lines([...new Set([...sel.gate, ...sel.once, ...sel.reached.keys()])].sort()));
    writeFileSync(join(out, 'x3.txt'), lines(sel.x3));
    writeFileSync(join(out, 'changed.txt'), changed.map((f) => `${f}\n`).join(''));
  }
  const n = new Set([...sel.gate, ...sel.x3, ...sel.once, ...sel.reached.keys()]).size;
  console.log(`### The gate's e2e: ${n} spec files, ~${Math.round(sel.ms / 1000)} s of tests\n`);
  console.log(point ? `Changes since ${short(point)} (${from}) to ${short(head)}.\n` : `No base to diff against (${from}).\n`);
  console.log(`- the gate set (e2e/gate.json): ${sel.gate.length} files`);
  if (sel.x3.length) console.log(`- changed, each test 3× (no retry): ${sel.x3.join(', ')}`);
  if (sel.once.length) console.log(`- changed, each test once: ${sel.once.join(', ')}`);
  if (sel.reached.size) console.log(`- ${point ? 'reached by the change' : 'more, up to the budget'}: ${[...sel.reached].map(([s, why]) => (point ? `${s} (${why})` : s)).join(', ')}`);
  if (sel.gateOnly.length) console.log(`- mapped to no spec (the gate set covers them; the full logic tier after the deploy): ${sel.gateOnly.slice(0, 12).join(', ')}${sel.gateOnly.length > 12 ? `, +${sel.gateOnly.length - 12} more` : ''}`);
  for (const note of sel.notes) console.log(`- ${note}`);
  console.log();
}
