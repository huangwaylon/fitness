// 英語すごろく online, watching (docs/sugoroku.md "Online"): the phone whose turn it isn't shows the player's turn live
// and read-only, from their `sgv` views (lib/sugoroku/view.ts): the ことば's tiles placed and taken back, ヒント, ↻入れかえ's
// ask, the word checked; the ぶん's tiles, 「おしい！」 and 答えはこれ; the speaking step's 録音中…, 聞こえた文 and feedback.
// Once the move lands, the fold takes over (B's own turn). Nothing on B's panel can be tapped. Two phones: two tabs on
// the demo's local relay, each game's id pinned (its board, dice and stones the same every run: A's first stone a
// ことば, a ぶん, a 絵). The views heard on B's tab are counted (frames, bytes). WebKit with taps.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { RELAY } from './relay.ts';

test.use({ viewport: { width: 393, height: 852 }, hasTouch: true });

const sheet = (p: Page) => p.locator('[data-sugoroku]');
/** B's watched panel (inert) and its head, 「Xが考え中…」. */
const watched = (p: Page) => sheet(p).locator('[data-sg-watch]');

/** A's and B's phones: A starts an online game (`id`) for the two, B joins from the invitation; A's dice rolled, its
 *  first stone `phase` shown on both. The views B's tab hears are kept (window.__sgv: each one's size as heard). */
async function table(ctx: BrowserContext, id: string, phase: string, aQuery = '') {
  const a = await ctx.newPage(), b = await ctx.newPage();
  await b.addInitScript(() => {
    const w = window as unknown as { __sgv: number[] };
    w.__sgv = [];
    new BroadcastChannel('island-demo-relay').onmessage = (e) => void (e.data?.m?.kind === 'sgv' && w.__sgv.push(JSON.stringify(e.data.m).length));
  });
  await a.goto(`?demo&sgId=${id}${aQuery}`);
  await b.goto('?demo&as=B');
  await islandUp(a);
  await islandUp(b);
  await fromMenu(a, 'english', 'tap');
  await a.locator('dialog[open] [data-en-tab="game"]').tap();
  await sheet(a).locator('[data-sg-new]').tap();
  await sheet(a).locator('[data-sg-mode="online"]').tap();
  await sheet(a).locator('[data-sg-start]').tap();
  await expect(sheet(a).locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', '0');
  await b.getByRole('button', { name: '参加' }).tap();
  await expect(sheet(b).locator('[data-sg-waiting]')).toBeVisible();
  await sheet(a).locator('[data-sg-spin]').tap();
  for (const p of [a, b]) {
    await expect(sheet(p).locator('[data-sg-die], [data-sg-moving]')).toHaveCount(0, { timeout: 15_000 });
    await expect(sheet(p).locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', phase);
  }
  await expect(watched(b)).toHaveAttribute('data-sg-watch', phase);
  await expect(sheet(b).locator('[data-sg-waiting]')).toContainText('考え中…');
  return { a, b };
}

/** A's move lands: B's watched panel goes, the fold's next turn (B's own) takes over. Returns the views B heard. */
async function handedOver(b: Page) {
  await expect(watched(b)).toHaveCount(0);
  await expect(sheet(b).locator('[data-sg-spin]')).toBeVisible({ timeout: 15_000 });
  return b.evaluate(() => (window as unknown as { __sgv: number[] }).__sgv);
}
const note = (sizes: number[]) => test.info().annotations.push({ type: 'sgv', description: `${sizes.length} views, ${Math.max(...sizes)} max, ${Math.round(sizes.reduce((s, n) => s + n, 0) / sizes.length)} mean (chars as heard)` });

test('ことば: B sees A’s tiles placed and taken back, ヒント, ↻入れかえ’s ask and the word checked, read-only; then its own turn', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
  const { a, b } = await table(ctx, 'e2ev100000', 'word');
  const slots = (p: Page) => sheet(p).locator('[data-sg-slots]');
  const same = async () => expect(slots(b)).toHaveAttribute('data-sg-slots', (await slots(a).getAttribute('data-sg-slots'))!);
  // two tiles placed, one taken back
  await sheet(a).locator('[data-sg-tile]:not([disabled])').first().tap();
  await sheet(a).locator('[data-sg-tile]:not([disabled])').first().tap();
  await expect(slots(a)).not.toHaveAttribute('data-sg-slots', /^.?$/);
  await same();
  await sheet(a).locator('.slots .tile.in').last().tap();
  await same();
  // B can't tap: its panel is inert, a tap on its rack places nothing anywhere
  await expect(watched(b)).toHaveAttribute('inert', '');
  await sheet(b).locator('[data-sg-tile]').last().tap({ force: true });
  await same();
  // ヒント: its word in the slots and its note, on both
  await sheet(a).locator('[data-sg-hint]').tap();
  await same();
  await expect(sheet(b).locator('.toast')).toHaveText((await sheet(a).locator('.toast').textContent())!);
  // ↻入れかえ's ask, then キャンセル
  await sheet(a).locator('[data-sg-swap]').tap();
  await expect(sheet(b).locator('[data-sg-swap-yes]')).toBeVisible();
  await sheet(a).locator('[data-sg-word] .head .chip').first().tap();
  await expect(sheet(b).locator('[data-sg-swap-yes]')).toHaveCount(0);
  // checked: the word and its stars
  await sheet(a).locator('[data-sg-play]').tap();
  const made = (await sheet(a).locator('[data-sg-made]').getAttribute('data-sg-made'))!;
  await expect(sheet(b).locator('[data-sg-made]')).toHaveAttribute('data-sg-made', made);
  await sheet(a).locator('[data-sg-next]').tap();
  note(await handedOver(b));
  await ctx.close();
});

test('ぶん: B sees A’s tiles in order, 「おしい！」 and 答えはこれ; then its own turn', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
  const { a, b } = await table(ctx, 'e2ev000000', 'sentence');
  const line = (p: Page) => sheet(p).locator('[data-sg-line]');
  const open = sheet(a).locator('[data-sg-wt]:not([disabled])');
  await open.first().tap();
  await open.first().tap();
  await expect(line(b)).toHaveAttribute('data-sg-line', (await line(a).getAttribute('data-sg-line'))!);
  // the rest as they lie: never the line's order (sentences.ts tilesOf), so 「おしい！」
  for (let n = await open.count(); n > 0; n--) await open.first().tap();
  await expect(sheet(b).locator('[data-sg-sentence] .toast')).toHaveText('おしい！もう一度並べてみよう');
  await expect(sheet(a).locator('[data-sg-stage]')).toHaveAttribute('data-sg-stage', 'try');
  for (let n = await open.count(); n > 0; n--) await open.first().tap();
  await expect(sheet(a).locator('[data-sg-answer]')).toBeVisible();
  await expect(sheet(b).locator('[data-sg-stage]')).toHaveAttribute('data-sg-stage', 'answer');
  await expect(sheet(b).locator('[data-sg-answer]')).toHaveText((await sheet(a).locator('[data-sg-answer]').textContent())!);
  await sheet(a).locator('[data-sg-next]').tap();
  note(await handedOver(b));
  await ctx.close();
});

test('the speaking step: B sees 録音中…, 聞こえた文 and the feedback (the recast, the tip); then its own turn', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
  // A's phone: a person's key (the step's), the mic stood in (a short silent WAV), /stt and /grade mocked
  await ctx.addInitScript(() => {
    localStorage.setItem('island.key', 'ab'.repeat(16));
    const n = 4800, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const tag = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
    tag(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); tag(8, 'WAVE'); tag(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, 16000, true); v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    tag(36, 'data'); v.setUint32(40, n * 2, true);
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
    class Rec {
      static isTypeSupported = () => true;
      mimeType = 'audio/wav';
      state = 'inactive';
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() { this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        queueMicrotask(() => (this.ondataavailable?.({ data: new Blob([buf], { type: 'audio/wav' }) }), this.onstop?.()));
      }
    }
    (window as unknown as { MediaRecorder: unknown }).MediaRecorder = Rec;
  });
  await ctx.routeWebSocket(/\/room/, () => {});
  const json = { contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' } };
  await ctx.route(`${RELAY}/**`, (r) => r.fulfill({ ...json, status: 200, body: '{"ok":true}' }));
  await ctx.route(`${RELAY}/stt`, (r) => r.fulfill({ ...json, status: 200, body: JSON.stringify({ ok: true, text: 'I eated an apple.', aiMs: 0 }) }));
  await ctx.route(`${RELAY}/grade`, (r) => r.fulfill({
    ...json, status: 200,
    body: JSON.stringify({ ok: true, verdict: 'tip', fixed: 'I ate an apple.', natural: 'I ate an apple.', also: '', tip: 'eat の「食べた」は ate だよ', used: true, src: 'ai', aiMs: 0 })
  }));
  const { a, b } = await table(ctx, 'e2ev500000', 'picture', '&speak=1');
  // A spells the picture (ふつう: its first letter given)
  const word = (await sheet(a).locator('[data-sg-picture]').getAttribute('data-sg-picture'))!;
  for (const c of word.slice(1)) await sheet(a).locator(`[data-sg-letter="${c}"]:not([disabled])`).first().tap();
  await expect(sheet(b).locator('[data-sg-answer]')).toHaveText(word);
  await expect(sheet(b).locator('[data-sg-speak="ask"]')).toBeVisible();
  await sheet(a).locator('[data-sg-say]').tap();
  await expect(sheet(b).locator('[data-sg-stop]')).toHaveText('録音中…');
  await sheet(a).locator('[data-sg-stop]').tap();
  await expect(sheet(b).locator('[data-sg-said]')).toHaveValue('I eated an apple.');
  await sheet(a).locator('[data-sg-ok]').tap();
  await expect(sheet(a).locator('[data-sg-feedback="graded"]')).toBeVisible();
  await expect(sheet(b).locator('[data-sg-feedback="graded"]')).toBeVisible();
  await expect(sheet(b).locator('[data-sg-mine] .chg')).toHaveText(['eated']);
  await expect(sheet(b).locator('[data-sg-recast] b')).toHaveText(['ate']);
  await expect(sheet(b).locator('[data-sg-tip-text]')).toHaveText('eat の「食べた」は ate だよ');
  await expect(sheet(b).locator('[data-sg-said-stars]')).toHaveAttribute('data-sg-said-stars', '2');
  await sheet(a).locator('[data-sg-next]').tap();
  note(await handedOver(b));
  await ctx.close();
});
