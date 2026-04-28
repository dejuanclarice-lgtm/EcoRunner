// ══════════════════════════════════════════
//  data.js  –  Persistence & Achievements
// ══════════════════════════════════════════

'use strict';

const ACHIEVEMENTS_DEF = [
  { id:'eco_explorer',     name:'Eco Explorer',     desc:'Collect 100 eco-items',           goal:100,  key:'totalItems',    icon:'🌱', badge:'Eco Explorer 🌞' },
  { id:'green_champion',   name:'Green Champion',   desc:'Reach Level 3 (Solar City)',      goal:1,    key:'reachedL3',     icon:'🏆', badge:'Green Champion 🏅' },
  { id:'pollution_buster', name:'Pollution Buster', desc:'Avoid 50 obstacles in a row',     goal:50,   key:'maxStreak',     icon:'💨', badge:'Pollution Buster 💨' },
  { id:'solar_savior',     name:'Solar Savior',     desc:'Collect 50 solar panels',         goal:50,   key:'solarTotal',    icon:'☀️', badge:'Solar Savior ☀️' },
  { id:'speed_runner',     name:'Speed Runner',     desc:'Score 2000+ points in one run',   goal:2000, key:'bestScore',     icon:'⚡', badge:'Speed Runner ⚡' },
  { id:'tree_hugger',      name:'Tree Hugger',      desc:'Collect 30 trees',                goal:30,   key:'treesTotal',    icon:'🌲', badge:'Tree Hugger 🌳' },
  { id:'recycler',         name:'Master Recycler',  desc:'Collect 40 recycle bins',         goal:40,   key:'binsTotal',     icon:'♻️', badge:'Master Recycler ♻️' },
  { id:'eco_warrior',      name:'Eco Warrior',      desc:'Score 5000+ total points',        goal:5000, key:'lifetimeScore', icon:'🌍', badge:'Eco Warrior 🌍' },
];

const SDG_RANKS = [
  { name:'Eco Recruit 🌱',   min:0 },
  { name:'Green Cadet 🌿',   min:500 },
  { name:'Eco Defender 💚',  min:1500 },
  { name:'Climate Warrior ⚔️',min:3000 },
  { name:'Earth Guardian 🛡️', min:6000 },
  { name:'Solar Legend ☀️',  min:10000 },
];

const KEY = 'ecorunner3d_v4';
const DEFAULT = {
  playerName: 'EcoHero',
  playerEmoji: '🏃',
  playerImg: null,          // base64 or null
  friendCode: '',
  level: 1,
  bestScore: 0,
  lifetimeScore: 0,
  totalItems: 0,
  maxStreak: 0,
  solarTotal: 0,
  treesTotal: 0,
  binsTotal: 0,
  reachedL3: 0,
  achievementsUnlocked: [],
  sfx: true, music: true, vib: true,
  quality: 'medium',
  friends: [],              // [{name, code, score, level, avatar}]
  localPlayers: [],
  runHistory: []
};

const DataStore = (() => {
  let d = { ...DEFAULT };

  function _genCode() {
    return 'ECO-' + Math.floor(1000 + Math.random() * 9000);
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) d = { ...DEFAULT, ...JSON.parse(raw) };
    } catch(e) {}
    if (!d.friendCode) d.friendCode = _genCode();
    save();
    return d;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e) {}
  }

  function reset() { d = { ...DEFAULT, friendCode: d.friendCode }; save(); }

  function mergeRun(run) {
    // run: {score, items, streak, solar, trees, bins, levelReached, accuracy, bonus}
    d.bestScore = Math.max(d.bestScore, run.score);
    d.lifetimeScore += run.score;
    d.totalItems += run.items;
    d.maxStreak = Math.max(d.maxStreak, run.streak);
    d.solarTotal += run.solar || 0;
    d.treesTotal += run.trees || 0;
    d.binsTotal  += run.bins  || 0;
    if (run.levelReached >= 3) d.reachedL3 = 1;
    if (run.levelReached > d.level) d.level = run.levelReached;
    d.runHistory.unshift({ score: run.score, items: run.items, date: Date.now() });
    d.runHistory = d.runHistory.slice(0, 20);
    save();
  }

  function checkAchievements() {
    const newOnes = [];
    ACHIEVEMENTS_DEF.forEach(def => {
      if (d.achievementsUnlocked.includes(def.id)) return;
      if ((d[def.key] || 0) >= def.goal) {
        d.achievementsUnlocked.push(def.id);
        newOnes.push(def);
      }
    });
    if (newOnes.length) save();
    return newOnes;
  }

  function achProgress(def) { return Math.min((d[def.key] || 0) / def.goal, 1); }

  function getSdgRank() {
    let rank = SDG_RANKS[0];
    SDG_RANKS.forEach(r => { if (d.lifetimeScore >= r.min) rank = r; });
    return rank.name;
  }

  function addFriend(entry) {
    if (d.friends.find(f => f.code === entry.code)) return false;
    d.friends.push(entry); save(); return true;
  }

  load();
  return { d, save, reset, mergeRun, checkAchievements, achProgress, getSdgRank, addFriend };
})();
window.DataStore = DataStore;
