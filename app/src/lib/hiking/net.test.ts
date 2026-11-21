import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toTrack } from '#lib/contract/hikeTrack.ts';
import { forksFresh, parseNet, trackHash, type NetFile } from './net.ts';
import { loadNet } from './load.ts';
import { TRAILS } from './trails.ts';

const fixtures = join(import.meta.dirname, '../../../e2e/fixtures/hiking');
const TINY = JSON.parse(readFileSync(join(fixtures, 'tiny-net.json'), 'utf8')) as NetFile;
const track = toTrack(readFileSync(join(fixtures, 'tiny.gpx'), 'utf8'));
const copy = (): NetFile => structuredClone(TINY);

describe('reference trails: the net file', () => {
  it("the e2e fixture is the schema, built from tiny.gpx's track: 2 forks, the first passed twice", () => {
    expect(parseNet(TINY)).toEqual(TINY);
    expect(forksFresh(TINY, track.pts)).toBe(true);
    expect(TINY.forks.map((f) => f.pass.length)).toEqual([2, 1]);
  });

  it('trackHash: 8 hex digits, the same for the same points at 5 decimals, another for any move', () => {
    const h = trackHash(track.pts);
    expect(h).toMatch(/^[0-9a-f]{8}$/);
    expect(trackHash(track.pts.map(([a, b, e]) => [a + 1e-7, b, e + 5]))).toBe(h);
    expect(trackHash(track.pts.map(([a, b, e], i) => [i === 3 ? a + 1e-5 : a, b, e]))).not.toBe(h);
    expect(forksFresh({ ...TINY, trk: '00000000' }, track.pts)).toBe(false);
  });

  it('null on anything unexpected', () => {
    const bad: ((n: NetFile) => unknown)[] = [
      (n) => ({ ...n, v: 2 }),
      (n) => ({ ...n, src: 'yamap' }),
      (n) => ({ ...n, north: 'magnetic' }),
      (n) => ({ ...n, at: '21/11/2026' }),
      (n) => ({ ...n, trk: 'xyz' }),
      (n) => ({ ...n, lines: {} }),
      (n) => ((n.lines[0].c = [[139, 35]]), n),
      (n) => ((n.lines[0].c[1] = [200, 35]), n),
      (n) => (delete (n.lines[0] as Partial<NetFile['lines'][0]>).h, n),
      (n) => ((n.forks[0].br[2].line = n.lines.length), n),
      (n) => ((n.forks[0].br[0].deg = 360), n),
      (n) => ((n.forks[0].pass[0].take = n.forks[0].br.length), n),
      (n) => ((n.forks[0].pass = []), n),
      (n) => ((n.forks[0].br = n.forks[0].br.slice(0, 2)), n),
      (n) => ({ ...n, pois: [{ p: [139, 35], k: 'shop' }] }),
      () => null,
      () => [],
      () => 'x'
    ];
    for (const [i, f] of bad.entries()) expect(parseNet(f(copy())), String(i)).toBeNull();
    const { pois: _, ...noPois } = copy();
    expect(parseNet(noPois)).not.toBeNull();
  });

  it('loadNet: the file parsed, else null (a 404, HTML, a throw, not the schema)', async () => {
    const res = (body: unknown, init: ResponseInit = { headers: { 'content-type': 'application/json' } }) => async () => new Response(JSON.stringify(body), init);
    expect(await loadNet('x', res(TINY) as typeof fetch)).toEqual(TINY);
    expect(await loadNet('x', res(TINY, { status: 404, headers: { 'content-type': 'application/json' } }) as typeof fetch)).toBeNull();
    expect(await loadNet('x', res(TINY, { headers: { 'content-type': 'text/html' } }) as typeof fetch)).toBeNull();
    expect(await loadNet('x', res({ v: 1 }) as typeof fetch)).toBeNull();
    expect(await loadNet('x', (async () => { throw new TypeError('offline'); }) as typeof fetch)).toBeNull();
  });

  it("the shipped files: one for each Japan trail (none for another), the schema, built from the track as it is, ≤ 30 KB gz", () => {
    const dir = join(import.meta.dirname, '../../../static/hiking/net');
    const japan = TRAILS.filter((t) => t.tiles === 'jp').map((t) => t.slug).sort();
    expect(readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort()).toEqual(japan);
    for (const slug of japan) {
      const raw = readFileSync(join(dir, `${slug}.json`));
      const net = parseNet(JSON.parse(raw.toString('utf8')));
      const pts = (JSON.parse(readFileSync(join(dir, '../tracks', `${slug}.json`), 'utf8')) as { pts: [number, number, number][] }).pts;
      expect(net, slug).not.toBeNull();
      expect(forksFresh(net!, pts), `${slug}: rebuilt track, run npm run hiking:net ${slug}`).toBe(true);
      expect(gzipSync(raw).length, slug).toBeLessThan(30 * 1024);
    }
  });
});
