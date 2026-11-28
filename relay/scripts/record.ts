// The record's admin tool (docs/ops/runbook.md#9-the-record), run from a Mac with the two person keys in the
// environment (never on the command line of a shared shell, never logged):
//   KEY_A=… KEY_B=… node scripts/record.ts <command> [--test]
// --test: the test relay (island-fund-relay-test) instead of production; RELAY_ORIGIN=http://127.0.0.1:<port> another
// (the restore drill's local relay, with KEYS_FILE). Keys: KEY_A / KEY_B, else KEYS_FILE, else
// .smoke-keys (--test) or ~/.config/island-fund/keys (admin.ts).
//   counts              rows per table, the revision, the newest `at`
//   bookmark [ms]       point-in-time recovery: the bookmark now and `ms` ago (default 1 h)
//   restore <bookmark>  restore the record to a bookmark (a new epoch follows by itself; `rev` only if its note says so)
//   rev                 a new epoch: every phone refetches everything
//   dump                every row as JSON on stdout (a backup: `> island-record-YYYY-MM-DD.json`), fetched in pages
//   backup              the daily backup now (src/archive.ts: dumped, encrypted, uploaded by the relay; it replaces
//                       today's), its outcome (--test: into the release dumps-test)
//   load <file>         a dump into the record (its rows by the record's rules, in chunks; what it has is skipped):
//                       a `.json`, a `.json.gz`, or the backup's `.json.gz.age` / old `.json.age` decrypted in memory
//                       with the age key (ARCHIVE_KEY_FILE, else ~/.config/island-fund/archive-age.key; never printed)
//   img-set <A|B|G> <custom id> <file> [--ig] [--dry-run]   a picture (a 384 px JPEG / WebP, no metadata) set on
//                       that person's custom food as its owner would (`--ig`: an illustration, the イメージ badge)
//   verify-dump [date]  the restore drill, writing nothing: the newest backup (or that day's) from the archive's release
//                       (gh), decrypted and read in memory, its rows per table next to the live record's `counts`
//                       (only counts printed: never a row, never the key), then the newest its-/gym- files' counts
//                       (its: settings present, dates, bookings, events, seen; gym: the version, days, interval)
//   held [A|B]          the values an ingest held back (a past day's 0 over a value above it), never served
//   promote <person> <date> <metric> [value]   a held value made a row of the day's history (its latest now)
//   shopcheck [fix]     the stored field against the fold of the farm rows; `fix`: the fold's taken
//   decorcheck [fix]    the decor caps' kept counts against the rows'; `fix`: the rows' taken
//   adjust <A|B|G> <v> <note>   a correction of that person's かいがら: a `shop_adjust` row of `v` (either sign, the
//                       user's call only; undone by another of −v), its id printed (contract/shop.ts adjustOf)
//   ledger [A|B|G]      the stored ledgers, part by part (a person: their ops applied, newest first)
//   ledgercheck         the stored ledgers against the fold of the rows (while kept), their logs' chains (the 03:00
//                       cron's, logged ledger.drift)
//   ledger-retire [dry] the shop's rows and the day tallies older than 36 days deleted (dump first; only with no
//                       drift), the stored ledger the record's alone; the daily prune keeps new shop rows 2 days
//   todo-migrate [dry]  やること's lists made items of the one list, once (src/todoMigrate.ts; backup first; `dry`:
//                       the counts only, nothing written; a second run changes nothing)
//   tomb-prune [dry]    the removals older than 60 days deleted, as the 03:00 cron does (contract/tomb.ts; `dry`:
//                       the count and their ids only)
//   wallet              each person's かいがら as the stored ledger keeps them (h, seq, at), the fold beside it
//   walletset <A|B|G> <h> <note>   that person's かいがら made h, logged (the user's call only; backup first)
//   inbody <A|B> <date> <muscle_kg> <smm_kg>   an InBody sheet's 筋肉量 and 骨格筋量 for that day, an `inbody` row
//                       (contract/bodyEst.ts; that day's again replaces it): it calibrates that person's estimates; the
//                       day needs its lean mass row.
//                       Values only on the record, never in the repo or a log
//   fin-import [dry] <file.json>   the shared money's rows from a file (docs/finance.md "Import": a JSON array of
//                       {type, data}, data a contract payload) into the record in chunks, each row marked imp: 1; checked
//                       here first (one refused row: nothing sent); idempotent by id (a re-run: all duplicates); refused
//                       past half the day's rows written (run it early in the UTC day); `dry`: counted, nothing written.
//                       Prints counts and the file's per-person balance (this terminal only: never a log)
//   fincheck            the money's nightly check now: live entries, the balance from the slots and from fin_log's replay
//   places              行きたい場所's cron tick now (the categories), counts printed
//   places-pull [--recent] [--force]   the list fetched here into the relay (the whole once in 20 h, else or with
//                       --recent the newest 50), unless a pull just did (Google refuses Cloudflare; places-pull.yml)
//   places-ids <file>   the live places with a Google page into <file> as JSON ([id, lat, lng, added, last look-up]
//                       rows: the details scrape's queue, places-details.yml), the count printed
//   places-details <file>   the scrape's rows ([id, det, links] / [id, null] a miss: app/scripts/places-details.ts
//                       daily) into the record (admin places_details, 400 a call), the counts printed
//                       (signed with PLACES_KEY when it's in the environment: no member keys needed)
// (the phones' and the relay's events: scripts/logs.ts, `npm run logs`)
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { signed, TEST } from './admin.ts';
import { openDump } from '../src/archive.ts';
import { DET_BATCH, getList, PLACES_ALL, PLACES_POLL } from '../src/places.ts';
import { FIN_IMPORT_MAX } from '../src/finance.ts';
import { finClean, finConfigOf, finEntryOf, finNet, finTemplateOf, isFinType, type FinEntry } from '../../app/src/lib/contract/finance.ts';

const args = process.argv.slice(2).filter((a: string) => a !== '--test' && a !== '--dry-run');

const CHUNK = 400;
/** A load request's rows at most this many chars (the relay's ADMIN_MAX_CHARS is 4,000,000). */
const LOAD_CHARS = 2_000_000;
const IMG_CHUNK = 20;

/** The age identity (`AGE-SECRET-KEY-1…`) for a backup's file: read only when one is opened, never printed. */
function ageIdentity(): string {
  const f = process.env.ARCHIVE_KEY_FILE ?? `${homedir()}/.config/island-fund/archive-age.key`;
  const id = readFileSync(f, 'utf8').split('\n').map((l) => l.trim()).find((l) => l.startsWith('AGE-SECRET-KEY-'));
  if (!id) throw new Error(`no age identity in ${f}`);
  return id;
}

/** A dump file's `{rows}` in memory, whatever its kind (archive.ts openDump). */
const readDump = async (bytes: Uint8Array): Promise<{ rev?: string; rows: Record<string, unknown[][]> }> =>
  JSON.parse(await openDump(bytes, new TextDecoder().decode(bytes.slice(0, 21)) === 'age-encryption.org/v1' ? ageIdentity() : undefined)) as { rev?: string; rows: Record<string, unknown[][]> };
/** Rows a dump page (the record's SNAPSHOT_PAGE_MAX at most). */
const DUMP_PAGE = 5000;

/** The dump, a page at a time, as one `{ok, rev, rows}` (what `load` takes); started again if the epoch changes under it. */
async function dump(): Promise<Record<string, unknown>> {
  for (let tries = 0; tries < 3; tries++) {
    const rows = { metrics: [] as unknown[], events: [] as unknown[], uploads: [] as unknown[], held: [] as unknown[], share: [] as unknown[], share_visit: [] as unknown[], places: [] as unknown[] };
    // (the stored ledger, src/ledger.ts: whole on the first page)
    const ledger = { ledger: [] as unknown[], ledger_log: [] as unknown[], fin_log: [] as unknown[] };
    let after: unknown, rev: unknown = null, pages = 0;
    do {
      const r = (await signed({ op: 'dump', limit: DUMP_PAGE, ...(after ? { after } : {}) })) as { ok: boolean; rev: string; next?: string; rows: typeof rows };
      if (!r.ok) throw new Error(`dump: ${JSON.stringify(r)}`);
      if (rev !== null && r.rev !== rev) break;
      rev = r.rev;
      for (const k of ['metrics', 'events', 'uploads', 'held', 'share', 'share_visit', 'places'] as const) rows[k].push(...(r.rows[k] ?? []));
      for (const k of ['ledger', 'ledger_log', 'fin_log'] as const) ledger[k].push(...((r.rows as Record<string, unknown[] | undefined>)[k] ?? []));
      after = r.next;
      pages++;
    } while (after);
    // the custom foods' pictures, a few a page (src/img.ts)
    const img: unknown[] = [];
    let at: unknown;
    if (!after) {
      do {
        const r = (await signed({ op: 'imgdump', ...(at ? { after: at } : {}) })) as { ok: boolean; rev: string; next?: string; img: unknown[] };
        if (!r.ok) throw new Error(`imgdump: ${JSON.stringify(r)}`);
        if (r.rev !== rev) after = 'epoch';
        img.push(...r.img);
        at = r.next;
      } while (at && !after);
    }
    if (!after) {
      console.error(`dump: ${pages} pages, ${rows.metrics.length} metrics, ${rows.events.length} events, ${rows.uploads.length} uploads, ${rows.held.length} held, ${rows.share.length} links, ${rows.share_visit.length} visits, ${rows.places.length} places, ${img.length} pictures, rev ${String(rev)}`);
      return { ok: true, rev, rows: { ...rows, img, ...ledger } };
    }
    console.error('dump: a new epoch under it, again');
  }
  throw new Error('dump: the epoch kept changing');
}

/** Rows into the record in `at` order, CHUNK at a time (the object's CPU per request stays small). */
async function load(rows: { metrics?: unknown[][]; events?: unknown[][]; uploads?: unknown[][]; held?: unknown[][]; img?: unknown[][]; share?: unknown[][]; share_visit?: unknown[][]; places?: unknown[][]; fin_log?: unknown[][] }): Promise<void> {
  // the pictures first (an op naming one shows it at once), IMG_CHUNK a request (~87 kB each as base64)
  for (let i = 0; i < (rows.img ?? []).length; i += IMG_CHUNK) {
    const r = (await signed({ op: 'imgload', img: rows.img!.slice(i, i + IMG_CHUNK) })) as { ok: boolean; added: number; had: number; skipped: number };
    if (!r.ok) throw new Error(`imgload: ${JSON.stringify(r)}`);
    console.log('pictures', JSON.stringify({ added: r.added, had: r.had, skipped: r.skipped }));
  }
  const all = (['metrics', 'events', 'uploads', 'held'] as const).flatMap((tab) => (rows[tab] ?? []).map((r) => ({ tab, r })));
  all.sort((x, y) => String(x.r[0]).localeCompare(String(y.r[0])));
  let sum = { metrics: 0, events: 0, uploads: 0, skipped: 0 };
  let last: unknown = null;
  // CHUNK rows a request, fewer when they're big (a hike_trk row is up to 60 KB; the admin body's cap is 4 M chars)
  for (let i = 0; i < all.length;) {
    const part: Record<string, unknown[][]> = { metrics: [], events: [], uploads: [], held: [] };
    let chars = 0;
    for (const start = i; i < all.length && i - start < CHUNK; i++) {
      const size = JSON.stringify(all[i].r).length;
      if (i > start && chars + size > LOAD_CHARS) break;
      chars += size;
      part[all[i].tab].push(all[i].r);
    }
    const r = (await signed({ op: 'load', rows: part })) as typeof sum & { counts: unknown; ok: boolean };
    if (!r.ok) throw new Error(`load: ${JSON.stringify(r)}`);
    sum = { metrics: sum.metrics + r.metrics, events: sum.events + r.events, uploads: sum.uploads + r.uploads, skipped: sum.skipped + r.skipped };
    last = r.counts;
  }
  // 共有リンク's links, then their visits (by id: idempotent; a restore to before a revocation revives it: runbook §6);
  // 行きたい場所's places (by id; the next tick syncs the list again); the shared money's log (by seq)
  for (const tab of ['share', 'share_visit', 'places', 'fin_log'] as const) {
    for (let i = 0; i < (rows[tab] ?? []).length; i += CHUNK) {
      const r = (await signed({ op: 'load', rows: { [tab]: rows[tab]!.slice(i, i + CHUNK) } })) as { ok: boolean; share?: number; share_visit?: number; places?: number; fin_log?: number; skipped: number; counts: unknown };
      if (!r.ok) throw new Error(`load ${tab}: ${JSON.stringify(r)}`);
      console.log(tab, JSON.stringify({ added: r[tab] ?? 0, skipped: r.skipped }));
      last = r.counts;
    }
  }
  console.log('loaded', JSON.stringify(sum), 'record now', JSON.stringify(last));
}

/** 行きたい場所's list fetched here and handed to the relay (admin places_ingest: read, checked, diffed, categorised),
 *  its only reader (places-pull.yml, on GitHub's runners: Google /sorry-blocks Cloudflare). One Google request a run
 *  (a runner's IP is shared: each extra one risks /sorry): the whole (`4i5000`) when none in 20 h, else the newest 50
 *  (`recent`: always those). Skipped after a pull in 10 min (its-bot's dispatch and the workflow's schedule may both
 *  fire); `force` pulls anyway. Counts only printed. */
async function placesPull(recentOnly: boolean, force: boolean): Promise<void> {
  const st = (await signed({ op: 'places_status' })) as { syncedAt?: number | null; fullAt?: number | null };
  const age = (t?: number | null) => Date.now() - (t ?? 0);
  const recent = recentOnly || age(st.fullAt) < 20 * 3600_000;
  if (!force && age(st.syncedAt) < 10 * 60_000) {
    console.log(new Date().toISOString(), 'places-pull fresh', JSON.stringify({ syncedAt: st.syncedAt, fullAt: st.fullAt }));
    return;
  }
  const list = process.env.PLACES_LIST ?? /^PLACES_LIST = "([^"]+)"/m.exec(readFileSync(`${import.meta.dirname}/../wrangler.toml`, 'utf8'))?.[1];
  if (!list) throw new Error('places-pull: no PLACES_LIST (wrangler.toml)');
  const got = await getList((u, i) => fetch(u, i), list, recent ? PLACES_POLL : PLACES_ALL);
  if ('why' in got) throw new Error(`places-pull: ${got.why}`);
  if (got.status !== 200 || !got.body) throw new Error(`places-pull: Google answered ${got.status}${/\/sorry/.test(got.loc) ? ' (/sorry)' : ''}`);
  const text = await new Response(got.body).text();
  const r = (await signed({ op: 'places_ingest', full: !recent, text })) as { ok: boolean; tick?: Record<string, unknown>; status?: Record<string, unknown> };
  console.log(new Date().toISOString(), 'places-pull', JSON.stringify({ ok: r.ok, kB: Math.round(text.length / 1024), tick: r.tick, count: r.status?.count, syncedAt: r.status?.syncedAt }));
  if (!r.ok) process.exitCode = 1;
}

/** The archive's release (wrangler.toml ARCHIVE_REPO, ARCHIVE_RELEASE). */
const ARCHIVE_REPO = 'huangwaylon/fitness-archive', ARCHIVE_TAG = TEST ? 'dumps-test' : 'dumps';

/** The restore drill: a backup read in memory (never a file), its counts next to the live record's. */
async function verifyDump(day?: string): Promise<void> {
  const gh = (...a: string[]) => execFileSync('gh', [...a, '-R', ARCHIVE_REPO], { maxBuffer: 1 << 30 });
  const assets = gh('release', 'view', ARCHIVE_TAG, '--json', 'assets', '-q', '.assets[].name').toString().split('\n');
  const names = assets.filter((n) => /^island-record-\d{4}-\d{2}-\d{2}\.json(\.gz)?\.age$/.test(n) && (!day || n.includes(day))).sort();
  const name = names.at(-1);
  if (!name) throw new Error(`no dump${day ? ` of ${day}` : ''} in ${ARCHIVE_TAG}`);
  const bytes = gh('release', 'download', ARCHIVE_TAG, '-p', name, '-O', '-');
  const d = await readDump(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.length));
  const n = (k: string) => d.rows[k]?.length ?? 0;
  const dump = { metrics: n('metrics'), events: n('events'), uploads: n('uploads'), held: n('held'), img: n('img'), share: n('share'), share_visit: n('share_visit'), places: n('places'), fin_log: n('fin_log') };
  const live = (await signed({ op: 'counts' })) as { counts: Record<string, number>; rev: string };
  console.log(`${name} (${Math.round(bytes.length / 1024)} kB): rev ${d.rev}, ${JSON.stringify(dump)}`);
  console.log(`the live record: rev ${live.rev}, ${JSON.stringify(live.counts)}`);
  // a dump is the record of its day: no table more than the record's now (Health rows are never deleted)
  // (the pictures may be fewer now: the 03:00 sweep drops the ones no custom food names)
  const ok = (['metrics', 'events', 'uploads'] as const).every((k) => dump[k] <= (live.counts[k] ?? 0)) && dump.metrics > 0 && dump.events > 0;
  console.log(ok ? 'restorable: every table read, none above the record\'s' : 'CHECK: a table empty or above the live record\'s');
  if (!ok) process.exitCode = 1;
  // the bots' state beside it (src/archive.ts runBots; the test relay has none): the newest of each, its counts only
  if (TEST) return;
  for (const bot of ['its', 'gym'] as const) {
    const file = assets.filter((n) => new RegExp(`^${bot}-\\d{4}-\\d{2}-\\d{2}\\.json\\.age$`).test(n) && (!day || n.includes(day))).sort().at(-1);
    if (!file) {
      console.log(`CHECK: no ${bot} file${day ? ` of ${day}` : ''} in ${ARCHIVE_TAG}`);
      process.exitCode = 1;
      continue;
    }
    const b = gh('release', 'download', ARCHIVE_TAG, '-p', file, '-O', '-');
    const x = JSON.parse(await openDump(new Uint8Array(b.buffer, b.byteOffset, b.length), ageIdentity())) as Record<string, unknown>;
    const len = (k: string) => (Array.isArray(x[k]) ? (x[k] as unknown[]).length : -1);
    const said = bot === 'its'
      ? { settings: !!x.settings && typeof x.settings === 'object', dates: (x.settings as { dates?: unknown[] } | undefined)?.dates?.length ?? 0, bookings: len('bookings'), events: len('events'), seen: len('seen') }
      : { version: x.version, days: Object.keys((x.days as object | undefined) ?? {}).length, interval: x.interval_minutes, paused: x.paused };
    const good = bot === 'its' ? said.settings === true && len('bookings') >= 0 && len('events') >= 0 : x.version === 3;
    console.log(`${file} (${Math.round(b.length / 1024)} kB): ${JSON.stringify(said)}${good ? '' : ' CHECK: not its state'}`);
    if (!good) process.exitCode = 1;
  }
}

/** Rows a `fin_import` request (the relay takes FIN_IMPORT_MAX). */
const FIN_IMPORT_CHUNK = Math.min(200, FIN_IMPORT_MAX);

/**
 * `fin-import [dry] <file.json>` (docs/finance.md "Import"): the file checked here as the relay will check it (every
 * row a `{type, data}` the contract takes, an entry with `imp: 1` added), then sent FIN_IMPORT_CHUNK rows a request.
 * The relay keeps each once (by id: a re-run is all duplicates) and refuses a chunk past half the day's rows written
 * (429 `budget`: stopped, the rest for a re-run tomorrow). Prints counts and the file's balance per person, on this
 * terminal only (never an amount in a log, a commit or a workflow).
 */
async function finImport(file: string, dry: boolean): Promise<void> {
  const rows = JSON.parse(readFileSync(file, 'utf8')) as unknown;
  if (!Array.isArray(rows)) throw new Error('fin-import: the file is not a JSON array of {type, data}');
  const types: Record<string, number> = { fin_e: 0, fin_t: 0, fin_c: 0 };
  const entries: FinEntry[] = [], refused: number[] = [];
  for (const [i, r] of rows.entries()) {
    const o = (r && typeof r === 'object' ? r : {}) as { type?: unknown; data?: unknown };
    const data = o.data && typeof o.data === 'object' && !Array.isArray(o.data) ? (o.data as Record<string, unknown>) : null;
    if (!isFinType(o.type) || !data) {
      refused.push(i);
      continue;
    }
    const d = { ...finClean(o.type, data), ...(o.type === 'fin_e' ? { imp: 1 } : {}) };
    const e = o.type === 'fin_e' ? finEntryOf(d, { imp: true }) : null;
    if (o.type === 'fin_e' ? !e : o.type === 'fin_t' ? !finTemplateOf(d) : !finConfigOf(d)) refused.push(i);
    else (types[o.type]++, e && entries.push(e));
  }
  if (refused.length) {
    console.error(`fin-import: ${refused.length} rows the contract refuses (rows ${refused.slice(0, 20).join(', ')}${refused.length > 20 ? ', …' : ''}); nothing sent`);
    process.exitCode = 1;
    return;
  }
  const sum = { added: 0, dup: 0, bad: 0 };
  let sent = 0;
  for (; sent < rows.length; sent += FIN_IMPORT_CHUNK) {
    const r = (await signed({ op: 'fin_import', rows: rows.slice(sent, sent + FIN_IMPORT_CHUNK), ...(dry ? { dry: true } : {}) }).catch((e: Error) => {
      if (!/^\/admin: 429 .*"budget"/.test(e.message)) throw e;
      return null;
    })) as ({ ok: boolean } & Partial<typeof sum>) | null;
    if (!r) {
      console.error(`fin-import: stopped, the day's rows written are past half the Free plan's; ${rows.length - sent} rows left (run it again after 00:00 UTC: what's in is skipped)`);
      process.exitCode = 1;
      break;
    }
    if (!r.ok) throw new Error(`fin_import: ${JSON.stringify(r)}`);
    for (const k of Object.keys(sum) as (keyof typeof sum)[]) sum[k] += r[k] ?? 0;
  }
  const net = finNet(entries), yen = (v: number) => `${v < 0 ? '-' : '+'}¥${Math.abs(v).toLocaleString('en-US')}`;
  console.log(`fin-import${dry ? ' (dry: nothing written)' : ''}: ${rows.length} rows (${types.fin_e} entries, ${types.fin_t} templates, ${types.fin_c} config), ${Math.min(sent, rows.length)} sent: added ${sum.added}, duplicates ${sum.dup}, refused ${sum.bad}`);
  console.log(`the file's balance, all time (live entries ${entries.filter((e) => e.del === undefined).length}): A ${yen(net)}, B ${yen(-net)}${net === 0 ? ' (even)' : net > 0 ? ' (B owes A)' : ' (A owes B)'}`);
}

/** `img-set <A|B|G> <custom id> <file> [--ig] [--dry-run]`: a picture on that person's custom food as its owner would
 *  set it (src/store.ts imgSet; the file a 384 px JPEG or WebP without metadata: src/img.ts imgCheck). */
async function imgSet(who: string, custom: string, file: string): Promise<void> {
  const data = readFileSync(file).toString('base64');
  const r = await signed({ op: 'img-set', who, custom, data, ...(process.argv.includes('--ig') ? { ig: true } : {}), ...(process.argv.includes('--dry-run') ? { dry: true } : {}) });
  // (never the picture's id: a capability)
  console.log(JSON.stringify({ ...r, op: undefined }));
  if (r.ok !== true) process.exitCode = 1;
}

const [cmd, arg] = args;
switch (cmd) {
  case 'counts':
  case 'rev':
  case 'backup':
    console.log(JSON.stringify(await signed({ op: cmd })));
    break;
  // 行きたい場所: a tick now (`full`: the whole list), its counts and the status (never a place)
  case 'places':
    console.log(JSON.stringify(await signed({ op: 'places' })));
    break;
  case 'places-pull':
    await placesPull(process.argv.includes('--recent'), process.argv.includes('--force'));
    break;
  case 'places-details': {
    if (!arg) throw new Error('places-details <file>');
    const rows = JSON.parse(readFileSync(arg, 'utf8')) as unknown[];
    const sum = { n: 0, changed: 0, missed: 0, skipped: 0, bad: 0 };
    for (let i = 0; i < rows.length; i += DET_BATCH) {
      // (over the day's budget, the relay's write guard: the rest waits for tomorrow's run, not a failure)
      const r = (await signed({ op: 'places_details', rows: rows.slice(i, i + DET_BATCH) }).catch((e: Error) => {
        if (!/^\/admin: 429 .*"budget"/.test(e.message)) throw e;
        console.log(`::notice::places-details: over the relay's daily budget, ${rows.length - i} rows left for tomorrow`);
        return null;
      })) as ({ ok: boolean } & Partial<typeof sum>) | null;
      if (!r) break;
      if (!r.ok) throw new Error('places_details: refused');
      for (const k of Object.keys(sum) as (keyof typeof sum)[]) sum[k] += r[k] ?? 0;
    }
    console.log(new Date().toISOString(), 'places-details', JSON.stringify({ rows: rows.length, ...sum }));
    break;
  }
  // (into a file, never stdout: the ids and coordinates stay out of the public run's log)
  case 'places-ids': {
    if (!arg) throw new Error('places-ids <file>');
    const r = (await signed({ op: 'places_ids' })) as { ok: boolean; ids?: unknown[] };
    if (!r.ok || !Array.isArray(r.ids)) throw new Error('places_ids: refused');
    writeFileSync(arg, JSON.stringify(r.ids));
    console.log(new Date().toISOString(), 'places-ids', JSON.stringify({ n: r.ids.length }));
    break;
  }
  case 'bookmark':
    console.log(JSON.stringify(await signed({ op: 'bookmark', ...(arg ? { ms: Number(arg) } : {}) })));
    break;
  case 'restore':
    console.log(JSON.stringify(await signed({ op: 'restore', bookmark: arg })));
    break;
  case 'dump':
    process.stdout.write(`${JSON.stringify(await dump())}\n`);
    break;
  case 'held':
    console.log(JSON.stringify(await signed({ op: 'held', ...(arg ? { person: arg } : {}) })));
    break;
  case 'promote': {
    const [, person, date, metric, value] = args;
    console.log(JSON.stringify(await signed({ op: 'promote', person, date, metric, ...(value !== undefined ? { value: Number(value) } : {}) })));
    break;
  }
  case 'shopcheck':
  case 'decorcheck':
    console.log(JSON.stringify(await signed({ op: cmd, ...(arg === 'fix' ? { fix: true } : {}) })));
    break;
  case 'adjust': {
    const [, who, v, ...note] = args;
    console.log(JSON.stringify(await signed({ op: 'adjust', id: `adjust-${randomUUID()}`, who, v: Number(v), note: note.join(' ') })));
    break;
  }
  // the island days before yesterday and the old farm_water rows deleted (`dry`: the count only)
  case 'island-prune':
    console.log(JSON.stringify(await signed({ op: 'island_prune', ...(arg === 'dry' ? { dry: true } : {}) })));
    break;
  // the removals past their keep deleted (src/store.ts tombPrune; `dry`: the count and their ids, nothing deleted)
  case 'tomb-prune':
    console.log(JSON.stringify(await signed({ op: 'tomb_prune', ...(arg === 'dry' ? { dry: true } : {}) })));
    break;
  // やること's lists made items of the one list (src/store.ts todoMigrate; `dry`: counted, nothing written)
  case 'todo-migrate':
    console.log(JSON.stringify(await signed({ op: 'todo_migrate', ...(arg === 'dry' ? { dry: true } : {}) })));
    break;
  case 'wallet':
  case 'ledgercheck':
    console.log(JSON.stringify(await signed({ op: cmd })));
    break;
  // the shop's rows and the old day tallies deleted, the stored ledger the record's alone (src/store.ts ledgerRetire)
  case 'ledger-retire':
    console.log(JSON.stringify(await signed({ op: 'ledger_retire', confirm: 'retire-ledger-rows', ...(arg === 'dry' ? { dry: true } : {}) })));
    break;
  // the stored ledgers (src/ledger.ts), part by part; with a person, their ops applied, newest first
  case 'ledger':
    console.log(JSON.stringify(await signed({ op: 'ledger', ...(arg ? { log: arg } : {}) })));
    break;
  case 'walletset': {
    const [, who, h, ...note] = args;
    console.log(JSON.stringify(await signed({ op: 'walletset', id: `walletset-${randomUUID()}`, who, h: Number(h), note: note.join(' ') })));
    break;
  }
  case 'inbody': {
    const [, person, date, muscle, smm] = args;
    const r = await signed({ op: 'inbody', id: `inbody-${randomUUID()}`, who: person, date, muscle_kg: Number(muscle), smm_kg: Number(smm) });
    if (r.ok !== true) throw new Error('usage: inbody <A|B> <YYYY-MM-DD> <muscle_kg> <smm_kg> (kg, one decimal)');
    console.log(`✓ ${person} ${date}: kept`);
    break;
  }
  case 'img-set':
    await imgSet(args[1], args[2], args[3]);
    break;
  case 'verify-dump':
    await verifyDump(arg);
    break;
  case 'load':
    await load((await readDump(readFileSync(arg))).rows);
    break;
  case 'fin-import': {
    const dry = arg === 'dry', file = dry ? args[2] : arg;
    if (!file) throw new Error('fin-import [dry] <file.json>');
    await finImport(file, dry);
    break;
  }
  // (the balance on this terminal only: never logged)
  case 'fincheck':
    console.log(JSON.stringify(await signed({ op: 'fincheck' })));
    break;
  default:
    console.error('commands: counts | backup | bookmark [ms] | restore <bookmark> | rev | dump | load <file> | verify-dump [date] | held [person] | promote <person> <date> <metric> [value] | shopcheck [fix] | decorcheck [fix] | adjust <who> <v> <note> | img-set <who> <custom> <file> [--ig] [--dry-run] | island-prune [dry] | ledger [who] | ledgercheck | ledger-retire [dry] | wallet | walletset <who> <h> <note> | inbody <person> <date> <muscle_kg> <smm_kg> | places | places-pull [--recent] [--force] | places-details <file> | places-ids <file> | tomb-prune [dry] | todo-migrate [dry] | fin-import [dry] <file.json> | fincheck  [--test]');
    process.exit(1);
}
