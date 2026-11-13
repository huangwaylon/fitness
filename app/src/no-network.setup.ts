// Unit tests never reach the network (vite.config.ts test.setupFiles; docs/ops/testing.md "Hermetic"). A real fetch,
// WebSocket or socket to anything but this machine is refused and fails the test it ran in (or the file, after its last):
// one test's fresh modules once posted to the live relay through the default transport (review 11/13 r3). A test that
// stubs fetch or passes its own WebSocket replaces these, as before.
import net from 'node:net';
import { afterAll, afterEach } from 'vitest';

const LOCAL = /^(localhost|127\.\d+\.\d+\.\d+|\[?::1\]?|0\.0\.0\.0)$/i;
const blocked: string[] = [];

const remote = (u: string): boolean => {
  try {
    const p = new URL(u);
    return !['data:', 'blob:', 'file:'].includes(p.protocol) && !LOCAL.test(p.hostname);
  } catch { return false; }
};
const refuse = (what: string): Error => {
  blocked.push(what);
  const e = new Error(`no network in unit tests: ${what}`);
  console.error(e.message);
  return e;
};

const realFetch = globalThis.fetch;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return remote(u) ? Promise.reject(refuse(`fetch ${u}`)) : realFetch(input, init);
}) as typeof fetch;

const RealWS = globalThis.WebSocket;
if (RealWS) {
  globalThis.WebSocket = class extends RealWS {
    constructor(u: string | URL, p?: string | string[]) {
      if (remote(String(u))) throw refuse(`WebSocket ${u}`);
      super(u, p);
    }
  } as typeof WebSocket;
}

// Below fetch (a client that brings its own) too: a TCP connect to another host.
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (this: net.Socket, ...a: unknown[]) {
  const o = a[0];
  const host = typeof o === 'object' && o !== null ? (o as { host?: string; path?: string }).path ? 'localhost' : (o as { host?: string }).host ?? 'localhost'
    : typeof o === 'number' || typeof o === 'string' && /^\d+$/.test(o) ? (typeof a[1] === 'string' ? a[1] : 'localhost') : 'localhost';
  if (!LOCAL.test(host)) throw refuse(`connect ${host}`);
  return (connect as (...x: unknown[]) => net.Socket).apply(this, a);
} as typeof connect;

const check = () => {
  if (blocked.length) throw new Error(`no network in unit tests, but it was asked for: ${blocked.splice(0).join(', ')}`);
};
afterEach(check);
afterAll(check);
