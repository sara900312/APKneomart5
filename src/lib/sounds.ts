// Lightweight WebAudio UI sounds — no assets, works offline.

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Note {
  freq: number;
  start: number;
  dur: number;
  gain?: number;
  type?: OscillatorType;
}

function play(notes: Note[]) {
  if (muted) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  for (const n of notes) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.setValueAtTime(n.freq, now + n.start);
    const peak = n.gain ?? 0.08;
    g.gain.setValueAtTime(0.0001, now + n.start);
    g.gain.exponentialRampToValueAtTime(peak, now + n.start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);
    osc.connect(g).connect(ac.destination);
    osc.start(now + n.start);
    osc.stop(now + n.start + n.dur + 0.02);
  }
}

export const sounds = {
  setMuted(v: boolean) {
    muted = v;
    if (typeof window !== "undefined") localStorage.setItem("neo_sound_muted", v ? "1" : "0");
  },
  isMuted: () => muted,

  /** Generic UI tap */
  tap: () => play([{ freq: 540, start: 0, dur: 0.045, gain: 0.025, type: "sine" }]),

  /** Item added to cart */
  addToCart: () =>
    play([
      { freq: 520, start: 0, dur: 0.07, gain: 0.035, type: "sine" },
      { freq: 780, start: 0.055, dur: 0.1, gain: 0.03, type: "sine" },
    ]),

  /** Order submit pressed */
  confirm: () =>
    play([
      { freq: 392, start: 0, dur: 0.1, gain: 0.035, type: "sine" },
      { freq: 523.25, start: 0.08, dur: 0.12, gain: 0.03, type: "sine" },
    ]),

  /** Order created successfully */
  success: () =>
    play([
      { freq: 523.25, start: 0, dur: 0.11, gain: 0.04, type: "sine" },
      { freq: 659.25, start: 0.1, dur: 0.13, gain: 0.035, type: "sine" },
      { freq: 783.99, start: 0.21, dur: 0.18, gain: 0.03, type: "sine" },
    ]),

  error: () =>
    play([
      { freq: 280, start: 0, dur: 0.1, gain: 0.03, type: "sine" },
      { freq: 230, start: 0.08, dur: 0.13, gain: 0.025, type: "sine" },
    ]),

  aiOpen: () =>
    play([
      { freq: 330, start: 0, dur: 0.1, gain: 0.025, type: "sine" },
      { freq: 495, start: 0.08, dur: 0.13, gain: 0.022, type: "sine" },
      { freq: 660, start: 0.18, dur: 0.16, gain: 0.018, type: "sine" },
    ]),
};

/**
 * Global click sound for buttons/links. Elements with `data-sound="off"`
 * (or inside one) play their own sound instead.
 */
export function initUiSounds() {
  if (typeof window === "undefined") return () => {};
  muted = localStorage.getItem("neo_sound_muted") === "1";

  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const el = target.closest("button, a, [role='button'], input[type='radio'], select");
    if (!el) return;
    if (el.closest("[data-sound='off']")) return;
    if ((el as HTMLButtonElement).disabled) return;
    if (el.matches("a")) return;
    sounds.tap();
  };

  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
