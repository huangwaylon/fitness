// Pairing codes, session cookies and bearer tokens (SE round 4 §3). Only SHA-256 hashes are stored.
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { and, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import type { PersonId } from '#lib/types.ts';
import type { Db } from '#lib/server/db/index.ts';
import { device, pairingCode } from '#lib/server/db/schema.ts';
import { now } from '#lib/server/clock.ts';

export const SESSION_COOKIE = '__Host-session';
export const SESSION_MAX_AGE_S = 365 * 24 * 3600;
export const PAIRING_TTL_MS = 10 * 60 * 1000;
export const PAIRING_MAX_ATTEMPTS = 10;

export type DeviceKind = 'pwa' | 'hae' | 'shortcut';
export interface AuthedDevice { id: number; person: PersonId; kind: DeviceKind; lastSeenAt: string | null }

export function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

function newSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Admin CLI: create a single-use 6-digit pairing code for `person`, valid 10 min. */
export function createPairingCode(db: Db, person: PersonId): { code: string; expiresAt: string } {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const expiresAt = new Date(now().getTime() + PAIRING_TTL_MS).toISOString();
  db.insert(pairingCode).values({ person, codeHash: sha256(`pair:${code}`), expiresAt }).run();
  return { code, expiresAt };
}

/**
 * Redeem a pairing code → new `pwa` device + session secret (to be set as cookie).
 * Each failed attempt counts against every live code; after 5, codes are dead.
 */
export function redeemPairingCode(db: Db, code: string, label: string): { person: PersonId; deviceId: number; secret: string } | null {
  const t = now().toISOString();
  const live = db.select().from(pairingCode)
    .where(and(isNull(pairingCode.usedAt), gt(pairingCode.expiresAt, t), lt(pairingCode.attempts, PAIRING_MAX_ATTEMPTS)))
    .all();
  const hash = sha256(`pair:${code}`);
  const match = live.find((r) => safeEqualHex(r.codeHash, hash));
  if (!match) {
    for (const r of live) db.update(pairingCode).set({ attempts: sql`${pairingCode.attempts} + 1` }).where(eq(pairingCode.id, r.id)).run();
    return null;
  }
  return db.transaction((tx) => {
    const used = tx.update(pairingCode).set({ usedAt: t })
      .where(and(eq(pairingCode.id, match.id), isNull(pairingCode.usedAt))).run();
    if (used.changes !== 1) return null;
    const secret = newSecret();
    const row = tx.insert(device)
      .values({ person: match.person, kind: 'pwa', label: label.slice(0, 60) || 'iPhone', tokenHash: sha256(secret), lastSeenAt: t })
      .returning({ id: device.id }).get();
    return { person: match.person, deviceId: row.id, secret };
  });
}

/** Admin CLI: create a bearer token for HAE or a Shortcut. The plaintext is returned once. */
export function createDeviceToken(db: Db, person: PersonId, kind: 'hae' | 'shortcut', label: string): { token: string; deviceId: number } {
  const token = `isl_${newSecret()}`;
  const row = db.insert(device).values({ person, kind, label, tokenHash: sha256(token) }).returning({ id: device.id }).get();
  return { token, deviceId: row.id };
}

/** Look up a non-revoked device by its secret, optionally restricted to kinds. */
export function findDevice(db: Db, secret: string, kinds: DeviceKind[]): AuthedDevice | null {
  if (!secret || secret.length > 200) return null;
  const row = db.select().from(device).where(eq(device.tokenHash, sha256(secret))).get();
  if (!row || row.revokedAt || !kinds.includes(row.kind)) return null;
  return { id: row.id, person: row.person, kind: row.kind, lastSeenAt: row.lastSeenAt };
}

export function touchDevice(db: Db, id: number): void {
  db.update(device).set({ lastSeenAt: now().toISOString() }).where(eq(device.id, id)).run();
}

export function revokeDevice(db: Db, id: number): boolean {
  return db.update(device).set({ revokedAt: now().toISOString() }).where(and(eq(device.id, id), isNull(device.revokedAt))).run().changes === 1;
}

/** Dev escape hatch (`DEV_PERSON`, never in production): a stable pwa device for that person. */
export function devDevice(db: Db, person: PersonId): AuthedDevice {
  const hash = sha256(`dev-device:${person}`);
  let row = db.select().from(device).where(eq(device.tokenHash, hash)).get();
  if (!row) row = db.insert(device).values({ person, kind: 'pwa', label: 'dev', tokenHash: hash }).returning().get();
  return { id: row.id, person: row.person, kind: row.kind, lastSeenAt: row.lastSeenAt };
}

export function devPerson(env = process.env): PersonId | null {
  if (env.NODE_ENV === 'production') return null;
  return env.DEV_PERSON === 'A' || env.DEV_PERSON === 'B' ? env.DEV_PERSON : null;
}

export function bearerFrom(header: string | null): string | null {
  const m = header?.match(/^Bearer\s+(\S+)$/i);
  return m ? m[1] : null;
}
