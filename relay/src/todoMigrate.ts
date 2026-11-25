// やること's one-shot move from lists to one list (the user, 2026-11-25; docs/todo.md "The move from lists"). Each
// standing list becomes one item under the list's id: its title the text, its items the note, one a line, the open
// ones first in list order, then the done ones marked 「✓ 」; a dated item's line ends with its due (「（11/24 15:00）」).
// The item carries the earliest open due, with that item's reminder; the others' reminders go (their dates stay in
// their lines). The item is done when the list had items and all were done. A note past TODO_NOTE keeps the lines that
// fit and ends 「…ほか N件」. An item whose list is gone (none should be: a list's removal took them) is dropped.
// Pure: the record's admin op (store.ts todoMigrate) reads the rows, writes what this returns, in one transaction.
import type { Who } from '../../app/src/lib/contract/api.ts';
import { cleanLine } from '../../app/src/lib/contract/text.ts';
import { cleanNote, TODO_NOTE, TODO_TEXT, todoOpOf, type TodoItem } from '../../app/src/lib/contract/todo.ts';
import { dueOf, type Rem } from '../../app/src/lib/contract/todoDue.ts';

type Rec = Record<string, unknown>;
type OldList = { id: string; title: string; ord: number; who: Who };
type OldItem = { id: string; list: string; text: string; ord: number; done: boolean; due?: string; rem?: Rem; to?: Who[] };

/** A row of the lists' shape: a list, an item, or neither (a removal, a new item, anything else). */
export function oldOf(d: Rec, who: Who): { list: OldList } | { item: OldItem } | null {
  if (typeof d.id !== 'string' || d.rm !== undefined || typeof d.ord !== 'number') return null;
  if (typeof d.title === 'string' && d.list === undefined) return { list: { id: d.id, title: d.title, ord: d.ord, who } };
  if (typeof d.list !== 'string' || typeof d.text !== 'string') return null;
  return { item: { id: d.id, list: d.list, text: d.text, ord: d.ord, done: d.done === 1, ...(typeof d.due === 'string' && { due: d.due }), ...(typeof d.rem === 'string' && Array.isArray(d.to) && { rem: d.rem as Rem, to: d.to as Who[] }) } };
}

/** `11/24` or `11/24 9:30`. */
function dueWords(due: string): string {
  const d = dueOf(due);
  if (!d) return '';
  const md = `${+d.date.slice(5, 7)}/${+d.date.slice(8, 10)}`;
  return d.time ? `${md} ${d.time.replace(/^0(\d)/, '$1')}` : md;
}

const byOrd = <T extends { ord: number; id: string }>(a: T, b: T): number => a.ord - b.ord || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export interface Moved { who: Who; op: TodoItem; items: number; done: number; cut: number }

/** Each list as its one item (`at`: the record's clock, ms); `orphans`: items in no list. */
export function migrate(lists: OldList[], items: OldItem[], at: number): { moved: Moved[]; orphans: number } {
  const of = new Map(lists.map((l) => [l.id, [] as OldItem[]]));
  let orphans = 0;
  for (const it of items) {
    const box = of.get(it.list);
    if (box) box.push(it);
    else orphans++;
  }
  const moved = [...lists].sort(byOrd).map((l): Moved => {
    const its = of.get(l.id)!.sort(byOrd);
    const open = its.filter((i) => !i.done), done = its.filter((i) => i.done);
    const line = (i: OldItem) => `${i.done ? '✓ ' : ''}${i.text}${i.due && dueWords(i.due) ? `（${dueWords(i.due)}）` : ''}`;
    const lines = [...open, ...done].map((i) => cleanNote(line(i)));
    // the lines that fit, the rest counted on the last
    let note = lines.join('\n'), cut = 0;
    while ([...note].length > TODO_NOTE) {
      cut++;
      note = `${lines.slice(0, lines.length - cut).join('\n')}\n…ほか${cut}件`;
    }
    // the earliest open due ('2026-11-24' before '2026-11-24T09:00'), with its reminder
    const first = open.filter((i) => i.due && dueOf(i.due)).sort((a, b) => (a.due! < b.due! ? -1 : a.due! > b.due! ? 1 : 0))[0];
    const op: Rec = {
      id: l.id, at, text: cleanLine(l.title, TODO_TEXT) || '…', ...(note && { note }), ord: l.ord, done: its.length && !open.length ? 1 : 0,
      ...(first && { due: first.due, ...(first.rem && first.to && { rem: first.rem, to: first.to }) })
    };
    // read as a phone's op would be (a reminder the contract wouldn't take dropped, the due kept)
    const { rem: _r, to: _t, ...plain } = op;
    const ok = (todoOpOf(op) ?? todoOpOf(plain)) as TodoItem | null;
    if (!ok) throw new Error(`todo migrate: list ${l.id} makes no item`);
    return { who: l.who, op: ok, items: its.length, done: done.length, cut };
  });
  return { moved, orphans };
}
