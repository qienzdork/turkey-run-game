// main.js — Turkey Run: The Great Thanksgiving Escape.
// One job: the game itself — the state machine (title → run → caught /
// escaped), the loop, collisions, scoring and the screenshot "shot" modes
// (?shot=start|play|kitchen|end) that pose the game for its screenshots.
// All art is drawn in code; all sound is synthesized; nothing loads over
// the network. Plain canvas JS, no library.

import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createTurkey, drawTurkey, GROUND_Y, TURKEY_X } from './turkey.js';
import { createFarmer, drawFarmer } from './farmer.js';
import { createWorld, stageFor, drawBackground, drawObstacles, drawPickups, drawHazards, drawGate } from './world.js';
import { hazardHitbox } from './kitchen.js';
import { drawHUD, drawTitleScreen, drawPauseCard, drawEndScreen } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const STAGE_TAGLINES = {
  'THE FARMYARD': 'Dodge the fences — Jed is right behind you!',
  'BARN & GARDEN': 'He is throwing knives now. Duck!',
  'THE KITCHEN': 'The oven is on. Do not get roasted!',
  'THE FOREST GATE': 'The back door is open. RUN!',
};

const game = {
  state: 'title', // title | playing | paused | caught | escaped
  score: 0,
  distanceM: 0,
  lives: 3,
  corn: 0,
  hides: 0,
  bestM: 0,
  stage: STAGES_FALLBACK(),
  stageBanner: 0,
  stageTagline: '',
  farmerProximity: 0.18,
  stumbleTimer: 0,
  time: 0,
  shot: null,
};

function STAGES_FALLBACK() {
  return { name: 'THE FARMYARD', from: 0, sky: ['#f7c873', '#f2a65a'], ground: '#8a5a2b', grass: '#7a9a3d' };
}

try {
  game.bestM = Number(window.localStorage.getItem('turkeyRunBest') || 0) || 0;
} catch (e) {
  game.bestM = 0;
}

const audio = createAudio();
const turkeyApi = createTurkey();
const farmerApi = createFarmer();
const worldApi = createWorld();
const turkey = turkeyApi.turkey;
const farmer = farmerApi.farmer;
const world = worldApi.world;

const params = new URLSearchParams(window.location.search);
game.shot = params.get('shot');

const input = createInput(canvas, {
  onPause: () => {
    if (game.state === 'playing') { game.state = 'paused'; audio.stopMusic(); }
    else if (game.state === 'paused') { game.state = 'playing'; audio.startMusic(); }
  },
  onMute: () => { audio.ensure(); audio.toggleMute(); },
  onRestart: () => { if (game.state === 'caught' || game.state === 'escaped') startRun(); },
  onStart: () => { if (game.state === 'title') startRun(); },
});

function startRun() {
  game.state = 'playing';
  game.score = 0;
  game.distanceM = 0;
  game.lives = 3;
  game.corn = 0;
  game.hides = 0;
  game.stage = stageFor(0);
  game.stageBanner = 2.2;
  game.stageTagline = STAGE_TAGLINES[game.stage.name];
  game.stumbleTimer = 0;
  turkeyApi.reset();
  farmerApi.reset();
  worldApi.reset();
  input.clearQueues();
  audio.ensure();
  audio.startMusic();
  audio.gobble();
}

function endRun(escaped) {
  game.state = escaped ? 'escaped' : 'caught';
  audio.stopMusic();
  if (escaped) audio.escaped();
  else audio.caught();
  if (game.distanceM > game.bestM) {
    game.bestM = game.distanceM;
    try { window.localStorage.setItem('turkeyRunBest', String(Math.floor(game.bestM))); } catch (e) { /* offline play, best is best-effort */ }
  }
}

function loseLife(reason) {
  if (turkey.invulnerable > 0 || game.state !== 'playing') return;
  game.lives -= 1;
  turkey.invulnerable = 1.6;
  farmerApi.farmer.proximity = Math.min(0.7, farmerApi.farmer.proximity + 0.2);
  audio.stumble();
  if (game.lives <= 0) endRun(false);
}

// --- collisions and the run -------------------------------------------------

function boxesOverlap(a, b) {
  return a && b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function obstacleHitbox(o) {
  if (o.kind === 'puddle' || o.kind === 'hose') return { x: o.x, y: GROUND_Y - 10, w: o.w, h: 10 };
  return { x: o.x + 2, y: GROUND_Y - o.h, w: o.w - 4, h: o.h };
}

function updatePlaying(dt) {
  const stage = stageFor(game.distanceM);
  if (stage.name !== game.stage.name) {
    game.stage = stage;
    game.stageBanner = 2.4;
    game.stageTagline = STAGE_TAGLINES[stage.name];
    audio.spotted();
  }
  if (game.stageBanner > 0) game.stageBanner -= dt;

  // Speed: base by distance, Left dawdles, Right hurries.
  let speed = worldApi.speedFor(game.distanceM);
  if (input.leftHeld) speed *= 0.82;
  if (input.rightHeld) speed *= 1.15;
  if (turkey.hiding) speed = 0;

  const wasStumbling = game.stumbleTimer > 0;
  if (game.stumbleTimer > 0) game.stumbleTimer -= dt;

  turkeyApi.update(dt, input, speed, audio);
  farmerApi.update(dt, speed, turkey.hiding, wasStumbling);
  game.farmerProximity = farmer.proximity;

  // Hiding: ducking behind a hay bale while the farmer is close.
  const hb = turkeyApi.hitbox();
  let nearHay = null;
  for (const o of world.obstacles) {
    if (o.hideSpot && Math.abs(o.x + o.w / 2 - TURKEY_X) < 46) nearHay = o;
  }
  if (turkey.ducking && nearHay && farmer.proximity > 0.3 && !turkey.hiding) {
    turkey.hiding = true;
    turkey.hiddenTimer = 1.4;
    game.hides += 1;
    game.score += 50;
    farmerApi.loseTrail();
    audio.hide();
  }
  if (turkey.hiding && turkey.hiddenTimer <= 0) {
    turkey.hiding = false;
    farmer.proximity = Math.max(0.22, farmer.proximity - 0.15);
  }

  worldApi.update(dt, speed, game.distanceM, turkey, farmer);
  game.distanceM = world.distancePx / 50;
  game.score += speed * dt * 0.06;

  // Pickups.
  for (const p of world.pickups) {
    if (p.taken) continue;
    const box = { x: p.x - 14, y: p.y - 16, w: 28, h: 32 };
    if (boxesOverlap(hb, box)) {
      p.taken = true;
      if (p.kind === 'corn') { game.corn += 1; game.score += 25; audio.pickup(); }
      if (p.kind === 'feather') { game.score += 100; audio.feather(); }
      if (p.kind === 'pie') { game.score += 150; game.lives = Math.min(3, game.lives + 1); audio.feather(); }
    }
  }

  // Obstacles: jumping cleanly over one scores; tripping on one stumbles.
  for (const o of world.obstacles) {
    if (!o.passed && o.x + o.w < TURKEY_X - 24) {
      o.passed = true;
      game.score += 10;
    }
    if (turkey.hiding) continue;
    if (boxesOverlap(hb, obstacleHitbox(o))) {
      if (o.kind === 'puddle' || o.kind === 'hose') {
        // A splash: a stumble, not a wound.
        if (game.stumbleTimer <= 0) {
          game.stumbleTimer = 0.9;
          game.score = Math.max(0, game.score - 15);
          audio.stumble();
        }
      } else if (turkey.invulnerable <= 0) {
        game.stumbleTimer = 0.9;
        loseLife('obstacle');
        // Knock the turkey back over the obstacle so it cannot multi-hit.
        turkey.y = GROUND_Y;
        turkey.vy = -420;
        turkey.jumps = 1;
      }
    }
  }

  // Kitchen hazards.
  for (const h of world.hazards) {
    if (h.kind === 'knifeThrow') {
      const box = { x: h.x, y: h.y, w: h.w, h: h.h };
      if (!h.hit && boxesOverlap(hb, box)) {
        h.hit = true;
        loseLife('knife');
      }
      continue;
    }
    if (!h.passed && h.x + (h.w || 60) < TURKEY_X - 24) {
      h.passed = true;
      game.score += 15;
    }
    if (!turkey.hiding && boxesOverlap(hb, hazardHitbox(h))) {
      loseLife(h.kind);
    }
  }

  // Caught by the farmer's lunge.
  if (farmerApi.isGrabbing() && farmer.state === 'lunge') {
    loseLife('farmer');
    farmer.state = 'chase';
    farmer.proximity = 0.5;
  }

  // Escape: run through the open back door.
  if (world.gateX !== null && world.gateX < TURKEY_X + 30 && world.gateX > TURKEY_X - 90) {
    endRun(true);
  }
  game.score = Math.floor(game.score);
}

// --- shot modes (posed states for the screenshots) --------------------------

function setupShot(mode) {
  if (mode === 'start') {
    game.state = 'title';
    return;
  }
  if (mode === 'end') {
    game.state = 'caught';
    game.score = 1840;
    game.distanceM = 742;
    game.corn = 23;
    game.hides = 2;
    game.lives = 0;
    game.bestM = 742;
    return;
  }
  // Playing shots: pose a real run at a fixed distance with fixed props.
  startRun();
  if (mode === 'play') {
    game.distanceM = 250;
    world.distancePx = 250 * 50;
    game.stage = stageFor(250);
    turkey.y = GROUND_Y - 90;
    turkey.vy = -180;
    turkey.jumps = 1;
    farmer.proximity = 0.45;
    game.farmerProximity = 0.45;
    farmer.state = 'chase';
    world.obstacles = [
      { kind: 'fence', x: 520, w: 34, h: 52, passed: false, hideSpot: false },
      { kind: 'hay', x: 700, w: 64, h: 58, passed: false, hideSpot: true },
      { kind: 'puddle', x: 850, w: 84, h: 10, passed: false, hideSpot: false },
    ];
    world.pickups = [
      { kind: 'corn', x: 430, y: GROUND_Y - 90, taken: false, bob: 0 },
      { kind: 'corn', x: 466, y: GROUND_Y - 110, taken: false, bob: 1 },
      { kind: 'corn', x: 502, y: GROUND_Y - 90, taken: false, bob: 2 },
      { kind: 'feather', x: 620, y: GROUND_Y - 120, taken: false, bob: 0 },
    ];
    game.score = 640;
    game.corn = 12;
    game.stageBanner = 0;
  } else if (mode === 'kitchen') {
    game.distanceM = 1350;
    world.distancePx = 1350 * 50;
    game.stage = stageFor(1350);
    game.stageBanner = 0;
    turkey.y = GROUND_Y;
    farmer.proximity = 0.72;
    game.farmerProximity = 0.72;
    farmer.state = 'corner';
    world.hazards = [
      { kind: 'oven', x: 560, w: 110, h: 96, passed: false, hit: false, flamePhase: 1.2 },
      { kind: 'knifeFall', x: 760, w: 26, h: 70, passed: false, hit: false, vy: 300, y: 120, delay: 0 },
      { kind: 'pot', x: 880, w: 56, h: 34, passed: false, hit: false },
    ];
    world.pickups = [
      { kind: 'pie', x: 420, y: GROUND_Y - 70, taken: false, bob: 0 },
      { kind: 'corn', x: 700, y: GROUND_Y - 130, taken: false, bob: 1 },
    ];
    game.score = 3120;
    game.corn = 31;
    game.lives = 2;
  }
  // Freeze the posed run: one render pass, no update, so the shot is exact.
  game.state = 'shot';
}

// --- loop and render ---------------------------------------------------------

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.time += dt;

  if (game.state === 'title') {
    if (input.consumeJump() || input.consumeClick()) startRun();
  } else if (game.state === 'playing') {
    updatePlaying(dt);
  } else if (game.state === 'caught' || game.state === 'escaped') {
    if (input.consumeJump() || input.consumeClick()) startRun();
  }

  render();
  requestAnimationFrame(frame);
}

function render() {
  const t = game.time;
  if (game.state === 'title') {
    drawTitleScreen(ctx, game, t);
    return;
  }
  if (game.state === 'caught' || game.state === 'escaped') {
    drawEndScreen(ctx, game, t);
    return;
  }

  // In-play (and the frozen posed 'shot' state): world + actors + HUD.
  drawBackground(ctx, game.stage, world.distancePx, t);
  drawGate(ctx, world.gateX, t);
  drawObstacles(ctx, world.obstacles, t);
  drawHazards(ctx, world.hazards, t);
  drawPickups(ctx, world.pickups, t);
  drawFarmer(ctx, farmerApi, farmer.runCycle);
  drawTurkey(ctx, turkey, turkey.runCycle);
  drawHUD(ctx, game);
  if (game.state === 'paused') drawPauseCard(ctx);
}

// Boot: a shot query poses the game for screenshots; otherwise the title.
// A read-only handle for play-testing and debugging (no network use).
window.__turkeyRun = game;
if (game.shot) {
  setupShot(game.shot);
  render();
} else {
  requestAnimationFrame(frame);
}
