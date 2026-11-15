// ごはん's barcode scan, the camera (docs/food-data.md "Barcodes"): the back camera's stream, a frame's centre band
// for the decoder (decode.ts), and why it wouldn't open. Every track is stopped by `stopStream` (the scanner
// closed, the page hidden, a code read): iOS shows its camera dot till the last one stops.

/** Why the camera didn't open: refused (now or before: Settings), none on this device, or anything else (in use). */
export type CamFail = 'denied' | 'nocam' | 'other';

/** The back camera at a size a barcode reads well at (1280 × 720 asked; the phone gives what it has). */
const VIDEO: MediaTrackConstraints = { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } };

/** The back camera's stream. Throws getUserMedia's error (camFailOf reads it). */
export async function openCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('no camera', 'NotFoundError');
  return navigator.mediaDevices.getUserMedia({ video: VIDEO, audio: false });
}

/** getUserMedia's error, in words the sheet has copy for. */
export function camFailOf(e: unknown): CamFail {
  const name = e instanceof Error || e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') return 'nocam';
  return 'other';
}

/** Every track of a stream stopped (none: nothing). */
export function stopStream(s: MediaStream | null | undefined): void {
  for (const t of s?.getTracks() ?? []) t.stop();
}

/** The scanner's camera box (width ÷ height: 4:3, the video drawn over it as object-fit: cover) and the share of it
 *  read: its full width and half its height, around the guide band (84 % × 38 %), so a code a little off the band still
 *  reads; at most BAND_W pixels wide (the decoder's work grows with the pixels). */
const BOX_ASPECT = 4 / 3;
const READ_H = 0.5;
const BAND_W = 800;

/** The part of a `w` × `h` frame read (what the box shows of it, cover-fitted, its middle READ_H), and the size it's
 *  read at. */
export function bandOf(w: number, h: number, aspect = BOX_ASPECT): { sx: number; sy: number; sw: number; sh: number; dw: number; dh: number } {
  const [vw, vh] = w / h > aspect ? [h * aspect, h] : [w, w / aspect];
  const sw = Math.round(vw), sh = Math.round(vh * READ_H);
  const sx = Math.round((w - sw) / 2), sy = Math.round((h - sh) / 2);
  const k = Math.min(1, BAND_W / sw);
  return { sx, sy, sw, sh, dw: Math.round(sw * k), dh: Math.round(sh * k) };
}

/** The video's centre band as pixels for the decoder, drawn on `canvas` (reused frame to frame); null before the first
 *  frame. */
export function grabBand(video: HTMLVideoElement, canvas: HTMLCanvasElement): ImageData | null {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w || !h) return null;
  const b = bandOf(w, h);
  if (canvas.width !== b.dw || canvas.height !== b.dh) [canvas.width, canvas.height] = [b.dw, b.dh];
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, b.sx, b.sy, b.sw, b.sh, 0, 0, b.dw, b.dh);
  return ctx.getImageData(0, 0, b.dw, b.dh);
}
