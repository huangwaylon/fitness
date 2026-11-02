// Smoke test of a deployed relay from this machine: two test clients (the test copy's KEY_A / KEY_B from .smoke-keys
// or the environment), the origin and key checks, presence, a relayed intent, and round-trip times.
//   npm run smoke                       (the test copy)
//   RELAY_URL=wss://… npm run smoke     (another deployment with those keys)
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

const URL_ = process.env.RELAY_URL ?? 'wss://island-fund-relay-test.island-fund-relay.workers.dev/room';
const ORIGIN = 'https://huangwaylon.github.io';
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
      const m = JSON.parse(String(e.data)) as Msg;
      const w = this.waiters.findIndex((x) => x.pred(m));
      if (w >= 0) this.waiters.splice(w, 1)[0].res(m);
      else this.inbox.push(m);
    });
    this.closed = new Promise((r) => this.ws.addEventListener('close', (e) => r(e.code)));
  }
  open(): Promise<void> {
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res());
      this.ws.addEventListener('error', () => rej(new Error('connect failed')));
    });
  }
  /** The protocol version this client speaks (live-protocol.ts LIVE_VERSIONS). */
  v = 1;
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

a.send({ kind: 'world', op: 'weed-pulled', id: 'smoke' });
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

// The push (docs/backend.md#push): a signed /notify, as Apps Script sends it, reaches both phones as `changed`.
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

// Notifications are gone (2026-11-02): an old app's /push/* gets 410 Gone, readable by the page (CORS).
for (const p of ['/push/subscribe', '/push/unsubscribe', '/push/goal']) {
  const res = await fetch(new URL(p, http), { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ key: KEY_A }) });
  check(res.status === 410 && res.headers.get('Access-Control-Allow-Origin') === ORIGIN, `${p} is gone (410), with CORS for the page`);
}

a2.ws.close(1000);
b2.ws.close(1000);

// Protocol versions (docs/backend.md#live-relay, "Versions"): a v2 phone beside a v1 one hears the shared kinds in its
// own version, never the other's walks; a v2 walk reaches a v2 partner; a version nobody speaks is closed 4004.
const v4 = new Client();
await v4.open();
v4.v = 4;
v4.send({ kind: 'hello', key: KEY_A });
check((await v4.closed) === 4004, 'a v4 hello is closed with 4004');

const a3 = new Client();
await a3.open();
a3.send({ kind: 'hello', key: KEY_A });
await a3.next((m) => m.kind === 'welcome');
const b3 = new Client();
b3.v = 2;
await b3.open();
b3.send({ kind: 'hello', key: KEY_B });
const wb3 = await b3.next((m) => m.kind === 'welcome');
check(wb3.v === 2 && wb3.peer === true, 'a v2 hello is welcomed in v2');
a3.send({ kind: 'walk', to: [120, 340] });
a3.send({ kind: 'emote', emote: 'glee' });
const e3 = await b3.next((m) => m.kind === 'emote' || m.kind === 'walk');
check(e3.kind === 'emote' && e3.v === 2 && e3.who === 'A', "v1 → v2: the emote arrives in v2, the stage walk doesn't");
const a4 = new Client();
a4.v = 2;
await a4.open();
a4.send({ kind: 'hello', key: KEY_A });
await a4.next((m) => m.kind === 'welcome');
check((await a3.closed) === 4002, 'a v2 A replaces the v1 one (4002)');
a4.send({ kind: 'walk', to: [195, 860] });
const w4 = await b3.next((m) => m.kind === 'walk');
check(w4.v === 2 && (w4.to as number[])[1] === 860 && w4.who === 'A', 'v2 → v2: a world walk arrives');
a4.ws.close(1000);
b3.ws.close(1000);

// The shared world (docs/backend.md#shared-world): a claim's first comes through, a second of the same id goes nowhere;
// the day's world reaches a phone that opens later; one nest per tree per hour. Ids unique per run (the test room keeps
// its day).
const run = Date.now().toString(36);
const sa = new Client();
sa.v = 2;
await sa.open();
sa.send({ kind: 'hello', key: KEY_A });
await sa.next((m) => m.kind === 'welcome');
const sb = new Client();
sb.v = 2;
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
sb2.v = 2;
await sb2.open();
const tl = performance.now();
sb2.send({ kind: 'hello', key: KEY_B, since: sinceDay });
await sb2.next((m) => m.kind === 'welcome');
const late = await sb2.next((m) => m.kind === 'pick' && m.id === `p${run}`);
const lastWalk = await sb2.next((m) => m.kind === 'walk' && m.who === 'A');
check(late.who === 'A' && (lastWalk.to as number[])[1] === 900, `a phone opening later hears the day's world (${(performance.now() - tl).toFixed(0)} ms)`);
sa.ws.close(1000);
sb2.ws.close(1000);

// The guest (docs/backend.md#the-guest), when the test copy has a KEY_C: v3 only, both members hear it come, its walk
// reaches them, what it may not send goes nowhere, a v2 member never hears of it, and the record leaves the からだ out.
if (KEY_C) {
  const old = new Client();
  await old.open();
  old.v = 2;
  old.send({ kind: 'hello', key: KEY_C });
  check((await old.closed) === 4004, 'a guest speaking v2 is closed with 4004');
  const ga = new Client(), gb = new Client(), g = new Client();
  ga.v = 3;
  gb.v = 2;
  g.v = 3;
  await Promise.all([ga.open(), gb.open(), g.open()]);
  ga.send({ kind: 'hello', key: KEY_A });
  await ga.next((m) => m.kind === 'welcome');
  gb.send({ kind: 'hello', key: KEY_B });
  await gb.next((m) => m.kind === 'welcome');
  g.send({ kind: 'hello', key: KEY_C });
  const wg = await g.next((m) => m.kind === 'welcome');
  check(wg.me === 'G' && wg.peer === true && JSON.stringify(wg.here) === '["A","B"]', 'the guest is welcomed as G with A and B here');
  check((await ga.next((m) => m.kind === 'presence' && m.who === 'G')).on === true, 'a v3 member hears the guest arrive');
  g.send({ kind: 'walk', to: [100, 900] });
  check((await ga.next((m) => m.kind === 'walk')).who === 'G', "the guest's walk reaches a v3 member");
  g.send({ kind: 'world', op: 'watered', id: 'fl:1:2', c: Date.now() });
  check((await g.next((m) => m.kind === 'ack')).ok === false, "a world op from the guest is refused");
  await pause(300);
  check(!gb.inbox.some((m) => m.who === 'G' || (m.kind === 'presence' && m.who === 'G')), 'a v2 member never hears of the guest');
  const api = (key: string, action: string, extra: object = {}) =>
    fetch(new URL('/api', http), { method: 'POST', headers: { Origin: ORIGIN }, body: JSON.stringify({ key, action, ...extra }) }).then((r) => r.json() as Promise<Record<string, unknown>>);
  const snap = await api(KEY_C, 'snapshot');
  const text = JSON.stringify(snap);
  check(snap.ok === true && snap.me === 'G' && !/"(weight|body_fat_pct|bmi|lean_kg)"|goalWeight|goalBodyFat/.test(text), "the guest's snapshot has no からだ row and no からだ goal");
  check((await api(KEY_C, 'ingest', { dates: 'Nov 1, 2026', steps: '1' })).error === 'forbidden', "the guest's ingest is forbidden");
  for (const c of [ga, gb, g]) c.ws.close(1000);
}
