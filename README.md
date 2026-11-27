[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/qienzdork/turkey-run-game/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/qienzdork/turkey-run-game/reward.svg)](https://make.fun/c/turkey-run-game-01)

# Turkey Run: The Great Thanksgiving Escape

Thanksgiving is coming, the oven is on, and Farmer Jed has the carving
knife out. You are Tom the turkey, and dinner is not on your schedule.
Sprint across the farmyard, hop the fences, duck behind the hay bales,
dodge the knives, survive the kitchen — and slip out the back door to
the forest gate before Jed grabs you.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static HTTP server). No network request is made; all art is drawn in
code and all sound is synthesized live with the Web Audio API.

| Control | Action |
|---|---|
| Space / ↑ / W / click | Jump — press again mid-air for a double jump |
| ↓ / S | Duck, and hide behind a hay bale to shake the farmer off |
| ← / → (A / D) | Dawdle / hurry |
| P | Pause · M — sound on/off · R — run again |

## The run

- **The Farmyard (0–600 m):** fences to jump, hay bales to jump or hide
  behind, mud puddles to hop, corn to gobble (+25 each).
- **Barn & Garden (600–1200 m):** crates, wheelbarrows and hoses — and
  Jed starts throwing carving knives. Duck under them.
- **The Kitchen (1200–1800 m):** the roaring oven with its open door,
  knives falling from above, boiling pots and a rolling pin. Jump the
  flames or get roasted.
- **The Forest Gate (1800 m):** run through the open back door and you
  are free — the ESCAPED screen. Get caught and it is the CAUGHT screen
  instead, with a rematch one key away.

**Farmer Jed** chases, searches and corners. Every stumble lets him
gain; every clean stretch pulls you ahead. Hide in the hay and he loses
the trail (his "?" says it all), but hiding costs you distance. Three
lives, shown as drumsticks; golden feathers (+100) and pumpkin pie
(+150, and a life back) are worth the risk. Score, distance and best
escape are tracked, so there is always a reason to run again.

## Structure

Plain canvas JavaScript, no library, no build step — one clear job per
file, named for what it does:

- `game/main.js` — state machine, loop, collisions, scoring, shot modes
- `game/turkey.js` — the turkey: physics, hitbox and hand-drawn art
- `game/farmer.js` — Farmer Jed: chase / search / corner AI and art
- `game/world.js` — stages, obstacles, pickups, parallax scenery
- `game/kitchen.js` — kitchen hazards: oven, falling knives, pots, pin
- `game/audio.js` — synthesized sound: gobbles, boings, dings, stings
- `game/input.js` — keyboard + mouse intents
- `game/render.js` — HUD, title screen, pause card, end screens
- `game/style.css` — page chrome and canvas framing

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with `buildDossier` from
`vendor/makefun-game.ts`.

## Screenshots

`?shot=start|play|kitchen|end` poses the game for its screenshots:
title screen, farmyard chase, kitchen stage, and the caught end screen.
