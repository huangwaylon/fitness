// The recogniser's files for `/stt/` (docs/kikimimi-mic.md "Hosting and the service worker"; the pins in src/lib/mic/models.ts): whisper tiny.en
// from Hugging Face at the pinned revision and the ONNX runtime's wasm from the pinned onnxruntime-web on npm, each
// checked against its sha256, split into parts of ≤ 20 MiB, written under the out folder as the site serves them
// (`<dir>/<path>.<sha8>.p0…`, a whole file at its path, `manifest.json`). Files already there and right are kept, the
// rest of the folder removed: only what's missing is fetched. Never into git: the deploy job (pages.yml) keeps the
// folder in an Actions cache (keyed on the pins; an older entry restored first, so a change fetches only what changed)
// and copies it into the site's stt/ (until R2: then `--r2 <bucket>` uploads it under stt/, and the
// Pages Function functions/stt/[[path]].ts serves it). The only place the model is downloaded from Hugging Face.
//   node scripts/stt-models.ts [--out .cache/stt]   (fetch, check, split, write)
//   node scripts/stt-models.ts --pin                (a new revision or version: print the files' bytes and sha256 for models.ts)
//   node scripts/stt-models.ts --r2 <bucket>        (then upload them to R2 with wrangler)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { ORT, STT_ID, STT_SETS, WHISPER, assemble, partNames, partsFor, sha256, split, type SttFile, type SttSet } from '../src/lib/mic/models.ts';

const APP = join(import.meta.dirname, '..');
const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : (process.argv[i + 1] ?? '');
};

async function get(url: string): Promise<Uint8Array> {
  for (let tries = 1; ; tries++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(300_000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return new Uint8Array(await res.arrayBuffer());
    } catch (e) {
      if (tries >= 3) throw e;
      console.warn(`retrying ${url}: ${(e as Error).message}`);
    }
  }
}

/** A .tgz's files under `package/dist/` (the npm tarball's layout), by name. */
function untar(tgz: Uint8Array, want: readonly string[]): Map<string, Uint8Array> {
  const tar = gunzipSync(tgz), out = new Map<string, Uint8Array>();
  const str = (a: number, n: number) => tar.subarray(a, a + n).toString('latin1').replace(/\0.*$/s, '');
  for (let at = 0; at + 512 <= tar.length; ) {
    const name = str(at + 345, 155) ? `${str(at + 345, 155)}/${str(at, 100)}` : str(at, 100);
    if (!name) break;
    const size = parseInt(str(at + 124, 12).trim() || '0', 8);
    const f = name.replace(/^package\/dist\//, '');
    if (want.includes(f)) out.set(f, new Uint8Array(tar.subarray(at + 512, at + 512 + size)));
    at += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}

/** The files `want` names (all of them: every file) from their sources: Hugging Face's each on its own, the runtime's
 *  package once. */
async function sources(want?: readonly [SttSet, SttFile][]): Promise<Map<SttSet, Map<string, Uint8Array>>> {
  const wanted = (s: SttSet) => s.files.filter((f) => !want || want.some(([ws, wf]) => ws === s && wf === f));
  const out = new Map<SttSet, Map<string, Uint8Array>>();
  const hf = new Map<string, Uint8Array>();
  for (const f of wanted(WHISPER)) {
    console.log(`fetching ${WHISPER.repo}@${WHISPER.rev.slice(0, 8)}/${f.path}`);
    hf.set(f.path, await get(`https://huggingface.co/${WHISPER.repo}/resolve/${WHISPER.rev}/${f.path}`));
  }
  out.set(WHISPER, hf);
  if (!wanted(ORT).length) return out;
  console.log(`fetching ${ORT.pkg}@${ORT.version}`);
  out.set(ORT, untar(await get(`https://registry.npmjs.org/${ORT.pkg}/-/${ORT.pkg}-${ORT.version}.tgz`), ORT.files.map((f) => f.path)));
  return out;
}

if (process.argv.includes('--pin')) {
  for (const [s, files] of await sources()) {
    console.log(`\n${s.dir}:`);
    for (const f of s.files) {
      const b = files.get(f.path);
      if (!b) throw new Error(`${s.dir}/${f.path}: not in its source`);
      console.log(`    { path: '${f.path}', bytes: ${b.length}, sha256: '${await sha256(b)}', parts: ${f.parts === 0 ? 0 : partsFor(b.length)} },`);
    }
  }
  process.exit(0);
}

const OUT = join(APP, arg('--out') || '.cache/stt');
const names = (s: SttSet, f: SttFile) => partNames(f).map((n) => `${s.dir}/${n}`);
const read = (rel: string) => (existsSync(join(OUT, rel)) ? new Uint8Array(readFileSync(join(OUT, rel))) : null);
/** Whether a file's parts are in OUT and make it. */
async function present(s: SttSet, f: SttFile): Promise<boolean> {
  const parts = names(s, f).map(read);
  return parts.every(Boolean) && !!(await assemble(f, parts as Uint8Array[]));
}

const todo: [SttSet, SttFile][] = [];
for (const s of STT_SETS) for (const f of s.files) if (!(await present(s, f))) todo.push([s, f]);
if (todo.length) {
  const src = await sources(todo);
  for (const [s, f] of todo) {
    const b = src.get(s)?.get(f.path);
    if (!b) throw new Error(`${s.dir}/${f.path}: not in its source`);
    if (b.length !== f.bytes || (await sha256(b)) !== f.sha256) throw new Error(`${s.dir}/${f.path}: ${b.length} bytes, sha256 ${await sha256(b)}; models.ts pins ${f.bytes}, ${f.sha256} (a new revision? --pin)`);
    const parts = f.parts ? split(b) : [b];
    if (parts.length !== partNames(f).length) throw new Error(`${s.dir}/${f.path}: ${parts.length} parts, models.ts says ${f.parts}`);
    names(s, f).forEach((n, i) => {
      mkdirSync(dirname(join(OUT, n)), { recursive: true });
      writeFileSync(join(OUT, n), parts[i]);
    });
  }
}
writeFileSync(join(OUT, 'manifest.json'), `${JSON.stringify({ id: STT_ID }, null, 1)}\n`);

// nothing else in the folder (an older revision's parts)
const keep = new Set(['manifest.json', ...STT_SETS.flatMap((s) => s.files.flatMap((f) => names(s, f)))]);
const walk = (d: string): string[] => readdirSync(d).flatMap((e) => (statSync(join(d, e)).isDirectory() ? walk(join(d, e)) : [relative(OUT, join(d, e))]));
for (const f of walk(OUT)) if (!keep.has(f)) rmSync(join(OUT, f));
const bytes = [...keep].reduce((a, f) => a + statSync(join(OUT, f)).size, 0);
console.log(`${OUT}: ${keep.size} files, ${(bytes / 1048576).toFixed(1)} MiB (${todo.length} written)`);

const bucket = arg('--r2');
if (bucket) {
  for (const f of keep) {
    console.log(`r2 ${bucket}/stt/${f}`);
    execFileSync('npx', ['--yes', 'wrangler@4.156.0', 'r2', 'object', 'put', `${bucket}/stt/${f}`, '--remote', '--file', join(OUT, f)], { stdio: 'inherit' });
  }
}
