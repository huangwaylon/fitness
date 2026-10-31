// The island's ambience (docs/design.md#ambience), pure: which loops sound at a given hour, month and weather, and
// how loud. They play on the music bus (ミュージック), from the procedural beds (ambientSynth.ts) unless
// static/audio/manifest.json `ambient` names a file for one.
import type { Weather } from './hourly.ts';

export type AmbientId = 'waves' | 'birds' | 'cicadas' | 'higurashi' | 'crickets' | 'wind' | 'rain';
export const AMBIENT_IDS: readonly AmbientId[] = ['waves', 'birds', 'cicadas', 'higurashi', 'crickets', 'wind', 'rain'];

/** Hour in [from, to), wrapping past midnight when from > to. */
const within = (h: number, from: number, to: number) => (from <= to ? h >= from && h < to : h >= from || h < to);

/** Variants of a bed: the birds of spring (the bush warbler), summer, autumn (the bulbul) and winter. */
export type BedVariant = 'spring' | 'summer' | 'autumn' | 'winter';
/** The season of the birds for a month (the bush warbler sings March–May). */
const birdSeason = (month: number): BedVariant =>
  month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';

/** A layer: its bed, its level and, for the birds, the season's (the bush warbler sings in spring). */
export interface AmbientLayer {
  id: AmbientId;
  gain: number;
  v?: BedVariant;
}

/** The layers for a Tokyo hour (0–23), month (1–12) and weather, quietest last. NH's insects follow the real
 *  seasons and hours of the northern hemisphere (cicadas July–August by day, the evening cicada at dawn and dusk,
 *  crickets on autumn nights); birds sing on fine days, most at dawn, a few in winter; the surf never stops on an
 *  island. `heavy`: a downpour (the rain louder, the surf under it). */
export function ambientFor(hour: number, month: number, weather: Weather, o: { heavy?: boolean } = {}): AmbientLayer[] {
  const heavy = weather === 'rain' && !!o.heavy;
  const out: AmbientLayer[] = [{ id: 'waves', gain: heavy ? 0.4 : 0.5 }];
  const wet = weather !== 'sunny';
  if (weather === 'rain') out.push({ id: 'rain', gain: heavy ? 0.7 : 0.45 });
  if (weather === 'snow' || month === 12 || month <= 2) out.push({ id: 'wind', gain: weather === 'snow' ? 0.35 : 0.2 });
  const winter = month === 12 || month <= 2;
  if (!wet && within(hour, 5, winter ? 16 : 17)) {
    out.push({ id: 'birds', gain: (within(hour, 5, 9) ? 0.45 : 0.3) * (winter ? 0.6 : 1), v: birdSeason(month) });
  }
  if (!wet && (month === 7 || month === 8)) {
    if (within(hour, 8, 17)) out.push({ id: 'cicadas', gain: 0.35 });
    if (within(hour, 4, 8) || within(hour, 16, 19)) out.push({ id: 'higurashi', gain: 0.35 });
  }
  if (!wet && month >= 9 && month <= 11 && within(hour, 17, 5)) out.push({ id: 'crickets', gain: 0.35 });
  return out;
}
