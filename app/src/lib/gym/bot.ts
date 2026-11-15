// ボット's ジム driver (lib/bots/types.ts): the Worker's public /status (status.ts), its verdict with 「!」 for 故障
// or a 不調 the bot can't retry away (needsAttention), read every minute while shown. Loaded lazily (components/bots/registry.ts).
import type { BotDriver } from '#lib/bots/types.ts';
import { fetchStatus, needsAttention, parseStatus, verdictView, type GymStatus } from './status.ts';

export const driver: BotDriver<GymStatus> = {
  fetch: (signal) => fetchStatus(signal),
  parse: parseStatus,
  verdict: (s, now) => ({ ...verdictView(s), needsLook: needsAttention(s, now) }),
  pollMs: () => 60_000
};
