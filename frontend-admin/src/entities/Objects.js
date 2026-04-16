import { CONSTANTS } from '../utils/Constants.js';
import { Helpers } from '../utils/Helpers.js';

// 背景粒子类 - 流动霓虹粒子特效
export class BackgroundParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Helpers.randomRange(1, 3);
        this.speed = Helpers.randomRange(0.5, 2);
        this.opacity = Helpers.randomRange(0.2, 0.6);
        // 随机选择霓虹色
        const colors = [CONSTANTS.COLORS.NEON_BLUE, CONSTANTS.COLORS.NEON_PURPLE, CONSTANTS.COLORS.NEON_GREEN];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(dt, score) {
        // 向下移动
        this.y += this.speed;

        // 随游戏进度增加速度
        const speedMultiplier = 1 + (score / 20000);
        this.y += this.speed * speedMultiplier * 0.5;

        // 脉动效果
        this.pulsePhase += dt * 2;

        // 超出屏幕后重置到顶部
        if (this.y > CONSTANTS.CANVAS_HEIGHT) {
            this.y = -10;
            this.x = Helpers.randomRange(0, CONSTANTS.CANVAS_WIDTH);
        }
    }

    draw(ctx) {
        ctx.save();
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
        ctx.globalAlpha = this.opacity * pulse;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class Particle {
    constructor(x, y, color, speed, size, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        const angle = Helpers.randomRange(0, Math.PI * 2);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.markedForDeletion = false;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= dt;
        this.size *= 0.95; // Shrink

        if (this.life <= 0 || this.size < 0.1) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class Bullet {
    constructor(x, y, vx, vy, type = 'normal', options = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.width = type === 'laser' ? 6 : (type === 'rotating_laser' ? 8 : CONSTANTS.BULLET.SIZE);
        this.height = type === 'laser' ? 40 : (type === 'rotating_laser' ? 60 : 10);
        this.markedForDeletion = false;
        this.isPlayer = (type !== 'enemy' && type !== 'tracking' && type !== 'rotating_laser');

        // 跟踪子弹属性
        this.isTracking = options.tracking || false;
        this.trackingSpeed = options.trackingSpeed || 0.03;
        this.target = options.target || null;
        this.lifetime = options.lifetime ?? 10;

        // 旋转激光属性
        this.angle = options.angle || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
        this.origin = options.origin || { x: x, y: y };
        this.length = options.length || 200;
    }

    update(dt) {
        this.lifetime -= dt;

        if (this.isTracking && this.target && !this.target.markedForDeletion) {
            // 跟踪玩家
            const dx = this.target.x + this.target.width/2 - this.x;
            const dy = this.target.y + this.target.height/2 - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 0) {
                const targetVx = (dx / dist) * 4;
                const targetVy = (dy / dist) * 4;
                this.vx += (targetVx - this.vx) * this.trackingSpeed;
                this.vy += (targetVy - this.vy) * this.trackingSpeed;
            }
        }

        if (this.type === 'rotating_laser') {
            // 旋转激光围绕原点旋转
            this.angle += this.rotationSpeed * dt;
            this.x = this.origin.x + Math.cos(this.angle) * 30;
            this.y = this.origin.y + Math.sin(this.angle) * 30;
        } else {
            this.x += this.vx;
            this.y += this.vy;
        }

        // Boundary check
        if (this.lifetime < 0 ||
            this.y < -100 || this.y > CONSTANTS.CANVAS_HEIGHT + 100 ||
            this.x < -100 || this.x > CONSTANTS.CANVAS_WIDTH + 100) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();

        if (this.type === 'rotating_laser') {
            // 旋转激光束绘制
            ctx.strokeStyle = CONSTANTS.COLORS.NEON_RED;
            ctx.shadowColor = CONSTANTS.COLORS.NEON_RED;
            ctx.shadowBlur = 15;
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.8;

            const endX = this.origin.x + Math.cos(this.angle) * this.length;
            const endY = this.origin.y + Math.sin(this.angle) * this.length;

            ctx.beginPath();
            ctx.moveTo(this.origin.x, this.origin.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // 激光核心
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.origin.x, this.origin.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            ctx.restore();
            return;
        }

        if (this.type === 'normal') {
            ctx.fillStyle = CONSTANTS.COLORS.NEON_BLUE;
            ctx.shadowColor = CONSTANTS.COLORS.NEON_BLUE;
        } else if (this.type === 'enemy') {
            ctx.fillStyle = CONSTANTS.COLORS.NEON_RED;
            ctx.shadowColor = CONSTANTS.COLORS.NEON_RED;
        } else if (this.type === 'tracking') {
            ctx.fillStyle = CONSTANTS.COLORS.NEON_PURPLE;
            ctx.shadowColor = CONSTANTS.COLORS.NEON_PURPLE;
        } else if (this.type === 'laser') {
            ctx.fillStyle = CONSTANTS.COLORS.NEON_PURPLE;
            ctx.shadowColor = CONSTANTS.COLORS.NEON_PURPLE;
        }

        ctx.shadowBlur = 10;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);

        // 子弹尾迹光效
        if (this.type === 'normal' || this.type === 'laser') {
            ctx.globalAlpha = 0.3;
            ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height * 0.5);
        }

        // 跟踪子弹特效
        if (this.isTracking) {
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

export class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // POWER, SHIELD, LIFE, LASER
        this.width = 30;
        this.height = 30;
        this.vy = 1; // Falls slowly
        this.markedForDeletion = false;
        this.text = type === 'POWER' ? 'W' :
                    type === 'SHIELD' ? 'Sh' :
                    type === 'LIFE' ? 'Li' : 'L';

        this.color = type === 'LIFE' ? CONSTANTS.COLORS.NEON_RED :
                     type === 'SHIELD' ? CONSTANTS.COLORS.NEON_GREEN :
                     type === 'LASER' ? CONSTANTS.COLORS.NEON_PURPLE :
                     CONSTANTS.COLORS.NEON_BLUE;
    }

    update(dt) {
        this.y += this.vy;
        if (this.y > CONSTANTS.CANVAS_HEIGHT) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        // Draw box
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fill();
        ctx.stroke();

        // Draw text
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x + this.width/2, this.y + this.height/2);
        ctx.restore();
    }
}
