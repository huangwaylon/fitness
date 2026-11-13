// ききみみ's audio scripts' shared tools (scripts/kikimimi-audio.ts, -beds, -words, -packs and tts/dsp.ts): the binaries
// and the whisper model (each overridable by its env var; tts.py gets them from kikimimi-audio.ts's env), ffmpeg's
// loudness measurement, and writes that never leave half a file under its name. Silent: nothing here plays.
import { spawnSync } from 'node:child_process';
import { existsSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

export const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
export const FFPROBE = process.env.FFPROBE ?? 'ffprobe';
export const WHISPER_MODEL = process.env.WHISPER_MODEL ?? `${homedir()}/.cache/whisper/ggml-large-v3-turbo.bin`;

/** Integrated loudness (LUFS; NaN for silence) and true peak (dBTP) by ffmpeg loudnorm's measuring pass; throws when
 *  ffmpeg fails. */
export function measureLoudness(file: string): { i: number; tp: number } {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = r.status === 0 ? r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/) : null;
  if (!m) throw new Error(`ffmpeg loudnorm failed on ${file} (${r.error?.message ?? `exit ${r.status}`}): ${r.stderr?.trim().split('\n').slice(-3).join(' / ')}`);
  const j = JSON.parse(m[0]);
  return { i: Number(j.input_i), tp: Number(j.input_tp) };
}

/** `x.m4a` → `x.tmp.m4a`: beside it, its extension kept (ffmpeg picks the format by it). */
const tmpOf = (file: string): string => file.replace(/(\.[^./]+)?$/, '.tmp$1');

/** Write `outs` through temp files beside them, then rename each into place (`make` writes the temps and returns what's
 *  measured of them; an out whose temp it didn't write is removed). A failure part way leaves the old files: never
 *  half a file under its name, nor a new file with an old manifest entry. */
export function staged<T>(outs: readonly string[], make: (tmps: string[]) => T): T {
  const tmps = outs.map(tmpOf);
  try {
    const r = make(tmps);
    outs.forEach((out, k) => (existsSync(tmps[k]) ? renameSync(tmps[k], out) : rmSync(out, { force: true })));
    return r;
  } finally {
    for (const t of tmps) rmSync(t, { force: true });
  }
}

/** writeFileSync through a temp file and a rename. */
export const writeAtomic = (file: string, data: string | NodeJS.ArrayBufferView): void => staged([file], ([t]) => writeFileSync(t, data));

/** The committed report (scripts/tts/report.json): the full one's summary and, per clip, what the tests read (its
 *  source hash, its text, its condition and whisper's WER over it), a clip a line; the rest stays in the full report. */
export function slimReport(summary: unknown, items: Record<string, { src: string; text: string; cond?: string; condWer?: number }>): string {
  const rows = Object.entries(items).map(([id, { src, text, cond, condWer }]) =>
    `  ${JSON.stringify(id)}: ${JSON.stringify({ src, text, ...(cond ? { cond } : {}), ...(typeof condWer === 'number' ? { condWer } : {}) })}`);
  return `{\n "summary": ${JSON.stringify(summary)},\n "items": {\n${rows.join(',\n')}\n }\n}\n`;
}
