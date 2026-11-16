// English Study's banks in the service worker (caches.ts ENGLISH_CACHE): never precached, cache first, a clip's older
// versions and the first stored past the bound let go.
import { describe, expect, it } from 'vitest';
import { englishEvict, englishFetch, isEnglishData, precachable } from './caches.ts';

const url = (id: string, v: string) => `https://x.test/fitness/english/c/${id}.${v}.json`;

describe('English Study’s banks', () => {
  it('are their own files, never precached', () => {
    expect(isEnglishData('/fitness/english/c/noturkey.1x9k2b.json')).toBe(true);
    expect(isEnglishData('/english/c/phoebe-runs.abc.json')).toBe(true);
    expect(precachable('english/c/noturkey.1x9k2b.json')).toBe(false);
    expect(isEnglishData('/food/index.json')).toBe(false);
  });

  it('a clip’s older versions go once a newer is stored, then the first stored past the bound', () => {
    expect(englishEvict([url('a', '1'), url('b', '1'), url('a', '2')])).toEqual([url('a', '1')]);
    expect(englishEvict([url('a', '1'), url('b', '1'), url('c', '1')], 2)).toEqual([url('a', '1')]);
    expect(englishEvict([url('a', '1'), url('b', '1')], 2)).toEqual([]);
  });

  it('answers from the cache; else the network’s, stored after (an error never stored)', async () => {
    const store = new Map<string, Response>();
    const cache = {
      match: async (r: RequestInfo | URL) => store.get(String(r instanceof Request ? r.url : r))?.clone(),
      put: async (r: RequestInfo | URL, res: Response) => void store.set(String(r instanceof Request ? r.url : r), res),
      delete: async (r: RequestInfo | URL) => store.delete(String(r instanceof Request ? r.url : r)),
      keys: async () => [...store.keys()].map((k) => new Request(k))
    };
    const waits: Promise<unknown>[] = [];
    let calls = 0;
    const net = async (r: Request) => (calls++, r.url.includes('gone') ? new Response('', { status: 404 }) : new Response('{"id":"a"}'));
    const res = await englishFetch(new Request(url('a', '1')), cache, net, (p) => waits.push(p));
    expect(await res.json()).toEqual({ id: 'a' });
    await Promise.all(waits);
    expect(await (await englishFetch(new Request(url('a', '1')), cache, net, (p) => waits.push(p))).json()).toEqual({ id: 'a' });
    expect(calls).toBe(1);
    expect((await englishFetch(new Request(url('gone', '1')), cache, net, (p) => waits.push(p))).status).toBe(404);
    await Promise.all(waits);
    expect([...store.keys()]).toEqual([url('a', '1')]);
  });
});
