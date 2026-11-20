// The 13 px floor for content text (docs/design.md "Chrome and tokens": content ≥ --fs-s): text under 13 px (--fs-xs, or an
// 11 / 10 px) is for micro-labels only, a tab's label, a chart's axis, a badge's count. Each file's count of them is held
// here and may only go down (a ratchet): a new one fails, and a file that drops one says so (lower its number). ごはん,
// the island and すごろく hold their own (English Study's lib/english is in since 2026-11-20).
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '../..');
const SMALL = /--fs-xs\b|font-size:\s*(?:1[0-2]|[0-9])(?:\.\d+)?px|font:[^;]*?\b(?:1[0-2]|[0-9])(?:\.\d+)?px\s*\//g;
const OUT = /components\/(food|island|english|sugoroku)\//;
const MICRO: Record<string, number> = {
  'lib/components/bots/GymCalendar.svelte': 1,
  'lib/components/bots/GymSlots.svelte': 1,
  'lib/components/bots/ItsCalendar.svelte': 1,
  'lib/components/bots/StatusCard.svelte': 1,
  'lib/components/editor/Editor.svelte': 12,
  'lib/components/health/BarChart.svelte': 1,
  'lib/components/hiking/ElevCard.svelte': 1,
  'lib/components/hiking/PlanCard.svelte': 1,
  'lib/components/hiking/TrailMap.svelte': 1,
  'lib/components/kiroku/DayDetail.svelte': 1,
  'lib/components/kiroku/Zukan.svelte': 1,
  'lib/components/layoutEdit/IslandEdit.svelte': 1,
  'lib/components/look/ClosetGrid.svelte': 1,
  'lib/components/tent/TentEdit.svelte': 4,
  'lib/components/travel/PackList.svelte': 1,
  'lib/components/travel/Pass.svelte': 1,
  'lib/components/travel/map/TripMap.svelte': 1,
  'lib/components/ui/StatStrip.svelte': 1,
  'lib/components/ui/TabBar.svelte': 1,
  'lib/components/ui/Tick.svelte': 1,
  'lib/components/wedding/TaskRow.svelte': 1,
  'lib/english/components/Thumb.svelte': 1
};
const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.svelte') ? [join(d, e.name)] : []));

it('text under 13 px only where it was (micro-labels), never more', () => {
  const now: Record<string, number> = {};
  for (const f of [...walk(join(SRC, 'lib/components')), ...walk(join(SRC, 'lib/english')), ...walk(join(SRC, 'routes'))]) {
    const rel = relative(SRC, f);
    if (OUT.test(rel)) continue;
    const n = [...readFileSync(f, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce((a, m) => a + (m[1].match(SMALL)?.length ?? 0), 0);
    if (n) now[rel] = n;
  }
  expect(now).toEqual(MICRO);
});
