// The record's nightly jobs (docs/ops/observability.md#the-relay): the 03:00 cron runs each, and from 04:15
// Tokyo every :15/:45 tick runs again any not done today (a missed trigger, a failure, a prune's batch left over, the
// prunes held till the night's backup is up). Each job's day in the record's meta (`nightly|<job>`): the Tokyo day of its last finished run, the rows it took today.
// Logged only on a failure (`do.error`, once a job a Tokyo day: a job that keeps throwing would say it each tick, ~40 a
// day) and once a day when the last of them finishes (`cron.nightly`). Free of the
// Workers runtime (test/nightly.test.ts).
import { localDateAt } from '../../app/src/lib/contract/tokyo.ts';

const NIGHTLY = ['ledgercheck', 'sharesweep', 'islandprune', 'ledgerprune', 'tombprune'] as const;
export type Job = (typeof NIGHTLY)[number];
/** The jobs that delete record rows: run only once the slot's backup is up (`backedUp`), so every row they take is in
 *  a dump (none of them ever touches `metrics`: test/store.test.ts "metrics are never deleted"). */
const PRUNES: ReadonlySet<Job> = new Set(['islandprune', 'ledgerprune', 'tombprune']);
/** A prune deletes this many rows a run at most (the Free plan's 100k rows written a day); the rest the next tick. */
export const PRUNE_BATCH = 2000;
/** The ticks re-run a job not done today from this Tokyo minute (04:15: the 03:00 batch's own run first). */
const CATCHUP_MIN = 4 * 60 + 15;
const TOKYO_MS = 9 * 3_600_000;

/** A run's outcome: the rows it took (deleted, swept, the drifts found) and whether a batch was left over. */
interface JobOut {
  n: number;
  more?: boolean;
}
/** A job's meta row: `ok` its last finished run (ms), `day` the Tokyo day of `n`, the rows it took that day; `fd` the
 *  Tokyo day its failure was last logged. */
interface Stamp {
  ok: number;
  day: string;
  n: number;
  fd?: string;
}
const metaKey = (j: Job) => `nightly|${j}`;

export interface NightlyDeps {
  now(): number;
  /** This slot's backup is up (archive.ts: the state's `ok` is today's slot) and the day isn't over the budget
   *  (storeObject.ts nightly): else the prunes wait. */
  backedUp: boolean;
  /** The jobs' meta rows (one indexed range of `meta`). */
  stamps(): Map<string, string>;
  setMeta(k: string, v: string): void;
  jobs: Record<Job, () => JobOut>;
  /** A job that threw (the first time a Tokyo day): its name and the error. */
  fail(job: Job, e: unknown): void;
  /** The day's line, once, when the last job finishes. */
  done(d: Record<string, number | boolean>): void;
}

/** Whether a tick at `t` may catch up (Tokyo 04:15 to midnight). */
export const isCatchup = (t: number): boolean => Math.floor(((t + TOKYO_MS) % 86_400_000) / 60_000) >= CATCHUP_MIN;

function stampOf(raw: string | undefined): Stamp | null {
  try {
    const s = raw ? (JSON.parse(raw) as Stamp) : null;
    return s && typeof s.ok === 'number' && typeof s.day === 'string' && typeof s.n === 'number' ? s : null;
  } catch {
    return null;
  }
}

/** Each job not done today run once, in order (one's throw never stops the next); `late`: a tick's catch-up. */
export function runNightly(d: NightlyDeps, late: boolean): { ran: Job[]; failed: Job[]; left: Job[] } {
  const t0 = d.now(), today = localDateAt(t0), raw = d.stamps();
  const st = new Map(NIGHTLY.map((j) => [j, stampOf(raw.get(metaKey(j)))] as const));
  const isDone = (j: Job) => {
    const s = st.get(j);
    return !!s && s.ok > 0 && localDateAt(s.ok) === today;
  };
  const ran: Job[] = [], failed: Job[] = [];
  for (const j of NIGHTLY) {
    if (isDone(j) || (PRUNES.has(j) && !d.backedUp)) continue;
    ran.push(j);
    let out: JobOut;
    try {
      out = d.jobs[j]();
    } catch (e) {
      failed.push(j);
      const old = st.get(j);
      if (old?.fd !== today) {
        d.fail(j, e);
        const s: Stamp = { ok: old?.ok ?? 0, day: today, n: old?.day === today ? old.n : 0, fd: today };
        st.set(j, s);
        d.setMeta(metaKey(j), JSON.stringify(s));
      }
      continue;
    }
    const old = st.get(j);
    const n = (old?.day === today ? old.n : 0) + out.n;
    const s: Stamp = { ok: out.more ? (old?.ok ?? 0) : d.now(), day: today, n, ...(old?.fd ? { fd: old.fd } : {}) };
    st.set(j, s);
    d.setMeta(metaKey(j), JSON.stringify(s));
  }
  const left = NIGHTLY.filter((j) => !isDone(j));
  if (ran.length && !left.length) {
    const n = (j: Job) => st.get(j)?.n ?? 0;
    d.done({ drift: n('ledgercheck'), swept: n('sharesweep'), island: n('islandprune'), ledger: n('ledgerprune'), tomb: n('tombprune'), late, ms: d.now() - t0 });
  }
  return { ran, failed, left };
}

/** `/health/log`'s: hours since each job last finished (-1 never), and `nightlyH` the oldest of them. */
export function nightlyAges(raw: Map<string, string>, now: number): { nightlyH: number; nightly: Record<Job, number> } {
  const h = (ms: number) => Math.round((now - ms) / 360_000) / 10;
  const nightly = Object.fromEntries(NIGHTLY.map((j) => {
    const s = stampOf(raw.get(metaKey(j)));
    return [j, s && s.ok > 0 ? h(s.ok) : -1];
  })) as Record<Job, number>;
  const ages = Object.values(nightly);
  return { nightlyH: ages.includes(-1) ? -1 : Math.max(...ages), nightly };
}
