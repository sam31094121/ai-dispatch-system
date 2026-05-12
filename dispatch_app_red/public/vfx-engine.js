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
    
    // 預載入 Project Apex 極致實體資產
    this.diamondImg = new Image();
    this.diamondImg.src = 'war_room_refracted_diamond_final_1778481582281.png';
    
    this.goldBarImg = new Image();
    this.goldBarImg.src = 'ultra_realistic_gold_bar_top2_1778482392660.png';

    this.silverBarImg = new Image();
    this.silverBarImg.src = 'ultra_realistic_rank3_rank4_assets_1778482757686.png';
    
    this.mapleCoinImg = new Image();
    this.mapleCoinImg.src = 'swiss_maple_coin.png';
    
    this.cashBundleImg = new Image();
    this.cashBundleImg.src = 'ultra_realistic_rank3_rank4_assets_1778482757686.png';
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
    else if (rank === 2) type = Math.random() < 0.7 ? 'goldbar' : 'coin';
    else if (rank === 3) type = Math.random() < 0.8 ? 'maplecoin' : 'glitter';
    else if (rank === 4) type = Math.random() < 0.7 ? 'cashbundle' : 'bill';

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
    } else if (type === 'goldbar' || type === 'silverbar') {
        const bw = 35 + Math.random() * 15;
        this.coins.push({
            type: type,
            x: Math.random() * this.W,
            y: -20,
            vx: (Math.random() - 0.5) * 1.2,
            vy: type === 'goldbar' ? 3.5 : 2.8,
            bw, bh: bw * 0.45,
            tilt: Math.random() * Math.PI * 2,
            tiltSpd: (Math.random() - 0.5) * 0.06,
            done: false
        });
    } else if (type === 'maplecoin') {
        const bw = 30 + Math.random() * 10;
        this.coins.push({
            type: 'maplecoin',
            x: Math.random() * this.W,
            y: -20,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 3.0 + Math.random() * 1.5,
            bw, bh: bw,
            tilt: Math.random() * Math.PI * 2,
            tiltSpd: (Math.random() - 0.5) * 0.1,
            done: false
        });
    } else if (type === 'cashbundle') {
        const bw = 45 + Math.random() * 15;
        this.coins.push({
            type: 'cashbundle',
            x: Math.random() * this.W,
            y: -20,
            vx: (Math.random() - 0.5) * 1,
            vy: 2 + Math.random() * 2,
            bw, bh: bw * 0.5,
            tilt: Math.random() * Math.PI * 2,
            tiltSpd: (Math.random() - 0.5) * 0.1,
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

  triggerBurst() {
    const count = 30;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 5 + Math.random() * 10;
        this.coins.push({
            x: this.W / 2,
            y: this.H / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            tilt: Math.random() * 360,
            tiltSpd: Math.random() * 0.2 - 0.1,
            type: parseInt(this.cv.dataset.rank || '1') === 1 ? 'diamond' : (parseInt(this.cv.dataset.rank || '1') === 2 ? 'goldbar' : (parseInt(this.cv.dataset.rank || '1') === 3 ? 'maplecoin' : 'silverbar')),
            life: 80 + Math.random() * 40
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
      
      // 物理模擬優化
      c.vy = Math.min(c.vy + 0.25, 12);
      c.x += c.vx;
      c.y += c.vy;
      c.tilt += c.tiltSpd;

      // 觸發鏡頭光暈 (當物件落入頂部區域時)
      if (c.y > 50 && c.y < 55 && Math.random() > 0.8) {
          const flare = document.getElementById('lens-flare');
          if (flare) {
              flare.classList.remove('flare-active');
              void flare.offsetWidth; // 觸發重繪
              flare.classList.add('flare-active');
          }
      }

      // 落地反彈與堆疊邏輯 (New)
      const floor = this.H - 10;
      if (c.y > floor) {
          if (c.vy > 2) {
              // 發生碰撞反彈
              c.y = floor;
              c.vy *= -0.4; // 能量損耗反彈
              c.vx *= 0.6;
              c.tiltSpd *= 0.5;
              
              // 觸發鏡頭震動 (大型物件落地)
              if (c.type === 'goldbar' || c.type === 'diamond') {
                  this.cv.classList.add('impact-shake');
                  setTimeout(() => this.cv.classList.remove('impact-shake'), 100);
              }
          } else {
              // 速度過低，進入堆疊狀態
              c.y = floor;
              c.vx *= 0.9;
              c.vy = 0;
              // 緩慢消失
              c.life = (c.life || 100) - 1;
              if (c.life <= 0) c.done = true;
          }
      }
    }
    this.coins = this.coins.filter(c => !c.done);
  }

  _drawDiamond(c, t) {
    const ctx = this.cx;
    const { x, y, r, tilt, vy } = c;
    
    // 1. 空間透視計算：模擬 Z 軸深度 (從遠處落向眼前)
    // 讓鑽石在下墜過程中逐漸放大，產生 3D 衝擊感
    const progress = Math.min(1, y / this.H);
    const perspectiveScale = 0.5 + progress * 0.8; // 從 0.5倍 放大到 1.3倍
    
    // 2. 多軸空間翻轉 (模擬真實物理旋轉)
    const rotX = Math.sin(t * 0.003 + x) * 0.6;
    const rotY = Math.cos(t * 0.004 + y) * 0.6;
    const motionBlur = Math.min(15, vy * 0.7);
    
    ctx.save();
    ctx.translate(x, y);
    
    // 3. 繪製 3D 空間拖尾 (增強墜落深度)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 1; i <= 4; i++) {
        ctx.globalAlpha = 0.12 / i;
        const trailScale = perspectiveScale * (1 - i * 0.05);
        ctx.drawImage(this.diamondImg, -r * trailScale, -r * trailScale - (i * vy * 2), r * 2 * trailScale, r * 2 * trailScale);
    }
    ctx.restore();

    // 4. 應用 3D 矩陣變換
    ctx.scale(perspectiveScale, perspectiveScale);
    ctx.transform(
        Math.cos(tilt), Math.sin(rotX) * 0.4, 
        Math.sin(rotY) * 0.4, Math.cos(tilt), 
        0, 0
    );

    // 5. 極致寫實渲染
    if (this.diamondImg.complete) {
        // 動態模糊處理
        if (motionBlur > 3) ctx.filter = `blur(${motionBlur}px)`;
        
        ctx.shadowBlur = 40;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        
        // 繪製本體
        ctx.drawImage(this.diamondImg, -r, -r, r * 2, r * 2);
        
        // 模擬折射高光 (隨旋轉變動)
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = (Math.sin(t * 0.01 + x) + 1) * 0.4;
        ctx.drawImage(this.diamondImg, -r, -r, r * 2, r * 2);
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
    }

    // 6. 核心閃爍 (Sparkle)
    if (Math.sin(t * 0.02 + x) > 0.9) {
        ctx.beginPath();
        const sSize = r * 2;
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
        ctx.fillRect(-0.5, -sSize, 1, sSize * 2);
        ctx.fillRect(-sSize, -0.5, sSize * 2, 1);
        
        // 新增：極致折射火彩粒子 (Prismatic Dust)
        for(let i=0; i<5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = r * (1 + Math.random());
            ctx.fillStyle = `hsla(${Math.random()*360}, 100%, 70%, 0.6)`;
            ctx.beginPath();
            ctx.arc(Math.cos(angle)*dist, Math.sin(angle)*dist, 1, 0, Math.PI*2);
            ctx.fill();
        }
    }
    
    ctx.restore();
  }

  _drawGoldBar(c, t) {
    const ctx = this.cx;
    const { x, y, bw, bh, tilt, vy } = c;
    
    // 1. 空間透視計算 (與鑽石一致的 3D 深度感)
    const progress = Math.min(1, y / this.H);
    const perspectiveScale = 0.6 + progress * 0.7; // 遠小近大
    
    // 2. 空間翻轉矩陣
    const rotX = Math.sin(t * 0.001 + x) * 0.8;
    const rotY = Math.cos(t * 0.002 + y) * 0.4;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(perspectiveScale, perspectiveScale);
    
    // 3D 投影變換
    ctx.transform(1, Math.sin(rotX) * 0.3, Math.sin(rotY) * 0.3, 1, 0, 0);
    ctx.rotate(tilt);

    // 3. 物理陰影
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';

    // 4. 繪製金磚本體 (具備 24K 鏡面反射)
    if (this.goldBarImg.complete) {
        ctx.drawImage(this.goldBarImg, -bw/2, -bh/2, bw, bh);
        
        // 5. 動態鏡面掃描
        ctx.globalCompositeOperation = 'overlay';
        const shineX = (Math.sin(t * 0.005) * bw);
        const grad = ctx.createLinearGradient(shineX - 25, 0, shineX + 25, 0);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(-bw/2, -bh/2, bw, bh);
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  }

  _drawSilverBar(c, t) {
    const ctx = this.cx;
    const { x, y, bw, bh, tilt } = c;
    const progress = Math.min(1, y / this.H);
    const perspectiveScale = 0.6 + progress * 0.6;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(perspectiveScale, perspectiveScale);
    ctx.rotate(tilt);
    
    // 繪製銀磚 (從生成圖中切分，此處暫以全圖模擬，後續可優化為裁切)
    if (this.silverBarImg.complete) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.drawImage(this.silverBarImg, -bw/2, -bh/2, bw, bh);
    }
    ctx.restore();
  }

  _drawMapleCoin(c, t) {
    const ctx = this.cx;
    const { x, y, bw, bh, tilt } = c;
    const progress = Math.min(1, y / this.H);
    const perspectiveScale = 0.6 + progress * 0.6;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(perspectiveScale, perspectiveScale);
    ctx.rotate(tilt);
    
    // 3D 扭曲模擬金幣翻轉
    const flip = Math.sin(t * 0.005 + x) * 0.8;
    ctx.transform(1, 0, 0, Math.max(0.1, Math.abs(flip)), 0, 0);

    if (this.mapleCoinImg.complete) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.drawImage(this.mapleCoinImg, -bw/2, -bh/2, bw, bh);
        
        // 增強金屬反光
        ctx.globalCompositeOperation = 'overlay';
        const shineY = (Math.sin(t * 0.01) * bh);
        const grad = ctx.createLinearGradient(0, shineY - 15, 0, shineY + 15);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(-bw/2, -bh/2, bw, bh);
    }
    ctx.restore();
  }

  _drawCashBundle(c, t) {
    const ctx = this.cx;
    const { x, y, bw, bh, tilt } = c;
    const progress = Math.min(1, y / this.H);
    const perspectiveScale = 0.7 + progress * 0.5;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(perspectiveScale, perspectiveScale);
    ctx.rotate(tilt);
    
    // 繪製現鈔束
    if (this.cashBundleImg.complete) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.drawImage(this.cashBundleImg, -bw/2, -bh/2, bw, bh);
    }
    ctx.restore();
  }

  _drawBill(c, t) {
    const ctx = this.cx;
    const { x, y, bw, bh, flutter } = c;
    const wave = Math.sin(flutter) * 0.2;
    
    // 美金也加入 3D 透視
    const progress = Math.min(1, y / this.H);
    const perspectiveScale = 0.7 + progress * 0.5;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(perspectiveScale, perspectiveScale);
    ctx.rotate(wave);
    
    // 3D 扭曲模擬
    ctx.transform(1, Math.sin(flutter) * 0.2, 0, 1, 0, 0);
    
    // 寫實美金樣式
    ctx.fillStyle = '#1b3d1b';
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    
    // 安全線
    ctx.fillStyle = '#7cff7c';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(bw * 0.1, -bh / 2, bw * 0.04, bh);
    
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
    else if (c.type === 'goldbar') this._drawGoldBar(c, t);
    else if (c.type === 'silverbar') this._drawSilverBar(c, t);
    else if (c.type === 'maplecoin') this._drawMapleCoin(c, t);
    else if (c.type === 'cashbundle') this._drawCashBundle(c, t);
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
