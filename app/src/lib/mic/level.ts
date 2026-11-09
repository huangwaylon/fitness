// A take's voice level as the mic buttons' ring shows it. Its own module: the buttons' chunks stay free of the mic core.

/** A level in dBFS as 0–1 (−60 → −15), the mic button's ring. */
export const level01 = (db: number): number => Math.min(1, Math.max(0, (db + 60) / 45));
