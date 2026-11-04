// The glTF models' textures as plain images on WebKit (the users' Safari). three's GLTFLoader decodes a model's images
// into ImageBitmaps where it can (Safari 17+ too), but WebKit uploads an ImageBitmap to WebGL slowly: on the iOS
// Simulator the critters' 196 small textures took 280-340 ms of the main thread as ImageBitmaps against 34 ms as
// <img>s (texImage2D and mipmaps, each texture ~1.5-2 ms against ~0.17), so the museum's way in spent most of its
// longest frames uploading. A plain image looks the same (three's glTF textures are unflipped and unpremultiplied
// either way). Chromium keeps its ImageBitmaps (decoded off the main thread, uploaded quickly there).
import { TextureLoader } from 'three';
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** WebKit's Safari (GLTFLoader's own test): not Chrome's or Android's. */
const WEBKIT = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/** `loader`'s models' images as plain <img>s on WebKit (a no-op elsewhere). */
export function plainImages(loader: GLTFLoader): GLTFLoader {
  if (!WEBKIT) return loader;
  return loader.register((parser) => {
    const t = new TextureLoader(parser.options.manager);
    t.setCrossOrigin(parser.options.crossOrigin);
    parser.textureLoader = t;
    return { name: 'island_plain_images' };
  });
}
