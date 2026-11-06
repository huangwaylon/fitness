// ききみみ's visuals (docs/kikimimi.md "Visuals"): level 4's scene card in place of the plain stage while the clip plays
// (the painted backdrop at the phone's scale, the speakers standing in it, the empty bubble), each channel's frame
// (phone, PA, video; a PA over paper where the setting has no backdrop), and at the reveal the English with its sound
// marks and their key, a dialogue's on each line. A test hook (`__kiki.deck(ids)`, as にがて れんしゅう) deals the items.
// The logic tier: the clips may or may not sound (headless, muted), the schedule is the relay clock's.
// KIKI_SHOTS=1 writes the screenshot pass (393×852) into /tmp/kikimimi-shots/inc5/.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';
const SHOTS = process.env.KIKI_SHOTS ? '/tmp/kikimimi-shots/inc5' : null;

type Kiki = { view(): { phase: string; i: number }; right(): number; deck(ids: string[]): void; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');

/** Each item: its scene (or paper), its channel, the frame drawn, what the reveal shows. */
type Staged = { id: string; scene: string; channel: string; standing?: number; dialogue?: boolean; say?: string; link?: boolean };
const ITEMS: readonly Staged[] = [
  { id: 'r4-name', scene: 'cafe', channel: 'live', standing: 1 },
  { id: 'd4-oat-latte', scene: 'cafe', channel: 'live', standing: 2, dialogue: true, say: 'lemme' },
  { id: 'w4-lemme', scene: 'living', channel: 'phone', say: 'lemme', link: true },
  { id: 'n4-gate', scene: 'gate', channel: 'pa', say: 'fifTEEN' },
  { id: 'r4-cut-out', scene: 'office', channel: 'video' },
  { id: 'm4-sailings', scene: 'paper', channel: 'pa' },
  { id: 'd4-receptionist', scene: 'living', channel: 'phone', dialogue: true, say: 'TWENtieth' },
  { id: 'd4-video-call', scene: 'office', channel: 'video', dialogue: true }
];

test('scenes: the scene card and each channel frame while it plays, the sound marks and their key at the reveal', async ({ page }) => {
  test.slow();
  await page.goto(`?demo&${Q}`);
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await kiki(page, (k) => k.deck(['r4-name', 'd4-oat-latte', 'w4-lemme', 'n4-gate', 'r4-cut-out', 'm4-sailings', 'd4-receptionist', 'd4-video-call']));
  await expect.poll(() => kiki(page, (k) => k.items())).toHaveLength(ITEMS.length);
  for (const [i, x] of ITEMS.entries()) {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 15_000 }).toBe(i);
    const card = sheet(page).locator('[data-kiki-card] [data-kiki-scene]');
    await expect(card).toHaveAttribute('data-kiki-scene', x.scene);
    await expect(card).toHaveAttribute('data-channel', x.channel);
    // the plain stage is gone; no text before the reveal
    await expect(sheet(page).locator('.stage')).toHaveCount(0);
    await expect(sheet(page).locator('[data-kiki-en], [data-kiki-transcript]')).toHaveCount(0);
    if (x.scene !== 'paper') {
      // the backdrop at the phone's scale (iPhone 13's DPR 3: the @3x file), decoded
      const bd = card.locator('img.bd');
      await expect.poll(() => bd.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0 && img.currentSrc)).toContain(`art/scene/${x.scene}@3x.webp`);
      await expect(card.locator('.place')).toBeVisible();
    } else await expect(card.locator('img')).toHaveCount(x.channel === 'pa' ? 0 : 1);
    if (x.channel === 'live') {
      await expect(card.locator('[data-vill]')).toHaveCount(x.standing ?? 1);
      await expect(card.locator('.say .notes')).toHaveText('♪…');
    } else {
      await expect(card.locator(`[data-kiki-frame="${x.channel}"]`)).toBeVisible();
      await expect(card.locator('.chan')).toBeVisible();
    }
    if (x.channel === 'video') await expect(card.locator('[data-tile]')).toHaveCount(4);
    // one image on screen: the backdrop (and the frame's or the villagers' art)
    await expect(sheet(page).locator('img.bd')).toHaveCount(x.scene === 'paper' ? 0 : 1);
    await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 30_000 });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${String(i + 1)}-${x.id}-play.png` });
    const right = await kiki(page, (k) => k.right());
    await sheet(page).locator(`[data-choice="${right}"]`).click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    // the reveal: the plain bubble back, the English with its marks
    await expect(sheet(page).locator('[data-kiki-card]')).toHaveCount(0);
    const text = x.dialogue ? sheet(page).locator('[data-kiki-transcript]') : sheet(page).locator('[data-kiki-en]');
    await expect(text.locator('[data-w]').first()).toBeVisible();
    if (x.say) {
      await expect(text.locator(`[data-kiki-say][data-say="${x.say}"]`).first()).toBeVisible();
      await expect(sheet(page).locator('[data-kiki-legend]')).toContainText('こう きこえる');
    }
    if (x.link) await expect(text.locator('[data-kiki-link]')).toHaveCount(1);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${String(i + 1)}-${x.id}-reveal.png` });
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
});
