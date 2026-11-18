// English Study's `listen` rows of one player, read (contract/listen.ts): the record's rows filtered to `who`'s, each
// parsed and checked by `read` (listenOf: a row whole; listenSummaryOf: what anyone else sees), the rest skipped. Pure.
import type { EventRow } from '#lib/contract/api.ts';
import type { Who } from '#lib/types.ts';

export function listensOf<T>(rows: readonly EventRow[], who: Who, read: (d: unknown) => T | null): T[] {
  const out: T[] = [];
  for (const r of rows) {
    if (r[1] !== who || r[3] !== 'listen') continue;
    let d: unknown;
    try {
      d = JSON.parse(r[4]);
    } catch {
      continue;
    }
    const row = read(d);
    if (row) out.push(row);
  }
  return out;
}
