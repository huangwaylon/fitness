// The speech test's pure parts (docs/speech-test.md): a take as 16 kHz 16-bit mono WAV (what the relay's /stt takes), why the mic or a take failed, and how close what was heard is to the sentence asked for (word-level, so "I'd" vs "I would" and punctuation don't
// count against it).

/** Mono samples (any rate already resampled to 16 kHz) as a WAV, at most `maxS` seconds. */
export function wav16k(x: Float32Array, maxS = 10): Uint8Array {
  const n = Math.min(x.length, maxS * 16_000);
  const out = new Uint8Array(44 + n * 2), v = new DataView(out.buffer);
  const tag = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  tag(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); tag(8, 'WAVE'); tag(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 16_000, true);
  v.setUint32(28, 32_000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); tag(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, x[i])) * 32_767), true);
  return out;
}

/** Why the mic gave nothing: getUserMedia's rejection (its error's name) in the speech test's words. `session`:
 *  WebKit's InvalidStateError under an 'ambient' or 'playback' audio session ("not compatible with audio capture"). */
export type MicMiss = 'refused' | 'nomic' | 'busy' | 'session' | 'insecure' | 'other';
export function micMiss(name: string | undefined): MicMiss {
  switch (name) {
    case 'NotAllowedError': return 'refused';
    case 'NotFoundError': case 'OverconstrainedError': return 'nomic';
    case 'NotReadableError': case 'AbortError': return 'busy';
    case 'InvalidStateError': return 'session';
    case 'SecurityError': case 'TypeError': return 'insecure';
    default: return 'other';
  }
}

/** The shortest take sent (s): less is a tap and a tap, nothing said. */
const MIN_S = 0.3;
/** A take whose loudest sample is below this is silence (iOS gives a muted or interrupted mic as zeros). */
const SILENT_PEAK = 1e-4;

/** A take not worth sending: too short (`empty`), or nothing in it (`silent`); else null. */
export function takeMiss(pcm16k: Float32Array): 'empty' | 'silent' | null {
  if (pcm16k.length < MIN_S * 16_000) return 'empty';
  return peakOf(pcm16k) < SILENT_PEAK ? 'silent' : null;
}
export function peakOf(x: Float32Array): number {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  return m;
}

const EXPAND: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "it's": 'it is', "that's": 'that is',
  "what's": 'what is', "there's": 'there is', "let's": 'let us', "i'd": 'i would', "i'll": 'i will', "i've": 'i have',
  "you'll": 'you will', "we'll": 'we will', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not',
  "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', cannot: 'can not', gonna: 'going to', wanna: 'want to'
};

/** A sentence as words: lower case, curly quotes straightened, contractions spelled out, punctuation gone. */
export function wordsOf(s: string): string[] {
  return s.toLowerCase().replace(/[’‘]/g, "'").split(/\s+/)
    .map((w) => w.replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ''))
    .flatMap((w) => (EXPAND[w] ?? w).split(' '))
    .map((w) => w.replace(/'/g, ''))
    .filter(Boolean);
}

/** Each asked word heard or missed (in order), and the share heard (1 − the word error rate, never below 0). */
export function matchOf(asked: string, heard: string): { words: { w: string; ok: boolean }[]; score: number } {
  const a = wordsOf(asked), h = wordsOf(heard);
  // edit distance over words, kept so the asked words can be marked
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: h.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= h.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === h[j - 1] ? 0 : 1));
  }
  const ok = new Array<boolean>(a.length).fill(false);
  for (let i = a.length, j = h.length; i > 0;) {
    if (j > 0 && a[i - 1] === h[j - 1] && d[i][j] === d[i - 1][j - 1]) (ok[i - 1] = true), i--, j--;
    else if (j > 0 && d[i][j] === d[i - 1][j - 1] + 1) i--, j--;
    else if (d[i][j] === d[i - 1][j] + 1) i--;
    else j--;
  }
  const score = a.length ? Math.max(0, 1 - d[a.length][h.length] / a.length) : 0;
  return { words: a.map((w, i) => ({ w, ok: ok[i] })), score };
}

/** The test's sentences: everyday, short to long, a few with the joins (want to, got to, did you) that trip a recogniser. */
export const SENTENCES: readonly { en: string; ja: string }[] = [
  { en: 'Good morning.', ja: 'おはよう。' },
  { en: 'Can I have a coffee, please?', ja: 'コーヒーをください。' },
  { en: 'Where is the train station?', ja: '駅はどこですか？' },
  { en: 'I want to go to the beach this weekend.', ja: '今週末、海に行きたい。' },
  { en: 'Did you finish your homework yet?', ja: 'もう宿題は終わった？' },
  { en: "I've got to leave early because I have a doctor's appointment.", ja: '病院の予約があるので早く出ないといけない。' },
  { en: 'Could you tell me how long it takes to get to the airport?', ja: '空港までどのくらいかかるか教えてもらえますか？' },
  { en: "If it doesn't rain tomorrow, let's have a picnic in the park.", ja: '明日雨が降らなかったら、公園でピクニックしよう。' }
];
