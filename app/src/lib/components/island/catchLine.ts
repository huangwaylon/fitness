// The catch line for a critter (docs/design.md "Scene interactions"): NH's own line from catchLines.ts (its own chunk,
// loaded with the first critter of a session), else our short caption. Shared by the critters' catches and the wasp
// netted from a shaken tree's nest (TreeShakes.svelte).
import { i18n, t } from '#lib/i18n/index.ts';
import { week } from '#lib/store/week.svelte.ts';
import { caption, type BugId, type FishId, type JunkId } from './critters.ts';

let chunk: Promise<typeof import('./catchLines.ts')['CATCH_LINES']> | null = null;
/** Starts (or joins) loading the catch lines. */
export const loadLines = () => (chunk ??= import('./catchLines.ts').then((m) => m.CATCH_LINES));

/** NH's line for `item` in the app's language (「<Player>」 is my よびな), else our caption. */
export async function catchLine(item: FishId | JunkId | BugId): Promise<string> {
  const lines = await loadLines().catch(() => null);
  const line = lines?.[item]?.[i18n.locale === 'en' ? 1 : 0];
  if (line) return line.replace('<Player>', week.view?.people[week.view.me].villagerName ?? '');
  const c = caption(item);
  return t(c.key, c.name ? { name: t(c.name) } : undefined);
}
