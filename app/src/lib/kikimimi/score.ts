// ききみみ クイズ: scoring (docs/kikimimi.md "Scoring"). A right answer is 100; wrong or timed out is 0. No speed bonus
// (it rewarded guessing), and no first-listen bonus either (the user's, 2026-11-06): 「いっぱつ」, right with no replay or
// slow play, is a badge on the reveal and the results only. No imports: the session and the protocol's checks can use it
// without the bank.

export const RIGHT = 100;

/** One answer's points. */
export const points = (right: boolean): number => (right ? RIGHT : 0);

/** 「いっぱつ」: right on the first listen (no replay, no slow play; おなじへや's: never, only the host's phone can
 *  replay). A badge, no points. */
export const firstListen = (right: boolean, replayed: boolean, same = false): boolean => right && !replayed && !same;
