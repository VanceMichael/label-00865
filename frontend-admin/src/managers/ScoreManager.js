export class ScoreManager {
    constructor(game) {
        this.game = game;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('cyber_highscore')) || 0;
        this.level = 1;

        // Streak System
        this.killHistory = []; // Array of timestamps
        this.streakThreshold = 5;
        this.streakTimeWindow = 10000; // 10s
    }

    addScore(points) {
        this.score += points;

        // Level Up check
        const newLevel = Math.floor(this.score / 5000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.game.ui.showLevelUp(this.level);
            // 提升基础射速（最高提升至初始射速的2倍，即150ms）
            if (this.game.player.baseFireRate > 150) {
                this.game.player.baseFireRate *= 0.9;
                // 如果当前不是激光模式，同步更新当前射速
                if (this.game.player.weaponLevel !== 3) {
                    this.game.player.fireRate = this.game.player.baseFireRate;
                }
            }
            // 加快BGM节奏
            this.game.audio.setTempo(this.level);
        }

        this.game.ui.updateScore(this.score);
    }

    registerKill() {
        const now = Date.now();
        this.killHistory.push(now);

        // Filter old kills (10秒内的击杀)
        this.killHistory = this.killHistory.filter(t => now - t < this.streakTimeWindow);

        // 显示当前连杀进度 (3杀以上开始提示)
        const killCount = this.killHistory.length;
        if (killCount >= 3 && killCount < this.streakThreshold) {
            this.game.ui.showMessage(`连杀 x${killCount}!`);
        }

        // 达到5连杀触发连杀加成
        if (killCount >= this.streakThreshold) {
            this.addScore(500);
            this.game.audio.playSound('powerup');
            this.game.ui.showMessage("🔥 连杀加成! +500 🔥");
            // 触发奖励后清空连杀记录，需要重新累计5次才能再次触发
            this.killHistory = [];
        }
    }

    saveHighscore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('cyber_highscore', this.highScore);
        }
    }
}
