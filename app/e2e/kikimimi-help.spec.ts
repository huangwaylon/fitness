// ききみみ's Japanese help (docs/kikimimi.md "Japanese help"): a fixture's cja, why and ctx over the bank's items (the
// test hook `__kiki.deck(ids, help)`, as にがて れんしゅう deals them; never shipped): the situation under the speaker
// before the reveal, each choice's Japanese under it at the reveal (a dialogue's marked ones), 解説 under the verdict,
// and the same in the review list's open row; an item without them shows none. The logic tier (no clip has to sound).
// KIKI_SHOTS=1 writes the 393×852 screenshot pass into /tmp/kikimimi-shots/ja-help/.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { runToQuestion } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';
const SHOTS = process.env.KIKI_SHOTS ? '/tmp/kikimimi-shots/ja-help' : null;

type Help = { cja?: string[]; why?: string; ctx?: string };
type Kiki = { view(): { phase: string; i: number }; right(): number; deck(ids: string[], help?: Record<string, Help>): void; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');

/** The fixture's help, cja in the choices' authored order (the deck deals these as given). */
const HELP: Record<string, Help> = {
  'r4-name': {
    ctx: 'にぎやかな レストランで、店員が 聞いてきました',
    cja: ['4人です。タナカで予約しています。', 'うん、最高のパーティーだね！', 'うん、今夜は本当にうるさいね。'],
    why: '「party」はここでは「一行・人数」。何名かを聞かれているので人数で答えます。うるさい話に乗るのはわな。'
  },
  'd4-oat-latte': {
    ctx: 'カフェで、注文と違う飲み物が出てきました',
    cja: ['大丈夫です、急いでないので。', 'すみません、作り直します。', 'はい、アイスのほうです。'],
    why: '「Lemme remake it」は店員の申し出。客は「急いでない」と気づかいで返すのが自然です。'
  }
};
const IDS = ['r4-name', 'd4-oat-latte', 'w4-lemme'];
/** The bank's items carry their own help now: w4-lemme's cleared (null over each field) for the none-where-missing case. */
const CLEAR = { 'w4-lemme': { cja: null, why: null, ctx: null } };

async function snap(p: Page, name: string, fullPage = false) {
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}

test('the Japanese help: the situation before the clip, the choices’ Japanese and 解説 at the reveal and in the review; none where missing', async ({ page }) => {
  await page.clock.install(); // (the plays stepped through: kikimimi-nav.ts runUntil)
  await page.goto(`?demo&${Q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await page.evaluate(([ids, help]) => (window as unknown as { __kiki: Kiki }).__kiki.deck(ids as string[], help as unknown as Record<string, Help>), [IDS, { ...HELP, ...CLEAR }] as const);
  await expect.poll(() => kiki(page, (k) => k.items())).toEqual(IDS);

  for (const [i, id] of IDS.entries()) {
    const h = HELP[id];
    await runToQuestion(page, i, 'answer');
    // before the reveal: the situation under the speaker, no Japanese under the choices yet
    if (h?.ctx) await expect(sheet(page).locator('[data-kiki-ctx]')).toHaveText(h.ctx);
    else await expect(sheet(page).locator('[data-kiki-ctx]')).toHaveCount(0);
    await expect(sheet(page).locator('[data-kiki-cja], [data-kiki-why]')).toHaveCount(0);
    await snap(page, `${i + 1}-${id}-play`);
    const right = await kiki(page, (k) => k.right());
    // the first one missed (the review opens on it), the others right
    const pick = i === 0 ? (right + 1) % 3 : right;
    await sheet(page).locator(`[data-choice="${pick}"]`).click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator('[data-kiki-ctx]')).toHaveCount(0);
    if (h) {
      // each shown choice's Japanese under its English, aligned (a dialogue's: only the right one and my pick)
      const shown = await sheet(page).locator('[data-choice]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-choice'))));
      expect(shown.length).toBe(id === 'd4-oat-latte' ? 1 : 3);
      for (const k of shown) await expect(sheet(page).locator(`[data-choice="${k}"] [data-kiki-cja]`)).toHaveText(h.cja![k]);
      const why = sheet(page).locator('[data-kiki-why]');
      await expect(why).toContainText('解説');
      await expect(why).toContainText(h.why!);
      // 解説 under the verdict, above the choices
      const [v, w, c] = await Promise.all(['[data-kiki-verdict]', '[data-kiki-why]', '[data-choice]'].map((s) => sheet(page).locator(s).first().boundingBox()));
      expect(v!.y).toBeLessThan(w!.y);
      expect(w!.y).toBeLessThan(c!.y);
    } else await expect(sheet(page).locator('[data-kiki-cja], [data-kiki-why]')).toHaveCount(0);
    await snap(page, `${i + 1}-${id}-reveal`, true);
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');

  // the review opens on the miss: every choice with its Japanese, ○ the answer, × my pick, and 解説
  const row = sheet(page).locator('[data-kiki-detail="0"]');
  await expect(row).toBeVisible();
  const opts = row.locator('[data-kiki-opts] li');
  await expect(opts).toHaveCount(3);
  for (const [k, ja] of HELP['r4-name'].cja!.entries()) await expect(opts.nth(k).locator('[data-kiki-cja]')).toHaveText(ja);
  await expect(row.locator('[data-kiki-opts] li[data-mark="right"]')).toHaveCount(1);
  await expect(row.locator('[data-kiki-opts] li[data-mark="wrong"]')).toHaveCount(1);
  await expect(row.locator('[data-kiki-why]')).toContainText(HELP['r4-name'].why!);
  await row.scrollIntoViewIfNeeded();
  await snap(page, '4-review-miss');
  // all the rows: the dialogue's has its help, the plain one none
  await sheet(page).locator('[data-kiki-missed]').click();
  await sheet(page).locator('[data-kiki-row="1"]').click();
  await expect(sheet(page).locator('[data-kiki-detail="1"] [data-kiki-why]')).toContainText(HELP['d4-oat-latte'].why!);
  await expect(sheet(page).locator('[data-kiki-detail="1"] [data-kiki-opts] li')).toHaveCount(3);
  await sheet(page).locator('[data-kiki-row="2"]').click();
  await expect(sheet(page).locator('[data-kiki-detail="2"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-detail="2"] [data-kiki-why], [data-kiki-detail="2"] [data-kiki-opts]')).toHaveCount(0);
  await sheet(page).locator('[data-kiki-detail="1"]').scrollIntoViewIfNeeded();
  await snap(page, '5-review-dialogue');
});
