// The bot's fixed settings. What the group changes (the days, the interval, stop/restart) is in the state (store.ts).

import type { Clock } from './time.ts';

/** Days checked without a setting: today and the next 3. */
export const DAYS_TO_CHECK = 4;
/** What those days are checked for: slots that start and end inside it (12:00 and 12:30). */
export const DEFAULT_WINDOW: readonly [Clock, Clock] = ['12:00', '13:00'];
/** Minutes between checks, until changed with 🔧 チェック設定. */
export const CHECK_INTERVAL_MINUTES = 15;
/** Slots are 30 minutes and start 10:00–21:30. */
export const OPENS = '10:00';
export const CLOSES = '22:00';
