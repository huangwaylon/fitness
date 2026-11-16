// The ずかん's packed icons (scripts/art-packs.ts: the catalogue's clothing, recipes and artworks in
// static/art/finds/pack/<tab>[-k].<hash>.pak, ~200 KB each): a packed key has no file of its own, its picture is an
// object URL cut from its pack. The index (each pack's keys and their bytes, ~8 KB on the wire; its hash bundled:
// packs.json) is fetched with the first catalogue key asked for and kept for the page's life; a pack once at a time
// (packStore.ts: Pages ignores a Range), held a little while (its icons' object URLs are made as they're asked for and
// kept for the page's life, ~2 KB each). The service worker keeps both in the art cache (caches.ts isCritterArt; a
// pack's older hash let go: artEvict). Every other key is its own file (art.ts artUrl): only a catalogue key (art.ts
// isCatalogKey) can be packed.
import { art, artUrl, isCatalogKey } from '#lib/art.ts';
import { PackStore, type PackRef } from '#lib/packStore.ts';
import { quiet } from '#lib/quiet.ts';
import { staticUrl } from '#lib/staticUrl.ts';
import BUNDLED from './packs.json' with { type: 'json' };

const store = new PackStore({ url: (stem) => staticUrl(`art/finds/pack/${stem}.pak`), cap: 1_000_000, tag: 'art', dropOnHide: true, idleMs: 10_000 });

/** key → where it is in its pack, once the index is in. */
let index: Map<string, PackRef> | null = null;
let loading: Promise<boolean> | null = null;

/** The index as scripts/art-packs.ts writes it: stem → [the first file's offset, `id:bytes,…`] (ids under finds/). */
export function readIndex(j: Record<string, [number, string]>): Map<string, PackRef> {
  const out = new Map<string, PackRef>();
  for (const [stem, [head, ids]] of Object.entries(j)) {
    let at = head;
    for (const e of ids.split(',')) {
      const i = e.lastIndexOf(':'), n = Number(e.slice(i + 1));
      out.set(`finds/${e.slice(0, i)}`, [stem, at, n]);
      at += n;
    }
  }
  return out;
}

/** The index fetched (once; again after a failure): whether it's in. */
export function artIndex(): Promise<boolean> {
  if (index) return Promise.resolve(true);
  return (loading ??= quiet(
    fetch(staticUrl(`art/finds/pack/index.${BUNDLED.index}.json`)).then((r) => (r.ok ? (r.json() as Promise<Record<string, [number, string]>>) : null)),
    'art.index',
    null
  ).then((j) => {
    loading = null;
    if (j) index = readIndex(j);
    return !!j;
  }));
}

/** Whether a key is packed: undefined while that isn't known (a catalogue key before the index is in: artIndex). */
export function artPacked(key: string | null | undefined): boolean | undefined {
  if (!key || !isCatalogKey(key) || !art(key)) return false;
  return index ? index.has(key) : undefined;
}

/** Each packed key's object URL (made once, kept for the page's life), and the ones made (artSrcNow). */
const blobs = new Map<string, Promise<string | null>>();
const made = new Map<string, string>();

async function blobOf(key: string): Promise<string | null> {
  const b = await store.bytes(index!.get(key)!);
  if (!b) return null;
  const u = URL.createObjectURL(new Blob([b], { type: 'image/webp' }));
  made.set(key, u);
  return u;
}

/** A key's picture now, if known without waiting: its file's URL, a packed one's object URL once made; null for no
 *  art; undefined: artSrc has to fetch (the index, or the pack). */
export function artSrcNow(key: string | null | undefined): string | null | undefined {
  const p = artPacked(key);
  if (p === false) return artUrl(key);
  return p ? made.get(key!) : undefined;
}

/** Any key's picture: its file's URL, or a packed one's object URL (its pack fetched once); null when there's no art
 *  or it can't be had (offline, the pack not kept: asked again, it tries again). */
export async function artSrc(key: string | null | undefined): Promise<string | null> {
  if (artPacked(key) === undefined && !(await artIndex())) return null;
  if (!artPacked(key)) return artUrl(key);
  let p = blobs.get(key!);
  if (!p) {
    blobs.set(key!, (p = blobOf(key!)));
    void p.then((u) => u || blobs.delete(key!));
  }
  return p;
}
