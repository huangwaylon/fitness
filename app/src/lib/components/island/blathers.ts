// Blathers at the museum (docs/design.md "Museum"): what he says when the museum is tapped, before the ずかん opens.
// NH's Blathers (フータ) is an owl: he dozes at his desk by day and is wide awake at night. So by day his greeting is
// drowsy, by night lively; when either of us found something in the last week, he mostly mentions the latest find.
// Our own short lines in his manner (「ホー！」, polite and a little professorial), ja/en. Pure: the component picks the
// hour, the latest find's name and the roll.

/** NH's owl keeps the island's night hours (design.md "Environment": night 19–05). */
export const awake = (hour: number): boolean => hour >= 19 || hour < 5;

/** Greetings per mood (museum.<mood>.<n>). */
export const GREETINGS = 3;

/** A find this recent is news to him (ms). */
export const RECENT_MS = 7 * 86_400_000;

/** What he says, one page (the ずかん opens when it closes, so it stays short): with a recent find, 3 times in 5 a line
 *  about it in the hour's mood; otherwise a greeting for the hour (never the last one again). Returns an i18n key (the
 *  find line takes `{name}`). */
export function blathersLine(hour: number, recentFind: boolean, r: () => number, last?: string): string {
  const mood = awake(hour) ? 'night' : 'day';
  if (recentFind && r() < 0.6) return `museum.${mood}.find`;
  const keys = Array.from({ length: GREETINGS }, (_, i) => `museum.${mood}.${i}`).filter((k) => k !== last);
  return keys[Math.floor(r() * keys.length)];
}
