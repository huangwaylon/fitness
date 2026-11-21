// English Study's `listen` rows of one player, read (contract/listen.ts): the record's rows filtered to `who`'s, each
// parsed and checked by `read` (listenOf: a row whole; listenSummaryOf: what anyone else sees), the rest skipped. Pure.
import type { EventRow } from '#lib/contract/api.ts';
import type { Who } from '#lib/types.ts';

export function listensOf<T>(rows: readonly EventRow[], who: Who, read: (d: unknown) => T | null): T[] {
  return listenEventsOf(rows, who, read).map((x) => x.row);
}

/** listensOf with each row's event (its stamp and id). */
export function listenEventsOf<T>(rows: readonly EventRow[], who: Who, read: (d: unknown) => T | null): { ev: EventRow; row: T }[] {
  const out: { ev: EventRow; row: T }[] = [];
  for (const ev of rows) {
    if (ev[1] !== who || ev[3] !== 'listen') continue;
    let d: unknown;
    try {
      d = JSON.parse(ev[4]);
    } catch {
      continue;
    }
    const row = read(d);
    if (row) out.push({ ev, row });
  }
  return out;
}
