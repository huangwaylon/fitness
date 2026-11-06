// The old wedding board's Sheet → a `load` file for the record (docs/wedding.md "Migration"), and a report that names
// rows, ids, columns and rules, never a value (the Sheet holds the couple's names, the venue, the date):
//   node scripts/wedding-import.ts <doget.json> [<out.json>]
// <doget.json>: the old Apps Script's doGet reply ({ok, tasks, config, sheetTimeZone}), kept in ~/Documents/island-backups
// (mode 600). <out.json>: the load file (default: beside it, `<name>.load.json`, mode 600), for
// `node scripts/record.ts load <out.json> [--test]`. Exits 1 when a finding isn't only a note (the report's `(info)`):
// nothing loads until each one has its rule (wedding-sheet.ts).
import { readFileSync, writeFileSync } from 'node:fs';
import { convert, INFO_RULES, readSheet, reportText } from './wedding-sheet.ts';

const [inp, out = inp?.replace(/\.json$/, '') + '.load.json'] = process.argv.slice(2);
if (!inp) {
  console.error('usage: node scripts/wedding-import.ts <doget.json> [<out.json>]');
  process.exit(2);
}
const c = convert(readSheet(readFileSync(inp, 'utf8')));
writeFileSync(out, `${JSON.stringify({ rows: { events: c.events } })}\n`, { mode: 0o600 });
console.log(reportText(c));
console.log(`load file: ${c.events.length} events → ${out}`);
const open = c.findings.filter((f) => !INFO_RULES.has(f.rule));
if (open.length) {
  console.log(`not clean: ${open.length} finding(s) to decide before a load`);
  process.exit(1);
}
