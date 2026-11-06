// A trail's figures for ui/StatStrip (the list's cards, a trail's peek): 距離 · 標高差 · 時間 (· 難易度), in the phone's
// km / mi and the reader's locale.
import type { IconName } from '../ui/Icon.svelte';
import type { Locale } from '#lib/i18n/index.ts';
import type { Trail } from '#lib/hiking/types.ts';
import { DIFF, S, fmtTime } from '#lib/hiking/strings.ts';
import { fmtM, pick } from '../travel/text.ts';
import { fmtKm } from '../travel/units.ts';

type Cell = { icon?: IconName; value: string; unit?: string; label: string };

/** '9.8 km' → 9.8 + km; a figure with no unit after it as it is. */
function figure(s: string): { value: string; unit?: string } {
  const m = /^(.*\d)\s+(\D+)$/.exec(s);
  return m ? { value: m[1], unit: m[2] } : { value: s };
}

export function trailStats(t: Trail, l: Locale, diff = false): Cell[] {
  const cells: Cell[] = [
    { icon: 'distance', label: pick(S.statDist, l), ...figure(fmtKm(t.lengthKm)) },
    { icon: 'mountain', label: pick(S.statGain, l), ...figure(fmtM(t.gainM)) },
    { icon: 'clock', label: pick(S.statTime, l), value: fmtTime(t.time, l) }
  ];
  if (diff) cells.push({ label: pick(S.statDiff, l), value: pick(DIFF[t.diff], l) });
  return cells;
}
