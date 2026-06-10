import { MON, movesAt, voiceMoveFor } from './data/dex.js';

const SAVE_KEY = 'robemon-save-v1';

export const G = {
  map: 'lab',
  x: 6, y: 4, dir: 'down',
  party: [],
  box: [],
  seen: new Set(),
  caught: new Set(),
  playTime: 0,
  flags: {},
  healSpot: { map: 'lab', x: 6, y: 4 },
};

export function statsAt(id, level) {
  const base = MON[id].stats;
  const stat = (b) => Math.floor((b * 2 * level) / 100) + 5;
  return {
    maxHp: Math.floor((base.hp * 2 * level) / 100) + level + 10,
    atk: stat(base.atk), def: stat(base.def), spa: stat(base.spa), spd: stat(base.spd),
  };
}

export const expForLevel = (lv) => lv * lv * lv;

export function makeMon(id, level) {
  const s = statsAt(id, level);
  return { id, level, exp: expForLevel(level), hp: s.maxHp, ...s };
}

export function recalc(mon) {
  const frac = mon.hp / mon.maxHp;
  Object.assign(mon, statsAt(mon.id, mon.level));
  if (mon.frail) {
    for (const k of ['maxHp', 'atk', 'def', 'spa', 'spd']) mon[k] = Math.max(5, Math.round(mon[k] * 0.85));
  }
  mon.hp = Math.max(1, Math.round(mon.maxHp * frac));
}

export function monMoves(mon) {
  const base = movesAt(mon.id, mon.level);
  if (!mon.voice) return base;
  const v = voiceMoveFor(mon.id);
  if (base.length < 4) return [...base, v];
  const out = [...base];
  out[Math.min(mon.voiceSlot ?? 3, out.length - 1)] = v;
  return out;
}

export function markSeen(id) { G.seen.add(id); }

export function addMon(mon) {
  G.seen.add(mon.id);
  G.caught.add(mon.id);
  if (G.party.length < 6) { G.party.push(mon); return 'party'; }
  G.box.push(mon);
  return 'box';
}

export function healParty() {
  for (const m of G.party) m.hp = m.maxHp;
}

export function firstAlive() {
  return G.party.find((m) => m.hp > 0) || null;
}

export function save() {
  const data = {
    map: G.map, x: G.x, y: G.y, dir: G.dir,
    party: G.party, box: G.box, starter: G.starter,
    seen: [...G.seen], caught: [...G.caught], playTime: G.playTime,
    flags: G.flags, healSpot: G.healSpot,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function load() {
  const data = JSON.parse(localStorage.getItem(SAVE_KEY));
  Object.assign(G, data, { seen: new Set(data.seen), caught: new Set(data.caught) });
  return true;
}
