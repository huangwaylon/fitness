// The pages' compatibility epoch (compat.ts) follows the live protocol: a page of an older build speaks only its own
// LIVE_V and ROOM_PROTOCOL, so a change of either (or of the versions the relay speaks) without a COMPAT bump leaves
// open pages talking to a relay that drops them. Bumping COMPAT: add its row here.
import { describe, expect, it } from 'vitest';
import { COMPAT } from './compat.ts';
import { LIVE_V, LIVE_VS } from './live-protocol.ts';
import { ROOM_PROTOCOL } from './ticket.ts';

/** Each epoch's protocol, as it was when COMPAT took that value. */
const EPOCHS: Record<number, { LIVE_V: number; LIVE_VS: readonly number[]; ROOM_PROTOCOL: string }> = {
  1: { LIVE_V: 3, LIVE_VS: [3], ROOM_PROTOCOL: 'island-v1' }
};

describe('COMPAT', () => {
  it('is bumped with the live protocol (LIVE_V, LIVE_VS, ROOM_PROTOCOL)', () => {
    expect(EPOCHS[COMPAT], `COMPAT ${COMPAT} has no row: add it with the protocol it ships`).toBeDefined();
    expect({ LIVE_V, LIVE_VS: [...LIVE_VS], ROOM_PROTOCOL }, 'the live protocol changed: bump COMPAT (contract/compat.ts) and add its row').toEqual(EPOCHS[COMPAT]);
  });
});
