// What the pre-push hook runs for a push (scripts/verify.ts --push; docs/ops/testing.md "Before you push"), from the
// last green verify of this checkout (its stamp) and the push's files. The point: a push that lost the race to main
// (rebased onto the commits that landed meanwhile) isn't verified from scratch again when those commits touched none
// of its files.
//
//   skip   the pushed app/ is the tree verify passed on (`npm run verify && git push` verified it once, not twice)
//   build  that tree, verified without the build, and the push needs one
//   quick  the pushed tree differs from the verified one only in files the push didn't change (the commits a rebase
//          brought, each verified by its own pusher and gated by CI) and none of them global: vitest on the tests
//          those files and the push's reach (`vitest related`), and the docs check
//   full   anything else: every step, the build when the push changed what the build reads

/** The last green verify of a checkout: the commit and app/ tree it ran on, and whether the build was among its steps. */
export type Stamp = { commit: string; tree: string; build: boolean };
export type PushPlan = { kind: 'skip' | 'build' | 'full' } | { kind: 'quick'; files: string[] };

/** Files (repo paths) whose change can break what no import graph shows: the toolchain, the lockfile, the configs, the
 *  checks themselves, the static files tests read by path. Brought by a rebase, they mean a full verify. */
const GLOBAL = /^app\/(package(-lock)?\.json|vite\.config\.ts|svelte\.config\.js|tsconfig\.json|knip\.json|playwright\.config\.ts|src\/no-network\.setup\.ts|src\/app\.d\.ts|scripts\/verify(Plan)?\.ts|static\/)/;

/** Whether a changed file (repo path) is read by `npm run build`: not a spec, a unit test, a doc, the design sources,
 *  or a script the build doesn't run. */
export const buildReads = (f: string): boolean =>
  f.startsWith('app/') && !/^app\/(e2e\/|design\/|scripts\/(e2e-|verify|push)[^/]*$)|\.test\.ts$|\.md$/.test(f);

/**
 * The plan for a push of app/ tree `tree`: `ours`, the files the push changes (from the remote's main), `apart`, the
 * files where the pushed tree differs from the stamp's commit (null: no stamp, or its commit is gone).
 */
export function pushPlan(stamp: Stamp | null, tree: string, ours: readonly string[], apart: readonly string[] | null): PushPlan {
  const needBuild = ours.some(buildReads);
  if (stamp && stamp.tree === tree) return { kind: needBuild && !stamp.build ? 'build' : 'skip' };
  if (!stamp || !apart || !apart.length) return { kind: 'full' };
  const mine = new Set(ours);
  if (apart.some((f) => mine.has(f) || GLOBAL.test(f))) return { kind: 'full' };
  // (the build: the push's own part was built at the stamp, the others' by their own gate)
  if (needBuild && !stamp.build) return { kind: 'full' };
  return { kind: 'quick', files: [...new Set([...apart, ...ours])].filter((f) => /^app\/(src|scripts)\/.*\.(ts|svelte)$/.test(f)) };
}
