// Failed e2e tests in a line a person reads (docs/ops/testing.md "CI"): the flake hunt's issue title (scripts/flake-why.ts,
// .github/workflows/e2e-flake-hunt.yml `file`) and the Jobs page's alert line (JobsPage, for titles filed before this
// format: "N tests failed in the hunt: e2e/a.spec.ts:12 e2e/b.spec.ts:3 … (+k more)", cut at 120 characters). The spec
// file's name only (no folder, .spec.ts or line), each once, the first MAX, then "+N more"; the places stay in the
// issue's body. Pure, no imports: Node runs it as is in the `file` job.

const MAX = 4;
const PLACE = /(?:^|\s)(e2e\/\S+)/g;

/** "e2e/kk-sync.spec.ts:40" → "kk-sync" (null: not a whole spec path, e.g. one cut off mid-name). */
export function specName(where: string): string | null {
  const m = /([^/\s]+)\.spec\.ts(?::\d+)?$/.exec(where.trim());
  return m ? m[1] : null;
}

/** The names, each once in their order, the first `max` and "+N more" (`unknown`: places past the list whose specs
 *  aren't known: "+more", no count). */
function namesLine(names: string[], max: number, unknown: boolean): string {
  const seen = [...new Set(names)];
  const shown = seen.slice(0, max).join(', ');
  const extra = seen.length - Math.min(seen.length, max);
  if (unknown) return `${shown} +more`;
  return extra ? `${shown} +${extra} more` : shown;
}

/** The failed tests' places (one a test, worst first) as "4 tests failed: kk-sync, highfive-star, players, guest" (a
 *  test listed twice counts once). */
export function testsLine(places: readonly string[], max = MAX): string {
  const list = [...new Set(places.map((p) => p.trim()).filter(Boolean))];
  const names = list.map(specName).filter((n): n is string => n !== null);
  return `${list.length} ${list.length === 1 ? 'test' : 'tests'} failed${names.length ? `: ${namesLine(names, max, false)}` : ''}`;
}

/** An ops alert's title for the Jobs page: "Ops: " off, the area capitalised, raw e2e paths as their specs' names
 *  ("Ops: flake hunt: 9 tests failed in the hunt: e2e/guest.spec.ts:152 … e2e/pon" → "Flake hunt: 9 tests failed:
 *  guest, gymbot, players +more"). Any other title as it is but the prefix. */
export function alertTitle(title: string, max = MAX): string {
  const t = title.replace(/^Ops:\s*/, '');
  const head = t.replace(/^(\w)/, (c) => c.toUpperCase());
  const first = head.search(/(?:^|\s)e2e\//);
  if (first < 0) return head;
  const before = head.slice(0, first).trim().replace(/\s*failed in the hunt:?$/, ' failed').replace(/:$/, '');
  const rest = head.slice(first);
  const places = [...rest.matchAll(PLACE)].map((m) => m[1]);
  const names = places.map(specName).filter((n): n is string => n !== null);
  // a place cut off (the 120-character title) or "(+k more)": specs past the list are unknown
  const unknown = names.length < places.length || /\(\+\d+ more\)/.test(rest);
  if (!names.length) return before;
  return `${before}: ${namesLine(names, max, unknown)}`;
}
