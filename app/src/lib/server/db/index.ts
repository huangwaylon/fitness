// SQLite connection (WAL, foreign keys), migrations on open, place seeding. One process-wide handle.
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as schema from '#lib/server/db/schema.ts';
import { loadPlaces } from '#lib/server/config/places.ts';

export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

let current: Db | null = null;

/** Open (or create) a database, run migrations and seed places. `':memory:'` works for tests. */
export function openDb(path = process.env.DATABASE_PATH ?? './data/island.db'): Db {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  const db = drizzle(sqlite, { schema }) as Db;
  migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? resolve('drizzle') });
  seedPlaces(db);
  return db;
}

export function seedPlaces(db: Db): void {
  for (const p of loadPlaces()) {
    db.insert(schema.place)
      .values(p)
      .onConflictDoUpdate({ target: schema.place.key, set: { person: p.person, name: p.name, autoStrength: p.autoStrength } })
      .run();
  }
}

export function getDb(): Db {
  if (!current) current = openDb();
  return current;
}

/** Tests: swap in a fresh database. */
export function setDb(db: Db | null): void {
  current = db;
}
