// An invented wedding board for the dev page (routes/dev/wedding) and the tests: ~25 tasks around `today` (overdue,
// this month, later months, the wedding month, after it, undated; done by each of the three and imported; subtasks),
// two deleted, invented names and venue. Not the couple's: never their names, venue or date. `apply` plays an action
// on the rows, so the dev page edits them as the store would (a stand-in for components/wedding/board.svelte.ts and
// lib/wedding/progress.ts, which the store brings). In a `fixtures/` folder: the font subset doesn't read it.
import { addDays, daysBetween } from '#lib/time/dates.ts';
import type { Board, Config, NewTask, Task, TaskPatch, TaskState, Who3, ConfigKey, ConfigValue } from '../view.ts';

interface Row {
  id: string;
  title: string;
  cat: string;
  due?: string;
  start?: string;
  parent?: string;
  done?: boolean;
  by?: Who3;
  imported?: boolean;
  /** Deleted at (ms). */
  del?: number;
  /** Created order (subtasks read in it). */
  n: number;
}

export interface Demo {
  rows: Row[];
  config: Config;
  note: { md: string; at: number; conflict?: { mine: string; theirs: string } | null };
}

const DEMO_NOTE = `# かいじょう
- **はなぞの テラス**（ガーデン つき）に けってい
- 見積もりは [こちら](https://example.com/estimate)

## ドレス
1. 試着は 2かいまで
2. *カラードレス* も みたい

ゲストは だいたい 60にん。
メモ: <b>タグ</b> は そのまま 文字に なる。`;

/** The demo board's rows around `today` (the wedding 225 days on). */
export function demoBoard(today: string): Demo {
  const d = (n: number) => addDays(today, n);
  const W = 225;
  let n = 0;
  const row = (id: string, title: string, cat: string, o: Partial<Row> = {}): Row => ({ id, title, cat, n: n++, ...o });
  const rows: Row[] = [
    row('guests', '招待する ゲストの リスト', 'ゲスト', { due: d(-12) }),
    row('guests-1', 'しんぞくを かきだす', '', { parent: 'guests', done: true, by: 'A' }),
    row('guests-2', 'ともだちを かきだす', '', { parent: 'guests', done: true, by: 'B' }),
    row('guests-3', 'しょくばの ひと', '', { parent: 'guests', done: true, by: 'A' }),
    row('guests-4', '住所を あつめる https://example.com/form', '', { parent: 'guests' }),
    row('guests-5', 'さいしゅう かくにん', '', { parent: 'guests' }),
    row('estimate', '見積もりを くらべる', 'かいじょう', { due: d(-3) }),
    row('dress', 'ドレスの 試着を よやく', 'いしょう', { due: d(4) }),
    row('photo', '前撮りの カメラマンを さがす', 'しゃしん', { due: d(10), start: d(-5) }),
    row('photo-1', 'さくれいを みる', '', { parent: 'photo', done: true, by: 'G' }),
    row('photo-2', 'みつもりを たのむ', '', { parent: 'photo' }),
    row('photo-3', 'ロケ地を きめる', '', { parent: 'photo' }),
    row('venue', '式場を きめる', 'かいじょう', { due: d(-70), done: true, by: 'A', imported: true }),
    row('day', '日取りを きめる', 'かいじょう', { due: d(-64), done: true, by: 'A', imported: true }),
    row('fair', 'ブライダルフェアに いく', 'かいじょう', { due: d(-45), done: true, by: 'B' }),
    row('rings', '結婚指輪を えらぶ', 'ゆびわ', { due: d(-20), done: true, by: 'B' }),
    row('budget', '予算を きめる', 'おかね', { due: d(-30), done: true, by: 'G' }),
    row('invite-design', '招待状の デザイン', 'ゲスト', { due: d(35), start: d(20) }),
    row('invite-send', '招待状を おくる', 'ゲスト', { due: d(80) }),
    row('party', '二次会の かいじょう', 'かいじょう', { due: d(100) }),
    row('gifts', '引き出物を えらぶ', 'ギフト', { due: d(120) }),
    row('tasting', '料理の 試食会', 'りょうり', { due: d(140), done: true, by: 'A' }),
    row('music', 'BGMを えらぶ', 'おんがく', { due: d(160) }),
    row('music-1', 'にゅうじょうの きょく', '', { parent: 'music', done: true, by: 'B' }),
    row('music-2', 'かんぱいの きょく', '', { parent: 'music', done: true, by: 'A' }),
    row('music-3', 'エンディング', '', { parent: 'music' }),
    row('music-4', 'おくりだし', '', { parent: 'music' }),
    row('bouquet', 'ブーケを たのむ', 'いしょう', { due: d(170) }),
    row('seats', '席次表を つくる', 'ゲスト', { due: d(190) }),
    row('hair', 'ヘアメイクの リハーサル', 'いしょう', { due: d(200) }),
    row('final', 'さいごの うちあわせ', 'かいじょう', { due: d(W - 7) }),
    row('board', 'ウェルカムボードを かざる', 'かいじょう', { due: d(W - 1) }),
    row('wedding', 'けっこんしき！', 'かいじょう', { due: d(W) }),
    row('honeymoon', 'しんこんりょこうの よやく', 'りょこう', { due: d(W + 20) }),
    row('move', 'ひっこしの てつづき', 'くらし'),
    row('thanks', 'おれいの てがみ', 'ゲスト'),
    row('cake', 'ケーキの 試食', 'りょうり', { due: d(60), del: 1_700_000_000_000 }),
    row('old', 'ふるい メモ', '', { del: 1_700_100_000_000 })
  ];
  return {
    rows,
    config: { p1: 'ハル', p2: 'ミオ', date: d(W), venue: 'はなぞの テラス', tz: 'Asia/Tokyo', cats: ['かいじょう', 'いしょう', 'ゲスト', 'しゃしん', 'りょうり', 'ゆびわ', 'ギフト', 'おんがく', 'おかね', 'りょこう', 'くらし'] },
    note: { md: DEMO_NOTE, at: 1 }
  };
}

const stateOf = (r: Row, today: string): TaskState => {
  if (r.done) return 'done';
  if (!r.due) return 'nodate';
  const days = daysBetween(today, r.due);
  return days < 0 ? 'overdue' : days <= 14 ? 'soon' : 'later';
};

/** The board the components draw (the store's job, done simply). */
export function boardOf(demo: Demo, today: string): Board {
  const live = demo.rows.filter((r) => !r.del);
  const top = live.filter((r) => !r.parent || !live.some((p) => p.id === r.parent && !p.parent));
  const subs = (id: string) => live.filter((r) => r.parent === id).sort((a, b) => a.n - b.n);
  const task = (r: Row, children: Row[]): Task => {
    const sub = children.map((c) => task(c, []));
    const tally = sub.length ? { done: sub.filter((s) => s.done).length, total: sub.length } : null;
    return {
      id: r.id, title: r.title, cat: r.cat, due: r.due, start: r.start, done: !!r.done, by: r.by, imported: r.imported, subtasks: sub,
      progress: { percent: r.done ? 1 : tally ? tally.done / tally.total : 0, state: stateOf(r, today), tally }
    };
  };
  return {
    tasks: top.map((r) => task(r, subs(r.id))),
    deleted: demo.rows.filter((r) => r.del && !r.parent).map((r) => ({ id: r.id, title: r.title, del: r.del!, cat: r.cat, due: r.due })),
    config: demo.config,
    note: demo.note,
    today
  };
}

export type Op =
  | { op: 'add'; t: NewTask; id: string; by: Who3 }
  | { op: 'edit'; id: string; patch: TaskPatch }
  | { op: 'tick'; id: string; done: boolean; by: Who3 }
  | { op: 'remove'; id: string; at: number }
  | { op: 'restore'; id: string }
  | { op: 'purge' }
  | { op: 'config'; k: ConfigKey; v: ConfigValue }
  | { op: 'note'; md: string; at: number };

/** One action on the demo (a new Demo; the old untouched). */
export function apply(demo: Demo, o: Op): Demo {
  const rows = demo.rows.map((r) => ({ ...r }));
  const at = (id: string) => rows.find((r) => r.id === id);
  switch (o.op) {
    case 'add':
      rows.push({ id: o.id, title: o.t.title, cat: o.t.cat, due: o.t.due, start: o.t.start, parent: o.t.parent, n: rows.length });
      break;
    case 'edit': {
      const r = at(o.id);
      if (r) Object.assign(r, o.patch);
      break;
    }
    case 'tick': {
      const r = at(o.id);
      if (r) Object.assign(r, { done: o.done, by: o.done ? o.by : undefined, imported: false });
      break;
    }
    case 'remove':
      for (const r of rows) if (r.id === o.id || r.parent === o.id) r.del = o.at;
      break;
    case 'restore':
      for (const r of rows) if (r.id === o.id || r.parent === o.id) delete r.del;
      break;
    case 'purge':
      return { ...demo, rows: rows.filter((r) => !r.del) };
    case 'config': {
      const c = { ...demo.config };
      if (o.k === 'names') Object.assign(c, o.v as { p1: string; p2: string });
      else if (o.k === 'cats') c.cats = o.v as string[];
      else c[o.k] = o.v as string;
      return { ...demo, rows, config: c };
    }
    case 'note':
      return { ...demo, rows, note: { md: o.md, at: o.at } };
  }
  return { ...demo, rows };
}
