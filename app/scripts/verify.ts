// The gate's checks that aren't e2e, as CI's `checks` job runs them, all at once (docs/ops/testing.md "Before you push").
// The first to fail prints its output and stops the rest; each prints one line with its time.
//
//   npm run verify -- [--quick] [--build]
//   npm run verify -- --push <sha> <base>     the pre-push hook's: what scripts/verifyPlan.ts plans for the push
//
//   deps        `npm ci --dry-run` on a copy of package.json and the lockfile: the ERESOLVE (a peer conflict, typescript 7
//               against svelte-check's ^5 || ^6: run 42350564692) or the lockfile out of step that kills every job
//   check       svelte-check (npm run check without its svelte-kit sync: that runs once first, before every step,
//               as knip and vitest read .svelte-kit/ while check runs)
//   knip        npm run knip
//   knip-relay  relay/'s knip (its unused files and exports, as relay.yml runs it; skipped, with a note, before
//               `npm ci` in relay/)
//   vitest      npx vitest run (--quick: only the tests this branch's changes reach, `--changed` from where it left origin/main)
//   quarantine  scripts/e2e-quarantine.ts: every quarantined test has an owner
//   docs        scripts/docs-check.ts: the docs' links, anchors and paths, and the code's citations of them, resolve
//   build       --build: npm run build (the headers, load-budget's precache limit)
// No e2e: that's `npm run e2e:ci-like`.
// A green run (not --quick) on a clean app/ leaves its stamp in the checkout's git dir (`verify-ok`: HEAD, its app/ tree,
// whether it built): the hook then skips a push of that tree, and runs `quick` for one rebased onto commits that
// touched none of its files (verifyPlan.ts).
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildReads, pushPlan, type Stamp } from './verifyPlan.ts';

const args = process.argv.slice(2);
const git = (...a: string[]): string | null => {
  const r = spawnSync('git', a, { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
};
const lines = (s: string | null) => (s ? s.split('\n').filter(Boolean) : []);
const stampFile = join(git('rev-parse', '--absolute-git-dir') ?? '.', 'verify-ok');
const readStamp = (): Stamp | null => {
  try {
    const s = JSON.parse(readFileSync(stampFile, 'utf8')) as Stamp;
    return typeof s.commit === 'string' && typeof s.tree === 'string' ? s : null;
  } catch {
    return null;
  }
};

const quick = args.includes('--quick');
let build = args.includes('--build');
/** The push's plan (--push): the steps it runs, null for all; `related`, quick's files for vitest. */
let only: string[] | null = null;
let related: string[] = [];
const pushAt = args.indexOf('--push');
const pushSha = pushAt >= 0 ? args[pushAt + 1] : '';
const was = readStamp();
if (pushSha) {
  const base = args[pushAt + 2];
  const ours = lines(git('diff', '--name-only', base, pushSha, '--', '.'));
  const apart = was && git('cat-file', '-e', `${was.commit}^{commit}`) !== null ? lines(git('diff', '--name-only', was.commit, pushSha, '--', '.')) : null;
  const plan = pushPlan(was, git('rev-parse', `${pushSha}:app`) ?? '', ours, apart);
  const at = was?.commit.slice(0, 9);
  if (plan.kind === 'skip') {
    console.log(`verify: app/ as verified at ${at}: nothing to run`);
    process.exit(0);
  }
  if (plan.kind === 'build') {
    console.log(`verify: app/ as verified at ${at}, without the build: the build`);
    only = ['build'];
    build = true;
  } else if (plan.kind === 'quick') {
    related = plan.files.map((f) => f.slice('app/'.length)).filter((f) => existsSync(f));
    console.log(`verify: as verified at ${at} but for ${apart!.length} file(s) the rebase brought, none of this push's: vitest on what ${related.length} file(s) reach, the docs check`);
    only = related.length ? ['vitest', 'docs'] : ['docs'];
  } else build = ours.some(buildReads);
}

const deps = mkdtempSync(join(tmpdir(), 'verify-deps-'));
for (const f of ['package.json', 'package-lock.json']) copyFileSync(f, join(deps, f));

// (three-dot: what this branch changed, not what origin/main did since)
const since = quick ? git('merge-base', 'origin/main', 'HEAD') || 'origin/main' : '';

type Step = { name: string; cmd: string[]; cwd?: string };
const relayKnip = existsSync('../relay/node_modules/.bin/knip');
if (!relayKnip && !only) console.log('skip  knip-relay (no relay/node_modules: npm ci in relay/)');
const steps: Step[] = [
  { name: 'deps', cmd: ['npm', 'ci', '--dry-run', '--ignore-scripts', '--no-audit', '--no-fund'], cwd: deps },
  { name: 'check', cmd: ['npx', 'svelte-check', '--tsconfig', './tsconfig.json'] },
  { name: 'knip', cmd: ['npm', 'run', 'knip'] },
  ...(relayKnip ? [{ name: 'knip-relay', cmd: ['npm', 'run', 'knip'], cwd: '../relay' }] : []),
  { name: 'vitest', cmd: related.length ? ['npx', 'vitest', 'related', '--run', '--passWithNoTests', ...related] : ['npx', 'vitest', 'run', ...(quick ? ['--changed', since] : [])] },
  { name: 'quarantine', cmd: ['node', 'scripts/e2e-quarantine.ts'] },
  { name: 'docs', cmd: ['node', 'scripts/docs-check.ts'] },
  ...(build ? [{ name: 'build', cmd: ['npm', 'run', 'build'] }] : []),
].filter((s) => !only || only.includes(s.name));

// the one sync, before the steps that read .svelte-kit/
const sync = spawnSync('npx', ['svelte-kit', 'sync'], { encoding: 'utf8' });
if (sync.status !== 0) {
  console.log(`FAIL  sync  (npx svelte-kit sync)\n\n${(sync.stdout + sync.stderr).trim()}\n\nverify: red`);
  rmSync(deps, { recursive: true, force: true });
  process.exit(1);
}

const t0 = performance.now();
const secs = (t: number) => `${((performance.now() - t) / 1000).toFixed(1)}s`;
const running = new Map<string, ChildProcess>();
let failed = false;
const stop = () => {
  // each step is its own process group (detached), so npm's children go with it
  for (const p of running.values()) try { process.kill(-p.pid!, 'SIGTERM'); } catch { /* gone */ }
  running.clear();
  rmSync(deps, { recursive: true, force: true });
};
process.on('SIGINT', () => { stop(); process.exit(130); });

await Promise.all(steps.map((s) => new Promise<void>((done) => {
  const t = performance.now();
  const p = spawn(s.cmd[0], s.cmd.slice(1), { cwd: s.cwd, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  running.set(s.name, p);
  let out = '';
  p.stdout!.on('data', (d) => (out += d));
  p.stderr!.on('data', (d) => (out += d));
  p.on('close', (code) => {
    if (!running.delete(s.name) || failed) return done(); // stopped
    if (code === 0) console.log(`ok    ${s.name.padEnd(11)}${secs(t)}`);
    else {
      failed = true;
      console.log(`FAIL  ${s.name.padEnd(11)}${secs(t)}  (${s.cmd.join(' ')})\n\n${out.trim()}\n`);
      const rest = [...running.keys()];
      stop();
      if (rest.length) console.log(`stopped: ${rest.join(', ')}`);
    }
    done();
  });
})));
stop();
console.log(failed ? `verify: red (${secs(t0)})` : `verify: green, ${steps.length} steps in ${secs(t0)}${quick || related.length ? ' (vitest on the changes only)' : ''}`);
// the stamp: green, not --quick, on a clean app/ (the tree checked is HEAD's), and HEAD the commit pushed
const head = git('rev-parse', 'HEAD');
if (!failed && !quick && git('status', '--porcelain', '--', '.') === '' && head && (!pushSha || pushSha === head)) {
  const tree = git('rev-parse', 'HEAD:app');
  // (the build: run now, or by the stamp's run, as the push's own files were then: verifyPlan.ts quick)
  if (tree) writeFileSync(stampFile, JSON.stringify({ commit: head, tree, build: build || (only !== null && !!was?.build) } satisfies Stamp));
}
process.exit(failed ? 1 : 0);
