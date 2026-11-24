// Which failed e2e tests failed for the environment, not the test (scripts/e2e-report.ts's VERDICT and summary). Pure,
// for src/lib/e2e-report.test.ts.
/** The browser, or Playwright's link to it, failing (the flake hunt's macOS WebKit: "Cannot find parent object browser@…"). */
export const CRASH = /Cannot find parent object browser@|Browser closed|browser has disconnected/;
/** What the other tests of that browser end with when it goes: their page or context closed under them. */
const CLOSED = /Target page, context or browser has been closed|Target closed|page closed|context closed/i;

/** A failed test is the environment's when each of its failed runs ended in the crash, or (in a report where the crash
 *  shows: one shard's) in its page or context closed: the crash taking down the tests running beside it. */
export function isEnv(errors: readonly string[], crashSeen: boolean): boolean {
  return errors.length > 0 && errors.every((e) => CRASH.test(e) || (crashSeen && CLOSED.test(e)));
}
