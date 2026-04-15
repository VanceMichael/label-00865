export class Helpers {
    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    static checkRectCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    // 检测点与线段的距离（用于旋转激光碰撞）
    static pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 检测旋转激光与矩形的碰撞
    static checkLaserCollision(laser, rect) {
        if (laser.type !== 'rotating_laser') return false;

        const endX = laser.origin.x + Math.cos(laser.angle) * laser.length;
        const endY = laser.origin.y + Math.sin(laser.angle) * laser.length;

        // 检测矩形中心点到激光线的距离
        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;
        const dist = this.pointToLineDistance(cx, cy, laser.origin.x, laser.origin.y, endX, endY);

        // 碰撞半径 = 矩形对角线的一半
        const collisionRadius = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;

        return dist < collisionRadius + 4; // 4是激光宽度的一半
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static getDistance(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
