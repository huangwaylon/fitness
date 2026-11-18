// The speech test (docs/speech-test.md): reached from English Study's すごろく tab (the new game's screen), its sentences
// stepped through to 自由に話す and round, ‹ back to the tab (the demo has no key: 録音 off with its note). Paired, with
// the island's sound on (its audio session 'ambient', which WebKit refuses the mic under) and the mic stood in
// (e2e/mic.ts): a take recorded, sent as a 16 kHz WAV and shown; a refusal says why. The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { RELAY } from './relay.ts';
import { heldFor, micAsks, standInMic } from './mic.ts';

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

/** A paired phone with 効果音 on, on /speech, its /stt answering `text`; returns the WAVs sent. */
async function paired(page: Page, o: { refuse?: string } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('island.key', 'ab'.repeat(16));
    localStorage.setItem('island.sound', JSON.stringify({ music: false, sfx: true, volume: 0.8 }));
  });
  await standInMic(page, o);
  const sent: Buffer[] = [];
  const json = { contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' } };
  await page.routeWebSocket(/\/room/, () => {});
  await page.route(`${RELAY}/**`, (r) => r.fulfill({ ...json, status: 200, body: '{"ok":true}' }));
  await page.route(`${RELAY}/stt`, (r) => (sent.push(r.request().postDataBuffer()!), r.fulfill({ ...json, status: 200, body: JSON.stringify({ ok: true, text: 'Good morning!', aiMs: 300 }) })));
  await page.goto('speech?demo');
  const sp = page.locator('[data-speech]');
  // a tap first (the island's sound wakes on any: its context made under 'ambient')
  await sp.getByRole('button', { name: '次の文' }).tap();
  await sp.getByRole('button', { name: '前の文' }).tap();
  return { sp, sent };
}

test('paired, the sound on: the mic opens (the session allows it), a take goes as a 16 kHz WAV, the words shown', async ({ page }) => {
  const { sp, sent } = await paired(page);
  const mic = sp.locator('[data-speech-mic]');
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

test('the mic refused (許可しない): why, in plain Japanese, with the error’s name', async ({ page }) => {
  const { sp, sent } = await paired(page, { refuse: 'NotAllowedError' });
  await sp.locator('[data-speech-mic]').tap();
  const miss = sp.locator('[data-speech-miss]');
  await expect(miss).toHaveAttribute('data-speech-miss', 'refused');
  await expect(miss).toContainText('マイクが許可されていません');
  await expect(miss).toContainText('NotAllowedError');
  expect(sent).toHaveLength(0);
});
