// Audio de Senda de Héroes — síntesis procedural con Web Audio API.
// Sin ficheros de audio ni dependencias: osciladores + ruido generados al vuelo.
// Se activa tras el primer gesto del usuario (política de autoplay); en Node o
// sin AudioContext queda inerte (no-op). Las preferencias se guardan en
// localStorage (senda-de-heroes.audio).

const STORE_KEY = "senda-de-heroes.audio";
const DEFAULT_PREFS = { sfx: true, music: true };

let ctx = null;
let master = null;
let sfxGain = null;
let musicGain = null;
let musicFilter = null;
let musicTimer = null;
let arpTimer = null;
let musicChord = 0;
let currentChord = [];
let prefs = { ...DEFAULT_PREFS };

function storage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function loadPrefs() {
  const store = storage();
  if (!store) return;
  try {
    const raw = store.getItem(STORE_KEY);
    if (raw) prefs = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    // preferencias corruptas: se usan las por defecto
  }
}

function savePrefs() {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORE_KEY, JSON.stringify(prefs));
  } catch {
    // sin almacenamiento: las preferencias no persisten
  }
}

function ensureCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 1;
    sfxGain.connect(master);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.22;
    musicGain.connect(master);
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = "lowpass";
    musicFilter.frequency.value = 2200;
    musicFilter.Q.value = 0.6;
    musicFilter.connect(musicGain);
  }
  return ctx;
}

// Desbloquea el contexto de audio: se llama desde el primer gesto del usuario.
export function unlock() {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "suspended") {
    c.resume()
      .then(() => applyMusicState())
      .catch(() => {});
  } else {
    applyMusicState();
  }
}

export function getPrefs() {
  return { ...prefs };
}

export function setPrefs(patch) {
  prefs = { ...prefs, ...patch };
  savePrefs();
  applyMusicState();
}

export function isEnabled(kind) {
  return !!prefs[kind];
}

// ---------- síntesis de bajo nivel ----------

function now(c) {
  return c.currentTime;
}

function tone(c, dest, { freq = 440, type = "sine", dur = 0.12, gain = 0.2, at = 0, slide = 0, attack = 0.004, release = 0.03 }) {
  const t0 = now(c) + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
  osc.connect(g);
  g.connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + release + 0.02);
  return osc;
}

let noiseBuf = null;
function noise(c, dest, { dur = 0.1, gain = 0.2, at = 0, freq = 1000, q = 0.8 }) {
  if (!noiseBuf) {
    const len = Math.floor(c.sampleRate * 0.5);
    noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = now(c) + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function chord(c, dest, freqs, { dur = 2.4, gain = 0.05, type = "sine", at = 0, attack = 0.4, release = 0.6 }) {
  freqs.forEach((f) => tone(c, dest, { freq: f, type, dur, gain, at, attack, release }));
}

// ---------- efectos de sonido ----------

const SFX = {
  ui() { tone(ctx, sfxGain, { freq: 660, type: "triangle", dur: 0.05, gain: 0.06 }); },
  playCard() {
    noise(ctx, sfxGain, { dur: 0.09, gain: 0.12, freq: 1400 });
    tone(ctx, sfxGain, { freq: 520, type: "triangle", dur: 0.06, gain: 0.05, slide: 160 });
  },
  damage() {
    tone(ctx, sfxGain, { freq: 130, type: "sine", dur: 0.16, gain: 0.3, slide: -70 });
    noise(ctx, sfxGain, { dur: 0.1, gain: 0.16, freq: 300, q: 0.5 });
  },
  heal() {
    tone(ctx, sfxGain, { freq: 660, type: "sine", dur: 0.14, gain: 0.16 });
    tone(ctx, sfxGain, { freq: 880, type: "sine", dur: 0.18, gain: 0.14, at: 0.07 });
  },
  block() {
    tone(ctx, sfxGain, { freq: 1200, type: "triangle", dur: 0.05, gain: 0.1 });
    tone(ctx, sfxGain, { freq: 480, type: "sine", dur: 0.09, gain: 0.08, at: 0.02 });
  },
  draw() {
    noise(ctx, sfxGain, { dur: 0.05, gain: 0.08, freq: 2200, q: 1 });
  },
  coin() {
    tone(ctx, sfxGain, { freq: 1320, type: "square", dur: 0.06, gain: 0.05 });
    tone(ctx, sfxGain, { freq: 1760, type: "square", dur: 0.12, gain: 0.05, at: 0.06 });
  },
  perk() {
    tone(ctx, sfxGain, { freq: 523, type: "triangle", dur: 0.1, gain: 0.12 });
    tone(ctx, sfxGain, { freq: 784, type: "triangle", dur: 0.14, gain: 0.12, at: 0.08 });
    tone(ctx, sfxGain, { freq: 1046, type: "triangle", dur: 0.2, gain: 0.1, at: 0.16 });
  },
  reaction() {
    tone(ctx, sfxGain, { freq: 1568, type: "sine", dur: 0.08, gain: 0.08, slide: 400 });
  },
  enemy() {
    tone(ctx, sfxGain, { freq: 90, type: "sawtooth", dur: 0.24, gain: 0.14, slide: -30 });
    noise(ctx, sfxGain, { dur: 0.16, gain: 0.1, freq: 200, q: 0.6 });
  },
  ko() {
    tone(ctx, sfxGain, { freq: 220, type: "sawtooth", dur: 0.3, gain: 0.2, slide: -120 });
  },
  victory() {
    [523, 659, 784, 1046].forEach((f, i) => tone(ctx, sfxGain, { freq: f, type: "triangle", dur: 0.3, gain: 0.14, at: i * 0.13 }));
  },
  defeat() {
    [392, 311, 262].forEach((f, i) => tone(ctx, sfxGain, { freq: f, type: "sawtooth", dur: 0.34, gain: 0.1, at: i * 0.16 }));
  },
};

export function sfx(name) {
  const c = ensureCtx();
  if (!c || c.state !== "running" || !prefs.sfx) return;
  if (SFX[name]) SFX[name]();
}

// ---------- música (cama ambiental épica) ----------

const MOODS = {
  // Heroico y aventurero: I–V–vi–IV en Do mayor.
  menu: {
    chords: [
      [261.63, 329.63, 392.0], // Do mayor
      [196.0, 246.94, 293.66], // Sol mayor
      [220.0, 261.63, 329.63], // La menor
      [174.61, 220.0, 261.63], // Fa mayor
    ],
    type: "sawtooth",
  },
  // Épico y enérgico: vi–IV–I–V en La menor.
  combat: {
    chords: [
      [220.0, 261.63, 329.63], // La menor
      [174.61, 220.0, 261.63], // Fa mayor
      [261.63, 329.63, 392.0], // Do mayor
      [196.0, 246.94, 293.66], // Sol mayor
    ],
    type: "sawtooth",
  },
};

function startMusic(moodKey) {
  stopMusic();
  const mood = MOODS[moodKey] || MOODS.menu;
  const chordDur = 4;

  const playChord = () => {
    if (!ctx || !prefs.music) return;
    currentChord = mood.chords[musicChord % mood.chords.length];
    musicChord += 1;
    // Pad épico (sawtooth filtrado) + refuerzo de octava + bajo grave.
    chord(ctx, musicFilter, currentChord, { dur: chordDur + 0.5, gain: 0.055, type: mood.type, attack: 0.5, release: 0.9 });
    chord(ctx, musicFilter, [currentChord[0] * 2], { dur: chordDur + 0.5, gain: 0.02, type: "sine", attack: 0.5, release: 0.9 });
    tone(ctx, musicFilter, { freq: currentChord[0] / 2, type: "triangle", dur: chordDur + 0.5, gain: 0.075, attack: 0.25, release: 0.9 });
  };

  playChord();
  musicTimer = window.setInterval(playChord, chordDur * 1000);

  // Arpegio aventurero: recorre las notas del acorde actual una octava arriba.
  const stepMs = 300;
  const pattern = [0, 1, 2, 1];
  let arpIdx = 0;
  arpTimer = window.setInterval(() => {
    if (!ctx || !prefs.music || !currentChord.length) return;
    const f = currentChord[pattern[arpIdx % pattern.length]] * 2;
    arpIdx += 1;
    tone(ctx, musicFilter, { freq: f, type: "triangle", dur: 0.26, gain: 0.03, at: 0, attack: 0.01, release: 0.08 });
  }, stepMs);
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (arpTimer) {
    clearInterval(arpTimer);
    arpTimer = null;
  }
  currentChord = [];
}

// Aplica el estado de la música según las preferencias y el ánimo actual.
let currentMood = "menu";
export function music(moodKey) {
  currentMood = moodKey || "menu";
  if (typeof window === "undefined") return;
  applyMusicState();
}

function applyMusicState() {
  const c = ctx;
  if (!c) return;
  if (prefs.music && c.state === "running") {
    if (!musicTimer) startMusic(currentMood);
  } else {
    stopMusic();
  }
}

// Cambia de ánimo si la música ya está sonando.
export function setMood(moodKey) {
  currentMood = moodKey || "menu";
  if (musicTimer) startMusic(currentMood);
}

loadPrefs();
