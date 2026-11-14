// ボット's ジム driver (lib/bots/types.ts): the Worker's public /status (status.ts), its verdict with 「!」 for 不調,
// 故障 or 遅れ (needsAttention), read every minute while shown. Loaded lazily (components/bots/registry.ts).
import type { BotDriver } from '#lib/bots/types.ts';
import { t } from '#lib/i18n/index.ts';
import { fetchStatus, needsAttention, parseStatus, verdictView, type GymStatus } from './status.ts';

export const driver: BotDriver<GymStatus> = {
  fetch: (signal) => fetchStatus(signal),
  parse: parseStatus,
  verdict: (s) => ({ ...verdictView(s), needsLook: needsAttention(s), act: t('gym.act.check') }),
  pollMs: () => 60_000
};
