// NH's ground textures' images (static/terrain/nh/*.webp, ~100 KB of WebP in all), loaded and decoded once a page. The
// launch asks for them with the ground's fields (+layout.ts), so the 3D island's ground finds them in as it's built and
// bakes each band once, with them (terrain.ts); a ground built before they're in bakes its palette alone, and again
// once they are. No three.js here (the launch imports it before the island's chunk).

/** The ground's textures (terrain.ts buildGround: the cliffs' strata, the bake's sand, paving, grass and soil, the falls). */
export const NH_GROUND = ['cliff', 'cliff-snow', 'sand', 'stone', 'brick', 'plank', 'grass-mix', 'soil-mix', 'falls'] as const;

/** A texture's image: `img` once loaded and decoded; `p` resolves to it (null: it failed, and the next ask tries again). */
interface NhImage {
  img?: HTMLImageElement;
  p: Promise<HTMLImageElement | null>;
}
const images = new Map<string, NhImage>();

/** A texture's URL under the site's base. */
export const nhURL = (name: string, base: string): string => `${base}terrain/nh/${name}.webp`;

/** The image at `url`: the one loaded already, or on its way (asked now if no one has). */
export function nhImage(url: string): NhImage {
  const had = images.get(url);
  if (had) return had;
  const img = document.createElement('img');
  img.decoding = 'async';
  const e: NhImage = {
    p: new Promise((res) => {
      // (decoded off the main thread before the bake's upload wants it)
      img.addEventListener('load', () => void Promise.resolve(img.decode?.()).catch(() => {}).then(() => res((e.img = img))), { once: true });
      img.addEventListener('error', () => (images.delete(url), res(null)), { once: true });
    })
  };
  images.set(url, e);
  img.src = url;
  return e;
}

/** The launch: every ground texture asked for ahead of the island's mount. */
export function primeGround(base = new URL('.', document.baseURI).href): void {
  for (const n of NH_GROUND) nhImage(nhURL(n, base));
}
