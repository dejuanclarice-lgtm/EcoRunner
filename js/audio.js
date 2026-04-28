// ══════════════════════════════════════════
//  audio.js  –  Web Audio API Sound Effects
//  All sounds synthesized – no files needed!
// ══════════════════════════════════════════

'use strict';

const SoundFX = (() => {
  let ctx = null;
  let enabled = true;
  let musicEnabled = true;
  let musicNode = null;
  let musicGain = null;

  function _ctx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Tone builder helpers ──
  function _tone(freq, type, duration, vol, startTime, fadeOut) {
    const c = _ctx(); if (!c) return;
    const g = c.createGain();
    const o = c.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(vol, startTime);
    if (fadeOut) g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    o.connect(g); g.connect(c.destination);
    o.start(startTime); o.stop(startTime + duration);
  }

  function _noise(duration, vol, startTime) {
    const c = _ctx(); if (!c) return;
    const bufLen = c.sampleRate * duration;
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    const g = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 2;
    src.buffer = buf;
    g.gain.setValueAtTime(vol, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(filter); filter.connect(g); g.connect(c.destination);
    src.start(startTime); src.stop(startTime + duration);
  }

  // ── SOUND EFFECTS ──
  const sounds = {
    // Jump – ascending sweep
    jump() {
      const c = _ctx(); if (!c || !enabled) return;
      const t = c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(660, t + 0.18);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + 0.3);
    },

    // Land – thud
    land() {
      const c = _ctx(); if (!c || !enabled) return;
      const t = c.currentTime;
      _noise(0.08, 0.2, t);
      _tone(80, 'sine', 0.1, 0.15, t, true);
    },

    // Slide – whoosh
    slide() {
      const c = _ctx(); if (!c || !enabled) return;
      const t = c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(400, t);
      o.frequency.exponentialRampToValueAtTime(120, t + 0.22);
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + 0.25);
    },

    // Collect eco item – cheerful ding
    collect() {
      const c = _ctx(); if (!c || !enabled) return;
      const t = c.currentTime;
      [523, 659, 784, 1047].forEach((freq, i) => {
        _tone(freq, 'sine', 0.12, 0.12, t + i * 0.06, true);
      });
    },

    // Hit obstacle – crash + buzz
    hit() {
      const c = _ctx(); if (!c || !enabled) return;
      const t = c.currentTime;
      _noise(0.3, 0.35, t);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(50, t + 0.3);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + 0.35);
    },

    // Level up – triumphant fanfare
    levelup() {
      const c = _ctx(); if (!c || !enabled) return;
      const t = c.currentTime;
      const notes = [523, 659, 784, 1047, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        _tone(freq, 'triangle', 0.18, 0.18, t + i * 0.1, true);
      });
    },

    // Game over – descending wail
    gameover() {
      const c = _ctx(); if (!c || !enabled) return;
      const t = c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(440, t);
      o.frequency.exponentialRampToValueAtTime(110, t + 1.0);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + 1.2);
    },

    // Button click – soft tick
    click() {
      const c = _ctx(); if (!c || !enabled) return;
      const t = c.currentTime;
      _tone(800, 'sine', 0.05, 0.08, t, true);
    },

    // Achievement unlock – sparkle sequence
    achievement() {
      const c = _ctx(); if (!c || !enabled) return;
      const t = c.currentTime;
      [880, 1100, 1320, 1760, 2200].forEach((freq, i) => {
        _tone(freq, 'sine', 0.15, 0.12, t + i * 0.07, true);
      });
    },

    // Lane change – subtle swish
    lane() {
      const c = _ctx(); if (!c || !enabled) return;
      const t = c.currentTime;
      _noise(0.05, 0.08, t);
    },

    // Countdown beep
    beep(freq) {
      const c = _ctx(); if (!c || !enabled) return;
      _tone(freq || 440, 'sine', 0.1, 0.15, c.currentTime, true);
    }
  };

  // ── BACKGROUND MUSIC (joyful upbeat chiptune) ──
  // A bright, looping chiptune with melody, bass, and percussion layers.
  let musicScheduler = null;
  let musicStartTime = 0;
  let musicLoop = 0;

  // C major pentatonic melody — two 8-bar phrases that repeat
  const MELODY = [
    // Bar 1-4 (bright ascending motif)
    [523,0],[659,0.25],[784,0.5],[1047,0.75],
    [880,1.0],[784,1.25],[659,1.5],[523,1.75],
    [587,2.0],[784,2.25],[880,2.5],[1047,2.75],
    [784,3.0],[659,3.25],[523,3.5],[392,3.75],
    // Bar 5-8 (answering phrase)
    [523,4.0],[784,4.25],[1047,4.5],[880,4.75],
    [784,5.0],[659,5.25],[784,5.5],[1047,5.75],
    [880,6.0],[784,6.25],[659,6.5],[523,6.75],
    [392,7.0],[440,7.25],[523,7.5],[659,7.75],
  ];

  // Bouncy bass line (root + fifth pattern)
  const BASS = [
    [130,0],[196,0.5],[130,1.0],[196,1.5],
    [146,2.0],[220,2.5],[146,3.0],[196,3.5],
    [130,4.0],[196,4.5],[130,5.0],[196,5.5],
    [174,6.0],[261,6.5],[174,7.0],[196,7.5],
  ];

  // Bright chord stabs (every 2 beats)
  const CHORDS = [
    [[523,659,784],0],[[523,659,784],1],
    [[587,740,880],2],[[523,659,784],3],
    [[523,659,784],4],[[523,784,1047],5],
    [[523,659,784],6],[[392,523,659],7],
  ];

  const LOOP_DUR = 8.0; // seconds per loop

  function _scheduleLoop(startAt) {
    const c = _ctx(); if (!c || !musicEnabled) return;

    // ── Melody (triangle wave — bright & clean) ──
    MELODY.forEach(([freq, beat]) => {
      const t = startAt + beat * 0.25; // each beat = 0.25s (120 BPM, 16th notes)
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.13, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g); g.connect(musicGain);
      o.start(t); o.stop(t + 0.25);
    });

    // ── Bass (square wave — punchy) ──
    BASS.forEach(([freq, beat]) => {
      const t = startAt + beat * 0.25;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g); g.connect(musicGain);
      o.start(t); o.stop(t + 0.4);
    });

    // ── Chord stabs (sine — warm pads) ──
    CHORDS.forEach(([freqs, beat]) => {
      const t = startAt + beat * 1.0; // every 1s (1 full beat at 60 BPM... but we're at 240 BPM internally so 4 * 0.25)
      freqs.forEach(freq => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.04, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        o.connect(g); g.connect(musicGain);
        o.start(t); o.stop(t + 0.75);
      });
    });

    // ── Hi-hat (noise burst every 8th note) ──
    for (let i = 0; i < 16; i++) {
      const t = startAt + i * 0.5;
      const bufLen = Math.floor(c.sampleRate * 0.04);
      const buf = c.createBuffer(1, bufLen, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < bufLen; j++) data[j] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      const filt = c.createBiquadFilter();
      const g = c.createGain();
      filt.type = 'highpass'; filt.frequency.value = 8000;
      src.buffer = buf;
      g.gain.setValueAtTime(0.025, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      src.connect(filt); filt.connect(g); g.connect(musicGain);
      src.start(t); src.stop(t + 0.05);
    }

    // ── Kick drum (every beat) ──
    for (let i = 0; i < 8; i++) {
      const t = startAt + i * 1.0;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g); g.connect(musicGain);
      o.start(t); o.stop(t + 0.2);
    }

    // ── Snare (on beats 2 & 4 = 1.0s & 3.0s into each 4-beat phrase, x2) ──
    [1.0, 3.0, 5.0, 7.0].forEach(beat => {
      const t = startAt + beat;
      // Noise body
      const bufLen = Math.floor(c.sampleRate * 0.1);
      const buf = c.createBuffer(1, bufLen, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < bufLen; j++) data[j] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      const filt = c.createBiquadFilter();
      const g = c.createGain();
      filt.type = 'bandpass'; filt.frequency.value = 2500; filt.Q.value = 1.5;
      src.buffer = buf;
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      src.connect(filt); filt.connect(g); g.connect(musicGain);
      src.start(t); src.stop(t + 0.12);
    });
  }

  function startMusic() {
    const c = _ctx(); if (!c || !musicEnabled) return;
    if (musicGain) stopMusic();

    musicGain = c.createGain();
    musicGain.gain.setValueAtTime(0.0, c.currentTime);
    musicGain.gain.linearRampToValueAtTime(1.0, c.currentTime + 1.5); // fade in
    musicGain.connect(c.destination);

    musicStartTime = c.currentTime + 0.1;
    musicLoop = 0;

    // Pre-schedule first 2 loops, then keep scheduling ahead
    _scheduleLoop(musicStartTime);
    _scheduleLoop(musicStartTime + LOOP_DUR);

    function keepAlive() {
      if (!musicEnabled || !musicGain) return;
      const c2 = _ctx(); if (!c2) return;
      const elapsed = c2.currentTime - musicStartTime;
      const nextLoop = Math.floor(elapsed / LOOP_DUR) + 2;
      if (nextLoop > musicLoop + 1) {
        musicLoop = nextLoop - 1;
        _scheduleLoop(musicStartTime + nextLoop * LOOP_DUR);
      }
      musicNode = setTimeout(keepAlive, 500);
    }
    keepAlive();
  }

  function stopMusic() {
    clearTimeout(musicNode);
    musicNode = null;
    if (musicGain) {
      const c = _ctx();
      if (c) musicGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
      musicGain = null;
    }
    musicLoop = 0;
  }

  function setEnabled(v) { enabled = v; if (!v) {} }
  function setMusicEnabled(v) { musicEnabled = v; if (v) startMusic(); else stopMusic(); }

  // Resume AudioContext on first user interaction (required by browsers and WebViews)
  function unlock() { _ctx(); }
  function pauseMusic() { if (musicNode) { try { musicNode.stop(); } catch(e) {} musicNode = null; } }
  document.addEventListener('touchstart', unlock, { once: true, passive: true });
  document.addEventListener('mousedown', unlock, { once: true });

  return {
    play: (name, ...args) => sounds[name] && sounds[name](...args),
    startMusic, stopMusic, pauseMusic, setEnabled, setMusicEnabled, unlock,
    get enabled() { return enabled; },
    get musicEnabled() { return musicEnabled; }
  };
})();
window.SoundFX = SoundFX;
