// world.js — the farm, the garden and the kitchen.
// One job: the world the turkey runs through — stage progression, the
// obstacles and pickups ahead, and the parallax autumn scenery behind.
// Distance decides the stage: farmyard, then barn & garden, then kitchen.

import { GROUND_Y } from './turkey.js';
import { KITCHEN_START_M, makeHazard, updateHazard } from './kitchen.js';

export const STAGES = [
  { name: 'THE FARMYARD', from: 0, sky: ['#f7c873', '#f2a65a'], ground: '#8a5a2b', grass: '#7a9a3d' },
  { name: 'BARN & GARDEN', from: 600, sky: ['#f2a65a', '#e08a4e'], ground: '#7d4f24', grass: '#6d8a35' },
  { name: 'THE KITCHEN', from: 1200, sky: ['#3a2c3f', '#5d3a3a'], ground: '#4a3428', grass: '#5d3a2b' },
  { name: 'THE FOREST GATE', from: 1800, sky: ['#8fb573', '#5d8a4a'], ground: '#5d4a2b', grass: '#4a7a35' },
];

export function stageFor(distanceM) {
  let stage = STAGES[0];
  for (const s of STAGES) if (distanceM >= s.from) stage = s;
  return stage;
}

export function createWorld() {
  const world = {
    obstacles: [], // {kind, x, w, h, passed, hideSpot}
    pickups: [],   // {kind, x, y, taken, bob}
    hazards: [],   // kitchen hazards, from kitchen.js
    spawnTimer: 0,
    cornTimer: 0,
    knifeTimer: 8,
    distancePx: 0,
    gateX: null,   // the open back door appears at 1800 m
  };

  function reset() {
    world.obstacles = [];
    world.pickups = [];
    world.hazards = [];
    world.spawnTimer = 0.8;
    world.cornTimer = 0.4;
    world.knifeTimer = 8;
    world.distancePx = 0;
    world.gateX = null;
  }

  function speedFor(distanceM) {
    // The run gets faster the further the turkey gets: 260 up to 430 px/s.
    return Math.min(430, 260 + distanceM * 0.09);
  }

  function spawnObstacle(distanceM, stage) {
    const x = 1000;
    if (stage.from >= KITCHEN_START_M) {
      const roll = Math.random();
      if (roll < 0.34) world.hazards.push(makeHazard('oven', x));
      else if (roll < 0.58) world.hazards.push(makeHazard('knifeFall', x + 40));
      else if (roll < 0.8) world.hazards.push(makeHazard('pot', x));
      else world.hazards.push(makeHazard('pin', x));
      return;
    }
    const kinds = stage.from >= 600
      ? ['fence', 'crate', 'barrow', 'hose', 'hay']
      : ['fence', 'hay', 'puddle', 'fence', 'hay'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const dims = {
      fence: { w: 34, h: 52 },
      hay: { w: 64, h: 58 },
      puddle: { w: 84, h: 10 },
      crate: { w: 52, h: 52 },
      barrow: { w: 78, h: 44 },
      hose: { w: 70, h: 12 },
    }[kind];
    world.obstacles.push({ kind, x, ...dims, passed: false, hideSpot: kind === 'hay' });
  }

  function spawnCorn() {
    const kind = Math.random();
    const x = 1000;
    if (kind < 0.12) {
      world.pickups.push({ kind: 'feather', x, y: GROUND_Y - 110, taken: false, bob: 0 });
    } else if (kind < 0.24) {
      world.pickups.push({ kind: 'pie', x, y: GROUND_Y - 70, taken: false, bob: 0 });
    } else {
      // A little arc of corn kernels to hop through.
      for (let i = 0; i < 3; i++) {
        world.pickups.push({ kind: 'corn', x: x + i * 36, y: GROUND_Y - 80 - Math.sin(i * 1.1) * 30, taken: false, bob: i });
      }
    }
  }

  function update(dt, speed, distanceM, turkey, farmer) {
    const stage = stageFor(distanceM);
    world.distancePx += speed * dt;

    // The farmer throws a carving knife from the garden stage on.
    if (distanceM >= 600) {
      world.knifeTimer -= dt;
      if (world.knifeTimer <= 0) {
        world.knifeTimer = 5 + Math.random() * 3;
        world.hazards.push({ kind: 'knifeThrow', x: -40, y: GROUND_Y - 78, vx: 520, passed: false, hit: false, w: 46, h: 12 });
      }
    }

    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      world.spawnTimer = 0.75 + Math.random() * 0.7 - Math.min(0.35, distanceM * 0.00012);
      spawnObstacle(distanceM, stage);
    }
    world.cornTimer -= dt;
    if (world.cornTimer <= 0) {
      world.cornTimer = 1.6 + Math.random() * 1.4;
      spawnCorn();
    }

    for (const o of world.obstacles) o.x -= speed * dt;
    for (const p of world.pickups) { p.x -= speed * dt; p.bob += dt * 4; }
    for (const h of world.hazards) {
      if (h.kind === 'knifeThrow') h.x += h.vx * dt;
      else h.x -= speed * dt;
      updateHazard(h, dt, speed);
    }
    world.obstacles = world.obstacles.filter((o) => o.x > -140);
    world.pickups = world.pickups.filter((p) => p.x > -60 && !p.taken);
    world.hazards = world.hazards.filter((h) => h.x > -160 && h.x < 1200);

    // The open back door: run through it at 1800 m and you are free.
    if (distanceM >= 1780 && world.gateX === null) world.gateX = 1000;
    if (world.gateX !== null) world.gateX -= speed * dt;
  }

  return { world, reset, speedFor, stageFor, update };
}

// --- drawing ---------------------------------------------------------------

import { drawHazard } from './kitchen.js';

export function drawBackground(ctx, stage, distancePx, t) {
  const W = 960, H = 540;
  // Sky gradient for the current stage.
  const grad = ctx.createLinearGradient(0, 0, 0, 420);
  grad.addColorStop(0, stage.sky[0]);
  grad.addColorStop(1, stage.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 430);

  // Sun (or the kitchen window's warm glow in the kitchen stage).
  ctx.fillStyle = stage.from >= 1200 ? 'rgba(255, 210, 62, 0.85)' : '#fff3c4';
  ctx.beginPath();
  ctx.arc(820, 84, 34, 0, Math.PI * 2);
  ctx.fill();

  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 248, 231, 0.85)';
  for (let i = 0; i < 3; i++) {
    const cx = ((i * 360 - distancePx * 0.12) % 1100 + 1100) % 1100 - 60;
    const cy = 60 + i * 42;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 34, cy + 6, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant hills and the barn silhouette.
  ctx.fillStyle = stage.from >= 1200 ? '#2e2130' : '#a86f2e';
  ctx.beginPath();
  ctx.moveTo(0, 430);
  for (let x = 0; x <= W; x += 60) {
    ctx.lineTo(x, 400 + Math.sin((x + distancePx * 0.05) * 0.01) * 18);
  }
  ctx.lineTo(W, 430);
  ctx.closePath();
  ctx.fill();

  if (stage.from < 1200) {
    // The red barn, sliding past in the distance.
    const bx = ((720 - distancePx * 0.25) % 1400 + 1400) % 1400 - 200;
    ctx.fillStyle = '#a93226';
    ctx.fillRect(bx, 330, 130, 100);
    ctx.beginPath();
    ctx.moveTo(bx - 10, 332);
    ctx.lineTo(bx + 65, 292);
    ctx.lineTo(bx + 140, 332);
    ctx.closePath();
    ctx.fillStyle = '#7a2a1e';
    ctx.fill();
    ctx.fillStyle = '#f5ead6';
    ctx.beginPath();
    ctx.arc(bx + 65, 380, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a93226';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx + 65, 362); ctx.lineTo(bx + 65, 398);
    ctx.moveTo(bx + 47, 380); ctx.lineTo(bx + 83, 380);
    ctx.stroke();
  }

  // Fence posts scrolling past, closer and faster.
  ctx.fillStyle = '#6d4a22';
  for (let i = 0; i < 12; i++) {
    const fx = ((i * 96 - distancePx * 0.6) % 1152 + 1152) % 1152 - 96;
    ctx.fillRect(fx, 400, 8, 52);
    ctx.fillRect(fx - 4, 394, 16, 8);
  }
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, 430, W, 22);
  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, 452, W, 88);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(0, 452, W, 4);
  // Scattered autumn leaves on the ground.
  ctx.fillStyle = '#c96a1e';
  for (let i = 0; i < 8; i++) {
    const lx = ((i * 137 - distancePx * 1.0) % 1100 + 1100) % 1100 - 60;
    ctx.beginPath();
    ctx.ellipse(lx, 470 + (i % 3) * 14, 7, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawObstacles(ctx, obstacles, t) {
  for (const o of obstacles) {
    const top = GROUND_Y - o.h;
    if (o.kind === 'fence') {
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(o.x, top, 6, o.h);
      ctx.fillRect(o.x + o.w - 6, top, 6, o.h);
      ctx.fillStyle = '#a86f2e';
      ctx.fillRect(o.x - 4, top + 8, o.w + 8, 8);
      ctx.fillRect(o.x - 4, top + 28, o.w + 8, 8);
    } else if (o.kind === 'hay') {
      // A hay bale: jump it, or duck behind it to hide from the farmer.
      ctx.fillStyle = '#d9a83e';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, GROUND_Y - o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a87c1e';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, GROUND_Y - o.h / 2, o.w / 2 - 6, o.h / 2 - 6 + i * 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(122, 74, 33, 0.9)';
      ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDE!', o.x + o.w / 2, GROUND_Y - o.h - 6);
    } else if (o.kind === 'puddle') {
      ctx.fillStyle = '#5d8a9a';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, GROUND_Y - 2, o.w / 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2 - 14, GROUND_Y - 4, 16, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.kind === 'crate') {
      ctx.fillStyle = '#a86f2e';
      ctx.fillRect(o.x, top, o.w, o.h);
      ctx.strokeStyle = '#7a4a21';
      ctx.lineWidth = 3;
      ctx.strokeRect(o.x + 2, top + 2, o.w - 4, o.h - 4);
      ctx.beginPath();
      ctx.moveTo(o.x, top); ctx.lineTo(o.x + o.w, top + o.h);
      ctx.moveTo(o.x + o.w, top); ctx.lineTo(o.x, top + o.h);
      ctx.stroke();
    } else if (o.kind === 'barrow') {
      ctx.fillStyle = '#7a4a21';
      ctx.beginPath();
      ctx.moveTo(o.x, top + 8);
      ctx.lineTo(o.x + o.w, top);
      ctx.lineTo(o.x + o.w - 8, top + o.h - 10);
      ctx.lineTo(o.x + 8, top + o.h - 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.arc(o.x + o.w - 14, GROUND_Y - 8, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c96a1e';
      ctx.beginPath();
      ctx.arc(o.x + 20, top + 2, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.kind === 'hose') {
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(o.x, GROUND_Y);
      ctx.quadraticCurveTo(o.x + o.w / 2, GROUND_Y - 22, o.x + o.w, GROUND_Y);
      ctx.stroke();
    }
  }
}

export function drawPickups(ctx, pickups, t) {
  for (const p of pickups) {
    const bobY = Math.sin(p.bob) * 4;
    if (p.kind === 'corn') {
      ctx.fillStyle = '#ffd23e';
      ctx.save();
      ctx.translate(p.x, p.y + bobY);
      ctx.rotate(0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8a91c';
      ctx.beginPath();
      ctx.ellipse(0, -4, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'feather') {
      ctx.save();
      ctx.translate(p.x, p.y + bobY);
      ctx.rotate(Math.sin(p.bob * 0.5) * 0.3);
      ctx.fillStyle = '#e08a2e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.ellipse(0, -4, 3, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawPickupLabel(ctx, 'GOLDEN FEATHER +100', p.x, p.y + 30 + bobY);
    } else if (p.kind === 'pie') {
      ctx.save();
      ctx.translate(p.x, p.y + bobY);
      ctx.fillStyle = '#c96a1e';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 18, -0.4, 1.1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f5ead6';
      ctx.beginPath();
      ctx.arc(0, 0, 13, -0.4, 1.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      drawPickupLabel(ctx, 'PIE +150', p.x, p.y + 30 + bobY);
    }
  }
}

// Pickup labels get a dark outline so they stay readable over any scenery.
function drawPickupLabel(ctx, text, x, y) {
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(43, 26, 14, 0.9)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(text, x, y);
}

export function drawHazards(ctx, hazards, t) {
  for (const h of hazards) {
    if (h.kind === 'knifeThrow') {
      // The farmer's thrown carving knife: duck under it.
      ctx.save();
      ctx.translate(h.x + 23, h.y + 6);
      ctx.rotate(0.06);
      ctx.fillStyle = '#dfe6ea';
      ctx.beginPath();
      ctx.moveTo(-20, -5);
      ctx.lineTo(12, -5);
      ctx.lineTo(22, 0);
      ctx.lineTo(12, 5);
      ctx.lineTo(-20, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5d3a18';
      ctx.fillRect(-28, -6, 10, 12);
      ctx.restore();
    } else {
      drawHazard(ctx, h, t);
    }
  }
}

export function drawGate(ctx, gateX, t) {
  if (gateX === null || gateX < -80) return;
  // The open back door: warm light, the forest beyond, freedom.
  ctx.fillStyle = '#2e4a22';
  ctx.fillRect(gateX, GROUND_Y - 150, 90, 150);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(gateX + 8, GROUND_Y - 140, 74, 140);
  ctx.fillStyle = '#5d8a4a';
  ctx.beginPath();
  ctx.moveTo(gateX + 45, GROUND_Y - 140);
  ctx.lineTo(gateX + 15, GROUND_Y - 60);
  ctx.lineTo(gateX + 75, GROUND_Y - 60);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a4a21';
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM →', gateX + 45, GROUND_Y - 160);
}
