// Append-only integer-yen ledger. Idempotent by construction: every write is INSERT … ON CONFLICT(idem_key) DO NOTHING.
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { PersonId, WeekKey, WeekPayout } from '#lib/types.ts';
import type { Db } from '#lib/server/db/index.ts';
import { ledgerEntry, weekLock } from '#lib/server/db/schema.ts';
import { now } from '#lib/server/clock.ts';
import { computePayout } from '#lib/server/week.ts';

interface BucketKey { bucket: 'jar' | 'purse'; layer: 'A' | 'B' | 'team' | null; person: PersonId | null; slug: string }

const BUCKETS: BucketKey[] = [
  { bucket: 'jar', layer: 'A', person: 'A', slug: 'jar:A' },
  { bucket: 'jar', layer: 'B', person: 'B', slug: 'jar:B' },
  { bucket: 'jar', layer: 'team', person: null, slug: 'jar:team' },
  { bucket: 'purse', layer: null, person: 'A', slug: 'purse:A' },
  { bucket: 'purse', layer: null, person: 'B', slug: 'purse:B' }
];

function amountFor(p: WeekPayout, k: BucketKey): number {
  switch (k.slug) {
    case 'jar:A': return p.A.fruitYen;
    case 'jar:B': return p.B.fruitYen;
    case 'jar:team': return p.teamYen;
    case 'purse:A': return p.A.purseYen;
    case 'purse:B': return p.B.purseYen;
    default: return 0;
  }
}

/** Sum of earn + topup already written for a bucket/week. */
function paidFor(db: Db, weekKey: WeekKey, k: BucketKey): { paid: number; hasEarn: boolean } {
  const rows = db.select().from(ledgerEntry)
    .where(and(
      eq(ledgerEntry.weekKey, weekKey), eq(ledgerEntry.bucket, k.bucket), inArray(ledgerEntry.kind, ['earn', 'topup']),
      k.layer ? eq(ledgerEntry.layer, k.layer) : isNull(ledgerEntry.layer),
      k.person ? eq(ledgerEntry.person, k.person) : isNull(ledgerEntry.person)
    )).all();
  return { paid: rows.reduce((s, r) => s + r.amountYen, 0), hasEarn: rows.some((r) => r.kind === 'earn') };
}

interface SettleLine { slug: string; computed: number; paid: number; written: number }
export interface SettleResult { weekKey: WeekKey; mode: 'provisional' | 'final'; skipped?: 'locked'; lines: SettleLine[] }

/**
 * Provisional (Sunday 19:30): write `earn:<bucket>:<layer>:<week>` entries.
 * Final (Wednesday 04:00): recompute; write `topup:…:<computedTotal>` for any increase, then lock. Never claws back.
 * `dryRun` computes the same lines without writing.
 */
export function settleWeek(db: Db, weekKey: WeekKey, mode: 'provisional' | 'final', opts: { dryRun?: boolean; ignoreLock?: boolean } = {}): SettleResult {
  const lock = db.select().from(weekLock).where(eq(weekLock.weekKey, weekKey)).get();
  if (lock?.lockedAt && !(opts.dryRun && opts.ignoreLock)) return { weekKey, mode, skipped: 'locked', lines: [] };
  const { payout } = computePayout(db, weekKey);
  const t = now().toISOString();
  const lines: SettleLine[] = [];

  const write = (tx: Db) => {
    for (const k of BUCKETS) {
      const computed = amountFor(payout, k);
      const { paid, hasEarn } = paidFor(tx, weekKey, k);
      let written = 0;
      let idemKey: string | null = null;
      let kind: 'earn' | 'topup' = 'earn';
      let amount = 0;
      if (!hasEarn && computed > 0 && (mode === 'provisional' || paid === 0)) {
        idemKey = `earn:${k.slug}:${weekKey}`;
        amount = computed;
      } else if (mode === 'final' && computed > paid) {
        kind = 'topup';
        idemKey = `topup:${k.slug}:${weekKey}:${computed}`;
        amount = computed - paid;
      }
      if (idemKey && !opts.dryRun) {
        const r = tx.insert(ledgerEntry)
          .values({ bucket: k.bucket, layer: k.layer, person: k.person, amountYen: amount, kind, weekKey, idemKey, memo: mode, createdAt: t })
          .onConflictDoNothing({ target: ledgerEntry.idemKey }).run();
        written = r.changes === 1 ? amount : 0;
      } else if (idemKey) {
        written = amount;
      }
      lines.push({ slug: k.slug, computed, paid, written });
    }
    if (opts.dryRun) return;
    const set = mode === 'provisional' ? { provisionalAt: t } : { lockedAt: t };
    tx.insert(weekLock).values({ weekKey, ...set })
      .onConflictDoUpdate({ target: weekLock.weekKey, set: mode === 'provisional' ? { provisionalAt: sql`coalesce(${weekLock.provisionalAt}, ${t})` } : { lockedAt: t } })
      .run();
  };
  if (opts.dryRun) write(db);
  else db.transaction((tx) => write(tx as unknown as Db));
  return { weekKey, mode, lines };
}

export function purseBalance(db: Db): number {
  return Number(db.select({ yen: sql<number>`coalesce(sum(${ledgerEntry.amountYen}), 0)` }).from(ledgerEntry).where(eq(ledgerEntry.bucket, 'purse')).get()?.yen ?? 0);
}
