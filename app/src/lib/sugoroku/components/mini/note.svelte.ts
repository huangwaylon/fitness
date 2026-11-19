// A mini-game screen's soft note (its Nudge): said for a while, then gone; a new one takes its place, and its timer
// goes with the screen. Called in a component's script.
export function flashNote(): { readonly text: string; say: (t: string, ms?: number) => void } {
  let text = $state('');
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(timer));
  return {
    get text() {
      return text;
    },
    say(t, ms = 1600) {
      clearTimeout(timer);
      text = t;
      timer = setTimeout(() => (text = ''), ms);
    }
  };
}
