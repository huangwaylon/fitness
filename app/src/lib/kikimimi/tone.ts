// ききみみ: a clip's intended tone (an optional `tone` on a ことば タイル; content/listen/README.md "tile"), the engine
// text a toned clip is spoken from, and the silent score that picks its best take (scripts/kikimimi-audio.ts
// --tone-takes). The 2026-11-12 tone pilot (32 lines, 451 takes): every clip cloned from its voice's one cheerful
// greeting spoke an apology and a toast at the same energy, and Qwen rose on most wh- and either/or questions. A
// toned clip is cloned from its voice's tone reference (soft or firm: scripts/tts/cast.json `tones`; neutral is the
// voice's own), its wh- and either/or questions end with "." in the engine text only, and the best of four seeds is
// kept by takeScore. An untoned clip is spoken as before (its source hash unchanged).

/** neutral: the voice's own reference; soft: tired, apologetic, hesitant; firm: serious, a little annoyed. */
export const TONES = ['neutral', 'soft', 'firm'] as const;
export type Tone = (typeof TONES)[number];
/** The tones with a reference of their own (neutral clones the voice's cast reference). */
export const TONE_REFS = ['soft', 'firm'] as const satisfies readonly Tone[];

/** What each tone reference says, in that tone (cloned from the cast reference: the voice stays, the delivery moves). */
export const TONE_TEXT: Readonly<Record<(typeof TONE_REFS)[number], string>> = {
  soft: "Sorry, I know it's late. I'm just really tired tonight, and I don't think I can make it. Maybe another time, if that's okay.",
  firm: "Look, I've already asked you twice. This has to be done by Friday, and I mean it this time. No more excuses, please."
};

export type SentenceType = 'yn' | 'wh' | 'alt' | 'tag' | 'echo' | 'stmt' | 'excl';
export interface Sentence {
  text: string;
  /** Its words. */
  n: number;
  type: SentenceType;
}

const WORD = /[A-Za-z][A-Za-z'-]*|'[A-Za-z]+/g;
const LEAD = new Set(['so', 'and', 'wait', 'sorry', 'oh', 'okay', 'um', 'well', 'hey', 'honestly', 'but']);
const WH = /^(?:wh|how$|how's$|how'd$)/;

/** A text's sentences (split after . ? !), each with its type: a question with "or" between choices (3+ words) is
 *  either/or, one led by a wh-word or "how" (after so, wait, sorry…) a wh-question, ", right?" a tag, two words or
 *  fewer an echo ("Cake?"), else yes/no. */
export function sentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  for (const raw of text.match(/[^.?!]+[.?!]+["”]?|[^.?!]+$/g) ?? []) {
    const words = raw.match(WORD) ?? [];
    if (!words.length) continue;
    const lw = words.map((w) => w.toLowerCase());
    const first = lw.find((w) => !LEAD.has(w)) ?? lw[0];
    const end = raw.includes('?') ? '?' : raw.includes('!') ? '!' : '.';
    let type: SentenceType;
    if (end === '?') {
      if (/,\s*(right|okay|yeah|huh)\s*\?/i.test(raw)) type = 'tag';
      else if (/\bor\b/i.test(raw) && lw.length > 2) type = 'alt';
      else if (WH.test(first) || /^since when\b/i.test(raw.trim())) type = 'wh';
      else if (lw.length <= 2) type = 'echo';
      else type = 'yn';
    } else type = end === '!' ? 'excl' : 'stmt';
    out.push({ text: raw.trim(), n: words.length, type });
  }
  return out;
}

/** The engine text of a toned clip: its wh- and either/or questions end with "." (Qwen falls on a "." and mostly
 *  rises on a "?"; the pilot's wh/alt endings fell 10-11/11 so, against 2/11), everything else as it is. Shown text
 *  and the ASR check keep the "?". */
export function engineText(text: string): string {
  return (text.match(/[^.?!]+[.?!]+["”]?|[^.?!]+$/g) ?? [text])
    .map((raw) => {
      const s = sentences(raw)[0];
      return s && (s.type === 'wh' || s.type === 'alt') ? raw.replace(/\?+(["”]?\s*)$/, '.$1') : raw;
    })
    .join('');
}

/** How a sentence ends (scripts/tts/tts.py prosody: its last 80 ms against its last 400 ms of pitch). */
type Final = 'rise' | 'fall' | 'level' | 'unclear';
/** What tts.py prosody measures of a take (the clean take as spoken). */
export interface Prosody {
  /** Per sentence, in order: how it ends, and by how much it fell (semitones). */
  finals: { final: Final; fall: number }[];
  /** Syllables a second over the speech, edge silence aside. */
  sylS: number;
  /** Pitch range, p5-p95, in semitones. */
  rangeSt: number;
}
export interface TakeMeasures extends Prosody {
  /** Content words whisper misheard (tts.py wer). */
  content: number;
  /** ECAPA cosine to the voice's cast reference. */
  sim: number;
  /** UTMOS (0 when not measured). */
  mos: number;
}

/** A natural pace and pitch range (the pilot's and the old review's bounds: over 6.3 syl/s rushed, over 15 st the
 *  greeter's bounce on a plain line). */
const RATE_BAND = [3.5, 5.3] as const;
const RANGE_BAND = [4.5, 15] as const;

/** -1..1: each sentence ending the way its type wants (a statement, a wh- or either/or question falling; a yes/no,
 *  tag or echo question rising) +1, the wrong way -1 (a yes/no question only for a strong fall, ≥ 4 st; level -0.5). */
export function contourScore(types: readonly SentenceType[], finals: Prosody['finals']): number {
  const pts: number[] = [];
  types.forEach((type, k) => {
    const f = finals[k];
    if (!f || f.final === 'unclear') return;
    if (type === 'yn' || type === 'tag' || type === 'echo') pts.push(f.final === 'rise' ? 1 : f.final === 'level' ? -0.5 : f.fall >= 4 ? -1 : 0);
    else pts.push(f.final === 'fall' ? 1 : f.final === 'rise' ? -1 : 0);
  });
  return pts.length ? pts.reduce((a, b) => a + b, 0) / pts.length : 0;
}

/** A take's score, higher best: its endings (×2), a misheard content word -10 each, another voice (sim < 0.3) -10, a
 *  pace off RATE_BAND -1 a syllable a second, a range off RANGE_BAND -1 per 3 st, UTMOS a tie-break. The energy
 *  models aren't in it (they were the pilot's check, and hear timbre more than tone). */
export function takeScore(types: readonly SentenceType[], m: TakeMeasures): number {
  let s = 2 * contourScore(types, m.finals) - 10 * m.content - (m.sim < 0.3 ? 10 : 0);
  s -= Math.max(0, RATE_BAND[0] - m.sylS, m.sylS - RATE_BAND[1]);
  s -= Math.max(0, RANGE_BAND[0] - m.rangeSt, m.rangeSt - RANGE_BAND[1]) / 3;
  return s + (m.mos ? 0.5 * (m.mos - 4) : 0);
}
