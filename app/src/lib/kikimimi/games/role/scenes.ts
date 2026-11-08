// ふたりで ロールプレイ's scenes (docs/kikimimi-mic.md "ふたりで ロールプレイ"): each a unit's two voiced dialogues chained, 8-10 turns,
// two roles. A role is its part's speaker: `a`, the villager who plays role A in that dialogue (the other plays B).
// The role's name and each part's goal are sheet text (kanji Japanese); the lines, their Japanese and the key phrases
// are the unit's own (its chunk, its `ph`). A scene's place in this list is its number on the wire (the options'
// third): add new ones at the end, never reorder.
import type { RosterId } from '#lib/villagers/roster.ts';

interface ScenePart {
  /** The dialogue (a two-speaker item of the unit). */
  id: string;
  /** Who plays role A in it. */
  a: RosterId;
  /** Each role's goal in it (A, B). */
  goals: readonly [string, string];
}

export interface Scene {
  unit: string;
  /** The roles' names (A, B). */
  as: readonly [string, string];
  parts: readonly ScenePart[];
}

export const SCENES: readonly Scene[] = [
  {
    unit: 'fr-replan',
    as: ['予定を確かめる人', '予定を変えたい人'],
    parts: [
      { id: 'dk-dinner-move', a: 'maple', goals: ['今夜の夕飯の予定を確かめる', '急用ができたので、木曜にずらしてもらう'] },
      { id: 'dk-really-cancel', a: 'gulliver', goals: ['明日の天気のことで相談する', 'また今度にして、次の日を決める'] }
    ]
  },
  {
    unit: 'ev-bday',
    as: ['パーティーを開く人', '招かれる友だち'],
    parts: [
      { id: 'dk-party-invite', a: 'poppy', goals: ['土曜のサプライズパーティーに誘う', '誘いにのって、何を持っていくか聞く'] },
      { id: 'dk-toast', a: 'kid-cat', goals: ['みんなの前で乾杯のあいさつをする', 'スピーチをせがんで、いっしょに乾杯する'] }
    ]
  },
  {
    unit: 'gl-clarify',
    as: ['予定を伝える人', '聞き返す人'],
    parts: [
      { id: 'dk-gig-date', a: 'lily', goals: ['ライブの日にちを伝える', '日にちを聞き返して確かめる'] },
      { id: 'dk-wrong-time', a: 'wolfgang', goals: ['待ち合わせを伝えて、言い直す', 'うるさい店で聞き返して確かめる'] }
    ]
  },
  {
    unit: 'gl-endcall',
    as: ['電話を終えたい人', '電話の相手'],
    parts: [
      { id: 'dk-catch-up', a: 'goldie', goals: ['話を切り上げて、相手を荷造りに戻す', '待ち合わせを確かめて、電話を終える'] },
      { id: 'dk-clarify-end', a: 'tangy', goals: ['電話を終える前に、日にちを確かめる', '日にちを聞き返して、あいさつする'] }
    ]
  },
  {
    unit: 'tr-guide',
    as: ['旅行に来た友だち', '東京を案内する人'],
    parts: [
      { id: 'dmu-which-exit', a: 'punchy', goals: ['出口を聞いて、行きたい所を話す', '出口を教えて、行き方を提案する'] },
      { id: 'dmu-last-train', a: 'raymond', goals: ['バーでもう少し飲みたい', '終電とタクシー代を伝える'] }
    ]
  },
  {
    unit: 'tr-hotel',
    as: ['ホテルの客', 'フロントの人'],
    parts: [
      { id: 'dmu-twin-beds', a: 'lopez', goals: ['チェックインして、部屋のことで困る', 'おわびして、代わりの案を出す'] },
      { id: 'dmu-aircon', a: 'francine', goals: ['エアコンの音のことで電話する', '人を向かわせて、それまでの案を出す'] }
    ]
  },
  {
    unit: 'wk-chat',
    as: ['ランチに誘う人', '誘われる同僚'],
    parts: [
      { id: 'dmu-coffee-machine', a: 'raymond', goals: ['週末の話をして、ランチに誘う', '週末の話をして、曜日を決める'] },
      { id: 'd4-grab-lunch', a: 'orville', goals: ['週末のことを聞いて、ランチに誘う', '週末にしたことを話す'] }
    ]
  }
];
