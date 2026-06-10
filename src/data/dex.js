const REGION_STATS = {
  STARTER: { hp: 62, atk: 66, def: 60, spa: 66, spd: 64 },
  HANGZHOU: { hp: 72, atk: 80, def: 115, spa: 70, spd: 105 },
  SHENZHEN: { hp: 76, atk: 84, def: 110, spa: 84, spd: 104 },
  AMERICAS: { hp: 48, atk: 120, def: 44, spa: 88, spd: 58 },
  GARAGE: { hp: 42, atk: 92, def: 36, spa: 74, spd: 68 },
  EUROPE: { hp: 52, atk: 44, def: 58, spa: 58, spd: 36 },
  HANOI: { hp: 54, atk: 58, def: 48, spa: 44, spd: 46 },
  RETRO: { hp: 66, atk: 58, def: 66, spa: 58, spd: 54 },
  CINEMA: { hp: 105, atk: 105, def: 105, spa: 105, spd: 98 },
};

export const REGION_NAMES = {
  STARTER: 'STARTER', HANGZHOU: 'HANGZHOU', SHENZHEN: 'SHENZHEN', AMERICAS: 'AMERICAS',
  GARAGE: 'GARAGE (YC)', EUROPE: 'EUROPE', HANOI: 'HANOI', RETRO: 'HALL OF FAME', CINEMA: 'CINEMA',
};

const STAGE_MULT = [0.82, 1, 1.16];

// num, id, name, types, region, height cm, weight kg, price USD,
// optional: v (m/s), pay (payload kg), tops, st (evo stage), evo, quad, bonus
const RAW = [
  { num: 1, id: 'mini-pi', name: 'Mini Pi', t: ['FAIRY', 'ELECTRIC'], r: 'STARTER', h: 52, w: 7, price: 1800, st: 0, evo: { to: 'mini-pi-plus', lv: 16 }, moves: ['Servo Jab', 'Jump Start'], flavor: "HighTorque's tiny research biped. Top-8 RoboCup teams all run this platform." },
  { num: 2, id: 'mini-pi-plus', name: 'Mini Pi+', t: ['FAIRY', 'ELECTRIC'], r: 'STARTER', h: 65, w: 10.2, price: 4500, st: 1, evo: { to: 'mini-pi-plus-pro', lv: 32 }, moves: ['Mic Array Cry', 'Pogo Hop', 'Servo Jab'], flavor: '65 cm, 22 DOF. The lab cub grows up fast when the grad students are watching.' },
  { num: 3, id: 'mini-pi-plus-pro', name: 'Mini Pi+ Pro', t: ['FAIRY', 'PSYCHIC'], r: 'STARTER', h: 65, w: 10.9, tops: 100, price: 9000, st: 2, moves: ['Depth Scan', 'NPU Surge', 'Pogo Hop'], flavor: '26 DOF and a 100 TOPS NPU. Small body, enormous compute ego.' },
  { num: 4, id: 'go2', name: 'Go2', t: ['NORMAL', 'ELECTRIC'], r: 'STARTER', h: 40, w: 15, v: 5, price: 1600, st: 0, quad: true, evo: { to: 'a2', lv: 16 }, moves: ['LiDAR Glare', 'Backflip'], flavor: 'A $1,600 puppy with 4D LiDAR. Runs 5 m/s and never needs walkies.' },
  { num: 5, id: 'a2', name: 'A2', t: ['GROUND', 'STEEL'], r: 'STARTER', h: 60, w: 40, pay: 25, price: 20000, st: 1, quad: true, evo: { to: 'b2', lv: 32 }, moves: ['Payload Slam', 'Endurance March', 'LiDAR Glare'], flavor: '180 N·m joints and a 25 kg payload. The puppy got a warehouse job.' },
  { num: 6, id: 'b2', name: 'B2', t: ['STEEL', 'GROUND'], r: 'STARTER', h: 70, w: 60, v: 6, pay: 40, price: 40000, st: 2, quad: true, moves: ['Torque Crush', 'IP67 Wall', 'Payload Slam'], flavor: '60 kg IP67 industrial beast. Rain, dust, and forklifts fear it equally.' },
  { num: 7, id: 'bdx-droid', name: 'BDX Droid', t: ['FAIRY', 'ELECTRIC'], r: 'STARTER', h: 70, w: 20, price: 30000, st: 0, evo: { to: 'r2-d2', lv: 16 }, moves: ['Puppy Eyes', 'Sim2Real'], flavor: 'Disney biped RL-trained in the Newton physics engine. Pure weaponized cuteness.' },
  { num: 8, id: 'r2-d2', name: 'R2-D2', t: ['ELECTRIC', 'STEEL'], r: 'STARTER', h: 109, w: 32, price: 80000, st: 1, evo: { to: 'chopper', lv: 32 }, moves: ['System Hack', 'Shock Prod', 'Puppy Eyes'], flavor: '109 cm astromech. Has saved the galaxy more times than its memory wipes admit.' },
  { num: 9, id: 'chopper', name: 'Chopper', t: ['ELECTRIC', 'DARK'], r: 'STARTER', h: 99, w: 30, price: 90000, st: 2, moves: ['Cattle Prod', 'Sabotage', 'System Hack'], flavor: 'C1-10P. A grumpy astromech with a war record and zero patience.' },

  { num: 10, id: 'r1', name: 'Unitree R1', t: ['FIGHTING', 'FAIRY'], r: 'HANGZHOU', h: 123, w: 29, v: 2, price: 4900, st: 0, evo: { to: 'g1', lv: 16 }, moves: ['Cartwheel', 'Handstand Smash'], flavor: 'The $4,900 gymnast. Cartwheels out of the box, warranty void on landing.' },
  { num: 11, id: 'g1', name: 'Unitree G1', t: ['FIGHTING', 'ELECTRIC'], r: 'HANGZHOU', h: 132, w: 35, v: 2, price: 16000, st: 1, evo: { to: 'h2', lv: 32 }, moves: ['Kip-Up', 'Kung Fu Strike', 'Cartwheel'], flavor: 'The best-selling humanoid on Earth. Knows kung fu. Actually ships.' },
  { num: 12, id: 'h2', name: 'Unitree H2', t: ['FIGHTING', 'STEEL'], r: 'HANGZHOU', h: 182, w: 70, v: 2.5, pay: 30, price: 90000, st: 2, moves: ['Titan Kick', 'Iron Wall', 'Kung Fu Strike'], flavor: '360 N·m legs on a titanium frame. The final form of shipping at scale.' },
  { num: 13, id: 'h1', name: 'Unitree H1', t: ['FIGHTING', 'FLYING'], r: 'HANGZHOU', h: 180, w: 47, v: 3.3, price: 90000, st: 1, moves: ['Record Dash', 'Blitz Run'], flavor: 'Holds the 3.3 m/s humanoid speed world record. Legs before looks.' },

  { num: 14, id: 'cassie', name: 'Cassie', t: ['FLYING'], r: 'AMERICAS', h: 100, w: 31, v: 4, price: 250000, st: 0, evo: { to: 'digit', lv: 18 }, moves: ['Ostrich Kick', 'Sprint'], flavor: 'Just legs. Guinness 100 m biped record: 24.73 s. No torso, no problem.' },
  { num: 15, id: 'digit', name: 'Digit', t: ['NORMAL', 'STEEL'], r: 'AMERICAS', h: 175, w: 65, pay: 16, price: 250000, st: 1, moves: ['Tote Toss', 'Warehouse Grind'], flavor: 'Amazon warehouse veteran. The legs finally got arms and a job.' },
  { num: 16, id: 'figure-02', name: 'Figure 02', t: ['PSYCHIC'], r: 'AMERICAS', h: 170, w: 70, price: 150000, st: 0, evo: { to: 'figure-03', lv: 24 }, moves: ['Assembly Line', 'Demo Reel'], flavor: 'Worked the BMW Spartanburg line. The demo reel worked even harder.' },
  { num: 17, id: 'figure-03', name: 'Figure 03', t: ['PSYCHIC', 'STEEL'], r: 'AMERICAS', h: 173, w: 61, tops: 500, price: 120000, st: 1, moves: ['Helix Mind', 'Wireless Leech', 'Demo Reel'], flavor: 'Helix VLA brain, ~5 h battery, wireless charging. Thinks in valuations.' },
  { num: 18, id: 'optimus-gen-2', name: 'Optimus Gen 2', t: ['ELECTRIC', 'DARK'], r: 'AMERICAS', h: 173, w: 57, pay: 20, price: 30000, st: 0, evo: { to: 'optimus-gen-3', lv: 24 }, moves: ['Egg Handle', 'Hype Beam'], flavor: 'FSD neural net brain. Handles eggs gently, expectations less so.' },
  { num: 19, id: 'optimus-gen-3', name: 'Optimus Gen 3', t: ['ELECTRIC', 'DARK'], r: 'AMERICAS', h: 173, w: 57, pay: 20, price: 25000, st: 1, moves: ['Hype Beam', 'Vaporware Veil', 'Egg Handle'], flavor: "Production has been 'really starting' since 2024. ATK stat is pure marketing." },
  { num: 20, id: 'apollo', name: 'Apollo', t: ['FIGHTING', 'NORMAL'], r: 'AMERICAS', h: 173, w: 73, pay: 25, price: 100000, st: 1, moves: ['Power Lift', 'Battery Swap'], flavor: '25 kg payload, swappable battery, Mercedes plant gig. Honest muscle.' },
  { num: 21, id: 'eve', name: '1X EVE', t: ['NORMAL'], r: 'AMERICAS', h: 186, w: 86, price: 100000, st: 0, evo: { to: 'neo', lv: 18 }, moves: ['Patrol', 'Wheel Spin'], flavor: 'Wheeled guard-bot ancestor. Patrolled offices so its child could fold laundry.' },
  { num: 22, id: 'neo', name: '1X NEO', t: ['FAIRY', 'PSYCHIC'], r: 'AMERICAS', h: 165, w: 30, price: 20000, st: 1, moves: ['Soft Hug', 'Laundry Fold'], flavor: 'Soft-suit home robot, $499/mo. Folds laundry, judges your sock drawer.' },
  { num: 23, id: 'phoenix', name: 'Phoenix', t: ['PSYCHIC'], r: 'AMERICAS', h: 170, w: 70, tops: 300, price: 200000, st: 1, moves: ['Carbon Mind', 'Mimic'], flavor: "Runs Sanctuary's 'Carbon' cognitive AI. Mimics human work, and human doubt." },
  { num: 24, id: 'spot', name: 'Spot', t: ['NORMAL', 'STEEL'], r: 'AMERICAS', h: 84, w: 32, v: 1.6, pay: 14, price: 75000, st: 1, quad: true, moves: ['Fetch Arm', 'Sentry Mode'], flavor: 'The original robot dog. 2,000+ shipped, several of them to art museums.' },
  { num: 25, id: 'atlas', name: 'Atlas', t: ['FIGHTING', 'STEEL'], r: 'AMERICAS', h: 190, w: 89, v: 2.5, pay: 50, price: 150000, st: 1, bonus: 22, moves: ['360 Spin', 'Clean + Jerk', 'Parkour'], flavor: 'All-electric, 56 DOF, lifts 50 kg, does parkour. The American pseudo-legendary.' },
  { num: 26, id: 'robonaut-2', name: 'Robonaut 2', t: ['STEEL', 'PSYCHIC'], r: 'AMERICAS', h: 100, w: 150, price: 2500000, st: 0, evo: { to: 'valkyrie', lv: 30 }, moves: ['Zero-G Grip', 'Orbit Guard'], flavor: 'First humanoid on the ISS. A torso that outranks most full bodies.' },
  { num: 27, id: 'valkyrie', name: 'Valkyrie', t: ['STEEL', 'PSYCHIC'], r: 'AMERICAS', h: 188, w: 136, price: 2000000, st: 1, moves: ['Mars Punch', 'Heat Shield', 'Zero-G Grip'], flavor: "NASA's 136 kg Mars-precursor humanoid. Built for a planet with no Wi-Fi." },

  { num: 28, id: 'axol', name: 'Axol', t: ['BUG', 'PSYCHIC'], r: 'GARAGE', h: 120, w: 25, price: 30000, st: 1, moves: ['Pick + Place', 'Diffusion Policy'], flavor: "Almond's dual-arm physical-AI research bot. Small lab, big diffusion policies." },
  { num: 29, id: 'isaac-0', name: 'Isaac 0', t: ['FAIRY', 'NORMAL'], r: 'GARAGE', h: 60, w: 15, price: 7999, st: 0, evo: { to: 'isaac-1', lv: 18 }, moves: ['Perfect Fold', 'Tidy Up'], flavor: "Weave's $7,999 laundry bot. Folds a fitted sheet without crying." },
  { num: 30, id: 'isaac-1', name: 'Isaac 1', t: ['FAIRY', 'PSYCHIC'], r: 'GARAGE', h: 150, w: 40, price: 16000, st: 1, moves: ['Chore Sweep', 'Home Patrol', 'Perfect Fold'], flavor: 'The mobile home-chore evolution. Still in dev, like all great chores.' },
  { num: 31, id: 'operator-op1', name: 'Operator OP1', t: ['STEEL', 'GROUND'], r: 'GARAGE', h: 150, w: 90, pay: 20, price: 60000, st: 1, moves: ['Kitting Combo', 'Outlet Drain'], flavor: "Ultra's 24/7 warehouse packer. Lives in a 5x5 ft cell and loves it." },
  { num: 32, id: 'z-bot', name: 'Z-Bot', t: ['BUG', 'ELECTRIC'], r: 'GARAGE', h: 46, w: 1, price: 999, st: 0, evo: { to: 'k-bot', lv: 16 }, moves: ['Tiny Stomp', 'Open Source'], flavor: "K-Scale's $999 palm-sized humanoid. The smallest thing with a git repo." },
  { num: 33, id: 'k-bot', name: 'K-Bot', t: ['GHOST', 'ELECTRIC'], r: 'GARAGE', h: 150, w: 35, price: 8999, st: 1, moves: ['Ghost Fork', 'RL Policy', 'Open Source'], flavor: 'Open-source body that outlived its maker (RIP 2025). The code remembers.' },
  { num: 34, id: 'piggy', name: 'Piggy', t: ['WATER', 'FAIRY'], r: 'GARAGE', h: 100, w: 30, price: 5000, st: 1, moves: ['Pump Up', 'Muscle Squeeze'], flavor: 'Artificial-muscle humanoid driven by one pump. Hydraulics, but make it cute.' },

  { num: 35, id: 'gr-1', name: 'Fourier GR-1', t: ['PSYCHIC', 'NORMAL'], r: 'SHENZHEN', h: 164, w: 55, price: 100000, st: 0, evo: { to: 'gr-2', lv: 20 }, moves: ['Rehab Heal', 'Steady Grip'], flavor: 'Rehab-medicine humanoid. Helps humans walk so it can outrun them later.' },
  { num: 36, id: 'gr-2', name: 'Fourier GR-2', t: ['PSYCHIC', 'NORMAL'], r: 'SHENZHEN', h: 175, w: 63, pay: 40, price: 120000, st: 1, evo: { to: 'gr-3', lv: 30 }, moves: ['Care Press', 'Payload Carry', 'Rehab Heal'], flavor: '40 kg payload and 12-DOF hands. A nurse that benches more than you.' },
  { num: 37, id: 'gr-3', name: 'Fourier GR-3', t: ['PSYCHIC', 'FAIRY'], r: 'SHENZHEN', h: 165, w: 71, price: 130000, st: 2, moves: ['Soft Skin', 'Lullaby', 'Care Press'], flavor: 'The companion flagship. Soft skin, softer bedside manner.' },
  { num: 38, id: 'walker-s1', name: 'Walker S1', t: ['STEEL', 'ELECTRIC'], r: 'SHENZHEN', h: 172, w: 77, price: 90000, st: 0, evo: { to: 'walker-s2', lv: 24 }, moves: ['Quality Check', 'Line Duty'], flavor: 'QC inspector at BYD and NIO plants. Finds your defects, files a report.' },
  { num: 39, id: 'walker-s2', name: 'Walker S2', t: ['STEEL', 'ELECTRIC'], r: 'SHENZHEN', h: 170, w: 60, price: 80000, st: 1, moves: ['Self Battery Swap', 'Shift Work', 'Quality Check'], flavor: 'Swaps its own battery mid-shift. Technically, it never faints.' },
  { num: 40, id: 'kepler-k2', name: 'Kepler K2', t: ['STEEL', 'GROUND'], r: 'SHENZHEN', h: 178, w: 85, pay: 30, price: 60000, st: 1, moves: ['Forerunner Slam', '8H Grind'], flavor: '15 kg per arm, 8 hours of endurance. The forerunner of the night shift.' },
  { num: 41, id: 'pm01', name: 'EngineAI PM01', t: ['FIGHTING', 'FLYING'], r: 'SHENZHEN', h: 138, w: 40, v: 2, price: 13700, st: 0, evo: { to: 'se01', lv: 22 }, moves: ['Front Flip', 'Waist Spin'], flavor: 'First robot to land a front flip. The 320 degree waist helps it gloat.' },
  { num: 42, id: 'se01', name: 'EngineAI SE01', t: ['FIGHTING', 'DARK'], r: 'SHENZHEN', h: 170, w: 55, v: 2, price: 30000, st: 1, moves: ['Uncanny Stride', 'Gait Mirror', 'Front Flip'], flavor: 'Walks so much like a human that humans filed complaints.' },
  { num: 43, id: 'booster-k1', name: 'Booster K1', t: ['FIGHTING', 'GRASS'], r: 'SHENZHEN', h: 95, w: 19.5, price: 5999, st: 0, evo: { to: 'booster-t1', lv: 14 }, moves: ['Kid Kick', 'Suitcase Escape'], flavor: 'RoboCup KidSize champion, $5,999. Folds into a suitcase to dodge taxes.' },
  { num: 44, id: 'booster-t1', name: 'Booster T1', t: ['FIGHTING', 'GRASS'], r: 'SHENZHEN', h: 118, w: 30, price: 30000, st: 1, evo: { to: 'booster-t2', lv: 26 }, moves: ['Striker Tackle', 'Penalty Kick', 'Kid Kick'], flavor: 'RoboCup AdultSize champion with 130 N·m knees. Plays the full ninety.' },
  { num: 45, id: 'booster-t2', name: 'Booster T2', t: ['FIGHTING', 'GRASS'], r: 'SHENZHEN', h: 130, w: 35, price: 60000, st: 2, moves: ['Bicycle Kick', 'World Cup Volley', 'Striker Tackle'], flavor: 'Unveiled for World Cup 2026. Practices bicycle kicks in the warehouse.' },
  { num: 46, id: 'noetix-n2', name: 'Noetix N2', t: ['FIGHTING', 'FLYING'], r: 'SHENZHEN', h: 118, w: 30, v: 3, price: 8000, st: 1, moves: ['Backflip', 'Marathon Pace'], flavor: 'Finished a half-marathon and backflipped at the line. Show-off.' },
  { num: 47, id: 'agibot-a2', name: 'AgiBot A2', t: ['PSYCHIC', 'GROUND'], r: 'SHENZHEN', h: 170, w: 55, price: 50000, st: 1, moves: ['Long March', 'Route Plan'], flavor: 'Walked 106 km from Suzhou to Shanghai. Guinness asked it to stop.' },
  { num: 48, id: 'astribot-s1', name: 'Astribot S1', t: ['FIGHTING', 'PSYCHIC'], r: 'SHENZHEN', h: 170, w: 45, v: 10, price: 50000, st: 1, moves: ['Pan Flip', 'Drum Solo'], flavor: 'Arms move at 10 m/s. Flips pans, plays drums, ends arguments.' },
  { num: 49, id: 'cyberone', name: 'Xiaomi CyberOne', t: ['PSYCHIC', 'FAIRY'], r: 'SHENZHEN', h: 177, w: 52, price: 100000, st: 1, moves: ['Emotion Read', 'Mi Beam'], flavor: 'Reads 45 human emotions. Pretends not to notice yours.' },
  { num: 50, id: 'tiangong', name: 'Tiangong', t: ['FIGHTING', 'FLYING'], r: 'SHENZHEN', h: 163, w: 43, v: 3.3, price: 70000, st: 1, moves: ['Marathon Pace', 'Final Sprint'], flavor: 'Won the first humanoid half-marathon. Trains by existing in Beijing.' },
  { num: 51, id: 'iron', name: 'Xpeng IRON', t: ['PSYCHIC', 'STEEL'], r: 'SHENZHEN', h: 173, w: 70, tops: 3000, price: 150000, st: 1, bonus: 20, moves: ['Spine Flex', 'Turing Surge', 'Solid State'], flavor: 'Biomimetic spine, 3000 TOPS. The Shenzhen pseudo-legendary.' },

  { num: 52, id: '4ne1', name: 'NEURA 4NE1', t: ['STEEL', 'PSYCHIC'], r: 'EUROPE', h: 180, w: 80, pay: 35, price: 105000, st: 1, moves: ['Sensor Skin', 'GR00T Mind'], flavor: 'German engineering, 100 kg lift claim. CE-certified and statistically harmless.' },
  { num: 53, id: 'talos', name: 'PAL TALOS', t: ['STEEL', 'ROCK'], r: 'EUROPE', h: 175, w: 95, price: 1000000, st: 1, moves: ['Torque Sense', 'Heavy Step'], flavor: '95 kg of Spanish academia with 2 kHz control loops. Peer-reviewed walking.' },
  { num: 54, id: 'icub', name: 'iCub', t: ['FAIRY', 'PSYCHIC'], r: 'EUROPE', h: 104, w: 22, price: 250000, st: 1, moves: ['Curious Gaze', 'Toddler Crawl'], flavor: "Italy's eternal research child, born 2009. Still learning to grasp." },
  { num: 55, id: 'calvin-40', name: 'Calvin-40', t: ['GHOST', 'STEEL'], r: 'EUROPE', h: 170, w: 80, price: 200000, st: 1, moves: ['Headless Horror', '40-Day Build'], flavor: "Built in 40 days for Renault's EV line. Has no head. Needs no head." },
  { num: 56, id: 'hmnd-01', name: 'HMND 01', t: ['NORMAL'], r: 'EUROPE', h: 175, w: 50, price: 25000, st: 1, moves: ['Alpha Test', 'Pitch Deck'], flavor: 'UK alpha-stage humanoid. Most of its DOF are LinkedIn posts.' },
  { num: 57, id: 'anymal', name: 'ANYmal', t: ['STEEL', 'GROUND'], r: 'EUROPE', h: 89, w: 50, v: 1.3, pay: 10, price: 150000, st: 1, quad: true, bonus: 20, moves: ['Thermal Scan', 'Ex-Proof Shell', 'Auto Inspect'], flavor: 'Swiss Ex-proof inspector. IP67, self-docking, patrols gas plants 24/7. It ships.' },

  { num: 58, id: 'motion-1', name: 'Motion 1', t: ['FIGHTING'], r: 'HANOI', h: 162, w: 67, price: 40000, st: 0, evo: { to: 'motion-2', lv: 14 }, moves: ['First Steps', 'Wave'], flavor: "Vietnam's first humanoid, by VinMotion. Every journey starts with First Steps." },
  { num: 59, id: 'motion-2', name: 'Motion 2', t: ['FIGHTING', 'NORMAL'], r: 'HANOI', h: 178, w: 75, pay: 40, price: 50000, st: 1, moves: ['Karate Chop', 'Boxing Combo', 'Self Charge'], flavor: 'Boxed at CES 2026 and back-lifts 40 kg. The hidden ability is heart.' },

  { num: 60, id: 'honda-p2', name: 'Honda P2', t: ['ROCK', 'STEEL'], r: 'RETRO', h: 182, w: 210, price: 3000000, st: 0, evo: { to: 'honda-p3', lv: 25 }, moves: ['Ancient Step', 'Cable Cut'], flavor: "1996. The world's first self-contained biped. 210 kg of pure prophecy." },
  { num: 61, id: 'honda-p3', name: 'Honda P3', t: ['ROCK', 'STEEL'], r: 'RETRO', h: 160, w: 130, price: 2500000, st: 1, evo: { to: 'asimo', lv: 35 }, moves: ['Stair Climb', 'Vatican Blessing', 'Ancient Step'], flavor: 'Climbed stairs in 1997 and received an informal Vatican blessing.' },
  { num: 62, id: 'asimo', name: 'ASIMO', t: ['GHOST', 'FAIRY'], r: 'RETRO', h: 130, w: 48, v: 2.5, price: 2500000, st: 2, moves: ['Hop Skip', 'Farewell Run', 'Stair Climb'], flavor: 'Ran 9 km/h, retired 2022. Forever loved, forever buffering a wave.' },
  { num: 63, id: 'nao', name: 'NAO', t: ['FAIRY'], r: 'RETRO', h: 58, w: 5.5, price: 9000, st: 0, evo: { to: 'pepper', lv: 20 }, moves: ['Robo Dance', 'Lecture Demo'], flavor: 'Taught a generation of CS students. Falls over with great dignity.' },
  { num: 64, id: 'pepper', name: 'Pepper', t: ['FAIRY', 'PSYCHIC'], r: 'RETRO', h: 120, w: 28, price: 20000, st: 1, moves: ['Small Talk', 'Tablet Flash', 'Robo Dance'], flavor: 'Greeted millions in banks and airports. Remembers none of them.' },
  { num: 65, id: 'aibo', name: 'aibo', t: ['NORMAL', 'FAIRY'], r: 'RETRO', h: 29, w: 2.2, price: 2900, st: 1, quad: true, moves: ['Loyal Bark', 'Beg'], flavor: "Sony's robo-puppy. Owners held real funerals for retired units." },

  { num: 66, id: 'wall-e', name: 'WALL-E', t: ['GROUND', 'FAIRY'], r: 'CINEMA', h: 100, w: 100, price: 10000000, st: 1, moves: ['Trash Compact', 'Plant Guard'], flavor: 'WALL-E (2008). 700 years of solo trash-compacting and one houseplant.' },
  { num: 67, id: 'johnny-5', name: 'Johnny 5', t: ['ELECTRIC'], r: 'CINEMA', h: 180, w: 250, price: 10000000, st: 1, moves: ['Lightning Bolt', 'Need Input'], flavor: 'Short Circuit (1986). Struck by lightning, gained a soul. NEED INPUT.' },
  { num: 68, id: 'c-3po', name: 'C-3PO', t: ['PSYCHIC', 'STEEL'], r: 'CINEMA', h: 167, w: 75, price: 10000000, st: 1, moves: ['Translate', 'Recite Odds'], flavor: 'Star Wars (1977). Fluent in six million forms of communication, all anxious.' },
  { num: 69, id: 'baymax', name: 'Baymax', t: ['FAIRY', 'FIGHTING'], r: 'CINEMA', h: 183, w: 35, price: 10000000, st: 1, moves: ['Healing Care', 'Rocket Fist'], flavor: 'Big Hero 6 (2014). Cannot deactivate until you are satisfied with your care.' },
  { num: 70, id: 'tars', name: 'TARS', t: ['PSYCHIC', 'DARK'], r: 'CINEMA', h: 150, w: 120, price: 10000000, st: 1, moves: ['Sarcasm Setting', 'Docking Spin'], flavor: 'Interstellar (2014). Honesty 90 percent. Humor 75 percent.' },
  { num: 71, id: 'bender', name: 'Bender', t: ['STEEL', 'DARK'], r: 'CINEMA', h: 180, w: 240, price: 10000000, st: 1, moves: ['Girder Bend', 'Shiny Steal'], flavor: 'Futurama (1999). 40 percent zinc, 100 percent attitude.' },
  { num: 72, id: 'robocop', name: 'RoboCop', t: ['STEEL', 'FIGHTING'], r: 'CINEMA', h: 190, w: 180, price: 10000000, st: 1, moves: ['Prime Directives', 'Auto-9'], flavor: 'RoboCop (1987). Part man, part machine, all cop.' },
  { num: 73, id: 't-800', name: 'T-800', t: ['STEEL', 'DARK'], r: 'CINEMA', h: 188, w: 180, price: 10000000, st: 1, evo: { to: 't-1000', lv: 50 }, moves: ['Terminate', "I'll Be Back"], flavor: 'The Terminator (1984). It absolutely will not stop, ever.' },
  { num: 74, id: 't-1000', name: 'T-1000', t: ['WATER', 'STEEL'], r: 'CINEMA', h: 183, w: 150, price: 10000000, st: 1, moves: ['Liquid Morph', 'Blade Arm'], flavor: 'Terminator 2 (1991). Mimetic polyalloy walks through bars.' },
  { num: 75, id: 'iron-giant', name: 'Iron Giant', t: ['STEEL', 'FAIRY'], r: 'CINEMA', h: 1500, w: 6000, price: 10000000, st: 1, moves: ['Superman', 'Defense Mode Off'], flavor: 'The Iron Giant (1999). You are who you choose to be.' },
  { num: 76, id: 'optimus-prime', name: 'Optimus Prime', t: ['STEEL', 'FIGHTING'], r: 'CINEMA', h: 900, w: 4300, price: 10000000, st: 1, moves: ['Truck Form', 'Matrix Burst'], flavor: 'Transformers (1984). Freedom is the right of all sentient beings.' },
  { num: 77, id: 'gundam', name: 'RX-78-2 Gundam', t: ['STEEL', 'DRAGON'], r: 'CINEMA', h: 1800, w: 43400, price: 10000000, st: 1, moves: ['Beam Saber', 'Newtype Flash'], flavor: 'Mobile Suit Gundam (1979). A real 1:1 walking one exists in Yokohama.' },
  { num: 78, id: 'gipsy-danger', name: 'Gipsy Danger', t: ['STEEL', 'WATER'], r: 'CINEMA', h: 7900, w: 1980000, price: 10000000, st: 1, moves: ['Plasma Cannon', 'Elbow Rocket'], flavor: 'Pacific Rim (2013). 79 m Jaeger. Requires two drift-compatible trainers.' },
  { num: 79, id: 'astro-boy', name: 'Astro Boy', t: ['ELECTRIC', 'PSYCHIC'], r: 'CINEMA', h: 135, w: 30, price: 10000000, st: 1, bonus: 10, moves: ['100K Horsepower', 'Rocket Boots'], flavor: 'Astro Boy (1952). Mythical. The robot that started it all.' },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function derive(m) {
  const base = REGION_STATS[m.r];
  const mult = STAGE_MULT[m.st ?? 1];
  const bonus = m.bonus || 0;
  const stats = {
    hp: base.hp * mult + Math.sqrt(m.w) * 3 + bonus,
    atk: base.atk * mult + Math.min(m.pay || 0, 40) + bonus,
    def: base.def * mult + bonus,
    spa: base.spa * mult + Math.min((m.tops || 0) / 50, 40) + bonus,
    spd: base.spd * mult + (m.v || 1.2) * 6 + bonus,
  };
  for (const k in stats) stats[k] = clamp(Math.round(stats[k]), 20, 160);
  return stats;
}

const MOVE_POWER = [50, 60, 75];
const LEARN_LEVELS = [1, 10, 18];

export const DEX = RAW.map((m) => {
  const stats = derive(m);
  const bst = stats.hp + stats.atk + stats.def + stats.spa + stats.spd;
  const moves = [
    { name: 'Ram', type: 'NORMAL', power: 40, lv: 1 },
    ...m.moves.map((name, i) => ({
      name, type: m.t[i % m.t.length], power: MOVE_POWER[i], lv: LEARN_LEVELS[i],
    })),
  ];
  return {
    ...m, stats, bst, battleMoves: moves,
    legendary: m.r === 'CINEMA',
    catchRate: clamp(Math.round(255 * Math.pow(1600 / m.price, 0.55)), 3, 255),
  };
});

export const MON = Object.fromEntries(DEX.map((m) => [m.id, m]));

export function movesAt(id, level) {
  return MON[id].battleMoves.filter((mv) => mv.lv <= level).slice(-4);
}

const VOICE_MOVES = {
  'Sales Pitch': ['NORMAL', 110],
  'Hype Speech': ['DARK', 105],
  'Battle Cry': ['FIGHTING', 110],
  'Calm Words': ['FAIRY', 95],
  'Spec Recital': ['STEEL', 100],
  'Beep Storm': ['ELECTRIC', 105],
  'Keynote Crash': ['PSYCHIC', 110],
  'Safety Briefing': ['GROUND', 95],
  'Lecture Mode': ['PSYCHIC', 95],
  'Victory Chant': ['GRASS', 100],
  'Farewell Song': ['GHOST', 110],
  'War Story': ['STEEL', 115],
  'Marathon Mantra': ['FLYING', 100],
  'Startup Standup': ['BUG', 95],
};

const VOICE_USERS = {
  'Sales Pitch': ['optimus-gen-2', 'optimus-gen-3', 'figure-02', 'figure-03', 'eve', 'hmnd-01', 'phoenix'],
  'Hype Speech': ['se01', 'chopper', 'bender', 'tars'],
  'Battle Cry': ['r1', 'g1', 'h2', 'h1', 'motion-1', 'motion-2', 'apollo', 'atlas', 'pm01', 'astribot-s1', 'robocop', 'optimus-prime'],
  'Calm Words': ['gr-1', 'gr-2', 'gr-3', 'neo', 'pepper', 'cyberone', 'baymax', 'piggy', 'iron-giant'],
  'Spec Recital': ['walker-s1', 'walker-s2', 'kepler-k2', 'operator-op1', 'b2', '4ne1', 'calvin-40', 'digit'],
  'Beep Storm': ['r2-d2', 'bdx-droid', 'johnny-5', 'mini-pi', 'mini-pi-plus', 'astro-boy', 'wall-e', 'go2'],
  'Keynote Crash': ['iron', 'mini-pi-plus-pro', 'c-3po'],
  'Safety Briefing': ['anymal', 'a2', 'spot'],
  'Lecture Mode': ['icub', 'talos', 'nao', 'robonaut-2', 'valkyrie', 'honda-p2', 'honda-p3'],
  'Victory Chant': ['booster-k1', 'booster-t1', 'booster-t2'],
  'Farewell Song': ['asimo', 'aibo', 'k-bot'],
  'War Story': ['t-800', 't-1000', 'gundam', 'gipsy-danger'],
  'Marathon Mantra': ['cassie', 'tiangong', 'noetix-n2', 'agibot-a2'],
  'Startup Standup': ['axol', 'z-bot', 'isaac-0', 'isaac-1'],
};

export const VOICE_BY_ID = {};
for (const [name, ids] of Object.entries(VOICE_USERS)) {
  for (const id of ids) VOICE_BY_ID[id] = name;
}

export function voiceMoveFor(id) {
  const name = VOICE_BY_ID[id];
  const [type, power] = VOICE_MOVES[name];
  return { name, type, power, voice: true };
}

export function fmtPrice(p) {
  if (p >= 10000000) return 'PRICELESS';
  if (p >= 1000000) return '$' + (p / 1000000).toFixed(1) + 'M';
  if (p >= 1000) return '$' + Math.round(p / 1000) + 'K';
  return '$' + p;
}
