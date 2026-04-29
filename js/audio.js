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

  // ── BACKGROUND MUSIC (NewJeans – New Jeans Instrumental) ──
  let _bgAudio = null;

  function _getBgAudio() {
    if (!_bgAudio) {
      _bgAudio = new Audio('music.mp3');
      _bgAudio.loop = true;
      _bgAudio.volume = 0.7;
    }
    return _bgAudio;
  }

  function startMusic() {
    if (!musicEnabled) return;
    const audio = _getBgAudio();
    // Fade in via a quick volume ramp
    audio.volume = 0;
    audio.play().then(() => {
      let vol = 0;
      const fadeIn = setInterval(() => {
        vol = Math.min(vol + 0.05, 0.7);
        audio.volume = vol;
        if (vol >= 0.7) clearInterval(fadeIn);
      }, 80);
    }).catch(() => {});
  }

  function stopMusic() {
    if (!_bgAudio) return;
    const audio = _bgAudio;
    let vol = audio.volume;
    const fadeOut = setInterval(() => {
      vol = Math.max(vol - 0.07, 0);
      audio.volume = vol;
      if (vol <= 0) {
        clearInterval(fadeOut);
        audio.pause();
        audio.currentTime = 0;
      }
    }, 50);
  }

  function setEnabled(v) { enabled = v; if (!v) {} }
  function setMusicEnabled(v) { musicEnabled = v; if (v) startMusic(); else stopMusic(); }

  // Resume AudioContext on first user interaction (required by browsers and WebViews)
  function unlock() { _ctx(); }
  function pauseMusic() { if (_bgAudio) { _bgAudio.pause(); } }
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
