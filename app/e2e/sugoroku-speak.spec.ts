// 英語すごろく's speaking step (docs/sugoroku.md "Speaking"), switched on by `?speak=1`: a game resumed on its own screen
// at a 絵 stone (the save made here, so the stone is certain), the picture spelt, then 「この絵で一文言ってみよう」.
// The mic is stood in (e2e/mic.ts: a real stream of a quiet tone, so lib/speech/stt.ts captures as on a phone),
// and the relay's /stt and /grade are route mocks: speak → 聞こえた文 → the feedback and its stars (the tip, saying the
// recast again +1); an edit graded again; no answer in 4 s → praise only; the word or a verb nudged; skipped; left mid-take (the mic
// let go, nothing sent); the switch off → no step. Run in WebKit too, with taps (Chromium-only once missed an iPhone freeze).
import { expect, test, type Page } from './fixtures.ts';
import { RELAY } from './relay.ts';
import { heldFor, liveTracks, micAsks, standInMic } from './mic.ts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test.use({ viewport: { width: 393, height: 659 }, hasTouch: true });

/** A game for A (やさしい) and B at A's 絵 stone, apple (the game builds it: lib/sugoroku/speak.test.ts). */
const AT_PICTURE: unknown = JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures/sugoroku-picture.json'), 'utf8'));

type Grade = { verdict: 'great' | 'ok' | 'tip'; fixed: string; natural?: string; also?: string; tip?: string; used?: boolean };
/** The phone: paired (a person's key), the game saved at the stone, the mic stood in, the relay mocked; `heard` what
 *  /stt answers in turn, `grade` what /grade answers (null: never). Returns the /grade bodies asked for. */
async function phone(page: Page, o: { heard?: string[]; grade?: (s: string) => Grade | null; speak?: boolean } = {}) {
  const asked: { s: string; t: string }[] = [];
  const stt: string[] = [];
  await page.addInitScript((game) => {
    localStorage.setItem('island.key', 'ab'.repeat(16));
    localStorage.setItem('island.sugoroku', JSON.stringify(game));
  }, AT_PICTURE);
  await standInMic(page);
  await page.routeWebSocket(/\/room/, () => {});
  const json = { contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' } };
  await page.route(`${RELAY}/**`, (r) => r.fulfill({ ...json, status: 200, body: '{"ok":true}' }));
  const heard = [...(o.heard ?? ['I like apple.'])];
  await page.route(`${RELAY}/stt`, (r) => {
    // (the step's warm-up, an empty body: lib/speech/stt.ts warmStt)
    if (!r.request().postDataBuffer()?.length) return r.fulfill({ status: 204, headers: json.headers });
    stt.push(r.request().method());
    return r.fulfill({ ...json, status: 200, body: JSON.stringify({ ok: true, text: heard.length > 1 ? heard.shift() : heard[0], aiMs: 0 }) });
  });
  await page.route(`${RELAY}/grade`, (r) => {
    const body = JSON.parse(r.request().postData() ?? '{}');
    asked.push(body);
    const g = (o.grade ?? (() => ({ verdict: 'great', fixed: body.s })))(body.s);
    if (!g) return; // (never answered)
    return r.fulfill({ ...json, status: 200, body: JSON.stringify({ ok: true, natural: g.fixed, also: '', tip: '', used: true, src: 'ai', aiMs: 0, ...g }) });
  });
  await page.goto(`sugoroku?m=local&demo${o.speak === false ? '' : '&speak=1'}`);
  const s = page.locator('[data-sugoroku]');
  await expect(s.locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', 'picture');
  await s.locator('[data-sg-choice="apple"]').tap();
  await expect(s.locator('[data-sg-answer]')).toBeVisible();
  return { s, asked, stt };
}

const team = (p: Page) => p.locator('[data-sugoroku] [data-sg-team]');

test('speak → 聞こえた文 → the feedback: the recast, the tip, +2; saying it again +1; 次へ adds them', async ({ page }) => {
  const { s, asked } = await phone(page, {
    heard: ['I eated an apple.', 'I ate an apple.'],
    grade: () => ({ verdict: 'tip', fixed: 'I ate an apple.', tip: 'eat の「食べた」は ate だよ' })
  });
  await expect(team(page)).toHaveAttribute('data-sg-team', '0');
  // one leaf action a view: 話す while the step is offered (次へ paper), 次へ once the sentence is said
  await expect(s.locator('[data-sg-next]')).toHaveClass(/paper/);
  await s.locator('[data-sg-say]').tap();
  const t0 = Date.now();
  await heldFor(s.locator('[data-sg-stop]'));
  await s.locator('[data-sg-stop]').tap();
  await expect(s.locator('[data-sg-said]')).toHaveValue('I eated an apple.');
  const heardMs = Date.now() - t0;
  // (asked for while the words are read)
  await expect.poll(() => asked.length).toBe(1);
  const t1 = Date.now();
  await s.locator('[data-sg-ok]').tap();
  await expect(s.locator('[data-sg-feedback="graded"]')).toBeVisible();
  await expect(s.locator('[data-sg-next]')).not.toHaveClass(/paper/);
  test.info().annotations.push({ type: 'ui-ms', description: `stop→聞こえた文 ${heardMs} ms, これでOK→feedback ${Date.now() - t1} ms (mocks answer at once)` });
  expect(asked).toEqual([{ s: 'I eated an apple.', t: 'apple' }]);
  // their word that changed underlined, the recast's in bold, the tip open (the player's first)
  await expect(s.locator('[data-sg-mine] .chg')).toHaveText(['eated']);
  await expect(s.locator('[data-sg-recast] b')).toHaveText(['ate']);
  await expect(s.locator('[data-sg-tip-text]')).toHaveText('eat の「食べた」は ate だよ');
  await expect(s.locator('[data-sg-said-stars]')).toHaveAttribute('data-sg-said-stars', '2');
  // never red, ×, % or 間違い
  await expect(s.locator('[data-sg-speak]')).not.toContainText(/間違|×|%/);
  // say the recast: +1
  await s.locator('[data-sg-resay]').tap();
  await heldFor(s.locator('[data-sg-stop]'));
  await s.locator('[data-sg-stop]').tap();
  await expect(s.locator('[data-sg-said]')).toHaveValue('I ate an apple.');
  await s.locator('[data-sg-ok]').tap();
  await expect(s.locator('[data-sg-resaid]')).toBeVisible();
  await expect(s.locator('[data-sg-said-stars]')).toHaveAttribute('data-sg-said-stars', '3');
  expect(asked).toHaveLength(1);
  await s.locator('[data-sg-next]').tap();
  // the picture's 5 and the sentence's 3
  await expect(team(page)).toHaveAttribute('data-sg-team', '8');
});

test('an edit is graded again; a great sentence’s other way said', async ({ page }) => {
  const { s, asked } = await phone(page, {
    heard: ['Thanks for watching!', 'I like dogs.'],
    grade: (x) => (x.includes('apple') ? { verdict: 'great', fixed: x, also: 'I really love red apples.' } : { verdict: 'great', fixed: x, used: false })
  });
  await s.locator('[data-sg-say]').tap();
  await heldFor(s.locator('[data-sg-stop]'));
  await s.locator('[data-sg-stop]').tap();
  // Whisper's words on silence: say it again, not graded
  await expect(s.locator('[data-sg-note]')).toHaveAttribute('data-sg-note', 'again');
  await s.locator('[data-sg-again]').tap();
  await heldFor(s.locator('[data-sg-stop]'));
  await s.locator('[data-sg-stop]').tap();
  await expect(s.locator('[data-sg-said]')).toHaveValue('I like dogs.');
  // not the picture's word: a nudge, no stars
  await s.locator('[data-sg-ok]').tap();
  await expect(s.locator('[data-sg-note]')).toHaveAttribute('data-sg-note', 'target');
  await s.locator('[data-sg-said]').fill('I like red apples.');
  await s.locator('[data-sg-ok]').tap();
  await expect(s.locator('[data-sg-feedback="graded"]')).toBeVisible();
  expect(asked.map((a) => a.s)).toEqual(['I like dogs.', 'I like red apples.']);
  await expect(s.locator('[data-sg-praise]')).toHaveText('いい文だね！');
  await expect(s.locator('[data-sg-also]')).toHaveText('I really love red apples.');
  await expect(s.locator('[data-sg-recast]')).toHaveCount(0);
  await s.locator('[data-sg-next]').tap();
  await expect(team(page)).toHaveAttribute('data-sg-team', '7');
});

test('no answer from /grade in 4 s: praise only, the stars still given', async ({ page }) => {
  const { s } = await phone(page, { grade: () => null });
  await s.locator('[data-sg-say]').tap();
  await heldFor(s.locator('[data-sg-stop]'));
  await s.locator('[data-sg-stop]').tap();
  await s.locator('[data-sg-ok]').tap();
  // the stars at once, the sentence shimmering: never a 判定 or 採点 label
  await expect(s.locator('[data-sg-said-stars]')).toHaveAttribute('data-sg-said-stars', '2');
  await expect(s.locator('[data-sg-speak]')).not.toContainText(/判定|採点/);
  await expect(s.locator('[data-sg-feedback="praise"]')).toBeVisible({ timeout: 8_000 });
  await expect(s.locator('[data-sg-praise]')).toHaveText('いいね！ちゃんと伝わったよ');
  await s.locator('[data-sg-next]').tap();
  await expect(team(page)).toHaveAttribute('data-sg-team', '7');
});

test('typed: a bare noun nudged for a verb, then graded', async ({ page }) => {
  const { s, asked, stt } = await phone(page);
  await s.locator('[data-sg-type]').tap();
  await expect(s.locator('[data-sg-said]')).toBeFocused();
  await s.locator('[data-sg-said]').fill('a red apple');
  await s.locator('[data-sg-ok]').tap();
  await expect(s.locator('[data-sg-note]')).toHaveAttribute('data-sg-note', 'verb');
  await s.locator('[data-sg-said]').fill('I eat a red apple.');
  await s.locator('[data-sg-ok]').tap();
  await expect(s.locator('[data-sg-feedback="graded"]')).toBeVisible();
  await expect(s.locator('[data-sg-said-stars]')).toHaveAttribute('data-sg-said-stars', '2');
  expect([asked.map((a) => a.s), stt.length]).toEqual([['I eat a red apple.'], 0]);
});

test('skipped: 次へ at once, the picture’s stars only, nothing asked of the relay', async ({ page }) => {
  const { s, asked, stt } = await phone(page);
  await expect(s.locator('[data-sg-speak="ask"]')).toBeVisible();
  await s.locator('[data-sg-next]').tap();
  await expect(team(page)).toHaveAttribute('data-sg-team', '5');
  expect([asked.length, stt.length]).toEqual([0, 0]);
});

test('left mid-take (the game’s ✕): the mic closed, nothing sent; a double tap asks the mic once', async ({ page }) => {
  const { s, asked, stt } = await phone(page);
  const asks0 = (await micAsks(page)).asks;
  await s.locator('[data-sg-say]').evaluate((b: HTMLElement) => (b.click(), b.click()));
  await heldFor(s.locator('[data-sg-stop]'));
  expect((await micAsks(page)).asks - asks0).toBe(1);
  expect(await liveTracks(page)).toBe(1);
  await s.locator('.navbar button.close').tap();
  await expect(s).toHaveCount(0);
  await expect.poll(() => liveTracks(page)).toBe(0);
  expect([asked.length, stt.length]).toEqual([0, 0]);
});

test('the switch off: the 絵 turn as it was, no step', async ({ page }) => {
  const { s } = await phone(page, { speak: false });
  await expect(s.locator('[data-sg-next]')).toBeVisible();
  await expect(s.locator('[data-sg-speak]')).toHaveCount(0);
  await s.locator('[data-sg-next]').tap();
  await expect(team(page)).toHaveAttribute('data-sg-team', '5');
});
