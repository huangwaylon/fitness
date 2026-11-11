import { describe, expect, it, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { IDBFactory } from 'fake-indexeddb';
import meta from './ktx2.json';
import { basisModuleCode } from './basisModule.ts';
import { pickTarget, TRANSCODE, type Transcoded } from './ktx2Format.ts';
import { CAP_BYTES, configureTexCache, flushTexWrites, readTex, writeTex } from './texCache.ts';
import { glbTextures, looseTextures, texHash, texKey, type Loose } from './texHash.ts';
import { entries, pack, packId } from './ktx2Pack.ts';
import homes from '#lib/layout/homes.json' with { type: 'json' };
import structures from '#lib/layout/structures.json' with { type: 'json' };
import parts from '../player3d/parts.json' with { type: 'json' };
import { playerFiles } from '../../../../scripts/player-packs.ts';
import { strip, unstrip } from '../../../../scripts/glb-webp.ts';

const APP = join(import.meta.dirname, '..', '..', '..', '..');
const ROOM = join(APP, 'static', 'room');
const req = createRequire(import.meta.url);
const sha8 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex').slice(0, 8);
/** The players' files (their packs'), and a file under static/room (a player's from its pack). */
const PLAYER = playerFiles();
const readRoom = (path: string): Uint8Array | undefined => (path.startsWith('player/') ? PLAYER.get(path.slice(7)) : existsSync(join(ROOM, path)) ? readFileSync(join(ROOM, path)) : undefined);
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.glb') ? [join(d, f)] : []));

describe('the island models\' KTX2 textures (scripts/world3d-ktx2.ts: npm run world3d-ktx2 when this fails)', () => {
  it('has each model\'s pack, with a KTX2 for every image in it, and no pack unused', () => {
    const want = new Map<string, string[]>();
    const glbs = [...['world3d', 'homes', 'structures', 'villagers3d'].flatMap((d) => walk(join(ROOM, d)).map((f) => readFileSync(f))), ...[...PLAYER].filter(([p]) => p.endsWith('.glb')).map(([, b]) => b)];
    for (const b of glbs) {
      const hs = glbTextures(b).map((t) => texKey(t.hash, meta.caps));
      if (hs.length) want.set(`${packId(hs)}.ktx2p`, hs);
    }
    const have = readdirSync(join(ROOM, 'tex')).filter((f) => f.endsWith('.ktx2p'));
    expect(have.filter((f) => !want.has(f))).toEqual([]);
    const short = [...want].filter(([f, hs]) => {
      const es = existsSync(join(ROOM, 'tex', f)) ? entries(readFileSync(join(ROOM, 'tex', f))) : null;
      return !es || hs.some((h) => !es.has(h));
    });
    expect(short.map(([f]) => f)).toEqual([]);
    // (a capped one no larger than its cap, its smaller levels all there)
    const capped = [...want].flatMap(([f, hs]) => hs.filter((k) => k.includes('@')).map((k): [string, string] => [f, k]));
    expect(capped.length).toBeGreaterThanOrEqual(Object.keys(meta.caps).length);
    for (const [f, k] of capped) {
      const b = readFileSync(join(ROOM, 'tex', f)), [o] = entries(b)!.get(k)!, px = meta.caps[k.split('@')[0] as keyof typeof meta.caps];
      const w = b.readUInt32LE(o + 20), h = b.readUInt32LE(o + 24);
      expect([Math.max(w, h), b.readUInt32LE(o + 40)]).toEqual([px, Math.log2(Math.max(w, h)) + 1]);
    }
  });

  it('keeps no WebP in an island model: each in its WebP pack (by its images\' hashes), and no WebP pack unused (scripts/glb-webp.ts)', () => {
    const want = new Map<string, string[]>(), carrying: string[] = [];
    for (const f of ['world3d', 'homes', 'structures', 'villagers3d'].flatMap((d) => walk(join(ROOM, d)))) {
      const ts = glbTextures(readFileSync(f));
      if (!ts.length) continue;
      if (ts.some((t) => t.webp)) carrying.push(f.slice(ROOM.length + 1));
      want.set(`${packId(ts.map((t) => t.hash))}.webpp`, ts.map((t) => t.hash));
    }
    expect(carrying).toEqual([]);
    const have = readdirSync(join(ROOM, 'tex')).filter((f) => f.endsWith('.webpp'));
    expect(have.filter((f) => !want.has(f))).toEqual([]);
    const short = [...want].filter(([f, hs]) => {
      const b = existsSync(join(ROOM, 'tex', f)) ? readFileSync(join(ROOM, 'tex', f)) : null, es = b && entries(b);
      // (each the WebP it names: its bytes' hash)
      return !es || hs.some((h) => !es.has(h) || texHash(b.subarray(es.get(h)![0], es.get(h)![0] + es.get(h)![1])) !== h);
    });
    expect(short.map(([f]) => f)).toEqual([]);
  });

  it('strips a model of its WebPs and puts them back, its other bytes untouched (scripts/glb-webp.ts)', () => {
    // (a room model: it keeps its WebPs, a meshopt-compressed GLB as the island's are)
    const b = new Uint8Array(readFileSync(join(ROOM, 'museum', 'coral.glb')));
    const ts = glbTextures(b), s = strip(b, ts.map((t) => t.hash))!;
    expect(ts.length).toBeGreaterThan(1);
    expect(s.length).toBeLessThan(b.length - ts.reduce((n, t) => n + t.webp!.length, 0) + 4 * ts.length);
    expect(glbTextures(s)).toEqual(ts.map((t) => ({ hash: t.hash, webp: null })));
    const views = (g: Uint8Array) => {
      const jl = Buffer.from(g).readUInt32LE(12), j = JSON.parse(new TextDecoder().decode(g.subarray(20, 20 + jl))), bin = g.subarray(28 + jl);
      const ims = new Set((j.images ?? []).map((im: { bufferView?: number }) => im.bufferView));
      type V = { byteOffset?: number; byteLength: number; buffer: number; extensions?: { EXT_meshopt_compression?: { byteOffset?: number; byteLength: number } } };
      const cut = (o: number | undefined, l: number) => Buffer.from(bin.subarray(o ?? 0, (o ?? 0) + l)).toString('base64');
      // (an accessor by its view's place among the views but the images')
      const kept = (j.bufferViews as V[]).map((_, i) => i).filter((i) => !ims.has(i));
      return { accessors: (j.accessors as { bufferView?: number }[]).map((a) => ({ ...a, bufferView: kept.indexOf(a.bufferView!) })), views: (j.bufferViews as V[]).filter((_, i) => !ims.has(i)).map((v) => [v.buffer ? null : cut(v.byteOffset, v.byteLength), v.extensions?.EXT_meshopt_compression ? cut(v.extensions.EXT_meshopt_compression.byteOffset, v.extensions.EXT_meshopt_compression.byteLength) : null]) };
    };
    expect(views(s)).toEqual(views(b));
    const back = unstrip(s, (h) => ts.find((t) => t.hash === h)?.webp ?? undefined);
    expect(glbTextures(back)).toEqual(ts);
  });

  it('has a KTX2 for each loose WebP the models wear (a file beside it, or in its colour\'s pack), encoded from it as it is now, and none unused', () => {
    const loose = looseTextures(homes, structures, parts);
    const kept = JSON.parse(readFileSync(join(APP, 'scripts', 'ktx2-loose.json'), 'utf8')) as Record<string, string>;
    expect(loose.length).toBeGreaterThan(1000);
    const packs = new Map<string, Map<string, [number, number]> | null>();
    const has = (l: Loose) => {
      if (!readRoom(l.out)) return false;
      if (!l.entry) return true;
      if (!packs.has(l.out)) packs.set(l.out, entries(readFileSync(join(ROOM, l.out))));
      return !!packs.get(l.out)?.has(l.entry);
    };
    expect(loose.filter((l) => !has(l)).map((l) => l.path)).toEqual([]);
    expect(loose.filter((l) => kept[l.path] !== texHash(readRoom(l.path)!)).map((l) => l.path)).toEqual([]);
    const want = new Set(loose.map((l) => l.out));
    const dirs = [...new Set(loose.filter((l) => !l.out.startsWith('player/')).map((l) => l.out.slice(0, l.out.lastIndexOf('/'))))];
    // (the players' KTX2s: in their packs, none but these)
    expect([...PLAYER.keys()].filter((p) => p.endsWith('.ktx2') && !want.has(`player/${p}`))).toEqual([]);
    expect(dirs.flatMap((d) => readdirSync(join(ROOM, d)).filter((f) => /\.ktx2p?$/.test(f)).map((f) => `${d}/${f}`)).filter((f) => !want.has(f))).toEqual([]);
    // (the players' drawn flipped, as TextureLoader draws their WebPs; the homes' unflipped, as glTF's)
    expect(loose.filter((l) => l.flip !== l.path.startsWith('player/'))).toEqual([]);
  });

  it('packs files and finds each again by its id', () => {
    const a = new Uint8Array([1, 2, 3]), b = new Uint8Array([9]);
    const p = pack([['a', a], ['mWall', b]]);
    const es = entries(p)!;
    expect([...es.keys()]).toEqual(['a', 'mWall']);
    const [o, l] = es.get('mWall')!;
    expect(p.slice(o, o + l)).toEqual(b);
    expect(entries(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBeNull();
  });

  it('ships three\'s own transcoder wasm, under the hash the page asks for', () => {
    const wasm = readFileSync(req.resolve('three/examples/jsm/libs/basis/basis_transcoder.wasm'));
    expect(sha8(readFileSync(join(ROOM, 'basis', 'basis_transcoder.wasm')))).toBe(sha8(wasm));
    expect(meta.wasm).toBe(sha8(wasm));
  });
});

describe('the transcoder as the worker has it (basisModule.ts)', () => {
  it('runs with code generation off (the CSP: no unsafe-eval) and transcodes a texture for each target', async () => {
    const src = basisModuleCode(readFileSync(req.resolve('three/examples/jsm/libs/basis/basis_transcoder.js'), 'utf8'));
    expect(src.endsWith('export default BASIS;\n')).toBe(true);
    const ctx = createContext({ console }, { codeGeneration: { strings: false, wasm: true } });
    expect(() => runInContext('new Function("return 1")', ctx)).toThrow();
    const BASIS = runInContext(src.replace(/export default BASIS;\n$/, 'BASIS'), ctx) as (m: { wasmBinary: Uint8Array }) => Promise<{ initializeBasis(): void; KTX2File: new (d: Uint8Array) => Record<string, (...a: number[]) => unknown> }>;
    const m = await BASIS({ wasmBinary: readFileSync(join(ROOM, 'basis', 'basis_transcoder.wasm')) });
    m.initializeBasis();
    const U8 = runInContext('Uint8Array', ctx) as Uint8ArrayConstructor;
    // (a texture as encoded, and one capped: scripts/world3d-ktx2.ts capKtx2, each of its levels)
    const packed = new Uint8Array(readFileSync(join(ROOM, 'tex', readdirSync(join(ROOM, 'tex'))[0])));
    const keys = glbTextures(readFileSync(join(ROOM, 'world3d', 'museum.glb'))).map((t) => texKey(t.hash, meta.caps));
    const museum = new Uint8Array(readFileSync(join(ROOM, 'tex', `${packId(keys)}.ktx2p`))), cap = entries(museum)!.get(keys.find((k) => k.includes('@'))!)!;
    for (const [b, [o, l]] of [[packed, [...entries(packed)!.values()][0]], [museum, cap]] as const) {
      const k = new m.KTX2File(new U8(b.slice(o, o + l)));
      expect(k.isValid()).toBeTruthy();
      expect(k.startTranscoding()).toBeTruthy();
      for (let lv = 0; lv < (k.getLevels() as number); lv++)
        for (const [opaque, alpha] of Object.values(TRANSCODE)) {
          const fmt = k.getHasAlpha() ? alpha : opaque;
          const out = new U8(k.getImageTranscodedSizeInBytes(lv, 0, 0, fmt) as number);
          expect(k.transcodeImage(out as unknown as number, lv, 0, 0, fmt, 0, -1, -1)).toBeTruthy();
          if (lv === 0) expect(out.some((x) => x !== 0)).toBe(true);
        }
      k.close();
      k.delete();
    }
  });
});

describe('the GPU format', () => {
  it('prefers ASTC (an iPhone), then BC7, ETC2, BC1/3 with sRGB, else RGBA', () => {
    const has = (...e: string[]) => (x: string) => e.includes(x);
    expect(pickTarget(has('WEBGL_compressed_texture_astc', 'WEBGL_compressed_texture_etc'))).toBe('astc');
    expect(pickTarget(has('WEBGL_compressed_texture_etc', 'EXT_texture_compression_bptc'))).toBe('bptc');
    expect(pickTarget(has('WEBGL_compressed_texture_etc'))).toBe('etc');
    expect(pickTarget(has('WEBGL_compressed_texture_s3tc'))).toBe('rgba');
    expect(pickTarget(has('WEBGL_compressed_texture_s3tc', 'WEBGL_compressed_texture_s3tc_srgb'))).toBe('dxt');
    expect(pickTarget(has())).toBe('rgba');
  });

  it('names a texture by its bytes', () => {
    expect(texHash(new Uint8Array([1, 2, 3]))).toMatch(/^[0-9a-f]{16}$/);
    expect(texHash(new Uint8Array([1, 2, 3]))).toBe(texHash(new Uint8Array([1, 2, 3])));
    expect(texHash(new Uint8Array([1, 2, 3]))).not.toBe(texHash(new Uint8Array([1, 2, 4])));
    expect(texHash(new Uint8Array([0]))).not.toBe(texHash(new Uint8Array([0, 0])));
  });
});

describe('the transcoded textures kept (texCache.ts)', () => {
  let t = 1_000_000;
  beforeEach(() => configureTexCache({ indexedDB: new IDBFactory(), now: () => t }));
  const tex = (n: number): Transcoded => ({ width: 4, height: 4, alpha: false, target: 'etc', mips: [{ width: 4, height: 4, data: new Uint8Array(n).fill(7) }] });

  it('reads back what was written, and nothing for another key', async () => {
    writeTex('p.etc.a', tex(8), 'p.');
    await flushTexWrites('p.');
    const [a, b] = await Promise.all([readTex('p.etc.a'), readTex('p.etc.b')]);
    expect(a?.mips[0].data).toEqual(new Uint8Array(8).fill(7));
    expect(b).toBeNull();
  });

  it('lets another pipeline\'s go, and the least recently used past its bound', async () => {
    writeTex('old.etc.a', tex(8), 'old.');
    await flushTexWrites('old.');
    writeTex('p.etc.first', tex(CAP_BYTES / 2), 'p.');
    await flushTexWrites('p.');
    t += 1000;
    writeTex('p.etc.second', tex(CAP_BYTES / 2), 'p.');
    writeTex('p.etc.third', tex(16), 'p.');
    await flushTexWrites('p.');
    expect(await readTex('old.etc.a')).toBeNull();
    expect(await readTex('p.etc.first')).toBeNull();
    expect(await readTex('p.etc.second')).not.toBeNull();
    expect(await readTex('p.etc.third')).not.toBeNull();
  });

  it('writes many in several transactions, all read back', async () => {
    for (let i = 0; i < 6; i++) writeTex(`p.etc.${i}`, tex(300_000), 'p.');
    await flushTexWrites('p.');
    const got = await Promise.all([0, 1, 2, 3, 4, 5].map((i) => readTex(`p.etc.${i}`)));
    expect(got.every((g) => g?.mips[0].data.byteLength === 300_000)).toBe(true);
  });

  it('answers null with no IndexedDB', async () => {
    configureTexCache({ indexedDB: null });
    writeTex('p.etc.a', tex(8), 'p.');
    expect(await readTex('p.etc.a')).toBeNull();
  });
});
