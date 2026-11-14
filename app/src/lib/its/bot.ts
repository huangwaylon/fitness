// ボット's 保養所 driver (lib/bots/types.ts): GET /its/status with the member key (client.ts; no key: `no_key`, the dot
// 不明), its verdict with 「!」 for a hold waiting for a person (要対応), 不調 or 遅れ (view.ts needsAttention), read
// every 15 s while running, else every minute (pollMs). Loaded lazily (components/bots/registry.ts).
import type { BotDriver } from '#lib/bots/types.ts';
import type { ItsStatus } from './contract.ts';
import { fetchStatus, parseStatus } from './client.ts';
import { needsAttention, pollMs, verdictView } from './view.ts';

export const driver: BotDriver<ItsStatus> = {
  fetch: (signal) => fetchStatus(signal),
  parse: parseStatus,
  verdict: (s) => ({ ...verdictView(s), needsLook: needsAttention(s) }),
  pollMs
};
