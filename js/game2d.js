// ══════════════════════════════════════════
//  game2d.js  –  2D Canvas Fallback Engine
//  Used when WebGL is not available (MIT App Inventor WebView)
// ══════════════════════════════════════════

'use strict';

const Game2D = (() => {
  let canvas, ctx;
  let running = false, paused = false, over = false;
  let score = 0, ecoBar = 0, streak = 0, maxStreak = 0, lives = 3, frame = 0;
  let speed = 0, baseSpeed = 0, lvlIdx = 0, lvlTriggered = {};
  let runItems=0,runSolar=0,runTrees=0,runBins=0,runOAvoided=0,runOTotal=0;
  let _raf = null;

  // Player state
  let pLane = 1; // 0=left, 1=center, 2=right
  let pY = 0, pVY = 0, isJump = false;
  let inv = false, invT = 0, hitCD = 0;
  let laneAnim = 0, targetLane = 1;

  // Game objects
  let obstacles = [], ecoItems = [], bgSegments = [];
  let particles = [], floatTexts = [];

  // Scroll
  let scrollY = 0;

  const W = () => canvas.width;
  const H = () => canvas.height;

  // Lane x positions (relative to canvas width)
  const laneX = () => {
    const w = W();
    return [w * 0.22, w * 0.5, w * 0.78];
  };

  const TRACK_TOP = () => H() * 0.08;
  const TRACK_BOT = () => H();
  const GROUND_Y = () => H() * 0.72;
  const LANE_W = () => W() * 0.22;

  const LVLS = [
    { id:1, name:'Grey City',    diff:'EASY',     skyTop:'#1a1a2e', skyBot:'#3a3a5c', gnd:'#4a4e69', trk:'#5a5a7a', scoreTarget:400, baseSpd:3.5, obsInt:120, startLives:3 },
    { id:2, name:'Green Suburb', diff:'MODERATE', skyTop:'#0d3b1e', skyBot:'#1a6b3a', gnd:'#2d5a3d', trk:'#3a6b4a', scoreTarget:600, baseSpd:5.0, obsInt:90,  startLives:3 },
    { id:3, name:'Solar City',   diff:'HARD',     skyTop:'#030d20', skyBot:'#0a3d62', gnd:'#1f6b58', trk:'#0d4a3a', scoreTarget:800, baseSpd:7.0, obsInt:65,  startLives:2 },
  ];

  const ECO_ITEMS_DEF = [
    { emoji:'🌲', name:'Tree',       pts:10, type:'tree' },
    { emoji:'☀️', name:'Solar',      pts:15, type:'solar' },
    { emoji:'♻️', name:'Recycle',    pts:12, type:'bin' },
    { emoji:'💧', name:'Water',      pts:10, type:'water' },
    { emoji:'🌬️', name:'Wind',       pts:20, type:'wind' },
  ];

  const OBS_DEF = [
    { emoji:'🏭', name:'Factory',   w:0.14, h:0.14, canJump:false },
    { emoji:'🌫️', name:'Smog',      w:0.14, h:0.10, canJump:true  },
    { emoji:'🗑️', name:'Trash',     w:0.12, h:0.10, canJump:true  },
    { emoji:'🚗', name:'Car',       w:0.15, h:0.10, canJump:false },
    { emoji:'🔥', name:'Fire',      w:0.10, h:0.13, canJump:true  },
  ];

  /* ─── INIT ─── */
  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);
    window.addEventListener('orientationchange', () => setTimeout(_resize, 200));
    _initSwipe();
    _initKeyboard();
  }

  function _resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    // Redraw current frame if game is running/paused
    if (running || paused || over) _draw();
  }

  /* ─── START ─── */
  function startFromMenu() { startLevel(1); }

  function startLevel(lvl) {
    lvl = Math.max(1, Math.min(3, lvl));
    lvlIdx = lvl - 1;
    DataStore.d.level = lvl; DataStore.save();
    const cfg = LVLS[lvlIdx];

    score=0;ecoBar=0;streak=0;maxStreak=0;frame=0;hitCD=0;
    lives = cfg.startLives || 3;
    baseSpeed = cfg.baseSpd;
    speed = baseSpeed;
    running=true;paused=false;over=false;lvlTriggered={};
    runItems=0;runSolar=0;runTrees=0;runBins=0;runOAvoided=0;runOTotal=0;
    pLane=1;targetLane=1;laneAnim=0;pY=0;pVY=0;isJump=false;
    inv=false;invT=0;
    obstacles=[];ecoItems=[];particles=[];floatTexts=[];
    scrollY=0;
    bgSegments=[];

    Nav.go('s-game');
    const swipeZone = document.getElementById('swipe-zone');
    if (swipeZone) swipeZone.style.pointerEvents = 'auto';
    document.getElementById('ov-pause').classList.add('hidden');

    // Show swipe hint first time
    try {
      if (!localStorage.getItem('er_hint_shown')) {
        const swipeHint = document.getElementById('swipe-hint');
        if (swipeHint) swipeHint.classList.remove('hidden');
        localStorage.setItem('er_hint_shown','1');
      }
    } catch(e) {
      const swipeHint = document.getElementById('swipe-hint');
      if (swipeHint) swipeHint.classList.remove('hidden');
    }

    _updateHUD();
    SoundFX.startMusic();
    if (_raf) cancelAnimationFrame(_raf);
    _raf = requestAnimationFrame(_loop);
  }

  /* ─── GAME LOOP ─── */
  let lastTime = 0;
  function _loop(ts) {
    _raf = requestAnimationFrame(_loop);
    const dt = Math.min((ts - lastTime) / 16.67, 4);
    lastTime = ts;
    if (!running || over || paused) { _draw(); return; }
    _update(dt);
    _draw();
  }

  function _update(dt) {
    const cfg = LVLS[lvlIdx];
    speed = Math.min(baseSpeed + score * 0.003, 18);
    score += 0.08 * dt * (speed / baseSpeed);
    frame++;
    scrollY += speed * dt * 2;

    // Smooth lane movement
    const lx = laneX();
    laneAnim += (targetLane - laneAnim) * 0.22 * dt;

    // Player jump physics
    if (isJump) {
      pY -= pVY * dt;
      pVY -= 0.32 * dt;
      if (pY >= 0) { pY = 0; pVY = 0; isJump = false; }
    }

    // Invincibility countdown
    if (inv) { invT -= dt; if (invT <= 0) { inv = false; invT = 0; } }
    if (hitCD > 0) hitCD -= dt;

    // Spawn obstacles
    if (frame % Math.max(20, Math.floor(cfg.obsInt / speed * baseSpeed)) === 0) {
      _spawnObs();
    }
    // Spawn eco items
    if (frame % 45 === 0) _spawnEco();

    // Move obstacles
    obstacles = obstacles.filter(o => {
      o.y += speed * dt * 2.2;
      // Check collision
      if (!inv && hitCD <= 0) {
        const playerX = lx[Math.round(laneAnim)];
        const groundY = GROUND_Y();
        const playerYPos = groundY + pY;
        const oX = lx[o.lane];
        const oW = W() * o.def.w;
        const oH = H() * o.def.h;
        const oY = o.y;
        const pR = LANE_W() * 0.28;
        if (Math.abs(playerX - oX) < (pR + oW * 0.4) &&
            Math.abs(playerYPos - oY) < (pR + oH * 0.5)) {
          _hit();
        }
      }
      if (o.y > H() * 1.1) { runOAvoided++; return false; }
      return true;
    });

    // Move eco items
    ecoItems = ecoItems.filter(e => {
      e.y += speed * dt * 2.2;
      // Check collection
      const playerX = lx[Math.round(laneAnim)];
      const groundY = GROUND_Y();
      const playerYPos = groundY + pY;
      const eX = lx[e.lane];
      const dist = Math.hypot(playerX - eX, playerYPos - e.y);
      if (dist < LANE_W() * 0.38) {
        _collectEco(e);
        return false;
      }
      return e.y < H() * 1.1;
    });

    // Particles
    particles = particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.15 * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      return p.life > 0;
    });
    floatTexts = floatTexts.filter(f => {
      f.y -= 0.8 * dt;
      f.life -= dt;
      f.alpha = Math.max(0, f.life / f.maxLife);
      return f.life > 0;
    });

    _checkLevelProgress(cfg);
    _updateHUD();
  }

  function _spawnObs() {
    const lane = Math.floor(Math.random() * 3);
    const def = OBS_DEF[Math.floor(Math.random() * OBS_DEF.length)];
    runOTotal++;
    obstacles.push({ lane, y: -H() * 0.05, def });
  }

  function _spawnEco() {
    const lane = Math.floor(Math.random() * 3);
    // Make sure it doesn't conflict with obstacle in same lane
    const hasObs = obstacles.some(o => o.lane === lane && o.y < H() * 0.15);
    if (hasObs) return;
    const def = ECO_ITEMS_DEF[Math.floor(Math.random() * ECO_ITEMS_DEF.length)];
    ecoItems.push({ lane, y: -H() * 0.05, def });
  }

  function _hit() {
    if (inv || hitCD > 0) return;
    lives--;
    inv = true; invT = 90;
    hitCD = 30;
    SoundFX.play('hit');
    try { if (navigator.vibrate) navigator.vibrate(200); } catch(e) {}
    _spawnParticles(laneX()[Math.round(laneAnim)], GROUND_Y() + pY, '#ff4444', 10);
    _updateHUD();
    if (lives <= 0) _gameOver();
  }

  function _collectEco(e) {
    const pts = e.def.pts * (1 + Math.floor(streak / 5) * 0.5);
    score += pts;
    ecoBar = Math.min(100, ecoBar + 4);
    streak++;
    maxStreak = Math.max(maxStreak, streak);
    runItems++;
    if (e.def.type === 'solar') runSolar++;
    if (e.def.type === 'tree')  runTrees++;
    if (e.def.type === 'bin')   runBins++;
    SoundFX.play('collect');
    _spawnParticles(laneX()[e.lane], e.y, '#2ecc71', 6);
    floatTexts.push({ x: laneX()[e.lane], y: e.y, text: '+' + Math.round(pts), life: 40, maxLife: 40, alpha: 1 });
    _updateHUD();
  }

  function _spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3;
      particles.push({
        x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd - 2,
        color, size: 3 + Math.random() * 5,
        life: 20 + Math.random() * 20, maxLife: 40, alpha: 1
      });
    }
  }

  function _checkLevelProgress(cfg) {
    if (!lvlTriggered['complete'] && score >= cfg.scoreTarget) {
      lvlTriggered['complete'] = true;
      running = false;
      over = true;
      const run = { score: Math.floor(score), items: runItems, streak: maxStreak, solar: runSolar, trees: runTrees, bins: runBins, levelReached: lvlIdx+1, accuracy: runOTotal > 0 ? Math.round((runOAvoided/runOTotal)*100) : 100, bonus: Math.floor(ecoBar * 2) };
      DataStore.mergeRun(run);
      const newAch = DataStore.checkAchievements();
      setTimeout(() => LevelCompleteScreen.show(run, false, cfg, newAch), 600);
    }
  }

  function _gameOver() {
    running = false; over = true;
    SoundFX.play('gameover');
    const run = { score: Math.floor(score), items: runItems, streak: maxStreak, solar: runSolar, trees: runTrees, bins: runBins, levelReached: lvlIdx+1, accuracy: runOTotal > 0 ? Math.round((runOAvoided/runOTotal)*100) : 100, bonus: 0 };
    DataStore.mergeRun(run);
    const newAch = DataStore.checkAchievements();
    setTimeout(() => LevelCompleteScreen.show(run, true, LVLS[lvlIdx], newAch), 800);
  }

  /* ─── DRAW ─── */
  function _draw() {
    if (!ctx) return;
    const w = W(), h = H();
    const cfg = LVLS[lvlIdx];
    const lx = laneX();
    const groundY = GROUND_Y();
    const playerX = lx[0] + (lx[2] - lx[0]) * (laneAnim / 2);
    const playerYPos = groundY + pY;

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, cfg.skyTop);
    sky.addColorStop(1, cfg.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Ground
    ctx.fillStyle = cfg.gnd;
    ctx.fillRect(0, groundY + 30, w, h - groundY - 30);

    // Track (3 lanes)
    const trackLeft  = lx[0] - LANE_W() * 0.55;
    const trackRight = lx[2] + LANE_W() * 0.55;
    const trackW = trackRight - trackLeft;

    ctx.fillStyle = cfg.trk;
    ctx.fillRect(trackLeft, TRACK_TOP(), trackW, h - TRACK_TOP());

    // Lane dividers (scrolling)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.setLineDash([30, 20]);
    ctx.lineDashOffset = -(scrollY % 50);
    for (let i = 0; i < 2; i++) {
      const lxMid = (lx[i] + lx[i+1]) / 2;
      ctx.beginPath();
      ctx.moveTo(lxMid, TRACK_TOP());
      ctx.lineTo(lxMid, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Track edges
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(trackLeft - 3, TRACK_TOP(), 3, h);
    ctx.fillRect(trackRight, TRACK_TOP(), 3, h);

    // Perspective lines (depth cue)
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1.5;
    const vanishX = w * 0.5, vanishY = h * 0.08;
    [trackLeft, trackRight].forEach(ex => {
      ctx.beginPath();
      ctx.moveTo(vanishX, vanishY);
      ctx.lineTo(ex, h);
      ctx.stroke();
    });

    // Eco items
    ecoItems.forEach(e => {
      const ex = lx[e.lane];
      const size = w * 0.065;
      // Glow
      ctx.save();
      ctx.shadowColor = '#2ecc71';
      ctx.shadowBlur = 16;
      ctx.font = `${size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.def.emoji, ex, e.y);
      ctx.restore();
    });

    // Obstacles
    obstacles.forEach(o => {
      const ox = lx[o.lane];
      const size = w * 0.075;
      ctx.save();
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 12;
      ctx.font = `${size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.def.emoji, ox, o.y);
      ctx.restore();
    });

    // Particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Float texts
    floatTexts.forEach(f => {
      ctx.save();
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = '#2ecc71';
      ctx.font = `bold ${w * 0.045}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#2ecc71';
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    });

    // Player
    _drawPlayer(playerX, playerYPos, w);

    // Pause/gameover overlay text on canvas
    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  function _drawPlayer(x, y, w) {
    const size = w * 0.062;
    const blinkOff = inv && Math.floor(invT / 6) % 2 === 0;
    if (blinkOff) return;

    ctx.save();
    // Shadow on ground
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y() + 4, size * 0.5, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#2ecc71';
    const bh = size * 1.2;
    const bw = size * 0.65;
    ctx.fillRect(x - bw/2, y - bh, bw, bh);

    // Head
    ctx.fillStyle = '#f4a460';
    const hs = size * 0.55;
    ctx.fillRect(x - hs/2, y - bh - hs, hs, hs);

    // Eyes
    ctx.fillStyle = '#333';
    ctx.fillRect(x - hs*0.28, y - bh - hs*0.7, hs*0.14, hs*0.14);
    ctx.fillRect(x + hs*0.1, y - bh - hs*0.7, hs*0.14, hs*0.14);

    // Hat
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x - hs*0.55, y - bh - hs - hs*0.18, hs*1.1, hs*0.18);

    // Legs (animated run)
    const legSwing = Math.sin(frame * 0.22) * 4;
    ctx.fillStyle = '#1a5c3a';
    ctx.fillRect(x - bw*0.38, y - bh*0.35, bw*0.36, bh*0.38);
    ctx.fillRect(x + bw*0.02, y - bh*0.35 - legSwing, bw*0.36, bh*0.38);

    // Arms
    const armSwing = Math.sin(frame * 0.22) * 5;
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x - bw*0.68, y - bh*0.8 + armSwing, bw*0.24, bh*0.4);
    ctx.fillRect(x + bw*0.44, y - bh*0.8 - armSwing, bw*0.24, bh*0.4);

    ctx.restore();
  }

  /* ─── HUD ─── */
  function _updateHUD() {
    const el = id => document.getElementById(id);
    if (el('h-score'))  el('h-score').textContent  = Math.floor(score);
    if (el('h-streak')) el('h-streak').textContent = streak + 'x';
    if (el('h-ecofill')) el('h-ecofill').style.width = ecoBar + '%';
    if (el('h-world'))  el('h-world').textContent  = LVLS[lvlIdx].name;
    if (el('h-lvlnum')) el('h-lvlnum').textContent = lvlIdx + 1;
    if (el('h-lvlfill')) el('h-lvlfill').style.width = Math.min(100, Math.floor((score / LVLS[lvlIdx].scoreTarget) * 100)) + '%';
    // Lives
    const livesEl = el('h-lives');
    if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
  }

  /* ─── CONTROLS ─── */
  function _initSwipe() {
    const zone = document.getElementById('swipe-zone');
    if (!zone) return;
    let sx = 0, sy = 0, st = 0;
    const MIN_SWIPE = 30;

    function swipeStart(x, y) { sx = x; sy = y; st = Date.now(); }
    function swipeEnd(x, y) {
      if (!running || paused || over) return;
      const dx = x - sx, dy = y - sy, elapsed = Date.now() - st;
      if (elapsed > 500 || (Math.abs(dx) < MIN_SWIPE && Math.abs(dy) < MIN_SWIPE)) return;
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx > 0 && targetLane < 2) { targetLane++; SoundFX.play('swipe'); }
        else if (dx < 0 && targetLane > 0) { targetLane--; SoundFX.play('swipe'); }
      } else if (dy < -MIN_SWIPE && !isJump) {
        isJump = true; pVY = 6.5; SoundFX.play('jump');
      }
      sx = 0; sy = 0;
    }

    zone.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; swipeStart(t.clientX, t.clientY); }, { passive: false });
    zone.addEventListener('touchend',   e => { e.preventDefault(); const t = e.changedTouches[0]; swipeEnd(t.clientX, t.clientY); }, { passive: false });
    zone.addEventListener('touchmove',  e => { if (running && !paused && !over) e.preventDefault(); }, { passive: false });
  }

  function _initKeyboard() {
    document.addEventListener('keydown', e => {
      if (!running || over) return;
      if (e.key === 'ArrowLeft'  && targetLane > 0) targetLane--;
      if (e.key === 'ArrowRight' && targetLane < 2) targetLane++;
      if ((e.key === 'ArrowUp' || e.key === ' ') && !isJump) { isJump = true; pVY = 6.5; }
      if (e.key === 'Escape') paused ? resume() : pause();
    });
  }

  /* ─── PUBLIC API (matches Game object interface) ─── */
  function pause() {
    if (!running || over) return;
    paused = true;
    SoundFX.pauseMusic();
    document.getElementById('ov-pause').classList.remove('hidden');
  }

  function resume() {
    paused = false;
    SoundFX.startMusic();
    document.getElementById('ov-pause').classList.add('hidden');
  }

  function restart() { startLevel(lvlIdx + 1); }

  function quit() {
    running = false; paused = false; over = false;
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    SoundFX.stopMusic();
    Nav.go('s-menu');
    MenuScreen.refresh();
  }

  return { init, startFromMenu, startLevel, pause, resume, restart, quit };
})();
