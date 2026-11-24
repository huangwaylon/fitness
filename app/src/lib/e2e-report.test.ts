// scripts/e2e-verdict.ts: which failed e2e tests the flake hunt's verdict counts as the environment.
import { describe, expect, it } from 'vitest';
import { isEnv } from '../../scripts/e2e-verdict.ts';

const crash = 'Error: Protocol error (Target.x): Cannot find parent object browser@1a2b';
const closed = 'Error: page.click: Target page, context or browser has been closed';
const pageClosed = 'Error: expect(locator).toBeVisible() failed\n\npage closed';
const real = 'Error: expect(locator).toHaveCount(expected) failed';

describe('isEnv (e2e-report VERDICT)', () => {
  it('the crash itself: the environment, crash seen or not', () => {
    expect(isEnv([crash], false)).toBe(true);
    expect(isEnv([crash, crash], true)).toBe(true);
  });
  it('a page or context closed: the environment only where the crash shows in the same report', () => {
    expect(isEnv([closed], true)).toBe(true);
    expect(isEnv([pageClosed], true)).toBe(true);
    expect(isEnv([closed], false)).toBe(false);
  });
  it('a real failure among its runs: the test’s', () => {
    expect(isEnv([closed, real], true)).toBe(false);
    expect(isEnv([real], true)).toBe(false);
    expect(isEnv([], true)).toBe(false);
  });
});
