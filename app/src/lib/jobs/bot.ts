// ボット's 定期処理 driver (lib/bots/types.ts): the relay's GET /jobs (status.ts), its verdict over the rows with 「!」 for
// a 不調 row or an open alert issue, read every minute while shown. Loaded lazily (components/bots/registry.ts).
import type { BotDriver } from '#lib/bots/types.ts';
import { parseJobs, type JobsStatus } from '#lib/contract/jobs.ts';
import { fetchJobs, verdictOf } from './status.ts';

export const driver: BotDriver<JobsStatus> = {
  fetch: (signal) => fetchJobs(signal),
  parse: (x) => parseJobs(x),
  verdict: (s, now) => {
    const { tone, w, word, sentence, needsLook } = verdictOf(s, now);
    return { tone, w, word, sentence, needsLook };
  },
  pollMs: () => 60_000
};
