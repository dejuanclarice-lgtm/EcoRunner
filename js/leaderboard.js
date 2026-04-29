// ══════════════════════════════════════════
//  leaderboard.js  –  Leaderboard System
//  Global / Friends / Local
// ══════════════════════════════════════════

'use strict';

// Simulated global players (realistic eco-themed community)
const GLOBAL_PLAYERS = [
  { name:'EcoWarrior',   level:25, score:15420, emoji:'⭐', color:'#f9c74f', online:true,  country:'PH' },
  { name:'GreenHero',    level:24, score:14250, emoji:'🌿', color:'#74c69d', online:true,  country:'JP' },
  { name:'TreeHugger',   level:23, score:13890, emoji:'🌲', color:'#cd7f32', online:false, country:'US' },
  { name:'CleanAir',     level:22, score:11230, emoji:'💧', color:'#4dd0e1', online:true,  country:'KR' },
  { name:'SolarPunk',    level:21, score:10980, emoji:'☀️', color:'#f4845f', online:true,  country:'BR' },
  { name:'EcoNinja',     level:20, score:9870,  emoji:'♻️', color:'#9c27b0', online:false, country:'DE' },
  { name:'GreenMind',    level:18, score:8450,  emoji:'🌍', color:'#2ecc71', online:true,  country:'PH' },
  { name:'EarthSaver',   level:17, score:7200,  emoji:'💚', color:'#27ae60', online:false, country:'AU' },
  { name:'WindRider',    level:15, score:6100,  emoji:'🌬️', color:'#90e0ef', online:true,  country:'GB' },
  { name:'SeedPlanter',  level:14, score:5400,  emoji:'🌱', color:'#52b788', online:false, country:'IN' },
  { name:'OceanGuard',   level:13, score:4800,  emoji:'🌊', color:'#0096c7', online:true,  country:'TH' },
  { name:'SkyRunner',    level:12, score:4100,  emoji:'☁️', color:'#ade8f4', online:false, country:'SG' },
];

const LOCAL_PLAYERS = [
  { name:'IloiloGreen',  level:8,  score:3200, emoji:'🌺', color:'#ff6b9d', online:true,  country:'PH' },
  { name:'JaniuayHero',  level:6,  score:2100, emoji:'🌻', color:'#ffd60a', online:true,  country:'PH' },
  { name:'WVSURunner',   level:5,  score:1800, emoji:'🎓', color:'#6c5ce7', online:false, country:'PH' },
  { name:'EcoStudent',   level:4,  score:1200, emoji:'📚', color:'#4ecdc4', online:true,  country:'PH' },
];

const LBScreen = {
  currentTab: 'global',
  _refreshInterval: null,

  tab(name) {
    SoundFX.play('click');
    this.currentTab = name;
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');

    const infoEl = document.getElementById('lb-tab-desc');

    if (name === 'global') {
      infoEl.textContent = 'Top eco-runners worldwide competing for the highest green score';
    } else if (name === 'friends') {
      infoEl.textContent = 'Challenge your friends in the leaderboard!';
    } else {
      infoEl.textContent = 'Top eco-runners in your local area (Western Visayas, PH)';
    }

    this.render(name);
  },

  render(tab) {
    tab = tab || this.currentTab;
    let entries = this._buildEntries(tab);
    this._renderPodium(entries.slice(0, 3));
    this._renderList(entries.slice(3), entries);
  },

  _buildEntries(tab) {
    const d = DataStore.d;
    const you = {
      name: d.playerName,
      level: d.level,
      score: d.bestScore,
      emoji: d.playerEmoji || '🏃',
      img: d.playerImg,
      color: '#2ecc71',
      online: true,
      isYou: true,
      country: 'PH'
    };

    let pool;
    if (tab === 'global') {
      pool = GLOBAL_PLAYERS.map(p => ({ ...p, isYou: false }));
    } else if (tab === 'friends') {
      // Real friends + simulated ones if empty
      const realFriends = (d.friends || []).map(f => ({ ...f, isYou: false, online: Math.random() > 0.4 }));
      const fakeFriends = realFriends.length < 2 ? [
        { name:'ClassmateA', level:5, score:1500, emoji:'🌿', color:'#74c69d', online:true, isYou:false, country:'PH' },
        { name:'FriendB',    level:3, score:800,  emoji:'♻️', color:'#9c27b0', online:false,isYou:false, country:'PH' },
      ] : [];
      pool = [...realFriends, ...fakeFriends];
    } else {
      pool = LOCAL_PLAYERS.map(p => ({ ...p, isYou: false }));
    }

    // Insert "You" at correct position
    const all = [...pool];
    let inserted = false;
    for (let i = 0; i < all.length; i++) {
      if (you.score > all[i].score) { all.splice(i, 0, you); inserted = true; break; }
    }
    if (!inserted) all.push(you);
    return all;
  },

  _renderPodium(top3) {
    const podium = document.getElementById('lb-podium');
    podium.innerHTML = '';
    // Display order: 2nd, 1st, 3rd
    const order = [top3[1], top3[0], top3[2]].filter(Boolean);
    order.forEach(p => {
      if (!p) return;
      const rank = top3.indexOf(p) + 1;
      const cls = `r${rank}`;
      const el = document.createElement('div');
      el.className = `pod-item ${cls}`;

      const avatarContent = p.img
        ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
        : p.emoji;

      el.innerHTML = `
        ${rank===1 ? '<div class="pod-crown">👑</div>' : '<div style="height:26px"></div>'}
        <div class="pod-avatar">${avatarContent}</div>
        <div class="pod-name">${p.isYou ? 'You' : p.name}</div>
        <div class="pod-score">${p.score.toLocaleString()}</div>
        <div class="pod-rank-badge">${rank}</div>
        ${p.online ? '<div class="lb-online-dot" style="margin-top:4px"></div>' : '<div style="height:12px"></div>'}
      `;
      podium.appendChild(el);
    });
  },

  _renderList(rest, all) {
    const list = document.getElementById('lb-list');
    list.innerHTML = '';
    rest.forEach((p) => {
      const rank = all.indexOf(p) + 1;
      const el = document.createElement('div');
      el.className = 'lb-row' + (p.isYou ? ' you' : '');

      const avatarContent = p.img
        ? `<img src="${p.img}" alt="${p.name}"/>`
        : p.emoji;

      el.innerHTML = `
        <div class="lb-rank">${rank}</div>
        <div class="lb-av" style="background:${p.color||'#444'}">${avatarContent}</div>
        <div class="lb-info">
          <div class="lb-name">${p.isYou ? 'You (' + p.name + ')' : p.name}</div>
          <div class="lb-level">Level ${p.level} · ${p.country || '??'}</div>
        </div>
        ${p.online && !p.isYou ? '<div class="lb-online-dot"></div>' : ''}
        <div class="lb-pts">${p.score.toLocaleString()}</div>
      `;
      list.appendChild(el);
    });

    if (rest.length === 0) {
      list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,.4);padding:24px;font-size:.85rem">No other players yet.<br>Share your friend code to invite!</div>';
    }
  },

  refresh() {
    SoundFX.play('click');
    // Simulate slight score changes (live feel)
    GLOBAL_PLAYERS.forEach(p => {
      if (p.online && Math.random() > 0.6) p.score += Math.floor(Math.random() * 50);
    });
    this.render(this.currentTab);
    toast('Leaderboard refreshed! ↻');
  },

  copyCode() {
    const code = DataStore.d.friendCode;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => toast('Friend code copied! ' + code));
    } else {
      toast('Your code: ' + code);
    }
    SoundFX.play('click');
  },

  addFriend() {
    const inp = document.getElementById('lb-code-input');
    const code = inp.value.trim().toUpperCase();
    if (!code || code.length < 4) { toast('Enter a valid friend code'); return; }
    if (code === DataStore.d.friendCode) { toast("That's your own code! 😄"); return; }

    // Simulate finding a player by code
    const fakeName = 'Friend_' + code.slice(-4);
    const added = DataStore.addFriend({
      name: fakeName, code, score: Math.floor(Math.random() * 3000),
      level: Math.floor(Math.random() * 10) + 1,
      emoji: '🌿', color: '#74c69d'
    });

    if (added) {
      toast('Friend added: ' + fakeName + ' 🎉');
      SoundFX.play('achievement');
      inp.value = '';
      this.render('friends');
    } else {
      toast('Already friends!');
    }
  }
};
window.LBScreen = LBScreen;
