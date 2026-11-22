// The shared clock a piece's use loops on (docs/design.md "The gym": both phones show the same rep, yoga pose and climb
// height): the relay's (sync/live.ts serverNow) where a screen sets it, the rooms' (rooms/roomRelay.ts) and the
// island's, else the device's. Read each frame, never anchored at load: iOS may pause a page's performance.now() in a
// sleep, and two phones' device clocks differ. Its own module: the island's screen sets it without loading three.
let now: () => number = () => Date.now();

/** The relay's clock for the uses' loops (null: the device's again). */
export function useLoopClock(f: (() => number) | null): void {
  now = f ?? (() => Date.now());
}
/** The loops' clock now (ms since the epoch). */
export const loopNow = (): number => now();
