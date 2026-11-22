// The rooms' screenshot helpers (docs/design.md "The tent"): the chrome hidden (`bare`: every button, hint and toast,
// the scene alone; a tap anywhere brings it back, and it never outlives the visit: RoomShell) and カメラめせん
// (`faceCam`: every character's head turned to the camera, rooms/lookAt.ts; kept on this phone, DEVICE.faceCam).
import { DEVICE, localKV, writeRaw } from '#lib/sync/storage.ts';

function initial(): boolean {
  try {
    return localKV()?.getItem(DEVICE.faceCam) === '1';
  } catch {
    return false;
  }
}

export const shot = $state<{ bare: boolean; faceCam: boolean }>({ bare: false, faceCam: initial() });

export function setFaceCam(on: boolean): void {
  shot.faceCam = on;
  writeRaw(localKV(), DEVICE.faceCam, on ? '1' : '0');
}
