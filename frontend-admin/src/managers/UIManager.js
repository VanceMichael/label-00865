export class UIManager {
    constructor() {
        this.livesContainer = document.getElementById('hud-lives');
        this.scoreEl = document.getElementById('score-display');
        this.levelEl = document.getElementById('level-display');
        this.msgArea = document.getElementById('message-area');
        this.bossHud = document.getElementById('boss-hud');
        this.bossHpBar = document.getElementById('boss-hp-bar');
        this.bossName = document.getElementById('boss-name');

        // Modals
        this.modalStart = document.getElementById('modal-start');
        this.modalPause = document.getElementById('modal-pause');
        this.modalGameOver = document.getElementById('modal-gameover');

        this.finalScoreEl = document.getElementById('final-score');
        this.highScoreEl = document.getElementById('high-score');

        // Loading
        this.loader = document.getElementById('loader');
        this.progressBar = document.getElementById('progress-bar');

        // 检测设备类型并更新控制提示
        this.updateControlsHint();
    }

    updateControlsHint() {
        const hint = document.getElementById('controls-hint');
        const startHint = document.getElementById('start-controls-hint');
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                        || ('ontouchstart' in window);
        const text = isMobile ? '📱 左右滑动控制' : '⌨️ ← → 方向键控制';
        if (hint) hint.textContent = text;
        if (startHint) startHint.textContent = text;
    }

    hideLoader() {
        this.progressBar.style.width = '100%';
        setTimeout(() => {
            this.loader.style.opacity = 0;
            setTimeout(() => {
                this.loader.style.display = 'none';
            }, 500);
        }, 500);
    }

    updateLives(lives) {
        this.livesContainer.innerHTML = '';
        for (let i = 0; i < lives; i++) {
            const heart = document.createElement('div');
            heart.className = 'life-icon';
            heart.innerHTML = '❤'; // Simple char or SVG
            this.livesContainer.appendChild(heart);
        }
    }

    updateScore(score) {
        this.scoreEl.innerText = score;
    }

    showLevelUp(level) {
        this.levelEl.innerText = `LEVEL ${level}`;
        this.levelEl.classList.add('glow');
        setTimeout(() => this.levelEl.classList.remove('glow'), 1000);

        // 全屏霓虹LEVEL UP特效
        const overlay = document.createElement('div');
        overlay.className = 'levelup-overlay';
        overlay.innerHTML = `
            <div class="levelup-text">
                <span class="levelup-main">LEVEL UP!</span>
                <span class="levelup-level">LEVEL ${level}</span>
            </div>
        `;
        document.getElementById('game-container').appendChild(overlay);

        // 2秒后移除
        setTimeout(() => overlay.remove(), 2000);
    }

    showMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'game-msg';
        msg.innerText = text;
        this.msgArea.appendChild(msg);
        setTimeout(() => msg.remove(), 1600);
    }

    showBossHealth(show, bossType = '') {
        if (show) {
            this.bossHud.classList.remove('hidden');
            // 根据BOSS类型显示不同文字
            if (bossType === 'BOSS_ELITE') {
                this.bossName.innerText = '警告：精英BOSS来袭！';
            } else if (bossType === 'BOSS_ULTIMATE') {
                this.bossName.innerText = '警告：终极BOSS来袭！';
            } else {
                this.bossName.innerText = '警告：检测到BOSS';
            }
            this.bossHpBar.style.width = '100%';
        } else {
            this.bossHud.classList.add('hidden');
        }
    }

    updateBossHealth(current, max) {
        const pct = (current / max) * 100;
        this.bossHpBar.style.width = `${pct}%`;
    }

    togglePause(isPaused) {
        if (isPaused) {
            this.modalPause.classList.remove('hidden');
        } else {
            this.modalPause.classList.add('hidden');
        }
    }

    showGameOver(score, highscore) {
        this.finalScoreEl.innerText = score;
        this.highScoreEl.innerText = highscore;
        this.modalGameOver.classList.remove('hidden');
    }

    hideStart() {
        this.modalStart.style.display = 'none';
    }
}
