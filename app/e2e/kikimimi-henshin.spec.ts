// 音の へんしん (docs/kikimimi.md "音の へんしん"): the mode on あそぶ's さくっと shelf with its page's list of phenomena (today's
// pressed, another picked and back); a solo drill of 8 phrases, the rounds in turn: 「なんて言った？」 (the full form picked,
// one wrong) and 「書きとり」 (typed in capitals and matched, tapped from tiles, one typed wrong); the reveal's full form
// beside the spelling as said and its three takes; the results' phenomenon, review and takes; my row (gm henshin, level
// 8, the dictation's wrong words as a mask). Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/henshin/. The logic
// tier (Playwright's Chromium is muted).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToQuestion } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/henshin';
const DAY = 'date=2026-11-09T10:00&kikimimi=fast';

const LEVELS = join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels');
type Phrase = { id: string; focus: string; choices: string[]; hs: { red: string; full?: string } };
/** Level 8's phrases as compiled (by id). */
const PHRASES = new Map(((JSON.parse(readFileSync(join(LEVELS, 'index.json'), 'utf8')) as { units: Record<string, { parts: string[] }> }).units['8']?.parts ?? [])
  .flatMap((p) => (JSON.parse(readFileSync(join(LEVELS, 'parts', `${p}.json`), 'utf8')) as { items: Phrase[] }).items).map((it) => [it.id, it] as const));

type Kiki = { view(): { phase: string; i: number; gm: string | null }; items(): string[]; recorded(): { gm?: string; lv: number; r: [string, number, number, number][] } | null };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function snap(p: Page, name: string) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}

async function phone(ctx: BrowserContext, q: string): Promise<Page> {
  await ctx.clock.install();
  const page = await ctx.newPage();
  await page.goto(`?demo&${q}`);
  await islandUp(page);
  return page;
}

/** The current round's phrase. */
async function phrase(p: Page): Promise<Phrase> {
  const [i, ids] = await Promise.all([kiki(p, (k) => k.view().i), kiki(p, (k) => k.items())]);
  return PHRASES.get(ids[i])!;
}

test('solo: the page’s phenomena, a pick and a dictation typed and tapped, the reveal’s takes, the results and my row', async ({ context }) => {
  expect(PHRASES.size).toBeGreaterThanOrEqual(12);
  const page = await phone(context, DAY);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
  await sheet(page).locator('[data-kiki-mode-tile="henshin"]').click();
  await expect(sheet(page).locator('[data-kiki-mode-page="henshin"]')).toBeVisible();
  // the phenomena in order, today's (the first, nothing played) pressed; another picked, then back to today's
  const rows = sheet(page).locator('[data-kiki-henshin-ph]');
  await expect(rows).toHaveCount(15);
  await expect(rows.first()).toHaveAttribute('aria-pressed', 'true');
  await rows.nth(1).click();
  await expect(rows.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-kiki-henshin-today-back]')).toBeVisible();
  await snap(page, 'mode-picked');
  await sheet(page).locator('[data-kiki-henshin-today-back]').click();
  await expect(rows.first()).toHaveAttribute('aria-pressed', 'true');
  await snap(page, 'mode');

  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => kiki(page, (k) => k.view().gm)).toBe('henshin');
  for (let i = 0; i < 8; i++) {
    await runToQuestion(page, i, 'answer');
    const it = await phrase(page);
    const wrong = i === 2 || i === 5;
    if (i % 2 === 0) {
      // 「なんて言った？」: the full form (round 2: another)
      await expect(sheet(page).locator('[data-kiki-henshin-line]')).toBeVisible();
      const want = wrong ? it.choices.find((c) => c !== it.focus)! : it.focus;
      const shown = await sheet(page).locator('[data-choice] .tx').allInnerTexts();
      await sheet(page).locator(`[data-choice="${shown.indexOf(want)}"]`).click();
    } else if (i === 3 || i === 7) {
      // 「書きとり」 with tiles (switched to; round 5 switched back): the words in order
      await sheet(page).locator('[data-kiki-henshin-swap]').click();
      await expect(sheet(page).locator('[data-kiki-henshin-pool]')).toBeVisible();
      for (const w of it.focus.split(' ')) await sheet(page).locator(`[data-tile][data-word="${w.replace(/"/g, '\\"')}"]:not([data-used])`).first().click();
      if (i === 3) await snap(page, 'tiles');
      await sheet(page).locator('[data-kiki-henshin-done]').click();
    } else {
      // 「書きとり」 typed: the full form in capitals (round 5: nonsense, typed after switching back to the keyboard)
      if (i === 5) await sheet(page).locator('[data-kiki-henshin-swap]').click();
      const input = sheet(page).locator('[data-kiki-henshin-input]');
      await input.fill(wrong ? 'zzz' : (it.hs.full ?? it.focus).toUpperCase());
      if (i === 1) await snap(page, 'typed');
      await sheet(page).locator('[data-kiki-henshin-done]').click();
    }
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator(`[data-kiki-verdict="${wrong ? 'wrong' : 'right'}"]`)).toBeVisible();
    await expect(sheet(page).locator('[data-kiki-henshin-form]')).toContainText(it.hs.red);
    await expect(sheet(page).locator('[data-kiki-take]')).toHaveCount(3);
    if (i === 1) {
      await sheet(page).locator('[data-kiki-take="slow"]').click();
      await expect(sheet(page).locator('[data-kiki-henshin-typed]')).toBeVisible();
      await snap(page, 'reveal-typed');
    }
    if (i === 5) await expect(sheet(page).locator('[data-kiki-henshin-words] [data-mark="wrong"]')).toHaveCount(it.focus.split(' ').length);
    await sheet(page).locator('[data-kiki-next]').click();
  }
  // the results: today's phenomenon, the misses open, each with its takes; my row
  await expect(sheet(page).locator('[data-kiki-henshin-today]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-henshin-takes]').first()).toBeVisible();
  await snap(page, 'results');
  await expect.poll(() => kiki(page, (k) => k.recorded())).toMatchObject({ gm: 'henshin', lv: 8 });
  const row = (await kiki(page, (k) => k.recorded()))!;
  expect(row.r).toHaveLength(8);
  expect(row.r.map(([, ok]) => ok)).toEqual([1, 1, 0, 1, 1, 0, 1, 1]);
  const five = PHRASES.get(row.r[5][0])!;
  expect(row.r[5][2]).toBe((1 << five.focus.split(' ').length) - 1);
  expect(row.r[2][2]).toBeGreaterThan(0);
});
