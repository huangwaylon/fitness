// The Worker's bindings (wrangler.toml) and secrets (`npx wrangler secret put <NAME>`, README "Secrets").
import type { ItsBot } from './bot.ts';

export interface Env {
  /** 'on' (runners may run) or 'off' (the stop switch: every runner told to stop, no dispatch). */
  MODE: 'on' | 'off';
  BOT: DurableObjectNamespace<ItsBot>;
  /** The app's page origins (comma-separated), for CORS; localhost always. */
  ALLOWED_ORIGINS: string;
  /** The members' keys, copied from the relay's secrets (rotate both places). The guest's is never set here. */
  KEY_A?: string;
  KEY_B?: string;
  /** The runner's key (`Authorization: Bearer …` on /runner/*). */
  ITS_RUNNER_TOKEN?: string;
  /** A fine-grained PAT (this repo, Actions read/write) for 開始's workflow_dispatch. Unset: no dispatch (the
   *  schedule starts a run). */
  GH_DISPATCH_TOKEN?: string;
  /** The deployed commit (scripts/deploy.sh), shown by /health and the status. */
  COMMIT?: string;
}
