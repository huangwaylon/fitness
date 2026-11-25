// Jobs in an outage (status.ts fetchJobs, outage.svelte.ts): /jobs's 503 with the free tier's usage (the record over a
// limit) keeps it for the page; a refusal without one, or a good read, clears it.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ reply: null as unknown }));
vi.mock('#lib/bots/memberCall.ts', () => ({ memberCall: async () => h.reply }));
vi.mock('#lib/kalori/status.ts', async (orig) => ({ ...(await orig<object>()), fetchStatus: async () => ({ ok: false }) }));

const { fetchJobs } = await import('./status.ts');
const { outage } = await import('./outage.svelte.ts');

const NOW = Date.parse('2026-11-25T03:20:00Z');
const USAGE = { at: NOW, day: '2026-11-25', err: null, limits: [{ k: 'doRead', used: 5_000_000, max: 5_000_000, by: [{ name: 'relay/IslandStore', n: 5_000_000 }] }] };
const sent = (status: number, json: unknown) => ({ ok: true, res: new Response(null, { status }), json, rid: 'r', ms: 1 });

describe('/jobs in an outage', () => {
  beforeEach(() => void (outage.usage = null));

  it('a 503 with the usage: the read fails as before, the usage kept; a 503 without: none; a good read clears it', async () => {
    h.reply = sent(503, { ok: false, error: 'unavailable', usage: USAGE });
    expect(await fetchJobs()).toEqual({ ok: false, err: 'http', http: 503 });
    expect(outage.usage).toEqual(USAGE);
    h.reply = sent(503, { ok: false, error: 'unavailable' });
    await fetchJobs();
    expect(outage.usage).toBeNull();
    h.reply = sent(503, { ok: false, error: 'unavailable', usage: USAGE });
    await fetchJobs();
    h.reply = sent(200, { ok: true, v: 1, now: NOW, ext: { at: null, by: null, err: null }, jobs: [], alerts: [], usage: USAGE });
    expect((await fetchJobs()).ok).toBe(true);
    expect(outage.usage).toBeNull();
  });
});
