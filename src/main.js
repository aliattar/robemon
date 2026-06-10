import { input } from './input.js';
import { music } from './music.js';
import { initTouch } from './touch.js';
import { stack, scenes } from './scene.js';
import { TitleScene } from './scenes/intro.js';

window.addEventListener('keydown', () => music.unlock(), { once: true });
window.addEventListener('pointerdown', () => music.unlock(), { once: true });
window.addEventListener('touchstart', () => music.unlock(), { once: true });

const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const host = document.getElementById('game');

function fit() {
  const scale = Math.max(1, Math.floor(Math.min(host.clientWidth / 240, host.clientHeight / 160)));
  canvas.style.width = `${240 * scale}px`;
  canvas.style.height = `${160 * scale}px`;
}
window.addEventListener('resize', fit);
initTouch();
fit();

scenes.push(new TitleScene());

let last = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (now - last < 1000 / 62) return;
  last = now;
  const top = scenes.top();
  if (top) top.update();
  ctx.imageSmoothingEnabled = false;
  for (const s of stack) s.draw(ctx);
  input.endFrame();
}
requestAnimationFrame(loop);
