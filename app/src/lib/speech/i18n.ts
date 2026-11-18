// The speech test's strings (routes/speech, docs/speech-test.md): normal Japanese with kanji, a friend's casual voice
// (〜だよ, 〜してね) like すごろく's.
import { i18n } from '#lib/i18n/index.ts';
import type { Miss } from './stt.ts';

const S = {
  title: { ja: '音声認識テスト', en: 'Speech test' },
  unpaired: { ja: 'このiPhoneはペアリングされていないから、テストできないよ', en: 'This phone isn’t paired, so it can’t test' },
  prev: { ja: '前の文', en: 'Previous sentence' },
  next: { ja: '次の文', en: 'Next sentence' },
  free: { ja: '自由に話す', en: 'Say anything' },
  freeAsk: { ja: '好きな英語を話してみてね', en: 'Say anything in English' },
  record: { ja: '録音', en: 'Record' },
  stop: { ja: '止める（{s}秒）', en: 'Stop ({s} s)' },
  wait: { ja: '認識中…', en: 'Listening…' },
  nothing: { ja: '（何も聞こえなかったよ）', en: '(Nothing heard)' },
  match: { ja: '一致 {n}%', en: 'Match {n}%' },
  'time.rec': { ja: '録音', en: 'Take' },
  'time.enc': { ja: '変換', en: 'Encode' },
  'time.net': { ja: '通信', en: 'Network' },
  'time.ai': { ja: '認識', en: 'Model' },
  'time.tot': { ja: '合計', en: 'Total' },
  sec: { ja: '{n}秒', en: '{n} s' },
  ms: { ja: '{n} ms', en: '{n} ms' },
  summary: { ja: '{n}回：合計の中央値{t}秒', en: '{n} takes: median total {t} s' },
  summaryMatch: { ja: '、一致の中央値{m}%', en: ', median match {m}%' },
  fine: { ja: '録音はサーバーで文字にするだけで、音声も文字も保存しないよ。記録するのは時間と一致率だけ。', en: 'Your voice is only turned into text on the server; neither is kept. Only the times and the match are logged.' },
  'miss.refused': {
    ja: 'マイクが許可されていないよ。「許可しない」を選んだときは、アプリを閉じて開き直すと、もう一度聞かれるよ。設定 › アプリ › Safari › マイクが「拒否」になっていないかも確かめてね。',
    en: 'The mic isn’t allowed. If you chose Don’t Allow, close and reopen the app to be asked again, and check Settings › Apps › Safari › Microphone.'
  },
  'miss.nomic': { ja: 'マイクが見つからなかったよ', en: 'No mic found' },
  'miss.busy': { ja: 'マイクをほかのアプリが使っているよ。通話や録音を終えてから、もう一度どうぞ。', en: 'Another app is using the mic. End the call or recording, then try again.' },
  'miss.session': { ja: 'アプリの音とマイクがぶつかったみたい。もう一度録音してね。', en: 'The app’s sound got in the mic’s way. Record once more.' },
  'miss.insecure': { ja: 'このページではマイクが使えないよ', en: 'The mic can’t be used on this page' },
  'miss.empty': { ja: '録音が短すぎたみたい。もう少し長く話してね。', en: 'That take was too short. Speak a little longer.' },
  'miss.silent': { ja: '音が録れていなかったよ（マイクが止まっていたみたい）。もう一度どうぞ。', en: 'Nothing was recorded (the mic seemed off). Try again.' },
  'miss.off': { ja: 'サーバーの音声認識が止まっているよ', en: 'The server’s speech recognition is off' },
  'miss.capped': { ja: '今日の回数を使い切ったよ', en: 'Today’s takes are used up' },
  'miss.network': { ja: 'つながらなかったよ', en: 'Couldn’t connect' },
  'miss.timeout': { ja: '返事が来なかったよ', en: 'No answer in time' },
  'miss.ai': { ja: 'うまく認識できなかったよ', en: 'The recogniser didn’t manage it' },
  'miss.other': { ja: 'うまくいかなかったよ', en: 'That didn’t work' }
} satisfies Record<string, { ja: string; en: string }>;

type StringKey = keyof typeof S;

/** The Japanese table, for the house copy checks (i18n/linebreaks.test.ts). @public (i18n/linebreaks.test.ts) */
export const jaStrings = (): Record<string, string> => Object.fromEntries(Object.entries(S).map(([k, v]) => [k, v.ja]));

/** The string in the reader's locale, `{name}` filled in. */
export function s(key: StringKey, params: Record<string, string | number> = {}): string {
  const raw: string = S[key][i18n.locale === 'en' ? 'en' : 'ja'];
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''));
}
/** A miss's words. */
export const missText = (m: Miss): string => s(`miss.${m}`);
