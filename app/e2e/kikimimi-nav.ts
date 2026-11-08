// ききみみ's hub and its pages, shared by the specs (docs/kikimimi-ux.md §5): the sheet, and the way from the hub to a
// mode's page (あそぶ › the mode), みんなで, きろく.
import { expect, type Locator, type Page } from './fixtures.ts';

export const kikiSheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');

/** The hub (my lobby kept alone, nothing pushed), once its chunk is in. */
export async function atHub(p: Page) {
  await expect(kikiSheet(p)).toHaveAttribute('data-kiki-at', 'hub');
  await expect(kikiSheet(p).locator('[data-kiki-page="hub"]')).toBeVisible();
}

/** From the hub: あそぶ, then a mode's page (`quiz`, `ladder`, `announce`, `review`). */
export async function toMode(p: Page, m: 'quiz' | 'ladder' | 'announce' | 'review') {
  await atHub(p);
  await kikiSheet(p).locator('[data-kiki-tile="asobu"]').click();
  await kikiSheet(p).locator(`[data-kiki-mode-tile="${m}"]`).click();
  await expect(kikiSheet(p).locator(`[data-kiki-mode-page="${m}"]`)).toBeVisible();
}

/** From the hub: a tile's page (みんなで, きろく, ずかん). */
export async function toTile(p: Page, k: 'together' | 'record' | 'zukan') {
  await atHub(p);
  await kikiSheet(p).locator(`[data-kiki-tile="${k}"]`).click();
  await expect(kikiSheet(p)).toHaveAttribute('data-kiki-at', k === 'together' ? 'lobby' : k);
}

/** しまの みち: a stage open (its head tapped when it's folded: the current unit's and the placed one are open at first). */
export async function openStage(p: Page, stage: string) {
  const head = kikiSheet(p).locator(`[data-kiki-stage-toggle="${stage}"]`);
  if ((await head.getAttribute('aria-expanded')) !== 'true') await head.click();
  await expect(head).toHaveAttribute('aria-expanded', 'true');
}

/** A game's schedule on the page's clock (`page.clock.install()` before the goto; the pinned day kept): the countdown,
 *  the lead, a clip's play window (its length from clips.json, not the audio's) and the reveal's wait are the session's
 *  timers on the relay's clock (game.svelte.ts #refresh; the demo's relay is Date.now()), so stepping the clock runs
 *  them in moments. Steps STEP ms at a time (its frames with it; the clock still flows between steps) until `done`:
 *  never more than a step past a phase's start (an 8 s answer window kept). Both tabs of a context step together (the
 *  clock is the context's). */
async function runUntil(p: Page, done: () => Promise<boolean>, what = 'the state', max = 180_000) {
  for (let t = 0; !(await done()); t += STEP) {
    if (t > max) throw new Error(`runUntil: ${what} not reached in ${String(max / 1000)} s of the page's clock`);
    await p.clock.runFor(STEP);
  }
}
const STEP = 250;

/** `l` visible, the clock stepped to it (a state's selector: `[data-kiki-call-done][aria-disabled="false"]`). */
export const runToSee = (p: Page, l: Locator) => runUntil(p, () => l.first().isVisible(), String(l));

/** The sheet's game at `phase` (or one matching), the clock stepped to it. */
export const runToPhase = (p: Page, phase: string | RegExp) =>
  runUntil(p, async () => {
    const at = (await kikiSheet(p).getAttribute('data-phase')) ?? '';
    return typeof phase === 'string' ? at === phase : phase.test(at);
  }, `data-phase ${String(phase)}`);

/** Question i on (`__kiki.view()`; at `phase` if given: 'answer', its window), the clock stepped through its
 *  countdown, lead and clip. */
export const runToQuestion = (p: Page, i: number, phase?: string) =>
  runUntil(p, () => p.evaluate(([i, phase]) => {
    const v = (window as unknown as { __kiki?: { view(): { i: number; phase: string } | null } }).__kiki?.view();
    return v?.i === i && (!phase || v.phase === phase);
  }, [i, phase] as const), `question ${String(i)}${phase ? ` at ${phase}` : ''}`);

