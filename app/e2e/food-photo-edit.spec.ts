// マイ食品's photo in its editor (components/food/CustomPhoto.svelte, lib/food/photo.ts): 写真を追加 → the photo picked
// (setInputFiles: a portrait JPEG drawn in the page, with an Exif segment saying "rotate 90°" and a GPS position added
// here), the crop (centred, slid by a drag), この範囲にする, 保存: the food's op names it, `POST /img` (route-mocked)
// gets exactly 384×384 bytes with no Exif, no location, the orientation applied; the rows draw it at once. Then
// 写真を変える / 写真を削除. And a 24 MP and a 48 MP photo's decode and make, timed (WebKit: the iPhone's engine).
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { openKenkou } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { RELAY } from './relay.ts';

const ORIGIN = RELAY.replace(/\/api$/, '');
const dlg = (page: Page) => page.locator('dialog[open]');
const sheet = (page: Page) => page.locator('dialog[open] :is(.titlebar, [data-food-sheet])');
const slid = (page: Page) => dlg(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))));

/** A `w`×`h` JPEG drawn in the page: its top half red, its bottom half blue. */
async function drawn(page: Page, w: number, h: number, q = 0.9): Promise<Buffer> {
  const b64 = await page.evaluate(async ([w, h, q]) => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#ff0000';
    g.fillRect(0, 0, w, h / 2);
    g.fillStyle = '#0000ff';
    g.fillRect(0, h / 2, w, h / 2);
    const b = await new Promise<Blob>((ok) => cv.toBlob((x) => ok(x!), 'image/jpeg', q));
    const u = new Uint8Array(await b.arrayBuffer());
    let s = '';
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
    cv.width = cv.height = 0;
    return btoa(s);
  }, [w, h, q] as const);
  return Buffer.from(b64, 'base64');
}

/** The JPEG with an APP1 Exif segment after its SOI: Orientation 6 (shown rotated 90° clockwise) and a GPS IFD. */
function withExif(jpeg: Buffer): Buffer {
  const tiff = Buffer.alloc(56);
  tiff.write('MM', 0, 'ascii');
  tiff.writeUInt16BE(42, 2);
  tiff.writeUInt32BE(8, 4);
  tiff.writeUInt16BE(2, 8); // IFD0: 2 entries
  tiff.writeUInt16BE(0x0112, 10); tiff.writeUInt16BE(3, 12); tiff.writeUInt32BE(1, 14); tiff.writeUInt16BE(6, 18);
  tiff.writeUInt16BE(0x8825, 22); tiff.writeUInt16BE(4, 24); tiff.writeUInt32BE(1, 26); tiff.writeUInt32BE(38, 30);
  tiff.writeUInt32BE(0, 34);
  tiff.writeUInt16BE(1, 38); // GPS IFD: GPSLatitudeRef 'N'
  tiff.writeUInt16BE(0x0001, 40); tiff.writeUInt16BE(2, 42); tiff.writeUInt32BE(2, 44); tiff.write('N\0', 48, 'ascii');
  tiff.writeUInt32BE(0, 52);
  const body = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff]);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, (body.length + 2) >> 8, (body.length + 2) & 0xff]), body]);
  return Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]);
}

/** A picture's metadata segments and size (JPEG's APP1/APP13, its frame; WebP's EXIF/XMP chunks, its frame). */
function inspect(b: Buffer): { type: string; w: number; h: number; meta: string[] } {
  const meta: string[] = [];
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2, w = 0, h = 0;
    while (i < b.length && b[i] === 0xff) {
      const m = b[i + 1];
      if (m === 0xda) break;
      const len = b.readUInt16BE(i + 2);
      if (m === 0xe1 || m === 0xed) meta.push(`APP${m - 0xe0}`);
      if (m >= 0xc0 && m <= 0xc2) (h = b.readUInt16BE(i + 5)), (w = b.readUInt16BE(i + 7));
      i += 2 + len;
    }
    return { type: 'jpeg', w, h, meta };
  }
  let i = 12, w = 0, h = 0;
  while (i + 8 <= b.length) {
    const tag = b.toString('ascii', i, i + 4), n = b.readUInt32LE(i + 4), d = i + 8;
    if (tag === 'EXIF' || tag === 'XMP ') meta.push(tag);
    if (tag === 'VP8 ') (w = b.readUInt16LE(d + 6) & 0x3fff), (h = b.readUInt16LE(d + 8) & 0x3fff);
    if (tag === 'VP8L') { const x = b.readUInt32LE(d + 1); w = (x & 0x3fff) + 1; h = ((x >>> 14) & 0x3fff) + 1; }
    if (tag === 'VP8X') { if (b[d] & 0x0c) meta.push('VP8X-meta'); w = b.readUIntLE(d + 4, 3) + 1; h = b.readUIntLE(d + 7, 3) + 1; }
    i = d + n + (n & 1);
  }
  return { type: 'webp', w, h, meta };
}

/** The editor's 96 px box after 「この範囲にする」: its preview loaded and faded in (opacity 1), and on the screen (the
 *  box's own screenshot) its left quarter blue-ish and its right quarter red-ish: the picture painted, not the tile. */
async function previewPainted(page: Page, s: ReturnType<typeof sheet>) {
  const img = s.locator('[data-photo-box] img');
  await expect(s.locator('[data-photo-box] [data-thumb]')).toHaveAttribute('data-thumb', 'img');
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0 && getComputedStyle(i).opacity === '1')).toBe(true);
  const png = (await s.locator('[data-photo-box] [data-thumb]').screenshot()).toString('base64');
  return page.evaluate(async (png) => {
    const im = new Image();
    im.src = `data:image/png;base64,${png}`;
    await im.decode();
    const cv = document.createElement('canvas');
    cv.width = im.width;
    cv.height = im.height;
    const g = cv.getContext('2d')!;
    g.drawImage(im, 0, 0);
    const at = (fx: number) => Array.from(g.getImageData(Math.round(im.width * fx), Math.round(im.height / 2), 1, 1).data.slice(0, 3));
    return { left: at(0.25), right: at(0.75) };
  }, png);
}

/** A's phone on a record of its own (e2e/record.ts), its ごはん's new custom food open; `POST /img` answered here. */
async function openCustom(browser: Browser, project: string) {
  const rec = newRecord();
  const context = await browser.newContext({ ...(project === 'webkit' ? { viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true } : { viewport: { width: 393, height: 852 }, hasTouch: true }), locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, 'A');
  const uploads: { id: string; b: Buffer }[] = [];
  const page = await context.newPage();
  await page.route(`${ORIGIN}/img?id=*`, async (r) => {
    uploads.push({ id: new URL(r.request().url()).searchParams.get('id') ?? '', b: r.request().postDataBuffer() ?? Buffer.alloc(0) });
    await r.fulfill({ status: 200, json: { ok: true }, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.goto('');
  await islandUp(page);
  await openKenkou(page, 'food');
  const s = sheet(page);
  await s.locator('[data-add=l]').tap();
  await slid(page);
  await s.locator('[data-custom-new]').first().tap();
  await slid(page);
  await expect(s.locator('[data-custom-level=edit]')).toBeVisible();
  return { page, s, uploads, rec };
}

test('写真を追加: picked, cropped, saved with the food; the upload is 384 px with no Exif or location, the orientation applied', async ({ browser }, info) => {
  const { page, s, uploads, rec } = await openCustom(browser, info.project.name);
  const photo = s.locator('[data-custom-photo]');
  await expect(photo).toHaveAttribute('data-custom-photo', 'none');
  await expect(s.locator('[data-photo-box]')).toHaveText('写真を追加');
  // (shown, not just there: the word and its camera drawn in the box, in ink, not a transparent or zero-size line)
  await expect(s.locator('[data-photo-box] span')).toBeVisible();
  await expect(s.locator('[data-photo-box] svg')).toBeVisible();
  expect(await s.locator('[data-photo-box] span').evaluate((e) => { const c = getComputedStyle(e); return c.visibility === 'visible' && c.opacity === '1' && !/rgba\(.*, 0\)$/.test(c.color); })).toBe(true);
  await page.screenshot({ path: `/tmp/food-review/shots/photo-empty-${info.project.name}.png` });
  // (no `capture`: iOS offers the library and the camera both)
  await expect(s.locator('[data-photo-input]')).toHaveAttribute('accept', 'image/*');
  expect(await s.locator('[data-photo-input]').getAttribute('capture')).toBeNull();
  // a 300×400 photo stored sideways (Orientation 6: shown 400×300, its top half on the right), with a GPS position
  const file = withExif(await drawn(page, 300, 400));
  await s.locator('[data-photo-input]').setInputFiles({ name: 'IMG_0001.jpg', mimeType: 'image/jpeg', buffer: file });
  const frame = s.locator('[data-photo-crop] [role=slider]');
  await expect(frame).toHaveAttribute('aria-valuenow', '50');
  await page.screenshot({ path: `/tmp/food-review/shots/photo-crop-${info.project.name}.png` });
  await frame.press('ArrowRight');
  await expect(frame).toHaveAttribute('aria-valuenow', '60');
  await frame.press('ArrowLeft');
  await s.locator('[data-photo-use]').tap();
  await expect(photo).toHaveAttribute('data-custom-photo', 'new');
  // the preview drawn at once: the square as made (the orientation applied: blue left, red right), not the grey tile
  const shown = await previewPainted(page, s);
  expect(shown.right[0]).toBeGreaterThan(150);
  expect(shown.right[2]).toBeLessThan(150);
  expect(shown.left[2]).toBeGreaterThan(150);
  expect(shown.left[0]).toBeLessThan(150);
  await s.locator('[data-custom-n]').fill('写真のテスト');
  await s.locator('[data-custom-k]').fill('300');
  await s.locator('[data-custom-save]').evaluate((b) => Promise.all(b.getAnimations().map((a) => a.finished.catch(() => {}))));
  await page.screenshot({ path: `/tmp/food-review/shots/photo-editor-${info.project.name}.png` });
  await s.locator('[data-custom-save]').tap();
  await expect.poll(() => uploads.length, { timeout: 15_000 }).toBe(1);
  const up = inspect(uploads[0].b);
  expect(up).toMatchObject({ w: 384, h: 384, meta: [] });
  expect(uploads[0].b.length).toBeLessThanOrEqual(65_536);
  expect(uploads[0].b.includes(Buffer.from('Exif\0'))).toBe(false);
  // the food's op names it (the id the bytes' hash), kept by the record
  const op = rec.sent.find((x) => x.type === 'food_custom');
  expect(op).toMatchObject({ ok: true, data: { n: '写真のテスト', img: uploads[0].id } });
  expect(op!.data).not.toHaveProperty('ig');
  // its row in マイ食品 draws it at once (from its bytes)
  await expect(s.locator('[data-food-customs] [data-thumb]').first()).toHaveAttribute('data-thumb', 'img', { timeout: 15_000 });
  // the orientation applied: shown 400×300 with the red half on the right, so the centred square's right is red
  const px = await page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bm = await createImageBitmap(new Blob([bytes]));
    const cv = new OffscreenCanvas(bm.width, bm.height), g = cv.getContext('2d')!;
    g.drawImage(bm, 0, 0);
    const at = (x: number, y: number) => Array.from(g.getImageData(x, y, 1, 1).data.slice(0, 3));
    return { left: at(40, 192), right: at(344, 192) };
  }, uploads[0].b.toString('base64'));
  expect(px.right[0]).toBeGreaterThan(200);
  expect(px.right[2]).toBeLessThan(60);
  expect(px.left[2]).toBeGreaterThan(200);
  expect(px.left[0]).toBeLessThan(60);
  console.log(`${info.project.name}: the photo ${up.type} ${uploads[0].b.length} B`);
});

test('写真を変える / 写真を削除 on a saved one; やめる keeps it as it was', async ({ browser }, info) => {
  const { page, s } = await openCustom(browser, info.project.name);
  await s.locator('[data-photo-input]').setInputFiles({ name: 'a.jpg', mimeType: 'image/jpeg', buffer: await drawn(page, 640, 480) });
  await s.locator('[data-photo-use]').tap();
  const photo = s.locator('[data-custom-photo]');
  await expect(photo).toHaveAttribute('data-custom-photo', 'new');
  await s.locator('[data-photo-box]').tap();
  await expect(s.locator('[data-photo-change]')).toHaveText('写真を変える');
  await page.screenshot({ path: `/tmp/food-review/shots/photo-menu-${info.project.name}.png` });
  await s.locator('[data-photo-input]').setInputFiles({ name: 'b.jpg', mimeType: 'image/jpeg', buffer: await drawn(page, 480, 640) });
  await s.locator('[data-photo-cancel]').tap();
  await expect(photo).toHaveAttribute('data-custom-photo', 'new');
  await s.locator('[data-photo-box]').tap();
  await s.locator('[data-photo-remove]').tap();
  await expect(photo).toHaveAttribute('data-custom-photo', 'none');
  // not an image: said so, nothing changed
  await s.locator('[data-photo-input]').setInputFiles({ name: 'x.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not a picture') });
  await expect(s.locator('[data-photo-bad]')).toBeVisible();
  await expect(photo).toHaveAttribute('data-custom-photo', 'none');
});

test('a large library photo (24 MP, 48 MP): decoded and made, timed', async ({ browser }, info) => {
  const { page, s } = await openCustom(browser, info.project.name);
  for (const [w, h] of [[6000, 4000], [8000, 6000]]) {
    const big = await drawn(page, w, h, 0.85);
    await s.locator('[data-photo-input]').setInputFiles({ name: 'big.jpg', mimeType: 'image/jpeg', buffer: big });
    const was = await s.locator('[data-custom-photo]').getAttribute('data-photo-ms');
    await s.locator('[data-photo-use]').tap({ timeout: 60_000 });
    await expect.poll(() => s.locator('[data-custom-photo]').getAttribute('data-photo-ms'), { timeout: 60_000 }).not.toBe(was);
    const ms = await s.locator('[data-custom-photo]').getAttribute('data-photo-ms');
    console.log(`${info.project.name}: ${(w * h) / 1e6} MP (${Math.round(big.length / 1024)} KB): decode ms, make ms, bytes ${ms}`);
    expect(ms).toMatch(/^\d+,\d+,\d+$/);
  }
});
