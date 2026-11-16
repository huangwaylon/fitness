// English Study's strings (docs/english.md): the sheet's copy, its own file beside the code (not the island's
// catalogs), normal Japanese with kanji like every sheet; the questions themselves are English (the clips' files).
// `s(key, params)` in the reader's locale, `{name}` filled in.
import { i18n } from '#lib/i18n/index.ts';

const S = {
  title: { ja: 'English Study', en: 'English Study' },
  settings: { ja: '設定', en: 'Settings' },
  today: { ja: '今日の動画', en: "Today's clip" },
  todayDone: { ja: '今日の動画 完了 ✓', en: "Today's clip done ✓" },
  start: { ja: '▶ 始める', en: '▶ Start' },
  resume: { ja: '▶ 続きから', en: '▶ Resume' },
  again: { ja: '▶ もう一度見る', en: '▶ Watch again' },
  other: { ja: '別の動画にする', en: 'A different clip' },
  meta: { ja: '{dur} · {band} · {n}問', en: '{dur} · {band} · {n} questions' },
  library: { ja: 'ライブラリ', en: 'Library' },
  done: { ja: '完了', en: 'Done' },
  'band.slow': { ja: 'ゆっくり', en: 'Slow' },
  'band.mid': { ja: 'ふつう', en: 'Normal' },
  'band.fast': { ja: '速い', en: 'Fast' },
  dur: { ja: '{m}分{s}秒', en: '{m}:{ss}' },
  durMin: { ja: '{m}分', en: '{m} min' },
  // the week (WeekProgress)
  week: { ja: '今週', en: 'This week' },
  weekDays: { ja: '{k}/3日', en: '{k}/3 days' },
  weekMore: { ja: '{k}日', en: '{k} days' },
  weekMet: { ja: '今週の3日、達成', en: '3 days this week' },
  weekNew: { ja: '新しい週です', en: 'A new week' },
  run: { ja: '3日の週が {n}週つづいています', en: '{n} weeks of 3 days in a row' },
  runEver: { ja: '3日の週 これまで {n}回', en: '3-day weeks so far: {n}' },
  clips: { ja: 'これまで {n}本', en: '{n} clips so far' },
  minutes: { ja: '今週 約{n}分', en: 'About {n} min this week' },
  back: { ja: 'おかえりなさい。今日の1本からどうぞ', en: "Welcome back. Start with today's clip" },
  both: { ja: '今週はふたりとも達成', en: 'You both made 3 days this week' },
  partnerDone: { ja: '{name}：今日の動画 完了 ✓', en: "{name}: today's clip done ✓" },
  partnerWeek: { ja: '{name}の今週', en: "{name}'s week" },
  // the lesson
  watchHead: { ja: 'まず最後まで見てみましょう', en: 'Watch it all the way through first' },
  watchNote: { ja: 'おすすめ：先に通して見てから質問へ。いつでも行き来できます。', en: 'Suggested: watch it once, then the questions. You can move back and forth any time.' },
  watchAll: { ja: '▶ 全部見る（{dur}）', en: '▶ Watch it all ({dur})' },
  watchAgain: { ja: '▶ もう一度見る', en: '▶ Watch again' },
  toQuestions: { ja: '質問へ ›', en: 'Questions ›' },
  prev: { ja: '‹ 前へ', en: '‹ Back' },
  next: { ja: '次へ ›', en: 'Next ›' },
  toEnd: { ja: 'まとめへ ›', en: 'Summary ›' },
  qMeta: { ja: '{i} / {n} · {type} · {from}–{to}秒', en: '{i} / {n} · {type} · {from}–{to} s' },
  hear: { ja: '▶ この部分を聞く', en: '▶ Hear this part' },
  typeHere: { ja: 'ここに入力', en: 'Type here' },
  answer: { ja: '答える', en: 'Answer' },
  answerAgain: { ja: 'もう一度答える', en: 'Answer again' },
  nudge: { ja: 'もう一度聞いてみましょう。', en: 'Listen once more.' },
  showAnswer: { ja: '答えを見る', en: 'Show the answer' },
  first: { ja: '◎ 聞き取れました', en: '◎ You heard it' },
  second: { ja: '○ 聞き取れました', en: '○ You heard it' },
  shown: { ja: '答えはこれ', en: "Here's the answer" },
  heardWords: { ja: '{hit}/{of} 語 聞き取れました', en: '{hit}/{of} words heard' },
  said: { ja: '言っていること', en: 'What is said' },
  mean: { ja: '意味', en: 'Meaning' },
  trap: { ja: '迷いやすい点', en: 'Easy to mix up' },
  use: { ja: '使えるフレーズ', en: 'A phrase to use' },
  endHead: { ja: 'おつかれさまでした', en: 'Nice work' },
  endAgain: { ja: 'もう一度聞きたい場面', en: 'Scenes to hear again' },
  endAll: { ja: '全部、1回目で聞き取れました ◎', en: 'Every one on the first listen ◎' },
  endPhrases: { ja: '今日のフレーズ', en: "Today's phrases" },
  endWatch: { ja: '▶ もう一度、通して見る', en: '▶ Watch it through again' },
  endHome: { ja: '完了', en: 'Done' },
  seg: { ja: '▶ {from}–{to}秒', en: '▶ {from}–{to} s' },
  credit: { ja: '動画：{credit}（YouTubeの埋め込みで再生）。質問と解説は私たちが作ったものです。', en: 'Video: {credit}, played by YouTube’s embed. The questions and notes are ours.' },
  // the player's states
  offline: { ja: 'オフラインのため動画を再生できません。つながると再生できます。', en: "You're offline: the video plays once you're back online." },
  unavailable: { ja: 'この動画は今、ここでは再生できません。', en: "This video can't be played here right now." },
  openYoutube: { ja: 'YouTubeで開く', en: 'Open in YouTube' },
  noStart: { ja: '再生が始まらないときは、動画を一度タップしてください。', en: "If it doesn't start, tap the video once." },
  retry: { ja: 'もう一度読み込む', en: 'Load again' },
  // flags
  flag: { ja: '報告', en: 'Report' },
  flagHead: { ja: 'どこが気になりましたか？', en: 'What looks off?' },
  flagClip: { ja: 'このクリップ全体', en: 'The whole clip' },
  flagQ: { ja: '質問 {i}：{stem}', en: 'Question {i}: {stem}' },
  flagNote: { ja: 'ひとこと（なくてもOK）', en: 'A note (optional)' },
  flagSend: { ja: '送る', en: 'Send' },
  flagThanks: { ja: 'ありがとう！ あとで一緒に確認します。', en: "Thanks! We'll look at it together." },
  'kind.answer': { ja: '答え', en: 'The answer' },
  'kind.heard': { ja: '聞こえた言葉・字幕', en: 'What was said' },
  'kind.question': { ja: '問題文', en: 'The question' },
  'kind.timing': { ja: '再生の位置', en: 'The timing' },
  'kind.notes': { ja: '解説', en: 'The notes' },
  'kind.other': { ja: 'その他', en: 'Other' },
  flags: { ja: '報告した内容', en: 'Your reports' },
  flagsNone: { ja: 'まだありません', en: 'None yet' },
  flagsOpen: { ja: '{n}件 確認待ち', en: '{n} waiting' },
  flagOpen: { ja: '確認待ち', en: 'Waiting' },
  flagFixed: { ja: '確認済み：直しました', en: 'Checked: fixed' },
  flagKept: { ja: '確認済み：このままです', en: 'Checked: kept as is' },
  flagWhere: { ja: '質問 {i}', en: 'Question {i}' },
  flagWhereClip: { ja: 'クリップ', en: 'The clip' }
} satisfies Record<string, { ja: string; en: string }>;

export type StringKey = keyof typeof S;

/** The string in the reader's locale, `{name}` filled in. */
export function s(key: StringKey, params: Record<string, string | number> = {}): string {
  return S[key][i18n.locale].replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''));
}

/** A length in seconds as the sheet says it: 1分8秒 (whole minutes: 2分). */
export const durText = (sec: number): string => {
  const m = Math.floor(sec / 60), r = Math.round(sec % 60);
  return r ? s('dur', { m, s: r, ss: String(r).padStart(2, '0') }) : s('durMin', { m });
};
