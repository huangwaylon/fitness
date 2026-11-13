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
  /** The members' person keys (the relay's KEY_A and KEY_B), for /gym/config. The guest's is never set here, so a
   *  guest is refused like a stranger. */
  KEY_A?: string;
  KEY_B?: string;
  /** The members' names in the app's changes (LINE's アプリで変更 line, 📋, the app's list); unset: メンバーA / B.
   *  Secrets, so the names stay out of this public repo. */
  NAME_A?: string;
  NAME_B?: string;
  /** The app's page origins allowed to read /gym/config (exact, comma-separated; localhost always). */
  ALLOWED_ORIGINS?: string;
  /** The deployed commit (scripts/deploy.sh), shown by /health. */
  COMMIT?: string;
}
