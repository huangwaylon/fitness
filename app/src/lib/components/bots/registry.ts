// ボット's bots, left to right (docs/design.md "Bots"): each one's tab (icon, label), its lastKnown key, who has it, and
// its driver, loaded lazily (the pages: BotsSheet's chunk). Always loaded (the HUD's dot ranks the bots: summary.svelte.ts), so it
// imports no client: the drivers (lib/<bot>/bot.ts) and the pages come with ボット's chunk. A member has ジム with
// GYM_URL set, 保養所 with ITS_URL set and メニュー (the Kalori scraper's public status.json); the guest and demo mode
// have none (no fixtures: the e2e pair a key and mock the Workers; open.svelte.ts botTabs).
import type { BotDriver } from '#lib/bots/types.ts';
import type { IconName } from '../ui/Icon.svelte';
import { LIVE } from '#lib/sync/storage.ts';

export type BotId = 'gym' | 'its' | 'kalori';

export interface BotMeta {
  id: BotId;
  icon: IconName;
  /** The tab's label (i18n/bots). */
  labelKey: string;
  /** Its last status on this phone (lastKnown.ts). */
  storageKey: string;
  /** Configured in this build (its Worker's URL set). */
  on: boolean;
  driver(): Promise<BotDriver<unknown>>;
}

// (the URLs as lib/its/client.ts and lib/gym/status.ts read them: empty hides that bot; read here so the island's
// chunk carries neither client)
const env = (import.meta.env ?? {}) as Record<string, string | undefined>;
const ITS_ON = env.VITE_ITS_URL !== '';
const GYM_ON = env.VITE_GYM_URL !== '';

const drive = <S>(m: Promise<{ driver: BotDriver<S> }>) => m.then((x) => x.driver as unknown as BotDriver<unknown>);

export const BOTS: readonly BotMeta[] = [
  {
    id: 'gym', icon: 'barbell', labelKey: 'bots.gym', storageKey: LIVE.botsGym,
    on: GYM_ON,
    driver: () => drive(import('#lib/gym/bot.ts'))
  },
  {
    id: 'its', icon: 'bed', labelKey: 'bots.its', storageKey: LIVE.botsIts,
    on: ITS_ON,
    driver: () => drive(import('#lib/its/bot.ts'))
  },
  {
    id: 'kalori', icon: 'utensils', labelKey: 'bots.kalori', storageKey: LIVE.botsKalori,
    on: true,
    driver: () => drive(import('#lib/kalori/bot.ts'))
  }
];

export const botMeta = (id: BotId): BotMeta => BOTS.find((b) => b.id === id)!;
