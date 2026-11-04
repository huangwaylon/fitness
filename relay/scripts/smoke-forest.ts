// Smoke test of a deployed relay's forest room (くまのもり, src/expedition.ts) from this machine: two test clients (the
// test copy's KEY_A / KEY_B from .smoke-keys or the environment): the hello, a ping's clock and round trip, a
// relayed position stamped with its sender, the host's own messages refused from the others, a bad key closed.
//   npm run smoke:forest                       (the test copy)
//   RELAY_URL=wss://…/expedition npm run smoke:forest
import { readFileSync } from 'node:fs';

const URL_ = process.env.RELAY_URL ?? 'wss://island-fund-relay-test.island-fund-relay.workers.dev/expedition';
const ORIGIN = 'https://huangwaylon.github.io';

function keys(): { KEY_A: string; KEY_B: string } {
  if (process.env.KEY_A && process.env.KEY_B) return { KEY_A: process.env.KEY_A, KEY_B: process.env.KEY_B };
  return Object.fromEntries(readFileSync(`${import.meta.dirname}/../.smoke-keys`, 'utf8').trim().split('\n').map((l: string) => l.split('='))) as { KEY_A: string; KEY_B: string };
}
type M = Record<string, unknown> & { k: string };

class Client {
  ws: WebSocket;
  inbox: M[] = [];
  waiters: { pred: (m: M) => boolean; res: (m: M) => void }[] = [];
  closed: Promise<number>;
  constructor() {
    this.ws = new WebSocket(URL_, { headers: { Origin: ORIGIN } } as never);
    this.ws.addEventListener('message', (e) => {
      const m = JSON.parse(String(e.data)) as M;
      const w = this.waiters.findIndex((x) => x.pred(m));
      if (w >= 0) this.waiters.splice(w, 1)[0].res(m);
      else this.inbox.push(m);
    });
    this.closed = new Promise((r) => this.ws.addEventListener('close', (e) => r(e.code)));
  }
  open = () => new Promise<void>((res, rej) => (this.ws.addEventListener('open', () => res()), this.ws.addEventListener('error', () => rej(new Error('connect failed')))));
  send = (m: object) => this.ws.send(JSON.stringify(m));
  next(pred: (m: M) => boolean, ms = 4000): Promise<M | null> {
    const i = this.inbox.findIndex(pred);
    if (i >= 0) return Promise.resolve(this.inbox.splice(i, 1)[0]);
    return new Promise((res) => {
      const w = { pred, res: (m: M) => (clearTimeout(t), res(m)) };
      const t = setTimeout(() => (this.waiters.splice(this.waiters.indexOf(w), 1), res(null)), ms);
      this.waiters.push(w);
    });
  }
}
function check(ok: boolean, what: string) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) process.exitCode = 1;
}

const { KEY_A, KEY_B } = keys();
const a = new Client(), b = new Client();
await Promise.all([a.open(), b.open()]);
a.send({ k: 'hello', key: KEY_A, v: 1 });
const wa = await a.next((m) => m.k === 'welcome');
check(wa?.me === 'A', 'A welcomed');
b.send({ k: 'hello', key: KEY_B, v: 1 });
const wb = await b.next((m) => m.k === 'welcome');
check(wb?.me === 'B' && Array.isArray(wb.here) && wb.here.includes('A'), 'B welcomed, A here');
check(!!(await a.next((m) => m.k === 'here' && m.who === 'B' && m.on === true)), 'A told B came');
const rtts: number[] = [];
for (let i = 0; i < 5; i++) {
  const c = Date.now();
  a.send({ k: 'ping', c });
  const p = await a.next((m) => m.k === 'pong' && m.c === c);
  if (p) rtts.push(Date.now() - c);
}
check(rtts.length === 5, `pings answered (rtt ${rtts.sort((x, y) => x - y).join(', ')} ms)`);
a.send({ k: 'p', who: 'B', x: 1.5, z: -2, f: 0, v: 0, st: 'ok', top: false, n: 0, run: false });
const p = await b.next((m) => m.k === 'p');
check(p?.who === 'A' && p.from === 'A' && p.x === 1.5, 'a position relayed, stamped with its sender');
a.send({ k: 'start', t0: Date.now() + 3000, seed: 1, players: ['A', 'B'], bears: 1, host: 'A' });
check(!!(await b.next((m) => m.k === 'start' && m.from === 'A')), 'the start relayed (A hosts)');
b.send({ k: 'bear', b: [], t: 0 });
check((await a.next((m) => m.k === 'bear', 1500)) === null, 'a bear update from B (not the host) refused');
a.send({ k: 'bear', b: [], t: 0 });
check(!!(await b.next((m) => m.k === 'bear' && m.from === 'A')), "the host's bear update relayed");
const x = new Client();
await x.open();
x.send({ k: 'hello', key: 'ff'.repeat(32), v: 1 });
check((await x.closed) === 4001, 'a bad key closed (4001)');
a.ws.close();
check(!!(await b.next((m) => m.k === 'here' && m.who === 'A' && m.on === false)), 'B told A left');
b.ws.close();
