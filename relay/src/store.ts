// The record (docs/backend.md#the-record): metrics, events and the ingest audit in the store Durable Object's SQLite,
// free of the Workers runtime so it is unit-testable (test/store.test.ts runs it on node:sqlite). One API for the app
// and the Shortcut: `{key, action, ...}` → `{ok, ...}`.
//
// - `at` is the record's clock: strictly increasing (max(now, last + 1 ms)), shared by the rows of one ingest.
// - An event id is accepted once, forever (`ids`: a replaced event's id still dedupes a late retry).
// - A slot (app contract/record.ts eventSlot) holds one event: a later one of the same slot replaces it, so a tally or an
//   island day is one row per person and day (a tally's counts the larger of the two rows', entry by entry: they only
//   grow), a cosmetic pref one per person, a goal one per person and Tokyo day, a decoration one per item, a board
//   post, a meal entry, a repeat, a recipe and a custom food one per id (each one's latest op).
// - A `sell` or a `buy` (the shop, contract/shop.ts) is kept only when the sender's own rows cover it: their tallies'
//   catches less their sells (the pocket), their sells' かいがら less their buys (shopLedger), a piece bought once.
// - A `farm` batch (the field, contract/farm.ts) keeps the ops the field and the sender's pocket allow, a harvest at the
//   yield the record reckons; a `buy_starts` only what their かいがら cover. A `wet` day is the record's own (wetTick).
// - An `sg_reward` (英語すごろく's かいがら, contract/shop.ts) is a row of each recipient's ledger (its `to`), whoever sent
//   it: kept when it pays at least one of them (a game pays each once), refused `reward paid` when it pays none.
// - `since` is answered from the `at` index. A row that arrives out of `at` order (an admin `load` of rows older
//   than the record's) is marked `late` with its arrival time, and a poll also returns the late rows that arrived after
//   `since` (less LATE_MARGIN_MS), so no phone misses one.
import { parseShortcut } from './parse.ts';
import { auditNotes, auditRow } from './audit.ts';
import { eventSlot } from '../../app/src/lib/contract/record.ts';
import { validEvent } from '../../app/src/lib/contract/shopCheck.ts';
import { eventSubject, EVENTS_MAX, EVENT_TYPES, GROUP_MAX, isActivityMetric, isId, isMetricKey, isPersonId, isWho, PROFILE_PREF_KEYS, type SnapshotRows, type PersonId, type Who } from '../../app/src/lib/contract/api.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import { localDateAt, prevDay } from '../../app/src/lib/contract/tokyo.ts';
import { isRoomScope, scopeMayWrite } from '../../app/src/lib/contract/layout.ts';
import { todoClean } from '../../app/src/lib/contract/todo.ts';
import { hikeClean } from '../../app/src/lib/contract/hike.ts';
import { HIKE_TRK_CHARS } from '../../app/src/lib/contract/hikeTrack.ts';
import { cleanText } from '../../app/src/lib/contract/board.ts';
import { isPackType, packClean, PACK_TYPES } from '../../app/src/lib/contract/pack.ts';
import { isWedType, wedClean, WNOTE_DATA_CHARS } from '../../app/src/lib/contract/wedding.ts';
import { foodCustomOp, repeatNext } from '../../app/src/lib/contract/food.ts';
import { CALM_EVENTS } from '../../app/src/lib/contract/live-protocol.ts';
import { inbodyOf } from '../../app/src/lib/contract/bodyEst.ts';
import { PLACES_OPS, verifyAdmin } from './sign.ts';
import { errName } from './log.ts';
import { isLogId, scrubMsg } from '../../app/src/lib/contract/log.ts';
import { roleOfKey } from './auth.ts';
import { guestMayWrite, rowsFor } from '../../app/src/lib/contract/guest.ts';
import { saveName } from '../../app/src/lib/contract/roomSave.ts';
import { isExpiringRemoval, lateOp, tombCut } from '../../app/src/lib/contract/tomb.ts';
import { isShopEvent, rewardOf } from '../../app/src/lib/contract/shop.ts';
import { gameWet } from '../../app/src/lib/contract/wet.ts';
import { backCovered } from '../../app/src/lib/contract/tally.ts';
import { ShareCore } from './share.ts';
import { PlacesCore } from './places.ts';
import { LedgerStore } from './ledger.ts';
import { isShareAction, isShareKind } from '../../app/src/lib/contract/share.ts';
import { nightlyAges, PRUNE_BATCH, runNightly, type NightlyDeps } from './nightly.ts';
import { imgCheck, imgGc, imgGet, imgId, imgLoad, imgPut, imgRows, unb64, type ImgErr } from './img.ts';
import type { Bind } from './storeSchema.ts';
import { StoreBase, fail, type HeldRow, type Rec, type Reply, type StoreIO } from './storeBase.ts';
import { cursorOf, isPageSize, rowsPage, rowsSince, type Cursor } from './storeRows.ts';
import { StoreBooks, FOOD_PARSE, isFoodType } from './storeBooks.ts';
import { StoreShop, walletsTouched } from './storeShop.ts';
import { StoreDump, IMG_DUMP_PAGE, type ImportRows, type ImportResult } from './storeDump.ts';
/** A share's kind as the log names it. */
const shareLogKind = (k: unknown): 'trip' | 'trips' | 'other' => (isShareKind(k) ? k : 'other');

export { keepMetrics, METRICS_TOUCH, SCHEMA_V, type Sql } from './storeSchema.ts';
export { LATE_MARGIN_MS } from './storeRows.ts';

export const RATE_PER_MINUTE = 120;
/** A snapshot's later pages (`after`) per key per minute: their own budget, so a cold fetch of a big record (a page
 *  each SNAPSHOT_PAGE rows) never spends the writes' (O9). */
export const PAGES_PER_MINUTE = 600;
const MAX_EVENT_DATA_CHARS = 20_000;
const UPLOADS_SHOWN = 20;
/** The ingest audit keeps this long (ms): each ingest lets older rows go. */
const UPLOADS_KEEP_MS = 60 * 86_400_000;
/** The newest `at` of a removal let go (tombPrune), and the mark on a snapshot's `rev` for a `since` before it; the
 *  `at` its look through the removals has reached (its cursor). */
const TOMB_META = 'tomb_cut', TOMB_REV = '~t', TOMB_SCAN = 'tomb_scan';
/** The admin ops taken once per signature (a replay within the window would restore, start an epoch or purge again). */
const ADMIN_ONCE = ['restore', 'rev', 'logpurge'];
/** How long their signatures are remembered: past the signature's own window (±5 minutes) on both sides. */
const ADMIN_SEEN_MS = 10 * 60_000;
const utf8 = new TextEncoder();

/** An event's `group` in an `events` batch (store.ts group), or null. */
const groupOf = (e: unknown): string | null => (isRec(e) && isId(e.group) ? e.group : null);
/** Thrown to roll a group's transaction back (store.ts group). */
class GroupRefused extends Error {}

/**
 * The record's API: requests routed and checked here, its parts kept apart: the shared clock, meta and writes
 * (storeBase.ts), the rows read in `at` order (storeRows.ts), each feature's rules (storeBooks.ts), the かいがら and the
 * field (storeShop.ts), the load and the dump (storeDump.ts).
 */
export class StoreCore {
  private rate = { minute: 0, A: 0, B: 0, G: 0 };
  private pages = { minute: 0, A: 0, B: 0, G: 0 };
  private exc: string | null = null;
  /** The request's page session (its body's `sid`): an event's notice carries it, so that page alone skips it. */
  private sid: string | undefined;

  private readonly io: StoreIO;
  private readonly base: StoreBase;
  private readonly books: StoreBooks;
  private readonly shop: StoreShop;
  private readonly dumper: StoreDump;
  /** 共有リンク (share.ts): the members' actions, the visitor's read, the sweep. */
  readonly share: ShareCore;
  /** 行きたい場所 (places.ts): the list's rows, the ticks' writes, `GET /places`. */
  readonly places: PlacesCore;
  /** The stored ledger (ledger.ts): each person's parts, the ops' log. */
  readonly ledger: LedgerStore;

  constructor(io0: StoreIO) {
    const base = (this.base = new StoreBase(io0));
    const io = (this.io = base.io);
    this.books = new StoreBooks(base);
    this.ledger = new LedgerStore(io.sql);
    this.places = new PlacesCore({ sql: io.sql, tx: io.tx, now: io.now, meta: (k) => base.meta(k), setMeta: (k, v) => base.setMeta(k, v) });
    this.share = new ShareCore({
      sql: io.sql, tx: io.tx, now: io.now, meta: (k) => base.meta(k), setMeta: (k, v) => base.setMeta(k, v),
      // (a `trips` link's snapshot: the packing query alone, its four event types; built again when they change)
      source: { pack: (trip) => this.books.packBook(trip) },
      version: () => {
        // (a slot's row replaced in place keeps its seq: its `at`, the record's clock, moves on)
        const r = io.sql.exec<{ n: number; s: number | null; at: string | null }>(`SELECT count(*) AS n, max(seq) AS s, max(at) AS at FROM events WHERE type IN (${PACK_TYPES.map(() => '?').join(', ')})`, ...PACK_TYPES).toArray()[0];
        return `${Number(r?.n ?? 0)}|${Number(r?.s ?? 0)}|${r?.at ?? ''}`;
      }
    });
    this.shop = new StoreShop(base, this.ledger);
    this.dumper = new StoreDump(base, this.books, this.shop, this.share, this.places, this.ledger);
  }

  /** The schema's version (the migrations run): `counts` says it. */
  schemaV(): number {
    return this.base.schemaV();
  }
  /** The data revision (docs/backend.md#revision): an epoch, changed only when the record is rebuilt (an import over it, a restore). */
  rev(): string {
    return this.base.rev();
  }
  /** Start a new epoch: every phone drops its cache and fetches everything, at once when it is open (the notice). */
  bumpRev(): string {
    return this.base.bumpRev();
  }
  /** The newest `at` in the record (for a notice after an import), or null. */
  newestAt(): string | null {
    return this.base.newestAt();
  }

  /** Within the key's minute: RATE_PER_MINUTE requests, and apart from them PAGES_PER_MINUTE snapshot pages after
   *  the first (`page`: a later page's). */
  private underRateLimit(me: Who, page = false): boolean {
    const minute = Math.floor(this.io.now() / 60_000);
    const b = page ? this.pages : this.rate;
    if (b.minute !== minute) Object.assign(b, { minute, A: 0, B: 0, G: 0 });
    return ++b[me] <= (page ? PAGES_PER_MINUTE : RATE_PER_MINUTE);
  }

  /** Set while a restore is under way (storeObject.ts restore): every request is `unavailable` (the phones retry) until
   *  the object restarts on the bookmark, so nothing is acknowledged that the restore then drops. In memory only: the
   *  restart is its end. */
  private frozen = false;

  /** A restore begins (before its bookmark is set): no request is answered but `unavailable` from now on. */
  freeze(): void {
    this.frozen = true;
  }

  /** The restore didn't go ahead (its bookmark refused): requests are answered again. */
  thaw(): void {
    this.frozen = false;
  }

  /** An API request's parsed body (`bytes`: its size, for the audit). Never throws. */
  handle(body: unknown, bytes: number): Reply {
    this.exc = null;
    this.base.told.clear();
    this.sid = isRec(body) && isLogId(body.sid) ? body.sid : undefined;
    if (this.frozen) return fail('unavailable', 'restoring');
    try {
      return this.route(body, bytes);
    } catch (e) {
      // its class and its scrubbed message only: a message can quote the body (docs/ops/observability.md)
      this.exc = errName(e);
      console.error('store', this.exc, scrubMsg(e instanceof Error ? e.message : ''));
      return fail('unavailable');
    }
  }

  /** The class of what the last request threw (its `unavailable`), or null: the log's `req` (reqMeta.ts). */
  lastError(): string | null {
    return this.exc;
  }

  /** An `/api` body as sent → its JSON reply. Never throws. */
  handleText(text: string): string {
    if (!text) return JSON.stringify(fail('bad_request'));
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return JSON.stringify(fail('bad_request'));
    }
    return JSON.stringify(this.handle(body, utf8.encode(text).length));
  }

  /** A signed `/admin` body: its `{op, ...}`, or the status and reply refusing it. */
  async signedOp(text: string, t: string | null, sig: string | null): Promise<{ op: Rec; by: 'admin' | 'places' } | { status: number; body: string }> {
    const by = await verifyAdmin(this.io.keys, t, sig, text, this.io.now());
    if (!by) return { status: 401, body: 'unauthorized' };
    let o: unknown;
    try {
      o = JSON.parse(text);
    } catch {
      return { status: 400, body: 'bad request' };
    }
    if (!isRec(o) || typeof o.op !== 'string') return { status: 400, body: 'bad request' };
    // PLACES_KEY's signature: its few ops only, each signature once
    if (by === 'places' && !PLACES_OPS.includes(o.op)) return { status: 403, body: 'forbidden' };
    if ((by === 'places' || ADMIN_ONCE.includes(o.op)) && sig && !this.firstSeen(sig)) return { status: 409, body: 'replayed' };
    return { op: o, by };
  }

  /** Whether a one-shot admin op's signature is new (and remember it; the old ones let go). */
  private firstSeen(sig: string): boolean {
    return this.io.tx(() => {
      const now = this.io.now();
      this.io.sql.exec('DELETE FROM admin_seen WHERE t < ?', now - ADMIN_SEEN_MS);
      if (this.io.sql.exec('SELECT 1 AS x FROM admin_seen WHERE sig = ?', sig).toArray().length) return false;
      this.io.sql.exec('INSERT INTO admin_seen (sig, t) VALUES (?, ?)', sig, now);
      return true;
    });
  }

  /** The admin `load {rows}`: rows that already have their `at` (a dump's), by the record's rules. */
  load(o: Rec): Record<string, unknown> {
    const rows = o.rows;
    if (!isRec(rows) || !(['metrics', 'events', 'uploads', 'held', 'share', 'share_visit', 'places', 'ledger', 'ledger_log'] as const).every((k) => rows[k] === undefined || Array.isArray(rows[k]))) return { ok: false, error: 'bad_request' };
    const r = this.dumper.import(rows as ImportRows);
    if (r.metrics + r.events) this.base.tellAll();
    return { ok: true, ...r, counts: this.dumper.counts() };
  }

  private route(body: unknown, bytes: number): Reply {
    if (!isRec(body)) return fail('bad_request');
    if (body.action === 'health' && body.key === undefined) return { ok: true, build: this.io.build ?? 'dev' };
    const me = roleOfKey(body.key, this.io.keys);
    if (!me) return fail('unauthorized');
    if (!this.underRateLimit(me, body.action === 'snapshot' && body.page !== undefined && body.after !== undefined)) return fail('busy');
    // the guest (docs/backend.md#the-guest): no Health data in, no audit to read (the uploads hold the members' bodies)
    if (me === 'G' && (body.action === 'ingest' || body.action === 'uploads')) return fail('forbidden');
    if (isShareAction(body.action)) return this.shareAct(me, body.action, body);
    switch (body.action) {
      case 'ingest': return this.ingest(me as PersonId, body, bytes);
      case 'event': return this.event(me, body);
      case 'events': return this.events(me, body);
      case 'snapshot': return this.snapshot(me, body);
      case 'uploads': return this.uploads(me);
      case 'whoami': return { ok: true, me, build: this.io.build ?? 'dev' };
      default: return fail('bad_request');
    }
  }

  /** A share action (share.ts), its make or change logged (`share`: never the token or the id). */
  private shareAct(me: Who, action: Parameters<ShareCore['api']>[1], body: Rec): Reply {
    const t0 = this.io.now();
    const r = this.share.api(me, action, body);
    if (action === 'share_make' || action === 'share_set') {
      this.io.log?.('share', { op: action === 'share_make' ? 'make' : 'set', kind: shareLogKind((r.row as { kind?: string } | undefined)?.kind ?? body.kind), ok: r.ok, ...(r.ok ? {} : { why: r.detail === 'cap' ? 'cap' : 'bad' }), ms: this.io.now() - t0 });
    }
    return r;
  }

  // ---------------------------------------------------------------- reads

  private snapshot(me: Who, body: Rec): Reply {
    let since = '';
    if (typeof body.since === 'string' && body.since) {
      const ms = Date.parse(body.since);
      if (Number.isNaN(ms)) return fail('bad_request');
      since = new Date(ms).toISOString();
    } else if (body.since !== undefined && body.since !== null && body.since !== '') return fail('bad_request');
    // paged (`page`: rows at most, `after`: the last page's `next`); without `page` every row at once, as before: an
    // app from before paging (5a40fa6c, 2026-11-05) never reads `next`, so a reply cut short would lose rows for good
    // (O7: kept unpaged for them; the log's `req` says `pg` 0, so their end shows in `npm run logs`)
    let page: { limit: number; after: Cursor | null } | null = null;
    if (body.page !== undefined) {
      const after = body.after === undefined ? null : cursorOf(body.after);
      if (!isPageSize(body.page) || after === undefined) return fail('bad_request');
      page = { limit: body.page, after };
    } else if (body.after !== undefined) return fail('bad_request');
    // the stored field's `seq` the phone holds (0: none; absent: an app from before 2026-11-25, by `since` alone)
    if (body.fseq !== undefined && !(Number.isInteger(body.fseq) && (body.fseq as number) >= 0)) return fail('bad_request');
    const fseq = body.fseq as number | undefined;
    // every row but, for the guest, the body data (contract/guest.ts rowsFor)
    // (and the かいがら: the relay's wallets, the phones' number since 2026-11-18, walletsFor; with a first fetch or
    // rows only, as a wallet moves only with a row kept, so a poll with nothing new still reads nothing; read before
    // the head's rev, as an older relay's ledger read starts a new epoch: shopState)
    const wallets = (rows: SnapshotRows) => (!since || rows.metrics.length || rows.events.length ? { wallets: this.shop.walletsFor(me) } : {});
    // (the stored ledgers' parts changed after `since`, all on a first fetch, ledger.ts: on a paged fetch's last page,
    // read with its rows, so a part is never older than a row the fetch brought; always there, if empty: a reply
    // without it is an older relay's, and the phones fold the rows again)
    const ledgers = (): Rec => {
      // (and the stored field, when it changed since or isn't the one the phone holds, `fseq`: ledger.ts fieldWire)
      const field = this.ledger.fieldWire(since, fseq);
      return { ledgers: this.ledger.wire(undefined, since), ...(field ? { field } : {}) };
    };
    const head = () => ({ ok: true, me, now: new Date(this.io.now()).toISOString(), rev: this.base.rev() });
    // a cache from before a removal let go (tombPrune) may still hold its item: another `rev`, so the phone fetches
    // everything (an older build too: it starts over on any rev but its cache's)
    const cut = this.base.meta(TOMB_META);
    if (since && cut && since < cut) return { ...head(), rev: `${this.base.rev()}${TOMB_REV}`, rows: { metrics: [], events: [] } };
    if (!page) {
      const rows = rowsSince(this.io.sql, since), w = wallets(rows);
      return { ...head(), rows: rowsFor(me, rows), ...w, ...ledgers() };
    }
    const p = rowsPage(this.io.sql, since, page.after, page.limit), w = wallets(p.rows);
    return { ...head(), rows: rowsFor(me, p.rows), ...(p.next ? { next: p.next } : {}), ...w, ...(p.next ? {} : ledgers()) };
  }

  private uploads(me: Who): Reply {
    const rows = this.io.sql.exec<{ at: string; status: string; bytes: number; notes: string }>(
      'SELECT at, status, bytes, notes FROM uploads WHERE person = ? ORDER BY seq DESC LIMIT ?', me, UPLOADS_SHOWN
    ).toArray().map((r) => ({ at: r.at, status: r.status, bytes: r.bytes, notes: r.notes }));
    return { ok: true, rows };
  }

  // ---------------------------------------------------------------- ingest

  /** The Shortcut's health body (parse.ts): each value that differs from its day's latest row is appended. */
  private ingest(me: PersonId, body: Rec, bytes: number): Reply {
    let parsed: ReturnType<typeof parseShortcut>;
    try {
      parsed = parseShortcut(body);
    } catch (err) {
      const msg = (err instanceof Error ? err.message : String(err)).slice(0, 300);
      this.io.tx(() => this.audit(auditRow(this.base.nextAt(), me, 'error', bytes, msg, body)));
      return fail('bad_request', msg);
    }
    let added: { n: number; at: string | null; act: boolean };
    try {
      added = this.ingestRows(me, parsed, bytes, body);
    } catch (err) {
      // the run rolled back, its audit row with it: an `error` row of its own after, so the failure is seen
      // (`unavailable`, the Shortcut's next run sends it again)
      this.io.tx(() => this.audit(auditRow(this.base.nextAt(), me, 'error', bytes, `not saved: ${errName(err)}`, body)));
      throw err;
    }
    // (the guest hears of it only when it brought rows the guest sees: room.ts guestNotice)
    if (added.at) this.io.notify({ what: 'ingest', who: me, at: added.at, rev: this.base.rev() }, added.act);
    return {
      ok: true, metrics: added.n,
      ...(parsed.skipped ? { skipped: parsed.skipped } : {}),
      ...(parsed.warnings.length ? { warnings: parsed.warnings } : {})
    };
  }

  /** An ingest's rows and its audit row, in one transaction. */
  private ingestRows(me: PersonId, parsed: ReturnType<typeof parseShortcut>, bytes: number, body: Rec): { n: number; at: string | null; act: boolean } {
    return this.io.tx(() => {
      const at = this.base.nextAt();
      // Apple Health's current total is the truth: a day's value is its latest row, and a different one is appended
      // (up or down). Read from metrics_latest over the body's days only (one row a day and metric, never the history).
      const latest = new Map<string, number>();
      const days = parsed.metrics.map((m) => m.date).sort();
      if (days.length) {
        const rows = this.io.sql.exec<{ date: string; metric: string; value: number }>(
          'SELECT date, metric, value FROM metrics_latest WHERE person = ? AND date >= ? AND date <= ?', me, days[0], days[days.length - 1]
        ).toArray();
        for (const r of rows) latest.set(`${r.date}|${r.metric}`, r.value);
      }
      // a past Tokyo day never drops to 0 from a value above it: a run that read nothing (Health locked, Fill
      // Missing's 0 for every day) would rewrite the history; today may still go down to 0
      const today = localDateAt(this.io.now());
      let n = 0, zeros = 0, act = false;
      for (const m of parsed.metrics) {
        const k = `${m.date}|${m.metric}`;
        if (latest.get(k) === m.value) continue;
        if (m.value === 0 && m.date < today && (latest.get(k) ?? 0) > 0) {
          // held, never thrown away (the user's rule: keep all Health data): apart from the history, never served,
          // the admin's to promote (heldRows, promoteHeld)
          this.base.hold(me, m.date, m.metric, m.value, at, 1, null);
          zeros++;
          continue;
        }
        latest.set(k, m.value);
        this.base.addMetric(at, me, m.date, m.metric, m.value, null);
        n++;
        act ||= isActivityMetric(m.metric);
      }
      const notes = [zeros ? `${zeros} past zeros held` : '', auditNotes(parsed)].filter(Boolean).join('; ');
      this.audit(auditRow(at, me, parsed.skipped ? 'partial' : 'ok', bytes, notes, body));
      return n ? { n, at, act } : { n, at: null, act };
    });
  }

  /** The admin's `promote {person, date, metric, value?}`: a held value made a row of `metrics` (the day's latest
   *  now, as an ingest's), the held row kept with its mark. `value`: which, when more than one is held (else the
   *  last seen). */
  promoteHeld(o: Rec): Record<string, unknown> {
    if (!isPersonId(o.person) || typeof o.date !== 'string' || !isMetricKey(o.metric) || (o.value !== undefined && typeof o.value !== 'number')) return fail('bad_request');
    const { person, date, metric } = o as { person: PersonId; date: string; metric: string };
    const r = this.io.tx(() => {
      const h = this.io.sql.exec<{ value: number }>(
        `SELECT value FROM metrics_held WHERE person = ? AND date = ? AND metric = ?${o.value !== undefined ? ' AND value = ?' : ''} ORDER BY last DESC LIMIT 1`,
        ...([person, date, metric, ...(o.value !== undefined ? [o.value as number] : [])] as Bind[])
      ).toArray()[0];
      if (!h) return fail('bad_request', 'nothing held');
      const cur = this.io.sql.exec<{ value: number }>('SELECT value FROM metrics_latest WHERE person = ? AND date = ? AND metric = ?', person, date, metric).toArray()[0];
      if (cur && cur.value === h.value) return fail('bad_request', 'is the latest');
      const at = this.base.nextAt();
      this.base.addMetric(at, person, date, metric, h.value, null);
      this.io.sql.exec('UPDATE metrics_held SET promoted = ? WHERE person = ? AND date = ? AND metric = ? AND value = ?', at, person, date, metric, h.value);
      return { ok: true as const, at, value: h.value };
    });
    if (r.ok) this.io.notify({ what: 'ingest', who: person, at: (r as { at: string }).at, rev: this.base.rev() }, isActivityMetric(metric));
    return r;
  }

  /** An ingest's audit row, and the rows older than UPLOADS_KEEP_MS let go (the (at, person) key's index). */
  private audit(r: readonly unknown[]): void {
    this.base.addUpload(r);
    this.io.sql.exec('DELETE FROM uploads WHERE at < ?', new Date(this.io.now() - UPLOADS_KEEP_MS).toISOString());
  }

  // ---------------------------------------------------------------- events

  private event(me: Who, body: Rec): Reply {
    this.ledger.written.clear();
    const r = this.keep(me, body);
    if (r.ok && r.at) this.io.notify({ what: 'event', who: me, at: r.at, rev: this.base.rev(), ...(this.sid ? { sid: this.sid } : {}), ...(calmType(body.type) ? { calm: true } : {}) });
    const { at: _at, ...reply } = r;
    const touched = walletsTouched(me, [body]);
    return { ...reply, ...(touched.size ? { wallets: this.shop.walletsFor(me, touched) } : {}), ...this.shop.ledgersMoved(touched, body.type === 'farm') };
  }

  /**
   * `events: [{id, type, data, group?}, …]` (≤ EVENTS_MAX; one group alone ≤ GROUP_MAX), kept in order, each as `event` would: `{ok, results}`, one
   * per event (`{id, ok, duplicate?, at?}` or `{id, ok: false, error, detail?}`), `at` the stored row's. One notice for
   * the lot. An event whose write throws is `unavailable` alone (nothing of it kept), never the batch. A `group` (the
   * shop's ぜんぶ: one id, its events side by side) is all or none, in one transaction (`group`).
   */
  private events(me: Who, body: Rec): Reply {
    const list = body.events;
    // (one group alone may be up to GROUP_MAX: a room's whole change, all or none)
    const oneGroup = Array.isArray(list) && list.length <= GROUP_MAX && !!groupOf(list[0]) && list.every((e) => groupOf(e) === groupOf(list[0]));
    if (!Array.isArray(list) || !list.length || (list.length > EVENTS_MAX && !oneGroup)) return fail('bad_request');
    this.ledger.written.clear();
    let last: string | null = null, calm = true;
    const results: (Reply & { id: string | null })[] = [];
    for (let i = 0; i < list.length; ) {
      const g = groupOf(list[i]);
      let j = i + 1;
      while (g && j < list.length && groupOf(list[j]) === g) j++;
      const part = list.slice(i, j);
      const rs = g ? this.group(me, part) : [this.keepOne(me, part[0])];
      for (const [k, r] of rs.entries()) {
        const e = part[k];
        if (r.ok && r.at) (last = r.at), (calm &&= isRec(e) && calmType(e.type));
        const { at, ...rest } = r;
        results.push({ id: isRec(e) && typeof e.id === 'string' ? e.id : null, ...rest, ...(at ? { at } : {}) });
      }
      i = j;
    }
    if (last) this.io.notify({ what: 'event', who: me, at: last, rev: this.base.rev(), ...(this.sid ? { sid: this.sid } : {}), ...(calm ? { calm: true } : {}) });
    // (the wallets the batch may have moved, kept or refused: a phone keeps each one's highest `seq`)
    const touched = walletsTouched(me, list);
    return { ok: true, results, ...(touched.size ? { wallets: this.shop.walletsFor(me, touched) } : {}), ...this.shop.ledgersMoved(touched, list.some((e) => isRec(e) && e.type === 'farm')) };
  }

  /** One event of a batch kept as `keep` would; a write that throws is `unavailable` (its transaction rolled back, its
   *  id still free for a retry). Its class only is logged (a message can quote the body). */
  private keepOne(me: Who, e: unknown, tx?: <R>(fn: () => R) => R): Reply & { at?: string } {
    try {
      return isRec(e) ? this.keep(me, e, tx) : fail('bad_request');
    } catch (err) {
      this.exc = errName(err);
      console.error('store', this.exc, scrubMsg(err instanceof Error ? err.message : ''));
      return fail('unavailable');
    }
  }

  /**
   * A group's events (the shop's ぜんぶ かう: one `buy` a piece) kept all or none, in one transaction: a retry of a
   * group kept is each a duplicate; a buy of a piece the sender has already (their other phone got there first) is
   * refused `owned` alone and costs nothing, the rest kept; any other refusal (`wallet short`: their かいがら spent
   * meanwhile) or a write that throws rolls the lot back, that one answered as it was and the others `group`
   * (`unavailable` for a throw: the phone sends them all again).
   */
  private group(me: Who, part: readonly unknown[]): (Reply & { at?: string })[] {
    const out: (Reply & { at?: string })[] = [];
    let bad: { i: number; r: Reply } | null = null;
    try {
      this.io.tx(() => {
        for (const [i, e] of part.entries()) {
          const r = isRec(e) ? this.keep(me, e, (fn) => fn()) : fail('bad_request');
          if (!r.ok && !(r.error === 'bad_request' && r.detail === 'owned')) {
            bad = { i, r };
            throw new GroupRefused();
          }
          out.push(r);
        }
      });
    } catch (err) {
      if (!(err instanceof GroupRefused)) {
        this.exc = errName(err);
        console.error('store', this.exc, scrubMsg(err instanceof Error ? err.message : ''));
        return part.map(() => fail('unavailable'));
      }
    }
    const b = bad as { i: number; r: Reply } | null;
    return b ? part.map((_, i) => (i === b.i ? b.r : fail('bad_request', 'group'))) : out;
  }

  /** One event checked and kept (or acknowledged): the reply, with the stored row's `at` when one was written. */
  private keep(me: Who, body: Rec, tx: <R>(fn: () => R) => R = (fn) => this.io.tx(fn)): Reply & { at?: string } {
    const id = body.id;
    if (!isId(id)) return fail('bad_request');
    // a retry of an event already kept is acknowledged before any check: its time rules may have lapsed since (a buy
    // retried two days on), and a refusal would drop it on the phone with an error while the record holds it
    if (this.base.known(id)) return { ok: true, duplicate: true };
    if (typeof body.type !== 'string' || !(EVENT_TYPES as readonly string[]).includes(body.type)) return fail('bad_request');
    const sent = body.data === undefined ? {} : body.data;
    if (!isRec(sent)) return fail('bad_request');
    // a board note's text: plain text, sanitised here as on the phone (contract/board.ts cleanText)
    // a meal entry, a repeat, a recipe or a custom food as the phone keeps it: names cleaned, grams to one decimal
    // (contract/food.ts)
    const data: Rec = body.type === 'board' && typeof sent.t === 'string' ? { ...sent, t: cleanText(sent.t) }
      : isFoodType(body.type) ? (FOOD_PARSE[body.type](sent) ?? sent)
      // a packing list's names and notes, a trip note's values: one clean line each (contract/pack.ts packClean)
      : isPackType(body.type) ? packClean(body.type, sent)
      // the wedding board's titles, categories and settings: one clean line each (contract/wedding.ts wedClean)
      : isWedType(body.type) ? wedClean(body.type, sent)
      // やること's titles and items: one clean line each (contract/todo.ts todoClean)
      : body.type === 'todo' ? todoClean(sent)
      // トレイル's hikes: the name and area one clean line, the notes clean (contract/hike.ts hikeClean)
      : body.type === 'hike' ? hikeClean(sent)
      // a saved room's name: one clean line (contract/roomSave.ts saveName)
      : body.type === 'room_save' && typeof sent.name === 'string' ? { ...sent, name: saveName(sent.name) } : sent;
    // the profile is locked (2026-11-15): no one sets or clears a sex or a birth date; a change
    // takes a code change (docs/backend.md `pref`). An older app drops it as any `forbidden`.
    if (body.type === 'pref' && PROFILE_PREF_KEYS.includes(data.key as string)) return fail('forbidden', 'profile locked');
    // the guest writes what a member does, but a からだ goal (contract/guest.ts)
    if (me === 'G' && !guestMayWrite(body.type, data)) return fail('forbidden');
    // a scoped decor op: a home's look and room its owner's, the outdoors anyone's (contract/layout.ts)
    if (body.type === 'decor' && !scopeMayWrite(me, data)) return fail('forbidden');
    const json = JSON.stringify(data);
    // (the wedding note its own cap: a document, contract/wedding.ts; a hike's track its own: contract/hikeTrack.ts)
    if (json.length > (body.type === 'wnote' ? WNOTE_DATA_CHARS : body.type === 'hike_trk' ? HIKE_TRK_CHARS : MAX_EVENT_DATA_CHARS)) return fail('too_large');
    const subject = eventSubject(body.type, data, me);
    if (!subject || !validEvent(body.type, data, this.io.now())) return fail('bad_request');
    // each person sets only their own goals (the user, 2026-11-24): a goal naming another (`person`) is refused
    if (subject !== me) return fail('forbidden', 'not your goal');
    const type = body.type;
    return tx((): Reply & { at?: string } => {
      if (this.base.known(id)) return { ok: true, duplicate: true };
      if (type === 'spend_void') {
        const v = this.books.voidTarget(data.spendId as string);
        // a void names a buy in the record; a second void of it (the other phone got there first) changes nothing
        if (v === 'missing') return fail('bad_request', 'no such spend');
        if (v === 'voided') return { ok: true, duplicate: true };
      }
      // an op on an empty slot whose item is older than a removal's keep: it may have been removed, its row let go
      // (contract/tomb.ts lateOp; tombPrune), so acknowledged and dropped
      if (lateOp(type, data, this.io.now())) {
        const sl = eventSlot(type, me, subject, data, this.io.now());
        if (sl && !this.base.slotRow(sl)) return this.base.stale(id);
      }
      if (type === 'decor') {
        const v = this.books.decorTarget(me, data);
        if (v === 'full') return fail('bad_request', isRoomScope(data.sc) ? 'tent full' : data.sc ? 'layout full' : 'decor full');
        if (v === 'stale') {
          return this.base.stale(id);
        }
      }
      if (isShopEvent(type)) {
        // the shop: only what the sender's pocket holds, only what their かいがら cover, a piece once (contract/shop.ts)
        // (the stored ledger's judgement, ledger.ts: the running one only kept beside it)
        const why = this.shop.ledgerTarget(me, type, data);
        if (why) return fail('bad_request', why === 'owned' ? 'owned' : `${why} short`);
      }
      // 英語すごろく's reward: kept while it pays one of its recipients (contract/shop.ts: a game pays each once)
      const rewardTo = type === 'sg_reward' ? rewardOf(data)?.to ?? [] : [];
      if (type === 'sg_reward' && rewardTo.every((who) => this.shop.ledgerTarget(who, type, data))) return fail('bad_request', 'reward paid');
      let drop: string | null = null;
      if (type === 'board') {
        const v = this.books.boardTarget(me, data);
        if (v.v === 'forbidden') return fail('forbidden');
        if (v.v === 'stale') {
          return this.base.stale(id);
        }
        if (v.v === 'append') drop = v.drop;
      }
      let kept = json;
      // (who the row is kept under: the sender, but a recipe's or a custom food's creator for an edit by anyone)
      let by = me;
      let bookDrop: string[] = [];
      // a hike's track: only for a hike held standing, only once (contract/hike.ts hikeTrkAccept)
      if (type === 'hike_trk' && this.books.hikeTrkTarget(data) === 'stale') return this.base.stale(id);
      if (isPackType(type) || isWedType(type) || type === 'todo' || type === 'hike') {
        // a trip's packing list (each person only their own ticks; the trip's cap: contract/pack.ts PackBook) or the
        // wedding board (a subtask only under a task held, the cap: contract/wedding.ts WedBook): an op beaten by the one held is acknowledged;
        // kept as the rules keep it (a note saved over one it wasn't edited from carries that one); やること's lists
        // (anyone's: a list's removal drops its items, the cap: contract/todo.ts TodoBook); トレイル's hikes (anyone's: a
        // removal drops its track, the cap: contract/hike.ts HikeBook)
        const kind = isPackType(type) ? 'pack' : isWedType(type) ? 'wedding' : type === 'todo' ? 'todo' : 'hike';
        const v = kind === 'pack' ? this.books.packTarget(me, type, data) : kind === 'wedding' ? this.books.wedTarget(me, type, data) : kind === 'todo' ? this.books.todoTarget(me, data) : this.books.hikeTarget(me, data);
        if (v.v !== 'append') {
          if (v.v !== 'stale') return fail('bad_request', `${kind} ${v.v}`);
          return this.base.stale(id);
        }
        bookDrop = v.drop;
        kept = JSON.stringify(v.row.op);
      }
      if (isFoodType(type)) {
        // only its owner changes an entry or a repeat; a recipe or a custom food anyone, kept under its creator's name,
        // removed by its creator alone (sharedAccept); an op beaten by the one held is acknowledged (contract/food.ts
        // foodAccept); a repeat's skipped days are never lost (repeatAccept)
        const v = this.books.foodTarget(type, me, data);
        if (v === 'forbidden') return fail('forbidden');
        // a repeat's end that names the repeat following it (`nx`) only once the record holds that one, so a change is
        // both or neither (contract/food.ts repeatNext)
        const nx = type === 'food_repeat' ? repeatNext(sent) : undefined;
        const next = nx === undefined ? null : this.books.foodHeld('food_repeat', nx);
        if (nx !== undefined && (!next || next.rm || next.who !== me)) return fail('bad_request', 'no such repeat');
        if (v === 'stale') {
          return this.base.stale(id);
        }
        kept = JSON.stringify(v.op);
        by = v.who;
      }
      // a day's tally only grows: the slot keeps each entry's larger count of the held row and this one, so a stale
      // lower send (a second phone's, a queue that waited) never takes back a catch a sale counted (contract/tally.ts)
      if (type === 'tally') kept = this.books.tallyKept(me, data);
      if (type === 'island') kept = this.books.islandKept(me, data);
      // the field: the ops it allows at the row's `at`, a harvest at the record's yield (contract/farm.ts farmStep); none:
      // refused, by the first op's reason (`farm taken`: the ack carries the field as it is, ledgersMoved)
      const judged = type === 'farm' ? this.shop.farmKept(me, data) : null;
      if (judged && !judged.ok) return fail('bad_request', `farm ${judged.why}`);
      const farm = judged?.ok ? judged : null;
      if (farm) kept = JSON.stringify(farm.data);
      // what's given back of a day (a claim race lost after its tally came in): only grows, and only what that day's
      // tally holds (contract/tally.ts backCovered)
      if (type === 'tally_back') {
        kept = this.books.tallyKept(me, data, 'tally_back');
        if (!backCovered(this.books.heldTally(me, String(data.date)), (JSON.parse(kept) as { counts: Record<string, number> }).counts)) return fail('bad_request', 'tally short');
      }
      // (a farm row's `at` the one it was judged at: farmKept)
      const at = farm?.at ?? this.base.nextAt();
      if (drop) this.io.sql.exec('DELETE FROM events WHERE slot = ?', `board|${drop}`);
      for (const sl of bookDrop) this.io.sql.exec('DELETE FROM events WHERE slot = ?', sl);
      if (type === 'decor' && data.sc === 'r' && typeof data.at === 'number') this.books.dropVoided(data.at);
      const slot = eventSlot(type, me, subject, data, Date.parse(at));
      const wasDecor = type === 'decor' && slot ? this.io.sql.exec<{ person: string; data: string }>('SELECT person, data FROM events WHERE slot = ?', slot).toArray()[0] ?? null : null;
      // the stored ledger (ledgerNote): a tally's or a give-back's growth is the kept row less the one it replaces
      const was = (type === 'tally' || type === 'tally_back') && slot ? this.books.slotTally(slot) : null;
      // (each ledger it moves seeded first, before this row is in: ledgerReady)
      const ledgers = type === 'tally' || type === 'tally_back' || type === 'farm' || isShopEvent(type) ? [me] : rewardTo;
      for (const who of ledgers) this.shop.ledgerReady(who);
      this.base.put(id, at, by, type, kept, slot, null);
      if (farm) this.shop.farmNote(farm.f, at);
      if (type === 'tally' || type === 'tally_back' || type === 'farm' || type === 'sg_reward' || isShopEvent(type)) this.shop.ledgerNote(me, id, at, type, kept, was, rewardTo, farm);
      if (type === 'decor') this.books.decorNote(me, data, wasDecor);
      if (type === 'todo') this.io.onTodo?.();
      return { ok: true, at };
    });
  }

  /** The admin's `inbody {id, who, date, muscle_kg, smm_kg}`: a member's InBody sheet (contract/bodyEst.ts inbodyOf),
   *  which calibrates their 筋肉量 / 骨格筋量 estimates; a day's again replaces it (its slot). Never a phone's
   *  (contract/record.ts validEventData), never the guest's to see (contract/guest.ts). The phones fetch it as any new row. */
  inbody(o: Rec): Record<string, unknown> {
    const { id, who } = o;
    const data = inbodyOf({ date: o.date, muscle_kg: o.muscle_kg, smm_kg: o.smm_kg });
    if (!isId(id) || !isPersonId(who) || !data) return { ok: false, error: 'bad_request' };
    const r = this.io.tx((): Record<string, unknown> => {
      if (this.base.known(id)) return { ok: true, duplicate: true };
      const at = this.base.nextAt();
      this.base.put(id, at, who, 'inbody', JSON.stringify(data), eventSlot('inbody', who, who, { ...data }, Date.parse(at)), null);
      return { ok: true, id, at };
    });
    if (typeof r.at === 'string') this.io.notify({ what: 'ingest', who, at: r.at, rev: this.base.rev() }, true);
    return r;
  }

  /**
   * The daily prune of removals (nightly.ts tombprune; the admin's `tomb_prune`): each removal row that expires
   * (contract/tomb.ts isExpiringRemoval) stored more than TOMB_KEEP_DAYS ago deleted, its id kept (a retry is a
   * duplicate; a late op, lateOp), the newest such `at` in meta TOMB_META (a snapshot `since` before it refetches
   * everything). A cursor (TOMB_SCAN: the `at` looked through up to), so a run reads only the rows stored since (by
   * events_at), `max` removals a run (the rest the next tick's). Never another row. `dry`: counted only, with their ids.
   */
  tombPrune(dry = false, max = PRUNE_BATCH): { old: number; deleted: number; more: boolean; types: Record<string, number>; ids?: string[] } {
    const cut = new Date(tombCut(this.io.now())).toISOString(), from = this.base.meta(TOMB_SCAN) ?? this.base.meta(TOMB_META) ?? '';
    return this.io.tx(() => {
      const got = this.io.sql.exec<{ id: string; at: string; type: string; data: string }>(
        "SELECT id, at, type, data FROM events WHERE at >= ? AND at < ? AND json_valid(data) AND json_extract(data, '$.rm') = 1 ORDER BY at LIMIT ?", from, cut, dry ? -1 : max + 1
      ).toArray();
      const more = !dry && got.length > max, seen = more ? got.slice(0, max) : got;
      const rows = seen.filter((r) => {
        const x = this.base.rowRec(r.data, r.type);
        return x !== null && isExpiringRemoval(r.type, x);
      });
      const types: Record<string, number> = {};
      for (const r of rows) types[r.type] = (types[r.type] ?? 0) + 1;
      if (dry) return { old: rows.length, deleted: 0, more: false, types, ids: rows.map((r) => r.id) };
      let newest = this.base.meta(TOMB_META) ?? '';
      for (const r of rows) {
        this.io.sql.exec('DELETE FROM events WHERE id = ?', r.id);
        if (r.at > newest) newest = r.at;
      }
      if (rows.length) this.base.setMeta(TOMB_META, newest);
      // (a batch left over: from its last row's `at` the next run; else every removal before the cut looked through)
      const to = more ? seen[seen.length - 1].at : cut;
      if (to > from) this.base.setMeta(TOMB_SCAN, to);
      return { old: rows.length, deleted: rows.length, more, types };
    });
  }

  /** The nightly jobs not done today (nightly.ts runNightly: the 03:00 cron's, then the ticks' catch-up, `late`). */
  nightly(late: boolean, backedUp: boolean, hooks: Pick<NightlyDeps, 'fail' | 'done'>): ReturnType<typeof runNightly> {
    return runNightly({
      now: this.io.now, backedUp, stamps: () => this.nightlyStamps(), setMeta: (k, v) => this.base.setMeta(k, v), ...hooks,
      jobs: {
        ledgercheck: () => ({ n: this.shop.ledgerCheck().drift.length }),
        sharesweep: () => this.share.sweep(),
        islandprune: () => {
          const r = this.shop.islandPrune();
          return { n: r.deleted, more: r.more };
        },
        ledgerprune: () => {
          const r = this.shop.ledgerPrune();
          return { n: r.shop + r.tallies, more: r.more };
        },
        tombprune: () => {
          const r = this.tombPrune();
          return { n: r.deleted, more: r.more };
        }
      }
    }, late);
  }

  /** `/health/log`'s nightly ages (nightly.ts nightlyAges). */
  nightlyStatus(): ReturnType<typeof nightlyAges> {
    return nightlyAges(this.nightlyStamps(), this.io.now());
  }

  /** The nightly jobs' meta rows: one range of meta's key. */
  private nightlyStamps(): Map<string, string> {
    return new Map(this.io.sql.exec<{ k: string; v: string }>("SELECT k, v FROM meta WHERE k >= 'nightly|' AND k < 'nightly}'").toArray().map((r) => [r.k, r.v]));
  }

  /**
   * The wet days (contract/wet.ts), from the room's weather cron (index.ts): `real`, the Tokyo days its timeline had a
   * wet hour of. The island's weather mode decides: `real` keeps those of yesterday and today, `game` its seeded wet
   * days of yesterday and today. Each a `wet` row of the record's own (slot `wet|<date>`), once; the dates kept.
   */
  wetTick(real: readonly string[]): string[] {
    const today = localDateAt(this.io.now()), days = [prevDay(today), today];
    const r = this.base.slotRow('pref|island|weatherMode');
    const game = r ? this.base.rowRec(r.data, 'pref')?.value === 'game' : false;
    const wet = days.filter((d) => (game ? gameWet(d) : real.includes(d)) && !this.base.slotRow(`wet|${d}`));
    if (!wet.length) return [];
    let last = '';
    this.io.tx(() => {
      for (const d of wet) {
        last = this.base.nextAt();
        // (the record's own row: its person a placeholder, every phone reads it alike)
        this.base.put(`wet-${d}`, last, 'A', 'wet', JSON.stringify({ date: d }), `wet|${d}`, null);
      }
    });
    this.io.notify({ what: 'event', who: 'A', at: last, rev: this.base.rev() });
    return wet;
  }

  // ---------------------------------------------------------------- pictures (img.ts)

  /** `POST /img`'s upload (the Worker checked its key, size, magic and the day's cap): kept by imgPut's rules. */
  imgPut(who: Who, id: string, b: Uint8Array): Promise<{ ok: true; dup?: true } | { ok: false; error: ImgErr }> {
    return imgPut(this.io.sql, who, id, b, new Date(this.io.now()).toISOString());
  }

  /** `GET /img/<id>`'s bytes, or null. */
  imgGet(id: string): { type: string; bytes: Uint8Array } | null {
    return imgGet(this.io.sql, id);
  }

  /** The 03:00 sweep (img.ts imgGc), in one transaction. */
  imgGc(): { imgDel: number; imgLive: number; imgDangling: number } {
    return this.io.tx(() => imgGc(this.io.sql, this.io.now()));
  }

  /** The admin's `imgdump {after?}`: IMG_DUMP_PAGE pictures (`next` the `after` of the next page). */
  imgDump(o: Rec): Record<string, unknown> {
    const after = typeof o.after === 'string' ? o.after : '';
    const img = imgRows(this.io.sql, after, IMG_DUMP_PAGE);
    return { ok: true, rev: this.base.rev(), img, ...(img.length === IMG_DUMP_PAGE ? { next: String(img[img.length - 1][2]) } : {}) };
  }

  /** The admin's `imgload {img}`: a dump's pictures (each checked as an upload is: img.ts imgLoad). */
  async imgLoad(o: Rec): Promise<Record<string, unknown>> {
    if (!Array.isArray(o.img)) return { ok: false, error: 'bad_request' };
    const out = { added: 0, had: 0, skipped: 0 };
    for (const r of o.img as unknown[]) out[Array.isArray(r) ? await imgLoad(this.io.sql, r, isWho) : 'skipped']++;
    return { ok: true, ...out, counts: this.dumper.counts() };
  }

  /**
   * The admin's `img-set {who, custom, data, ig?, dry?}`: a picture (`data`, base64: checked as an upload is, counted
   * against `who`'s cap) set on custom food `custom` as `who` would (anyone edits one since 2026-11-20: its latest op's
   * values, a new `at`, `img`, `ig` when an illustration; kept under its creator's name, sharedAccept); `dry`: what it
   * would do, nothing written.
   */
  async imgSet(o: Rec): Promise<Record<string, unknown>> {
    const { who, custom, data } = o;
    if (!isWho(who) || typeof custom !== 'string' || typeof data !== 'string' || (o.ig !== undefined && o.ig !== true)) return fail('bad_request');
    let b: Uint8Array;
    try { b = unb64(data); } catch { return fail('bad_request', 'base64'); }
    const c = imgCheck(b);
    if ('err' in c) return fail('bad_request', c.err);
    const img = await imgId(b);
    const held = this.books.foodHeld('food_custom', custom);
    if (!held || held.rm) return fail('bad_request', 'no such custom food');
    const { who: creator, ...was } = held;
    const { ig: _ig, ...rest } = was as Rec;
    const op = foodCustomOp({ ...rest, at: Math.max(this.io.now(), (was.at as number) + 1), img, ...(o.ig ? { ig: true } : {}) });
    if (!op) return fail('bad_request', 'op');
    if (o.dry === true) return { ok: true, dry: true, bytes: b.length, type: c.type, op: { ...op, img: '…' } };
    const put = await this.imgPut(who, img, b);
    if (!put.ok) return fail('bad_request', put.error);
    const at = this.io.tx(() => {
      const at = this.base.nextAt();
      this.base.put(`imgset-${custom}-${op.at}`, at, creator, 'food_custom', JSON.stringify(op), `food_custom|${custom}`, null);
      return at;
    });
    this.io.notify({ what: 'event', who, at, rev: this.base.rev(), calm: true });
    return { ok: true, at, bytes: b.length, type: c.type, dup: put.dup === true };
  }

  // ---------------------------------------------------------------- its parts' admin reads and ops

  /** The lists as the record holds them (やること's reminders: pusher.ts). */
  todoLists(): ReturnType<StoreBooks['todoLists']> {
    return this.books.todoLists();
  }
  /** The admin's `decorcheck` (storeBooks.ts). */
  decorCheck(o: Rec = {}): Record<string, unknown> {
    return this.books.decorCheck(o);
  }
  /** The held values (the admin's `held {person?}`), oldest first. */
  heldRows(person?: string): HeldRow[] {
    return this.base.heldRows(person);
  }
  /** The admin's `shopcheck {fix?}` (storeShop.ts). */
  shopCheck(o: Rec = {}): Record<string, unknown> {
    return this.shop.shopCheck(o);
  }
  /** The admin's `wallet` (storeShop.ts). */
  wallets(): Record<string, unknown> {
    return this.shop.wallets();
  }
  /** The admin's `adjust {id, who, v, note}` (storeShop.ts). */
  adjust(o: Rec): Record<string, unknown> {
    return this.shop.adjust(o);
  }
  /** The admin's `walletset {id, who, h, note}` (storeShop.ts). */
  walletSet(o: Rec): Record<string, unknown> {
    return this.shop.walletSet(o);
  }
  /** The daily check of the stored ledgers (storeShop.ts). */
  ledgerCheck(): ReturnType<StoreShop['ledgerCheck']> {
    return this.shop.ledgerCheck();
  }
  /** The admin's `ledger_retire` (storeShop.ts). */
  ledgerRetire(o: Rec): Record<string, unknown> {
    return this.shop.ledgerRetire(o);
  }
  /** The nightly prune of the shop's rows (storeShop.ts). */
  ledgerPrune(...a: Parameters<StoreShop['ledgerPrune']>): ReturnType<StoreShop['ledgerPrune']> {
    return this.shop.ledgerPrune(...a);
  }
  /** The admin's `ledger` and `ledgerlog` (storeShop.ts). */
  ledgerRead(o: Rec = {}): Record<string, unknown> {
    return this.shop.ledgerRead(o);
  }
  /** The daily prune of the island days (storeShop.ts). */
  islandPrune(...a: Parameters<StoreShop['islandPrune']>): ReturnType<StoreShop['islandPrune']> {
    return this.shop.islandPrune(...a);
  }
  /** Rows that already have their `at` (storeDump.ts import). */
  import(rows: ImportRows): ImportResult {
    return this.dumper.import(rows);
  }
  /** Row counts per table (the import's check, the runbook). */
  counts(): Record<string, number> {
    return this.dumper.counts();
  }
  /** Every row, as `load` takes them (storeDump.ts). */
  dump(): ReturnType<StoreDump['dump']> {
    return this.dumper.dump();
  }
  /** The dump as text, a page of rows at a time (storeDump.ts; the backup, archive.ts). */
  dumpText(page?: number): Generator<string> {
    return this.dumper.dumpText(page);
  }
  /** The admin's `dump {limit?, after?, all?}` (storeDump.ts). */
  dumpPage(o: Rec): ReturnType<StoreDump['dumpPage']> {
    return this.dumper.dumpPage(o);
  }
  /** Every row after `since` ('' = all), in `at` order (storeRows.ts). */
  rowsSince(since: string): SnapshotRows {
    return rowsSince(this.io.sql, since);
  }
  /** A page of the rows after `since` (storeRows.ts). */
  rowsPage(since: string, after: Cursor | null, limit: number): { rows: SnapshotRows; next: string | null } {
    return rowsPage(this.io.sql, since, after, limit);
  }
}

/** An event the island doesn't draw (contract/live-protocol.ts CALM_EVENTS): its change's notice is `calm`. */
const calmType = (t: unknown): boolean => (CALM_EVENTS as readonly unknown[]).includes(t);
