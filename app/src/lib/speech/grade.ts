// 英語すごろく's speaking step's relay call (docs/sugoroku.md "Speaking", relay `POST /grade`): the confirmed sentence and
// the picture's word, with this phone's key (any of the three, like /stt). The answer is checked again on the phone
// (cleanGrade: contract/grade.ts's sanitiser, the relay's own); anything else is a miss, and the step praises without
// it. Nothing is kept.
import { gradeOf, type Grade as ContractGrade, type GradeSrc } from '#lib/contract/grade.ts';
import { keyed } from '#lib/keyed.ts';
import { relayUrl } from '#lib/sync/transport.ts';
import { getKey } from '#lib/sync/storage.ts';
import { relayMiss, type RelayMiss } from './match.ts';

/** The relay's answer as the phone shows it (contract/grade.ts) and where it came from. */
export type Grade = ContractGrade & { src: GradeSrc };
export type Graded = { ok: true; grade: Grade; aiMs: number } | { ok: false; miss: RelayMiss };

/** The relay's JSON checked again on the phone (contract/grade.ts gradeOf: one sanitiser with the relay's); null: not
 *  an answer. */
export function cleanGrade(x: unknown, s: string): Grade | null {
  const j = x as Record<string, unknown> | null;
  const g = j?.ok === true ? gradeOf(j, s) : null;
  return g && { ...g, src: j!.src === 'wasei' ? 'wasei' : 'ai' };
}

/** The relay's grade of `s` (the target `t`); never throws. */
export async function grade(s: string, t: string, signal?: AbortSignal): Promise<Graded> {
  const r = await keyed(relayUrl('/grade'), getKey(), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ s: s.slice(0, 200), t: t.toLowerCase() }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000)
  });
  if (!r.ok) return { ok: false, miss: relayMiss(r) };
  const j = (await r.res.json().catch(() => null)) as { aiMs?: unknown } | null;
  const g = cleanGrade(j, s);
  return g ? { ok: true, grade: g, aiMs: typeof j?.aiMs === 'number' ? j.aiMs : 0 } : { ok: false, miss: 'ai' };
}
