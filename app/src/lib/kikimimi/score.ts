// ききみみ クイズ: scoring (docs/kikimimi.md "Scoring"). A right answer is 100, plus 30 if it was answered on the first
// listen (no replay, no slow play: 「1かいで！」). Wrong or timed out is 0. No speed bonus: it rewarded guessing.
// No imports: the session and the protocol's checks can use it without the bank.

export const RIGHT = 100;
export const FIRST_LISTEN = 30;

/** One answer's points: `replayed` is any replay or slow play before answering. */
export const points = (right: boolean, replayed: boolean): number => (right ? RIGHT + (replayed ? 0 : FIRST_LISTEN) : 0);
