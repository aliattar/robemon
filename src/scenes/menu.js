import { DEX, MON, REGION_NAMES, fmtPrice, movesAt, voiceMoveFor } from '../data/dex.js';
import { TYPE_COLORS } from '../data/types.js';
import { monSprite } from '../sprites.js';
import { G, save, monMoves } from '../state.js';
import { input } from '../input.js';
import { sfx } from '../audio.js';
import { music } from '../music.js';
import { scenes } from '../scene.js';
import { drawPanel, drawText, drawHpBar, drawCursor, wrapText } from '../ui.js';

export class StartMenu {
  constructor() {
    this.cursor = 0;
    this.options = ['ROBODEX', 'PARTY', 'BOX'];
    if (G.flags.hmVoice) this.options.push('VOICE HM');
    this.options.push('SAVE', 'MUSIC', 'EXIT');
    this.savedT = 0;
  }
  label(opt) {
    return opt === 'MUSIC' ? `MUSIC: ${music.muted ? 'OFF' : 'ON'}` : opt;
  }
  update() {
    if (this.savedT > 0) {
      this.savedT--;
      if (this.savedT === 0) scenes.pop();
      return;
    }
    if (input.pressed('b') || input.pressed('menu')) { sfx.back(); scenes.pop(); return; }
    if (input.pressed('up')) { this.cursor = (this.cursor + this.options.length - 1) % this.options.length; sfx.blip(); }
    if (input.pressed('down')) { this.cursor = (this.cursor + 1) % this.options.length; sfx.blip(); }
    if (input.pressed('a')) {
      sfx.select();
      const opt = this.options[this.cursor];
      if (opt === 'ROBODEX') scenes.push(new RobodexScene());
      else if (opt === 'PARTY') scenes.push(new PartyScene());
      else if (opt === 'BOX') scenes.push(new BoxScene());
      else if (opt === 'VOICE HM') scenes.push(new TeachScene());
      else if (opt === 'SAVE') { save(); sfx.heal(); this.savedT = 70; }
      else if (opt === 'MUSIC') music.toggleMute();
      else scenes.pop();
    }
  }
  draw(ctx) {
    const h = this.options.length * 13 + 14;
    drawPanel(ctx, 152, 4, 84, h);
    this.options.forEach((o, i) => {
      drawText(ctx, this.label(o), 170, 11 + i * 13);
      if (this.cursor === i) drawCursor(ctx, 161, 11 + i * 13);
    });
    if (this.savedT > 0) {
      drawPanel(ctx, 60, 66, 120, 24);
      drawText(ctx, 'GAME SAVED!', 87, 74);
    }
  }
}

export class RobodexScene {
  constructor() {
    this.cursor = 0;
    this.scroll = 0;
  }
  update() {
    if (input.pressed('b') || input.pressed('menu')) { sfx.back(); scenes.pop(); return; }
    const move = (d) => {
      this.cursor = Math.max(0, Math.min(DEX.length - 1, this.cursor + d));
      this.scroll = Math.max(0, Math.min(this.cursor - 5, DEX.length - 11));
      sfx.blip();
    };
    if (input.pressed('up')) move(-1);
    if (input.pressed('down')) move(1);
    if (input.pressed('left')) move(-10);
    if (input.pressed('right')) move(10);
  }
  draw(ctx) {
    ctx.fillStyle = '#b03028';
    ctx.fillRect(0, 0, 240, 160);
    ctx.fillStyle = '#982820';
    for (let y = 0; y < 160; y += 6) ctx.fillRect(0, y, 240, 1);
    drawText(ctx, 'ROBODEX', 8, 5, '#f8f8f8');
    drawText(ctx, `SEEN ${G.seen.size}  CAUGHT ${G.caught.size}`, 110, 5, '#f8d8a8');

    drawPanel(ctx, 4, 16, 110, 140, { fill: '#f8f0e0' });
    for (let i = 0; i < 11; i++) {
      const idx = this.scroll + i;
      const mon = DEX[idx];
      if (!mon) break;
      const y = 22 + i * 12;
      const seen = G.seen.has(mon.id);
      const caught = G.caught.has(mon.id);
      if (caught) {
        ctx.fillStyle = '#d04040';
        ctx.fillRect(10, y + 1, 5, 5);
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(11, y + 3, 3, 1);
      }
      drawText(ctx, String(mon.num).padStart(3, '0'), 18, y, '#888070');
      drawText(ctx, seen ? mon.name.slice(0, 12) : '---------', 40, y, seen ? '#404048' : '#b0a890');
      if (idx === this.cursor) drawCursor(ctx, 5, y);
    }

    const mon = DEX[this.cursor];
    drawPanel(ctx, 118, 16, 118, 140, { fill: '#f8f0e0' });
    const seen = G.seen.has(mon.id);
    const caught = G.caught.has(mon.id);
    if (!seen) {
      drawText(ctx, '?????', 162, 70, '#b0a890');
      return;
    }
    monSprite(mon).draw(ctx, 124, 20, 44);
    drawText(ctx, mon.name.slice(0, 11), 170, 24, '#404048');
    mon.t.forEach((tp, j) => {
      ctx.fillStyle = TYPE_COLORS[tp];
      ctx.fillRect(170 + j * 31, 34, 29, 8);
      drawText(ctx, tp.slice(0, 4), 172 + j * 31, 34, '#f8f8f8');
    });
    drawText(ctx, REGION_NAMES[mon.r].slice(0, 11), 170, 46, '#787060');
    drawText(ctx, `HT ${mon.h >= 1000 ? (mon.h / 100).toFixed(0) + ' M' : mon.h + ' CM'}`, 124, 68, '#605850');
    drawText(ctx, `WT ${mon.w} KG`, 124, 78, '#605850');
    drawText(ctx, `MSRP ${fmtPrice(mon.price)}`, 124, 88, '#605850');
    if (caught) {
      wrapText(mon.flavor, 18).slice(0, 5).forEach((line, i) => drawText(ctx, line, 124, 102 + i * 9, '#404048'));
    } else {
      drawText(ctx, 'CATCH IT TO LOG', 124, 102, '#b0a890');
      drawText(ctx, 'FULL SPEC DATA.', 124, 112, '#b0a890');
    }
  }
}

class ListScene {
  constructor(title) {
    this.title = title;
    this.cursor = 0;
    this.scroll = 0;
    this.note = null;
    this.noteT = 0;
  }
  list() { return []; }
  onSelect() {}
  update() {
    if (this.noteT > 0) { this.noteT--; if (this.noteT === 0) this.note = null; }
    if (input.pressed('b') || input.pressed('menu')) { sfx.back(); scenes.pop(); return; }
    const items = this.list();
    if (input.pressed('up')) { this.cursor = Math.max(0, this.cursor - 1); sfx.blip(); }
    if (input.pressed('down')) { this.cursor = Math.min(items.length - 1, this.cursor + 1); sfx.blip(); }
    this.cursor = Math.max(0, Math.min(this.cursor, items.length - 1));
    this.scroll = Math.max(0, Math.min(this.cursor - 6, items.length - 8));
    if (input.pressed('a') && items.length) this.onSelect(this.cursor);
  }
  showNote(text) { this.note = text; this.noteT = 80; }
  draw(ctx) {
    ctx.fillStyle = '#305848';
    ctx.fillRect(0, 0, 240, 160);
    ctx.fillStyle = '#284838';
    for (let y = 0; y < 160; y += 6) ctx.fillRect(0, y, 240, 1);
    drawText(ctx, this.title, 8, 5, '#f8f8f8');
    drawText(ctx, 'A: SELECT  B: BACK', 124, 5, '#a8c8b8');
    drawPanel(ctx, 4, 16, 140, 140, { fill: '#f0f8f0' });
    const items = this.list();
    if (!items.length) drawText(ctx, 'EMPTY', 56, 78, '#90a098');
    for (let i = 0; i < 8; i++) {
      const idx = this.scroll + i;
      const m = items[idx];
      if (!m) break;
      const y = 24 + i * 16;
      drawText(ctx, `${MON[m.id].name.slice(0, 11)}`, 18, y, m.hp > 0 ? '#404048' : '#b05050');
      drawText(ctx, `L${m.level}`, 92, y, '#787878');
      drawHpBar(ctx, 110, y + 2, 26, m.hp / m.maxHp);
      if (idx === this.cursor) drawCursor(ctx, 9, y);
    }
    const sel = items[this.cursor];
    drawPanel(ctx, 148, 16, 88, 140, { fill: '#f0f8f0' });
    if (sel) {
      const mon = MON[sel.id];
      monSprite(mon).draw(ctx, 168, 20, 48);
      drawText(ctx, mon.name.slice(0, 11), 192 - Math.min(11, mon.name.length) * 3, 70, '#404048');
      drawText(ctx, `HP ${sel.hp}/${sel.maxHp}`, 154, 82, '#605850');
      drawText(ctx, `ATK ${sel.atk} DEF ${sel.def}`, 154, 92, '#605850');
      drawText(ctx, `SPD ${sel.spd}`, 154, 102, '#605850');
      monMoves(sel).forEach((mv, i) => drawText(ctx, mv.name.toUpperCase().slice(0, 13), 154, 116 + i * 9, mv.voice ? '#c07820' : '#6878a0'));
    }
    if (this.note) {
      drawPanel(ctx, 30, 66, 180, 24);
      drawText(ctx, this.note, 120 - this.note.length * 3, 74);
    }
  }
}

export class PartyScene extends ListScene {
  constructor() { super('PARTY'); }
  list() { return G.party; }
  onSelect(idx) {
    if (G.party.length <= 1) { sfx.bump(); this.showNote('KEEP AT LEAST ONE ROBOT!'); return; }
    sfx.select();
    const [m] = G.party.splice(idx, 1);
    G.box.push(m);
    this.showNote(`${MON[m.id].name.toUpperCase()} SENT TO BOX.`);
  }
}

export class BoxScene extends ListScene {
  constructor() { super('BOX'); }
  list() { return G.box; }
  onSelect(idx) {
    if (G.party.length >= 6) { sfx.bump(); this.showNote('PARTY IS FULL!'); return; }
    sfx.select();
    const [m] = G.box.splice(idx, 1);
    G.party.push(m);
    this.showNote(`${MON[m.id].name.toUpperCase()} JOINED THE PARTY!`);
  }
}

export class TeachScene extends ListScene {
  constructor() {
    super('LIGHTBERRY HM');
    this.slotPick = null;
  }
  list() { return G.party; }
  teach(mon, slot) {
    mon.voice = true;
    if (slot !== undefined) mon.voiceSlot = slot;
    sfx.catch();
    this.showNote(`LEARNED ${voiceMoveFor(mon.id).name.toUpperCase()}!`);
  }
  onSelect(idx) {
    const mon = G.party[idx];
    if (mon.voice) { sfx.bump(); this.showNote('IT ALREADY KNOWS ITS VOICE MOVE!'); return; }
    if (movesAt(mon.id, mon.level).length < 4) { this.teach(mon); return; }
    sfx.select();
    this.slotPick = { mon, cursor: 0 };
  }
  update() {
    if (!this.slotPick) { super.update(); return; }
    if (this.noteT > 0) { this.noteT--; if (this.noteT === 0) this.note = null; }
    const { mon } = this.slotPick;
    if (input.pressed('b') || input.pressed('menu')) { sfx.back(); this.slotPick = null; return; }
    if (input.pressed('up')) { this.slotPick.cursor = Math.max(0, this.slotPick.cursor - 1); sfx.blip(); }
    if (input.pressed('down')) { this.slotPick.cursor = Math.min(3, this.slotPick.cursor + 1); sfx.blip(); }
    if (input.pressed('a')) {
      this.teach(mon, this.slotPick.cursor);
      this.slotPick = null;
    }
  }
  draw(ctx) {
    super.draw(ctx);
    if (!this.slotPick) return;
    const { mon, cursor } = this.slotPick;
    const v = voiceMoveFor(mon.id);
    drawPanel(ctx, 40, 36, 160, 88);
    drawText(ctx, `FORGET WHICH MOVE FOR`, 50, 42);
    drawText(ctx, `${v.name.toUpperCase()}?`, 50, 52, '#c07820');
    movesAt(mon.id, mon.level).forEach((mv, i) => {
      drawText(ctx, mv.name.toUpperCase().slice(0, 16), 64, 64 + i * 12);
      if (cursor === i) drawCursor(ctx, 54, 64 + i * 12);
    });
    if (this.note) {
      drawPanel(ctx, 30, 66, 180, 24);
      drawText(ctx, this.note, 120 - this.note.length * 3, 74);
    }
  }
}
