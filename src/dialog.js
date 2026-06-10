import { drawDialogPanel, drawText, drawCursor, Typewriter, CHAR_H } from './ui.js';
import { input } from './input.js';
import { sfx } from './audio.js';

export class Dialog {
  constructor() {
    this.pages = [];
    this.tw = null;
    this.onDone = null;
  }
  start(lines, onDone = null) {
    this.pages = Array.isArray(lines) ? [...lines] : [lines];
    this.onDone = onDone;
    this.next();
  }
  next() {
    const page = this.pages.shift();
    if (page === undefined) {
      this.tw = null;
      const cb = this.onDone;
      this.onDone = null;
      if (cb) cb();
      return;
    }
    this.tw = new Typewriter(page, 36);
    sfx.blip();
  }
  get active() { return this.tw !== null; }
  update() {
    if (!this.tw) return;
    if (!this.tw.done) {
      this.tw.update();
      if (input.pressed('a') || input.pressed('b')) this.tw.skip();
    } else if (input.pressed('a') || input.pressed('b')) {
      this.next();
    }
  }
  draw(ctx) {
    if (!this.tw) return;
    drawDialogPanel(ctx, 2, 116, 236, 42);
    const lines = this.tw.visibleLines().slice(-3);
    lines.forEach((line, i) => drawText(ctx, line, 10, 123 + i * (CHAR_H + 2)));
    if (this.tw.done && Math.floor(performance.now() / 300) % 2 === 0) drawCursor(ctx, 228, 148);
  }
}
