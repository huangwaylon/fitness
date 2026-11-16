// セリフ, the clip's transcript (docs/english.md "Transcripts"): which line is on at the playhead. The lines are the
// local whisper pass's segments with our Japanese translations when in (transcripts/<video>.en|ja.json, in the clip's
// bank: vite.config.ts english-data), each in time order. Pure.
import type { TranscriptLine } from './types.ts';

/** The transcript line on at `t` s: the last one begun by then (in a gap, the one before it; before the first, the first). */
export function lineAt(lines: readonly Pick<TranscriptLine, 't'>[], t: number): number {
  let i = 0;
  while (i + 1 < lines.length && lines[i + 1].t[0] <= t) i++;
  return i;
}
