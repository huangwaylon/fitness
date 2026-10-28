// Usage: npm run recompute -- --dry-run [--weeks N]
// Recomputes each recent week with the current rules and prints computed vs paid per bucket.
// Without --dry-run it runs the normal settlement (provisional/final as due) — same as the scheduler.
import { openDb } from '#lib/server/db/index.ts';
import { settleWeek } from '#lib/server/ledger.ts';
import { candidateWeeks, runSettlement } from '#lib/server/jobs.ts';
import { isLocked } from '#lib/server/week.ts';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const db = openDb();

if (!dry) {
  for (const r of runSettlement(db)) console.log(`${r.weekKey} ${r.mode}${r.skipped ? ` (${r.skipped})` : ''}: ${r.lines.map((l) => `${l.slug}+${l.written}`).join(' ')}`);
  console.log('done');
} else {
  console.log('week        bucket      computed      paid   diff  status');
  for (const wk of candidateWeeks()) {
    const locked = isLocked(db, wk);
    // dryRun ignores the lock so you can see what new rules would have produced.
    const lockRow = locked ? 'locked (no changes possible)' : 'open';
    const r = settleWeekIgnoringLock(wk);
    for (const l of r.lines) {
      const diff = l.computed - l.paid;
      console.log(`${wk}  ${l.slug.padEnd(10)} ${String(l.computed).padStart(9)} ${String(l.paid).padStart(9)} ${String(diff).padStart(6)}  ${lockRow}`);
    }
  }
}

function settleWeekIgnoringLock(wk: string) {
  return settleWeek(db, wk, 'final', { dryRun: true, ignoreLock: true });
}
