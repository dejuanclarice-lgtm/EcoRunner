// ══════════════════════════════════════════
//  profile.js  –  Player Profile Module
// ══════════════════════════════════════════

'use strict';

const EMOJI_OPTIONS = ['🏃','🌍','🌿','☀️','♻️','💧','⚡','🌲','🌱','🌳','🌊','🦋','🐝','🦜','🌺','🏔️','🌈','💎','🔥','❄️','🎯','🦅','🐬','🌙'];

const Profile = {
  refresh() {
    const d = DataStore.d;
    document.getElementById('pf-name').textContent  = d.playerName;
    document.getElementById('pf-code').textContent  = d.friendCode;
    document.getElementById('pf-rank').textContent  = DataStore.getSdgRank();
    document.getElementById('ps-score').textContent = d.bestScore.toLocaleString();
    document.getElementById('ps-level').textContent = d.level;
    document.getElementById('ps-items').textContent = d.totalItems;
    document.getElementById('ps-streak').textContent= d.maxStreak;

    // Avatar
    this._updateAvatarDisplay();

    // Emoji picker
    this._buildEmojiPicker();
  },

  _updateAvatarDisplay() {
    const d = DataStore.d;
    const bigEl  = document.getElementById('profile-avatar-display');
    const imgWrap = document.getElementById('profile-img-wrap');
    const img    = document.getElementById('profile-img');

    if (d.playerImg) {
      bigEl.style.display = 'none';
      imgWrap.style.display = 'block';
      img.src = d.playerImg;
    } else {
      bigEl.style.display = 'block';
      imgWrap.style.display = 'none';
      bigEl.textContent = d.playerEmoji || '🏃';
    }

    // Menu thumb
    const th = document.getElementById('menu-avatar-thumb');
    if (th) {
      if (d.playerImg) {
        th.innerHTML = `<img src="${d.playerImg}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
      } else {
        th.textContent = d.playerEmoji || '🏃';
      }
    }
  },

  _buildEmojiPicker() {
    const grid = document.getElementById('emoji-picker-grid');
    grid.innerHTML = '';
    const cur = DataStore.d.playerEmoji || '🏃';
    EMOJI_OPTIONS.forEach(em => {
      const btn = document.createElement('button');
      btn.className = 'emoji-opt' + (em === cur ? ' selected' : '');
      btn.textContent = em;
      btn.onclick = () => {
        SoundFX.play('click');
        DataStore.d.playerEmoji = em;
        DataStore.d.playerImg = null;   // clear custom image
        DataStore.save();
        grid.querySelectorAll('.emoji-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this._updateAvatarDisplay();
        toast('Avatar updated! ' + em);
      };
      grid.appendChild(btn);
    });
  },

  pickAvatar() {
    // Show options: camera/gallery or emoji
    SoundFX.play('click');
    document.getElementById('profile-img-input').click();
  },

  onImgSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please select an image file'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Compress to max 200x200 for storage
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Crop center
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const b64 = canvas.toDataURL('image/jpeg', 0.75);
        DataStore.d.playerImg = b64;
        DataStore.save();
        this._updateAvatarDisplay();
        toast('Profile photo updated! 📷');
        SoundFX.play('collect');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    event.target.value = '';
  },

  editName() {
    SoundFX.play('click');
    document.getElementById('name-inp').value = DataStore.d.playerName;
    document.getElementById('modal-name').classList.remove('hidden');
    setTimeout(() => document.getElementById('name-inp').focus(), 80);
  },

  saveName() {
    SoundFX.play('click');
    const v = document.getElementById('name-inp').value.trim();
    if (v && v.length >= 2) {
      DataStore.d.playerName = v;
      DataStore.save();
      document.getElementById('pf-name').textContent = v;
      document.getElementById('menu-player-name').textContent = v;
      toast('Name updated! ✓');
    } else {
      toast('Name must be 2+ characters');
    }
    closeModal('modal-name');
  },

  copyCode() {
    const code = DataStore.d.friendCode;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => toast('Code copied! ' + code));
    } else {
      toast('Your code: ' + code);
    }
    SoundFX.play('click');
  }
};
window.Profile = Profile;
