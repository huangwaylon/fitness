// The Worker's bindings (wrangler.toml) and secrets (`npx wrangler secret put <NAME>`, README "Secrets").
import type { ItsBot } from './bot.ts';
import { appConfigured, type GhAppConfig, type Narrowing } from './ghApp.ts';

/** An exception's name for a log line (`err=`): never its message (it may quote a body); `error` for a non-Error. */
export const errName = (e: unknown): string => (e instanceof Error ? e.name : 'error');

export interface Env {
  /** 'on' (runners may run) or 'off' (the stop switch: every runner told to stop, no dispatch). */
  MODE: 'on' | 'off';
  BOT: DurableObjectNamespace<ItsBot>;
  /** The app's page origins (comma-separated), for CORS; localhost always. */
  ALLOWED_ORIGINS: string;
  /** The person keys, copied from the relay's secrets (rotate both places): the members' (KEY_A, KEY_B) on every page
   *  route; the guest's (KEY_C; unset: no guest) on the reads and its own phone's push, never /its/settings or /its/run. */
  KEY_A?: string;
  KEY_B?: string;
  KEY_C?: string;
  /** The runner's key (`Authorization: Bearer …` on /runner/*). */
  ITS_RUNNER_TOKEN?: string;
  /** The alerting workflow's key (`Authorization: Bearer …` on GET /health/its; a repo secret there). Unset: refused. */
  ITS_HEALTH_TOKEN?: string;
  /** The GitHub App (README "GitHub App"): its ID, its installation's ID, its private key for this Worker (PKCS#8 PEM).
   *  All three set: every GitHub call carries the App's installation token (ghApp.ts), narrowed to GH_NARROW. */
  GH_APP_ID?: string;
  GH_APP_INSTALLATION_ID?: string;
  GH_APP_KEY_ITS?: string;
  /** A fine-grained PAT (this repo, Actions read/write): the fallback while the App isn't set or its mint fails. Neither:
   *  no dispatch (the handoff and the schedule start runs; the watchdog logs no_token once and pushes). */
  GH_DISPATCH_TOKEN?: string;
  /** Web Push's VAPID public key (wrangler.toml var: an uncompressed P-256 point, base64url; the page subscribes with
   *  it). Not a key (the placeholder): push is off. */
  VAPID_PUBLIC?: string;
  /** Its private scalar (base64url, 32 bytes; a secret: scripts/vapid-keys.ts). Unset: push is off. */
  VAPID_PRIVATE?: string;
  /** The deployed commit (scripts/deploy.sh), shown by /health and the status. */
  COMMIT?: string;
}

/** What its-bot's token may touch: Actions (dispatch, runs, cancel) on this repo, nothing else. */
export const GH_NARROW: Narrowing = { repositories: ['fitness'], permissions: { actions: 'write' } };

export const ghConfigOf = (env: Env): GhAppConfig =>
  ({ appId: env.GH_APP_ID, installationId: env.GH_APP_INSTALLATION_ID, key: env.GH_APP_KEY_ITS, pat: env.GH_DISPATCH_TOKEN });

/** A GitHub identity is set: the App's secrets, or the PAT. */
export const hasGitHub = (env: Env): boolean => !!env.GH_DISPATCH_TOKEN?.trim() || appConfigured(ghConfigOf(env));
