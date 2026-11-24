// The LINE menu's 📱 link (routes/gym, docs/bots.md): `/gym#<key>` opens ジム's page on a phone that
// may have no key of its own (LINE's browser, Safari: the PWA's storage is apart). The key is the gym Worker's
// LINK_KEY, member A's there and nowhere else (never the relay's). Read once from the hash, which then leaves the URL,
// and kept for this tab (a reload); config.ts sends it before the phone's own key.
export const TAB = 'island.gymLink';
export const KEY_RE = /^[0-9a-f]{32,128}$/;

let key: string | null = null;

/** The link's key from `hash` (else the one this tab kept), or null. */
export function takeLinkKey(hash: string, tab: Pick<Storage, 'getItem' | 'setItem'> | null = session()): string | null {
  const h = hash.replace(/^#/, '').toLowerCase();
  const k = KEY_RE.test(h) ? h : (tab?.getItem(TAB) ?? null);
  key = k && KEY_RE.test(k) ? k : null;
  if (key && tab) {
    try {
      tab.setItem(TAB, key);
    } catch {
      /* this load only */
    }
  }
  return key;
}

/** The key the gym page's calls send (null: the phone's own). */
export const linkKey = (): string | null => key;

function session(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}
