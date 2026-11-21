// A flat earth over a trail's few km (equirectangular: metres per degree of latitude, of longitude at a latitude), the
// one helper the in-hike map, the junction's highlight, the accuracy circle and the net build share. Within ~0.1 % at
// a trail's spans; across many km use track.ts hav.

/** Metres per degree of latitude. */
export const M_LAT = 111_320;
/** Metres per degree of longitude at `lat`. */
export const mLon = (lat: number): number => M_LAT * Math.cos((lat * Math.PI) / 180);
/** Metres between two points (short distances), the scale at their middle latitude. */
export const flatM = (lon1: number, lat1: number, lon2: number, lat2: number): number => Math.hypot((lon2 - lon1) * mLon((lat1 + lat2) / 2), (lat2 - lat1) * M_LAT);
