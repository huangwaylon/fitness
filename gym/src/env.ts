// The Worker's bindings (wrangler.toml) and secrets (`npx wrangler secret put <NAME>`, README "Secrets").
import type { GymBot } from './bot.ts';

export interface Env {
  /** 'off' (the Mac runs the bot: LINE's events are ignored, no checks) or 'bot' (this Worker is the bot). */
  MODE: 'off' | 'bot';
  BOT: DurableObjectNamespace<GymBot>;
  LINE_CHANNEL_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
  /** The one group answered and alerted; events from other groups only log their ID (how it's found at setup). */
  LINE_GROUP_ID: string;
  /** The key for the state's import/export (/gym/state). */
  GYM_TOKEN: string;
  /** The deployed commit (scripts/deploy.sh), shown by /health. */
  COMMIT?: string;
}
