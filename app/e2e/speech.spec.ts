// The speech test (docs/speech-test.md): reached from English Study's すごろく tab (the new game's screen), its sentences
// stepped through to 自由に話す and round, ‹ back to the tab (the demo has no key: 録音 off with its note). Paired, with
// the island's sound on (its audio session 'ambient', which WebKit refuses the mic under) and the mic stood in
// (e2e/mic.ts): a take recorded, sent as a 16 kHz WAV and shown; a refusal says why. The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { RELAY } from './relay.ts';
import { heldFor, liveTracks, micAsks, standInMic } from './mic.ts';

test.use({ viewport: { width: 393, height: 852 }, hasTouch: true });

test('the speech test: from すごろく, its sentences, back to the tab', async ({ page }) => {
  await page.goto('?demo');
  await islandUp(page);
  await fromMenu(page, 'english');
  await page.locator('dialog[open] [data-en-tab="game"]').click();
  await page.locator('[data-sugoroku] [data-sg-new]').click();
  await page.locator('[data-sugoroku] [data-sg-speech]').click();

  const sp = page.locator('[data-speech]');
  await expect(sp).toBeVisible();
  await expect(page).toHaveURL(/\/speech\?demo/);
  await expect(sp.locator('[data-speech-at]')).toHaveAttribute('data-speech-at', '0');
  await expect(sp.locator('[data-speech-mic]')).toHaveAttribute('aria-disabled', 'true');
  await sp.getByRole('button', { name: '前の文' }).click();
  await expect(sp.locator('[data-speech-at]')).toHaveAttribute('data-speech-at', 'free');
  await sp.getByRole('button', { name: '次の文' }).click();
  await expect(sp.locator('[data-speech-at]')).toHaveAttribute('data-speech-at', '0');

  await sp.getByRole('button', { name: '戻る' }).click();
  await expect(page.locator('[data-sugoroku]')).toBeVisible();
});

test('the speech test from English Study’s ⚙: 音声認識テスト opens it, ‹ back to English Study’s home', async ({ page }) => {
  await page.goto('?demo');
  await islandUp(page);
  await fromMenu(page, 'english', 'tap');
  await page.locator('dialog[open] [data-en-gear]').tap();
  await page.locator('dialog[open] [data-en-speech]').tap();
  const sp = page.locator('[data-speech]');
  await expect(sp).toBeVisible();
  await expect(page).toHaveURL(/\/speech\?demo=?&from=en$/);
  await sp.getByRole('button', { name: '戻る' }).tap();
  await expect(page.locator('dialog[open] [data-english] [data-en-home]')).toBeVisible();
  expect(new URL(page.url()).searchParams.has('from')).toBe(false);
});

/** A paired phone with 効果音 on, on /speech, its /stt answering `text` (the first `drop` uploads never reaching it);
 *  returns the WAVs sent. */
async function paired(page: Page, o: { refuse?: string; drop?: number; viaMenu?: boolean } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('island.key', 'ab'.repeat(16));
    localStorage.setItem('island.sound', JSON.stringify({ music: false, sfx: true, volume: 0.8 }));
  });
  await standInMic(page, o);
  const sent: Buffer[] = [];
  const json = { contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' } };
  await page.routeWebSocket(/\/room/, () => {});
  await page.route(`${RELAY}/**`, (r) => r.fulfill({ ...json, status: 200, body: '{"ok":true}' }));
  const warm: number[] = [];
  await page.route(`${RELAY}/stt`, (r) => {
    const body = r.request().postDataBuffer();
    // (the page's warm-up as it opens, an empty body: lib/speech/stt.ts warmStt)
    if (!body?.length) return (warm.push(sent.length), r.fulfill({ status: 204, headers: json.headers }));
    sent.push(body);
    if (sent.length <= (o.drop ?? 0)) return r.abort('failed');
    return r.fulfill({ ...json, status: 200, body: JSON.stringify({ ok: true, text: 'Good morning!', aiMs: 300 }) });
  });
  if (o.viaMenu) {
    // (in the page, from English Study's ⚙: the browser's back then stays in this document)
    await page.goto('?demo');
    await islandUp(page);
    await fromMenu(page, 'english', 'tap');
    await page.locator('dialog[open] [data-en-gear]').tap();
    await page.locator('dialog[open] [data-en-speech]').tap();
  } else await page.goto('speech?demo');
  const sp = page.locator('[data-speech]');
  // a tap first (the island's sound wakes on any: its context made under 'ambient')
  await sp.getByRole('button', { name: '次の文' }).tap();
  await sp.getByRole('button', { name: '前の文' }).tap();
  return { sp, sent, warm };
}

test('paired, the sound on: the mic opens (the session allows it), a take goes as a 16 kHz WAV, the words shown', async ({ page }) => {
  const { sp, sent, warm } = await paired(page);
  const mic = sp.locator('[data-speech-mic]');
  // the relay readied as the page opened, before any take
  await expect.poll(() => warm).toEqual([0]);
  await expect(mic).toHaveAttribute('aria-disabled', 'false');
  await mic.tap();
  await heldFor(mic);
  await mic.tap();
  await expect(sp.locator('[data-speech-result]')).toContainText('Good morning!');
  await expect(sp.locator('[data-speech-miss]')).toHaveCount(0);
  expect(sent).toHaveLength(1);
  const wav = sent[0];
  expect(wav.subarray(0, 4).toString() + wav.subarray(8, 12).toString()).toBe('RIFFWAVE');
  expect(wav.readUInt32LE(24)).toBe(16_000);
  // at least 0.3 s of sound, not a bare header
  expect(wav.length).toBeGreaterThan(44 + 0.3 * 16_000 * 2);
  const asks = await micAsks(page);
  expect(asks.asks).toBe(1);
  expect(['play-and-record', 'none']).toContain(asks.sess[0]);
});

test('an upload that never reached the relay is sent once more, the same WAV: the words shown', async ({ page }) => {
  const { sp, sent } = await paired(page, { drop: 1 });
  const mic = sp.locator('[data-speech-mic]');
  await mic.tap();
  await heldFor(mic);
  await mic.tap();
  await expect(sp.locator('[data-speech-result]')).toContainText('Good morning!');
  await expect(sp.locator('[data-speech-miss]')).toHaveCount(0);
  expect(sent).toHaveLength(2);
  expect(sent[1].equals(sent[0])).toBe(true);
});

test('the mic refused (許可しない): why, in plain Japanese, with the error’s name', async ({ page }) => {
  const { sp, sent } = await paired(page, { refuse: 'NotAllowedError' });
  await sp.locator('[data-speech-mic]').tap();
  const miss = sp.locator('[data-speech-miss]');
  await expect(miss).toHaveAttribute('data-speech-miss', 'refused');
  await expect(miss).toContainText('マイクが許可されていないよ');
  await expect(miss).toContainText('NotAllowedError');
  expect(sent).toHaveLength(0);
});

test('a leave mid-take (the browser’s back): the mic closed, nothing sent; a double tap asks the mic once', async ({ page }) => {
  const { sp, sent } = await paired(page, { viaMenu: true });
  const live = () => liveTracks(page);
  const mic = sp.locator('[data-speech-mic]');
  const asks0 = (await micAsks(page)).asks;
  await mic.evaluate((b: HTMLElement) => (b.click(), b.click()));
  await heldFor(mic);
  expect((await micAsks(page)).asks - asks0).toBe(1);
  expect(await live()).toBe(1);
  await page.goBack();
  await expect(sp).toHaveCount(0);
  await expect.poll(live).toBe(0);
  expect(sent).toHaveLength(0);
});
