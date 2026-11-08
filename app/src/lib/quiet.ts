// Failures a caller goes on without that should still show in IslandLog (docs/ops/observability.md): `quiet(p, tag)`
// settles to a fallback on a rejection and counts `swallow:<tag>` (the `use` event's counters, summed a flush, so a
// burst costs nothing). For network, storage, decode and relay failures; a harmless rejection (an autoplay refusal, a
// suspend) stays a plain `.catch(() => {})`. Imports nothing, so any folder may use it: the log (sync/log.ts) plugs
// its counter in.

let sink: (tag: string) => void = () => {};

/** The log's counter (sync/log.ts, once). */
export const quietSink = (fn: (tag: string) => void): void => void (sink = fn);

/** Count a swallowed failure (a `catch {}`, an error callback). `tag`: [A-Za-z0-9_.-], at most 32. */
export const swallowed = (tag: string): void => sink(tag);

/** `p`, or `fallback` (undefined if none) once it rejects, the failure counted as `swallow:<tag>`. Never rejects. */
export function quiet<T>(p: Promise<T>, tag: string): Promise<T | undefined>;
export function quiet<T, F>(p: Promise<T>, tag: string, fallback: F): Promise<T | F>;
export function quiet<T, F>(p: Promise<T>, tag: string, fallback?: F): Promise<T | F | undefined> {
  return p.catch(() => (swallowed(tag), fallback));
}
