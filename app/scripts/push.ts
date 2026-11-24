// Push HEAD to main through the race (docs/ops/testing.md "Before you push"): rebase onto origin/main, push (the hook
// verifies), and when main moved meanwhile, rebase and push again: the hook then runs only what the commits that
// landed touched (scripts/verifyPlan.ts `quick`), or nothing. A rebase that conflicts stops it, the conflict left as is.
//
//   npm run push [-- --tries 6]
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const tries = Number(args[args.indexOf('--tries') + 1]) || 6;
const git = (...a: string[]) => spawnSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

for (let i = 1; i <= tries; i++) {
  if (git('fetch', '-q', 'origin', 'main').status !== 0) process.exit(1);
  if (git('merge-base', '--is-ancestor', 'origin/main', 'HEAD').status !== 0) {
    const r = spawnSync('git', ['rebase', 'origin/main'], { stdio: 'inherit' });
    if (r.status !== 0) {
      console.error('push: the rebase stopped (a conflict?): resolve it and `git rebase --continue`, or `git rebase --abort`; then npm run push again');
      process.exit(1);
    }
  }
  // (the ref's status read from --porcelain's stdout, which carries the hook's output too: both shown)
  const p = spawnSync('git', ['push', '--porcelain', 'origin', 'HEAD:main'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  process.stdout.write(p.stdout);
  if (p.status === 0) {
    console.log(`push: on main (try ${i})`);
    process.exit(0);
  }
  if (!/\[rejected\]|fetch first|non-fast-forward|cannot lock ref/.test(p.stdout)) {
    console.error('push: refused');
    process.exit(1);
  }
  console.log(`push: main moved during the checks (try ${i} of ${tries}): rebasing onto it`);
}
console.error(`push: main kept moving for ${tries} tries`);
process.exit(1);
