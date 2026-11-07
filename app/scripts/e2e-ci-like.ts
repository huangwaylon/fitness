// The e2e as CI runs them, on this machine (docs/ops/testing.md "Before you push"): the built app served as Pages serves
// it, Chromium in software GL (SwiftShader, as GitHub's Linux runners draw), CI's 3 workers a shard, CI's reporter and
// timeouts (CI=1), no retries; and a spec run N times over, under load (more workers than cores is what a shard is).
//
//   npm run e2e:ci-like -- [--tier logic|render|full] [--repeat N] [--workers N] [--port P] [spec files / playwright args…]
//
//   --tier logic   (default) what the gate runs: the 3D engines draw nothing (E2E_RENDER=none), @render and
//                  @quarantine left out
//   --tier render  the drawn smoke: real (software) GL, only the @render and @smoke tests
//   --tier full    everything drawn, as the full tier after the deploy (quarantine and @logic left out)
//   --repeat N     each test N times (--repeat-each; default 1; 5 before pushing a new or changed 3D or sync spec)
//   --workers N    default 3 (CI's); try 6 to load the machine as a busy runner is
//   --port P       E2E_PORT (default: a free one from 4600)
//   --changed      the specs changed since origin/main, committed or not (scripts/e2e-changed.ts), each test 5× unless
//                  --repeat says otherwise: what CI's e2e-changed job runs on the push
// It builds first unless build-pages/ is newer than src/ (--no-build skips the check).
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(name);
  if (i < 0) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const flag = (name: string) => {
  const i = args.indexOf(name);
  if (i >= 0) args.splice(i, 1);
  return i >= 0;
};
const tier = opt('--tier', 'logic');
const repeat = opt('--repeat', args.includes('--changed') ? '5' : '1');
const workers = opt('--workers', '3');
let port = opt('--port', '');
const noBuild = flag('--no-build');
const changed = flag('--changed');
if (!['logic', 'render', 'full'].includes(tier)) throw new Error(`--tier logic|render|full, not ${tier}`);
if (changed) {
  const specs = execFileSync('node', ['scripts/e2e-changed.ts', 'origin/main'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).split('\n').filter(Boolean);
  if (!specs.length) {
    console.log('e2e:ci-like: no changed spec to run');
    process.exit(0);
  }
  args.push(...specs);
}

const newest = (dir: string): number => {
  let t = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    t = Math.max(t, e.isDirectory() ? newest(p) : statSync(p).mtimeMs);
  }
  return t;
};
if (!noBuild && (!existsSync('build-pages/index.html') || statSync('build-pages/index.html').mtimeMs < newest('src'))) {
  console.log('e2e:ci-like: building (build-pages/ is older than src/)');
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
}

const free = (p: number): Promise<boolean> => new Promise((ok) => {
  const s = createServer().once('error', () => ok(false)).once('listening', () => s.close(() => ok(true)));
  s.listen(p, '127.0.0.1');
});
if (!port) for (let p = 4600; p < 4700; p++) if (await free(p)) { port = String(p); break; }

const env: NodeJS.ProcessEnv = { ...process.env, CI: '1', E2E_SWIFTSHADER: '1', E2E_PORT: port };
const pw = ['playwright', 'test', '--project=chromium', '--project=chromium-mic', `--workers=${workers}`, `--repeat-each=${repeat}`, '--reporter=list'];
if (tier === 'logic') env.E2E_RENDER = 'none', pw.push('--grep-invert', '@render|@quarantine');
if (tier === 'render') pw.push('--grep', '@render|@smoke', '--grep-invert', '@quarantine');
if (tier === 'full') env.E2E_SLOW = '1', pw.push('--grep-invert', '@quarantine|@logic');
console.log(`e2e:ci-like: tier ${tier}, ${workers} workers, each test ${repeat}×, port ${port}${env.E2E_RENDER ? ', E2E_RENDER=none' : ''}`);
const r = spawnSync('npx', [...pw, ...args], { stdio: 'inherit', env });
process.exit(r.status ?? 1);
