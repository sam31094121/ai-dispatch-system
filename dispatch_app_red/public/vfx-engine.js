/**
 * 兆櫃 AI 派單系統 - 統一 3D 特效引擎 (VFX Engine v3.0)
 * 支援全系統一致的「大獎爆發」與「寫實金錢雨」特效
 */

class MapleCoinRain {
  constructor(canvas) {
    this.cv = canvas;
    this.cx = canvas.getContext('2d', { alpha: true });
    this.W = 0;
    this.H = 0;
    this.running = false;
    this.coins = [];
    this.pile = [];
    this.raf = null;
    this.sprites = {};
    this.lastSpawn = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // 預載入極致寫實鑽石資產
    this.diamondImg = new Image();
    this.diamondImg.src = 'ultra_realistic_diamond_top1_1778480554500.png';
  }

  _resize() {
    const r = this.cv.getBoundingClientRect();
    this.W = r.width;
    this.H = r.height;
    this.cv.width = this.W * this.dpr;
    this.cv.height = this.H * this.dpr;
    this.cx.scale(this.dpr, this.dpr);
  }

  _getCoinSprite(r, isSilver = false) {
    const key = `coin_${r}_${isSilver}`;
    if (this.sprites[key]) return this.sprites[key];

    const pad = 4;
    const size = (Math.round(r) + pad) * 2;
    const sc = document.createElement('canvas');
    sc.width = size * this.dpr;
    sc.height = size * this.dpr;
    const g = sc.getContext('2d');
    g.scale(this.dpr, this.dpr);

    const cx = size / 2, cy = size / 2;
    // 金金屬/銀金屬 漸層
    const metal = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    if (isSilver) {
      metal.addColorStop(0, '#ffffff');
      metal.addColorStop(0.4, '#e0e0e0');
      metal.addColorStop(1, '#a0a0a0');
    } else {
      metal.addColorStop(0, '#fff6df');
      metal.addColorStop(0.4, '#f3c14b');
      metal.addColorStop(1, '#8b6508');
    }

    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fillStyle = metal;
    g.fill();

    // 邊緣刻紋 (Reeding)
    g.strokeStyle = isSilver ? '#909090' : '#b8860b';
    g.lineWidth = 0.5;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      g.lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9);
      g.stroke();
    }

    this.sprites[key] = { canvas: sc, pad };
    return this.sprites[key];
  }

  explode() {
    const count = 45;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 9;
        const type = Math.random() < 0.5 ? 'bill' : 'coin';
        this.coins.push({
            type,
            x: this.W / 2,
            y: this.H / 2,
            z: 0.1,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            vz: 0.02 + Math.random() * 0.06,
            r: 8 + Math.random() * 10,
            bw: 34, bh: 15,
            tilt: Math.random() * Math.PI,
            tiltSpd: (Math.random() - 0.5) * 0.25,
            done: false,
            isExplosion: true
        });
    }
    this.cv.classList.add('shake');
    setTimeout(() => this.cv.classList.remove('shake'), 600);
  }

  _spawn() {
    const rank = parseInt(this.cv.dataset.rank || '1');
    let type = 'coin';
    if (rank === 1) type = Math.random() < 0.6 ? 'diamond' : 'glitter';
    else if (rank === 2) type = 'coin';
    else if (rank === 3) type = Math.random() < 0.3 ? 'bill' : 'silver';
    else if (rank === 4) type = 'bill';

    if (type === 'diamond') {
        const r = 25 + Math.random() * 15;
        this.coins.push({
            type: 'diamond',
            x: Math.random() * this.W,
            y: -r,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 1.5 + Math.random() * 2,
            r,
            tilt: Math.random() * Math.PI * 2,
            tiltSpd: (Math.random() - 0.5) * 0.08,
            done: false
        });
    } else if (type === 'glitter') {
        const r = 1.5 + Math.random() * 2;
        this.coins.push({
            type: 'glitter',
            x: Math.random() * this.W,
            y: -r,
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 3,
            r,
            color: `hsla(${Math.random() * 60 + 40}, 100%, 70%, ${0.6 + Math.random() * 0.4})`,
            done: false
        });
    } else if (type === 'bill') {
        const bw = 32 + Math.random() * 18;
        this.coins.push({
            type: 'bill',
            x: Math.random() * this.W,
            y: -20,
            vx: (Math.random() - 0.5) * 2.5,
            vy: 1.5 + Math.random() * 2,
            bw, bh: bw * 0.45,
            flutter: Math.random() * Math.PI * 2,
            flutterSpd: 0.04 + Math.random() * 0.08,
            done: false
        });
    } else {
        const r = 8 + Math.random() * 8;
        this.coins.push({
            type: type === 'silver' ? 'silver' : 'coin',
            x: Math.random() * this.W,
            y: -r,
            vx: (Math.random() - 0.5) * 2,
            vy: 2 + Math.random() * 4,
            r,
            tilt: Math.random() * Math.PI,
            tiltSpd: (Math.random() - 0.5) * 0.15,
            done: false
        });
    }
  }

  _update() {
    const now = performance.now();
    if (now - this.lastSpawn > 180) {
      this._spawn();
      this.lastSpawn = now;
    }

    for (const c of this.coins) {
      if (c.done) continue;
      if (c.isExplosion) {
          c.x += c.vx; c.y += c.vy; c.z += c.vz;
          c.vx *= 0.97; c.vy *= 0.97; c.tilt += c.tiltSpd;
          if (c.z > 2 || c.y > this.H + 100) c.done = true;
          continue;
      }
      if (c.type === 'bill') {
        c.vy = Math.min(c.vy + 0.15, 6);
        c.x += Math.sin(c.flutter) * 1.5;
        c.flutter += c.flutterSpd;
      } else {
        c.vy = Math.min(c.vy + 0.25, 10);
        c.tilt += c.tiltSpd;
      }
      c.x += c.vx;
      c.y += c.vy;
      if (c.y > this.H + 50) c.done = true;
    }
    this.coins = this.coins.filter(c => !c.done);
  }

  _drawDiamond(c, t) {
    const ctx = this.cx;
    const { x, y, r, tilt } = c;
    
    // 進階：多軸旋轉模擬 (模擬 3D 翻轉)
    const rotX = Math.sin(t * 0.002 + x) * 0.5; // X軸翻轉
    const rotY = Math.cos(t * 0.003 + y) * 0.5; // Y軸翻轉
    const scaleZ = 1 + Math.sin(t * 0.001) * 0.1; // 輕微深度脈動
    
    ctx.save();
    ctx.translate(x, y);
    
    // 模擬 3D 矩陣變換
    ctx.transform(
      Math.cos(tilt) * scaleZ,      // m11
      Math.sin(rotX) * 0.3,         // m12
      Math.sin(rotY) * 0.3,         // m21
      Math.cos(tilt) * scaleZ,      // m22
      0, 0
    );

    // 1. 底層光暈 (Bloom)
    ctx.shadowBlur = 25;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    
    // 2. 繪製「八心八箭」極致鑽石
    if (this.diamondImg.complete) {
        ctx.drawImage(this.diamondImg, -r, -r, r * 2, r * 2);
    }

    // 3. 模擬色散火彩 (Rainbow Fire)
    const fireSeed = Math.sin(t * 0.02 + x);
    if (fireSeed > 0.7) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const angle = (t * 0.01) + (i * Math.PI / 2);
            const dist = r * 0.8;
            ctx.fillStyle = colors[i];
            ctx.globalAlpha = (fireSeed - 0.7) * 0.5;
            ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, r * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    // 4. 強力閃爍 (Sparkle)
    if (fireSeed > 0.9) {
        ctx.beginPath();
        const sSize = r * 1.5;
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.fillRect(-1, -sSize, 2, sSize * 2);
        ctx.fillRect(-sSize, -1, sSize * 2, 2);
    }
    
    ctx.restore();
  }

  _drawBill(c, t) {
    const ctx = this.cx;
    const { x, y, bw, bh, flutter } = c;
    const wave = Math.sin(flutter) * 0.15;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(wave);
    
    // 寫實美金
    ctx.fillStyle = '#2d5a27'; // 墨綠
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    
    // 安全線
    ctx.fillStyle = '#afffa0';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(bw * 0.2, -bh / 2, bw * 0.05, bh);
    
    ctx.restore();
  }

  _drawGlitter(c, t) {
    const ctx = this.cx;
    const alpha = (Math.sin(t * 0.01 + c.x) + 1) * 0.5;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(t * 0.005);
    ctx.fillStyle = c.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(-c.r, -c.r, c.r * 2, c.r * 2);
    ctx.restore();
  }

  _drawItem(c, t) {
    const ctx = this.cx;
    const z = c.z || 0;
    const scale = 1 + z;
    const blur = z > 1 ? (z - 1) * 4 : 0;
    ctx.save();
    if (blur > 0) ctx.filter = `blur(${blur}px)`;
    ctx.translate(c.x, c.y);
    ctx.scale(scale, scale);
    ctx.translate(-c.x, -c.y);
    if (c.type === 'bill') this._drawBill(c, t);
    else if (c.type === 'glitter') this._drawGlitter(c, t);
    else if (c.type === 'diamond') this._drawDiamond(c, t);
    else this._drawItemCoin(c, t);
    ctx.restore();
  }

  _drawItemCoin(c, t) {
    const isSilver = c.type === 'silver';
    const ctx = this.cx;
    const { x, y, r, tilt } = c;
    const squish = Math.max(0.1, Math.abs(Math.cos(tilt)));
    const sprite = this._getCoinSprite(r, isSilver);
    const drawSize = (Math.round(r) + sprite.pad) * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(squish, 1);
    ctx.drawImage(sprite.canvas, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
  }

  _draw() {
    this.cx.clearRect(0, 0, this.W, this.H);
    for (const c of this.coins) this._drawItem(c, performance.now());
  }

  _tick() {
    if (!this.running) return;
    this._update();
    this._draw();
    this.raf = requestAnimationFrame(() => this._tick());
  }

  start() {
    this._resize();
    this.explode();
    this.running = true;
    this._tick();
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}

window.MapleCoinRain = MapleCoinRain;
