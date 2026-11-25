// The editor's chrome (the user, 2026-11-25): the connection badge (the socket as it is, the edits the record hasn't
// taken), the names in kanji (layout/labels.ts: the palette, the inspector, the checks; a home by its owner), the
// palette's search (kanji, kana, romaji, English; a phone's keyboard moves nothing), Escape giving up a move (the
// partner's ghost cleared) or a stroke (nothing saved), and a phone's 全体 (the whole island between its bars).
import { expect, test, type Page } from './fixtures.ts';

type E = {
  tileScreen(c: number, r: number): [number, number];
  view(): { s: number; ox: number; oy: number };
  layout(): { objects: Map<string, { id: string; k: string; x: number; z: number; f: number }>; kind(c: number, r: number): string };
};
const DATE = '2026-11-04T12:00';
const ed = <R,>(page: Page, fn: (e: E, a: never) => R, arg?: unknown) => page.evaluate(`(${fn.toString()})(window.__editor, ${JSON.stringify(arg ?? null)})`) as Promise<R>;
const obj = (page: Page, id: string) => ed(page, (e, id: string) => { const o = e.layout().objects.get(id); return o ? { x: o.x, z: o.z, f: o.f } : null; }, id);
const at = (page: Page, c: number, r: number) => ed(page, (e, [c, r]: [number, number]) => e.tileScreen(c, r), [c, r]);
async function open(page: Page, q = '') {
  await page.goto(`editor/?demo&preview=0&date=${DATE}${q}`);
  await page.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
}
/** Three layout ops the record hasn't taken (the write queue: sync/queue.ts), there as the page opens. */
const seedQueue = (page: Page) =>
  page.addInitScript(() => {
    const ev = (i: number) => ({ id: `q${i}`, type: 'decor', data: { sc: 'o', id: `x${i}` }, queuedAt: Date.now(), tries: 0, nextAt: Date.now() + 3_600_000 });
    localStorage.setItem('island.queue', JSON.stringify([ev(1), ev(2), ev(3)]));
  });

test.describe('desktop @chromium', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the badge: ライブ with the edits not yet sent counted', async ({ page }) => {
    await seedQueue(page);
    await open(page);
    await expect(page.locator('[data-status] [data-live]')).toHaveText('ライブ（未送信 3件）');
    await expect(page.locator('[data-status] [data-live]')).toHaveAttribute('data-live', 'on');
  });

  test('the palette: "/" to its search, kana or romaji finds 石灯籠, Enter picks it; placed and inspected in kanji', async ({ page }) => {
    await open(page);
    await page.keyboard.press('/');
    await expect(page.locator('[data-palette-search]')).toBeFocused();
    await page.keyboard.type('いしどう');
    await expect(page.locator('[data-found] [data-kind="stone-lantern"]')).toContainText('石灯籠');
    await page.locator('[data-palette-search]').fill('ishidourou');
    await expect(page.locator('[data-found] [data-kind="stone-lantern"]')).toBeVisible();
    await expect(page.locator('[data-jump]')).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-editor]')).toHaveAttribute('data-tool', 'place');
    const [x, y] = await at(page, 4, 20);
    await page.mouse.click(x, y);
    await page.keyboard.press('Meta+z');
    await expect(page.getByRole('status')).toHaveText('取り消した: 石灯籠を置いた');
    await page.keyboard.press('Meta+Shift+z');
    await expect(page.getByRole('status')).toHaveText('やり直した: 石灯籠を置いた');
    await page.keyboard.press('Escape');
    await page.mouse.click(x, y);
    await expect(page.locator('[data-inspect] h2')).toContainText('石灯籠');
    // the search cleared: the groups back
    await page.locator('[data-palette-search]').fill('');
    await expect(page.locator('[data-jump="tree"]')).toBeVisible();
    await page.locator('[data-palette-search]').fill('zzzq');
    await expect(page.locator('[data-found="0"]')).toContainText('見つかりません');
  });

  test('Escape mid-move puts it back and clears the partner’s ghost; mid-stroke saves nothing', async ({ context }) => {
    const page = await context.newPage(), partner = await context.newPage();
    await page.addInitScript(() => {
      const w = window as unknown as { __drags: { id: string; end?: boolean }[] };
      w.__drags = [];
      const post = BroadcastChannel.prototype.postMessage;
      BroadcastChannel.prototype.postMessage = function (m: { k?: string; m?: { kind?: string; id: string; end?: boolean } }) {
        if (m?.k === 'm' && m.m?.kind === 'drag') w.__drags.push({ id: m.m.id, end: m.m.end });
        return post.call(this, m);
      };
    });
    // (someone else here: a drag's presence goes only to a partner)
    await partner.goto(`editor/?demo&as=B&preview=0&date=${DATE}`);
    await open(page);
    await page.bringToFront();
    const b0 = (await obj(page, 'bench-mae'))!;
    const a = await at(page, b0.x, b0.z), b = await at(page, b0.x + 3, b0.z);
    await page.mouse.move(...a);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(a[0] + ((b[0] - a[0]) * i) / 6, a[1]);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __drags: unknown[] }).__drags.length)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await page.mouse.up();
    expect(await obj(page, 'bench-mae')).toMatchObject({ x: b0.x, z: b0.z });
    await expect.poll(() => page.evaluate(() => (window as unknown as { __drags: { end?: boolean }[] }).__drags.at(-1)?.end)).toBe(true);
    await expect(page.locator('[data-undo]')).toBeDisabled();

    // a sand stroke given up halfway: the lawn as it was, nothing to undo
    await page.keyboard.press('b');
    await page.locator('[data-brush="sand"]').click();
    const kind = (c: number, r: number) => ed(page, (e, [c, r]: [number, number]) => e.layout().kind(c, r), [c, r]);
    expect(await kind(5, 14)).toBe('grass');
    const p = await at(page, 5, 14), q = await at(page, 8, 14);
    await page.mouse.move(...p);
    await page.mouse.down();
    await page.mouse.move(...q, { steps: 6 });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    expect([await kind(5, 14), await kind(7, 14)]).toEqual(['grass', 'grass']);
    await expect(page.locator('[data-undo]')).toBeDisabled();
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });

  test('the badge in the top bar; 全体 fits the island between the bars; another’s home turns only for them (ゲストの家)', async ({ page }) => {
    await seedQueue(page);
    await open(page);
    await expect(page.locator('.top [data-live]')).toHaveText('ライブ · 3件');
    const s0 = await ed(page, (e) => e.view().s);
    await page.locator('[data-fit]').tap();
    await expect.poll(() => ed(page, (e) => e.view().s)).toBeLessThan(s0);
    const top = (await page.locator('.top').boundingBox())!, dock = (await page.locator('.dock').boundingBox())!;
    // the land's first and last rows (a tile in from each end) inside the open plan
    const rows = await ed(page, (e) => {
      const land: number[] = [];
      for (let r = 0; r < 156; r++) if (e.layout().kind(10, r) !== 'sea') land.push(r);
      return [land[0], land.at(-1)!];
    });
    const [, yFront] = await at(page, 10, rows[0]), [, yBack] = await at(page, 10, rows[1]);
    expect(yBack).toBeGreaterThan(top.y + top.height);
    expect(yFront).toBeLessThan(dock.y);

    // as ウェイ (A): ゲストの家 selected and turned says whose it is
    await ed(page, (e) => (e as unknown as { select(ids: string[]): void }).select(['home-G']));
    await expect(page.locator('[data-card] [data-inspect] h2')).toContainText('ゲストの家');
    await page.locator('[data-card] [data-turn]').tap();
    await expect(page.getByRole('status')).toHaveText('ゲストの家はその人だけが回せます');
  });

  test('置く’s search: the keyboard’s typing moves nothing, 鳥居 found by romaji, a tap picks it', async ({ page }) => {
    await open(page);
    await page.locator('[data-dock="place"]').tap();
    const search = page.locator('[data-sheet="palette"] [data-palette-search]');
    await search.tap();
    await expect(search).toBeFocused();
    const y0 = (await search.boundingBox())!.y;
    await page.keyboard.type('torii');
    await expect(page.locator('[data-found] [data-kind="nh-f13631"]')).toContainText('鳥居');
    expect((await search.boundingBox())!.y).toBe(y0);
    const font = await search.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(font, 'no zoom on focus').toBeGreaterThanOrEqual(16);
    await page.locator('[data-found] [data-kind="nh-f13631"]').tap();
    await expect(page.locator('[data-sheet]')).toHaveCount(0);
    await expect(page.locator('[data-card] [data-placing="nh-f13631"]')).toContainText('鳥居');
  });

});
