// ごはん's barcode scan, one scanner session's timings for the log (`perf.scan`, contract/log.ts; docs/ops/perf.md):
// ms from the camera's open to its first frame and to the read, the decode's and the band grab's ms per frame read.
// Numbers only: never the code or the food. Pure but for the clock.

/** The frames kept for the percentiles (a minute's reading is ~330). */
const KEEP = 400;

const p50 = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)];
const r1 = (v: number): number => Math.round(v * 10) / 10;

export class ScanTiming {
  private openAt = 0;
  private frameMs: number | undefined;
  private readMs: number | undefined;
  private decs: number[] = [];
  private grabs: number[] = [];
  /** How the session ended: a read, a typed number, the idle stop, or nothing (left while reading). */
  end: 'read' | 'typed' | 'idle' | 'none' = 'none';

  constructor(private now: () => number = () => performance.now()) {}

  /** The camera asked for (each start: the read counts from the last). */
  open(): void {
    this.openAt = this.now();
  }
  /** Its first frame on screen (the session's first only). */
  frame(): void {
    this.frameMs ??= this.now() - this.openAt;
  }
  read(): void {
    this.readMs ??= this.now() - this.openAt;
    this.end = 'read';
  }
  /** A frame read: its band's grab and its decode, ms. */
  frameRead(grab: number, decode: number): void {
    if (this.decs.length >= KEEP) return;
    this.grabs.push(grab);
    this.decs.push(decode);
  }
  /** The event's fields (only those known). */
  fields(): Record<string, number | string> {
    const d = this.decs;
    return {
      ...(this.frameMs !== undefined ? { frame: Math.round(this.frameMs) } : {}),
      ...(this.readMs !== undefined ? { read: Math.round(this.readMs) } : {}),
      ...(d.length ? { dec50: r1(p50(d)), decMax: r1(Math.max(...d)), grab: r1(p50(this.grabs)) } : {}),
      n: d.length, end: this.end
    };
  }
}
