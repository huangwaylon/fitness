// Preview of the baked terrain through the rolling log, exactly as the island draws it (roll.ts's bands and
// quadMatrix), with the official sprites, the cliff's upright face and the live Waterfall
// standing as billboards; plus 2x crops of the flat chunks and close-ups. Usage (from app/):
// node scripts/terrain-preview.ts [--season=summer] [--sprites] → /tmp/world-build/terrain/*.png
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import { band, radiusFor, project, ROLL_DEFAULTS } from '../src/lib/components/island/roll.ts';
import { quadMatrix } from '../src/lib/components/island/geom.ts';
import { BAND_D, BANDS, BUILDINGS, CAMS, CLIFF, FACE_H, FALL_H, GOAL_TREES, PIVOT, PLAN, SCENERY, SKY, TILT, TREE_H, HEDGE_XS, HEDGE_Z } from '../src/lib/components/island/world.ts';

const APP = join(import.meta.dirname, '..');
const OUT = '/tmp/world-build/terrain';
mkdirSync(OUT, { recursive: true });
const season = process.argv.find((a) => a.startsWith('--season='))?.split('=')[1] ?? 'summer';
const withSprites = process.argv.includes('--sprites');
const T = JSON.parse(readFileSync(join(APP, 'src/lib/components/island/terrain.json'), 'utf8'));
const GROUND_W = PLAN.x1 - PLAN.x0;
const chunkUrl = (i: number) => `file://${join(APP, 'static/terrain', season, `${i}.webp`)}`;
const manifest = JSON.parse(readFileSync(join(APP, 'static/art/manifest.json'), 'utf8')).files as Record<string, { w: number; h: number; path?: string }>;
const art = (k: string) => (manifest[k] ? `file://${join(APP, 'static/art', manifest[k].path ?? `${k}.webp`)}` : null);
const sp = (n: string) => `file://${join(APP, 'static/terrain/sprites', `${n}${season === 'winter' ? '-winter' : ''}.webp`)}`;

// ---- crops of the flat chunks (each inside one chunk), decoded from the WebP and zoomed 2x: [name, x0, z0, x1, z1]
const crops: [string, number, number, number, number][] = [
  ['dirt', 120, 200, 270, 300], ['beach', 60, -30, 260, 60], ['dock', 270, -37, 430, 30], ['river', 140, 590, 340, 686],
  ['mouth', -170, 560, 40, 686], ['pond', -10, 730, 110, 810], ['plaza', 120, 700, 340, 830], ['brick', 130, 1160, 280, 1300],
  ['cliff', 10, 1780, 210, 1870], ['falls', 300, 1776, 420, 1870], ['spring', 300, 1960, 430, 2060], ['corner', -60, 2050, 120, 2137],
  ['rivereast', 320, 700, 420, 1040]
];
for (const [name, x0, z0, x1, z1] of crops) {
  const i = Math.floor((z0 - PLAN.z0) / T.chunkD), cz1 = PLAN.z0 + (i + 1) * T.chunkD;
  const px = T.px, w = Math.round((x1 - x0) * px), h = Math.round((Math.min(z1, cz1) - z0) * px);
  const src = join(APP, 'static/terrain', season, `${i}.webp`);
  execFileSync('dwebp', ['-quiet', src, '-crop', String(Math.round((x0 - PLAN.x0) * px)), String(Math.round((cz1 - Math.min(z1, cz1)) * px)), String(w), String(h), '-scale', String(w * 2), String(h * 2), '-o', join(OUT, `${season}-crop-${name}.png`)]);
}

// ---- the live components, server-rendered
const internal = import.meta.resolve('svelte/internal/server');
async function load(name: string) {
  const src = readFileSync(join(APP, 'src/lib/components/island', `${name}.svelte`), 'utf8');
  const { js } = compile(src, { generate: 'server', css: 'injected', filename: `${name}.svelte` });
  const code = js.code.replace(/from ['"]svelte\/internal\/server['"]/g, `from '${internal}'`).replace(/from ['"]svelte\/internal\/disclose-version['"]/g, `from '${import.meta.resolve('svelte/internal/disclose-version')}'`);
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
}
const wash = render(await load('ShoreWash'), { props: { x0: 90, x1: 300 } });
const fall = render(await load('Waterfall'), { props: { night: false, w: CLIFF.fall[1] - CLIFF.fall[0] + 8, h: FALL_H } });

function view(camZ: number, vw: number, vh: number): string {
  const s = vw / 390;
  const R = radiusFor(((PIVOT - SKY) * vh) / s, TILT, 'cylinder');
  const P = { ...ROLL_DEFAULTS, R };
  const pivotPx = PIVOT * vh, horizonPx = SKY * vh;
  const W = GROUND_W * s, H = BAND_D * s;
  const parts: string[] = [];
  for (let i = BANDS - 1; i >= 0; i--) {
    const z0 = PLAN.z0 + i * BAND_D, z1 = z0 + BAND_D;
    const b = band(z0, z1, camZ, P);
    const y0 = pivotPx + b.y * s, top = y0 - b.span * s;
    if (!b.visible || top > vh + 1 || y0 < horizonPx - 2) continue;
    const xc = vw / 2 + (PLAN.x0 + GROUND_W / 2 - P.cx) * s, hn = (W / 2) * b.scaleNear, hf = (W / 2) * b.scaleFar;
    const m = quadMatrix(W, H, [xc - hf, top - 1, xc + hf, top - 1, xc + hn, y0, xc - hn, y0]);
    const c = Math.floor(i / 5), cz1 = PLAN.z0 + (c + 1) * T.chunkD;
    parts.push(`<div class="b" style="width:${W}px;height:${H}px;transform:matrix3d(${m.map((v) => +v.toFixed(6)).join(',')})"><img src="${chunkUrl(c)}" style="width:${W}px;height:${T.chunkD * s}px;top:${-(cz1 - z1) * s}px"></div>`);
  }
  // upright things: official art (with --sprites), and always the fronts, the cliff face and the waterfall
  const things: { x: number; z: number; h: number; src?: string | null; html?: string; flip?: boolean }[] = [];
  if (withSprites) {
    const oak = season === 'autumn' ? 'trees/oak-fall' : `trees/oak-${season}`;
    for (const [x, z] of Object.values(GOAL_TREES)) things.push({ x, z, h: TREE_H, src: art(oak) });
    for (const sc of SCENERY) things.push({ x: sc.x, z: sc.z, h: sc.h, src: art(sc.kind === 'oak' ? oak : sc.key), flip: sc.flip });
    for (const b of BUILDINGS) things.push({ x: b.x, z: b.z, h: b.h, src: art(b.key) });
    for (const x of HEDGE_XS) things.push({ x, z: HEDGE_Z, h: 34, src: art('bushes/red-hibiscus') });
  }
  things.push({ x: (CLIFF.x0 + CLIFF.x1) / 2, z: CLIFF.z0, h: FACE_H, src: sp('cliff-face') });
  things.push({ x: (CLIFF.fall[0] + CLIFF.fall[1]) / 2, z: CLIFF.z0 - 0.5, h: FALL_H, html: fall.body });
  things.sort((a, b) => b.z - a.z);
  for (const t of things) {
    const pr = project(t.x, t.z, camZ, P);
    if (!pr.visible || pr.theta > (TILT * Math.PI) / 180) continue;
    const x = vw / 2 + pr.x * s, y = pivotPx + pr.y * s, h = t.h * pr.scale * s;
    if (y - h > vh || y < horizonPx) continue;
    if (t.html) parts.push(`<div class="up" style="left:${x}px;top:${y}px;--u:${pr.scale * s}px;opacity:${pr.fade}"><div class="anchor">${t.html}</div></div>`);
    else if (t.src) parts.push(`<img class="sp" src="${t.src}" style="left:${x}px;top:${y - h}px;height:${h}px;opacity:${pr.fade};transform:translateX(-50%)${t.flip ? ' scaleX(-1)' : ''}">`);
  }
  return `<!doctype html><html><head>${fall.head}<style>
    html,body{margin:0;overflow:hidden;background:#000}
    .w{position:relative;width:${vw}px;height:${vh}px;overflow:hidden;background:linear-gradient(#2F92F0 0%,#79C9FC ${horizonPx * 0.7}px,#C6EEFF ${horizonPx}px,#3A8EDF ${horizonPx + 1}px)}
    .b{position:absolute;left:0;top:0;overflow:hidden;transform-origin:0 0}
    .b img{position:absolute;left:0;display:block}
    .sp{position:absolute;display:block}
    .up{position:absolute;width:0;height:0}
    .anchor{position:absolute;left:0;bottom:0;translate:-50% 0}
  </style></head><body><div class="w">${parts.join('')}</div></body></html>`;
}

const browser = await chromium.launch({ channel: 'chrome' });
for (const [vw, vh] of [[390, 844], [320, 568]]) {
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
  for (const [name, camZ] of [['mae', CAMS.mae], ['oku', CAMS.oku]] as const) {
    writeFileSync(join(OUT, 'view.html'), view(camZ, vw, vh));
    await page.goto(`file://${join(OUT, 'view.html')}`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT, `${season}-${name}-${vw}${withSprites ? '-sp' : ''}.png`) });
  }
  await page.close();
}
{
  // close-ups through the log at a phone's 3x: the cliff with its face and waterfall (おく), the river and the
  // paths into the plaza (ひろば)
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const s = 1, R = radiusFor((PIVOT - SKY) * 844, TILT, 'cylinder'), P = { ...ROLL_DEFAULTS, R };
  const yAt = (z: number, camZ: number) => PIVOT * 844 + project(195, z, camZ, P).y * s;
  for (const [name, camZ, z0, z1] of [['cliff', CAMS.oku, CLIFF.z0 - 60, CLIFF.z1 + 20], ['clearing', CAMS.oku, 760, 1000]] as const) {
    writeFileSync(join(OUT, 'view.html'), view(camZ, 390, 844));
    await page.goto(`file://${join(OUT, 'view.html')}`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const top = Math.max(0, yAt(z1, camZ) - (name === 'cliff' ? 40 : 0)), bottom = Math.min(844, yAt(z0, camZ) + 6);
    await page.screenshot({ path: join(OUT, `${season}-close-${name}.png`), clip: { x: 0, y: top, width: 390, height: bottom - top } });
  }
  await page.close();
}
{
  // the upright sprites at 4x over a checker and over grass
  const page = await browser.newPage({ viewport: { width: 1700, height: 900 } });
  const raw = (n: string) => `file://${join(APP, 'static/terrain/sprites', `${n}.webp`)}`;
  const row = (n: string, w: number, z = 12) => `<div style="display:flex;gap:24px;align-items:flex-end;margin:12px"><img src="${raw(n)}" style="width:${w * z}px;background:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0 0/16px 16px"><img src="${raw(n + '-winter')}" style="width:${w * z}px;background:#5DBE4A"></div>`;
  writeFileSync(join(OUT, 'sprites.html'), `<body style="margin:0;background:#7a9">${row('bridge-stone', 52)}${row('bridge-log', 34)}${row('dock-front', 60)}<div style="margin:12px"><img src="${raw('cliff-face')}" style="width:1656px;background:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0 0/16px 16px"></div><div style="margin:12px;position:relative;width:1656px;height:200px;overflow:hidden"><img src="${raw('cliff-face')}" style="position:absolute;left:-1000px;width:4968px"></div></body>`);
  await page.goto(`file://${join(OUT, 'sprites.html')}`, { waitUntil: 'load' });
  await page.screenshot({ path: join(OUT, 'sprites.png'), fullPage: true });
  await page.close();
}
{
  // the live components laid flat / upright at 4 px per unit, a few frames: the wash over the beach, the waterfall
  // over the face sprite
  const U = 4;
  const crop = (name: string) => `file://${join(OUT, `${season}-crop-${name}.png`)}`;
  writeFileSync(join(OUT, 'live.html'), `<html><head>${wash.head}${fall.head}</head><body style="margin:0;background:#222">
    <div style="position:relative;width:${200 * U}px;height:${90 * U}px;background:url(${crop('beach')});--u:${U}px">
      <div style="position:absolute;left:${(90 - 60) * U}px;top:${(60 - 16) * U}px">${wash.body}</div></div>
    <div style="position:relative;width:${140 * U}px;height:${44 * U}px;background:#5DBE4A;--u:${U}px;margin-top:8px;overflow:hidden">
      <img src="${sp('cliff-face')}" style="position:absolute;left:${-(290 - CLIFF.x0) * U}px;bottom:${4 * U}px;width:${(CLIFF.x1 - CLIFF.x0) * U}px">
      <div style="position:absolute;left:${(352 - 290) * U}px;bottom:${4 * U}px">${fall.body}</div></div>
  </body></html>`);
  const page = await browser.newPage({ viewport: { width: 800, height: 560 } });
  await page.goto(`file://${join(OUT, 'live.html')}`, { waitUntil: 'load' });
  for (const t of [0, 1, 2]) {
    await page.waitForTimeout(t ? 700 : 300);
    await page.screenshot({ path: join(OUT, `live-${t}.png`) });
  }
  await page.close();
}
await browser.close();
console.log('wrote', OUT);
