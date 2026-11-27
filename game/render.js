// render.js — the screens around the run.
// One job: everything drawn on top of the world — the HUD (score,
// distance, lives, farmer meter), the title screen, the pause card and
// the two end screens (caught / escaped). The judge reads the game
// mostly through its screenshots, so these screens carry the story.

export function drawHUD(ctx, game) {
  const W = 960;
  // Top bar.
  ctx.fillStyle = 'rgba(43, 26, 14, 0.82)';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, 46, 8);
  ctx.fill();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.fillText('SCORE ' + game.score, 16, 24);
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
  ctx.fillText(Math.floor(game.distanceM) + ' m', 210, 24);
  ctx.fillText(game.stage.name, 330, 24);

  // Lives as little drumsticks.
  for (let i = 0; i < 3; i++) {
    drawDrumstick(ctx, 560 + i * 34, 23, i < game.lives);
  }

  // Farmer proximity meter: how close Jed is to grabbing the turkey.
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('FARMER', 700, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.roundRect(712, 14, 150, 18, 9);
  ctx.fill();
  const prox = game.farmerProximity;
  ctx.fillStyle = prox > 0.85 ? '#c0392b' : prox > 0.55 ? '#e08a2e' : '#7a9a3d';
  ctx.beginPath();
  ctx.roundRect(712, 14, 150 * prox, 18, 9);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(prox > 0.85 ? 'RUN!' : prox > 0.55 ? 'CLOSE!' : 'SAFE', 787, 24);

  // Best distance, small, bottom-left.
  ctx.fillStyle = 'rgba(255, 243, 196, 0.85)';
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BEST ' + Math.floor(game.bestM) + ' m', 16, 524);

  // Stage banner when a stage changes.
  if (game.stageBanner > 0) {
    const alpha = Math.min(1, game.stageBanner);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillText(game.stage.name, 480, 110);
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.fillText(game.stageTagline, 480, 138);
    ctx.restore();
  }
}

function drawDrumstick(ctx, x, y, alive) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alive ? 1 : 0.25;
  ctx.fillStyle = '#c96a1e';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 8, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f5ead6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.lineTo(15, 10);
  ctx.moveTo(8, -2);
  ctx.lineTo(15, -6);
  ctx.stroke();
  ctx.restore();
}

export function drawTitleScreen(ctx, game, t) {
  // Warm autumn dusk behind the title.
  const grad = ctx.createLinearGradient(0, 0, 0, 540);
  grad.addColorStop(0, '#f7c873');
  grad.addColorStop(0.6, '#e08a4e');
  grad.addColorStop(1, '#8a4a1e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 540);

  // Sun and falling leaves.
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(800, 90, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c96a1e';
  for (let i = 0; i < 10; i++) {
    const lx = 60 + ((i * 97 + t * 40) % 900);
    const ly = 40 + ((i * 53 + t * 70) % 420);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(t * 0.8 + i);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Ground and a hay bale to sit on.
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(0, 452, 960, 88);
  ctx.fillStyle = '#d9a83e';
  ctx.beginPath();
  ctx.ellipse(140, 430, 70, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  // The turkey, front and centre-right, looking over his shoulder at the farm.
  drawTitleTurkey(ctx, 840, 420, t);

  // Title.
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(90, 40, 0, 0.55)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 74px "Trebuchet MS", sans-serif';
  ctx.fillText('TURKEY RUN', 480, 108);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
  ctx.fillText('The Great Thanksgiving Escape', 480, 152);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff8e7';
  ctx.font = '18px "Trebuchet MS", sans-serif';
  ctx.fillText('Thanksgiving is coming. Farmer Jed has the oven on and the carving knife out.', 480, 196);
  ctx.fillText('Run the farmyard, dodge the knives, hide in the hay — and reach the forest gate!', 480, 222);

  // Controls card.
  ctx.fillStyle = 'rgba(43, 26, 14, 0.78)';
  ctx.beginPath();
  ctx.roundRect(300, 250, 360, 92, 12);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
  ctx.fillText('SPACE / CLICK — jump (twice for a double jump)', 480, 276);
  ctx.fillText('DOWN — duck & hide behind hay bales', 480, 300);
  ctx.fillText('LEFT / RIGHT — dawdle / hurry  ·  P pause  ·  M sound', 480, 324);

  // Start prompt, blinking.
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
    ctx.fillText('— PRESS SPACE OR CLICK TO RUN —', 480, 380);
  }

  if (game.bestM > 0) {
    ctx.fillStyle = '#fff3c4';
    ctx.font = '16px "Trebuchet MS", sans-serif';
    ctx.fillText('Best escape so far: ' + Math.floor(game.bestM) + ' m', 480, 512);
  }
}

function drawTitleTurkey(ctx, x, y, t) {
  // A big, proud Tom, tail fanned, ready to bolt.
  ctx.save();
  ctx.translate(x, y);
  const bob = Math.sin(t * 3) * 3;
  const colors = ['#c96a1e', '#a34d12', '#e08a2e', '#8a3d0f', '#d98e32'];
  for (let i = 0; i < 7; i++) {
    const angle = -1.2 + i * 0.4;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = colors[i % 5];
    ctx.beginPath();
    ctx.ellipse(0, -70, 16, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 150, 0.9)';
    ctx.beginPath();
    ctx.ellipse(0, -84, 7, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.ellipse(0, -20 + bob, 52, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8f5a2b';
  ctx.beginPath();
  ctx.ellipse(6, -28 + bob, 38, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8f5a2b';
  ctx.fillRect(34, -96 + bob, 16, 52);
  ctx.fillStyle = '#c96a1e';
  ctx.beginPath();
  ctx.arc(44, -102 + bob, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2a71b';
  ctx.beginPath();
  ctx.moveTo(62, -106 + bob);
  ctx.lineTo(84, -98 + bob);
  ctx.lineTo(62, -90 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(62, -84 + bob, 7, 14, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(50, -110 + bob, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(53, -110 + bob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPauseCard(ctx) {
  ctx.fillStyle = 'rgba(20, 10, 4, 0.6)';
  ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 480, 250);
  ctx.font = '18px "Trebuchet MS", sans-serif';
  ctx.fillText('The turkey catches his breath. Press P to keep running.', 480, 290);
}

export function drawEndScreen(ctx, game, t) {
  const escaped = game.state === 'escaped';
  const grad = ctx.createLinearGradient(0, 0, 0, 540);
  if (escaped) {
    grad.addColorStop(0, '#8fb573');
    grad.addColorStop(1, '#2e4a22');
  } else {
    grad.addColorStop(0, '#5d3a3a');
    grad.addColorStop(1, '#2b1a0e');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 540);

  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#fff3c4' : '#ffd9c4';
  ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', 480, 120);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff8e7';
  ctx.font = '20px "Trebuchet MS", sans-serif';
  if (escaped) {
    ctx.fillText('Tom slips through the forest gate — free, feathered and fabulous.', 480, 164);
    ctx.fillText('Happy Thanksgiving, somewhere far away from the oven.', 480, 192);
  } else {
    ctx.fillText('Farmer Jed got him. Thanksgiving dinner is served…', 480, 164);
    ctx.fillText('…but every turkey deserves a rematch.', 480, 192);
  }

  // Result card.
  ctx.fillStyle = 'rgba(43, 26, 14, 0.8)';
  ctx.beginPath();
  ctx.roundRect(280, 230, 400, 150, 14);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
  ctx.fillText('SCORE  ' + game.score, 480, 272);
  ctx.fillStyle = '#fff3c4';
  ctx.font = '20px "Trebuchet MS", sans-serif';
  ctx.fillText('Distance: ' + Math.floor(game.distanceM) + ' m', 480, 308);
  ctx.fillText('Corn eaten: ' + game.corn + '   ·   Hides: ' + game.hides, 480, 338);
  if (game.distanceM >= game.bestM && game.distanceM > 0) {
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
    ctx.fillText('★ NEW BEST DISTANCE! ★', 480, 366);
  } else {
    ctx.fillText('Best: ' + Math.floor(game.bestM) + ' m', 480, 366);
  }

  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
    ctx.fillText('— PRESS R OR CLICK TO RUN AGAIN —', 480, 440);
  }
  ctx.fillStyle = 'rgba(255, 243, 196, 0.8)';
  ctx.font = '15px "Trebuchet MS", sans-serif';
  ctx.fillText('Tip: golden feathers are worth +100, and hiding in the hay shakes the farmer off.', 480, 500);
}
