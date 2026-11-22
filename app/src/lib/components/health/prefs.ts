// けんこう's choices on this phone (docs/design.md "Kenkou"): 体重's 〰 傾向線 (the smoothed line and its projection; on by
// default; off: the thin line through the weigh-ins, as the other body cards).
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';

export const weightLineOn = (): boolean => readJson<boolean>(localKV(), DEVICE.weightLine) !== false;
export const setWeightLine = (on: boolean): void => void writeJson(localKV(), DEVICE.weightLine, on);
