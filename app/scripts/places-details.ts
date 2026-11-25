// 保存した場所's daily Google details run (.github/workflows/places-details.yml, on GitHub's runners; docs/places.md
// "Details"): what the relay's list doesn't carry — Google's own hours, website, phone, a short description, the
// rating and its count, Google's kind, and up to ten photo links a place (contract PICS_MAX) — from the maps/preview/
// place GET with the captured FLAGS, keyless (Google meets a Cloudflare egress with /sorry).
//   node scripts/places-details.ts due --ids ids.json [--cap 80]
// the run's guard (refresh.ts dueToday): `skip=0|1`, `ageH=<newest look-up's age>` for $GITHUB_OUTPUT, counts on stderr.
//   node scripts/places-details.ts daily --ids ids.json --out rows.json [--cap 80] [--minutes 12] [--missing-hours]
// today's places (lib/places/refresh.ts pickDetails) from the relay's queue (relay/scripts/record.ts places-ids), one
// at a time ~2 s apart, as the rows of admin places_details (record.ts places-details): [id, det, photo links] (no
// photo downloaded), [id, null] a page gone stale. Exit 3: Google blocked it (the rows so far written). --missing-
// hours: a one-off's places instead (refresh.ts pickNoHours: the looked-up whose details found no hours). Never
// written: the payload's HTML/JSON (parsed in memory only), Google's names/addresses/coordinates (the join is id-only),
// reviews, authors. The log is counts only (the repo is public).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PICS_MAX } from '../src/lib/contract/places.ts';
import { parsePlace, type GDetails, type Parsed } from '../src/lib/places/gplace.ts';
import { CAP, dueToday, PICS_BEFORE, pickDetails, pickNoHours, REDO_BEFORE, type LiveId } from '../src/lib/places/refresh.ts';

// node's fetch ignores the proxy env vars without this (a run from a Mac behind a proxy): re-exec once with it
const PROXY_VARS = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'all_proxy', 'ALL_PROXY'];
if (!process.env.NODE_USE_ENV_PROXY && PROXY_VARS.some((v) => process.env[v])) {
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } });
  process.exit(r.status ?? 1);
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': UA, 'Accept-Language': 'ja', Referer: 'https://www.google.com/maps' };
// The payload-section flags, captured from the real Maps front-end (rich payload: hours, photos, reviews); !3m2!2i<n>
// the photos asked for (the front-end's 4; PICS_MAX since 11-24: a 10 answer is ~25% larger)
const FLAGS = `!13m57!2m2!1i203!2i100!3m2!2i${PICS_MAX}!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240` +
  '!7m33!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3' +
  '!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!1m3!1e9!2b1!3e2!2b1!9b0!15m8!1m7!1m2!1m1!1e2!2m2!1i195!2i195!3i20';
interface Target { id: string; cid: string | null; ftid: string; kg: string; name: string; lat: number; lng: number }
/** An id's ftid for the pb: an f: id carries it; a cid's is 0x0:0x<cid in hex> (the ftid's second part IS the cid,
 *  checked on the extract; the payload's own ftid ([6][10]) and cid ([6][181][4]) cross-check it after the fetch). */
const ftidOf = (id: string): { cid: string | null; ftid: string } =>
  id.startsWith('f:') ? { cid: null, ftid: id.slice(2) } : { cid: id, ftid: `0x0:0x${BigInt(id).toString(16)}` };

/** A flag's value (throws when forgotten: `--cap` alone never means default). */
function opt(args: string[], name: string): string | null {
  const i = args.indexOf(name);
  if (i === -1) return null;
  const v = args[i + 1];
  if (v === undefined || v.startsWith('--')) throw new Error(`${name} needs a value`);
  return v;
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

/** A places_details row from a parse (the det's keys, the links' bases), or a miss. */
type DetRow = [string, Record<string, unknown>, string[]] | [string, null];
const detRow = (id: string, m: GDetails, refs: string[]): DetRow => {
  const { v: _v, id: _id, ftid: _f, ...det } = m;
  return [id, det, refs];
};

/** The daily run: counts printed, never an id. */
async function cmdDaily(args: string[]): Promise<void> {
  const idsFile = opt(args, '--ids'), out = opt(args, '--out');
  if (!idsFile || !out) throw new Error('daily needs --ids and --out');
  const live = JSON.parse(readFileSync(idsFile, 'utf8')) as LiveId[];
  const cap = Number(opt(args, '--cap') ?? CAP);
  // (--missing-hours, the one-off's: the looked-up whose details found no hours, again)
  const pick = args.includes('--missing-hours') ? { missing: [], refresh: pickNoHours(live, cap), waiting: 0 } : pickDetails(live, { cap, redoBefore: REDO_BEFORE, picsBefore: PICS_BEFORE });
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

/** The guard (the header's `due`). */
function cmdDue(args: string[]): void {
  const idsFile = opt(args, '--ids');
  if (!idsFile) throw new Error('due needs --ids');
  const live = JSON.parse(readFileSync(idsFile, 'utf8')) as LiveId[];
  const d = dueToday(live, Math.floor(Date.now() / 1000), { cap: Number(opt(args, '--cap') ?? CAP), redoBefore: REDO_BEFORE, picsBefore: PICS_BEFORE });
  console.error(`places-details due: ${JSON.stringify(d)}`);
  console.log(`skip=${d.skip ? 1 : 0}\nageH=${d.ageH}`);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'daily') await cmdDaily(rest);
else if (cmd === 'due') cmdDue(rest);
else {
  console.error('usage: node scripts/places-details.ts due --ids ids.json [--cap n] | daily --ids ids.json --out rows.json [--cap n] [--minutes n] [--missing-hours]');
  process.exit(1);
}
