// ══════════════════════════════════════════
//  main.js  –  Application Boot
//  MIT App Inventor WebView compatible
// ══════════════════════════════════════════

'use strict';

// Global reference to whichever game engine is active
window.ActiveGame = null;

window.addEventListener('DOMContentLoaded', () => {

  // ── Force canvas size immediately (WebView fix) ──
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width  = '100%';
    canvas.style.height = '100%';
  }

  // ── Try 3D engine first ──
  Game.init();
  const use3D = Game.isWebGLOk();

  if (use3D) {
    window.ActiveGame = Game;
  } else {
    // Fallback: init 2D engine
    Game2D.init();
    window.ActiveGame = Game2D;

    // Proxy Game calls to active engine so HTML buttons keep working
    window.Game = {
      init: () => {},
      isWebGLOk: () => false,
      startFromMenu: () => Game2D.startFromMenu(),
      startLevel:    (l) => Game2D.startLevel(l),
      pause:         () => Game2D.pause(),
      resume:        () => Game2D.resume(),
      restart:       () => Game2D.restart(),
      quit:          () => Game2D.quit(),
      nextLevel:     () => Game2D.startLevel(2),
    };
  }

  // ── Init menu display ──
  MenuScreen.refresh();

  // ── Start on menu ──
  const s = document.getElementById('s-menu');
  s.style.display = 'flex';
  s.classList.add('active');

  // ── Load settings (with localStorage fallback) ──
  let sfxEnabled   = true;
  let musicEnabled = true;
  try {
    const d = DataStore.d;
    sfxEnabled   = d.sfx   !== false;
    musicEnabled = d.music !== false;
  } catch(e) {}

  SoundFX.setEnabled(sfxEnabled);
  SoundFX.setMusicEnabled(musicEnabled);

  // ── Start ambient music on menu (delayed for WebView autoplay policy) ──
  setTimeout(() => { try { SoundFX.startMusic(); } catch(e) {} }, 800);

  // ── Unlock AudioContext on first touch (required by mobile WebViews) ──
  const _unlockAudio = () => {
    try { if (SoundFX.unlock) SoundFX.unlock(); } catch(e) {}
  };
  document.addEventListener('touchstart', _unlockAudio, { once: true, passive: true });
  document.addEventListener('click',      _unlockAudio, { once: true, passive: true });

  // ── Safe swipe hint handler ──
  window.closeSwipeHint = () => {
    try { SoundFX.play('click'); } catch(e) {}
    const hint = document.getElementById('swipe-hint');
    if (hint) hint.classList.add('hidden');
    if (window.Game && typeof window.Game.resume === 'function') {
      try { window.Game.resume(); } catch(e) {}
    }
  };

  // ── Prevent pull-to-refresh and iOS bounce ──
  document.body.addEventListener('touchmove', e => {
    if (!document.getElementById('s-game').classList.contains('active')) {
      const scrollable = e.target.closest('.screen-scroll,.lc-scroll,.profile-wrap,.settings-wrap,.ach-list,.lb-list,.lb-add-friend');
      if (!scrollable) e.preventDefault();
    }
  }, { passive: false });

  // ── Prevent double-tap zoom ──
  let lastTap = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTap < 300) e.preventDefault();
    lastTap = now;
  }, { passive: false });

  // ── Handle window resize & orientation ──
  const _onResize = () => {
    const cv = document.getElementById('gameCanvas');
    if (cv) { cv.width = window.innerWidth; cv.height = window.innerHeight; }
  };
  window.addEventListener('resize', _onResize);
  window.addEventListener('orientationchange', () => setTimeout(_onResize, 300));
});
