// The ops' shared checks (the board's, the island's things, the meal log's, the packing list's, the wedding board's:
// contract/board.ts, decor.ts, layout.ts, tent.ts, food.ts, pack.ts, wedding.ts). Pure and dependency-free.

/** An integer within [lo, hi]. */
export const isInt = (n: unknown, lo: number, hi: number): n is number => Number.isInteger(n) && (n as number) >= lo && (n as number) <= hi;
/** A time in ms since the epoch (2001 … 5138). */
export const isMs = (n: unknown): n is number => isInt(n, 1e12, 1e14);
/** Whether an object has no keys but `keys`. */
export const only = (d: Record<string, unknown>, keys: readonly string[]): boolean => Object.keys(d).every((k) => keys.includes(k));
/** An op's `at` (the sender's relay clock) at most this far past the record's: a clock far ahead would stamp an op no
 *  later change could beat. */
export const AHEAD_MS = 24 * 60 * 60 * 1000;
/** A new op's id: `prefix`, its time in base 36 and four random base-36 digits. */
export const newOpId = (prefix: string, at: number): string => `${prefix}${at.toString(36)}${Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')}`;
