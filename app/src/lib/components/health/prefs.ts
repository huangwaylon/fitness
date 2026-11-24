// けんこう's choices on this phone (docs/design.md "Kenkou"): 〰 傾向線, the toggle on 体重's card (every からだ card's
// trend line and 体重's projection; on by default; off: the thin line through the measurements).
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';

export const weightLineOn = (): boolean => readJson<boolean>(localKV(), DEVICE.weightLine) !== false;
export const setWeightLine = (on: boolean): void => void writeJson(localKV(), DEVICE.weightLine, on);
