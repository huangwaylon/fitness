// The かいがら side of the record (store.ts): the stored ledger (ledger.ts) seeded, stepped and checked against the rows'
// fold, the wallets, the field (contract/farm.ts), the admin's corrections.
import { isId, isWho, movesWallet, type Who } from '../../app/src/lib/contract/api.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import { addDays, localDateAt, prevDay } from '../../app/src/lib/contract/tokyo.ts';
import { adjustOf, caughtOf, isShopEvent, rewardOf, shopLedger, shopRowOf, SHOP_EVENTS, type LedgerEvent, type Ledger, type ShopRow, type TallyDay, isPocketKey } from '../../app/src/lib/contract/shop.ts';
import { emptyFarm, farmOf, farmStep, fieldJson, type Farm, type FarmData, type FarmRefusal } from '../../app/src/lib/contract/farm.ts';
import { isTally } from '../../app/src/lib/contract/tally.ts';
import { LedgerStore, WHO } from './ledger.ts';
import { emptyLedger, ledgerRefusal, ledgerStep, pocketMoves, pruneGames, tallyStep, type FieldWire, type Ledger as Stored, type LedgerPart, type Ledgers } from '../../app/src/lib/contract/ledger.ts';
import { PRUNE_BATCH } from './nightly.ts';
import type { Bind } from './storeSchema.ts';
import { StoreBase, type Rec } from './storeBase.ts';

/** The shop's and the field's event types whose rows the stored ledger made history (ledgerRetire, ledgerPrune), and how long the daily
 *  prune keeps a new one (a phone's ack shows it till its snapshot holds it). */
const RETIRED = ['sell', 'buy', 'buy_starts', 'sg_reward', 'shop_adjust', 'farm'];
const RETIRED_KEEP_DAYS = 2;
/** A day's tally and give-back kept this long (past TALLY_PAST_DAYS, the oldest a phone may send again: the resend's
 *  growth is reckoned against the held day). */
const TALLY_KEEP_DAYS = 36;
/** What the admin's `ledger_retire` must say to run. */
const RETIRE_CONFIRM = 'retire-ledger-rows';
/** The wallets' `seq` from the stored ledger (walletsFor): its `hp` count past this, above any running ledger's. */
const WALLET_SEQ_FROM = 1_000_000;

/** The meta key that marks the stored field as this relay's rules' (contract/farm.ts: shared plots, 6 h growth since
 *  2026-11-25). Another relay's key at the start (older rules, a rollback) means a field and rows this one didn't
 *  reckon: the field is folded again from the rows, at once. */
const FARM_META = 'farm|t6h';

export class StoreShop {
  constructor(private readonly b: StoreBase, private readonly ledger: LedgerStore) {
    const sql = b.io.sql;
    // (one transaction: a refold cut short leaves the other relay's key, so the next start folds again)
    if (sql.exec("SELECT 1 FROM meta WHERE (k = 'farm' OR k LIKE 'farm|%') AND k != ? LIMIT 1", FARM_META).toArray().length) b.io.tx(() => {
      sql.exec("DELETE FROM meta WHERE k = 'farm' OR k LIKE 'farm|%'");
      this.fieldRefold();
    });
  }

  /** A load or an import brought rows the stored field never saw: folded again (fieldRefold). The stored ledgers stay
   *  as they are (a load never moves one: ledger.ts; a load into an empty record seeds them again). */
  shopForget(): void {
    this.fieldRefold();
  }

  /** The wallets a phone is told (a reply's `wallets`, an older build's number): `who`'s of them (all by default),
   *  each the stored ledger's かいがら and its `hp` count past WALLET_SEQ_FROM (above the running ledger's count a phone
   *  heard before 2026-11-24: it keeps each person's highest); everyone's to anyone, the guest's phone too. */
  walletsFor(_me: Who, who: Iterable<Who> = ['A', 'B', 'G']): Partial<Record<Who, { h: number; seq: number }>> {
    const out: Partial<Record<Who, { h: number; seq: number }>> = {};
    for (const w of who) {
      // (one not seeded yet: its rows' fold, read only; a read never writes)
      const r = this.b.io.sql.exec<{ seq: number; v: string }>("SELECT seq, v FROM ledger WHERE who = ? AND part = 'hp'", w).toArray()[0];
      out[w] = { h: r ? (JSON.parse(r.v) as { h: number }).h : Math.max(0, this.shopFold(w).l.shells), seq: WALLET_SEQ_FROM + (r?.seq ?? 0) };
    }
    return out;
  }

  /** The admin's `shopcheck {fix?}`: the stored field against the fold of the farm rows, while they're kept (`fix`: the
   *  fold's taken); the ledgers' check is `ledgercheck`. */
  shopCheck(o: Rec = {}): Record<string, unknown> {
    const kept = this.ledger.field();
    if (!kept) return { ok: true, farm: 'none' };
    if (this.ledgerOnly()) return { ok: true, farm: 'kept' };
    const fold = this.farmFold();
    const farm = JSON.stringify(fieldJson(kept)) === JSON.stringify(fieldJson(fold)) ? 'same' : 'differs';
    if (o.fix === true && farm === 'differs') this.farmNote(fold, this.b.nextAt());
    return { ok: true, farm };
  }

  /** The admin's `wallet`: each person's stored かいがら (`h`, its `hp` count `seq`, the last change `at`) and the fold
   *  of their rows beside it (`fold`, while the rows are kept). */
  wallets(): Record<string, unknown> {
    const out: Record<string, unknown> = { ok: true };
    for (const r of this.ledger.rows()) if (r[1] === 'hp') out[r[0]] = { h: (JSON.parse(r[4]) as { h: number }).h, seq: r[2], at: r[3], ...(this.ledgerOnly() ? {} : { fold: this.shopFold(r[0] as Who).l.shells }) };
    return out;
  }

  /** The admin's `adjust {id, who, v, note}`: a `shop_adjust` row of `who`'s (contract/shop.ts adjustOf: `v` かいがら
   *  added, either sign; the phones fetch it as any new row) and its step into their stored ledger (never below 0).
   *  `id` the caller's (a retry is acknowledged as `duplicate`). The only way one comes in besides a dump's `load`: a
   *  phone's is refused (contract/record.ts validEventData). Undone by another, of `−v`. */
  adjust(o: Rec): Record<string, unknown> {
    const { id, who } = o;
    const data = { v: o.v, note: o.note };
    if (!isId(id) || !isWho(who) || !adjustOf(data)) return { ok: false, error: 'bad_request' };
    const r = this.b.io.tx((): Record<string, unknown> => {
      if (this.b.known(id)) return { ok: true, duplicate: true };
      this.ledgerReady(who);
      const before = this.ledger.read(who, ['hp'])!.h;
      const at = this.b.nextAt(), json = JSON.stringify(data);
      this.b.put(id, at, who, 'shop_adjust', json, null, null);
      this.ledgerNote(who, id, at, 'shop_adjust', json, null, [], null);
      return { ok: true, id, at, before, after: this.ledger.read(who, ['hp'])!.h };
    });
    // (an `ingest`: never skipped as a phone's own event; the guest hears of it too, its かいがら among them)
    if (typeof r.at === 'string') this.b.io.notify({ what: 'ingest', who, at: r.at, rev: this.b.rev() }, true);
    return r;
  }

  /** The admin's `walletset {id, who, h, note}`: `who`'s stored かいがら made `h`, logged (`note` its reason, in the
   *  log's data); nothing written when they are `h` already (`same`). The phones hear of it as any change. */
  walletSet(o: Rec): Record<string, unknown> {
    const { id, who, h, note } = o;
    if (!isId(id) || !isWho(who) || typeof h !== 'number' || !Number.isInteger(h) || h < 0 || !adjustOf({ v: 1, note })) return { ok: false, error: 'bad_request' };
    const r = this.b.io.tx((): Record<string, unknown> => {
      if (this.b.known(id)) return { ok: true, duplicate: true };
      this.ledgerReady(who);
      const before = this.ledger.read(who, ['hp'])!.h;
      if (before === h) return { ok: true, same: true, h };
      this.b.io.sql.exec('INSERT INTO ids (id) VALUES (?)', id);
      const at = this.ledgerSet(who, id, 'walletset', h, note as string);
      return { ok: true, at, before, after: h };
    });
    if (typeof r.at === 'string') this.b.io.notify({ what: 'ingest', who: who as Who, at: r.at, rev: this.b.rev() }, true);
    return r;
  }

  // ---------------------------------------------------------------- the stored ledger (ledger.ts)

  /** `who`'s stored ledger as their rows say it (shopFold): the かいがら (never below 0), the pocket (their tallies' and the field's goods less sold, of a pocket's kind), the pieces (each its first
   *  buy's time), the games (each its day), the ずかん totals (their tallies less their give-backs). The seed's, and the
   *  daily check's other side. */
  ledgerFold(who: Who): Stored {
    // (the field folded from its rows too, never its running copy: farmFold)
    const st = this.shopFold(who, this.farmFold()), sql = this.b.io.sql;
    const l = emptyLedger();
    l.h = Math.max(0, st.l.shells);
    for (const k of new Set([...st.caught.keys(), ...st.l.sold.keys()])) {
      const n = (st.caught.get(k) ?? 0) - (st.l.sold.get(k) ?? 0);
      if (n > 0 && isPocketKey(k)) l.p.set(k, n);
    }
    const bought = new Map<string, number>();
    for (const r of sql.exec<{ at: string; data: string }>("SELECT at, data FROM events WHERE type = 'buy' AND person = ? ORDER BY at, seq", who).toArray()) {
      const x = this.b.rowRec(r.data, 'shop'), row = x ? shopRowOf('buy', x) : null;
      if (row?.type === 'buy' && !bought.has(row.data.item)) bought.set(row.data.item, Date.parse(r.at));
    }
    l.w = st.l.owned.map((c) => [c, bought.get(c) ?? 0]);
    const days = new Map<string, string>();
    for (const r of sql.exec<{ data: string }>("SELECT data FROM events WHERE type = 'sg_reward'").toArray()) {
      const x = this.b.rowRec(r.data, 'shop'), d = x ? rewardOf(x) : null;
      if (d?.to.includes(who) && !days.has(d.g)) days.set(d.g, d.d);
    }
    for (const g of st.l.games) l.g.set(g, days.get(g) ?? localDateAt(this.b.io.now()));
    for (const r of sql.exec<{ type: string; data: string }>("SELECT type, data FROM events WHERE type IN ('tally', 'tally_back') AND person = ?", who).toArray()) {
      const t = this.b.rowRec(r.data, 'tally');
      if (!t || !isTally(t)) continue;
      for (const k in t.counts) l.z.set(k, (l.z.get(k) ?? 0) + (r.type === 'tally_back' ? -t.counts[k] : t.counts[k]));
    }
    for (const [k, n] of l.z) if (n <= 0) l.z.delete(k);
    return l;
  }

  /** `who`'s stored ledger, seeded from the running one (ledgerFold, `ledger.seed`) when there's none yet: before an op
   *  of theirs goes in (its row not in the rows yet), so the op steps it as it steps the running one. */
  ledgerReady(who: Who): void {
    if (this.ledger.has(who)) return;
    const l = this.ledgerFold(who);
    this.ledger.seed(who, l, this.b.nextAt());
    this.b.io.log?.('ledger.seed', { who, h: l.h, p: l.p.size, w: l.w.length, z: l.z.size });
  }

  /** A kept row into the stored ledgers it moves (made ready before it went: ledgerReady), each step logged: a tally's
   *  or a give-back's growth over the row it replaced (`was`), the shop's rows and a correction (the sender's), a
   *  reward (each recipient it paid), the field's goods (`farm`: the batch's step, its net the sender's moves). A shop row
   *  the stored ledger refuses where the running one kept it: a drift, logged (the daily check shows it). */
  ledgerNote(me: Who, id: string, at: string, type: string, kept: string, was: Record<string, number> | null, rewardTo: readonly Who[], farm: { f: Farm } | null): void {
    const t = Date.parse(at), d = this.b.rowRec(kept, 'shop');
    // (only the parts an op may move are read: a sale's `hp`, a buy's and `w`, a reward's and `g`, a tally's and `z`)
    const parts: LedgerPart[] = type === 'buy' ? ['hp', 'w'] : type === 'sg_reward' ? ['hp', 'g'] : type === 'tally' || type === 'tally_back' ? ['hp', 'z'] : ['hp'];
    const step = (who: Who, fn: (l: Stored, moved: Set<LedgerPart>) => void) => {
      const l = this.ledger.read(who, parts);
      if (!l) return;
      const h0 = l.h, moved = new Set<LedgerPart>();
      fn(l, moved);
      if (!moved.size) return;
      this.ledger.write(who, l, moved, at);
      this.ledger.log(at, who, id, type, kept, h0, l.h);
    };
    if (!d) return;
    if (type === 'tally' || type === 'tally_back') {
      if (isTally(d)) step(me, (l, m) => tallyStep(l, d.counts, was, type === 'tally_back', m));
    } else if (type === 'farm') {
      if (!farm) return;
      step(me, (l, m) => pocketMoves(l, [...(farm.f.net[me] ?? [])], m));
    } else if (isShopEvent(type) || type === 'shop_adjust') {
      const row = shopRowOf(type, d);
      if (row) step(me, (l, m) => {
        const why = ledgerStep(l, row, t, m);
        if (why) this.b.io.log?.('ledger.drift', { who: me, part: 'refused', stored: l.h, fold: 0, keys: 0 });
      });
    } else if (type === 'sg_reward') {
      const row = shopRowOf('sg_reward', d), today = localDateAt(this.b.io.now());
      if (row) for (const who of rewardTo) step(who, (l, m) => {
        if (pruneGames(l, today)) m.add('g');
        ledgerStep(l, row, t, m);
      });
    }
  }

  /** `who`'s stored かいがら made `h` by an admin op (walletset, unadjust), logged. */
  ledgerSet(who: Who, id: string, type: string, h: number, note: string): string {
    this.ledgerReady(who);
    const l = this.ledger.read(who, ['hp'])!;
    const at = this.b.nextAt(), h0 = l.h;
    l.h = h;
    this.ledger.write(who, l, ['hp'], at);
    this.ledger.log(at, who, id, type, JSON.stringify({ h, note }), h0, h);
    return at;
  }

  /** Whether the record keeps no shop rows to fold (meta `ledger_only`: the stored ledger alone since the admin's
   *  `ledger_retire`), so nothing is checked against a fold. */
  ledgerOnly(): boolean {
    return this.b.meta('ledger_only') !== null;
  }

  /** Why the stored ledger refuses a sell, a buy, starts or a reward of `who`'s (contract/ledger.ts ledgerRefusal), or
   *  null: `pocket`, `wallet`, `owned`, `paid`. Seeded first (ledgerReady). */
  ledgerTarget(who: Who, type: LedgerEvent, d: Rec): 'pocket' | 'wallet' | 'owned' | 'paid' | null {
    this.ledgerReady(who);
    const row = shopRowOf(type, d);
    if (!row) return 'pocket';
    return ledgerRefusal(this.ledger.read(who, type === 'buy' ? ['hp', 'w'] : type === 'sg_reward' ? ['hp', 'g'] : ['hp'])!, row);
  }

  /** The stored ledgers' parts this request wrote and the `hp` of each person its events may have moved, kept or
   *  refused (`touched`: a refused buy's ack says the かいがら as they are, as the wallets do), each its state now (an
   *  ack's `ledgers`), and the stored field as it is now after any farm event, kept or refused (`farm`: a phone whose
   *  op was refused shows the field the record judged it on, at once), or nothing. */
  ledgersMoved(touched: ReadonlySet<Who> = new Set(), farm = false): { ledgers?: Ledgers; field?: FieldWire } {
    const keys = new Set(this.ledger.written);
    for (const w of touched) if (this.ledger.has(w)) keys.add(`${w}|hp`);
    const field = farm ? this.ledger.fieldWire() : undefined;
    return { ...(keys.size ? { ledgers: this.ledger.wire(keys) } : {}), ...(field ? { field } : {}) };
  }

  /**
   * The daily check of the stored ledgers (the 03:00 cron's and the admin's `ledgercheck`): each person's log's chain
   * (each op's かいがら before its last one's after, the last one's after the stored value) and, while the rows are kept
   * (ledgerOnly), its pocket, pieces, games and totals against their fold (ledgerFold); one not seeded yet seeded first
   * (ledgerReady). Each part that differs a `ledger.drift` (its keys apart: `keys`); never fixed by itself. The log's
   * rows past LOG_KEEP_DAYS let go.
   */
  ledgerCheck(): { ok: true; drift: { who: Who; part: string; stored: number; fold: number; keys: string[] }[]; pruned: number } {
    const drift: { who: Who; part: string; stored: number; fold: number; keys: string[] }[] = [];
    const sum = (m: ReadonlyMap<string, number>) => [...m.values()].reduce((a, n) => a + n, 0);
    const mapDiff = (a: ReadonlyMap<string, number>, b: ReadonlyMap<string, number>) => [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
    for (const who of WHO) {
      // (one not seeded yet: seeded now, as their next op would)
      if (!this.ledger.has(who)) this.b.io.tx(() => this.ledgerReady(who));
      const l = this.ledger.read(who);
      if (!l) continue;
      if (!this.ledger.chain(who, l.h).ok) drift.push({ who, part: 'chain', stored: l.h, fold: 0, keys: [] });
      // (the rows' fold, while they're kept: the pocket, the pieces, the games, the totals; never the かいがら, which a
      // floor at 0, a walletset or a give-back after a sale may leave apart from the rows' sum by the rules)
      if (this.ledgerOnly()) continue;
      const f = this.ledgerFold(who);
      const p = mapDiff(l.p, f.p), z = mapDiff(l.z, f.z);
      if (p.length) drift.push({ who, part: 'p', stored: sum(l.p), fold: sum(f.p), keys: p });
      if (z.length) drift.push({ who, part: 'z', stored: sum(l.z), fold: sum(f.z), keys: z });
      const w = l.w.map(([c]) => c), fw = f.w.map(([c]) => c);
      if (w.join() !== fw.join()) drift.push({ who, part: 'w', stored: w.length, fold: fw.length, keys: [...w.filter((c) => !fw.includes(c)), ...fw.filter((c) => !w.includes(c))] });
      const g = [...l.g.keys()].sort(), fg = [...f.g.keys()].sort();
      if (g.join() !== fg.join()) drift.push({ who, part: 'g', stored: g.length, fold: fg.length, keys: [...g.filter((x) => !fg.includes(x)), ...fg.filter((x) => !g.includes(x))] });
    }
    // (the stored field against the fold of the farm rows, while kept: its plots, plot by plot)
    if (!this.ledgerOnly()) {
      const kept = this.farmState().plots, fold = this.farmFold().plots;
      const keys = [...new Set([...kept.keys(), ...fold.keys()])].filter((p) => JSON.stringify(kept.get(p)) !== JSON.stringify(fold.get(p))).sort();
      if (keys.length) drift.push({ who: 'A', part: 'field', stored: kept.size, fold: fold.size, keys });
    }
    for (const d of drift) this.b.io.log?.('ledger.drift', { who: d.who, part: d.part, stored: d.stored, fold: d.fold, keys: d.keys.length });
    return { ok: true, drift, pruned: this.ledger.prune(this.b.io.now()) };
  }

  /**
   * The admin's `ledger_retire {confirm: 'retire-ledger-rows', dry?}`: the shop's history let go, the stored ledger the
   * record's alone (meta `ledger_only`): every `sell`, `buy`, `buy_starts`, `sg_reward` and `shop_adjust` row deleted
   * (their ids stay known: a late retry is a duplicate), and the day tallies and give-backs older than TALLY_KEEP_DAYS
   * (none may be sent again: contract/record.ts TALLY_PAST_DAYS), then a new epoch (the phones refetch). Only with every
   * person seeded and no drift (ledgerCheck); `dry`: the counts only. Since then the daily prune keeps the shop's rows
   * RETIRED_KEEP_DAYS (ledgerPrune). Never a metric, a ベル row, a farm row (the field's fold) or anything else.
   */
  ledgerRetire(o: Rec): Record<string, unknown> {
    if (o.confirm !== RETIRE_CONFIRM) return { ok: false, error: 'bad_request', detail: `it deletes the shop's rows: pass confirm: '${RETIRE_CONFIRM}' (dump first)` };
    const check = this.ledgerCheck();
    if (check.drift.length) return { ok: false, error: 'bad_request', detail: 'drift', drift: check.drift };
    const { more: _more, ...counts } = this.ledgerPrune(o.dry === true, 0, Infinity);
    if (o.dry === true) return { ok: true, dry: true, ...counts };
    this.b.setMeta('ledger_only', new Date(this.b.io.now()).toISOString());
    return { ok: true, ...counts, rev: this.b.bumpRev() };
  }

  /** The shop's rows older than `keepDays` and the day tallies and give-backs older than TALLY_KEEP_DAYS deleted, `max`
   *  rows at most (`more`: some left; `dry`: counted only), once the record keeps the stored ledger alone (ledger_only;
   *  or `keepDays` 0: ledgerRetire's own, all at once). The nightly prune's (nightly.ts). */
  ledgerPrune(dry = false, keepDays = RETIRED_KEEP_DAYS, max = PRUNE_BATCH): { shop: number; tallies: number; more: boolean } {
    if (keepDays && !this.ledgerOnly()) return { shop: 0, tallies: 0, more: false };
    const cut = new Date(this.b.io.now() - keepDays * 86_400_000).toISOString(), oldest = addDays(localDateAt(this.b.io.now()), -TALLY_KEEP_DAYS);
    const shopWhere = `type IN (${RETIRED.map(() => '?').join(', ')}) AND at < ?`;
    const tallyWhere = "type IN ('tally', 'tally_back') AND substr(slot, -10) < ?";
    return this.b.io.tx(() => {
      if (dry) {
        const n = (where: string, ...b: Bind[]) => this.b.io.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM events WHERE ${where}`, ...b).toArray()[0]?.n ?? 0;
        return { shop: n(shopWhere, ...RETIRED, cut), tallies: n(tallyWhere, oldest), more: false };
      }
      const shop = this.b.dropBatch(shopWhere, [...RETIRED, cut], max);
      const tallies = shop.more ? { n: 0, more: true } : this.b.dropBatch(tallyWhere, [oldest], max - shop.n);
      return { shop: shop.n, tallies: tallies.n, more: shop.more || tallies.more };
    });
  }

  /** The admin's `ledger`: each person's stored ledger, part by part (`seq`, `at`, the value), and `ledgerlog {who,
   *  limit?}`: the ops applied to one, newest first. */
  ledgerRead(o: Rec = {}): Record<string, unknown> {
    if (o.log !== undefined) {
      if (!isWho(o.log)) return { ok: false, error: 'bad_request' };
      return { ok: true, log: this.ledger.logOf(o.log, typeof o.limit === 'number' ? Math.min(500, Math.max(1, Math.floor(o.limit))) : 50) };
    }
    const out: Record<string, unknown> = { ok: true };
    for (const r of this.ledger.rows()) ((out[r[0]] ??= {}) as Record<string, unknown>)[r[1]] = { seq: r[2], at: r[3], v: JSON.parse(r[4]) as unknown };
    return out;
  }

  /** `who`'s shop folded from every row of theirs (the running ledger's start, and its admin re-check). The fold reads
   *  their day tallies (one row a day: ≤ 366 a year) and their shop rows, in the object, never the Worker. Its
   *  `shells` are the rows' sum, unfloored (the wallet's, shopState, never below 0). */
  shopFold(me: Who, field: Farm = this.farmFold()): Pocket {
    const parse = (raw: string): Rec | null => this.b.rowRec(raw, 'shop');
    // (their days' tallies less what was given back, a claim race lost, and the field's net: contract/shop.ts caughtOf,
    // the phones' fold too)
    const days: TallyDay[] = [];
    for (const r of this.b.io.sql.exec<{ type: string; data: string }>("SELECT type, data FROM events WHERE type IN ('tally', 'tally_back') AND person = ?", me).toArray()) {
      const t = parse(r.data);
      if (t && isTally(t)) days.push({ back: r.type === 'tally_back', counts: t.counts });
    }
    const { caught, back } = caughtOf(days, field.net[me]);
    const rows: ShopRow[] = [];
    const types = SHOP_EVENTS.map((t) => `'${t}'`).join(', ');
    // (their own shop rows, and every 英語すごろく reward naming them, whoever sent it: contract/shop.ts rowConcerns)
    // (and the admin's corrections of theirs: adjust)
    for (const r of this.b.io.sql.exec<{ type: string; data: string }>(`SELECT type, data FROM events WHERE (type IN (${types}, 'shop_adjust') AND person = ?) OR type = 'sg_reward' ORDER BY at, seq`, me).toArray()) {
      const x = parse(r.data);
      const row = x && (isShopEvent(r.type) || r.type === 'sg_reward' || r.type === 'shop_adjust') ? shopRowOf(r.type, x) : null;
      if (row && (row.type !== 'reward' || row.data.to.includes(me))) rows.push(row);
    }
    return { caught, back, l: shopLedger(caught, rows, back) };
  }

  // ---------------------------------------------------------------- the field

  /** The field (contract/farm.ts) as the record keeps it: the stored field (ledger.ts `F|field`), stepped by each farm
   *  row (farmNote), its pockets' changes empty (the ledgers hold the pockets: a step's are its own); seeded from the
   *  rows when there is none (or of an older relay's shape). */
  farmState(): Farm {
    return this.ledger.field() ?? this.fieldSeed();
  }

  /** The field folded from the rows and stored (its `seq` on from the one it replaces), FARM_META marking it ours. */
  private fieldSeed(): Farm {
    const f: Farm = { plots: this.farmFold().plots, net: {} };
    const at = this.b.nextAt();
    this.farmNote(f, at);
    this.b.setMeta(FARM_META, at);
    return f;
  }

  /** The stored field folded again now, if there is one or any farm row (the phones read the stored field, so never
   *  left for the next farm op): another relay's at the start, a load's rows. Not once the ledger is the record's
   *  alone (no rows to fold). */
  fieldRefold(): void {
    if (this.ledgerOnly()) return;
    if (this.ledger.hasField() || this.b.io.sql.exec("SELECT 1 FROM events WHERE type = 'farm' LIMIT 1").toArray().length) this.fieldSeed();
  }

  /** The field folded from its rows, each as kept at its `at` (farmState's seed, and shopcheck's). */
  farmFold(): Farm {
    const f = emptyFarm();
    for (const r of this.b.io.sql.exec<{ person: string; at: string; data: string }>("SELECT person, at, data FROM events WHERE type = 'farm' ORDER BY at, seq").toArray()) {
      const x = this.b.rowRec(r.data, 'farm');
      const d = x ? farmOf(x) : null;
      if (d && isWho(r.person)) farmStep(f, r.person, d, Date.parse(r.at));
    }
    return f;
  }

  /** A farm batch of `me`'s judged at the record's next `at` (the row's: the stored field and a fold of the rows agree)
   *  against the field, their pocket (the stored ledger's) and the wet days (`wet|<date>` rows): the field after it
   *  (its net `me`'s moves), the row as kept and its `at`; or, no op standing, why the first was refused. Each refusal
   *  logged (`farm.refused`: the first op's reason, how many dropped, how many kept), a batch kept in part too. */
  farmKept(me: Who, d: Rec): { ok: true; f: Farm; data: FarmData; at: string } | { ok: false; why: FarmRefusal } {
    const f = this.farmState();
    this.ledgerReady(me);
    const l = this.ledger.read(me, ['hp'])!;
    const wet = new Map<string, boolean>();
    const isWet = (date: string): boolean => {
      let w = wet.get(date);
      if (w === undefined) wet.set(date, (w = this.b.slotRow(`wet|${date}`) !== null));
      return w;
    };
    const at = this.b.nextAt(), refused: FarmRefusal[] = [];
    const data = farmStep(f, me, farmOf(d)!, Date.parse(at), { wet: isWet, pocket: (k) => l.p.get(k) ?? 0, refused: (why) => refused.push(why) });
    if (refused.length) this.b.io.log?.('farm.refused', { who: me, why: refused[0], n: refused.length, kept: data?.ops.length ?? 0 });
    return data ? { ok: true, f, data, at } : { ok: false, why: refused[0] ?? 'empty' };
  }

  /**
   * The daily prune (index.ts at 03:00 Tokyo, the admin's `island_prune`): the `island` rows of days before yesterday
   * deleted (contract/island.ts: nothing reads them, the record refuses them) and the old daily rules' `farm_water`
   * rows (unread since 2026-11-25), `max` at most (`more`: some left). Never another type's row. `dry`: counted only.
   */
  islandPrune(dry = false, max = PRUNE_BATCH): { old: number; deleted: number; more: boolean } {
    const before = prevDay(localDateAt(this.b.io.now()));
    // (the slot's unique index: the `island|` and `farm_water|` ranges, never a scan of the table)
    const island = "slot >= 'island|' AND slot < 'island}' AND type = 'island' AND substr(slot, -10) < ?";
    const water = "slot >= 'farm_water|' AND slot < 'farm_water}' AND type = 'farm_water'";
    return this.b.io.tx(() => {
      if (dry) return { old: this.b.io.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM events WHERE (${island}) OR (${water})`, before).toArray()[0]?.n ?? 0, deleted: 0, more: false };
      const d = this.b.dropBatch(island, [before], max);
      const w = d.more ? { n: 0, more: true } : this.b.dropBatch(water, [], max - d.n);
      return { old: d.n + w.n, deleted: d.n + w.n, more: d.more || w.more };
    });
  }

  /** A farm row kept (its `at`): the field after it stored (its pocket changes: the stored ledger's, ledgerNote). */
  farmNote(f: Farm, at: string): void {
    this.ledger.setField(f, at);
  }
}

/** A person's shop folded from their rows (shopFold): their tallies' totals less the give-backs, the
 *  give-backs, the ledger of their shop rows (contract/shop.ts). */
type Pocket = { caught: Map<string, number>; back: Map<string, number>; l: Ledger };

/** The wallets a batch of `me`'s may move (an op's ack carries them): theirs for a ledger's event of theirs (a tally,
 *  a give-back, the shop's, the field's), each recipient's for a reward. */
export function walletsTouched(me: Who, events: readonly unknown[]): Set<Who> {
  const out = new Set<Who>();
  for (const e of events) {
    if (!isRec(e) || typeof e.type !== 'string') continue;
    if (e.type === 'sg_reward') {
      if (isRec(e.data) && Array.isArray(e.data.to)) for (const w of e.data.to) if (isWho(w)) out.add(w);
    } else if (movesWallet(e.type)) out.add(me);
  }
  return out;
}
