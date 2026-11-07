import { describe, expect, it } from 'vitest';
import { createWarmup, texturesOf, UPLOAD_PX, WAIT_MAX_MS } from './warmup.ts';
import type { Material, Texture, WebGLRenderer } from 'three';

/** A renderer's properties and initTexture, faked: programs that link when told, textures uploaded by initTexture. */
function fake() {
  const props = new WeakMap<object, Record<string, unknown>>();
  const get = (o: object) => (props.has(o) ? props.get(o)! : (props.set(o, {}), props.get(o)!));
  const uploads: Texture[] = [];
  const renderer = {
    properties: { get, has: (o: object) => props.has(o) },
    initTexture(t: Texture) {
      uploads.push(t);
      get(t).__version = t.version;
    }
  } as unknown as Pick<WebGLRenderer, 'properties' | 'initTexture'>;
  const prog = () => {
    const p = { ready: false, used: 0, program: {} as unknown, isReady: () => p.ready, getUniforms: () => void p.used++ };
    return p;
  };
  const tex = (side = 512) => ({ isTexture: true, version: 1, image: { width: side, height: side } }) as unknown as Texture;
  const mat = (p: ReturnType<typeof prog>, ...maps: Texture[]) => {
    const m = { map: maps[0] ?? null, emissiveMap: maps[1] ?? null } as unknown as Material;
    get(m).programs = new Map([['k', p]]);
    get(m).currentProgram = p;
    return m;
  };
  return { renderer, uploads, prog, tex, mat };
}

describe('the warm-up: a new material made ready over frames (A1)', () => {
  it('waits for the link, primes the new program once, uploads its textures, then lets everything go together', () => {
    const f = fake();
    let t = 0;
    const w = createWarmup(f.renderer, () => t);
    const pa = f.prog(), pb = f.prog();
    const a = f.mat(pa, f.tex(), f.tex(256)), b = f.mat(pb, f.tex(64));
    w.add([a, b], [pa, pb]);
    expect(w.size()).toBe(2);
    // linking: no prime yet, the uploads go ahead
    expect(w.step()).toBe(false);
    expect(pa.used + pb.used).toBe(0);
    expect(f.uploads.length).toBe(3);
    pa.ready = true;
    expect(w.step()).toBe(false);
    expect(pa.used).toBe(1);
    // a is ready, b still links: both held (has) till b is
    expect(w.has(a)).toBe(true);
    pb.ready = true;
    expect(w.step()).toBe(true);
    expect([pa.used, pb.used]).toEqual([1, 1]);
    expect(w.size()).toBe(0);
  });

  it('a material drawn before (no new program, its textures up) never waits', () => {
    const f = fake();
    const p = f.prog();
    p.ready = true;
    const tx = f.tex();
    f.renderer.initTexture(tx);
    const w = createWarmup(f.renderer, () => 0);
    w.add([f.mat(p, tx)], []);
    expect(w.size()).toBe(0);
  });

  it('uploads at most UPLOAD_PX a step (at least one)', () => {
    const f = fake();
    const w = createWarmup(f.renderer, () => 0);
    const p = f.prog();
    p.ready = true;
    const big = Math.ceil(Math.sqrt(UPLOAD_PX * 0.6));
    w.add([f.mat(p, f.tex(big), f.tex(big))], [p]);
    w.step();
    expect(f.uploads.length).toBe(1);
    expect(w.step()).toBe(true);
    expect(f.uploads.length).toBe(2);
  });

  it('never holds for good: a program that never links, or a deleted one', () => {
    const f = fake();
    let t = 0;
    const w = createWarmup(f.renderer, () => t);
    const stuck = f.prog(), gone = f.prog();
    gone.program = undefined;
    w.add([f.mat(stuck), f.mat(gone)], [stuck, gone]);
    expect(w.step()).toBe(false);
    expect(gone.used).toBe(0);
    t = WAIT_MAX_MS + 1;
    expect(w.step()).toBe(true);
  });

  it("finds a material's textures: its maps and a shader's uniforms", () => {
    const f = fake();
    const a = f.tex(), b = f.tex();
    expect(texturesOf({ map: a, emissiveMap: a, color: 1 } as unknown as Material)).toEqual([a]);
    expect(texturesOf({ uniforms: { uTex: { value: b }, uN: { value: 2 } } } as unknown as Material)).toEqual([b]);
  });
});
