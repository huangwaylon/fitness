// The launch-timeline harness (e2e/launch-timeline.spec.ts; LAUNCH_PERF=1): the built app behind a local proxy that
// shapes the network as a phone's (offline, slow, lie-fi, good), the relay's API on the context shaped the same, and
// an init script marking each launch's steps on the wall clock. WebKit routes none of its service worker's fetches
// (offline.spec), so the same-origin network is shaped at the proxy, which the worker's fetches go through too.
import { createServer, request as httpRequest, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { execFileSync } from 'node:child_process';
import type { AddressInfo, Socket } from 'node:net';
import type { BrowserContext, Page, Route } from './fixtures.ts';

/** The four networks: none (airplane), slow (400 ms a round trip, 400 kbps shared), lie-fi (connected, nothing ever
 *  answers), good (the local preview as is). */
export type Profile = 'offline' | 'slow' | 'liefi' | 'good';
export const PROFILES: readonly Profile[] = ['offline', 'slow', 'liefi', 'good'];
const RTT_MS = 400;
const BYTES_PER_MS = 400_000 / 8 / 1000;

/** One request as the network saw it: its path (no query), when it began and ended (epoch ms), its bytes, how it ended. */
export interface Req { url: string; kind: 'same' | 'relay'; start: number; end?: number; bytes: number; how: 'ok' | 'hung' | 'refused' | 'aborted' }

/** A shared link: every body's bytes queued on one 400 kbps pipe (a phone's one radio). */
function pipe() {
  let free = 0;
  return (bytes: number) => {
    const now = Date.now();
    free = Math.max(free, now) + bytes / BYTES_PER_MS;
    return free - now;
  };
}

/** The proxy in front of the preview (`target`: its origin), shaped by `profile()`; every request logged in `reqs`. */
export async function shapedOrigin(target: string, profile: () => Profile): Promise<{ origin: string; reqs: Req[]; close(): Promise<void> }> {
  const t = new URL(target), reqs: Req[] = [], sockets = new Set<Socket>(), held = new Set<ServerResponse>();
  const wait = pipe();
  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const p = profile(), r: Req = { url: (req.url ?? '').replace(/\?.*$/, ''), kind: 'same', start: Date.now(), bytes: 0, how: 'ok' };
    reqs.push(r);
    // (offline: the connection dropped at once, as a phone with no network fails a fetch at once)
    if (p === 'offline') return ((r.how = 'refused'), (r.end = Date.now()), req.socket.destroy());
    if (p === 'liefi') return ((r.how = 'hung'), void held.add(res)); // never answered
    const up = httpRequest({ host: t.hostname, port: t.port, path: req.url, method: req.method, headers: { ...req.headers, host: t.host } }, async (back) => {
      const chunks: Buffer[] = [];
      for await (const c of back) chunks.push(c as Buffer);
      const body = Buffer.concat(chunks);
      r.bytes = body.length;
      if (p === 'slow') await new Promise((ok) => setTimeout(ok, RTT_MS + wait(body.length)));
      res.writeHead(back.statusCode ?? 502, back.headers);
      res.end(body);
      r.end = Date.now();
    });
    up.on('error', () => ((r.how = 'aborted'), (r.end = Date.now()), res.destroy()));
    req.pipe(up);
  });
  server.on('connection', (s) => (sockets.add(s), s.on('close', () => sockets.delete(s))));
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    reqs,
    close: () => new Promise<void>((ok) => {
      for (const s of sockets) s.destroy();
      held.clear();
      server.close(() => ok());
    })
  };
}

/** A route handler as the e2e's records register them (record.ts, places.ts): what of Playwright's Route they use. */
type Handler = (route: Route) => unknown;
/** The record's and the places' routes, taken off a stand-in context (`routes.context`, to hand record.ts's pair()
 *  and places.ts's routePlaces) and answered here: WebKit routes no request of a page its service worker controls, so
 *  the relay is reached through the browser's proxy (`relayProxy`) instead. Their init scripts go to `addInitScript`. */
export function relayRoutes(addInitScript: (script: unknown, arg?: unknown) => Promise<void>) {
  const list: [string, Handler][] = [];
  const context = {
    addInitScript,
    routeWebSocket: async () => {},
    route: async (pattern: string, h: Handler) => void list.push([pattern, h])
  } as unknown as BrowserContext;
  /** A request answered by the last route registered for it (each falling back to the one before). */
  const answer = (req: { url: string; method: string; headers: Record<string, string>; body: string }) =>
    new Promise<{ status: number; headers: Record<string, string>; body: string } | null>((done) => {
      const of = list.filter(([p]) => req.url.startsWith(p.replace(/\*+$/, ''))).map(([, h]) => h).reverse();
      const next = (i: number): void => {
        if (i >= of.length) return done(null);
        const route = {
          request: () => ({ url: () => req.url, method: () => req.method, headers: () => req.headers, postData: () => req.body || null }),
          fulfill: async (o: { status?: number; contentType?: string; headers?: Record<string, string>; body?: string }) => done({ status: o.status ?? 200, headers: { ...(o.contentType ? { 'content-type': o.contentType } : {}), ...o.headers }, body: o.body ?? '' }),
          abort: async () => done(null),
          fallback: async () => next(i + 1),
          continue: async () => done(null)
        } as unknown as Route;
        void Promise.resolve(of[i](route)).catch(() => done(null));
      };
      next(0);
    });
  return { context, answer };
}

/** The browser's proxy for every host but the local ones (`proxy` of the context): only `relay`'s host answers (TLS
 *  ended here with a throwaway certificate: the context ignores HTTPS errors), by `answer`, shaped by `profile()`
 *  (offline: refused; lie-fi: connected, never answered; slow: 400 ms + the shared 400 kbps); any other host is refused,
 *  as the e2e's hermetic rule wants (nothing leaves this machine). The room's socket is held, never opened. */
export async function relayProxy(relay: string, answer: ReturnType<typeof relayRoutes>['answer'], profile: () => Profile, reqs: Req[]) {
  const host = new URL(relay).host, wait = pipe(), sockets = new Set<Socket>();
  const pem = execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', '/dev/stdout', '-out', '/dev/stdout', '-subj', `/CN=${new URL(relay).hostname}`, '-days', '2'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const key = /-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/.exec(pem)![0], cert = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/.exec(pem)![0];
  const tls = createHttpsServer({ key, cert }, async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const p = profile(), body = Buffer.concat(chunks).toString(), r: Req = { url: (req.url ?? '').replace(/\?.*$/, ''), kind: 'relay', start: Date.now(), bytes: 0, how: 'ok' };
    reqs.push(r);
    if (p === 'liefi') return void (r.how = 'hung');
    const cors = { 'access-control-allow-origin': String(req.headers.origin ?? '*'), 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    const got = req.method === 'OPTIONS' ? { status: 204, headers: {}, body: '' } : await answer({ url: `${relay}${req.url}`, method: req.method ?? 'GET', headers: req.headers as Record<string, string>, body });
    if (!got) return ((r.how = 'aborted'), (r.end = Date.now()), req.socket.destroy());
    r.bytes = got.body.length;
    if (p === 'slow') await new Promise((ok) => setTimeout(ok, RTT_MS + wait(got.body.length + body.length)));
    res.writeHead(got.status, { ...cors, ...Object.fromEntries(Object.entries(got.headers).map(([k, v]) => [k.toLowerCase(), v])) });
    res.end(got.body);
    r.end = Date.now();
  });
  tls.on('upgrade', () => {}); // the room: held
  const server = createServer((_req, res) => res.writeHead(502).end());
  server.on('connect', (req: IncomingMessage, socket: Socket) => {
    sockets.add(socket);
    socket.on('error', () => {}).on('close', () => sockets.delete(socket));
    const p = profile();
    if (req.url !== `${host}:443` && req.url !== host) return void socket.destroy();
    if (p === 'offline') return ((reqs.push({ url: 'CONNECT', kind: 'relay', start: Date.now(), end: Date.now(), bytes: 0, how: 'refused' })), void socket.destroy());
    if (p === 'liefi') return void reqs.push({ url: 'CONNECT', kind: 'relay', start: Date.now(), bytes: 0, how: 'hung' });
    setTimeout(() => {
      if (socket.destroyed) return;
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      tls.emit('connection', socket);
    }, p === 'slow' ? RTT_MS : 0);
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return {
    server: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((ok) => {
      for (const s of sockets) s.destroy();
      tls.close();
      server.close(() => ok());
    })
  };
}

/** The marks, epoch ms (the wall clock: on WebKit the page's own clock starts only once the worker answers). */
interface Marks {
  /** the page's clock start (its navigation's origin) */
  origin: number;
  /** the shell's first paint (first-contentful-paint, else the first frame with the body laid out) */
  paint?: number;
  /** the HUD shown: the menu's leaf and けんこう on screen */
  hud?: number;
  /** the menu opened by a tap (tapped each frame from the HUD's showing until it unfolds: hydrated) */
  menu?: number;
  /** the island's first frame (its ground drawn: engine stats) and its models in */
  island?: number;
  loaded?: number;
  /** the sheet asked for (`want`): open, and its cached data shown */
  sheet?: number;
  data?: number;
}
type Win = Window & { __launch?: Marks; __world3d?: { stats(): { island: boolean }; loaded(): boolean; boot?: () => unknown } };

/** The menu unfolded: tapped, and unfolded (a tap before the page is live does nothing). */
const MENU = ['[data-hud-menu]', '[data-hud-menu][aria-expanded="true"]'] as const;
/** Each sheet: its taps (each a [what to tap, what shows it acted]) as soon as the HUD shows, and what shows its data. */
export const SHEETS = {
  food: { taps: [['.hud-health', 'dialog[open] [data-kenkou-tab=food]'], ['dialog[open] [data-kenkou-tab=food]', 'dialog[open] [data-kenkou-tab=food][aria-current=page]']], data: 'dialog[open] [data-food-sheet] [data-food-summary]' },
  trips: { taps: [MENU, ['[data-hud-travel]', 'dialog[open] [data-travel]']], data: 'dialog[open] [data-travel] [data-trip]' },
  hikes: { taps: [MENU, ['[data-hud-hiking]', 'dialog[open] [data-hiking]']], data: 'dialog[open] [data-hiking] [data-trail]' },
  places: { taps: [MENU, ['[data-hud-places]', 'dialog[open] [data-places]']], data: 'dialog[open] [data-places] [data-place-row]' },
  todo: { taps: [MENU, ['[data-hud-todo]', 'dialog[open] [data-todo]']], data: 'dialog[open] [data-todo] [data-todo-item]' }
} as const;
export type Sheet = keyof typeof SHEETS;

/** The marks' init script on `on` (each load): with `want`, that sheet's taps and data; else the menu's. */
export async function markLaunch(on: Page | BrowserContext, want: Sheet | null): Promise<void> {
  const plan = want ? SHEETS[want] : { taps: [MENU], data: null };
  await on.addInitScript(({ taps, data }: { taps: readonly (readonly [string, string])[]; data: string | null }) => {
    const w = window as unknown as Win, m: Marks = (w.__launch = { origin: performance.timeOrigin });
    const now = () => performance.timeOrigin + performance.now();
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') m.paint ??= performance.timeOrigin + e.startTime;
      }).observe({ type: 'paint', buffered: true });
    } catch {
      /* no paint timing */
    }
    const shows = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top < innerHeight ? (el as HTMLElement) : null;
    };
    // (a tap, then 250 ms for it to act before the next: the menu's leaf toggles)
    let step = 0, tapped = 0;
    const tick = () => {
      const t = now();
      if (!m.paint && document.body?.firstElementChild && document.body.getBoundingClientRect().height > 0) m.paint = t;
      if (!m.hud && shows('[data-hud-menu]') && shows('.hud-health')) m.hud = t;
      try {
        if (!m.island && w.__world3d?.stats().island) m.island = t;
        if (!m.loaded && w.__world3d?.loaded()) m.loaded = t;
      } catch {
        /* the engine not up */
      }
      if (m.hud && step < taps.length) {
        const [tap, acted] = taps[step];
        if (document.querySelector(acted)) {
          if (tap === '[data-hud-menu]') m.menu ??= t;
          if (++step === taps.length && data) m.sheet = t;
        } else if (t - tapped > 250) shows(tap)?.click(), (tapped = t);
      }
      if (data && m.sheet && !m.data && shows(data)) m.data = t;
      if (!(m.loaded && m.island && step === taps.length && (!data || m.data))) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { taps: plan.taps, data: plan.data });
}

/** The marks so far, ms from `t0` (the launch's start: the navigation asked, epoch ms). */
export async function marksFrom(page: Page, t0: number): Promise<Record<string, number>> {
  const m = await page.evaluate(() => (window as unknown as Win).__launch ?? null);
  if (!m) return {};
  return Object.fromEntries(Object.entries(m).filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, Math.round((v as number) - t0)]));
}
