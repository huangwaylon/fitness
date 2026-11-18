// 英語すごろく's speaking step's relay call (contract: relay `POST /grade`): the confirmed sentence, the picture's word and
// the seat's level, with this phone's key (the guest's is refused, like /stt). The answer is checked again on the phone
// (speak.ts cleanGrade); anything else is a miss, and the step praises without it. Nothing is kept.
import { keyed } from '#lib/keyed.ts';
import { relayUrl } from '#lib/sync/transport.ts';
import { getKey } from '#lib/sync/storage.ts';
import { cleanGrade, type Grade } from './speak.ts';

type GradeMiss = 'off' | 'capped' | 'network' | 'ai' | 'timeout' | 'other';
export type Graded = { ok: true; grade: Grade; aiMs: number } | { ok: false; miss: GradeMiss };

/** The relay's grade of `s` (the target `t`, level `lv`); never throws. */
export async function grade(s: string, t: string, lv: 1 | 2 | 3, signal?: AbortSignal): Promise<Graded> {
  const r = await keyed(relayUrl('/grade'), getKey(), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ s: s.slice(0, 200), t, lv }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000)
  });
  if (!r.ok && !r.res) return { ok: false, miss: r.why === 'timeout' ? 'timeout' : r.why === 'unreached' ? 'network' : 'other' };
  const res = r.res!;
  if (!res.ok) return { ok: false, miss: res.status === 429 ? 'capped' : res.status === 503 ? 'off' : res.status === 502 ? 'ai' : 'other' };
  const j = (await res.json().catch(() => null)) as { aiMs?: unknown } | null;
  const g = cleanGrade(j, s);
  return g ? { ok: true, grade: g, aiMs: typeof j?.aiMs === 'number' ? j.aiMs : 0 } : { ok: false, miss: 'ai' };
}
