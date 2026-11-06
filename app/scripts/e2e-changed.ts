// The e2e specs a change added or edited (docs/ops/testing.md "A changed spec, five times"): CI's e2e-changed job runs
// each of them 5× over in the logic tier before the deploy, so a new flaky spec is caught by the push that brings it,
// not by the next ten runs. `npm run e2e:ci-like -- --changed` does the same here before a push.
//
//   node scripts/e2e-changed.ts <base> [head]
//     the e2e/*.spec.ts files changed between the two commits (head: the working tree, uncommitted changes too) that
//     still exist, one a line, relative to app/. Over MAX of them (a sweep across every spec: an import, a rename) it
//     lists none and says so on stderr: the logic tier itself runs them all, and five times the suite is no check.
//     An unknown base (a new branch, a force push, all zeros): HEAD~1.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const MAX = 8;
const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const ok = (rev: string) => !!rev && !/^0+$/.test(rev) && (() => { try { git('cat-file', '-e', `${rev}^{commit}`); return true; } catch { return false; } })();

let [base = '', head = ''] = process.argv.slice(2);
if (!ok(base)) base = 'HEAD~1';
const root = git('rev-parse', '--show-toplevel');
const names = git('diff', '--name-only', '--diff-filter=AM', base, ...(head ? [head] : []), '--', `${root}/app/e2e`)
  .split('\n')
  .filter((f) => /^app\/e2e\/[^/]+\.spec\.ts$/.test(f))
  .map((f) => f.slice('app/'.length))
  .filter((f) => existsSync(f));
if (names.length > MAX) console.error(`e2e-changed: ${names.length} specs changed (over ${MAX}: a sweep); the logic tier runs them all`);
else if (names.length) console.log(names.join('\n'));
