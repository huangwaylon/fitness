// Latency of the shared world through a deployed relay (docs/backend.md "Shared world", "Measured"): two clients in
// this process (the test copy's KEY_A / KEY_B, as smoke.ts), so one clock times both ends. For each intent the island
// sends (an act the room only passes on, and the ones it keeps: a walk, a catch, a pick-up, a put): A's send → B's
// receipt, one way, and the bytes on the wire; then a late join: B reconnects with `since` and the day's world arrives
// (how long, how many messages, how many bytes); and, when the relay acks (`c`), A's send → A's ack.
//   npm run latency                      (the test copy; N=30 each)
//   RELAY_URL=wss://… N=50 npm run latency
import { readFileSync } from 'node:fs';

const URL_ = process.env.RELAY_URL ?? 'wss://island-fund-relay-test.island-fund-relay.workers.dev/room';
const ORIGIN = 'https://huangwaylon.github.io';
const N = Number(process.env.N ?? 30);
const V = 2;

function keys(): { KEY_A: string; KEY_B: string } {
  if (process.env.KEY_A && process.env.KEY_B) return { KEY_A: process.env.KEY_A, KEY_B: process.env.KEY_B };
  const kv = Object.fromEntries(readFileSync(`${import.meta.dirname}/../.smoke-keys`, 'utf8').trim().split('\n').map((l: string) => l.split('=')));
  return kv as { KEY_A: string; KEY_B: string };
}

type Msg = Record<string, unknown> & { kind: string };

class Client {
  ws: WebSocket;
  inbox: { m: Msg; at: number; bytes: number }[] = [];
  waiters: { pred: (m: Msg) => boolean; res: (x: { m: Msg; at: number; bytes: number }) => void }[] = [];
  bytesIn = 0;
  msgsIn = 0;
  constructor() {
    this.ws = new WebSocket(URL_, { headers: { Origin: ORIGIN } } as never);
    this.ws.addEventListener('message', (e) => {
      const at = performance.now(), raw = String(e.data), m = JSON.parse(raw) as Msg;
      this.bytesIn += raw.length;
      this.msgsIn++;
      const x = { m, at, bytes: raw.length };
      const w = this.waiters.findIndex((w) => w.pred(m));
      if (w >= 0) this.waiters.splice(w, 1)[0].res(x);
      else this.inbox.push(x);
    });
  }
  open(): Promise<void> {
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res());
      this.ws.addEventListener('error', () => rej(new Error('connect failed')));
    });
  }
  /** Send; returns when it left and its size. */
  send(m: object): { at: number; bytes: number } {
    const raw = JSON.stringify({ v: V, ...m });
    this.ws.send(raw);
    return { at: performance.now(), bytes: raw.length };
  }
  next(pred: (m: Msg) => boolean, ms = 5000): Promise<{ m: Msg; at: number; bytes: number }> {
    const i = this.inbox.findIndex((x) => pred(x.m));
    if (i >= 0) return Promise.resolve(this.inbox.splice(i, 1)[0]);
    return new Promise((res, rej) => {
      const w = { pred, res: (x: { m: Msg; at: number; bytes: number }) => (clearTimeout(t), res(x)) };
      const t = setTimeout(() => {
        this.waiters.splice(this.waiters.indexOf(w), 1);
        rej(new Error('timed out waiting'));
      }, ms);
      this.waiters.push(w);
    });
  }
  /** Whatever arrives within `ms` that `pred` takes (resolves after a quiet `ms`). */
  async drain(pred: (m: Msg) => boolean, ms: number): Promise<{ m: Msg; at: number; bytes: number }[]> {
    const got: { m: Msg; at: number; bytes: number }[] = [];
    for (;;) {
      try {
        got.push(await this.next(pred, ms));
      } catch {
        return got;
      }
    }
  }
}

const stats = (xs: number[]) => {
  if (!xs.length) return 'n=0';
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return `median ${q(0.5).toFixed(0)} · p90 ${q(0.9).toFixed(0)} · max ${s.at(-1)!.toFixed(0)} ms (n=${s.length})`;
};
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

const { KEY_A, KEY_B } = keys();
const run = Date.now().toString(36).slice(-5);

async function hello(key: string, since?: number): Promise<{ c: Client; welcome: { m: Msg; at: number }; sent: number }> {
  const c = new Client();
  await c.open();
  const s = c.send({ kind: 'hello', key, ...(since !== undefined ? { since } : {}), batch: true });
  const welcome = await c.next((m) => m.kind === 'welcome');
  return { c, welcome, sent: s.at };
}

const a = (await hello(KEY_A)).c;
const b = (await hello(KEY_B)).c;
await a.drain(() => true, 400);
await b.drain(() => true, 400);

// a ping: the clock's round trip, for scale
const rtts: number[] = [];
for (let i = 0; i < 10; i++) {
  const s = a.send({ kind: 'ping', c: Date.now() });
  rtts.push((await a.next((m) => m.kind === 'pong')).at - s.at);
  await pause(60);
}
console.log(`ping round trip:            ${stats(rtts)}`);

const kinds: [string, (i: number) => object][] = [
  ['act (passed on)', (i) => ({ kind: 'act', act: 'rock', id: `l${run}${i}`, pt: [112, 478] })],
  ['walk (kept)', (i) => ({ kind: 'walk', to: [100 + i, 300], from: [132, 214], s: Date.now(), ms: 900 })],
  ['catch (kept, a claim)', (i) => ({ kind: 'catch', what: 'sea-bass', id: `l${run}c${i}`, at: [120, -60], how: 'rod' })],
  ['pick (kept, a claim)', (i) => ({ kind: 'pick', id: `l${run}p${i}`, what: 'find:shell:cowrie', at: [150, 40] })],
  ['put (kept)', (i) => ({ kind: 'put', id: `l${run}u${i}`, what: 'present:item:x', at: [200, 400] })],
  ['watered (kept)', (i) => ({ kind: 'world', op: 'watered', id: `A.${i % 2}-${i % 2}` })]
];
let ackSeen = false;
let seq = Date.now();
for (const [name, make] of kinds) {
  const one: number[] = [], acks: number[] = [];
  let sent = 0, got = 0;
  for (let i = 0; i < N; i++) {
    const body = make(i) as { kind: string };
    const c = ++seq;
    const s = a.send({ ...body, c });
    sent = s.bytes;
    const ack = a.next((m) => m.kind === 'ack' && m.c === c, 1500).then((x) => acks.push(x.at - s.at), () => {});
    try {
      const r = await b.next((m) => m.kind === body.kind && m.who === 'A', 2000);
      one.push(r.at - s.at);
      got = r.bytes;
    } catch {
      /* refused (watered twice): no relay */
    }
    await ack;
    await pause(70);
  }
  if (acks.length) ackSeen = true;
  console.log(`${name.padEnd(27)} A → B ${stats(one)}; ${sent} B sent, ${got} B relayed${acks.length ? `; ack ${stats(acks)}` : ''}`);
}
if (!ackSeen) console.log('(no acks: this relay does not ack)');

// a late join: B again, asking for today's world from midnight (Tokyo)
b.ws.close(1000);
await pause(300);
const DAY = 86_400_000, TOKYO = 9 * 3600_000;
const midnight = Math.floor((Date.now() + TOKYO) / DAY) * DAY - TOKYO;
const j = await hello(KEY_B, midnight);
const replay = await j.c.drain((m) => m.kind !== 'pong' && m.kind !== 'presence', 700);
const events = replay.reduce((n, x) => n + (x.m.kind === 'replay' ? (x.m.es as unknown[]).length : 1), 0);
const last = replay.at(-1);
console.log(`late join (since midnight): hello → welcome ${(j.welcome.at - j.sent).toFixed(0)} ms; ${events} events in ${replay.length} messages, ${replay.reduce((n, x) => n + x.bytes, 0)} B, the last ${last ? (last.at - j.sent).toFixed(0) : '–'} ms after the hello`);

a.ws.close(1000);
j.c.ws.close(1000);
