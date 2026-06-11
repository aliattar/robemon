import { MON } from '../data/dex.js';
import { G, recalc } from '../state.js';
import { monSprite } from '../sprites.js';
import { input } from '../input.js';
import { sfx } from '../audio.js';
import { music } from '../music.js';
import { scenes } from '../scene.js';
import { drawPanel, drawText, Typewriter } from '../ui.js';

const MORPH_T = 420;
const SPARKS = [[-46, -52], [44, -40], [-30, -10], [38, 4], [-50, 14], [20, -64]];

export class EvolutionScene {
  constructor(mon, toId, onDone) {
    this.mon = mon;
    this.from = MON[mon.id];
    this.to = MON[toId];
    this.onDone = onDone;
    this.t = 0;
    this.phase = 'fade';
    this.hold = 0;
    this.tw = null;
    this.prevTrack = music.current;
    fetch('assets/music/evolution.mp3', { method: 'HEAD' })
      .then((r) => music.play(r.ok ? 'evolution' : 'arena'))
      .catch(() => music.play('arena'));
    this.buf = document.createElement('canvas');
    this.buf.width = 64;
    this.buf.height = 64;
  }

  say(text) {
    this.tw = new Typewriter(text, 36);
    this.hold = 0;
    sfx.blip();
  }

  textDone() {
    this.tw.update();
    if (!this.tw.done) {
      if (input.pressed('a') || input.pressed('b')) this.tw.skip();
      return false;
    }
    this.hold++;
    return input.pressed('a') || input.pressed('b') || this.hold > 70;
  }

  finish(evolved) {
    scenes.pop();
    music.play(this.prevTrack);
    this.onDone(evolved);
  }

  update() {
    this.t++;
    if (this.phase === 'fade') {
      if (this.t >= 40) { this.phase = 'intro'; this.say(`What? ${this.from.name.toUpperCase()} is evolving!`); }
      return;
    }
    if (this.phase === 'intro') {
      if (this.textDone()) { this.phase = 'morph'; this.t = 0; this.tw = null; }
      return;
    }
    if (this.phase === 'morph') {
      if (input.pressed('b')) {
        sfx.back();
        this.phase = 'cancelled';
        this.say(`Huh? ${this.from.name.toUpperCase()} stopped evolving!`);
        return;
      }
      if (this.t % 30 === 0) sfx.shake();
      if (this.t >= MORPH_T) {
        this.phase = 'flash';
        this.t = 0;
        sfx.catch();
        this.mon.id = this.to.id;
        recalc(this.mon);
        G.seen.add(this.to.id);
        G.caught.add(this.to.id);
      }
      return;
    }
    if (this.phase === 'flash') {
      if (this.t >= 36) {
        this.phase = 'reveal';
        this.t = 0;
        this.say(`TADA! Your ${this.from.name.toUpperCase()} evolved into ${this.to.name.toUpperCase()}!`);
      }
      return;
    }
    if (this.textDone()) this.finish(this.phase === 'reveal');
  }

  drawSilhouette(ctx, mon, cx, bottom, s) {
    const g = this.buf.getContext('2d');
    g.clearRect(0, 0, 64, 64);
    monSprite(mon).draw(g, 0, 0, 64);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#e8f0ff';
    g.fillRect(0, 0, 64, 64);
    g.globalCompositeOperation = 'source-over';
    const size = Math.round(64 * s);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.buf, cx - size / 2, bottom - size, size, size);
    ctx.restore();
  }

  draw(ctx) {
    ctx.fillStyle = `rgba(8,8,16,${this.phase === 'fade' ? Math.min(1, this.t / 40) : 1})`;
    ctx.fillRect(0, 0, 240, 160);
    if (this.phase === 'fade') return;

    const cx = 120, bottom = 104;
    if (this.phase === 'intro' || this.phase === 'cancelled') {
      monSprite(this.from).draw(ctx, cx - 32, bottom - 64, 64);
    } else if (this.phase === 'morph') {
      const interval = Math.max(6, 36 - Math.floor(this.t / 70) * 6);
      const showTo = Math.floor(this.t / interval) % 2 === 1;
      const frac = (this.t % interval) / interval;
      this.drawSilhouette(ctx, showTo ? this.to : this.from, cx, bottom, 0.7 + 0.3 * frac);
      if (this.t > MORPH_T - 90 && Math.floor(this.t / 4) % 2 === 0) {
        ctx.fillStyle = 'rgba(248,248,248,0.85)';
        ctx.fillRect(0, 0, 240, 160);
      }
    } else {
      monSprite(this.to).draw(ctx, cx - 32, bottom - 64, 64);
      if (this.phase === 'flash') {
        ctx.fillStyle = `rgba(248,248,248,${1 - this.t / 36})`;
        ctx.fillRect(0, 0, 240, 160);
      } else if (this.phase === 'reveal' && this.t < 90) {
        SPARKS.forEach(([dx, dy], i) => {
          if (Math.floor(this.t / 6 + i) % 2 === 0) drawText(ctx, '*', cx + dx, bottom - 32 + dy, i % 2 ? '#f8d030' : '#9be8ff');
        });
      }
    }
    if (this.tw) {
      drawPanel(ctx, 2, 116, 236, 42);
      this.tw.visibleLines().slice(0, 2).forEach((line, i) => drawText(ctx, line, 10, 126 + i * 12));
    }
  }
}
