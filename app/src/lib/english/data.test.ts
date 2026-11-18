// data.ts: a bank or a deck file fetched once (the same promise to every caller), its JSON checked; a failure (an HTTP
// error, an answer that isn't the file) forgotten, so the next call asks again, and logged as english.fail.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const logged = vi.hoisted(() => [] as unknown[][]);
vi.mock('#lib/sync/log.ts', () => ({ log: (...a: unknown[]) => void logged.push(a) }));
const { LIBRARY, bankNow, loadBank, loadShard } = await import('./data.ts');
const { bankPath } = await import('./catalog.ts');

const m = LIBRARY[0];
let answers: (() => Response)[] = [];
const fetches: string[] = [];
beforeEach(() => {
  logged.length = 0;
  fetches.length = 0;
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('fetch', async (u: string) => (fetches.push(String(u)), answers.shift()!()));
});
afterEach(() => vi.unstubAllGlobals());
const json = (x: unknown, status = 200) => () => new Response(JSON.stringify(x), { status });

describe('loadBank', () => {
  it('a failure forgotten and logged, then one fetch for every caller; the bank kept for bankNow', async () => {
    answers = [json({}, 404), json({ id: 'other', questions: [] }), json({ id: m.id, questions: [] })];
    await expect(loadBank(m)).rejects.toThrow();
    await expect(loadBank(m)).rejects.toThrow();
    expect(bankNow(m)).toBeUndefined();
    const [a, b] = [loadBank(m), loadBank(m)];
    expect((await a).id).toBe(m.id);
    expect(await b).toBe(await a);
    expect(bankNow(m)).toBe(await a);
    expect(fetches).toHaveLength(3);
    expect(fetches.every((u) => u.endsWith(bankPath(m)))).toBe(true);
    expect(logged.map((l) => l[1])).toEqual([{ what: 'bank', clip: m.id, http: 404, on: true }, { what: 'bank', clip: m.id, http: 200, bad: true, on: true }]);
  });
});

describe('loadShard', () => {
  it('no answer: logged without a status, asked again next time', async () => {
    answers = [() => { throw new TypeError('offline'); }, json([['c', 'q', 1, 2, 'u', 'l', 'm']])];
    vi.stubGlobal('navigator', { onLine: false });
    await expect(loadShard(3)).rejects.toThrow();
    expect(logged.map((l) => [l[1], l[2]])).toEqual([[{ what: 'deck', n: 3, on: false }, 1]]);
    expect(await loadShard(3)).toHaveLength(1);
  });
});
