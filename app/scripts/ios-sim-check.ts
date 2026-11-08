// The real target, on this Mac (docs/ops/testing.md "The iOS Simulator check"): the app in the iOS Simulator's Safari
// (the latest installed iOS, an iPhone, Metal under it), driven over WebDriver (safaridriver, its Simulator support),
// opened as the demo on the 3D island; screenshots, the frames (idle and while scrolling), long frames, the load's
// time and the page's errors into a short report. CI's software GL is no judge of the phones' rendering: this is.
//
//   npm run ios:check -- [--url URL] [--device "iPhone 17"] [--out DIR] [--keep] [--seed FILE] [--then FILE]
//
//   --url     the page (default: the live site, https://island-fund.pages.dev/?demo)
//   --device  a simulator by name (default: the first available "iPhone 1…" of the newest iOS)
//   --out     where the report and screenshots go (default: app/test-results/ios-sim/<date>)
//   --keep    leave the simulator booted
//   --seed    a JSON file of localStorage entries ({key: value}) put in before the island loads (the page is opened,
//             seeded, and opened again): a demo island with things on it (the gym's ten pieces: docs/design.md)
//   --then    a JS file run in the page once the island is up, before the measures (put my villager on a piece)
//   --boots   N warm launches instead of the measures: each launch's own clock (world3d/boot.ts), and their medians
//             (with a URL whose query has checks=0: npm run ios:check -- --boots 8 --url 'http://127.0.0.1:PORT/?demo&checks=0')
// Once per Mac: nothing (the script turns on Safari's Remote Automation in the simulator); safaridriver ships with
// macOS. Nightly: a launchd agent (docs/ops/testing.md has the plist) runs `npm run ios:check` and keeps its reports.
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const URL_ = opt('--url', 'https://island-fund.pages.dev/?demo');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = opt('--out', join(import.meta.dirname, '..', 'test-results', 'ios-sim', stamp));
const PORT = 4730 + Math.floor(Math.random() * 50);
mkdirSync(OUT, { recursive: true });

// ---- the simulator ----
type Dev = { udid: string; name: string; state: string; isAvailable: boolean };
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
if (dev.state !== 'Booted') execFileSync('xcrun', ['simctl', 'boot', dev.udid]);
execFileSync('xcrun', ['simctl', 'bootstatus', dev.udid, '-b'], { stdio: 'ignore' });
execFileSync('xcrun', ['simctl', 'spawn', dev.udid, 'defaults', 'write', 'com.apple.mobilesafari', 'WebDriverEnabled', '-bool', 'YES']);

// ---- WebDriver ----
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

/** The frames over `ms`: their count, the gaps' median and 95th, the long ones (> 50 ms). */
const FRAMES = `const [ms, done] = arguments; const t = []; const end = performance.now() + ms;
  (function f(now) { t.push(now); if (now < end) requestAnimationFrame(f); else {
    const g = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b), q = (p) => g[Math.min(g.length - 1, Math.floor(p * g.length))] || 0;
    done({ fps: Math.round((t.length - 1) / (ms / 1000)), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), long: g.filter((x) => x > 50).length }); } })(performance.now());`;

const report: Record<string, unknown> = { when: new Date().toISOString(), device: dev.name, ios, url: URL_ };
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
  const t0 = Date.now();
  await wd('POST', `/session/${sid}/url`, { url: URL_ });
  const seed = opt('--seed', '');
  if (seed) {
    await run(`for (const [k, v] of Object.entries(arguments[0])) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));`, JSON.parse(readFileSync(seed, 'utf8')));
    await wd('POST', `/session/${sid}/url`, { url: URL_ });
  }
  // the page's errors from here on (the load's own are in its console: the 3D island's loaded() says it came up)
  await run(`window.__iosErrs = []; addEventListener('error', (e) => __iosErrs.push(String(e.message).slice(0, 200))); addEventListener('unhandledrejection', (e) => __iosErrs.push('rejection: ' + String(e.reason).slice(0, 200)));`);
  let loaded = false;
  for (let i = 0; i < 120 && !loaded; i++) {
    loaded = await run<boolean>('return !!(window.__world3d && window.__world3d.loaded());').catch(() => false);
    if (!loaded) await sleep(500);
  }
  report.loadMs = loaded ? Date.now() - t0 : null;
  report.island3d = loaded;
  const boots = Number(opt('--boots', '0'));
  if (loaded && boots > 0) await bootRuns(boots);
  else await measures();
} catch (e) {
  report.failure = String(e);
} finally {
  if (sid) await wd('DELETE', `/session/${sid}`).catch(() => {});
  driver.kill();
  if (!args.includes('--keep')) execFileSync('xcrun', ['simctl', 'shutdown', dev.udid]);
}

/** `--boots N`: warm launches (the service worker controlling, its caches full: the first load registered it), each
 *  the launch's own clock (world3d/boot.ts, the log's perf.boot) as the island reports it; then their medians. Use a
 *  URL with `checks=0` (no shader checks: docs/ops/perf.md "Measuring"). */
async function bootRuns(n: number) {
  for (let i = 0; i < 60 && !(await run<boolean>('return !!navigator.serviceWorker && !!navigator.serviceWorker.controller;')); i++) {
    if (i % 10 === 9) await wd('POST', `/session/${sid}/url`, { url: URL_ });
    await sleep(1000);
  }
  await sleep(3000);
  const rows: Record<string, number | string | boolean>[] = [];
  for (let i = 0; i < n; i++) {
    await wd('POST', `/session/${sid}/url`, { url: `${URL_}${URL_.includes('?') ? '&' : '?'}boot=${i}` });
    let r: Record<string, number | string | boolean> | null = null;
    for (let k = 0; k < 60 && !r; k++) {
      r = await run<typeof r>('return window.__world3d && window.__world3d.boot ? window.__world3d.boot() : null;').catch(() => null);
      if (!r) await sleep(500);
    }
    if (r) rows.push(r);
    else console.log('no report:', JSON.stringify(await run('const w = window.__world3d; return w ? { loaded: w.loaded(), stats: w.stats(), hidden: document.hidden } : { up: false, hidden: document.hidden };').catch(String)));
    console.log(JSON.stringify(r));
    await sleep(1500);
  }
  const med = (k: string) => {
    const v = rows.map((r) => r[k]);
    return typeof v[0] === 'number' ? (v as number[]).sort((a, b) => a - b)[v.length >> 1] : [...new Set(v)].join('/');
  };
  report.boots = rows;
  report.bootMedian = rows.length ? Object.fromEntries(Object.keys(rows[0]).map((k) => [k, med(k)])) : null;
}

async function measures() {
  const then = opt('--then', '');
  if (then) report.then = await run(readFileSync(then, 'utf8'));
  await sleep(3000);
  await shot('island');
  report.idle = await runAsync(FRAMES, 5000);
  report.engine = await run('const s = window.__world3d && window.__world3d.stats(); return s && { fps: s.fps, cpu: s.cpu, gap: s.gap, calls: s.calls, tris: s.tris, dpr: s.dpr, why: s.why };');
  // a scroll up the island (the camera's own pan, as a finger's) and back, its frames meanwhile
  report.scroll = await runAsync(`const done = arguments[0]; const w = window.__world3d; const l = w.limits(); let k = 0;
    const t = []; (function f(now) { t.push(now); k++; w.pan(6); if (k < 150) requestAnimationFrame(f); else {
      const g = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b); done({ fps: Math.round((t.length - 1) / ((t[t.length - 1] - t[0]) / 1000)), p95: +(g[Math.floor(0.95 * g.length)] || 0).toFixed(1), long: g.filter((x) => x > 50).length, camZ: Math.round(w.view().camZ), max: Math.round(l.max) }); } })(performance.now());`);
  await sleep(800);
  await shot('scrolled');
  // けんこう and ごはん over the island (the HUD's buttons): what the island draws meanwhile (none: it pauses), the
  // CSS animations still running anywhere, and the sheet's own scroll (down and back by rAF steps, its frames)
  const quiet = async () => runAsync<{ drawn: number; anims: number }>(`const done = arguments[0]; const w = window.__world3d, f0 = w.stats().frames;
    setTimeout(() => done({ drawn: +((w.stats().frames - f0) / 4).toFixed(1), anims: document.getAnimations().filter((a) => a.playState === 'running').length }), 4000);`);
  const scrollSheet = async (sel: string) => runAsync<{ fps: number; p95: number; long: number }>(`const [sel, done] = arguments; const el = document.querySelector(sel);
    const max = el.scrollHeight - el.clientHeight, t = []; let dir = 1;
    (function f(now) { t.push(now); el.scrollTop += dir * 12; if (el.scrollTop >= max - 1) dir = -1; else if (el.scrollTop <= 0) dir = 1;
      if (now - t[0] < 4000) requestAnimationFrame(f); else { const g = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b);
        done({ fps: Math.round((t.length - 1) / ((t[t.length - 1] - t[0]) / 1000)), p95: +(g[Math.floor(0.95 * g.length)] || 0).toFixed(1), long: g.filter((x) => x > 50).length }); } })(performance.now());`, sel);
  const waitFor = async (sel: string) => {
    for (let i = 0; i < 40 && !(await run<boolean>(`return !!document.querySelector(${JSON.stringify(sel)});`)); i++) await sleep(250);
    await sleep(1500);
  };
  report.islandIdle = await quiet();
  const sheets: Record<string, unknown> = {};
  await run(`document.querySelector('.hud-health').click();`);
  await waitFor('dialog[open] [data-health-sheet] .health .mc');
  sheets.health1w = { idle: await quiet(), scroll: await scrollSheet('dialog[open] [data-health-sheet]') };
  await shot('health');
  await run(`const s = document.querySelector('dialog[open] select[data-pick=period]'); s.value = 'year'; s.dispatchEvent(new Event('change', { bubbles: true }));`);
  await sleep(1500);
  sheets.health1y = { idle: await quiet(), scroll: await scrollSheet('dialog[open] [data-health-sheet]') };
  await run(`document.querySelector('dialog[open]').close();`);
  await sleep(1500);
  await run(`document.querySelector('.hud-health').click();`);
  await waitFor('dialog[open] [data-kenkou-tab=food]');
  await run(`document.querySelector('dialog[open] [data-kenkou-tab=food]').click();`);
  await waitFor('dialog[open] [data-food-summary]');
  sheets.foodLog = { idle: await quiet(), scroll: await scrollSheet('dialog[open] [data-food-sheet]') };
  await shot('food');
  await run(`document.querySelector('dialog[open] [data-tab=chart]').click();`);
  await sleep(1500);
  sheets.foodChart = { idle: await quiet(), scroll: await scrollSheet('dialog[open] [data-food-sheet]') };
  await run(`document.querySelector('dialog[open]').close();`);
  report.sheets = sheets;
  report.errors = await run('return window.__iosErrs;');
}

writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
const idle = report.idle as { fps: number; p50: number; p95: number; long: number } | undefined;
const scroll = report.scroll as { fps: number; p95: number; long: number } | undefined;
const md = [
  `# iOS Simulator check, ${report.when}`,
  '',
  `${dev.name}, iOS ${ios}, Safari; ${URL_}`,
  '',
  report.bootMedian ? `- warm launches (median of ${(report.boots as unknown[]).length}): ${JSON.stringify(report.bootMedian)}` : '',
  `- the 3D island: ${report.island3d ? `up in ${report.loadMs} ms` : 'did not come up'}`,
  idle ? `- idle: ${idle.fps} fps (frame p50 ${idle.p50} ms, p95 ${idle.p95} ms), ${idle.long} long frames in 5 s` : '',
  scroll ? `- scrolling: ${scroll.fps} fps (p95 ${scroll.p95} ms), ${scroll.long} long frames` : '',
  report.islandIdle ? `- the island idle: ${(report.islandIdle as { drawn: number }).drawn} frames/s drawn, ${(report.islandIdle as { anims: number }).anims} CSS animations running` : '',
  ...Object.entries((report.sheets ?? {}) as Record<string, { idle: { drawn: number; anims: number }; scroll: { fps: number; p95: number; long: number } }>).map(([k, s]) =>
    `- ${k}: the island draws ${s.idle.drawn} frames/s under it, ${s.idle.anims} CSS animations running; its scroll ${s.scroll.fps} fps (p95 ${s.scroll.p95} ms), ${s.scroll.long} long frames`),
  `- errors: ${(report.errors as string[] | undefined)?.length ? (report.errors as string[]).join('; ') : 'none'}`,
  report.failure ? `- FAILED: ${report.failure}` : '',
  '',
  '![island](island.png) ![scrolled](scrolled.png)'
].filter((l) => l !== '').join('\n');
writeFileSync(join(OUT, 'report.md'), md + '\n');
console.log(md);
console.log(`\n${OUT}`);
if (report.failure || !report.island3d) process.exitCode = 1;
