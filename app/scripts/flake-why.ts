// The flake hunt's reason for its ops issue (.github/workflows/e2e-flake-hunt.yml `file`): the failed tests' places on
// stdin, one a line ("e2e/kk-sync.spec.ts:40"), as "4 tests failed: kk-sync, highfive-star, players, guest +2 more" on
// stdout (src/lib/jobs/specNames.ts); the places themselves stay in the issue's body.
import { readFileSync } from 'node:fs';
import { testsLine } from '../src/lib/jobs/specNames.ts';

console.log(testsLine(readFileSync(0, 'utf8').split('\n')));
