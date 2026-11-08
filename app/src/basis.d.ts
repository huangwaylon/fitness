// three's Basis Universal transcoder (an Emscripten module): a default export only through vite.config.ts basisModule
// (world3d/basisModule.ts). The parts world3d/ktx2.worker.ts uses.
declare module 'three/examples/jsm/libs/basis/basis_transcoder.js' {
  interface KTX2File {
    isValid(): boolean;
    getWidth(): number;
    getHeight(): number;
    getLevels(): number;
    getHasAlpha(): boolean;
    startTranscoding(): boolean;
    getImageLevelInfo(level: number, layer: number, face: number): { origWidth: number; origHeight: number };
    getImageTranscodedSizeInBytes(level: number, layer: number, face: number, format: number): number;
    transcodeImage(dst: Uint8Array, level: number, layer: number, face: number, format: number, flags: number, channel0: number, channel1: number): number;
    close(): void;
    delete(): void;
  }
  interface Basis {
    initializeBasis(): void;
    KTX2File: new (data: Uint8Array) => KTX2File;
  }
  /** The module, once its wasm is compiled (rejects if it can't be). */
  const BASIS: (module: { wasmBinary: ArrayBuffer }) => Promise<Basis>;
  export default BASIS;
  export type { Basis, KTX2File };
}
