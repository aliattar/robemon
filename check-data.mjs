import { DEX, MON, VOICE_BY_ID } from './src/data/dex.js';
import { MAPS, LEGENDARY_ORDER } from './src/data/maps.js';

let errors = 0;
const err = (msg) => { errors++; console.log('ERR:', msg); };

if (DEX.length !== 78) err(`dex has ${DEX.length} entries`);
const nums = new Set(DEX.map((m) => m.num));
if (nums.size !== 78) err('duplicate dex numbers');
const ids = new Set(DEX.map((m) => m.id));
if (ids.size !== 78) err('duplicate dex ids');
for (const m of DEX) {
  if (m.evo && !MON[m.evo.to]) err(`${m.id} evolves to unknown ${m.evo.to}`);
  if (!m.moves.length) err(`${m.id} has no moves`);
}
for (const id of LEGENDARY_ORDER) if (!MON[id]) err(`legendary ${id} not in dex`);
for (const m of DEX) if (!VOICE_BY_ID[m.id]) err(`${m.id} has no voice move`);

const WALKABLE = new Set(['.', ',', '*', '=', 'w', 'D']);
for (const [key, map] of Object.entries(MAPS)) {
  const w = map.rows[0].length;
  map.rows.forEach((r, y) => { if (r.length !== w) err(`${key} row ${y} len ${r.length} != ${w}`); });
  for (const wp of map.warps || []) {
    const t = map.rows[wp.y]?.[wp.x];
    if (!WALKABLE.has(t)) err(`${key} warp at ${wp.x},${wp.y} on tile '${t}'`);
    if (!MAPS[wp.to]) err(`${key} warp to unknown map ${wp.to}`);
    const dest = MAPS[wp.to].rows[wp.ty]?.[wp.tx];
    if (!WALKABLE.has(dest)) err(`${key} warp dest ${wp.to} ${wp.tx},${wp.ty} on '${dest}'`);
  }
  for (const n of map.npcs || []) {
    const t = map.rows[n.y]?.[n.x];
    if (!WALKABLE.has(t) || t === 'D') err(`${key} npc ${n.name} at ${n.x},${n.y} on '${t}'`);
    if (n.mon && !MON[n.mon]) err();
    if (n.mon && !MON[n.mon]) err(`${key} npc ${n.name} unknown mon ${n.mon}`);
    for (const [id] of n.trainer?.party || []) {
      if (!MON[id]) err(`${key} trainer ${n.name} has unknown ${id}`);
    }
  }
  for (const [id] of map.encounters?.table || []) {
    if (!MON[id]) err(`${key} encounter unknown ${id}`);
  }
}

console.log(errors ? `${errors} errors` : 'data OK');
console.log('sample stats:', ['go2', 'g1', 'h2', 'optimus-1', 'icub', 'atlas', 'iron', 'gundam'].map((id) => `${id}=${JSON.stringify(MON[id].stats)} catch=${MON[id].catchRate}`).join('\n'));
