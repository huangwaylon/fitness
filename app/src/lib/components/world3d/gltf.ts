// The glTF models' textures as plain images on WebKit (the users' Safari). three's GLTFLoader decodes a model's images
// into ImageBitmaps where it can (Safari 17+ too), but WebKit uploads an ImageBitmap to WebGL slowly: on the iOS
// Simulator the critters' 196 small textures took 280-340 ms of the main thread as ImageBitmaps against 34 ms as
// <img>s (texImage2D and mipmaps, each texture ~1.5-2 ms against ~0.17), so the museum's way in spent most of its
// longest frames uploading. A plain image looks the same (three's glTF textures are unflipped and unpremultiplied
// either way). Chromium keeps its ImageBitmaps (decoded off the main thread, uploaded quickly there).
import { TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { ktx2Plugin } from './ktx2.ts';

/** WebKit's Safari (GLTFLoader's own test): not Chrome's or Android's. */
const WEBKIT = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/** `loader`'s models' images as plain <img>s on WebKit (a no-op elsewhere). */
function plainImages(loader: GLTFLoader): GLTFLoader {
  if (!WEBKIT) return loader;
  return loader.register((parser) => {
    const t = new TextureLoader(parser.options.manager);
    t.setCrossOrigin(parser.options.crossOrigin);
    parser.textureLoader = t;
    return { name: 'island_plain_images' };
  });
}

const loaders = new Map<string, GLTFLoader>();
/** The page's glTF loader of a kind, one each, shared (a loader keeps nothing of a load): meshopt's decoder always;
 *  `ktx2`: the island's models' textures from their KTX2s (ktx2.ts); `plain`: plain images on WebKit (the rooms'). */
export function glbLoader(o: { ktx2?: boolean; plain?: boolean } = {}): GLTFLoader {
  const k = `${o.ktx2 ? 'k' : ''}${o.plain ? 'p' : ''}`;
  let l = loaders.get(k);
  if (!l) {
    l = new GLTFLoader();
    if (o.plain) plainImages(l);
    if (o.ktx2) ktx2Plugin(l);
    l.setMeshoptDecoder(MeshoptDecoder);
    loaders.set(k, l);
  }
  return l;
}
