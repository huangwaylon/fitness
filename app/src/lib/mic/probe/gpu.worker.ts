// The mic probe's one question to a dedicated Worker (docs/kikimimi-mic.md §1.1 step 1): does WebGPU give an adapter
// here (where whisper would run)? Posts true or false once.
const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
void (gpu ? gpu.requestAdapter().then((a) => !!a, () => false) : Promise.resolve(false)).then((ok) => postMessage(ok));
