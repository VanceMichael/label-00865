import { CONSTANTS } from '../utils/Constants.js';
import { Bullet } from './Objects.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.width = CONSTANTS.PLAYER.WIDTH;
        this.height = CONSTANTS.PLAYER.HEIGHT;
        this.x = CONSTANTS.CANVAS_WIDTH / 2 - this.width / 2;
        this.y = CONSTANTS.CANVAS_HEIGHT - 100;
        this.speed = CONSTANTS.PLAYER.SPEED;

        this.lives = 3;
        this.maxLives = 5;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;

        this.fireTimer = 0;
        this.baseFireRate = CONSTANTS.PLAYER.FIRE_RATE; // 保存基础射速
        this.fireRate = CONSTANTS.PLAYER.FIRE_RATE;
        this.weaponLevel = 1; // 1: Normal, 2: Triple, 3: Laser
        this.powerUpTimer = 0; // 火力升级持续时间
        this.laserTimer = 0;
        this.shield = 0;
        this.maxShield = 2;
    }

    update(dt, input) {
        // Movement
        const dir = input.getDirection();
        if (dir !== 0) {
            this.x += dir * this.speed;
        }

        // Touch movement logic (absolute follow or relative)
        const touchX = input.getTouchPosition();
        if (touchX !== null) {
            const dx = touchX - (this.x + this.width/2);
            if (Math.abs(dx) > 5) {
                this.x += Math.sign(dx) * this.speed;
            }
        }

        // Clamp to screen
        if (this.x < 0) this.x = 0;
        if (this.x > CONSTANTS.CANVAS_WIDTH - this.width) this.x = CONSTANTS.CANVAS_WIDTH - this.width;

        // Auto Fire
        this.fireTimer += dt * 1000;
        if (this.fireTimer >= this.fireRate) {
            this.shoot();
            this.fireTimer = 0;
        }

        // Invulnerability
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= dt;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
            }
        }

        // 火力升级持续时间 (8秒)
        if (this.weaponLevel === 2) {
            this.powerUpTimer -= dt * 1000;
            if (this.powerUpTimer <= 0) {
                this.weaponLevel = 1;
            }
        }

        // Laser duration (5秒)
        if (this.weaponLevel === 3) {
            this.laserTimer -= dt * 1000;
            if (this.laserTimer <= 0) {
                this.weaponLevel = 1;
                this.fireRate = this.baseFireRate; // 恢复基础射速
            }
        }
    }

    shoot() {
        const cx = this.x + this.width / 2;
        const cy = this.y;

        this.game.audio.playSound(this.weaponLevel === 3 ? 'laser' : 'shoot');

        if (this.weaponLevel === 1) {
            // Single shot
            this.game.bullets.push(new Bullet(cx, cy, 0, -CONSTANTS.BULLET.SPEED, 'normal'));
        } else if (this.weaponLevel === 2) {
            // Triple shot
            this.game.bullets.push(new Bullet(cx, cy, 0, -CONSTANTS.BULLET.SPEED, 'normal'));
            this.game.bullets.push(new Bullet(cx, cy, -2, -CONSTANTS.BULLET.SPEED * 0.9, 'normal'));
            this.game.bullets.push(new Bullet(cx, cy, 2, -CONSTANTS.BULLET.SPEED * 0.9, 'normal'));
        } else if (this.weaponLevel === 3) {
            // Laser
            this.game.bullets.push(new Bullet(cx, cy, 0, -CONSTANTS.BULLET.SPEED * 2, 'laser'));
        }
    }

    takeDamage() {
        if (this.isInvulnerable) return;

        if (this.shield > 0) {
            this.shield--;
            this.game.audio.playSound('hit'); // 护盾吸收伤害音效
            this.triggerInvulnerability();
            return;
        }

        this.lives--;
        this.game.audio.playSound('hit'); // 受伤音效
        this.game.createExplosion(this.x + this.width/2, this.y + this.height/2, 20, CONSTANTS.COLORS.NEON_RED);

        if (this.lives <= 0) {
            this.game.gameOver();
        } else {
            this.triggerInvulnerability();
        }

        this.game.ui.updateLives(this.lives);
    }

    triggerInvulnerability() {
        this.isInvulnerable = true;
        this.invulnerabilityTimer = CONSTANTS.PLAYER.INVULNERABILITY_TIME;
    }

    addPowerUp(type) {
        this.game.audio.playSound('powerup');
        switch(type) {
            case CONSTANTS.ITEMS.POWER:
                this.weaponLevel = 2;
                this.powerUpTimer = 8000; // 8秒持续时间
                break;
            case CONSTANTS.ITEMS.LASER:
                this.weaponLevel = 3;
                this.laserTimer = 5000; // 5 seconds
                this.fireRate = 100; // Faster fire for laser
                break;
            case CONSTANTS.ITEMS.SHIELD:
                if (this.shield < this.maxShield) this.shield++;
                break;
            case CONSTANTS.ITEMS.LIFE:
                if (this.lives < this.maxLives) {
                    this.lives++;
                    this.game.ui.updateLives(this.lives);
                }
                break;
        }
    }

    draw(ctx) {
        // Blink if invulnerable
        if (this.isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) return;

        ctx.save();
        // Shield Effect
        if (this.shield > 0) {
            ctx.strokeStyle = CONSTANTS.COLORS.NEON_GREEN;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = CONSTANTS.COLORS.NEON_GREEN;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw Player Ship (Procedural Geometric)
        ctx.translate(this.x + this.width/2, this.y + this.height/2);

        // Body
        ctx.fillStyle = '#000';
        ctx.strokeStyle = CONSTANTS.COLORS.NEON_BLUE;
        ctx.lineWidth = 2;
        ctx.shadowColor = CONSTANTS.COLORS.NEON_BLUE;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.lineTo(0, this.height/2 - 10);
        ctx.lineTo(-this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Engine glow
        ctx.fillStyle = CONSTANTS.COLORS.NEON_PURPLE;
        ctx.shadowColor = CONSTANTS.COLORS.NEON_PURPLE;
        ctx.beginPath();
        ctx.rect(-5, this.height/2, 10, 5);
        ctx.fill();

        ctx.restore();
    }
}
