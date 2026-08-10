import { CONSTANTS } from '../utils/Constants.js';
import { Helpers } from '../utils/Helpers.js';
import { Enemy } from '../entities/Enemy.js';
import { Item } from '../entities/Objects.js';

export class EnemyManager {
    constructor(game) {
        this.game = game;
        this.spawnTimer = 0;
        this.waveTimer = 0;

        // Spawn interval decreases as score increases
        this.baseSpawnInterval = 2000;

        this.bossActive = false;
        this.lastScore = 0;
    }

    update(dt) {
        if (this.bossActive) return; // Don't spawn normals during boss? Or spawn fewer? Let's stop for focus.

        this.spawnTimer += dt * 1000;

        // Difficulty Logic
        let currentInterval = this.baseSpawnInterval;
        const score = this.game.scoreManager.score;

        if (score > 5000) currentInterval = 1200;
        if (score > 15000) currentInterval = 800;

        if (this.spawnTimer > currentInterval) {
            this.spawnEnemy(score);
            this.spawnTimer = 0;
        }

        // Boss Triggers
        if (score >= 5000 && score < 5500 && !this.game.bossEncountered.elite) {
            this.spawnBoss('BOSS_ELITE');
            this.game.bossEncountered.elite = true;
        }

        if (score >= 15000 && !this.game.bossEncountered.ultimate) {
            this.spawnBoss('BOSS_ULTIMATE');
            this.game.bossEncountered.ultimate = true;
        }
    }

    spawnEnemy(score) {
        const x = Helpers.randomRange(0, CONSTANTS.CANVAS_WIDTH - 40);
        let typeConfig = CONSTANTS.ENEMY_TYPES.NORMAL;

        // Spawn weights
        const rand = Math.random();
        if (score < 5000) {
            if (rand > 0.8) typeConfig = CONSTANTS.ENEMY_TYPES.FAST;
        } else if (score < 15000) {
            if (rand > 0.7) typeConfig = CONSTANTS.ENEMY_TYPES.HEAVY;
            else if (rand > 0.4) typeConfig = CONSTANTS.ENEMY_TYPES.FAST;
        } else {
            // Late game chaos
            if (rand > 0.6) typeConfig = CONSTANTS.ENEMY_TYPES.HEAVY;
            else if (rand > 0.3) typeConfig = CONSTANTS.ENEMY_TYPES.FAST;
        }

        this.game.enemies.push(new Enemy(typeConfig, x, -50, this.game));
    }

    spawnBoss(typeKey) {
        this.bossActive = true;
        this.game.audio.playSound('boss');
        this.game.ui.showBossHealth(true, typeKey);

        const typeConfig = CONSTANTS.ENEMY_TYPES[typeKey];
        const x = CONSTANTS.CANVAS_WIDTH / 2 - typeConfig.width / 2;
        const boss = new Enemy(typeConfig, x, -200, this.game);

        this.game.enemies.push(boss);

        // 显示BOSS来袭消息
        if (typeKey === 'BOSS_ELITE') {
            this.game.ui.showMessage("精英BOSS来袭！");
        } else if (typeKey === 'BOSS_ULTIMATE') {
            this.game.ui.showMessage("终极BOSS来袭！");
        }

        // BOSS登场特效：屏幕震动 + 霓虹边框闪烁
        this.triggerBossEntryEffect();
    }

    triggerBossEntryEffect() {
        const container = document.getElementById('game-container');
        container.classList.add('boss-entry');

        // 屏幕震动效果
        let shakeCount = 0;
        const shakeInterval = setInterval(() => {
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            container.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            shakeCount++;
            if (shakeCount > 20) {
                clearInterval(shakeInterval);
                container.style.transform = '';
            }
        }, 50);

        // 1.5秒后移除边框闪烁效果
        setTimeout(() => {
            container.classList.remove('boss-entry');
        }, 1500);
    }

    handleBossDeath(boss) {
        this.bossActive = false;
        this.game.ui.showBossHealth(false);
        this.game.createExplosion(boss.x + boss.width/2, boss.y + boss.height/2, 100, boss.color);

        // BOSS 必定掉落高级道具
        if (boss.type === 'BOSS_ELITE') {
            // 精英BOSS掉落激光武器
            this.game.items.push(new Item(boss.x, boss.y, 'LASER'));
            this.game.items.push(new Item(boss.x + 50, boss.y, 'SHIELD'));
        } else if (boss.type === 'BOSS_ULTIMATE') {
            // 终极BOSS掉落生命和激光
            this.game.items.push(new Item(boss.x, boss.y, 'LIFE'));
            this.game.items.push(new Item(boss.x + 50, boss.y, 'LASER'));
            this.game.items.push(new Item(boss.x + 100, boss.y, 'POWER'));
            // 解锁无敌模式效果
            this.game.player.triggerInvulnerability();
            this.game.player.invulnerabilityTimer = 5000; // 5秒无敌
            this.game.ui.showMessage("ULTIMATE VICTORY! 5s INVINCIBLE!");
        }
    }
}
