// The service worker's goal notifications (docs/backend.md#notifications): a push from the relay becomes one
// notification (the app icon, the words of the phone's language, one tag per day so a repeat replaces it), and a tap
// on it brings the app forward (an open window first, else a new one). Pure over what it is given, for tests.
import { parsePushMsg, pushNotice } from '../lib/sync/push-protocol.ts';

/** A push that can't be read still shows something: a silent push is not allowed (Safari drops the subscription). */
const FALLBACK = { title: 'しまの貯金箱', body: 'しまに おしらせが あるよ', tag: 'island-goal', lang: 'ja' };

/** The notification for a push event's data (null data or bad JSON: the fallback). */
export function notificationFor(data: { text(): string } | null, scope: string): { title: string; options: NotificationOptions } {
  let n = FALLBACK;
  try {
    const m = data ? parsePushMsg(data.text()) : null;
    if (m) n = pushNotice(m);
  } catch {
    /* unreadable: the fallback */
  }
  return { title: n.title, options: { body: n.body, tag: n.tag, icon: `${scope}icons/icon-192.png`, lang: n.lang, data: { url: scope } } };
}

interface WindowLike {
  url: string;
  focus(): Promise<unknown>;
}

/** Bring the app forward: a window already in the scope is focused, else the scope opens. */
export async function openApp(clients: { matchAll(o: { type: 'window'; includeUncontrolled: boolean }): Promise<readonly WindowLike[]>; openWindow(url: string): Promise<unknown> }, scope: string): Promise<void> {
  const open = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  const mine = open.find((c) => new URL(c.url).pathname.startsWith(new URL(scope, c.url).pathname));
  if (mine) {
    await mine.focus();
    return;
  }
  await clients.openWindow(scope);
}
