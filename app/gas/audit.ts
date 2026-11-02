// The `uploads` audit row of an ingest (docs/backend.md#ingest): the body's shape, never the body or the key. Shared by
// the Apps Script (main.ts) and the relay's record (relay/src/store.ts), so both audit a Shortcut run alike.
import { isRec } from '../src/lib/contract/api.ts';

/**
 * The shape of an ingest body for the `uploads` audit: each field's type, list length and first item (40 chars), never
 * the key. Enough to see what a Shortcut really sends without storing the whole body twice.
 */
function bodyShape(body: Record<string, unknown>): string {
  const first = (v: unknown) => JSON.stringify(v)?.slice(0, 40) ?? '';
  const parts = Object.entries(body).filter(([k]) => k !== 'key').map(([k, v]) => {
    if (Array.isArray(v)) return `${k}:array[${v.length}] ${first(v[0])}`;
    if (typeof v === 'string') {
      const lines = v.split('\n');
      return `${k}:text[${lines.length}] ${first(lines[0])}`;
    }
    if (isRec(v)) return `${k}:object{${Object.keys(v).join(',').slice(0, 80)}}`;
    return `${k}:${typeof v} ${first(v)}`;
  });
  return parts.join('; ').slice(0, 2000);
}

/** An `uploads` row `[at, person, status, bytes, notes]`: the warnings, then the body's shape. */
export const auditRow = <P extends string>(at: string, me: P, status: string, bytes: number, notes: string, body: Record<string, unknown>): [string, P, string, number, string] =>
  [at, me, status, bytes, `${notes.slice(0, 300)} | ${bodyShape(body)}`];

/** Ingest's notes for the audit: the warnings and how many items were skipped. */
export const auditNotes = (p: { warnings: string[]; skipped: number }): string =>
  [...p.warnings, p.skipped ? `${p.skipped} items skipped` : ''].filter(Boolean).join('; ');
