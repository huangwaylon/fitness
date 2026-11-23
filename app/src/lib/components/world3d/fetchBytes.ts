// A model's or a texture's file, fetched with a bound on the wait for its answer (world3d/gltf.ts, ktx2.ts).
/** A request the network hasn't begun to answer in this long (ms) is given up (fetchBytes). */
export const ANSWER_MS = 5000;
/** A file's bytes; rejects when its answer hasn't begun within `ms` (lie-fi: connected, nothing answers; the service
 *  worker answers a cached file at once, so only an uncached one waits): the island goes on without it, the file asked
 *  for again at its next use, instead of a load (and `loaded`, and the launch's first placing) waiting for good. Its
 *  body, once begun, isn't timed (a slow link's big file). */
export async function fetchBytes(url: string, ms = ANSWER_MS): Promise<ArrayBuffer> {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(new Error(`no answer in ${ms} ms: ${url}`)), ms);
  let r: Response;
  try {
    r = await fetch(url, { signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!r.ok) throw new Error(`${r.status}: ${url}`);
  return r.arrayBuffer();
}
