// The indoor scenes on the real target (docs/ops/testing.md "The iOS Simulator check"): the tent, うめ's house, the
// museum (the hall, the aquarium, the bug wing) and the shop, in the iOS Simulator's Safari over WebDriver, as
// ios-sim-check.ts does the island. Each scene is gone into from the island's page by a link (the app's own
// navigation, no reload) and reported: the time to its first frame and to everything in, the bytes it fetched, the
// longest frame gaps on the way in (shader compiles), the frames it draws a second at rest and walking, each frame's
// cost, its draw calls, triangles and the GPU's geometries, textures and programs; then out to the shop (no engine):
// the rAF callbacks, timer fires and intervals still running there against the island's own (a leak). Each scene a
// second time: warm.
//
//   npm run ios:indoor -- [--url BASE] [--device "iPhone 17"] [--out DIR] [--keep] [--fpv] [--museum]
//
//   --url     the site's base (default: the live site, https://huangwaylon.github.io/fitness/)
//   --fpv     every room at my villager's eyes (the first-person view: ?fpv=1)
//   --museum  the museum only (no tent, no home)
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const BASE = opt('--url', 'https://huangwaylon.github.io/fitness/').replace(/\/?$/, '/');
const Q = `demo&date=2026-11-04T12:00&critter=none&visitor=none${args.includes('--fpv') ? '&fpv=1' : ''}`;
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = opt('--out', join(import.meta.dirname, '..', 'test-results', 'ios-sim', `indoor-${stamp}`));
const PORT = 4780 + Math.floor(Math.random() * 50);
mkdirSync(OUT, { recursive: true });

// ---- the simulator (ios-sim-check.ts's) ----
type Dev = { udid: string; name: string; state: string };
const list = JSON.parse(execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '-j'], { encoding: 'utf8' })) as { devices: Record<string, Dev[]> };
const runtimes = Object.keys(list.devices).filter((r) => r.includes('iOS')).sort((a, b) => {
  const v = (r: string) => (r.match(/iOS-(\d+)-(\d+)/) ?? []).slice(1).map(Number);
  const [a1, a2] = v(a), [b1, b2] = v(b);
  return b1 - a1 || b2 - a2;
});
const wantName = opt('--device', '');
let dev: Dev | undefined, runtime = '';
for (const r of runtimes) {
  dev = list.devices[r].find((d) => (wantName ? d.name === wantName : /^iPhone \d/.test(d.name)));
  if (dev) {
    runtime = r;
    break;
  }
}
if (!dev) throw new Error('no iPhone simulator available (Xcode → Settings → Platforms)');
const ios = runtime.replace(/.*iOS-/, '').replace('-', '.');
console.log(`simulator: ${dev.name}, iOS ${ios}`);
const booted = dev.state === 'Booted';
if (!booted) execFileSync('xcrun', ['simctl', 'boot', dev.udid]);
execFileSync('xcrun', ['simctl', 'bootstatus', dev.udid, '-b'], { stdio: 'ignore' });
execFileSync('xcrun', ['simctl', 'spawn', dev.udid, 'defaults', 'write', 'com.apple.mobilesafari', 'WebDriverEnabled', '-bool', 'YES']);

const driver = spawn('safaridriver', ['-p', String(PORT)], { stdio: 'ignore' });
const wd = async (method: string, path: string, body?: unknown) => {
  const r = await fetch(`http://127.0.0.1:${PORT}${path}`, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = (await r.json()) as { value: unknown };
  if (!r.ok) throw new Error(`${method} ${path}: ${JSON.stringify(j.value).slice(0, 300)}`);
  return j.value;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let sid = '';
const run = async <T,>(script: string, ...a: unknown[]): Promise<T> => (await wd('POST', `/session/${sid}/execute/sync`, { script, args: a })) as T;
const runAsync = async <T,>(script: string, ...a: unknown[]): Promise<T> => (await wd('POST', `/session/${sid}/execute/async`, { script, args: a })) as T;
const shot = async (name: string) => writeFileSync(join(OUT, `${name}.png`), Buffer.from((await wd('GET', `/session/${sid}/screenshot`)) as string, 'base64'));
const until = async (cond: string, ms = 30_000) => {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(150)) if (await run<boolean>(`try { return !!(${cond}); } catch { return false; }`)) return true;
  return false;
};

// the page's rAF callbacks, timer fires and live intervals counted (wrapped once, on the island's page: the app's own
// navigation keeps it)
const PROBE = `if (!window.__ind) {
  const ind = window.__ind = { raf: 0, to: 0, iv: new Set() };
  const R = window.requestAnimationFrame.bind(window), T = window.setTimeout.bind(window), I = window.setInterval.bind(window), C = window.clearInterval.bind(window);
  window.requestAnimationFrame = (f) => R((t) => { ind.raf++; f(t); });
  window.setTimeout = (f, ms, ...a) => T(typeof f === 'function' ? (...b) => { ind.to++; f(...b); } : f, ms, ...a);
  window.setInterval = (f, ms, ...a) => { const id = I(typeof f === 'function' ? (...b) => { ind.to++; f(...b); } : f, ms, ...a); ind.iv.add(id); return id; };
  window.clearInterval = (id) => { ind.iv.delete(id); C(id); };
}`;
/** Over `ms`: the rAF callbacks and timer fires a second, the intervals live, the CSS animations running, the
 *  engine's frames a second and its frames' cost (p50, p95), and the page's own frame gaps (p95, long ones). */
const QUIET = `const [hook, ms, done] = arguments; const ind = window.__ind, h = hook && window[hook];
  const r0 = ind.raf, t0 = ind.to, f0 = h ? h.stats().frames : 0, s = performance.now(), gaps = []; let last = s;
  (function f(now) { gaps.push(now - last); last = now; if (now - s < ms) requestAnimationFrame(f); else {
    const k = 1000 / (now - s), st = h ? h.stats() : null, n = st ? st.frames - f0 : 0, c = st ? st.cost.slice(-Math.max(1, n)).sort((a, b) => a - b) : [];
    const q = (xs, p) => +(xs[Math.min(xs.length - 1, Math.floor(p * xs.length))] || 0).toFixed(2); gaps.sort((a, b) => a - b);
    done({ raf: +((ind.raf - r0 - gaps.length) * k).toFixed(1), timers: +((ind.to - t0) * k).toFixed(1), intervals: ind.iv.size,
      anims: document.getAnimations().filter((a) => a.playState === 'running').length,
      drawn: +(n * k).toFixed(1), cost: [q(c, 0.5), q(c, 0.95)], gap95: q(gaps, 0.95), max: Math.round(gaps[gaps.length - 1] || 0), long: gaps.filter((g) => g > 50).length,
      calls: st?.calls, tris: st?.tris, dpr: st?.dpr, mem: st?.mem }); } })(s);`;

/** Into a scene by a link (the app's own navigation): to its first frame and everything in, the bytes fetched and
 *  the longest gaps between the page's frames on the way (a shader's compile). */
async function enter(path: string, hook: string | null, ready: string) {
  await run(`window.__res0 = performance.getEntriesByType('resource').length; window.__gaps = []; let last = performance.now(); const s = last;
    (function f(now) { __gaps.push(now - last); last = now; if (now - s < 6000) requestAnimationFrame(f); })(s);
    window.__t0 = performance.now(); const a = document.createElement('a'); a.href = ${JSON.stringify(BASE + path)}; document.body.append(a); a.click(); a.remove();`);
  const first = await until(hook ? `window.${hook} && window.${hook}.stats() && window.${hook}.stats().frames > 0` : ready);
  const firstMs = first ? Math.round(await run<number>('return performance.now() - __t0;')) : null;
  const all = await until(ready);
  const allMs = all ? Math.round(await run<number>('return performance.now() - __t0;')) : null;
  await sleep(Math.max(0, 6200 - (allMs ?? 0)));
  const net = await run<{ n: number; kb: number; body: number; gaps: number[] }>(`const e = performance.getEntriesByType('resource').slice(__res0);
    return { n: e.length, kb: Math.round(e.reduce((a, x) => a + (x.transferSize || 0), 0) / 1024), body: Math.round(e.reduce((a, x) => a + (x.decodedBodySize || 0), 0) / 1024),
      gaps: __gaps.slice().sort((a, b) => b - a).slice(0, 3).map(Math.round) };`);
  return { firstMs, allMs, requests: net.n, kb: net.kb, bodyKb: net.body, worstGaps: net.gaps };
}
const quiet = (hook: string | null, ms = 4000) => runAsync<Record<string, unknown>>(QUIET, hook, ms);

const report: Record<string, unknown> = { when: new Date().toISOString(), device: dev.name, ios, base: BASE };
const scenes: Record<string, Record<string, unknown>> = {};
try {
  for (let i = 0; i < 20 && !sid; i++) {
    try {
      const s = (await wd('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'Safari', platformName: 'iOS', 'safari:useSimulator': true, 'safari:deviceUDID': dev.udid } } })) as { sessionId: string };
      sid = s.sessionId;
    } catch (e) {
      if (i === 19) throw e;
      await sleep(1000);
    }
  }
  // a full museum: every fish and bug with a model found (the demo's record, as a catch writes it; e2e/museum.spec.ts's
  // seed), set on a page of the site that isn't the app
  const crit = join(import.meta.dirname, '..', 'static', 'room', 'world3d', 'critters');
  const finds = (['fish', 'bugs'] as const).flatMap((k) => readdirSync(join(crit, k)).filter((f) => f.endsWith('.glb')).map((f) => [k === 'bugs' ? 'bug' : 'fish', f.slice(0, -4)]));
  await wd('POST', `/session/${sid}/url`, { url: `${BASE}manifest.webmanifest` }).catch(() => {});
  await run(`const at = Date.parse('2026-11-04T09:00:00+09:00'), who = ['A', 'B', 'G'];
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events: arguments[0].map(([kind, id], i) =>
      ({ id: 'seed-' + i, type: 'find', data: { kind, id }, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person: who[i % 3] })) }));`, finds);
  report.finds = finds.length;
  // (the load's own event may come late: the island's models)
  await wd('POST', `/session/${sid}/url`, { url: `${BASE}?${Q}` }).catch(() => {});
  await until('window.__world3d && window.__world3d.loaded()', 60_000);
  await run(PROBE);
  // (the island's own requests fill Safari's 250 entries)
  await run('performance.setResourceTimingBufferSize(10000); performance.clearResourceTimings();');
  await sleep(2000);
  report.island = await quiet(null);
  const tentReady = 'window.__tent && window.__tent.stats().frames > 0 && window.__tent.loading() === 0';
  const museumReady = 'window.__museum && window.__museum.stats().frames > 0 && window.__museum.stats().loading === 0';
  const shopReady = '!!document.querySelector("[data-shop-say]")';
  const out = async () => {
    await enter(`shop/?${Q}`, null, shopReady);
    await sleep(1500);
    return quiet(null);
  };
  scenes.shop = { entry: await enter(`shop/?${Q}`, null, shopReady), rest: await quiet(null) };
  await shot('shop');
  report.baseline = await out();
  for (const pass of ['cold', 'warm']) {
    for (const [name, home] of args.includes('--museum') ? [] : [['tent', ''], ['home', '&home=B']]) {
      const sc: Record<string, unknown> = { entry: await enter(`tent/?${Q}${home}`, '__tent', tentReady) };
      await until('window.__tent.still() && !window.__tent.walking("A")');
      await sleep(1500);
      sc.rest = await quiet('__tent');
      if (pass === 'cold') await shot(name);
      await run('const [x, z] = __tent.mine(); __tent.walkTo(x > 0 ? -25 : 25, z > 0 ? -20 : 20);');
      sc.walk = await quiet('__tent', 1500);
      await until('!__tent.walking("A")');
      sc.orbit = await runAsync('const done = arguments[0]; __tent.orbitBench(120).then((r) => done({ cost: r.cost, gap: r.gap }));');
      sc.out = await out();
      scenes[`${name}-${pass}`] = sc;
    }
    const mu: Record<string, unknown> = { entry: await enter(`museum/?${Q}`, '__museum', museumReady) };
    await until('window.__museum.still()');
    await sleep(1500);
    mu.restHall = await quiet('__museum');
    if (pass === 'cold') await shot('museum-hall');
    // into each wing from the hall, walking (its models' first draw: textures up, programs compiled)
    await run('__museum.walkTo(150, 20);');
    mu.intoAquarium = await quiet('__museum', 4000);
    await run('__museum.put(0, 20);');
    await until('window.__museum.still()');
    await run('__museum.walkTo(-150, 10);');
    mu.intoBugs = await quiet('__museum', 4000);
    await run('__museum.put(160, 80);');
    await sleep(1500);
    mu.restAquarium = await quiet('__museum');
    if (pass === 'cold') await shot('museum-aquarium');
    // the hour turning in front of the river tank: its seven fading out, the next seven in (aquarium.ts pick): the
    // longest frame gaps meanwhile (a program compiled mid-fade) and the programs before and after
    mu.hourSwap = await runAsync(`const done = arguments[0], p0 = __museum.stats().mem[2], s = performance.now(), gaps = []; let last = s;
      __museum.nextHour();
      (function f(now) { gaps.push(now - last); last = now; if (now - s < 4000) requestAnimationFrame(f);
        else done({ worst: gaps.sort((a, b) => b - a).slice(0, 3).map(Math.round), programs: [p0, __museum.stats().mem[2]] }); })(s);`);
    await run('__museum.walkTo(90, 84);');
    mu.walkAquarium = await quiet('__museum', 1500);
    await run('__museum.put(-250, -50);');
    await sleep(1500);
    mu.restBugs = await quiet('__museum');
    if (pass === 'cold') await shot('museum-bugs');
    await run('__museum.walkTo(-120, 40);');
    mu.walkBugs = await quiet('__museum', 1500);
    mu.out = await out();
    scenes[`museum-${pass}`] = mu;
  }
  report.scenes = scenes;
  report.errors = await run('return window.__iosErrs || [];');
} catch (e) {
  report.failure = String(e);
} finally {
  if (sid) await wd('DELETE', `/session/${sid}`).catch(() => {});
  driver.kill();
  if (!booted && !args.includes('--keep')) execFileSync('xcrun', ['simctl', 'shutdown', dev.udid]);
}

writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`\n${OUT}`);
if (report.failure) process.exitCode = 1;
