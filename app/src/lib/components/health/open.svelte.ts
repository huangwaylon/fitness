// けんこう and ごはん's sheet, a lazySheet (its chunk holds ごはん's code, never its food data): the HUD's dumbbell shows it
// on the tab shown last; a tree popup's ごはん button (docs/design.md "Trees") shows it on ごはん, today, on the tree's
// owner's day, and a goal's cell on 健康's 活動 at that goal's card, the tree's owner's (HealthSheet reads the ask). Kept
// apart so the island's chunk never loads the sheet's.
import type { Who } from '#lib/types.ts';
import type { Metric } from '#lib/model/health.ts';
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

/** Its show's arg: whose day; `metric`: 健康's 活動 at that card, else ごはん. */
export interface KenkouAsk {
  who: Who;
  metric?: Metric;
}
export const kenkou = lazySheet<KenkouAsk>(() => import('./HealthSheet.svelte'));

export const askFood = (who: Who): void => kenkou.show({ who });
export const askActivity = (who: Who, metric: Metric): void => kenkou.show({ who, metric });
