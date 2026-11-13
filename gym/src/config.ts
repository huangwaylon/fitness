// The bot's fixed settings, the app's contract's (app/src/lib/gym/contract.ts: the app draws the same rules). What the
// group changes (the days, the interval, stop/restart) is in the state (store.ts).
export { CLOSES, DAYS_TO_CHECK, DEFAULT_WINDOW, OPENS } from '../../app/src/lib/gym/contract.ts';

/** Minutes between checks, until changed with 🔧 チェック設定. */
export const CHECK_INTERVAL_MINUTES = 15;
