// ききみみ's mic probe (docs/kikimimi-mic.md §1.1, §3.8): せってい's 「マイク診断（テスト）」 on a paired phone (`?log=on`:
// the log is off under automation otherwise), in the chromium-mic project: a fake mic fed one of our clips through a
// getUserMedia shim (e2e/fixtures/mic/ladder-line.wav: sp-cat-2's slice of the ladder pack, `ffmpeg -i <clip>.m4a -ac 1
// -ar 16000 -c:a pcm_s16le`), nothing played out loud, no network. Safari's recogniser is the stub (`localStorage['e2e.stt']`),
// the relay's `/stt` this test's own answer, whisper the stub too (nothing downloaded, no worker: lib/mic/backends/whisper.ts).
// Every step once (the earphones skipped), then
// 「結果を送信」: the batch reaches the relay's real log code with the `mic.*` events, numbers and closed sets only,
// and nothing of what was "heard". Then a reopen: the 2b check alone.
import { expect, test } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet } from './kikimimi-nav.ts';
import { newRecord } from './record.ts';
import { RELAY, KEYS } from './relay.ts';
import { LogCore } from '../../relay/src/log.ts';
import { memSql } from '../../relay/test/sqlite.ts';

/** What the recognisers "hear": a canary that must never reach the log. */
const HEARD = 'hey its me long story but any chance you could feed my pineapple tomorrow';

test('the mic probe: each step, its numbers to the log, never the heard text; a reopen asks 2b only', async ({ context, page }) => {
  test.setTimeout(90_000);
  const record = newRecord();
  await record.pair(context, 'A');
  await context.addInitScript((h) => localStorage.setItem('e2e.stt', JSON.stringify([h])), HEARD);
  // the fake mic: the clip looped into a MediaStream (on a Mac, headless Chrome's own fake capture waits on the OS's
  // mic permission; this runs anywhere, the output still muted)
  await context.route('**/__e2e/mic.wav', (route) => route.fulfill({ path: `${import.meta.dirname}/fixtures/mic/ladder-line.wav`, contentType: 'audio/wav' }));
  await context.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const ctx = new AudioContext();
      await ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = await ctx.decodeAudioData(await (await fetch('/__e2e/mic.wav')).arrayBuffer());
      src.loop = true;
      const out = ctx.createMediaStreamDestination();
      src.connect(out);
      src.start();
      return out.stream;
    };
  });
  const logs = new LogCore({ sql: memSql().sql, tx: (fn) => fn(), keys: KEYS, now: () => Date.now() });
  const bodies: string[] = [];
  const stt: { auth: string | null; bytes: number }[] = [];
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' };
  await page.route(`${RELAY}/log`, (route) => {
    const text = route.request().postData() ?? '';
    bodies.push(text);
    return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(logs.ingestText(text)) });
  });
  await page.route(`${RELAY}/stt`, (route) => {
    const r = route.request();
    if (r.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    stt.push({ auth: r.headers().authorization ?? null, bytes: r.postDataBuffer()?.length ?? 0 });
    return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ ok: true, text: HEARD }) });
  });

  await page.goto('?log=on');
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await page.locator('dialog[open] [data-kiki-gear]').click();
  await sheet(page).locator('[data-kiki-set-mic]').click();
  const probe = sheet(page).locator('[data-mic-probe]');
  const at = (p: string) => expect(probe).toHaveAttribute('data-mic-phase', p);
  await at('intro');
  await expect(probe).toContainText('送られるのは数字だけ');
  await probe.locator('[data-mic-start]').click();

  // 1 the page, 2 the permission (the fake UI grants it)
  await expect(probe.locator('[data-mic-env]')).toBeVisible();
  await probe.locator('[data-mic-next]').click();
  await at('perm');
  await probe.locator('[data-mic-allow]').click();
  await expect(probe.locator('[data-mic-perm]')).toHaveAttribute('data-mic-perm', 'granted');
  await probe.locator('[data-mic-next]').click();

  // 3 the speaker measured (the clip played into a muted output, the fake mic listening), rated; no earphones here
  await at('duplex');
  await expect(probe.locator('[data-mic-ear]')).toHaveAttribute('data-mic-ear', 'none');
  await probe.locator('[data-mic-play]').click();
  await probe.locator('[data-mic-loud="ok"]').click({ timeout: 30_000 });
  await expect(probe.locator('[data-mic-ear]')).toHaveAttribute('data-mic-ear', 'wired');
  await probe.locator('[data-mic-noear]').click();
  await expect(probe.locator('[data-mic-ear]')).toHaveAttribute('data-mic-ear', 'bluetooth');
  await probe.locator('[data-mic-noear]').click();

  // 4 whisper on the phone: offered with its size, downloaded on the tap, tried on our 3 clips (decoded, never played)
  await at('whisper');
  await expect(probe.locator('[data-mic-whisper]')).toHaveAttribute('data-mic-whisper', 'ready');
  await expect(probe).toContainText('70MB');
  await probe.locator('[data-mic-dl]').click();
  await expect(probe.locator('[data-mic-clips]')).toBeVisible();

  // 4 whisper, 5 Safari's recogniser (the stub) and 6 the relay's, each on the 3 sentences read aloud: a match % from the WER
  for (const be of ['whisper', 'webkit', 'relay']) {
    await at(be);
    for (let i = 0; i < 3; i++) {
      await expect(probe.locator('[data-mic-line]')).toHaveAttribute('data-mic-line', ['sp-cat-2', 'sp-half-nine-2', 'sp-onions-2'][i]);
      await probe.locator('[data-mic-talk]').click();
      if (be !== 'webkit') {
        // (stopped once 2 s are in: a take of the clip, not of nothing)
        await expect(probe.locator('[data-mic-listening]')).toHaveAttribute('data-mic-secs', '2');
        await probe.locator('[data-mic-stop]').click();
      }
      await expect(probe.locator('[data-mic-heard]')).not.toHaveAttribute('data-mic-heard', 'err');
      await probe.locator('[data-mic-next]').click();
    }
  }
  expect(stt.length).toBe(3);
  expect(stt.map((s) => [s.auth, s.bytes > 1000])).toEqual(Array(3).fill([`Bearer ${KEYS.KEY_A}`, true]));

  // 7 the results on screen, then sent
  await at('result');
  await expect(probe.locator('[data-mic-row="none"]')).toContainText('ふつう');
  await expect(probe.locator('[data-mic-row="relay"]')).toContainText('一致');
  await expect(probe.locator('[data-mic-row="whisper"]')).toContainText('一致');
  await probe.locator('[data-mic-send]').click();
  await expect(probe.locator('[data-mic-sent]')).toHaveAttribute('data-mic-sent', 'yes');
  const rows = logs.query({ since: 0, ev: 'mic.' }).rows;
  const count = (ev: string) => rows.filter((r) => r.ev === ev).length;
  expect([count('mic.env'), count('mic.perm'), count('mic.duplex')]).toEqual([1, 1, 2]);
  expect(rows.find((r) => r.ev === 'mic.perm')?.d).toMatchObject({ st: 'granted', again: false });
  expect(rows.filter((r) => r.ev === 'mic.duplex').map((r) => [r.d.ear, r.d.aec, r.d.loud])).toEqual([['none', true, 'ok'], ['none', false, 'ok']]);
  const stts = rows.filter((r) => r.ev === 'mic.stt'), at4 = (step: string) => stts.filter((r) => r.d.step === step);
  expect(stts.every((r) => r.d.ok === true)).toBe(true);
  expect(at4('spoken').map((r) => [String(r.d.be).replace(/^whisper-.*/, 'whisper'), typeof r.d.wer])).toEqual(['whisper', 'webkit', 'relay'].flatMap((b) => Array(3).fill([b, 'number'])));
  // the download (the stub's: 0 MB), a load per device (WebGPU when a Worker has it, then WASM) and our 3 clips on each
  expect(at4('dl').map((r) => [r.d.be, r.d.model, r.d.mb])).toEqual([['whisper-wasm', 'tiny.en', 0]]);
  expect(at4('load').length).toBeGreaterThanOrEqual(1);
  expect(at4('clip').map((r) => typeof r.d.wer)).toEqual(Array(3 * at4('load').length).fill('number'));
  expect(bodies.join('\n')).not.toContain('pineapple');

  // a reopen: the probe offers the 2b check, which asks and sends one mic.perm (again)
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await page.locator('dialog[open] [data-kiki-gear]').click();
  await sheet(page).locator('[data-kiki-set-mic]').click();
  await probe.locator('[data-mic-again-start]').click();
  await at('again');
  await probe.locator('[data-mic-again-open]').click();
  await probe.locator('[data-mic-asked="0"]').click();
  await at('result');
  await probe.locator('[data-mic-send]').click();
  await expect(probe.locator('[data-mic-sent]')).toHaveAttribute('data-mic-sent', 'yes');
  expect(logs.query({ since: 0, ev: 'mic.perm' }).rows.map((r) => r.d.again)).toEqual([false, true]);
  await probe.locator('[data-mic-back]').click();
  await expect(sheet(page).locator('[data-kiki-set-mic]')).toBeVisible();
});
