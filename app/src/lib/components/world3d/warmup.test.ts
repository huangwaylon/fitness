import { describe, expect, it, vi } from 'vitest';
import { createWarmup, pixels, pollReady, texturesOf, UPLOAD_PX, WAIT_MAX_MS } from './warmup.ts';
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

  it("counts a compressed texture by its levels' bytes (over RGBA's 4), an image by its pixels", () => {
    const astc = { isTexture: true, isCompressedTexture: true, version: 1, image: { width: 512, height: 512 }, mipmaps: [{ data: new Uint8Array(262_144) }, { data: new Uint8Array(65_536) }] } as unknown as Texture;
    expect(pixels(astc)).toBe((262_144 + 65_536) / 4);
    expect(pixels(fake().tex(512))).toBe(512 * 512);
    // (so a step takes ~3x the KTX2s it took by pixels: the island's ~210 in 2 steps, not 5-6)
    const f = fake(), w = createWarmup(f.renderer, () => 0), p = f.prog();
    p.ready = true;
    const ktx = () => ({ ...astc, mipmaps: [{ data: new Uint8Array(262_144) }] }) as unknown as Texture;
    w.add([f.mat(p, ...Array.from({ length: 2 }, ktx))], [p]);
    const many = Array.from({ length: 30 }, ktx);
    w.add(many.map((t) => f.mat(p, t)), []);
    w.step();
    expect(f.uploads.length).toBe(Math.floor(UPLOAD_PX / 65_536));
  });

  it('keep: all of it held even when ready, till a step without', () => {
    const f = fake(), w = createWarmup(f.renderer, () => 0), p = f.prog();
    p.ready = true;
    const m = f.mat(p, f.tex(64));
    w.add([m], [p]);
    expect(w.step(true)).toBe(false);
    expect(w.step(true)).toBe(false);
    expect(w.has(m)).toBe(true);
    expect(w.step()).toBe(true);
    expect(w.size()).toBe(0);
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

describe("the museum's compile poll", () => {
  it('lets each go once ready, then is done; a program that never links is let go of WAIT_MAX_MS on', () => {
    vi.useFakeTimers();
    let t = 0, linked = false;
    const done = vi.fn(), waiting = new Set(['a', 'never']);
    pollReady(waiting, (m) => m === 'a' && linked, done, () => t);
    linked = true;
    for (; t < WAIT_MAX_MS - 40; t += 40) vi.advanceTimersByTime(40);
    expect(waiting).toEqual(new Set(['never']));
    expect(done).not.toHaveBeenCalled();
    t = WAIT_MAX_MS;
    vi.advanceTimersByTime(40);
    expect(done).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
  it('a cancel stops it', () => {
    vi.useFakeTimers();
    const done = vi.fn();
    pollReady(new Set([1]), () => false, done)();
    vi.advanceTimersByTime(WAIT_MAX_MS * 2);
    expect(done).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
