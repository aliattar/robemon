const GLYPHS = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14],
  D: [28, 18, 17, 17, 17, 18, 28], E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17], O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16], Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4], U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  É: [14, 0, 31, 16, 30, 16, 31],
  0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31],
  3: [31, 2, 4, 2, 1, 17, 14], 4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14],
  6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], 8: [14, 17, 17, 14, 17, 17, 14],
  9: [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0], '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8],
  '!': [4, 4, 4, 4, 4, 0, 4], '?': [14, 17, 1, 2, 4, 0, 4], "'": [4, 4, 8, 0, 0, 0, 0],
  '-': [0, 0, 0, 31, 0, 0, 0], ':': [0, 12, 12, 0, 12, 12, 0], '/': [1, 1, 2, 4, 8, 16, 16],
  '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8], '+': [0, 4, 4, 31, 4, 4, 0],
  '*': [0, 21, 14, 31, 14, 21, 0], '%': [25, 26, 2, 4, 8, 11, 19], '$': [4, 15, 20, 14, 5, 30, 4],
  '"': [10, 10, 0, 0, 0, 0, 0], '#': [10, 31, 10, 10, 10, 31, 10], '~': [0, 0, 8, 21, 2, 0, 0],
  '>': [8, 4, 2, 1, 2, 4, 8], '<': [2, 4, 8, 16, 8, 4, 2], '·': [0, 0, 12, 12, 0, 0, 0],
  '→': [0, 4, 2, 31, 2, 4, 0], '×': [0, 17, 10, 4, 10, 17, 0],
};

export const CHAR_W = 6;
export const CHAR_H = 8;

export function drawText(ctx, text, x, y, color = '#404048') {
  ctx.fillStyle = color;
  let cx = x;
  for (const raw of String(text).toUpperCase()) {
    const g = GLYPHS[raw] || GLYPHS['?'];
    for (let r = 0; r < 7; r++) {
      const row = g[r];
      for (let c = 0; c < 5; c++) {
        if (row & (16 >> c)) ctx.fillRect(cx + c, y + r, 1, 1);
      }
    }
    cx += CHAR_W;
  }
  return cx;
}

export function drawTextShadow(ctx, text, x, y, color = '#f8f8f8', shadow = '#404048') {
  drawText(ctx, text, x + 1, y + 1, shadow);
  drawText(ctx, text, x, y, color);
}

export function wrapText(text, maxChars) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (line && (line + ' ' + word).length > maxChars) { lines.push(line); line = word; }
      else line = line ? line + ' ' + word : word;
    }
    lines.push(line);
  }
  return lines;
}

export function drawPanel(ctx, x, y, w, h, opts = {}) {
  const fill = opts.fill || '#f8f8f8';
  const border = opts.border || '#58b048';
  const borderDark = opts.borderDark || '#306830';
  ctx.fillStyle = borderDark;
  ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillStyle = border;
  ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
  ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
}

export function drawDialogPanel(ctx, x, y, w, h) {
  drawPanel(ctx, x, y, w, h);
}

export function drawCursor(ctx, x, y, color = '#404048') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 7);
  ctx.fillRect(x + 1, y + 1, 1, 5);
  ctx.fillRect(x + 2, y + 2, 1, 3);
  ctx.fillRect(x + 3, y + 3, 1, 1);
}

export function drawHpBar(ctx, x, y, w, frac) {
  const f = Math.max(0, Math.min(1, frac));
  ctx.fillStyle = '#404048';
  ctx.fillRect(x - 1, y - 1, w + 2, 5);
  ctx.fillStyle = '#585858';
  ctx.fillRect(x, y, w, 3);
  const color = f > 0.5 ? '#58d058' : f > 0.2 ? '#f8b800' : '#f05848';
  const fw = Math.max(f > 0 ? 1 : 0, Math.round(w * f));
  ctx.fillStyle = color;
  ctx.fillRect(x, y, fw, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(x, y, fw, 1);
}

export class Typewriter {
  constructor(text, maxChars = 36) {
    this.lines = wrapText(text, maxChars);
    this.shown = 0;
    this.total = this.lines.join('').length + this.lines.length;
    this.speed = 1.4;
  }
  update() { this.shown = Math.min(this.total, this.shown + this.speed); }
  skip() { this.shown = this.total; }
  get done() { return this.shown >= this.total; }
  visibleLines() {
    let budget = Math.floor(this.shown);
    const out = [];
    for (const line of this.lines) {
      if (budget <= 0) break;
      out.push(line.slice(0, budget));
      budget -= line.length + 1;
    }
    return out;
  }
}
