// A place's links out (docs/places.md "Card"): ルート (Google Maps' directions to it: the public URL scheme, no key, no
// API), Googleマップ (the place itself by its cid, by its ftid, else a search of its name and address), and what
// コピー puts on the clipboard. Pure.
import { placeUrl, type Place } from '../contract/places.ts';

const deg = (x: number) => String(+x.toFixed(6));
export const routeUrl = (p: Pick<Place, 'lat' | 'lng'>): string => `https://www.google.com/maps/dir/?api=1&destination=${deg(p.lat)},${deg(p.lng)}`;

export function mapsUrl(p: Pick<Place, 'id' | 'name' | 'addr' | 'lat' | 'lng'>): string {
  if (p.id.startsWith('f:')) return `https://www.google.com/maps?ftid=${encodeURIComponent(p.id.slice(2))}`;
  if (/^\d+$/.test(p.id)) return placeUrl(p);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.name, p.addr].filter(Boolean).join(' ') || `${p.lat},${p.lng}`)}`;
}

/** The name, then the address on its own line. */
export const copyText = (p: Pick<Place, 'name' | 'addr'>): string => [p.name, p.addr].filter(Boolean).join('\n');
