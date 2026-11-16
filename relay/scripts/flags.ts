// English Study's flags, reviewed together (docs/english.md "Flags"): the open ones by clip, each with its question,
// what the learner saw, their note and a YouTube link at the moment they flagged, and whether the content has changed
// since (its `v` against app/scripts/english-hashes.ts's); and the review's answer to one (`eflag_done`, written as
// member A: the learner's 報告した内容 shows it). Keys as record.ts (admin.ts: never printed).
//   npm run flags [-- --test]                                open flags by clip
//   npm run flags -- all [--test]                            every flag, reviewed ones too
//   npm run flags -- done <id> fixed|kept ["note"] [--test]  the review's answer to flag <id>
import { execFileSync } from 'node:child_process';
import { asMember } from './admin.ts';
import { eflagDoneOf, eflagOf, type Eflag, type EflagDone } from '../../app/src/lib/contract/eflag.ts';
import { cleanLine } from '../../app/src/lib/contract/text.ts';

type Row = [at: string, who: string, id: string, type: string, data: string];
type Content = Record<string, { video: string; title: string; v: string; q: string[]; seg: [number, number][]; stem: string[] }>;

const args = process.argv.slice(2).filter((a: string) => a !== '--test');
const KINDS: Record<string, string> = { answer: '答え', heard: '聞こえた言葉・字幕', question: '問題文', timing: '再生の位置', notes: '解説', other: 'その他' };

/** Every event row the record sends member A, a page at a time. */
async function events(): Promise<Row[]> {
  const out: Row[] = [];
  let after: unknown;
  for (let i = 0; i < 100; i++) {
    const r = (await asMember({ action: 'snapshot', page: 5000, ...(after ? { after } : {}) })) as { ok: boolean; error?: string; rows: { events: Row[] }; next?: string };
    if (!r.ok) throw new Error(`snapshot: ${r.error}`);
    out.push(...r.rows.events);
    if (!(after = r.next)) return out;
  }
  throw new Error('snapshot: too many pages');
}

/** The clips now (their versions), from the app's own files. */
const content = (): Content => JSON.parse(execFileSync('node', ['scripts/english-hashes.ts'], { cwd: `${import.meta.dirname}/../../app`, encoding: 'utf8' })) as Content;

const read = <T>(raw: string, of: (d: Record<string, unknown>) => T | null): T | null => {
  try {
    return of(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return null;
  }
};

async function list(all: boolean): Promise<void> {
  const rows = await events();
  const done = new Map<string, EflagDone & { at: string }>();
  for (const r of rows) {
    const d = r[3] === 'eflag_done' ? read(r[4], eflagDoneOf) : null;
    if (d) done.set(d.flag, { ...d, at: r[0] });
  }
  const flags = rows.flatMap((r) => {
    const f = r[3] === 'eflag' ? read(r[4], eflagOf) : null;
    return f && (all || !done.has(r[2])) ? [{ id: r[2], at: r[0], who: r[1], f }] : [];
  });
  if (!flags.length) return void console.log(all ? 'no flags yet' : 'no open flags');
  const now = content();
  const byClip = new Map<string, typeof flags>();
  for (const x of flags) byClip.set(x.f.item, [...(byClip.get(x.f.item) ?? []), x]);
  for (const [item, list] of byClip) {
    const c = now[item];
    console.log(`\n■ ${item}${c ? `  ${c.title}` : '  (no such clip now)'}`);
    for (const { id, at, who, f } of list) console.log(describe(id, at, who, f, c, done.get(id)));
  }
}

function describe(id: string, at: string, who: string, f: Eflag, c: Content[string] | undefined, d: (EflagDone & { at: string }) | undefined): string {
  const t = f.t ?? (f.q !== null ? c?.seg[f.q]?.[0] : undefined);
  const link = c ? `https://youtu.be/${c.video}${t !== undefined ? `?t=${Math.floor(t)}` : ''}` : '';
  const nowV = c ? (f.q === null ? c.v : c.q[f.q]) : undefined;
  const changed = nowV === undefined ? 'gone' : nowV === f.v ? 'unchanged' : 'changed since';
  const lines = [`  ⚑ ${id}  ${at.slice(0, 16).replace('T', ' ')}Z  ${who}  ${KINDS[f.kind]}  ${f.q === null ? 'the clip' : `Q${f.q + 1}`}  [${changed}]`];
  if (f.seen) lines.push(`    Q:      ${f.seen.stem}`, `    answer: ${f.seen.answer}`, `    line:   ${f.seen.line}`);
  if (f.note) lines.push(`    note:   「${f.note}」`);
  if (link) lines.push(`    at:     ${link}${f.t !== undefined ? `  (${f.t} s)` : ''}`);
  if (d) lines.push(`    ✓ ${d.outcome}${d.note ? `: ${d.note}` : ''}  (${d.at.slice(0, 10)})`);
  return lines.join('\n');
}

async function markDone(flag: string | undefined, outcome: string | undefined, note: string | undefined): Promise<void> {
  const clean = cleanLine(note, 200);
  const data = { flag, outcome, ...(clean ? { note: clean } : {}) };
  if (!eflagDoneOf(data)) throw new Error('usage: npm run flags -- done <id> fixed|kept ["note"] (a note ≤ 200 characters, one line)');
  const r = await asMember({ action: 'event', id: `review-${Date.now().toString(36)}`, type: 'eflag_done', data });
  if (r.ok !== true) throw new Error(`eflag_done: ${JSON.stringify(r)}`);
  console.log(`✓ ${flag}: ${outcome}`);
}

const [cmd, ...rest] = args;
if (cmd === 'done') await markDone(rest[0], rest[1], rest[2]);
else await list(cmd === 'all');
