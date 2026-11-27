// kitchen.js — the kitchen stage's dangers.
// One job: the hazards of the final stretch — the roaring oven, the
// falling carving knives, the pots and the rolling pin — and their art.
// The oven is the boss of this stage: jump its flames or get roasted.

import { GROUND_Y } from './turkey.js';

export const KITCHEN_START_M = 1200;
export const ESCAPE_M = 1800;

// A hazard the world spawns ahead of the turkey.
export function makeHazard(kind, x) {
  const base = { kind, x, passed: false, hit: false };
  if (kind === 'oven') return { ...base, w: 110, h: 96, flamePhase: Math.random() * 6 };
  if (kind === 'knifeFall') return { ...base, w: 26, h: 70, vy: 0, y: -80, delay: 0.4 + Math.random() * 0.6 };
  if (kind === 'pot') return { ...base, w: 56, h: 34 };
  if (kind === 'pin') return { ...base, w: 64, h: 18, rollPhase: Math.random() * 6 };
  return base;
}

export function hazardHitbox(h) {
  if (h.kind === 'oven') return { x: h.x, y: GROUND_Y - 96, w: 110, h: 96 };
  if (h.kind === 'knifeFall') return { x: h.x + 4, y: h.y, w: 18, h: 70 };
  if (h.kind === 'pot') return { x: h.x, y: GROUND_Y - 34, w: 56, h: 34 };
  if (h.kind === 'pin') return { x: h.x, y: GROUND_Y - 18, w: 64, h: 18 };
  return { x: h.x, y: GROUND_Y - 40, w: 40, h: 40 };
}

export function updateHazard(h, dt, speed) {
  if (h.kind === 'knifeFall') {
    if (h.delay > 0) {
      h.delay -= dt;
    } else {
      h.vy += 1400 * dt;
      h.y += h.vy * dt;
      if (h.y > GROUND_Y - 70) h.y = GROUND_Y - 70; // stuck in the floorboards
    }
  }
  if (h.kind === 'pin') h.rollPhase += dt * speed * 0.02;
  if (h.kind === 'oven') h.flamePhase += dt * 9;
}

// --- drawing ---------------------------------------------------------------

export function drawHazard(ctx, h, t) {
  if (h.kind === 'oven') return drawOven(ctx, h, t);
  if (h.kind === 'knifeFall') return drawFallingKnife(ctx, h, t);
  if (h.kind === 'pot') return drawPot(ctx, h);
  if (h.kind === 'pin') return drawRollingPin(ctx, h);
}

function drawOven(ctx, h, t) {
  const x = h.x;
  const top = GROUND_Y - 96;
  // Body: cream enamel with a black window and a row of knobs.
  ctx.fillStyle = '#f5ead6';
  ctx.beginPath();
  ctx.roundRect(x, top, 110, 96, 6);
  ctx.fill();
  ctx.strokeStyle = '#8a7a5f';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#3a2c1c';
  ctx.beginPath();
  ctx.roundRect(x + 12, top + 34, 86, 46, 5);
  ctx.fill();
  // Fire glowing inside the window.
  const flick = Math.sin(h.flamePhase) * 4;
  ctx.fillStyle = '#ff7b24';
  ctx.beginPath();
  ctx.ellipse(x + 55, top + 62, 30, 12 + flick, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath();
  ctx.ellipse(x + 55, top + 64, 18, 7 + flick * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Knobs and the "ROAST" dial.
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(x + 22 + i * 22, top + 16, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#7a4a21';
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  // Flames licking out of the open door — the part that bites.
  for (let i = 0; i < 3; i++) {
    const fx = x + 24 + i * 30;
    const fh = 26 + Math.sin(h.flamePhase + i * 2) * 8;
    ctx.fillStyle = i === 1 ? '#ffd23e' : '#ff7b24';
    ctx.beginPath();
    ctx.moveTo(fx - 10, GROUND_Y);
    ctx.quadraticCurveTo(fx, GROUND_Y - fh, fx + 10, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#7a4a21';
  ctx.fillText('ROAST', x + 55, top + 90);
  // Warning sign above.
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.fillText('HOT! HOT!', x + 55, top - 10);
}

function drawFallingKnife(ctx, h, t) {
  if (h.delay > 0) {
    // A glint warns where it will land.
    ctx.fillStyle = 'rgba(192, 57, 43, 0.8)';
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', h.x + 13, GROUND_Y - 4);
    return;
  }
  const x = h.x + 13;
  const y = h.y;
  ctx.save();
  ctx.translate(x, y + 35);
  // Blade.
  ctx.fillStyle = '#dfe6ea';
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, -34);
  ctx.lineTo(5, -34);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Handle.
  ctx.fillStyle = '#5d3a18';
  ctx.beginPath();
  ctx.roundRect(-6, 6, 12, 26, 4);
  ctx.fill();
  ctx.restore();
}

function drawPot(ctx, h) {
  const x = h.x;
  const top = GROUND_Y - 34;
  ctx.fillStyle = '#4a4a55';
  ctx.beginPath();
  ctx.roundRect(x, top, 56, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#6a6a78';
  ctx.beginPath();
  ctx.ellipse(x + 28, top + 2, 28, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Steam curls: it is boiling, do not step in it.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 16 + i * 22, top - 2);
    ctx.quadraticCurveTo(x + 12 + i * 22, top - 14, x + 18 + i * 22, top - 22);
    ctx.stroke();
  }
}

function drawRollingPin(ctx, h) {
  const x = h.x;
  const y = GROUND_Y - 9;
  ctx.save();
  ctx.translate(x + 32, y);
  ctx.rotate(Math.sin(h.rollPhase) * 0.15);
  ctx.fillStyle = '#d9a066';
  ctx.beginPath();
  ctx.roundRect(-32, -8, 64, 16, 8);
  ctx.fill();
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.arc(-34, 0, 5, 0, Math.PI * 2);
  ctx.arc(34, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
