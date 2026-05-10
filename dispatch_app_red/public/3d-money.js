/**
 * Zhaogui AI Dispatch - 3D Money Rain Engine v2.0
 * 專為前兩名設計的極致科技感 3D 掉落特效
 */

class MoneyRain {
    constructor(canvasId, type = 'dollar') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.type = type; // 'dollar' or 'coin'
        this.particles = [];
        this.count = 25;
        this.resize();
        window.addEventListener('resize', () => this.resize());
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

    createParticle() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * -this.height,
            z: Math.random() * 100,
            rotationX: Math.random() * 360,
            rotationY: Math.random() * 360,
            rotationZ: Math.random() * 360,
            speed: 1 + Math.random() * 2,
            rotSpeed: Math.random() * 2,
            scale: 0.5 + Math.random() * 0.5
        };
    }

    drawDollar(p) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotationZ * Math.PI / 180);
        ctx.scale(p.scale * Math.cos(p.rotationX * Math.PI / 180), p.scale);
        
        // 美金主體 - 使用更有質感的墨綠與古銅色
        ctx.fillStyle = '#1e3d1c'; 
        ctx.fillRect(-15, -7, 30, 14);
        ctx.strokeStyle = '#d4af37'; // 金色邊框
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-15, -7, 30, 14);
        
        // 美金紋理
        ctx.fillStyle = '#a5d6a7';
        ctx.font = 'bold 8px Arial';
        ctx.fillText('$', -4, 3);
        
        ctx.restore();
    }

    drawCoin(p) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.scale * Math.abs(Math.cos(p.rotationY * Math.PI / 180)), p.scale);
        
        // 金幣主體 - 強化金屬光澤感
        const grad = ctx.createRadialGradient(-3, -3, 0, 0, 0, 8);
        grad.addColorStop(0, '#fff6df'); // 高光
        grad.addColorStop(0.4, '#f3c14b');
        grad.addColorStop(1, '#8b6508'); // 陰影
        
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        ctx.restore();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.particles.forEach(p => {
            p.y += p.speed;
            p.rotationX += p.rotSpeed;
            p.rotationY += p.rotSpeed;
            p.rotationZ += p.rotSpeed * 0.5;
            
            if (p.y > this.height + 20) {
                p.y = -20;
                p.x = Math.random() * this.width;
            }
            
            if (this.type === 'dollar') this.drawDollar(p);
            else this.drawCoin(p);
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// 自動掛載到指定容器 (假設 A1 區域有對應的 Canvas)
window.initMoneyEffects = function() {
    new MoneyRain('hero-1-canvas', 'dollar');
    new MoneyRain('hero-2-canvas', 'coin');
};
