// The record's wedding board against the old Sheet (docs/wedding.md "Migration", step 3 and 4): per task id its title,
// category, due, start, done, deleted and parent as the old board read them (cellText, normalizeDay), every setting
// (as parseConfig: trimmed, a blank one absent, the categories a list), the notes byte for byte. Prints each mismatch
// by id (or key) and field, never a value; one the conversion made on purpose names its rule (wedding-sheet.ts).
//   node scripts/wedding-parity.ts <doget.json> <dump.json>
// <dump.json>: `node scripts/record.ts dump [--test] > dump.json` (mode 600). Exits 1 on a mismatch without a rule.
import { readFileSync } from 'node:fs';
import { wedConfig, wedFold, wedNote, wedRowOf, wedTasks, type WedRow } from '../../app/src/lib/contract/wedding.ts';
import { cellText, CONFIG_KEYS, convert, normalizeDay, readSheet, type Sheet } from './wedding-sheet.ts';

/** The record's board from a dump's events (each slot's latest row, as the record keeps them). */
export function recordBoard(events: unknown[][]) {
  const rows: WedRow[] = [];
  for (const r of events) {
    if (!Array.isArray(r) || typeof r[3] !== 'string' || typeof r[4] !== 'string' || (r[1] !== 'A' && r[1] !== 'B' && r[1] !== 'G')) continue;
    let d: unknown;
    try { d = JSON.parse(r[4]); } catch { continue; }
    const row = d && typeof d === 'object' ? wedRowOf(r[3], d as Record<string, unknown>, r[1]) : null;
    if (row) rows.push(row);
  }
  return wedFold(rows);
}

export interface Mismatch { at: string; field: string; rule?: string }

/** Every mismatch between the Sheet and the record's board (`rule`: the conversion's own change). */
export function parity(sheet: Sheet, events: unknown[][]): { mismatches: Mismatch[]; checked: Record<string, number> } {
  const book = recordBoard(events);
  const conv = convert(sheet);
  const rule = (id: string, field: string) => conv.changed.find((c) => c.id === id && c.field === field)?.rule;
  const out: Mismatch[] = [];
  const checked = { tasks: 0, fields: 0, settings: 0, notes: 0 };
  const rec = new Map(wedTasks(book).map((t) => [t.id, t]));
  const seen = new Set<string>();
  for (const t of sheet.tasks) {
    const id = cellText(t.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    checked.tasks++;
    const r = rec.get(id);
    if (!r) {
      out.push({ at: `task ${id}`, field: 'present', rule: rule(id, 'present') });
      continue;
    }
    const want: Record<string, string | boolean> = {
      title: cellText(t.title), category: cellText(t.category), due: normalizeDay(t.due), start: normalizeDay(t.start),
      done: cellText(t.done_at) !== '', deleted: cellText(t.deleted_at) !== '', parent: cellText(t.parent_id)
    };
    const have: Record<string, string | boolean> = {
      title: r.title, category: r.category, due: r.due, start: r.start, done: r.doneAt !== '', deleted: r.deletedAt !== '', parent: r.parentId
    };
    for (const f of Object.keys(want)) {
      checked.fields++;
      if (want[f] !== have[f]) out.push({ at: `task ${id}`, field: f, rule: rule(id, f) });
    }
  }
  for (const id of rec.keys()) if (!seen.has(id)) out.push({ at: `task ${id}`, field: 'extra' });

  const conf = wedConfig(book);
  for (const [k, key] of Object.entries(CONFIG_KEYS)) {
    const raw = sheet.config[k];
    if (key === 'notes') {
      checked.notes++;
      const md = raw == null ? '' : String(raw);
      const n = wedNote(book);
      const same = md.trim() ? !!n && Buffer.from(n.md, 'utf8').equals(Buffer.from(md, 'utf8')) : !n;
      if (!same) out.push({ at: 'notes', field: 'bytes' });
      if (n?.was) out.push({ at: 'notes', field: 'conflict' });
      continue;
    }
    checked.settings++;
    const s = cellText(raw);
    const want = key === 'cats' ? (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : undefined) : s || undefined;
    const have = conf[key];
    if (JSON.stringify(want) !== JSON.stringify(have)) out.push({ at: `config ${k}`, field: key, rule: conv.findings.find((f) => f.at === `config!${k}` && f.rule !== 'config-key-absent')?.rule });
  }
  return { mismatches: out, checked };
}

if (import.meta.main) {
  const [inp, dump] = process.argv.slice(2);
  if (!inp || !dump) {
    console.error('usage: node scripts/wedding-parity.ts <doget.json> <dump.json>');
    process.exit(2);
  }
  const d = JSON.parse(readFileSync(dump, 'utf8')) as { rows?: { events?: unknown[][] } };
  const { mismatches, checked } = parity(readSheet(readFileSync(inp, 'utf8')), d.rows?.events ?? []);
  console.log(`checked: ${checked.tasks} tasks (${checked.fields} fields), ${checked.settings} settings, notes ${checked.notes ? 'yes' : 'no'}`);
  for (const m of mismatches) console.log(`  ${m.at} ${m.field}${m.rule ? ` (rule: ${m.rule})` : ''}`);
  const open = mismatches.filter((m) => !m.rule);
  console.log(open.length ? `MISMATCH: ${open.length} without a rule` : `parity: ok${mismatches.length ? ` (${mismatches.length} by rule)` : ''}`);
  if (open.length) process.exit(1);
}
