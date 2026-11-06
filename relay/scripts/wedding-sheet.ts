// The old wedding board's Sheet, as its Apps Script `doGet` serves it (`{ok, tasks, config, sheetTimeZone}`: every
// cell a string, the tasks keyed by the ten column names), converted to the record's rows (docs/wedding.md
// "Migration"): the shared part of wedding-import.ts (the load file and the report) and wedding-parity.ts (the record
// against the Sheet). Nothing here prints a cell's value: the findings name rows, ids, columns and rules only.
//
// The rules (each finding names its rule; a load waits until the report is clean or each finding has one):
// - a task row: `at` = updated_at, else created_at (ISO; a `YYYY-MM-DDTHH:mm` cell, the old script's Date, read as
//   wall time in the sheet's zone); `c` = created_at, else `at`; person A, `imported: true`; the old reader's cellText
//   (trimmed), the title and category one clean line (contract/wedding.ts); due and start as its normalizeDay
//   (a clock time dropped; not a day: dropped); deleted_at → `del`, done_at → a `wdone` (v 1 at done_at); a row
//   without an id is skipped (the old reader skipped it), a repeat of an id too (the first wins, as the old writes'
//   rowOf), a row without a title too (the record takes none);
// - a subtask (parent_id) with a date: under a live top-level task, its dates dropped (the old board never read them);
//   else, being shown as a task, its parent dropped (promoted, dates kept); a self-parent's parent dropped;
// - the config: partner1_name → p1, partner2_name → p2, wedding_date → date, wedding_time → time, venue, timezone →
//   tz, categories → cats (comma-separated, as parseConfig), each trimmed and blank omitted (the default then, as
//   parseConfig); notes → the `wnote`, byte for byte (not trimmed); its `at` and every setting's the sheet's newest
//   timestamp (it never recorded when they were set);
// - event ids `wed-<task id>-wtask`, `wed-<task id>-wdone`, `wed-conf-<key>`, `wed-note`: a load again skips them.
import { isLocalDate } from '../../app/src/lib/contract/api.ts';
import { cleanLine } from '../../app/src/lib/contract/text.ts';
import { wedOpOf, WNOTE_CHARS, WTASK_CAT, WTASK_TITLE, type WConfKey } from '../../app/src/lib/contract/wedding.ts';

export const COLUMNS = ['id', 'title', 'category', 'due', 'done_at', 'created_at', 'updated_at', 'deleted_at', 'parent_id', 'start'] as const;
type Column = (typeof COLUMNS)[number];
/** The config tab's keys → the record's (notes: the wnote). */
export const CONFIG_KEYS: Record<string, WConfKey | 'notes'> = {
  partner1_name: 'p1', partner2_name: 'p2', wedding_date: 'date', wedding_time: 'time', venue: 'venue', timezone: 'tz', categories: 'cats', notes: 'notes'
};

export interface Sheet { tasks: Record<string, unknown>[]; config: Record<string, unknown>; sheetTimeZone: string }

/** The doGet JSON read (its shape checked; nothing else). */
export function readSheet(text: string): Sheet {
  const x = JSON.parse(text) as Record<string, unknown>;
  if (typeof x !== 'object' || x === null || !Array.isArray(x.tasks) || typeof x.config !== 'object' || x.config === null || Array.isArray(x.config)) throw new Error('not the old board’s doGet JSON: {ok, tasks: [...], config: {...}, sheetTimeZone}');
  if (!x.tasks.every((t) => typeof t === 'object' && t !== null && !Array.isArray(t))) throw new Error('a task that is not an object');
  return { tasks: x.tasks as Record<string, unknown>[], config: x.config as Record<string, unknown>, sheetTimeZone: typeof x.sheetTimeZone === 'string' ? x.sheetTimeZone : 'Asia/Tokyo' };
}

/** The old reader's cellText: '' for a missing cell, else the string trimmed. */
export const cellText = (v: unknown): string => (v == null ? '' : String(v).trim());
/** The old board's normalizeDay: a clock time dropped, '' when it isn't a real day. */
export function normalizeDay(v: unknown): string {
  const raw = cellText(v).slice(0, 10);
  return isLocalDate(raw) ? raw : '';
}

const ISO_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
/** What the old script made of a cell the Sheets UI had turned into a Date (`readCell`: wall time in the sheet's zone). */
const WALL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** A wall time in `tz` → ms (the zone's offset at that time, by Intl). */
function wallMs(y: number, mo: number, d: number, h: number, mi: number, tz: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const offset = (t: number): number => {
    const p = Object.fromEntries(fmt.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t;
  };
  let t = guess - offset(guess);
  t = guess - offset(t);
  return t;
}

/** A timestamp cell → ms and how it read: `iso` (the record's format), `iso-other` (another ISO form Date reads),
 *  `wall` (the old script's Date: wall time in the sheet's zone), `bad` (unreadable), `empty`. */
export function stampOf(v: unknown, tz: string): { ms: number | null; how: 'iso' | 'iso-other' | 'wall' | 'bad' | 'empty' } {
  const s = cellText(v);
  if (!s) return { ms: null, how: 'empty' };
  if (ISO_MS.test(s)) return { ms: Date.parse(s), how: 'iso' };
  const w = WALL.exec(s);
  if (w) return { ms: wallMs(+w[1], +w[2], +w[3], +w[4], +w[5], tz), how: 'wall' };
  const ms = /^\d{4}-\d{2}-\d{2}T/.test(s) ? Date.parse(s) : NaN;
  return Number.isFinite(ms) ? { ms, how: 'iso-other' } : { ms: null, how: 'bad' };
}
const okMs = (ms: number | null): ms is number => ms !== null && ms >= 1e12 && ms <= 1e14;

/** One finding: a rule, where (a sheet row as `tasks!<n>` with the header as row 1, a task id, a config key), a column. */
export interface Finding { rule: string; at: string; col?: string; id?: string }
/** A field the conversion changed from the old reader's view, by its rule (parity's explained mismatches). */
export interface Changed { id: string; field: 'title' | 'category' | 'due' | 'start' | 'parent' | 'done' | 'deleted' | 'present'; rule: string }

export interface Converted {
  /** The load file's rows (`record.ts load`): `[at, person, id, type, data]`. */
  events: [string, 'A', string, string, string][];
  findings: Finding[];
  changed: Changed[];
  counts: Record<string, number>;
}

const iso = (ms: number): string => new Date(ms).toISOString();

/** The Sheet as the record's rows, with every finding (see the rules above). */
export function convert(sheet: Sheet): Converted {
  const tz = sheet.sheetTimeZone;
  const findings: Finding[] = [];
  const changed: Changed[] = [];
  const counts: Record<string, number> = {};
  const count = (k: string, n = 1) => void (counts[k] = (counts[k] ?? 0) + n);
  const find = (f: Finding) => void findings.push(f);
  const events: Converted['events'] = [];
  const where = (i: number) => `tasks!${i + 2}`;

  // the cells: non-strings, unknown columns, whitespace, the timestamps' forms
  const stamps: number[] = [];
  sheet.tasks.forEach((t, i) => {
    for (const k of Object.keys(t)) if (!(COLUMNS as readonly string[]).includes(k)) find({ rule: 'unknown-column', at: where(i), col: k });
    for (const c of COLUMNS) {
      const v = t[c];
      if (v !== undefined && v !== null && typeof v !== 'string') find({ rule: `cell-${typeof v}`, at: where(i), col: c });
      if (typeof v === 'string' && v !== v.trim()) find({ rule: 'cell-whitespace', at: where(i), col: c });
    }
    for (const c of ['created_at', 'updated_at', 'done_at', 'deleted_at'] as const) {
      const s = stampOf(t[c], tz);
      if (s.how === 'wall') find({ rule: 'stamp-wall-time', at: where(i), col: c });
      else if (s.how === 'iso-other') find({ rule: 'stamp-not-iso-ms', at: where(i), col: c });
      else if (s.how === 'bad') find({ rule: 'stamp-unreadable', at: where(i), col: c });
      if (okMs(s.ms)) stamps.push(s.ms);
    }
    for (const c of ['due', 'start'] as const) {
      const s = cellText(t[c]);
      if (!s || isLocalDate(s)) continue;
      find({ rule: WALL.test(s) ? 'date-wall-time' : normalizeDay(s) ? 'date-with-time' : 'date-unreadable', at: where(i), col: c });
    }
    for (const c of ['title', 'category'] as const) if (/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(cellText(t[c]))) find({ rule: 'text-numeric', at: where(i), col: c });
  });
  const newest = stamps.length ? Math.max(...stamps) : Date.parse('2026-01-01T00:00:00.000Z');
  const oldest = stamps.length ? Math.min(...stamps) : newest;

  // the rows the old reader read: with an id, the first of each id
  const rows: { i: number; t: Record<string, unknown>; id: string }[] = [];
  const seen = new Map<string, number>();
  sheet.tasks.forEach((t, i) => {
    const empty = COLUMNS.every((c) => !cellText(t[c]));
    const id = cellText(t.id);
    if (empty) return void count('rows-blank');
    if (!id) return void find({ rule: 'id-missing', at: where(i) });
    if (seen.has(id)) {
      find({ rule: 'id-duplicate', at: where(i), id });
      return;
    }
    seen.set(id, i);
    rows.push({ i, t, id });
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const live = (r: { t: Record<string, unknown> }) => !cellText(r.t.deleted_at);
  // a live top-level task: a parent a subtask can sit under (the old partitionSubtasks)
  const topLevel = (id: string) => {
    const r = byId.get(id);
    return !!r && live(r) && !cellText(r.t.parent_id);
  };

  for (const { i, t, id } of rows) {
    const cell = (c: Column) => cellText(t[c]);
    const at0 = stampOf(t.updated_at, tz).ms, c0 = stampOf(t.created_at, tz).ms;
    let at = okMs(at0) ? at0 : okMs(c0) ? c0 : null;
    if (at === null) {
      find({ rule: 'no-timestamp', at: where(i), id });
      at = oldest;
    }
    const c = okMs(c0) ? c0 : at;
    const title = cleanLine(cell('title'), WTASK_TITLE), cat = cleanLine(cell('category'), WTASK_CAT);
    if (!title) {
      find({ rule: 'title-missing', at: where(i), id });
      changed.push({ id, field: 'present', rule: 'title-missing' });
      continue;
    }
    if (title !== cell('title')) {
      find({ rule: [...cell('title')].length > WTASK_TITLE ? 'title-cut' : 'title-cleaned', at: where(i), id, col: 'title' });
      changed.push({ id, field: 'title', rule: 'title-cleaned' });
    }
    if (cat !== cell('category')) {
      find({ rule: [...cell('category')].length > WTASK_CAT ? 'category-cut' : 'category-cleaned', at: where(i), id, col: 'category' });
      changed.push({ id, field: 'category', rule: 'category-cleaned' });
    }
    const d: Record<string, unknown> = { id, at, c, title, cat };
    let due = normalizeDay(t.due), start = normalizeDay(t.start);
    let parent = cell('parent_id');
    if (parent === id) {
      find({ rule: 'parent-self', at: where(i), id });
      changed.push({ id, field: 'parent', rule: 'parent-self' });
      parent = '';
    }
    if (parent) {
      count(topLevel(parent) ? 'subtasks' : 'subtasks-promoted');
      if (!topLevel(parent)) find({ rule: !byId.has(parent) ? 'orphan-dangling' : !live(byId.get(parent)!) ? 'orphan-parent-deleted' : 'orphan-grandchild', at: where(i), id });
      if (due || start) {
        if (topLevel(parent)) {
          find({ rule: 'subtask-dates-dropped', at: where(i), id });
          if (due) changed.push({ id, field: 'due', rule: 'subtask-dates-dropped' });
          if (start) changed.push({ id, field: 'start', rule: 'subtask-dates-dropped' });
          due = start = '';
        } else {
          find({ rule: 'promoted-parent-dropped', at: where(i), id });
          changed.push({ id, field: 'parent', rule: 'promoted-parent-dropped' });
          parent = '';
        }
      }
    } else count('tasks-top');
    if (due) d.due = due;
    if (start) d.start = start;
    if (parent) d.parent = parent;
    if (cell('deleted_at')) {
      const del = stampOf(t.deleted_at, tz).ms;
      d.del = okMs(del) ? del : at;
      count('deleted');
    }
    d.imported = true;
    emit(`wed-${id}-wtask`, 'wtask', d, at, where(i));
    if (cell('done_at')) {
      const done = stampOf(t.done_at, tz).ms;
      const dat = okMs(done) ? done : at;
      emit(`wed-${id}-wdone`, 'wdone', { id, at: dat, v: 1, imported: true }, dat, where(i));
      count('done');
    }
  }

  // the config
  for (const [k, raw] of Object.entries(sheet.config)) {
    const key = CONFIG_KEYS[k];
    if (!key) {
      find({ rule: 'config-unknown-key', at: `config!${k}` });
      continue;
    }
    if (raw !== undefined && raw !== null && typeof raw !== 'string') find({ rule: `cell-${typeof raw}`, at: `config!${k}` });
    if (key === 'notes') {
      const md = raw == null ? '' : String(raw);
      count('notes-chars', md.length);
      if (md !== md.trim()) find({ rule: 'notes-whitespace-kept', at: `config!${k}` });
      if (md.length > WNOTE_CHARS) find({ rule: 'notes-too-long', at: `config!${k}` });
      if (md.trim()) emit('wed-note', 'wnote', { at: newest, md, imported: true }, newest, `config!${k}`);
      continue;
    }
    const s = cellText(raw);
    if (!s) {
      count('config-blank');
      continue;
    }
    let v: string | string[] = s;
    if (key === 'cats') {
      const items = s.split(',').map((x) => x.trim()).filter(Boolean);
      const clean = items.map((x) => cleanLine(x, WTASK_CAT)).filter(Boolean);
      const uniq = clean.filter((x, j) => clean.indexOf(x) === j);
      if (uniq.length !== items.length || clean.some((x, j) => x !== items[j])) find({ rule: 'categories-cleaned', at: `config!${k}` });
      if (uniq.length > 30) find({ rule: 'categories-too-many', at: `config!${k}` });
      v = uniq.slice(0, 30);
      count('categories', v.length);
    } else if (key === 'date') {
      v = normalizeDay(s);
      if (v !== s) find({ rule: v ? 'date-with-time' : 'date-unreadable', at: `config!${k}` });
    } else if (key === 'p1' || key === 'p2' || key === 'venue') {
      v = cleanLine(s, key === 'venue' ? 200 : 40);
      if (v !== s) find({ rule: 'config-cleaned', at: `config!${k}` });
    } else if (key === 'time' && /^\d:\d{2}$/.test(s)) {
      v = `0${s}`;
      find({ rule: 'time-padded', at: `config!${k}` });
    }
    emit(`wed-conf-${key}`, 'wconf', { k: key, at: newest, v, imported: true }, newest, `config!${k}`);
  }
  for (const k of Object.keys(CONFIG_KEYS)) if (!(k in sheet.config)) find({ rule: 'config-key-absent', at: `config!${k}` });

  counts['rows'] = sheet.tasks.length;
  counts['config-keys'] = Object.keys(sheet.config).length;
  for (const e of events) count(`events-${e[3]}`);
  return { events, findings, changed, counts };

  function emit(eid: string, type: string, d: Record<string, unknown>, at: number, place: string): void {
    // (what the record's load would skip: never expected, but never silently)
    if (!wedOpOf(type, d)) return void find({ rule: 'unloadable', at: place });
    events.push([iso(at), 'A', eid, type, JSON.stringify(d)]);
  }
}

/** The findings that are only notes (nothing lost or changed by them). */
export const INFO_RULES = new Set(['cell-whitespace', 'config-key-absent', 'notes-whitespace-kept']);

/** A report's text: the counts and the findings by rule (where, never a value). */
export function reportText(c: Converted): string {
  const lines = ['counts:', ...Object.entries(c.counts).sort().map(([k, n]) => `  ${k}: ${n}`)];
  const byRule = new Map<string, Finding[]>();
  for (const f of c.findings) byRule.set(f.rule, [...(byRule.get(f.rule) ?? []), f]);
  lines.push(`findings: ${c.findings.length}${c.findings.length ? '' : ' (clean)'}`);
  for (const [rule, fs] of [...byRule].sort()) {
    lines.push(`  ${rule}${INFO_RULES.has(rule) ? ' (info)' : ''}: ${fs.length}`);
    for (const f of fs.slice(0, 50)) lines.push(`    ${f.at}${f.col ? ` ${f.col}` : ''}${f.id ? ` id ${f.id}` : ''}`);
    if (fs.length > 50) lines.push(`    … ${fs.length - 50} more`);
  }
  return lines.join('\n');
}

