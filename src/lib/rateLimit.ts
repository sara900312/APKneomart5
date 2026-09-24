const KEY = "neo_rate_v1";
const MAX_PER_BURST = 3;
const FIRST_COOLDOWN_MS = 4 * 60 * 1000;
const NEXT_COOLDOWN_MS = 5 * 60 * 1000;
const CYCLE_MS = 12 * 60 * 60 * 1000;

interface State {
  cycleStart: number;
  count: number;       // messages in current burst (0..3)
  bursts: number;      // how many cooldowns triggered in this cycle
  cooldownUntil: number;
}

function load(): State {
  if (typeof window === "undefined") return { cycleStart: 0, count: 0, bursts: 0, cooldownUntil: 0 };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!s) return { cycleStart: 0, count: 0, bursts: 0, cooldownUntil: 0 };
    return s;
  } catch {
    return { cycleStart: 0, count: 0, bursts: 0, cooldownUntil: 0 };
  }
}

function save(s: State) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export interface RateStatus {
  blocked: boolean;
  cooldownUntil: number;
  remaining: number;
}

export function getStatus(): RateStatus {
  const now = Date.now();
  let s = load();
  // reset cycle after 12h
  if (s.cycleStart && now - s.cycleStart >= CYCLE_MS) {
    s = { cycleStart: 0, count: 0, bursts: 0, cooldownUntil: 0 };
    save(s);
  }
  const blocked = s.cooldownUntil > now;
  return {
    blocked,
    cooldownUntil: s.cooldownUntil,
    remaining: Math.max(0, MAX_PER_BURST - s.count),
  };
}

/** Call before sending a message. Returns true if allowed; updates counters. */
export function consume(): RateStatus {
  const now = Date.now();
  let s = load();
  if (s.cycleStart && now - s.cycleStart >= CYCLE_MS) {
    s = { cycleStart: 0, count: 0, bursts: 0, cooldownUntil: 0 };
  }
  if (s.cooldownUntil > now) {
    return { blocked: true, cooldownUntil: s.cooldownUntil, remaining: 0 };
  }
  if (!s.cycleStart) s.cycleStart = now;
  s.count += 1;
  if (s.count >= MAX_PER_BURST) {
    const wait = s.bursts === 0 ? FIRST_COOLDOWN_MS : NEXT_COOLDOWN_MS;
    s.cooldownUntil = now + wait;
    s.bursts += 1;
    s.count = 0;
  }
  save(s);
  return {
    blocked: false,
    cooldownUntil: s.cooldownUntil,
    remaining: Math.max(0, MAX_PER_BURST - s.count),
  };
}

export function formatRemaining(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
