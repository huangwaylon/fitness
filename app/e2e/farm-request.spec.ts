// おねがい (docs/farming.md "おねがい"): the day's chat or cheer guest wants a vegetable (Chip on Monday 2026-11-16: ウェイ's
// carrot), Franklin on Turkey Day. Its caption over their head; a tap with it in my pocket hands it over in place (a
// sell of the one at its price, the day's garden piece a find); without it, the ask, then a kind word. Wiring only:
// who asks and for what is vegRequest.test's.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, geo, islandUp, tapFigure } from './island.ts';

test.use({ viewport: { width: 393, height: 852 } });
type Seed = [type: string, data: object, who: 'A' | 'B' | 'G'];
const seed = (page: Page, day: string, events: Seed[]) =>
  page.addInitScript(([day, list]) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse(`${day}T09:00:00+09:00`);
    const rows = list.map(([type, data, person], i) => ({ id: `seed-${i}`, type, data, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day, events: rows }));
  }, [day, events] as const);
/** This page's own events of a type (not the seeds'). */
const sent = (page: Page, type: string) => page.evaluate((type) => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{"events":[]}').events as { id: string; type: string; data: Record<string, unknown> }[])
  .filter((e) => e.type === type && !e.id.startsWith('seed-')).map((e) => e.data), type);
/** ウェイ's field (a farmer: the ask comes; the はたけ pill shows). */
const FIELD: Seed = ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 10, z: 17, f: 0, s: 'a-2x2' }, 'A'];
const talk = (page: Page) => page.locator('[data-fx="talk"].placed');

async function up(page: Page, url: string, who: string) {
  await page.goto(url);
  await islandUp(page);
  const { CAMS } = await geo(page);
  await camTo(page, CAMS.mae, false);
  await expect(page.locator(`[data-visitor="${who}"] .art`)).toBeVisible();
}

test('Chip wants a carrot: his caption, and a tap with one in my pocket hands it over (one sold at 18, his garden piece a find)', async ({ page }) => {
  const D = '2026-11-16';
  await seed(page, D, [FIELD, ['tally', { date: D, counts: { 'goods:carrot': 2 } }, 'A']]);
  await up(page, `?demo&date=${D}T12:00&guest=chip&critter=none`, 'chip');
  const chip = page.locator('[data-visitor="chip"]');
  await expect(chip).toHaveAttribute('data-veg-ask', 'carrot');
  await expect(chip.locator('[data-veg-want]')).toHaveText('ニンジンが たべたいなあ');
  await tapFigure(page, '[data-visitor="chip"] .art');
  await expect(talk(page)).toHaveAttribute('aria-label', /^うおまさ: わあ、 ニンジン！ ありがとう！\nおれいに 18かいがら どうぞ それと、 これも うけとって！/);
  await expect(chip.locator('[data-treat]')).toHaveCount(1);
  await expect.poll(() => sent(page, 'sell')).toEqual([{ species: 'goods:carrot', n: 1, v: 18 }]);
  await expect.poll(async () => (await sent(page, 'find')).filter((f) => f.kind === 'item').length).toBe(1);
  // handed over: no more ask (a reload too), and the 畑 sheet says so
  await expect(chip).not.toHaveAttribute('data-veg-ask');
  await page.locator('[data-farm-open]').click();
  await expect(page.locator('[data-farm-ask="carrot"][data-done]')).toHaveText('今日のおねがい：ニンジン（うおまさ）・渡しました');
  await page.reload();
  await islandUp(page);
  await expect(page.locator('[data-visitor="chip"]')).toBeAttached();
  await expect(page.locator('[data-visitor="chip"]')).not.toHaveAttribute('data-veg-ask');
});

test('without the vegetable: the ask, then a kind word, nothing sent', async ({ page }) => {
  // a field of mine and no carrot (a farmer: the ask still comes)
  const D = '2026-11-16';
  await seed(page, D, [FIELD]);
  await up(page, `?demo&date=${D}T12:00&guest=chip&critter=none`, 'chip');
  await tapFigure(page, '[data-visitor="chip"] .art');
  await expect(talk(page)).toHaveAttribute('aria-label', /なんだか ニンジンが\nたべたいなあ…/);
  await tapFigure(page, '[data-visitor="chip"] .art');
  await expect(talk(page)).toHaveAttribute('aria-label', /ニンジン、 まだ ないみたいだね/);
  expect(await sent(page, 'sell')).toEqual([]);
  await expect(page.locator('[data-visitor="chip"]')).toHaveAttribute('data-veg-ask', 'carrot');
  // the 畑 sheet's line, kanji
  await page.locator('[data-farm-open]').click();
  await expect(page.locator('[data-farm-ask="carrot"]')).toHaveText('今日のおねがい：ニンジン（うおまさ）');
  await expect(page.locator('[data-farm-ask][data-done]')).toHaveCount(0);
});

test('Franklin on Turkey Day asks for ウェイ’s pumpkin with his fish, and cooks it when handed over', async ({ page }) => {
  const T = '2026-11-26';
  await seed(page, T, [['tally', { date: T, counts: { 'goods:pumpkin': 1 } }, 'A']]);
  await up(page, `?demo&date=${T}T12:00&visitor=franklin&guest=none&critter=none`, 'franklin');
  await expect(page.locator('[data-visitor="franklin"]')).toHaveAttribute('data-veg-ask', 'pumpkin');
  await tapFigure(page, '[data-visitor="franklin"] .art');
  await expect(talk(page)).toHaveAttribute('aria-label', /^フランクリン: おお！ みずみずしい カボチャ！/);
  await expect.poll(() => sent(page, 'sell')).toEqual([{ species: 'goods:pumpkin', n: 1, v: 18 }]);
});
