// The editor's connection badge (Editor.svelte; the user, 2026-11-25: it said ライブ whatever the socket did): the relay
// as it is and the edits the record hasn't taken yet. Pure.

export interface LiveBadge {
  /** on: connected; wait: online, the socket coming back; off: no network or no relay. */
  state: 'on' | 'wait' | 'off';
  /** The desktop's status bar: ライブ, 接続中…, オフライン, each with（未送信 n件）while edits wait. */
  text: string;
  /** A phone's top bar: the same, shorter. */
  short: string;
}

export function liveBadge(connected: boolean, online: boolean, unsent: number): LiveBadge {
  const state = connected ? 'on' : online ? 'wait' : 'off';
  const word = { on: 'ライブ', wait: '接続中…', off: 'オフライン' }[state];
  return { state, text: unsent ? `${word}（未送信 ${unsent}件）` : word, short: unsent ? `${word} · ${unsent}件` : word };
}
