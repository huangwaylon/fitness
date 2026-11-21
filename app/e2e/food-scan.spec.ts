// ごはん's barcode scanner (docs/design.md "Gohan" Barcode; docs/food-data.md "Barcodes"): a meal search's バーコードで探す
// opens the scanner level; the camera is a getUserMedia shim whose stream is a canvas with a real EAN-13 drawn on it,
// read by the real decoder (zxing-wasm, from the build), so the wasm's own path is tested in WebKit too. Our product →
// its amount; in a barcode shard (static/food/jan/, routed) → its amount; else Open Food Facts (its API routed: never
// the network) → its amount, marked as OFF's; nowhere →
// 名前で探す; the camera refused → typed numbers. The camera's tracks stop on a read, on ‹, on ✕, on a hide and after a
// minute without a read (タップして再開).
import { expect, test, type Locator, type Page } from './fixtures.ts';
import { openKenkou } from './hud.ts';
import { hideAndShow } from './memory.ts';

test.use({ viewport: { width: 393, height: 852 } });

const DATE = '2026-11-04T12:30';
/** products.json's: きなこ豆 (中西ピーナッツ), 1食分 100 g. Not ours: a cola's code (OFF's). */
const OURS = '4900000010657';
const OFFS = '4902102072618';
const OFF = 'https://world.openfoodfacts.org/api/v2/product/**';
const SHARDS = '**/food/jan/*.json*';
/** The barcode shards routed: none (404: the code beyond them, on to OFF), or `items` in every one asked for. */
const shards = (page: Page, items: object[] = []) => page.route(SHARDS, (r) => (items.length
  ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ source: 'off', idPrefix: 'off:', cols: Object.fromEntries(Object.keys(items[0]).map((k) => [k, items.map((it) => (it as Record<string, unknown>)[k])])) }) })
  : r.fulfill({ status: 404, body: '' })));
const sheet = (page: Page) => page.locator('dialog[open] :is(.titlebar, [data-food-sheet])');
const scanLv = (page: Page) => sheet(page).locator('[data-food-scan-level]');
const status = (page: Page) => scanLv(page).locator('[data-scan-status]');

/** The camera: `code` drawn as an EAN-13 on a canvas (its stream the camera's), or refused (`deny`). Every track handed
 *  out is kept on `window.__scanTracks` (its readyState: ended once stopped). */
async function camera(page: Page, cam: { code: string } | 'deny') {
  await page.addInitScript((c) => {
    const w = window as unknown as { __scanTracks: MediaStreamTrack[]; __scanCode: string };
    w.__scanTracks = [];
    w.__scanCode = typeof c === 'string' ? '' : c.code;
    const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
    const R = L.map((s) => [...s].map((b) => (b === '0' ? '1' : '0')).join(''));
    const G = R.map((s) => [...s].reverse().join(''));
    const PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
    const bits = (code: string) => {
      const d = [...code].map(Number);
      let s = '101';
      for (let i = 1; i <= 6; i++) s += (PAR[d[0]][i - 1] === 'L' ? L : G)[d[i]];
      s += '01010';
      for (let i = 7; i <= 12; i++) s += R[d[i]];
      return s + '101';
    };
    const gum = async () => {
      if (c === 'deny') throw new DOMException('Permission denied', 'NotAllowedError');
      const cv = document.createElement('canvas');
      [cv.width, cv.height] = [960, 720];
      const g = cv.getContext('2d')!;
      const draw = () => {
        g.fillStyle = '#fff';
        g.fillRect(0, 0, cv.width, cv.height);
        const code = w.__scanCode;
        if (!code) return;
        const b = bits(code), m = 6, x0 = (cv.width - b.length * m) / 2;
        g.fillStyle = '#000';
        for (let i = 0; i < b.length; i++) if (b[i] === '1') g.fillRect(x0 + i * m, 260, m, 200);
      };
      draw();
      const s = cv.captureStream(15);
      const tick = setInterval(draw, 60);
      for (const t of s.getTracks()) {
        w.__scanTracks.push(t);
        const stop = t.stop.bind(t);
        t.stop = () => (clearInterval(tick), stop());
      }
      return s;
    };
    // (on the prototype: WebKit's navigator.mediaDevices, read this early, isn't the page's later; none at all: given one)
    if (typeof MediaDevices !== 'undefined') MediaDevices.prototype.getUserMedia = gum;
    if (!navigator.mediaDevices) Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: gum }, configurable: true });
  }, cam);
}
/** Every camera track handed out stopped (none still live). */
const live = (page: Page) => page.evaluate(() => (window as unknown as { __scanTracks: MediaStreamTrack[] }).__scanTracks.filter((t) => t.readyState === 'live').length);

/** ‹the meal's search› → バーコードで探す; `opened` runs on ごはん's open, before the search. */
async function openScanner(page: Page, opened?: () => Promise<void>, date = DATE) {
  await page.goto(`?demo&date=${date}&critter=none&visitor=none`);
  await expect(page.getByRole('button', { name: 'けんこう', exact: true })).toBeVisible({ timeout: 15_000 });
  await openKenkou(page, 'food');
  await opened?.();
  await sheet(page).locator('[data-add=b]').click();
  const btn = sheet(page).getByRole('button', { name: 'バーコードで探す' });
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('バーコード');
}
/** What sticks out past the sheet's right edge: nothing. */
const overflow = (page: Page) => page.locator('dialog[open]').evaluate(async (d) => {
  await Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  const right = d.getBoundingClientRect().right;
  return [...d.querySelectorAll('[data-food-scan-level] *')].filter((e) => e.getBoundingClientRect().right > right + 0.5).map((e) => e.className);
});

test('our product: read live, the camera off, its amount (1食分) in the scanner’s place; 追加 → the search, ‹ never the camera', async ({ page }) => {
  await camera(page, { code: OURS });
  const asked: string[] = [];
  const got: string[] = [];
  await page.route(OFF, (r) => (asked.push(r.request().url()), r.abort()));
  await page.route(SHARDS, (r) => (got.push(r.request().url()), r.fulfill({ status: 404, body: '' })));
  // products.json (lazy) held till the code is read: the read waits for it (読み込み中), never 'offline' (a read before
  // the products were indexed fell through to Open Food Facts)
  let release = () => {};
  const held = new Promise<void>((ok) => (release = ok));
  const products: number[] = [];
  await page.route('**/food/products.json*', async (r) => (products.push(Date.now()), await held, r.continue()));
  // (ごはん open, its core catalog fetched at idle: the products not asked for till the search)
  const core = Promise.all(['dishes', 'jbfd'].map((f) => page.waitForResponse(`**/food/${f}.json*`, { timeout: 15_000 })));
  let searched = 0;
  await openScanner(page, async () => {
    await core;
    searched = Date.now();
  });
  expect(await overflow(page)).toEqual([]);
  await expect(status(page), 'the code and the wait on one line').toHaveText(`${OURS} · 読み込み中…`, { timeout: 20_000 });
  await expect(scanLv(page).locator('.band'), 'the flash over, the lookup still going').not.toHaveClass(/\bhit\b/);
  expect(await live(page), 'the camera stopped on the read').toBe(0);
  expect(products.length, 'products.json asked for once').toBe(1);
  expect(products[0], 'products.json asked for by the search, not ごはん’s open').toBeGreaterThanOrEqual(searched);
  release();
  const amount = sheet(page).locator('.amt');
  await expect(amount.locator('h3')).toHaveText('きなこ豆', { timeout: 20_000 });
  await expect(sheet(page).locator('.navbar h2')).toHaveText('朝ごはん');
  await expect(amount.locator('[data-food-note]')).toHaveCount(0);
  expect(await live(page), 'the camera stopped on the read').toBe(0);
  const perf = await page.evaluate(() => {
    const at = (n: string) => performance.getEntriesByName(n).at(-1)?.startTime ?? NaN;
    const dec = performance.getEntriesByName('scan:decode').map((e) => Math.round(e.duration));
    return `open → first frame ${Math.round(at('scan:frame') - at('scan:open'))} ms, → decoder ready ${Math.round(at('scan:live') - at('scan:open'))} ms, → read ${Math.round(at('scan:read') - at('scan:open'))} ms; decodes ${dec.join(', ')} ms`;
  });
  test.info().annotations.push({ type: 'scan', description: perf });
  await amount.locator('[data-done]').click();
  await expect(sheet(page).locator('[data-food-added] [data-added]')).toHaveText([/きなこ豆/]);
  expect(asked, 'ours: Open Food Facts never asked').toEqual([]);
  expect(got, 'ours: no barcode shard asked').toEqual([]);
});

test('a read while the products are arriving (fetched, parsing, indexing): ours found, never offline', async ({ page }) => {
  await camera(page, { code: '' });
  await page.route(OFF, (r) => r.abort());
  await shards(page);
  let release = () => {};
  const held = new Promise<void>((ok) => (release = ok));
  await page.route('**/food/products.json*', async (r) => (await held, r.continue()));
  await openScanner(page);
  await expect.poll(() => page.evaluate(() => performance.getEntriesByName('scan:live').length), { timeout: 20_000 }).toBe(1);
  // (the code shown as the products' bytes land: the read comes while they're parsed and indexed, listed in the
  // catalog before their items are in)
  const got = page.waitForResponse('**/food/products.json*');
  release();
  await got;
  await page.evaluate((c) => ((window as unknown as { __scanCode: string }).__scanCode = c), OURS);
  await expect(sheet(page).locator('.amt h3')).toHaveText('きなこ豆', { timeout: 20_000 });
});

test('in a barcode shard (beyond products.json): its jan/<last 2>.json fetched, its amount; OFF never asked', async ({ page }) => {
  await camera(page, { code: OFFS });
  const asked: string[] = [];
  const got: string[] = [];
  await page.route(OFF, (r) => (asked.push(r.request().url()), r.abort()));
  await shards(page, [{ id: OFFS, name: 'ためしのコーラ', cat: '飲料', kcal: 45, p: 0, f: 0, c: 11.3, salt: 0 }]);
  await page.route(SHARDS, (r) => (got.push(new URL(r.request().url()).pathname), r.fallback()));
  await openScanner(page);
  const amount = sheet(page).locator('.amt');
  await expect(amount.locator('h3')).toHaveText('ためしのコーラ', { timeout: 20_000 });
  await expect(amount.locator('[data-food-note]')).toHaveCount(0);
  await expect(amount.locator('[data-food-check]'), 'a cola’s values: no 表示値を確認').toHaveCount(0);
  expect(got.map((p) => p.replace(/^.*\/food\//, ''))).toEqual(['jan/18.json']);
  await amount.locator('[data-done]').click();
  await expect(sheet(page).locator('[data-food-added] [data-added]')).toHaveText([/ためしのコーラ/]);
  expect(asked, 'a shard’s: Open Food Facts never asked').toEqual([]);
});

test("not ours: Open Food Facts asked for the code only, its item's amount marked as OFF's; logged, the day shows it", async ({ page }) => {
  await camera(page, { code: OFFS });
  await shards(page);
  const asked: string[] = [];
  await page.route(OFF, (r) => {
    asked.push(r.request().url());
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ code: OFFS, status: 1, product: { product_name: 'コカ・コーラ', brands: 'Coca-Cola', serving_size: '500 ml', serving_quantity: 500, nutriments: { 'energy-kcal_100g': 45, proteins_100g: 0, fat_100g: 0, carbohydrates_100g: 11.3, salt_100g: 0 } } }) });
  });
  await openScanner(page);
  const amount = sheet(page).locator('.amt');
  await expect(amount.locator('h3')).toHaveText('コカ・コーラ', { timeout: 20_000 });
  await expect(amount.locator('[data-food-note]')).toHaveText('Open Food Factsの値（オンライン）');
  await expect(amount.locator('[data-done]')).toContainText('225');
  expect(asked).toEqual([`https://world.openfoodfacts.org/api/v2/product/${OFFS}.json?fields=product_name,product_name_ja,generic_name,brands,nutriments,serving_size,serving_quantity`]);
  await amount.locator('[data-done]').click();
  await sheet(page).locator('[data-food-finish]').click();
  await expect(sheet(page).locator('section[data-meal=b]')).toContainText('コカ・コーラ');
});

test('nowhere: この商品はデータにありません, もう一度 reads again, 名前で探す → the search, its field focused; offline says so', async ({ page }) => {
  await camera(page, { code: OFFS });
  await shards(page);
  let mode: 'none' | 'off' = 'none';
  await page.route(OFF, (r) => (mode === 'none' ? r.fulfill({ status: 404, contentType: 'application/json', body: '{"status":0}' }) : r.abort()));
  await openScanner(page);
  await expect(status(page)).toHaveText('この商品はデータにありません', { timeout: 20_000 });
  await expect(scanLv(page).locator('[data-scan-code]')).toHaveText(OFFS);
  expect(await overflow(page)).toEqual([]);
  expect(await live(page)).toBe(0);
  mode = 'off';
  await scanLv(page).locator('[data-scan-retry]').click();
  await expect(status(page)).toHaveText('オフラインのため確認できません', { timeout: 20_000 });
  await expect(scanLv(page).locator('[data-scan-create]'), 'unreached: it may be someone’s, no この商品を登録').toHaveCount(0);
  await scanLv(page).locator('[data-scan-num]').fill('4900000010658');
  await expect(scanLv(page).locator('form [data-scan-bad]'), 'a wrong typed number: said under its field').toHaveText('番号が正しくありません');
  await expect(status(page), 'the status line keeps the lookup’s').toHaveText('オフラインのため確認できません');
  await expect(scanLv(page).locator('[data-scan-code]')).toHaveText(OFFS);
  await expect(scanLv(page).locator('[data-scan-find]'), '探す, level with the field (no sunk disabled)').toHaveText('探す');
  await scanLv(page).locator('[data-scan-num]').fill('');
  await expect(scanLv(page).locator('[data-scan-bad]'), 'typing clears it').toHaveCount(0);
  await scanLv(page).locator('[data-scan-byname]').click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('朝ごはん');
  await expect(sheet(page).locator('[data-food-q]')).toBeFocused();
});

test('a code the reviewed fixes drop (index.json `drop`): not found at once, Open Food Facts never asked for its bad values', async ({ page }) => {
  // Lady Borden at 753 kcal a 100 g (food_fixes.json): OFF still has it so
  const DROPPED = '4953823080093';
  await camera(page, { code: DROPPED });
  await shards(page);
  const asked: string[] = [];
  await page.route(OFF, (r) => (asked.push(r.request().url()), r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, product: { product_name: 'Lady Borden', nutriments: { 'energy-kcal_100g': 753, fat_100g: 47.6 } } }) })));
  await openScanner(page);
  await expect(status(page)).toHaveText('この商品はデータにありません', { timeout: 20_000 });
  await expect(scanLv(page).locator('[data-scan-code]')).toHaveText(DROPPED);
  expect(asked).toEqual([]);
  // the not-found way on: 名前で探す → the search, where its マイ食品 can be made
  await scanLv(page).locator('[data-scan-byname]').click();
  await expect(sheet(page).locator('[data-food-q]')).toBeFocused();
});

test('the camera refused: said in the box, a typed number still finds it (13 digits search at once, a wrong 13 said at once); a wrong one says so', async ({ page }) => {
  await camera(page, 'deny');
  await openScanner(page);
  await expect(scanLv(page).locator('[data-scan-cam=denied]')).toContainText('カメラが許可されていません');
  await expect(status(page)).toHaveText('番号を入力しても探せます');
  const num = scanLv(page).locator('[data-scan-num]');
  const bad = scanLv(page).locator('[data-scan-bad]');
  // (disabled 探す level with the field: not the kit's sunk translate)
  const tops = await scanLv(page).locator('.row').evaluate((r) => [...r.children].map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(tops[1], 'disabled 探す level with the field').toBe(tops[0]);
  await num.fill('4900000010658');
  await expect(bad, '13 digits: said at once').toHaveText('番号が正しくありません');
  await expect(status(page)).toHaveText('番号を入力しても探せます');
  await num.fill('49000000');
  await expect(bad).toHaveCount(0);
  await scanLv(page).locator('[data-scan-find]').click();
  await expect(bad).toHaveText('番号が正しくありません');
  expect(await overflow(page)).toEqual([]);
  await num.fill('');
  await num.pressSequentially(OURS);
  await expect(sheet(page).locator('.amt h3')).toHaveText('きなこ豆', { timeout: 20_000 });
});

test('the camera stops on ‹ and while the page is hidden, and starts again on the show', async ({ page }) => {
  await camera(page, { code: '' });
  await openScanner(page);
  await expect(scanLv(page)).toHaveAttribute('data-phase', 'reading');
  await expect.poll(() => live(page)).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await live(page), 'hidden: stopped').toBe(0);
  await hideAndShow(page);
  await expect.poll(() => live(page), { message: 'shown: live again' }).toBe(1);
  await sheet(page).locator('.navbar').getByRole('button', { name: '戻る' }).click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('朝ごはん');
  expect(await live(page), '‹: stopped').toBe(0);
});

test('the camera stops on ✕ (the sheet closed)', async ({ page }) => {
  await camera(page, { code: '' });
  await openScanner(page);
  await expect.poll(() => live(page)).toBe(1);
  await sheet(page).locator('.navbar').getByRole('button', { name: '閉じる' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(await live(page), '✕: stopped').toBe(0);
});

test('a minute without a read: the camera stops, タップして再開 in the box starts it again', async ({ page }) => {
  await page.clock.install({ time: new Date(`${DATE}:00+09:00`) });
  // (the minute counts from the reading's start, on the page's clock: installed, it flows with the wall's, so the
  // seconds the reading took to show and to be polled for counted too, the 59 s read past the minute on a busy
  // runner, the flake hunt's WebKit. Where it started is read off the page (its first `reading`), the clock held there)
  await page.addInitScript(() => {
    const w = window as unknown as { __readingAt?: number };
    new MutationObserver(() => {
      if (w.__readingAt === undefined && document.querySelector('[data-food-scan-level][data-phase=reading]')) w.__readingAt = Date.now();
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-phase'] });
  });
  await camera(page, { code: '' });
  await openScanner(page);
  await expect(scanLv(page)).toHaveAttribute('data-phase', 'reading');
  await expect.poll(() => live(page)).toBe(1);
  const t0 = await page.evaluate(() => (window as unknown as { __readingAt: number }).__readingAt);
  await page.clock.pauseAt(t0 + 30_000);
  await page.clock.fastForward(29_000);
  expect(await live(page), 'still reading at 59 s').toBe(1);
  await page.clock.fastForward(2_000);
  const resume = scanLv(page).locator('[data-scan-idle]');
  await expect(resume).toHaveText('タップして再開');
  expect(await live(page), 'idle: stopped').toBe(0);
  await page.clock.resume();
  await resume.click();
  await expect(scanLv(page)).toHaveAttribute('data-phase', 'reading');
  await expect.poll(() => live(page), { message: 'resumed: live again' }).toBe(1);
});

/** A tap on the phone (WebKit's iPhone 15), a click on the desktop's Chromium. */
const press = (l: Locator, browserName: string) => (browserName === 'webkit' ? l.tap() : l.click());
/** The cone as Open Food Facts had it till 2026-11-19 (P 3.6 typed 36 a 100 g): 50 g of protein a cone. */
const CONE = '4901005312005';
const BAD = { id: CONE, name: 'ジャイアントコーン', brand: 'Glico', cat: '菓子・デザート', kcal: 176, p: 36, f: 9.3, c: 19.7, salt: 0.1, portions: [{ label: '1袋', g: 140 }] };

for (const [time, tod] of [['12:30', 'day'], ['22:30', 'night']] as const) {
  test(`表示値を確認 (${tod}): a shard’s product with 50 g of protein a cone, said quietly; 直す → マイ食品 prefilled, saved and added`, async ({ page, browserName }, info) => {
    test.skip(tod === 'night' && !process.env.SHOTS, 'SHOTS=<dir> only: the night’s pictures');
    // (the sheet's slides over: its finite animations, never the island's endless ones)
    const settled = () => page.locator('dialog[open]').evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
    // (a level's slide finished first)
    const shot = async (name: string) => {
      if (!process.env.SHOTS) return;
      await settled();
      await page.screenshot({ path: `${process.env.SHOTS}/${name}-${tod}-${info.project.name}.png` });
    };
    await camera(page, { code: CONE });
    await page.route(OFF, (r) => r.abort());
    await shards(page, [BAD]);
    await openScanner(page, undefined, `2026-11-04T${time}`);
    await expect(page.locator('html')).toHaveAttribute('data-tod', tod);
    const amount = sheet(page).locator('.amt');
    await expect(amount.locator('h3')).toHaveText('ジャイアントコーン', { timeout: 20_000 });
    const check = amount.locator('[data-food-check]');
    await expect(check).toContainText('表示値を確認');
    await expect(check).toContainText('たんぱく質が多めに見えます。パッケージと違えば直せます');
    await expect(check).not.toContainText(/誤|正しくありません/);
    // (inside the card: nothing past its right edge)
    const [box, card] = await Promise.all([check.boundingBox(), amount.locator('.head').boundingBox()]);
    expect(box!.x + box!.width).toBeLessThanOrEqual(card!.x + card!.width + 0.5);
    await shot('check');
    await press(check.locator('[data-food-fix]'), browserName);
    const lv = sheet(page).locator('[data-custom-level=edit]');
    await expect(lv.locator('[data-custom-n]')).toHaveValue('ジャイアントコーン');
    await expect(lv.locator('[data-custom-u]')).toHaveValue('1袋');
    await expect(lv.locator('[data-custom-g]')).toHaveValue('140');
    await expect(lv.locator('[data-custom-k]')).toHaveValue('246');
    const nut = (k: string) => lv.locator(`[data-custom-nut=${k}]`);
    expect(await Promise.all(['p', 'fa', 'c', 's'].map((k) => nut(k).inputValue()))).toEqual(['50.4', '13', '27.6', '0.1']);
    // (the editor in place once its slide is over: every card and its 保存 inside the screen, as a マイ食品 opened anew)
    await settled();
    const inside = await lv.evaluate((f) => {
      return [...f.querySelectorAll('.card, [data-custom-save]')].map((e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 0.5; });
    });
    expect(inside.length).toBeGreaterThan(1);
    expect(inside.every(Boolean), 'the editor’s cards inside the screen').toBe(true);
    await shot('fix');
    await nut('p').fill('3.6'); // the package's
    const save = lv.locator('[data-custom-save]');
    await expect(save).toHaveText('保存して追加');
    await press(save, browserName);
    await expect(sheet(page).locator('.navbar h2')).toHaveText('朝ごはん');
    await expect(sheet(page).locator('[data-food-added] [data-added]')).toHaveText([/ジャイアントコーン/]);
    await expect(sheet(page).locator('[data-food-added] [data-added] [data-pick=amount] option:checked')).toHaveText('1袋（140g）');
  });
}

test('直す keeps the product’s barcode: scanned again, my マイ食品 comes first; searched, it stands in the product’s row', async ({ page, browserName }) => {
  await camera(page, { code: CONE });
  await page.route(OFF, (r) => r.abort());
  await shards(page);
  // the cone in products.json (searchable, unlike a shard's), as it shipped before its fix
  const cols = Object.fromEntries(Object.keys(BAD).map((k) => [k, [(BAD as Record<string, unknown>)[k]]]));
  await page.route('**/food/products.json*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ label: 'Open Food Facts', source: 'off', idPrefix: 'off:', cols }) }));
  await openScanner(page);
  const amount = sheet(page).locator('.amt');
  await expect(amount.locator('[data-food-check]')).toContainText('表示値を確認', { timeout: 20_000 });
  await expect(amount.locator('[data-amount-open]'), 'the product: no マイ食品 to open').toHaveCount(0);
  await press(amount.locator('[data-food-fix]'), browserName);
  const lv = sheet(page).locator('[data-custom-level=edit]');
  await lv.locator('[data-custom-n]').fill('コーン（箱の値）');
  await lv.locator('[data-custom-nut=p]').fill('3.6');
  await press(lv.locator('[data-custom-save]'), browserName);
  await expect(sheet(page).locator('[data-food-added] [data-added]')).toHaveText([/コーン（箱の値）/]);
  // scanned again: mine, not the product (its values mine, its editor a tap away)
  await press(sheet(page).getByRole('button', { name: 'バーコードで探す' }), browserName);
  await expect(amount.locator('h3')).toHaveText('コーン（箱の値）', { timeout: 20_000 });
  await expect(amount.locator('[data-amount-open]')).toBeVisible();
  await expect(amount.locator('[data-food-check]'), 'mine: no hint').toHaveCount(0);
  await press(sheet(page).locator('.navbar').getByRole('button', { name: '戻る' }), browserName);
  await expect(sheet(page).locator('.navbar h2')).toHaveText('朝ごはん');
  // searched by the product's name: its row gone, mine in its place (whatever my food is called)
  await sheet(page).locator('[data-food-q]').fill('ジャイアント');
  await expect(sheet(page).locator('[data-food-customs] [data-custom]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-food-customs]')).toContainText('コーン（箱の値）');
  await expect(sheet(page).locator(`[data-item="off:${CONE}"]`)).toHaveCount(0);
});

// Found nowhere (65 % of the scans, food review 11/19): この商品を登録 → a new マイ食品 keeping the code (its name field
// focused in the tap), 保存して追加 back to the search, and the next scan of the code finds it.
for (const [time, tod] of [['12:30', 'day'], ['22:30', 'night']] as const) {
  test(`found nowhere (${tod}): この商品を登録 → a マイ食品 keeping the code, logged; scanned again, mine`, async ({ page, browserName }, info) => {
    test.skip(tod === 'night' && !process.env.SHOTS, 'SHOTS=<dir> only: the night’s pictures');
    const settled = () => page.locator('dialog[open]').evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
    const shot = async (name: string) => {
      if (!process.env.SHOTS) return;
      await settled();
      await page.screenshot({ path: `${process.env.SHOTS}/w4-${name}-${tod}-${info.project.name}.png` });
    };
    await camera(page, { code: OFFS });
    await shards(page);
    await page.route(OFF, (r) => r.fulfill({ status: 404, contentType: 'application/json', body: '{"status":0}' }));
    await openScanner(page, undefined, `2026-11-04T${time}`);
    await expect(status(page)).toHaveText('この商品はデータにありません', { timeout: 20_000 });
    const make = scanLv(page).locator('[data-scan-create]');
    await expect(make).toHaveText('この商品を登録');
    await expect(scanLv(page)).toContainText('次からこのバーコードで見つかります');
    await expect(scanLv(page).locator('[data-scan-num]')).toHaveCount(0); // (a code read: its ways on only)
    await expect(scanLv(page).locator('[data-scan-retry]')).toBeVisible();
    await expect(scanLv(page).locator('[data-scan-byname]')).toBeVisible();
    expect(await overflow(page)).toEqual([]);
    await shot('scan-miss');
    await press(make, browserName);
    const lv = sheet(page).locator('[data-custom-level=edit]');
    await expect(sheet(page).locator('.navbar h2')).toHaveText('新しいマイ食品');
    await expect(lv.locator('[data-custom-n]')).toBeFocused(); // in the tap: the keyboard up for its name
    await expect(lv.locator('[data-custom-jan]')).toHaveText(`バーコード ${OFFS} と一緒に保存します`);
    await lv.locator('[data-custom-n]').fill('ためしのせんべい');
    await lv.locator('[data-custom-k]').fill('120');
    const save = lv.locator('[data-custom-save]');
    await expect(save).toHaveText('保存して追加');
    await shot('scan-create');
    await press(save, browserName);
    await expect(sheet(page).locator('.navbar h2')).toHaveText('朝ごはん');
    await expect(sheet(page).locator('[data-food-added] [data-added]')).toHaveText([/ためしのせんべい/]);
    // scanned again: mine, at once (Open Food Facts not asked)
    await press(sheet(page).getByRole('button', { name: 'バーコードで探す' }), browserName);
    await expect(sheet(page).locator('.amt h3')).toHaveText('ためしのせんべい', { timeout: 20_000 });
    await expect(sheet(page).locator('.amt [data-amount-open]')).toBeVisible();
  });
}
