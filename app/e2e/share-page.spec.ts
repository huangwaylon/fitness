// 共有リンク's page (routes/s, components/share; docs/travel.md "Sharing"): a stranger's phone (a fresh context: no key,
// nothing stored) opens `/s#<token>`: the relay's `/share` read once (the token alone in a text/plain body, never a key),
// the trip's guide from the bundle with every private value 🔒, no 持ち物, no service worker; the gone states (expired
// with its date, turned off and unknown alike), busy and offline with もう一度; English by the switch, kept this
// session. The relay is routed (e2e/share.ts routeShare), never fetched. Day and night shots at 393×659 under SHOTS.
import { expect, test, type Page } from './fixtures.ts';
import { routeShare, TOKEN, type ShareAnswer } from './share.ts';

test.use({ viewport: { width: 393, height: 659 }, storageState: { cookies: [], origins: [] } });

const EXP = '2027-11-20T03:00:00.000Z';
const OK = (ref = 'nz'): ShareAnswer => ({ ok: true, kind: 'trip', ref, exp: EXP, data: {} });

/** `/s#<token>` with the relay answering `answer`; `q`: the page's query (a ?date= for the scene clock, ?demo for the
 *  map's hooks). The reads seen. */
async function open(page: Page, answer: (b: Record<string, unknown>) => ShareAnswer, q = '') {
  const seen = await routeShare(page, answer);
  await page.goto(`s${q}#${TOKEN}`);
  return seen;
}

test('a member’s own phone says `self` (not a visit), and never sends its key', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('island.key', 'a1'.repeat(32)));
  const seen = await open(page, () => OK('okinawa'));
  await expect(page.locator('[data-share-trip="okinawa"]')).toBeVisible();
  expect(seen.map((s) => s.body)).toEqual([{ t: TOKEN, self: true }]);
});

test('gone: turned off and an unknown token alike; expired with its date; no fragment at all', async ({ page }) => {
  let answer: ShareAnswer = { ok: false, error: 'gone', why: 'off' };
  await open(page, () => answer);
  await expect(page.locator('[data-share-gone="off"]')).toContainText('このリンクは使えません');
  answer = { ok: false, error: 'gone', why: 'expired', exp: '2026-11-01T03:00:00.000Z' };
  await page.reload();
  await expect(page.locator('[data-share-gone="expired"]')).toContainText('このリンクは有効期限が切れました');
  await expect(page.locator('[data-share-gone="expired"]')).toContainText('2026/11/1まで有効でした');
  await page.goto('s');
  await expect(page.locator('[data-share-gone="off"]')).toBeVisible();
});

test('busy and offline: もう一度 reads again', async ({ page }) => {
  let answer: ShareAnswer = { status: 429, body: { ok: false, error: 'busy' } };
  const seen = await open(page, () => answer);
  await expect(page.locator('[data-share-gone="busy"]')).toContainText('混み合っています');
  answer = 'abort';
  await page.locator('[data-share-retry] button').tap();
  await expect(page.locator('[data-share-gone="offline"]')).toContainText('オフラインです');
  answer = OK('nz');
  await page.locator('[data-share-retry] button').tap();
  await expect(page.locator('[data-share-trip="nz"]')).toBeVisible();
  expect(seen).toHaveLength(3);
});

test('English: the switch (an English browser starts in it), kept this session', async ({ page }) => {
  await open(page, () => OK('nz'));
  await expect(page.locator('[data-share-trip="nz"]')).toBeVisible();
  await page.locator('[data-share-lang="en"]').tap();
  await expect(page.locator('[data-share-foot]')).toContainText('An Island Fund travel guide · valid until Nov 20, 2027');
  await page.reload();
  await expect(page.locator('[data-share-foot]')).toContainText('valid until Nov 20, 2027');
  // the app's own language untouched
  expect(await page.evaluate(() => localStorage.getItem('island.locale'))).toBeNull();
});

test.describe('an English browser', () => {
  test.use({ locale: 'en-US' });
  test('starts in English', async ({ page }) => {
    await open(page, () => ({ ok: false, error: 'gone', why: 'off' }));
    await expect(page.locator('[data-share-gone="off"]')).toContainText("This link can't be used");
  });
});
