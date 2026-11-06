// Where the trip map's basemap comes from (docs/travel.md "Maps", decisions.md): OpenFreeMap's public planet, vector
// tiles in the OpenMapTiles schema (OpenStreetMap data, ODbL), online only. The one third party the phones contact:
// it sees the phone's IP and which tiles it views, never the trip's data. Self-hosting later (the same schema) is a
// change to this module only; basemap.ts holds the schema's layers.

/** The tiles' origin: the CSP's connect-src names it (vite.config.ts). */
const TILE_ORIGIN = 'https://tiles.openfreemap.org';
/** The TileJSON (its versioned tile URLs and zoom range: the planet's maxzoom is 14, overzoomed past it). */
export const TILEJSON = `${TILE_ORIGIN}/planet`;

/** The attribution the licences ask for (OpenFreeMap's terms, OpenMapTiles' CC-BY, OpenStreetMap's ODbL). */
export const ATTRIBUTION = [
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>',
  '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a>',
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>'
].join(' ');

export function basemapSource(url: string = TILEJSON): { type: 'vector'; url: string; attribution: string } {
  return { type: 'vector', url, attribution: ATTRIBUTION };
}
