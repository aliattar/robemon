import { MON } from '../data/dex.js';
import { TYPE_COLORS } from '../data/types.js';
import { monSprite, charSprite } from '../sprites.js';
import { G, makeMon, hasSave, load } from '../state.js';
import { input } from '../input.js';
import { sfx } from '../audio.js';
import { scenes } from '../scene.js';
import { Dialog } from '../dialog.js';
import { drawPanel, drawText, drawTextShadow, drawCursor } from '../ui.js';
import { OverworldScene } from './overworld.js';

const STARTERS = ['mini-pi', 'go2', 'bdx-droid'];

export class TitleScene {
  constructor() {
    this.t = 0;
    this.cursor = 0;
    this.options = hasSave() ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME'];
  }
  update() {
    this.t++;
    if (input.pressed('up') || input.pressed('down')) {
      this.cursor = (this.cursor + 1) % this.options.length;
      sfx.blip();
    }
    if (input.pressed('a')) {
      sfx.select();
      if (this.options[this.cursor] === 'CONTINUE') {
        load();
        scenes.replace(new OverworldScene());
      } else {
        scenes.replace(new IntroScene());
      }
    }
  }
  draw(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, '#183058');
    grad.addColorStop(0.6, '#3868a8');
    grad.addColorStop(1, '#78b048');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 240, 160);

    const off = document.createElement('canvas');
    off.width = 42; off.height = 8;
    const og = off.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawText(og, 'ROBÉMON', 0, 0, '#283048');
    ctx.drawImage(off, 0, 0, 42, 8, 60, 33, 126, 24);
    og.clearRect(0, 0, 42, 8);
    drawText(og, 'ROBÉMON', 0, 0, '#f8d030');
    ctx.drawImage(off, 0, 0, 42, 8, 57, 30, 126, 24);

    drawTextShadow(ctx, 'CATCH REAL ROBOTS', 69, 60, '#f8f8f8', '#283048');

    const bounce = Math.abs(Math.sin(this.t / 20)) * 6;
    monSprite(MON.go2).draw(ctx, 88, 86 - bounce, 48);
    monSprite(MON.r1).draw(ctx, 140, 90 - bounce * 0.7, 40, true);

    const menuY = 130;
    this.options.forEach((o, i) => {
      drawTextShadow(ctx, o, 102, menuY + i * 12, '#f8f8f8', '#283048');
      if (this.cursor === i && Math.floor(this.t / 20) % 2 === 0) drawCursor(ctx, 93, menuY + i * 12, '#f8d030');
    });
  }
}

export class IntroScene {
  constructor() {
    this.dialog = new Dialog();
    this.phase = 'talk';
    this.cursor = 1;
    this.t = 0;
    this.dialog.start([
      'Hello there! Welcome to the world of ROBÉMON!',
      'My name is ALMOND. People call me the ROBOT PROFESSOR.',
      'This world is inhabited by creatures called ROBÉMON. Humanoid robots, quadrupeds, astromechs...',
      'Some ship at scale. Some are eternal demos. Studying them is my life work.',
      'Your very own robot adventure is about to unfold. But first...',
      'Choose your starter ROBÉMON!',
    ], () => { this.phase = 'pick'; sfx.select(); });
  }

  update() {
    this.t++;
    if (this.phase === 'talk' || this.phase === 'outro') { this.dialog.update(); return; }
    if (this.phase === 'pick') {
      if (input.pressed('left')) { this.cursor = (this.cursor + 2) % 3; sfx.blip(); }
      if (input.pressed('right')) { this.cursor = (this.cursor + 1) % 3; sfx.blip(); }
      if (input.pressed('a')) {
        sfx.select();
        this.phase = 'confirm';
        this.confirmCursor = 0;
      }
      return;
    }
    if (this.phase === 'confirm') {
      if (input.pressed('up') || input.pressed('down')) { this.confirmCursor = 1 - this.confirmCursor; sfx.blip(); }
      if (input.pressed('b')) { sfx.back(); this.phase = 'pick'; return; }
      if (input.pressed('a')) {
        if (this.confirmCursor === 1) { sfx.back(); this.phase = 'pick'; return; }
        sfx.catch();
        const id = STARTERS[this.cursor];
        const mon = makeMon(id, 5);
        G.party = [mon];
        G.starter = id;
        G.seen.add(id); G.caught.add(id);
        G.map = 'lab'; G.x = 6; G.y = 4; G.dir = 'down';
        G.healSpot = { map: 'lab', x: 6, y: 4 };
        this.phase = 'outro';
        this.dialog.start([
          `Excellent choice! ${MON[id].name} suits you.`,
          'Here, take an endless supply of CHARGE BALLS. They are venture funded.',
          'Tall grass, cable bundles, exhibit static... wild robots lurk in all of them.',
          'Fill the ROBODEX with all 78 entries. Now go! Your demo day awaits!',
        ], () => scenes.replace(new OverworldScene()));
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#284058';
    ctx.fillRect(0, 0, 240, 160);
    ctx.fillStyle = '#1c3048';
    for (let y = 0; y < 160; y += 8) ctx.fillRect(0, y, 240, 1);

    if (this.phase === 'talk') {
      const frames = charSprite(0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(frames.down[0], 0, 0, 16, 16, 88, 30, 64, 64);
      this.dialog.draw(ctx);
      return;
    }

    if (this.phase === 'pick' || this.phase === 'confirm') {
      drawTextShadow(ctx, 'CHOOSE YOUR STARTER', 63, 8, '#f8f8f8', '#101820');
      STARTERS.forEach((id, i) => {
        const mon = MON[id];
        const x = 12 + i * 76;
        const selected = this.cursor === i;
        drawPanel(ctx, x, 22, 68, 74, { fill: selected ? '#f8f8e8' : '#d8d8d0' });
        monSprite(mon).draw(ctx, x + 10, 26 + (selected ? Math.sin(this.t / 10) * 2 : 0), 48);
        drawText(ctx, mon.name.slice(0, 10), x + 34 - Math.min(10, mon.name.length) * 3, 78, '#404048');
        mon.t.forEach((tp, j) => {
          ctx.fillStyle = TYPE_COLORS[tp];
          ctx.fillRect(x + 6 + j * 29, 87, 27, 7);
          drawText(ctx, tp.slice(0, 4), x + 8 + j * 29, 87, '#f8f8f8');
        });
        if (selected) drawCursor(ctx, x + 31, 14, '#f8d030');
      });
      const mon = MON[STARTERS[this.cursor]];
      drawPanel(ctx, 12, 102, 216, 30);
      drawText(ctx, mon.flavor.split('.')[0] + '.', 18, 108, '#404048');
      drawText(ctx, `${mon.h} CM · ${mon.w} KG`, 18, 120, '#787878');

      if (this.phase === 'confirm') {
        drawPanel(ctx, 150, 112, 80, 40);
        drawText(ctx, `PICK ${mon.name.slice(0, 8)}?`, 156, 118);
        drawText(ctx, 'YES', 166, 130);
        drawText(ctx, 'NO', 166, 140);
        drawCursor(ctx, 158, 130 + this.confirmCursor * 10);
      }
      return;
    }

    this.dialog.draw(ctx);
  }
}
