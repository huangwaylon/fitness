// English Study's strings (docs/english.md): the sheet's copy, its own file beside the code (not the island's
// catalogs), normal Japanese with kanji like every sheet; the questions themselves are English (the clips' files).
// `s(key, params)` in the reader's locale, `{name}` filled in.
import { i18n } from '#lib/i18n/index.ts';

const S = {
  title: { ja: 'English Study', en: 'English Study' },
  settings: { ja: '設定', en: 'Settings' },
  today: { ja: '今日の動画', en: "Today's clip" },
  todayDone: { ja: '次の動画 · 今日の分は完了 ✓', en: "Next clip · today's done ✓" },
  start: { ja: '▶ 始める', en: '▶ Start' },
  resume: { ja: '▶ 続きから', en: '▶ Resume' },
  again: { ja: '▶ もう一度（新しい質問）', en: '▶ Again (new questions)' },
  other: { ja: '別の動画にする', en: 'A different clip' },
  allDone: { ja: '全部見ました', en: 'You’ve seen them all' },
  qs: { ja: '{n}問', en: '{n} questions' },
  offlineHome: { ja: 'オフラインです。つながると再生できます', en: "You're offline: it plays once you're back online" },
  library: { ja: 'ライブラリ', en: 'Library' },
  seeAll: { ja: 'すべて見る（{n}本）', en: 'See all ({n})' },
  partTag: { ja: '途中', en: 'In progress' },
  partAt: { ja: '{at}/{n}問', en: '{at}/{n}' },
  times: { ja: '{n}回', en: '{n}×' },
  againTag: { ja: 'もう一度', en: 'Again' },
  againSub: { ja: '新しい質問', en: 'New questions' },
  libAll: { ja: 'すべて', en: 'All' },
  libClips: { ja: '動画', en: 'Clips' },
  libN: { ja: '{n}本', en: '{n}' },
  libFilter: { ja: '絞り込み', en: 'Filter' },
  more: { ja: 'もっと見る（あと{n}本）', en: 'More ({n} left)' },
  // collections (collections.ts)
  collections: { ja: 'コレクション', en: 'Collections' },
  colDone: { ja: '{n}本完了', en: '{n} done' },
  'col.phone': { ja: '電話の英語', en: 'On the phone' },
  'colNote.phone': { ja: '電話で頼む・待たせる・切る', en: 'Asking, holding and hanging up' },
  'col.ask': { ja: '断り方・お願い', en: 'Asking and saying no' },
  'colNote.ask': { ja: 'やわらかく断る、頼む', en: 'A soft no, a favour asked' },
  'col.work': { ja: '職場の会話', en: 'At work' },
  'colNote.work': { ja: '上司と同僚の会話', en: 'Bosses and coworkers' },
  'col.shop': { ja: 'お店で', en: 'In shops' },
  'colNote.shop': { ja: '注文、値段、交渉', en: 'Ordering, prices, haggling' },
  'col.camera': { ja: 'カメラに話す本音', en: 'Talking to the camera' },
  'colNote.camera': { ja: '場面とインタビューのずれ', en: 'What they say against what happens' },
  'col.travel': { ja: '旅行', en: 'Travel' },
  'colNote.travel': { ja: '移動、ホテル、道', en: 'Getting around, hotels, directions' },
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
  watchNote: { ja: '質問へはいつでも進めます。', en: 'You can go to the questions any time.' },
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
  endWatch: { ja: '▶ もう一度、通して見る', en: '▶ Watch it through again' },
  endHome: { ja: '完了', en: 'Done' },
  // この動画のフレーズ (ClipPhrases)
  phrases: { ja: 'この動画のフレーズ', en: 'Lines from this clip' },
  phrasesGo: { ja: 'この動画のフレーズ ›', en: 'Lines from this clip ›' },
  phrasesNote: { ja: '質問で取り上げたセリフを、時間の順に。▶ でその場面を聞けます。', en: 'The lines the questions quote, in time order. ▶ plays the moment.' },
  phrasesNone: { ja: 'この動画には、まだフレーズがありません', en: 'No lines for this clip yet' },
  phrasePlay: { ja: '{t}から聞く', en: 'Hear from {t}' },
  seg: { ja: '▶ {from}–{to}秒', en: '▶ {from}–{to} s' },
  credit: { ja: '動画：{credit}（YouTubeの埋め込みで再生）。質問と解説は私たちが作ったものです。', en: 'Video: {credit}, played by YouTube’s embed. The questions and notes are ours.' },
  // a question's card label, by its skill (types.ts Skill)
  'skill.gist': { ja: '大意', en: 'Gist' },
  'skill.detail': { ja: '詳細', en: 'Detail' },
  'skill.number': { ja: '数字', en: 'Numbers' },
  'skill.who': { ja: '誰が', en: 'Who' },
  'skill.infer': { ja: '含み', en: 'Inference' },
  'skill.attitude': { ja: '気持ち', en: 'Attitude' },
  'skill.pragma': { ja: '言葉の働き', en: 'What it does' },
  'skill.humor': { ja: '笑い', en: 'The joke' },
  'skill.predict': { ja: '次の一言', en: 'What comes next' },
  'skill.marker': { ja: 'つなぎ言葉', en: 'Markers' },
  'skill.phrase': { ja: 'フレーズ', en: 'Phrase' },
  'skill.sound': { ja: '音', en: 'Sounds' },
  'skill.dict': { ja: '書き取り', en: 'Dictation' },
  // the player's controls (Controls)
  play: { ja: '再生', en: 'Play' },
  pause: { ja: '一時停止', en: 'Pause' },
  back5: { ja: '−5秒', en: '−5 s' },
  seek: { ja: '再生位置', en: 'Position' },
  captions: { ja: '字幕', en: 'Captions' },
  // the player's states
  offline: { ja: 'オフラインのため動画を再生できません。つながると再生できます。', en: "You're offline: the video plays once you're back online." },
  unavailable: { ja: 'この動画は今、ここでは再生できません。', en: "This video can't be played here right now." },
  openYoutube: { ja: 'YouTubeで開く', en: 'Open in YouTube' },
  noStart: { ja: '再生が始まらないときは、動画を一度タップしてください。', en: "If it doesn't start, tap the video once." },
  retry: { ja: 'もう一度読み込む', en: 'Load again' },
  // the bank (data.ts)
  loading: { ja: '読み込み中…', en: 'Loading…' },
  bankFailed: { ja: '質問を読み込めませんでした', en: "The questions didn't load" },
  bankOffline: { ja: 'オフラインのため質問を読み込めません。つながると読み込めます。', en: "You're offline: the questions load once you're back online." },
  retryBank: { ja: 'もう一度', en: 'Try again' },
  // ⚙
  hard: { ja: 'むずかしめの質問を増やす', en: 'More harder questions' },
  // (two short lines, broken where it reads: Safari wraps Japanese anywhere, mid-word at 393 pt)
  hardNote: { ja: 'ネイティブ級のニュアンスの質問が\n1回目から出ます', en: 'Questions on the nuances native speakers hear, from the first play' },
  hardTag: { ja: 'むずかしめ', en: 'Harder' },
  // flags
  flag: { ja: '報告', en: 'Report' },
  flagHead: { ja: 'どこが気になりましたか？', en: 'What looks off?' },
  flagClip: { ja: 'この動画全体', en: 'The whole clip' },
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
  flagWhereClip: { ja: '動画', en: 'The clip' }
} satisfies Record<string, { ja: string; en: string }>;

export type StringKey = keyof typeof S;

/** The string in the reader's locale, `{name}` filled in. */
export function s(key: StringKey, params: Record<string, string | number> = {}): string {
  return S[key][i18n.locale].replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''));
}

/** A length on a row or a thumbnail: 1:08. */
export const clock = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

/** A length in seconds as the sheet says it: 1分8秒 (whole minutes: 2分). */
export const durText = (sec: number): string => {
  const m = Math.floor(sec / 60), r = Math.round(sec % 60);
  return r ? s('dur', { m, s: r, ss: String(r).padStart(2, '0') }) : s('durMin', { m });
};
