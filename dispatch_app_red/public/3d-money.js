/**
 * Zhaogui AI Dispatch - 3D Virtual Treasure Engine v4.0
 * 實作名次專屬虛擬寶物邏輯：
 * Rank 1: 鑽石 | Rank 2: 黃金 | Rank 3: 美金 | Rank 4: 台幣2000 | Rank 5: 台幣1000
 */

class MoneyRain {
    constructor(canvasId, type = 'dollar', rank = 1) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.type = type; 
        this.rank = rank;
        this.particles = [];
        this.count = rank === 1 ? 50 : (rank === 2 ? 40 : 30);
        this.mouse = { x: -1000, y: -1000 };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width / window.devicePixelRatio;
            const scaleY = this.canvas.height / rect.height / window.devicePixelRatio;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        });
        
        this.init();
    }

    resize() {
        this.width = this.canvas.offsetWidth;
        this.height = this.canvas.offsetHeight;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    init() {
        for (let i = 0; i < this.count; i++) {
            this.particles.push(this.createParticle());
        }
        this.animate();
    }

    createParticle(isExplosion = false) {
        const p = {
            x: isExplosion ? this.width / 2 : Math.random() * this.width,
            y: isExplosion ? this.height / 2 : Math.random() * -this.height,
            vx: isExplosion ? (Math.random() - 0.5) * 15 : 0,
            vy: isExplosion ? (Math.random() - 0.5) * 15 : 0,
            rotationX: Math.random() * 360,
            rotationY: Math.random() * 360,
            rotationZ: Math.random() * 360,
            speed: (0.8 + Math.random() * 2) * (this.rank === 1 ? 1.5 : 1.2),
            rotSpeed: 1 + Math.random() * 3,
            scale: (0.4 + Math.random() * 0.6) * (this.rank === 1 ? 1.3 : 1)
        };
        return p;
    }

    explode() {
        for (let i = 0; i < 20; i++) {
            this.particles.push(this.createParticle(true));
        }
    }

    drawDiamond(p) {
        const ctx = this.ctx;
        const s = p.scale * 10;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotationZ * Math.PI / 180);
        ctx.scale(Math.cos(p.rotationX * Math.PI / 180), 1);
        
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s, -s/2);
        ctx.lineTo(s, s/2);
        ctx.lineTo(0, s);
        ctx.lineTo(-s, s/2);
        ctx.lineTo(-s, -s/2);
        ctx.closePath();
        
        const grad = ctx.createLinearGradient(-s, -s, s, s);
        grad.addColorStop(0, '#e3f2fd');
        grad.addColorStop(0.5, '#4fc3f7');
        grad.addColorStop(1, '#0288d1');
        
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // 閃光
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(-s/3, -s/3, s/4, 0, Math.PI*2);
        ctx.fill();
        
        ctx.restore();
    }

    drawGold(p) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.scale * Math.abs(Math.cos(p.rotationY * Math.PI / 180)), p.scale);
        const grad = ctx.createRadialGradient(-2, -2, 0, 0, 0, 8);
        grad.addColorStop(0, '#fff6df');
        grad.addColorStop(0.4, '#f3c14b');
        grad.addColorStop(1, '#8b6508');
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
        ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 0.5; ctx.stroke();
        ctx.restore();
    }

    drawBill(p, color, label) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotationZ * Math.PI / 180);
        ctx.scale(p.scale * Math.cos(p.rotationX * Math.PI / 180), p.scale);
        ctx.fillStyle = color;
        ctx.fillRect(-18, -9, 36, 18);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-18, -9, 36, 18);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, 0, 3);
        ctx.restore();
    }

    animate() {
        if (!this.canvas) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.particles.forEach((p, index) => {
            // 處理速度 (爆炸用)
            if (p.vx || p.vy) {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.95;
                p.vy *= 0.95;
            }

            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 100) {
                const force = (100 - dist) / 100;
                p.x += dx * force * 0.2;
                p.y += dy * force * 0.2;
            }
            p.y += p.speed;
            p.rotationX += p.rotSpeed;
            p.rotationY += p.rotSpeed;
            p.rotationZ += p.rotSpeed * 0.5;

            // 爆炸粒子如果超出範圍且速度已慢，則移除以保持效能
            if ((p.vx && Math.abs(p.vx) < 0.1) && (p.y > this.height || p.x < 0 || p.x > this.width)) {
                this.particles.splice(index, 1);
                return;
            }

            if (p.y > this.height + 30) {
                p.y = -30; p.x = Math.random() * this.width;
                p.vx = 0; p.vy = 0;
            }
            if (this.type === 'diamond') this.drawDiamond(p);
            else if (this.type === 'gold') this.drawGold(p);
            else if (this.type === 'dollar') this.drawBill(p, '#1e3d1c', '$');
            else if (this.type === 'ntd2000') this.drawBill(p, '#0d47a1', '2000');
            else if (this.type === 'ntd1000') this.drawBill(p, '#1565c0', '1000');
        });
        requestAnimationFrame(() => this.animate());
    }
}

window.moneyEffects = [];
window.initMoneyEffects = function() {
    window.moneyEffects = [
        new MoneyRain('hero-1-canvas', 'diamond', 1),
        new MoneyRain('hero-2-canvas', 'gold', 2),
        new MoneyRain('hero-3-canvas', 'dollar', 3),
        new MoneyRain('hero-4-canvas', 'ntd2000', 4),
        new MoneyRain('hero-5-canvas', 'ntd1000', 5)
    ];
};

window.triggerTreasureExplosion = function() {
    window.moneyEffects.forEach(effect => effect.explode());
};
