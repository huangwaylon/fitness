// The saved-places layer on a non-places map (docs/places.md "Map": the trail's and the trip's), the GL side: the
// places near the map's path (near.ts) as the trail's ink-brown squares (badge.ts), 14 px with the family's glyph
// from z12, 10 px plain from z10, none below (hike mode's 12 px); at 0.85 opacity; under `before` (the map's own
// marks over them); the chosen one ringed in yuzu, its name over it on a cream halo where the style has a font. Added to
// the map's style once it's in (its own two sources), drawn only on a change; a tap on a square through the map's one
// tap router (gl.ts). No MapLibre value imported.
import type { ExpressionSpecification, GeoJSONSource, LayerSpecification, Map as GLMap } from 'maplibre-gl';
import { PLACE_CAT_KEYS, type PlaceCat } from '#lib/contract/places.ts';
import { tapRouter } from '../gl.ts';
import { lazyImages } from '../gl-images.ts';
import { fc, pt } from '../geojson.ts';
import { EMPTY } from '../style.ts';
import { C } from '../theme.ts';
import { CAT_GLYPHS, squareId, trailBadge } from './badge.ts';

export interface MapPlace { id: string; lng: number; lat: number; cat: PlaceCat; name: string }

export const SAVED = { src: 'saved', selSrc: 'saved-sel', layer: 'saved', sel: 'saved-sel' } as const;
/** The squares' zooms: none under `min`, plain under `glyph`, with their glyph from it. */
export const SQUARE_Z = { min: 10, glyph: 12 } as const;

/** The squares' size (a share of the 16 px image): 10 px, then 14 (hike mode: 10, then 12). */
const iconSize = (small: boolean): ExpressionSpecification => ['step', ['zoom'], 10 / 16, SQUARE_Z.glyph, (small ? 12 : 14) / 16];

/** The layer's two layers, pure. `font`: the style's label font (the chosen one's name; none: the ring alone);
 *  `yieldLabels`: the basemap's labels make room for the squares (else they draw through them). */
export function placesLayers(o: { small?: boolean; font?: string[]; yieldLabels?: boolean } = {}): LayerSpecification[] {
  const keep = { 'icon-allow-overlap': true, 'icon-ignore-placement': !(o.yieldLabels ?? true) };
  return [
    {
      id: SAVED.layer, type: 'symbol', source: SAVED.src, minzoom: SQUARE_Z.min,
      layout: { 'icon-image': ['step', ['zoom'], squareId(null), SQUARE_Z.glyph, ['concat', 'tp-', ['get', 'cat']]], 'icon-size': iconSize(!!o.small), ...keep },
      paint: { 'icon-opacity': 0.85 }
    } as LayerSpecification,
    {
      id: SAVED.sel, type: 'symbol', source: SAVED.selSrc,
      layout: {
        'icon-image': ['concat', 'tp-', ['get', 'cat'], '-sel'], 'icon-allow-overlap': true, 'icon-ignore-placement': true,
        ...(o.font ? { 'text-field': ['get', 'name'], 'text-font': o.font, 'text-size': 13, 'text-anchor': 'bottom', 'text-offset': [0, -1.2], 'text-max-width': 12, 'text-optional': true } : {})
      },
      paint: o.font ? { 'text-color': C.ink, 'text-halo-color': C.cream, 'text-halo-width': 3 } : {}
    } as LayerSpecification
  ];
}

interface PlacesLayerGL {
  /** The places (drawn only when they changed), shown or hidden (the layer's toggle), hike mode's smaller squares. */
  set(pts: readonly MapPlace[], shown: boolean, small: boolean): void;
  /** The chosen one (null: none): its ring and name. */
  select(p: MapPlace | null): void;
  /** The squares drawn (the specs' state). */
  count(): number;
  destroy(): void;
}

const IMG = /^tp-(.+?)(-sel)?$/;

export function placesLayer(map: GLMap, o: { before?: string; font?: string[]; yieldLabels?: boolean; onplace?: (id: string) => void } = {}): PlacesLayerGL {
  let pts: readonly MapPlace[] = [], shown = true, small = false, sel: MapPlace | null = null;
  let ready = false, drawn = '', sized = false;
  const src = (id: string) => map.getSource<GeoJSONSource>(id);

  const dropImages = lazyImages(map, (id) => {
    if (id === squareId(null)) return () => trailBadge(null);
    const m = IMG.exec(id);
    return m && (PLACE_CAT_KEYS as string[]).includes(m[1]) ? () => trailBadge(m[1] as PlaceCat, !!m[2]) : null;
  }, CAT_GLYPHS);
  const dropTap = tapRouter(map).add([SAVED.layer], (f) => {
    const id = f.properties?.id;
    if (typeof id === 'string') o.onplace?.(id);
  }, () => ready && shown && pts.length > 0);

  function draw(): void {
    if (!ready) return;
    // (the same squares again, as the toggle or hike mode changes: no setData, no layout again)
    const key = pts.map((p) => `${p.id} ${p.cat} ${p.lng} ${p.lat}`).join('|');
    if (key !== drawn) ((drawn = key), src(SAVED.src)?.setData(fc(pts.map((p) => pt(p.lng, p.lat, { id: p.id, cat: p.cat }))) as never));
    map.setLayoutProperty(SAVED.layer, 'visibility', shown ? 'visible' : 'none');
    map.setLayoutProperty(SAVED.sel, 'visibility', shown ? 'visible' : 'none');
    if (sized !== small) ((sized = small), map.setLayoutProperty(SAVED.layer, 'icon-size', iconSize(small)));
  }
  const drawSel = () => ready && src(SAVED.selSrc)?.setData(fc(sel ? [pt(sel.lng, sel.lat, { cat: sel.cat, name: sel.name })] : []) as never);

  function add(): void {
    if (!map.getSource(SAVED.src)) {
      map.addSource(SAVED.src, { ...EMPTY });
      map.addSource(SAVED.selSrc, { ...EMPTY });
      const before = o.before && map.getLayer(o.before) ? o.before : undefined;
      for (const l of placesLayers({ small, font: o.font, yieldLabels: o.yieldLabels })) map.addLayer(l, before);
      sized = small;
    }
    ready = true;
    draw();
    drawSel();
  }
  if ((map as unknown as { style?: { _loaded?: boolean } }).style?._loaded) add();
  else map.once('style.load', add);

  return {
    set(p, s, sm) {
      ((pts = p), (shown = s), (small = sm));
      draw();
    },
    select(p) {
      sel = p;
      drawSel();
    },
    count: () => (ready && shown ? map.queryRenderedFeatures({ layers: [SAVED.layer] }).length : 0),
    destroy() {
      ready = false;
      dropImages();
      dropTap();
    }
  };
}
