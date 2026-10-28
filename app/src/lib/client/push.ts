// Web push: iOS only allows it inside the installed (Home Screen) PWA, after a user tap.
import { getJSON, postJSON } from './api.ts';

export type PushState = 'unsupported' | 'install' | 'denied' | 'off' | 'on';

export function isStandalone(): boolean {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function pushState(): Promise<PushState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return isIOS() && !isStandalone() ? 'install' : 'unsupported';
  }
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

/** Must be called from a tap handler. */
export async function enablePush(): Promise<PushState> {
  const state = await pushState();
  if (state === 'install' || state === 'unsupported' || state === 'denied') return state;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off';
  const keyRes = await getJSON<{ publicKey?: string; key?: string }>('/api/push/key');
  const key = keyRes.data?.publicKey ?? keyRes.data?.key;
  if (!key) return 'off';
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToBytes(key) }));
  const json = sub.toJSON();
  const r = await postJSON('/api/push/subscribe', { endpoint: json.endpoint, keys: json.keys });
  return r.ok ? 'on' : 'off';
}
