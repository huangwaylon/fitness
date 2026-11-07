// The recogniser's files (models.ts): the parts' names, the split and its assembly, the sha256 check, and ensureStt's
// cache (only what's missing fetched, a file that fails its check thrown away, other versions deleted), on a small
// fake set: no network, no real model.
import { describe, expect, it } from 'vitest';
import { ORT, PART_BYTES, STT_ID, STT_SETS, WHISPER, assemble, ensureStt, fileUrls, partNames, partsFor, sha256, split, sttCached, sttMB, type SttFile } from './models.ts';

const ROOT = 'https://x.test/stt/';
function bytes(n: number, seed = 1): Uint8Array {
  const b = new Uint8Array(n);
  let x = seed;
  for (let i = 0; i < n; i++) b[i] = (x = (x * 1103515245 + 12345) >>> 0) >>> 24;
  return b;
}
/** Byte-equal (toEqual walks a 20 MB array element by element). */
const same = (a: Uint8Array | null, b: Uint8Array) => !!a && Buffer.from(a.buffer, a.byteOffset, a.length).equals(Buffer.from(b.buffer, b.byteOffset, b.length));

/** A Cache's match/put/delete/keys over a Map, by URL. */
function fakeCache() {
  const m = new Map<string, Response>();
  return {
    m,
    match: async (k: RequestInfo | URL) => m.get(String(k instanceof Request ? k.url : k))?.clone(),
    put: async (k: RequestInfo | URL, r: Response) => void m.set(String(k instanceof Request ? k.url : k), r),
    delete: async (k: RequestInfo | URL) => m.delete(String(k instanceof Request ? k.url : k)),
    keys: async () => [...m.keys()].map((u) => new Request(u))
  };
}

/**
 * A fake site: each pinned file swapped (in place: ensureStt reads STT_SETS) for small fake bytes with as many parts,
 * its bytes and sha256 its own, and what the site serves (its parts, named as stt-models.ts writes them; `bad`
 * corrupts the one at that index of the decoder's parts); `run`, then the pins put back.
 */
async function withSite<T>(run: (site: { served: Map<string, Uint8Array>; content: Map<string, Uint8Array> }) => Promise<T>, bad?: number): Promise<T> {
  const was = STT_SETS.map((s) => s.files.map((f) => ({ ...f })));
  const served = new Map<string, Uint8Array>(), content = new Map<string, Uint8Array>();
  for (const s of STT_SETS) {
    for (const f of s.files as SttFile[]) {
      const b = bytes(f.parts > 1 ? PART_BYTES + 10 : 50, f.path.length);
      Object.assign(f, { bytes: b.length, sha256: await sha256(b) });
      content.set(`${ROOT}${s.dir}/${f.path}`, b);
      const names = partNames(f), corrupt = f.path === 'onnx/decoder_model_merged_quantized.onnx' ? bad : undefined;
      (f.parts ? split(b) : [b]).forEach((p, i) => served.set(`${ROOT}${s.dir}/${names[i]}`, i === corrupt ? p.map((x) => x ^ 1) : p));
    }
  }
  try {
    return await run({ served, content });
  } finally {
    STT_SETS.forEach((s, i) => s.files.forEach((f, j) => Object.assign(f, was[i][j])));
  }
}

describe('the pinned files', () => {
  it('pins a revision and a version in their dirs, each file with its sha256 and as many parts as its bytes take', () => {
    expect(WHISPER.dir).toBe(`whisper-tiny.en@${WHISPER.rev.slice(0, 8)}`);
    expect(ORT.dir).toBe(`ort/${ORT.version}`);
    expect(STT_ID).toBe(`${WHISPER.dir} ${ORT.dir}`);
    for (const f of STT_SETS.flatMap((s) => s.files)) {
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(f.parts).toBe(f.parts === 0 ? 0 : partsFor(f.bytes));
    }
    // the runtime's script is imported by its URL: whole; every other file over Pages' 25 MiB is in parts
    expect(ORT.files.filter((f) => f.parts === 0).map((f) => f.path)).toEqual(['ort-wasm-simd-threaded.asyncify.mjs']);
    expect(STT_SETS.flatMap((s) => s.files).every((f) => f.bytes / (f.parts || 1) <= 25 * 1024 * 1024)).toBe(true);
    expect(sttMB()).toBe(70);
  });

  it("names a file's parts by its sha256's first 8 hex digits", () => {
    const f = { path: 'onnx/a.onnx', bytes: 1, sha256: 'abcdef0123'.padEnd(64, '0'), parts: 2 };
    expect(partNames(f)).toEqual(['onnx/a.onnx.abcdef01.p0', 'onnx/a.onnx.abcdef01.p1']);
    expect(partNames({ ...f, parts: 0 })).toEqual(['onnx/a.onnx']);
    expect(partsFor(PART_BYTES)).toBe(1);
    expect(partsFor(PART_BYTES + 1)).toBe(2);
  });
});

describe('split and assemble', () => {
  it('cuts at PART_BYTES and puts the parts back only when their length and sha256 are the file', async () => {
    const b = bytes(PART_BYTES * 2 + 7);
    const parts = split(b);
    expect(parts.map((p) => p.length)).toEqual([PART_BYTES, PART_BYTES, 7]);
    const f = { path: 'f', bytes: b.length, sha256: await sha256(b), parts: 3 };
    expect(same(await assemble(f, parts), b)).toBe(true);
    // a part missing, a byte changed, the parts swapped: refused
    expect((await assemble(f, parts.slice(0, 2))) === null).toBe(true);
    const bad = parts.map((p) => p.slice());
    bad[2][0] ^= 1;
    expect((await assemble(f, bad)) === null).toBe(true);
    expect((await assemble({ ...f, bytes: PART_BYTES * 2, sha256: await sha256(b.subarray(0, PART_BYTES * 2)) }, [parts[1], parts[0]])) === null).toBe(true);
    expect(split(new Uint8Array(0))).toHaveLength(1);
  });

  it('hashes as sha256 does', async () => {
    expect(await sha256(new TextEncoder().encode('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('ensureStt', () => {
  it('fetches every part once, puts each file whole under its own URL, counts the bytes, then fetches nothing', async () => {
    await withSite(async ({ served, content }) => {
      const cache = fakeCache(), asked: string[] = [], seen: [number, number][] = [];
      const fetch = async (u: string) => (asked.push(u), served.has(u) ? new Response(served.get(u)!.slice()) : new Response('', { status: 404 }));
      const worker = 'https://x.test/_app/immutable/workers/stt.abc.js';
      served.set(worker, new TextEncoder().encode('// worker'));
      const total = [...content.values()].reduce((a, b) => a + b.length, 0);
      expect(await ensureStt({ root: ROOT, cache, fetch, extra: [worker], progress: (g, o) => seen.push([g, o]) })).toBe(total);
      expect(asked.sort()).toEqual([...served.keys()].sort());
      expect([...cache.m.keys()].sort()).toEqual([...fileUrls(ROOT), worker].sort());
      for (const [u, b] of content) expect(same(new Uint8Array(await (await cache.match(u))!.arrayBuffer()), b)).toBe(true);
      expect((await cache.match(`${ROOT}${ORT.dir}/ort-wasm-simd-threaded.asyncify.wasm`))!.headers.get('content-type')).toBe('application/wasm');
      expect(seen.at(-1)).toEqual([total, total]);
      expect(seen.every(([g, o], i) => o === total && g <= o && (i === 0 || g >= seen[i - 1][0]))).toBe(true);
      expect(await sttCached(ROOT, cache)).toBe(true);

      asked.length = 0;
      expect(await ensureStt({ root: ROOT, cache, fetch, extra: [worker] })).toBe(0);
      expect(asked).toEqual([]);
    });
  });

  it('fetches only what is missing and deletes what another version left', async () => {
    await withSite(async ({ served, content }) => {
      const cache = fakeCache(), asked: string[] = [];
      const fetch = async (u: string) => (asked.push(u), new Response(served.get(u)!.slice()));
      await ensureStt({ root: ROOT, cache, fetch });
      const enc = `${ROOT}${WHISPER.dir}/onnx/encoder_model_quantized.onnx`;
      await cache.delete(enc);
      await cache.put(`${ROOT}whisper-tiny.en@00000000/config.json`, new Response('old'));
      await cache.put(`${ROOT}ort/0.0.1/ort-wasm-simd-threaded.asyncify.wasm`, new Response('old'));
      asked.length = 0;
      expect(await sttCached(ROOT, cache)).toBe(false);
      await ensureStt({ root: ROOT, cache, fetch });
      expect(asked).toEqual(partNames(WHISPER.files.find((f) => f.path === 'onnx/encoder_model_quantized.onnx')!).map((n) => `${ROOT}${WHISPER.dir}/${n}`));
      expect([...cache.m.keys()].sort()).toEqual(fileUrls(ROOT).sort());
    });
  });

  it('throws a file that fails its check away (named by its path, nothing heard in it) and keeps the good ones', async () => {
    const dec = WHISPER.files.find((f) => f.path === 'onnx/decoder_model_merged_quantized.onnx')!;
    await withSite(async ({ served }) => {
      const cache = fakeCache();
      const fetch = async (u: string) => new Response(served.get(u)!.slice());
      await expect(ensureStt({ root: ROOT, cache, fetch })).rejects.toThrow(`stt: ${WHISPER.dir}/${dec.path} failed its check`);
      expect(await cache.match(`${ROOT}${WHISPER.dir}/${dec.path}`)).toBeUndefined();
      // the files before it are kept: a retry fetches from the bad one on
      expect(await cache.match(`${ROOT}${WHISPER.dir}/config.json`)).toBeDefined();
      expect(await sttCached(ROOT, cache)).toBe(false);
    }, 1);
  });

  it('stops on a part the site does not have', async () => {
    const cache = fakeCache();
    await expect(ensureStt({ root: ROOT, cache, fetch: async () => new Response('', { status: 404 }) })).rejects.toThrow(/^stt: whisper-tiny\.en@2575352d\/config\.json\.[0-9a-f]{8}\.p0 404$/);
    expect(cache.m.size).toBe(0);
  });
});
