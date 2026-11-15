// ごはん's barcode scanner (docs/design.md "Gohan" Barcode; docs/food-data.md "Barcodes"): a meal search's バーコードで探す
// opens the scanner level; the camera is a getUserMedia shim whose stream is a canvas with a real EAN-13 drawn on it,
// read by the real decoder (zxing-wasm, from the build), so the wasm's own path is tested in WebKit too. Our product →
// its amount; not ours → Open Food Facts (its API routed: never the network) → its amount, marked as OFF's; nowhere →
// 名前で探す; the camera refused → typed numbers. The camera's tracks stop on a read, on ‹ and on a hide.
import { expect, test, type Page } from './fixtures.ts';
import { openKenkou } from './hud.ts';
import { hideAndShow } from './memory.ts';

test.use({ viewport: { width: 393, height: 852 } });

const DATE = '2026-11-04T12:30';
/** products.json's: きなこ豆 (中西ピーナッツ), 1食分 100 g. Not ours: a cola's code (OFF's). */
const OURS = '4900000010657';
const OFFS = '4902102072618';
const OFF = 'https://world.openfoodfacts.org/api/v2/product/**';
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

async function openScanner(page: Page) {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none`);
  await expect(page.getByRole('button', { name: 'けんこう', exact: true })).toBeVisible({ timeout: 15_000 });
  await openKenkou(page, 'food');
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
  await page.route(OFF, (r) => (asked.push(r.request().url()), r.abort()));
  await openScanner(page);
  expect(await overflow(page)).toEqual([]);
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
});

test("not ours: Open Food Facts asked for the code only, its item's amount marked as OFF's; logged, the day shows it", async ({ page }) => {
  await camera(page, { code: OFFS });
  const asked: string[] = [];
  await page.route(OFF, (r) => {
    asked.push(r.request().url());
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ code: OFFS, status: 1, product: { product_name: 'コカ・コーラ', brands: 'Coca-Cola', serving_size: '500 ml', serving_quantity: 500, nutriments: { 'energy-kcal_100g': 45, proteins_100g: 0, fat_100g: 0, carbohydrates_100g: 11.3, salt_100g: 0 } } }) });
  });
  await openScanner(page);
  const amount = sheet(page).locator('.amt');
  await expect(amount.locator('h3')).toHaveText('コカ・コーラ', { timeout: 20_000 });
  await expect(amount.locator('[data-food-note]')).toHaveText('Open Food Facts の値（オンライン）');
  await expect(amount.locator('[data-done]')).toContainText('225');
  expect(asked).toEqual([`https://world.openfoodfacts.org/api/v2/product/${OFFS}.json?fields=product_name,product_name_ja,generic_name,brands,nutriments,serving_size,serving_quantity`]);
  await amount.locator('[data-done]').click();
  await sheet(page).locator('[data-food-finish]').click();
  await expect(sheet(page).locator('section[data-meal=b]')).toContainText('コカ・コーラ');
});

test('nowhere: この商品はデータにありません, もう一度 reads again, 名前で探す → the search, its field focused; offline says so', async ({ page }) => {
  await camera(page, { code: OFFS });
  let mode: 'none' | 'off' = 'none';
  await page.route(OFF, (r) => (mode === 'none' ? r.fulfill({ status: 404, contentType: 'application/json', body: '{"status":0}' }) : r.abort()));
  await openScanner(page);
  await expect(status(page)).toHaveText('この商品はデータにありません', { timeout: 20_000 });
  await expect(scanLv(page).locator('[data-scan-code]')).toHaveText(OFFS);
  expect(await overflow(page)).toEqual([]);
  expect(await live(page)).toBe(0);
  mode = 'off';
  await scanLv(page).locator('[data-scan-retry]').click();
  await expect(status(page)).toHaveText('データにありません（オフライン？）', { timeout: 20_000 });
  await scanLv(page).locator('[data-scan-num]').fill('4900000010658');
  await expect(status(page)).toHaveText('番号が正しくありません');
  await expect(scanLv(page).locator('[data-scan-code]'), 'the read code never shown under a wrong typed one').toHaveCount(0);
  await scanLv(page).locator('[data-scan-byname]').click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('朝ごはん');
  await expect(sheet(page).locator('[data-food-q]')).toBeFocused();
});

test('the camera refused: said in the box, a typed number still finds it (13 digits search at once, a wrong 13 said at once); a wrong one says so', async ({ page }) => {
  await camera(page, 'deny');
  await openScanner(page);
  await expect(scanLv(page).locator('[data-scan-cam=denied]')).toContainText('カメラが許可されていません');
  await expect(status(page)).toHaveText('番号を入力しても探せます');
  const num = scanLv(page).locator('[data-scan-num]');
  await num.fill('4900000010658');
  await expect(status(page), '13 digits: said at once').toHaveText('番号が正しくありません');
  await num.fill('49000000');
  await scanLv(page).locator('[data-scan-find]').click();
  await expect(status(page)).toHaveText('番号が正しくありません');
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
