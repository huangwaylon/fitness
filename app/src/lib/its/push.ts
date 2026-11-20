// ボット → 保養所's 通知 (docs/bots.md; its/README.md "Push"), the phone's side: this phone's switch (off by
// default, kept per phone: DEVICE.itsPush) over the phone's one Web Push subscription (lib/push/phone.ts, shared with
// やること's reminders: turning this off keeps the browser's subscription while those are on), which the its-bot Worker
// pushes to on a 仮押さえ and a 予約確定. The Worker's VAPID key is read from its status (ItsPushStatus.vapidPublic), the
// subscription handed to POST /its/push/subscribe; how the switch turns, refreshes and tests: phone.ts. Failures are
// logged (`its.push` / the client's `its.fail`: a step and a code, never an endpoint or a key). Plain TS: the browser
// objects and the Worker's calls are injectable for tests.
import type { PushEndpointInput, PushLang, PushSubscribeInput } from './contract.ts';
import { pushCall, type PushReply } from './client.ts';
import { configurePhone, pushClient, type PhoneDeps, type PushAnswer } from '#lib/push/phone.ts';

export { RESYNC_MS, pushSupport, type EnableResult, type TestResult } from '#lib/push/phone.ts';

type Route = 'subscribe' | 'unsubscribe' | 'test';
/** The browser and the Worker, injectable for tests. */
export interface PushDeps extends PhoneDeps {
  post(route: Route, body: PushSubscribeInput | PushEndpointInput): Promise<PushReply>;
}

let post: PushDeps['post'] | null = null;

/** Tests: swap the browser and the Worker (null: the real ones again). */
export function configurePush(o: Partial<PushDeps> | null): void {
  const { post: p, ...rest } = o ?? {};
  post = p ?? null;
  configurePhone(o ? rest : null);
}

/** The Worker isn't ready for push (no routes yet, or no VAPID key): 準備中. */
const notReady = (r: PushAnswer) => !r.ok && ((r.http === 404 && r.err !== 'not_subscribed') || r.err === 'push_off');

const its = pushClient<PushLang>('its', () => (route, body) => (post ?? pushCall)(route, body as PushSubscribeInput | PushEndpointInput), notReady);

/** The switch as stored (on only once the Worker took the subscription). */
export const pushOn = its.on;
/** The switch turned on: call it straight from the tap (phone.ts). `vapid`: the Worker's key (null: push off there). */
export const enablePush = its.enable;
/** The switch turned off: at the Worker, and in the browser unless やること's reminders are on. */
export const disablePush = its.disable;
/** Opening 保養所 with the Worker's push status read: kept fresh, or off on a revoked permission. */
export const refreshPush = its.refresh;
/** テスト通知. */
export const testPush = its.test;
