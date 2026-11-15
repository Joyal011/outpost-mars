// Tiny synthesized sound effects (no audio files). Muting is remembered on this device.
const KEY = "outpost-mars-muted";
let ctx: AudioContext | null = null;
let muted = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1";

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(KEY, m ? "1" : "0");
  } catch {
    /* storage may be blocked */
  }
}

type Sound = "click" | "good" | "bad" | "alarm" | "sol" | "win";
const NOTES: Record<Sound, [number, number][]> = {
  click: [[660, 0.05]],
  good: [[523, 0.08], [784, 0.12]],
  bad: [[300, 0.12], [220, 0.18]],
  alarm: [[880, 0.12], [660, 0.12], [880, 0.12], [660, 0.12]],
  sol: [[392, 0.1], [523, 0.1], [659, 0.16]],
  win: [[523, 0.12], [659, 0.12], [784, 0.12], [1046, 0.3]],
};

export function play(sound: Sound) {
  if (muted || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dur] of NOTES[sound]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = sound === "alarm" ? "square" : "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur * 0.9;
    }
  } catch {
    /* audio not available */
  }
}
