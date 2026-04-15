export const CONSTANTS = {
    CANVAS_WIDTH: 600,  // Max logical width
    CANVAS_HEIGHT: 900, // Max logical height
    COLORS: {
        BG: '#0a0a10',
        NEON_BLUE: '#00f0ff',
        NEON_PURPLE: '#d000ff',
        NEON_RED: '#ff0080',
        NEON_GREEN: '#0aff0a',
        TEXT: '#ffffff'
    },
    PLAYER: {
        SPEED: 5,
        WIDTH: 40,
        HEIGHT: 48,
        FIRE_RATE: 300, // ms
        INVULNERABILITY_TIME: 1000 // ms
    },
    BULLET: {
        SPEED: 10,
        SIZE: 4,
        DAMAGE: 1
    },
    ENEMY_TYPES: {
        NORMAL: {
            speed: 2,
            hp: 1,
            score: 100,
            color: '#d000ff',
            width: 30,
            height: 30,
            type: 'NORMAL'
        },
        FAST: {
            speed: 3.5,
            hp: 1,
            score: 200,
            color: '#0aff0a',
            width: 20,
            height: 25,
            type: 'FAST'
        },
        HEAVY: {
            speed: 1,
            hp: 3,
            score: 500,
            color: '#ff0080',
            width: 50,
            height: 50,
            type: 'HEAVY'
        },
        BOSS_ELITE: {
            speed: 0.8,
            hp: 20,
            score: 3000,
            width: 100,
            height: 80,
            type: 'BOSS_ELITE',
            color: '#00f0ff' // 三色霓虹描边 - 主色蓝
        },
        BOSS_ULTIMATE: {
            speed: 0.5,
            hp: 50,
            score: 10000,
            width: 150,
            height: 120,
            type: 'BOSS_ULTIMATE',
            color: '#d000ff' // 环绕电流光效 - 主色紫
        }
    },
    ITEMS: {
        POWER: 'POWER',   // W - Scatter shot
        SHIELD: 'SHIELD', // Sh - Shield
        LIFE: 'LIFE',     // Li - Extra life
        LASER: 'LASER'    // L - Laser beam
    }
};
