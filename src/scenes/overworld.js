import { MAPS, LEGENDARY_ORDER, LEGENDARY_LEVEL, DREAM_POOL, DREAM_LEVEL } from '../data/maps.js';
import { MON } from '../data/dex.js';
import { tileset, SOLID_TILES, charSprite, monSprite } from '../sprites.js';
import { G, makeMon, healParty, markSeen, addMon, recalc, rollDay } from '../state.js';
import { input } from '../input.js';
import { sfx } from '../audio.js';
import { music } from '../music.js';
import { Dialog } from '../dialog.js';
import { scenes } from '../scene.js';
import { drawPanel, drawText, drawCursor, wrapText } from '../ui.js';
import { BattleScene } from './battle.js';
import { StartMenu } from './menu.js';

const SPEED = 2;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

const G1_QUIZ = [
  { q: 'How tall is the UNITREE G1?', a: ['132 CM', '155 CM', '180 CM'], c: 0 },
  { q: 'How many DOF can a G1 have?', a: ['9 TO 12', '23 TO 43', '88 TO 99'], c: 1 },
  { q: 'How compact does a G1 fold up?', a: ['IT CANNOT FOLD', 'TO 100 CM', 'TO 69 CM'], c: 2 },
  { q: 'How long does a G1 battery last?', a: ['ABOUT 2 HOURS', '12 HOURS', 'THREE DAYS'], c: 0 },
  { q: 'How much does a G1 weigh?', a: ['12 KG', '35 KG', '80 KG'], c: 1 },
];

export class OverworldScene {
  constructor() {
    this.dialog = new Dialog();
    this.choice = null;
    this.fade = null;
    this.flashT = 0;
    this.pendingBattle = null;
    this.animT = 0;
    this.loadMap();
  }

  loadMap() {
    rollDay();
    this.mapKey = G.map;
    this.map = MAPS[G.map];
    this.tiles = tileset(this.map.theme);
    this.px = G.x * 16;
    this.py = G.y * 16;
    this.moving = false;
    this.bannerT = 110;
    for (const n of this.map.npcs || []) {
      if (!n.wander) continue;
      n.hx = n.hx ?? n.x;
      n.hy = n.hy ?? n.y;
      n.px = n.x * 16;
      n.py = n.y * 16;
      n.walking = false;
      n.cool = 30 + Math.floor(Math.random() * 120);
    }
    music.play(this.map.music || 'city-start');
  }

  tileAt(x, y) {
    return this.map.rows[y]?.[x] ?? '#';
  }

  npcs() {
    return (this.map.npcs || []).filter((n) => {
      if (n.hideIf && G.flags[n.hideIf]) return false;
      if (n.dream && !this.dreamLegend()) return false;
      return true;
    });
  }

  dreamPick() {
    const pool = DREAM_POOL.filter((id) => !G.caught.has(id));
    if (!pool.length) return null;
    let h = 0;
    for (const c of G.flags.day || '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return pool[h % pool.length];
  }

  dreamLegend() {
    return G.flags.dreamTried ? null : this.dreamPick();
  }

  npcAt(x, y) {
    return this.npcs().find((n) => n.x === x && n.y === y) || null;
  }

  walkable(x, y) {
    const t = this.tileAt(x, y);
    if (SOLID_TILES.has(t) || t === '#') return false;
    if (this.npcAt(x, y)) return false;
    return true;
  }

  warpAt(x, y) {
    return (this.map.warps || []).find((w) => w.x === x && w.y === y) || null;
  }

  startFade(cb) {
    this.fade = { t: 0, phase: 'out', cb };
  }

  updateWanderers(idle) {
    for (const n of this.npcs()) {
      if (!n.wander) continue;
      if (n.walking) {
        const tx = n.x * 16, ty = n.y * 16;
        n.px += Math.sign(tx - n.px);
        n.py += Math.sign(ty - n.py);
        if (n.px === tx && n.py === ty) n.walking = false;
        continue;
      }
      if (!idle || --n.cool > 0) continue;
      n.cool = 60 + Math.floor(Math.random() * 180);
      const dir = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
      const [dx, dy] = DIRS[dir];
      const nx = n.x + dx, ny = n.y + dy;
      if (Math.abs(nx - n.hx) > 2 || Math.abs(ny - n.hy) > 2) continue;
      if (!this.walkable(nx, ny) || (nx === G.x && ny === G.y) || this.warpAt(nx, ny)) continue;
      n.x = nx; n.y = ny;
      n.dir = dir;
      n.facing = null;
      n.walking = true;
    }
  }

  update() {
    if (G.dirty) { G.dirty = false; this.loadMap(); }
    if (this.bannerT > 0) this.bannerT--;
    this.animT++;
    music.play(this.map.music || 'city-start');

    const idle = !this.fade && this.flashT === 0 && !this.dialog.active && !this.choice;
    this.updateWanderers(idle);

    if (this.fade) {
      this.fade.t += 0.08;
      if (this.fade.t >= 1) {
        if (this.fade.phase === 'out') { this.fade.cb(); this.fade = { t: 0, phase: 'in' }; }
        else this.fade = null;
      }
      return;
    }

    if (this.flashT > 0) {
      this.flashT--;
      if (this.flashT === 0) {
        music.play(this.battleTrack);
        scenes.push(this.pendingBattle);
        this.pendingBattle = null;
      }
      return;
    }

    if (this.choice) { this.updateChoice(); return; }
    if (this.dialog.active) { this.dialog.update(); return; }

    if (this.moving) {
      const tx = G.x * 16, ty = G.y * 16;
      this.px += Math.sign(tx - this.px) * SPEED;
      this.py += Math.sign(ty - this.py) * SPEED;
      if (this.px === tx && this.py === ty) {
        this.moving = false;
        this.onArrive();
      }
      return;
    }

    if (input.pressed('menu')) { sfx.select(); scenes.push(new StartMenu()); return; }
    if (input.pressed('a')) { this.interact(); return; }

    const dir = input.dir();
    if (!dir) return;
    G.dir = dir;
    const [dx, dy] = DIRS[dir];
    const nx = G.x + dx, ny = G.y + dy;
    if (this.walkable(nx, ny)) {
      G.x = nx; G.y = ny;
      this.moving = true;
    }
  }

  onArrive() {
    const warp = this.warpAt(G.x, G.y);
    if (warp) {
      sfx.select();
      this.startFade(() => {
        G.map = warp.to; G.x = warp.tx; G.y = warp.ty;
        this.loadMap();
      });
      return;
    }
    if (this.tileAt(G.x, G.y) === 'w') this.tryEncounter();
  }

  tryEncounter() {
    const enc = this.map.encounters;
    if (!enc || Math.random() >= enc.rate) return;
    const total = enc.table.reduce((s, e) => s + e[3], 0);
    let r = Math.random() * total;
    let pick = enc.table[0];
    for (const e of enc.table) { r -= e[3]; if (r < 0) { pick = e; break; } }
    const [id, lo, hi] = pick;
    const level = lo + Math.floor(Math.random() * (hi - lo + 1));
    this.startBattle(makeMon(id, level), null);
  }

  startBattle(wild, legendaryId) {
    markSeen(wild.id);
    sfx.encounter();
    this.flashT = 36;
    this.battleTrack = legendaryId ? 'route-celebration' : this.map.music === 'arena' ? 'arena' : 'battle';
    this.pendingBattle = new BattleScene(wild, { legendaryId, location: this.map.name });
  }

  startTrainerBattle(t) {
    const mons = t.party.map(([id, lv]) => makeMon(id, lv));
    markSeen(mons[0].id);
    sfx.encounter();
    this.flashT = 36;
    this.battleTrack = this.map.music === 'arena' ? 'arena' : 'battle';
    this.pendingBattle = new BattleScene(null, { trainer: { name: t.name, mons, flag: t.flag, win: t.win, pp: t.pp } });
  }

  ask(prompt, options, onPick) {
    this.choice = { prompt, options, cursor: 0, onPick };
  }

  updateChoice() {
    const c = this.choice;
    if (input.pressed('up')) { c.cursor = (c.cursor + c.options.length - 1) % c.options.length; sfx.blip(); }
    if (input.pressed('down')) { c.cursor = (c.cursor + 1) % c.options.length; sfx.blip(); }
    if (input.pressed('b') || input.pressed('menu')) { sfx.back(); this.choice = null; return; }
    if (input.pressed('a')) {
      this.choice = null;
      c.onPick(c.cursor);
    }
  }

  interact() {
    const [dx, dy] = DIRS[G.dir];
    const npc = this.npcAt(G.x + dx, G.y + dy);
    if (!npc) return;
    sfx.blip();
    if (!npc.sign && !npc.mon && !npc.herman && !npc.cix && !npc.nima) {
      npc.facing = { up: 'down', down: 'up', left: 'right', right: 'left' }[G.dir];
    }
    if (npc.projector) { this.useProjector(); return; }
    if (npc.trainer) {
      const t = npc.trainer;
      if (G.flags[t.flag]) {
        this.dialog.start(t.after, () => this.ask('REMATCH?', ['YES', 'NO'], (i) => { if (i === 0) { sfx.select(); this.startTrainerBattle(t); } }));
      } else {
        this.dialog.start(t.intro, () => this.startTrainerBattle(t));
      }
      return;
    }
    if (npc.hm) {
      if (G.flags.hmVoice) this.dialog.start(npc.after);
      else {
        this.dialog.start(npc.lines, () => {
          G.flags.hmVoice = true;
          sfx.catch();
          this.dialog.start(['You obtained the LIGHTBERRY HM!', 'Use it from the start menu to teach a party robot its VOICE MOVE.']);
        });
      }
      return;
    }
    if (npc.gift) {
      const g = npc.gift;
      if (G.flags[g.flag]) { this.dialog.start(npc.after); return; }
      this.dialog.start(npc.lines, () => {
        G.flags[g.flag] = true;
        const mon = makeMon(g.id, g.level);
        mon.frail = true;
        recalc(mon);
        mon.hp = 1;
        const where = addMon(mon);
        sfx.catch();
        this.dialog.start([`You received the broken ${MON[g.id].name}! It barely powers on. (HP 1)${where === 'box' ? ' It was sent to the BOX.' : ''}`]);
      });
      return;
    }
    if (npc.clout) {
      const used = G.flags[npc.clout.flag] || 0;
      if (used >= 3) { this.dialog.start([npc.clout.done]); return; }
      const target = G.party.find((m) => m.id === G.starter) || G.party[0];
      this.dialog.start(npc.lines, () => {
        G.flags[npc.clout.flag] = used + 1;
        target.level++;
        recalc(target);
        sfx.levelUp();
        this.dialog.start([`The clout is real! ${MON[target.id].name} grew to level ${target.level}!`]);
      });
      return;
    }
    if (npc.quiz) { this.startQuiz(npc); return; }
    if (npc.dream) {
      const id = this.dreamLegend();
      this.dialog.start(
        ['...!', `${MON[id].name} drifts at the edge of the dream. Today, it is real.`],
        () => {
          G.flags.dreamTried = true;
          this.startBattle(makeMon(id, DREAM_LEVEL), id);
        },
      );
      return;
    }
    if (npc.dreamer) {
      const id = this.dreamPick();
      const hint = G.flags.dreamTried
        ? 'The dream has faded for today. Come back tomorrow... someone else will be dreaming.'
        : id ? `Tonight, ${MON[id].name} is dreaming here. Wake it gently.` : 'Every legend has been caught. The dreams are yours now.';
      this.dialog.start([...npc.lines, hint]);
      return;
    }
    if (npc.heal) {
      this.dialog.start(npc.lines, () => {
        healParty();
        sfx.heal();
        G.healSpot = { map: this.mapKey, x: G.x, y: G.y };
      });
      return;
    }
    this.dialog.start(npc.lines);
  }

  startQuiz(npc) {
    if (G.flags.unitreeG1) {
      this.dialog.start(['MOLLY: One G1 per customer! The spec sheet is timeless, though. Read it again sometime.']);
      return;
    }
    this.dialog.start(npc.lines, () => {
      const qs = [...G1_QUIZ].sort(() => Math.random() - 0.5).slice(0, 3);
      const ask = (i) => {
        if (i === qs.length) {
          G.flags.unitreeG1 = true;
          const where = addMon(makeMon('g1', 10));
          sfx.catch();
          this.dialog.start(['MOLLY: Three for three. You actually read the spec sheet. Lucas, fetch a crate!', `You received a UNITREE G1!${where === 'box' ? ' It was sent to the BOX.' : ''}`]);
          return;
        }
        const q = qs[i];
        this.ask(`MOLLY: Question ${i + 1}. ${q.q}`, q.a, (idx) => {
          if (idx === q.c) { sfx.select(); ask(i + 1); }
          else { sfx.bump(); this.dialog.start(['MOLLY: Wrong! No deal. Study the spec sheet and come back.', 'LUCAS: ...']); }
        });
      };
      ask(0);
    });
  }

  useProjector() {
    const pool = LEGENDARY_ORDER.filter((id) => !G.caught.has(id));
    if (!pool.length) {
      this.dialog.start(['The projector plays the credits. You have caught every legend of the silver screen.']);
      return;
    }
    const id = pool[(G.flags.projIdx || 0) % pool.length];
    G.flags.projIdx = ((G.flags.projIdx || 0) % pool.length) + 1;
    this.dialog.start(
      [`The projector whirs to life...`, `${MON[id].name} steps out of the screen!`],
      () => this.startBattle(makeMon(id, LEGENDARY_LEVEL), id),
    );
  }

  draw(ctx) {
    const mapW = this.map.rows[0].length * 16;
    const mapH = this.map.rows.length * 16;
    const camX = mapW <= 240 ? Math.floor((mapW - 240) / 2) : Math.max(0, Math.min(mapW - 240, this.px - 112));
    const camY = mapH <= 160 ? Math.floor((mapH - 160) / 2) : Math.max(0, Math.min(mapH - 160, this.py - 72));
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, 240, 160);

    const x0 = Math.floor(camX / 16), y0 = Math.floor(camY / 16);
    for (let ty = y0; ty <= y0 + 10; ty++) {
      for (let tx = x0; tx <= x0 + 15; tx++) {
        const tile = this.tiles[this.tileAt(tx, ty)];
        if (tile) ctx.drawImage(tile, tx * 16 - camX, ty * 16 - camY);
      }
    }

    const actors = [];
    for (const n of this.npcs()) actors.push({ y: n.py ?? n.y * 16, draw: () => this.drawNpc(ctx, n, camX, camY) });
    actors.push({ y: this.py, draw: () => this.drawPlayer(ctx, camX, camY) });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

    if (this.bannerT > 0) {
      const w = this.map.name.length * 6 + 14;
      drawPanel(ctx, 4, 4, w, 16);
      drawText(ctx, this.map.name, 11, 8);
    }

    this.dialog.draw(ctx);

    if (this.choice) {
      const { prompt, options, cursor } = this.choice;
      drawPanel(ctx, 2, 116, 236, 42);
      wrapText(prompt, 36).slice(0, 3).forEach((l, i) => drawText(ctx, l, 10, 123 + i * 10));
      const w = Math.max(...options.map((o) => o.length)) * 6 + 26;
      const h = options.length * 12 + 10;
      drawPanel(ctx, 234 - w, 112 - h, w, h);
      options.forEach((o, i) => {
        drawText(ctx, o, 250 - w, 118 - h + i * 12);
        if (cursor === i) drawCursor(ctx, 242 - w, 118 - h + i * 12);
      });
    }

    if (this.flashT > 0 && Math.floor(this.flashT / 6) % 2 === 0) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 240, 160);
    }
    if (this.fade) {
      const a = this.fade.phase === 'out' ? this.fade.t : 1 - this.fade.t;
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, a)})`;
      ctx.fillRect(0, 0, 240, 160);
    }
  }

  drawNpc(ctx, n, camX, camY) {
    const x = (n.px ?? n.x * 16) - camX, y = (n.py ?? n.y * 16) - camY - 1;
    if (n.sign) {
      ctx.fillStyle = '#805030';
      ctx.fillRect(x + 7, y + 8, 2, 7);
      ctx.fillStyle = '#c09858';
      ctx.fillRect(x + 2, y + 2, 12, 7);
      ctx.fillStyle = '#604020';
      ctx.fillRect(x + 3, y + 4, 10, 1);
      ctx.fillRect(x + 3, y + 6, 7, 1);
      return;
    }
    if (n.cix) {
      const r = (c, ox, oy, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + ox, y + oy, w, h); };
      r('#2a2a30', 4, 0, 8, 3);
      r('#f0c8a0', 4, 3, 8, 3);
      r('#181820', 5, 4, 6, 1);
      r('#181820', 2, 6, 12, 4);
      r('#f0c8a0', 0, 5, 2, 7);
      r('#f0c8a0', 14, 5, 2, 7);
      r('#d8a878', 0, 8, 2, 1);
      r('#d8a878', 14, 8, 2, 1);
      r('#f0c8a0', 0, 12, 2, 2);
      r('#f0c8a0', 14, 12, 2, 2);
      r('#283050', 4, 10, 8, 3);
      r('#283050', 4, 13, 3, 2);
      r('#283050', 9, 13, 3, 2);
      return;
    }
    if (n.nima) {
      const r = (c, ox, oy, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + ox, y + oy, w, h); };
      r('#181820', 3, 0, 10, 3);
      r('#f0c8a0', 4, 3, 8, 3);
      r('#0c0c12', 3, 3, 10, 2);
      r('#28e8f8', 4, 4, 3, 1);
      r('#f828b8', 9, 4, 2, 1);
      r('#202028', 2, 6, 12, 4);
      r('#f828b8', 2, 6, 1, 4);
      r('#28e8f8', 13, 6, 1, 4);
      r('#f0c8a0', 1, 6, 1, 3);
      r('#f0c8a0', 14, 6, 1, 3);
      r('#16161c', 4, 10, 8, 3);
      r('#16161c', 4, 13, 3, 2);
      r('#16161c', 9, 13, 3, 2);
      return;
    }
    if (n.herman) {
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(x + 2, y + 4, 12, 8);
      ctx.fillStyle = '#d8d8e0';
      ctx.fillRect(x + 2, y + 4, 12, 2);
      ctx.fillStyle = '#202028';
      ctx.fillRect(x + 4, y + 6, 2, 2);
      ctx.fillRect(x + 10, y + 6, 2, 2);
      ctx.fillStyle = '#28e8f8';
      ctx.fillRect(x + 4, y + 6, 2, 1);
      ctx.fillRect(x + 10, y + 6, 2, 1);
      ctx.fillStyle = '#f87830';
      ctx.fillRect(x + 2, y + 9, 12, 1);
      ctx.fillStyle = '#303038';
      ctx.fillRect(x + 3, y + 12, 3, 3);
      ctx.fillRect(x + 10, y + 12, 3, 3);
      return;
    }
    if (n.dream) {
      const id = this.dreamLegend();
      if (!id) return;
      const float = Math.round(Math.sin(this.animT / 18) * 2);
      ctx.save();
      ctx.globalAlpha = 0.78 + Math.sin(this.animT / 11) * 0.22;
      monSprite(MON[id]).draw(ctx, x, y - 3 + float, 16);
      ctx.restore();
      return;
    }
    if (n.mon) {
      monSprite(MON[n.mon]).drawOw(ctx, x, y, 16);
      return;
    }
    const frames = charSprite(n.pal);
    ctx.drawImage(frames[n.facing || n.dir || 'down'][0], x, y);
  }

  drawPlayer(ctx, camX, camY) {
    const frames = charSprite(7);
    const frame = this.moving ? (Math.floor(this.animT / 8) % 2 === 0 ? 1 : 2) : 0;
    ctx.drawImage(frames[G.dir][frame], this.px - camX, this.py - camY - 1);
  }
}
