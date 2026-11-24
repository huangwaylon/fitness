// The pre-push plan (scripts/verifyPlan.ts): a push verified once, not twice; a rebased push re-checked only where the
// commits it was rebased onto touched it.
import { describe, expect, it } from 'vitest';
import { buildReads, pushPlan, type Stamp } from '../../scripts/verifyPlan.ts';

const stamp = (o: Partial<Stamp> = {}): Stamp => ({ commit: 'c0', tree: 't0', build: true, ...o });

describe('pushPlan', () => {
  it('skips the tree verify passed on, and adds only the build when that run had none and the push needs one', () => {
    expect(pushPlan(stamp(), 't0', ['app/src/a.ts'], [])).toEqual({ kind: 'skip' });
    expect(pushPlan(stamp({ build: false }), 't0', ['app/src/a.ts'], [])).toEqual({ kind: 'build' });
    expect(pushPlan(stamp({ build: false }), 't0', ['app/e2e/a.spec.ts', 'app/src/a.test.ts'], [])).toEqual({ kind: 'skip' });
  });

  it('runs everything with no stamp, a stamp whose commit is gone, or the push’s own files changed since', () => {
    expect(pushPlan(null, 't1', ['app/src/a.ts'], null)).toEqual({ kind: 'full' });
    expect(pushPlan(stamp(), 't1', ['app/src/a.ts'], null)).toEqual({ kind: 'full' });
    expect(pushPlan(stamp(), 't1', ['app/src/a.ts'], ['app/src/a.ts', 'app/src/b.ts'])).toEqual({ kind: 'full' });
  });

  it('a rebase that brought only others’ files: the tests they and the push reach', () => {
    expect(pushPlan(stamp(), 't1', ['app/src/a.ts', 'app/e2e/x.spec.ts'], ['app/src/b.svelte', 'app/README.md']))
      .toEqual({ kind: 'quick', files: ['app/src/b.svelte', 'app/src/a.ts'] });
  });

  it('a rebase that brought a global file (the lockfile, a config, static files, the checks) runs everything', () => {
    for (const f of ['app/package-lock.json', 'app/package.json', 'app/vite.config.ts', 'app/tsconfig.json', 'app/knip.json', 'app/static/world/models.json', 'app/scripts/verify.ts', 'app/src/no-network.setup.ts']) {
      expect(pushPlan(stamp(), 't1', ['app/src/a.ts'], [f]), f).toEqual({ kind: 'full' });
    }
  });

  it('a stamp without the build, for a push that needs one, runs everything', () => {
    expect(pushPlan(stamp({ build: false }), 't1', ['app/src/a.ts'], ['app/src/b.ts'])).toEqual({ kind: 'full' });
    expect(pushPlan(stamp({ build: false }), 't1', ['app/e2e/a.spec.ts'], ['app/src/b.ts'])).toEqual({ kind: 'quick', files: ['app/src/b.ts'] });
  });
});

describe('buildReads', () => {
  it('the build reads the source, the static files, the configs and its own scripts; not specs, tests, docs or the checks', () => {
    for (const f of ['app/src/lib/x.ts', 'app/src/routes/+page.svelte', 'app/static/a.png', 'app/vite.config.ts', 'app/scripts/headers.ts', 'app/scripts/load-budget.ts', 'app/package.json']) expect(buildReads(f), f).toBe(true);
    for (const f of ['app/e2e/a.spec.ts', 'app/e2e/fixtures.ts', 'app/src/lib/x.test.ts', 'app/scripts/e2e-impact.ts', 'app/scripts/verify.ts', 'app/scripts/verifyPlan.ts', 'app/scripts/push.ts', 'app/design/avatar', 'docs/backend.md']) expect(buildReads(f), f).toBe(false);
  });
});
