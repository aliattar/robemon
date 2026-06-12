export const INFLUENCERS = [
  { id: 'lukas', name: 'LUKAS ZIEGLER', pal: 8, lines: ['LUKAS: Riding the wave of robotics! And today the wave is EXCELLENT.', 'LUKAS: Your {LEAD}? Wave-worthy. Posting it. Engagement incoming!'], done: 'LUKAS: The wave has crested for today. Catch the next swell tomorrow!' },
  { id: 'devang', name: 'DEVANG', pal: 9, lines: ['DEVANG: {LEAD}. ATK {ATK}, DEF {DEF}, SPD {SPD}. Already posted it.', 'DEVANG: The Humanoid Hub sees every robot on Earth. Including yours. Especially yours.'], done: 'DEVANG: Already posted everything about you today. Tomorrow there will be more.' },
  { id: 'ritwik', name: 'RITWIK PAVAN', pal: 10, lines: ['RITWIK: Hmm. Joint seams... actuator hum... cable routing... {LEAD} is a solid 8.4 out of 10.', 'RITWIK: With my endorsement? 9.1. Enjoy the clout.'], done: 'RITWIK: Three reviews a day, max. Standards are standards.' },
  { id: 'jimfan', name: 'JIM FAN', pal: 11, lines: ['JIM: Generalist robotics is solved one motor at a time.', 'JIM: Consider this a guest lecture for {LEAD}. Tuition: free. Value: immense.'], done: 'JIM: Office hours are over. The gradient must descend on its own now.' },
  { id: 'scott', name: 'SCOTT WALTER', pal: 12, lines: ["SCOTT: Hold still... inspecting... acceptable tolerances on {LEAD}.", "SCOTT: You don't scale a crappy robot. Luckily, this one is not crappy. Scale it."], done: 'SCOTT: Inspection quota reached. Even calipers need to rest.' },
  { id: 'ashok', name: 'ASHOK ELLUSWAMY', pal: 13, lines: ['ASHOK: And so... it begins.', 'ASHOK: Real-world AI.', 'ASHOK: Scale wins. Always.'], done: 'ASHOK: More soon.' },
  { id: 'paxton', name: 'CHRIS PAXTON', pal: 15, lines: ["CHRIS: Backflips are demos. Loading a dishwasher unsupervised - THAT is robotics.", 'CHRIS: {LEAD} has real autonomy behind those eyes. Fine. Respect.'], done: 'CHRIS: Three endorsements is already generous for this hype cycle.' },
  { id: 'julian', name: 'JULIAN IBARZ', pal: 16, lines: ['JULIAN: I taught a robot to dance once. The policy still haunts my dreams.', 'JULIAN: Here, {LEAD}, try this little shuffle... there! New motor skill unlocked.'], done: 'JULIAN: No more dance lessons today. My reward function needs sleep.' },
  { id: 'scotty', name: 'SCOTTY ALLEN', pal: 17, lines: ['SCOTTY: Nice robot. Needs better servos. I know a guy in Shenzhen.', 'SCOTTY: I built a phone from market parts once. Upgrading {LEAD}? Easy weekend project.'], done: 'SCOTTY: My guy in Shenzhen closed for the day. Come back tomorrow.' },
  { id: 'simone', name: 'SIMONE GIERTZ', pal: 18, lines: ['SIMONE: I upgraded {LEAD}! It is objectively better now.', 'SIMONE: Also one of its eyes now blinks HELP in Morse code. Cosmetic. Probably.'], done: 'SIMONE: Three upgrades a day is my limit. Legally speaking.' },
  { id: 'xrobohub', name: 'XROBOHUB', pal: 3, lines: ['XROBOHUB: BEEP. CONTENT DETECTED. REPOSTING {LEAD}.', 'XROBOHUB: 14,000 IMPRESSIONS. YOU ARE WELCOME. BEEP.'], done: 'XROBOHUB: RATE LIMIT REACHED. BEEP. TRY TOMORROW.' },
];

export const NAOMI = {
  id: 'naomi', name: 'NAOMI WU', pal: 14, boost: 2,
  lines: ['???: They call me the ghost of Huaqiangbei. I was building robots before your feed existed.', 'NAOMI: {LEAD}? Let me REALLY upgrade it. Huaqiangbei-grade work. Double clout.'],
  done: 'NAOMI: The ghost has other markets to haunt today.',
};

export const SPAWN_SPOTS = [
  { map: 'garage-town', x: 16, y: 12 },
  { map: 'garage-town', x: 18, y: 20 },
  { map: 'route-101', x: 20, y: 4 },
  { map: 'hangzhou-town', x: 17, y: 5 },
  { map: 'hangzhou-town', x: 5, y: 15 },
  { map: 'shenzhen-town', x: 13, y: 9 },
  { map: 'shenzhen-route', x: 5, y: 16 },
  { map: 'museum', x: 10, y: 6 },
  { map: 'rek-arena', x: 5, y: 8 },
  { map: 'unitree-factory', x: 10, y: 6 },
  { map: 'lightberry-hq', x: 10, y: 9 },
];

const hash = (s) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};

export function dailyInfluencer(day) {
  const inf = hash(day + 'naomi') % 100 < 5 ? NAOMI : INFLUENCERS[hash(day + 'inf') % INFLUENCERS.length];
  const spot = SPAWN_SPOTS[hash(day + 'spot') % SPAWN_SPOTS.length];
  return { inf, spot };
}
