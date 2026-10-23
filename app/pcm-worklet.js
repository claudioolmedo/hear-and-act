// Captures mic audio, downsamples to 24 kHz mono by box-averaging,
// applies gain so speech reaches the API strong and clear,
// converts to PCM16 and posts ~100 ms chunks to the main thread.
class PCMCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 24000;
    this.ratio = sampleRate / this.targetRate;
    this.gain = 3.0;
    this.acc = [];
    this.chunkSize = 2400; // 100 ms at 24 kHz
    this.sum = 0;
    this.count = 0;
    this.pos = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.sum += ch[i];
      this.count += 1;
      this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio;
        let v = (this.sum / Math.max(1, this.count)) * this.gain;
        this.sum = 0; this.count = 0;
        this.acc.push(Math.max(-1, Math.min(1, v)));
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
