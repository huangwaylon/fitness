// A load done once, its failure forgotten (the next call tries again): a lazy chunk or JSON table out of the first
// load. Imports nothing, so any folder may use it; a sheet's chunk, which reloads into a newer build when its file is
// gone, is ui-state/reload.ts lazy().

/** `load`'s promise, kept once it resolves; a rejection is passed on and let go of. */
export function once<T>(load: () => Promise<T>): () => Promise<T> {
  let p: Promise<T> | null = null;
  return () =>
    (p ??= load().catch((e: unknown) => {
      p = null;
      throw e;
    }));
}
