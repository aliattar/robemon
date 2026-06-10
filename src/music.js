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

export const music = {
  play(name) {
    if (!name || current === name) return;
    if (current) trackFor(current).pause();
    current = name;
    if (unlocked && !muted) trackFor(name).play().catch(() => {});
  },
  unlock() {
    if (unlocked) return;
    unlocked = true;
    if (current && !muted) trackFor(current).play().catch(() => {});
  },
  toggleMute() {
    muted = !muted;
    if (current) muted ? trackFor(current).pause() : trackFor(current).play().catch(() => {});
    return muted;
  },
  get muted() { return muted; },
};
