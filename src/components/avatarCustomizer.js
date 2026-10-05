// 8종 동물 아이콘 얼굴 + 관절 보행 아바타 커스터마이저 모듈
import { drawAnimalJointAvatar } from '../engine/avatarRenderer.js';

export const ANIMAL_AVATARS = [
  { id: 'lion', emoji: '🦁', name: '용맹한 사자', title: '광야의 리더' },
  { id: 'bear', emoji: '🐻', name: '듬직한 곰', title: '끈기의 탐험가' },
  { id: 'eagle', emoji: '🦅', name: '지혜로운 독수리', title: '높은 시야의 지킴이' },
  { id: 'fox', emoji: '🦊', name: '영리한 여호우', title: '기지의 탐험가' },
  { id: 'wolf', emoji: '🐺', name: '단합된 늑대', title: '협동의 리더' },
  { id: 'horse', emoji: '🐴', name: '날쌘 말', title: '광야의 파수꾼' },
  { id: 'deer', emoji: '🦌', name: '온유한 사슴', title: '평화의 탐험가' },
  { id: 'owl', emoji: '🦉', name: '명철한 부엉이', title: '계명의 파수꾼' }
];

export const TUNIC_COLORS = [
  '#2563eb', // 푸른 튜닉
  '#dc2626', // 붉은 튜닉
  '#16a34a', // 초록 튜닉
  '#d97706', // 주황 튜닉
  '#9333ea', // 보라 튜닉
  '#0891b2'  # 청록 튜닉
];

export class AvatarCustomizer {
  constructor(onStartCallback) {
    this.onStart = onStartCallback;
    this.selectedAnimal = ANIMAL_AVATARS[0];
    this.selectedColor = TUNIC_COLORS[0];
    this.nickname = ANIMAL_AVATARS[0].name;

    this.previewCanvas = document.getElementById('avatar-preview-canvas');
    if (this.previewCanvas) {
      this.previewCtx = this.previewCanvas.getContext('2d');
    }

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

      const iconDiv = document.createElement('div');
      iconDiv.className = 'animal-emoji-icon';
      iconDiv.textContent = animal.emoji;

      const textWrap = document.createElement('div');
      textWrap.className = 'badge-text-wrap';
      textWrap.innerHTML = `<strong>${animal.name}</strong><span>${animal.title}</span>`;

      btn.appendChild(iconDiv);
      btn.appendChild(textWrap);

      btn.onclick = () => {
        this.selectedAnimal = animal;
        this.nickname = animal.name;
        const nickInput = document.getElementById('input-nickname');
        if (nickInput) {
          nickInput.value = animal.name;
        }

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

    // 배경 부드러운 빛
    const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 130);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2 + 45);

    // 동물 관절 보행 아바타 미리보기 (1.6배)
    drawAnimalJointAvatar(ctx, {
      animalEmoji: this.selectedAnimal.emoji,
      tunicColor: this.selectedColor,
      walkCycle: this.walkCycle,
      isMoving: true,
      facing: 'down',
      scale: 1.6
    });

    ctx.restore();

    // 머리 위 닉네임 태그
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    const nick = this.nickname || this.selectedAnimal.name;
    const textWidth = ctx.measureText(nick).width;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = this.selectedColor;
    ctx.lineWidth = 2.5;
    
    ctx.beginPath();
    ctx.rect(w / 2 - textWidth / 2 - 10, h - 36, textWidth + 20, 26);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1c1917';
    ctx.fillText(nick, w / 2, h - 18);
  }
}
