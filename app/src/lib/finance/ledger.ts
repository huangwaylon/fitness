// The money app's state from the record's rows (contract/finance.ts): each `fin_e`, `fin_t` and `fin_c` slot's latest
// op read into the entries (deleted ones kept: the restore list and the recurring months need them), the live
// templates and the config over its defaults. A row the contract doesn't read is skipped and counted. Pure.
import { FIN_CFG_DEFAULT, finConfigOf, finEntryOf, finTemplateOf, type FinConfig, type FinEntry, type FinTemplate } from '#lib/contract/finance.ts';

/** A `fin_*` row as the snapshot carries it: its type and its op's data. */
export interface FinRow {
  type: string;
  d: Record<string, unknown>;
}

export interface Ledger {
  /** Every entry by id, deleted ones too (recurringRows reads its ids: a deleted instance still records its month). */
  all: Map<string, FinEntry>;
  /** The same, as a list (the folds of balance.ts skip the deleted). */
  entries: FinEntry[];
  /** The templates not deleted, by day, then description, then id. */
  templates: FinTemplate[];
  config: FinConfig;
  /** Rows not read (another type, or malformed). */
  bad: number;
}

const copyConfig = (c: Readonly<FinConfig>): FinConfig => ({ cats: [...c.cats], split: { ...c.split }, notes: [...c.notes] });

/** The state of `rows` in the record's order (a slot's later row replaces its earlier: the record keeps one each). */
export function ledgerOf(rows: Iterable<FinRow>): Ledger {
  const all = new Map<string, FinEntry>();
  const tpls = new Map<string, FinTemplate>();
  let config: FinConfig | null = null;
  let bad = 0;
  for (const { type, d } of rows) {
    if (type === 'fin_e') {
      // the import's mark is the record's to set, so a row from the record may carry it
      const e = finEntryOf(d, { imp: true });
      if (e) all.set(e.id, e);
      else bad++;
    } else if (type === 'fin_t') {
      const t = finTemplateOf(d);
      if (t) tpls.set(t.id, t);
      else bad++;
    } else if (type === 'fin_c') {
      const c = finConfigOf(d);
      if (c) config = c;
      else bad++;
    } else bad++;
  }
  const templates = [...tpls.values()]
    .filter((t) => t.del === undefined)
    .sort((a, b) => a.day - b.day || (a.desc < b.desc ? -1 : a.desc > b.desc ? 1 : 0) || (a.id < b.id ? -1 : 1));
  return { all, entries: [...all.values()], templates, config: config ?? copyConfig(FIN_CFG_DEFAULT), bad };
}
