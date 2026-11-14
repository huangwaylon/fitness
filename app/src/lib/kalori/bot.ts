// ボット's メニュー driver (lib/bots/types.ts): status.json (status.ts), its verdict (遅れ by the phone's clock too:
// verdictOf) with 「!」 for 保留, 不調, 遅れ, an alert or a run two days overdue (needsAttention), read every minute while
// shown. Loaded lazily (components/bots/registry.ts).
import type { BotDriver } from '#lib/bots/types.ts';
import { t } from '#lib/i18n/index.ts';
import { fetchStatus, needsAttention, parseStatus, verdictView, type KaloriStatus } from './status.ts';

export const driver: BotDriver<KaloriStatus> = {
  fetch: (signal) => fetchStatus(signal),
  parse: (x) => parseStatus(x),
  verdict: (s, now) => {
    const { tone, w, word, sentence } = verdictView(s, now);
    return { tone, w, word, sentence, needsLook: needsAttention(s, now), ...(w === 'held' ? { act: t('kalori.act.held') } : {}) };
  },
  pollMs: () => 60_000
};
