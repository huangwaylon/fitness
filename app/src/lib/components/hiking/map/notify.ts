// Hike mode's notification (docs/hiking.md "In-hike map" › 通知): while a hike is under way, one notification on the
// phone (「登山中」, the trail and its start), which a tap opens at the trail even after the app was swiped away
// (service-worker/notify.ts openApp: `?open=hike&trail=…`). iOS gives a web app no ongoing notification; this is a normal
// one that stays in Notification Center until tapped or cleared. It is the page's own (the service worker's
// registration.showNotification: no push, no server, never on the record); the Home Screen app only (iOS 16.4+), and
// only after a yes: the permission is asked by 歩きはじめる's tap alone (lib/push/phone.ts askNote: in the tap, never on
// load), never again once answered. One tag for all (one hike under way a phone: resume.ts), so a restart, a resume or
// another trail's start replaces it, never stacks. 終了 closes it (its 取り消す shows it again); a relaunch with the hike
// still under way shows it again if it is gone, once a page (never on every opening). Where it can't be, the hike goes on as
// ever; an iPhone's Safari tab says so once a phone (`hint`). Logged as `hike.notify` (what happened, never where).
// Plain TS: the browser is injectable for tests.
import { askNote, noteSupport, type PushSupport } from '#lib/push/phone.ts';
import { log } from '#lib/sync/log.ts';
import { DEVICE, localKV, readJson, writeJson, type KV } from '#lib/sync/storage.ts';
import { S } from '#lib/hiking/strings.ts';
import type { Locale } from '#lib/i18n/index.ts';
import { pick } from '../../travel/text.ts';

/** The one tag (a second hike replaces the first). */
export const HIKE_TAG = 'hike';

export interface HikeNoteInfo { slug: string; name: string; l: Locale; /** 歩きはじめる's time, ms (none: a relaunch that lost it). */ at?: number }

interface Shown { tag?: string; data?: unknown; close(): void }
/** The service worker's registration, as much of it as is used. */
export interface NoteReg { scope: string; showNotification(title: string, o: NotificationOptions): Promise<void>; getNotifications(o?: GetNotificationOptions): Promise<readonly Shown[]> }
export interface NoteDeps {
  support(): PushSupport;
  ask(): Promise<NotificationPermission>;
  permission(): NotificationPermission | null;
  reg(): Promise<NoteReg | null>;
  kv: KV | null;
}

/** What a hike's start, resume or undo does: ask (then show on a yes), show, say once that it needs the Home Screen
 *  app, or nothing. Only a start (a tap) asks or hints. */
export type NoteAction = 'ask' | 'show' | 'hint' | 'none';
export function noteAction(support: PushSupport, perm: NotificationPermission | null, tap: boolean, hinted: boolean): NoteAction {
  if (support === 'install') return tap && !hinted ? 'hint' : 'none';
  if (support !== 'ok') return 'none';
  if (perm === 'granted') return 'show';
  return tap && perm === 'default' ? 'ask' : 'none';
}

const clock = (t: number) => {
  const d = new Date(t);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** The notification: 「登山中」 / 「{trail}・{H:MM} 出発」, the tag, the trail to open. */
export function hikeNote(h: HikeNoteInfo, scope: string): { title: string; options: NotificationOptions } {
  const body = h.at ? pick(S.noteBody, h.l).replace('{name}', h.name).replace('{time}', clock(h.at)) : h.name;
  const open = { to: 'hike', trail: h.slug };
  return {
    title: pick(S.noteTitle, h.l),
    options: { body, tag: HIKE_TAG, icon: `${scope}icons/icon-192.png`, data: { url: `${scope}?${new URLSearchParams({ open: 'hike', trail: h.slug })}`, open } }
  };
}

/** A shown one of ours (Safari may not read a notification's tag back: its data says too). */
const ours = (n: Shown) => n.tag === HIKE_TAG || (n.data as { open?: { to?: unknown } } | null)?.open?.to === 'hike';

function browserDeps(): NoteDeps {
  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
  return {
    support: noteSupport,
    ask: askNote,
    permission: () => (typeof Notification !== 'undefined' ? Notification.permission : null),
    reg: async () => ((await sw?.getRegistration().catch(() => undefined)) as NoteReg | undefined) ?? null,
    kv: localKV()
  };
}

type Act = 'shown' | 'asked' | 'denied' | 'install' | 'unsupported' | 'closed' | 'tapped' | 'failed';
const say = (act: Act, err?: unknown) => log('hike.notify', { act, ...(err !== undefined && { err: err instanceof Error ? err.name : typeof err }) }, act === 'failed' ? 2 : 1);

/** A tap on the notification brought the app to its trail (bots/open.svelte.ts, island/Hud.svelte). */
export const noteTapped = (): void => say('tapped');

/** A resume's show tried this page (a page load: the next launch may again). */
let resumed = false;
/** Tests: a new page. */
export const resetNotePage = (): void => void (resumed = false);

export class HikeNote {
  private d: NoteDeps;
  /** Each show and close after the one before (a 終了 during the start's prompt closes what it then shows). */
  private q: Promise<unknown> = Promise.resolve();
  /** The hike's turn: a show queued before a 終了 is not shown. */
  private turn = 0;

  constructor(d: Partial<NoteDeps> = {}) {
    this.d = { ...browserDeps(), ...d };
  }

  /** 歩きはじめる's tap (`tap`: asked here, synchronously, when never answered), a resume (a relaunch, the trail opened
   *  again: shown only when gone, once a page, so a cleared one is not pushed back at every opening) or 終了's 取り消す
   *  (shown again). True: say once that it works from the Home Screen app (the caller's note). */
  start(h: HikeNoteInfo, how: 'tap' | 'resume' | 'undo'): boolean {
    const tap = how === 'tap';
    if (how === 'resume' && resumed) return false;
    if (how === 'resume') resumed = true;
    const support = this.d.support();
    const hinted = readJson<boolean>(this.d.kv, DEVICE.hikeNotifyHint) === true;
    const a = noteAction(support, this.d.permission(), tap, hinted);
    const turn = ++this.turn;
    if (a === 'hint') {
      writeJson(this.d.kv, DEVICE.hikeNotifyHint, true);
      say('install');
      return true;
    }
    if (a === 'none') {
      if (tap && support !== 'ok' && support !== 'install') say(support === 'denied' ? 'denied' : 'unsupported');
      return false;
    }
    // (the prompt started now, inside the tap: nothing awaited before it)
    const asked = a === 'ask' ? this.d.ask() : null;
    this.then(async () => {
      if (asked) {
        const p = await asked;
        say(p === 'granted' ? 'asked' : 'denied');
        if (p !== 'granted') return;
      }
      if (turn !== this.turn) return;
      const reg = await this.d.reg();
      if (!reg) return say('failed', new Error('NoRegistration'));
      if (how === 'resume' && (await reg.getNotifications()).some(ours)) return;
      const n = hikeNote(h, new URL(reg.scope).pathname);
      await reg.showNotification(n.title, n.options);
      say('shown');
    });
    return false;
  }

  /** 終了 (or the hike gone): ours closed, if any. */
  end(): void {
    ++this.turn;
    if (this.d.permission() !== 'granted') return;
    this.then(async () => {
      const reg = await this.d.reg();
      const open = reg ? (await reg.getNotifications()).filter(ours) : [];
      for (const n of open) n.close();
      if (open.length) say('closed');
    });
  }

  /** Done when everything queued is (tests). */
  settled(): Promise<unknown> {
    return this.q;
  }

  private then(f: () => Promise<unknown>): void {
    this.q = this.q.then(f).catch((e: unknown) => say('failed', e));
  }
}
