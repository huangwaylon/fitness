// The island's weather now (docs/design.md "Weather"): weather.ts at each new minute, for the scene, the critters, the
// footsteps and the music (it sets sound.weather and sound.heavy: the hour's arrangement and the rain bed).
// `?weather=clear|rain|heavy|snow|fog|aurora|rainbow` (dev or `?demo`) forces one for this load and せってい's きせつ shows
// one (ui-state/preview.svelte.ts); `?seed=` (dev or `?demo`) varies the island's seed like the rest of the island.
// What the island yields (the rain-only critters) follows `yieldSky`: the real weather (or the dev param), never the
// setting's.
import { untrack } from 'svelte';
import { dayKey, jst, minuteNow } from '#lib/time/clock.ts';
import { sound } from '#lib/sound/sound.svelte.ts';
import { scenePreview } from '#lib/ui-state/preview.svelte.ts';
import { hookOneOf, islandSeed } from './devHooks.ts';
import { FORCED, musicWeather, weatherAt, type Forced, type Sky, type WeatherNow } from './weather.ts';

export const weather = $state<WeatherNow>({ sky: 'clear', fog: false, rainbow: 0, aurora: false });
/** The sky the critters come by (the real weather, or `?weather=`). */
export const yieldSky = $state<{ sky: Sky }>({ sky: 'clear' });

/** Raining now (the ground is wet: footsteps splash, the rain-only critters are about). */
export const raining = (): boolean => weather.sky === 'rain' || weather.sky === 'heavy';

const forcedOf = (w: string | null): Forced | null => ((FORCED as readonly string[]).includes(w ?? '') ? (w as Forced) : null);

function apply(at: Date, seed: string, shown: Forced | null): void {
  const date = dayKey(at), hour = jst(at).hour;
  const w = weatherAt(date, hour, seed, shown);
  if (w.sky !== weather.sky || w.fog !== weather.fog || w.rainbow !== weather.rainbow || w.aurora !== weather.aurora) Object.assign(weather, w);
  const real = weatherAt(date, hour, seed, hookOneOf('weather', FORCED)).sky;
  if (yieldSky.sky !== real) yieldSky.sky = real;
  const music = musicWeather(w.sky), heavy = w.sky === 'heavy';
  if (sound.weather !== music) sound.weather = music;
  if (sound.heavy !== heavy) sound.heavy = heavy;
}

/** Follow the clock (at each new minute) and the preview; returns a cleanup function. */
export function startWeather(): () => void {
  const seed = islandSeed();
  apply(minuteNow(), seed, forcedOf(scenePreview().weather));
  return $effect.root(() => {
    $effect(() => {
      const at = minuteNow(), shown = forcedOf(scenePreview().weather);
      untrack(() => apply(at, seed, shown));
    });
  });
}
