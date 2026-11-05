// ききみみ's アナウンス pack (docs/kikimimi.md "The アナウンス pack", docs/curriculum.md §14 increment 6): level 5 in the
// lobby (📢, a row of its own), and an announcement through its channel: a PA's final call at the gate and a phone menu
// at home, each card's frame while it plays, at the reveal the English with its marks, the note and the answer's
// Japanese, then the review list. A test hook (`__kiki.deck(ids)`, as にがて れんしゅう) deals the items. The logic
// tier: the clips may or may not sound (headless, muted), the schedule is the relay clock's.
// KIKI_SHOTS=1 writes screenshots (393×852) into /tmp/kikimimi-shots/inc6/.
import { expect, test, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';
const SHOTS = process.env.KIKI_SHOTS ? '/tmp/kikimimi-shots/inc6' : null;

type Kiki = { view(): { phase: string; i: number }; right(): number; deck(ids: string[]): void; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');

const ITEMS = [
  { id: 'a5-final-call', scene: 'gate', channel: 'pa', say: 'sixty-four' },
  { id: 'a5-press-three', scene: 'living', channel: 'phone', link: true }
] as const;

test('アナウンス: level 5 in the lobby; an announcement through its frame, its marks, note and answer at the reveal, the review', async ({ page }) => {
  test.slow();
  await page.goto(`?demo&${Q}`);
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  // the pack: offered (its clips landed), its own mark and a row of its own under the four stages
  const pack = sheet(page).locator('[data-level="5"]');
  await expect(pack).toContainText('📢');
  await expect(pack).toContainText('アナウンス');
  const [one, five] = await Promise.all([sheet(page).locator('[data-level="1"]').boundingBox(), pack.boundingBox()]);
  expect(five!.width).toBeGreaterThan(one!.width * 1.8);
  await pack.click();
  await expect(pack).toHaveAttribute('aria-checked', 'true');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/0-lobby.png` });

  await kiki(page, (k) => k.deck(['a5-final-call', 'a5-press-three']));
  await expect.poll(() => kiki(page, (k) => k.items())).toEqual(ITEMS.map((x) => x.id));
  for (const [i, x] of ITEMS.entries()) {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 15_000 }).toBe(i);
    const card = sheet(page).locator('[data-kiki-card] [data-kiki-scene]');
    await expect(card).toHaveAttribute('data-kiki-scene', x.scene);
    await expect(card).toHaveAttribute('data-channel', x.channel);
    await expect(card.locator(`[data-kiki-frame="${x.channel}"]`)).toBeVisible();
    // no text before the reveal; the question says what to listen for
    await expect(sheet(page).locator('[data-kiki-en]')).toHaveCount(0);
    await expect(sheet(page).locator('.ask')).not.toBeEmpty();
    // (a long announcement, a chime first: the answer window opens when its first play ends)
    await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 40_000 });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${String(i + 1)}-${x.id}-play.png` });
    const right = await kiki(page, (k) => k.right());
    await sheet(page).locator(`[data-choice="${right}"]`).click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    const en = sheet(page).locator('[data-kiki-en]');
    await expect(en.locator('[data-w]').first()).toBeVisible();
    if ('say' in x) await expect(en.locator(`[data-kiki-say][data-say="${x.say}"]`)).toBeVisible();
    if ('link' in x) await expect(en.locator('[data-kiki-link]').first()).toBeVisible();
    await expect(sheet(page).locator('[data-kiki-note]')).toBeVisible();
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${String(i + 1)}-${x.id}-reveal.png` });
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  // the review: both announcements, their English and Japanese
  await expect(sheet(page).locator('[data-review]')).toHaveCount(2);
  await expect(sheet(page).locator('[data-review="0"]')).toContainText('final boarding call');
  await expect(sheet(page).locator('[data-review="1"]')).toContainText('press 3');
});
