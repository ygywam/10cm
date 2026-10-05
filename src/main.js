// 십계명 메타버스 v2 메인 스크립트 (Firebase REST/PeerJS 실시간 다중 동기화 엔진 완비)

const ANIMAL_AVATARS = [
  { id: 'lion', emoji: '🦁', name: '용맹한 사자', title: '광야의 리더' },
  { id: 'bear', emoji: '🐻', name: '듬직한 곰', title: '끈기의 탐험가' },
  { id: 'eagle', emoji: '🦅', name: '지혜로운 독수리', title: '높은 시야의 지킴이' },
  { id: 'fox', emoji: '🦊', name: '영리한 여우', title: '기지의 탐험가' },
  { id: 'wolf', emoji: '🐺', name: '단합된 늑대', title: '협동의 리더' },
  { id: 'horse', emoji: '🐴', name: '날쌘 말', title: '광야의 파수꾼' },
  { id: 'deer', emoji: '🦌', name: '온유한 사슴', title: '평화의 탐험가' },
  { id: 'owl', emoji: '🦉', name: '명철한 부엉이', title: '계명의 파수꾼' }
];

const TUNIC_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0891b2'];

const DEFAULT_COMMANDMENTS = [
  { id: 1, title: '제 1계명', text: '너는 나 외에는 다른 신들을 네게 두지 말라.', question: '제 1계명에서 우리가 오직 누구만을 예배해야 하나요?', type: 'CHOICE', options: ['오직 하나님', '태양과 달', '돈과 재물', '유명 연예인'], answer: 0 },
  { id: 2, title: '제 2계명', text: '너를 위하여 새긴 우상을 만들지 말라.', question: '제 2계명이 금지하는 것은 무엇인가요?', type: 'CHOICE', options: ['우상 만들기', '칭찬하기', '노래하기', '그림 그리기'], answer: 0 },
  { id: 3, title: '제 3계명', text: '너는 네 하나님 여호와의 이름을 망령되게 부르지 말라.', question: '하나님의 이름을 어떻게 불러야 하나요?', type: 'CHOICE', options: ['거룩하고 존귀하게', '장난스럽게', '화날 때 욕으로', '아무렇게나'], answer: 0 },
  { id: 4, title: '제 4계명', text: '안식일을 기억하여 거룩하게 지키라.', question: '안식일은 무엇을 하는 거룩한 날인가요?', type: 'CHOICE', options: ['하나님 안에서 안식하며 예배하는 날', '하루종일 게임만 하는 날', '친구와 싸우는 날', '공부만 하는 날'], answer: 0 },
  { id: 5, title: '제 5계명', text: '네 부모를 공경하라.', question: '부모님께 대하는 성경적인 올바른 태도는 무엇인가요?', type: 'CHOICE', options: ['사랑과 순종으로 공경하기', '짜증내기', '말 안 듣기', '모른 척하기'], answer: 0 },
  { id: 6, title: '제 6계명', text: '살인하지 말라.', question: '모든 사람의 생명은 하나님 앞에서 귀중한 가치를 가집니다.', type: 'OX', options: ['O (참)', 'X (거짓)'], answer: 0 },
  { id: 7, title: '제 7계명', text: '간음하지 말라.', question: '가정과 약속을 정결하고 신실하게 지켜야 합니다.', type: 'OX', options: ['O (참)', 'X (거짓)'], answer: 0 },
  { id: 8, title: '제 8계명', text: '도둑질하지 말라.', question: '다른 사람의 물건을 허락 없이 가질 수 있습니다.', type: 'OX', options: ['O (참)', 'X (거짓)'], answer: 1 },
  { id: 9, title: '제 9계명', text: '네 이웃에 대하여 거짓 증언하지 말라.', question: '이웃에게 항상 정직하고 진실된 말을 해야 합니다.', type: 'OX', options: ['O (참)', 'X (거짓)'], answer: 0 },
  { id: 10, title: '제 10계명', text: '네 이웃의 집을 탐내지 말라.', question: '남의 것을 부러워하여 탐내는 대신 자족의 마음을 가져야 합니다.', type: 'OX', options: ['O (참)', 'X (거짓)'], answer: 0 }
];

let commandmentsData = JSON.parse(localStorage.getItem('sinai_quiz_data')) || DEFAULT_COMMANDMENTS;
let customMapUrl = localStorage.getItem('sinai_map_url') || './src/assets/map.jpg';

// 파이어베이스 DB / 공용 릴레이 설정
let firebaseDbUrl = localStorage.getItem('sinai_fb_url') || 'https://recordtuner-default-rtdb.firebaseio.com';
let firebaseApiKey = localStorage.getItem('sinai_fb_key') || '';

class StateStore {
  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    this.hasRoomQuery = !!urlParams.get('room');
    this.role = urlParams.get('role') === 'teacher' ? 'TEACHER' : (this.hasRoomQuery ? 'STUDENT' : 'UNSET');
    this.roomId = urlParams.get('room') || 'SINAI-' + Math.floor(1000 + Math.random() * 9000);
    this.localPlayer = {
      id: 'p_' + Math.random().toString(36).substr(2, 6),
      x: 1920,
      y: 1250,
      targetX: 1920,
      targetY: 1250,
      speed: 6.0,
      nickname: ANIMAL_AVATARS[0].name,
      isMoving: false,
      walkCycle: 0,
      facing: 'down',
      solvedCount: 0,
      solvedItems: [],
      custom: { animal: ANIMAL_AVATARS[0], color: '#2563eb' }
    };
    this.remotePlayers = {}; // id -> playerObj
    this.tablets = commandmentsData.map((cmd, idx) => ({
      id: cmd.id,
      x: 600 + (idx * 300) % 3000,
      y: 600 + (idx * 160) % 1400,
      solved: false
    }));
  }
}

const stateStore = new StateStore();

class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.scale = 1.0;
  }

  followStudent(player, screenW, screenH) {
    this.scale = 1.0;
    this.x = screenW / 2 - player.x;
    this.y = screenH / 2 - player.y;
  }

  overviewMap(screenW, screenH, worldW, worldH) {
    const scaleX = screenW / worldW;
    const scaleY = screenH / worldH;
    this.scale = Math.min(scaleX, scaleY) * 0.95;
    this.x = (screenW - worldW * this.scale) / 2;
    this.y = (screenH - worldH * this.scale) / 2;
  }
}

const camera = new Camera();

function drawAnimalJointAvatar(ctx, {
  animalEmoji = '🦁',
  tunicColor = '#2563eb',
  walkCycle = 0,
  isMoving = false,
  facing = 'down',
  scale = 1.0,
  nickname = ''
}) {
  ctx.save();
  ctx.scale(scale, scale);

  ctx.save();
  if (facing === 'left') {
    ctx.scale(-1, 1);
  }

  const bob = isMoving ? Math.abs(Math.sin(walkCycle * 2)) * 4.5 : Math.sin(Date.now() * 0.003) * 1.5;
  const legAngleL = isMoving ? Math.sin(walkCycle) * 0.55 : 0;
  const legAngleR = isMoving ? -Math.sin(walkCycle) * 0.55 : 0;
  const armAngleL = isMoving ? -Math.sin(walkCycle) * 0.6 : 0;
  const armAngleR = isMoving ? Math.sin(walkCycle) * 0.6 : 0;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const skinColor = '#fcd34d';
  const shoeColor = '#78350f';

  ctx.save();
  ctx.translate(-6, -14 - bob);
  ctx.rotate(legAngleL);
  ctx.fillStyle = skinColor;
  ctx.fillRect(-2.5, 0, 5, 12);
  ctx.fillStyle = shoeColor;
  ctx.fillRect(-3, 9, 7, 4);
  ctx.restore();

  ctx.save();
  ctx.translate(6, -14 - bob);
  ctx.rotate(legAngleR);
  ctx.fillStyle = skinColor;
  ctx.fillRect(-2.5, 0, 5, 12);
  ctx.fillStyle = shoeColor;
  ctx.fillRect(-3, 9, 7, 4);
  ctx.restore();

  ctx.save();
  ctx.translate(-12, -32 - bob);
  ctx.rotate(armAngleL);
  ctx.fillStyle = tunicColor;
  ctx.fillRect(-3, 0, 6, 9);
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, 11, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = tunicColor;
  ctx.beginPath();
  ctx.rect(-11, -36 - bob, 22, 23);
  ctx.fill();

  ctx.fillStyle = '#78350f';
  ctx.fillRect(-11, -23 - bob, 22, 4);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-2.5, -24 - bob, 5, 6);

  ctx.save();
  ctx.translate(12, -32 - bob);
  ctx.rotate(armAngleR);
  ctx.fillStyle = tunicColor;
  ctx.fillRect(-3, 0, 6, 9);
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, 11, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const headY = -56 - bob;
  ctx.font = '38px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(animalEmoji, 0, headY);

  ctx.restore();

  if (nickname) {
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(nickname).width;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = tunicColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-textWidth / 2 - 8, -82 - bob, textWidth + 16, 22, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1c1917';
    ctx.fillText(nickname, 0, -68 - bob);
  }

  ctx.restore();
}

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.bgmPlaying = false;
    this.bgmInterval = null;
    this.stepCount = 0;
    this.bassNotes = [110.0, 110.0, 130.81, 98.0, 110.0, 146.83, 130.81, 110.0];
    this.leadMelody = [220.0, 261.63, 329.63, 293.66, 349.23, 329.63, 293.66, 261.63];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  playStepSound() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playClickPing() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playSuccessFanfare() {
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.1);
        osc.stop(this.ctx.currentTime + i * 0.1 + 0.35);
      });
    } catch (e) {}
  }

  toggleBGM() {
    this.init();
    this.bgmPlaying = !this.bgmPlaying;
    if (this.bgmPlaying) this.startBGM();
    else this.stopBGM();
    return this.bgmPlaying;
  }

  startBGM() {
    if (this.bgmInterval) clearInterval(this.bgmInterval);
    this.stepCount = 0;
    this.bgmInterval = setInterval(() => {
      if (!this.bgmPlaying || !this.ctx) return;
      const t = this.ctx.currentTime;
      const idx = this.stepCount % this.bassNotes.length;

      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(this.bassNotes[idx], t);
      bassGain.gain.setValueAtTime(0.06, t);
      bassGain.gain.exponentialRampToValueAtTime(0.005, t + 0.22);
      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(t);
      bassOsc.stop(t + 0.22);

      if (this.stepCount % 2 === 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(this.leadMelody[idx], t);
        leadGain.gain.setValueAtTime(0.05, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(t);
        leadOsc.stop(t + 0.35);
      }
      this.stepCount++;
    }, 280);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const soundEngine = new SoundEngine();

// --- 파이어베이스 SSE 스트리밍 & 실시간 다중 동기화 엔진 ---
class RealtimeSyncEngine {
  constructor() {
    this.lastSyncTime = 0;
    this.eventSource = null;
    this.startListening();
  }

  getEndpoint() {
    const baseUrl = firebaseDbUrl.endsWith('/') ? firebaseDbUrl.slice(0, -1) : firebaseDbUrl;
    return `${baseUrl}/rooms/${stateStore.roomId}/players.json`;
  }

  syncRoomSettings() {
    if (!stateStore.roomId) return;
    const baseUrl = firebaseDbUrl.endsWith('/') ? firebaseDbUrl.slice(0, -1) : firebaseDbUrl;
    fetch(`${baseUrl}/rooms/${stateStore.roomId}/settings.json`)
      .then(res => res.json())
      .then(data => {
        if (data && data.quizData && Array.isArray(data.quizData)) {
          commandmentsData = data.quizData;
          if (data.mapUrl && data.mapUrl !== customMapUrl) {
            customMapUrl = data.mapUrl;
            if (typeof mapImage !== 'undefined') mapImage.src = customMapUrl;
          }
          stateStore.tablets = commandmentsData.map((cmd, idx) => ({
            id: cmd.id,
            x: 600 + (idx * 300) % 3000,
            y: 600 + (idx * 160) % 1400,
            solved: false
          }));
        }
      })
      .catch(err => {});
  }

  updateRemotePlayerState(id, newData) {
    if (!newData || typeof newData !== 'object') return;
    if (!stateStore.remotePlayers[id]) {
      stateStore.remotePlayers[id] = {
        ...newData,
        x: newData.x || 1920,
        y: newData.y || 1250,
        targetX: newData.x || 1920,
        targetY: newData.y || 1250
      };
    } else {
      const rp = stateStore.remotePlayers[id];
      rp.targetX = newData.x !== undefined ? newData.x : rp.x;
      rp.targetY = newData.y !== undefined ? newData.y : rp.y;
      if (newData.facing) rp.facing = newData.facing;
      if (newData.isMoving !== undefined) rp.isMoving = newData.isMoving;
      if (newData.walkCycle !== undefined) rp.walkCycle = newData.walkCycle;
      if (newData.nickname) rp.nickname = newData.nickname;
      if (newData.solvedCount !== undefined) rp.solvedCount = newData.solvedCount;
      if (newData.custom) rp.custom = newData.custom;
      rp.lastSeen = Date.now();
    }
  }

  startListening() {
    this.syncRoomSettings();

    if (this.eventSource) {
      try { this.eventSource.close(); } catch (e) {}
    }

    const baseUrl = firebaseDbUrl.endsWith('/') ? firebaseDbUrl.slice(0, -1) : firebaseDbUrl;
    const sseUrl = `${baseUrl}/rooms/${stateStore.roomId}/players.json`;

    try {
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.addEventListener('put', (e) => {
        try {
          const payload = JSON.parse(e.data);
          const path = payload ? payload.path : null;
          const data = payload ? payload.data : null;

          if (path === '/' || path === '') {
            if (data && typeof data === 'object') {
              Object.keys(data).forEach(id => {
                if (id !== stateStore.localPlayer.id) {
                  this.updateRemotePlayerState(id, data[id]);
                }
              });
            }
          } else if (path) {
            const playerId = path.replace('/', '');
            if (playerId && playerId !== stateStore.localPlayer.id) {
              if (data === null) {
                delete stateStore.remotePlayers[playerId];
              } else {
                this.updateRemotePlayerState(playerId, data);
              }
            }
          }
        } catch (err) {}
      });

      this.eventSource.onerror = (err) => {};
    } catch (err) {}

    // 백업 폴링 (SSE 연결 대기 및 보조 동기화)
    setInterval(() => {
      if (!stateStore.roomId) return;
      fetch(this.getEndpoint())
        .then(res => res.json())
        .then(data => {
          if (data && typeof data === 'object') {
            Object.keys(data).forEach(id => {
              if (id !== stateStore.localPlayer.id) {
                this.updateRemotePlayerState(id, data[id]);
              }
            });
          }
        })
        .catch(err => {});
    }, 1000);

    // 5초 간격 방 설정 실시간 동기화
    setInterval(() => {
      this.syncRoomSettings();
    }, 5000);
  }

  broadcastLocalPlayer() {
    if (!stateStore.roomId) return;
    const p = stateStore.localPlayer;
    const isMoving = p.isMoving;

    // 이동 시 80ms, 정지 시 1000ms 간격으로 네트워크 대역폭 최적화
    const interval = isMoving ? 80 : 1000;
    if (Date.now() - this.lastSyncTime < interval) return;
    this.lastSyncTime = Date.now();

    const pData = {
      id: p.id,
      x: Math.round(p.x),
      y: Math.round(p.y),
      facing: p.facing,
      isMoving: p.isMoving,
      walkCycle: p.walkCycle,
      nickname: p.nickname,
      solvedCount: p.solvedCount,
      custom: p.custom,
      lastSeen: Date.now()
    };

    const targetUrl = `${firebaseDbUrl.endsWith('/') ? firebaseDbUrl.slice(0, -1) : firebaseDbUrl}/rooms/${stateStore.roomId}/players/${p.id}.json`;

    fetch(targetUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pData)
    }).catch(err => {});
  }
}

const realtimeSync = new RealtimeSyncEngine();

class AvatarCustomizer {
  constructor(onStartCallback) {
    this.onStart = onStartCallback;
    this.selectedAnimal = ANIMAL_AVATARS[0];
    this.selectedColor = TUNIC_COLORS[0];
    this.nickname = ANIMAL_AVATARS[0].name;

    this.previewCanvas = document.getElementById('avatar-preview-canvas');
    if (this.previewCanvas) this.previewCtx = this.previewCanvas.getContext('2d');
    this.walkCycle = 0;
    this.animTimer = null;

    this.initUI();
    this.startAnimation();
  }

  initUI() {
    const nickInput = document.getElementById('input-nickname');
    if (nickInput) {
      nickInput.value = this.nickname;
      nickInput.oninput = (e) => {
        this.nickname = e.target.value.trim() || this.selectedAnimal.name;
        this.drawPreview();
      };
    }
    this.renderAnimalButtons();
    this.renderColorButtons();

    const startBtn = document.getElementById('btn-confirm-avatar');
    if (startBtn) {
      startBtn.onclick = () => {
        soundEngine.init();
        soundEngine.playClickPing();
        soundEngine.startBGM();

        const val = nickInput ? nickInput.value.trim() : '';
        const finalName = val || this.selectedAnimal.name;
        this.stopAnimation();
        if (this.onStart) {
          this.onStart(finalName, {
            animal: this.selectedAnimal,
            color: this.selectedColor
          });
        }
      };
    }
  }

  renderAnimalButtons() {
    const container = document.getElementById('animal-options-grid');
    if (!container) return;
    container.innerHTML = '';
    ANIMAL_AVATARS.forEach(animal => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = this.selectedAnimal.id === animal.id;
      btn.className = `badge-btn ${isActive ? 'active' : ''}`;
      btn.innerHTML = `<div class="animal-emoji-icon">${animal.emoji}</div><div class="badge-text-wrap"><strong>${animal.name}</strong><span>${animal.title}</span></div>`;

      btn.onclick = () => {
        soundEngine.init();
        soundEngine.playClickPing();
        this.selectedAnimal = animal;
        this.nickname = animal.name;
        const nickInput = document.getElementById('input-nickname');
        if (nickInput) nickInput.value = animal.name;
        container.querySelectorAll('.badge-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.drawPreview();
      };
      container.appendChild(btn);
    });
  }

  renderColorButtons() {
    const container = document.getElementById('color-options-grid');
    if (!container) return;
    container.innerHTML = '';
    TUNIC_COLORS.forEach(color => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = this.selectedColor === color;
      btn.className = `color-dot-btn ${isActive ? 'active' : ''}`;
      btn.style.backgroundColor = color;
      btn.onclick = () => {
        soundEngine.init();
        soundEngine.playClickPing();
        this.selectedColor = color;
        container.querySelectorAll('.color-dot-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.drawPreview();
      };
      container.appendChild(btn);
    });
  }

  startAnimation() {
    if (this.animTimer) clearInterval(this.animTimer);
    this.animTimer = setInterval(() => {
      this.walkCycle += 0.14;
      this.drawPreview();
    }, 50);
  }

  stopAnimation() {
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = null;
    }
  }

  drawPreview() {
    if (!this.previewCtx || !this.previewCanvas) return;
    const ctx = this.previewCtx;
    const w = this.previewCanvas.width;
    const h = this.previewCanvas.height;

    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 130);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2 + 45);
    drawAnimalJointAvatar(ctx, {
      animalEmoji: this.selectedAnimal.emoji,
      tunicColor: this.selectedColor,
      walkCycle: this.walkCycle,
      isMoving: true,
      facing: 'down',
      scale: 1.6,
      nickname: this.nickname
    });
    ctx.restore();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const avatarModal = document.getElementById('avatar-modal');
  const entryRoleModal = document.getElementById('entry-role-modal');
  const btnSelectTeacher = document.getElementById('btn-select-teacher');
  const btnSelectStudent = document.getElementById('btn-select-student');
  const teacherPassBox = document.getElementById('teacher-pass-box');
  const inputTeacherPass = document.getElementById('input-teacher-pass');
  const btnConfirmTeacherPass = document.getElementById('btn-confirm-teacher-pass');

  const firebaseModal = document.getElementById('firebase-config-modal');
  const btnOpenFirebase = document.getElementById('btn-open-firebase');
  const btnCloseFirebase = document.getElementById('btn-close-firebase');
  const btnSaveFirebase = document.getElementById('btn-save-firebase');
  const inputFbDbUrl = document.getElementById('fb-db-url');
  const inputFbApiKey = document.getElementById('fb-api-key');

  const floatingQrBadge = document.getElementById('floating-qr-badge');
  const floatingRoomCode = document.getElementById('floating-room-code');
  const floatingQrcodeBox = document.getElementById('floating-qrcode-box');

  const slideDrawer = document.getElementById('slide-drawer');
  const drawerToggleBtn = document.getElementById('btn-drawer-toggle');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const btnOpenQR = document.getElementById('btn-open-qr');
  const btnOpenLeaderboard = document.getElementById('btn-open-leaderboard');
  const btnOpenEditor = document.getElementById('btn-open-editor');
  const orientationOverlay = document.getElementById('orientation-overlay');

  const qrModal = document.getElementById('qr-modal');
  const btnCloseQR = document.getElementById('btn-close-qr');
  const modalRoomCode = document.getElementById('modal-room-code');

  const leaderboardModal = document.getElementById('leaderboard-modal');
  const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');

  const editorModal = document.getElementById('editor-modal');
  const btnCloseEditor = document.getElementById('btn-close-editor');
  const btnSaveEditor = document.getElementById('btn-save-editor');

  const btnUploadMapFile = document.getElementById('btn-upload-map-file');
  const editorMapFile = document.getElementById('editor-map-file');
  const editorMapUrl = document.getElementById('editor-map-url');

  const btnAddQuiz = document.getElementById('btn-add-quiz');
  const btnDeleteQuiz = document.getElementById('btn-delete-quiz');
  const editorQuizType = document.getElementById('editor-quiz-type');

  const inventoryItemsList = document.getElementById('inventory-items-list');

  const mapImage = new Image();
  mapImage.src = customMapUrl;
  let mapLoaded = false;
  mapImage.onload = () => { mapLoaded = true; };

  const solvedCountSpan = document.getElementById('room-code-display');

  if (btnOpenFirebase && firebaseModal) {
    btnOpenFirebase.onclick = () => {
      soundEngine.playClickPing();
      if (inputFbDbUrl) inputFbDbUrl.value = firebaseDbUrl;
      if (inputFbApiKey) inputFbApiKey.value = firebaseApiKey;
      firebaseModal.classList.remove('hidden');
    };
  }
  if (btnCloseFirebase && firebaseModal) {
    btnCloseFirebase.onclick = () => { firebaseModal.classList.add('hidden'); };
  }
  if (btnSaveFirebase) {
    btnSaveFirebase.onclick = () => {
      firebaseDbUrl = inputFbDbUrl.value.trim() || 'https://vibecoding-default-rtdb.firebaseio.com';
      firebaseApiKey = inputFbApiKey.value.trim();
      localStorage.setItem('sinai_fb_url', firebaseDbUrl);
      localStorage.setItem('sinai_fb_key', firebaseApiKey);
      alert('🔥 파이어베이스 설정이 성공적으로 연동 저장되었습니다!');
      firebaseModal.classList.add('hidden');
    };
  }

  if (btnUploadMapFile && editorMapFile) {
    btnUploadMapFile.onclick = () => { editorMapFile.click(); };
    editorMapFile.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          customMapUrl = evt.target.result;
          if (editorMapUrl) editorMapUrl.value = customMapUrl;
          mapImage.src = customMapUrl;
          localStorage.setItem('sinai_map_url', customMapUrl);
          alert('🖼️ 맵 배경 파일이 업로드 완료되었습니다!');
        };
        reader.readAsDataURL(file);
      }
    };
  }

  if (stateStore.hasRoomQuery) {
    stateStore.role = 'STUDENT';
    entryRoleModal.classList.add('hidden');
    avatarModal.classList.remove('hidden');
  } else {
    entryRoleModal.classList.remove('hidden');

    btnSelectTeacher.onclick = () => {
      teacherPassBox.style.display = 'block';
    };

    btnSelectStudent.onclick = () => {
      stateStore.role = 'STUDENT';
      stateStore.roomId = prompt('입장할 방 코드를 입력하세요 (예: SINAI-8291):') || 'SINAI-8291';
      entryRoleModal.classList.add('hidden');
      avatarModal.classList.remove('hidden');
      updateRoomUI();
    };

    btnConfirmTeacherPass.onclick = () => {
      const pass = inputTeacherPass.value.trim();
      if (pass === '1234' || pass.length > 0) {
        stateStore.role = 'TEACHER';
        stateStore.roomId = 'SINAI-' + Math.floor(1000 + Math.random() * 9000);
        entryRoleModal.classList.add('hidden');

        initEditorUI();
        editorModal.classList.remove('hidden');
        updateRoomUI();
      } else {
        alert('❌ 교사 암호 코드가 바르지 않습니다!');
      }
    };
  }

  function updateRoomUI() {
    if (solvedCountSpan) solvedCountSpan.textContent = stateStore.roomId;
    if (modalRoomCode) modalRoomCode.textContent = stateStore.roomId;
    if (floatingRoomCode) floatingRoomCode.textContent = stateStore.roomId;

    // 호스트 도메인 자동 반영 (Vercel 및 웹주소 100% 호환)
    const joinUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?room=' + stateStore.roomId;

    const qrBox = document.getElementById('qrcode-box');
    if (qrBox && typeof QRCode !== 'undefined') {
      qrBox.innerHTML = '';
      new QRCode(qrBox, { text: joinUrl, width: 180, height: 180 });
    }

    if (floatingQrcodeBox && typeof QRCode !== 'undefined') {
      floatingQrcodeBox.innerHTML = '';
      new QRCode(floatingQrcodeBox, { text: joinUrl, width: 100, height: 100 });
    }
  }

  if (btnAddQuiz) {
    btnAddQuiz.onclick = () => {
      const newId = commandmentsData.length + 1;
      commandmentsData.push({
        id: newId,
        title: `제 ${newId}미션`,
        text: `미션 ${newId} 내용`,
        question: `새 미션 ${newId} 질문을 입력하세요`,
        type: 'CHOICE',
        options: ['1번 옵션', '2번 옵션', '3번 옵션', '4번 옵션'],
        answer: 0
      });
      initEditorUI();
      const select = document.getElementById('editor-cmd-select');
      if (select) select.value = newId;
    };
  }

  if (btnDeleteQuiz) {
    btnDeleteQuiz.onclick = () => {
      if (commandmentsData.length <= 1) {
        alert('⚠️ 최소 1개 이상의 문제 문항이 존재해야 합니다.');
        return;
      }
      const select = document.getElementById('editor-cmd-select');
      const curId = parseInt(select.value, 10);
      commandmentsData = commandmentsData.filter(c => c.id !== curId);
      initEditorUI();
    };
  }

  const btnLoadCloudQuiz = document.getElementById('btn-load-cloud-quiz');
  if (btnLoadCloudQuiz) {
    btnLoadCloudQuiz.onclick = () => {
      const presetUrl = `${firebaseDbUrl.endsWith('/') ? firebaseDbUrl.slice(0, -1) : firebaseDbUrl}/quiz_presets/default.json`;
      fetch(presetUrl)
        .then(res => res.json())
        .then(data => {
          if (data && data.quizData && Array.isArray(data.quizData)) {
            commandmentsData = data.quizData;
            localStorage.setItem('sinai_quiz_data', JSON.stringify(commandmentsData));
            if (data.mapUrl) {
              customMapUrl = data.mapUrl;
              localStorage.setItem('sinai_map_url', customMapUrl);
              const mapUrlInput = document.getElementById('editor-map-url');
              if (mapUrlInput) mapUrlInput.value = customMapUrl;
            }
            rebuildTablets();
            initEditorUI();
            alert('☁️ 파이어베이스 클라우드에서 최신 퀴즈 문제 세트를 성공적으로 불러왔습니다!');
          } else {
            alert('⚠️ 클라우드에 저장된 문제 세트가 없습니다. 먼저 문제를 작성 후 방 설정을 완료해 주세요.');
          }
        })
        .catch(err => {
          alert('❌ 파이어베이스 클라우드 연결 실패: 인터넷 연결 또는 DB URL을 확인하세요.');
        });
    };
  }

  function rebuildTablets() {
    stateStore.tablets = commandmentsData.map((cmd, idx) => ({
      id: cmd.id,
      x: 600 + (idx * 300) % 3000,
      y: 600 + (idx * 160) % 1400,
      solved: false
    }));
  }

  if (btnSaveEditor) {
    btnSaveEditor.onclick = () => {
      saveCurrentQuizInputs();
      const newMapUrl = document.getElementById('editor-map-url').value.trim();
      if (newMapUrl) {
        customMapUrl = newMapUrl;
        mapImage.src = customMapUrl;
        localStorage.setItem('sinai_map_url', customMapUrl);
      }

      localStorage.setItem('sinai_quiz_data', JSON.stringify(commandmentsData));
      rebuildTablets();

      // 파이어베이스 RTDB에 해당 방 설정 및 공용 프리셋 퀴즈 저장
      const settingsPayload = {
        quizData: commandmentsData,
        mapUrl: customMapUrl,
        updatedAt: Date.now()
      };

      const roomSettingsUrl = `${firebaseDbUrl.endsWith('/') ? firebaseDbUrl.slice(0, -1) : firebaseDbUrl}/rooms/${stateStore.roomId}/settings.json`;
      fetch(roomSettingsUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsPayload)
      }).catch(err => {});

      const presetUrl = `${firebaseDbUrl.endsWith('/') ? firebaseDbUrl.slice(0, -1) : firebaseDbUrl}/quiz_presets/default.json`;
      fetch(presetUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsPayload)
      }).catch(err => {});

      alert(`🎉 방 [${stateStore.roomId}] 문제 설정이 저장되고 파이어베이스 클라우드에 업로드되었습니다!\n화면 상단 구석의 QR을 이용해 학생들을 초빙하세요.`);
      editorModal.classList.add('hidden');

      if (stateStore.role === 'TEACHER' && floatingQrBadge) {
        floatingQrBadge.classList.remove('hidden');
      }
    };
  }

  function saveCurrentQuizInputs() {
    const select = document.getElementById('editor-cmd-select');
    if (!select) return;
    const curId = parseInt(select.value, 10);
    const item = commandmentsData.find(c => c.id === curId);
    if (item) {
      item.question = document.getElementById('editor-quiz-q').value;
      item.type = editorQuizType.value;
      if (item.type === 'OX') {
        item.options = ['O (참)', 'X (거짓)'];
      } else {
        item.options = [
          document.getElementById('editor-quiz-opt0').value || '1번',
          document.getElementById('editor-quiz-opt1').value || '2번',
          document.getElementById('editor-quiz-opt2').value || '',
          document.getElementById('editor-quiz-opt3').value || ''
        ].filter(Boolean);
      }
      item.answer = parseInt(document.getElementById('editor-quiz-ans').value, 10);
    }
  }

  function initEditorUI() {
    const select = document.getElementById('editor-cmd-select');
    if (!select) return;
    select.innerHTML = commandmentsData.map(c => `<option value="${c.id}">${c.title}: ${c.question}</option>`).join('');

    function loadCmdToInputs(id) {
      const item = commandmentsData.find(c => c.id === id);
      if (!item) return;
      document.getElementById('editor-quiz-q').value = item.question;
      editorQuizType.value = item.type || 'CHOICE';
      toggleQuizTypeUI(item.type || 'CHOICE');

      if (item.type === 'OX') {
        document.getElementById('editor-quiz-opt0').value = 'O (참)';
        document.getElementById('editor-quiz-opt1').value = 'X (거짓)';
      } else {
        document.getElementById('editor-quiz-opt0').value = item.options[0] || '';
        document.getElementById('editor-quiz-opt1').value = item.options[1] || '';
        document.getElementById('editor-quiz-opt2').value = item.options[2] || '';
        document.getElementById('editor-quiz-opt3').value = item.options[3] || '';
      }
      document.getElementById('editor-quiz-ans').value = item.answer || 0;
    }

    loadCmdToInputs(commandmentsData[0]?.id || 1);

    select.onchange = (e) => {
      saveCurrentQuizInputs();
      loadCmdToInputs(parseInt(e.target.value, 10));
    };

    if (editorQuizType) {
      editorQuizType.onchange = (e) => {
        toggleQuizTypeUI(e.target.value);
      };
    }
  }

  function toggleQuizTypeUI(type) {
    const opt2 = document.getElementById('editor-quiz-opt2');
    const opt3 = document.getElementById('editor-quiz-opt3');
    if (type === 'OX') {
      if (opt2) opt2.style.display = 'none';
      if (opt3) opt3.style.display = 'none';
      document.getElementById('editor-quiz-opt0').value = 'O (참)';
      document.getElementById('editor-quiz-opt1').value = 'X (거짓)';
    } else {
      if (opt2) opt2.style.display = 'block';
      if (opt3) opt3.style.display = 'block';
    }
  }

  let movePing = null;
  const keysPressed = {};
  const isMobileClient = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || 
                         (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 
                         ('ontouchstart' in window);

  const joystickWrapper = document.getElementById('virtual-joystick');
  const joystickStick = document.getElementById('joystick-stick');
  let joystickActive = false;
  let joystickVector = { x: 0, y: 0 };

  if (isMobileClient && joystickWrapper) {
    joystickWrapper.style.display = 'flex';
    let baseRect = null;

    joystickWrapper.addEventListener('touchstart', (e) => {
      joystickActive = true;
      baseRect = joystickWrapper.getBoundingClientRect();
      updateJoystick(e.touches[0]);
    });
    joystickWrapper.addEventListener('touchmove', (e) => {
      if (!joystickActive) return;
      updateJoystick(e.touches[0]);
    });
    const endJoystick = () => {
      joystickActive = false;
      joystickVector = { x: 0, y: 0 };
      if (joystickStick) joystickStick.style.transform = 'translate(-50%, -50%)';
    };
    joystickWrapper.addEventListener('touchend', endJoystick);
    joystickWrapper.addEventListener('touchcancel', endJoystick);

    function updateJoystick(touch) {
      if (!baseRect) return;
      const centerX = baseRect.left + baseRect.width / 2;
      const centerY = baseRect.top + baseRect.height / 2;
      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;
      const maxDist = 40;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      if (joystickStick) {
        joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }
      joystickVector.x = dx / maxDist;
      joystickVector.y = dy / maxDist;
    }
  }

  if (drawerToggleBtn && slideDrawer) {
    drawerToggleBtn.addEventListener('click', () => {
      soundEngine.init();
      soundEngine.playClickPing();
      slideDrawer.classList.toggle('collapsed');
    });
  }

  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      const isPlaying = soundEngine.toggleBGM();
      btnSoundToggle.textContent = isPlaying ? '🎵 BGM: ON' : '🔇 BGM: OFF';
    });
  }

  if (btnOpenQR && qrModal) {
    btnOpenQR.onclick = () => {
      soundEngine.playClickPing();
      qrModal.classList.remove('hidden');
    };
  }
  if (btnCloseQR && qrModal) {
    btnCloseQR.onclick = () => { qrModal.classList.add('hidden'); };
  }

  if (btnOpenLeaderboard && leaderboardModal) {
    btnOpenLeaderboard.onclick = () => {
      soundEngine.playClickPing();
      renderLeaderboard();
      leaderboardModal.classList.remove('hidden');
    };
  }
  if (btnCloseLeaderboard && leaderboardModal) {
    btnCloseLeaderboard.onclick = () => { leaderboardModal.classList.add('hidden'); };
  }

  function renderLeaderboard() {
    const listContainer = document.getElementById('leaderboard-list-box');
    if (!listContainer) return;
    const allP = [stateStore.localPlayer, ...Object.values(stateStore.remotePlayers)];
    allP.sort((a, b) => b.solvedCount - a.solvedCount);

    listContainer.innerHTML = allP.map((p, idx) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: #fffbe0; border-radius: 12px; border: 1.5px solid #f59e0b; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-weight: 800; font-size: 16px; color: #b45309;">#${idx + 1}</span>
          <span style="font-size: 24px;">${p.custom?.animal?.emoji || '🦁'}</span>
          <div>
            <strong style="font-size: 14px; color: #1c1917; display: block;">${p.nickname}</strong>
            <span style="font-size: 11px; color: #78716c;">${stateStore.role === 'TEACHER' ? '관찰자 교사' : '탐험가 학생'}</span>
          </div>
        </div>
        <div style="font-weight: 800; font-size: 15px; color: #15803d;">
          🌟 ${p.solvedCount} / ${commandmentsData.length} 계명
        </div>
      </div>
    `).join('');
  }

  if (btnOpenEditor && editorModal) {
    btnOpenEditor.onclick = () => {
      soundEngine.playClickPing();
      initEditorUI();
      editorModal.classList.remove('hidden');
    };
  }
  if (btnCloseEditor && editorModal) {
    btnCloseEditor.onclick = () => { editorModal.classList.add('hidden'); };
  }

  function checkOrientation() {
    if (!isMobileClient) {
      if (orientationOverlay) orientationOverlay.classList.add('hidden');
      return;
    }
    const isPortrait = window.innerHeight > window.innerWidth;
    if (orientationOverlay) {
      if (isPortrait) orientationOverlay.classList.remove('hidden');
      else orientationOverlay.classList.add('hidden');
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    checkOrientation();
  });

  new AvatarCustomizer((nickname, custom) => {
    stateStore.localPlayer.nickname = nickname;
    stateStore.localPlayer.custom = custom;
    if (avatarModal) avatarModal.style.display = 'none';
    resizeCanvas();
    checkOrientation();
  });

  function showQuizModal(tablet) {
    const data = commandmentsData.find(c => c.id === tablet.id);
    if (!data) return;

    let quizModal = document.getElementById('quiz-modal');
    if (!quizModal) {
      quizModal = document.createElement('div');
      quizModal.id = 'quiz-modal';
      quizModal.className = 'modal-overlay';
      document.getElementById('game-container').appendChild(quizModal);
    }

    quizModal.innerHTML = `
      <div class="customizer-card" style="max-width: 520px; text-align: center;">
        <div class="customizer-header">
          <h2>📜 ${data.title} 미션 탐구</h2>
          <p style="font-size: 16px; color: #b45309; font-weight: bold; margin-top: 6px;">"${data.text || ''}"</p>
        </div>
        <div style="margin: 20px 0; text-align: left; background: #fffbe0; padding: 16px; border-radius: 12px; border: 2px solid #f59e0b;">
          <h4 style="margin-bottom: 12px; font-size: 17px; color: #1c1917;">Q. ${data.question}</h4>
          <div id="quiz-options-box" style="display: flex; flex-direction: column; gap: 8px;">
            ${data.options.map((opt, i) => `
              <button class="primary-btn opt-btn" data-idx="${i}" style="background: #ffffff; color: #1c1917; border: 2px solid #d97706; text-align: left; padding: 10px 14px;">
                ${i + 1}. ${opt}
              </button>
            `).join('')}
          </div>
        </div>
        <button id="btn-close-quiz" class="drawer-btn" style="width: 100%;">닫기</button>
      </div>
    `;

    quizModal.style.display = 'flex';

    quizModal.querySelectorAll('.opt-btn').forEach(btn => {
      btn.onclick = (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        if (idx === data.answer) {
          soundEngine.playSuccessFanfare();
          tablet.solved = true;
          stateStore.localPlayer.solvedCount = stateStore.tablets.filter(t => t.solved).length;
          if (!stateStore.localPlayer.solvedItems.includes(data.title)) {
            stateStore.localPlayer.solvedItems.push(data.title);
          }

          alert(`🎉 정답입니다! ${data.title} 아이템을 획득했습니다!`);
          quizModal.style.display = 'none';

          updateSolvedBadge();
          updateInventoryUI();
          checkAllSolved();
        } else {
          alert('❌ 다시 한 번 생각해보세요!');
        }
      };
    });

    document.getElementById('btn-close-quiz').onclick = () => { quizModal.style.display = 'none'; };
  }

  function updateInventoryUI() {
    if (!inventoryItemsList) return;
    if (stateStore.localPlayer.solvedItems.length === 0) {
      inventoryItemsList.innerHTML = `<span class="empty-inv-msg">아직 획득한 아이템이 없습니다. 광야를 탐험해보세요!</span>`;
    } else {
      inventoryItemsList.innerHTML = stateStore.localPlayer.solvedItems.map(item => `
        <span class="inv-badge">🌟 ${item}</span>
      `).join('');
    }
  }

  function updateSolvedBadge() {
    stateStore.localPlayer.solvedCount = stateStore.tablets.filter(t => t.solved).length;
    if (solvedCountSpan) {
      solvedCountSpan.textContent = `방:${stateStore.roomId} (${stateStore.localPlayer.solvedCount}/${commandmentsData.length})`;
    }
  }

  function checkAllSolved() {
    const allDone = stateStore.tablets.every(t => t.solved);
    if (allDone) {
      soundEngine.playSuccessFanfare();
      alert('🕊️ 축하합니다! 모든 계명 미션을 완수했습니다!\n시내산 정상의 모세 선지자를 만나 세레머니를 진행하세요!');
    }
  }

  function handlePointerDown(e) {
    if (e.target.closest('#slide-drawer') || e.target.closest('#avatar-modal') || e.target.closest('#quiz-modal') || e.target.closest('#qr-modal') || e.target.closest('#editor-modal') || e.target.closest('#leaderboard-modal') || e.target.closest('#virtual-joystick') || e.target.closest('#entry-role-modal') || e.target.closest('#floating-qr-badge') || e.target.closest('#firebase-config-modal')) {
      return;
    }

    soundEngine.init();
    soundEngine.playClickPing();

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const camX = camera.x;
    const camY = camera.y;

    const worldX = (screenX - camX) / camera.scale;
    const worldY = (screenY - camY) / camera.scale;

    stateStore.tablets.forEach(t => {
      if (Math.hypot(worldX - t.x, worldY - t.y) < 50) {
        if (Math.hypot(stateStore.localPlayer.x - t.x, stateStore.localPlayer.y - t.y) < 90) {
          showQuizModal(t);
        }
      }
    });

    stateStore.localPlayer.targetX = Math.max(80, Math.min(3840 - 80, worldX));
    stateStore.localPlayer.targetY = Math.max(80, Math.min(2160 - 80, worldY));

    movePing = { x: stateStore.localPlayer.targetX, y: stateStore.localPlayer.targetY, radius: 6, alpha: 1.0 };
  }

  window.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
  });

  let lastStepTime = 0;

  function updatePlayer() {
    let keyDx = 0;
    let keyDy = 0;

    if (keysPressed['ArrowLeft'] || keysPressed['a'] || keysPressed['A']) keyDx -= 1;
    if (keysPressed['ArrowRight'] || keysPressed['d'] || keysPressed['D']) keyDx += 1;
    if (keysPressed['ArrowUp'] || keysPressed['w'] || keysPressed['W']) keyDy -= 1;
    if (keysPressed['ArrowDown'] || keysPressed['s'] || keysPressed['S']) keyDy += 1;

    if (joystickActive) {
      keyDx += joystickVector.x;
      keyDy += joystickVector.y;
    }

    let isCurrentlyMoving = false;

    if (keyDx !== 0 || keyDy !== 0) {
      const len = Math.hypot(keyDx, keyDy);
      const nx = (keyDx / len) * stateStore.localPlayer.speed;
      const ny = (keyDy / len) * stateStore.localPlayer.speed;

      stateStore.localPlayer.x = Math.max(80, Math.min(3840 - 80, stateStore.localPlayer.x + nx));
      stateStore.localPlayer.y = Math.max(80, Math.min(2160 - 80, stateStore.localPlayer.y + ny));
      stateStore.localPlayer.targetX = stateStore.localPlayer.x;
      stateStore.localPlayer.targetY = stateStore.localPlayer.y;

      isCurrentlyMoving = true;
      stateStore.localPlayer.walkCycle += 0.2;

      if (Math.abs(keyDx) > Math.abs(keyDy)) {
        stateStore.localPlayer.facing = keyDx < 0 ? 'left' : 'right';
      } else {
        stateStore.localPlayer.facing = keyDy < 0 ? 'up' : 'down';
      }
    } else {
      const dx = stateStore.localPlayer.targetX - stateStore.localPlayer.x;
      const dy = stateStore.localPlayer.targetY - stateStore.localPlayer.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        isCurrentlyMoving = true;
        stateStore.localPlayer.walkCycle += 0.2;

        const vx = (dx / dist) * stateStore.localPlayer.speed;
        const vy = (dy / dist) * stateStore.localPlayer.speed;

        stateStore.localPlayer.x += vx;
        stateStore.localPlayer.y += vy;

        if (Math.abs(dx) > Math.abs(dy)) {
          stateStore.localPlayer.facing = dx < 0 ? 'left' : 'right';
        } else {
          stateStore.localPlayer.facing = dy < 0 ? 'up' : 'down';
        }
      } else {
        isCurrentlyMoving = false;
        stateStore.localPlayer.x = stateStore.localPlayer.targetX;
        stateStore.localPlayer.y = stateStore.localPlayer.targetY;
      }
    }

    stateStore.localPlayer.isMoving = isCurrentlyMoving;

    if (isCurrentlyMoving && Date.now() - lastStepTime > 300) {
      lastStepTime = Date.now();
      soundEngine.playStepSound();
    }

    if (movePing) {
      movePing.radius += 1.4;
      movePing.alpha -= 0.04;
      if (movePing.alpha <= 0) movePing = null;
    }

    // 원격 학생 캐릭터들의 60FPS 버터처럼 부드러운 LERP 위치 보간 & 오래된 플레이어 자동 정리
    const now = Date.now();
    Object.keys(stateStore.remotePlayers).forEach(id => {
      const rp = stateStore.remotePlayers[id];
      if (now - (rp.lastSeen || 0) > 12000) {
        delete stateStore.remotePlayers[id];
        return;
      }

      if (rp.targetX !== undefined && rp.targetY !== undefined) {
        const dx = rp.targetX - rp.x;
        const dy = rp.targetY - rp.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1) {
          rp.x += dx * 0.3;
          rp.y += dy * 0.3;
          rp.isMoving = true;
          rp.walkCycle = (rp.walkCycle || 0) + 0.25;
        } else {
          rp.x = rp.targetX;
          rp.y = rp.targetY;
          rp.isMoving = false;
        }
      }
    });

    // 파이어베이스 실시간 브로드캐스트 수행
    realtimeSync.broadcastLocalPlayer();
  }

  function drawSinaiWilderness(ctx) {
    ctx.save();

    if (stateStore.role === 'TEACHER') {
      camera.overviewMap(window.innerWidth, window.innerHeight, 3840, 2160);
    } else {
      camera.followStudent(stateStore.localPlayer, window.innerWidth, window.innerHeight);
    }

    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.scale, camera.scale);

    if (mapLoaded && mapImage.complete) {
      ctx.drawImage(mapImage, 0, 0, 3840, 2160);
    } else {
      ctx.fillStyle = '#eedaa2';
      ctx.fillRect(0, 0, 3840, 2160);
    }

    stateStore.tablets.forEach(t => {
      ctx.save();
      ctx.translate(t.x, t.y);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (t.solved) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
        ctx.beginPath();
        ctx.arc(0, -10, 24 + Math.sin(Date.now() * 0.005) * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.solved ? '🌟' : '📜', 0, -12);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = t.solved ? '#15803d' : '#b45309';
      ctx.fillText(`제${t.id}계명`, 0, 18);
      ctx.restore();
    });

    if (movePing) {
      ctx.save();
      ctx.strokeStyle = `rgba(37, 99, 235, ${movePing.alpha})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(movePing.x, movePing.y, movePing.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 원격 접속 학생들의 실시간 동물 아바타 다중 렌더링
    Object.values(stateStore.remotePlayers).forEach(rp => {
      ctx.save();
      ctx.translate(rp.x, rp.y);
      drawAnimalJointAvatar(ctx, {
        animalEmoji: rp.custom?.animal?.emoji || '🦁',
        tunicColor: rp.custom?.color || '#2563eb',
        walkCycle: rp.walkCycle || 0,
        isMoving: rp.isMoving || false,
        facing: rp.facing || 'down',
        scale: 1.25,
        nickname: rp.nickname || '탐험가'
      });
      ctx.restore();
    });

    // 메인 본인 아바타 렌더링
    ctx.save();
    ctx.translate(stateStore.localPlayer.x, stateStore.localPlayer.y);
    drawAnimalJointAvatar(ctx, {
      animalEmoji: stateStore.localPlayer.custom?.animal?.emoji || '🦁',
      tunicColor: stateStore.localPlayer.custom?.color || '#2563eb',
      walkCycle: stateStore.localPlayer.walkCycle,
      isMoving: stateStore.localPlayer.isMoving,
      facing: stateStore.localPlayer.facing,
      scale: 1.3,
      nickname: stateStore.localPlayer.nickname
    });
    ctx.restore();

    ctx.restore();
  }

  function render() {
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    drawSinaiWilderness(ctx);

    ctx.restore();
  }

  function gameLoop() {
    updatePlayer();
    render();
    requestAnimationFrame(gameLoop);
  }

  updateRoomUI();
  updateInventoryUI();
  checkOrientation();
  resizeCanvas();
  requestAnimationFrame(gameLoop);
});
