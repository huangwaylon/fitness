// 保存した場所's vendored Google details + photos scraper (docs/places.md; the packed output: app/static/places/,
// read by lib/places/vendored.ts): what the relay's payload doesn't carry — Google's own hours, website, phone, a
// short description, the rating and its count, Google's kind, and up to three photos a place — fetched from this
// Mac (Google meets a data-centre egress with /sorry; the recipe is the proven /tmp/gm-scrape sketch: the
// maps/preview/place GET with the captured FLAGS, keyless), staged in scripts/data/places-raw/ (gitignored), and
// packed by scripts/places-pack.py (PIL sprite sheets, fixed settings, stable cells: a re-pack of unchanged
// staging changes nothing).
//   node scripts/places-details.ts daily --ids ids.json --out rows.json [--cap 80] [--minutes 12] [--missing-hours]
//        the daily run's (.github/workflows/places-details.yml, on GitHub's runners): today's places (lib/places/
//        refresh.ts pickDetails) from the relay's queue (record.ts places-ids), one at a time ~2 s apart, as the rows
//        of admin places_details (record.ts places-details): [id, det, photo links] (no photo downloaded), [id, null]
//        a page gone stale; nothing staged. Exit 3: Google blocked it (the rows so far written). --missing-hours: a
//        one-off's places instead (refresh.ts pickNoHours: the looked-up whose details found no hours)
//   node scripts/places-details.ts seed --out rows.json   the staging (11-23's scrape) as those rows, once
//   node scripts/places-details.ts fetch [--limit n] [--only id,…] [--fresh-days 90] [--concurrency 4] [--from dump.json]
//   node scripts/places-details.ts pack      # = python3 -I scripts/places-pack.py
//   node scripts/places-details.ts check     # the committed tree against the CI guard (lib/places/vendored-data.test.ts)
// fetch's list: the relay's GET /places (KEY_A from KEYS_FILE or ~/.config/island-fund/keys, never printed), else
// --from a record dump's rows (offline/dev). Only a cid or an ftid id is scraped (a k: pin has no Google page:
// skipped, counted). Never written: the payload's HTML/JSON (parsed in memory only), Google's names/addresses/
// coordinates (the join is id-only), reviews, authors. Progress and the ledger are counts and ids only.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { placeRows, placesPayloadOf } from '../src/lib/contract/places.ts';
import { parsePlace, type GDetails, type Parsed } from '../src/lib/places/gplace.ts';

const APP = join(import.meta.dirname, '..');
const RAW = join(APP, 'scripts/data/places-raw');
const LEDGER = join(RAW, '_ledger.json');

// node's fetch ignores the proxy env vars without this (this Mac's egress is the ACC proxy): re-exec once with it
const PROXY_VARS = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'all_proxy', 'ALL_PROXY'];
if (!process.env.NODE_USE_ENV_PROXY && PROXY_VARS.some((v) => process.env[v])) {
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } });
  process.exit(r.status ?? 1);
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': UA, 'Accept-Language': 'ja', Referer: 'https://www.google.com/maps' };
// The payload-section flags, captured from the real Maps front-end (rich payload: hours, photos, reviews)
const FLAGS = '!13m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240' +
  '!7m33!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3' +
  '!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!1m3!1e9!2b1!3e2!2b1!9b0!15m8!1m7!1m2!1m1!1e2!2m2!1i195!2i195!3i20';
const RELAY = process.env.RELAY_ORIGIN?.replace(/\/$/, '') ?? 'https://island-fund-relay.island-fund-relay.workers.dev';
const ID = /^(\d+|f:0x[0-9a-f]+:0x[0-9a-f]+)$/;

interface Target { id: string; cid: string | null; ftid: string; kg: string; name: string; lat: number; lng: number }
/** One staged place (scripts/data/places-raw/<safe id>/meta.json; img/<i>.bin its photos' originals). */
type Meta = GDetails & { photos: { ref: string; file: string }[] };
interface Ledger { at: number; kpins: number; stale: string[]; mismatch: string[]; failed: Record<string, string>; blocked: boolean }

const safeId = (id: string): string => id.replace(/[^A-Za-z0-9._-]/g, '_');
/** An id's ftid for the pb: an f: id carries it; a cid's is 0x0:0x<cid in hex> (the ftid's second part IS the cid,
 *  checked on the extract; the payload's own ftid ([6][10]) and cid ([6][181][4]) cross-check it after the fetch). */
const ftidOf = (id: string): { cid: string | null; ftid: string } =>
  id.startsWith('f:') ? { cid: null, ftid: id.slice(2) } : { cid: id, ftid: `0x0:0x${BigInt(id).toString(16)}` };

/** A flag's value (throws when forgotten: `--fresh-days` alone never means default). */
function opt(args: string[], name: string): string | null {
  const i = args.indexOf(name);
  if (i === -1) return null;
  const v = args[i + 1];
  if (v === undefined || v.startsWith('--')) throw new Error(`${name} needs a value`);
  return v;
}

/** The member key for the relay's /places (admin.ts's source: env, else the keys file; never printed). */
function memberKey(): string {
  const k = process.env.KEY_A?.trim().toLowerCase();
  if (k) return k;
  const f = process.env.KEYS_FILE ?? join(homedir(), '.config/island-fund/keys');
  const kv = Object.fromEntries(readFileSync(f, 'utf8').trim().split('\n').map((l) => l.split('=') as [string, string]));
  const key = kv.KEY_A?.trim().toLowerCase();
  if (!key) throw new Error(`no KEY_A in the environment or ${f}`);
  return key;
}

/** The scrape list from the relay (the app's own GET /places), or from a record dump's rows (--from). */
async function targets(from: string | null): Promise<{ list: Target[]; kpins: number }> {
  let rows: { id: string; name: string; lat: number; lng: number }[];
  if (from) {
    const dump = JSON.parse(readFileSync(from, 'utf8')) as { rows: { places: unknown[][] } };
    // a row: [id, cid, ftid, kg, name, lat, lng, addr, short, note, adder, added, modified, deleted_at, …]
    rows = dump.rows.places.filter((r) => r[13] === null && typeof r[0] === 'string')
      .map((r) => ({ id: r[0] as string, name: String(r[4] ?? 'x'), lat: Number(r[5]), lng: Number(r[6]) }));
  } else {
    const res = await fetch(`${RELAY}/places`, { headers: { Authorization: `Bearer ${memberKey()}` } });
    if (!res.ok) throw new Error(`GET /places: ${res.status}`);
    const payload = placesPayloadOf(await res.json());
    if (!payload || !payload.full) throw new Error('GET /places: an unreadable payload');
    rows = placeRows(payload).map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng }));
  }
  const list: Target[] = [];
  let kpins = 0;
  for (const r of rows) {
    if (!ID.test(r.id)) {
      if (r.id.startsWith('k:')) kpins++;
      else kpins++; // an id form we never look up: counted with the pins
      continue;
    }
    const { cid, ftid } = ftidOf(r.id);
    list.push({ id: r.id, cid, ftid, kg: '/g/x', name: r.name, lat: r.lat, lng: r.lng });
  }
  return { list, kpins };
}

/** The place payload URL. Required in pb: the ftid, a name (any — base64url, content ignored), a viewport, a kg (any). */
const placeUrl = (t: Target): string => {
  const pb = `!1m17!1s${t.ftid}!2z${Buffer.from(t.name || 'x', 'utf8').toString('base64url')}` +
    `!3m8!1m3!1d3241!2d${t.lng}!3d${t.lat}!3m2!1i1024!2i768!4f13.1!4m2!3d${t.lat}!4d${t.lng}` +
    `!15m2!1m1!4s${encodeURIComponent(t.kg)}${FLAGS}`;
  return `https://www.google.com/maps/preview/place?authuser=0&hl=ja&gl=jp&pb=${encodeURIComponent(pb).replace(/%21/g, '!')}`;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A GET with retries (×3, a backoff on a non-200 or a network error); null: every try failed, 'blocked': /sorry or 429. */
async function getText(url: string): Promise<{ text: string } | { blocked: true } | null> {
  for (let t = 0; t < 3; t++) {
    let res: Response;
    try {
      res = await fetch(url, { headers: HEADERS });
    } catch {
      await sleep(800 * 2 ** t);
      continue;
    }
    if (res.status === 429) return { blocked: true };
    if (res.status === 200) {
      const text = await res.text();
      if (/google\.com\/sorry|unusual traffic|captcha/i.test(text.slice(0, 3000))) return { blocked: true };
      return { text };
    }
    await sleep(800 * 2 ** t);
  }
  return null;
}

/** One place: fetch, parse, download the photos' originals, stage (or ledger why not). */
async function one(t: Target, ledger: Ledger, now: number): Promise<{ r: 'ok'; photos: number } | { r: 'failed' | 'blocked' | 'stale' }> {
  const got = await getText(placeUrl(t));
  if (!got) {
    ledger.failed[t.id] = 'http';
    return { r: 'failed' };
  }
  if ('blocked' in got) {
    ledger.blocked = true;
    return { r: 'blocked' };
  }
  let parsed: Parsed;
  try {
    parsed = parsePlace(got.text, t, now);
  } catch {
    ledger.failed[t.id] = 'parse';
    return { r: 'failed' };
  }
  if (!parsed.ok) {
    (parsed.why === 'stale' ? ledger.stale : ledger.mismatch).push(t.id);
    return { r: 'stale' };
  }
  const dir = join(RAW, safeId(t.id));
  mkdirSync(join(dir, 'img'), { recursive: true });
  const photos: Meta['photos'] = [];
  for (const ref of parsed.refs) {
    const img = await getPhoto(`${ref}=w1200-k-no`);
    if (!img) continue;
    const file = `img/${photos.length}.bin`;
    writeFileSync(join(dir, file), img);
    photos.push({ ref, file });
  }
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ ...parsed.meta, photos } satisfies Meta));
  return { r: 'ok', photos: photos.length };
}

/** A photo original (=w1200-k-no), retried once; null on a failure (the place keeps its other photos). */
async function getPhoto(url: string): Promise<Buffer | null> {
  for (let t = 0; t < 2; t++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 200) return Buffer.from(await res.arrayBuffer());
    } catch { /* retried below */ }
    await sleep(600 * (t + 1));
  }
  return null;
}

function writeLedger(ledger: Ledger): void {
  mkdirSync(RAW, { recursive: true });
  writeFileSync(LEDGER, JSON.stringify(ledger));
}

/** A places_details row from a parse (the det's keys, the links' bases), or a miss. */
type DetRow = [string, Record<string, unknown>, string[]] | [string, null];
const detRow = (id: string, m: Omit<Meta, 'photos'>, refs: string[]): DetRow => {
  const { v: _v, id: _id, ftid: _f, ...det } = m;
  return [id, det, refs];
};

/** The daily run (the header's `daily`): counts printed, never an id. */
async function cmdDaily(args: string[]): Promise<void> {
  const idsFile = opt(args, '--ids'), out = opt(args, '--out');
  if (!idsFile || !out) throw new Error('daily needs --ids and --out');
  const { pickDetails, pickNoHours, CAP } = await import('../src/lib/places/refresh.ts');
  const live = JSON.parse(readFileSync(idsFile, 'utf8')) as Parameters<typeof pickDetails>[0];
  const cap = Number(opt(args, '--cap') ?? CAP);
  // (--missing-hours, the one-off's: the looked-up whose details found no hours, again)
  const pick = args.includes('--missing-hours') ? { missing: [], refresh: pickNoHours(live, cap), waiting: 0 } : pickDetails(live, { cap });
  const until = Date.now() + Number(opt(args, '--minutes') ?? 12) * 60_000;
  const now = Math.floor(Date.now() / 1000);
  const rows: DetRow[] = [];
  const n = { live: live.length, missing: pick.missing.length, refresh: pick.refresh.length, waiting: pick.waiting, ok: 0, photos: 0, stale: 0, failed: 0, blocked: false };
  for (const [id, lat, lng] of [...pick.missing, ...pick.refresh]) {
    if (Date.now() > until) break;
    if (rows.length + n.failed) await sleep(1500 + Math.random() * 1000);
    const t: Target = { id, ...ftidOf(id), kg: '/g/x', name: 'x', lat, lng };
    const got = await getText(placeUrl(t));
    if (got && 'blocked' in got) {
      n.blocked = true;
      break;
    }
    let parsed: Parsed | null = null;
    try {
      parsed = got ? parsePlace(got.text, t, now) : null;
    } catch { /* a parse failure: tried again tomorrow */ }
    if (!parsed) n.failed++;
    else if (!parsed.ok) {
      n.stale++;
      rows.push([id, null]);
    } else {
      n.ok++;
      n.photos += parsed.refs.length;
      rows.push(detRow(id, parsed.meta, parsed.refs));
    }
  }
  writeFileSync(out, JSON.stringify(rows));
  console.log(`places-details daily: ${JSON.stringify(n)}`);
  if (n.blocked) process.exitCode = 3;
}

/** The seed (the header's `seed`): the staging's places as places_details rows (a stale or mismatched page a miss). */
function cmdSeed(args: string[]): void {
  const out = opt(args, '--out');
  if (!out) throw new Error('seed needs --out');
  const rows: DetRow[] = [];
  for (const d of readdirSync(RAW)) {
    if (d.startsWith('_')) continue;
    try {
      const m = JSON.parse(readFileSync(join(RAW, d, 'meta.json'), 'utf8')) as Meta;
      const { photos, ...meta } = m;
      rows.push(detRow(m.id, meta, photos.map((p) => p.ref)));
    } catch { /* not a place */ }
  }
  const l = JSON.parse(readFileSync(LEDGER, 'utf8')) as Ledger;
  for (const id of [...l.stale, ...l.mismatch]) if (!rows.some((r) => r[0] === id)) rows.push([id, null]);
  writeFileSync(out, JSON.stringify(rows));
  console.log(`places-details seed: ${rows.length} rows (${rows.filter((r) => r[1] === null).length} misses)`);
}

async function cmdFetch(args: string[]): Promise<void> {
  const limit = Number(opt(args, '--limit') ?? 0) || 0;
  const only = opt(args, '--only')?.split(',').filter(Boolean) ?? null;
  const freshDays = Number(opt(args, '--fresh-days') ?? 90);
  const concurrency = Math.max(1, Number(opt(args, '--concurrency') ?? 4));
  const from = opt(args, '--from');
  const { list, kpins } = await targets(from);
  const now = Math.floor(Date.now() / 1000);
  const ledger: Ledger = { at: now, kpins, stale: [], mismatch: [], failed: {}, blocked: false };
  let want = list.filter((t) => !only || only.includes(t.id));
  // resume: a meta within --fresh-days is fresh
  const freshCut = now - freshDays * 86400;
  let fresh = 0;
  want = want.filter((t) => {
    try {
      const m = JSON.parse(readFileSync(join(RAW, safeId(t.id), 'meta.json'), 'utf8')) as Meta;
      if (m.at >= freshCut) {
        fresh++;
        return false;
      }
    } catch { /* no meta: due */ }
    return true;
  });
  if (limit) want = want.slice(0, limit);
  const total = want.length;
  let done = 0, ok = 0, failed = 0, stale = 0, photos = 0, stop = false;
  let i = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (i < want.length && !stop) {
      const t = want[i++];
      const r = await one(t, ledger, now);
      done++;
      if (r.r === 'ok') {
        ok++;
        photos += r.photos;
      } else if (r.r === 'failed') failed++;
      else if (r.r === 'stale') stale++;
      else if (r.r === 'blocked') stop = true;
      if (done % 25 === 0 || done === total) {
        console.log(`places-details: ${done}/${total} (ok ${ok}, fresh ${fresh}, stale ${stale}, failed ${failed}, k: pins ${kpins}, photos ${photos})`);
        writeLedger(ledger);
      }
    }
  }));
  writeLedger(ledger);
  console.log(`places-details: done ${done}/${total} — ok ${ok}, fresh ${fresh}, stale ${stale}, failed ${failed}, k: pins ${kpins}, photos ${photos}${stop ? '; BLOCKED (Google’s /sorry or 429): progress kept, rerun later' : ''}`);
  // a blocked run exits 0: "try later", not a failure
}

function cmdPack(): void {
  const r = spawnSync('python3', ['-I', join(APP, 'scripts/places-pack.py')], { stdio: 'inherit', cwd: APP });
  process.exit(r.status ?? 1);
}

async function cmdCheck(): Promise<void> {
  // vendored.ts's loaders import $app/paths (a SvelteKit virtual module): aliased to a stub for this plain-node
  // run (the guards the check uses never call it; under vitest the real resolution applies)
  const { registerHooks } = await import('node:module');
  registerHooks({
    resolve: (specifier, context, nextResolve) =>
      specifier === '$app/paths'
        ? { url: 'data:text/javascript,export const asset=(p)=>p;export const base="";export const assets="";', shortCircuit: true }
        : nextResolve(specifier, context)
  });
  const { validateVendoredTree } = await import('../src/lib/places/vendored-data.test.ts');
  const r = validateVendoredTree(join(APP, 'static/places'));
  console.log(`places-details check: ${r.places} places, ${r.files} files, ${(r.bytes / 1048576).toFixed(2)} MB${r.fails.length ? '' : ' — valid'}`);
  if (r.fails.length) {
    for (const f of r.fails) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'daily') await cmdDaily(rest);
else if (cmd === 'seed') cmdSeed(rest);
else if (cmd === 'fetch') await cmdFetch(rest);
else if (cmd === 'pack') cmdPack();
else if (cmd === 'check') await cmdCheck();
else {
  console.error('usage: node scripts/places-details.ts daily --ids ids.json --out rows.json [--cap n] [--minutes n] [--missing-hours] | seed --out rows.json | fetch [--limit n] [--only id,…] [--fresh-days 90] [--concurrency 4] [--from dump.json] | pack | check');
  process.exit(1);
}
