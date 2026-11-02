// Event music and cut-ins in the built app (docs/design.md "Event music", "K.K. Slider"): on an event's date and hour
// its track plays instead of the hour's; the wasps' chase and sting cut in over the island's music; a tap on K.K. plays
// one of his songs. Dates are mocked with ?date= (Tokyo). Checked by the files the engine fetches.
import { expect, test, type Page } from '@playwright/test';
import { is3d } from './island.ts';

test.use({ viewport: { width: 390, height: 844 } });

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });

/** Music on; records every audio file fetched. */
async function open(page: Page, q: string): Promise<string[]> {
  const audio: string[] = [];
  page.on('request', (r) => r.url().includes('/audio/') && audio.push(new URL(r.url()).pathname.replace(/^\/fitness\/audio\//, '')));
  await page.addInitScript(() => {
    localStorage.setItem('island.sound', JSON.stringify({ music: true, sfx: true, volume: 0.8 }));
    (window as { __cues?: string[] }).__cues = [];
  });
  await page.goto(`?demo&date=${q}`);
  await expect(ribbon(page)).toBeVisible();
  await is3d(page); // (the 3D island up: a while in software GL)
  return audio;
}

/** A tap on open sky (unlocks audio like any tap). */
async function tapSky(page: Page) {
  const s = (await page.locator('.if-scene').boundingBox())!;
  await page.mouse.click(s.x + s.width / 2, s.y + 60);
}

for (const [q, file] of [
  ['2026-10-31T16:30', 'music/hour-16.m4a'],
  ['2026-10-31T17:00', 'music/halloween.m4a'],
  ['2026-11-26T09:30', 'music/turkey-day.m4a'],
  ['2027-01-01T00:00:30', 'music/happy-new-year.m4a'],
  ['2027-01-01T00:30', 'music/new-year-0am.m4a'],
  ['2027-01-01T03:00', 'music/new-year-2am.m4a'],
  ['2027-01-01T12:00', 'music/new-years-day.m4a']
] as const)
  test(`${q.slice(0, 16)} plays ${file}`, async ({ page }) => {
    const audio = await open(page, q);
    await expect.poll(() => audio).toContain(file); // fetched ahead of the first tap
    await tapSky(page);
    await page.waitForTimeout(500);
    expect(audio.filter((p) => p.startsWith('music/'))).toEqual([file]); // and nothing else
  });

test('the wasps: Chased by Bees cuts in as they come out, Stung by Bees after the sting, then the hour again', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T12:00:00+09:00') });
  await page.clock.resume();
  const audio = await open(page, '2026-11-04T12:00&shake=nest');
  await page.waitForTimeout(2600); // the opening beats are over
  await tapSky(page);
  await expect.poll(() => audio).toContain('music/hour-12.m4a');
  const c = (await page.locator('button.canopy').first().boundingBox())!;
  for (let i = 0; i < 3; i++) {
    await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
    await page.waitForTimeout(120);
  }
  await expect(page.locator('button[data-swarm]')).toBeVisible({ timeout: 2000 });
  await expect.poll(() => audio).toContain('music/bee-chase.m4a');
  await expect(page.locator('[data-stung]')).toHaveCount(1, { timeout: 3000 }); // no tap: stung
  await expect.poll(() => audio).toContain('music/bee-stung.m4a');
  // the hour's file was kept for the hand back: not fetched again (13 s of the page's clock, run on at once)
  await page.clock.fastForward(13_000); // (its timers, not its every frame: the 3D island would draw each, in software on CI)
  expect(audio.filter((p) => p === 'music/hour-12.m4a')).toHaveLength(1);
});

test('K.K.: his request prompt, then おまかせ plays one of his songs (not the placeholder tune)', async ({ page }) => {
  const audio = await open(page, '2026-11-07T20:00'); // a Saturday
  // he plays on centre stage, the campsite's clearing (おく)
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(400);
  await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(642));
  await page.waitForTimeout(400);
  const kk = page.locator('[data-visitor="kk-slider"] .art');
  await expect(kk).toBeVisible();
  const r = (await kk.boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('とたけけ');
  // his show (NH): the greeting asks for a request; おまかせ plays one of his songs
  // a tap on the asked question would close it: wait for the answers (the greeting is one page)
  await expect(page.locator('.choices.asking')).toBeVisible({ timeout: 8000 });
  await page.locator('.choice', { hasText: 'おまかせ' }).click();
  await expect.poll(() => audio.find((p) => /^kk\/kk-[a-z]+\.m4a$/.test(p))).toBeTruthy();
  expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).not.toContain('kk-song');
});
