const tracks = {};
let current = null;
let muted = false;
let unlocked = false;

function trackFor(name) {
  if (!tracks[name]) {
    const a = new Audio(`assets/music/${name}.mp3`);
    a.loop = true;
    a.volume = 0.4;
    tracks[name] = a;
  }
  return tracks[name];
}

function resume() {
  if (!current || muted) return;
  const a = trackFor(current);
  if (a.paused) a.play().catch(() => {});
}

export const music = {
  play(name) {
    if (!name || current === name) return;
    if (current) trackFor(current).pause();
    current = name;
    if (unlocked) resume();
  },
  unlock() {
    unlocked = true;
    resume();
  },
  toggleMute() {
    muted = !muted;
    if (muted) { if (current) trackFor(current).pause(); } else resume();
    return muted;
  },
  get muted() { return muted; },
  get current() { return current; },
};
