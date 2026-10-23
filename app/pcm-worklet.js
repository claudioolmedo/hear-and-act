// Captures mic audio, downsamples to 24 kHz mono, converts to PCM16,
// and posts ~100 ms chunks (ArrayBuffer) to the main thread.
class PCMCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 24000;
    this.ratio = sampleRate / this.targetRate;
    this.acc = [];
    this.chunkSize = 2400; // 100 ms at 24 kHz
    this.pos = 0;
    this.lastSample = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      // simple decimation with averaging window
      this.lastSample += (ch[i] - this.lastSample) * 0.5;
      this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio;
        this.acc.push(Math.max(-1, Math.min(1, this.lastSample)));
        if (this.acc.length >= this.chunkSize) {
          const buf = new Int16Array(this.acc.length);
          for (let j = 0; j < this.acc.length; j++) buf[j] = this.acc[j] * 0x7fff;
          this.port.postMessage(buf.buffer, [buf.buffer]);
          this.acc = [];
        }
      }
    }
    return true;
  }
}
registerProcessor('pcm-capture', PCMCapture);
