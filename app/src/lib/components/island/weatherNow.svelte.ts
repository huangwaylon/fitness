// The island's weather now (docs/design.md "Weather"): at each new minute, for the scene, the critters, the footsteps
// and the music (it sets sound.weather and sound.heavy: the hour's arrangement and the rain bed). The island's mode
// (`pref weatherMode`, せってい's てんき: one for the whole island) is `real` unless a member set `game`: then Tokyo's
// real sky by the hour from the relay's timeline (sync/wx.ts, cached for opening offline) while it covers the hour,
// else (and in `game`) the seeded day (weather.ts). A `?date=` preview moves the scene clock off the real hours: the
// seeded day.
// `?weather=clear|rain|heavy|snow|fog|aurora|rainbow` (dev or `?demo`) forces one for this load and せってい's きせつ shows
// one (ui-state/preview.svelte.ts); `?wx=real|game` forces the mode and `?wx=<fixture>` lays a canned timeline on the
// scene clock (wxFixtures.ts); `?seed=` (dev or `?demo`) varies the island's seed like the rest of the island.
// What the island yields (the rain-only critters) follows `yieldSky`: the mode's weather (or the dev param), never the
// preview's.
import { untrack } from 'svelte';
import { clockMoved, dayKey, jst, minuteNow, now } from '#lib/time/clock.ts';
import { sound } from '#lib/sound/sound.svelte.ts';
import { scenePreview } from '#lib/ui-state/preview.svelte.ts';
import { week } from '#lib/store/week.svelte.ts';
import { heldWx, onWx } from '#lib/sync/wx.ts';
import type { Wx } from '#lib/sync/live-protocol.ts';
import { isWeatherMode, type WeatherMode } from '#lib/contract/api.ts';
import { hook, hookOneOf, islandSeed } from './devHooks.ts';
import { FORCED, isRain, musicWeather, realWeatherAt, weatherAt, type Forced, type Sky, type WeatherNow } from './weather.ts';
import { WX_FIXTURES, wxFixture } from './wxFixtures.ts';

export const weather = $state<WeatherNow>({ sky: 'clear', fog: false, rainbow: 0, aurora: false });
/** The sky the critters come by (the mode's weather, or `?weather=`). */
export const yieldSky = $state<{ sky: Sky }>({ sky: 'clear' });
/** Where the island's weather comes from now (せってい's てんき): the mode, whether Tokyo's real sky is the one shown
 *  (false: the seeded day's, the mode's `game` or no timeline that serves), and when the timeline held was fetched. */
export const weatherSource = $state<{ mode: WeatherMode; real: boolean; at: number | null }>({ mode: 'real', real: false, at: null });

/** Raining now (the ground is wet: footsteps splash, the rain-only critters are about). */
export const raining = (): boolean => isRain(weather.sky);

const forcedOf = (w: string | null): Forced | null => ((FORCED as readonly string[]).includes(w ?? '') ? (w as Forced) : null);

/** The mode for this load: `?wx=real|game` (dev or `?demo`), else the island's (`pref weatherMode`), else `real`. */
function modeOf(set: unknown): WeatherMode {
  const forced = hook('wx');
  return isWeatherMode(forced) ? forced : isWeatherMode(set) ? set : 'real';
}

function apply(at: Date, seed: string, shown: Forced | null, mode: WeatherMode, wx: Wx | null): void {
  const date = dayKey(at), hour = jst(at).hour;
  const real = mode === 'real' ? realWeatherAt(wx, at.getTime(), seed) : null;
  const day = real ?? weatherAt(date, hour, seed);
  const w = shown ? weatherAt(date, hour, seed, shown) : day;
  if (w.sky !== weather.sky || w.fog !== weather.fog || w.rainbow !== weather.rainbow || w.aurora !== weather.aurora) Object.assign(weather, w);
  const dev = hookOneOf('weather', FORCED);
  const yields = dev ? weatherAt(date, hour, seed, dev).sky : day.sky;
  if (yieldSky.sky !== yields) yieldSky.sky = yields;
  if (weatherSource.mode !== mode || weatherSource.real !== !!real || weatherSource.at !== (wx?.at ?? null)) Object.assign(weatherSource, { mode, real: !!real, at: wx?.at ?? null });
  const music = musicWeather(w.sky), heavy = w.sky === 'heavy';
  if (sound.weather !== music) sound.weather = music;
  if (sound.heavy !== heavy) sound.heavy = heavy;
}

/** Follow the clock (at each new minute), the preview, the island's mode and the relay's timeline; returns a cleanup
 *  function. */
export function startWeather(): () => void {
  const seed = islandSeed();
  // a `?wx=` fixture on the scene clock's hours, else the relay's (none for a moved clock: another day's hours)
  const fixture = hookOneOf('wx', WX_FIXTURES);
  const held = $state<{ wx: Wx | null }>({ wx: fixture ? wxFixture(fixture, now().getTime()) : clockMoved() ? null : heldWx() });
  const off = fixture || clockMoved() ? () => {} : onWx((w) => (held.wx = w));
  const stop = $effect.root(() => {
    $effect(() => {
      const at = minuteNow(), shown = forcedOf(scenePreview().weather), mode = modeOf(week.model?.state.weatherMode), wx = held.wx;
      untrack(() => apply(at, seed, shown, mode, wx));
    });
  });
  return () => {
    off();
    stop();
  };
}
