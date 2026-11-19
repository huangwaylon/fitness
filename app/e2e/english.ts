// English Study's spec helpers (docs/english.md), shared by english-lesson, english-player and english-phrases: the
// plan the tests study (waitress, today's on the pinned day), the sheet opened from the HUD menu, the lesson's cards and
// the stood-in embed's commands (e2e/youtube.ts).
// The sheet needs the island's HUD, not the island: open() waits for the menu, never islandUp (under a loaded runner
// the island's first step came after the test's 30 s, and nothing here taps the island).
import { expect, PINNED_DATE, type Page } from './fixtures.ts';
import { fromMenu, hudMenu } from './hud.ts';
import { ytCommands } from './youtube.ts';
import { waitress } from '../src/lib/english/clips/waitress.ts';
import { CLIPS } from '../src/lib/english/clips/index.ts';
import { planOf } from '../src/lib/english/plan.ts';
import { deckOf } from '../src/lib/english/catalog.ts';

/** The clips as offered (the shared plan). */
export const PLAN = planOf(CLIPS);
/** The clip these tests study, today's whatever the plan's order (plan-order.ts is re-planned as content changes):
 *  every clip before it skipped (別の動画にする's own record, prefs.ts) on the pinned day, for each player. */
const AHEAD = PLAN.slice(0, PLAN.findIndex((c) => c.id === waitress.id)).map((c) => c.id);
/** The plan's clip after waitress (the next unfinished, unskipped one). */
export const AFTER = PLAN[AHEAD.length + 1];

/** The card at place `i` of the lesson, and its question (this play's draw: by its id). */
export const cardAt = (p: Page, i: number) => p.locator(`dialog[open] [data-en-lesson] [data-en-q="${i}"]`);
export async function questionAt(p: Page, i: number) {
  const id = await cardAt(p, i).getAttribute('data-en-qid');
  return waitress.questions.find((q) => q.id === id)!;
}

/** The player's commands from the `from`th on (addEventListener and the captions' unloadModule aside). */
export const since = async (p: Page, from: number) => (await ytCommands(p)).slice(from).filter((c) => !['addEventListener', 'unloadModule'].includes(c[0]));
/** The commands from the `from`th on, after the first `func` (a pause from a move just before may land first:
 *  postMessage is async, slower on a throttled runner). */
export const from = async (p: Page, n: number, func: string) => {
  const c = await since(p, n);
  const i = c.findIndex((x) => x[0] === func);
  return i < 0 ? [] : c.slice(i);
};

export const sheet = (p: Page) => p.locator('dialog[open] [data-english]');
export const lesson = (p: Page) => sheet(p).locator('[data-en-lesson]');
export const at = (p: Page) => lesson(p).getAttribute('data-en-at');

/** The island's page at `?demo{q}`, waitress today, English Study open on its home. */
export async function open(page: Page, q = '') {
  await page.addInitScript(([ids, on]) => {
    const k = 'island.english.skip';
    if (localStorage.getItem(k) !== null) return; // a skip made in the test (or a second open) kept
    const day = Object.fromEntries(ids.map((id) => [id, on]));
    localStorage.setItem(k, JSON.stringify({ A: day, B: day, G: day }));
  }, [AHEAD, PINNED_DATE.slice(0, 10)] as const);
  await page.goto(`?demo${q}`);
  await toSheet(page);
}
/** English Study from the HUD menu, on its home (the page loaded: a goto or a reload). */
export async function toSheet(page: Page, how: 'click' | 'tap' = 'click') {
  await expect(hudMenu(page)).toBeVisible({ timeout: 30_000 });
  await fromMenu(page, 'english', how);
  await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('English Study');
}
/** The day's clip, from its card. */
export async function start(page: Page) {
  await sheet(page).locator('[data-en-start]').click();
  await expect(lesson(page)).toBeVisible();
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'ready');
}

/** フレーズ's deck as the build makes it (catalog.ts deckOf), by card key. */
const DECK = new Map(deckOf(PLAN).map((e) => [`${e[0]}/${e[1]}`, e]));
/** Today's clip and the next two in the plan: no card of theirs on the tab. */
const HELD = PLAN.slice(AHEAD.length, AHEAD.length + 3).map((c) => c.id);
export const tabOf = (p: Page, id: string) => sheet(p).locator(`[data-en-tab="${id}"]`);
export const deckCard = (p: Page) => sheet(p).locator('[data-en-deck]');
export const back = (p: Page) => sheet(p).locator('.navbar .back').click();
/** The card shown: its key and its deck entry. */
export async function shownCard(p: Page) {
  const k = (await deckCard(p).getAttribute('data-en-deck'))!;
  const e = DECK.get(k);
  expect(e, k).toBeTruthy();
  expect(HELD).not.toContain(e![0]);
  return { k, e: e! };
}
