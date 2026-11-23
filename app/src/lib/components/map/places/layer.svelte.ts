// A non-places map's 保存した場所 layer, the Svelte side (docs/places.md "Map"; the trail's, the trip's): the places'
// copy read once the map has a path (offline too: IndexedDB first), the ones near it (near.ts nearRoute), the phone's
// one switch (setting.ts), and the one chosen (its floating card: places/PlaceFloat). Made in a component's script (its
// effect). The GL side is layer.ts; /s (a shared trip) never makes one, so never loads the store.
import { untrack } from 'svelte';
import type { Place } from '#lib/contract/places.ts';
import { places } from '#lib/places/store.svelte.ts';
import { localKV } from '#lib/sync/storage.ts';
import type { MapPlace } from './layer.ts';
import { nearRoute } from './near.ts';
import { placesOn, setPlacesOn } from './setting.ts';

type Path = readonly (readonly number[])[];

export class PlacesLayer {
  /** The layer's switch (this phone's, every map's). */
  on = $state(placesOn(localKV()));
  #path: () => Path | null;
  #id = $state<string | null>(null);
  /** The saved places near the path, nearest first. */
  near = $derived.by((): Place[] => {
    const p = this.#path(), rows = places.rows;
    return p && p.length && rows ? nearRoute(rows, p) : [];
  });
  /** What the map draws. */
  pts = $derived(this.near.map((p): MapPlace => ({ id: p.id, lng: p.lng, lat: p.lat, cat: p.cat, name: p.name })));
  /** The one chosen (null: none, or gone from the set). */
  selected = $derived(this.#id ? (this.near.find((p) => p.id === this.#id) ?? null) : null);

  /** `path`: the map's [lon, lat] points in order (a track; a day's stops and legs), null while it has none. */
  constructor(path: () => Path | null) {
    this.#path = path;
    $effect(() => {
      if (this.#path()) untrack(() => void places.load());
    });
  }

  toggle(): void {
    this.on = !this.on;
    setPlacesOn(localKV(), this.on);
    if (!this.on) this.#id = null;
  }

  select(id: string | null): void {
    this.#id = id;
  }
}
