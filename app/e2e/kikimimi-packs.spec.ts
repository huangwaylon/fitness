// ききみみ's audio packs (docs/kikimimi-engine.md "Audio"): the lobby fetches its deck's pack from /audio/listen/ whole (on a mode's page),
// once (Pages answers a Range whole: no Range asked, no loose clip), and a clip cut from a pack as built decodes to its length in the page (the 9a spike's
// check, kept: WebKit is the users' Safari). Silent: nothing is played (an OfflineAudioContext decodes; the sound check
// is never tapped). The logic tier.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

const KIKI = join(import.meta.dirname, '../src/lib/kikimimi');
type Pack = { hash: string; slow?: true; clips: [string, number, number][] };
const PACKS = JSON.parse(readFileSync(join(KIKI, 'packs.json'), 'utf8')) as Record<string, Pack>;
const CLIPS = JSON.parse(readFileSync(join(KIKI, 'clips.json'), 'utf8')) as Record<string, { dur: number }>;

test('the lobby fetches its deck’s pack whole, once; a clip cut from it decodes to its length', async ({ page }) => {
  const asked: { url: string; range: boolean }[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/audio/')) asked.push({ url: r.url(), range: !!r.headers().range });
  });
  await page.goto('?demo&date=2026-11-04T12:00&kikimimi=fast');
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  const sheet = page.locator('dialog[open] [data-kikimimi]');
  await expect(sheet).toHaveAttribute('data-phase', 'lobby');
  await expect(sheet.locator('[data-kiki-page="hub"]')).toBeVisible(); // (my lobby at level 1, the default)
  // a look at the hub or あそぶ's list fetches no pack (no game there to start); a mode's page fetches its deck's
  // first question's: whole and once (lib/packStore.ts), the rest at はじめる (clipPlayer follow)
  const listen = () => asked.filter((a) => a.url.includes('/audio/listen/'));
  expect(listen()).toEqual([]);
  await sheet.locator('[data-kiki-tile="asobu"]').click();
  await expect(sheet.locator('[data-kiki-mode-tile="quiz"]')).toBeVisible();
  expect(listen(), 'none at あそぶ (review 11/10 r2: its lobby deck\'s lv1, 0.66 MB, never played from there)').toEqual([]);
  await sheet.locator('[data-kiki-mode-tile="quiz"]').click();
  await expect(sheet.locator('[data-kiki-start]')).toBeVisible();
  const packOf = (id: string) => Object.keys(PACKS).find((n) => !PACKS[n].slow && PACKS[n].clips.some(([c]) => c === id || c.startsWith(`${id}-`)))!;
  const first = packOf((await page.evaluate(() => (window as unknown as { __kiki: { items(): string[] } }).__kiki.items()))[0]);
  const url = `/audio/listen/${first}.${PACKS[first].hash}.pak`;
  await expect.poll(() => asked.filter((a) => a.url.endsWith(url)).length).toBe(1);
  expect(listen().map((a) => new URL(a.url).pathname)).toEqual([url]);
  expect(asked.filter((a) => a.range || a.url.includes('?s=') || a.url.includes('/audio/kikimimi/'))).toEqual([]);

  // a clip from a few packs (level 1 and its slow pack, a level-4 part, a ladder rung, a unit's), sliced and decoded
  const pick = ['lv1', 'lv1-slow', 'lv4-2', 'ladder', 'u-gl-clarify'].filter((n) => PACKS[n]);
  const cases = pick.map((n) => {
    const [id, offset, bytes] = PACKS[n].clips[1] ?? PACKS[n].clips[0];
    return { url: `audio/listen/${n}.${PACKS[n].hash}.pak`, offset, bytes, id, slow: !!PACKS[n].slow };
  });
  const got = await page.evaluate(async (cs) => {
    const ctx = new OfflineAudioContext(1, 1, 24000);
    const out: { id: string; dur: number; ms: number }[] = [];
    for (const c of cs) {
      const pack = await (await fetch(c.url)).arrayBuffer();
      const t0 = performance.now();
      const buf = await ctx.decodeAudioData(pack.slice(c.offset, c.offset + c.bytes));
      out.push({ id: c.id, dur: buf.duration, ms: performance.now() - t0 });
    }
    return out;
  }, cases);
  for (const [k, g] of got.entries()) {
    if (cases[k].slow) expect(g.dur, g.id).toBeGreaterThan(CLIPS[g.id].dur); // the 🐢 take: 0.75×
    else expect(Math.abs(g.dur - CLIPS[g.id].dur), g.id).toBeLessThan(0.06);
  }
});
