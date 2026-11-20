// もようがえ's tray with a thousand owned pieces, timed (docs/design.md "The tent" Tray): the frames from the tray's
// opening through the tall grid scrolled end to end and a search, at 393 × 659. On demand (SHELF_PERF=1): it reads the
// page's rAF clock, which a loaded runner skews; tent-shelf.spec.ts checks the same flow's behaviour every run.
import { expect, test, type Page } from './fixtures.ts';
import { roomUp } from './rooms.ts';
import base from '../src/lib/components/tent/items.json' with { type: 'json' };
import more from '../src/lib/components/tent/more.json' with { type: 'json' };

test.skip(!process.env.SHELF_PERF, 'the tray’s frame timings run on demand (SHELF_PERF=1)');
test.use({ viewport: { width: 393, height: 659 }, hasTouch: true, isMobile: true });

const ITEMS = { ...base.items, ...more.items } as Record<string, { cat?: string; cr?: string; starter?: number }>;
const DAY = '2026-11-04';
const at = (daysAgo: number, i: number) => Date.parse(`${DAY}T09:00:00+09:00`) - daysAgo * 86_400_000 + i * 1000;

async function seedMany(page: Page): Promise<number> {
  const mine = Object.keys(ITEMS).filter((c) => ITEMS[c].cat && !ITEMS[c].starter);
  const tanks = Object.keys(ITEMS).filter((c) => ITEMS[c].cr);
  const events = [...mine.map((c, i) => ['find', { kind: 'item', id: ITEMS[c].cat }, at(20 - (i % 20), i)] as const), ...tanks.map((c, i) => {
    const [kind, id] = ITEMS[c].cr!.split(':');
    return ['find', { kind, id }, at(30, i)] as const;
  })];
  await page.addInitScript(([day, list]) => {
    localStorage.removeItem('island-demo.tent');
    const rows = list.map(([type, data, t], i) => ({ id: `seed-${i}`, type, data, queuedAt: t, tries: 0, nextAt: 0, ackedAt: t, person: 'A' }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day, events: rows }));
  }, [DAY, events] as const);
  return events.length;
}

test('a thousand pieces: open, tall, scrolled end to end, searched', async ({ page, browserName }) => {
  const owned = await seedMany(page);
  await page.goto(`tent?demo&date=${DAY}T12:00`);
  await roomUp(page, 'tent');
  await page.evaluate(() => {
    const w = window as unknown as { __gaps: number[]; __stop: boolean };
    w.__gaps = [];
    w.__stop = false;
    let last = performance.now();
    const f = (t: number) => {
      w.__gaps.push(t - last);
      last = t;
      if (!w.__stop) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  const t0 = Date.now();
  await page.locator('[data-tent-edit-open]').tap();
  await expect(page.locator('[data-tent-items] [data-tent-item]').first()).toBeVisible();
  const open = Date.now() - t0;
  const n = Number(await page.locator('[data-tent-items]').getAttribute('data-n'));
  await page.locator('[data-tent-tall]').tap();
  await page.locator('[data-tent-items]').evaluate(async (g) => {
    for (let y = 0; y <= g.scrollHeight; y += 240) {
      g.scrollTop = y;
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
  });
  await page.locator('[data-tent-search-open]').tap();
  await page.locator('[data-tent-search]').fill('テーブル');
  await expect.poll(async () => Number(await page.locator('[data-tent-items]').getAttribute('data-n'))).toBeLessThan(n);
  const gaps = await page.evaluate(() => {
    const w = window as unknown as { __gaps: number[]; __stop: boolean };
    w.__stop = true;
    return w.__gaps.slice(1).sort((a, b) => a - b);
  });
  const p95 = gaps[Math.floor(gaps.length * 0.95)], worst = gaps.at(-1)!;
  console.log(`shelf perf ${browserName}: ${n} in 家具 (${owned} owned), open ${open} ms, frames ${gaps.length}, p95 ${p95.toFixed(1)} ms, worst ${worst.toFixed(1)} ms`);
  expect(p95).toBeLessThan(100);
});
