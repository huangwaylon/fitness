// What the editor's 3D preview and the home picker take from three, by name (their `import('three')` of the whole
// module kept every export of three in the shared three chunk, ~680 → ~526 KB raw: the perf reviewer's). Lazy-loaded
// with them.
export {
  Box3, Color, DirectionalLight, Fog, Group, HemisphereLight, MOUSE, Mesh, PCFSoftShadowMap, PerspectiveCamera, SRGBColorSpace, Scene, Vector3, WebGLRenderer
} from 'three';
