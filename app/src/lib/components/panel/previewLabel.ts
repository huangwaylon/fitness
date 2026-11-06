// What a seasonal preview's choice is called: 設定's 季節 (`season.*`, the sheet's kanji) or the HUD's chip (`preview.*`,
// the world's kana: docs/design.md "Copy"); a birthday by the villager's name.
import { PEOPLE } from '#lib/config/rules.ts';
import { t } from '#lib/i18n/index.ts';
import type { WeekView } from '#lib/types.ts';
import type { Choice } from '#lib/ui-state/preview.ts';

export function previewLabel(key: keyof Choice, v: string, view: WeekView | null | undefined, zone: 'preview' | 'season' = 'preview'): string {
  const who = v === 'birthday-A' ? 'A' : v === 'birthday-B' ? 'B' : null;
  if (who) return t(`${zone}.event.birthday`, { name: view?.people[who].villagerName ?? PEOPLE[who].villager });
  return t(`${zone}.${key}.${v}`);
}
