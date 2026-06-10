import { TYPE_COLORS } from './data/types.js';

function prng(seed) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// ---- battle sprites -------------------------------------------------------

const SPRITE_SIZE = 64;

function drawHumanoid(g, rand, base, dark, accent, ph) {
  const cx = 32;
  const bottom = 58;
  const top = bottom - ph;
  const headH = Math.max(6, Math.round(ph * 0.28));
  const headW = Math.max(6, Math.round(headH * (0.8 + rand() * 0.4)));
  const torsoH = Math.round(ph * 0.36);
  const torsoW = Math.max(8, Math.round(headW * (1.2 + rand() * 0.6)));
  const legH = ph - headH - torsoH;
  const legW = Math.max(2, Math.round(torsoW * 0.28));
  const armW = Math.max(2, Math.round(torsoW * 0.22));

  g.fillStyle = dark;
  g.fillRect(cx - legW - Math.round(torsoW * 0.12), bottom - legH, legW, legH);
  g.fillRect(cx + Math.round(torsoW * 0.12), bottom - legH, legW, legH);
  g.fillRect(cx - legW - Math.round(torsoW * 0.12) - 1, bottom - 2, legW + 2, 2);
  g.fillRect(cx + Math.round(torsoW * 0.12) - 1, bottom - 2, legW + 2, 2);

  const torsoY = top + headH;
  g.fillStyle = base;
  g.fillRect(cx - (torsoW >> 1), torsoY, torsoW, torsoH);
  g.fillStyle = shade(base, 1.25);
  g.fillRect(cx - (torsoW >> 1), torsoY, Math.max(2, torsoW >> 2), torsoH);
  g.fillStyle = accent;
  g.fillRect(cx - 2, torsoY + Math.round(torsoH * 0.3), 4, Math.max(2, Math.round(torsoH * 0.25)));

  const armH = Math.round(torsoH * (0.8 + rand() * 0.5));
  g.fillStyle = dark;
  g.fillRect(cx - (torsoW >> 1) - armW - 1, torsoY + 1, armW, armH);
  g.fillRect(cx + (torsoW >> 1) + 1, torsoY + 1, armW, armH);

  g.fillStyle = base;
  g.fillRect(cx - (headW >> 1), top, headW, headH);
  g.fillStyle = shade(base, 0.7);
  g.fillRect(cx - (headW >> 1), top + headH - 2, headW, 2);
  g.fillStyle = '#9be8ff';
  const eyeStyle = rand();
  if (eyeStyle < 0.5) g.fillRect(cx - (headW >> 1) + 1, top + Math.round(headH * 0.3), headW - 2, Math.max(1, headH >> 3) + 1);
  else { g.fillRect(cx - (headW >> 2) - 1, top + (headH >> 2), 2, 2); g.fillRect(cx + (headW >> 2) - 1, top + (headH >> 2), 2, 2); }
  if (rand() < 0.45) { g.fillStyle = accent; g.fillRect(cx - 1, top - 3, 1, 3); g.fillRect(cx - 2, top - 4, 3, 1); }
  if (rand() < 0.4) { g.fillStyle = dark; g.fillRect(cx - (headW >> 1) - 2, top + 1, 2, headH - 2); g.fillRect(cx + (headW >> 1), top + 1, 2, headH - 2); }
}

function drawQuad(g, rand, base, dark, accent, ph) {
  const bh = Math.max(8, Math.round(ph * 0.9));
  const bw = Math.min(44, bh * 2);
  const cx = 32, bottom = 58;
  const legH = Math.max(4, Math.round(bh * 0.45));
  const bodyY = bottom - legH - Math.round(bh * 0.55);

  g.fillStyle = dark;
  for (const lx of [cx - (bw >> 1) + 2, cx - (bw >> 1) + 8, cx + (bw >> 1) - 10, cx + (bw >> 1) - 4]) {
    g.fillRect(lx, bottom - legH, 3, legH);
  }
  g.fillStyle = base;
  g.fillRect(cx - (bw >> 1), bodyY, bw, Math.round(bh * 0.55));
  g.fillStyle = shade(base, 1.25);
  g.fillRect(cx - (bw >> 1), bodyY, bw, 2);
  const headS = Math.max(6, Math.round(bh * 0.5));
  g.fillStyle = base;
  g.fillRect(cx + (bw >> 1) - 2, bodyY - (headS >> 1), headS, headS);
  g.fillStyle = '#9be8ff';
  g.fillRect(cx + (bw >> 1) + headS - 6, bodyY - (headS >> 1) + 2, 3, 2);
  g.fillStyle = accent;
  g.fillRect(cx - (bw >> 1) - 2, bodyY + 1, 2, 3);
}

function makePlaceholder(mon) {
  const c = makeCanvas(SPRITE_SIZE, SPRITE_SIZE);
  const g = c.getContext('2d');
  const rand = prng(mon.id);
  const base = TYPE_COLORS[mon.t[0]];
  const accent = TYPE_COLORS[mon.t[1] || mon.t[0]];
  const dark = shade(base, 0.55);
  const ph = Math.round(Math.max(16, Math.min(52, 14 + Math.sqrt(mon.h) * 3.4)));
  if (mon.quad) drawQuad(g, rand, base, dark, accent, ph);
  else drawHumanoid(g, rand, base, dark, accent, ph);
  return c;
}

const spriteCache = {};

export function monSprite(mon) {
  if (spriteCache[mon.id]) return spriteCache[mon.id];
  const entry = { img: null, placeholder: makePlaceholder(mon), ready: false };
  const img = new Image();
  img.onload = () => { entry.img = img; entry.ready = true; };
  img.src = `assets/sprites/${mon.id}.png`;
  entry.draw = (ctx, x, y, size = 64, flip = false) => {
    const src = entry.ready ? entry.img : entry.placeholder;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (flip) { ctx.translate(x + size, y); ctx.scale(-1, 1); ctx.drawImage(src, 0, 0, size, size); }
    else ctx.drawImage(src, x, y, size, size);
    ctx.restore();
  };
  entry.isPlaceholder = () => !entry.ready;
  spriteCache[mon.id] = entry;
  return entry;
}

// ---- overworld characters -------------------------------------------------

const PALETTES = [
  { hair: '#f8f8f8', skin: '#f0c8a0', shirt: '#f8f8f8', pants: '#787048' }, // 0 professor/elder
  { hair: '#604020', skin: '#f0c8a0', shirt: '#4878f8', pants: '#384058' }, // 1 aide
  { hair: '#202020', skin: '#e8b888', shirt: '#f8d030', pants: '#3868c0' }, // 2 kid
  { hair: '#9098a8', skin: '#b8c0d0', shirt: '#788090', pants: '#505868' }, // 3 machine/robot
  { hair: '#c05870', skin: '#f0c8a0', shirt: '#f898b0', pants: '#f8f8f8' }, // 4 nurse/mom
  { hair: '#783818', skin: '#d8a878', shirt: '#90b048', pants: '#604830' }, // 5 hiker/worker
  { hair: '#185878', skin: '#f0c8a0', shirt: '#e85840', pants: '#283848' }, // 6 trainer
  { hair: '#d83028', skin: '#f0c8a0', shirt: '#e83020', pants: '#283050' }, // 7 player (red cap)
];

function drawChar(g, pal, dir, frame) {
  const p = PALETTES[pal];
  const ox = 3, oy = 1;
  const px = (color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(ox + x, oy + y, w, h); };

  const step = frame === 0 ? 0 : 1;
  const legSwap = frame === 2;

  px(p.hair, 1, 0, 8, 3);
  px(p.hair, 0, 1, 10, 2);
  if (pal === 7) { px('#f8f8f8', 1, 0, 8, 1); px(p.hair, 0, 2, 10, 1); }

  if (dir === 'down') {
    px(p.skin, 1, 3, 8, 3);
    px('#202020', 2, 4, 2, 1); px('#202020', 6, 4, 2, 1);
  } else if (dir === 'up') {
    px(p.hair, 1, 3, 8, 3);
  } else {
    px(p.skin, 1, 3, 8, 3);
    px('#202020', dir === 'left' ? 2 : 6, 4, 2, 1);
  }

  px(p.shirt, 1, 6, 8, 4);
  px(p.skin, 0, 6, 1, 3); px(p.skin, 9, 6, 1, 3);
  px(p.pants, 2, 10, 6, 2);
  if (step === 0) {
    px(p.pants, 2, 12, 2, 2); px(p.pants, 6, 12, 2, 2);
  } else if (!legSwap) {
    px(p.pants, 2, 12, 2, 1); px(p.pants, 6, 12, 2, 2);
  } else {
    px(p.pants, 2, 12, 2, 2); px(p.pants, 6, 12, 2, 1);
  }
}

const charCache = {};

export function charSprite(pal) {
  if (charCache[pal]) return charCache[pal];
  const frames = {};
  for (const dir of ['down', 'up', 'left', 'right']) {
    frames[dir] = [0, 1, 2].map((f) => {
      const c = makeCanvas(16, 16);
      const g = c.getContext('2d');
      if (dir === 'right') {
        g.translate(16, 0); g.scale(-1, 1);
        drawChar(g, pal, 'left', f);
      } else drawChar(g, pal, dir, f);
      return c;
    });
  }
  charCache[pal] = frames;
  return frames;
}

// ---- tiles ----------------------------------------------------------------

const THEMES = {
  town: { ground: '#78c850', groundDot: '#68b840', path: '#e0c890', wild: '#48a040', wildDetail: '#306828', tree: '#387028', treeDark: '#28501c', trunk: '#805030', roof: '#e06040', roofDark: '#a83828', wall: '#e8e0d0', wallDark: '#b0a890', fence: '#c09858', water: '#5090e8', flower: '#f8e070', flower2: '#f87880' },
  route: { ground: '#88c858', groundDot: '#78b848', path: '#d8c080', wild: '#509838', wildDetail: '#356820', tree: '#387028', treeDark: '#28501c', trunk: '#805030', roof: '#8090b0', roofDark: '#586880', wall: '#d8d0c0', wallDark: '#a8a090', fence: '#c09858', water: '#5090e8', flower: '#f8e070', flower2: '#f8f8f8' },
  city: { ground: '#80c060', groundDot: '#70b050', path: '#c8c8d0', wild: '#40a048', wildDetail: '#287030', tree: '#308040', treeDark: '#205830', trunk: '#705840', roof: '#5088d8', roofDark: '#3060a0', wall: '#f0e8e0', wallDark: '#b8b0a0', fence: '#a8a8b0', water: '#48a8e8', flower: '#f8a8c8', flower2: '#f8e070' },
  factory: { ground: '#a0a0a8', groundDot: '#909098', path: '#b8b860', wild: '#585860', wildDetail: '#f8d030', tree: '#686870', treeDark: '#505058', trunk: '#585860', roof: '#7888a0', roofDark: '#506078', wall: '#888890', wallDark: '#606068', fence: '#909098', water: '#487890', flower: '#f8d030', flower2: '#e85840', crate: '#b08850', crateDark: '#806030' },
  museum: { ground: '#d8d0c0', groundDot: '#c8c0b0', path: '#c0b8a8', wild: '#9088b8', wildDetail: '#d8c8f8', tree: '#787068', treeDark: '#585048', trunk: '#585048', roof: '#a08868', roofDark: '#786048', wall: '#b0a890', wallDark: '#888068', fence: '#a89878', water: '#5090e8', flower: '#c8b890', flower2: '#a89060', crate: '#988868', crateDark: '#706048' },
  interior: { ground: '#e0c8a0', groundDot: '#d0b890', path: '#d0b890', wild: '#e0c8a0', wildDetail: '#d0b890', tree: '#806040', treeDark: '#605030', trunk: '#605030', roof: '#806040', roofDark: '#605030', wall: '#b89060', wallDark: '#886840', fence: '#a08050', water: '#5090e8', flower: '#d04830', flower2: '#4878c0', crate: '#a87848', crateDark: '#785430' },
  hq: { ground: '#ecc88e', groundDot: '#dcb478', path: '#f4dca4', wild: '#ecc88e', wildDetail: '#dcb478', tree: '#80a048', treeDark: '#5c7c30', trunk: '#8c6840', roof: '#f8d048', roofDark: '#d0a820', wall: '#f8f0d8', wallDark: '#e0c468', fence: '#d0a820', water: '#5090e8', flower: '#f8d840', flower2: '#f8b820', crate: '#c89858', crateDark: '#946c38', plant: '#68a838', plantDark: '#48802c', lemon: '#f8d020' },
  arena: { ground: '#1c1c24', groundDot: '#26262e', path: '#2a2a34', wild: '#1c1c24', wildDetail: '#26262e', tree: '#101014', treeDark: '#0a0a0c', trunk: '#101014', roof: '#101014', roofDark: '#0a0a0c', wall: '#16161c', wallDark: '#2c0a2c', fence: '#f828b8', water: '#1c1c24', flower: '#fff6d8', flower2: '#28e8f8', crate: '#26262e', crateDark: '#f828b8' },
  dream: { ground: '#cdbfe8', groundDot: '#c0b0de', path: '#e6dcf6', wild: '#a995d6', wildDetail: '#7e66b8', tree: '#74c4bc', treeDark: '#549c94', trunk: '#8e7ab8', roof: '#b48ad0', roofDark: '#8a62a8', wall: '#e8def4', wallDark: '#b8a6d4', fence: '#b48ad0', water: '#f4b6d8', flower: '#fff2b0', flower2: '#ff9ed6' },
};

function makeTile(draw) {
  const c = makeCanvas(16, 16);
  draw(c.getContext('2d'));
  return c;
}

const tilesetCache = {};

export function tileset(theme) {
  if (tilesetCache[theme]) return tilesetCache[theme];
  const t = THEMES[theme];
  const rand = prng(theme);
  const dots = (g, color, n, r) => {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) g.fillRect(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1);
  };
  const ground = (g) => { g.fillStyle = t.ground; g.fillRect(0, 0, 16, 16); dots(g, t.groundDot, 6, rand); };

  const tiles = {
    '.': makeTile(ground),
    ',': makeTile((g) => { ground(g); g.fillStyle = t.flower; g.fillRect(6, 6, 2, 2); g.fillRect(10, 10, 2, 2); }),
    '*': makeTile((g) => { ground(g); g.fillStyle = t.flower2; g.fillRect(4, 5, 2, 2); g.fillRect(9, 9, 2, 2); g.fillStyle = t.flower; g.fillRect(11, 4, 2, 2); }),
    '=': makeTile((g) => { g.fillStyle = t.path; g.fillRect(0, 0, 16, 16); dots(g, t.wallDark, 4, rand); }),
    'w': makeTile((g) => {
      g.fillStyle = t.wild; g.fillRect(0, 0, 16, 16);
      g.fillStyle = t.wildDetail;
      if (theme === 'factory') { g.fillRect(1, 4, 14, 2); g.fillRect(1, 10, 14, 2); g.fillStyle = '#282830'; g.fillRect(1, 6, 14, 1); g.fillRect(1, 12, 14, 1); }
      else if (theme === 'museum') { g.fillRect(3, 3, 2, 2); g.fillRect(11, 5, 2, 2); g.fillRect(6, 10, 2, 2); g.fillRect(12, 12, 1, 1); }
      else for (let i = 0; i < 5; i++) { const x = 1 + i * 3; g.fillRect(x, 6, 1, 9); g.fillRect(x + 1, 4, 1, 11); }
    }),
    'T': makeTile((g) => {
      ground(g);
      if (theme === 'factory') { g.fillStyle = t.tree; g.fillRect(2, 2, 12, 12); g.fillStyle = t.treeDark; g.fillRect(2, 11, 12, 3); g.fillStyle = '#f8d030'; g.fillRect(3, 3, 3, 2); }
      else { g.fillStyle = t.trunk; g.fillRect(6, 11, 4, 5); g.fillStyle = t.tree; g.fillRect(2, 2, 12, 10); g.fillRect(4, 0, 8, 4); g.fillStyle = t.treeDark; g.fillRect(2, 9, 12, 3); g.fillRect(3, 4, 3, 3); }
    }),
    '#': makeTile((g) => { g.fillStyle = t.wall; g.fillRect(0, 0, 16, 16); g.fillStyle = t.wallDark; for (let y = 0; y < 16; y += 4) for (let x = (y % 8 ? 4 : 0); x < 16; x += 8) g.fillRect(x, y + 3, 8, 1); g.fillRect(0, 15, 16, 1); }),
    'R': makeTile((g) => { g.fillStyle = t.roof; g.fillRect(0, 0, 16, 16); g.fillStyle = t.roofDark; g.fillRect(0, 4, 16, 1); g.fillRect(0, 10, 16, 1); g.fillRect(0, 15, 16, 1); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 0, 16, 2); }),
    'F': makeTile((g) => { ground(g); g.fillStyle = t.fence; g.fillRect(0, 6, 16, 3); g.fillRect(2, 4, 2, 9); g.fillRect(12, 4, 2, 9); g.fillStyle = shade(t.fence, 0.6); g.fillRect(0, 9, 16, 1); }),
    '~': makeTile((g) => { g.fillStyle = t.water; g.fillRect(0, 0, 16, 16); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(2, 4, 5, 1); g.fillRect(9, 9, 5, 1); g.fillRect(4, 13, 4, 1); }),
    'D': makeTile((g) => { g.fillStyle = t.wall; g.fillRect(0, 0, 16, 16); g.fillStyle = '#282830'; g.fillRect(3, 2, 10, 14); g.fillStyle = '#484858'; g.fillRect(4, 3, 8, 2); }),
    'o': makeTile((g) => {
      ground(g);
      const cr = t.crate || t.trunk, crd = t.crateDark || t.treeDark;
      g.fillStyle = cr; g.fillRect(2, 3, 12, 12);
      g.fillStyle = crd; g.fillRect(2, 3, 12, 1); g.fillRect(2, 14, 12, 1); g.fillRect(2, 3, 1, 12); g.fillRect(13, 3, 1, 12); g.fillRect(2, 8, 12, 1);
    }),
  };
  if (theme === 'museum') {
    tiles['.'] = makeTile((g) => { g.fillStyle = t.ground; g.fillRect(0, 0, 16, 16); g.fillStyle = t.groundDot; g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8); });
  }
  if (theme === 'interior' || theme === 'hq') {
    tiles['.'] = makeTile((g) => { g.fillStyle = t.ground; g.fillRect(0, 0, 16, 16); g.fillStyle = t.groundDot; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); });
  }
  if (theme === 'arena') {
    tiles['.'] = makeTile((g) => { g.fillStyle = t.ground; g.fillRect(0, 0, 16, 16); g.fillStyle = t.groundDot; g.fillRect(0, 7, 16, 1); g.fillRect(7, 0, 1, 16); });
    tiles['#'] = makeTile((g) => { g.fillStyle = t.wall; g.fillRect(0, 0, 16, 16); g.fillStyle = '#0a0a0e'; g.fillRect(0, 12, 16, 4); g.fillStyle = '#f828b8'; g.fillRect(0, 12, 16, 1); g.fillStyle = 'rgba(248,40,184,0.25)'; g.fillRect(0, 13, 16, 2); });
    tiles['F'] = makeTile((g) => {
      g.fillStyle = t.ground; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#34102e'; g.fillRect(0, 4, 16, 9);
      g.fillStyle = '#f828b8'; g.fillRect(0, 5, 16, 2); g.fillRect(0, 10, 16, 2);
      g.fillStyle = '#ff9ade'; g.fillRect(0, 5, 16, 1); g.fillRect(0, 10, 16, 1);
      g.fillStyle = '#28e8f8'; g.fillRect(2, 3, 2, 11); g.fillRect(12, 3, 2, 11);
      g.fillStyle = '#c8fbff'; g.fillRect(2, 3, 1, 11); g.fillRect(12, 3, 1, 11);
    });
    tiles[','] = makeTile((g) => {
      g.fillStyle = t.path; g.fillRect(0, 0, 16, 16);
      g.fillStyle = 'rgba(255,246,216,0.16)'; g.beginPath(); g.arc(8, 8, 7, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,246,216,0.28)'; g.beginPath(); g.arc(8, 8, 4, 0, Math.PI * 2); g.fill();
    });
    tiles['*'] = makeTile((g) => {
      g.fillStyle = t.ground; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#28e8f8'; g.fillRect(5, 7, 6, 2);
      g.fillStyle = 'rgba(40,232,248,0.3)'; g.fillRect(3, 5, 10, 6);
    });
    tiles['o'] = makeTile((g) => {
      g.fillStyle = t.ground; g.fillRect(0, 0, 16, 16);
      g.fillStyle = t.crate; g.fillRect(2, 3, 12, 12);
      g.fillStyle = '#f828b8'; g.fillRect(2, 3, 12, 1); g.fillRect(2, 14, 12, 1);
      g.fillStyle = '#28e8f8'; g.fillRect(4, 7, 8, 2);
    });
  }
  tiles['P'] = makeTile((g) => {
    g.drawImage(tiles['.'], 0, 0);
    g.fillStyle = '#b05838'; g.fillRect(5, 11, 6, 4);
    g.fillStyle = '#8c3c24'; g.fillRect(5, 14, 6, 1);
    g.fillStyle = t.plant || '#48902c'; g.fillRect(3, 2, 10, 9); g.fillRect(5, 0, 6, 3);
    g.fillStyle = t.plantDark || '#356820'; g.fillRect(3, 9, 10, 2);
    g.fillStyle = t.lemon || '#f8d020'; g.fillRect(4, 3, 2, 2); g.fillRect(10, 5, 2, 2); g.fillRect(7, 7, 2, 2);
  });
  const facade = (g, base, dark) => {
    g.fillStyle = base; g.fillRect(0, 0, 16, 16);
    g.fillStyle = dark; g.fillRect(0, 5, 16, 1); g.fillRect(0, 11, 16, 1); g.fillRect(0, 15, 16, 1);
  };
  tiles['Y'] = makeTile((g) => facade(g, '#f8d048', '#d0a820'));
  tiles['y'] = makeTile((g) => { facade(g, '#f8c020', '#c89010'); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0, 0, 16, 2); });
  const brick = (g) => {
    g.fillStyle = '#9c4636'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#7c3026';
    for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1);
    for (let y = 0; y < 16; y += 8) { g.fillRect(5, y, 1, 3); g.fillRect(11, y + 4, 1, 3); }
  };
  tiles['B'] = makeTile((g) => { brick(g); g.fillStyle = '#5e241c'; g.fillRect(0, 15, 16, 1); });
  tiles['b'] = makeTile((g) => {
    brick(g);
    g.fillStyle = '#2e3a4a'; g.fillRect(2, 4, 4, 7); g.fillRect(10, 4, 4, 7);
    g.fillStyle = '#bcd2e8'; g.fillRect(2, 4, 4, 2); g.fillRect(10, 4, 4, 2);
  });
  tiles['S'] = makeTile((g) => {
    g.fillStyle = '#f0ece0'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#454548';
    g.fillRect(1, 4, 4, 2); g.fillRect(7, 4, 3, 2); g.fillRect(12, 4, 3, 2);
    g.fillRect(2, 9, 3, 2); g.fillRect(7, 9, 5, 2); g.fillRect(14, 9, 1, 2);
    g.fillStyle = '#9c4636'; g.fillRect(0, 14, 16, 2);
  });
  tiles['C'] = makeTile((g) => {
    g.fillStyle = '#32323c'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#1e1e26'; g.fillRect(0, 0, 16, 3); g.fillRect(0, 13, 16, 3);
    g.fillStyle = '#4a4a56';
    for (let x = 1; x < 16; x += 4) g.fillRect(x, 4, 1, 8);
    g.fillStyle = '#f8d030'; g.fillRect(7, 6, 2, 1); g.fillRect(8, 7, 2, 1); g.fillRect(7, 8, 2, 1);
  });
  const logoTile = makeTile((g) => (theme === 'hq' ? facade(g, t.wall, t.wallDark) : facade(g, '#f8d048', '#d0a820')));
  const paintLogo = () => {
    const g = logoTile.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(logoImg, 2, 1, 12, 14);
  };
  if (logoImg.complete && logoImg.naturalWidth) paintLogo();
  else logoImg.addEventListener('load', paintLogo);
  tiles['L'] = logoTile;
  tilesetCache[theme] = tiles;
  return tiles;
}

export const logoImg = new Image();
logoImg.src = 'assets/lightberry-logo.png';

export const SOLID_TILES = new Set(['T', '#', 'R', 'F', '~', 'o', 'P', 'Y', 'y', 'L', 'S', 'b', 'B', 'C']);
