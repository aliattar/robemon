# ROBÉMON

A mini Pokémon-style game where you catch real-world humanoid robots. Vanilla JS + HTML5 canvas, zero dependencies, GBA-style 240x160.

## Run

```sh
cd game
python3 -m http.server 8000
```

Open http://localhost:8000

## Controls

- Arrow keys / WASD — move
- Z / Enter — A button (confirm, talk, advance text)
- X — B button (back)
- Esc / M — open menu (Robodex, party, box, save)

## Sprites

Battle sprites are loaded from `assets/sprites/<robot-id>.png` (64x64 recommended, transparent background). When a PNG is missing, a procedural pixel-art silhouette is rendered instead. Robot ids are lowercase kebab names, e.g. `go2.png`, `r1.png`, `g1.png`, `h2.png`, `mini-pi.png`, `bdx-droid.png`, `optimus-gen-2.png`, `atlas.png`, `wall-e.png` — see `id` fields in `src/data/dex.js` for the full list.

## Dev

`node check-data.mjs` validates dex/map data integrity.
