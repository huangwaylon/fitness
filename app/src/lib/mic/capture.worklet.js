// The mic's AudioWorkletProcessor (docs/kikimimi-mic.md "Files"; capture.ts loads it by its own same-origin URL, never a
// blob:): the input's first channel posted to the page in blocks of 1024 frames (≈ 21 ms at 48 kHz), each block's
// buffer transferred. Nothing is kept here; 'stop' ends it. (Unchecked: the worklet scope's globals aren't in the DOM's
// types.)
// @ts-nocheck
class MicCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(1024);
    this.n = 0;
    this.on = true;
    this.port.onmessage = (e) => {
      if (e.data === 'stop') this.on = false;
    };
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        this.buf[this.n++] = ch[i];
        if (this.n === this.buf.length) {
          this.port.postMessage(this.buf, [this.buf.buffer]);
          this.buf = new Float32Array(1024);
          this.n = 0;
        }
      }
    }
    return this.on;
  }
}
registerProcessor('mic-capture', MicCapture);
