// The migration's tools (docs/wedding.md "Migration"): the old board's doGet JSON → the load file and a report that
// names rows, ids and rules, never a value (scripts/wedding-sheet.ts, wedding-import.ts), the load (idempotent) and the
// parity of the record's dump against the Sheet (wedding-parity.ts). The fixture is invented, with the hazards a Sheet
// can hold: a cell the Sheets UI made a Date, a number cell, a repeated id, a row without one, orphans, a deleted task,
// a subtask with a date, a self-parent, whitespace, an unknown column and key, a long note.
import { describe, expect, it } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StoreCore } from '../src/store.ts';
import { convert, readSheet, reportText } from '../scripts/wedding-sheet.ts';
import { parity, recordBoard } from '../scripts/wedding-parity.ts';
import { wedConfig, wedNote, wedTasks } from '../../app/src/lib/contract/wedding.ts';
import { memSql } from './sqlite.ts';

const FIXTURE = join(import.meta.dirname, 'fixtures/wedding-doget.json');
const text = readFileSync(FIXTURE, 'utf8');
const sheet = readSheet(text);
const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const KEYS = { KEY_A: 'a'.repeat(64), KEY_B: 'b'.repeat(64), KEY_C: 'c'.repeat(64) };
const fresh = () => {
  const db = memSql();
  return new StoreCore({ sql: db.sql, tx: db.tx, keys: KEYS, now: () => Date.parse('2026-11-06T03:00:00.000Z'), notify: () => {} });
};
/** Every value in the fixture worth hiding: the titles, the names, the venue, a piece of the notes. */
const VALUES = [
  ...sheet.tasks.map((t) => String(t.title).trim()).filter((s) => s.length > 3),
  'Taro Test', 'Hanako Test', 'Example Chapel', '2027-04-18', '## Section 1', 'example.com'
];

describe('the conversion', () => {
  const c = convert(sheet);

  it('counts the rows as the old board read them', () => {
    expect(c.counts).toMatchObject({ rows: 14, 'tasks-top': 7, subtasks: 3, 'subtasks-promoted': 2, deleted: 1, done: 2, 'events-wtask': 12, 'events-wdone': 2, 'events-wconf': 7, 'events-wnote': 1, 'notes-chars': 60_001, categories: 4 });
  });

  it('finds every hazard, by row, column and rule', () => {
    const got = c.findings.map((f) => `${f.rule} ${f.at}${f.col ? ` ${f.col}` : ''}`).sort();
    expect(got).toEqual([
      'categories-cleaned config!categories', 'cell-number tasks!7 title', 'cell-whitespace tasks!14 category', 'cell-whitespace tasks!14 title',
      'config-unknown-key config!accent', 'date-wall-time tasks!6 due', 'id-duplicate tasks!8', 'id-missing tasks!13', 'notes-whitespace-kept config!notes',
      'orphan-dangling tasks!9', 'orphan-parent-deleted tasks!11', 'parent-self tasks!15', 'promoted-parent-dropped tasks!11', 'stamp-wall-time tasks!6 updated_at',
      'subtask-dates-dropped tasks!12', 'text-numeric tasks!7 title', 'time-padded config!wedding_time', 'unknown-column tasks!14 colour'
    ]);
  });

  it('emits the record’s rows: deterministic ids, `at` the row’s updated_at (a wall time in the sheet’s zone), imported, person A', () => {
    const ev = new Map(c.events.map((e) => [e[2], e]));
    expect(ev.get(`wed-${U(1)}-wtask`)![0]).toBe('2026-09-20T05:00:00.000Z');
    expect(JSON.parse(ev.get(`wed-${U(1)}-wdone`)![4])).toEqual({ id: U(1), at: Date.parse('2026-09-20T05:00:00.000Z'), v: 1, imported: true });
    // '2026-08-05T10:30' in Tokyo
    expect(ev.get(`wed-${U(5)}-wtask`)![0]).toBe('2026-08-05T01:30:00.000Z');
    expect(JSON.parse(ev.get(`wed-${U(5)}-wtask`)![4])).toMatchObject({ due: '2027-03-01', imported: true });
    expect(JSON.parse(ev.get(`wed-${U(6)}-wtask`)![4]).title).toBe('2027');
    expect(JSON.parse(ev.get(`wed-${U(8)}-wtask`)![4]).del).toBe(Date.parse('2026-10-01T00:00:00.000Z'));
    expect(JSON.parse(ev.get(`wed-${U(9)}-wtask`)![4])).toMatchObject({ due: '2027-01-20' });
    expect(JSON.parse(ev.get(`wed-${U(9)}-wtask`)![4]).parent).toBeUndefined();
    expect(JSON.parse(ev.get(`wed-${U(10)}-wtask`)![4])).toMatchObject({ parent: U(1) });
    expect(JSON.parse(ev.get(`wed-${U(10)}-wtask`)![4]).due).toBeUndefined();
    expect(JSON.parse(ev.get(`wed-${U(11)}-wtask`)![4])).toMatchObject({ title: 'Taste cakes', cat: 'Food' });
    expect(JSON.parse(ev.get('wed-conf-time')![4]).v).toBe('09:30');
    expect(JSON.parse(ev.get('wed-conf-cats')![4]).v).toEqual(['Venue', 'Guests', 'Food', 'Other']);
    expect(JSON.parse(ev.get('wed-note')![4]).md).toBe(sheet.config.notes);
    expect(c.events.every((e) => e[1] === 'A' && JSON.parse(e[4]).imported === true)).toBe(true);
    expect(new Set(c.events.map((e) => e[2])).size).toBe(c.events.length);
    expect(convert(readSheet(text)).events).toEqual(c.events);
  });

  it('the report names no value', () => {
    const r = reportText(c);
    for (const v of VALUES) expect(r, v).not.toContain(v);
  });
});

describe('the load and the parity', () => {
  it('loads into the record, a load again adds nothing, and the dump matches the Sheet (each difference by its rule)', () => {
    const store = fresh();
    const c = convert(sheet);
    expect(store.load({ rows: { events: c.events } })).toMatchObject({ ok: true, events: 22, skipped: 0 });
    expect(store.load({ rows: { events: c.events } })).toMatchObject({ ok: true, events: 0, skipped: 0 });
    const dump = store.dump().rows.events;
    const b = recordBoard(dump);
    expect(wedTasks(b)).toHaveLength(12);
    expect(wedConfig(b)).toMatchObject({ p1: 'Taro Test', tz: 'Asia/Tokyo' });
    expect(wedNote(b)?.md).toBe(sheet.config.notes);
    const p = parity(sheet, dump);
    expect(p.checked).toEqual({ tasks: 12, fields: 84, settings: 7, notes: 1 });
    expect(p.mismatches.filter((m) => !m.rule)).toEqual([]);
    expect(p.mismatches.map((m) => `${m.at} ${m.field} ${m.rule}`).sort()).toEqual([
      'config categories cats categories-cleaned', 'config wedding_time time time-padded',
      `task ${U(9)} parent promoted-parent-dropped`, `task ${U(10)} due subtask-dates-dropped`, `task ${U(12)} parent parent-self`
    ]);
  });

  it('a record that differs is caught, by id and field', () => {
    const store = fresh();
    store.load({ rows: { events: convert(sheet).events } });
    const dump = store.dump().rows.events.map((r) => {
      const d = JSON.parse(String(r[4]));
      if (r[3] === 'wtask' && d.id === U(2)) return [r[0], r[1], r[2], r[3], JSON.stringify({ ...d, title: 'Guest list!', due: '2026-12-02' })];
      if (r[3] === 'wnote') return [r[0], r[1], r[2], r[3], JSON.stringify({ ...d, md: d.md.trimEnd() })];
      if (r[3] === 'wconf' && d.k === 'venue') return null;
      if (r[3] === 'wdone' && d.id === U(1)) return null;
      return r;
    }).filter((r) => r !== null);
    const open = parity(sheet, dump).mismatches.filter((m) => !m.rule).map((m) => `${m.at} ${m.field}`).sort();
    expect(open).toEqual(['config venue venue', 'notes bytes', `task ${U(1)} done`, `task ${U(2)} due`, `task ${U(2)} title`]);
  });
});

describe('the commands', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wedding-'));
  const run = (script: string, ...args: string[]) => spawnSync(process.execPath, [join(import.meta.dirname, '../scripts', script), ...args], { encoding: 'utf8' });

  it('wedding-import writes the load file (mode 600), prints the report without values, and exits 1 while it isn’t clean', () => {
    const out = join(dir, 'load.json');
    const r = run('wedding-import.ts', FIXTURE, out);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('not clean');
    for (const v of VALUES) expect(r.stdout + r.stderr, v).not.toContain(v);
    expect(statSync(out).mode & 0o777).toBe(0o600);
    expect(JSON.parse(readFileSync(out, 'utf8')).rows.events).toEqual(convert(sheet).events);
  });

  it('wedding-parity: ok on a faithful dump, 1 on a mismatch, never a value', () => {
    const store = fresh();
    store.load({ rows: { events: convert(sheet).events } });
    const dumpFile = join(dir, 'dump.json');
    writeFileSync(dumpFile, JSON.stringify({ ok: true, rev: 'e1', rows: store.dump().rows }));
    const ok = run('wedding-parity.ts', FIXTURE, dumpFile);
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain('parity: ok (5 by rule)');
    writeFileSync(dumpFile, JSON.stringify({ ok: true, rev: 'e1', rows: { events: [] } }));
    const bad = run('wedding-parity.ts', FIXTURE, dumpFile);
    expect(bad.status).toBe(1);
    expect(bad.stdout).toContain('MISMATCH');
    for (const v of VALUES) expect(ok.stdout + bad.stdout, v).not.toContain(v);
  });
});
