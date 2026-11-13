// A refused mic's way back (docs/kikimimi-mic.md "A refused mic"): WebKit refuses every later getUserMedia of the page
// that was refused, at once and without asking, until it loads again, and a Home Screen app is rarely reloaded. So
// 「もう一度 試す」 reloads the app with a note in sessionStorage (DEVICE.micRetry: which mic step, when), and the app comes
// back to that step (ききみみ › 設定 › マイク, or the probe's permission step), where the next tap asks afresh. Nothing
// remembers a refusal: every ask is getUserMedia inside a tap. Pure but for the store and the reload it's handed.
// The evidence (WebKit main, UserMediaPermissionRequestManagerProxy.cpp): a refused page's later ask outside a tap is
// refused unasked until its document changes, one inside a tap asks again; permissions.query says `prompt` for a stored
// refusal unless this page was refused already; Safari's recogniser needs its own speech permission
// (`service-not-allowed`). Undocumented: where a Home Screen app keeps its decision (WebKit bug 327237) and what but a
// relaunch resets it.
import { DEVICE, readJson, sessionKV, type KV } from '#lib/sync/storage.ts';

export type MicStep = 'optin' | 'probe';
const STEPS: readonly MicStep[] = ['optin', 'probe'];
/** A note older than this is let go (the reload didn't come back to it). */
export const RETRY_MS = 2 * 60_000;

/** The reload asked: the note kept, then `reload` (false: no storage, nothing done). */
export function retryMic(step: MicStep, o: { kv?: KV | null; now?: number; reload: () => void }): boolean {
  const kv = o.kv === undefined ? sessionKV() : o.kv;
  try {
    if (!kv) return false;
    kv.setItem(DEVICE.micRetry, JSON.stringify({ step, at: o.now ?? Date.now() }));
  } catch {
    return false;
  }
  o.reload();
  return true;
}

/** The step a fresh retry came back to (null: none, or too old). `take`: the note dropped (the step's own screen). */
export function micReturn(o: { kv?: KV | null; now?: number; take?: boolean } = {}): MicStep | null {
  const kv = o.kv === undefined ? sessionKV() : o.kv;
  const v = readJson(kv, DEVICE.micRetry) as { step?: unknown; at?: unknown } | null;
  const now = o.now ?? Date.now();
  const ok = !!v && STEPS.includes(v.step as MicStep) && typeof v.at === 'number' && now - v.at >= 0 && now - v.at < RETRY_MS;
  if (o.take || (v && !ok)) {
    try {
      kv?.removeItem(DEVICE.micRetry);
    } catch {
      /* storage blocked */
    }
  }
  return ok ? (v!.step as MicStep) : null;
}

/** The refusal's line: the Home Screen app's (its own permission, apart from Safari's settings) or a Safari tab's;
 *  `retried`: refused again after the reload (the next thing to try). */
export const deniedKey = (pwa: boolean, retried: boolean): `kiki.mic.perm.${'denied' | 'stuck'}${'' | 'App'}` =>
  `kiki.mic.perm.${retried ? 'stuck' : 'denied'}${pwa ? 'App' : ''}`;
