// The log's reader (docs/ops/observability.md "Reading"): the phones' and the relay's events through the signed
// `/admin` op `logs` (admin.ts: the keys never leave this machine), filtered, printed or summed up.
//   npm run logs -- [--since 2h] [--until …] [--level warn] [--person A] [--event js.error | api.] [--sid …] [--rid …]
//                   [--src phone|relay] [--build …] [--os ios] [--limit 200] [--json] [--test]
//   npm run logs -- report [--since 1d] [--person …] [--os ios] [--test]
//                                 errors and warnings, latencies, failures, performance (phones only: no macos), builds, usage
//   npm run logs -- stats [--test]                                the log's health (the alert's numbers)
//   npm run logs -- purge --before <time> [--person A] [--test]   delete events (a person's, or all) before a time
//   npm run logs -- --help                                        this
// Times: `90m`, `2h`, `7d`, an ISO date or time (UTC unless it says), or ms. `--os`: a prefix of the phone's word (the
// user agent's: `ios18.7` on iOS 26 and 27 alike, `macos`); the relay's own rows pass it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { signed, TEST } from './admin.ts';

type Row = { id: number; ts: number; ct: number | null; lvl: number; ev: string; src: 'c' | 'r'; role: string | null; sid: string | null; rid: string | null; q: number | null; build: string | null; os: string | null; d: Record<string, number | boolean | string> };

const argv = process.argv.slice(2).filter((a: string) => a !== '--test');
const cmd = argv[0] && !argv[0].startsWith('--') ? argv.shift()! : 'list';
const opt = (k: string): string | undefined => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const flag = (k: string) => argv.includes(`--${k}`);
/** `--os`: kept on this machine (the op has no such filter): a phone row's os starts with it; the relay's rows pass. */
const osOk = (r: Row) => !opt('os') || r.src === 'r' || (r.os ?? '').startsWith(opt('os')!);

/** `2h` → ms ago; an ISO date or ms → that time. */
function timeOf(s: string | undefined, dflt: number): number {
  if (!s) return dflt;
  const m = /^(\d+(?:\.\d+)?)(s|m|h|d)$/.exec(s);
  if (m) return Date.now() - Number(m[1]) * { s: 1e3, m: 6e4, h: 3.6e6, d: 8.64e7 }[m[2] as 's']!;
  if (/^\d{12,}$/.test(s)) return Number(s);
  const t = Date.parse(s);
  if (Number.isNaN(t)) throw new Error(`not a time: ${s}`);
  return t;
}
const LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const LV = ['dbg', 'inf', 'WRN', 'ERR'];

function query(): Record<string, unknown> {
  const lvl = opt('level');
  if (lvl && !(lvl in LEVELS)) throw new Error(`--level: one of ${Object.keys(LEVELS).join(', ')}`);
  const src = opt('src');
  return {
    since: timeOf(opt('since'), Date.now() - 86_400_000), until: timeOf(opt('until'), Date.now() + 86_400_000),
    ...(lvl ? { lvl: LEVELS[lvl] } : {}), ...(opt('event') ? { ev: opt('event') } : {}), ...(opt('person') ? { role: opt('person')!.toUpperCase() } : {}),
    ...(opt('sid') ? { sid: opt('sid') } : {}), ...(opt('rid') ? { rid: opt('rid') } : {}), ...(opt('build') ? { build: opt('build') } : {}),
    ...(src ? { src: src.startsWith('r') ? 'r' : 'c' } : {})
  };
}

/** Every row of the query, oldest first, a page at a time (at most `max`). */
async function all(q: Record<string, unknown>, max = 50_000): Promise<Row[]> {
  const out: Row[] = [];
  let after: number | undefined;
  for (;;) {
    const r = (await signed({ op: 'logs', ...q, limit: 1000, ...(after ? { after } : {}) })) as { ok: boolean; rows?: Row[]; next?: number | null; error?: string };
    if (!r.ok) throw new Error(`logs: ${JSON.stringify(r)}`);
    out.push(...(r.rows ?? []));
    if (!r.next || out.length >= max) return out;
    after = r.next;
  }
}

const tokyo = (ms: number) => new Date(ms + 9 * 3.6e6).toISOString().slice(5, 19).replace('T', ' ');
const fmtD = (d: Row['d']) => Object.entries(d).map(([k, v]) => (k === 'msg' || k === 'stack' ? `${k}=${JSON.stringify(v)}` : `${k}=${v}`)).join(' ');

function line(r: Row): string {
  const who = `${r.src === 'r' ? 'relay' : 'phone'}${r.role ? `:${r.role}` : '  '}`;
  const ids = [r.sid ? `s=${r.sid}` : '', r.rid ? `r=${r.rid}` : ''].filter(Boolean).join(' ');
  const { stack, ...d } = r.d;
  return `${tokyo(r.ts)}  ${LV[r.lvl]}  ${who.padEnd(8)} ${r.ev.padEnd(12)} ${fmtD(d)}${ids ? `  ${ids}` : ''}${stack ? `\n${String(stack).split('\n').map((f) => `      at ${f}`).join('\n')}` : ''}`;
}

const pct = (xs: number[], p: number) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const ms = (x: number) => (Number.isNaN(x) ? '-' : `${Math.round(x)}`);
function table(title: string, head: string[], rows: (string | number)[][]): void {
  if (!rows.length) return;
  console.log(`\n${title}`);
  const w = head.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  console.log(`  ${head.map((h, i) => h.padEnd(w[i])).join('  ')}`);
  for (const r of rows) console.log(`  ${r.map((c, i) => String(c).padEnd(w[i])).join('  ')}`);
}
const countBy = <T>(xs: T[], key: (x: T) => string) => {
  const m = new Map<string, T[]>();
  for (const x of xs) m.set(key(x), [...(m.get(key(x)) ?? []), x]);
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
};

function report(rows: Row[], since: number): void {
  const sessions = new Set(rows.filter((r) => r.sid).map((r) => r.sid));
  console.log(`${rows.length} events since ${tokyo(since)} (Tokyo), ${sessions.size} sessions; ` +
    LV.map((l, i) => `${l} ${rows.filter((r) => r.lvl === i).length}`).join(', '));
  const errs = rows.filter((r) => r.lvl === 3);
  const warns = rows.filter((r) => r.lvl === 2);
  table('Errors by fingerprint', ['n', 'event', 'who', 'builds', 'last (Tokyo)', 'fingerprint'], countBy(errs, (r) => `${r.ev}|${r.d.msg ?? r.d.st ?? r.d.fail ?? ''}|${String(r.d.stack ?? '').split('\n')[0]}`).slice(0, 15).map(([k, xs]) => {
    const [ev, msg, top] = k.split('|');
    return [xs.reduce((n, x) => n + (Number(x.d.n) || 1), 0), ev, [...new Set(xs.map((x) => x.role ?? '-'))].join(''), [...new Set(xs.map((x) => x.build ?? '-'))].length, tokyo(Math.max(...xs.map((x) => x.ts))), `${msg}${top ? ` @ ${top}` : ''}`.slice(0, 90)];
  }));
  // the warnings by event and their commonest detail (chunk.fail's file, gl.lost's where, js.error while leaving…)
  const detail = (r: Row) => Object.entries(r.d).filter(([k]) => k !== 'stack' && k !== 'msg' && k !== 'n' && k !== 'ms').slice(0, 3).map(([k, v]) => `${k}=${v}`).join(' ');
  table('Warnings by event', ['n', 'event', 'who', 'last (Tokyo)', 'top detail'], countBy(warns, (r) => r.ev).slice(0, 15).map(([ev, xs]) => {
    const [top, ys] = countBy(xs, detail)[0];
    return [xs.reduce((n, x) => n + (Number(x.d.n) || 1), 0), ev, [...new Set(xs.map((x) => x.role ?? '-'))].join(''), tokyo(Math.max(...xs.map((x) => x.ts))), `${top || '-'}${ys.length < xs.length ? ` (${ys.length})` : ''}`.slice(0, 80)];
  }));
  const req = rows.filter((r) => r.ev === 'req');
  table('Relay /api requests (wall ms)', ['action', 'n', 'p50', 'p95', 'max', 'not ok', 'refused', 'by status'], countBy(req, (r) => String(r.d.action)).map(([a, xs]) => {
    const t = xs.map((x) => Number(x.d.ms)).filter(Number.isFinite);
    const bad = xs.filter((x) => x.d.st !== 'ok');
    return [a, xs.length, ms(pct(t, 0.5)), ms(pct(t, 0.95)), ms(Math.max(...t)), bad.length, xs.reduce((n, x) => n + (Number(x.d.rej) || 0), 0), countBy(bad, (x) => String(x.d.st)).map(([s, ys]) => `${s} ${ys.length}`).join(', ')];
  }));
  // the Free plan's rows written (100k a day, the account's): the record's per request, the room's as it says them
  // (room.close); the log's own only in `stats` (rowsLog)
  const sum = (xs: Row[]) => xs.reduce((n, x) => n + (Number(x.d.rw) || 0), 0);
  const days = Math.max(1, (Date.now() - since) / 86_400_000);
  const rwStore = sum(req), rwRoom = sum(rows.filter((r) => r.ev === 'room.close' || r.ev === 'ws.hello'));
  console.log(`\nRows written in the window: the record ${rwStore} (${countBy(req.filter((r) => r.d.rw), (r) => String(r.d.action)).map(([a, xs]) => `${a} ${sum(xs)}`).join(', ')}), the room ${rwRoom}; ` +
    `${Math.round((rwStore + rwRoom) / days)} a day of the plan's 100,000, the log's own left out (today's: stats rowsLog)`);
  table('Refusals by rule', ['n', 'rule'], countBy(req.filter((r) => r.d.why), (r) => String(r.d.why)).slice(0, 10).map(([w, xs]) => [xs.length, w]));
  const api = rows.filter((r) => r.ev === 'api.ok' || r.ev === 'api.fail');
  table('Phones: /api as they saw it (ok 10 % sampled; ms)', ['action', 'ok', 'p50', 'p95', 'fail', 'by error'], countBy(api, (r) => String(r.d.action ?? '?')).map(([a, xs]) => {
    const ok = xs.filter((x) => x.ev === 'api.ok'), fail = xs.filter((x) => x.ev === 'api.fail');
    const t = ok.map((x) => Number(x.d.ms)).filter(Number.isFinite);
    return [a, ok.length, ms(pct(t, 0.5)), ms(pct(t, 0.95)), fail.length, countBy(fail, (x) => String(x.d.err)).map(([e, ys]) => `${e} ${ys.length}`).join(', ')];
  }));
  const q = rows.filter((r) => r.ev.startsWith('queue.') || r.ev === 'sync.fail' || r.ev === 'auth.lost');
  table('Sync: the queue, refreshes, the key', ['n', 'event', 'detail'], countBy(q, (r) => `${r.ev} ${r.d.type ?? ''} ${r.d.err ?? r.d.from ?? ''}`).slice(0, 10).map(([k, xs]) => [xs.length, k.split(' ')[0], k.split(' ').slice(1).join(' ')]));
  const ws = rows.filter((r) => r.ev === 'ws.close' || r.ev === 'room.close');
  table('Live socket closes by code', ['code', 'phones', 'relay', 'median secs'], countBy(ws, (r) => String(r.d.code)).map(([c, xs]) => [c, xs.filter((x) => x.src === 'c').length, xs.filter((x) => x.src === 'r').length, ms(pct(xs.map((x) => Number(x.d.secs)).filter((x) => x >= 0), 0.5))]));
  // (the phones only: A's Mac sessions would mix into the p50/p95)
  const phone = (ev: string) => rows.filter((r) => r.ev === ev && !(r.os ?? '').startsWith('macos'));
  const ready = phone('app.ready').map((r) => Number(r.d.ms));
  const frames = phone('perf.frames');
  // the island's launches (perf.boot: app/src/lib/components/world3d/boot.ts), warm (every model from a cache) and cold
  const boots = phone('perf.boot');
  const bootRows = ([true, false] as const).flatMap((w) => {
    const bs = boots.filter((r) => (r.d.warm === true) === w), k = w ? 'warm' : 'cold';
    const p = (f: string): [number, string, string] => {
      const v = bs.map((r) => Number(r.d[f])).filter(Number.isFinite);
      return [v.length, ms(pct(v, 0.5)), ms(pct(v, 0.95))];
    };
    return [[`${k} launch: first frame (ms)`, ...p('first')], [`${k} launch: island whole (ms)`, ...p('shown')], [`${k} launch: appearing frame (ms)`, ...p('appear')], [`${k} launch: longest frame (ms)`, ...p('long')]];
  });
  table('Performance (phones)', ['metric', 'n', 'p50', 'p95'], [
    ['cold load to the island (ms)', ready.length, ms(pct(ready, 0.5)), ms(pct(ready, 0.95))],
    ['frame p50 (ms)', frames.length, ms(pct(frames.map((r) => Number(r.d.p50)), 0.5)), ms(pct(frames.map((r) => Number(r.d.p50)), 0.95))],
    ['frame p95 (ms)', frames.length, ms(pct(frames.map((r) => Number(r.d.p95)), 0.5)), ms(pct(frames.map((r) => Number(r.d.p95)), 0.95))],
    ['fps', frames.length, ms(pct(frames.map((r) => Number(r.d.fps)), 0.5)), ms(pct(frames.map((r) => Number(r.d.fps)), 0.05))],
    ['long frames in 5 s', frames.length, ms(pct(frames.map((r) => Number(r.d.long)), 0.5)), ms(pct(frames.map((r) => Number(r.d.long)), 0.95))],
    ...bootRows
  ].filter((r) => Number(r[1]) > 0));
  // the newest 10 builds (by their last event), the rest summed
  const builds = countBy(rows.filter((r) => r.src === 'c'), (r) => r.build ?? '-').map(([b, xs]) => ({ b, xs, last: Math.max(...xs.map((x) => x.ts)) })).sort((a, b) => b.last - a.last);
  table(`Builds (the newest 10 of ${builds.length})`, ['build', 'sessions', 'events', 'errors', 'os', 'last (Tokyo)'], builds.slice(0, 10).map(({ b, xs, last }) => [b, new Set(xs.map((x) => x.sid)).size, xs.length, xs.filter((x) => x.lvl === 3).length, [...new Set(xs.map((x) => x.os ?? '-'))].join(' '), tokyo(last)]));
  if (builds.length > 10) console.log(`  … ${builds.length - 10} older: ${builds.slice(10).reduce((n, x) => n + x.xs.length, 0)} events`);
  // each person's newest live socket: the protocol version and build their phone speaks (docs/backend.md: before
  // dropping an old version): the phone's ws.close `v` (the relay's ws.hello before 2026-11-13: drop after 12-13,
  // when the last ages out)
  const hellos = new Map<string, Row>();
  for (const r of rows) if (((r.ev === 'ws.close' && r.d.v !== undefined) || r.ev === 'ws.hello') && r.role && (!hellos.has(r.role) || hellos.get(r.role)!.id < r.id)) hellos.set(r.role, r);
  table('Live protocol (each person\'s newest socket)', ['who', 'v', 'build', 'when (Tokyo)'], [...hellos].sort().map(([w, r]) => [w, String(r.d.v), String(r.d.build ?? r.build ?? '-'), tokyo(r.ts)]));
  const use = new Map<string, number>();
  for (const r of rows) if (r.ev === 'use') for (const [k, v] of Object.entries(r.d)) use.set(k, (use.get(k) ?? 0) + Number(v));
  table('Usage (counters)', ['n', 'what'], [...use.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, n]) => [n, k]));
  // (the failed fetches, and the daily health since 2026-11-13: every ok fetch before)
  const cron = rows.filter((r) => r.ev === 'cron.wx'), failed = cron.filter((r) => r.d.ok !== true);
  if (cron.length) console.log(`\nWeather: ${failed.length} failed${failed.length ? ` (${[...new Set(failed.map((r) => r.d.fail).filter(Boolean))].join(', ')})` : ''}; ${cron.length - failed.length} ok rows`);
  // the log's own caps and the phones' drops, one line each per kind (a phone may say ~90 drops a week)
  const caps = rows.filter((r) => r.ev === 'log.cap' || r.ev === 'log.drop');
  if (caps.length) console.log(`\nThe log itself: ${countBy(caps, (r) => `${r.ev} ${fmtD({ why: r.d.why, bucket: r.d.bucket })} ${r.role ?? ''}`).map(([k, xs]) => {
    const n = xs.reduce((s, x) => s + (Number(x.d.n) || 0), 0), ts = xs.map((x) => x.ts);
    return `${k.replace(/ (why|bucket)=undefined/g, '').trim()} ×${xs.length}${n && n !== xs.length ? ` (${n} events)` : ''} ${tokyo(Math.min(...ts))} – ${tokyo(Math.max(...ts))}`;
  }).join('; ')}`);
}

try {
  if (flag('help') || cmd === 'help') {
    // the header comment
    const head = String(readFileSync(fileURLToPath(import.meta.url), 'utf8')).split('\n');
    console.log(head.slice(0, head.findIndex((l: string) => !l.startsWith('//'))).map((l: string) => l.slice(3)).join('\n'));
    process.exit(0);
  }
  if (TEST) console.error('(the test relay)');
  switch (cmd) {
    case 'list': {
      const limit = Math.min(1000, Number(opt('limit') ?? 200));
      const r = (await signed({ op: 'logs', ...query(), desc: true, limit })) as { ok: boolean; rows?: Row[]; next?: number | null };
      if (!r.ok) throw new Error(JSON.stringify(r));
      const rows = (r.rows ?? []).reverse().filter(osOk);
      if (flag('json')) console.log(JSON.stringify(rows, null, 1));
      else for (const x of rows) console.log(line(x));
      if (r.next) console.error(`(the newest ${limit}${limit < 1000 ? ': --limit up to 1000, or' : ', the most a list shows:'} narrow --since/--until)`);
      break;
    }
    case 'report': {
      const q = { ...query(), since: timeOf(opt('since'), Date.now() - 86_400_000) };
      report((await all(q)).filter(osOk), q.since as number);
      break;
    }
    case 'stats':
      console.log(JSON.stringify(await signed({ op: 'logstats' })));
      break;
    case 'purge': {
      if (!opt('before')) throw new Error('purge needs --before <time>');
      console.log(JSON.stringify(await signed({ op: 'logpurge', before: timeOf(opt('before'), Date.now()), ...(opt('person') ? { role: opt('person')!.toUpperCase() } : {}) })));
      break;
    }
    default:
      console.error('commands: [list] | report | stats | purge  (see the top of scripts/logs.ts)');
      process.exit(1);
  }
} catch (e) {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
}
