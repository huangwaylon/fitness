// A file a saved area may hold (a trail's net file: lib/offline/save.ts) asked of the network on a weak one (the
// mountains' lie-fi: a request neither answered nor failed for many seconds): the saved copy after a short wait, or at
// once when the phone says it is offline. Pure (the worker's index.ts passes the fetch and the saved copy's lookup).

/** How long the network gets before a saved copy is used instead (ms). */
export const NET_FALLBACK_MS = 3_000;

/** The network's ok answer within `ms`, else the saved copy, else the network's answer whenever it comes (an error
 *  response when it fails too). Offline (`online` false), the saved copy first. */
export async function netOrSaved(net: Promise<Response | null>, saved: () => Promise<Response | null | undefined>, o: { online: boolean; ms?: number }): Promise<Response> {
  const late = async () => (await net) ?? Response.error();
  if (!o.online) return (await saved()) ?? late();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const first = await Promise.race([net, new Promise<'slow'>((r) => (timer = setTimeout(() => r('slow'), o.ms ?? NET_FALLBACK_MS)))]);
  clearTimeout(timer);
  if (first !== 'slow' && first?.ok) return first;
  return (await saved()) ?? (first === 'slow' ? late() : (first ?? Response.error()));
}
