import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import type { Db } from '#lib/server/db/index.ts';
import { pairingCode } from '#lib/server/db/schema.ts';
import { createDeviceToken, createPairingCode, redeemPairingCode, revokeDevice } from '#lib/server/auth.ts';
import { guard } from '#lib/server/guard.ts';
import { setNow } from '#lib/server/clock.ts';
import { ORIGIN, fakeEvent, freshDb } from '#lib/server/test-utils.ts';

let db: Db;
const opts = () => ({ db: () => db });

function pairA(): string {
  const { code } = createPairingCode(db, 'A');
  return redeemPairingCode(db, code, 'iPhone')!.secret;
}

beforeEach(() => {
  db = freshDb();
});

describe('pairing', () => {
  it('creates a pwa device once; codes are single-use', () => {
    const { code } = createPairingCode(db, 'B');
    const r = redeemPairingCode(db, code, 'iPhone');
    expect(r?.person).toBe('B');
    expect(r?.secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(redeemPairingCode(db, code, 'iPhone')).toBeNull();
  });

  it('stores only a hash of the code', () => {
    const { code } = createPairingCode(db, 'A');
    const row = db.select().from(pairingCode).get()!;
    expect(row.codeHash).not.toContain(code);
    expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('dies after 5 wrong attempts', () => {
    const { code } = createPairingCode(db, 'A');
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) expect(redeemPairingCode(db, wrong, 'x')).toBeNull();
    expect(redeemPairingCode(db, code, 'x')).toBeNull();
    expect(db.select().from(pairingCode).where(eq(pairingCode.id, 1)).get()!.attempts).toBe(5);
  });

  it('expires after 10 minutes', () => {
    setNow('2026-11-02T00:00:00Z');
    const { code } = createPairingCode(db, 'A');
    setNow('2026-11-02T00:10:01Z');
    expect(redeemPairingCode(db, code, 'x')).toBeNull();
    setNow(null);
  });

  it('rate-limits POST /api/pair to 5 per 10 min per IP', async () => {
    const mk = () => fakeEvent('/api/pair', { method: 'POST', headers: { origin: ORIGIN }, body: '{}' });
    for (let i = 0; i < 5; i++) expect(await guard(mk(), opts())).toBeNull();
    expect((await guard(mk(), opts()))?.status).toBe(429);
  });
});

describe('machine endpoints accept only bearer tokens', () => {
  it('ingest: hae token ok, shortcut token / cookie / nothing rejected', async () => {
    const hae = createDeviceToken(db, 'A', 'hae', 'phone').token;
    const sc = createDeviceToken(db, 'A', 'shortcut', 'gym').token;
    const ok = fakeEvent('/ingest/hae/A', { method: 'POST', headers: { authorization: `Bearer ${hae}` } });
    expect(await guard(ok, opts())).toBeNull();
    expect(ok.locals.person).toBe('A');
    expect((await guard(fakeEvent('/ingest/hae/A', { method: 'POST', headers: { authorization: `Bearer ${sc}` } }), opts()))?.status).toBe(401);
    expect((await guard(fakeEvent('/ingest/hae/A', { method: 'POST', cookie: pairA() }), opts()))?.status).toBe(401);
    expect((await guard(fakeEvent('/ingest/hae/A', { method: 'POST' }), opts()))?.status).toBe(401);
  });

  it('presence: bearer header or {"token"} body', async () => {
    const sc = createDeviceToken(db, 'B', 'shortcut', 'gym').token;
    const viaHeader = fakeEvent('/api/presence', { method: 'POST', headers: { authorization: `Bearer ${sc}` }, body: '{}' });
    expect(await guard(viaHeader, opts())).toBeNull();
    const viaBody = fakeEvent('/api/presence', { method: 'POST', body: JSON.stringify({ token: sc, place: 'pt_studio', event: 'arrive' }) });
    expect(await guard(viaBody, opts())).toBeNull();
    expect(viaBody.locals.person).toBe('B');
    expect(await viaBody.request.json()).toMatchObject({ place: 'pt_studio' }); // body still readable by the route
    expect((await guard(fakeEvent('/api/presence', { method: 'POST', cookie: pairA(), headers: { origin: ORIGIN }, body: '{}' }), opts()))?.status).toBe(401);
  });

  it('revoked tokens are rejected', async () => {
    const { token, deviceId } = createDeviceToken(db, 'A', 'hae', 'phone');
    revokeDevice(db, deviceId);
    expect((await guard(fakeEvent('/ingest/hae/A', { method: 'POST', headers: { authorization: `Bearer ${token}` } }), opts()))?.status).toBe(401);
  });
});

describe('/api/* accepts only the session cookie + Origin', () => {
  it('GET with cookie passes; bearer rejected; nothing → 401 JSON', async () => {
    const cookie = pairA();
    const e = fakeEvent('/api/week', { cookie });
    expect(await guard(e, opts())).toBeNull();
    expect(e.locals).toMatchObject({ person: 'A' });
    const hae = createDeviceToken(db, 'A', 'hae', 'phone').token;
    expect((await guard(fakeEvent('/api/week', { headers: { authorization: `Bearer ${hae}` } }), opts()))?.status).toBe(401);
    const res = await guard(fakeEvent('/api/week'), opts());
    expect(res?.status).toBe(401);
    expect(await res!.json()).toEqual({ error: 'unauthorized' });
  });

  it('POST needs a matching Origin', async () => {
    const cookie = pairA();
    expect((await guard(fakeEvent('/api/checkin', { method: 'POST', cookie, body: '{}' }), opts()))?.status).toBe(403);
    expect((await guard(fakeEvent('/api/checkin', { method: 'POST', cookie, headers: { origin: 'https://evil.example' }, body: '{}' }), opts()))?.status).toBe(403);
    expect(await guard(fakeEvent('/api/checkin', { method: 'POST', cookie, headers: { origin: ORIGIN }, body: '{}' }), opts())).toBeNull();
  });

  it('revoked session → 401; oversized body → 413', async () => {
    const { code } = createPairingCode(db, 'A');
    const r = redeemPairingCode(db, code, 'x')!;
    revokeDevice(db, r.deviceId);
    expect((await guard(fakeEvent('/api/week', { cookie: r.secret }), opts()))?.status).toBe(401);
    const big = fakeEvent('/api/checkin', { method: 'POST', cookie: pairA(), headers: { origin: ORIGIN, 'content-length': String(70 * 1024) } });
    expect((await guard(big, opts()))?.status).toBe(413);
  });

  it('DEV_PERSON works only outside production', async () => {
    process.env.DEV_PERSON = 'B';
    const e = fakeEvent('/api/week');
    expect(await guard(e, opts())).toBeNull();
    expect(e.locals.person).toBe('B');
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect((await guard(fakeEvent('/api/week'), opts()))?.status).toBe(401);
    process.env.NODE_ENV = prev;
    delete process.env.DEV_PERSON;
  });
});
