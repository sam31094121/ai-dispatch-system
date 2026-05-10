/**
 * Project Apex - 3D 空間物理渲染引擎 v1.0
 * 功能：真實感財富堆疊、空間邏輯、科技感交互
 */
class ApexEngine {
    constructor() {
        this.container = document.getElementById('apex-canvas-container');
        this.objects = [];
        this.isRunning = false;
        this.lastTime = 0;
        this.gravity = 0.5;
        this.friction = 0.98;
        this.groundY = window.innerHeight - 50;
        
        this.init();
    }

    init() {
        if (!this.container) {
            const div = document.createElement('div');
            div.id = 'apex-canvas-container';
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.left = '0';
            div.style.width = '100%';
            div.style.height = '100%';
            div.style.pointerEvents = 'none';
            div.style.zIndex = '5';
            div.style.perspective = '1200px';
            div.style.overflow = 'hidden';
            document.body.appendChild(div);
            this.container = div;
        }

        window.addEventListener('resize', () => {
            this.groundY = window.innerHeight - 50;
        });

        this.start();
    }

    start() {
        this.isRunning = true;
        requestAnimationFrame(this.loop.bind(this));
    }

    spawn(type, count = 1) {
        const assets = {
            diamond: 'assets/diamond.png',
            gold: 'assets/gold.png',
            money: 'assets/money.png'
        };

        const imgSrc = assets[type] || assets.money;

        for (let i = 0; i < count; i++) {
            const obj = {
                el: document.createElement('img'),
                x: Math.random() * window.innerWidth,
                y: -100 - (Math.random() * 500),
                z: Math.random() * 200 - 100,
                vx: (Math.random() - 0.5) * 10,
                vy: Math.random() * 5,
                vz: (Math.random() - 0.5) * 5,
                rotation: Math.random() * 360,
                rv: (Math.random() - 0.5) * 10,
                scale: type === 'diamond' ? 0.3 : (type === 'gold' ? 0.4 : 0.5)
            };

            obj.el.src = imgSrc;
            obj.el.style.position = 'absolute';
            obj.el.style.width = '150px';
            obj.el.style.transformStyle = 'preserve-3d';
            obj.el.style.willChange = 'transform';
            this.container.appendChild(obj.el);
            this.objects.push(obj);
        }
    }

    loop(time) {
        if (!this.isRunning) return;
        
        const dt = (time - this.lastTime) / 16;
        this.lastTime = time;

        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            // 物理運算
            obj.vy += this.gravity * dt;
            obj.x += obj.vx * dt;
            obj.y += obj.vy * dt;
            obj.z += obj.vz * dt;
            obj.rotation += obj.rv * dt;

            // 碰撞地面與堆疊邏輯
            const stackHeight = obj.stackedHeight || 0;
            if (obj.y > this.groundY - stackHeight) {
                obj.y = this.groundY - stackHeight;
                obj.vy *= -0.3; // 降低彈跳增加沈重感
                obj.vx *= this.friction;
                obj.rv *= this.friction;
                
                // 停止運動後進入堆疊狀態
                if (Math.abs(obj.vy) < 1 && Math.abs(obj.vx) < 0.1) {
                    obj.isStacked = true;
                    // 為下一層物件提供支撐
                    this.objects.forEach(other => {
                        if (other !== obj && !other.isStacked && Math.abs(other.x - obj.x) < 60) {
                            other.stackedHeight = (other.stackedHeight || 0) + 20;
                        }
                    });
                }
            }

            // 更新 DOM
            obj.el.style.transform = `translate3d(${obj.x}px, ${obj.y}px, ${obj.z}px) rotate(${obj.rotation}deg) scale(${obj.scale})`;
            obj.el.style.opacity = obj.y > this.groundY + 100 ? 0 : 1;
        }

        requestAnimationFrame(this.loop.bind(this));
    }

    // 當數據大幅更新時觸發「大撒幣」
    triggerExplosion(rank) {
        if (rank === 1) this.spawn('diamond', 30);
        else if (rank === 2) this.spawn('gold', 25);
        else if (rank <= 5) this.spawn('money', 20);
    }
}

// 初始化全局引擎
window.apexEngine = new ApexEngine();
