// ボット → Jobs in an outage (docs/bots.md "Jobs"): the relay answers 503 `unavailable` when the record can't be read
// (its objects over a Cloudflare limit, most likely) but still sends the free tier's usage; it is kept here while
// /jobs fails, so the page shows which limit was hit beside its LoadError. Set by status.ts fetchJobs, cleared by a
// good read.
import type { Usage } from '#lib/contract/jobs.ts';

export const outage = $state({ usage: null as Usage | null });
