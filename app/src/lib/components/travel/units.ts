// The trip guides' distances in this phone's units (docs/travel.md "Units": km / mi, a device pref). A stand-in from
// the UI branch: the packing-list branch delivers the real one (the せってい switch, its DEVICE key); this reads the
// same localStorage key ('travel.units': 'km' | 'mi', km by default) so the merge only swaps the file.
import { localKV } from '#lib/sync/storage.ts';

/** Miles in a kilometre. */
const MI = 0.621371;

/** The phone's units: 'mi' when set so, else 'km'. */
export const unitsNow = (): 'km' | 'mi' => (localKV()?.getItem('travel.units') === 'mi' ? 'mi' : 'km');

/** A distance from the guide (`{km:9.8}`): '9.8 km', or '6.1 mi' (one decimal under 10, whole above). */
export function fmtKm(km: number): string {
  if (unitsNow() === 'mi') {
    const mi = km * MI;
    return `${mi < 10 ? Math.round(mi * 10) / 10 : Math.round(mi)} mi`;
  }
  return `${km} km`;
}
