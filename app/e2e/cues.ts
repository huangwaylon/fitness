// The sound cues the page has played (src/lib/sound/cues.ts: window.__cues collects each one once a spec's init script
// sets it to []).
import type { Page } from './fixtures.ts';

/** The cues so far, by name; `drain`: and forget them (the next read has only the newer ones). */
export const cues = (page: Page, { drain = false }: { drain?: boolean } = {}) =>
  page.evaluate((drain) => {
    const c = (window as { __cues?: string[] }).__cues ?? [];
    return drain ? c.splice(0) : c;
  }, drain);
