// The island's ambience (docs/design/sound.md §2), pure: which loops sound at a given hour, month and weather, and
// how loud. They play on the music bus (ミュージック) and only from files (static/audio/manifest.json `ambient`);
// there is no procedural placeholder: a synthesised surf wears thin within a day (round 14 review).
import type { Weather } from './hourly.ts';

export type AmbientId = 'waves' | 'birds' | 'cicadas' | 'higurashi' | 'crickets' | 'wind' | 'rain';
export const AMBIENT_IDS: readonly AmbientId[] = ['waves', 'birds', 'cicadas', 'higurashi', 'crickets', 'wind', 'rain'];

/** Hour in [from, to), wrapping past midnight when from > to. */
const within = (h: number, from: number, to: number) => (from <= to ? h >= from && h < to : h >= from || h < to);

/** The layers for a Tokyo hour (0–23), month (1–12) and weather, quietest last. NH's insects follow the real
 *  seasons and hours of the northern hemisphere (cicadas July–August by day, the evening cicada at dawn and dusk,
 *  crickets on autumn nights); birds sing on fine days; the surf never stops on an island. */
export function ambientFor(hour: number, month: number, weather: Weather): { id: AmbientId; gain: number }[] {
  const out: { id: AmbientId; gain: number }[] = [{ id: 'waves', gain: 0.5 }];
  const wet = weather !== 'sunny';
  if (weather === 'rain') out.push({ id: 'rain', gain: 0.55 });
  if (weather === 'snow' || month === 12 || month <= 2) out.push({ id: 'wind', gain: weather === 'snow' ? 0.4 : 0.25 });
  if (!wet && within(hour, 5, 17) && month >= 3 && month <= 11) out.push({ id: 'birds', gain: within(hour, 5, 9) ? 0.45 : 0.3 });
  if (!wet && (month === 7 || month === 8)) {
    if (within(hour, 8, 17)) out.push({ id: 'cicadas', gain: 0.35 });
    if (within(hour, 4, 8) || within(hour, 16, 19)) out.push({ id: 'higurashi', gain: 0.35 });
  }
  if (weather !== 'snow' && month >= 9 && month <= 11 && within(hour, 17, 5)) out.push({ id: 'crickets', gain: 0.35 });
  return out;
}
