// turkey.js — the player: Tom the turkey.
// One job: the turkey's physics (run, jump, double jump, duck, hide),
// its hitbox, and its hand-drawn canvas art with a running animation.

export const TURKEY_X = 180;
export const GROUND_Y = 452;
export const TURKEY_W = 64;
export const TURKEY_H = 58;

export function createTurkey() {
  const turkey = {
    x: TURKEY_X,
    y: GROUND_Y,
    vy: 0,
    jumps: 0,
    ducking: false,
    hiding: false,
    hiddenTimer: 0,
    invulnerable: 0,
    runCycle: 0,
    facing: 1,
    dead: false,
  };

  function reset() {
    turkey.y = GROUND_Y;
    turkey.vy = 0;
    turkey.jumps = 0;
    turkey.ducking = false;
    turkey.hiding = false;
    turkey.hiddenTimer = 0;
    turkey.invulnerable = 0;
    turkey.runCycle = 0;
    turkey.dead = false;
  }

  function tryJump(audio) {
    if (turkey.hiding) return false;
    if (turkey.jumps === 0 && turkey.y >= GROUND_Y - 0.5) {
      turkey.vy = -640;
      turkey.jumps = 1;
      turkey.ducking = false;
      if (audio) audio.jump();
      return true;
    }
    if (turkey.jumps === 1) {
      turkey.vy = -560;
      turkey.jumps = 2;
      if (audio) audio.doubleJump();
      return true;
    }
    return false;
  }

  function update(dt, input, speed, audio) {
    if (turkey.dead) return;
    if (turkey.invulnerable > 0) turkey.invulnerable -= dt;
    if (turkey.hiddenTimer > 0) turkey.hiddenTimer -= dt;

    turkey.ducking = input.duckHeld && turkey.y >= GROUND_Y - 0.5 && !turkey.hiding;

    if (input.consumeJump()) tryJump(audio);

    // Gravity and landing.
    turkey.vy += 1750 * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= GROUND_Y) {
      turkey.y = GROUND_Y;
      turkey.vy = 0;
      turkey.jumps = 0;
    }

    // Run cycle drives the legs and the bob.
    if (turkey.y >= GROUND_Y - 0.5) {
      turkey.runCycle += dt * (speed / 26);
    } else {
      turkey.runCycle += dt * 6;
    }
  }

  // Current collision box: smaller while ducking, none while hidden.
  function hitbox() {
    if (turkey.hiding) return null;
    if (turkey.ducking) return { x: turkey.x - 26, y: turkey.y - 30, w: 56, h: 30 };
    return { x: turkey.x - 24, y: turkey.y - 56, w: 52, h: 56 };
  }

  return { turkey, reset, tryJump, update, hitbox, drawTurkey };
}

// --- drawing ---------------------------------------------------------------

export function drawTurkey(ctx, t, runCycle, opts) {
  const { x, y, ducking, hiding, invulnerable } = t;
  if (hiding) return; // tucked behind the hay bale, out of sight
  if (invulnerable > 0 && Math.floor(invulnerable * 12) % 2 === 0) return; // blink

  ctx.save();
  ctx.translate(x, y);

  const airborne = y < GROUND_Y - 2;
  const legSwing = airborne ? 0.5 : Math.sin(runCycle) * 0.9;
  const bob = airborne ? 0 : Math.abs(Math.sin(runCycle)) * 2;
  const squash = ducking ? 0.62 : 1;

  // Tail fan: five autumn feathers fanning out behind.
  const featherColors = ['#c96a1e', '#a34d12', '#e08a2e', '#8a3d0f', '#d98e32'];
  ctx.save();
  ctx.translate(-26, -30 * squash);
  ctx.rotate(-0.25);
  for (let i = 0; i < 5; i++) {
    const angle = -0.9 + i * 0.45;
    const sway = airborne ? Math.sin(runCycle * 2 + i) * 0.06 : 0;
    ctx.save();
    ctx.rotate(angle + sway);
    ctx.fillStyle = featherColors[i];
    ctx.beginPath();
    ctx.ellipse(0, -26, 9, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 150, 0.85)';
    ctx.beginPath();
    ctx.ellipse(0, -30, 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Legs: two orange sticks with a run cycle.
  ctx.strokeStyle = '#e8862e';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const legY = -2 + bob * 0.4;
  ctx.beginPath();
  ctx.moveTo(-6, -14 * squash);
  ctx.lineTo(-6 + legSwing * 12, legY);
  ctx.moveTo(8, -14 * squash);
  ctx.lineTo(8 - legSwing * 12, legY);
  ctx.stroke();

  // Body: a plump brown oval.
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.ellipse(0, -30 * squash + bob, 30, 24 * squash, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8f5a2b';
  ctx.beginPath();
  ctx.ellipse(4, -34 * squash + bob, 22, 18 * squash, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing, flapping a little while airborne.
  const wingFlap = airborne ? Math.sin(runCycle * 1.4) * 0.5 - 0.4 : 0.15;
  ctx.save();
  ctx.translate(-4, -30 * squash + bob);
  ctx.rotate(wingFlap);
  ctx.fillStyle = '#5d3a18';
  ctx.beginPath();
  ctx.ellipse(-8, 0, 16, 9, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Neck and head, bobbing forward as he runs.
  const headBob = Math.sin(runCycle * 2) * 1.5;
  ctx.fillStyle = '#8f5a2b';
  ctx.fillRect(20, -58 * squash + bob + headBob, 10, 26 * squash);
  // Head.
  ctx.fillStyle = '#c96a1e';
  ctx.beginPath();
  ctx.arc(26, -60 * squash + bob + headBob, 12, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#f2a71b';
  ctx.beginPath();
  ctx.moveTo(36, -62 * squash + bob + headBob);
  ctx.lineTo(48, -58 * squash + bob + headBob);
  ctx.lineTo(36, -54 * squash + bob + headBob);
  ctx.closePath();
  ctx.fill();
  // Wattle: the red dangle that says "turkey".
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(36, -50 * squash + bob + headBob, 4, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye: wide, slightly panicked.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(29, -64 * squash + bob + headBob, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(30.5, -64 * squash + bob + headBob, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
