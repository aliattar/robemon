const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Enter: 'a',
  KeyX: 'b', Escape: 'menu', KeyM: 'menu', Space: 'menu',
};

const held = new Set();
const pressed = new Set();

window.addEventListener('keydown', (e) => {
  const btn = KEYMAP[e.code];
  if (!btn) return;
  e.preventDefault();
  if (!held.has(btn)) pressed.add(btn);
  held.add(btn);
});

window.addEventListener('keyup', (e) => {
  const btn = KEYMAP[e.code];
  if (btn) held.delete(btn);
});

window.addEventListener('blur', () => held.clear());

export const input = {
  held: (btn) => held.has(btn),
  pressed: (btn) => pressed.has(btn),
  press(btn) {
    if (!held.has(btn)) pressed.add(btn);
    held.add(btn);
  },
  release(btn) { held.delete(btn); },
  dir() {
    for (const d of ['up', 'down', 'left', 'right']) if (held.has(d)) return d;
    return null;
  },
  endFrame() { pressed.clear(); },
};
