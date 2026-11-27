// farmer.js — Farmer Jed, the chaser.
// One job: the farmer's AI — he chases, he searches when he loses the
// turkey, he corners it when he gets close — plus his hand-drawn art.
// Proximity 0 = far behind the screen edge, 1 = he has the turkey.

export function createFarmer() {
  const farmer = {
    proximity: 0.18, // how close he is to grabbing the turkey
    state: 'chase', // chase | search | corner | lunge
    stateTimer: 0,
    runCycle: 0,
    searchCount: 0,
    caughtFlash: 0,
  };

  function reset() {
    farmer.proximity = 0.18;
    farmer.state = 'chase';
    farmer.stateTimer = 0;
    farmer.runCycle = 0;
    farmer.searchCount = 0;
    farmer.caughtFlash = 0;
  }

  // Called when the turkey hides behind a hay bale: Jed stops, looks
  // around, scratches his head, and loses the trail.
  function loseTrail() {
    if (farmer.state === 'chase' || farmer.state === 'corner') {
      farmer.state = 'search';
      farmer.stateTimer = 1.6;
      farmer.searchCount += 1;
    }
  }

  function update(dt, speed, turkeyHidden, stumbling) {
    farmer.runCycle += dt * (speed / 24);
    if (farmer.caughtFlash > 0) farmer.caughtFlash -= dt;
    if (farmer.stateTimer > 0) farmer.stateTimer -= dt;

    if (farmer.state === 'search') {
      // While searching he stands still; the trail goes cold.
      farmer.proximity = Math.max(0.12, farmer.proximity - 0.22 * dt);
      if (farmer.stateTimer <= 0) {
        farmer.state = 'chase';
        farmer.proximity = Math.max(farmer.proximity, 0.25);
      }
      return;
    }

    if (turkeyHidden) {
      farmer.proximity = Math.max(0.1, farmer.proximity - 0.3 * dt);
      return;
    }

    // Chase: he gains when the turkey stumbles or dawdles, loses ground
    // when the turkey runs clean and fast.
    if (stumbling) {
      farmer.proximity += 0.35 * dt;
    } else if (speed > 300) {
      farmer.proximity -= 0.028 * dt;
    } else {
      farmer.proximity += 0.012 * dt;
    }
    farmer.proximity = Math.max(0.08, Math.min(1, farmer.proximity));

    if (farmer.proximity >= 0.85 && farmer.state === 'chase') {
      farmer.state = 'corner';
      farmer.stateTimer = 1.1;
    } else if (farmer.state === 'corner' && farmer.stateTimer <= 0) {
      farmer.state = 'lunge';
      farmer.stateTimer = 0.5;
    } else if (farmer.state === 'lunge' && farmer.stateTimer <= 0) {
      farmer.state = 'chase';
      farmer.proximity = 0.55;
    }
  }

  // Screen x of the farmer: he slides in from the left as proximity grows.
  function screenX() {
    const base = -70 + farmer.proximity * 190;
    if (farmer.state === 'lunge') return base + 46;
    return base;
  }

  function isGrabbing() {
    return farmer.state === 'lunge' || farmer.proximity >= 1;
  }

  return { farmer, reset, loseTrail, update, screenX, isGrabbing, drawFarmer };
}
// --- drawing ---------------------------------------------------------------

import { GROUND_Y } from './turkey.js';

export function drawFarmer(ctx, f, runCycle) {
  const x = f.screenX();
  const y = GROUND_Y;
  if (x < -110) return; // still off-screen, only his grumbling is near

  ctx.save();
  ctx.translate(x, y);

  const swing = Math.sin(runCycle) * 0.8;
  const bob = Math.abs(Math.sin(runCycle)) * 2;
  const searching = f.farmer.state === 'search';
  const lunging = f.farmer.state === 'lunge';
  const cornered = f.farmer.state === 'corner';

  // Legs: blue overalls, pumping hard.
  ctx.strokeStyle = '#2f4d7a';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -44);
  ctx.lineTo(-8 + (searching ? 0 : swing * 14), -2 + bob * 0.3);
  ctx.moveTo(10, -44);
  ctx.lineTo(10 - (searching ? 0 : swing * 14), -2 + bob * 0.3);
  ctx.stroke();

  // Body: red plaid shirt under denim overalls.
  ctx.fillStyle = '#a93226';
  ctx.beginPath();
  ctx.roundRect(-20, -92 + bob, 44, 52, 8);
  ctx.fill();
  ctx.fillStyle = '#2f4d7a';
  ctx.beginPath();
  ctx.roundRect(-20, -70 + bob, 44, 30, 6);
  ctx.fill();
  // Overall straps.
  ctx.fillStyle = '#2f4d7a';
  ctx.fillRect(-14, -92 + bob, 7, 24);
  ctx.fillRect(8, -92 + bob, 7, 24);

  // Arm reaching forward with the butterfly net.
  ctx.strokeStyle = '#a93226';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(16, -84 + bob);
  ctx.lineTo(lunging ? 52 : 38, -72 + bob - (lunging ? 10 : 0));
  ctx.stroke();
  // The net: a hoop and mesh, always just a little too slow.
  ctx.save();
  ctx.translate(lunging ? 58 : 44, -76 + bob - (lunging ? 12 : 0));
  ctx.rotate(0.5);
  ctx.strokeStyle = '#7a4a21';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(i * 7, -13); ctx.lineTo(i * 7, 13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, i * 5); ctx.lineTo(18, i * 5); ctx.stroke();
  }
  ctx.restore();

  // Other arm pumping behind.
  ctx.strokeStyle = '#a93226';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-16, -84 + bob);
  ctx.lineTo(-30, -62 + bob + (searching ? 0 : swing * 8));
  ctx.stroke();

  // Head: sun-reddened, mustached, determined.
  ctx.fillStyle = '#e8b88a';
  ctx.beginPath();
  ctx.arc(4, -104 + bob, 15, 0, Math.PI * 2);
  ctx.fill();
  // Mustache.
  ctx.fillStyle = '#5d3a18';
  ctx.beginPath();
  ctx.ellipse(10, -98 + bob, 9, 3.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Angry eyebrows.
  ctx.strokeStyle = '#5d3a18';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(6, -112 + bob); ctx.lineTo(14, -109 + bob);
  ctx.moveTo(20, -109 + bob); ctx.lineTo(26, -112 + bob);
  ctx.stroke();
  // Eyes.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(11, -107 + bob, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(21, -107 + bob, 1.8, 0, Math.PI * 2); ctx.fill();

  // Straw hat.
  ctx.fillStyle = '#e8c85a';
  ctx.beginPath();
  ctx.ellipse(4, -116 + bob, 24, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -119 + bob, 13, 7, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#a93226';
  ctx.fillRect(-9, -120 + bob, 26, 4);

  // Speech bubble: "?" while searching, "!" when cornering the turkey.
  if (searching || cornered) {
    const label = searching ? '?' : '!';
    const bx = 34, by = -148 + bob;
    ctx.fillStyle = '#fff8e7';
    ctx.strokeStyle = '#7a4a21';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, 30, 30, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + 8, by + 30); ctx.lineTo(bx + 2, by + 40); ctx.lineTo(bx + 16, by + 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cornered ? '#c0392b' : '#7a4a21';
    ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + 15, by + 16);
  }

  ctx.restore();
}
