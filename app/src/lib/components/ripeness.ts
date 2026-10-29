/** Four clearly different ripeness stages (U1): bud < 25% · small < 60% · nearly < 100% · ripe. */
export type Ripeness = 'bud' | 'small' | 'nearly' | 'ripe';
export function ripeness(pct: number): Ripeness {
  return pct >= 100 ? 'ripe' : pct >= 60 ? 'nearly' : pct >= 25 ? 'small' : 'bud';
}
