/** A button that comes up where the previous screen's primary was (まとめ's おわる in まとめへ's slot): a tap carried over
 *  (a double tap, a habit) lands on it. `ok` turns away an activation that began within `ms` of the button's arrival
 *  (`arm`): timed by its pointerdown (the touch's start, so a slow release of the carried tap is still turned away),
 *  else by the click itself (VoiceOver, a keyboard: no pointer). Times in performance.now()'s clock. Only this button:
 *  nothing else is held up. */
export function tapGuard(ms = 600) {
  let from = -Infinity;
  let down: number | null = null;
  return {
    ms,
    arm(now: number): void {
      from = now;
      down = null;
    },
    /** A pointerdown on the button (null: the touch cancelled). */
    down(now: number | null): void {
      down = now;
    },
    /** A click: true to act on it. A pointerdown more than 1 s before isn't this click's (a cancelled touch's). */
    ok(now: number): boolean {
      const at = down !== null && now - down < 1000 ? down : now;
      down = null;
      return at - from >= ms;
    }
  };
}
