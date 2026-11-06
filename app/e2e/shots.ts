// Pictures for a person's eye, under SHOTS=<dir> only (no SHOTS: nothing): once an open sheet's host has typed out its
// line, the photos on screen are in and the sheet's own animations (its opening, a level's slide, a card's fold) are
// over, so no frame of them is caught.
import { expect, type Page } from './fixtures.ts';

export async function shot(page: Page, name: string, { full = false }: { full?: boolean } = {}) {
  if (!process.env.SHOTS) return;
  await expect(page.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await page.locator('dialog[open] img').evaluateAll((imgs) => Promise.all((imgs as HTMLImageElement[]).filter((i) => i.loading !== 'lazy' || i.getBoundingClientRect().top < innerHeight).map((i) => i.decode().catch(() => {}))));
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity && !!((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest('dialog[open]')).map((a) => a.finished.catch(() => {}))));
  await page.screenshot({ path: `${process.env.SHOTS}/${name}.png`, fullPage: full });
}
