// The island's weather now (docs/design.md "Weather"): weather.ts at each new minute, for the scene, the critters, the
// footsteps and the music (it sets sound.weather and sound.heavy: the hour's arrangement and the rain bed). `?weather=clear|rain|heavy|snow|fog|aurora|rainbow` (dev or `?demo`) forces
// one for this load; `?seed=` (dev or `?demo`) varies the island's seed like the rest of the island.
import { untrack } from 'svelte';
import { jst, minuteNow, now } from '#lib/time/clock.ts';
import { localDateAt } from '#lib/time/dates.ts';
import { sound } from '#lib/sound/sound.svelte.ts';
import { ISLAND_SEED } from './beach.ts';
import { FORCED, musicWeather, weatherAt, type Forced, type WeatherNow } from './weather.ts';

export const weather = $state<WeatherNow>({ sky: 'clear', fog: false, rainbow: 0, aurora: false });

/** Raining now (the ground is wet: footsteps splash, the rain-only critters are about). */
export const raining = (): boolean => weather.sky === 'rain' || weather.sky === 'heavy';

function forced(q: URLSearchParams): Forced | null {
  const w = q.get('weather') as Forced | null;
  return w && FORCED.includes(w) ? w : null;
}

function apply(at: Date, seed: string, force: Forced | null): void {
  const w = weatherAt(localDateAt(at.getTime()), jst(at).hour, seed, force);
  if (w.sky !== weather.sky || w.fog !== weather.fog || w.rainbow !== weather.rainbow || w.aurora !== weather.aurora) Object.assign(weather, w);
  const music = musicWeather(w.sky), heavy = w.sky === 'heavy';
  if (sound.weather !== music) sound.weather = music;
  if (sound.heavy !== heavy) sound.heavy = heavy;
}

/** Follow the clock (at each new minute); returns a cleanup function. */
export function startWeather(): () => void {
  const q = new URLSearchParams(location.search);
  const hooks = import.meta.env.DEV || q.has('demo');
  const seed = (hooks && q.get('seed')) || ISLAND_SEED;
  const force = hooks ? forced(q) : null;
  apply(now(), seed, force);
  return $effect.root(() => {
    $effect(() => {
      const at = minuteNow();
      untrack(() => apply(at, seed, force));
    });
  });
}
