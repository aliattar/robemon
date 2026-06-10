let ctx = null;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'square', vol = 0.04, when = 0) {
  try {
    const a = ac();
    const t = a.currentTime + when;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch { /* audio unavailable */ }
}

export const sfx = {
  blip: () => tone(880, 0.04),
  select: () => { tone(660, 0.06); tone(990, 0.06, 'square', 0.04, 0.06); },
  back: () => tone(330, 0.08),
  bump: () => tone(110, 0.06, 'triangle', 0.06),
  hit: () => tone(180, 0.12, 'sawtooth', 0.05),
  superHit: () => { tone(160, 0.1, 'sawtooth', 0.06); tone(120, 0.14, 'sawtooth', 0.06, 0.08); },
  faint: () => { tone(440, 0.1); tone(220, 0.12, 'square', 0.05, 0.1); tone(110, 0.2, 'square', 0.05, 0.2); },
  ball: () => tone(520, 0.07, 'triangle', 0.06),
  shake: () => tone(260, 0.08, 'triangle', 0.06),
  catch: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.05, i * 0.1)); },
  levelUp: () => { [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.1, 'square', 0.05, i * 0.07)); },
  heal: () => { [784, 988, 784, 1175].forEach((f, i) => tone(f, 0.1, 'triangle', 0.06, i * 0.09)); },
  encounter: () => { [440, 415, 392, 370].forEach((f, i) => tone(f, 0.09, 'square', 0.05, i * 0.06)); },
};
