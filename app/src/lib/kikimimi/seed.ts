// ききみみ クイズ: the lobby's flags, carried in the `open`'s seed's low bits (docs/kikimimi.md "Sync"). No wire field
// of their own, so no relay deploy (the relay passes known fields only); every phone reads the same flags from the
// `open`, and changing one deals a new deck, never seen yet. The other bits are the deck's (recent.ts seedWith).
//   bit 0     たいせん (ranking); clear: co-op, a new lobby's default.
//   bit 1     スピード はしご (ladder.ts): the deck is the ladders', the level unused; the session is the quiz's (8
//             questions), its points the deck's (games/ladder/def.ts: the climb). A quiz lobby's seed has it clear.
//   bits 2-3  こたえる じかん, the answer window: its index in TIMERS (0 30 s, the default; 1 20 s; 2 60 s; 3 none: the
//             reveal once everyone in it has answered).

/** The seed's flag bits. */
export const FLAG_BITS = 0xf;
const VERSUS = 1;
const LADDER = 2;
const TIMER_SHIFT = 2;
const TIMER = 3 << TIMER_SHIFT;

const setBits = (seed: number, mask: number, bits: number): number => ((seed & ~mask) | bits) >>> 0;

export const versus = (seed: number): boolean => (seed & VERSUS) === VERSUS;
export const withVersus = (seed: number, vs: boolean): number => setBits(seed, VERSUS, vs ? VERSUS : 0);

export const isLadder = (seed: number): boolean => (seed & LADDER) === LADDER;
export const withLadder = (seed: number, on: boolean): number => setBits(seed, LADDER, on ? LADDER : 0);

/** こたえる じかん's choices (s; 0: none), in the seed's order. */
export const TIMERS = [30, 20, 60, 0] as const;
export type QuizTimer = (typeof TIMERS)[number];
/** The seed's こたえる じかん as its index in TIMERS (QuizWindows.answers' order). */
export const timerIndex = (seed: number): number => (seed & TIMER) >>> TIMER_SHIFT;
export const timerOf = (seed: number): QuizTimer => TIMERS[timerIndex(seed)];
export const withTimer = (seed: number, timer: QuizTimer): number => setBits(seed, TIMER, Math.max(0, TIMERS.indexOf(timer)) << TIMER_SHIFT);
