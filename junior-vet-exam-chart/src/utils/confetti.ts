// 軽量キャンバス紙吹雪・キラキラエフェクト（外部ライブラリ不要）

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  shape: 'circle' | 'square' | 'star' | 'paw';
  alpha: number;
}

export function fireConfetti(options?: { originX?: number; originY?: number; count?: number }) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const count = options?.count ?? 45;
  const startX = options?.originX ?? width / 2;
  const startY = options?.originY ?? height / 2;

  const colors = [
    '#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6',
    '#06b6d4', '#10b981', '#f59e0b', '#fbbf24'
  ];
  const shapes: Particle['shape'][] = ['circle', 'square', 'star', 'paw'];

  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      alpha: 1,
    });
  }

  let animationFrameId: number;
  const gravity = 0.28;
  const drag = 0.985;

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    let activeCount = 0;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;
      p.vx *= drag;
      p.vy *= drag;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.012;

      if (p.alpha <= 0) continue;
      activeCount++;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'paw') {
        // 小さな肉球
        ctx.beginPath();
        ctx.ellipse(0, 2, p.size * 0.45, p.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-p.size * 0.3, -p.size * 0.25, p.size * 0.16, 0, Math.PI * 2);
        ctx.arc(0, -p.size * 0.4, p.size * 0.16, 0, Math.PI * 2);
        ctx.arc(p.size * 0.3, -p.size * 0.25, p.size * 0.16, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'star') {
        ctx.beginPath();
        for (let s = 0; s < 5; s++) {
          ctx.lineTo(Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size);
          ctx.lineTo(Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size / 2));
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
