import { describe, expect, it, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { REVISION, type WebGLRenderer } from 'three';
// (three's own program, as the island's renderer makes it: what a kept program is made with)
import { WebGLProgram as ThreeProgram } from 'three/src/renderers/webgl/WebGLProgram.js';
import { configureProgCache, letGo, preLink, rawGlsl, rawParams, readProgs, recOf, splitSource, writeProgs, PROGS_MAX, type Prog, type ProgRec } from './progCache.ts';
import { progsOf } from './boot.ts';

/** (r170's constructor takes the binding states too; its typings don't say) */
const WebGLProgram = ThreeProgram as unknown as new (r: unknown, key: string, p: unknown, states: unknown) => Prog;

/** A source as three's built-in material puts it together (r170: its version, its GLSL 3 defines, the precision,
 *  SHADER_TYPE and SHADER_NAME, its own defines, the shader). */
const builtIn = (kind: 'v' | 'f', name = '') =>
  ['#version 300 es', kind === 'v' ? '#define attribute in' : '#define varying in', 'precision highp float;', '#define SHADER_TYPE MeshLambertMaterial', `#define SHADER_NAME ${name}`, '#define USE_MAP', '#define USE_INSTANCING', `void main() { /* ${kind} */ }`].join('\n');
const rec = (k = 'key-1', name = ''): ProgRec => ({ k, v: builtIn('v', name), f: builtIn('f', name) });

/** A GL that only records the sources it's given. */
function fakeGL() {
  const sources: string[] = [];
  let n = 0;
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, LINK_STATUS: 3,
    createProgram: () => ({ id: n++ }),
    createShader: () => ({ id: n++ }),
    shaderSource: (_s: unknown, src: string) => void sources.push(src),
    compileShader() {}, attachShader() {}, linkProgram() {}, bindAttribLocation() {}, deleteProgram() {},
    getShaderSource: () => null
  };
  return { gl, sources };
}
function fakeRenderer() {
  const { gl, sources } = fakeGL();
  const r = { getContext: () => gl, debug: { checkShaderErrors: false }, info: { programs: [] as Prog[] } } as unknown as WebGLRenderer & { info: { programs: Prog[] } };
  return { r, sources };
}

describe('progCache', () => {
  beforeEach(() => configureProgCache({ indexedDB: new IDBFactory() }));

  it('is written for three r170 (its raw program put together as rawGlsl says)', () => {
    expect(REVISION).toBe('170');
  });

  it('splits a source into its version, type, name and the rest', () => {
    const s = splitSource(builtIn('v', 'mBody'))!;
    expect(s).toMatchObject({ version: '300 es', type: 'MeshLambertMaterial', name: 'mBody' });
    expect(s.body).not.toContain('SHADER_');
    expect(s.body.startsWith('#define attribute in')).toBe(true);
    expect(splitSource('#version 300 es\nvoid main() {}')).toBeNull();
  });

  it('makes the same shader text again as three compiles a raw one (the two defines moved up)', () => {
    for (const name of ['', 'mCurtain']) {
      const r = rec('k', name), p = rawParams(r)!;
      const { r: renderer, sources } = fakeRenderer();
      new WebGLProgram(renderer, 'k', p, {});
      expect(sources).toEqual([rawGlsl(p, 'vertexShader'), rawGlsl(p, 'fragmentShader')]);
      for (const [made, was] of [[sources[0], r.v], [sources[1], r.f]]) {
        expect(made.split('\n')[0]).toBe('#version 300 es');
        expect(made.split('\n').sort()).toEqual(was.split('\n').sort());
      }
    }
  });

  it('turns down a pair it cannot make again', () => {
    expect(rawParams({ k: 'k', v: builtIn('v'), f: builtIn('f').replace('MeshLambertMaterial', 'MeshBasicMaterial') })).toBeNull();
    expect(rawParams({ k: 'k', v: builtIn('v'), f: builtIn('f').replace('#version 300 es\n', '') })).toBeNull();
    expect(rawParams({ k: 'k', v: 'void main() {}', f: builtIn('f') })).toBeNull();
  });

  it('keeps one set per build and reads back only its own', async () => {
    expect(await readProgs('b1')).toBeNull();
    await writeProgs([rec('a'), rec('b')], 'b1');
    expect((await readProgs('b1'))?.map((r) => r.k)).toEqual(['a', 'b']);
    expect(await readProgs('b2')).toBeNull();
    await writeProgs([rec('c')], 'b2');
    expect(await readProgs('b1')).toBeNull();
    expect((await readProgs('b2'))?.map((r) => r.k)).toEqual(['c']);
    // (no build: the dev server's, nothing kept or read)
    await writeProgs([rec('d')], '');
    expect(await readProgs('')).toBeNull();
  });

  it('reads nothing odd back, and nothing without IndexedDB', async () => {
    await writeProgs(Array.from({ length: PROGS_MAX + 5 }, (_, i) => rec(`k${i}`)), 'b');
    expect((await readProgs('b'))?.length).toBe(PROGS_MAX);
    const idb = new IDBFactory();
    configureProgCache({ indexedDB: idb });
    await writeProgs([rec('a')], 'b');
    // (a record of another shape, as a future one might be)
    await new Promise<void>((ok) => {
      const o = idb.open('island-progs', 1);
      o.onsuccess = () => {
        const t = o.result.transaction('progs', 'readwrite');
        t.objectStore('progs').put({ build: 'b', progs: [{ k: 'a', v: 3 }] }, 'last');
        t.oncomplete = () => (o.result.close(), ok());
      };
    });
    configureProgCache({ indexedDB: idb });
    expect(await readProgs('b')).toBeNull();
    configureProgCache({ indexedDB: null });
    expect(await readProgs('b')).toBeNull();
    await expect(writeProgs([rec('a')], 'b')).resolves.toBeUndefined();
  });

  it('makes the programs three lacks with its own constructor, and lets them go', () => {
    const { r } = fakeRenderer();
    expect(preLink(r, [rec('a')], true)).toEqual([]);
    const own = new WebGLProgram(r, 'own', rawParams(rec('own'))!, {}) as unknown as Prog;
    r.info.programs.push(own);
    const made = preLink(r, [rec('own'), rec('a'), { k: 'bad', v: 'x', f: 'y' }, rec('b')], true);
    expect(made.map((p) => p.cacheKey)).toEqual(['a', 'b']);
    expect(made.every((p) => p instanceof WebGLProgram && p.usedTimes === 1)).toBe(true);
    expect(r.info.programs.map((p) => p.cacheKey)).toEqual(['own', 'a', 'b']);
    // (a material took `a`: handed to it; `b` no one took: out and deleted)
    made[0].usedTimes++;
    for (const p of made) letGo(r, p);
    expect(made[0].usedTimes).toBe(1);
    expect(r.info.programs.map((p) => p.cacheKey)).toEqual(['own', 'a']);
    expect(made[1].program).toBeUndefined();
  });

  it('keeps a program by its key and the sources the GPU was given', () => {
    const gl = { getShaderSource: (s: { src: string }) => s.src };
    const p = { cacheKey: 'k', program: {}, vertexShader: { src: 'v' }, fragmentShader: { src: 'f' } } as unknown as Prog;
    expect(recOf(gl as never, p)).toEqual({ k: 'k', v: 'v', f: 'f' });
    expect(recOf(gl as never, { ...p, program: undefined })).toBeNull();
  });

  it("reports the launch's wait on links after the models were in", () => {
    expect(progsOf({ progPre: 20, progHit: 19, linkedAt: 0 }, 500)).toEqual({ progPre: 20, progHit: 19, prog: 0 });
    expect(progsOf({ progPre: 0, progHit: 0, linkedAt: 480 }, 500).prog).toBe(0);
    expect(progsOf({ progPre: 0, progHit: 0, linkedAt: 588.4 }, 500).prog).toBe(88);
  });
});
