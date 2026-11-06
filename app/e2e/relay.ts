// The relay as the e2e's own islands stand it up (record.ts, liveRoom.ts; tests only): the production relay's address
// the app's CSP lets in (each context routes it to the relay's real code in the test's process), and the members' and
// the guest's keys the record knows them by.
export const RELAY = 'https://island-fund-relay.island-fund-relay.workers.dev';
export const KEYS = { KEY_A: 'a1'.repeat(32), KEY_B: 'b2'.repeat(32), KEY_C: 'c3'.repeat(32) };
export const KEY_OF = { A: KEYS.KEY_A, B: KEYS.KEY_B, G: KEYS.KEY_C } as const;
export type Who = keyof typeof KEY_OF;
