// A launch asks for the 3D island's chunk (three.js and its scene, ~1 MB) and its ground's fields only when it opens
// the island (ui-state/boot.ts: test mode or a paired phone): a phone not paired yet goes to /pair without them, and
// so does a real visitor's `?demo` (test mode is the dev server's and the tests' only: ui-state/testMode.ts).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';

/** The 3D island's chunk in this build (the build's client manifest: chunks are named by hash). */
const chunk3d = (): string => {
  const m = JSON.parse(readFileSync(join(import.meta.dirname, '..', '.svelte-kit', 'output', 'client', '.vite', 'manifest.json'), 'utf8')) as Record<string, { file: string }>;
  return m['src/lib/components/world3d/Island3D.svelte'].file;
};

/** What of the 3D island's this page asked for: its chunk and the fields' worker. */
function watch3d(page: Page): string[] {
  const own = chunk3d(), asked: string[] = [];
  page.on('request', (r) => (r.url().endsWith(own) || /\/fields\.worker-[\w-]+\.js/.test(r.url())) && asked.push(new URL(r.url()).pathname));
  return asked;
}

test('not paired: to /pair without the 3D island', async ({ page }) => {
  const asked = watch3d(page);
  await page.goto('');
  await expect(page).toHaveURL(/\/pair/);
  await page.waitForLoadState('networkidle');
  expect(asked).toEqual([]);
});

test.describe("a real visitor's phone (no e2e.testMode)", () => {
  test.use({ testMode: false });
  test('?demo is the normal app: to /pair, no made-up data, no 3D island', async ({ page }) => {
    const asked = watch3d(page);
    await page.goto('?demo&critter=fish');
    await expect(page).toHaveURL(/\/pair/);
    await page.waitForLoadState('networkidle');
    expect(asked).toEqual([]);
    expect(await page.evaluate(() => Object.keys(sessionStorage).filter((k) => k.startsWith('island-demo.')))).toEqual([]);
  });
});

test('the demo: the 3D island and its fields asked for at the launch', async ({ page }) => {
  const asked = watch3d(page);
  await page.goto('?demo');
  await islandUp(page);
  await expect.poll(() => asked.some((u) => u.includes('fields.worker'))).toBe(true);
  await expect.poll(() => asked.some((u) => u.endsWith(chunk3d()))).toBe(true);
});
