// Svelte transitions shared by the island's things.

/** NH's pick-up: a little hop up, shrinking and fading as it goes (a fruit, a branch). */
export function pickUp(_el: Element) {
  return {
    duration: 340,
    css: (tt: number, v: number) =>
      `transform: translateY(${(-60 * Math.sin(v * Math.PI * 0.6)).toFixed(1)}%) scale(${(1 - 0.7 * v * v).toFixed(3)}); opacity: ${Math.min(1, tt * 3).toFixed(2)}`
  };
}
