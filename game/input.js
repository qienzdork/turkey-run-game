// input.js — keyboard + mouse input for Turkey Run.
// One job: turn raw key and pointer events into game intents (jump, duck,
// pause, mute, restart, start). Edge-triggered jumps are queued so a press
// during a frame is never lost.

export function createInput(canvas, hooks) {
  const keys = new Set();
  let jumpQueue = 0;
  let clickQueue = 0;

  function isJumpKey(code) {
    return code === 'Space' || code === 'ArrowUp' || code === 'KeyW';
  }
  function isDuckKey(code) {
    return code === 'ArrowDown' || code === 'KeyS';
  }

  function onKeyDown(event) {
    if (isJumpKey(event.code) || event.code === 'ArrowDown') event.preventDefault();
    if (event.repeat) return;
    keys.add(event.code);
    if (isJumpKey(event.code)) jumpQueue += 1;
    if (event.code === 'KeyP' || event.code === 'Escape') hooks.onPause();
    if (event.code === 'KeyM') hooks.onMute();
    if (event.code === 'KeyR') hooks.onRestart();
    if (event.code === 'Enter') hooks.onStart();
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onPointerDown(event) {
    event.preventDefault();
    clickQueue += 1;
    jumpQueue += 1;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    // True while the duck key is held, or while the pointer is held down
    // low on the screen (mouse players duck by holding the lower half).
    get duckHeld() {
      return keys.has('ArrowDown') || keys.has('KeyS');
    },
    get leftHeld() {
      return keys.has('ArrowLeft') || keys.has('KeyA');
    },
    get rightHeld() {
      return keys.has('ArrowRight') || keys.has('KeyD');
    },
    // Consume one queued jump press (keyboard or click). Returns true if
    // a fresh press happened since the last check.
    consumeJump() {
      if (jumpQueue > 0) {
        jumpQueue -= 1;
        return true;
      }
      return false;
    },
    consumeClick() {
      if (clickQueue > 0) {
        clickQueue -= 1;
        return true;
      }
      return false;
    },
    clearQueues() {
      jumpQueue = 0;
      clickQueue = 0;
    },
  };
}
