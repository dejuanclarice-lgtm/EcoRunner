// ══════════════════════════════════════════
//  ui.js  –  Navigation & Screen Renderers
// ══════════════════════════════════════════

'use strict';

/* ─── NAVIGATION ─── */
const Nav = (() => {
  const hist = [];

  function go(id) {
    SoundFX.play('click');
    const prev = document.querySelector('.screen.active');
    if (prev && prev.id !== id) {
      prev.classList.remove('active');
      prev.style.display = '';
      hist.push(prev.id);
    }
    const next = document.getElementById(id);
    if (!next) return;
    next.style.display = 'flex';
    next.classList.add('active');

    // Refresh on navigate
    if (id === 's-achievements') AchScreen.render();
    if (id === 's-leaderboard')  LBScreen.render('global');
    if (id === 's-profile')      Profile.refresh();
    if (id === 's-menu')         MenuScreen.refresh();
    if (id === 's-settings')     SettingsScreen.refresh();
    if (id === 's-howtoplay')    {} // static screen, no init needed
  }

  function back() {
    SoundFX.play('click');
    const prev = hist.pop();
    if (prev) { const cur=document.querySelector('.screen.active'); if(cur){cur.classList.remove('active');cur.style.display='';} const next=document.getElementById(prev); if(next){next.style.display='flex';next.classList.add('active');} if(prev==='s-menu')MenuScreen.refresh(); }
    else go('s-menu');
  }

  return { go, back };
})();

/* ─── MENU SCREEN ─── */
const MenuScreen = {
  refresh() {
    const d = DataStore.d;
    document.getElementById('m-level').textContent = d.level;
    document.getElementById('m-best').textContent  = d.bestScore.toLocaleString();
    document.getElementById('m-items').textContent = d.totalItems;
    document.getElementById('menu-player-name').textContent = d.playerName;
    // Avatar
    const th = document.getElementById('menu-avatar-thumb');
    if (d.playerImg) {
      th.innerHTML = `<img src="${d.playerImg}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    } else {
      th.textContent = d.playerEmoji || '🏃';
    }
  }
};

/* ─── ACHIEVEMENTS SCREEN ─── */
const AchScreen = {
  render() {
    const d = DataStore.d;
    const total = ACHIEVEMENTS_DEF.length;
    const unlocked = d.achievementsUnlocked.length;
    document.getElementById('ach-unlocked-count').textContent = `${unlocked} of ${total} unlocked`;
    document.getElementById('ach-overall-bar').style.width = (unlocked/total*100) + '%';

    const list = document.getElementById('ach-list');
    list.innerHTML = '';
    ACHIEVEMENTS_DEF.forEach(def => {
      const isU = d.achievementsUnlocked.includes(def.id);
      const prog = DataStore.achProgress(def);
      const val = Math.min(d[def.key] || 0, def.goal);
      const card = document.createElement('div');
      card.className = 'ach-card ' + (isU ? 'unlocked' : 'locked');
      card.innerHTML = `
        <div class="ach-icon">${isU ? def.icon : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-name">${def.name}</div>
          <div class="ach-desc">${def.desc}</div>
          <div class="ach-pbar"><div class="ach-pfill" style="width:${prog*100}%"></div></div>
          <div class="ach-plbl">${val.toLocaleString()} / ${def.goal.toLocaleString()}</div>
        </div>
        <div class="ach-check">${isU ? '✅' : ''}</div>`;
      list.appendChild(card);
    });
  }
};

/* ─── SETTINGS SCREEN ─── */
const SettingsScreen = {
  refresh() {
    const d = DataStore.d;
    document.getElementById('s-sfx').checked   = d.sfx;
    document.getElementById('s-music').checked  = d.music;
    document.getElementById('s-vib').checked    = d.vib;
    document.getElementById('s-quality').value  = d.quality || 'medium';
  }
};

const Settings = {
  toggle(key, val) {
    SoundFX.play('click');
    DataStore.d[key] = val; DataStore.save();
    if (key === 'sfx')   SoundFX.setEnabled(val);
    if (key === 'music') SoundFX.setMusicEnabled(val);
  },
  setQuality(val) { DataStore.d.quality = val; DataStore.save(); },
  reset() {
    if (confirm('Reset all progress? This cannot be undone.')) {
      DataStore.reset(); MenuScreen.refresh();
      toast('Progress reset! 🌱');
    }
  }
};

/* ─── LEVEL COMPLETE SCREEN ─── */
const LCScreen = {
  show(run) {
    // run: {score, items, streak, solar, trees, bins, levelReached, accuracy, bonus,
    //        newBadge, gameOver, currentLevel}
    //
    // Exact gameplay flow (matching sample images):
    //   Level 1 complete → LEVEL COMPLETE! → [NEXT LEVEL ▶]  [HOME]
    //   Level 2 complete → LEVEL COMPLETE! → [NEXT LEVEL ▶]  [HOME]
    //   Level 3 complete → LEVEL COMPLETE! → [RESTART]        [HOME]
    //   Game Over        → GAME OVER → [RETRY ↺]     [HOME]
    //     Retry reloads the SAME level that was being played (not Level 1)

    const isGameOver = run.gameOver === true;
    const isAllDone  = !isGameOver && run.levelReached >= 3;
    const screen     = document.getElementById('s-levelcomplete');

    Nav.go('s-levelcomplete');

    // ── Theme: cyan glow for success, red glow for game over ──
    screen.classList.remove('lc-theme-success', 'lc-theme-gameover');
    screen.classList.add(isGameOver ? 'lc-theme-gameover' : 'lc-theme-success');

    // ── Title (matching sample images exactly) ──
    const titleEl = document.getElementById('lc-title');
    const subEl   = document.querySelector('.lc-sub');
    if (isGameOver) {
      titleEl.innerHTML  = 'GAME OVER';
      titleEl.className  = 'lc-title lc-title-fail';
      subEl.textContent  = 'Level Reached: ' + run.levelReached + '   ·   Final Score: ' + run.score.toLocaleString();
    } else if (isAllDone) {
      titleEl.innerHTML  = 'LEVEL COMPLETE!';
      titleEl.className  = 'lc-title lc-title-win';
      subEl.textContent  = 'All 3 Levels Complete! Eco Hero! 🌍';
    } else {
      titleEl.innerHTML  = 'LEVEL COMPLETE!';
      titleEl.className  = 'lc-title lc-title-win';
      subEl.textContent  = 'Level ' + run.levelReached + ' Complete! Ready for Level ' + (run.levelReached + 1) + '?';
    }

    // ── Stats card ──
    document.getElementById('lc-score').textContent  = run.score.toLocaleString();
    document.getElementById('lc-items').textContent  = run.items;
    document.getElementById('lc-streak').textContent = run.streak + 'x';
    document.getElementById('lc-acc').textContent    = run.accuracy + '%';
    document.getElementById('lc-bonus').textContent  = '+' + run.bonus;

    // ── Stars (hidden on game over) ──
    const starsRow = document.querySelector('.stars-row');
    if (isGameOver) {
      if (starsRow) starsRow.style.display = 'none';
    } else {
      if (starsRow) starsRow.style.display = '';
      const targets = [400, 600, 800];
      const target  = targets[(run.levelReached - 1)] || 400;
      const pct     = run.score / target;
      const stars   = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
      ['st1','st2','st3'].forEach((id, i) => {
        const el = document.getElementById(id);
        el.className = 'star-ico';
        if (i < stars) setTimeout(() => { el.classList.add('lit'); SoundFX.play('beep', 520 + i * 130); }, 250 + i * 200);
      });
    }

    // ── Badge ──
    const br = document.getElementById('lc-badge-row');
    if (run.newBadge) {
      br.style.display = 'flex';
      document.getElementById('lc-badge-name').textContent = run.newBadge;
      setTimeout(() => SoundFX.play('achievement'), 1000);
    } else {
      br.style.display = 'none';
    }

    // ── Action buttons — match sample images ──
    const primaryBtn = document.getElementById('lc-next-btn');

    // Always show the main action button only
    primaryBtn.classList.remove('hidden');

    if (isGameOver) {
      // GAME OVER → RETRY: reload the same level that just ended
      const retryLevel = run.currentLevel || run.levelReached;
      primaryBtn.textContent = '↺  RETRY';
      primaryBtn.className   = 'btn-play-main wide lc-btn-retry';
      primaryBtn.onclick     = () => { SoundFX.play('click'); Game.startLevel(retryLevel); };

    } else if (isAllDone) {
      // Level 3 complete → RESTART (back to Level 1)
      primaryBtn.textContent = '↺  RESTART';
      primaryBtn.className   = 'btn-play-main wide lc-btn-next';
      primaryBtn.onclick     = () => { SoundFX.play('click'); Game.startLevel(1); };

    } else {
      // Level 1 or 2 complete → NEXT LEVEL ▶
      const nextLvl = run.levelReached + 1;
      primaryBtn.innerHTML = 'NEXT LEVEL &#9658;';
      primaryBtn.className = 'btn-play-main wide lc-btn-next';
      primaryBtn.onclick   = () => { SoundFX.play('click'); Game.startLevel(nextLvl); };
    }
  }
};

/* ─── GLOBAL HELPERS ─── */
let _toastTimer;
function toast(msg, color) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.background = color || 'rgba(46,204,113,.94)';
  el.style.color = color ? '#fff' : '#051a08';
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
}

function closeModal(id) {
  SoundFX.play('click');
  document.getElementById(id).classList.add('hidden');
}

function vibrate(pattern) {
  if (DataStore.d.vib && navigator.vibrate) navigator.vibrate(pattern);
}

window.Nav = Nav;
window.MenuScreen = MenuScreen;
window.AchScreen = AchScreen;
window.SettingsScreen = SettingsScreen;
window.Settings = Settings;
window.LCScreen = LCScreen;
window.toast = toast;
window.closeModal = closeModal;
window.vibrate = vibrate;
