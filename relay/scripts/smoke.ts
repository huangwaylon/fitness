// Smoke test of a deployed relay from this machine: two test clients (the test copy's KEY_A / KEY_B from .smoke-keys
// or the environment), the origin and key checks, presence, a relayed intent, and round-trip times.
//   npm run smoke                       (the test copy)
//   RELAY_URL=wss://… npm run smoke     (another deployment with those keys)
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

const URL_ = process.env.RELAY_URL ?? 'wss://island-fund-relay-test.island-fund-relay.workers.dev/room';
// the app's page (Cloudflare Pages); the old one, GitHub Pages, is refused since 2026-11-05
const ORIGIN = 'https://island-fund.pages.dev';
const OLD_ORIGIN = 'https://huangwaylon.github.io';
const N = Number(process.env.N ?? 30);

/** The test copy's keys (KEY_C, the guest's, optional: its checks run when it's there). */
function keys(): { KEY_A: string; KEY_B: string; KEY_C?: string } {
  if (process.env.KEY_A && process.env.KEY_B) return { KEY_A: process.env.KEY_A, KEY_B: process.env.KEY_B, KEY_C: process.env.KEY_C };
  const kv = Object.fromEntries(readFileSync(`${import.meta.dirname}/../.smoke-keys`, 'utf8').trim().split('\n').map((l: string) => l.split('=')));
  return kv as { KEY_A: string; KEY_B: string; KEY_C?: string };
}

type Msg = Record<string, unknown> & { kind: string };

class Client {
  ws: WebSocket;
  inbox: Msg[] = [];
  waiters: { pred: (m: Msg) => boolean; res: (m: Msg) => void }[] = [];
  closed: Promise<number>;
  constructor(origin = ORIGIN) {
    // Node's WebSocket (undici) takes headers; a browser sends its page's Origin by itself.
    this.ws = new WebSocket(URL_, { headers: { Origin: origin } } as never);
    this.ws.addEventListener('message', (e) => {
      const msg = JSON.parse(String(e.data)) as Msg;
      // (a `replay`: the day's changes, each heard in its place)
      for (const m of msg.kind === 'replay' ? (msg.es as Msg[]) : [msg]) {
        const w = this.waiters.findIndex((x) => x.pred(m));
        if (w >= 0) this.waiters.splice(w, 1)[0].res(m);
        else this.inbox.push(m);
      }
    });
    this.closed = new Promise((r) => this.ws.addEventListener('close', (e) => r(e.code)));
  }
  open(): Promise<void> {
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res());
      this.ws.addEventListener('error', () => rej(new Error('connect failed')));
    });
  }
  /** The protocol version this client speaks (live-protocol.ts LIVE_VS). */
  v = 3;
  send(m: object) {
    this.ws.send(JSON.stringify({ v: this.v, ...m }));
  }
  next(pred: (m: Msg) => boolean, ms = 5000): Promise<Msg> {
    const i = this.inbox.findIndex(pred);
    if (i >= 0) return Promise.resolve(this.inbox.splice(i, 1)[0]);
    return new Promise((res, rej) => {
      const w = { pred, res: (m: Msg) => (clearTimeout(t), res(m)) };
      const t = setTimeout(() => {
        this.waiters.splice(this.waiters.indexOf(w), 1);
        rej(new Error('timed out waiting'));
      }, ms);
      this.waiters.push(w);
    });
  }
}

const stats = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return `min ${s[0].toFixed(0)} · median ${q(0.5).toFixed(0)} · p90 ${q(0.9).toFixed(0)} · max ${s.at(-1)!.toFixed(0)} ms (n=${s.length})`;
};

function check(ok: boolean, what: string) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) process.exitCode = 1;
}

const { KEY_A, KEY_B, KEY_C } = keys();
const http = URL_.replace(/^ws/, 'http');

const health = await fetch(new URL('/health', http)).then((r) => r.json() as Promise<{ ok: boolean; t: number; versions?: number[] }>);
check(health.ok === true, `/health answers ok (versions ${health.versions?.join(', ') ?? '1'})`);

const bad = await fetch(http, { headers: { Origin: 'https://evil.test' } });
check(bad.status === 403, `a foreign origin is refused (${bad.status})`);
const evil = await new Client('https://evil.test').open().then(() => 'opened', () => 'refused');
check(evil === 'refused', `a foreign origin's socket is refused (${evil})`);
const gh = new Client(OLD_ORIGIN);
const oldOpen = await gh.open().then(() => 'opened', () => 'refused');
gh.ws.close();
check(oldOpen === 'refused', `the old page's origin (GitHub Pages) is refused (${oldOpen})`);

const stranger = new Client();
await stranger.open();
stranger.send({ kind: 'hello', key: 'c3'.repeat(32) });
check((await stranger.closed) === 4001, 'an unknown key is closed with 4001');

const t0 = performance.now();
const a = new Client();
await a.open();
const tOpen = performance.now() - t0;
a.send({ kind: 'hello', key: KEY_A });
const wa = await a.next((m) => m.kind === 'welcome');
check(wa.me === 'A', `A welcomed (connect ${tOpen.toFixed(0)} ms, hello → welcome ${(performance.now() - t0 - tOpen).toFixed(0)} ms)`);
{
  // the heartbeat: the runtime's fixed answer (the room left asleep), and the welcome says the room has it
  const hb: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    a.ws.send('{"v":3,"kind":"hb"}');
    const r = await a.next((m) => m.kind === 'hb');
    hb.push(performance.now() - t);
    if (i === 0) check(wa.hb === true && r.t === 0, 'the heartbeat is answered with its fixed reply, and the welcome says so');
  }
  console.log(`     heartbeat RTT: ${stats(hb)}`);
}

const b = new Client();
await b.open();
b.send({ kind: 'hello', key: KEY_B });
const wb = await b.next((m) => m.kind === 'welcome');
check(wb.me === 'B' && wb.peer === true, 'B welcomed, sees A present');
check((await a.next((m) => m.kind === 'presence')).on === true, 'A hears B arrive');

// clock offset and RTT from pings
// paced under the relay's 20 msg/s per connection (a faster loop is rate-limited: messages dropped)
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rtts: number[] = [];
let best = { rtt: Infinity, off: 0 };
for (let i = 0; i < N; i++) {
  const c = Date.now();
  const p0 = performance.now();
  a.send({ kind: 'ping', c });
  const pong = await a.next((m) => m.kind === 'pong' && m.c === c);
  const rtt = performance.now() - p0;
  rtts.push(rtt);
  await pause(80);
  if (rtt < best.rtt) best = { rtt, off: (pong.t as number) - (c + rtt / 2) };
}
console.log(`     ping RTT: ${stats(rtts)}; clock offset ${best.off.toFixed(0)} ms (± ${(best.rtt / 2).toFixed(0)})`);

// A → relay → B → relay → A: twice what a partner's tap takes to show up
b.ws.addEventListener('message', (e) => {
  const m = JSON.parse(String(e.data)) as Msg;
  if (m.kind === 'act' && m.who === 'A') b.send({ kind: 'act', act: 'tap', id: m.id as string });
});
await pause(1000);
const loops: number[] = [];
for (let i = 0; i < N; i++) {
  const id = `s${i}`;
  const p0 = performance.now();
  a.send({ kind: 'act', act: 'tap', id });
  await a.next((m) => m.kind === 'act' && m.who === 'B' && m.id === id);
  loops.push(performance.now() - p0);
  await pause(80);
}
console.log(`     A→B→A relay loop: ${stats(loops)}`);
check(true, `one-way to the partner ≈ ${(stats(loops.map((x) => x / 2)))}`);

a.send({ kind: 'world', op: 'watered', id: 'smoke' });
const w = await b.next((m) => m.kind === 'world');
check(w.who === 'A' && w.id === 'smoke', 'a world op reaches B stamped from A');
const since = (w.t as number) - 1;

b.ws.close(1000);
check((await a.next((m) => m.kind === 'presence')).on === false, 'A hears B leave');

const b2 = new Client();
await b2.open();
b2.send({ kind: 'hello', key: KEY_B, since });
await b2.next((m) => m.kind === 'welcome');
const missed = await b2.next((m) => m.kind === 'world');
check(missed.id === 'smoke', 'a reconnecting B gets the world op it missed');

const a2 = new Client();
await a2.open();
a2.send({ kind: 'hello', key: KEY_A });
await a2.next((m) => m.kind === 'welcome');
check((await a.closed) === 4002, 'a second A replaces the first (4002)');

// The push (docs/backend.md#push): a signed /notify reaches both phones as `changed` (the record's own goes by RPC).
const notifyUrl = new URL('/notify', http);
const unsigned = await fetch(notifyUrl, { method: 'POST', body: '{}' });
check(unsigned.status === 401, `an unsigned notify is refused (${unsigned.status})`);
check((await fetch(notifyUrl)).status === 405, 'a GET /notify is refused');
const secret = createHmac('sha256', `${KEY_A}:${KEY_B}`).update('island-relay-notify/1').digest('hex');
const pushes: number[] = [];
for (let i = 0; i < Math.min(N, 10); i++) {
  const at = new Date().toISOString();
  const body = JSON.stringify({ what: 'ingest', who: 'A', at, rev: 'smoke1' });
  const t = String(Date.now());
  const p0 = performance.now();
  const r = await fetch(notifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Island-Time': t, 'X-Island-Sig': createHmac('sha256', secret).update(`${t}.${body}`).digest('hex') },
    body
  });
  if (i === 0) check(r.status === 204 && r.headers.get('X-Island-Heard') === '2', `a signed notify is accepted (${r.status}, heard by ${r.headers.get('X-Island-Heard')})`);
  await Promise.all([a2, b2].map((c) => c.next((m) => m.kind === 'changed' && m.at === at)));
  pushes.push(performance.now() - p0);
  await pause(200);
}
console.log(`     notify POST → changed on both phones: ${stats(pushes)}`);
const replay = JSON.stringify({ what: 'ingest', who: 'A', at: new Date().toISOString(), rev: 'smoke1' });
const old = String(Date.now() - 6 * 60_000);
const stale = await fetch(notifyUrl, { method: 'POST', headers: { 'X-Island-Time': old, 'X-Island-Sig': createHmac('sha256', secret).update(`${old}.${replay}`).digest('hex') }, body: replay });
check(stale.status === 401, `a notify signed 6 min ago is refused (${stale.status})`);

// The nudge after an acked write: B says `saved`, A hears it.
const nudges: number[] = [];
for (let i = 0; i < Math.min(N, 10); i++) {
  const p0 = performance.now();
  b2.send({ kind: 'saved' });
  await a2.next((m) => m.kind === 'saved' && m.who === 'B');
  nudges.push(performance.now() - p0);
  await pause(80);
}
console.log(`     saved nudge B → A: ${stats(nudges)}`);

a2.ws.close(1000);
b2.ws.close(1000);

// Protocol versions (docs/backend.md#live-relay): v3 only (v1 and v2 went on 2026-11-05); another is closed 4004.
for (const v of [1, 2, 4]) {
  const old = new Client();
  await old.open();
  old.v = v;
  old.send({ kind: 'hello', key: KEY_A });
  check((await old.closed) === 4004, `a v${v} hello is closed with 4004`);
}

// The shared world (docs/backend.md#shared-world): a claim's first comes through, a second of the same id goes nowhere;
// the day's world reaches a phone that opens later; one nest per tree per hour. Ids unique per run (the test room keeps
// its day).
const run = Date.now().toString(36);
const sa = new Client();
await sa.open();
sa.send({ kind: 'hello', key: KEY_A });
await sa.next((m) => m.kind === 'welcome');
const sb = new Client();
await sb.open();
sb.send({ kind: 'hello', key: KEY_B });
await sb.next((m) => m.kind === 'welcome');
await pause(300); // B's last socket may still be closing: no presence to wait for
const claims: number[] = [];
for (let i = 0; i < Math.min(N, 10); i++) {
  const id = `smk${run}${i}`;
  const p0 = performance.now();
  sa.send({ kind: 'catch', what: 'sea-bass', id, at: [120, -40], how: 'rod' });
  const got = await sb.next((m) => m.kind === 'catch' && m.id === id);
  claims.push(performance.now() - p0);
  // B taps the same fish a moment later: the relay already gave it to A
  sb.send({ kind: 'catch', what: 'sea-bass', id, at: [120, -40], how: 'rod' });
  if (i === 0) check(got.who === 'A' && got.how === 'rod', 'a catch reaches the partner with where and how');
  await pause(120);
}
console.log(`     catch A → B: ${stats(claims)}`);
check(!sa.inbox.some((m) => m.kind === 'catch'), "B's claims of what A caught first never reach A (first wins)");
const tree = `smk-${run}`;
sa.send({ kind: 'shake', tree, drop: 'nest' });
await sb.next((m) => m.kind === 'shake' && m.tree === tree);
sb.send({ kind: 'shake', tree, drop: 'nest' });
sb.send({ kind: 'shake', tree, drop: 'branch' });
const sh = await sa.next((m) => m.kind === 'shake' && m.tree === tree);
check(sh.drop === 'branch', 'a second nest from the same tree within the hour is refused, a branch comes through');
sa.send({ kind: 'pick', id: `p${run}`, what: 'shell:conch', at: [150, 40] });
sa.send({ kind: 'walk', to: [195, 900] });
await sb.next((m) => m.kind === 'walk' && m.who === 'A');
const sinceDay = Date.now() - 60_000;
sb.ws.close(1000);
await sa.next((m) => m.kind === 'presence' && m.on === false);
const sb2 = new Client();
await sb2.open();
const tl = performance.now();
sb2.send({ kind: 'hello', key: KEY_B, since: sinceDay });
await sb2.next((m) => m.kind === 'welcome');
const late = await sb2.next((m) => m.kind === 'pick' && m.id === `p${run}`);
const lastWalk = await sb2.next((m) => m.kind === 'walk' && m.who === 'A');
check(late.who === 'A' && (lastWalk.to as number[])[1] === 900, `a phone opening later hears the day's world (${(performance.now() - tl).toFixed(0)} ms)`);
sa.ws.close(1000);
sb2.ws.close(1000);

// The guest (docs/backend.md#the-guest), when the test copy has a KEY_C: both members hear it come, its walk reaches
// them, what it may not send goes nowhere, and the record leaves the からだ out.
if (KEY_C) {
  const ga = new Client(), gb = new Client(), g = new Client();
  await Promise.all([ga.open(), gb.open(), g.open()]);
  ga.send({ kind: 'hello', key: KEY_A });
  await ga.next((m) => m.kind === 'welcome');
  gb.send({ kind: 'hello', key: KEY_B });
  await gb.next((m) => m.kind === 'welcome');
  g.send({ kind: 'hello', key: KEY_C });
  const wg = await g.next((m) => m.kind === 'welcome');
  check(wg.me === 'G' && wg.peer === true && JSON.stringify(wg.here) === '["A","B"]', 'the guest is welcomed as G with A and B here');
  check((await ga.next((m) => m.kind === 'presence' && m.who === 'G')).on === true, 'a member hears the guest arrive');
  g.send({ kind: 'walk', to: [100, 900] });
  check((await ga.next((m) => m.kind === 'walk' && m.who === 'G')).who === 'G' && (await gb.next((m) => m.kind === 'walk' && m.who === 'G')).who === 'G', "the guest's walk reaches both members");
  g.send({ kind: 'world', op: 'watered', id: 'fl:1:2', c: Date.now() });
  check((await g.next((m) => m.kind === 'ack')).ok === false, "a world op from the guest is refused");
  const api = (key: string, action: string, extra: object = {}) =>
    fetch(new URL('/api', http), { method: 'POST', headers: { Origin: ORIGIN }, body: JSON.stringify({ key, action, ...extra }) }).then((r) => r.json() as Promise<Record<string, unknown>>);
  const snap = await api(KEY_C, 'snapshot');
  const text = JSON.stringify(snap);
  check(snap.ok === true && snap.me === 'G' && !/"(weight|body_fat_pct|bmi|lean_kg)"|goalWeight|goalBodyFat/.test(text), "the guest's snapshot has no からだ row and no からだ goal");
  check((await api(KEY_C, 'ingest', { dates: 'Nov 1, 2026', steps: '1' })).error === 'forbidden', "the guest's ingest is forbidden");
  for (const c of [ga, gb, g]) c.ws.close(1000);
}

// The record's paged snapshot and its compaction (docs/backend.md "Snapshot size"): the pages together are the whole
// snapshot; a compaction run answers (the cron runs it daily).
{
  const api = (key: string, action: string, extra: object = {}) =>
    fetch(new URL('/api', http), { method: 'POST', headers: { Origin: ORIGIN }, body: JSON.stringify({ key, action, ...extra }) }).then((r) => r.json() as Promise<Record<string, any>>);
  const whole = await api(KEY_A, 'snapshot');
  const n = whole.rows.metrics.length + whole.rows.events.length;
  const page = Math.max(1, Math.ceil(n / 3));
  let after: string | undefined, rows = 0, pages = 0;
  do {
    const r = await api(KEY_A, 'snapshot', { page, ...(after ? { after } : {}) });
    rows += r.rows.metrics.length + r.rows.events.length;
    after = r.next;
    pages++;
  } while (after && pages < 10);
  check(rows === n && pages <= 4, `a paged snapshot is the whole one (${n} rows in ${pages} pages)`);
  const text = JSON.stringify({ op: 'compact' }), t = String(Date.now());
  const c = await fetch(new URL('/admin', http), { method: 'POST', headers: { 'X-Island-Time': t, 'X-Island-Sig': createHmac('sha256', secret).update(`${t}.${text}`).digest('hex') }, body: text }).then((r) => r.json() as Promise<Record<string, unknown>>);
  // (it deletes Health history rows: refused without its confirm, which the smoke never sends)
  check(c.ok === false && typeof c.detail === 'string' && c.detail.includes('delete-health-history'), `the record's compaction is refused without its confirm (${JSON.stringify(c).slice(0, 80)})`);
}

// The real weather (docs/backend.md "The real weather"): a fixture timeline put in by a signed /admin reaches a phone
// after its welcome and when it changes, a fetch now from Open-Meteo (JMA's models) gives 30+
// hours, and /health says how old it is.
{
  const admin = async (body: object): Promise<Record<string, unknown>> => {
    const text = JSON.stringify(body), t = String(Date.now());
    const r = await fetch(new URL('/admin', http), { method: 'POST', headers: { 'X-Island-Time': t, 'X-Island-Sig': createHmac('sha256', secret).update(`${t}.${text}`).digest('hex') }, body: text });
    return r.json() as Promise<Record<string, unknown>>;
  };
  const put = await admin({ op: 'wx', s: 'rrohsc', fx: [2] });
  check(put.ok === true && (put.wx as { src?: string })?.src === 'fx', 'an /admin wx fixture is put in');
  const w3 = new Client();
  await w3.open();
  w3.send({ kind: 'hello', key: KEY_A });
  await w3.next((m) => m.kind === 'welcome');
  const first = await w3.next((m) => m.kind === 'wx');
  check(first.s === 'rrohsc' && JSON.stringify(first.fx) === '[2]' && first.src === 'fx', 'a phone gets the fixture sky after its welcome');
  const t0 = performance.now();
  const live = (await admin({ op: 'wx', refresh: true })) as { ok?: boolean; fail?: string; health?: { src: string; hours: number; age: number } };
  check(live.ok === true && live.health?.src === 'om' && live.health.hours >= 30, `a fetch from Open-Meteo now: ${live.health?.hours ?? 0} hours (${(performance.now() - t0).toFixed(0)} ms${live.fail ? `, ${live.fail}` : ''})`);
  const real = await w3.next((m) => m.kind === 'wx' && m.src === 'om');
  check(/^[corhs]{30,48}$/.test(String(real.s)), `the phone hears the real sky when it changes (${String(real.s).slice(0, 12)}…)`);
  const h = await fetch(new URL('/health', http)).then((r) => r.json() as Promise<{ wx?: { src: string; age: number } }>);
  check(h.wx?.src === 'om' && h.wx.age <= 1, `/health has the weather's age (${h.wx?.age} min)`);
  w3.ws.close(1000);
}

// The log (docs/ops/observability.md): a phone's batch with a forced error, and an /api request with its request id,
// both read back through the signed admin op as `npm run logs` reads them; a stranger's batch is refused by the Worker.
{
  const admin = async (body: object): Promise<Record<string, unknown>> => {
    const text = JSON.stringify(body), t = String(Date.now());
    const r = await fetch(new URL('/admin', http), { method: 'POST', headers: { 'X-Island-Time': t, 'X-Island-Sig': createHmac('sha256', secret).update(`${t}.${text}`).digest('hex') }, body: text });
    return r.json() as Promise<Record<string, unknown>>;
  };
  const id = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0');
  const sid = id(), rid = id(), since = Date.now() - 60_000;
  const logUrl = new URL('/log', http);
  const post = (o: object) => fetch(logUrl, { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(o) }).then((r) => r.json() as Promise<Record<string, unknown>>);
  const batch = { v: 1, key: KEY_A, b: id(), s: sid, build: 'smoke', os: 'node', es: [{ t: Date.now(), l: 3, e: 'js.error', q: 1, d: { kind: 'error', msg: `smoke: forced error 68.4 ${KEY_A}`, stack: 'smoke@https://x/smoke.js:1:2' } }] };
  const sent = await post(batch);
  check(sent.ok === true && sent.kept === 1, `/log takes a phone's batch (${JSON.stringify(sent)})`);
  check((await post(batch)).dup === true, '/log takes a batch id once');
  check((await post({ ...batch, key: 'c3'.repeat(32), b: id() })).error === 'unauthorized', '/log refuses a stranger');
  await fetch(new URL('/api', http), { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'text/plain' }, body: JSON.stringify({ key: KEY_A, action: 'whoami', rid, sid }) });
  await pause(1500); // (the relay's req event goes in the background)
  const got = (await admin({ op: 'logs', since, sid })) as { ok?: boolean; rows?: { ev: string; role: string; rid: string | null; d: Record<string, unknown> }[] };
  const err = got.rows?.find((r) => r.ev === 'js.error'), req = got.rows?.find((r) => r.ev === 'req' && r.rid === rid);
  check(err?.role === 'A' && err.d.msg === 'smoke: forced error # <id>' && err.d.stack === 'smoke@smoke.js:1:2', `the forced error is in the log, scrubbed (${JSON.stringify(err?.d)})`);
  check(req?.d.action === 'whoami' && req.d.st === 'ok' && typeof req.d.ms === 'number', `the /api request is in the log by its id (${req?.d.ms} ms)`);
  const stats = await admin({ op: 'logstats' });
  check(stats.ok === true && typeof stats.e1h === 'number', `the log's stats (${stats.e1h} errors this hour, ${stats.budgetPct} % of the day's cap)`);
}
