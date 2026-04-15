export class AudioController {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.5; // 默认50%
        this.masterGain = null;

        // BGM相关
        this.bgmPlaying = false;
        this.bgmTempo = 120; // 初始BPM
        this.bgmIntervalId = null;
        this.bgmOscillators = [];
        this.bgmGain = null;
        this.currentBeat = 0;

        // 赛博朋克音阶 (小调 + 增四度)
        this.scale = [55, 65.4, 73.4, 82.4, 98, 110, 130.8, 146.8]; // A小调低音
        this.bassPattern = [0, 0, 3, 3, 5, 5, 3, 2]; // 贝斯模式
        this.arpPattern = [0, 2, 4, 5, 4, 2, 5, 7]; // 琶音模式
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = this.volume;

            // BGM增益节点
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.connect(this.masterGain);
            this.bgmGain.gain.value = 0.3; // BGM音量较低
        }
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) this.masterGain.gain.value = this.volume;
    }

    getVolume() { return this.volume; }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.ctx) {
            this.ctx.suspend();
            this.stopBGM();
        } else if (this.enabled && this.ctx) {
            this.ctx.resume();
            this.startBGM();
        }
        return this.enabled;
    }

    // 开始背景音乐
    startBGM() {
        if (this.bgmPlaying || !this.ctx) return;
        this.bgmPlaying = true;
        this.currentBeat = 0;
        this.scheduleBGM();
    }

    // 停止背景音乐
    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmIntervalId) {
            clearTimeout(this.bgmIntervalId);
            this.bgmIntervalId = null;
        }
    }

    // 调整BGM节奏 (根据难度/等级)
    setTempo(level) {
        // 等级1: 120BPM, 每升一级加5BPM, 最高180BPM
        this.bgmTempo = Math.min(180, 120 + (level - 1) * 5);
    }

    // 调度BGM播放
    scheduleBGM() {
        if (!this.bgmPlaying || !this.enabled) return;

        const beatDuration = 60 / this.bgmTempo;

        this.playBeat(this.currentBeat);
        this.currentBeat = (this.currentBeat + 1) % 8;

        this.bgmIntervalId = setTimeout(() => this.scheduleBGM(), beatDuration * 1000);
    }

    // 播放单个节拍
    playBeat(beat) {
        if (!this.ctx || !this.bgmGain) return;

        const now = this.ctx.currentTime;
        const beatDuration = 60 / this.bgmTempo;

        // 贝斯音 (每拍)
        this.playBassNote(this.scale[this.bassPattern[beat]], now, beatDuration * 0.8);

        // 琶音 (每拍)
        this.playArpNote(this.scale[this.arpPattern[beat]] * 2, now, beatDuration * 0.3);

        // 鼓点 (1, 3, 5, 7拍重音)
        if (beat % 2 === 0) {
            this.playKick(now);
        }
        // Hi-hat (每拍)
        this.playHiHat(now);
    }

    // 贝斯音
    playBassNote(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    // 琶音
    playArpNote(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    // 底鼓
    playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);

        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + 0.15);
    }

    // Hi-hat (噪音模拟)
    playHiHat(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(8000, time);

        gain.gain.setValueAtTime(0.03, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + 0.05);
    }

    playSound(type) {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);

        const now = this.ctx.currentTime;

        switch (type) {
            case 'shoot':
                // High freq short beep
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'laser':
                // Continuous hum (handled differently, but here as short burst)
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(600, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;

            case 'explosion':
                // White noise approximation using sawtooth + frequency drop
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'powerup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'hit':
                // 受伤警示音效
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;

            case 'boss':
                 // Low warning tone
                 osc.type = 'square';
                 osc.frequency.setValueAtTime(100, now);
                 osc.frequency.linearRampToValueAtTime(50, now + 1.0);
                 gain.gain.setValueAtTime(0.2, now);
                 gain.gain.linearRampToValueAtTime(0, now + 1.0);
                 osc.start(now);
                 osc.stop(now + 1.0);
                 break;
        }
    }
}
