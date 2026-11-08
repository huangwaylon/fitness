// The gate's checks that aren't e2e, as CI's `checks` job runs them, all at once (docs/ops/testing.md "Before you push").
// The first to fail prints its output and stops the rest; each prints one line with its time.
//
//   npm run verify -- [--quick] [--build]
//
//   deps        `npm ci --dry-run` on a copy of package.json and the lockfile: the ERESOLVE (a peer conflict, typescript 7
//               against svelte-check's ^5 || ^6: run 42350564692) or the lockfile out of step that kills every job
//   check       npm run check (svelte-kit sync, svelte-check)
//   knip        npm run knip
//   vitest      npx vitest run (--quick: only the tests the changes since origin/main reach, `--changed origin/main`)
//   quarantine  scripts/e2e-quarantine.ts: every quarantined test has an owner
//   build       --build: npm run build (the kikimimi budget, the headers, load-budget's precache limit)
// No e2e: that's `npm run e2e:ci-like`.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const quick = args.includes('--quick');
const build = args.includes('--build');

const deps = mkdtempSync(join(tmpdir(), 'verify-deps-'));
for (const f of ['package.json', 'package-lock.json']) copyFileSync(f, join(deps, f));

type Step = { name: string; cmd: string[]; cwd?: string };
const steps: Step[] = [
  { name: 'deps', cmd: ['npm', 'ci', '--dry-run', '--ignore-scripts', '--no-audit', '--no-fund'], cwd: deps },
  { name: 'check', cmd: ['npm', 'run', 'check'] },
  { name: 'knip', cmd: ['npm', 'run', 'knip'] },
  { name: 'vitest', cmd: ['npx', 'vitest', 'run', ...(quick ? ['--changed', 'origin/main'] : [])] },
  { name: 'quarantine', cmd: ['node', 'scripts/e2e-quarantine.ts'] },
  ...(build ? [{ name: 'build', cmd: ['npm', 'run', 'build'] }] : []),
];

// one sync first: check runs it again, but knip and vitest read .svelte-kit/ meanwhile
spawnSync('npx', ['svelte-kit', 'sync'], { stdio: 'ignore' });

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
console.log(failed ? `verify: red (${secs(t0)})` : `verify: green, ${steps.length} steps in ${secs(t0)}${quick ? ' (--quick: vitest on the changes only)' : ''}`);
process.exit(failed ? 1 : 0);
