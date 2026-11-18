// 英語すごろく's mini-games' switch (docs/sugoroku.md "みんなで！"): off until their screens land. Off, nothing changes: new
// boards are the generator's GEN 1 (no みんなで！ stones) and new online games carry RULES '1'; this build folds only those.
// To turn them on: MINIS = true here (new boards GEN 2, new games RULES '2', this build folding '1' and '2'), with the
// UI that plays the `mini` phase. The logic's tests turn it on for their file only (vi.mock of this module).
export const MINIS = false;
