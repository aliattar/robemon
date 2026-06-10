import { MON } from '../data/dex.js';
import { effectiveness } from '../data/types.js';
import { G, monMoves, expForLevel, addMon, recalc } from '../state.js';
import { monSprite } from '../sprites.js';
import { input } from '../input.js';
import { sfx } from '../audio.js';
import { scenes } from '../scene.js';
import { drawPanel, drawText, drawHpBar, drawCursor, Typewriter } from '../ui.js';

const name = (mon) => MON[mon.id].name;

function damage(attacker, defender, move) {
  const eff = effectiveness(move.type, MON[defender.id].t);
  if (eff === 0) return { dmg: 0, eff, crit: false };
  const stab = MON[attacker.id].t.includes(move.type) ? 1.5 : 1;
  const crit = Math.random() < 1 / 16;
  const base = Math.floor((Math.floor((2 * attacker.level) / 5 + 2) * move.power * attacker.atk) / defender.def / 50) + 2;
  const dmg = Math.max(1, Math.floor(base * stab * eff * (crit ? 1.75 : 1) * (0.85 + Math.random() * 0.15)));
  return { dmg, eff, crit };
}

export class BattleScene {
  constructor(wild, { legendaryId = null, trainer = null } = {}) {
    this.trainer = trainer;
    this.foeIdx = 0;
    this.foe = trainer ? trainer.mons[0] : wild;
    this.allyIdx = G.party.findIndex((m) => m.hp > 0);
    this.legendaryId = legendaryId;
    this.mode = 'queue';
    this.queue = [];
    this.tw = null;
    this.cursor = 0;
    this.introT = 0;
    this.runAttempts = 0;
    this.anim = {};
    this.foeHpShow = this.foe.hp;
    this.allyHpShow = this.ally.hp;
    this.allyExpShow = this.expFrac();
    const opener = trainer
      ? [{ t: 'msg', text: `${trainer.name} wants to battle!` }, { t: 'msg', text: `${trainer.name} sent out ${name(this.foe)}!` }]
      : [{ t: 'msg', text: `Wild ${name(this.foe)} appeared!${MON[this.foe.id].legendary ? ' A CINEMA LEGEND!' : ''}` }];
    this.q({ t: 'pause', n: 30 }, ...opener, { t: 'msg', text: `Go! ${name(this.ally)}!` });
  }

  get ally() { return G.party[this.allyIdx]; }

  get foeLabel() { return this.trainer ? 'The foe ' : 'Wild '; }

  expFrac() {
    const lo = expForLevel(this.ally.level), hi = expForLevel(this.ally.level + 1);
    return Math.max(0, Math.min(1, (this.ally.exp - lo) / (hi - lo)));
  }

  q(...steps) { this.queue.push(...steps); }

  // ---- turn construction --------------------------------------------------

  attackSteps(attacker, defender, move, attIsAlly) {
    const defKey = attIsAlly ? 'foe' : 'ally';
    return [
      { t: 'msg', text: `${attIsAlly ? '' : this.foeLabel}${name(attacker)} used ${move.name.toUpperCase()}!` },
      { t: 'lunge', who: attIsAlly ? 'ally' : 'foe' },
      {
        t: 'fn',
        fn: () => {
          const { dmg, eff, crit } = damage(attacker, defender, move);
          if (eff === 0) { this.q({ t: 'msg', text: `It doesn't affect ${name(defender)}...` }); return; }
          defender.hp = Math.max(0, defender.hp - dmg);
          eff > 1 ? sfx.superHit() : sfx.hit();
          this.q({ t: 'flash', who: defKey }, { t: 'hp', who: defKey });
          if (crit) this.q({ t: 'msg', text: 'A critical hit!' });
          if (eff > 1) this.q({ t: 'msg', text: "It's super effective!" });
          if (eff < 1) this.q({ t: 'msg', text: "It's not very effective..." });
          if (defender.hp === 0) this.q({ t: 'fn', fn: () => this.faint(attIsAlly) });
        },
      },
    ];
  }

  faint(foeFainted) {
    if (foeFainted) {
      this.q(
        { t: 'faint', who: 'foe' },
        { t: 'msg', text: `${this.foeLabel}${name(this.foe)} fainted!` },
        { t: 'fn', fn: () => this.giveExp() },
      );
    } else {
      this.q(
        { t: 'faint', who: 'ally' },
        { t: 'msg', text: `${name(this.ally)} fainted!` },
        {
          t: 'fn',
          fn: () => {
            if (G.party.some((m) => m.hp > 0)) { this.forcedSwitch = true; this.mode = 'party'; this.cursor = 0; }
            else {
              this.q(
                { t: 'msg', text: 'You are out of usable ROBÉMON!' },
                { t: 'msg', text: 'You blacked out and rebooted at the last charge point...' },
                { t: 'fn', fn: () => { for (const m of G.party) m.hp = m.maxHp; G.map = G.healSpot.map; G.x = G.healSpot.x; G.y = G.healSpot.y; G.dirty = true; } },
                { t: 'end' },
              );
            }
          },
        },
      );
    }
  }

  giveExp() {
    const gain = Math.floor((MON[this.foe.id].bst * this.foe.level) / 10);
    this.ally.exp += gain;
    this.q({ t: 'msg', text: `${name(this.ally)} gained ${gain} EXP!` }, { t: 'exp' });
    this.q({ t: 'fn', fn: () => this.checkLevelUps() });
  }

  checkLevelUps() {
    if (this.ally.exp < expForLevel(this.ally.level + 1)) { this.checkEvolution(); return; }
    this.ally.level++;
    const before = this.ally.maxHp;
    recalc(this.ally);
    this.ally.hp = Math.min(this.ally.maxHp, this.ally.hp + (this.ally.maxHp - before));
    sfx.levelUp();
    this.q({ t: 'hp', who: 'ally' }, { t: 'exp' }, { t: 'msg', text: `${name(this.ally)} grew to level ${this.ally.level}!` });
    const learned = MON[this.ally.id].battleMoves.find((mv) => mv.lv === this.ally.level);
    if (learned) this.q({ t: 'msg', text: `${name(this.ally)} learned ${learned.name.toUpperCase()}!` });
    this.q({ t: 'fn', fn: () => this.checkLevelUps() });
  }

  checkEvolution() {
    const evo = MON[this.ally.id].evo;
    if (!evo || this.ally.level < evo.lv) { this.afterFoeDone(); return; }
    this.q(
      { t: 'msg', text: `What? ${name(this.ally)} is evolving!` },
      { t: 'evolve' },
      {
        t: 'fn',
        fn: () => {
          this.ally.id = evo.to;
          recalc(this.ally);
          G.seen.add(evo.to); G.caught.add(evo.to);
          sfx.catch();
          this.q({ t: 'msg', text: `Your robot evolved into ${name(this.ally)}!` }, { t: 'hp', who: 'ally' }, { t: 'fn', fn: () => this.afterFoeDone() });
        },
      },
    );
  }

  afterFoeDone() {
    if (!this.trainer) { this.q({ t: 'end' }); return; }
    if (this.foeIdx + 1 < this.trainer.mons.length) {
      this.foeIdx++;
      const next = this.trainer.mons[this.foeIdx];
      this.q(
        { t: 'fn', fn: () => { this.foe = next; this.foeHpShow = next.hp; this.anim.foeDrop = 0; G.seen.add(next.id); } },
        { t: 'msg', text: `${this.trainer.name} sent out ${name(next)}!` },
      );
    } else {
      G.flags[this.trainer.flag] = true;
      this.q(
        { t: 'msg', text: `You defeated ${this.trainer.name}!` },
        ...this.trainer.win.map((text) => ({ t: 'msg', text })),
        { t: 'end' },
      );
    }
  }

  foeAttackSteps() {
    let moves = monMoves(this.foe);
    if (this.trainer?.pp) {
      this.foe.uses = this.foe.uses || Object.fromEntries(moves.map((m) => [m.name, this.trainer.pp]));
      moves = moves.filter((m) => this.foe.uses[m.name] > 0);
      if (!moves.length) {
        const steps = [];
        if (!this.flailNoted) {
          this.flailNoted = true;
          steps.push({ t: 'msg', text: `${this.trainer.name}: WHO FORGOT TO LOAD THE POLICY WEIGHTS?!` });
        }
        return [...steps, ...this.attackSteps(this.foe, this.ally, { name: 'Flail', type: 'NORMAL', power: 10 }, false)];
      }
    }
    const move = moves[Math.floor(Math.random() * moves.length)];
    if (this.foe.uses) this.foe.uses[move.name]--;
    return this.attackSteps(this.foe, this.ally, move, false);
  }

  chooseMove(move) {
    this.mode = 'queue';
    const first = this.ally.spd === this.foe.spd ? Math.random() < 0.5 : this.ally.spd > this.foe.spd;
    if (first) {
      this.q(...this.attackSteps(this.ally, this.foe, move, true));
      this.q({ t: 'fn', fn: () => { if (this.foe.hp > 0 && this.ally.hp > 0) this.q(...this.foeAttackSteps()); } });
    } else {
      this.q(...this.foeAttackSteps());
      this.q({ t: 'fn', fn: () => { if (this.foe.hp > 0 && this.ally.hp > 0) this.q(...this.attackSteps(this.ally, this.foe, move, true)); } });
    }
  }

  throwBall() {
    this.mode = 'queue';
    if (this.trainer) {
      this.q({ t: 'msg', text: 'The referee blocks the ball! No catching in a REK match!' });
      return;
    }
    const rate = MON[this.foe.id].catchRate;
    const a = Math.max(1, Math.floor(((3 * this.foe.maxHp - 2 * this.foe.hp) * rate) / (3 * this.foe.maxHp)));
    let shakes = 0;
    let caught = false;
    if (a >= 255) { shakes = 4; caught = true; }
    else {
      const b = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / a)));
      while (shakes < 4 && Math.floor(Math.random() * 65536) < b) shakes++;
      caught = shakes === 4;
    }
    this.q({ t: 'msg', text: 'You threw a CHARGE BALL!' }, { t: 'ball', shakes, caught });
    if (caught) {
      this.q(
        { t: 'msg', text: `Gotcha! ${name(this.foe)} was caught!` },
        {
          t: 'fn',
          fn: () => {
            const where = addMon(this.foe);
            this.q(
              { t: 'msg', text: where === 'party' ? `${name(this.foe)} joined your party!` : `${name(this.foe)} was sent to the BOX.` },
              { t: 'msg', text: `${name(this.foe)}'s data was logged in the ROBODEX.` },
              { t: 'end' },
            );
          },
        },
      );
    } else {
      const sass = ['Oh no! It broke free!', 'Argh! So close!', 'It rejected the term sheet!'][Math.min(shakes, 2)];
      this.q({ t: 'msg', text: sass }, ...this.foeAttackSteps());
    }
  }

  tryRun() {
    this.mode = 'queue';
    if (this.trainer) {
      this.q({ t: 'msg', text: "You can't run from a REK match!" });
      return;
    }
    this.runAttempts++;
    const odds = Math.floor((this.ally.spd * 128) / Math.max(1, this.foe.spd)) + 30 * this.runAttempts;
    if (Math.random() * 256 < odds) {
      sfx.back();
      this.q({ t: 'msg', text: 'Got away safely!' }, { t: 'end' });
    } else {
      this.q({ t: 'msg', text: "Can't escape!" }, ...this.foeAttackSteps());
    }
  }

  switchTo(idx, forced) {
    this.mode = 'queue';
    this.forcedSwitch = false;
    const steps = [];
    if (!forced) steps.push({ t: 'msg', text: `${name(this.ally)}, fall back!` });
    steps.push(
      { t: 'fn', fn: () => { this.allyIdx = idx; this.allyHpShow = this.ally.hp; this.allyExpShow = this.expFrac(); } },
      { t: 'msg', text: `Go! ${name(G.party[idx])}!` },
    );
    this.q(...steps);
    if (!forced) this.q({ t: 'fn', fn: () => { if (this.foe.hp > 0) this.q(...this.foeAttackSteps()); } });
  }

  // ---- update -------------------------------------------------------------

  update() {
    this.introT++;
    this.animT = (this.animT || 0) + 1;

    if (this.mode === 'queue') { this.processQueue(); return; }
    if (this.mode === 'action') this.updateAction();
    else if (this.mode === 'moves') this.updateMoves();
    else if (this.mode === 'party') this.updateParty();
  }

  processQueue() {
    const step = this.queue[0];
    if (!step) {
      if (this.foe.hp <= 0 || !this.ally || this.ally.hp <= 0) return;
      this.mode = 'action';
      this.cursor = 0;
      return;
    }
    const done = this.runStep(step);
    if (done) this.queue.shift();
  }

  runStep(step) {
    switch (step.t) {
      case 'pause':
        step.n--;
        return step.n <= 0;
      case 'msg': {
        if (!step.tw) { step.tw = new Typewriter(step.text, 36); sfx.blip(); }
        if (!step.tw.done) {
          step.tw.update();
          if (input.pressed('a') || input.pressed('b')) step.tw.skip();
          this.tw = step.tw;
          return false;
        }
        this.tw = step.tw;
        step.hold = (step.hold || 0) + 1;
        if (input.pressed('a') || input.pressed('b') || step.hold > 55) { this.tw = null; return true; }
        return false;
      }
      case 'fn':
        step.fn();
        return true;
      case 'hp': {
        const target = step.who === 'foe' ? this.foe.hp : this.ally.hp;
        const key = step.who === 'foe' ? 'foeHpShow' : 'allyHpShow';
        const cur = this[key];
        if (Math.abs(cur - target) < 0.6) { this[key] = target; return true; }
        this[key] = cur + Math.sign(target - cur) * Math.max(0.4, Math.abs(target - cur) / 16);
        return false;
      }
      case 'exp': {
        const target = this.expFrac();
        if (Math.abs(this.allyExpShow - target) < 0.02) { this.allyExpShow = target; return true; }
        this.allyExpShow += Math.sign(target - this.allyExpShow) * 0.02;
        return false;
      }
      case 'lunge':
        step.n = (step.n || 0) + 1;
        this.anim[step.who + 'Lunge'] = step.n < 8 ? step.n : 16 - step.n;
        if (step.n >= 16) { this.anim[step.who + 'Lunge'] = 0; return true; }
        return false;
      case 'flash':
        step.n = (step.n || 0) + 1;
        this.anim[step.who + 'Flash'] = Math.floor(step.n / 4) % 2 === 1;
        if (step.n >= 20) { this.anim[step.who + 'Flash'] = false; return true; }
        return false;
      case 'faint':
        step.n = (step.n || 0) + 1;
        if (step.n === 1) sfx.faint();
        this.anim[step.who + 'Drop'] = step.n * 3;
        return step.n >= 24;
      case 'evolve':
        step.n = (step.n || 0) + 1;
        this.anim.allyFlash = Math.floor(step.n / 5) % 2 === 1;
        if (step.n % 10 === 0) sfx.shake();
        if (step.n >= 60) { this.anim.allyFlash = false; return true; }
        return false;
      case 'ball':
        return this.runBallStep(step);
      case 'end':
        scenes.pop();
        return true;
      default:
        return true;
    }
  }

  runBallStep(step) {
    step.n = (step.n || 0) + 1;
    const arcEnd = 30, closeEnd = 50;
    const shakeDur = 28;
    if (step.n === 1) sfx.ball();
    if (step.n <= arcEnd) {
      const t = step.n / arcEnd;
      this.anim.ball = { x: 40 + t * 130, y: 90 - Math.sin(t * Math.PI) * 60 - t * 50 };
      return false;
    }
    if (step.n <= closeEnd) {
      this.anim.ball = { x: 170, y: 40 };
      this.anim.foeCaptured = true;
      return false;
    }
    const shakeIdx = Math.floor((step.n - closeEnd) / shakeDur);
    const shakeT = (step.n - closeEnd) % shakeDur;
    if (shakeIdx < step.shakes) {
      if (shakeT === 1) sfx.shake();
      this.anim.ball = { x: 170 + (shakeT < 14 ? Math.round(Math.sin(shakeT / 2) * 2) : 0), y: 40 };
      return false;
    }
    if (step.caught) {
      if (!step.played) { step.played = true; sfx.catch(); }
      this.anim.ball = { x: 170, y: 40, caught: true };
      if ((step.n - closeEnd) - step.shakes * shakeDur > 40) { this.anim.ball = null; return true; }
      return false;
    }
    this.anim.ball = null;
    this.anim.foeCaptured = false;
    return true;
  }

  // ---- menus --------------------------------------------------------------

  gridNav(count) {
    const col = this.cursor % 2, row = this.cursor >> 1;
    let c = col + (input.pressed('right') ? 1 : 0) - (input.pressed('left') ? 1 : 0);
    let r = row + (input.pressed('down') ? 1 : 0) - (input.pressed('up') ? 1 : 0);
    const idx = r * 2 + c;
    if ((c !== col || r !== row) && c >= 0 && c < 2 && r >= 0 && idx < count) {
      this.cursor = idx;
      sfx.blip();
    }
  }

  updateAction() {
    this.gridNav(4);
    if (input.pressed('a')) {
      sfx.select();
      if (this.cursor === 0) { this.mode = 'moves'; this.cursor = 0; }
      else if (this.cursor === 1) this.throwBall();
      else if (this.cursor === 2) { this.mode = 'party'; this.cursor = 0; }
      else this.tryRun();
    }
  }

  updateMoves() {
    const moves = monMoves(this.ally);
    this.gridNav(moves.length);
    if (input.pressed('b') || input.pressed('menu')) { sfx.back(); this.mode = 'action'; this.cursor = 0; return; }
    if (input.pressed('a')) { sfx.select(); this.chooseMove(moves[this.cursor]); }
  }

  updateParty() {
    if (input.pressed('up')) { this.cursor = Math.max(0, this.cursor - 1); sfx.blip(); }
    if (input.pressed('down')) { this.cursor = Math.min(G.party.length - 1, this.cursor + 1); sfx.blip(); }
    if ((input.pressed('b') || input.pressed('menu')) && !this.forcedSwitch) { sfx.back(); this.mode = 'action'; this.cursor = 0; return; }
    if (input.pressed('a')) {
      const target = G.party[this.cursor];
      if (target.hp <= 0 || (this.cursor === this.allyIdx && !this.forcedSwitch)) { sfx.bump(); return; }
      if (this.cursor === this.allyIdx) { sfx.bump(); return; }
      sfx.select();
      this.switchTo(this.cursor, this.forcedSwitch);
    }
  }

  // ---- draw ---------------------------------------------------------------

  draw(ctx) {
    ctx.fillStyle = '#a0d8f0';
    ctx.fillRect(0, 0, 240, 116);
    ctx.fillStyle = '#b8e0a0';
    ctx.fillRect(0, 84, 240, 32);

    ctx.fillStyle = '#90c878';
    ctx.beginPath(); ctx.ellipse(178, 64, 44, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(56, 112, 50, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(178, 64, 32, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(56, 112, 38, 9, 0, 0, Math.PI * 2); ctx.fill();

    const slide = Math.min(1, this.introT / 30);
    this.drawFoe(ctx, slide);
    this.drawAlly(ctx, slide);
    this.drawFoeInfo(ctx, slide);
    this.drawAllyInfo(ctx, slide);
    this.drawTextbox(ctx);
  }

  drawFoe(ctx, slide) {
    if (this.anim.foeCaptured) {
      if (this.anim.ball) this.drawBall(ctx, this.anim.ball);
      return;
    }
    const sprite = monSprite(MON[this.foe.id]);
    const drop = this.anim.foeDrop || 0;
    const x = 150 + (1 - slide) * 100 + (this.anim.foeLunge ? -this.anim.foeLunge : 0);
    const y = 12 + drop;
    if (drop > 60) return;
    if (this.anim.foeFlash) return;
    ctx.save();
    if (drop) { ctx.beginPath(); ctx.rect(0, 0, 240, 76); ctx.clip(); }
    sprite.draw(ctx, x, y, 56);
    ctx.restore();
    if (sprite.isPlaceholder() && !drop) drawText(ctx, name(this.foe).slice(0, 12), x + 28 - name(this.foe).slice(0, 12).length * 3, y + 57, '#50585f');
    if (this.anim.ball) this.drawBall(ctx, this.anim.ball);
  }

  drawAlly(ctx, slide) {
    if (!this.ally) return;
    const sprite = monSprite(MON[this.ally.id]);
    const drop = this.anim.allyDrop || 0;
    if (drop > 70) return;
    if (this.anim.allyFlash) return;
    const x = 20 - (1 - slide) * 100 + (this.anim.allyLunge || 0);
    const y = 52 + drop;
    ctx.save();
    if (drop) { ctx.beginPath(); ctx.rect(0, 0, 240, 116); ctx.clip(); }
    sprite.draw(ctx, x, y, 64, true);
    ctx.restore();
    if (sprite.isPlaceholder() && !drop) drawText(ctx, name(this.ally).slice(0, 12), x + 32 - name(this.ally).slice(0, 12).length * 3, y + 54, '#50585f');
  }

  drawBall(ctx, ball) {
    ctx.fillStyle = '#404048';
    ctx.fillRect(ball.x - 4, ball.y - 4, 8, 8);
    ctx.fillStyle = ball.caught ? '#a8a8a8' : '#f8d030';
    ctx.fillRect(ball.x - 3, ball.y - 3, 6, 3);
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(ball.x - 3, ball.y, 6, 3);
    ctx.fillStyle = '#404048';
    ctx.fillRect(ball.x - 1, ball.y - 1, 2, 2);
  }

  drawFoeInfo(ctx, slide) {
    const x = Math.round(-110 + slide * 114);
    drawPanel(ctx, x, 6, 104, 26, { fill: '#f8f8e0' });
    drawText(ctx, name(this.foe).slice(0, 12), x + 6, 10);
    drawText(ctx, `L${this.foe.level}`, x + 84, 10);
    drawHpBar(ctx, x + 24, 22, 70, this.foeHpShow / this.foe.maxHp);
    drawText(ctx, 'HP', x + 8, 18, '#c05028');
  }

  drawAllyInfo(ctx, slide) {
    if (!this.ally) return;
    const x = Math.round(240 - slide * 110);
    drawPanel(ctx, x, 80, 106, 34, { fill: '#f8f8e0' });
    drawText(ctx, name(this.ally).slice(0, 12), x + 6, 84);
    drawText(ctx, `L${this.ally.level}`, x + 86, 84);
    drawHpBar(ctx, x + 26, 96, 70, this.allyHpShow / this.ally.maxHp);
    drawText(ctx, 'HP', x + 10, 92, '#c05028');
    drawText(ctx, `${Math.round(this.allyHpShow)}/${this.ally.maxHp}`, x + 40, 102);
    ctx.fillStyle = '#404048';
    ctx.fillRect(x + 26, 110, 70, 2);
    ctx.fillStyle = '#48a8f8';
    ctx.fillRect(x + 26, 110, Math.round(70 * this.allyExpShow), 2);
  }

  drawTextbox(ctx) {
    drawPanel(ctx, 2, 116, 236, 42);
    if (this.mode === 'action') {
      drawText(ctx, `What will`, 10, 126);
      drawText(ctx, `${name(this.ally).slice(0, 12)} do?`, 10, 138);
      drawPanel(ctx, 120, 116, 118, 42, { fill: '#f8f8f8' });
      const opts = ['FIGHT', 'BALL', 'ROBOT', 'RUN'];
      opts.forEach((o, i) => {
        const ox = 134 + (i % 2) * 56, oy = 126 + Math.floor(i / 2) * 14;
        drawText(ctx, o, ox, oy);
        if (this.cursor === i) drawCursor(ctx, ox - 7, oy);
      });
    } else if (this.mode === 'moves') {
      const moves = monMoves(this.ally);
      moves.forEach((mv, i) => {
        const ox = 14 + (i % 2) * 82, oy = 124 + Math.floor(i / 2) * 14;
        drawText(ctx, mv.name.toUpperCase().slice(0, 12), ox, oy);
        if (this.cursor === i) drawCursor(ctx, ox - 7, oy);
      });
      drawPanel(ctx, 178, 116, 60, 42, { fill: '#f8f8f8' });
      const sel = moves[this.cursor];
      drawText(ctx, sel.type.slice(0, 8), 184, 126, '#6878a0');
      drawText(ctx, `PWR ${sel.power}`, 184, 140);
    } else if (this.mode === 'party') {
      drawPanel(ctx, 30, 8, 180, 108, { fill: '#f0f8f0' });
      drawText(ctx, this.forcedSwitch ? 'CHOOSE NEXT ROBOT' : 'SWITCH TO:', 40, 14);
      G.party.forEach((m, i) => {
        const oy = 26 + i * 14;
        const label = `${name(m).slice(0, 11)} L${m.level}`;
        drawText(ctx, label, 48, oy, m.hp > 0 ? '#404048' : '#b05050');
        drawHpBar(ctx, 152, oy + 2, 40, m.hp / m.maxHp);
        if (i === this.allyIdx) drawText(ctx, '*', 192 + 4, oy, '#58a858');
        if (this.cursor === i) drawCursor(ctx, 40, oy);
      });
      if (this.tw) return;
      drawText(ctx, this.forcedSwitch ? '' : 'B: BACK', 10, 138, '#787878');
    }
    if (this.mode === 'queue' && this.tw) {
      const lines = this.tw.visibleLines().slice(-3);
      lines.forEach((line, i) => drawText(ctx, line, 10, 123 + i * 10));
    }
  }
}
