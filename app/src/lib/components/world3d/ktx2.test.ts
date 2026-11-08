import { describe, expect, it, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { IDBFactory } from 'fake-indexeddb';
import meta from './ktx2.json';
import { basisModuleCode } from './basisModule.ts';
import { pickTarget, TRANSCODE, type Transcoded } from './ktx2Format.ts';
import { CAP_BYTES, configureTexCache, flushTexWrites, readTex, writeTex } from './texCache.ts';
import { glbImages, texHash } from './texHash.ts';

const APP = join(import.meta.dirname, '..', '..', '..', '..');
const ROOM = join(APP, 'static', 'room');
const req = createRequire(import.meta.url);
const sha8 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex').slice(0, 8);
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.glb') ? [join(d, f)] : []));

describe('the island models\' KTX2 textures (scripts/world3d-ktx2.ts: npm run world3d-ktx2 when this fails)', () => {
  it('has a KTX2 for every image in static/room/world3d, and none unused', () => {
    const want = new Set<string>();
    for (const f of walk(join(ROOM, 'world3d'))) for (const im of glbImages(readFileSync(f))) want.add(texHash(im));
    const have = new Set(readdirSync(join(ROOM, 'tex')).map((f) => f.replace(/\.ktx2$/, '')));
    expect([...want].filter((h) => !have.has(h))).toEqual([]);
    expect([...have].filter((h) => !want.has(h))).toEqual([]);
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
    const file = readdirSync(join(ROOM, 'tex'))[0];
    const U8 = runInContext('Uint8Array', ctx) as Uint8ArrayConstructor;
    const k = new m.KTX2File(new U8(readFileSync(join(ROOM, 'tex', file))));
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

  it('answers null with no IndexedDB', async () => {
    configureTexCache({ indexedDB: null });
    writeTex('p.etc.a', tex(8), 'p.');
    expect(await readTex('p.etc.a')).toBeNull();
  });
});
