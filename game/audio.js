// audio.js — all sound is synthesized live with the Web Audio API.
// No audio files are loaded: every gobble, boing, ding and sting is an
// oscillator envelope built in code, so the game stays fully offline.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  // A cheerful barnyard pluck loop (C major pentatonic, banjo-ish).
  const MELODY = [72, 76, 79, 76, 74, 76, 79, 81, 79, 76, 74, 72, 67, 69, 72, 0];
  const STEP_MS = 210;

  function ensure() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function startMusic() {
    if (musicTimer || !ctx) return;
    musicTimer = setInterval(() => {
      if (muted) return;
      const note = MELODY[musicStep % MELODY.length];
      musicStep += 1;
      if (note > 0) tone(midiToFreq(note), 0.18, 'triangle', 0.05);
      if (musicStep % 4 === 0) tone(midiToFreq(48), 0.3, 'sine', 0.04);
    }, STEP_MS);
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  return {
    ensure,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    startMusic,
    stopMusic,
    // The turkey's signature gobble: three fast pitch wobbles.
    gobble() {
      if (!ctx || muted) return;
      [0, 0.09, 0.18].forEach((delay, i) => {
        setTimeout(() => tone(320 - i * 30, 0.09, 'sawtooth', 0.06, 180 - i * 20), delay * 1000);
      });
    },
    jump() { tone(280, 0.16, 'sine', 0.09, 620); },
    doubleJump() { tone(420, 0.14, 'sine', 0.08, 880); },
    pickup() { tone(880, 0.1, 'triangle', 0.1); setTimeout(() => tone(1318, 0.14, 'triangle', 0.08), 70); },
    feather() { [660, 880, 1100].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'triangle', 0.09), i * 60)); },
    stumble() { tone(140, 0.25, 'square', 0.1, 70); },
    knife() { tone(1200, 0.18, 'sawtooth', 0.05, 300); },
    spotted() { tone(196, 0.4, 'sawtooth', 0.09, 392); tone(147, 0.4, 'sawtooth', 0.07, 294); },
    caught() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.28, 'triangle', 0.1), i * 160)); },
    escaped() { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.1), i * 130)); },
    hide() { tone(500, 0.12, 'sine', 0.05, 900); },
  };
}
