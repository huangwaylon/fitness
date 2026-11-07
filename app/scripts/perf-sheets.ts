// The sheets' openings, warm (a sibling of perf-start.ts): each run a fresh context, the island loaded, the service
// worker installed and controlling (a reload), then each sheet opened by its HUD button three times round (the first
// opening, then two repeats), closed by Esc between. For each opening, ms from the tap: the dialog seen open (`open`), the
// last change inside it (`settled`), its open animation's end (`anim`); the longest frame (`long`) and the frame time
// over 16.7 ms (`blocked`) in the 1.6 s after the tap, and what changed last (`what`). Then the medians. WebKit as an iPhone 15 (default) or Chromium
// as an iPhone 13 on Metal, not SwiftShader (THROTTLE=4: its CPU 4x slower). Audio is stubbed (never a sound). A desktop's numbers, for an A/B
// of two builds; the phone's are IslandLog's `perf.sheet`. Never in CI.
//   npm run perf:sheets -- <port> [runs] [webkit|chromium]     (the build served: node scripts/serve-build.ts <port>)
import { chromium, devices, webkit, type Page } from '@playwright/test';

const [port = '4694', runs = '3', eng = 'webkit'] = process.argv.slice(2);
const Q = process.env.Q ?? '?demo&date=2026-11-04T12:00';
const SHEETS: [string, string | null, string][] = [
  ['health', null, '.hud-health'],
  ['food', null, '.hud-food'],
  ['travel', '[data-hud-menu]', '[data-hud-travel]'],
  ['wedding', '[data-hud-menu]', '[data-hud-wedding]'],
  ['hiking', '[data-hud-menu]', '[data-hud-hiking]'],
  ['kikimimi', '[data-hud-menu]', '[data-hud-kikimimi]']
];
type Sample = { open: number; settled: number; anim: number; long: number; blocked: number; what?: string };

async function measure(page: Page, menu: string | null, button: string): Promise<Sample> {
  if (menu) {
    await page.tap(menu);
    await page.waitForTimeout(450);
  }
  await page.evaluate(() => {
    const S = { t0: 0, open: 0, last: 0, anim: 0, frames: [] as number[], what: '' };
    (window as unknown as { __sp: typeof S }).__sp = S;
    addEventListener('pointerdown', () => (S.t0 ||= performance.now()), { capture: true, once: true });
    const inOpen = (n: Node) => !!(n instanceof Element ? n : n.parentElement)?.closest('dialog[open]');
    const mo = new MutationObserver((l) => {
      const m = S.t0 ? l.find((x) => inOpen(x.target)) : undefined;
      if (!m) return;
      S.last = performance.now();
      const el = m.target instanceof Element ? m.target : m.target.parentElement;
      S.what = `${m.type}:${m.attributeName ?? ''} ${el?.tagName}.${el?.className}`.slice(0, 80);
    });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    addEventListener('animationend', (e) => {
      if (S.t0 && !S.anim && e.target instanceof HTMLDialogElement) S.anim = performance.now();
    }, { capture: true });
    const f = (t: number) => {
      if (S.t0) {
        S.frames.push(t);
        if (!S.open && document.querySelector('dialog[open]')) S.open = t;
      }
      if (!S.t0 || t - S.t0 < 1600) requestAnimationFrame(f);
      else mo.disconnect();
    };
    requestAnimationFrame(f);
  });
  await page.tap(button);
  await page.waitForTimeout(1800);
  const r = await page.evaluate(() => {
    const S = (window as unknown as { __sp: { t0: number; open: number; last: number; anim: number; frames: number[]; what: string } }).__sp;
    const g = S.frames.slice(1).map((t, i) => t - S.frames[i]);
    const at = (t: number) => (t ? Math.round(t - S.t0) : -1);
    return { open: at(S.open), settled: at(Math.max(S.last, S.open)), anim: at(S.anim), long: Math.round(Math.max(0, ...g)), blocked: Math.round(g.reduce((s, d) => s + Math.max(0, d - 16.7), 0)), what: S.what };
  });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(700);
  return r;
}

const browser = await (eng === 'chromium' ? chromium : webkit).launch(eng === 'chromium' ? { args: ['--mute-audio', '--disable-audio-output', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] } : {});
const all: Record<string, Sample[][]> = Object.fromEntries(SHEETS.map(([n]) => [n, [[], [], []]]));
for (let i = 0; i < Number(runs); i++) {
  const ctx = await browser.newContext({ ...devices[eng === 'chromium' ? 'iPhone 13' : 'iPhone 15'], locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  const page = await ctx.newPage();
  if (eng === 'chromium' && process.env.THROTTLE) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE) });
  // never a sound: no media plays, every audio context stays suspended
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
    for (const k of ['AudioContext', 'webkitAudioContext'] as const) {
      const C = (window as unknown as Record<string, typeof AudioContext | undefined>)[k];
      if (!C) continue;
      C.prototype.resume = function () { return Promise.resolve(); };
      const S = class extends C { constructor(o?: AudioContextOptions) { super(o); void super.suspend(); } };
      (window as unknown as Record<string, unknown>)[k] = S;
    }
  });
  const loaded = () => page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 60_000 });
  await page.goto(`http://127.0.0.1:${port}/${Q}`);
  await loaded();
  await page.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(r, 45_000))]));
  await page.waitForTimeout(3000);
  await page.reload();
  await loaded();
  await page.waitForTimeout(4000);
  const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
  for (let round = 0; round < 3; round++)
    for (const [name, menu, button] of SHEETS) {
      const r = await measure(page, menu, button);
      all[name][round].push(r);
      console.log(JSON.stringify({ run: i, round, name, controlled, ...r }));
    }
  await ctx.close();
}
await browser.close();
const med = (xs: number[]) => xs.sort((a, b) => a - b)[xs.length >> 1];
console.log(`\nmedians (${eng}, ${runs} runs): first open | repeats (rounds 2-3)`);
for (const [name] of SHEETS) {
  const pick = (rs: Sample[], k: Exclude<keyof Sample, 'what'>) => med(rs.map((r) => r[k]));
  const first = all[name][0], rep = [...all[name][1], ...all[name][2]];
  const row = (rs: Sample[]) => (['open', 'settled', 'anim', 'long', 'blocked'] as const).map((k) => `${k} ${pick(rs, k)}`).join(' · ');
  console.log(`${name.padEnd(9)} ${row(first)}  |  ${row(rep)}`);
}
