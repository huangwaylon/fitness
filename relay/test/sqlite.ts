// The store's SQL on node:sqlite (Durable Objects' SQLite in the tests): `exec` runs at once, as `ctx.storage.sql.exec`
// does, and returns the rows of a query; a write's cursor says the rows it changed (`rowsWritten`, as Durable Objects'
// do for tables without an index).
import { DatabaseSync } from 'node:sqlite';
import type { Sql } from '../src/store.ts';

export function memSql(): { sql: Sql; tx: <R>(fn: () => R) => R; db: DatabaseSync; reads: () => number } {
  const db = new DatabaseSync(':memory:');
  let read = 0;
  const sql: Sql = {
    exec(query, ...b) {
      const st = db.prepare(query);
      if (!st.columns().length) {
        const r = st.run(...b);
        // (sqlite's `changes` is the last write's: a schema statement leaves it as it was)
        return { toArray: () => [], rowsWritten: /^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(query) ? Number(r.changes) : 0 };
      }
      const rows = st.all(...b).map((r) => ({ ...r })) as never[];
      read += rows.length;
      return { toArray: () => rows };
    }
  };
  let depth = 0;
  const tx = <R>(fn: () => R): R => {
    if (depth++) {
      try { return fn(); } finally { depth--; }
    }
    db.exec('BEGIN');
    try {
      const r = fn();
      db.exec('COMMIT');
      return r;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    } finally {
      depth--;
    }
  };
  return { sql, tx, db, reads: () => read };
}
