// The 保存した場所 layer's one switch on this phone (docs/places.md "Map"): every non-places map's (the trail's, the
// trip's), on by default; unset, the trail map's old key's value (DEVICE.trailPlaces, read as the fallback). Pure but
// for the store handed in.
import { DEVICE, readJson, writeJson, type KV } from '#lib/sync/storage.ts';

export const placesOn = (kv: KV | null): boolean => readJson<boolean>(kv, DEVICE.mapPlaces) ?? readJson<boolean>(kv, DEVICE.trailPlaces) ?? true;

export const setPlacesOn = (kv: KV | null, on: boolean): boolean => writeJson(kv, DEVICE.mapPlaces, on);
