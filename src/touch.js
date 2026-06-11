import { input } from './input.js';

export function initTouch() {
  const forced = new URLSearchParams(location.search).has('touch');
  if (!forced && !(matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)) return false;
  document.body.classList.add('touch');

  let lastTap = 0;
  window.addEventListener('touchend', (e) => {
    if (e.touches.length === 0 && e.timeStamp - lastTap < 350) e.preventDefault();
    lastTap = e.timeStamp;
  }, { passive: false });

  const bind = (id, btn) => {
    const el = document.getElementById(id);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      input.press(btn);
      el.classList.add('active');
    });
    const off = () => { input.release(btn); el.classList.remove('active'); };
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
  };
  bind('btn-a', 'a');
  bind('btn-b', 'b');
  bind('start-btn', 'menu');

  const dpad = document.getElementById('dpad');
  let cur = null;
  let pointer = null;
  const setDir = (dir) => {
    if (cur === dir) return;
    if (cur) input.release(cur);
    cur = dir;
    if (dir) input.press(dir);
  };
  const handle = (e) => {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.1) { setDir(null); return; }
    setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  };
  dpad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dpad.setPointerCapture(e.pointerId);
    pointer = e.pointerId;
    handle(e);
  });
  dpad.addEventListener('pointermove', (e) => {
    if (e.pointerId === pointer) handle(e);
  });
  const end = (e) => {
    if (e.pointerId === pointer) { pointer = null; setDir(null); }
  };
  dpad.addEventListener('pointerup', end);
  dpad.addEventListener('pointercancel', end);
  return true;
}
