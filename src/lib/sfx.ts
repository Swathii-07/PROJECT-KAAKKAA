let ctx: AudioContext | null = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.15, at = 0) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + at);
  g.gain.setValueAtTime(0.0001, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + at);
  o.stop(c.currentTime + at + dur + 0.05);
}

function slide(f1: number, f2: number, dur: number, type: OscillatorType = "sine", gain = 0.14, at = 0) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, c.currentTime + at);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), c.currentTime + at + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + at);
  o.stop(c.currentTime + at + dur + 0.05);
}

function noise(dur: number, gain = 0.12, filterHz = 1200) {
  const c = ac();
  if (!c) return;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = filterHz;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}

let lastSplash = 0;
let lastScrub = 0;
export const sfx = {
  splash() {
    const now = performance.now();
    if (now - lastSplash < 110) return;
    lastSplash = now;
    noise(0.18, 0.09, 900 + Math.random() * 1400);
  },
  bubble() {
    tone(500 + Math.random() * 700, 0.12, "sine", 0.1);
  },
  shampoo() {
    const now = performance.now();
    if (now - lastScrub < 130) return;
    lastScrub = now;
    noise(0.14, 0.05, 2400 + Math.random() * 1800);
    tone(700 + Math.random() * 900, 0.09, "sine", 0.05);
  },
  comb() {
    const now = performance.now();
    if (now - lastScrub < 130) return;
    lastScrub = now;
    for (let i = 0; i < 5; i++) tone(1500 + i * 240, 0.03, "square", 0.035, i * 0.025);
  },
  squeak() {
    tone(900, 0.08, "triangle", 0.08);
    tone(1400, 0.08, "triangle", 0.05, 0.06);
  },
  boing() {
    slide(160, 620, 0.22, "sine", 0.16);
    slide(620, 200, 0.2, "sine", 0.1, 0.2);
  },
  caw(at = 0, pitch = 1) {
    // short, raspy, natural-ish crow caw: quick rise then harsh fall
    slide(300 * pitch, 640 * pitch, 0.05, "sawtooth", 0.12, at);
    slide(640 * pitch, 250 * pitch, 0.16, "sawtooth", 0.13, at + 0.05);
    slide(320 * pitch, 130 * pitch, 0.18, "square", 0.05, at + 0.05);
    setTimeout(() => noise(0.12, 0.06, 1500), at * 1000);
  },
  cawTwice() {
    this.caw(0, 1);
    this.caw(0.3, 0.94);
  },
  cawAngry() {
    this.caw(0, 1.08);
    this.caw(0.24, 1);
    this.caw(0.46, 0.9);
  },
  levelUp() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "square", 0.09, i * 0.09));
  },
  achievement() {
    [784, 988, 1319].forEach((f, i) => tone(f, 0.22, "triangle", 0.08, i * 0.07));
  },
  drama() {
    [110, 138, 165, 220].forEach((f, i) => tone(f, 0.9, "sawtooth", 0.07, i * 0.35));
    setTimeout(() => noise(0.5, 0.05, 300), 400);
  },
  fail() {
    [400, 330, 260, 180].forEach((f, i) => tone(f, 0.3, "sawtooth", 0.1, i * 0.16));
    slide(300, 60, 1.1, "sawtooth", 0.09, 0.6);
  },
  thud() {
    tone(90, 0.22, "sine", 0.22);
    noise(0.1, 0.08, 200);
  },
  boop() {
    tone(660, 0.07, "square", 0.07);
  },
};

/* ---------- looping cartoon background music ---------- */

const MELODY = [
  0, 4, 7, 4, 0, 4, 7, 12, 9, 7, 4, 7, 5, 4, 2, 0,
];
const BASS = [0, 0, 5, 5, 7, 7, 5, 5];
const ROOT = 196; // G3

let musicTimer: number | null = null;
let musicGain: GainNode | null = null;
let step = 0;

function midiFreq(semi: number, base = ROOT) {
  return base * Math.pow(2, semi / 12);
}

function mtone(freq: number, dur: number, type: OscillatorType, gain: number) {
  const c = ac();
  if (!c || !musicGain) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(musicGain);
  o.start();
  o.stop(c.currentTime + dur + 0.05);
}

export const music = {
  isOn: false,
  start() {
    const c = ac();
    if (!c || musicTimer !== null) return;
    musicGain = c.createGain();
    musicGain.gain.value = 0.18;
    musicGain.connect(c.destination);
    this.isOn = true;
    const tick = () => {
      const m = MELODY[step % MELODY.length]!;
      mtone(midiFreq(m + 12), 0.2, "square", 0.1);
      if (step % 2 === 0) mtone(midiFreq(BASS[(step / 2) % BASS.length]!, ROOT / 2), 0.26, "triangle", 0.16);
      if (step % 4 === 2) noise(0.05, 0.025, 5200);
      step++;
    };
    tick();
    musicTimer = window.setInterval(tick, 190);
  },
  stop() {
    if (musicTimer !== null) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
    musicGain?.disconnect();
    musicGain = null;
    this.isOn = false;
  },
  toggle() {
    if (this.isOn) this.stop();
    else this.start();
    return this.isOn;
  },
};
