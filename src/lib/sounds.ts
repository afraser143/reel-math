"use client";

/**
 * Little sound effects, made with the Web Audio API (no audio files to download).
 * The mute setting is remembered on this device. Browsers only allow sound after a tap,
 * which every sound here follows.
 */

const MUTE_KEY = "reelmath.muted";
let ctx: AudioContext | null = null;

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Private mode or storage blocked: sounds just follow the button for this visit.
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || isMuted()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(ac: AudioContext, freq: number, start: number, length: number, type: OscillatorType = "sine", volume = 0.2) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  gain.gain.setValueAtTime(0, ac.currentTime + start);
  gain.gain.linearRampToValueAtTime(volume, ac.currentTime + start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + length);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + length + 0.05);
}

/** A quick reel clicking as the answer goes out. */
export function playReel() {
  const ac = audio();
  if (!ac) return;
  for (let i = 0; i < 6; i++) tone(ac, 1800 - i * 120, i * 0.035, 0.025, "square", 0.05);
}

/** A splash: a short burst of filtered noise. */
export function playSplash() {
  const ac = audio();
  if (!ac) return;
  const length = 0.45;
  const buffer = ac.createBuffer(1, ac.sampleRate * length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2200, ac.currentTime);
  filter.frequency.exponentialRampToValueAtTime(300, ac.currentTime + length);
  const gain = ac.createGain();
  gain.gain.value = 0.35;
  source.connect(filter).connect(gain).connect(ac.destination);
  source.start();
}

/** "Fish on!": a bright rising chime. */
export function playFishOn() {
  const ac = audio();
  if (!ac) return;
  [523, 659, 784].forEach((f, i) => tone(ac, f, 0.12 + i * 0.09, 0.25, "triangle", 0.18));
}

/** A soft, friendly bloop for a miss: not a buzzer. */
export function playMiss() {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.frequency.setValueAtTime(420, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.3);
  gain.gain.setValueAtTime(0.18, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.4);
}

/** A little fanfare for an achievement, a lunker or a rare fish. */
export function playFanfare() {
  const ac = audio();
  if (!ac) return;
  [523, 659, 784, 1047].forEach((f, i) => tone(ac, f, 0.15 + i * 0.12, 0.35, "triangle", 0.2));
  tone(ac, 1047, 0.15 + 4 * 0.12, 0.6, "sine", 0.15);
}

/** The legendary show: whistling rockets, booms and crackles, then a big fanfare. */
export function playFireworks() {
  const ac = audio();
  if (!ac) return;
  const boom = (at: number) => {
    // A deep thump plus a crackle of scattered noise pops.
    const thump = ac.createOscillator();
    const tg = ac.createGain();
    thump.frequency.setValueAtTime(140, ac.currentTime + at);
    thump.frequency.exponentialRampToValueAtTime(40, ac.currentTime + at + 0.4);
    tg.gain.setValueAtTime(0.35, ac.currentTime + at);
    tg.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + at + 0.5);
    thump.connect(tg).connect(ac.destination);
    thump.start(ac.currentTime + at);
    thump.stop(ac.currentTime + at + 0.55);

    const length = 0.6;
    const buffer = ac.createBuffer(1, ac.sampleRate * length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() < 0.06 ? (Math.random() * 2 - 1) * (1 - i / data.length) : 0;
    const crackle = ac.createBufferSource();
    crackle.buffer = buffer;
    const cg = ac.createGain();
    cg.gain.value = 0.25;
    crackle.connect(cg).connect(ac.destination);
    crackle.start(ac.currentTime + at + 0.05);
  };
  const whistle = (at: number) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, ac.currentTime + at);
    osc.frequency.exponentialRampToValueAtTime(2200, ac.currentTime + at + 0.45);
    g.gain.setValueAtTime(0.0001, ac.currentTime + at);
    g.gain.linearRampToValueAtTime(0.05, ac.currentTime + at + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + 0.45);
    osc.connect(g).connect(ac.destination);
    osc.start(ac.currentTime + at);
    osc.stop(ac.currentTime + at + 0.5);
  };
  [0, 0.5, 0.9, 1.6, 2.1, 2.5, 3.2, 3.8].forEach((t) => {
    whistle(t);
    boom(t + 0.45);
  });
  // The triumphant fanfare over the top.
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(ac, f, 0.3 + i * 0.14, 0.45, "triangle", 0.16));
  tone(ac, 1047, 1.1, 1.2, "sine", 0.12);
}
