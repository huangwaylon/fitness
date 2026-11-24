// ボット's bots, left to right (docs/bots.md): each one's tab (icon, label), its lastKnown key, who has it, and
// its driver, loaded lazily (the pages: BotsSheet's chunk). Always loaded (the HUD's dot ranks the bots: summary.svelte.ts), so it
// imports no client: the drivers (lib/<bot>/bot.ts) and the pages come with ボット's chunk. A phone has ジム with
// GYM_URL set, 保養所 with ITS_URL set and 定期処理 (the relay's /jobs, with the Kalori scraper's status.json: once メニュー's own tab), the guest's too (it reads,
// never changes: bots.viewOnly); demo mode has none (no fixtures: the e2e pair a key and mock the Workers; open.svelte.ts botTabs).
import type { BotDriver } from '#lib/bots/types.ts';
import type { IconName } from '../ui/Icon.svelte';
import { LIVE } from '#lib/sync/storage.ts';

export type BotId = 'gym' | 'its' | 'jobs';

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
// (transport.ts RECORD_CONFIGURED's rule, without its module)
const RECORD_ON = (env.VITE_RECORD_URL ?? env.VITE_LIVE_URL ?? 'x').trim() !== '';

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
  // 定期処理: every recurring job but the bots' own (the relay's GET /jobs; メニュー's row), on wherever the record is
  {
    id: 'jobs', icon: 'clock', labelKey: 'bots.jobs', storageKey: LIVE.botsJobs,
    on: RECORD_ON,
    driver: () => drive(import('#lib/jobs/bot.ts'))
  }
];

export const botMeta = (id: BotId): BotMeta => BOTS.find((b) => b.id === id)!;
