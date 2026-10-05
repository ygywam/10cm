// 8종 동물 아이콘 얼굴 + 관절(Joint/Limb) 보행 아바타 렌더러
export function drawAnimalJointAvatar(ctx, {
  animalEmoji = '🦁',
  tunicColor = '#2563eb',
  walkCycle = 0,
  isMoving = false,
  facing = 'down',
  scale = 1.0
}) {
  ctx.save();
  ctx.scale(scale, scale);

  const bob = isMoving ? Math.abs(Math.sin(walkCycle * 2)) * 4.5 : Math.sin(Date.now() * 0.003) * 1.5;
  const legAngleL = isMoving ? Math.sin(walkCycle) * 0.55 : 0;
  const legAngleR = isMoving ? -Math.sin(walkCycle) * 0.55 : 0;
  const armAngleL = isMoving ? -Math.sin(walkCycle) * 0.6 : 0;
  const armAngleR = isMoving ? Math.sin(walkCycle) * 0.6 : 0;

  // 1. 그림자
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  if (facing === 'left') {
    ctx.scale(-1, 1);
  }

  const skinColor = '#fcd34d';
  const shoeColor = '#78350f';

  // 2. 관절 다리 & 신발 (왼다리 / 오른다리)
  // 왼다리
  ctx.save();
  ctx.translate(-6, -14 - bob);
  ctx.rotate(legAngleL);
  ctx.fillStyle = skinColor;
  ctx.fillRect(-2.5, 0, 5, 12);
  ctx.fillStyle = shoeColor;
  ctx.fillRect(-3, 9, 7, 4);
  ctx.restore();

  // 오른다리
  ctx.save();
  ctx.translate(6, -14 - bob);
  ctx.rotate(legAngleR);
  ctx.fillStyle = skinColor;
  ctx.fillRect(-2.5, 0, 5, 12);
  ctx.fillStyle = shoeColor;
  ctx.fillRect(-3, 9, 7, 4);
  ctx.restore();

  // 3. 뒷팔 (왼팔)
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

  // 4. 몸통 (튜닉 의상)
  ctx.fillStyle = tunicColor;
  ctx.beginPath();
  ctx.rect(-11, -36 - bob, 22, 23);
  ctx.fill();

  // 허리띠 & 버클
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-11, -23 - bob, 22, 4);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-2.5, -24 - bob, 5, 6);

  // 5. 앞팔 (오른팔)
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

  // 6. 동물 아이콘 얼굴 (이모지 렌더링)
  const headY = -56 - bob;
  ctx.font = '38px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(animalEmoji, 0, headY);

  ctx.restore();
  ctx.restore();
}
