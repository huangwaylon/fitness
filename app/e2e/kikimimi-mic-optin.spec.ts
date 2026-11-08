// ききみみ's mic opt-in (docs/kikimimi-mic.md "Where they show", "Audio session", "The privacy rule"): せってい › マイク in the chromium-mic project, a fake mic
// fed one of our clips once (then silence) through a getUserMedia shim (headless Chrome's own fake capture waits on the
// OS's permission on a Mac), nothing played out loud, no network. Off by default with the probe's row under it; on
// after the permission; the check's take stops by itself on the silence after the clip and releases the track; the
// app hidden mid-take releases it too; 音声認識 with each choice's disclosure; whisper's model (the stub: no bytes)
// downloaded and deleted; kept on this phone; nothing sent anywhere. A refused permission leaves it off.
// Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/mic/ at 393×852.
import { expect, test, type Locator, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet } from './kikimimi-nav.ts';

const SHOTS = '/tmp/kikimimi-shots/mic';
async function shot(p: Page, name: string, at: Locator) {
  if (!process.env.KIKI_SHOTS) return;
  await at.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}

/** The fake mic: the clip once into a MediaStream, silence after it; each track kept in `__micTracks`; `refuse`: every
 *  ask refused. */
async function fakeMic(page: Page, o: { refuse?: boolean } = {}) {
  await page.context().route('**/__e2e/mic.wav', (route) => route.fulfill({ path: `${import.meta.dirname}/fixtures/mic/ladder-line.wav`, contentType: 'audio/wav' }));
  await page.addInitScript((refuse) => {
    const w = window as unknown as { __micTracks: MediaStreamTrack[] };
    w.__micTracks = [];
    navigator.mediaDevices.getUserMedia = async () => {
      if (refuse) throw new DOMException('refused', 'NotAllowedError');
      const ctx = new AudioContext();
      await ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = await ctx.decodeAudioData(await (await fetch('/__e2e/mic.wav')).arrayBuffer());
      const out = ctx.createMediaStreamDestination();
      src.connect(out);
      src.start();
      w.__micTracks.push(...out.stream.getTracks());
      return out.stream;
    };
  }, o.refuse ?? false);
}

async function toSettings(page: Page) {
  await page.goto('?demo&date=2026-11-04T12:00&kikimimi=fast');
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await page.locator('dialog[open] [data-kiki-gear]').click();
  const optin = sheet(page).locator('[data-mic-optin]');
  await expect(optin).toBeVisible();
  return optin;
}

const live = (page: Page) => page.evaluate(() => (window as unknown as { __micTracks: MediaStreamTrack[] }).__micTracks.filter((t) => t.readyState === 'live').length);

test('the mic opt-in: off by default, on after the permission, a check that stops by itself, the choices, the model, kept', async ({ page }) => {
  test.setTimeout(60_000);
  if (process.env.KIKI_SHOTS) await page.setViewportSize({ width: 393, height: 852 });
  await page.addInitScript(() => localStorage.setItem('e2e.stt', JSON.stringify(['hello'])));
  await fakeMic(page);
  const posts: string[] = [];
  page.on('request', (r) => r.method() === 'POST' && posts.push(r.url()));
  const optin = await toSettings(page);
  const sw = optin.locator('[data-mic-switch]');

  // off: the switch and the probe's row only
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(optin.locator('[data-mic-button]')).toHaveCount(0);
  await expect(optin.locator('[data-kiki-set-mic]')).toBeVisible();
  await shot(page, '1-off', optin);

  // on: the permission asked (the mic opened and closed at once)
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  expect(await live(page)).toBe(0);
  await expect(optin).toContainText('録音は保存も送信もされず');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('island.mic') ?? 'null'))).toEqual({ on: true, be: 'auto' });

  // 自動: this phone's whisper, its disclosure; the model offered with its size
  const chips = optin.locator('[data-mic-be]');
  await expect(chips).toHaveAttribute('data-mic-be', 'auto');
  await expect(chips).toHaveAttribute('data-mic-uses', 'whisper');
  await expect(optin.locator('[data-mic-disclose]')).toContainText('声はiPhoneの外に出ません');
  const model = optin.locator('[data-mic-model]');
  await expect(model).toHaveAttribute('data-mic-model', 'ready');
  await expect(model).toContainText('約70MB');
  await shot(page, '2-on', optin.locator('[data-mic-be]'));

  // the check: a tap, the clip heard, then the silence after it ends the take; the track released
  const btn = optin.locator('[data-mic-button]');
  await btn.locator('button').click();
  await expect(btn).toHaveAttribute('data-mic-state', 'listening');
  await expect(btn).toHaveAttribute('data-mic-speaking', '1');
  await shot(page, '3-listening', btn);
  await expect(btn).toHaveAttribute('data-mic-state', 'idle', { timeout: 20_000 });
  await expect(optin.locator('[data-mic-heard]')).toHaveAttribute('data-mic-heard', 'yes');
  await expect(optin.locator('[data-mic-heard]')).toContainText('聞こえました');
  expect(await live(page)).toBe(0);
  await shot(page, '4-heard', btn);

  // the app hidden mid-take: the take dropped, the track released
  await btn.locator('button').click();
  await expect(btn).toHaveAttribute('data-mic-state', 'listening');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });
  await expect(btn).toHaveAttribute('data-mic-state', 'idle');
  await expect(optin.locator('[data-mic-heard]')).toHaveAttribute('data-mic-heard', 'no');
  expect(await live(page)).toBe(0);

  // the four choices on one row, each one line (このiPhone was two)
  const tops = await chips.locator('[data-be]').evaluateAll((bs) => bs.map((b) => {
    const r = document.createRange();
    r.selectNodeContents(b);
    return [b.getBoundingClientRect().top, new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size];
  }));
  expect(new Set(tops.map(([y]) => Math.round(y))).size).toBe(1);
  expect(tops.map(([, lines]) => lines)).toEqual([1, 1, 1, 1]);

  // the other choices: each one's disclosure; the relay needs a paired phone (this one isn't)
  await chips.locator('[data-be="webkit"]').click();
  await expect(optin.locator('[data-mic-disclose]')).toContainText('Appleに送られる');
  await chips.locator('[data-be="relay"]').click();
  await expect(optin.locator('[data-mic-disclose]')).toContainText('保存されません');
  await expect(chips).toHaveAttribute('data-mic-uses', 'none');
  await expect(optin.locator('[data-mic-disclose]')).toContainText('今は使えません');
  await expect(model).toHaveCount(0);
  await shot(page, '5-relay', chips);
  await chips.locator('[data-be="auto"]').click();

  // the model: downloaded (the stub's, no bytes), then deleted
  await optin.locator('[data-mic-dl]').click();
  await expect(model).toHaveAttribute('data-mic-model', 'have');
  await shot(page, '6-model', model);
  await optin.locator('[data-mic-del]').click();
  await expect(optin.locator('[data-mic-deleted]')).toBeVisible();
  await expect(model).toHaveAttribute('data-mic-model', 'ready');

  // kept on this phone; off again
  await page.reload();
  const again = await toSettings(page);
  await expect(again.locator('[data-mic-switch]')).toHaveAttribute('aria-checked', 'true');
  await again.locator('[data-mic-switch]').click();
  await expect(again.locator('[data-mic-switch]')).toHaveAttribute('aria-checked', 'false');
  await expect(again.locator('[data-mic-button]')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('island.mic') ?? 'null'))).toEqual({ on: false, be: 'auto' });
  // the probe's row still opens the probe
  await again.locator('[data-kiki-set-mic]').click();
  await expect(sheet(page).locator('[data-mic-probe]')).toBeVisible();
  expect(posts).toEqual([]);
});

test('the mic opt-in: a refused permission leaves it off, with how to change it', async ({ page }) => {
  await fakeMic(page, { refuse: true });
  const optin = await toSettings(page);
  await optin.locator('[data-mic-switch]').click();
  await expect(optin.locator('[data-mic-refused]')).toHaveAttribute('data-mic-refused', 'denied');
  await expect(optin.locator('[data-mic-refused]')).toContainText('Safari › マイク');
  await expect(optin.locator('[data-mic-switch]')).toHaveAttribute('aria-checked', 'false');
  expect(await page.evaluate(() => localStorage.getItem('island.mic'))).toBeNull();
});
