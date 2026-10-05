// 십계명 메타버스 v2 메인 스크립트 (교사 비밀코드 인증, 방 개설 & 상단 구석 플로팅 QR 완비)

// --- 데이터: 8종 동물 탐험가 & 튜닉 색상 ---
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
  { id: 1, title: '제 1계명', text: '너는 나 외에는 다른 신들을 네게 두지 말라.', question: '제 1계명에서 우리가 오직 누구만을 예배해야 하나요?', options: ['오직 하나님', '태양과 달', '돈과 재물', '유명 연예인'], answer: 0 },
  { id: 2, title: '제 2계명', text: '너를 위하여 새긴 우상을 만들지 말라.', question: '제 2계명이 금지하는 것은 무엇인가요?', options: ['우상 만들기', '칭찬하기', '노래하기', '그림 그리기'], answer: 0 },
  { id: 3, title: '제 3계명', text: '너는 네 하나님 여호와의 이름을 망령되게 부르지 말라.', question: '하나님의 이름을 어떻게 불러야 하나요?', options: ['거룩하고 존귀하게', '장난스럽게', '화날 때 욕으로', '아무렇게나'], answer: 0 },
  { id: 4, title: '제 4계명', text: '안식일을 기억하여 거룩하게 지키라.', question: '안식일은 무엇을 하는 거룩한 날인가요?', options: ['하나님 안에서 안식하며 예배하는 날', '하루종일 게임만 하는 날', '친구와 싸우는 날', '공부만 하는 날'], answer: 0 },
  { id: 5, title: '제 5계명', text: '네 부모를 공경하라.', question: '부모님께 대하는 성경적인 올바른 태도는 무엇인가요?', options: ['사랑과 순종으로 공경하기', '짜증내기', '말 안 듣기', '모른 척하기'], answer: 0 },
  { id: 6, title: '제 6계명', text: '살인하지 말라.', question: '제 6계명이 우리에게 가르쳐 주는 생명의 가치는 무엇인가요?', options: ['모든 사람의 생명을 귀중히 여기기', '남을 아프게 하기', '생명을 경시하기', '나만 중요하게 생각하기'], answer: 0 },
  { id: 7, title: '제 7계명', text: '간음하지 말라.', question: '가정과 약속을 거룩하게 지키는 마음은 무엇인가요?', options: ['정결함과 신실함', '거짓말하기', '약속 어기기', '욕심 부리기'], answer: 0 },
  { id: 8, title: '제 8계명', text: '도둑질하지 말라.', question: '다른 사람의 물건을 대할 때의 바른 태도는 무엇인가요?', options: ['허락 없이 가져가지 않기', '몰래 가져오기', '탐내기', '빼앗기'], answer: 0 },
  { id: 9, title: '제 9계명', text: '네 이웃에 대하여 거짓 증언하지 말라.', question: '이웃과 친구들에게 어떤 말을 해야 하나요?', options: ['진실하고 정직한 말', '거짓 소문 내기', '험담하기', '속이기'], answer: 0 },
  { id: 10, title: '제 10계명', text: '네 이웃의 집을 탐내지 말라.', question: '남의 것을 부러워하여 욕심내는 대신 가져야 할 마음은?', options: ['감사하는 자족의 마음', '시기하고 질투하는 마음', '빼앗으려는 마음', '불평하는 마음'], answer: 0 }
];

let commandmentsData = JSON.parse(localStorage.getItem('sinai_quiz_data')) || DEFAULT_COMMANDMENTS;
let customMapUrl = localStorage.getItem('sinai_map_url') || './src/assets/map.jpg';

// 전역 룸 & 역할 상태 관리
class StateStore {
  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    this.hasRoomQuery = !!urlParams.get('room');
    this.role = urlParams.get('role') === 'teacher' ? 'TEACHER' : (this.hasRoomQuery ? 'STUDENT' : 'UNSET');
    this.roomId = urlParams.get('room') || '';
    this.localPlayer = {
      id: 'p_' + Math.random().toString(36).substr(2, 6),
      x: 1920,
      y: 1300,
      targetX: 1920,
      targetY: 1300,
      speed: 6.0,
      nickname: ANIMAL_AVATARS[0].name,
      isMoving: false,
      walkCycle: 0,
      facing: 'down',
      solvedCount: 0,
      custom: { animal: ANIMAL_AVATARS[0], color: '#2563eb' }
    };
    this.remotePlayers = {};
    this.tablets = [
      { id: 1, x: 600, y: 700, solved: false },
      { id: 2, x: 1250, y: 950, solved: false },
      { id: 3, x: 2750, y: 750, solved: false },
      { id: 4, x: 1550, y: 1950, solved: false },
      { id: 5, x: 3150, y: 1850, solved: false },
      { id: 6, x: 900, y: 2000, solved: false },
      { id: 7, x: 2300, y: 1650, solved: false },
      { id: 8, x: 1800, y: 650, solved: false },
      { id: 9, x: 3300, y: 1100, solved: false },
      { id: 10, x: 1920, y: 380, solved: false }
    ];
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

// ==========================================
// 메인 APP 오케스트레이터
// ==========================================
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

  const mapImage = new Image();
  mapImage.src = customMapUrl;
  let mapLoaded = false;
  mapImage.onload = () => { mapLoaded = true; };

  const solvedCountSpan = document.getElementById('room-code-display');

  // --- 진입 모달 분기 (교사 비밀코드 인증 & 학생 QR 접속 분기) ---
  if (stateStore.hasRoomQuery) {
    // 학생 QR 스캔 자동 진입
    stateStore.role = 'STUDENT';
    entryRoleModal.classList.add('hidden');
    avatarModal.classList.remove('hidden');
  } else {
    // 진입 역할 선택 모달 출력
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

        // 교사 퀴즈 & 방 개설 모달 바로 오픈
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

    const joinUrl = window.location.origin + window.location.pathname + '?room=' + stateStore.roomId;

    // 모달용 QR
    const qrBox = document.getElementById('qrcode-box');
    if (qrBox && typeof QRCode !== 'undefined') {
      qrBox.innerHTML = '';
      new QRCode(qrBox, { text: joinUrl, width: 180, height: 180 });
    }

    // 화면 상단 구석 상시 플로팅 QR
    if (floatingQrcodeBox && typeof QRCode !== 'undefined') {
      floatingQrcodeBox.innerHTML = '';
      new QRCode(floatingQrcodeBox, { text: joinUrl, width: 100, height: 100 });
    }
  }

  // 교사가 방 개설 완료 버튼을 눌렀을 때 플로팅 QR 뱃지 노출
  if (btnSaveEditor) {
    btnSaveEditor.onclick = () => {
      const select = document.getElementById('editor-cmd-select');
      const curId = parseInt(select.value, 10);
      const item = commandmentsData.find(c => c.id === curId);
      if (item) {
        item.question = document.getElementById('editor-quiz-q').value;
        item.options[0] = document.getElementById('editor-quiz-opt0').value;
        item.options[1] = document.getElementById('editor-quiz-opt1').value;
        item.options[2] = document.getElementById('editor-quiz-opt2').value;
        item.options[3] = document.getElementById('editor-quiz-opt3').value;
        item.answer = parseInt(document.getElementById('editor-quiz-ans').value, 10);
      }

      const newMapUrl = document.getElementById('editor-map-url').value.trim();
      if (newMapUrl) {
        customMapUrl = newMapUrl;
        mapImage.src = customMapUrl;
        localStorage.setItem('sinai_map_url', customMapUrl);
      }

      localStorage.setItem('sinai_quiz_data', JSON.stringify(commandmentsData));

      // 개설 완료 알림 & 상단 구석 플로팅 QR 뱃지 활성화
      alert(`🎉 방 [${stateStore.roomId}] 문제 설정이 완료되었습니다!\n화면 상단 좌측 구석의 QR을 이용해 학생들을 만드신 방으로 초대하세요.`);
      editorModal.classList.add('hidden');

      if (stateStore.role === 'TEACHER' && floatingQrBadge) {
        floatingQrBadge.classList.remove('hidden');
      }
    };
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
          🌟 ${p.solvedCount} / 10 계명
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

  function initEditorUI() {
    const select = document.getElementById('editor-cmd-select');
    if (!select) return;
    select.innerHTML = commandmentsData.map(c => `<option value="${c.id}">${c.title}: ${c.text}</option>`).join('');

    function loadCmdToInputs(id) {
      const item = commandmentsData.find(c => c.id === id);
      if (!item) return;
      document.getElementById('editor-quiz-q').value = item.question;
      document.getElementById('editor-quiz-opt0').value = item.options[0] || '';
      document.getElementById('editor-quiz-opt1').value = item.options[1] || '';
      document.getElementById('editor-quiz-opt2').value = item.options[2] || '';
      document.getElementById('editor-quiz-opt3').value = item.options[3] || '';
      document.getElementById('editor-quiz-ans').value = item.answer;
    }

    loadCmdToInputs(1);
    select.onchange = (e) => loadCmdToInputs(parseInt(e.target.value, 10));
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
          <h2>📜 ${data.title} 비석 탐구</h2>
          <p style="font-size: 16px; color: #b45309; font-weight: bold; margin-top: 6px;">"${data.text}"</p>
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
          alert(`🎉 정답입니다! ${data.title} 비석을 성공적으로 수집했습니다!`);
          quizModal.style.display = 'none';

          updateSolvedBadge();
          checkAllSolved();
        } else {
          alert('❌ 다시 한 번 생각해보세요!');
        }
      };
    });

    document.getElementById('btn-close-quiz').onclick = () => { quizModal.style.display = 'none'; };
  }

  function updateSolvedBadge() {
    stateStore.localPlayer.solvedCount = stateStore.tablets.filter(t => t.solved).length;
    if (solvedCountSpan) {
      solvedCountSpan.textContent = `방:${stateStore.roomId} (${stateStore.localPlayer.solvedCount}/10)`;
    }
  }

  function checkAllSolved() {
    const allDone = stateStore.tablets.every(t => t.solved);
    if (allDone) {
      soundEngine.playSuccessFanfare();
      alert('🕊️ 축하합니다! 십계명 10개의 비석을 모두 모았습니다!\n시내산 정상의 모세 선지자를 만나 세레머니를 진행하세요!');
    }
  }

  function handlePointerDown(e) {
    if (e.target.closest('#slide-drawer') || e.target.closest('#avatar-modal') || e.target.closest('#quiz-modal') || e.target.closest('#qr-modal') || e.target.closest('#editor-modal') || e.target.closest('#leaderboard-modal') || e.target.closest('#virtual-joystick') || e.target.closest('#entry-role-modal') || e.target.closest('#floating-qr-badge')) {
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

    Object.values(stateStore.remotePlayers).forEach(rp => {
      ctx.save();
      ctx.translate(rp.x, rp.y);
      drawAnimalJointAvatar(ctx, {
        animalEmoji: rp.custom?.animal?.emoji || '🦁',
        tunicColor: rp.custom?.color || '#2563eb',
        walkCycle: rp.walkCycle,
        isMoving: rp.isMoving,
        facing: rp.facing,
        scale: 1.25,
        nickname: rp.nickname
      });
      ctx.restore();
    });

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
  checkOrientation();
  resizeCanvas();
  requestAnimationFrame(gameLoop);
});
