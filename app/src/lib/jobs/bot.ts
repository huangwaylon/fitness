// ボット's 定期処理 driver (lib/bots/types.ts): the relay's GET /jobs and the Kalori scraper's status.json (status.ts),
// its verdict over the rows with 「!」 for a 不調 row, an open alert issue or メニュー 保留, read every minute while shown.
// Loaded lazily (components/bots/registry.ts).
import type { BotDriver } from '#lib/bots/types.ts';
import { fetchJobs, parseView, verdictOf, type JobsView } from './status.ts';

export const driver: BotDriver<JobsView> = {
  fetch: (signal) => fetchJobs(signal),
  parse: (x) => parseView(x),
  verdict: (s, now) => {
    const { tone, w, word, sentence, needsLook } = verdictOf(s, now);
    return { tone, w, word, sentence, needsLook };
  },
  pollMs: () => 60_000
};
