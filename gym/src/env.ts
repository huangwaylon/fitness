// The Worker's bindings (wrangler.toml) and secrets (`npx wrangler secret put <NAME>`, README "Secrets").
import type { GymBot } from './bot.ts';

export interface Env {
  /** 'bot' (this Worker is the bot) or 'off' (the stop switch: LINE's events ignored, no checks). */
  MODE: 'off' | 'bot';
  BOT: DurableObjectNamespace<GymBot>;
  /** The Worker's own address, for /status's check of LINE's webhook URL (`${URL}/line/webhook`). */
  URL: string;
  LINE_CHANNEL_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
  /** The one group answered and alerted; events from other groups only log their ID (how it's found at setup). */
  LINE_GROUP_ID: string;
  /** The key for the state's import/export (/gym/state). */
  GYM_TOKEN: string;
  /** The deployed commit (scripts/deploy.sh), shown by /health. */
  COMMIT?: string;
}
