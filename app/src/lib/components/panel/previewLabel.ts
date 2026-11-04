// What a seasonal preview's choice is called (せってい's きせつ, the HUD's chip): a birthday by the villager's name.
import { PEOPLE } from '#lib/config/rules.ts';
import { t } from '#lib/i18n/index.ts';
import type { WeekView } from '#lib/types.ts';
import type { Choice } from '#lib/ui-state/preview.ts';

export function previewLabel(key: keyof Choice, v: string, view: WeekView | null | undefined): string {
  const who = v === 'birthday-A' ? 'A' : v === 'birthday-B' ? 'B' : null;
  if (who) return t('preview.event.birthday', { name: view?.people[who].villagerName ?? PEOPLE[who].villager });
  return t(`preview.${key}.${v}`);
}
