// The record's load and dump (store.ts): rows that already have their `at` taken by the record's rules, every row
// written out as `load` takes them (the backup, docs/ops/runbook.md#6-backups).
import { eventSlot } from '../../app/src/lib/contract/record.ts';
import { eventSubject, EVENT_TYPES, isId, ISO_AT, isMetricKey, isPersonId, isWho, PREF_KEYS, PROFILE_PREF_KEYS, SNAPSHOT_PAGE_MAX, type Fail, type Who } from '../../app/src/lib/contract/api.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import { decorOpOf } from '../../app/src/lib/contract/decor.ts';
import { tentOpOf } from '../../app/src/lib/contract/tent.ts';
import { layoutOpOf } from '../../app/src/lib/contract/layout.ts';
import { TodoBook, todoLegacy, todoRowOf, todoSlot } from '../../app/src/lib/contract/todo.ts';
import { HikeBook, hikeRowOf, hikeSlot } from '../../app/src/lib/contract/hike.ts';
import { boardBeats, boardOpOf } from '../../app/src/lib/contract/board.ts';
import { isPackType, PackBook, packRowOf, packSlot } from '../../app/src/lib/contract/pack.ts';
import { isWedType, WedBook, wedRowOf, wedSlot } from '../../app/src/lib/contract/wedding.ts';
import { ShareCore } from './share.ts';
import { PlacesCore } from './places.ts';
import { LedgerStore } from './ledger.ts';
import type { FinCore } from './finance.ts';
import { imgRows } from './img.ts';
import type { Bind } from './storeSchema.ts';
import { StoreBase, fail, type Rec } from './storeBase.ts';
import { cursorOf, isPageSize, rowsPage, rowsSince, METRIC_COLS, EVENT_COLS, metricRow, eventRow, type MetricCols, type EventCols } from './storeRows.ts';
import { StoreBooks, FOOD_PARSE, isFoodType } from './storeBooks.ts';
import { StoreShop } from './storeShop.ts';

/** The rows a load brings (the admin `load`: a dump's), each with its `at`. */
export interface ImportRows {
  metrics?: unknown[][];
  events?: unknown[][];
  uploads?: unknown[][];
  /** metrics_held's rows: `[at, person, date, metric, value, last, n, promoted]` (HeldRow). */
  held?: unknown[][];
  /** 共有リンク's links and visits (share.ts dumpRows). */
  share?: unknown[][];
  share_visit?: unknown[][];
  /** 行きたい場所's rows (places.ts dumpRows). */
  places?: unknown[][];
  /** The stored ledger's rows and its log (ledger.ts). */
  ledger?: unknown[][];
  ledger_log?: unknown[][];
  /** The shared money's log (finance.ts dumpRows: `[seq, at, who, type, id, before, after]`). */
  fin_log?: unknown[][];
}

export interface ImportResult {
  metrics: number; events: number; uploads: number; skipped: number; held?: number; share?: number; share_visit?: number; places?: number; fin_log?: number;
  /** Of `skipped`: a `pref` row of a key the model no longer reads, a profile row its locked slot already holds. */
  refused?: { prefKey: number; profileLocked: number };
}

/** A dump's rows: the held values only when there are some. */
type DumpRows = Required<Omit<ImportRows, 'held'>> & Pick<ImportRows, 'held'>;

/** Rows a page of the backup's dump text (dumpText). */
const DUMP_TEXT_PAGE = 2000;
/** Pictures a page of the dump text, and of the admin's `imgdump`. */
export const IMG_DUMP_PAGE = 20;

export class StoreDump {
  constructor(private readonly b: StoreBase, private readonly books: StoreBooks, private readonly shop: StoreShop, private readonly share: ShareCore, private readonly places: PlacesCore, private readonly ledger: LedgerStore, private readonly fin: FinCore) {}

  // ---------------------------------------------------------------- import

  /**
   * Take rows that already have their `at` (a dump's, restored by the admin `load`), by
   * the same rules as the record's own writes: an event id once, a slot's latest (by `at`) kept, a decor op by the
   * merge's rules, a board post's, a packing list's and the wedding board's row as the record had it (unless its slot's
   * row beats it: a restore is faithful), then what a phone's op would have dropped with them (pruneLoaded); rows the
   * model can't read (an old high-five's) are skipped. Idempotent: an import again adds nothing.
   */
  import(rows: ImportRows): ImportResult {
    // in `at` order across the tables, so a batch is late only where it is older than what the record had
    const all = [
      ...(rows.metrics ?? []).map((r) => ({ tab: 'metrics' as const, r })),
      ...(rows.events ?? []).map((r) => ({ tab: 'events' as const, r })),
      ...(rows.uploads ?? []).map((r) => ({ tab: 'uploads' as const, r })),
      ...(rows.held ?? []).map((r) => ({ tab: 'held' as const, r }))
    ].map((x, i) => ({ ...x, i, at: Array.isArray(x.r) ? String(x.r[0]) : '' }))
      .sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : x.i - y.i));
    return this.b.io.tx(() => {
      const out: ImportResult = { metrics: 0, events: 0, uploads: 0, skipped: 0, ...(rows.held ? { held: 0 } : {}) };
      const arrived = this.b.io.now();
      // (a load into an empty record: its wallets seeded from the loaded rows, shopForget)
      const empty = this.b.io.sql.exec('SELECT 1 AS x FROM events LIMIT 1').toArray().length === 0;
      this.refused = { prefKey: 0, profileLocked: 0 };
      for (const { tab, r } of all) {
        const v = !Array.isArray(r) ? 'skipped' : tab === 'metrics' ? this.importMetric(r, arrived) : tab === 'events' ? this.importEvent(r, arrived) : tab === 'held' ? this.importHeld(r) : this.importUpload(r);
        if (v === 'added') out[tab] = (out[tab] ?? 0) + 1;
        else if (v === 'skipped') out.skipped++;
      }
      const { prefKey, profileLocked } = this.refused;
      if (prefKey + profileLocked) {
        out.refused = { prefKey, profileLocked };
        console.warn('store', 'load refused', `pref key ${prefKey}`, `profile locked ${profileLocked}`);
      }
      if (rows.share || rows.share_visit) {
        const sh = this.share.load(rows);
        out.share = sh.share;
        out.share_visit = sh.share_visit;
        out.skipped += sh.skipped;
      }
      if (rows.ledger) this.ledger.load(rows.ledger, rows.ledger_log);
      // (the money's log by its seq: what the log has is kept)
      if (rows.fin_log) {
        const f = this.fin.load(rows.fin_log);
        out.fin_log = f.fin_log;
        out.skipped += f.skipped;
      }
      if (rows.places) {
        const pl = this.places.load(rows.places);
        out.places = pl.places;
        out.skipped += pl.skipped;
      }
      // (rows the running shop ledgers and the caps' counts never saw: folded again at the next op)
      if (out.events) {
        this.pruneLoaded();
        if (empty && !rows.ledger) this.ledger.clear();
        this.shop.shopForget();
        this.b.io.sql.exec("DELETE FROM meta WHERE k = 'decor_live'");
      }
      return out;
    });
  }

  importMetric(r: unknown[], arrived: number): 'added' | 'had' | 'skipped' {
    const [at, person, date, metric, value] = r;
    if (typeof at !== 'string' || !ISO_AT.test(at) || !isPersonId(person) || typeof date !== 'string' || !isMetricKey(metric) || typeof value !== 'number' || !Number.isFinite(value)) return 'skipped';
    const sql = this.b.io.sql;
    if (sql.exec('SELECT 1 AS x FROM metrics WHERE person = ? AND date = ? AND metric = ? AND at = ?', person, date, metric, at).toArray().length) return 'had';
    this.b.addMetric(at, person, date, metric, value, this.b.seeAt(at) ? arrived : null);
    return 'added';
  }

  /** The current import's refusals (importEvent), counted for its result and its log line. */
  refused = { prefKey: 0, profileLocked: 0 };

  importEvent(r: unknown[], arrived: number): 'added' | 'had' | 'skipped' {
    const [at, person, id, type, raw] = r;
    if (typeof at !== 'string' || !ISO_AT.test(at) || !isWho(person) || !isId(id) || typeof type !== 'string' || typeof raw !== 'string') return 'skipped';
    if (!(EVENT_TYPES as readonly string[]).includes(type)) return 'skipped';
    if (this.b.known(id)) return 'had';
    let d: unknown;
    try { d = JSON.parse(raw || '{}'); } catch { d = null; }
    const subject = isRec(d) ? eventSubject(type, d, person) : null;
    if (!isRec(d) || !subject) return 'skipped';
    const sql = this.b.io.sql;
    // A pref of a key the model no longer reads (a dump's from before it went: bmiStd) is never taken back, and the
    // locked profile (keep) covers a load too: a sex or birth row comes in only to a slot that holds none.
    if (type === 'pref' && !PREF_KEYS.includes(d.key as string)) {
      this.refused.prefKey++;
      return 'skipped';
    }
    if (type === 'pref' && PROFILE_PREF_KEYS.includes(d.key as string)) {
      const slot = eventSlot(type, person, subject, d, Date.parse(at));
      if (!slot || this.b.slotRow(slot)) {
        this.refused.profileLocked++;
        return 'skipped';
      }
    }
    // A board post's, a packing list's and the wedding board's rows are taken as the record had them (a dump holds each
    // slot's latest row only: an edited post's first posting, an item's creation, a tick's task may be long gone, so
    // the rules for a phone's op would drop them), kept unless the row its slot holds beats it.
    if (type === 'board') {
      const op = boardOpOf(d);
      if (!op) return 'skipped';
      const h = this.b.slotRow(`board|${op.id}`);
      const hx = h && isWho(h.person) ? this.b.rowRec(h.data, 'board') : null;
      const held = hx ? boardOpOf(hx) : null;
      if (held && !boardBeats({ ...op, who: person }, { ...held, who: h!.person as Who })) {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
        return 'had';
      }
    }
    // a dump from before やること's one list (2026-11-25): its lists and items kept as they were, for the admin's
    // todo_migrate to make items of (docs/todo.md "The move from lists"); the slot's row kept if it has one
    if (type === 'todo' && todoLegacy(d)) {
      const slot = todoSlot(d);
      if (!slot || this.b.slotRow(slot)) {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
        return 'had';
      }
      this.b.put(id, at, person, type, raw || '{}', slot, null);
      return 'added';
    }
    if (isPackType(type) || isWedType(type) || type === 'todo' || type === 'hike') {
      const v = isPackType(type)
        ? this.loadBeats(packSlot(type, person, d), 'pack', new PackBook(), packRowOf, packRowOf(type, d, person))
        : isWedType(type) ? this.loadBeats(wedSlot(type, d), 'wedding', new WedBook(), wedRowOf, wedRowOf(type, d, person))
        : type === 'todo' ? this.loadBeats(todoSlot(d), 'todo', new TodoBook(), todoRowOf, todoRowOf(type, d, person))
        : this.loadBeats(hikeSlot(d), 'hike', new HikeBook(), hikeRowOf, hikeRowOf(type, d, person));
      if (v === 'had') sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
      if (v !== 'beats') return v;
    }
    let json = raw || '{}';
    let by = person;
    if (isFoodType(type)) {
      if (!FOOD_PARSE[type](d)) return 'skipped';
      const v = this.books.foodTarget(type, person, d);
      if (typeof v === 'string') {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
        return 'had';
      }
      if (type === 'food_repeat') json = JSON.stringify(v.op); // with the skipped days of the one it replaces
      by = v.who; // (a recipe's or a custom food's edit: under its creator's name)
    }
    if (type === 'decor' && (decorOpOf(d) || tentOpOf(d) || layoutOpOf(d)) && this.books.decorTarget(person, d) !== 'append') {
      sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id); // beaten (or past the cap): only its id is kept
      return 'had';
    }
    const slot = eventSlot(type, person, subject, d, Date.parse(at));
    const wasDecor = type === 'decor' && slot ? sql.exec<{ person: string; data: string }>('SELECT person, data FROM events WHERE slot = ?', slot).toArray()[0] ?? null : null;
    if (slot && type !== 'decor' && type !== 'board' && !isFoodType(type) && !isPackType(type) && !isWedType(type) && type !== 'todo' && type !== 'hike') {
      const held = sql.exec<{ at: string }>('SELECT at FROM events WHERE slot = ?', slot).toArray()[0];
      if (held && held.at >= at) {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id); // a later one of the slot is there already
        return 'had';
      }
      if (type === 'tally' || type === 'tally_back') json = this.books.tallyKept(person, d, type); // with the larger counts of the row it replaces
      if (type === 'island') json = this.books.islandKept(person, d);
    }
    this.b.put(id, at, by, type, json, slot, this.b.seeAt(at) ? arrived : null);
    if (type === 'decor') this.books.decorNote(person, d, wasDecor); // (the caps right within the load's batch)
    return 'added';
  }

  /** A packing or wedding row a load brings against the row its slot holds, by the contract's merge (PackBook,
   *  WedBook): `beats` it (or there's none), `had` (the held one beats it) or `skipped` (unreadable). */
  loadBeats<R>(slot: string | null, kind: string, book: { rows: Map<string, R>; put(r: R): void; merge(r: R): unknown }, rowOf: (type: string, d: Rec, who: Who) => R | null, row: R | null): 'beats' | 'had' | 'skipped' {
    if (!row || !slot) return 'skipped';
    const h = this.b.slotRow(slot);
    const hx = h && isWho(h.person) ? this.b.rowRec(h.data, kind) : null;
    const held = hx ? rowOf(h!.type, hx, h!.person as Who) : null;
    if (held) book.put(held);
    book.merge(row);
    return book.rows.get(slot) === row ? 'beats' : 'had';
  }

  /** What a phone's op would have dropped with a row a load took as it was (the live path's drops, after the whole
   *  batch, so the order its rows came in doesn't matter): a purged wedding task's tick, a removed packing item's
   *  ticks, a removed to-do list's items (an old dump's), a removed hike's track. (A removal's own row is never dropped, 2026-11-08: a phone that cached the post before it would show it for
   *  good, its delta saying nothing of it.) */
  pruneLoaded(): void {
    const sql = this.b.io.sql;
    const gone = (type: string): Rec[] =>
      sql.exec<{ data: string }>('SELECT data FROM events WHERE type = ?', type).toArray()
        .map((r) => this.b.rowRec(r.data, type)).filter((x): x is Rec => x !== null && x.rm === true);
    for (const t of gone('wtask')) sql.exec('DELETE FROM events WHERE slot = ?', `wdone|${String(t.id)}`);
    for (const p of gone('pack')) sql.exec('DELETE FROM events WHERE slot GLOB ?', `pack_chk|${String(p.trip)}|${String(p.id)}|*`);
    // (a removed list's items)
    const lists = new Set(gone('todo').map((x) => String(x.id)));
    if (lists.size) for (const r of sql.exec<{ slot: string; data: string }>("SELECT slot, data FROM events WHERE type = 'todo'").toArray()) {
      const x = this.b.rowRec(r.data, 'todo');
      if (x && typeof x.list === 'string' && lists.has(x.list)) sql.exec('DELETE FROM events WHERE slot = ?', r.slot);
    }
    for (const h of gone('hike')) sql.exec('DELETE FROM events WHERE slot = ?', `hike_trk|${String(h.id)}`);
  }

  importHeld(r: unknown[]): 'added' | 'skipped' {
    const [at, person, date, metric, value, last, n, promoted] = r;
    if (typeof at !== 'string' || !ISO_AT.test(at) || !isPersonId(person) || typeof date !== 'string' || !isMetricKey(metric) || typeof value !== 'number' || !Number.isFinite(value)) return 'skipped';
    const lastAt = typeof last === 'string' && ISO_AT.test(last) ? last : at;
    this.b.hold(person, date, metric, value, at, Number.isInteger(n) && (n as number) > 0 ? (n as number) : 1, typeof promoted === 'string' && ISO_AT.test(promoted) ? promoted : null, lastAt);
    return 'added';
  }

  importUpload(r: unknown[]): 'added' | 'skipped' {
    const [at, person, status, bytes, notes] = r;
    if (typeof at !== 'string' || !ISO_AT.test(at) || !isPersonId(person)) return 'skipped';
    this.b.addUpload([at, person, String(status ?? ''), Number(bytes) || 0, String(notes ?? '')]);
    return 'added';
  }

  /** Row counts per table (the import's check, the runbook). */
  counts(): Record<string, number> {
    const n = (t: string) => Number(this.b.io.sql.exec<{ n: number }>(`SELECT count(*) AS n FROM ${t}`).toArray()[0]?.n ?? 0);
    return { metrics: n('metrics'), events: n('events'), ids: n('ids'), uploads: n('uploads'), img: n('food_img'), share: n('share'), share_visit: n('share_visit'), places: n('places'), fin_log: n('fin_log') };
  }

  /** Every row, as `load` takes them (the backup, docs/ops/runbook.md#6-backups): the load of a dump is the record. */
  dump(): { rows: DumpRows } {
    return { rows: { ...rowsSince(this.b.io.sql, ''), uploads: this.b.uploadRows(), ...this.heldDump(), ...this.share.dumpRows(), places: this.places.dumpRows(), ledger: this.ledger.rows(), ledger_log: this.ledger.logRows(), fin_log: this.fin.dumpRows() } };
  }

  /**
   * The dump as `record.ts dump` writes it (`{ok, rev, rows}`, its pages put together), as text a page of rows at a
   * time (the backup, archive.ts: packed as it comes, so neither the rows nor the text are ever whole in memory). The
   * pages run in (at, seq) order, so a row written between two of them (its `at` after every row handed out) is in a
   * later page or not at all; a new epoch under it (a restore) throws (`epoch`: the run is tried again).
   */
  *dumpText(page = DUMP_TEXT_PAGE): Generator<string> {
    const rev = this.b.rev();
    const sql = this.b.io.sql;
    // (the audit by seq, as uploadRows: a load's rows may come in after newer ones)
    function* table<T extends Record<string, Bind>>(tab: string, cols: string, row: (r: T) => unknown[], bySeq = false): Generator<string> {
      let at = '', seq = -1, sep = '';
      for (;;) {
        const rs = (bySeq
          ? sql.exec<T & { seq: number; at: string }>(`SELECT seq, ${cols} FROM ${tab} WHERE seq > ? ORDER BY seq LIMIT ?`, seq, page)
          : sql.exec<T & { seq: number; at: string }>(`SELECT seq, ${cols} FROM ${tab} WHERE at >= ? AND (at > ? OR seq > ?) ORDER BY at, seq LIMIT ?`, at, at, seq, page)).toArray();
        if (!rs.length) return;
        yield sep + rs.map((r) => JSON.stringify(row(r))).join(',');
        sep = ',';
        ({ at, seq } = rs[rs.length - 1]);
        if (rs.length < page) return;
      }
    }
    yield `{"ok":true,"rev":${JSON.stringify(rev)},"rows":{"metrics":[`;
    yield* table<MetricCols>('metrics', METRIC_COLS, metricRow);
    yield '],"events":[';
    yield* table<EventCols>('events', EVENT_COLS, eventRow);
    yield '],"uploads":[';
    yield* table<{ at: string; person: string; status: string; bytes: number; notes: string }>('uploads', 'at, person, status, bytes, notes', (r) => [r.at, r.person, r.status, r.bytes, r.notes], true);
    const sh = this.share.dumpRows();
    yield `],"held":${JSON.stringify(this.heldDump().held ?? [])},"share":${JSON.stringify(sh.share)},"share_visit":${JSON.stringify(sh.share_visit)},"places":[`;
    // (~3,400 places, ~1.5 MB: a page of rows at a time)
    const pl = this.places.dumpRows();
    for (let i = 0; i < pl.length; i += page) yield (i ? ',' : '') + pl.slice(i, i + page).map((r) => JSON.stringify(r)).join(',');
    yield '],"img":[';
    // (the pictures a few at a time: ~87 kB each as base64)
    for (let after = '', sep = ''; ;) {
      const rs = imgRows(sql, after, IMG_DUMP_PAGE);
      if (rs.length) yield sep + rs.map((r) => JSON.stringify(r)).join(',');
      sep = ',';
      if (rs.length < IMG_DUMP_PAGE) break;
      after = String(rs[rs.length - 1][2]);
    }
    yield `],"ledger":${JSON.stringify(this.ledger.rows())},"ledger_log":${JSON.stringify(this.ledger.logRows())},"fin_log":${JSON.stringify(this.fin.dumpRows())}}}\n`;
    if (this.b.rev() !== rev) throw Object.assign(new Error('a new epoch under the dump'), { name: 'epoch' });
  }

  /** The held values as the dump carries them (only when there are some: a dump from before them reads the same). */
  heldDump(): { held?: unknown[][] } {
    const h = this.b.heldRows();
    return h.length ? { held: h.map((x) => [x.at, x.person, x.date, x.metric, x.value, x.last, x.n, x.promoted]) } : {};
  }

  /** The admin's `dump {limit?, after?, all?}`: a page of the dump (`limit` rows, SNAPSHOT_PAGE_MAX by default: the
   *  metrics and events as rowsPage pages them, the audit and the held values on the first page, `next` the `after` of
   *  the next); `all: true`, every row at once (dump). */
  dumpPage(o: Rec): { ok: true; rows: DumpRows; next?: string } | Fail {
    // paged by default (SNAPSHOT_PAGE_MAX rows): a whole year at once is past what one reply should carry; `all: true`
    // the whole at once (record.ts always pages)
    if (o.all === true) return { ok: true, ...this.dump() };
    const after = o.after === undefined ? null : cursorOf(o.after);
    const limit = o.limit === undefined ? SNAPSHOT_PAGE_MAX : o.limit;
    if (after === undefined || !isPageSize(limit)) return fail('bad_request');
    const p = rowsPage(this.b.io.sql, '', after, limit);
    return { ok: true, rows: { ...p.rows, uploads: after ? [] : this.b.uploadRows(), ...(after ? { share: [], share_visit: [], places: [], ledger: [], ledger_log: [], fin_log: [] } : { ...this.heldDump(), ...this.share.dumpRows(), places: this.places.dumpRows(), ledger: this.ledger.rows(), ledger_log: this.ledger.logRows(), fin_log: this.fin.dumpRows() }) }, ...(p.next ? { next: p.next } : {}) };
  }
}
