import { CONSTANTS } from '../utils/Constants.js';
import { Bullet } from './Objects.js';

export class Enemy {
    constructor(typeConfig, x, y, game) {
        this.game = game;
        this.type = typeConfig.type;
        this.x = x;
        this.y = y;
        this.width = typeConfig.width;
        this.height = typeConfig.height;
        this.speed = typeConfig.speed;
        this.maxHp = typeConfig.hp;
        this.hp = this.maxHp;
        this.score = typeConfig.score;
        this.color = typeConfig.color;

        this.markedForDeletion = false;

        // Boss / Heavy logic
        this.shootTimer = 0;
        this.isBoss = (this.type === 'BOSS_ELITE' || this.type === 'BOSS_ULTIMATE');

        // 终极BOSS双模式攻击
        this.attackMode = 0; // 0: 跟踪子弹, 1: 旋转激光
        this.modeTimer = 0;
        this.modeDuration = 5; // 每5秒切换模式
        this.laserAngle = 0;
        this.laserActive = false;
        this.laserBullets = [];

        // 难度缩放 - BOSS不受速度倍增影响
        if (!this.isBoss) {
            if (game.scoreManager.score > 5000) this.speed *= 1.5;
            if (game.scoreManager.score > 15000) this.speed *= 1.33; // 总计约2倍
        }
    }

    update(dt) {
        this.y += this.speed;

        // Custom AI per type
        if (this.type === 'HEAVY') {
            this.shootTimer += dt;
            // 高难度下射击频率加快
            let fireInterval = 2;
            if (this.game.scoreManager.score > 5000) fireInterval = 1.5;
            if (this.game.scoreManager.score > 15000) fireInterval = 1;

            if (this.shootTimer > fireInterval) {
                this.shoot();
                this.shootTimer = 0;
            }
        } else if (this.type === 'BOSS_ELITE') {
            // 精英BOSS - 8方向弹幕
            if (this.y > 100) this.y = 100;
            this.x += Math.sin(Date.now() / 1000) * 2;

            this.shootTimer += dt;
            if (this.shootTimer > 1.5) {
                this.bossEliteAttack();
                this.shootTimer = 0;
            }
        } else if (this.type === 'BOSS_ULTIMATE') {
            // 终极BOSS - 双模式攻击
            if (this.y > 100) this.y = 100;
            this.x += Math.sin(Date.now() / 800) * 3;

            // 模式切换计时
            this.modeTimer += dt;
            if (this.modeTimer > this.modeDuration) {
                this.attackMode = (this.attackMode + 1) % 2;
                this.modeTimer = 0;
                this.laserActive = false;
                // 标记所有激光子弹为删除
                this.laserBullets.forEach(b => b.markedForDeletion = true);
                this.laserBullets = [];
            }

            this.shootTimer += dt;
            if (this.attackMode === 0) {
                // 模式0: 跟踪子弹
                if (this.shootTimer > 1.2) {
                    this.fireTrackingBullets();
                    this.shootTimer = 0;
                }
            } else {
                // 模式1: 旋转激光束
                if (!this.laserActive) {
                    this.activateRotatingLasers();
                    this.laserActive = true;
                }
                this.updateRotatingLasers(dt);
            }
        }

        if (this.y > CONSTANTS.CANVAS_HEIGHT) {
            this.markedForDeletion = true;
        }
    }

    shoot() {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height;
        this.game.bullets.push(new Bullet(cx, cy, 0, 5, 'enemy'));
    }

    bossEliteAttack() {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height;

        // 8方向弹幕
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const vx = Math.cos(angle) * 4;
            const vy = Math.sin(angle) * 4;
            this.game.bullets.push(new Bullet(cx, cy, vx, vy, 'enemy'));
        }
    }

    // 终极BOSS - 跟踪子弹
    fireTrackingBullets() {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height;

        // 发射3发跟踪子弹
        for (let i = -1; i <= 1; i++) {
            const bullet = new Bullet(cx + i * 30, cy, i * 0.5, 2, 'tracking', {
                tracking: true,
                trackingSpeed: 0.02,
                target: this.game.player,
                lifetime: 4
            });
            bullet.isPlayer = false;
            this.game.bullets.push(bullet);
        }

        // 同时发射普通散弹
        for (let i = -2; i <= 2; i++) {
            this.game.bullets.push(new Bullet(cx, cy, i * 1.5, 5, 'enemy'));
        }
    }

    // 终极BOSS - 激活旋转激光
    activateRotatingLasers() {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;

        // 创建4条旋转激光
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const laser = new Bullet(cx, cy, 0, 0, 'rotating_laser', {
                angle: angle,
                rotationSpeed: 1.5, // 旋转速度
                origin: { x: cx, y: cy },
                length: 250,
                lifetime: 10
            });
            laser.isPlayer = false;
            laser.boss = this; // 引用BOSS以更新原点
            this.laserBullets.push(laser);
            this.game.bullets.push(laser);
        }
    }

    // 更新旋转激光位置
    updateRotatingLasers(dt) {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;

        this.laserBullets.forEach(laser => {
            if (!laser.markedForDeletion) {
                laser.origin.x = cx;
                laser.origin.y = cy;
            }
        });

        // 清理已删除的激光
        this.laserBullets = this.laserBullets.filter(b => !b.markedForDeletion);
    }

    takeDamage(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) {
            this.hp = 0;
            this.markedForDeletion = true;
            // 清除旋转激光
            this.laserBullets.forEach(b => b.markedForDeletion = true);
            return true; // Killed
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);

        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;

        // Different shapes for different enemies
        ctx.beginPath();
        if (this.type === 'NORMAL') {
            // Triangle
            ctx.moveTo(0, this.height/2);
            ctx.lineTo(this.width/2, -this.height/2);
            ctx.lineTo(-this.width/2, -this.height/2);
        } else if (this.type === 'FAST') {
            // Arrow
            ctx.moveTo(0, this.height/2);
            ctx.lineTo(this.width/2, -this.height/2);
            ctx.lineTo(0, -this.height/2 + 10);
            ctx.lineTo(-this.width/2, -this.height/2);
        } else if (this.type === 'HEAVY') {
            // Square/Hex
            ctx.rect(-this.width/2, -this.height/2, this.width, this.height);
        } else if (this.isBoss) {
            // Complex shape
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.rect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.fill();
        }

        ctx.closePath();
        ctx.stroke();

        // Boss Overlay details
        if (this.isBoss) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            // 终极BOSS模式指示器
            if (this.type === 'BOSS_ULTIMATE') {
                ctx.globalAlpha = 1;
                ctx.fillStyle = this.attackMode === 0 ? '#ff00ff' : '#ff0000';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(this.attackMode === 0 ? 'TRACKING' : 'LASER', 0, -this.height/2 - 10);
            }
        }

        ctx.restore();
    }
}
