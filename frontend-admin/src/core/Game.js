import { CONSTANTS } from '../utils/Constants.js';
import { Helpers } from '../utils/Helpers.js';
import { Input } from './Input.js';
import { AudioController } from './Audio.js';
import { Player } from '../entities/Player.js';
import { EnemyManager } from '../managers/EnemyManager.js';
import { ScoreManager } from '../managers/ScoreManager.js';
import { UIManager } from '../managers/UIManager.js';
import { Particle, Item, BackgroundParticle } from '../entities/Objects.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Resize
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new Input();
        this.audio = new AudioController();
        this.ui = new UIManager();

        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;

        // Game State
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.items = [];
        this.bgParticles = []; // 背景粒子
        this.bossEncountered = { elite: false, ultimate: false };

        // 初始化背景粒子
        this.initBackgroundParticles();

        this.bindEvents();
    }

    initBackgroundParticles() {
        // 创建初始背景粒子
        for (let i = 0; i < 50; i++) {
            this.bgParticles.push(new BackgroundParticle(
                Helpers.randomRange(0, CONSTANTS.CANVAS_WIDTH),
                Helpers.randomRange(0, CONSTANTS.CANVAS_HEIGHT)
            ));
        }
    }

    resize() {
        // Logic to keep aspect ratio or fill
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Update constants to match actual canvas if needed,
        // but for logic we keep virtual coordinates and scale,
        // OR we just update CONSTANTS.
        CONSTANTS.CANVAS_WIDTH = this.canvas.width;
        CONSTANTS.CANVAS_HEIGHT = this.canvas.height;
    }

    bindEvents() {
        document.getElementById('btn-start').addEventListener('click', () => this.start());
        document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-retry').addEventListener('click', () => this.reset());
        document.getElementById('btn-home').addEventListener('click', () => location.reload());

        const volumeSlider = document.getElementById('volume-slider');
        document.getElementById('btn-audio').addEventListener('click', (e) => {
            const enabled = this.audio.toggle();
            e.target.innerText = `音效: ${enabled ? '开' : '关'}`;
            volumeSlider.classList.toggle('hidden', !enabled);
        });

        volumeSlider.addEventListener('input', (e) => {
            this.audio.setVolume(e.target.value / 100);
        });

        document.getElementById('btn-restart-pause').addEventListener('click', () => {
             this.togglePause();
             this.reset();
        });
    }

    start() {
        this.audio.init();
        this.audio.startBGM();
        this.ui.hideStart();
        this.reset();
        this.isRunning = true;
        this.loop(0);
    }

    reset() {
        this.player = new Player(this);
        this.scoreManager = new ScoreManager(this);
        this.enemyManager = new EnemyManager(this);

        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.items = [];
        this.bossEncountered = { elite: false, ultimate: false };

        this.ui.updateLives(this.player.lives);
        this.ui.updateScore(0);
        this.ui.showBossHealth(false); // 确保BOSS血条隐藏
        this.ui.modalGameOver.classList.add('hidden');

        // 重置BGM节奏
        this.audio.setTempo(1);

        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
    }

    togglePause() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
        this.ui.togglePause(this.isPaused);
        if (!this.isPaused) {
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    gameOver() {
        this.isRunning = false;
        this.audio.stopBGM();
        this.scoreManager.saveHighscore();
        this.ui.showGameOver(this.scoreManager.score, this.scoreManager.highScore);
    }

    createExplosion(x, y, count, color) {
        for(let i=0; i<count; i++) {
            this.particles.push(new Particle(x, y, color, Helpers.randomRange(1, 5), Helpers.randomRange(2, 5), 1));
        }
    }

    update(dt) {
        if (this.isPaused) return;

        // 更新背景粒子
        this.bgParticles.forEach(p => p.update(dt, this.scoreManager ? this.scoreManager.score : 0));

        this.player.update(dt, this.input);
        this.enemyManager.update(dt);

        // Bullets
        this.bullets.forEach(b => b.update(dt));
        this.bullets = this.bullets.filter(b => !b.markedForDeletion);

        // Enemies
        this.enemies.forEach(e => e.update(dt));
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);

        // Particles
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        // Items
        this.items.forEach(i => i.update(dt));
        this.items = this.items.filter(i => !i.markedForDeletion);

        this.checkCollisions();
    }

    checkCollisions() {
        // Bullets hitting Enemies
        this.bullets.forEach(bullet => {
            if (!bullet.isPlayer) return; // Skip enemy bullets here

            this.enemies.forEach(enemy => {
                if (Helpers.checkRectCollision(bullet, enemy)) {
                    if (bullet.type !== 'laser') {
                        bullet.markedForDeletion = true;
                    }
                    
                    const killed = enemy.takeDamage(CONSTANTS.BULLET.DAMAGE);
                    if (killed) {
                        this.scoreManager.addScore(enemy.score);
                        this.scoreManager.registerKill();
                        this.audio.playSound('explosion');
                        this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 20, enemy.color);

                        // 道具掉落检查 - 重装敌机有30%概率掉落（BOSS在EnemyManager中单独处理）
                        if (enemy.type === 'HEAVY' && Math.random() < 0.3) {
                             const rand = Math.random();
                             let dropType;
                             if (rand < 0.25) dropType = CONSTANTS.ITEMS.POWER;
                             else if (rand < 0.5) dropType = CONSTANTS.ITEMS.SHIELD;
                             else if (rand < 0.75) dropType = CONSTANTS.ITEMS.LIFE;
                             else dropType = CONSTANTS.ITEMS.LASER;
                             this.items.push(new Item(enemy.x, enemy.y, dropType));
                        }

                        if (enemy.isBoss) {
                            this.enemyManager.handleBossDeath(enemy);
                        }
                    } else {
                        // Create small hit particle
                         this.createExplosion(bullet.x, bullet.y, 2, '#fff');
                    }

                    if (enemy.isBoss) {
                        this.ui.updateBossHealth(enemy.hp, enemy.maxHp);
                    }
                }
            });
        });

        // Player collision with Enemy Body
        this.enemies.forEach(enemy => {
             if (Helpers.checkRectCollision(this.player, enemy)) {
                 if (!this.player.isInvulnerable) {
                     this.player.takeDamage();
                     enemy.takeDamage(10); // Ramming damages enemy too
                 }
             }
        });

        // Player collision with Enemy Bullets
        this.bullets.forEach(bullet => {
            if (bullet.isPlayer) return;

            // 旋转激光特殊碰撞检测
            if (bullet.type === 'rotating_laser') {
                if (Helpers.checkLaserCollision(bullet, this.player)) {
                    if (!this.player.isInvulnerable) {
                        this.player.takeDamage();
                    }
                }
                return;
            }

            if (Helpers.checkRectCollision(bullet, this.player)) {
                 if (!this.player.isInvulnerable) {
                     bullet.markedForDeletion = true;
                     this.player.takeDamage();
                 }
            }
        });

        // Player collision with Items
        this.items.forEach(item => {
            if (Helpers.checkRectCollision(item, this.player)) {
                item.markedForDeletion = true;
                this.player.addPowerUp(item.type);
                this.ui.showMessage(item.text + " ACQUIRED");
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景粒子
        this.bgParticles.forEach(p => p.draw(this.ctx));

        this.player.draw(this.ctx);

        this.bullets.forEach(b => b.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.items.forEach(i => i.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
    }

    loop(timestamp) {
        if (!this.isRunning) return;
        if (this.isPaused) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (dt > 0.1) { // Lag spike prevention
             requestAnimationFrame((t) => this.loop(t));
             return;
        }

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}
