// The record's data path offline (docs/backend.md#live-sync), in the gate set: a change made offline and the app
// killed before it went is sent when the app opens again (health data lost is the costliest bug). The rest of the two
// phones' sync through a network's troubles: live-sync.spec.ts.
import { expect, test, type Page } from './fixtures.ts';
import { newIsland } from './liveRoom.ts';
import { connected, demoPhone, fakeCatch, w } from './liveSync.ts';

/** The ids of the live outbox's kept intents (sync/live.ts, `island.liveOutbox`): sent, not acked yet. */
const kept = (p: Page) => p.evaluate(() => ((JSON.parse(localStorage.getItem('island.liveOutbox') ?? '{}') as { es?: { m?: { id?: string } }[] }).es ?? []).map((e) => e.m?.id));

test.afterEach(async ({ browser }) => {
  for (const c of browser.contexts()) await c.close();
});

test('kill: a change made offline and the app killed before it went is sent when the app opens again', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const A = await demoPhone(browser, island, 'A');
  const { page: b } = await demoPhone(browser, island, 'B');
  await connected(A.page);
  await connected(b);
  island.offline('A');
  await expect.poll(() => w<{ connected: boolean } | null>(A.page, 'status').then((s) => !!s?.connected)).toBe(false);
  const id = `e2e-kill-${Date.now().toString(36).slice(-5)}`;
  expect(await w<boolean>(A.page, 'share', fakeCatch(id))).toBe(true);
  // (its own id kept, not a count: the app may queue an intent of its own offline too, 2026-11-21's flake)
  await expect.poll(() => kept(A.page)).toContain(id);
  // killed (the page gone, nothing sent), then opened again online
  await A.page.close();
  island.offline('A', false);
  const a2 = await A.open();
  await connected(a2);
  await expect.poll(() => w<string>(b, 'canon').then((c) => c.includes(id)), { timeout: 10_000 }).toBe(true);
  await expect.poll(() => kept(a2), { timeout: 5000 }).not.toContain(id);
});
