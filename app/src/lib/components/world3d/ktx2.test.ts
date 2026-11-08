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
import { glbImages, looseTextures, texHash, type Loose } from './texHash.ts';
import { entries, pack, packId } from './ktx2Pack.ts';
import homes from '#lib/layout/homes.json' with { type: 'json' };
import structures from '#lib/layout/structures.json' with { type: 'json' };
import parts from '../player3d/parts.json' with { type: 'json' };

const APP = join(import.meta.dirname, '..', '..', '..', '..');
const ROOM = join(APP, 'static', 'room');
const req = createRequire(import.meta.url);
const sha8 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex').slice(0, 8);
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.glb') ? [join(d, f)] : []));

describe('the island models\' KTX2 textures (scripts/world3d-ktx2.ts: npm run world3d-ktx2 when this fails)', () => {
  it('has each model\'s pack, with a KTX2 for every image in it, and no pack unused', () => {
    const want = new Map<string, string[]>();
    for (const d of ['world3d', 'homes', 'structures', 'villagers3d', 'player'])
      for (const f of walk(join(ROOM, d))) {
        const hs = glbImages(readFileSync(f)).map((im) => texHash(im));
        if (hs.length) want.set(`${packId(hs)}.ktx2p`, hs);
      }
    const have = readdirSync(join(ROOM, 'tex'));
    expect(have.filter((f) => !want.has(f))).toEqual([]);
    const short = [...want].filter(([f, hs]) => {
      const es = existsSync(join(ROOM, 'tex', f)) ? entries(readFileSync(join(ROOM, 'tex', f))) : null;
      return !es || hs.some((h) => !es.has(h));
    });
    expect(short.map(([f]) => f)).toEqual([]);
  });

  it('has a KTX2 for each loose WebP the models wear (a file beside it, or in its colour\'s pack), encoded from it as it is now, and none unused', () => {
    const loose = looseTextures(homes, structures, parts);
    const kept = JSON.parse(readFileSync(join(APP, 'scripts', 'ktx2-loose.json'), 'utf8')) as Record<string, string>;
    expect(loose.length).toBeGreaterThan(1000);
    const packs = new Map<string, Map<string, [number, number]> | null>();
    const has = (l: Loose) => {
      if (!existsSync(join(ROOM, l.out))) return false;
      if (!l.entry) return true;
      if (!packs.has(l.out)) packs.set(l.out, entries(readFileSync(join(ROOM, l.out))));
      return !!packs.get(l.out)?.has(l.entry);
    };
    expect(loose.filter((l) => !has(l)).map((l) => l.path)).toEqual([]);
    expect(loose.filter((l) => kept[l.path] !== texHash(readFileSync(join(ROOM, l.path)))).map((l) => l.path)).toEqual([]);
    const want = new Set(loose.map((l) => l.out));
    const dirs = [...new Set(loose.map((l) => l.out.slice(0, l.out.lastIndexOf('/'))))];
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
    const packed = new Uint8Array(readFileSync(join(ROOM, 'tex', readdirSync(join(ROOM, 'tex'))[0])));
    const [o, l] = [...entries(packed)!.values()][0];
    const U8 = runInContext('Uint8Array', ctx) as Uint8ArrayConstructor;
    const k = new m.KTX2File(new U8(packed.slice(o, o + l)));
    expect(k.isValid()).toBeTruthy();
    expect(k.startTranscoding()).toBeTruthy();
    for (const [opaque, alpha] of Object.values(TRANSCODE)) {
      const fmt = k.getHasAlpha() ? alpha : opaque;
      const out = new U8(k.getImageTranscodedSizeInBytes(0, 0, 0, fmt) as number);
      expect(k.transcodeImage(out as unknown as number, 0, 0, 0, fmt, 0, -1, -1)).toBeTruthy();
      expect(out.some((b) => b !== 0)).toBe(true);
    }
    k.close();
    k.delete();
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
