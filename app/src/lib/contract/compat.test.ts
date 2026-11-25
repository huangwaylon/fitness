// The pages' compatibility epoch (compat.ts) follows the live protocol: a page of an older build speaks only its own
// LIVE_V and ROOM_PROTOCOL, so a change of either (or of the versions the relay speaks) without a COMPAT bump leaves
// open pages talking to a relay that drops them. Bumping COMPAT: add its row here.
// And every change of live-protocol.ts's code (2026-11-22: it changed 32 times with no word of what an older page does
// with it) is a new LIVE_REV, its fingerprint and its note here: what a page of an older build makes of it (it reads a
// newer one's messages as well as it can, intentOf `lax`, and its person is told to update: ui-state/peerVer.ts), and
// whether it needs COMPAT (no older page can work with it) or LIVE_VS (the relay speaks both) as well.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COMPAT } from './compat.ts';
import { LIVE_REV, LIVE_V, LIVE_VS } from './live-protocol.ts';
import { ROOM_PROTOCOL } from './ticket.ts';

/** Each epoch's protocol, as it was when COMPAT took that value. */
const EPOCHS: Record<number, { LIVE_V: number; LIVE_VS: readonly number[]; ROOM_PROTOCOL: string }> = {
  1: { LIVE_V: 3, LIVE_VS: [3], ROOM_PROTOCOL: 'island-v1' },
  // 2026-11-25: the shared field (contract/farm.ts): `farm` rows {ops} with time-based plants; an older page can't read them
  2: { LIVE_V: 3, LIVE_VS: [3], ROOM_PROTOCOL: 'island-v1' },
  // 2026-11-25: やること's one list (contract/todo.ts): items `{text, note?}` with no list; an older page shows none of
  // them and its list ops are dropped by the record
  3: { LIVE_V: 3, LIVE_VS: [3], ROOM_PROTOCOL: 'island-v1' }
};

/** Each LIVE_REV: live-protocol.ts's code as it shipped (`fp`: liveShape) and what an older page makes of the change. */
const REVS: Record<number, { fp: string; note: string }> = {
  1: {
    fp: 'e82c333fb51f',
    note: 'the first counted (2026-11-22): presence `re`, `ver`, the hello\'s b/pr/sv, tent `sc` x and lax reading. An older page drops `ver` and a `re` (its presence on changes nothing) and reads the rest; no COMPAT'
  }
};

/** live-protocol.ts's code without its comments or whitespace, hashed (12 hex): its shape, a comment's edit no change. */
function liveShape(): string {
  const src = readFileSync(new URL('./live-protocol.ts', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1').replace(/\s+/g, '');
  return createHash('sha256').update(code).digest('hex').slice(0, 12);
}

describe('COMPAT', () => {
  it('is bumped with the live protocol (LIVE_V, LIVE_VS, ROOM_PROTOCOL)', () => {
    expect(EPOCHS[COMPAT], `COMPAT ${COMPAT} has no row: add it with the protocol it ships`).toBeDefined();
    expect({ LIVE_V, LIVE_VS: [...LIVE_VS], ROOM_PROTOCOL }, 'the live protocol changed: bump COMPAT (contract/compat.ts) and add its row').toEqual(EPOCHS[COMPAT]);
  });

  it('LIVE_REV is bumped, with a note, whenever live-protocol.ts\'s code changes', () => {
    const fp = liveShape();
    expect(REVS[LIVE_REV], `LIVE_REV ${LIVE_REV} has no row: add { fp: '${fp}', note } (what an older page makes of the change; COMPAT or LIVE_VS too if none can work with it)`).toBeDefined();
    expect(fp, `live-protocol.ts's code changed since LIVE_REV ${LIVE_REV}: bump LIVE_REV and add its row { fp: '${fp}', note } (what an older page makes of it; COMPAT or LIVE_VS too if none can work with it)`).toBe(REVS[LIVE_REV].fp);
    // the revisions only go up, each its own code
    const fps = Object.values(REVS).map((r) => r.fp);
    expect(new Set(fps).size).toBe(fps.length);
    expect(Math.max(...Object.keys(REVS).map(Number))).toBe(LIVE_REV);
  });
});
