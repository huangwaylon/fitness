// The maps' GeoJSON in a few words (docs/design.md "Maps"), pure: a collection, a point, a line, and the box round a
// set of points. (No @types/geojson dependency: GeoJSONSource.setData takes these as they are.)

export type LL = [lng: number, lat: number];
type Props = Record<string, unknown>;
export interface PointFeature<P extends Props = Props> { type: 'Feature'; properties: P; geometry: { type: 'Point'; coordinates: LL } }
export interface LineFeature<P extends Props = Props> { type: 'Feature'; properties: P; geometry: { type: 'LineString'; coordinates: LL[] } }
export interface Collection<F = PointFeature | LineFeature> { type: 'FeatureCollection'; features: F[] }

export const fc = <F>(features: F[]): Collection<F> => ({ type: 'FeatureCollection', features });
export const pt = <P extends Props = Props>(lng: number, lat: number, properties: P = {} as P): PointFeature<P> => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [lng, lat] } });
export const ln = <P extends Props = Props>(coordinates: LL[], properties: P = {} as P): LineFeature<P> => ({ type: 'Feature', properties, geometry: { type: 'LineString', coordinates } });

/** [[west, south], [east, north]] round the points, or null for none. */
export function bboxOf(points: Iterable<readonly number[]>): [[number, number], [number, number]] | null {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [x, y] of points) ((w = Math.min(w, x)), (e = Math.max(e, x)), (s = Math.min(s, y)), (n = Math.max(n, y)));
  return w === Infinity ? null : [[w, s], [e, n]];
}
