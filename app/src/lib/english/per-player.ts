// A value per player in one localStorage key on this phone (`{ [who]: value }`): English Study's deck place, phrases,
// skips and おかえりなさい. Read unchecked: the caller checks the shape.
import { localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import type { Who } from '#lib/types.ts';

export function perPlayer<T>(key: string): { get: (who: Who) => T | undefined; set: (who: Who, v: T) => void } {
  const read = () => readJson<Record<string, T>>(localKV(), key) ?? {};
  return { get: (who) => read()[who], set: (who, v) => void writeJson(localKV(), key, { ...read(), [who]: v }) };
}
