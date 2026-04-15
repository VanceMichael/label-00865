export class Input {
    constructor() {
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            a: false,
            d: false
        };
        this.touchX = null;
        this.isTouchActive = false;

        this.init();
    }

    init() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });

        // Touch
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('touchstart', (e) => {
            this.isTouchActive = true;
            this.updateTouchPosition(e);
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (this.isTouchActive) {
                e.preventDefault(); // Prevent scrolling
                this.updateTouchPosition(e);
            }
        }, { passive: false });

        canvas.addEventListener('touchend', () => {
            this.isTouchActive = false;
            this.touchX = null;
        });
    }

    updateTouchPosition(e) {
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        this.touchX = touch.clientX - rect.left;

        // Scale touch coordinate to canvas logical size
        const scaleX = e.target.width / rect.width;
        this.touchX *= scaleX;
    }

    getDirection() {
        let dir = 0;
        if (this.keys.ArrowLeft || this.keys.a) dir -= 1;
        if (this.keys.ArrowRight || this.keys.d) dir += 1;
        return dir;
    }

    getTouchPosition() {
        return this.isTouchActive ? this.touchX : null;
    }
}
